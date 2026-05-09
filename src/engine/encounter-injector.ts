/**
 * 随机遭遇注入引擎 — P2-9
 * 纯函数，无副作用：章节过滤 → 境界过滤 → 加权选择 → 概率判定 → 冷却管理 → 构建注入上下文
 *
 * 设计原则：
 * - 所有数据来自传入参数，不读取全局状态
 * - 概率通过加权随机实现，确保可测试性
 * - 冷却管理基于轮数差值，简单可靠
 */

import type {
  EncounterTemplate,
  EncounterTriggerResult,
  EncounterInjectionContext,
  EncounterType,
  EncounterCooldown,
} from '../types/encounter';
import { applyEncounterRiskModifiers, formatModifierBreakdown, type ModifierContext } from './modifier-engine';

// ─── 类型权重配置 ───
const TYPE_WEIGHTS: Record<EncounterType, number> = {
  danger: 15,
  opportunity: 20,
  social: 30,
  exploration: 25,
  rest: 10,
};

// ─── 基础触发概率 ───
const BASE_TRIGGER_CHANCE = 0.45;

/**
 * 遭遇注入器 — 核心纯函数
 * @param templates 所有可用模板
 * @param currentChapterId 当前章节ID
 * @param playerRealm 玩家境界数值（1-9）
 * @param currentTurn 当前回合数
 * @param playerFlags 玩家当前flag集合
 * @param playerCurrency 玩家当前元石
 * @param recentTypes 最近触发的遭遇类型列表（用于冷却检测）
 * @param cooldownTimers 冷却计时器记录 { 'type-chapterId' → 最后触发轮数 }
 * @param currentDomain 当前所在域（南疆/北原/东海/西漠/中洲）
 * @param currentLocation 当前位置描述字符串
 * @param hasGu 是否拥有蛊虫
 * @param seed 随机种子（用于测试可重复性，生产环境传 Math.random）
 * @returns 触发结果
 */
