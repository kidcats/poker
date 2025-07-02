import { Player } from './index';

// 定义所有可能的行动类型
export enum ActionType {
  FOLD = 'FOLD',
  CHECK = 'CHECK',
  CALL = 'CALL',
  RAISE = 'RAISE',
  // 未来可以扩展，比如 'SHOW_CARDS', 'MUCK_CARDS' 等
}

// 定义行动的基础结构
interface BasePlayerAction {
  playerId: Player['id']; // 这个行动是谁发起的
}

// 定义具体的行动对象
export interface FoldAction extends BasePlayerAction {
  type: ActionType.FOLD;
}

export interface CheckAction extends BasePlayerAction {
  type: ActionType.CHECK;
}

export interface CallAction extends BasePlayerAction {
  type: ActionType.CALL;
}

export interface RaiseAction extends BasePlayerAction {
  type: ActionType.RAISE;
  amount: number; // 加注需要附带金额
}

// 将所有可能的行动联合起来，形成一个总的类型
export type PlayerAction = FoldAction | CheckAction | CallAction | RaiseAction;