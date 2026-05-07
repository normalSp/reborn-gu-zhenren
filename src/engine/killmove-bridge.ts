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
    cooldown: raw.cooldown ?? Math.max(0, 4 - Math.floor((raw.level || 1) / 2)),
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
 * v0.7.0: 新增rankMult转数武器因子 + rankPenalty越阶惩罚
 */
export function convertKillMoveToDuelMove(
  killMove: KillMove,
  playerPathDaoMarks: Record<string, number>,
  pathLevels?: Record<string, string>,
  playerRealmNum?: number,
): DuelMove {
  const profMult = getProficiencyMultiplier(killMove.proficiency);
  const pathProficiency = playerPathDaoMarks[killMove.path] || 0;

  // ═══ B3.5: 流派等级伤害加成 ═══
  const level = pathLevels?.[killMove.path] || '普通';
  const pathLevelBonus: Record<string, number> = {
    '普通': 0, '大师': 0.05, '宗师': 0.10, '大宗师': 0.15, '准无上': 0.20, '无上': 0.30, '道主': 0.50,
  };
  const synergyMult = 1 + (pathLevelBonus[level] || 0);

  // ═══ v0.7.0: 转数武器因子（rankMult） ═══
  // 凡级杀招(1-5转): rankMult = 1 + (level-1)*0.15
  // 仙级杀招(6-9转): rankMult = 1 + (level-6)*0.5 + 2.0（额外+2.0基底，体现仙凡质变）
  const isImmortalKillMove = killMove.level >= 6;
  let rankMult: number;
  if (isImmortalKillMove) {
    rankMult = 1.0 + (killMove.level - 6) * 0.5 + 2.0;
  } else {
    rankMult = 1.0 + (killMove.level - 1) * 0.15;
  }

  // ═══ v0.7.0: 越阶惩罚（rankPenalty） ═══
  let rankPenalty: number | undefined;
  if (playerRealmNum !== undefined && killMove.level > playerRealmNum) {
    const overreachSteps = Math.min(4, killMove.level - playerRealmNum);
    // 动态导入combat-config避免循环依赖，直接用内联惩罚表
    const penaltyTable: Record<number, number> = { 1: 0.7, 2: 0.4, 3: 0.2, 4: 0.1 };
    rankPenalty = penaltyTable[overreachSteps] ?? 0.1;
  }

  return {
    name: killMove.name,
    damageMultiplier: killMove.multiplier * profMult * synergyMult * rankMult,
    pathBonus: pathProficiency * 0.002,
    description: killMove.description,
    killerMoveId: killMove.id,
    requiredCoreGu: killMove.coreGu,
    rankPenalty,
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

// ═══════════════════════════════════════════════════════════
// Fix#2: 杀招-蛊虫桥接函数（接入 KillMoveCreationPanel）
// ═══════════════════════════════════════════════════════════

import type { GuInstance } from '../types';

/** 流派互补充系映射（用于辅助蛊推荐，与 KillMoveCreationPanel 共享） */
const COMPATIBLE_PATHS: Record<string, string[]> = {
  '金道': ['土道', '力道'], '木道': ['水道', '毒道'], '水道': ['冰道', '木道'],
  '火道': ['风道', '土道'], '土道': ['金道', '火道'], '风道': ['火道', '雷道'],
  '雷道': ['金道', '风道'], '冰道': ['水道', '风道'], '力道': ['土道', '金道'],
  '魂道': ['暗道', '智道'], '血道': ['力道', '毒道'], '智道': ['光道', '魂道'],
  '光道': ['火道', '智道'], '暗道': ['魂道', '骨道'], '毒道': ['木道', '血道'],
  '骨道': ['暗道', '土道'], '奴道': ['魂道', '力道'], '食道': ['木道', '水道'],
  '偷道': ['暗道', '风道'], '变化道': ['水道', '火道'],
  '炼道': ['金道', '火道'], '剑道': ['金道', '力道'],
};

export interface KillMoveGuSlotInfo {
  /** 核心蛊槽位数 */
  coreSlots: number;
  /** 辅助蛊槽位数 */
  supportSlots: number;
  /** 当前已使用的核心蛊名称 */
  coreGuNames: string[];
  /** 当前已使用的辅助蛊名称 */
  supportGuNames: string[];
}

/**
 * 获取杀招的蛊虫槽位信息
 * @param killMove 目标杀招
 * @returns 核心蛊/辅助蛊槽位详情
 */
export function getKillMoveGuSlots(killMove: KillMove): KillMoveGuSlotInfo {
  return {
    coreSlots: 1, // 杀招始终需要1个核心蛊
    supportSlots: Math.min(5, killMove.level + 1), // 辅助蛊槽位数 = 转数+1（上限5）
    coreGuNames: killMove.coreGu || [],
    supportGuNames: killMove.supportGu || [],
  };
}

/**
 * 校验蛊虫与杀招的兼容性
 * @param killMove 目标杀招
 * @param gu 待校验的蛊虫实例
 * @returns 兼容性结果
 */
export function checkKillMoveGuCompatibility(
  killMove: KillMove,
  gu: GuInstance,
): { compatible: boolean; reason?: string } {
  // 死蛊不可用
  if (gu.currentState === 'dead') {
    return { compatible: false, reason: '蛊虫已死亡' };
  }
  // 未激活的蛊不可用
  if ((gu as any).active === false) {
    return { compatible: false, reason: '蛊虫未激活' };
  }
  // 同流派完全兼容
  const guPath = gu.path as string;
  const killPath = killMove.path as string;
  if (guPath === killPath) {
    return { compatible: true };
  }
  // 互补流派兼容
  const compatiblePaths = COMPATIBLE_PATHS[killPath] || [];
  if (compatiblePaths.includes(guPath)) {
    return { compatible: true };
  }
  // 通用流派（炼道）始终兼容
  if (guPath === '炼道') {
    return { compatible: true };
  }
  return { compatible: false, reason: `${guPath}与${killPath}无流派互补关系` };
}

/**
 * 从蛊虫背包推荐最优辅助蛊
 * @param inventory 玩家当前蛊虫背包
 * @param killMove 目标杀招
 * @param count 需要推荐的辅助蛊数量
 * @returns 按推荐度排序的蛊虫实例列表
 */
export function suggestGuForKillMove(
  inventory: GuInstance[],
  killMove: KillMove,
  count: number = 3,
): GuInstance[] {
  const killPath = killMove.path as string;
  const compatiblePaths = COMPATIBLE_PATHS[killPath] || [];

  // 过滤可用蛊虫（排除核心蛊已占用的）
  const coreGuNames = new Set(killMove.coreGu || []);
  const available = inventory.filter(g =>
    g.currentState !== 'dead' &&
    (g as any).active !== false &&
    !coreGuNames.has(g.name),
  );

  // 评分：同流派10分 > 互补流派5分 > 炼道3分 > 其他1分
  const scored = available.map(g => {
    const gPath = g.path as string;
    let score = 1;
    if (gPath === killPath) score = 10;
    else if (compatiblePaths.includes(gPath)) score = 5;
    else if (gPath === '炼道') score = 3;
    // 按转数加权
    score += (g.tier || 1) * 0.5;
    return { gu: g, score };
  });

  // 按评分降序排列
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map(s => s.gu);
}
