/**
 * 空窍系统类型定义 — P2-12
 * 空窍颜色映射、窍壁状态、裂纹生成算法
 */

// ─── 空窍颜色映射 ───

/** 空窍颜色枚举（5段渐变） */
export const APERTURE_COLOR_MAP = ['深黑', '暗青', '幽蓝', '深紫', '玄黄'] as const;
export type ApertureColor = typeof APERTURE_COLOR_MAP[number];

/** 境界 → 空窍颜色映射 */
export const REALM_TO_COLOR: Record<number, ApertureColor> = {
  0: '深黑',  // 未开辟
  1: '深黑',  // 一转
  2: '暗青',  // 二转
  3: '暗青',  // 三转
  4: '幽蓝',  // 四转
  5: '幽蓝',  // 五转
  6: '深紫',  // 六转
  7: '深紫',  // 七转
  8: '玄黄',  // 八转
  9: '玄黄',  // 九转
};

/** 颜色 → CSS 色值映射 */
export const APERTURE_COLOR_HEX: Record<ApertureColor, string> = {
  '深黑': '#1a1a2e',
  '暗青': '#16213e',
  '幽蓝': '#0f3460',
  '深紫': '#533483',
  '玄黄': '#8b7355',
};

/** 颜色 → 发光色 */
export const APERTURE_COLOR_GLOW: Record<ApertureColor, string> = {
  '深黑': '#2a2a4e',
  '暗青': '#26415e',
  '幽蓝': '#1f4480',
  '深紫': '#7344a3',
  '玄黄': '#ab9365',
};

// ─── 窍壁状态 ───

/** 窍壁状态（4级） */
export type WallState = '完整' | '微裂纹' | '裂痕' | '破碎';

/** 窍壁状态配置 */
export const WALL_STATE_CONFIG: Record<WallState, { crackDensity: number; opacity: number; description: string }> = {
  '完整':   { crackDensity: 0,   opacity: 1,   description: '窍壁完整，真元流转自如' },
  '微裂纹': { crackDensity: 0.2, opacity: 0.9, description: '窍壁出现细微裂纹，真气偶有逸散' },
  '裂痕':   { crackDensity: 0.5, opacity: 0.7, description: '窍壁裂痕蔓延，真元消耗加剧' },
  '破碎':   { crackDensity: 1,   opacity: 0.4, description: '窍壁濒临崩溃，每次催动蛊虫都有窍壁破灭之虞' },
};

// ─── 裂纹路径 ───

/** 单条裂纹线段 */
export interface CrackSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  depth: number; // 0-1，裂纹深浅
}

/** 裂纹生成配置 */
export interface CrackConfig {
  /** 生成种子 */
  seed: number;
  /** 裂纹密度 0-1 */
  density: number;
  /** 裂纹起点距中心最大距离 */
  maxStartRadius: number;
  /** 裂纹最大长度 */
  maxLength: number;
  /** 裂纹分支概率 0-1 */
  branchProbability: number;
  /** 锯齿幅度 (0=平滑) */
  jaggedness: number;
}

// ─── SVG 渲染配置 ───

export const APERTURE_SVG_CONFIG = {
  /** SVG 画布尺寸 */
  viewBoxSize: 280,
  /** 中心坐标 */
  centerX: 140,
  centerY: 140,
  /** 各层圆半径 */
  radius: {
    outer: 120,    // 外环 — 空窍类型
    mid: 85,       // 中环 — 面积 + 时间流速
    inner: 50,     // 内环 — 时间流速比
  },
  /** 裂纹线样式 */
  crackStyle: {
    stroke: 'rgba(255,255,255,0.15)',
    strokeWidth: 1.5,
    glowColor: 'rgba(0,255,200,0.08)',
  },
} as const;

// ─── 境界名称映射 ───

export const REALM_NAMES: Record<number, string> = {
  0: '未入流',
  1: '一转蛊师',
  2: '二转蛊师',
  3: '三转蛊师',
  4: '四转蛊师',
  5: '五转蛊师',
  6: '六转蛊仙',
  7: '七转蛊仙',
  8: '八转蛊仙',
  9: '九转蛊尊',
};
