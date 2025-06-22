import { User } from "./user";
import {Card} from "./card"

export interface GameStatus{
    players:User[],  // 游戏中所有玩家的数组，包括弃牌的玩家
    communityCards:Card[], // 桌上的公共牌
    pot:number,              // 当前奖池中的筹码数量
    currentBet:number,       // 当前轮次中中最高的下注额
    dealer:number,            // 小盲的位置
    currentplayer:number,     // 当前行动的玩家在players中的索引
}