import { useState,useEffect } from "react";
import { useSprings, animated, to } from '@react-spring/web';
import './deck.css';

const cards = [
    './assets/spades_A.svg',
    './assets/hearts_A.svg',
    './assets/diamonds_A.svg',
    './assets/clubs_A.svg',
];

const getCardImage = (i: number) => {
    return require(`${cards[i]}`);
};

interface CardProps {
    x: number;
    y: number;
    rot: number;
    scale: number;
    clicked: boolean;
}

const from = () => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1,
    clicked: false,

    // Add center positioning
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)'
});

const toNew = (clicked: boolean): CardProps => ({
    x: clicked ? Math.random() * 400 - 200 : 0,
    y: clicked ? Math.random() * 40 - 20 : 0,
    rot: clicked ? Math.random() * 180 - 90 : 0,
    scale: clicked ? 1.5 : 1,
    clicked,
});

const Deck: React.FC = () => {
    const [clickedIndices, setClickedIndices] = useState(Array(cards.length).fill(false));

    const [springs, api] = useSprings(cards.length, index => ({
        ...from(),
        ...toNew(clickedIndices[index]),
    }));
    // 我现在知道为什么点击事件不靠谱了，因为deck的面积太大了，如果点击刀
    // 两个deck之间重叠的部分，就会造成两个点击事件的冲突，所以现在首要的目标就是将
    // animated.div的面积缩小，然后将点击事件绑定到img上面
    const handleCardClick = (index:number) => {

        setClickedIndices(prev => {
          // 更新点击状态
          const newClickedIndices = [...prev];
          newClickedIndices[index] = !newClickedIndices[index];
          return newClickedIndices;
        });
      
        // 在setState的回调函数中处理后续逻辑
        // 这里可以获取到更新后的状态
        setClickedIndices(prev => {
          const newClickedIndices = [...prev];
          
          api.start(i => {
            if(index !== i) return;
            return toNew(newClickedIndices[i]); 
          });
      
          return newClickedIndices;
        })
      
      };
      
      // 在组件渲染时操作状态
      useEffect(() => {
        // 这里拿到的是最新的状态
        console.log('clickedIndices', clickedIndices); 
      }, [clickedIndices]);
    return <>
        {
            springs.map
                (({ x, y, rot, scale }, i) => (
                    <animated.div
                        className="card" key={i} onClick={() => handleCardClick(i)}
                        style={{
                            transform: to([rot, scale, x, y], (r, s, x, y) =>
                                `translate(-50%, -50%) 
                                rotate(${r}deg) 
                                scale(${s})
                                translate(${x}px, ${y}px)`
                            )
                        }}
                    >
                        <img src={getCardImage(i)} alt="card" />
                    </animated.div>
                ))
        }

    </>
}

export default Deck;