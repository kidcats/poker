import { User } from "./user"; // 假设 User 接口在 user.ts 文件中被定义
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";


interface UserArrayState {
    users: User[];
  }
  
  const initialState: UserArrayState = {
    users: [],
  };

const userArraySlice = createSlice({
    name: "userArray",
    initialState,
    reducers: {
        apply: (state:UserArrayState, action: PayloadAction<User>) => {
            state.users.push(action.payload);
        },
        leave: (state, action: PayloadAction<string>) => {
            state.users = state.users.filter(user => user.id !== action.payload);
        },
        disband: (state) => {
            state.users = [];
        }
    }
});

// 更新 userCountSelector 以返回用户数量
export const userArraySelector = (state: RootState) => state.userArray.users;
export const { apply, leave, disband } = userArraySlice.actions;
export default userArraySlice.reducer;