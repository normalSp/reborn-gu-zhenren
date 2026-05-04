// ═══════════════════════════════════════════════
// M7 Phase 1: Motion Spring 参数 Token
// 设计参考 CSS 变量: --gu-ease-bounce (0.34, 1.56, 0.64, 1)
// ═══════════════════════════════════════════════

import type { Spring } from 'framer-motion';

/**
 * GUI Spring: 面板/UI 元素通用弹簧
 * 轻缓，适合面板滑入、卡片悬浮
 */
export const GU_SPRING_DEFAULT: Spring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

/**
 * 伤害 Spring: 数值暴击/危险状态
 * 高刚度+低阻尼，弹跳明显
 */
export const GU_SPRING_DAMAGE: Spring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 8,
  mass: 0.8,
};

/**
 * 面板 Spring: 磨砂玻璃面板入场
 * 中等刚度，干净不带多余回弹
 */
export const GU_SPRING_PANEL: Spring = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 25,
  mass: 1.2,
};

/**
 * 弹跳 Spring: Toast/成就通知
 * 高弹跳感，对应 CSS --gu-ease-bounce
 */
export const GU_SPRING_BOUNCE: Spring = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 10,
  mass: 0.6,
};

/**
 * 呼吸 Spring: 永恒微光/命火脉冲
 * 极慢周期，用于循环呼吸动效
 */
export const GU_SPRING_BREATH: Spring = {
  type: 'spring' as const,
  stiffness: 80,
  damping: 10,
  mass: 4,
};

/**
 * 根据设备能力返回合适的 spring 配置
 * low-tier: 禁用弹簧，退化为无动画
 * medium-tier: 降低 stiffness 减轻性能负载
 */
export function getSpringByTier(
  spring: Spring,
  tier: 'high' | 'medium' | 'low'
): Spring {
  if (tier === 'low') return { type: false as any };
  if (tier === 'medium') return { ...spring, stiffness: (spring.stiffness ?? 260) * 0.6 };
  return spring;
}
