// contexts/GameContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定义上下文值的类型
interface GameContextProps {
  playerCount: number;
  setPlayerCount: React.Dispatch<React.SetStateAction<number>>;
}

// 创建上下文对象
const GameContext = createContext<GameContextProps | undefined>(undefined);

// 定义提供者组件的 Props 类型
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [playerCount, setPlayerCount] = useState(4);

  // 提供上下文的值
  const contextValue: GameContextProps = {
    playerCount,
    setPlayerCount,
  };

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
}

// 定义自定义 Hook 的返回类型
export const useGameContext = (): GameContextProps => {
  const context = useContext(GameContext);              

  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }

  return context;
}

export default useGameContext;