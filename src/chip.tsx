// PokerChip.tsx
import React, { useState } from 'react';
import { useSpring, animated, to } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import './chip.scss';
import { calculatePosition } from './utils';
import { usePosition } from './positionContext';

interface ChipProps {
  value: number;
  index: number;
}  

const PokerChip: React.FC<ChipProps> = (props) => {

  const [{ pos }, api] = useSpring(() => ({ pos: [0, 0] }))
  // 现在我要给筹码赋予一些功能，比如拖动一定量的筹码在牌桌上，结算的时候获取一定量的筹码回来
  // 首先实现拖动功能
  const post = usePosition().position;
  const position = calculatePosition(props.index,post);
  const bind = useDrag(
    ({ xy, previous, down, movement: pos, velocity, direction }) => {
      // 现在我要做一些额外的操作，当用户将筹码拖动到牌桌上的时候，我要将筹码固定在用户面前的位置上，代表用户下注了多少钱
      // 在其余情况下，用户拖动筹码都会直接返回远处
      // 同时当结算的时候，筹码要能回到用户面前
      api.start({
        pos,
        immediate: down,
      })
    },
    { initial: () => pos.get() }
  )
  return (
    <animated.div
      className={`chip-${props.value}`} 
      {...bind()}
      style={{
        transform: to(
          [pos],
          ([x, y]) => `translate3d(${x}px,${y}px,0)`
        )
      }
      }
    >
      <span>${props.value}</span>
    
    </animated.div>
  );
}


export default PokerChip;