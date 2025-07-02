import React from 'react';
import './poker.scss';
import { Card } from '../../types';
import { getCardAsset, getCardBackAsset } from '../../utils/cardAssets';

interface PokerProps {
  card: Card;
  isFlipped: boolean;
}

const Poker: React.FC<PokerProps> = ({ card, isFlipped }) => {
  const cardFrontImage = getCardAsset(card);
  const cardBackImage = getCardBackAsset();

  return (
    <div className={`poker-card-container ${isFlipped ? 'is-flipped' : ''}`}>
      <div className="poker-card-inner">
        <div className="poker-card-face poker-card-back">
          <img src={cardBackImage} alt="Card Back" />
        </div>
        <div className="poker-card-face poker-card-front">
          <img src={cardFrontImage} alt={`${card.rank} of ${card.suit}`} />
        </div>
      </div>
    </div>
  );
};

export default Poker;