// Table.tsx
import React from 'react';
import './table.scss';
import Deck from '../deck';
import { Card, GamePhase, Player } from '../../shared-types';
import { calculatePosition } from '../../utils/utils';
import { PlayerComponent } from '../player';

interface TableProps {
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentPlayerIndex: number | null;
  dealerIndex: number;
  ownPlayerId: string | null;
  gamePhase: GamePhase;
  gameId: string | null;
}

const Table: React.FC<TableProps> = ({ 
  players, 
  communityCards, 
  pot, 
  currentPlayerIndex, 
  dealerIndex,
  ownPlayerId,
  gamePhase,
  gameId
}) => {
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number; x: number; y: number } | null>(null);
  React.useEffect(() => {
    const parent = document.getElementById('game-table');
    if (!parent) return;
    
    const updateSize = () => {
      setContainerSize({ 
        width: parent.clientWidth, 
        height: parent.clientHeight,
        x:0,
        y:0
      });
    };
    
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, []);

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
        
        {/* 使用动态定位渲染玩家 */}
        {containerSize && players.map((player, index) => {
          // 使用与 Deck 相同的计算函数，但不传 cardIndex
          const pos = calculatePosition(index, containerSize);
          
          return (
            <div
              key={player.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${pos.cardX}px, ${pos.cardY}px)`,
                zIndex: 10
              }}
            >
              <PlayerComponent
                player={player}
                playerIndex={index}
                isCurrentPlayer={index === currentPlayerIndex}
                dealerIndex={dealerIndex}
              />
            </div>
          );
        })}
      </div>
      
      <Deck 
        players={players}
        communityCards={communityCards}
        ownPlayerId={ownPlayerId}
        gamePhase={gamePhase}
        gameId={gameId}
      />
    </div>
  );
};

export default Table;