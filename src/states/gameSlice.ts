// src/states/gameSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { GamePhase, GameState } from '../shared-types';

const initialState: GameState = {
  players: [], deck: [], communityCards: [], pot: 0, gamePhase: GamePhase.WAITING,
  currentPlayerIndex: null, dealerIndex: -1, smallBlindIndex: null, bigBlindIndex: null,
  currentRoundBet: 0, lastRaiserIndex: null, minRaiseAmount: 0, gameId: null, showdownResults: null,
  actionHistory: []
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameState: (state, action: PayloadAction<GameState | null>) => { // MODIFIED: 允许 payload 为 null
      // ======================= NEW: 防御性检查 =======================
      // 如果收到的 payload 是空的或无效的，就不要更新状态，并在控制台打印错误。
      // 这样可以防止应用崩溃，并帮助我们调试。
      if (!action.payload) {
        console.error('[gameSlice] 接收到一个空的 gameState payload，已拒绝更新状态。服务器可能发送了无效数据。', action);
        return state; // 返回当前状态，不做任何改变
      }
      // =============================================================

      // 只有当 payload 有效时，才执行替换
      return action.payload;
    },
  },
});

export const { setGameState } = gameSlice.actions;
export const selectGame = (state: RootState) => state.game;
export default gameSlice.reducer;