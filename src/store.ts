import { configureStore } from "@reduxjs/toolkit";
import gameRoundReducer from "./gameRoundSlice";
import userArrayReducer from "./userArraySlice";


const store = configureStore({
  reducer: {
    round: gameRoundReducer, // round 是 gameRoundSlice 的 state
    userArray: userArrayReducer, // userArray 是 userArraySlice 的 state
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;