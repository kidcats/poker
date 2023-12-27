import { click } from "@testing-library/user-event/dist/click";
import { useState } from "react";
import { useSprings, animated ,interpolate} from '@react-spring/web';


const cards = [
    './assets/spades_A.svg',
    './assets/hearts_A.svg',
    './assets/diamonds_A.svg',
    './assets/clubs_A.svg',
];

const getCardImage = (i:number) => {
    return require(`${cards[i]}`);
};

interface CardProps {
    x: number;
    y: number;
    rot: number;
    scale: number;
    clicked: boolean;
}

const from = () : CardProps => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1.5,
    clicked: false,
});

const to = (clicked:boolean) : CardProps => ({
    x: clicked ? 0 : Math.random() * 400 - 200,
    y: clicked ? 0 : Math.random() * 400 - 200,
    rot: clicked ? 0 : Math.random() *180 - 90,
    scale: clicked ? 1.5 : 1,
    clicked,
});

const Deck: React.FC = () => {
    const [clickedIndices,setClickedIndices] = useState<Set<number>>(new Set());
    const springs = useSprings(cards.length,cards.map((_,index) => ({
        ...from(),
        ...to(clickedIndices.has(index)),
    })));

    const handleCardClick = (index:number) => {
        setClickedIndices((prevClickedIndeces) => {
            const newClickenIndices = new Set(prevClickedIndeces);
            if (newClickenIndices.has(index)) {
                newClickenIndices.delete(index);
            } else {   
                newClickenIndices.add(index);
            }
            return newClickenIndices;
        });
    }
    return <>
    {springs.map(({x,y,rot,scale},i) => (<animated.div
    className={'deck ${clickedIndices.has(i) ? "clicked" : ""}'}
    key={i}
    style={{x,y}}
    onClick={() => handleCardClick(i)}  
    >
        <animated.div
        className="card"
        style={{
            transform: interpolate([rot,scale],(rot,scale) => `rotate(${rot}deg) scale(${scale})`),
        }}>
            <img src={getCardImage(i)} alt="card" />
        </animated.div>
    </animated.div>))}
    </>
}

export default Deck;