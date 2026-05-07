/**
 * ═══ 战斗疲劳系统 — v0.7.0-a P0级 ═══
 * 
 * 防止玩家连续战斗导致的体验疲劳。
 * - 每场战斗后累加疲劳值
 * - 每回合自然衰减
 * - 疲劳>80时降低遭遇率和战斗意愿
 */
export interface CombatFatigueState {
  /** 当前疲劳值 0-100 */
  value: number;
  /** 最后一场战斗的回合 */
  lastCombatTurn: number;
  /** 连续战斗次数（连胜增加疲劳加成） */
  consecutiveCombats: number;
}

/** 疲劳效果配置 */
export const FATIGUE_EFFECTS = {
  /** 疲劳>80时遭遇率乘数 */
  highFatigueEncounterMult: 0.4,
  /** 疲劳>60时遭遇率乘数 */
  moderateFatigueEncounterMult: 0.7,
  /** 疲劳>80时AI叙事偏好"避开战斗" */
  narrativeAvoidCombatThreshold: 80,
} as const;

/** 创建初始疲劳状态 */
export function createFatigueState(): CombatFatigueState {
  return { value: 0, lastCombatTurn: 0, consecutiveCombats: 0 };
}

/**
 * 计算战斗后的疲劳增量（累加基础值 + 连战加成）
 * @returns 新增疲劳值
 */
export function calcFatigueGain(fatigue: CombatFatigueState, combatDifficulty: number): number {
  // 基础10点 + 难度加成(difficulty 1-5每级+3) + 连战加成(每2连战+5)
  const base = 10;
  const difficultyBonus = Math.max(0, combatDifficulty - 1) * 3;
  const consecutiveBonus = Math.floor(fatigue.consecutiveCombats / 2) * 5;
  return Math.min(50, base + difficultyBonus + consecutiveBonus);
}

/**
 * 每回合疲劳自然衰减
 * @param currentTurn 当前回合
 * @returns 衰减后的疲劳值
 */
export function decayFatigue(fatigue: CombatFatigueState, currentTurn: number): number {
  const turnsSinceLastCombat = currentTurn - fatigue.lastCombatTurn;
  if (turnsSinceLastCombat <= 0) return fatigue.value;
  
  // 每回合衰减3点，有战斗冷却时衰减翻倍（休息效果好）
  const decay = turnsSinceLastCombat * 3;
  const newValue = Math.max(0, fatigue.value - decay);
  
  // 疲劳<10时重置连战计数
  return newValue;
}

/**
 * 记录一场战斗并更新疲劳
 */
export function recordCombat(
  fatigue: CombatFatigueState,
  currentTurn: number,
  difficulty: number,
): CombatFatigueState {
  const gain = calcFatigueGain(fatigue, difficulty);
  // 连战判定：上次战斗在同一回合或上一回合 → 连战
  const isConsecutive = fatigue.lastCombatTurn > 0 && (currentTurn - fatigue.lastCombatTurn) <= 2;
  const consecutiveCombats = isConsecutive ? fatigue.consecutiveCombats + 1 : 1;
  
  // 如果非连战，疲劳先从上次值衰减
  const baseValue = isConsecutive ? fatigue.value : Math.max(0, fatigue.value);
  
  return {
    value: Math.min(100, baseValue + gain),
    lastCombatTurn: currentTurn,
    consecutiveCombats,
  };
}

/**
 * 获取当前疲劳对遭遇率的修正系数
 */
export function getFatigueEncounterMult(fatigue: CombatFatigueState): number {
  if (fatigue.value > 80) return FATIGUE_EFFECTS.highFatigueEncounterMult;
  if (fatigue.value > 60) return FATIGUE_EFFECTS.moderateFatigueEncounterMult;
  return 1.0;
}

/**
 * 疲劳Tick — 每回合调用：衰减并返回新状态
 */
export function tickFatigue(fatigue: CombatFatigueState, currentTurn: number): CombatFatigueState {
  const newValue = decayFatigue(fatigue, currentTurn);
  
  // 疲劳<10时完全恢复连战计数
  if (newValue < 10 && fatigue.value >= 10) {
    return { value: newValue, lastCombatTurn: fatigue.lastCombatTurn, consecutiveCombats: 0 };
  }
  
  return { ...fatigue, value: newValue };
}
