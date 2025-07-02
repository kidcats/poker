import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { Player, Card, GamePhase, GameState, Suit, Rank, PlayerStatus, HandType, HandResult } from '../types';

// ========================================================================
// ==                           常量定义 (无变化)                        ==
// ========================================================================
const SMALL_BLIND_AMOUNT = 10;
const BIG_BLIND_AMOUNT = 20;

const initialState: GameState = {
  players: [],
  deck: [],
  communityCards: [],
  pot: 0,
  gamePhase: GamePhase.WAITING,
  currentPlayerIndex: null,
  dealerIndex: -1,
  smallBlindIndex: null,
  bigBlindIndex: null,
  currentRoundBet: 0,
  lastRaiserIndex: null,
  minRaiseAmount: 0,
  gameId:null,
  showdownResults: null, // <-- 初始化新字段
};

// ========================================================================
// ==                      Hand Evaluation Logic (无变化)                ==
// ========================================================================
// ... (evaluateHand, findStraight, compareHands 函数保持不变)
const evaluateHand = (allCards: Card[]): HandResult => {
    const sortedCards = [...allCards].sort((a, b) => b.rank - a.rank);
    const flushSuit: { [key in Suit]?: Card[] } = {};
    sortedCards.forEach(c => {
        if (!flushSuit[c.suit]) flushSuit[c.suit] = [];
        flushSuit[c.suit]!.push(c);
    });
    for (const suit in flushSuit) {
        const flushCards = flushSuit[suit as Suit]!;
        if (flushCards.length >= 5) {
            const straightFlushResult = findStraight(flushCards);
            if (straightFlushResult) {
                if (straightFlushResult.values[0] === Rank.ACE) return { type: HandType.ROYAL_FLUSH, values: straightFlushResult.values, handName: '皇家同花顺' };
                return { type: HandType.STRAIGHT_FLUSH, values: straightFlushResult.values, handName: '同花顺' };
            }
            return { type: HandType.FLUSH, values: flushCards.slice(0, 5).map(c => c.rank), handName: '同花' };
        }
    }
    const straightResult = findStraight(sortedCards);
    if (straightResult) return { type: HandType.STRAIGHT, values: straightResult.values, handName: '顺子' };
    const rankCounts: { [rank: number]: number } = {};
    sortedCards.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1; });
    const quads: number[] = [], trips: number[] = [], pairs: number[] = [];
    Object.entries(rankCounts).forEach(([rank, count]) => {
        const rankNum = parseInt(rank, 10);
        if (count === 4) quads.push(rankNum);
        else if (count === 3) trips.push(rankNum);
        else if (count === 2) pairs.push(rankNum);
    });
    quads.sort((a, b) => b - a); trips.sort((a, b) => b - a); pairs.sort((a, b) => b - a);
    const getKickers = (excludeRanks: number[], count: number) => sortedCards.filter(c => !excludeRanks.includes(c.rank)).slice(0, count).map(c => c.rank);
    if (quads.length > 0) {
        const kicker = getKickers([quads[0]], 1);
        return { type: HandType.FOUR_OF_A_KIND, values: [quads[0], ...kicker], handName: '四条' };
    }
    if (trips.length > 0 && pairs.length > 0) return { type: HandType.FULL_HOUSE, values: [trips[0], pairs[0]], handName: '葫芦' };
    if (trips.length > 1) return { type: HandType.FULL_HOUSE, values: [trips[0], trips[1]], handName: '葫芦' };
    if (trips.length > 0) {
        const kickers = getKickers([trips[0]], 2);
        return { type: HandType.THREE_OF_A_KIND, values: [trips[0], ...kickers], handName: '三条' };
    }
    if (pairs.length >= 2) {
        const kicker = getKickers([pairs[0], pairs[1]], 1);
        return { type: HandType.TWO_PAIR, values: [pairs[0], pairs[1], ...kicker], handName: '两对' };
    }
    if (pairs.length === 1) {
        const kickers = getKickers([pairs[0]], 3);
        return { type: HandType.ONE_PAIR, values: [pairs[0], ...kickers], handName: '一对' };
    }
    return { type: HandType.HIGH_CARD, values: sortedCards.slice(0, 5).map(c => c.rank), handName: '高牌' };
};
const findStraight = (cards: Card[]): { values: number[] } | null => {
    const uniqueRanks = [...new Set(cards.map(c => c.rank))];
    if (uniqueRanks.includes(Rank.ACE)) uniqueRanks.push(1);
    uniqueRanks.sort((a, b) => b - a);
    if (uniqueRanks.length < 5) return null;
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
        const slice = uniqueRanks.slice(i, i + 5);
        if (slice[0] - slice[4] === 4) return { values: slice };
    }
    return null;
};
const compareHands = (hand1: HandResult, hand2: HandResult): number => {
    if (hand1.type !== hand2.type) return hand1.type - hand2.type;
    for (let i = 0; i < hand1.values.length; i++) {
        if (hand1.values[i] !== hand2.values[i]) return hand1.values[i] - hand2.values[i];
    }
    return 0;
};
// ========================================================================
// ==                           辅助函数 (无变化)                        ==
// ========================================================================
const findNextActivePlayer = (players: Player[], startIndex: number): number | null => {
  const numPlayers = players.length;
  if (numPlayers === 0) return null;
  for (let i = 1; i <= numPlayers; i++) {
    const index = (startIndex + i) % numPlayers;
    const player = players[index];
    if (player.status === PlayerStatus.ACTIVE) return index;
  }
  return null;
};
const findNextPlayerForTurn = (players: Player[], startIndex: number): number | null => {
    const numPlayers = players.length;
    if (numPlayers === 0) return null;
    for (let i = 1; i <= numPlayers; i++) {
      const index = (startIndex + i) % numPlayers;
      const player = players[index];
      if (player.status !== PlayerStatus.SITTING_OUT && player.status !== PlayerStatus.FOLDED) return index;
    }
    return null;
};

