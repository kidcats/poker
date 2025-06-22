import { createContext, useState, useEffect, useContext } from 'react';

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ContextValue {
  position: Position | null;
  updatePosition: (newPosition: Position) => void;
}

export const PositionContext = createContext<ContextValue | null>(null);

interface PositionProviderProps {
  children: React.ReactNode;
}


type Func = (...args: any[]) => any; 

const debounce = <T extends Func>(func: T, delay: number) => {

  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

export const PositionProvider: React.FC<PositionProviderProps> = ({children}) => {

  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const element = document.getElementById('game-table');
      if (!element) return;

      const rect = element.getBoundingClientRect();
      setPosition({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height  
      });
    };
    
    const debouncedResize = debounce(handleResize, 100);
    window.addEventListener('resize', debouncedResize);

    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  const updatePosition = (newPosition: Position) => {
    setPosition(newPosition);
  };

  return (
    <PositionContext.Provider value={{position, updatePosition}}>
      {children}
    </PositionContext.Provider>
  );

};

export const usePosition = () => {
  const context = useContext(PositionContext);
  if (!context) throw Error('Missing context');
  return context;
};


export default PositionProvider;