import React, { useState, useEffect } from 'react';
import './App.css';
import { PositionProvider } from './states/positionContext';
import { selectGame, addPlayer, startGame, fold, check, call, raise } from './states/gameSlice';
import { GamePhase, PlayerStatus } from './types';
import { useAppDispatch, useAppSelector } from './states/hooks';
import Table from './components/table';

function App() {
  const gameState = useAppSelector(selectGame);
  const dispatch = useAppDispatch();

  const [ownPlayerId, setOwnPlayerId] = useState<string | null>(null);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [aiCount, setAiCount] = useState(5);

  const ownPlayer = gameState.players.find(p => p.id === ownPlayerId);
  const ownPlayerIndex = ownPlayer ? gameState.players.indexOf(ownPlayer) : -1;
  
  const isMyTurn = gameState.gamePhase > GamePhase.WAITING &&
                   gameState.gamePhase < GamePhase.SHOWDOWN &&
                   gameState.currentPlayerIndex === ownPlayerIndex &&
                   ownPlayer?.status === PlayerStatus.ACTIVE;

  const canCheck = isMyTurn && ownPlayer && ownPlayer.currentRoundBet === gameState.currentRoundBet;
  const canCall = isMyTurn && ownPlayer && ownPlayer.currentRoundBet < gameState.currentRoundBet;
  const callAmount = gameState.currentRoundBet - (ownPlayer?.currentRoundBet || 0);

  useEffect(() => {
    if (gameState.gamePhase < GamePhase.PRE_FLOP || gameState.gamePhase >= GamePhase.SHOWDOWN) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex!];
    if (currentPlayer && currentPlayer.isAI && currentPlayer.status === PlayerStatus.ACTIVE) {
      const aiActionTimeout = setTimeout(() => {
        if (currentPlayer.currentRoundBet === gameState.currentRoundBet) dispatch(check());
        else {
          const amountToCall = gameState.currentRoundBet - currentPlayer.currentRoundBet;
          if (currentPlayer.stack >= amountToCall) dispatch(call());
          else dispatch(fold());
        }
      }, 1000);
      return () => clearTimeout(aiActionTimeout);
    }
  }, [gameState.currentPlayerIndex, gameState.players, gameState.currentRoundBet, gameState.gamePhase, dispatch]);

  useEffect(() => { setRaiseAmount(gameState.minRaiseAmount); }, [gameState.minRaiseAmount]);

  const handleJoinGame = () => {
    if (ownPlayerId) return;
    const newPlayerId = `player-${Math.random().toString(36).substr(2, 9)}`;
    dispatch(addPlayer({ id: newPlayerId, name: 'You', stack: 1000, isAI: false }));
    setOwnPlayerId(newPlayerId);
  };

  const handleAddAI = () => {
    for (let i = 0; i < aiCount; i++) {
        dispatch(addPlayer({ id: `ai-${Date.now()}-${i}`, name: `AI Player ${i + 1}`, stack: 1000, isAI: true }));
    }
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

  const isGameWaiting = gameState.gamePhase === GamePhase.WAITING;
  const isGameEnded = gameState.gamePhase === GamePhase.ENDED;
  const canStartGame = isGameWaiting && gameState.players.length >= 2;

  return (
    <PositionProvider>
      <div className="App">
        {/* ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ */}
        {/* NEW: 游戏结束界面 */}
        {isGameEnded && gameState.showdownResults && (
          <div className="game-result-overlay">
            <div className="game-result-box">
              <h2>游戏结束</h2>
              {gameState.showdownResults.map(result => (
                <div key={result.player.id} className="winner-info">
                  <p>
                    <strong>{result.player.name}</strong> 赢得了底池
                  </p>
                  <p>牌型: {result.handResult.handName}</p>
                </div>
              ))}
              <button onClick={handleStartGame} className="new-game-button">
                开始新游戏
              </button>
            </div>
          </div>
        )}
        {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}
        
        <div className="game-info">
          <h1>德州扑克 - {GamePhase[gameState.gamePhase]}</h1>
          <p>底池 (Pot): {gameState.pot}</p>
          {gameState.gamePhase > GamePhase.PRE_DEAL && <p>当前下注 (Current Bet): {gameState.currentRoundBet}</p>}
        </div>
        
        <Table 
          players={gameState.players} 
          communityCards={gameState.communityCards} 
          pot={gameState.pot}
          currentPlayerIndex={gameState.currentPlayerIndex}
          dealerIndex={gameState.dealerIndex}
          ownPlayerId={ownPlayerId}
          gamePhase={gameState.gamePhase} // <-- 传递 gamePhase
          gameId={gameState.gameId} // <-- 传递 gameId
        />
        
        <div className="bottom-bar">
          {isGameWaiting && (
            <div className="game-setup">
              <button onClick={handleJoinGame} disabled={!!ownPlayerId}>{ownPlayerId ? '已加入' : '加入游戏'}</button>
              <div className="ai-controls">
                <input type="number" value={aiCount} onChange={(e) => setAiCount(Math.max(1, parseInt(e.target.value, 10) || 1))} min="1" max="9" />
                <button onClick={handleAddAI}>添加 {aiCount} 个AI</button>
              </div>
              <button onClick={handleStartGame} disabled={!canStartGame}>开始游戏 ({gameState.players.length}人)</button>
            </div>
          )}

          {!isGameWaiting && !isGameEnded && (
            <div className="player-actions">
              <button onClick={handleFold} disabled={!isMyTurn}>弃牌</button>
              <button onClick={handleCheck} disabled={!canCheck}>过牌</button>
              <button onClick={handleCall} disabled={!canCall}>跟注 {canCall ? callAmount : ''}</button>
              <div className="raise-control">
                <button onClick={handleRaise} disabled={!isMyTurn}>加注</button>
                <input type="range" min={gameState.minRaiseAmount} max={ownPlayer ? ownPlayer.stack + ownPlayer.currentRoundBet : gameState.minRaiseAmount} step="10" value={raiseAmount} onChange={(e) => setRaiseAmount(parseInt(e.target.value, 10))} disabled={!isMyTurn} />
                <span>{raiseAmount}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </PositionProvider>
  );
}

export default App;