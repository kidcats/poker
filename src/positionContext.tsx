import { useState, useEffect, useRef,createContext,useContext } from 'react';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number; 
}

const PositionContext = createContext<Position | undefined>(undefined);

export const usePosition = () => {
  const [position, setPosition] = useState<Position>();

  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const rect = elementRef.current!.getBoundingClientRect();
      setPosition({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      });
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  return position;
}

interface PositionProviderProps {
  children: React.ReactNode;
}

export const PositionProvider: React.FC<PositionProviderProps> = ({children}) => {
  const position = usePosition();

  return (
    <PositionContext.Provider value={position}>
      {children}
    </PositionContext.Provider>  
  );
}

export const usePositionContext = () => {
  return useContext(PositionContext);
}