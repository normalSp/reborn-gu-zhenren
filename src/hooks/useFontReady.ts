// ═══════════════════════════════════════════════
// M7 Phase 1: 字体就绪状态检测
// 监听 document.fonts.ready 返回字体加载状态
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';

/**
 * 检测字体是否加载完成。
 * 使用 document.fonts.ready 返回的 Promise。
 * 初始状态 false → 字体加载完成后转为 true。
 *
 * 组件可在字体未就绪时使用 PingFang SC fallback，
 * 待 true 后切换至目标字体，避免 FOIT。
 */
export function useFontReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) {
      setReady(true);
      return;
    }

    document.fonts.ready.then(() => {
      // 额外延迟 100ms 确保渲染引擎完成排版
      setTimeout(() => setReady(true), 100);
    });
  }, []);

  return ready;
}
