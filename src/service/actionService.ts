
import { fold, check, call, raise } from '../states/gameSlice';
import store from '../states/store';
import { PlayerAction, ActionType } from '../types/action';

/**
 * 统一的玩家行动分发器
 * @param action - 一个标准化的玩家行动对象
 */
export function dispatchPlayerAction(action: PlayerAction): void {
  const { dispatch, getState } = store;
  const state = getState().game;

  // 验证行动是否合法（例如，是否是该玩家的回合）
  const currentPlayer = state.players[state.currentPlayerIndex!];
  if (!currentPlayer || currentPlayer.id !== action.playerId) {
    console.error(`行动被拒绝：不是玩家 ${action.playerId} 的回合。`);
    return;
  }

  // 根据行动类型，分发对应的 Redux action
  switch (action.type) {
    case ActionType.FOLD:
      dispatch(fold());
      break;
    case ActionType.CHECK:
      dispatch(check());
      break;
    case ActionType.CALL:
      dispatch(call());
      break;
    case ActionType.RAISE:
      dispatch(raise(action.amount));
      break;
    default:
      console.error('未知的行动类型');
  }
}