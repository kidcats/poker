// App.tsx
import React from 'react';
import './App.css';
import PokerCard from './poker';
import Table from './table';
import { GameProvider } from './gamerNum';
import { RectangleProvider } from './rectangleContext';

function App() {
  return (
    <GameProvider>
      <div className="App">
        <div>
          <h1>德州扑克</h1>
          <RectangleProvider>
            <Table />
            <PokerCard />
          </RectangleProvider>
        </div>
      </div>
    </GameProvider>
  );
}

export default App;
