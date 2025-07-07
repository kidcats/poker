import React from 'react';
import { useSprings, animated, to } from '@react-spring/web';
import { calculateCenterPosition, calculatePosition } from '../../utils/utils';
import Poker from '../poker';
import { Card, GamePhase, Player, PlayerStatus } from '../../shared-types';

const CARD_ASPECT_RATIO = 1.4; 
const CARD_WIDTH = 80;
// 让高度根据宽度和宽高比自动计算，确保比例正确
const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT_RATIO; 

interface DeckProps {
  players: Player[];
  communityCards: Card[];
  ownPlayerId: string | null;
  gamePhase: GamePhase;
  gameId: string | null; // <-- 接收 gameId
}

const Deck: React.FC<DeckProps> = ({ players, communityCards, ownPlayerId, gamePhase, gameId }) => {
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    const parent = document.getElementById('game-table');
    if (!parent) return;
    const updateSize = () => setContainerSize({ width: parent.clientWidth, height: parent.clientHeight });
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, []);

  const allCards = React.useMemo(() => {
    // 如果没有 gameId (游戏未开始)，则不渲染任何牌
    if (!gameId) return [];

    const cards: {
      card: Card | null;
      ownerId: string;
      type: 'hand' | 'community';
      cardIndex: number;
      uniqueKey: string;
    }[] = [];

    players.forEach((player) => {
      // 如果是AI或者其他玩家，并且手牌为空 (被服务器隐藏了)，但游戏正在进行中
      if (player.id !== ownPlayerId && player.hand.length === 0 && gamePhase > GamePhase.PRE_DEAL && gamePhase < GamePhase.SHOWDOWN) {
        for (let i = 0; i < 2; i++) {
          cards.push({
            card: null, // card 为 null 代表这是一张牌背
            ownerId: player.id,
            type: 'hand',
            cardIndex: i,
            uniqueKey: `${gameId}-${player.id}-${i}` // 使用稳定的key
          });
        }
      } else {
        // 对于真人玩家，或者摊牌阶段的AI，正常处理手牌
        player.hand.forEach((card, handIndex) => {
          cards.push({
            card,
            ownerId: player.id,
            type: 'hand',
            cardIndex: handIndex,
            uniqueKey: `${gameId}-${player.id}-${handIndex}`
          });
        });
      }
    });
    communityCards.forEach((card, index) => {
      cards.push({ 
        card, 
        ownerId: 'community', 
        type: 'community', 
        cardIndex: index, 
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
        // THE DEFINITIVE FIX: 公共牌也使用 gameId
        uniqueKey: `${gameId}-community-${index}`
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
      });
    });

    return cards;
  }, [players, communityCards, gameId,gamePhase,ownPlayerId]); // <-- 将 gameId 加入依赖项

  // ... (useSprings 和 useEffect 逻辑完全不变)
  const [springs, api] = useSprings(allCards.length, index => ({
    x: 0, y: 0, rot: 0, scale: 1, opacity: 0,
    config: { mass: 1, tension: 170, friction: 26 },
  }));

  React.useEffect(() => {
    if (!containerSize) return;
    api.start(index => {
      const cardInfo = allCards[index];
      if (!cardInfo) return {}; // 防御性编程
      let targetPos;
      const position = { width: containerSize.width, height: containerSize.height, x: 0, y: 0 };
      if (cardInfo.type === 'community') {
        targetPos = calculateCenterPosition(cardInfo.cardIndex, position); 
      } else {
        const playerIndex = players.findIndex(p => p.id === cardInfo.ownerId);
        if (playerIndex !== -1) {
          targetPos = calculatePosition(playerIndex, position, cardInfo.cardIndex);
        }
      }
      if (targetPos) {
        return { x: targetPos.cardX, y: targetPos.cardY, rot: targetPos.rotate, opacity: 1, delay: index * 50 };
      }
      return {};
    });
  }, [allCards, containerSize, api, players]);


  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {springs.map((styles, index) => {
        const cardInfo = allCards[index];
        if (!cardInfo) return null;
        const isShowdown = gamePhase >= GamePhase.SHOWDOWN;
        const isPlayerInShowdown = !!(isShowdown && players.find(p => p.id === cardInfo.ownerId && p.status !== PlayerStatus.FOLDED));
        const isFlipped = cardInfo.card !== null && (cardInfo.type === 'community' || cardInfo.ownerId === ownPlayerId || isPlayerInShowdown);
        return (
          <animated.div
            key={cardInfo.uniqueKey}
            style={{
              position: 'absolute',
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              top: '50%',
              left: '50%',
              transform: to(
                [styles.x, styles.y, styles.rot, styles.scale], 
                (x, y, r, s) => `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`
              ),
              opacity: styles.opacity,
              pointerEvents: 'auto',
            }}
          >
            <Poker card={cardInfo.card} isFlipped={isFlipped} />
          </animated.div>
        );
      })}
    </div>
  );
};

export default Deck;