import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { Player, Card, GamePhase, GameState, Suit, Rank } from '../types';

// ========================================================================
// ==                           常量定义                                 ==
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
};

// ========================================================================
// ==                           辅助函数                                 ==
// ========================================================================

/**
 * 寻找从指定位置开始的下一个可以行动的玩家。
 * @param players - 玩家数组
 * @param startIndex - 从哪个索引开始寻找
 * @returns 返回下一个可行动玩家的索引，如果没找到则返回 null
 */
const findNextPlayerToAct = (players: Player[], startIndex: number): number | null => {
  const numPlayers = players.length;
  for (let i = 0; i < numPlayers; i++) {
    const index = (startIndex + i) % numPlayers;
    const player = players[index];
    // 可行动的玩家必须是 'active' 状态 (筹码 > 0 且未弃牌)
    if (player.status === 'active') {
      return index;
    }
  }
  return null;
};

/**
 * 推进到下一个游戏阶段 (例如，从 PRE_FLOP 到 FLOP)。
 * @param state - 当前游戏状态
 */
const advanceToNextGamePhase = (state: GameState) => {
  // 1. 将本轮下注的筹码归零，为下一轮做准备
  state.players.forEach(p => {
    p.currentRoundBet = 0;
  });
  state.currentRoundBet = 0;

  // 2. 确定下一轮第一个行动的玩家 (通常是庄家左边的第一个活跃玩家)
  state.currentPlayerIndex = findNextPlayerToAct(state.players, (state.dealerIndex + 1) % state.players.length);
  state.lastRaiserIndex = state.currentPlayerIndex;

  // 3. 根据当前阶段，推进到下一阶段
  switch (state.gamePhase) {
    case GamePhase.PRE_FLOP:
      state.gamePhase = GamePhase.FLOP;
      // 发三张翻牌
      state.deck.pop(); // 烧掉一张牌
      for (let i = 0; i < 3; i++) state.communityCards.push(state.deck.pop()!);
      break;
    case GamePhase.FLOP:
      state.gamePhase = GamePhase.TURN;
      // 发一张转牌
      state.deck.pop(); // 烧掉一张牌
      state.communityCards.push(state.deck.pop()!);
      break;
    case GamePhase.TURN:
      state.gamePhase = GamePhase.RIVER;
      // 发一张河牌
      state.deck.pop(); // 烧掉一张牌
      state.communityCards.push(state.deck.pop()!);
      break;
    case GamePhase.RIVER:
      state.gamePhase = GamePhase.SHOWDOWN;
      // TODO: 实现摊牌比大小和分配底池的逻辑
      console.log("进入摊牌阶段！");
      break;
  }
};

/**
 * 在一个玩家行动后，决定下一个行动者或结束本轮下注。
 * @param state - 当前游戏状态
 */
const advanceAction = (state: GameState) => {
  // 检查是否只剩一个未弃牌的玩家
  const activePlayers = state.players.filter(p => p.status !== 'folded' && p.status !== 'sitting-out');
  if (activePlayers.length <= 1) {
    state.gamePhase = GamePhase.SHOWDOWN; // 直接进入摊牌
    // TODO: 实现仅一人获胜的底池分配逻辑
    console.log(`只剩玩家 ${activePlayers[0]?.name}，直接获胜！`);
    return;
  }

  const nextPlayerIndex = findNextPlayerToAct(state.players, (state.currentPlayerIndex! + 1) % state.players.length);

  // 如果下一个行动者是本轮的最后一个加注者，说明一圈已经走完
  if (nextPlayerIndex === state.lastRaiserIndex) {
    advanceToNextGamePhase(state);
  } else {
    state.currentPlayerIndex = nextPlayerIndex;
  }
};


