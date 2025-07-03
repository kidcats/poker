// src/components/PlayerActions.tsx

import React from 'react';

// 定义组件接收的props类型
interface PlayerActionsProps {
  isMyTurn: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  raiseAmount: number;
  minRaiseAmount: number;
  maxRaiseAmount: number;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: () => void;
  onRaiseAmountChange: (amount: number) => void;
}

const PlayerActions: React.FC<PlayerActionsProps> = ({
  isMyTurn,
  canCheck,
  canCall,
  callAmount,
  raiseAmount,
  minRaiseAmount,
  maxRaiseAmount,
  onFold,
  onCheck,
  onCall,
  onRaise,
  onRaiseAmountChange,
}) => {
  return (
    <div className="player-actions">
      <button onClick={onFold} disabled={!isMyTurn}>弃牌</button>
      <button onClick={onCheck} disabled={!canCheck}>过牌</button>
      <button onClick={onCall} disabled={!canCall}>跟注 {canCall ? callAmount : ''}</button>
      <div className="raise-control">
        <button onClick={onRaise} disabled={!isMyTurn}>加注</button>
        <input
          type="range"
          min={minRaiseAmount}
          max={maxRaiseAmount}
          step="10"
          value={raiseAmount}
          onChange={(e) => onRaiseAmountChange(parseInt(e.target.value, 10))}
          disabled={!isMyTurn}
        />
        <span>{raiseAmount}</span>
      </div>
    </div>
  );
};

export default PlayerActions;