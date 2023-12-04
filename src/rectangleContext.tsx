// contexts/RectangleContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定义上下文值的类型
interface RectProb {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface RectangleContextProps {
  rectangle: RectProb;
  setRectangle: React.Dispatch<React.SetStateAction<RectProb>>;
}

// 创建上下文对象
const RectangleContext = createContext<RectangleContextProps | undefined>(undefined);

// 定义提供者组件的 Props 类型
interface RectangleProviderProps {
  children: ReactNode;
}

export const RectangleProvider: React.FC<RectangleProviderProps> = ({ children }) => {
  const [rectangle, setRectangle] = useState({
    x: 100,
    y: 1000,
    width: 1000,
    height: 1000,
  });

  // 提供上下文的值
  const contextValue: RectangleContextProps = {
    rectangle,
    setRectangle,
  };

  return <RectangleContext.Provider value={contextValue}>{children}</RectangleContext.Provider>;
}

// 定义自定义 Hook 的返回类型
export const useRectangleContext = (): RectangleContextProps => {
  const context = useContext(RectangleContext);

  if (!context) {
    throw new Error('useRectangleContext must be used within a RectangleProvider');
  }

  return context;
}

export default useRectangleContext;