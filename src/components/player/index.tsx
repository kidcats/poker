import React from 'react';
import { Player as PlayerType, GamePhase, PlayerStatus, Card, Suit, Rank } from '../../shared-types';
import Poker from '../poker';
import './player.scss';

interface PlayerProps {
  player: PlayerType;
  isCurrentPlayer: boolean;
  isOwnPlayer: boolean;
  ownPlayerId: string | null;
  gamePhase: GamePhase;
  dealerIndex?: number;
  playerIndex: number;
}

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// 解决方案：创建一个符合 Card 类型的虚拟卡片对象
// 它的具体值不重要，因为在 isFlipped=false 时不会显示
const dummyCard: Card = { suit: Suit.SPADES, rank: Rank.TWO };
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const PlayerComponent: React.FC<PlayerProps> = ({ 
  player, 
  isCurrentPlayer, 
  isOwnPlayer,
  ownPlayerId,
  gamePhase, 
  dealerIndex, 
  playerIndex 
}) => {
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
      <div className="player-hand">
        {player.hand.map((card, index) => {
          const isShowdown = gamePhase >= GamePhase.SHOWDOWN;
          const isPlayerInShowdown = isShowdown && player.status !== PlayerStatus.FOLDED;
          const isFlipped = isOwnPlayer || isPlayerInShowdown;

          return (
            <Poker 
              key={`${player.id}-hand-${index}`} 
              card={card} 
              isFlipped={isFlipped} 
            />
          );
        })}
        
        {/* ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ */}
        {/* 错误修正：使用虚拟卡片对象代替 null */}
        {/* ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ */}
        {player.hand.length === 0 && gamePhase > GamePhase.WAITING && (
          <>
            <Poker card={dummyCard} isFlipped={false} />
            <Poker card={dummyCard} isFlipped={false} />
          </>
        )}
      </div>
      {player.currentRoundBet > 0 && (
        <div className="player-bet">{player.currentRoundBet}</div>
      )}
    </div>
  );
};

export default PlayerComponent;