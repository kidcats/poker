import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "./gameSlice";

const store = configureStore({
  reducer: {
    game: gameReducer,
  },
});

// 导出 RootState 类型，用于 useSelector hook
export type RootState = ReturnType<typeof store.getState>;
// === 新增的行 ===
// 导出 AppDispatch 类型，用于 useDispatch hook
export type AppDispatch = typeof store.dispatch;

export default store;