export function checkAndTriggerEncounter(
  templates: EncounterTemplate[],
  currentChapterId: string,
  playerRealm: number,
  currentTurn: number,
  playerFlags: Record<string, any>,
  playerCurrency: number,
  recentTypes: EncounterType[],
  cooldownTimers: Record<string, number>,
  currentDomain: string,
  currentLocation: string,
  hasGu: boolean,
  seed: () => number = Math.random,
  modifierContext: ModifierContext = {},
): EncounterTriggerResult {
  const riskQuote = applyEncounterRiskModifiers(BASE_TRIGGER_CHANCE, {
    ...modifierContext,
    operation: 'encounter',
  });
  // ═══ 步骤1: 区域过滤 — 按当前域过滤模板 ═══
  const chapterTemplates = templates.filter(
    t => t.triggerConditions.region === currentDomain
  );

  if (chapterTemplates.length === 0) {
    return { triggered: false, reason: 'no_chapter_templates' };
  }

  // ═══ 步骤2: 境界过滤 ═══
  const realmFiltered = chapterTemplates.filter(t => {
    const c = t.triggerConditions;
    return playerRealm >= c.minRealm && playerRealm <= c.maxRealm;
  });

  if (realmFiltered.length === 0) {
    return { triggered: false, reason: 'no_realm_match' };
  }

  // ═══ 步骤3: 轮数过滤 + 冷却检查 ═══
  const eligibleFiltered = realmFiltered.filter(t => {
    const c = t.triggerConditions;
    // 最低轮数要求
    if (currentTurn < c.minTurn) return false;
    // 最低元石要求
    if (c.minCurrency && playerCurrency < c.minCurrency) return false;
    // 蛊虫要求
    if (c.requiresGu && !hasGu) return false;
    // 同类型冷却检查
    const keySameType = `type-${t.type}`;
    const lastSameType = cooldownTimers[keySameType] ?? 0;
    if (currentTurn - lastSameType < c.cooldown.sameType) return false;
    // 同章冷却检查
    const keySameChapter = `ch-${currentChapterId}`;
    const lastSameChapter = cooldownTimers[keySameChapter] ?? 0;
    if (currentTurn - lastSameChapter < c.cooldown.sameChapter) return false;

    return true;
  });

  if (eligibleFiltered.length === 0) {
    return { triggered: false, reason: 'all_on_cooldown' };
  }

  // ═══ 步骤4: 位置关键词匹配（软过滤，加分而非排除） ═══
  const locationLower = currentLocation.toLowerCase();
  const scored = eligibleFiltered.map(t => {
    let score = TYPE_WEIGHTS[t.type] || 10;
    if (t.type === 'danger') {
      score *= riskQuote.riskMultiplier;
    } else if ((t.type === 'rest' || t.type === 'opportunity') && riskQuote.riskMultiplier < 1) {
      score *= 1 + (1 - riskQuote.riskMultiplier) * 0.25;
    }
    // 位置关键词匹配加分
    const keywords = t.triggerConditions.locationKeyword;
    const hasKeywordMatch = keywords.some(kw => {
      if (kw === 'any') return true;
      return locationLower.includes(kw.toLowerCase());
    });
    if (hasKeywordMatch) score *= 1.5;
    return { template: t, score };
  });

  // ═══ 步骤5: 加权随机选择 ═══
  const totalWeight = scored.reduce((sum, s) => sum + s.score, 0);
  let roll = seed() * totalWeight;
  let selected: EncounterTemplate | null = null;

  for (const s of scored) {
    roll -= s.score;
    if (roll <= 0) {
      selected = s.template;
      break;
    }
  }
  // 浮点精度兜底
  if (!selected) selected = scored[scored.length - 1].template;

  // ═══ 步骤6: 概率判定 ═══
  const triggerRoll = seed();
  if (triggerRoll > riskQuote.triggerChance) {
    return {
      triggered: false,
      reason: 'probability_check_failed',
      riskModifier: {
        riskMultiplier: riskQuote.riskMultiplier,
        triggerChance: riskQuote.triggerChance,
        labels: formatModifierBreakdown(riskQuote.breakdown),
      },
    };
  }

  // ═══ 步骤7: 构建注入上下文 ═══
  const injectionCtx = buildInjectionContext(selected, currentLocation);

  return {
    triggered: true,
    template: selected,
    riskModifier: {
      riskMultiplier: riskQuote.riskMultiplier,
      triggerChance: riskQuote.triggerChance,
      labels: formatModifierBreakdown(riskQuote.breakdown),
    },
  };
}

/**
 * 构建AI注入上下文 — 将选中的遭遇模板转化为可注入 prompt 的结构化文本
 */
export function buildInjectionContext(
  template: EncounterTemplate,
  currentLocation: string,
): EncounterInjectionContext {
  const narrative = template.narrativeTemplate.replace(/\{location\}/g, currentLocation);

  return {
    encounterId: template.id,
    type: template.type,
    title: template.title,
    narrativeTemplate: narrative,
    choices: template.choices,
    rewards: template.rewards,
  };
}

/**
 * 计算内容密度 — 判断当前叙事是否过于稀薄，需要注入遭遇
 * @param lastNarrativeLength 上次AI返回的叙事文本字数
 * @param turnsSinceLastEncounter 距离上次遭遇的轮数
 * @returns 是否需要注入
 */
export function shouldInjectEncounter(
  lastNarrativeLength: number,
  turnsSinceLastEncounter: number,
): boolean {
  // 叙事文本少于100字 → 强烈需要
  if (lastNarrativeLength < 100) return true;
  // 叙事文本300字以上 → 内容充实，减少遭遇频率
  if (lastNarrativeLength > 300 && turnsSinceLastEncounter < 3) return false;
  // 超过5轮没有遭遇 → 必须注入
  if (turnsSinceLastEncounter >= 5) return true;
  // 默认概率
  return turnsSinceLastEncounter >= 3;
}

/**
 * 更新冷却计时器 — 选择遭遇后记录冷却
 */
export function updateCooldownTimers(
  timers: Record<string, number>,
  template: EncounterTemplate,
  chapterId: string,
  currentTurn: number,
): Record<string, number> {
  const updated = { ...timers };
  updated[`type-${template.type}`] = currentTurn;
  updated[`ch-${chapterId}`] = currentTurn;
  return updated;
}
