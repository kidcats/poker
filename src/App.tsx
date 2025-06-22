import React, { useState, useEffect } from 'react';
import './App.css';
import { PositionProvider } from './states/positionContext';

// Redux 和状态管理
import { selectGame, addPlayer, startGame, fold, check, call, raise } from './states/gameSlice';
import { GamePhase, Player } from './types';

// 组件
import Table from './components/table';
import Deck from './components/deck';
import { useAppDispatch, useAppSelector } from './states/hooks';

function App() {
  const gameState = useAppSelector(selectGame);
  const dispatch = useAppDispatch();

  // --- React 本地状态 ---
  const [ownPlayerId, setOwnPlayerId] = useState<string | null>(null);
  // 使用 state 来管理加注滑块的值
  const [raiseAmount, setRaiseAmount] = useState(gameState.minRaiseAmount);

  // --- 玩家和回合状态计算 ---
  const ownPlayer = gameState.players.find(p => p.id === ownPlayerId);
  const ownPlayerIndex = ownPlayer ? gameState.players.indexOf(ownPlayer) : -1;
  
  const isMyTurn = gameState.gamePhase > GamePhase.WAITING &&
                   gameState.gamePhase < GamePhase.SHOWDOWN &&
                   gameState.currentPlayerIndex === ownPlayerIndex &&
                   ownPlayer?.status === 'active';

  // --- 按钮可用性逻辑 ---
  const canCheck = isMyTurn && ownPlayer && ownPlayer.currentRoundBet === gameState.currentRoundBet;
  const canCall = isMyTurn && ownPlayer && ownPlayer.currentRoundBet < gameState.currentRoundBet;
  const callAmount = gameState.currentRoundBet - (ownPlayer?.currentRoundBet || 0);

  // --- 效果钩子 (Effects) ---
  // 1. 自动添加AI玩家 (仅在游戏开始前)
  useEffect(() => {
    if (gameState.gamePhase === GamePhase.WAITING && gameState.players.length === 1 && ownPlayerId) {
      for (let i = 1; i < 6; i++) {
        dispatch(addPlayer({ id: `ai-${i}`, name: `AI Player ${i}`, stack: 1000, isAI: true }));
      }
    }
  }, [gameState.players.length, ownPlayerId, gameState.gamePhase, dispatch]);
  
  // 2. 当轮到AI时，自动执行操作
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex!];
    if (currentPlayer && currentPlayer.isAI && gameState.gamePhase < GamePhase.SHOWDOWN) {
      // 设置一个短暂的延迟，让玩家能看清AI的行动
      const aiActionTimeout = setTimeout(() => {
        // 非常简单的AI逻辑：如果可以过牌就过牌，否则就弃牌
        if (currentPlayer.currentRoundBet === gameState.currentRoundBet) {
          dispatch(check());
        } else {
          dispatch(fold());
        }
      }, 1000); // 1秒延迟

      return () => clearTimeout(aiActionTimeout);
    }
  }, [gameState.currentPlayerIndex, gameState.players, gameState.currentRoundBet, gameState.gamePhase, dispatch]);

  // 3. 当最小加注额变化时，同步更新滑块的值
  useEffect(() => {
    setRaiseAmount(gameState.minRaiseAmount);
  }, [gameState.minRaiseAmount]);


  // --- 事件处理器 ---
  const handleJoinGame = () => {
    if (ownPlayerId) return; // 防止重复加入
    const newPlayerId = `player-${Math.random().toString(36).substr(2, 9)}`;
    dispatch(addPlayer({ id: newPlayerId, name: 'You', stack: 1000, isAI: false }));
    setOwnPlayerId(newPlayerId);
  };

  const handleStartGame = () => dispatch(startGame());
  const handleFold = () => dispatch(fold());
  const handleCheck = () => dispatch(check());
  const handleCall = () => dispatch(call());
  const handleRaise = () => {
    if (ownPlayer && raiseAmount >= gameState.minRaiseAmount && raiseAmount <= ownPlayer.stack + ownPlayer.currentRoundBet) {
      dispatch(raise(raiseAmount));
    } else {
      alert("无效的加注金额！");
    }
  };

  return (
    <PositionProvider>
      <div className="App">
        <div className="game-info">
          <h1>德州扑克 - {GamePhase[gameState.gamePhase]}</h1>
          <p>底池 (Pot): {gameState.pot}</p>
          <p>当前下注 (Current Bet): {gameState.currentRoundBet}</p>
        </div>
        
        <Table 
          players={gameState.players} 
          communityCards={gameState.communityCards} 
          pot={gameState.pot}
          currentPlayerIndex={gameState.currentPlayerIndex}
          dealerIndex={gameState.dealerIndex}
          ownPlayerId={ownPlayerId}  // 传递 ownPlayerId 给 Table
        />
        
        <div className="bottom-bar">
          {/* 游戏控制 */}
          <div className="game-controls">
            <button onClick={handleJoinGame} disabled={!!ownPlayerId}>加入游戏</button>
            <button onClick={handleStartGame} disabled={gameState.gamePhase !== GamePhase.WAITING || gameState.players.length < 2}>开始游戏</button>
          </div>

          <hr />

          {/* 玩家行动 */}
          <div className="player-actions">
            <button onClick={handleFold} disabled={!isMyTurn}>弃牌</button>
            <button onClick={handleCheck} disabled={!canCheck}>过牌</button>
            <button onClick={handleCall} disabled={!canCall}>
              跟注 {canCall ? callAmount : ''}
            </button>
            <div className="raise-control">
              <button onClick={handleRaise} disabled={!isMyTurn}>加注</button>
              <input 
                type="range" 
                min={gameState.minRaiseAmount}
                max={ownPlayer ? ownPlayer.stack + ownPlayer.currentRoundBet : gameState.minRaiseAmount}
                step="10"
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(parseInt(e.target.value, 10))}
                disabled={!isMyTurn}
              />
              <span>{raiseAmount}</span>
            </div>
          </div>
        </div>
      </div>
    </PositionProvider>
  );
}

export default App;