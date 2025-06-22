// ========================================================================
// ==                         常量定义 (Constants)                         ==
// ========================================================================

import { Position } from "./states/positionContext";

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
export const calculatePosition = (
    playerIndex: number, 
    position: Position | null,
    cardIndex?: number
) => {
    if (!position) return { cardX: 0, cardY: 0, rotate: 0 };

    // ✅ 只解构出 width 和 height
    const { width, height } = position;
    
    // 计算容器的中心点
    const centerX = width / 2;
    const centerY = height / 2;
    
    const radiusX = width * TABLE_RADIUS_X_RATIO;
    const radiusY = height * TABLE_RADIUS_Y_RATIO;
    
    const angleStep = (2 * Math.PI) / 10;
    const startAngle = -Math.PI / 2;
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

    // ✅ 返回相对于容器中心的坐标，不再加 x 和 y
    return { 
        cardX: centerX + cardX, 
        cardY: centerY + cardY, 
        rotate 
    };
};

export const calculateCenterPosition = (
    communityCardIndex: number,
    position: Position | null
) => {
    if (!position) return { cardX: 0, cardY: 0, rotate: 0 };

    // ✅ 只解构出 width 和 height
    const { width, height } = position;

    const centerX = width / 2;
    const centerY = height / 2;

    const communityCardSpacing = CARD_WIDTH * 1.1;
    const offsetX = (communityCardIndex - 2) * communityCardSpacing;
    
    // ✅ 返回相对于容器中心的坐标，不再加 x 和 y
    return { 
        cardX: centerX + offsetX, 
        cardY: centerY,
        rotate: 0 
    };
};