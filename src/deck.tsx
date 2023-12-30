import { click } from "@testing-library/user-event/dist/click";
import { useState } from "react";
import { useSprings, animated, interpolate } from '@react-spring/web';


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

const to = (clicked: boolean): CardProps => ({
    x: clicked ? 0 : Math.random() * 400 - 200,
    y: clicked ? 0 : Math.random() * 40 - 20,
    rot: clicked ? 0 : Math.random() * 180 - 90,
    scale: clicked ? 1.5 : 1,
    clicked,
});

const Deck: React.FC = () => {
    const [clickedIndices, setClickedIndices] = useState(Array(cards.length).fill(true)); 
    //const [springs,api] = useSprings(cards.length, cards.map((_, index) => ({
    //     ...from(),
    //     ...to(clickedIndices[index]),
    // })));

    const [springs,api] = useSprings(cards.length, index => ({
        ...from(),
        ...to(clickedIndices[index]),
    }));

    // 首先要确定一件事，就是网页是时时刻刻刷新的，所以当时将一个的点击换成了false,会带着以前的false一起刷新
    // 但是也不能让只让这一个点击的是true，如果这样就会让其他的自动复原，所以能不能想办法只刷新一个很重要
    // 思考一下，现在的核心问题是，所有的都在刷新，所以我需要一个东西去记住刷新的index，然后在执行的时候进行对比判断
    // 如果，我先看一下，别人是怎么实现的
    // 首先他使用了一个东西解决的，一个set
    // 然后usesprings同时带了两个参数，一个是length一个是i
    // 最后在在点击的时候，如果没有添加进去，就在set中添加进去
    // 然后利用api.start启动动画，i利用匿名函数捕获了一个i
    // 然后判断index是否等于i，如果不等于直接返回
    // 如果等于，再通过set获取当前的状态，
    // 通过当前的状态分别设定不同的x,值
    // 最后再通过当所有的set都设置完毕后，将他们返回原处
    //

    
    const handleCardClick = (index: number) => {
        api.start((i) => {
            if (index !== i) return;
            setClickedIndices((prevClickedIndeces: Array<boolean>) => {
                const newClickenIndices = new Array(...prevClickedIndeces);
                if (newClickenIndices[index]) {
                    newClickenIndices[index] = false;
                } else {
                    newClickenIndices[index] = true;
                }
                return newClickenIndices;
            });
        });
    }
    return <>
        {springs.map(({ x, y, rot, scale }, i) => (<animated.div
            className={'deck ${clickedIndices[i] ? "clicked" : ""}'}
            key={i}
            style={{ x, y }}
        >
            <animated.div
                className="card"
                style={{
                    transform: interpolate([rot, scale], (rot, scale) => `rotate(${rot}deg) scale(${scale})`),
                }}>
                <img src={getCardImage(i)} alt="card" onClick={() => handleCardClick(i)} />
            </animated.div>
        </animated.div>))}
    </>
}

export default Deck;