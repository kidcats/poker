// src/components/player/index.tsx (修改后)

import React from 'react';
import { Player as PlayerType, PlayerStatus } from '../../shared-types';
import './player.scss';

interface PlayerProps {
  player: PlayerType;
  isCurrentPlayer: boolean;
  dealerIndex?: number;
  playerIndex: number;
}

// PlayerComponent
export const PlayerComponent: React.FC<PlayerProps> = ({ 
  player, 
  isCurrentPlayer, 
  dealerIndex, 
  playerIndex 
}) => {
  // 移除 player-seat-${playerIndex} 类
  const playerClassName = `player-container ${isCurrentPlayer ? 'current-player' : ''} ${player.status === PlayerStatus.FOLDED ? 'folded' : ''}`;
  const isDealer = dealerIndex === playerIndex;

  return (
    <div className={playerClassName}>
      <div className="player-info">
        {isDealer && <div className="dealer-button">D</div>}
        <span className="player-name">{player.name}</span>
        
        {player.position && (
          <div className="player-position-badge">{player.position}</div>
        )}

        <span className="player-stack">{player.stack}</span>
      </div>
      
      {player.currentRoundBet > 0 && (
        <div className="player-bet">{player.currentRoundBet}</div>
      )}
      
      {isCurrentPlayer && <div className="current-player-indicator"></div>}
    </div>
  );
};