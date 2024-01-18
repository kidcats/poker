import { useState, useEffect } from "react";
import { useSprings, animated, to } from '@react-spring/web';
import './deck.scss';
import { usePosition } from "./positionContext";
import { calculatePosition } from "./utils"

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

const toNew = (clicked: boolean, cardX: number, cardY: number, rotate: number): CardProps => {
    return {
        x: clicked ? cardX : 0,
        y: clicked ? cardY : 0,
        rot: clicked ? rotate : 0,
        scale: clicked ? 1 : 1,
        clicked
    };
};




const Deck: React.FC = () => {
    const [clickedIndices, setClickedIndices] = useState(Array(cards.length).fill(false));

    const position = usePosition().position;
    const x = 0;
    const y = 0;
    const r = 0;
    const [springs, api] = useSprings(cards.length, index => ({
        ...from(),
        ...toNew(clickedIndices[index], x, y, r),
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
            const { cardX, cardY, rotate } = calculatePosition(index, position)!;
            api.start(i => {
                if (index !== i) return;
                return toNew(newClickedIndices[i], cardX, cardY, rotate);
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
                                translate(${x}px, ${y}px)
                                rotate(${r}turn) 
                                scale(${s})`
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