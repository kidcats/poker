import { useState, useEffect } from "react";
import { useSprings, animated, to } from '@react-spring/web';
import './deck.scss';
import { usePosition } from "./positionContext";
import { calculatePosition, calculateCenterPosition } from "./utils"
import { useDispatch, useSelector } from "react-redux";
import { roundSelector } from "./gameRoundSlice";


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
    './assets/clubs_K.svg',
    './assets/clubs_Q.svg',
    './assets/clubs_J.svg',
    './assets/clubs_10.svg',
    './assets/clubs_9.svg',
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

const toPublic = (clicked: boolean, cardX: number, cardY: number, rotate: number): CardProps => {
    return {
        x: clicked ? cardX : 0,
        y: clicked ? cardY : 0,
        rot: clicked ? rotate : 0,
        scale: 1,
        clicked
    };
}

interface DeckProps {
    round: number;
    playerCount: number;
}


const Deck: React.FC<DeckProps> = (props) => {
    const [clickedIndices, setClickedIndices] = useState(Array(cards.length).fill(false));
    // 用于记录当前游戏的轮次
    const gameRound = useSelector(roundSelector);
    // 创建一个dispatch，用于发送action更新状态
    const dispatch = useDispatch();



    const x = 0;
    const y = 0;
    const r = 0;
    const [springs, api] = useSprings(cards.length, index => ({
        ...from(),
        ...toNew(clickedIndices[index], x, y, r),
    }));
    // 现在点击的时候会根据Index来更新牌的位置，现在要改了
    // 
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
            const newClickedIndices = [...prev];// 这里获取当前的是否已经点击标志
            // if (index < 10) {  // 如果小于10说明是玩家手里的牌
            //     const { cardX, cardY, rotate } = calculatePosition(index, position)!;
            //     api.start(i => {
            //         if (index !== i) return;
            //         return toNew(newClickedIndices[i], cardX, cardY, rotate);
            //     });
            // } else {
            //     const { cardX, cardY, rotate } = calculateCenterPosition(index - 10)!;
            //     api.start(i => {
            //         if (index !== i) return;
            //         return toPublic(newClickedIndices[i], cardX, cardY, rotate);
            //     });
            // }
            return newClickedIndices;
        })
    };


    const position = usePosition().position;
    // 在组件渲染时操作状态
    useEffect(() => {
        // 这里拿到的是最新的状态
        // 首先根据当前的轮次判断这些牌要去哪里
        console.log('position', position);
        if (position) {
            if (gameRound === 1) {
                // 说明是翻前，牌要去玩家的面前,话说我的index要怎么处理？
                for (let i = 0; i < 10; i++) {
                    const { cardX, cardY, rotate } = calculatePosition(i, position)!;
                    api.start(i => {
                        return toNew(clickedIndices[i], cardX, cardY, rotate);
                    });
                }
                /// 同时发5张背面的公共牌在牌桌上
                for (let i = 10; i < 15; i++) {
                    const { cardX, cardY, rotate } = calculateCenterPosition(i-10)!;
                    api.start(i => {
                        return toPublic(clickedIndices[i], cardX, cardY, rotate);
                    });
                }
            }
        }
        console.log('clickedIndices', clickedIndices);
    }, [clickedIndices,gameRound]);
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