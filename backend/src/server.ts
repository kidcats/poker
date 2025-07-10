// backend/src/server.ts

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import * as dotenv from 'dotenv'; // NEW: 导入dotenv来加载环境变量

// NEW: 导入我们强大的AI行动获取服务
import { getAIPlayerAction } from './openrouter-agent'; 

import { GameState, PlayerAction, ActionType, Player, GamePhase, PlayerStatus } from '../../src/shared-types';
import * as GameEngine from './game-engine';
import path from 'path';

// NEW: 在应用启动的最开始加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../.env') }); 
// ======================= NEW: 黄金标准调试日志 =======================
console.log("--- 环境变量调试 ---");
console.log("当前工作目录 (CWD):", process.cwd());
console.log("尝试加载的 .env 路径:", require('path').resolve(process.cwd(), '../../.env'));
console.log("读取到的 OPENROUTER_API_KEY 是:", process.env.OPENROUTER_API_KEY ? "【已设置】" + process.env.OPENROUTER_API_KEY.substring(0, 10) + "..." : "【未设置或为null】");
console.log("----------------------");
// 服务器持有的唯一、权威的游戏状态
let authoritativeGameState: GameState = GameEngine.createInitialState();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = 3001;

app.use(cors());
app.use(express.json());

// ========================================================================
// ==                         核心功能函数                             ==
// ========================================================================

/**
 * 广播函数，将最新状态发送给所有连接的客户端
 */
function broadcastGameState() {
    // 安全措施：在发送前，从状态中移除AI玩家的手牌信息，真人玩家不应该看到AI的牌
    const stateForBroadcast = JSON.parse(JSON.stringify(authoritativeGameState));
    stateForBroadcast.players.forEach((player: Player) => {
        if (player.isAI) {
            // 如果游戏未结束，则隐藏手牌
            if (stateForBroadcast.gamePhase !== GamePhase.SHOWDOWN && stateForBroadcast.gamePhase !== GamePhase.ENDED) {
                player.hand = [];
            }
        }
    });

    const data = JSON.stringify({ type: 'gameStateUpdate', payload: stateForBroadcast });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

/**
 * 处理一个玩家（真人或AI）的行动，并触发后续流程
 * @param action 玩家的行动
 */

function handleAction(action: PlayerAction) {
    // 1. 使用游戏引擎处理行动
    const newState = GameEngine.processPlayerAction(authoritativeGameState, action);
    
    // ======================= NEW: 关键的根源排查日志 =======================
    if (!newState) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('!!! CRITICAL ERROR: GameEngine 返回了一个 null 或 undefined 状态 !!!');
        console.error('!!! 导致此错误的行动是: ', action);
        console.error('!!! 之前的状态是: ', authoritativeGameState);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        // 在这种严重错误下，我们选择不更新状态，以防传播错误
        return; 
    }
    // ======================================================================

    // 只有当新状态有效时，才更新并广播
    authoritativeGameState = newState;
    
    broadcastGameState();
    setImmediate(checkAndTriggerNextStep);
}

/**
 * 这是游戏循环的核心：检查当前游戏状态，并决定下一步做什么
 */
