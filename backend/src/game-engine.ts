import { GameState, Player, Card, GamePhase, Suit, Rank, PlayerStatus, HandType, HandResult, PlayerAction, ActionType, ActionLog, ShowdownResult } from '../../src/shared-types';

// ========================================================================
// ==                           常量和辅助函数                         ==
// ========================================================================
const SMALL_BLIND_AMOUNT = 10;
const BIG_BLIND_AMOUNT = 20;

// 创建一个深拷贝的辅助函数，确保函数纯净，不修改原始状态
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// 牌力评估等辅助函数 (无变化)
const evaluateHand = (allCards: Card[]): HandResult => {
    const sortedCards = [...allCards].sort((a, b) => b.rank - a.rank);
    const flushSuit: { [key in Suit]?: Card[] } = {};
    sortedCards.forEach(c => {
        if (!flushSuit[c.suit]) flushSuit[c.suit] = [];
        flushSuit[c.suit]!.push(c);
    });
    for (const suit in flushSuit) {
        const flushCards = flushSuit[suit as Suit]!;
        if (flushCards.length >= 5) {
            const straightFlushResult = findStraight(flushCards);
            if (straightFlushResult) {
                if (straightFlushResult.values[0] === Rank.ACE) return { type: HandType.ROYAL_FLUSH, values: straightFlushResult.values, handName: '皇家同花顺' };
                return { type: HandType.STRAIGHT_FLUSH, values: straightFlushResult.values, handName: '同花顺' };
            }
            return { type: HandType.FLUSH, values: flushCards.slice(0, 5).map(c => c.rank), handName: '同花' };
        }
    }
    const straightResult = findStraight(sortedCards);
    if (straightResult) return { type: HandType.STRAIGHT, values: straightResult.values, handName: '顺子' };
    const rankCounts: { [rank: number]: number } = {};
    sortedCards.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1; });
    const quads: number[] = [], trips: number[] = [], pairs: number[] = [];
    Object.entries(rankCounts).forEach(([rank, count]) => {
        const rankNum = parseInt(rank, 10);
        if (count === 4) quads.push(rankNum);
        else if (count === 3) trips.push(rankNum);
        else if (count === 2) pairs.push(rankNum);
    });
    quads.sort((a, b) => b - a); trips.sort((a, b) => b - a); pairs.sort((a, b) => b - a);
    const getKickers = (excludeRanks: number[], count: number) => sortedCards.filter(c => !excludeRanks.includes(c.rank)).slice(0, count).map(c => c.rank);
    if (quads.length > 0) {
        const kicker = getKickers([quads[0]], 1);
        return { type: HandType.FOUR_OF_A_KIND, values: [quads[0], ...kicker], handName: '四条' };
    }
    if (trips.length > 0 && pairs.length > 0) return { type: HandType.FULL_HOUSE, values: [trips[0], pairs[0]], handName: '葫芦' };
    if (trips.length > 1) return { type: HandType.FULL_HOUSE, values: [trips[0], trips[1]], handName: '葫芦' };
    if (trips.length > 0) {
        const kickers = getKickers([trips[0]], 2);
        return { type: HandType.THREE_OF_A_KIND, values: [trips[0], ...kickers], handName: '三条' };
    }
    if (pairs.length >= 2) {
        const kicker = getKickers([pairs[0], pairs[1]], 1);
        return { type: HandType.TWO_PAIR, values: [pairs[0], pairs[1], ...kicker], handName: '两对' };
    }
    if (pairs.length === 1) {
        const kickers = getKickers([pairs[0]], 3);
        return { type: HandType.ONE_PAIR, values: [pairs[0], ...kickers], handName: '一对' };
    }
    return { type: HandType.HIGH_CARD, values: sortedCards.slice(0, 5).map(c => c.rank), handName: '高牌' };
};
const findStraight = (cards: Card[]): { values: number[] } | null => {
    const uniqueRanks = [...new Set(cards.map(c => c.rank))];
    if (uniqueRanks.includes(Rank.ACE)) uniqueRanks.push(1);
    uniqueRanks.sort((a, b) => b - a);
    if (uniqueRanks.length < 5) return null;
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
        const slice = uniqueRanks.slice(i, i + 5);
        if (slice[0] - slice[4] === 4) return { values: slice };
    }
    return null;
};
const compareHands = (hand1: HandResult, hand2: HandResult): number => {
    if (hand1.type !== hand2.type) return hand1.type - hand2.type;
    for (let i = 0; i < hand1.values.length; i++) {
        if (hand1.values[i] !== hand2.values[i]) return hand1.values[i] - hand2.values[i];
    }
    return 0;
};
const findNextActivePlayer = (players: Player[], startIndex: number): number | null => {
  const numPlayers = players.length;
  if (numPlayers === 0) return null;
  for (let i = 1; i <= numPlayers; i++) {
    const index = (startIndex + i) % numPlayers;
    const player = players[index];
    if (player.status === PlayerStatus.ACTIVE) return index;
  }
  return null;
};
const findNextPlayerForTurn = (players: Player[], startIndex: number): number | null => {
    const numPlayers = players.length;
    if (numPlayers === 0) return null;
    for (let i = 1; i <= numPlayers; i++) {
      const index = (startIndex + i) % numPlayers;
      const player = players[index];
      if (player.status !== PlayerStatus.SITTING_OUT && player.status !== PlayerStatus.FOLDED) return index;
    }
    return null;
};
export const addAIPlayers = (state: GameState, payload: { count: number }): GameState => {
    if (state.gamePhase !== GamePhase.WAITING) return state;
    let newState = deepClone(state);
    
    const existingAICount = newState.players.filter(p => p.isAI).length;

    for (let i = 0; i < payload.count; i++) {
        const aiIndex = existingAICount + i + 1;
        const newAIPlayer: Player = {
            id: `ai-${Date.now()}-${i}`,
            name: `AI Bot ${aiIndex}`,
            stack: 1000,
            isAI: true,
            hand: [],
            currentRoundBet: 0,
            status: PlayerStatus.WAITING,
            position: '', // MODIFIED: 确保新AI玩家有position属性
        };
        newState.players.push(newAIPlayer);
    }
    return newState;
};
const assignPlayerPositions = (players: Player[], dealerIndex: number, sbIndex: number, bbIndex: number): Player[] => {
    // 1. 基础准备：重置位置，获取活跃玩家数量
    players.forEach(p => p.position = '');
    const activePlayersCount = players.filter(p => p.status !== PlayerStatus.SITTING_OUT).length;

    if (activePlayersCount < 2) {
        return players;
    }

    // 2. 分配核心位置：BTN, SB, BB
    players[dealerIndex].position = "BTN";
    players[sbIndex].position = "SB";
    players[bbIndex].position = "BB";

    // 3. 处理特殊情况：2人桌 (Heads-Up)
    if (activePlayersCount === 2) {
        players[dealerIndex].position = "BTN / SB"; // 庄家也是小盲
        return players;
    }

    // === 动态算法核心部分 ===

    // 4. 收集所有需要分配位置的玩家 (从UTG到CO)
    const playersToAssignPosition: number[] = [];
    // 使用我们之前验证过的优秀函数 findNextPlayerForTurn
    let currentIndex = findNextPlayerForTurn(players, bbIndex)!; 

    // 顺时针遍历，直到回到庄家为止
    while (currentIndex !== dealerIndex) {
        // 确保不重复添加SB和BB（在某些极少人数情况下可能发生）
        if (currentIndex !== sbIndex && currentIndex !== bbIndex) {
            playersToAssignPosition.push(currentIndex);
        }
        currentIndex = findNextPlayerForTurn(players, currentIndex)!;
        
        // 安全退出，防止因意外逻辑导致的无限循环
        if (currentIndex === null || playersToAssignPosition.length >= activePlayersCount) {
            break;
        }
    }

    const positionsToAssignCount = playersToAssignPosition.length;
    if (positionsToAssignCount === 0) {
        // 3人桌的情况，只有BTN, SB, BB，无需额外分配
        return players;
    }

    // 5. 动态生成位置名称列表
    const positionNames: string[] = [];
    if (positionsToAssignCount === 1) { // 4人桌
        positionNames.push("UTG");
    } else if (positionsToAssignCount === 2) { // 5人桌
        positionNames.push("UTG", "CO");
    } else if (positionsToAssignCount === 3) { // 6人桌
        positionNames.push("UTG", "MP", "CO");
    } else if (positionsToAssignCount >= 4) { // 7人桌及以上
        positionNames.push("UTG"); // 第一个永远是UTG
        
        // 填充UTG+n
        const utgPlusCount = Math.min(2, positionsToAssignCount - 3); // 在7-8人桌有一个UTG+1, 9人桌及以上有UTG+1, UTG+2
        for (let i = 1; i <= utgPlusCount; i++) {
            positionNames.push(`UTG+${i}`);
        }

        // 填充MP
        const mpCount = positionsToAssignCount - (positionNames.length + 2); // 减去已有的UTG系列和末尾的HJ,CO
        for (let i = 1; i <= mpCount; i++) {
            positionNames.push(`MP${i}`);
        }

        positionNames.push("HJ"); // 倒数第二个是Hijack
        positionNames.push("CO"); // 最后一个是Cutoff
    }

    // 6. 将生成的位置名称分配给玩家
    for (let i = 0; i < positionsToAssignCount; i++) {
        const playerIndex = playersToAssignPosition[i];
        const positionName = positionNames[i];
        if (playerIndex !== undefined && positionName) {
            players[playerIndex].position = positionName;
        }
    }
    
    return players;
};

