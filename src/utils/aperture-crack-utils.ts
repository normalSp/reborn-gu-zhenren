/**
 * 空窍裂纹生成工具 — P2-12
 *
 * 使用 mulberry32 确定性伪随机算法生成裂纹路径，确保相同种子产生相同裂纹。
 * 支持两种裂纹模式：径向直线裂纹（generateCracks）和锯齿状裂纹（generateJaggedCracks）。
 */

import type { CrackSegment, CrackConfig } from '../types/aperture';

// ─── mulberry32 确定性伪随机数生成器 ───

/**
 * mulberry32 PRNG — 确定性，相同种子产生相同序列
 * @param seed 32位整数种子
 * @returns 返回 [0, 1) 的伪随机浮点数
 */
export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── 裂纹生成 ───

/**
 * 生成径向裂纹路径
 * 从空窍中心向外发散，模拟窍壁裂痕
 *
 * @param config 裂纹生成配置
 * @returns 裂纹线段数组
 */
export function generateCracks(config: CrackConfig): CrackSegment[] {
  const rng = mulberry32(config.seed);
  const segments: CrackSegment[] = [];

  // 裂纹数量 = 密度 × 基础数
  const baseCount = 8;
  const count = Math.max(1, Math.floor(baseCount * config.density));

  for (let i = 0; i < count; i++) {
    // 随机角度（弧度）
    const angle = rng() * Math.PI * 2;
    // 随机起点距中心的距离
    const startRadius = rng() * config.maxStartRadius;
    // 随机长度
    const length = 15 + rng() * config.maxLength;

    const x1 = config.maxStartRadius + Math.cos(angle) * startRadius;
    const y1 = config.maxStartRadius + Math.sin(angle) * startRadius;
    const x2 = x1 + Math.cos(angle) * length;
    const y2 = y1 + Math.sin(angle) * length;

    segments.push({
      x1, y1, x2, y2,
      width: 0.5 + rng() * 2,
      depth: 0.3 + rng() * 0.7,
    });

    // 分支裂纹
    if (rng() < config.branchProbability) {
      const branchAngle = angle + (rng() - 0.5) * Math.PI * 0.5;
      const branchLength = length * (0.3 + rng() * 0.4);
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const bx2 = midX + Math.cos(branchAngle) * branchLength;
      const by2 = midY + Math.sin(branchAngle) * branchLength;

      segments.push({
        x1: midX, y1: midY, x2: bx2, y2: by2,
        width: 0.3 + rng() * 1.2,
        depth: 0.2 + rng() * 0.4,
      });
    }
  }

  return segments;
}

/**
 * 生成锯齿状裂纹路径
 * 裂纹呈现不规则锯齿，模拟陈旧、扩展中的窍壁损伤
 *
 * @param config 裂纹生成配置
 * @returns 锯齿裂纹线段数组
 */
export function generateJaggedCracks(config: CrackConfig): CrackSegment[] {
  const rng = mulberry32(config.seed);
  const segments: CrackSegment[] = [];

  const baseCount = 6;
  const count = Math.max(1, Math.floor(baseCount * config.density));

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const startRadius = 5 + rng() * (config.maxStartRadius - 5);
    const totalLength = 20 + rng() * config.maxLength;

    // 将裂纹分为 3-6 段锯齿
    const subSegments = 3 + Math.floor(rng() * 4);
    let cx = config.maxStartRadius + Math.cos(angle) * startRadius;
    let cy = config.maxStartRadius + Math.sin(angle) * startRadius;
    const segLength = totalLength / subSegments;

    for (let j = 0; j < subSegments; j++) {
      const jitterAngle = angle + (rng() - 0.5) * config.jaggedness;
      const nx = cx + Math.cos(jitterAngle) * segLength;
      const ny = cy + Math.sin(jitterAngle) * segLength;

      segments.push({
        x1: cx, y1: cy, x2: nx, y2: ny,
        width: 0.4 + rng() * 2.5,
        depth: 0.3 + rng() * 0.7,
      });

      cx = nx;
      cy = ny;
    }

    // 分支
    if (rng() < config.branchProbability * 0.7) {
      const bAngle = angle + (rng() - 0.5) * config.jaggedness * 2;
      const bLen = totalLength * (0.2 + rng() * 0.3);
      const midIdx = Math.floor(subSegments / 2);
      const midSeg = segments[segments.length - subSegments + midIdx];
      if (midSeg) {
        const bx2 = midSeg.x1 + Math.cos(bAngle) * bLen;
        const by2 = midSeg.y1 + Math.sin(bAngle) * bLen;
        segments.push({
          x1: midSeg.x1, y1: midSeg.y1, x2: bx2, y2: by2,
          width: 0.3 + rng() * 1,
          depth: 0.2 + rng() * 0.3,
        });
      }
    }
  }

  return segments;
}

/**
 * 将裂纹线段数组转为 SVG path d 属性字符串
 */
export function cracksToSvgPath(segments: CrackSegment[]): string {
  if (segments.length === 0) return '';

  return segments.map(seg =>
    `M${seg.x1.toFixed(1)},${seg.y1.toFixed(1)} L${seg.x2.toFixed(1)},${seg.y2.toFixed(1)}`
  ).join(' ');
}

/**
 * 从种子生成裂纹SVG渲染数据
 * @param seed 确定性种子
 * @param wallState 窍壁状态（用于密度映射）
 * @param jagged 是否使用锯齿模式
 */
export function generateCrackSvgData(seed: number, wallState: '完整' | '微裂纹' | '裂痕' | '破碎', jagged: boolean = false) {
  const densityMap = { '完整': 0, '微裂纹': 0.2, '裂痕': 0.5, '破碎': 1 };
  const density = densityMap[wallState];

  // density为0时不产生裂纹
  if (density === 0) {
    return { segments: [], pathD: '', visible: false };
  }

  const config: CrackConfig = {
    seed,
    density,
    maxStartRadius: 50,  // 相对于中心
    maxLength: 60,
    branchProbability: 0.35,
    jaggedness: 0.8,
  };

  const segments = jagged ? generateJaggedCracks(config) : generateCracks(config);
  return {
    segments,
    pathD: cracksToSvgPath(segments),
    visible: segments.length > 0,
  };
}
