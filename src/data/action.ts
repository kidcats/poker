export enum ActionType {
    Bet = "bet",
    Call = "call",
    Raise = "raise",
    Fold = "fold",
    Check = "check"
}

export interface Action{
    type:ActionType,   // 行动的类型，可能的值包括check,call,raise,allin,fold
    amount?:number, // 下注的数量
}