const internalLogic = {
    handleShowdown: (state: GameState): GameState => {
        let newState = deepClone(state);
        newState.gamePhase = GamePhase.SHOWDOWN;
        newState.currentPlayerIndex = null;
        const contenders = newState.players.filter(p => p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.SITTING_OUT);
        if (contenders.length === 1) {
            const winner = contenders[0];
            const playerToUpdate = newState.players.find(p => p.id === winner.id)!;
            playerToUpdate.stack += newState.pot;
            newState.showdownResults = [{ player: winner, handResult: { type: HandType.HIGH_CARD, values: [], handName: '对手全部弃牌' } }];
        } else {
            const evaluatedHands = contenders.map(player => ({ player, handResult: evaluateHand([...player.hand, ...newState.communityCards]) }));
            evaluatedHands.sort((a, b) => compareHands(b.handResult, a.handResult));
            const bestHand = evaluatedHands[0];
            const winners = evaluatedHands.filter(hand => compareHands(hand.handResult, bestHand.handResult) === 0);
            const potPerWinner = Math.floor(newState.pot / winners.length);
            const remainder = newState.pot % winners.length;
            winners.forEach((winnerInfo, index) => {
                const playerToUpdate = newState.players.find(p => p.id === winnerInfo.player.id)!;
                playerToUpdate.stack += potPerWinner;
                if (index === 0 && remainder > 0) playerToUpdate.stack += remainder;
            });
            newState.showdownResults = winners.map(w => ({ player: w.player, handResult: w.handResult }));
        }
        newState.pot = 0;
        newState.gamePhase = GamePhase.ENDED;
        return newState;
    },

    advanceToNextPhase: (state: GameState): GameState => {
        let newState = deepClone(state);
        if (newState.gamePhase >= GamePhase.RIVER) {
            return internalLogic.handleShowdown(newState);
        }
        newState.players.forEach(p => { p.currentRoundBet = 0; });
        newState.currentRoundBet = 0;
        newState.minRaiseAmount = BIG_BLIND_AMOUNT;
        const firstToAct = findNextActivePlayer(newState.players, newState.dealerIndex);
        newState.currentPlayerIndex = firstToAct;
        newState.lastRaiserIndex = firstToAct;
        switch (newState.gamePhase) {
            case GamePhase.PRE_FLOP:
                newState.gamePhase = GamePhase.FLOP;
                newState.deck.pop(); // Burn card
                for (let i = 0; i < 3; i++) newState.communityCards.push(newState.deck.pop()!);
                break;
            case GamePhase.FLOP:
                newState.gamePhase = GamePhase.TURN;
                newState.deck.pop(); // Burn card
                newState.communityCards.push(newState.deck.pop()!);
                break;
            case GamePhase.TURN:
                newState.gamePhase = GamePhase.RIVER;
                newState.deck.pop(); // Burn card
                newState.communityCards.push(newState.deck.pop()!);
                break;
        }
        const activePlayers = newState.players.filter(p => p.status === PlayerStatus.ACTIVE);
        if (activePlayers.length <= 1) {
            return internalLogic.handleShowdown(newState);
        }
        return newState;
    },

    advanceAction: (state: GameState): GameState => {
        let newState = deepClone(state);
        const activeOrAllInPlayers = newState.players.filter(p => p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.SITTING_OUT);
        if (activeOrAllInPlayers.length <= 1) {
            return internalLogic.handleShowdown(newState);
        }
        const nextPlayerIndex = findNextActivePlayer(newState.players, newState.currentPlayerIndex!);
        const activePlayersLeftToAct = newState.players.filter(p => p.status === PlayerStatus.ACTIVE).length;
        if (activePlayersLeftToAct === 0) {
            return internalLogic.advanceToNextPhase(newState);
        }
        if (nextPlayerIndex === newState.lastRaiserIndex) {
            return internalLogic.advanceToNextPhase(newState);
        } else {
            newState.currentPlayerIndex = nextPlayerIndex;
        }
        return newState;
    }
};

