import { User } from "./user";

export interface GameInfo{
    gameId: string;
    users: User[];
    currentUserId: string; // that is the userid of join the game
}