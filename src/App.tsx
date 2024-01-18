// App.tsx
import { useRef } from 'react';
import './App.css';
import Table from './table';
import { GameProvider } from './gamerNum';
import { PositionProvider } from './positionContext';
import Deck from './deck';

import { useState } from 'react';
import { useTransition } from 'react-spring';

import PokerChip from './chip';

function App() {

  return (
    <GameProvider>
      <PositionProvider>
        <div className="App">
          <h1>德州扑克</h1>
          <Table ></Table>
          <Deck />
          <PokerChip value={100} index = {0} />
          <PokerChip value={1} index = {0} />
          <PokerChip value={10} index = {0} />
          <PokerChip value={50} index = {0} />
          <PokerChip value={1000} index = {0} />
        </div>
      </PositionProvider>
    </GameProvider>
  );
}

export default App;
