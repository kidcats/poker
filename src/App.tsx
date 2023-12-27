// App.tsx
import React from 'react';
import './App.css';
import PokerCard from './poker';
import Table from './table';
import { GameProvider } from './gamerNum';
import { RectangleProvider } from './rectangleContext';
import Deck from './deck';

function App() {
  return (
    <GameProvider>
      <RectangleProvider>
        <div className="App">
          <div>
            <h1>德州扑克</h1>
            <Table />
            <Deck />
          </div>

        </div>
      </RectangleProvider>
    </GameProvider>
  );
}

export default App;
