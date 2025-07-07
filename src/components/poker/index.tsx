// src/components/poker/index.tsx

import React from 'react';
import { Card, Suit, Rank } from '../../shared-types'; // 确保导入 Card 类型
import { getCardAsset, getCardBackAsset } from '../../utils/cardAssets'; // 假设你的资源函数在这里

// 1. 修改 PokerProps 接口
interface PokerProps {
  card: Card | null | undefined; // 允许 card 为 null 或 undefined
  isFlipped: boolean;
}

const Poker: React.FC<PokerProps> = ({ card, isFlipped }) => {
  // 2. 在组件内部处理 card 可能不存在的情况
  // 只有当 card 存在时，才去获取正面图片。
  // 如果 card 为 null/undefined，cardFrontImage 将是 undefined，但我们不会使用它。
  const cardFrontImage = card ? getCardAsset(card) : undefined;
  
  // 背面图片总是需要的
  const cardBackImage = getCardBackAsset();

  return (
    // 使用 isFlipped 来控制翻转动画
    <div className={`poker-card-container ${isFlipped ? 'is-flipped' : ''}`}>
      <div className="poker-card-inner">
        {/* 牌背面 */}
        <div className="poker-card-face poker-card-back">
          <img src={cardBackImage} alt="Card Back" />
        </div>
        
        {/* 牌正面 */}
        <div className="poker-card-face poker-card-front">
          {/* 
            3. 添加一个条件渲染！
            只有当 cardFrontImage 存在 (即 card prop 不为 null) 时，才渲染正面的 img 标签。
            这可以防止在 card 为 null 时出现 alt 文本计算错误和 img 的 src 为空的问题。
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