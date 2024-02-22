// App.tsx
import './App.css';
import { useState } from 'react';
import Table from './table';
import { PositionProvider } from './positionContext';
import Deck from './deck';
import PokerChip from './chip';
import { useDispatch } from 'react-redux';
import { apply } from './userArraySlice';
import { getUser } from './interface/getUser';
import { increment } from './gameRoundSlice';

/// 现在是什么，界面都画好了，现在可以开始写逻辑了
/// 总共是4个回合 翻前，翻后，转牌，河牌，所以可以定义一个状态，来表示当前是哪个回合
function App() {
  // 当状态为0的时候，表示游戏还没开始
  // 当状态为1的时候，表示是翻前，给所有玩家每人发两张牌，然后等待他们下注，所有人下注持平的时候，进行下一个回合，状态变为2
  // 当状态变为2的时候，表示是翻后，给三张公共牌，然后等待他们下注，所有人下注持平的时候，进行下一个回合，状态变为3
  // 当状态变为3的时候，表示是转牌，给一张公共牌，然后等待他们下注，所有人下注持平的时候，进行下一个回合，状态变为4
  // 当状态变为4的时候，表示是河牌，给一张公共牌，然后等待他们下注，所有人下注持平的时候，翻开所有人的牌，进行大小结算，然后进行下一个回合，状态变为0
  const [userIndex,setUserIndex] = useState(0);
  const dispatch = useDispatch();

  // 通过一个接口将一个用户添加到对应的全局状态数组中
  const applyGamehandleClick = () => {
    dispatch(apply(getUser(userIndex+'')));
  };
  const checkhandleClick = () => {

  };
  const callhandleClick = () => {

  };

  const raisehandleClick = () => {

  };

  const foldhandleClick = () => {

  };

  const leaveGamehandleClick = () => {

  };
  const increasehandleClick = () => { 
    dispatch(increment());
  }





  return (
    <PositionProvider>
      <div className="App">
        <h1>德州扑克</h1>
        <Table></Table>
        <Deck></Deck>
        <PokerChip value={100} index={0} />
        <PokerChip value={1} index={0} />
        <PokerChip value={10} index={0} />
        <PokerChip value={50} index={0} />
        <PokerChip value={1000} index={0} />
        <div className="bottom-bar">
          <button onClick={increasehandleClick}>
            increase
          </button>
          <button onClick={applyGamehandleClick}>
            apply game
          </button>
          <button onClick={checkhandleClick}>
            check
          </button>
          <button onClick={callhandleClick}>
            call
          </button>
          <button onClick={raisehandleClick}>
            raise
          </button>
          <button onClick={foldhandleClick}>
            fold
          </button>
          <button onClick={leaveGamehandleClick}>
            leave game
          </button>
        </div>
      </div>
    </PositionProvider>
  );
}

export default App;
