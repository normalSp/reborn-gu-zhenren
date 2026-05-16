// ═══════════════════════════════════════════════════════════
// M7 Phase 2: 转章过渡 GSAP Timeline
// 触发: 章节切换点（如"青茅山→商队期"）
// 动效时长: 1800ms
// 工具: GSAP Timeline + CSS clip-path + 静态PNG水墨遮罩
// ═══════════════════════════════════════════════════════════

import { isReducedMotion } from '../../hooks/useReducedMotion';

type GsapModule = typeof import('gsap').default;

/**
 * 转章过渡动画 GLUE 函数
 * @param gsap - 动态导入后的 GSAP 模块
 * @param chapterTitle - "第X章 · 章节名"
 * @param chapterEpigraph - 章节引文
 * @returns GSAP Timeline 实例
 */
export async function playChapterTransition(
  gsap: GsapModule,
  chapterTitle: string,
  chapterEpigraph: string,
): Promise<gsap.core.Timeline> {
  if (isReducedMotion()) {
    // 减少动效：直接跳过过渡
    return gsap.timeline();
  }

  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

  // Phase 1: 场景暗化由 React state 驱动，GSAP 不干预 overlay opacity
  // 仅处理装饰元素

  // Phase 2: 水墨遮罩扩散 (静态PNG替代SVG feTurbulence)
  tl.to('.ink-mask', { scale: 1, opacity: 1, duration: 0.8 }, 0);

  // Phase 3: 章节标题文字渐显 (400ms)
  tl.fromTo('.chapter-title', { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.6);

  // Phase 4: 引文渐显 (500ms)
  tl.fromTo('.chapter-epigraph', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.8);

  // Phase 5: 水墨遮罩收缩消失 (600ms)
  tl.to('.ink-mask', { scale: 0, opacity: 0, duration: 0.6 }, 1.2);

  // Phase 6: overlay opacity 归零由 React state 控制，不在此处理
  // 避免 GSAP 把 overlay 透明度设为 0 后 pointerEvents=auto 阻挡所有点击

  return tl;
}
