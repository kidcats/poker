import React from 'react';
import { useSpring, animated, to } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';
import './chip.scss';
import { usePosition } from '../../states/positionContext';
import { calculatePosition } from '../../utils/utils';

// 1. 修复 Props 类型定义
interface ChipProps {
  value: number;
  playerIndex: number; // 使用 playerIndex 来定位
}  

const PokerChip: React.FC<ChipProps> = ({ value, playerIndex }) => {
  const [{ pos }, api] = useSpring(() => ({ pos: [0, 0] }));
  const tablePos = usePosition().position;

  // 2. 使用 playerIndex 来计算初始位置
  const initialPosition = calculatePosition(playerIndex, tablePos);

  const bind = useDrag(
    ({ down, movement: pos }) => {
      api.start({
        pos,
        immediate: down,
      });
    },
    { initial: () => pos.get() }
  );

  return (
    <animated.div
      className={`chip chip-${value}`} 
      {...bind()}
      style={{
        position: 'absolute',
        // 使用 initialPosition 来设置初始位置
        left: `${initialPosition?.cardX || 0}px`,
        top: `${initialPosition?.cardY || 0}px`,
        transform: to(
          [pos],
          ([x, y]) => `translate3d(${x}px,${y}px,0)`
        ),
        touchAction: 'none', // 推荐为拖拽元素添加
      }}
    >
      <span>${value}</span>
    </animated.div>
  );
}

export default PokerChip;