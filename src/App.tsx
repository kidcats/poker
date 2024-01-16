// App.tsx
import { useRef } from 'react';
import './App.css';
import PokerCard from './poker';
import Table from './table';
import { GameProvider } from './gamerNum';
import { PositionProvider } from './positionContext';
import Deck from './deck';
import PokerChip from './chip';

function App() {
  const tableRef = useRef<HTMLDivElement>(null);
  return (
    <GameProvider>
      <PositionProvider>
        <div className="App">
          <h1>德州扑克</h1>
          <Table ></Table>
          <Deck />
          <PokerChip value={100} />
        </div>
      </PositionProvider>
    </GameProvider>
  );
}

export default App;
