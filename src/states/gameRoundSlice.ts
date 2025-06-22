import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";

// gameRoundSlice 的内容保持不变
export const gameRoundSlice = createSlice({
  name: "gameRound",
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    reset: (state) => {
      state.value = 0;
    },
  },
});


// 选择器和动作导出保持不变
export const roundSelector = (state: RootState) => state.round.value;
export const { increment, reset } = gameRoundSlice.actions;
export default gameRoundSlice.reducer;