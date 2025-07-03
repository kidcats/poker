import React from 'react';
import './poker.scss';
import { getCardAsset, getCardBackAsset } from '../../utils/cardAssets';
import { Card } from '../../shared-types';

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