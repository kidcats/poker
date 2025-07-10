// src/components/poker/index.tsx

import React from 'react';
import { Card, Suit, Rank } from '../../shared-types'; // 确保导入 Card 类型
import { getCardAsset, getCardBackAsset } from '../../utils/cardAssets'; // 假设你的资源函数在这里
import './poker.scss'; // 关键：导入CSS文件以应用动画

// PokerProps 接口保持不变
interface PokerProps {
  card: Card | null | undefined;
  isFlipped: boolean;
}

const Poker: React.FC<PokerProps> = ({ card, isFlipped }) => {
  // 处理 card 可能不存在的情况
  const cardFrontImage = card ? getCardAsset(card) : undefined;
  const cardBackImage = getCardBackAsset();

  // 根据 isFlipped 动态添加 'is-flipped' 类
  const containerClassName = `poker-card-container ${isFlipped ? 'is-flipped' : ''}`;
  return (
    // 使用动态类名
    <div className={containerClassName}>
      <div className="poker-card-inner">
        {/* 牌背面 */}
        <div className="poker-card-face poker-card-back">
          <img src={cardBackImage} alt="Card Back" />
        </div>
        
        {/* 牌正面 */}
        <div className="poker-card-face poker-card-front">
          {/* 
            即使 card 为空，也渲染这个div结构以保持3D结构稳定。
            只在 cardFrontImage 存在时才渲染图片。
          */}
          {cardFrontImage && card && (
            <img src={cardFrontImage} alt={`${Rank[card.rank]} of ${card.suit}`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Poker;