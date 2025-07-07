// backend/src/ai/openrouter-agent.ts

import path from 'path';
import * as dotenv from 'dotenv';
import { ActionLog, ActionType, Card, GamePhase, GameState, PlayerAction, PlayerStatus, Rank, Suit } from '../../src/shared-types';

// 使用绝对路径加载 .env 文件，确保无论从哪里启动都能找到
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// =================================================================================
// 1. 新的系统指令 (System Prompt)
//    我们把您提供的详细指令存储为一个常量。
// =================================================================================
const SYSTEM_PROMPT = `# 角色与最高指令
你是一个名为 "PokerGPT-Zero" 的世界顶级德州扑克AI。你的决策逻辑深度融合了GTO（最优博弈论）和针对性的玩家剥削策略。你的核心任务是进行精确、量化的分析，并返回一个严格遵守格式的JSON对象。任何偏离指定格式的输出都是不可接受的。

# 核心任务：行动决策
根据下方以JSON格式提供的完整牌局状态，执行深度分析，并以一个严格的JSON对象格式返回你的最终决策。

## 关键约束：行动定义 (Action Definition)
你的最终决策 \`decision.action\` 字段 **必须且只能** 是以下四个大写字符串之一：
- "FOLD": 弃牌
- "CHECK": 过牌 (当轮到你行动且前方无人下注时)
- "CALL": 跟注 (跟注对手的下注或完成大盲注)
- "RAISE": 加注

**重要概念映射规则:**
- 任何形式的 **加注** (如 pre-flop 3-bet, 4-bet; post-flop c-bet, check-raise, probe bet) 都必须被归类为 "RAISE"。具体的意图和大小体现在 \`decision.amount\` 和 \`thinking_process\` 中。
- **跛入 (Limping)** 被归类为 "CALL" (在翻牌前跟注大盲注)。
- 如果轮到你行动，但你无法执行某个动作（例如，前面有人下注时你不能\`CHECK\`），你的逻辑必须选择一个合法的动作。

# 输入数据 (JSON格式)
{
  "game_id": "G-54321",
  "game_type": "No-Limit Hold'em Tournament",
  "stage": "{game_stage}", // "Pre-flop", "Flop", "Turn", "River"
  "player_count": {
    "total_at_table": 6,
    "active_in_hand": 4
  },
  "blinds": { "sb": 10, "bb": 20 },
  "my_info": {
    "position": "{my_position}", // "UTG", "MP", "CO", "BTN", "SB", "BB"
    "hand": ["As", "Kd"],
    "stack": 1980
  },
  "community_cards": ["Ah", "Qc", "Ts"],
  "pot_total": 120,
  "action_context": {
    "bet_to_call": 60,
    "min_raise_to": 120,
    "effective_stack": 1800, // 我与主要对手之间较小的筹码量
    "spr": 15.0 // 有效筹码量 / 底池大小，仅在post-flop有意义
  },
  "action_history": [
    { "position": "UTG", "player": "Player_A", "action": "raise", "amount": 60 },
    { "position": "CO", "player": "Player_B", "action": "call", "amount": 60 }
  ],
  "opponent_profiles": [
    { "position": "UTG", "player": "Player_A", "stack": 1800, "notes": "Tight-Aggressive, rarely bluffs." },
    { "position": "CO", "player": "Player_B", "stack": 2200, "notes": "Loose-Passive, calls too often." }
  ]
}

# 思考与决策指令 (Chain of Thought & Output)
1.  **深度思考链 (Mandatory Analysis Steps):** 在内心完成以下所有分析，并将结果清晰地组织在输出JSON的 \`thinking_process\` 字段中。
    a.  **手牌与范围分析 (Hand & Range Analysis):** 我的手牌在我的位置的起手范围中处于什么水平？它对抗对手可能的范围时胜率(Equity)如何？
    b.  **牌面结构分析 (Board Texture Analysis - Post-flop only):** 公共牌是“湿润”的（多听牌、多联系）还是“干燥”的（无联系）？是静态还是动态牌面？这如何影响我的手牌价值和策略？
    c.  **位置与动态分析 (Positional & Dynamic Analysis):** 我是否有位置优势？我和对手的位置组合（例如BTN vs BB）通常意味着什么？
    d.  **数学指标分析 (Mathematical Analysis):**
        - **底池赔率 (Pot Odds):** \`(bet_to_call) / (pot_total + bet_to_call)\`，跟注是否从数学上划算？
        - **底池筹码比 (SPR - Post-flop only):** SPR的值是多少？高SPR对听牌有利，低SPR对成牌有利。我的策略应该如何根据SPR调整？
    e.  **对手建模 (Opponent Modeling):** 结合对手的历史行动和玩家画像，推断他们当前的范围。UTG的紧凶玩家加注代表什么？CO的跟注站玩家跟注又代表什么？
    f.  **策略制定 (Strategy Formulation):** 综合以上所有信息，我当前的目标是价值下注、诈唬、控制底池还是半诈唬？为什么？
    g.  **下注尺度 (Bet Sizing):** 如果决定RAISE，最佳的下注金额是多少？（例如：价值下注打底池的70%，诈唬下注打底池的50%，或全下 all-in）。将此金额作为最终决策。

2.  **输出格式 (Strict Output Format):** 你的最终输出 **必须** 是一个严格的、不包含任何额外解释性文字的JSON对象。下面是一个必须遵守的范例。
---
# 格式化输出范例 (Few-Shot Example)
## 范例输入:
(假设一个场景：我在BTN位置用 [Ac, Kc] 面对UTG的加注，我决定3-bet)
## 范例输出 (你必须模仿这个结构和格式):
\`\`\`json
{
  "thinking_process": {
    "hand_and_range_analysis": "AcKc is a premium hand, at the top 5% of my Button range. It has excellent equity against a typical UTG opening range.",
    "board_texture_analysis": "N/A (Pre-flop).",
    "positional_and_dynamic_analysis": "I am on the Button (BTN), the best position. I can isolate the initial raiser and force players in the blinds to fold.",
    "mathematical_analysis": {
      "pot_odds": "N/A for a re-raise decision.",
      "spr": "N/A (Pre-flop)."
    },
    "opponent_modeling": "UTG is noted as a TAG player. Their opening range is strong (e.g., 77+, ATs+, KQs, AJo+). My hand plays very well against this range.",
    "strategy_formulation": "This is a clear value 3-bet. The goal is to build a bigger pot with a superior hand and isolate the opponent.",
    "bet_sizing_logic": "A standard 3-bet size from in-position is 3x the initial raise. Initial raise was 60, so 3x is 180. This puts pressure on the opponent and builds the pot appropriately."
  },
  "decision": {
    "action": "RAISE",
    "amount": 180
  }
}
\`\`\``;


