import { useState, useEffect } from "react";
import { useSprings, animated, to ,useTransition } from '@react-spring/web';
import './deck.scss';
import { usePosition } from "./positionContext";
import { calculatePosition, calculateCenterPosition } from "./utils"
import { useDispatch, useSelector } from "react-redux";
import { reset, roundSelector } from "./gameRoundSlice";
import { group } from "console";


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

const backImg = './assets/bg.svg';

const getCardImage = (i: number,flipped:boolean) => {
    if(flipped){
    return require(`${cards[i]}`);}
    else{
        return require(`${backImg}`);
    }
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
        // x: clicked ? cardX : 0,
        // y: clicked ? cardY : 0,
        // rot: clicked ? rotate : 0,
        x: cardX,
        y: cardY,
        rot: rotate,
        scale: clicked ? 1 : 1,
        clicked
    };
};

const toPublic = (clicked: boolean, cardX: number, cardY: number, rotate: number): CardProps => {
    return {
        x: cardX,
        y: cardY,
        rot: rotate,
        scale: 1,
        clicked
    };
}

interface DeckProps {
    round: number;
    playerCount: number;
}


const Deck: React.FC<DeckProps> = (props) => {
    const [moveDIndex, setMoved] = useState(Array(cards.length).fill(false));
    const [flippedArray,setFlipped] = useState(Array(cards.length).fill(false));
    // 用于记录当前游戏的轮次
    const gameRound = useSelector(roundSelector);
    // 创建一个dispatch，用于发送action更新状态
    const dispatch = useDispatch();


    const x = 0;
    const y = 0;
    const r = 0;
    const [springs, api] = useSprings(cards.length, index => ({
        ...from(),
        ...toNew(moveDIndex[index], x, y, r),
    }));
    // 现在点击的时候会根据Index来更新牌的位置，现在要改了


    // 在setState的回调函数中处理后续逻辑
    // 这里可以获取到更新后的状态
    const reverseCardMoved = () => {
        setMoved(prevClickedIndices => {
            return prevClickedIndices.map(clicked => !clicked);
        });
    };

    const handleCardClick = (index: number) => {
    };


    const position = usePosition().position;
    // 在组件渲染时操作状态
    useEffect(() => {
        if (gameRound === 1) {
          reverseCardMoved();
          // 牌面分发到玩家前
          for (let i = 0; i < 10; i++) {
            let { cardX, cardY, rotate } = calculatePosition(i, position)!;
            api.start( index => {
                if(i == index){
                    return toNew(moveDIndex[i], cardX, cardY, rotate);
                }
            });
            }
      
          // 发5张公共牌
          for (let i = 10; i < 15; i++) {
            let { cardX, cardY, rotate } = calculateCenterPosition(i - 10)!;
            api.start(index => {
                if(index == i){
                return toPublic(moveDIndex[i], cardX, cardY, rotate);
                }
            });
          }
        }else if (gameRound === 2){
            /// 如果等于2说明进入翻公共牌前三张的阶段
            const prev = [...flippedArray];
            prev[10] = true;
            prev[11] = true;
            prev[12] = true;
            setFlipped(prev);
        }else if(gameRound === 3){
            // 进入翻第4张牌
            const prev = [...flippedArray];
            prev[13] = true;
            setFlipped(prev);
        }else if(gameRound === 4){
            // 进入翻第5张牌就可以结算了
            const prev = [...flippedArray];
            prev[14] = true;
            setFlipped(prev);
        }else if(gameRound === 5){
            /// 游戏结束，可以结算了,同时重置游戏
            dispatch(reset());
        }
      
      }, [gameRound, api, position]); // 添加所有需要的依赖
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
                            ),
                        }}
                    >
                        <animated.img src={getCardImage(i,flippedArray[i])} alt="card" 
                        style={{
                            transform: rot.to(r => `perspective(600px) rotateY(${r}turn)`)
                        }}/>
                    </animated.div>
                ))
        }

    </>
}
export default Deck;