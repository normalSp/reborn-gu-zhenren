// ═══════════════════════════════════════════════
// M7 Phase 1: 无障碍 — 减少动效检测
// 监听 prefers-reduced-motion 媒体查询
// ═══════════════════════════════════════════════

import { useMemo } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * 检测用户是否启用了"减少动效"系统偏好。
 * 返回 true 时所有动画组件应禁用或极大简化动效。
 *
 * 使用 useMemo 避免重复创建 MediaQueryList。
 * 注意: SSR 环境下默认返回 false。
 */
export function useReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  }, []);
}

/** 非 Hook 版本：用于非 React 上下文（如 GSAP Timeline） */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}
