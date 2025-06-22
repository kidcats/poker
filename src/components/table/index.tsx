import React from 'react';
import './table.scss';
import { Player, Card } from '../../types';
import Deck from '../deck'; // 导入 Deck 组件

// 更新 Props 类型，添加 ownPlayerId
interface TableProps {
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentPlayerIndex: number | null;
  dealerIndex: number;
  ownPlayerId: string | null; // 新增
}

const Table: React.FC<TableProps> = ({ 
  players, 
  communityCards, 
  pot, 
  currentPlayerIndex, 
  dealerIndex,
  ownPlayerId // 新增
}) => {
  return (
    <div 
      className="game-page__table" 
      id="game-table"
      style={{ position: 'relative' }} // 确保有相对定位
    >
      <div className="table__rail"></div>
      <div className="table__felt">
        {/* 原有的公共牌显示 - 可以隐藏或保留作为占位符 */}
        <div className="community-cards" style={{ visibility: 'hidden' }}>
          {communityCards.map((card, index) => (
            <div key={index} className="card-placeholder">
              {card.rank}{card.suit}
            </div>
          ))}
        </div>
        
        <div className="pot-display">
          底池: {pot}
        </div>
        
        {/* 原有的玩家显示 */}
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
      
      {/* 在 Table 内部渲染 Deck 组件 */}
      <Deck 
        players={players}
        communityCards={communityCards}
        ownPlayerId={ownPlayerId}
      />
    </div>
  );
};

export default Table;