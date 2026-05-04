/**
 * ═══ 区域材料分布表 — B1.4 ═══
 * 给定五域+流派→返回该区域可产出的蛊材类型
 * 遵循炼蛊系统大纲 §二-2.3 区域材料分布设计
 */
import type { MaterialGrade } from './refine-engine';

/** 区域→流派丰富度映射 */
const REGION_PATH_BONUS: Record<string, string[]> = {
  '南疆': ['木道', '毒道', '光道'],
  '北原': ['力道', '风道', '奴道'],
  '东海': ['水道', '冰道', '食道'],
  '西漠': ['土道', '金道', '骨道'],
  '中洲': ['智道', '剑道'],
};

/** 区域→蛊材等级分布权重 */
const REGION_GRADE_WEIGHTS: Record<string, Record<MaterialGrade, number>> = {
  '南疆': { '普通': 50, '精品': 30, '稀有': 15, '仙材': 5 },
  '北原': { '普通': 50, '精品': 30, '稀有': 15, '仙材': 5 },
  '东海': { '普通': 50, '精品': 30, '稀有': 15, '仙材': 5 },
  '西漠': { '普通': 50, '精品': 30, '稀有': 15, '仙材': 5 },
  '中洲': { '普通': 40, '精品': 30, '稀有': 20, '仙材': 10 },
};

/**
 * 获取某区域丰富的流派列表
 */
export function getRegionBonusPaths(region: string): string[] {
  return REGION_PATH_BONUS[region] || [];
}

/**
 * 按区域和流派随机生成蛊材
 * @param region 所在区域
 * @param preferredPath 偏好流派
 * @param tier 目标蛊材等级（1~5转）
 * @returns 蛊材名称
 */
export function generateRegionalMaterial(region: string, preferredPath?: string, tier: number = 1): string {
  const grade = resolveGradeForTier(tier);
  const isBonusPath = preferredPath && REGION_PATH_BONUS[region]?.includes(preferredPath);

  // 区域丰富流派 → 产出更高级别的蛊材
  const effectiveGrade: MaterialGrade = isBonusPath && grade === '普通' ? '精品' : grade;

  return `${effectiveGrade}蛊材`;
}

/**
 * 根据转数判定蛊材等级
 */
function resolveGradeForTier(tier: number): MaterialGrade {
  if (tier >= 6) return '仙材';
  if (tier >= 5) return '稀有';
  if (tier >= 3) return '精品';
  return '普通';
}

/**
 * 获取某区域的蛊材等级权重
 */
export function getRegionGradeWeights(region: string): Record<MaterialGrade, number> {
  return REGION_GRADE_WEIGHTS[region] || REGION_GRADE_WEIGHTS['中洲'];
}
