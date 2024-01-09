import { useState, useEffect } from "react";
import { useSprings, animated, to } from '@react-spring/web';
import './deck.css';
import { Position, usePosition } from "./positionContext";

const cards = [
    './assets/spades_A.svg',
    './assets/spades_A.svg',
    './assets/spades_A.svg',
    './assets/hearts_A.svg',
    './assets/hearts_A.svg',
    './assets/hearts_A.svg',
    './assets/diamonds_A.svg',
    './assets/diamonds_A.svg',
    './assets/diamonds_A.svg',
    './assets/clubs_A.svg',
    './assets/clubs_A.svg',
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

const toNew = (clicked: boolean, cardX: number,cardY: number): CardProps => {
    return {
        x: clicked ? cardX : 0,
        y: clicked ? cardY : 0,
        rot: clicked ? 0 : 0,
        scale: clicked ? 1 : 1,
        clicked
    };
};


  // 计算位置，可以分为两组，一组在椭圆上，一组在矩形上
// 首先是椭圆的，现在假设都以中心为远点
// 0<= index < 6 的都在椭圆上
// 方程为 如果 0<theta<pi/2 or 3pi/2<theta<2pi x = 0.4*w*cos(theta) + w/2 y = 0.8*h*sin(theta)
// 如果 pi/2<theta<3pi/2 x = 0.4*w*cos(theta) - w/2 y = 0.8*h*sin(theta)
// 如果 6<=index<9 说明都在矩形上边缘 对应的位置为 x = () y = h/2
// 如果 9<=index<12 说明都在矩形下边缘 对应的位置为 x = () y = -h/2
// 现在需要考虑，我要从哪里获取table的位置和宽度，我需要知道的是table的位置和宽度是随时变化的，所以我需要一个context来存储这些信息
// 
const calculatePosition = (index: number,position:Position|null) => {
    console.log('position',position);
    if (!position) return;
    const { x, y, width, height } = position;
    var cardX:number = 0;
    var cardY:number = 0;
    if (index < 2) {
      const theta = Math.PI * (index+0) / 4;
      cardX = 0.2 * width * Math.cos(theta) + width * 0.3;
      cardY = -0.4 * height * Math.sin(theta);
    }else if(index < 5){
      const theta = Math.PI * (index+1) / 4;
      cardX = 0.2 * width * Math.cos(theta) - (width * 0.3 );
      cardY = -0.4 * height * Math.sin(theta);
    }else if (index < 6){
      const theta = Math.PI * (index+2) / 4;
      cardX = 0.2 * width * Math.cos(theta) + width * 0.3;
      cardY = -0.4 * height * Math.sin(theta);
    }else if (index < 9) {
      cardX = (index - 6) * (width * 0.2 ) - width * 0.2;
      cardY = -height / 2;
    }else if (index < 12) {
      cardX = (index - 9) * (width * 0.2) - width * 0.2;
      cardY = height / 2;
    }else{
      cardX = 0;
      cardY = 0;
    }
    // 最后所有的结果都要还原到以文档左上角为原点的坐标系中
    console.log('cardX',cardX + x);
    console.log('cardY',cardY + y);
    console.log('x',x);
    console.log('y',y);
    console.log('width',width);
    console.log('height',height); 
    console.log('index',index);
    return { cardX: cardX, cardY: cardY };
  }

const Deck: React.FC = () => {
    const [clickedIndices, setClickedIndices] = useState(Array(cards.length).fill(false));

    const position = usePosition().position;
    const x = 0;
    const y = 0;
    const [springs, api] = useSprings(cards.length, index => ({
        ...from(),
        ...toNew(clickedIndices[index],x,y),
    }));
    const handleCardClick = (index: number) => {

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
            const {cardX,cardY} = calculatePosition(index,position)!;
            api.start(i => {
                if (index !== i) return;
                return toNew(newClickedIndices[i],cardX,cardY);
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