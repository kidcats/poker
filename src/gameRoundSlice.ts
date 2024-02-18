import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
/**
 * 这里是处理action的地方，
 * 轮次应该可以增加，也可以重置为0
 */
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
        }
    },
})

// 创建一个选择器，用于读取当前的轮次
export const roundSelector = (state:RootState) => state.round.value;


export const { increment, reset } = gameRoundSlice.actions;

export default gameRoundSlice.reducer;