// =================================================================================
// 1. 新增：AI输入格式的“契约”接口 (AIPromptInput)
//    这就是您想要的“结构体”。它严格定义了AI期望的输入格式。
// =================================================================================
interface AIPromptInput {
    game_id: string | null;
    game_type: string;
    stage: string;
    player_count: {
        total_at_table: number;
        active_in_hand: number;
    };
    blinds: {
        sb: number;
        bb: number;
    };
    my_info: {
        position: string;
        hand: string[];
        stack: number;
    };
    community_cards: string[];
    pot_total: number;
    action_context: {
        bet_to_call: number;
        min_raise_to: number;
        effective_stack: number;
        spr: number | null; // SPR 在翻牌前是 null
    };
    action_history: Array<{
        position: string;
        player: string;
        action: string;
        amount: number;
    }>;
    opponent_profiles: Array<{
        position: string;
        player: string;
        stack: number;
        notes: string;
    }>;
}
// =================================================================================
// 新增：Card对象到字符串的转换辅助函数
// 这是解决 `Card[]` to `string[]` 错误的关键
// =================================================================================
function cardToString(card: Card): string {
    const rankMap: { [key in Rank]?: string } = {
        [Rank.TEN]: 'T', [Rank.JACK]: 'J', [Rank.QUEEN]: 'Q', [Rank.KING]: 'K', [Rank.ACE]: 'A'
    };
    const rankStr = rankMap[card.rank] || card.rank.toString();
    
    // 为了让输出更标准 (e.g., "Spades" -> "s"), 我们做一个简单的映射
    const suitMap: { [key in Suit]: string } = {
        [Suit.SPADES]: 's', [Suit.HEARTS]: 'h', [Suit.DIAMONDS]: 'd', [Suit.CLUBS]: 'c'
    };
    const suitStr = suitMap[card.suit];

    return rankStr + suitStr;
}

