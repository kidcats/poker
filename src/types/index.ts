// src/types/index.ts

// ========================================================================
// ==                            卡牌定义 (Card)                         ==
// ========================================================================

// 您的 Suit 和 Rank 枚举定义得很好，我们直接采用
export enum Suit {
  Hearts = "hearts",
  Diamonds = "diamonds",
  Clubs = "clubs",
  Spades = "spades"
}

export enum Rank {
  Two = "2", Three = "3", Four = "4", Five = "5", Six = "6",
  Seven = "7", Eight = "8", Nine = "9", Ten = "10",
  Jack = "J", Queen = "Q", King = "K", Ace = "A"
}

export interface Card {
  suit: Suit;
  rank: Rank;
  img?: string; // img 是UI表现，设为可选，因为核心逻辑不一定需要它
}


// ========================================================================
// ==                            玩家定义 (Player)                         ==
// ========================================================================

// 使用枚举来定义玩家状态，增强类型安全
export type PlayerStatus = 'waiting' | 'active' | 'folded' | 'all-in' | 'sitting-out';

// 这是合并了您所有 User/user 概念后的最终 Player 接口
export interface Player {
  id: string;             // 唯一ID
  name: string;           // 玩家昵称
  stack: number;          // 剩余筹码量 (stack)
  hand: Card[];           // 手中的两张私牌
  currentRoundBet: number; // 当前下注轮中，该玩家已下注的总额
  status: PlayerStatus;   // 玩家在牌局中的状态
  isAI: boolean;          // 是否为AI玩家
}


// ========================================================================
// ==                         玩家行动定义 (Action)                        ==
// ========================================================================

// 您的 ActionType 定义得很好，我们直接采用
export enum ActionType {
  Bet = "bet",
  Call = "call",
  Raise = "raise",
  Fold = "fold",
  Check = "check"
}

// 稍微改名为 PlayerAction 以区别于 Redux Action
export interface PlayerAction {
    type: ActionType;
    amount?: number; // 加注或下注的金额
}


// ========================================================================
// ==                         游戏状态定义 (Game State)                    ==
// ========================================================================

// 游戏阶段枚举，将您在 App.tsx 中的注释逻辑化
export enum GamePhase {
  WAITING,      // 0. 等待玩家加入
  PRE_DEAL,     //    准备阶段 (确定庄家/盲注)
  PRE_FLOP,     // 1. 翻牌前下注
  FLOP,         // 2. 翻牌圈下注
  TURN,         // 3. 转牌圈下注
  RIVER,        // 4. 河牌圈下注
  SHOWDOWN,     //    摊牌比大小
  ENDED,        //    本局结束，结算中
}

// 这是我们 Redux store 中的核心 state 结构，合并并优化了您的 GameStatus
export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  gamePhase: GamePhase;
  currentPlayerIndex: number | null; // 当前行动玩家的索引
  dealerIndex: number;               // 庄家按钮(Button)的索引
  smallBlindIndex: number | null;    // 小盲注玩家的索引
  bigBlindIndex: number | null;      // 大盲注玩家的索引
  currentRoundBet: number;           // 当前下注轮的最高下注额
  lastRaiserIndex: number | null;    // 最后一个加注的玩家索引，用于判断一轮是否结束
  minRaiseAmount: number;            // 当前轮的最小加注额
}