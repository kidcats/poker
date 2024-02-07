import React, { useEffect, useRef, useState } from 'react';
import { useSprings, animated } from '@react-spring/web';
import './poker.css';
import cardBack from './assets/bg.svg';

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
  const [startGame, setStartGame] = useState<boolean>(false);
  const cardRefs = useRef<Array<HTMLDivElement>>([]);

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
    setStartGame(true);
    console.log('startGame', startGame);
  };

  // 用于在这里面更新牌的动画
  useEffect(() => {
    if (startGame ) {
      const newDeck = [...deck];
      newDeck.forEach((card, index) => {
        card.flipped = true;
        setDeck(newDeck);
        cardRefs.current[index].setAttribute('style', `...scatterAnimation`);
      });
    }
  },[startGame])

  // 计算位置，可以分为两组，一组在椭圆上，一组在矩形上
// 首先是椭圆的，现在假设都以中心为远点
// 0<= index < 6 的都在椭圆上
// 方程为 如果 0<theta<pi/2 or 3pi/2<theta<2pi x = 0.4*w*cos(theta) + w/2 y = 0.8*h*sin(theta)
// 如果 pi/2<theta<3pi/2 x = 0.4*w*cos(theta) - w/2 y = 0.8*h*sin(theta)
// 如果 6<=index<9 说明都在矩形上边缘 对应的位置为 x = () y = h/2
// 如果 9<=index<12 说明都在矩形下边缘 对应的位置为 x = () y = -h/2
// 现在需要考虑，我要从哪里获取table的位置和宽度，我需要知道的是table的位置和宽度是随时变化的，所以我需要一个context来存储这些信息



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
          ref={(element) => (cardRefs.current[index] = element as HTMLDivElement)}
          style={{
            ...cardStyle,
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
