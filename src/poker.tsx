import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './poker.css';
import cardBack from './assets/bg.svg';
import useGameContext from './gamerNum';
import useRectangleContext from './rectangleContext';

interface Card {
  suit: string;
  value: string;
  flipped: boolean;
}

const img_path = './assets/';

const getCardImage = (suit: string, value: string) => {
  return require(`${img_path}${suit}_${value}.svg`);
};

const PokerCard: React.FC = () => {
  const suits = ['hearts'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const [deck, setDeck] = useState<Card[]>(() => generateDeck());

  function generateDeck(): Card[] {
    const newDeck: Card[] = [];
    for (const suit of suits) {
      for (const value of values) {
        newDeck.push({ suit, value, flipped: false });
      }
    }
    return newDeck;
  }

  const handleCardClick = (index: number) => {
    const newDeck = [...deck];
    newDeck[index].flipped = !newDeck[index].flipped;
    setDeck(newDeck);
  };

  const { playerCount, setPlayerCount } = useGameContext();
  const { rectangle, setRectangle } = useRectangleContext();

  const scatterAnimation = useSpring({
    from: {
      transform: 'translate(0%, 0%)',
    },
    to: {
      transform: 'translate(50%, 50%)',
    },
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'black',
    borderRadius: '8px',
    boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.2)',
    position: 'absolute',
  };

  return (
    <div style={{ position: 'absolute', top: '10%', left: '46.5%' }}>
      {deck.map((card, index) => (
        <animated.div
          key={index}
          onClick={() => handleCardClick(index)}
          style={{
            ...scatterAnimation,
            ...cardStyle,
            transform: `translate(${index * 0.8}px, ${index * 0.8}px)`,
            zIndex: index,
          }}
        >
          {card.flipped ? (
            <img src={getCardImage(card.suit, card.value)} alt="Card Back" className="card-back" />
          ) : (
            <img src={cardBack} alt="Card Back" className="card-back" />
          )}
        </animated.div>
      ))}
    </div>
  );
};

export default PokerCard;