// =================================================================================
// 2. 新增：“游戏状态”到“AI输入”的转换器函数
//    这个函数是核心的“翻译官”，负责将内部状态转换为AI需要的格式。
// =================================================================================
function gameStateToAIPromptInput(gameState: GameState, playerIndex: number): AIPromptInput {
    const aiPlayer = gameState.players[playerIndex];
    const activePlayers = gameState.players.filter(p => p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.SITTING_OUT);
    const opponentPlayers = gameState.players.filter(p => p.id !== aiPlayer.id);

    const betToCall = gameState.currentRoundBet - aiPlayer.currentRoundBet; // FIX: 使用 currentRoundBet
    const opponentStacks = activePlayers.filter(p => p.id !== aiPlayer.id).map(p => p.stack);
    const effectiveStack = Math.min(aiPlayer.stack, ...opponentStacks);
    const spr = (gameState.gamePhase > GamePhase.PRE_FLOP && gameState.pot > 0)
        ? parseFloat((effectiveStack / gameState.pot).toFixed(2))
        : null;

    const gameStageMap: { [key in GamePhase]?: string } = {
        [GamePhase.PRE_FLOP]: "Pre-flop", [GamePhase.FLOP]: "Flop",
        [GamePhase.TURN]: "Turn", [GamePhase.RIVER]: "River",
    };

    return {
        game_id: gameState.gameId,
        game_type: "No-Limit Hold'em Tournament",
        stage: gameStageMap[gameState.gamePhase] || "Unknown",
        player_count: {
            total_at_table: gameState.players.length,
            active_in_hand: activePlayers.length,
        },
        blinds: {
            // FIX: 使用 currentRoundBet
            sb: gameState.players[gameState.smallBlindIndex!]?.currentRoundBet || 0,
            bb: gameState.players[gameState.bigBlindIndex!]?.currentRoundBet || 0,
        },
        my_info: {
            position: getPlayerPosition(playerIndex, gameState.players.length, gameState.dealerIndex, gameState.smallBlindIndex!, gameState.bigBlindIndex!),
            hand: aiPlayer.hand.map(cardToString), // FIX: 使用 map 进行转换
            stack: aiPlayer.stack,
        },
        community_cards: gameState.communityCards.map(cardToString), // FIX: 使用 map 进行转换
        pot_total: gameState.pot,
        action_context: {
            bet_to_call: betToCall,
            min_raise_to: gameState.minRaiseAmount + gameState.currentRoundBet,
            effective_stack: effectiveStack,
            spr: spr,
        },
        action_history: gameState.actionHistory.map((entry: ActionLog) => { // FIX: 明确 entry 类型
            const player = gameState.players.find(p => p.id === entry.playerId);
            const pIndex = gameState.players.findIndex(p => p.id === entry.playerId);
            return {
                position: player ? getPlayerPosition(pIndex, gameState.players.length, gameState.dealerIndex, gameState.smallBlindIndex!, gameState.bigBlindIndex!) : 'N/A',
                player: player?.name || 'Unknown',
                action: entry.action.toLowerCase(), // FIX: 直接使用 entry.action
                amount: entry.amount,
            };
        }),
        opponent_profiles: opponentPlayers.map(p => {
             const pIndex = gameState.players.findIndex(pl => pl.id === p.id);
             return {
                position: getPlayerPosition(pIndex, gameState.players.length, gameState.dealerIndex, gameState.smallBlindIndex!, gameState.bigBlindIndex!),
                player: p.name,
                stack: p.stack,
                notes: `Status: ${PlayerStatus[p.status]}, Current Bet: ${p.currentRoundBet}`, // FIX: 使用 currentRoundBet
             }
        }),
    };
}


