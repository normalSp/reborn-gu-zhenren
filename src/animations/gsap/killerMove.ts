// ═══════════════════════════════════════════════════════════
// M7 Phase 2: 战斗杀招 GSAP Timeline
// 触发: 高消耗杀招释放
// 动效时长: 1500-2500ms
// 工具: GSAP Timeline + CSS @keyframes 伪粒子（替代 Canvas）
// ═══════════════════════════════════════════════════════════

import { isReducedMotion } from '../../hooks/useReducedMotion';

type GsapModule = typeof import('gsap').default;

/** 流派颜色映射 */
export const PATH_COLORS: Record<string, string> = {
  金道: '#C9A96E', 木道: '#4B8B6E', 水道: '#4B6E8B',
  火道: '#C44B4B', 炎道: '#C44B4B', 土道: '#8B7648',
  风道: '#6B7294', 雷道: '#C99B4B', 冰道: '#6B9BB5',
  力道: '#E8E4DC', 魂道: '#8B3A8B', 血道: '#8B3A3A',
  智道: '#4B6E8B', 毒道: '#5A8B4B', 骨道: '#8B7D6B',
};

/**
 * 战斗杀招动画 GLUE 函数
 * @param gsap - 动态导入后的 GSAP 模块
 * @param killerName - 杀招名称
 * @param path - 杀招流派
 * @param isPlayer - 玩家/敌人释放
 * @returns GSAP Timeline 实例
 */
export async function playKillerMove(
  gsap: GsapModule,
  killerName: string,
  path: string,
  isPlayer: boolean,
): Promise<gsap.core.Timeline> {
  if (isReducedMotion()) return gsap.timeline();

  const color = PATH_COLORS[path] || '#C9A96E';
  const prefix = isPlayer ? '.player-side' : '.enemy-side';
  const target = isPlayer ? '.enemy-hp-fill' : '.player-hp-fill';

  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

  // Phase 1: 蓄力 (30%)
  tl.fromTo(`${prefix} .killer-name`, { opacity: 0, scale: 0.5 }, {
    opacity: 1, scale: 1.2, duration: 0.3, ease: 'back.out(1.7)',
  }, 0)
  .to('.battle-screen', { filter: 'brightness(0.7)', duration: 0.2, ease: 'power2.in' }, 0)
  .to(`${prefix} .killer-name`, { scale: 1, duration: 0.2 }, 0.3)

  // Phase 2: 释放 (40%) — CSS 伪粒子 + 红色脉冲光晕替代屏幕震动
  .to('.battle-overlay-glow', { opacity: 0.4, duration: 0.1 }, 0.5)
  .to('.battle-overlay-glow', {
    opacity: 0, duration: 0.4,
    borderColor: `${color}66`,
  }, 0.6)
  .fromTo(`${prefix} .damage-number`, { opacity: 0, y: 0, scale: 0.5 }, {
    opacity: 1, y: -40, scale: 1.5, duration: 0.3, ease: 'power2.out',
    color,
  }, 0.6)

  // Phase 3: 命中 (30%)
  .to(`${prefix} .damage-number`, { opacity: 0, duration: 0.3 }, 1.0)
  .to('.battle-screen', { filter: 'brightness(1)', duration: 0.3 }, 1.0)
  .to(target, { filter: 'brightness(1.3)', duration: 0.15, yoyo: true, repeat: 1 }, 1.0);

  // 总时长: ~1.5s
  return tl;
}
