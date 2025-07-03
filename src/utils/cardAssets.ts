
// 引入所有卡牌资源
import clubs_2 from '../assets/clubs_2.svg';
import clubs_3 from '../assets/clubs_3.svg';
import clubs_4 from '../assets/clubs_4.svg';
import clubs_5 from '../assets/clubs_5.svg';
import clubs_6 from '../assets/clubs_6.svg';
import clubs_7 from '../assets/clubs_7.svg';
import clubs_8 from '../assets/clubs_8.svg';
import clubs_9 from '../assets/clubs_9.svg';
import clubs_10 from '../assets/clubs_10.svg';
import clubs_A from '../assets/clubs_A.svg';
import clubs_J from '../assets/clubs_J.svg';
import clubs_Q from '../assets/clubs_Q.svg';
import clubs_K from '../assets/clubs_K.svg';
import diamonds_2 from '../assets/diamonds_2.svg';
import diamonds_3 from '../assets/diamonds_3.svg';
import diamonds_4 from '../assets/diamonds_4.svg';
import diamonds_5 from '../assets/diamonds_5.svg';
import diamonds_6 from '../assets/diamonds_6.svg';
import diamonds_7 from '../assets/diamonds_7.svg';
import diamonds_8 from '../assets/diamonds_8.svg';
import diamonds_9 from '../assets/diamonds_9.svg';
import diamonds_10 from '../assets/diamonds_10.svg';
import diamonds_A from '../assets/diamonds_A.svg';
import diamonds_J from '../assets/diamonds_J.svg';
import diamonds_Q from '../assets/diamonds_Q.svg';
import diamonds_K from '../assets/diamonds_K.svg';
import hearts_2 from '../assets/hearts_2.svg';
import hearts_3 from '../assets/hearts_3.svg';
import hearts_4 from '../assets/hearts_4.svg';
import hearts_5 from '../assets/hearts_5.svg';
import hearts_6 from '../assets/hearts_6.svg';
import hearts_7 from '../assets/hearts_7.svg';
import hearts_8 from '../assets/hearts_8.svg';
import hearts_9 from '../assets/hearts_9.svg';
import hearts_10 from '../assets/hearts_10.svg';
import hearts_A from '../assets/hearts_A.svg';
import hearts_J from '../assets/hearts_J.svg';
import hearts_Q from '../assets/hearts_Q.svg';
import hearts_K from '../assets/hearts_K.svg';
import spades_2 from '../assets/spades_2.svg';
import spades_3 from '../assets/spades_3.svg';
import spades_4 from '../assets/spades_4.svg';
import spades_5 from '../assets/spades_5.svg';
import spades_6 from '../assets/spades_6.svg';
import spades_7 from '../assets/spades_7.svg';
import spades_8 from '../assets/spades_8.svg';
import spades_9 from '../assets/spades_9.svg';
import spades_10 from '../assets/spades_10.svg';
import spades_A from '../assets/spades_A.svg';
import spades_J from '../assets/spades_J.svg';
import spades_Q from '../assets/spades_Q.svg';
import spades_K from '../assets/spades_K.svg';
import cardBack from '../assets/bg.svg';
import { Card, Rank, Suit } from '../shared-types';

// 创建一个巨大的映射表
// ========================================================================
// 完整的资源映射表
// 将导入的资源与逻辑结构（花色和点数）关联起来
// ========================================================================

const cardAssetMap = {
    [Suit.CLUBS]: {
        [Rank.TWO]: clubs_2,
        [Rank.THREE]: clubs_3,
        [Rank.FOUR]: clubs_4,
        [Rank.FIVE]: clubs_5,
        [Rank.SIX]: clubs_6,
        [Rank.SEVEN]: clubs_7,
        [Rank.EIGHT]: clubs_8,
        [Rank.NINE]: clubs_9,
        [Rank.TEN]: clubs_10,
        [Rank.JACK]: clubs_J,
        [Rank.QUEEN]: clubs_Q,
        [Rank.KING]: clubs_K,
        [Rank.ACE]: clubs_A,
    },
    [Suit.DIAMONDS]: {
        [Rank.TWO]: diamonds_2,
        [Rank.THREE]: diamonds_3,
        [Rank.FOUR]: diamonds_4,
        [Rank.FIVE]: diamonds_5,
        [Rank.SIX]: diamonds_6,
        [Rank.SEVEN]: diamonds_7,
        [Rank.EIGHT]: diamonds_8,
        [Rank.NINE]: diamonds_9,
        [Rank.TEN]: diamonds_10,
        [Rank.JACK]: diamonds_J,
        [Rank.QUEEN]: diamonds_Q,
        [Rank.KING]: diamonds_K,
        [Rank.ACE]: diamonds_A,
    },
    [Suit.HEARTS]: {
        [Rank.TWO]: hearts_2,
        [Rank.THREE]: hearts_3,
        [Rank.FOUR]: hearts_4,
        [Rank.FIVE]: hearts_5,
        [Rank.SIX]: hearts_6,
        [Rank.SEVEN]: hearts_7,
        [Rank.EIGHT]: hearts_8,
        [Rank.NINE]: hearts_9,
        [Rank.TEN]: hearts_10,
        [Rank.JACK]: hearts_J,
        [Rank.QUEEN]: hearts_Q,
        [Rank.KING]: hearts_K,
        [Rank.ACE]: hearts_A,
    },
    [Suit.SPADES]: {
        [Rank.TWO]: spades_2,
        [Rank.THREE]: spades_3,
        [Rank.FOUR]: spades_4,
        [Rank.FIVE]: spades_5,
        [Rank.SIX]: spades_6,
        [Rank.SEVEN]: spades_7,
        [Rank.EIGHT]: spades_8,
        [Rank.NINE]: spades_9,
        [Rank.TEN]: spades_10,
        [Rank.JACK]: spades_J,
        [Rank.QUEEN]: spades_Q,
        [Rank.KING]: spades_K,
        [Rank.ACE]: spades_A,
    }
};


/**
 * 根据卡牌数据获取对应的SVG资源
 * @param card 卡牌对象 { suit, rank }
 * @returns 导入的SVG资源
 */
export const getCardAsset = (card: Card): string => {
    // 请确保您的 cardAssetMap 是完整的，或者添加一个默认的返回值
    try {
        // @ts-ignore
        return cardAssetMap[card.suit][card.rank];
    } catch (e) {
        console.warn(`找不到卡牌资源: ${card.suit} ${card.rank}`);
        return cardBack; // 返回牌背作为备用
    }
};

/**
 * 获取牌背的资源
 */
export const getCardBackAsset = (): string => {
    return cardBack;
};