import React, { useState, useEffect } from 'react';
import './App.scss';
import { PositionProvider } from './states/positionContext';
import { selectGame, setGameState } from './states/gameSlice';
import { GamePhase, PlayerStatus, ActionType } from './shared-types';
import Table from './components/table';
import PlayerActions from './components/PlayerActions'; // 确保这个路径正确
import { useAppDispatch, useAppSelector } from './states/hooks';

function App() {
  // 从Redux store中获取游戏状态
  const gameState = useAppSelector(selectGame);
  const dispatch = useAppDispatch();

  // 本地UI状态
  const [ownPlayerId, setOwnPlayerId] = useState<string | null>(null);
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
  // 这个effect只在组件首次挂载时运行一次
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    setSocket(ws);

    ws.onopen = () => console.log('成功连接到游戏服务器');
    ws.onclose = () => console.log('与服务器断开连接');

    // 监听来自服务器的所有消息
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // 如果是游戏状态更新消息，就用服务器的数据覆盖本地Redux状态
        if (message.type === 'gameStateUpdate') {
            dispatch(setGameState(message.payload));
        }
    };

    // 组件卸载时，关闭WebSocket连接
    return () => {
        ws.close();
    };
  }, [dispatch]); // dispatch是稳定的，所以这个effect只运行一次

  // 核心 Effect 2: 同步加注滑块的最小值
  // 当新一轮开始，最小加注额变化时，更新本地滑块状态
  useEffect(() => {
    setRaiseAmount(gameState.minRaiseAmount);
  }, [gameState.minRaiseAmount]);

  // 注意：之前那个负责调用AI API的useEffect已经被彻底移除，因为现在由服务器驱动AI。

  // ========================================================================
  // ==                         行动处理器函数                           ==
  // ========================================================================

  /**
   * 一个通用的函数，用于向服务器发送指令
   * @param type 指令类型，如 'joinGame', 'playerAction'
   * @param payload 指令的具体内容
   */
  const sendToServer = (type: string, payload: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    } else {
      console.error("WebSocket未连接，无法发送指令");
    }
  };

  // --- 游戏设置阶段的处理器 ---
  const handleJoinGame = () => {
    if (ownPlayerId) return;
    const newPlayerId = `player-${Math.random().toString(36).substr(2, 9)}`;
    setOwnPlayerId(newPlayerId); // 在本地保存自己的ID，用于识别
    sendToServer('joinGame', { id: newPlayerId, name: 'You', stack: 1000, isAI: false });
  };

  const handleAddAI = () => {
    sendToServer('addAI', { count: aiCount });
  };

  const handleStartGame = () => sendToServer('startGame', {});

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
    if (!ownPlayerId) return;
    // 客户端验证依然保留，提供即时反馈，防止发送无效请求
    if (ownPlayer && raiseAmount >= gameState.minRaiseAmount && raiseAmount <= ownPlayer.stack + ownPlayer.currentRoundBet) {
      sendToServer('playerAction', { playerId: ownPlayerId, type: ActionType.RAISE, amount: raiseAmount });
    } else {
      alert("无效的加注金额！");
    }
  };
  const handleRequestNewGame = () => {
    // 我们不再直接发送 'startGame'，而是发送一个更明确的指令
    // 告诉服务器：“这局结束了，请把我们带回大厅（WAITING状态）”
    sendToServer('resetGame', {});
  };

  // ========================================================================
  // ==                         UI 渲染部分                              ==
  // ========================================================================

  // 用于控制UI元素可见性的布尔值
  const isGameWaiting = gameState.gamePhase === GamePhase.WAITING;
  const isGameEnded = gameState.gamePhase === GamePhase.ENDED;
  const canStartGame = isGameWaiting && gameState.players.length >= 2;

  return (
    <PositionProvider>
      <div className="App">
        {/* 游戏结束时的结算界面 */}
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
              {/* 这个按钮现在会开始一个由服务器控制的新游戏循环 */}
              <button onClick={handleRequestNewGame} className="new-game-button">
                开始新游戏
              </button>
            </div>
          </div>
        )}
        
        {/* 顶部的游戏信息栏 */}
        <div className="game-info">
          <h1>德州扑克 - {GamePhase[gameState.gamePhase]}</h1>
          <p>底池 (Pot): {gameState.pot}</p>
          {gameState.gamePhase > GamePhase.PRE_DEAL && <p>当前下注 (Current Bet): {gameState.currentRoundBet}</p>}
        </div>
        
        {/* 核心的牌桌组件 */}
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
        
        {/* 底部的控制栏 */}
        <div className="bottom-bar">
          {/* 等待阶段的设置界面 */}
          {isGameWaiting && (
            <div className="game-setup">
              <button onClick={handleJoinGame} disabled={!!ownPlayerId}>{ownPlayerId ? '已加入' : '加入游戏'}</button>
              <div className="ai-controls">
                <label>AI 数量:</label>
                <input type="number" value={aiCount} onChange={(e) => setAiCount(Math.max(1, parseInt(e.target.value, 10) || 1))} min="1" max="9" />
                <button onClick={handleAddAI}>添加AI</button>
              </div>
              <button onClick={handleStartGame} disabled={!canStartGame}>开始游戏 ({gameState.players.length}人)</button>
            </div>
          )}

          {/* 游戏进行中的行动界面 */}
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