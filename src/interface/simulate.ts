import { Action,ActionType } from '../types/action';
import { Card,Suit,Rank } from '../types/card';


// Assuming Suit and Rank enums are defined as previously discussed.

function createDeck(): Promise<Card[]> {
  return new Promise<Card[]>((resolve) => {
    setTimeout(() => {
      let deck: Card[] = [];
      Object.values(Suit).forEach(suit => {
        Object.values(Rank).forEach(rank => {
          // Assuming Rank is an enum and its values are the ones we want to iterate over
          // This check ensures 'rank' is actually a value of 'Rank' enum
          if (typeof rank === 'number') {
            deck.push({ suit, rank, img: `/src/assets/${suit}_${rank}.svg` });
          }
        });
      });
      resolve(deck);
    }, 1000); // Simulating a 1-second delay
  });
}

function shuffleDeck(deck: Card[]): Promise<Card[]> {
  return new Promise<Card[]>((resolve) => {
    setTimeout(() => {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // ES6 array destructuring syntax to swap elements
      }
      resolve(deck);
    }, 500); // Simulating a 0.5-second delay
  });
}

// deal two cards to each player
async function dealCards(deck: Card[], players: number): Promise<Card[][]> {
  return new Promise<Card[][]>((resolve) => {
    setTimeout(() => {
      let hands: Card[][] = [];
      for (let i = 0; i < players; i++) {
        hands.push([deck.pop()!, deck.pop()!]);
      }
      resolve(hands);
    }, 150); // Simulating a 1.5-second delay
  });
}

// betting round
async function bettingRound(players: number): Promise<Action[]> {
  return new Promise<Action[]>((resolve) => {
    setTimeout(() => {
      let actions: Action[] = [];
      for (let i = 0; i < players; i++) {
        actions.push({ type: ActionType.Check });
      }
      resolve(actions);
    }, 200); // Simulating a 2-second delay
  });
}