async function checkAndTriggerNextStep() {
    // 如果游戏结束了，设置一个定时器自动开始新游戏
    if (authoritativeGameState.gamePhase === GamePhase.ENDED) {
        // 确保有足够玩家继续游戏
        const activePlayers = authoritativeGameState.players.filter(p => p.stack > 0);
        if (activePlayers.length < 2) {
            console.log('玩家不足，游戏暂停。');
            return;
        }

        console.log('游戏结束，5秒后将开始新的一局...');
        setTimeout(() => {
            console.log('开始新游戏!');
            authoritativeGameState = GameEngine.startGame(authoritativeGameState);
            broadcastGameState();
            // 新游戏开始后，需要再次检查，看第一个行动的是不是AI
            checkAndTriggerNextStep(); 
        }, 5000);
        return;
    }

    // 如果游戏正在进行中，且有当前行动玩家
    if (authoritativeGameState.currentPlayerIndex !== null) {
        const currentPlayer = authoritativeGameState.players[authoritativeGameState.currentPlayerIndex];
        
        // 如果当前玩家是AI且处于活跃状态
        if (currentPlayer.isAI && currentPlayer.status === PlayerStatus.ACTIVE) { // MODIFIED: 增加状态检查
            // 添加一个短暂的延迟，让游戏节奏更自然
            await new Promise(resolve => setTimeout(resolve, 500)); 

            console.log(`服务器主动为AI [${currentPlayer.name}] 请求行动...`);
            try {
                // ========================================================================
                // ==                 MODIFIED: 这里是核心修改点                      ==
                // ========================================================================
                // 我们不再使用fetch，而是直接调用我们封装好的、类型安全的AI服务
                console.log(currentPlayer.id);
                const decision: PlayerAction = await getAIPlayerAction(
                    authoritativeGameState,
                    currentPlayer.id
                );
                // ========================================================================

                console.log(`服务器收到AI [${currentPlayer.name}] 的决策:`, decision);
                
                // 将AI的决策喂给统一的行动处理器
                handleAction(decision);

            } catch (error) {
                console.error(`调用AI服务时出错，为AI [${currentPlayer.name}] 执行保底操作(弃牌):`, error);
                handleAction({
                    playerId: currentPlayer.id,
                    type: ActionType.FOLD
                });
            }
        } else {
            // 如果是真人玩家，服务器什么都不做，静静地等待来自该玩家的WebSocket消息
            console.log(`轮到真人玩家 [${currentPlayer.name}] 行动，等待WebSocket消息...`);
        }
    }
}


// ========================================================================
// ==                         网络接口监听                             ==
// ========================================================================

// WebSocket服务器，用于接收真人玩家的行动
wss.on('connection', (ws: WebSocket) => {
    console.log('一个真人玩家通过WebSocket连接!');
    // 连接成功时，立即发送当前游戏状态
    const initialState = JSON.parse(JSON.stringify(authoritativeGameState));
    initialState.players.forEach((p: Player) => { if(p.isAI) p.hand = []; }); // 遍历手牌，如果是ai则清空
    ws.send(JSON.stringify({ type: 'gameStateUpdate', payload: initialState }));

    ws.on('message', (message: string) => {
        try {
            const data = JSON.parse(message);
            console.log(`收到来自玩家的WebSocket消息:`, data);
            // MODIFIED: 简化逻辑，将currentPlayer的获取放在需要的地方
            switch (data.type) {
                case 'joinGame':
                    authoritativeGameState = GameEngine.addPlayer(authoritativeGameState, data.payload);
                    broadcastGameState();
                    break;
                case 'startGame':
                    authoritativeGameState = GameEngine.startGame(authoritativeGameState);
                    broadcastGameState();
                    // 开始游戏后，立即触发游戏循环
                    checkAndTriggerNextStep();
                    break;
                case 'playerAction':
                    const action = data.payload as PlayerAction;
                    const currentPlayer = authoritativeGameState.players[authoritativeGameState.currentPlayerIndex!];
                    // 安全校验：确保是当前玩家本人在行动
                    if (currentPlayer && !currentPlayer.isAI && currentPlayer.id === action.playerId) {
                        handleAction(action);
                    } else {
                        console.warn(`收到非法的WS行动请求:`, action, `当前玩家是: ${currentPlayer?.id}`);
                    }
                    break;
                case 'addAI':
                    authoritativeGameState = GameEngine.addAIPlayers(authoritativeGameState, data.payload);
                    broadcastGameState();
                    break;
                }
            console.log("处理WebSocket消息成功,处理后的游戏状态", authoritativeGameState);
        } catch (error) {
            console.error("处理WebSocket消息时出错:", error);
        }
    });

    ws.on('close', () => console.log('一个玩家断开连接'));
});



server.listen(port, () => {
    console.log(`权威游戏服务器正在监听 http://localhost:${port}`);
    console.log(`确保您的 .env 文件包含 OPENROUTER_API_KEY`);
});