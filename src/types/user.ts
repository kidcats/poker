import { Card } from "./card";

// 写一个用于放在数组里面的数据结构，包括用户id和用户在这局游戏的index两个属性
export interface User {
    userId: string;
    chipCount: number;
    userIndex: number;
}

interface user{
    id:string, // 用户唯一标识符号
    name:string, // 用户名
    chips:number, // 用户筹码数量
    status:string, // 用户当前的状态，可能的值包括正在游戏中，fold,allin等
    hand:Card[],   // 手里的两张私牌
    bet:number,    // 玩家在当前轮次中已下注的数量
}