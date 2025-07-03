// 这是一个简化的游戏状态管理器示例
// 在一个真实的项目中，您会把 gameSlice.ts 的逻辑完整地移到这里
import { GameState } from '../../src/types'; // 假设类型文件可以共享

let currentGameState: GameState | null = null;

export function getGameState(): GameState | null {
    return currentGameState;
}

export function updateGameState(newState: GameState): void {
    currentGameState = newState;
}

// 您会在这里实现 startGame, fold, check, call, raise 等函数
// 这些函数会修改 currentGameState