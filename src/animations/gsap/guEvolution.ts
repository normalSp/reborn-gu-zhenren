// ═══════════════════════════════════════════════════════════
// M7 Phase 2: 蛊虫升转 GSAP Timeline
// 触发: 蛊虫从N转升到N+1转
// 动效时长: 2000-3000ms
// 工具: GSAP Timeline + CSS @keyframes 碎裂/重塑
// ═══════════════════════════════════════════════════════════

import { isReducedMotion } from '../../hooks/useReducedMotion';

type GsapModule = typeof import('gsap');

export async function playGuEvolution(
  gsap: GsapModule,
  guName: string,
  fromRank: number,
  toRank: number,
): Promise<gsap.core.Timeline> {
  if (isReducedMotion()) return gsap.timeline();

  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

  // Phase 1: 碎裂 (35%)
  tl.to('.gu-evolution-icon', { opacity: 0.8, duration: 0.2 }, 0)
    .to('.gu-evolution-icon', { scale: 1.1, duration: 0.4, ease: 'power2.in' }, 0.2)
    .to('.gu-evolution-icon', { opacity: 0.3, scale: 0.8, duration: 0.3 }, 0.5)
    .to('.gu-evolution-glow', { opacity: 1, scale: 2, duration: 0.6, ease: 'power2.out' }, 0.3);

  // Phase 2: 重塑 (45%)
  tl.to('.gu-evolution-icon', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, 0.8)
    .fromTo('.gu-rank-number', { scale: 0, opacity: 0 }, {
      scale: 1.5, opacity: 1, duration: 0.3, ease: 'back.out(2)',
    }, 1.0)
    .to('.gu-rank-number', { scale: 1, duration: 0.2 }, 1.2)
    .fromTo('.gu-evolution-info', { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
    }, 1.2);

  // Phase 3: 稳定 (20%)
  tl.to('.gu-evolution-glow', { opacity: 0, duration: 0.4 }, 1.6)
    .to('.gu-evolution-name', { color: '#E0C78A', duration: 0.3 }, 1.8);

  return tl;
}
