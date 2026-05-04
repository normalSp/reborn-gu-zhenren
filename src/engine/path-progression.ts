/**
 * 流派晋升引擎 (Path Progression) — P2-P7-4
 *
 * 基于道痕量决定流派境界：
 *   0-50   道痕 → 普通
 *   51-200 道痕 → 大师
 *   201-500 道痕 → 宗师
 *   501-1500 道痕 → 大宗师
 *   1501-5000 道痕 → 准无上
 *   5001-20000 道痕 → 无上
 *   20000+ 道痕 → 道主
 *
 * 蛊真人原著设定：流派境界主要取决于道痕积累，而非单纯的转数。
 * 道痕越多，流派理解越深，可催动的杀招越强。
 */
import type { PathLevel, PathType } from '../types';

/** 道痕→流派境界 阈值表 */
const PATH_LEVEL_THRESHOLDS: { minDaoMarks: number; level: PathLevel }[] = [
  { minDaoMarks: 20000, level: '道主' },
  { minDaoMarks: 5001, level: '无上' },
  { minDaoMarks: 1501, level: '准无上' },
  { minDaoMarks: 501, level: '大宗师' },
  { minDaoMarks: 201, level: '宗师' },
  { minDaoMarks: 51, level: '大师' },
  { minDaoMarks: 0, level: '普通' },
];

/**
 * 根据道痕数量计算流派境界
 * @param daoMarks 该流派的道痕数
 * @returns PathLevel 流派境界
 */
export function computePathLevel(daoMarks: number): PathLevel {
  for (const threshold of PATH_LEVEL_THRESHOLDS) {
    if (daoMarks >= threshold.minDaoMarks) {
      return threshold.level;
    }
  }
  return '普通';
}

/**
 * 批量计算所有流派的境界
 * @param daoMarks 所有流派的道痕记录
 * @returns 流派→境界的映射
 */
export function computeAllPathLevels(daoMarks: Record<string, number>): Record<PathType, PathLevel> {
  const result: Record<string, PathLevel> = {};
  for (const [path, marks] of Object.entries(daoMarks)) {
    result[path] = computePathLevel(marks);
  }
  return result;
}

/**
 * 判断流派境界是否达到某个级别
 */
export function isPathLevelAtLeast(current: PathLevel, target: PathLevel): boolean {
  const ranking: PathLevel[] = ['普通', '大师', '宗师', '大宗师', '准无上', '无上', '道主'];
  return ranking.indexOf(current) >= ranking.indexOf(target);
}

/**
 * 获取流派境界的中文描述
 */
export function getPathLevelDescription(level: PathLevel): string {
  const descriptions: Record<PathLevel, string> = {
    '普通': '初步接触此道，尚未形成系统理解',
    '大师': '对此道有了深刻理解，可独立施展基础杀招',
    '宗师': '在此道上已有造诣，可开创个人风格的用法',
    '大宗师': '对此道的理解已臻化境，可创造新杀招',
    '准无上': '距离无上仅一步之遥，天地共鸣初现',
    '无上': '在此道上已达巅峰，举手投足皆含大道韵味',
    '道主': '此道之主，万法归宗，可影响天地法则',
  };
  return descriptions[level] || '';
}
