// src/types/index.ts

/**
 * 扑克牌花色
 */
export enum Suit {
  SPADES = 'spades',    // 黑桃
  HEARTS = 'hearts',    // 红心
  DIAMONDS = 'diamonds',// 方块
  CLUBS = 'clubs',      // 梅花
}

/**
 * 扑克牌点数 (2-10, J, Q, K, A)
 * 使用数字表示，便于比较大小。A可以作为14或1(用于A-5顺子)。
 */
export enum Rank {
  TWO = 2, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN,
  JACK = 11, QUEEN = 12, KING = 13, ACE = 14,
}

/**
 * 单张扑克牌的结构
 */
export interface Card {
  suit: Suit;
  rank: Rank;
}

/**
 * 玩家状态
 */
export enum PlayerStatus {
  WAITING = 'waiting',      // 等待加入游戏
  ACTIVE = 'active',        // 正在行动
  FOLDED = 'folded',        // 已弃牌
  ALL_IN = 'all-in',        // 已全下
  SITTING_OUT = 'sitting-out', // 筹码为0，旁观
}

/**
 * 玩家对象
 */
export interface Player {
  id: string;
  name: string;
  stack: number;         // 剩余筹码
  hand: Card[];          // 手牌
  currentRoundBet: number; // 本轮下注额
  status: PlayerStatus;  // 玩家当前状态
  isAI: boolean;
}

/**
 * 游戏阶段
 */
export enum GamePhase {
  WAITING,      // 等待玩家加入
  PRE_DEAL,     // 准备发牌 (洗牌、定庄家等)
  PRE_FLOP,     // 翻牌前下注轮
  FLOP,         // 翻牌圈
  TURN,         // 转牌圈
  RIVER,        // 河牌圈
  SHOWDOWN,     // 摊牌比大小
  ENDED,        // 本局结束
}

/**
 * Redux Store 中的游戏状态树
 */
export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[]; // 公共牌
  pot: number;            // 主底池
  gamePhase: GamePhase;
  currentPlayerIndex: number | null; // 当前行动玩家的索引
  dealerIndex: number;    // 庄家索引
  smallBlindIndex: number | null;
  bigBlindIndex: number | null;
  currentRoundBet: number; // 当前轮次的最高下注额
  lastRaiserIndex: number | null; // 本轮最后一个加注者的索引
  minRaiseAmount: number; // 最小加注额
  gameId:string | null;
  // NEW: 添加用于存储结算结果的字段
  showdownResults: { player: Player, handResult: HandResult }[] | null;
}

/**
 * 牌型等级
 */
export enum HandType {
  HIGH_CARD,      // 高牌
  ONE_PAIR,       // 一对
  TWO_PAIR,       // 两对
  THREE_OF_A_KIND, // 三条
  STRAIGHT,       // 顺子
  FLUSH,          // 同花
  FULL_HOUSE,     // 葫芦
  FOUR_OF_A_KIND, // 四条
  STRAIGHT_FLUSH, // 同花顺
  ROYAL_FLUSH,    // 皇家同花顺
}

/**

 * 评估一手牌后的结果
 */
export interface HandResult {
  type: HandType;
  values: number[]; // 用于比较大小。例如，对于一对A，kicker是K,Q,J，values可能是[14, 13, 12, 11]
  handName: string; // "同花顺", "葫芦" 等
}