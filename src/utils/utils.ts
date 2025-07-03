// ========================================================================
// ==                         常量定义 (Constants)                         ==
// ========================================================================

import { Position } from "../states/positionContext";


const CARD_WIDTH = 80;
const CARD_HEIGHT = 120;
const HAND_CARD_SPACING = CARD_WIDTH * 0.6;

// 添加桌子布局相关常量
const TABLE_RADIUS_X_RATIO = 0.35;
const TABLE_RADIUS_Y_RATIO = 0.35;

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
    
    // 中心点不再需要在函数内部计算后返回，因为我们的目标是返回偏移量
    // const centerX = width / 2;
    // const centerY = height / 2;
    
    const radiusX = width * TABLE_RADIUS_X_RATIO;
    const radiusY = height * TABLE_RADIUS_Y_RATIO;
    
    // 假设最多10个玩家以均匀分布
    const angleStep = (2 * Math.PI) / 10; 
    const startAngle = -Math.PI / 2; // 从顶部开始
    const angle = startAngle + playerIndex * angleStep;
    
    let cardX = radiusX * Math.cos(angle);
    let cardY = radiusY * Math.sin(angle);
    
    const rotate = (angle * 180 / Math.PI) + 90;
    
    if (cardIndex !== undefined) {
        const perpAngle = angle + Math.PI / 2;
        const offsetDistance = (cardIndex - 0.5) * HAND_CARD_SPACING;
        cardX += offsetDistance * Math.cos(perpAngle);
        cardY += offsetDistance * Math.sin(perpAngle);
    }

    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // FIX: 直接返回计算出的相对于中心的偏移量，不再加上中心点坐标
    return { 
        cardX: cardX, 
        cardY: cardY, 
        rotate 
    };
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
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
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
};