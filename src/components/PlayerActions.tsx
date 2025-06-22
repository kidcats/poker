import React from 'react';
import { useDispatch } from 'react-redux';
import { fold, check, call, raise } from '../states/gameSlice';

interface PlayerActionsProps {
  isPlayerTurn: boolean; // 接收一个布尔值，判断是否轮到该玩家行动
}

const PlayerActions: React.FC<PlayerActionsProps> = ({ isPlayerTurn }) => {
  const dispatch = useDispatch();

  const handleFold = () => {
    dispatch(fold());
  };

  const handleCheck = () => {
    dispatch(check());
  };

  const handleCall = () => {
    dispatch(call());
  };

  const handleRaise = () => {
    // 暂时用一个固定的值
    dispatch(raise(50));
  };

  // 如果不是该玩家的回合，不渲染任何东西
  if (!isPlayerTurn) {
    return null;
  }

  return (
    <div className="player-actions">
      <button onClick={handleFold}>弃牌 (Fold)</button>
      <button onClick={handleCheck} disabled>过牌 (Check)</button>
      <button onClick={handleCall} disabled>跟注 (Call)</button>
      <button onClick={handleRaise} disabled>加注 (Raise)</button>
    </div>
  );
};

export default PlayerActions;