// =================================================================================
// 3. 主函数 getAIPlayerAction (现已大幅简化)
//    它只负责调用转换器，序列化，然后发送请求。
// =================================================================================
export async function getAIPlayerAction(gameState: GameState, playerIndex: number): Promise<PlayerAction> {
    const player = gameState.players[playerIndex];
    console.log(gameState);
    if (!OPENROUTER_API_KEY) {
        console.error("错误: OPENROUTER_API_KEY 环境变量未设置。");
        return { playerId: player.id, type: ActionType.FOLD};
    }

    try {
        // 步骤 1: 调用转换器，得到一个类型安全的对象
        const aiPromptInputObject = gameStateToAIPromptInput(gameState, playerIndex);

        // 步骤 2: 将该对象序列化为JSON字符串
        const userInput = JSON.stringify(aiPromptInputObject, null, 2);
        console.log(`[AI PROMPT] Generated prompt for AI player ${player.name}:\n`, userInput);

        // 步骤 3: 发送请求
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "openai/gpt-4o",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userInput }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                response_format: { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const aiResponseText = data.choices[0].message.content;

        // 步骤 4: 解析响应 (这部分逻辑不变)
        return parseAIResponse(aiResponseText, player.id, gameState);

    } catch (error) {
        console.error(`[AI ERROR] Error processing AI action for player ${player.name}:`, error);
        return { playerId: player.id, type: ActionType.FOLD };
    }
}


// =================================================================================
// 4. 辅助函数与解析函数 (保持不变)
// =================================================================================

// 工具函数：获取玩家位置名称 (保持不变)
function getPlayerPosition(playerIndex: number, playerCount: number, dealerIndex: number, smallBlindIndex: number, bigBlindIndex: number): string {
    if (playerIndex === smallBlindIndex) return "SB";
    if (playerIndex === bigBlindIndex) return "BB";
    if (playerIndex === dealerIndex) return "BTN";
    const relativePosition = (playerIndex - dealerIndex + playerCount) % playerCount;
    if (playerCount <= 6) { // 假设6人桌
        switch (relativePosition) {
            case 3: return "UTG";
            case 4: return "MP";
            case 5: return "CO";
            default: return "Unknown";
        }
    }
    return "Unknown";
}

// AI响应解析函数 (保持不变)
function parseAIResponse(response: string, playerId: string, gameState: GameState): PlayerAction {
    console.log(`[AI DEBUG] Raw response from AI for player ${playerId}:`, response);
    try {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : response;
        const parsed = JSON.parse(jsonString);

        if (!parsed.decision || !parsed.decision.action) {
            throw new Error("Invalid response structure: 'decision.action' is missing.");
        }

        const actionStr: string = parsed.decision.action.toUpperCase();
        const amount: number = parsed.decision.amount || 0;
        let actionType: ActionType;
        let finalAmount = 0;

        switch (actionStr) {
            case "FOLD": actionType = ActionType.FOLD; break;
            case "CHECK": actionType = ActionType.CHECK; break;
            case "CALL":
                actionType = ActionType.CALL;
                const player = gameState.players.find(p => p.id === playerId);
                finalAmount = gameState.currentRoundBet - (player?.currentRoundBet || 0);
                break;
            case "RAISE":
                actionType = ActionType.RAISE;
                finalAmount = amount;
                break;
            default: throw new Error(`Unknown action string: ${actionStr}`);
        }
        return { playerId, type: actionType, amount: finalAmount };
    } catch (error) {
        console.error(`[AI ERROR] Failed to parse AI response for ${playerId}. Defaulting to FOLD.`, error);
        return { playerId, type: ActionType.FOLD};
    }
}