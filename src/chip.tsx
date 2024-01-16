import React, { useState, useEffect } from 'react';
import './chip.css';

interface PokerChipProps {
  value: number;
}

const PokerChip: React.FC<PokerChipProps> = ({ value }) => {
  const [chips, setChips] = useState(value);

  useEffect(() => {
    // Add animation effect when chips value changes
    const chipElement = document.getElementById(`chip-${value}`);
    if (chipElement) {
      chipElement.classList.add('chip-animate');

      // Remove animation class after the animation ends
      const animationEndHandler = () => {
        chipElement.classList.remove('chip-animate');
        chipElement.removeEventListener('animationend', animationEndHandler);
      };

      chipElement.addEventListener('animationend', animationEndHandler);
    }
  }, [value]);

  const addChips = (amount: number) => {
    setChips(chips + amount);
  };

  const removeChips = (amount: number) => {
    setChips(chips - amount);
  };

  return (
    <div className="poker-chip" id={`chip-${value}`}>
      <div className="chip-value">${value}</div>
      <div className="chip-quantity">{chips}</div>
      <button onClick={() => addChips(1)}>Add Chip</button>
      <button onClick={() => removeChips(1)}>Remove Chip</button>
    </div>
  );
};

export default PokerChip;
