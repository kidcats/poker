import React from 'react';
import './table.scss';
import { Player, Card, GamePhase } from '../../types';
import Deck from '../deck';

interface TableProps {
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentPlayerIndex: number | null;
  dealerIndex: number;
  ownPlayerId: string | null;
  gamePhase: GamePhase;
  gameId: string | null; // 新增 gameId 属性
}

const Table: React.FC<TableProps> = ({ 
  players, 
  communityCards, 
  pot, 
  currentPlayerIndex, 
  dealerIndex,
  ownPlayerId,
  gamePhase ,
  gameId // 新增 gameId 参数
}) => {
  return (
    <div 
      className="game-page__table" 
      id="game-table"
      style={{ position: 'relative' }}
    >
      <div className="table__rail"></div>
      <div className="table__felt">
        <div className="pot-display">
          底池: {pot}
        </div>
        
        <div className="players-container">
          {players.map((player, index) => (
            <div key={player.id} className={`player-seat player-seat-${index}`}>
              <p>{player.name} ({player.stack})</p>
              <p>下注: {player.currentRoundBet}</p>
              {index === dealerIndex && <div className="dealer-button">D</div>}
              {index === currentPlayerIndex && <div className="current-player-indicator"></div>}
            </div>
          ))}
        </div>
      </div>
      
      <Deck 
        players={players}
        communityCards={communityCards}
        ownPlayerId={ownPlayerId}
        gamePhase={gamePhase}
        gameId={gameId} // 传递 gameId
      />
    </div>
  );
};

export default Table;