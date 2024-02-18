import { configureStore } from "@reduxjs/toolkit";
import gameRoundReducer from "./gameRoundSlice";


const store = configureStore({
    reducer: {
        round:gameRoundReducer,
    }
});


export type RootState = ReturnType<typeof store.getState>;
export default store;