/**
 * ═══ 杀招进化引擎 — B2.2 ═══
 * 满足条件（修为+道痕+流派等级）→ 消耗材料 → 杀招升级转数
 */
import type { KillMove, KillMoveProficiency, PathType } from '../types';
import { useStore } from '../store';
import { computePathLevel } from './path-progression';
import type { PathLevel } from '../types';

/** 进化条件 */
export interface EvolutionCondition {
  /** 需要达到的境界转数 */
  requiredRealm: number;
  /** 需要的主流派道痕数 */
  requiredDaoMarks: number;
  /** 需要的流派境界 */
  requiredPathLevel: PathLevel;
  /** 消耗元石 */
  currencyCost: number;
  /** 消耗同流派蛊材数量 */
  materialCost: number;
}

/** 进化结果 */
export interface EvolutionResult {
  success: boolean;
  message: string;
  /** 进化后的杀招（成功时） */
  evolvedKillMove?: KillMove;
}

/** 各转数进化条件表 */
const EVOLUTION_TABLE: Record<number, EvolutionCondition> = {
  1: { requiredRealm: 1, requiredDaoMarks: 50,  requiredPathLevel: '普通',   currencyCost: 50,   materialCost: 2 },
  2: { requiredRealm: 2, requiredDaoMarks: 100, requiredPathLevel: '大师',   currencyCost: 150,  materialCost: 3 },
  3: { requiredRealm: 3, requiredDaoMarks: 200, requiredPathLevel: '宗师',   currencyCost: 500,  materialCost: 5 },
  4: { requiredRealm: 4, requiredDaoMarks: 500, requiredPathLevel: '大宗师', currencyCost: 1500, materialCost: 8 },
  5: { requiredRealm: 5, requiredDaoMarks: 1500,requiredPathLevel: '准无上', currencyCost: 5000, materialCost: 12 },
};

/**
 * 检查杀招是否满足进化条件
 */
export function checkEvolution(killMove: KillMove): {
  canEvolve: boolean;
  condition?: EvolutionCondition;
  missingReqs: string[];
} {
  const store = useStore.getState() as any;
  const targetTier = (killMove.evolutionStage || 0) + killMove.level + 1;
  if (targetTier > 5) return { canEvolve: false, missingReqs: ['已达凡蛊杀招上限'] };

  const condition = EVOLUTION_TABLE[targetTier];
  if (!condition) return { canEvolve: false, missingReqs: ['无进化路径'] };

  const missingReqs: string[] = [];
  const realm = store.profile?.realm?.grand || 1;
  const daoMarks = store.pathBuild?.dao_marks || {};
  const pathMarks = daoMarks[killMove.path] || 0;
  const pathLevel = computePathLevel(pathMarks);

  if (realm < condition.requiredRealm) missingReqs.push(`境界不足(需${condition.requiredRealm}转)`);
  if (pathMarks < condition.requiredDaoMarks) missingReqs.push(`道痕不足(${pathMarks}/${condition.requiredDaoMarks})`);
  if (!isPathLevelAtLeast(pathLevel, condition.requiredPathLevel)) missingReqs.push(`流派境界不足(需${condition.requiredPathLevel})`);

  return {
    canEvolve: missingReqs.length === 0,
    condition,
    missingReqs,
  };
}

function isPathLevelAtLeast(current: PathLevel, target: PathLevel): boolean {
  const ranking: PathLevel[] = ['普通', '大师', '宗师', '大宗师', '准无上', '无上', '道主'];
  return ranking.indexOf(current) >= ranking.indexOf(target);
}

/**
 * 执行杀招进化
 */
export function evolveKillMove(killMove: KillMove): EvolutionResult {
  const check = checkEvolution(killMove);
  if (!check.canEvolve) {
    return { success: false, message: `不满足进化条件：${check.missingReqs.join('、')}` };
  }

  const store = useStore.getState() as any;
  const condition = check.condition!;
  const materialName = `${resolveGradeForEvolution(killMove.level + (killMove.evolutionStage || 0) + 1)}蛊材`;

  // 消耗检查
  if (store.currency < condition.currencyCost) {
    return { success: false, message: `元石不足(需${condition.currencyCost})` };
  }
  const matBag = store.materialBag || {};
  if ((matBag[materialName] || 0) < condition.materialCost) {
    return { success: false, message: `${materialName}不足(需${condition.materialCost})` };
  }

  // 消耗
  store.spendCurrency?.(condition.currencyCost);
  store.removeMaterial?.(materialName, condition.materialCost);

  // 进化
  const newStage = (killMove.evolutionStage || 0) + 1;
  const evolved: KillMove = {
    ...killMove,
    level: killMove.level + 1,
    evolutionStage: newStage,
    multiplier: killMove.multiplier + 0.3,
    baseCost: killMove.baseCost + 10,
    description: killMove.description + `（已进化${newStage}次）`,
  };

  return { success: true, message: `杀招进化成功！「${killMove.name}」提升至${evolved.level}转`, evolvedKillMove: evolved };
}

function resolveGradeForEvolution(tier: number): string {
  if (tier >= 5) return '稀有';
  if (tier >= 3) return '精品';
  return '普通';
}