// ========================================================================
// ==                 导出的公共函数 (供 server.ts 使用)               ==
// ========================================================================

export const createInitialState = (): GameState => ({
    players: [], deck: [], communityCards: [], pot: 0, gamePhase: GamePhase.WAITING,
    currentPlayerIndex: null, dealerIndex: -1, smallBlindIndex: null, bigBlindIndex: null,
    currentRoundBet: 0, lastRaiserIndex: null, minRaiseAmount: 0, gameId: null, showdownResults: null,
    actionHistory: [], // NEW: 初始化 actionHistory
});

export const addPlayer = (state: GameState, payload: { id: string, name: string, stack: number, isAI: boolean }): GameState => {
    if (state.gamePhase !== GamePhase.WAITING) return state;
    const newState = deepClone(state);
    const newPlayer: Player = { ...payload, hand: [], currentRoundBet: 0, status: PlayerStatus.WAITING, position: '' }; // MODIFIED: 添加 position
    newState.players.push(newPlayer);
    return newState;
};

/// 我有一个问题，当用户的位置信息是什么时候确认的？是游戏开始的时候吗？
/// 如果用户是半路加入的呢？一般是大盲位置，其他人的位置是否需要计算？
/// 如何合理的计算用户的位置呢？
export const startGame = (state: GameState): GameState => {
    let newState = deepClone(state);
    
    // 1. 验证游戏开始条件
    const playersWithStack = newState.players.filter(p => p.stack > 0);
    if (playersWithStack.length < 2 || (newState.gamePhase !== GamePhase.WAITING && newState.gamePhase !== GamePhase.ENDED)) {
        console.warn("无法开始游戏: 玩家不足或游戏已在进行中。");
        return state;
    }

    // 2. 重置游戏状态和玩家状态
    newState.showdownResults = null;
    newState.gamePhase = GamePhase.PRE_DEAL;
    newState.gameId = `game-${Date.now()}`;
    newState.communityCards = [];
    newState.pot = 0;
    newState.currentRoundBet = 0;
    newState.actionHistory = []; // NEW: 每局开始时清空历史记录
    newState.players.forEach(p => {
        p.hand = [];
        p.currentRoundBet = 0;
        p.status = p.stack > 0 ? PlayerStatus.ACTIVE : PlayerStatus.SITTING_OUT;
        p.position = ''; // MODIFIED: 使用空字符串代替undefined
    });

    // 3. 创建并洗牌 (无变化)
    newState.deck = [];
    const suits = Object.values(Suit);
    const ranks = Object.values(Rank).filter(r => typeof r === 'number') as Rank[];
    for (const suit of suits) { for (const rank of ranks) { newState.deck.push({ suit, rank }); } }
    for (let i = newState.deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [newState.deck[i], newState.deck[j]] = [newState.deck[j], newState.deck[i]]; }
    
    // 4. 确定庄家(BTN)和盲注(SB, BB)的索引 (无变化)
    newState.dealerIndex = findNextPlayerForTurn(newState.players, newState.dealerIndex) ?? 0;
    const sbIndex = findNextPlayerForTurn(newState.players, newState.dealerIndex)!;
    const bbIndex = findNextPlayerForTurn(newState.players, sbIndex)!;
    newState.smallBlindIndex = sbIndex;
    newState.bigBlindIndex = bbIndex;
    
    // 5. 分配所有玩家的位置名称 (无变化)
    assignPlayerPositions(newState.players, newState.dealerIndex, sbIndex, bbIndex);
    
    // 6. 强制下盲注
    const sbPlayer = newState.players[sbIndex];
    const sbBet = Math.min(SMALL_BLIND_AMOUNT, sbPlayer.stack);
    sbPlayer.stack -= sbBet; sbPlayer.currentRoundBet = sbBet; newState.pot += sbBet;
    if (sbPlayer.stack === 0) sbPlayer.status = PlayerStatus.ALL_IN;
    // NEW: 记录小盲注行动
    newState.actionHistory.push({ playerId: sbPlayer.id, action: 'SB', amount: sbBet, stage: newState.gamePhase });

    const bbPlayer = newState.players[bbIndex];
    const bbBet = Math.min(BIG_BLIND_AMOUNT, bbPlayer.stack);
    bbPlayer.stack -= bbBet; bbPlayer.currentRoundBet = bbBet; newState.pot += bbBet;
    if (bbPlayer.stack === 0) bbPlayer.status = PlayerStatus.ALL_IN;
    // NEW: 记录大盲注行动
    newState.actionHistory.push({ playerId: bbPlayer.id, action: 'BB', amount: bbBet, stage: newState.gamePhase });

    // 7. 设置翻前轮的下注状态 (无变化)
    newState.currentRoundBet = BIG_BLIND_AMOUNT;
    newState.minRaiseAmount = BIG_BLIND_AMOUNT * 2;
    
    // 8. 发两张底牌给每个活跃玩家 (无变化)
    for (let i = 0; i < 2; i++) {
        for (const player of newState.players) {
            if (player.status !== PlayerStatus.SITTING_OUT) {
                player.hand.push(newState.deck.pop()!);
            }
        }
    }
    
    // 9. 设置游戏阶段为翻前，并确定第一个行动者 (无变化)
    newState.gamePhase = GamePhase.PRE_FLOP;
    newState.currentPlayerIndex = findNextActivePlayer(newState.players, bbIndex)!;
    newState.lastRaiserIndex = newState.currentPlayerIndex;
    
    // 10. 返回全新的游戏状态
    return newState;
};

