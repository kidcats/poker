import React, { useEffect, useRef, useState } from 'react';
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

  const { playerCount, setPlayerCount } = useGameContext();
  const { rectangle, setRectangle } = useRectangleContext();

  const handleCardClick = (index: number) => {
    // const newDeck = [...deck];
    // newDeck[index].flipped = !newDeck[index].flipped;
    // setDeck(newDeck);
    setStartGame(true);
    console.log('startGame', startGame);
  };

  // 用于在这里面更新牌的动画
  useEffect(() => {
    if (startGame && playerCount > 2) {
      const newDeck = [...deck];
      newDeck.forEach((card, index) => {
        card.flipped = true;
        setDeck(newDeck);
        cardRefs.current[index].setAttribute('style', `...scatterAnimation`);
      });
    }
  },[startGame,playerCount])

  // 现在要根据index来计算每个牌的位置了
  // 首先要看有多少个玩家，然后根据玩家数量来计算每个牌的位置
  const calculateCardPosition = (index: number) => {
    console.log('game player ', playerCount);
    // 不影响算，反正都是固定位置
    const {x,y,width,height} = rectangle
    console.log('x,y,width,height',x,y,width,height)
    console.log('index',index)
    //先考虑后面两个点的位置
    if (index == 10) {
      const cardX = x  + width / 2 - 50;
      const cardY = y  - 50;
      return { cardX, cardY };
    }
    if (index == 11) {
      const cardX = x  + width / 2 - 50;
      const cardY = y + height - 50;
      return { cardX, cardY };
    }
    // 先考虑前10个点的位置
    // 先算圆心位置
    const prox = index % 5
    const centerX = (width/2) 
    const centerY = (width/2) 
    // 先写出当前的圆公式 x = centerX + r*cosθ y = centerY + r*sinθ
    const pointX = centerX + Math.cos(Math.PI*index/8) + (1-prox)*width/2
    const pointY = centerY + Math.sin(Math.PI*index/8)
    // 计算出对应的点后,需要根据index来计算出对应的位
    // 
    const cardX = pointX - 50;
    const cardY = pointY - 50;
    console.log('cardX,cardY',cardX,cardY)
    return { cardX, cardY };
  };
  
  const scatterAnimation = useSpring({
    from: { transform: `translate(0%, 0%)` },
    to: async (next, cancel) => {
  
      // 执行动画效果，将 cardX 和 cardY 作为参数传递给 next
      // await next({ transform: `translate(${cardX}px, ${cardY}px)` });
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
