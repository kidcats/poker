// Deck.tsx - 更新后的版本
import React from 'react';
import { useSprings, animated, to } from '@react-spring/web';
import { Card, Player } from '../../types';

import backImg from '../../assets/bg.svg';
import spadesA from '../../assets/spades_A.svg';
import { calculateCenterPosition, calculatePosition } from '../../utils';

const CARD_WIDTH = 80;
const CARD_HEIGHT = 120;

const cardImageMap: Record<string, string> = {
  "♠A": spadesA,
  // ... other cards
};

const getCardImage = (card: Card, isFlipped: boolean): string => {
  if (!isFlipped) return backImg;
  const key = `${card.suit}${card.rank}`;
  return cardImageMap[key] || backImg;
};

interface DeckProps {
  players: Player[];
  communityCards: Card[];
  ownPlayerId: string | null;
}

const Deck: React.FC<DeckProps> = ({ players, communityCards, ownPlayerId }) => {
  // 获取父容器（Table）的尺寸
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    const updateSize = () => {
      // 获取父元素（game-table）的尺寸
      const parent = document.getElementById('game-table');
      if (parent) {
        setContainerSize({
          width: parent.clientWidth,
          height: parent.clientHeight
        });
      }
    };

    updateSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateSize);
    
    // 使用 ResizeObserver 更精确地监听
    const parent = document.getElementById('game-table');
    const resizeObserver = new ResizeObserver(updateSize);
    if (parent) {
      resizeObserver.observe(parent);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  const allCards = React.useMemo(() => {
    const cards: {
      card: Card;
      ownerId: string;
      type: 'hand' | 'community';
      cardIndex: number;
      uniqueKey: string;
    }[] = [];

    players.forEach((player) => {
      player.hand.forEach((card, handIndex) => {
        cards.push({ 
          card, 
          ownerId: player.id, 
          type: 'hand', 
          cardIndex: handIndex,
          uniqueKey: `${player.id}-${handIndex}-${card.suit}${card.rank}`
        });
      });
    });

    communityCards.forEach((card, index) => {
      cards.push({ 
        card, 
        ownerId: 'community', 
        type: 'community', 
        cardIndex: index,
        uniqueKey: `community-${index}-${card.suit}${card.rank}`
      });
    });

    return cards;
  }, [players, communityCards]);

  const [springs, api] = useSprings(allCards.length, index => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1,
    opacity: 0,
    config: { mass: 1, tension: 170, friction: 26 },
  }));

  React.useEffect(() => {
    if (!containerSize) return;

    api.start(index => {
      const cardInfo = allCards[index];
      let targetPos;

      // 创建位置对象，使用容器尺寸
      const position = {
        width: containerSize.width,
        height: containerSize.height,
        x: 0,  // 相对坐标，从0开始
        y: 0
      };

      if (cardInfo.type === 'community') {
        targetPos = calculateCenterPosition(cardInfo.cardIndex, position); 
      } else {
        const playerIndex = players.findIndex(p => p.id === cardInfo.ownerId);
        if (playerIndex !== -1) {
          targetPos = calculatePosition(playerIndex, position, cardInfo.cardIndex);
        }
      }

      if (targetPos) {
        return { 
          x: targetPos.cardX, 
          y: targetPos.cardY, 
          rot: targetPos.rotate, 
          opacity: 1,
          delay: index * 50
        };
      }
      
      return {};
    });
  }, [allCards, containerSize, api, players]);

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none'
      }}
    >
      {springs.map((styles, index) => {
        const cardInfo = allCards[index];
        if (!cardInfo) return null;

        const isFlipped = cardInfo.type === 'community' || cardInfo.ownerId === ownPlayerId;

        return (
          <animated.div
            key={cardInfo.uniqueKey}
            className="card"
            style={{
              position: 'absolute',
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              left: 0,
              top: 0,
              transform: to(
                [styles.x, styles.y, styles.rot, styles.scale], 
                (x, y, r, s) => `translate(${x - CARD_WIDTH/2}px, ${y - CARD_HEIGHT/2}px) rotate(${r}deg) scale(${s})`
              ),
              opacity: styles.opacity,
              transformOrigin: 'center center',
              pointerEvents: 'auto',
              zIndex: 10
            }}
          >
            <img 
              src={getCardImage(cardInfo.card, isFlipped)} 
              alt="card" 
              style={{ width: '100%', height: '100%' }}
            />
          </animated.div>
        );
      })}
    </div>
  );
};

export default Deck;