// backend/src/server.ts

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { GameState, PlayerAction, ActionType, Player, GamePhase } from '../../src/shared-types'; // 确保导入Player类型
import * as GameEngine from './game-engine';

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
    const data = JSON.stringify({ type: 'gameStateUpdate', payload: authoritativeGameState });
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
    // 1. 使用游戏引擎处理行动，获得新状态
    authoritativeGameState = GameEngine.processPlayerAction(authoritativeGameState, action);
    
    // 2. 立即广播更新后的状态，让所有前端UI刷新
    broadcastGameState();
    
    // 3. 检查并触发下一个流程
    checkAndTriggerNextStep();
}

/**
 * 这是游戏循环的核心：检查当前游戏状态，并决定下一步做什么
 */
async function checkAndTriggerNextStep() {
    // 如果游戏结束了，设置一个定时器自动开始新游戏
    if (authoritativeGameState.gamePhase === GamePhase.ENDED) {
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
        
        // 如果当前玩家是AI，则服务器主动为它调用大模型API
        if (currentPlayer.isAI) {
            // 添加一个短暂的延迟，让游戏节奏更自然
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            console.log(`服务器主动为AI [${currentPlayer.name}] 请求行动...`);
            try {
                // 这里就是您调用大模型API的地方
                // 注意：我们将权威的游戏状态发送给大模型
                const response = await fetch('YOUR_LARGE_MODEL_API_ENDPOINT', { // <--- 替换成您的大模型API地址
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        // 您可以根据API要求，构建发送给大模型的数据
                        gameState: authoritativeGameState,
                        playerId: currentPlayer.id
                    }),
                });

                if (!response.ok) throw new Error(`大模型API错误: ${response.status}`);

                const decision: PlayerAction = await response.json();
                console.log(`服务器收到AI [${currentPlayer.name}] 的决策:`, decision);
                
                // 将AI的决策喂给统一的行动处理器
                handleAction(decision);

            } catch (error) {
                console.error(`调用大模型API时出错，为AI [${currentPlayer.name}] 执行保底操作(弃牌):`, error);
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
    ws.send(JSON.stringify({ type: 'gameStateUpdate', payload: authoritativeGameState }));

    ws.on('message', (message: string) => {
        try {
            const data = JSON.parse(message);
            const currentPlayer = authoritativeGameState.players[authoritativeGameState.currentPlayerIndex!];

            switch (data.type) {
                case 'joinGame':
                    authoritativeGameState = GameEngine.addPlayer(authoritativeGameState, data.payload);
                    broadcastGameState();
                    break;
                case 'startGame':
                    authoritativeGameState = GameEngine.startGame(authoritativeGameState);
                    broadcastGameState();
                    checkAndTriggerNextStep();
                    break;
                case 'playerAction':
                    const action = data.payload as PlayerAction;
                    // 安全校验：确保是当前玩家本人在行动
                    if (currentPlayer && !currentPlayer.isAI && currentPlayer.id === action.playerId) {
                        handleAction(action);
                    } else {
                        console.warn(`收到非法的WS行动请求:`, action);
                    }
                    break;
                case 'addAI':
                    authoritativeGameState = GameEngine.addAIPlayers(authoritativeGameState, data.payload);
                    broadcastGameState(); // <--- 广播
                    break;
            }
        } catch (error) {
            console.error("处理WebSocket消息时出错:", error);
        }
    });

    ws.on('close', () => console.log('一个玩家断开连接'));
});


// 【重要】这个API端点现在可以被废弃或改造
// 因为服务器已经主动调用大模型，不再需要前端来触发AI行动
app.post('/api/ai-action', (req, res) => {
    res.status(410).json({ 
        message: "此API已废弃。服务器现在主动驱动AI行动。" 
    });
});


server.listen(port, () => {
    console.log(`权威游戏服务器正在监听 http://localhost:${port}`);
});