// ========================================================================
// ==                           Game Slice (有修改)                      ==
// ========================================================================
const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayer: (state: GameState, action: PayloadAction<{ id: string, name: string, stack: number, isAI: boolean }>) => {
      if (state.gamePhase === GamePhase.WAITING) {
        const newPlayer: Player = { ...action.payload, hand: [], currentRoundBet: 0, status: PlayerStatus.WAITING };
        state.players.push(newPlayer);
      }
    },
    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // MODIFIED: startGame 现在需要重置 showdownResults
    startGame: (state: GameState) => {
      const playersWithStack = state.players.filter(p => p.stack > 0);
      if (playersWithStack.length < 2 || (state.gamePhase !== GamePhase.WAITING && state.gamePhase !== GamePhase.ENDED)) return;
      state.showdownResults = null; // 重置结算结果
      state.gamePhase = GamePhase.PRE_DEAL;
      state.gameId = `game-${Date.now()}`; // <-- 生成新的、唯一的 gameId
      // ... (startGame 的其余部分保持不变)
      state.communityCards = [];
      state.pot = 0;
      state.currentRoundBet = 0;
      state.players.forEach(p => {
        p.hand = [];
        p.currentRoundBet = 0;
        p.status = p.stack > 0 ? PlayerStatus.ACTIVE : PlayerStatus.SITTING_OUT;
      });
      state.deck = [];
      const suits = Object.values(Suit); const ranks = Object.values(Rank).filter(r => typeof r === 'number') as Rank[];
      for (const suit of suits) { for (const rank of ranks) { state.deck.push({ suit, rank }); } }
      for (let i = state.deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]]; }
      state.dealerIndex = findNextPlayerForTurn(state.players, state.dealerIndex) ?? 0;
      const sbIndex = findNextPlayerForTurn(state.players, state.dealerIndex)!;
      const bbIndex = findNextPlayerForTurn(state.players, sbIndex)!;
      state.smallBlindIndex = sbIndex;
      state.bigBlindIndex = bbIndex;
      const sbPlayer = state.players[sbIndex];
      const bbPlayer = state.players[bbIndex];
      const sbBet = Math.min(SMALL_BLIND_AMOUNT, sbPlayer.stack);
      sbPlayer.stack -= sbBet; sbPlayer.currentRoundBet = sbBet; state.pot += sbBet;
      if (sbPlayer.stack === 0) sbPlayer.status = PlayerStatus.ALL_IN;
      const bbBet = Math.min(BIG_BLIND_AMOUNT, bbPlayer.stack);
      bbPlayer.stack -= bbBet; bbPlayer.currentRoundBet = bbBet; state.pot += bbBet;
      if (bbPlayer.stack === 0) bbPlayer.status = PlayerStatus.ALL_IN;
      state.currentRoundBet = BIG_BLIND_AMOUNT;
      state.minRaiseAmount = BIG_BLIND_AMOUNT * 2;
      for (let i = 0; i < 2; i++) {
        for (const player of state.players) {
          if (player.status !== PlayerStatus.SITTING_OUT) player.hand.push(state.deck.pop()!);
        }
      }
      state.gamePhase = GamePhase.PRE_FLOP;
      state.currentPlayerIndex = findNextActivePlayer(state.players, bbIndex)!;
      state.lastRaiserIndex = state.currentPlayerIndex;
    },
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // MODIFIED: fold 现在需要检查是否只剩一人，如果是则直接结算
    fold: (state: GameState) => {
      if (state.currentPlayerIndex === null) return;
      const player = state.players[state.currentPlayerIndex];
      if (!player || player.status !== PlayerStatus.ACTIVE) return;
      player.status = PlayerStatus.FOLDED;

      // 检查是否只剩一个未弃牌的玩家
      const activeOrAllInPlayers = state.players.filter(p => p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.SITTING_OUT);
      if (activeOrAllInPlayers.length <= 1) {
          gameSlice.caseReducers.internal_handleShowdown(state);
          return;
      }

      gameSlice.caseReducers.internal_advanceAction(state);
    },
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    
    check: (state: GameState) => { /* ... (无变化) ... */
      if (state.currentPlayerIndex === null) return;
      const player = state.players[state.currentPlayerIndex];
      if (!player || player.status !== PlayerStatus.ACTIVE) return;
      if (player.currentRoundBet < state.currentRoundBet) return;
      gameSlice.caseReducers.internal_advanceAction(state);
    },
    call: (state: GameState) => { /* ... (无变化) ... */
      if (state.currentPlayerIndex === null) return;
      const player = state.players[state.currentPlayerIndex];
      if (!player || player.status !== PlayerStatus.ACTIVE) return;
      const amountToCall = state.currentRoundBet - player.currentRoundBet;
      if (amountToCall <= 0) return;
      const betAmount = Math.min(amountToCall, player.stack);
      player.stack -= betAmount; player.currentRoundBet += betAmount; state.pot += betAmount;
      if (player.stack === 0) player.status = PlayerStatus.ALL_IN;
      gameSlice.caseReducers.internal_advanceAction(state);
    },
    raise: (state: GameState, action: PayloadAction<number>) => { /* ... (无变化) ... */
      if (state.currentPlayerIndex === null) return;
      const player = state.players[state.currentPlayerIndex];
      const raiseAmount = action.payload;
      if (!player || player.status !== PlayerStatus.ACTIVE) return;
      const totalBetInFront = player.currentRoundBet + player.stack;
      const finalRaiseAmount = Math.min(raiseAmount, totalBetInFront);
      if (finalRaiseAmount < state.minRaiseAmount && finalRaiseAmount < totalBetInFront) return;
      const amountToBet = finalRaiseAmount - player.currentRoundBet;
      player.stack -= amountToBet; player.currentRoundBet += amountToBet; state.pot += amountToBet;
      const oldRoundBet = state.currentRoundBet;
      state.currentRoundBet = player.currentRoundBet;
      state.minRaiseAmount = state.currentRoundBet + (state.currentRoundBet - oldRoundBet);
      state.lastRaiserIndex = state.currentPlayerIndex;
      if (player.stack === 0) player.status = PlayerStatus.ALL_IN;
      gameSlice.caseReducers.internal_advanceAction(state);
    },
    internal_advanceAction: (state: GameState) => { /* ... (无变化) ... */
      const activeOrAllInPlayers = state.players.filter(p => p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.SITTING_OUT);
      if (activeOrAllInPlayers.length <= 1) {
          gameSlice.caseReducers.internal_handleShowdown(state);
          return;
      }
      const nextPlayerIndex = findNextActivePlayer(state.players, state.currentPlayerIndex!);
      const activePlayersLeftToAct = state.players.filter(p => p.status === PlayerStatus.ACTIVE).length;
      if(activePlayersLeftToAct === 0) {
        gameSlice.caseReducers.internal_advanceToNextPhase(state);
        return;
      }
      if (nextPlayerIndex === state.lastRaiserIndex) {
          gameSlice.caseReducers.internal_advanceToNextPhase(state);
      } else {
          state.currentPlayerIndex = nextPlayerIndex;
      }
    },
    internal_advanceToNextPhase: (state: GameState) => { /* ... (无变化) ... */
      if (state.gamePhase >= GamePhase.RIVER) {
        gameSlice.caseReducers.internal_handleShowdown(state);
        return;
      }
      state.players.forEach(p => { p.currentRoundBet = 0; });
      state.currentRoundBet = 0;
      state.minRaiseAmount = BIG_BLIND_AMOUNT;
      const firstToAct = findNextActivePlayer(state.players, state.dealerIndex);
      state.currentPlayerIndex = firstToAct;
      state.lastRaiserIndex = firstToAct;
      switch (state.gamePhase) {
        case GamePhase.PRE_FLOP:
          state.gamePhase = GamePhase.FLOP;
          state.deck.pop();
          for (let i = 0; i < 3; i++) state.communityCards.push(state.deck.pop()!);
          break;
        case GamePhase.FLOP:
          state.gamePhase = GamePhase.TURN;
          state.deck.pop();
          state.communityCards.push(state.deck.pop()!);
          break;
        case GamePhase.TURN:
          state.gamePhase = GamePhase.RIVER;
          state.deck.pop();
          state.communityCards.push(state.deck.pop()!);
          break;
      }
      const activePlayers = state.players.filter(p => p.status === PlayerStatus.ACTIVE);
      if (activePlayers.length <= 1) {
          while(state.communityCards.length < 5) {
            state.deck.pop();
            state.communityCards.push(state.deck.pop()!);
          }
          gameSlice.caseReducers.internal_handleShowdown(state);
      }
    },

    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // MODIFIED: 全新的、完整的 showdown 逻辑
    internal_handleShowdown: (state: GameState) => {
      state.gamePhase = GamePhase.SHOWDOWN;
      state.currentPlayerIndex = null; // 摊牌阶段没有当前玩家

      // 找出所有未弃牌的玩家（竞争者）
      const contenders = state.players.filter(p => p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.SITTING_OUT);
      
      // 情况一：只有一个竞争者（其他人都弃牌了），直接获胜
      if (contenders.length === 1) {
          const winner = contenders[0];
          winner.stack += state.pot;
          // 记录下获胜结果，以便UI显示
          state.showdownResults = [{
              player: winner,
              handResult: { type: HandType.HIGH_CARD, values: [], handName: '对手全部弃牌' }
          }];
      } 
      // 情况二：多个竞争者，需要比牌
      else {
          // 1. 为每个竞争者评估手牌
          const evaluatedHands = contenders.map(player => ({
              player,
              handResult: evaluateHand([...player.hand, ...state.communityCards])
          }));

          // 2. 根据牌力从大到小排序
          evaluatedHands.sort((a, b) => compareHands(b.handResult, a.handResult));

          // 3. 找出所有赢家（处理平局情况）
          const bestHand = evaluatedHands[0];
          const winners = evaluatedHands.filter(
              hand => compareHands(hand.handResult, bestHand.handResult) === 0
          );
          
          // 4. 分配底池
          const potPerWinner = Math.floor(state.pot / winners.length);
          const remainder = state.pot % winners.length;

          winners.forEach((winnerInfo, index) => {
              const playerToUpdate = state.players.find(p => p.id === winnerInfo.player.id)!;
              playerToUpdate.stack += potPerWinner;
              // 将余下的筹码给第一个赢家 (通常是位置最靠前的)
              if (index === 0 && remainder > 0) {
                  playerToUpdate.stack += remainder;
              }
          });
          
          // 5. 记录下获胜结果
          state.showdownResults = winners;
      }
      
      state.pot = 0;
      state.gamePhase = GamePhase.ENDED; // 游戏正式结束
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
  },
});

export const { addPlayer, startGame, fold, check, call, raise } = gameSlice.actions;
export const selectGame = (state: RootState) => state.game;
export default gameSlice.reducer;