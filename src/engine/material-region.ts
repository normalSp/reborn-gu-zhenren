/**
 * ═══ 区域材料分布表 — B1.4 ═══
 * 给定五域+流派→返回该区域可产出的蛊材类型
 * 遵循炼蛊系统大纲 §二-2.3 区域材料分布设计
 * 
 * P4-B1: 新增 MATERIAL_GRADE_MAP — 具体材料名→等级映射表
 * 用于 checkMaterialsWithFallback 模糊匹配时识别具体材料的等级
 */
import type { MaterialGrade } from './refine-engine';

/** P4-B1: 具体材料名→等级映射 — shop-items.json 中的所有蛊材 */
export const MATERIAL_GRADE_MAP: Record<string, MaterialGrade> = {
  '月华草': '普通', '银线虫': '普通', '石粉': '普通', '蛊狼牙': '普通',
  '蛊狼皮': '普通', '晨露收集瓶': '普通', '新鲜兽肉': '普通', '铁屑': '普通',
  '草木精华液': '普通', '特制木炭': '普通', '空白书页': '普通', '嘈杂晶': '普通',
  '蚕丝卷': '普通', '兽骨': '普通', '火石粉': '普通', '山泉水': '普通',
  '灯油': '普通', '新鲜血液瓶': '普通',
  '金粉': '精品', '冰晶核心': '精品', '雷击石': '精品', '沃土': '精品',
  '活木枝': '精品', '暗影精华': '精品', '毒物样本': '精品', '愈合草药包': '精品',
  '磁石粉末': '精品', '风之精华': '精品', '金属块': '精品', '梦境收集袋': '精品',
  '碎玉片': '精品', '美酒': '精品', '古籍残页': '普通',
  '金刚石粉': '稀有', '古木精华': '稀有', '火鳞片': '稀有', '魂魄碎片容器': '稀有',
  '金丝线': '稀有', '元初之水': '稀有', '兽核': '稀有',
  '三兽血瓶': '仙材', '空间晶石': '仙材', '灾劫灰烬': '仙材',
  // P4: 仙材体系扩展 — 来源: 仙窍资源节点产出/灾劫掉落/宝黄天拍卖
  '光阴砂': '仙材',       // 宙道仙材 — 仙蛊炼制/仙窍升级
  '道痕结晶': '仙材',     // 通用仙材 — 道痕密度提升/杀招强化
  '地火核心': '仙材',     // 炎道仙材 — 仙蛊炼制
  '九天罡风': '仙材',     // 风道仙材 — 仙蛊炼制/杀招强化
  '福地本源': '仙材',     // 通用仙材 — 仙窍面积扩张
  '星辉碎片': '仙材',     // 光道仙材 — 仙蛊炼制
  '古兽真血': '仙材',     // 变化道仙材 — 仙蛊炼制/杀招强化
};

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
