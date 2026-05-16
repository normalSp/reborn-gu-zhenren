// ═══════════════════════════════════════════════════════════
// M7 Phase 2: 名场面涟漪 GSAP Timeline
// 触发: 全局名场面事件（三王福地开启/天庭入侵/逆流河显现）
// 动效时长: 800-1200ms
// 工具: GSAP Timeline + CSS radial-gradient vignette
// ═══════════════════════════════════════════════════════════

import { isReducedMotion } from '../../hooks/useReducedMotion';

type GsapModule = typeof import('gsap').default;

export async function playGrandEventRipple(
  gsap: GsapModule,
  eventName: string,
  severity: 'normal' | 'danger' | 'legendary',
): Promise<gsap.core.Timeline> {
  if (isReducedMotion()) return gsap.timeline();

  const color = severity === 'danger' ? '#C44B4B' : severity === 'legendary' ? '#E0C78A' : '#C9A96E';
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

  // 1) Vignette 暗化
  tl.to('.event-vignette', { '--vignette-opacity': 0.7, duration: 0.4, ease: 'power2.in' }, 0);

  // 2) 事件名称扩散
  tl.fromTo('.event-name', { opacity: 0, scale: 0.3 }, {
    opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)', color,
  }, 0.2);

  // 3) 涟漪扩散（共3层，每层delay 150ms）
  for (let i = 0; i < 3; i++) {
    tl.fromTo(`.ripple-ring-${i}`, { opacity: 0, scale: 0.5 }, {
      opacity: 0.5, scale: 1.5, duration: 0.6, ease: 'power2.out',
    }, 0.4 + i * 0.15);
    tl.to(`.ripple-ring-${i}`, { opacity: 0, duration: 0.3 }, 1.0 + i * 0.15);
  }

  // 4) 名称消散
  tl.to('.event-name', { opacity: 0, scale: 1.1, duration: 0.3 }, 0.8);

  // 5) 复原
  tl.to('.event-vignette', { '--vignette-opacity': 0, duration: 0.3 }, 1.1);

  return tl;
}