// ========================================================================
// ==                           Game Slice                               ==
// ========================================================================

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayer: (state: GameState, action: PayloadAction<{ id: string, name: string, stack: number, isAI: boolean }>) => {
      // ... (您的 addPlayer 逻辑保持不变)
      if (state.gamePhase === GamePhase.WAITING) {
        const newPlayer: Player = {
          ...action.payload,
          hand: [],
          currentRoundBet: 0,
          status: 'active',
        };
        state.players.push(newPlayer);
      }
    },
    startGame: (state: GameState) => {
      // ... (您的 startGame 逻辑保持不变)
      const activePlayers = state.players.filter(p => p.stack > 0);
      if (activePlayers.length < 2 || (state.gamePhase !== GamePhase.WAITING && state.gamePhase !== GamePhase.ENDED)) return;
      state.gamePhase = GamePhase.PRE_DEAL;
      state.communityCards = [];
      state.pot = 0;
      state.deck = [];
      state.players.forEach(p => { p.hand = []; p.currentRoundBet = 0; p.status = p.stack > 0 ? 'active' : 'sitting-out'; });
      const suits = Object.values(Suit); const ranks = Object.values(Rank);
      for (const suit of suits) { for (const rank of ranks) { state.deck.push({ suit, rank }); } }
      for (let i = state.deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]]; }
      state.dealerIndex = (state.dealerIndex + 1) % state.players.length;
      const sbIndex = (state.dealerIndex + 1) % state.players.length;
      const bbIndex = (state.dealerIndex + 2) % state.players.length;
      state.smallBlindIndex = sbIndex; state.bigBlindIndex = bbIndex;
      const sbPlayer = state.players[sbIndex]; const bbPlayer = state.players[bbIndex];
      const sbBet = Math.min(SMALL_BLIND_AMOUNT, sbPlayer.stack); sbPlayer.stack -= sbBet; sbPlayer.currentRoundBet = sbBet; if (sbPlayer.stack === 0) sbPlayer.status = 'all-in';
      const bbBet = Math.min(BIG_BLIND_AMOUNT, bbPlayer.stack); bbPlayer.stack -= bbBet; bbPlayer.currentRoundBet = bbBet; if (bbPlayer.stack === 0) bbPlayer.status = 'all-in';
      state.pot = sbBet + bbBet; state.currentRoundBet = BIG_BLIND_AMOUNT; state.minRaiseAmount = BIG_BLIND_AMOUNT * 2;
      for (let i = 0; i < 2; i++) { for (const player of state.players) { if (player.status !== 'sitting-out') { player.hand.push(state.deck.pop()!); } } }
      state.gamePhase = GamePhase.PRE_FLOP;
      state.currentPlayerIndex = findNextPlayerToAct(state.players, (bbIndex + 1) % state.players.length);
      state.lastRaiserIndex = state.currentPlayerIndex;
    },
    
    /**
     * 玩家行动：弃牌
     */
    fold: (state: GameState) => {
      if (state.currentPlayerIndex === null) return;
      const player = state.players[state.currentPlayerIndex];
      if (!player || player.status !== 'active') return;

      player.status = 'folded';
      console.log(`玩家 ${player.name} 弃牌了。`);
      
      advanceAction(state); // 推进游戏
    },
    
    /**
     * 玩家行动：过牌
     */
    check: (state: GameState) => { 
      if (state.currentPlayerIndex === null) return;
      const player = state.players[state.currentPlayerIndex];
      if (!player || player.status !== 'active') return;

      // 核心规则：只有当你的下注额已经等于当前回合的最高下注额时，才能过牌
      if (player.currentRoundBet < state.currentRoundBet) {
        console.error(`玩家 ${player.name} 不能过牌，需要跟注！`);
        return;
      }
      
      console.log(`玩家 ${player.name} 过牌。`);
      advanceAction(state); // 推进游戏
    },
    
    /**
     * 玩家行动：跟注
     */
    call: (state: GameState) => { 
      if (state.currentPlayerIndex === null) return;
      const player = state.players[state.currentPlayerIndex];
      if (!player || player.status !== 'active') return;

      const amountToCall = state.currentRoundBet - player.currentRoundBet;
      if (amountToCall <= 0) {
        console.error(`玩家 ${player.name} 无需跟注，应该过牌。`);
        return; // 如果无需跟注，则此操作无效，应该点“过牌”
      }

      // 处理 all-in 的情况
      const betAmount = Math.min(amountToCall, player.stack);
      
      player.stack -= betAmount;
      player.currentRoundBet += betAmount;
      state.pot += betAmount;

      if (player.stack === 0) {
        player.status = 'all-in';
        console.log(`玩家 ${player.name} 跟注并 All-in！`);
      } else {
        console.log(`玩家 ${player.name} 跟注 ${betAmount}。`);
      }
      
      advanceAction(state); // 推进游戏
    },
    
    /**
     * 玩家行动：加注
     */
    raise: (state: GameState, action: PayloadAction<number>) => { 
      if (state.currentPlayerIndex === null) return;
      const player = state.players[state.currentPlayerIndex];
      const raiseAmount = action.payload; // 这是玩家希望加注到的总额
      if (!player || player.status !== 'active') return;

      // 校验加注额是否合法
      if (raiseAmount < state.minRaiseAmount && raiseAmount < player.stack + player.currentRoundBet) {
        console.error(`加注额 ${raiseAmount} 过小，至少需要加注到 ${state.minRaiseAmount}`);
        return;
      }
      if (raiseAmount > player.stack + player.currentRoundBet) {
        console.error(`加注额 ${raiseAmount} 超过了玩家筹码`);
        return; // 不能加注超过自己的总筹码
      }

      const amountToBet = raiseAmount - player.currentRoundBet;
      
      player.stack -= amountToBet;
      player.currentRoundBet += amountToBet;
      state.pot += amountToBet;

      const oldRoundBet = state.currentRoundBet;
      state.currentRoundBet = player.currentRoundBet; // 更新当前回合的最高下注额
      
      // 更新最小加注额：新的最小加注额 = 当前注 + (当前注 - 上一个注)
      state.minRaiseAmount = state.currentRoundBet + (state.currentRoundBet - oldRoundBet);
      
      // 加注者成为新的 "lastRaiser"，行动将以他为终点
      state.lastRaiserIndex = state.currentPlayerIndex;

      if (player.stack === 0) {
        player.status = 'all-in';
        console.log(`玩家 ${player.name} 加注并 All-in 到 ${raiseAmount}！`);
      } else {
        console.log(`玩家 ${player.name} 加注到 ${raiseAmount}。`);
      }
      
      advanceAction(state); // 推进游戏
    },
  },
});

export const { addPlayer, startGame, fold, check, call, raise } = gameSlice.actions;
export const selectGame = (state: RootState) => state.game;
export default gameSlice.reducer;