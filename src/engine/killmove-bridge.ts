/**
 * ═══ 杀招桥接模块 — B2.0 ═══
 * 1. normalizeKillMove — 从 killer-moves.json 原始数据加载为标准 KillMove
 * 2. convertKillMoveToDuelMove — KillMove → DuelMove（战斗用）
 * 3. 熟练度倍率计算
 */
import type { KillMove, KillMoveProficiency, KillMoveEffectTag, DuelMove } from '../types';

/** 熟练度 → 伤害倍率修正 */
const PROFICIENCY_MULTIPLIER: Record<number, number> = {
  0: 0.90,  // 入门: -10%
  1: 1.00,  // 熟练: 标准
  2: 1.10,  // 精通: +10%
  3: 1.20,  // 大师: +20%
  4: 1.30,  // 宗师: +30%
};

/** 熟练度 → 冷却修正 */
const PROFICIENCY_COOLDOWN_BONUS: Record<number, number> = {
  0: 0, 1: 0, 2: 1, 3: 1, 4: 2,  // 精通-1, 大师-1, 宗师-2
};

/** 熟练度使用次数阈值 */
export const PROFICIENCY_THRESHOLDS: { min: number; level: KillMoveProficiency }[] = [
  { min: 81, level: 4 },   // 宗师
  { min: 31, level: 3 },   // 大师
  { min: 11, level: 2 },   // 精通
  { min: 4,  level: 1 },   // 熟练
  { min: 1,  level: 0 },   // 入门
];

/**
 * 从 killer-moves.json 原始条目标准化为 KillMove
 * 所有新增字段填充安全默认值，保证38条已有数据兼容
 */
export function normalizeKillMove(raw: Record<string, any>, id: string): KillMove {
  // 自动生成 ID 前缀
  const prefix = raw.isExclusive ? 'ex_' : raw.isOriginal ? 'orig_' : 'canon_';
  return {
    id: raw.id || `${prefix}${id}`,
    name: raw.name || id,
    path: raw.path || '通用',
    level: raw.level || 1,
    baseCost: raw.baseCost ?? (raw.level || 1) * 10,
    multiplier: raw.multiplier ?? 1.5 + (raw.level || 1) * 0.3,
    cooldown: raw.cooldown ?? Math.max(1, 8 - (raw.level || 1)),
    description: raw.description || raw.effect || '',

    // B2.0 新增字段 — 安全默认值
    proficiency: undefined,      // 初始无熟练度
    usageCount: raw.usageCount ?? 0,
    coreGu: raw.coreGu ?? undefined,
    supportGu: raw.supportGu ?? undefined,
    evolutionStage: raw.evolutionStage ?? 0,
    source: raw.source ?? (raw.isExclusive ? 'event' : 'innate'),
    creator: raw.creator ?? (raw.exclusiveOwner ?? undefined),
    canTeach: raw.canTeach ?? false,
    effectTags: raw.effectTags ?? undefined,
  };
}

/**
 * 批量标准化杀招列表
 */
export function normalizeKillMoves(rawEntries: Record<string, any>): KillMove[] {
  const result: KillMove[] = [];
  for (const [key, val] of Object.entries(rawEntries)) {
    if (key.startsWith('_')) continue;
    if (typeof val !== 'object' || !val) continue;
    result.push(normalizeKillMove(val as Record<string, any>, key));
  }
  return result;
}

/**
 * 根据熟练度获取伤害倍率
 */
export function getProficiencyMultiplier(proficiency?: KillMoveProficiency): number {
  if (proficiency === undefined) return 1.0;
  return PROFICIENCY_MULTIPLIER[proficiency] ?? 1.0;
}

/**
 * 根据熟练度获取冷却减免
 */
export function getProficiencyCooldownBonus(proficiency?: KillMoveProficiency): number {
  if (proficiency === undefined) return 0;
  return PROFICIENCY_COOLDOWN_BONUS[proficiency] ?? 0;
}

/**
 * 根据使用次数判定熟练度等级
 */
export function computeProficiency(usageCount: number): KillMoveProficiency {
  for (const t of PROFICIENCY_THRESHOLDS) {
    if (usageCount >= t.min) return t.level;
  }
  return 0;
}

/**
 * KillMove → DuelMove（战斗用）
 * 将玩家已学习杀招转换为战斗引擎可用的 DuelMove
 */
export function convertKillMoveToDuelMove(
  killMove: KillMove,
  playerPathDaoMarks: Record<string, number>,
  pathLevels?: Record<string, string>,
): DuelMove {
  const profMult = getProficiencyMultiplier(killMove.proficiency);
  const pathProficiency = playerPathDaoMarks[killMove.path] || 0;

  // ═══ B3.5: 流派等级伤害加成 ═══
  const level = pathLevels?.[killMove.path] || '普通';
  const pathLevelBonus: Record<string, number> = {
    '普通': 0, '大师': 0.05, '宗师': 0.10, '大宗师': 0.15, '准无上': 0.20, '无上': 0.30, '道主': 0.50,
  };
  const synergyMult = 1 + (pathLevelBonus[level] || 0);

  return {
    name: killMove.name,
    damageMultiplier: killMove.multiplier * profMult * synergyMult,
    pathBonus: pathProficiency * 0.002,
    description: killMove.description,
    killerMoveId: killMove.id,
    requiredCoreGu: killMove.coreGu,
  };
}

/**
 * 杀招使用后更新熟练度
 * @returns 更新后的 proficiency 和 usageCount
 */
export function incrementUsage(killMove: KillMove): { proficiency?: KillMoveProficiency; usageCount: number } {
  const newCount = (killMove.usageCount || 0) + 1;
  const newProf = computeProficiency(newCount);
  // 仅当等级变化时才更新 proficiency
  const changed = newProf !== (killMove.proficiency ?? 0);
  return {
    proficiency: changed ? newProf : undefined,
    usageCount: newCount,
  };
}

/**
 * 检测杀招是否拥有指定效果标签
 */
export function hasEffectTag(killMove: KillMove, tag: KillMoveEffectTag): boolean {
  return killMove.effectTags?.includes(tag) ?? false;
}
