// src/shared-types.ts

// ========================================================================
// ==                 这是整个项目唯一的类型定义来源                   ==
// ========================================================================

export enum Rank {
  TWO = 2, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING, ACE
}

// 我们统一使用符号，这更直观
export enum Suit {
  SPADES = '♠',
  HEARTS = '♥',
  DIAMONDS = '♦',
  CLUBS = '♣'
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export enum PlayerStatus {
  WAITING, ACTIVE, FOLDED, ALL_IN, SITTING_OUT
}

export interface Player {
  id: string;
  name: string;
  stack: number;
  hand: Card[];
  currentRoundBet: number;
  status: PlayerStatus;
  isAI: boolean;
  position?: string;
}

export enum GamePhase {
  WAITING, PRE_DEAL, PRE_FLOP, FLOP, TURN, RIVER, SHOWDOWN, ENDED
}

export enum HandType {
  HIGH_CARD, ONE_PAIR, TWO_PAIR, THREE_OF_A_KIND, STRAIGHT, FLUSH, FULL_HOUSE, FOUR_OF_A_KIND, STRAIGHT_FLUSH, ROYAL_FLUSH
}

export interface HandResult {
  type: HandType;
  values: number[];
  handName: string;
}

export interface ShowdownResult {
  player: Player;
  handResult: HandResult;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  gamePhase: GamePhase;
  currentPlayerIndex: number | null;
  dealerIndex: number;
  smallBlindIndex: number | null;
  bigBlindIndex: number | null;
  currentRoundBet: number;
  lastRaiserIndex: number | null;
  minRaiseAmount: number;
  gameId: string | null;
  showdownResults: ShowdownResult[] | null;
}

// ========================================================================
// ==                      共享的行动类型 (无变化)                       ==
// ========================================================================
export enum ActionType {
    FOLD, CHECK, CALL, RAISE
}
export interface BasePlayerAction { playerId: string; }
export interface FoldAction extends BasePlayerAction { type: ActionType.FOLD; }
export interface CheckAction extends BasePlayerAction { type: ActionType.CHECK; }
export interface CallAction extends BasePlayerAction { type: ActionType.CALL; }
export interface RaiseAction extends BasePlayerAction { type: ActionType.RAISE; amount: number; }
export type PlayerAction = FoldAction | CheckAction | CallAction | RaiseAction;