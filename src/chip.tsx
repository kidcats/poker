// PokerChip.tsx
import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import './chip.scss';
interface ChipProps {
  value: number;
}  

const PokerChip: React.FC<ChipProps> = (props) => {

  const [animatedPosition, setAnimatedPosition] = useSpring(() => ({
    x: 0,
    y: 0
  }));
  
  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    setAnimatedPosition({ 
      x: event.clientX,
      y: event.clientY 
    });
  };
  
  return (
    <animated.div
      className={`chip-${props.value}`}  
      style={{
        position: 'absolute',
        left: animatedPosition.x,
        top: animatedPosition.y,
        zIndex: 10
      }}
      draggable
      onDrag={handleDrag}
    >
      <span>{props.value}</span>
    
    </animated.div>
  );
}


export default PokerChip;