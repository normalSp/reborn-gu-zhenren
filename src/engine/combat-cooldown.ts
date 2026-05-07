/**
 * ═══ 全局战斗冷却系统 — v0.7.0-a P0级 ═══
 *
 * 确保两场战斗之间有足够的叙事空间，防止战斗轰炸。
 * 与 combat-fatigue.ts 独立运作：冷却禁止触发，疲劳降低触发率。
 */

/** 章节密度→基础冷却回合映射 */
export const DENSITY_COOLDOWN: Record<string, number> = {
  sparse: 5,    // 稀疏：至少5回合间隔
  moderate: 3,  // 适中：至少3回合间隔
  dense: 2,     // 密集：至少2回合间隔
  intense: 1,   // 激战：至少1回合间隔
  boss: 1,      // Boss战：冷却1回合（但Boss战本身有入场条件）
};

/** 默认冷却回合（当density未定义时） */
export const DEFAULT_MIN_COOLDOWN = 3;

export interface GlobalCombatCooldownState {
  /** 最后一场战斗发生的回合（0=从未战斗过） */
  lastCombatTurn: number;
  /** 当前章节战斗密度 */
  chapterDensity: string;
}

/** 创建初始冷却状态 */
export function createCooldownState(chapterDensity?: string): GlobalCombatCooldownState {
  return {
    lastCombatTurn: 0,
    chapterDensity: chapterDensity || 'moderate',
  };
}

/**
 * 检查是否处于冷却中 — 冷却期间禁止任何战斗触发
 */
export function isOnCooldown(
  cooldown: GlobalCombatCooldownState,
  currentTurn: number,
): boolean {
  if (cooldown.lastCombatTurn <= 0) return false;
  
  const minCooldown = DENSITY_COOLDOWN[cooldown.chapterDensity] || DEFAULT_MIN_COOLDOWN;
  return (currentTurn - cooldown.lastCombatTurn) < minCooldown;
}

/**
 * 记录战斗并更新冷却计时
 */
export function recordCombatCooldown(
  cooldown: GlobalCombatCooldownState,
  currentTurn: number,
): GlobalCombatCooldownState {
  return { ...cooldown, lastCombatTurn: currentTurn };
}

/**
 * 更新章节密度
 */
export function updateChapterDensity(
  cooldown: GlobalCombatCooldownState,
  density: string,
): GlobalCombatCooldownState {
  return { ...cooldown, chapterDensity: density };
}

/**
 * 获取剩余冷却回合数
 */
export function getRemainingCooldown(
  cooldown: GlobalCombatCooldownState,
  currentTurn: number,
): number {
  if (cooldown.lastCombatTurn <= 0) return 0;
  
  const minCooldown = DENSITY_COOLDOWN[cooldown.chapterDensity] || DEFAULT_MIN_COOLDOWN;
  const elapsed = currentTurn - cooldown.lastCombatTurn;
  return Math.max(0, minCooldown - elapsed);
}
