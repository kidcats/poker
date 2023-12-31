import { useState } from "react";
import { useSprings, animated, to } from '@react-spring/web';


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

const from = (): CardProps => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1.5,
    clicked: false,
});

const toNew = (clicked: boolean): CardProps => ({
    x: clicked ? 0 : Math.random() * 400 - 200,
    y: clicked ? 0 : Math.random() * 40 - 20,
    rot: clicked ? 0 : Math.random() * 180 - 90,
    scale: clicked ? 1.5 : 1,
    clicked,
});

const Deck: React.FC = () => {
    const [clickedIndices, setClickedIndices] = useState(Array(cards.length).fill(true)); 

    const [springs,api] = useSprings(cards.length, index => ({
        ...from(),
        ...toNew(clickedIndices[index]),
    }));
    // 我现在知道为什么点击事件不靠谱了，因为deck的面积太大了，如果点击刀
    // 两个deck之间重叠的部分，就会造成两个点击事件的冲突，所以现在首要的目标就是将
    // animated.div的面积缩小，然后将点击事件绑定到img上面
    const handleCardClick = (index: number) => {
        console.log('handleCardClick', index);
        // 思路是先更新对应的点击标志位
        setClickedIndices((prevClickedIndeces: Array<boolean>) => {
            const newClickenIndices = new Array(...prevClickedIndeces);
            if (newClickenIndices[index]) {
                newClickenIndices[index] = false;
            } else {
                newClickenIndices[index] = true;
            }
            return newClickenIndices;
        });
        // 然后通过index和i的值来判断，是否需要执行动画
        api.start((i) => {
            if (index !== i) return;
            return toNew(clickedIndices[i])
        });
    }
    return <>
        {springs.map(({ x, y, rot, scale }, i) => (
            <div className="deck">
            <animated.div
                key={i}
                style={{
                    x, y,
                    transform: to([rot, scale], (rot, scale) => `rotate(${rot}deg) scale(${scale})`),
                }}>
                <img src={getCardImage(i)} alt="card" onClick={() => handleCardClick(i)} />
            </animated.div>
            </div>
            ))}
    </>
}

export default Deck;