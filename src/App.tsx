import React, { useState, useEffect } from 'react';
import './App.scss';
import { PositionProvider } from './states/positionContext';
import { selectGame, setGameState } from './states/gameSlice';
import { GamePhase, PlayerStatus, ActionType } from './shared-types';
import Table from './components/table';
import PlayerActions from './components/PlayerActions';
import { useAppDispatch, useAppSelector } from './states/hooks';
import { logPlayerActionState } from './utils/utils';

// 定义一个常量用于localStorage的键，避免魔法字符串
const PLAYER_ID_STORAGE_KEY = 'pokerGamePlayerId';

function App() {
  // 从Redux store中获取游戏状态
  const gameState = useAppSelector(selectGame);
  const dispatch = useAppDispatch();

  // ========================================================================
  // ==                         本地状态管理                             ==
  // ========================================================================

  // 本地UI状态
  // 核心修改 #1: 初始化state时，从localStorage惰性加载已存在的ID
  const [ownPlayerId, setOwnPlayerId] = useState<string | null>(() => {
    return localStorage.getItem(PLAYER_ID_STORAGE_KEY);
  });
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [aiCount, setAiCount] = useState(5);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // 从游戏状态派生出的计算属性，用于驱动UI
  const ownPlayer = gameState.players.find(p => p.id === ownPlayerId);
  const ownPlayerIndex = ownPlayer ? gameState.players.indexOf(ownPlayer) : -1;
  const isMyTurn = gameState.gamePhase > GamePhase.WAITING && 
                   gameState.gamePhase < GamePhase.SHOWDOWN && 
                   gameState.currentPlayerIndex === ownPlayerIndex && 
                   ownPlayer?.status === PlayerStatus.ACTIVE;
  const canCheck = isMyTurn && ownPlayer && ownPlayer.currentRoundBet === gameState.currentRoundBet;
  const canCall = isMyTurn && ownPlayer && ownPlayer.currentRoundBet < gameState.currentRoundBet;
  const callAmount = gameState.currentRoundBet - (ownPlayer?.currentRoundBet || 0);

  // ========================================================================
  // ==                      核心副作用 Hooks                                ==
  // ========================================================================

  // 核心 Effect 1: 建立并维护WebSocket连接
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    setSocket(ws);

    ws.onopen = () => console.log('成功连接到游戏服务器');
    ws.onclose = () => console.log('与服务器断开连接');

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'gameStateUpdate') {
            // 在收到服务器状态更新后，打印本地玩家的决策信息以供调试
            // 注意：此时的 ownPlayerId 是最新的，但 gameState 可能是旧的，
            // 所以我们把最新的 ownPlayerId 和即将更新的 gameState 传入
            const currentId = localStorage.getItem(PLAYER_ID_STORAGE_KEY);
            if (currentId) {
                logPlayerActionState(message.payload, currentId);
            }
            dispatch(setGameState(message.payload));
        }
    };

    return () => {
        ws.close();
    };
  }, [dispatch]); // dispatch是稳定的，这个effect只运行一次

  // 核心 Effect 2: 自动重新连接逻辑
  // 当玩家ID存在（来自localStorage）且WebSocket连接成功时，自动发送重连请求
  useEffect(() => {
    if (ownPlayerId && socket?.readyState === WebSocket.OPEN) {
      console.log(`检测到已存在的玩家ID: ${ownPlayerId}。正在尝试重新连接...`);
      sendToServer('reconnect', { id: ownPlayerId });
    }
  }, [ownPlayerId, socket, socket?.readyState]); // 依赖socket对象和它的连接状态

  // 核心 Effect 3: 同步加注滑块的最小值
  useEffect(() => {
    setRaiseAmount(gameState.minRaiseAmount);
  }, [gameState.minRaiseAmount]);

  // ========================================================================
  // ==                         行动处理器函数                           ==
  // ========================================================================

  const sendToServer = (type: string, payload: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    } else {
      console.error("WebSocket未连接，无法发送指令");
    }
  };

  // --- 游戏设置阶段的处理器 ---
  const handleJoinGame = () => {
    if (ownPlayerId) return; // 如果已有ID，则不执行
    
    // 核心修改 #2: 生成新ID后，同时存入localStorage和React state
    const newPlayerId = `player-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(PLAYER_ID_STORAGE_KEY, newPlayerId);
    setOwnPlayerId(newPlayerId);
    
    // 这是真正的新玩家加入游戏
    sendToServer('joinGame', { id: newPlayerId, name: 'You', stack: 1000, isAI: false });
  };
  
  // 新增：一个用于开发时重置身份的辅助函数
  const handleLeaveGame = () => {
    if (ownPlayerId) {
      sendToServer('leaveGame', { id: ownPlayerId }); // 通知服务器该玩家离开
      localStorage.removeItem(PLAYER_ID_STORAGE_KEY);
      setOwnPlayerId(null);
      // 可选：重置游戏状态到初始
      // dispatch(resetGame()); 
    }
  };

  const handleAddAI = () => sendToServer('addAI', { count: aiCount });
  const handleStartGame = () => sendToServer('startGame', {});
  const handleRequestNewGame = () => sendToServer('resetGame', {});

  // --- 游戏进行中的行动处理器 ---
  const handleFold = () => {
    if (!ownPlayerId) return;
    sendToServer('playerAction', { playerId: ownPlayerId, type: ActionType.FOLD });
  };
  const handleCheck = () => {
    if (!ownPlayerId) return;
    sendToServer('playerAction', { playerId: ownPlayerId, type: ActionType.CHECK });
  };
  const handleCall = () => {
    if (!ownPlayerId) return;
    sendToServer('playerAction', { playerId: ownPlayerId, type: ActionType.CALL });
  };
  const handleRaise = () => {
    if (!ownPlayerId || !ownPlayer) return;
    if (raiseAmount >= gameState.minRaiseAmount && raiseAmount <= ownPlayer.stack + ownPlayer.currentRoundBet) {
      sendToServer('playerAction', { playerId: ownPlayerId, type: ActionType.RAISE, amount: raiseAmount });
    } else {
      alert("无效的加注金额！");
    }
  };

  // ========================================================================
  // ==                         UI 渲染部分                              ==
  // ========================================================================

  const isGameWaiting = gameState.gamePhase === GamePhase.WAITING;
  const isGameEnded = gameState.gamePhase === GamePhase.ENDED;
  const canStartGame = isGameWaiting && gameState.players.length >= 2;

  return (
    <PositionProvider>
      <div className="App">
        {isGameEnded && gameState.showdownResults && (
          <div className="game-result-overlay">
            <div className="game-result-box">
              <h2>游戏结束</h2>
              {gameState.showdownResults.map(result => (
                <div key={result.player.id} className="winner-info">
                  <p><strong>{result.player.name}</strong> 赢得了底池</p>
                  <p>牌型: {result.handResult.handName}</p>
                </div>
              ))}
              <button onClick={handleRequestNewGame} className="new-game-button">
                开始新游戏
              </button>
            </div>
          </div>
        )}
        
        <div className="game-info">
          <h1>德州扑克 - {GamePhase[gameState.gamePhase]}</h1>
          <p>底池 (Pot): {gameState.pot}</p>
          {gameState.gamePhase > GamePhase.PRE_DEAL && <p>当前下注 (Current Bet): {gameState.currentRoundBet}</p>}
          {/* 添加一个离开游戏的按钮，方便调试 */}
          {ownPlayerId && <button onClick={handleLeaveGame} className="leave-game-button">离开游戏(重置ID)</button>}
        </div>
        
        <Table 
          players={gameState.players} 
          communityCards={gameState.communityCards} 
          pot={gameState.pot}
          currentPlayerIndex={gameState.currentPlayerIndex}
          dealerIndex={gameState.dealerIndex}
          ownPlayerId={ownPlayerId}
          gamePhase={gameState.gamePhase}
          gameId={gameState.gameId}
        />
        
        <div className="bottom-bar">
          {isGameWaiting && (
            <div className="game-setup">
              <button onClick={handleJoinGame} disabled={!!ownPlayerId}>{ownPlayerId ? '已加入游戏' : '加入游戏'}</button>
              <div className="ai-controls">
                <label>AI 数量:</label>
                <input type="number" value={aiCount} onChange={(e) => setAiCount(Math.max(1, parseInt(e.target.value, 10) || 1))} min="1" max="9" />
                <button onClick={handleAddAI}>添加AI</button>
              </div>
              <button onClick={handleStartGame} disabled={!canStartGame}>开始游戏 ({gameState.players.length}人)</button>
            </div>
          )}

          {!isGameWaiting && !isGameEnded && (
            <PlayerActions
              isMyTurn={isMyTurn}
              canCheck={canCheck}
              canCall={canCall}
              callAmount={callAmount}
              raiseAmount={raiseAmount}
              minRaiseAmount={gameState.minRaiseAmount}
              maxRaiseAmount={ownPlayer ? ownPlayer.stack + ownPlayer.currentRoundBet : gameState.minRaiseAmount}
              onFold={handleFold}
              onCheck={handleCheck}
              onCall={handleCall}
              onRaise={handleRaise}
              onRaiseAmountChange={setRaiseAmount}
            />
          )}
        </div>
      </div>
    </PositionProvider>
  );
}

export default App;