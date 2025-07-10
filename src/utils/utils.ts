// ========================================================================
// ==                         常量定义 (Constants)                         ==
// ========================================================================

import { GamePhase, GameState, PlayerStatus } from "../shared-types";
import { Position } from "../states/positionContext";


const CARD_WIDTH = 80;
const CARD_HEIGHT = 120;
const HAND_CARD_SPACING = CARD_WIDTH * 0.6;
const PLAYER_INFO_HEIGHT = -40; // 添加这一行
// 添加桌子布局相关常量
const TABLE_RADIUS_X_RATIO = 0.55;
const TABLE_RADIUS_Y_RATIO = 0.5;

// ========================================================================
// ==                     计算玩家座位位置 (Player Seats)                  ==
// ========================================================================

/**
 * 计算指定玩家座位处卡牌的动画目标位置。
 */
/**
 * 计算指定玩家座位处卡牌的动画目标位置。
 */
export const calculatePosition = (
    playerIndex: number, 
    position: Position | null,
    cardIndex?: number
) => {
    if (!position) return { cardX: 0, cardY: 0, rotate: 0 };

    const { width, height } = position;
    
    const radiusX = width * TABLE_RADIUS_X_RATIO;
    const radiusY = height * TABLE_RADIUS_Y_RATIO;
    
    // 根据实际玩家数量调整
    const angleStep = (2 * Math.PI) / 10; 
    const startAngle = -Math.PI / 2; // 从顶部开始
    const angle = startAngle + playerIndex * angleStep;
    
    let cardX = radiusX * Math.cos(angle);
    let cardY = radiusY * Math.sin(angle);
    
    const rotate = (angle * 180 / Math.PI) + 90;
    
    // 如果是计算手牌位置
    if (cardIndex !== undefined) {
        // 手牌横向偏移
        const perpAngle = angle + Math.PI / 2;
        const offsetDistance = (cardIndex - 0.5) * HAND_CARD_SPACING;
        cardX += offsetDistance * Math.cos(perpAngle);
        cardY += offsetDistance * Math.sin(perpAngle);
        
        // 手牌需要在玩家信息下方
        // 根据角度调整偏移方向
        const radialOffset = PLAYER_INFO_HEIGHT * 2.9;
        cardX += radialOffset * Math.cos(angle);
        cardY += radialOffset * Math.sin(angle);
    }

    return { 
        cardX: cardX, 
        cardY: cardY, 
        rotate 
    };
};



/**
 * 计算公共牌区域卡牌的动画目标位置。
 */
export const calculateCenterPosition = (
    communityCardIndex: number,
    position: Position | null
) => {
    if (!position) return { cardX: 0, cardY: 0, rotate: 0 };

    // const { width, height } = position;
    // const centerX = width / 2;
    // const centerY = height / 2;

    const communityCardSpacing = CARD_WIDTH * 1.1;
    // 计算相对于中心点的X轴偏移量 (假设5张牌，中间一张在中心)
    const offsetX = (communityCardIndex - 2) * communityCardSpacing;
    
    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // FIX: 直接返回计算出的相对于中心的偏移量
    return { 
        cardX: offsetX, 
        cardY: 0, // 公共牌在Y轴上居中，所以偏移为0
        rotate: 0 
    };
    
};

/**
 * 计算并打印指定玩家在当前游戏状态下的所有关键信息。
 * 非常适合用于调试。
 * 
 * @param gameState - 当前的游戏状态对象。
 * @param ownPlayerId - 需要检查其状态的玩家的ID。
 * @param contextLabel - (可选) 一个标签，用于在控制台输出中标识此次调用的上下文（例如 "发牌后"）。
 */
export function logPlayerActionState(
  gameState: GameState, 
  ownPlayerId: string|null,
  contextLabel: string = 'Player State Debug'
): void {
  // --- 1. 查找玩家信息 ---
  const ownPlayer = gameState.players.find(p => p.id === ownPlayerId);
  const ownPlayerIndex = ownPlayer ? gameState.players.indexOf(ownPlayer) : -1;

  // --- 2. 计算决策相关的布尔值 ---
  // 是否轮到我行动？
  const isMyTurn = gameState.gamePhase > GamePhase.WAITING && 
                   gameState.gamePhase < GamePhase.SHOWDOWN && 
                   gameState.currentPlayerIndex === ownPlayerIndex && 
                   ownPlayer?.status === PlayerStatus.ACTIVE;
  
  // 我是否可以"过牌" (Check)？
  const canCheck = isMyTurn && ownPlayer && ownPlayer.currentRoundBet === gameState.currentRoundBet;
  
  // 我是否可以"跟注" (Call)？
  const canCall = isMyTurn && ownPlayer && ownPlayer.currentRoundBet < gameState.currentRoundBet;
  
  // 需要跟注的金额是多少？
  const callAmount = gameState.currentRoundBet - (ownPlayer?.currentRoundBet || 0);

  // --- 3. 格式化并打印信息 ---
  // 使用 console.group 可以让输出在控制台中折叠，非常整洁
  console.group(contextLabel);
  
  console.log(`--- 基础信息 (玩家ID: ${ownPlayerId}) ---`);
  console.log('玩家对象 (Player Object):', ownPlayer || '未找到该玩家');
  console.log(`玩家座位号 (Player Index): ${ownPlayerIndex}`);
  
  console.log('\n--- 游戏状态 ---');
  console.log(`当前阶段 (Game Phase): ${GamePhase[gameState.gamePhase]}`);
  console.log(`当前行动玩家座位号 (Current Player Index): ${gameState.currentPlayerIndex}`);
  console.log(`本轮最高下注 (Current Round Bet): ${gameState.currentRoundBet}`);

  console.log('\n--- 计算出的决策状态 ---');
  console.log(`是否轮到我行动 (Is My Turn?): %c${isMyTurn}`, `font-weight: bold; color: ${isMyTurn ? 'green' : 'red'};`);
  console.log(`是否可以过牌 (Can Check?): ${canCheck}`);
  console.log(`是否可以跟注 (Can Call?): ${canCall}`);
  if (canCall) {
    console.log(`需要跟注的金额 (Amount to Call): ${callAmount}`);
  }
  
  console.groupEnd();
}