export const processPlayerAction = (state: GameState, action: PlayerAction): GameState => {
    let newState = deepClone(state);
    const player = newState.players[newState.currentPlayerIndex!];

    if (player.id !== action.playerId) {
        console.warn(`非法行动: 不是玩家 ${action.playerId} 的回合。`);
        return state;
    }

    switch (action.type) {
        case ActionType.FOLD:
            player.status = PlayerStatus.FOLDED;
            // NEW: 记录弃牌行动
            newState.actionHistory.push({ playerId: player.id, action: 'FOLD', amount: 0, stage: newState.gamePhase });
            return internalLogic.advanceAction(newState);

        case ActionType.CHECK:
            if (player.currentRoundBet < newState.currentRoundBet) {
                console.warn(`非法行动: 玩家 ${player.name} 不能check，需要跟注。`);
                return state;
            }
            // NEW: 记录过牌行动
            newState.actionHistory.push({ playerId: player.id, action: 'CHECK', amount: 0, stage: newState.gamePhase });
            return internalLogic.advanceAction(newState);

        case ActionType.CALL:
            const amountToCall = newState.currentRoundBet - player.currentRoundBet;
            if (amountToCall <= 0) {
                console.warn(`非法行动: 玩家 ${player.name} 无需跟注。`);
                return state;
            }
            const betAmount = Math.min(amountToCall, player.stack);
            player.stack -= betAmount;
            player.currentRoundBet += betAmount;
            newState.pot += betAmount;
            if (player.stack === 0) player.status = PlayerStatus.ALL_IN;
            // NEW: 记录跟注行动
            newState.actionHistory.push({ playerId: player.id, action: 'CALL', amount: player.currentRoundBet, stage: newState.gamePhase });
            return internalLogic.advanceAction(newState);

        case ActionType.RAISE:
            const raiseAmount = action.amount;
            const totalBetInFront = player.currentRoundBet + player.stack;
            const finalRaiseAmount = Math.min(raiseAmount, totalBetInFront);
            if (finalRaiseAmount < newState.minRaiseAmount && finalRaiseAmount < totalBetInFront) {
                console.warn(`非法行动: 玩家 ${player.name} 的加注金额太小。`);
                return state;
            }
            const amountToBet = finalRaiseAmount - player.currentRoundBet;
            player.stack -= amountToBet;
            player.currentRoundBet += amountToBet;
            newState.pot += amountToBet;
            const oldRoundBet = newState.currentRoundBet;
            newState.currentRoundBet = player.currentRoundBet;
            newState.minRaiseAmount = newState.currentRoundBet + (newState.currentRoundBet - oldRoundBet);
            newState.lastRaiserIndex = newState.currentPlayerIndex;
            if (player.stack === 0) player.status = PlayerStatus.ALL_IN;
            // NEW: 记录加注行动
            newState.actionHistory.push({ playerId: player.id, action: 'RAISE', amount: finalRaiseAmount, stage: newState.gamePhase });
            return internalLogic.advanceAction(newState);
    }
    return state;
};