// ═══════════════════════════════════════════════════════════
// M7 Phase 2: Zustand → GSAP 动画桥接 Hook
// 监听 Zustand 关键状态变化，触发对应的 GSAP Timeline
// 这是 framer-motion 和 GSAP 之间的唯一通信点
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useShallow } from 'zustand/shallow';
import { animQueue } from '../animations/gsap/animationQueue';

const EMPTY_EVENTS: Record<string, string> = {};

/**
 * 监听 Zustand 状态变化，分发到 GSAP 动画队列。
 * 应在 GameScreen 中调用一次。
 *
 * 触发策略：
 * - transitionState === 'transitioning' → 转章过渡动画 (chapterTransition)
 * - duelState.phase === 'resolution' 且有杀招标记 → 战斗杀招动画 (killerMove)
 * - activeEvents 有事件触发 → 名场面涟漪 (grandEventRipple)
 */
export function useAnimationBridge(): void {
  const prevTurnRef = useRef(0);
  const turn = useStore(s => s.turn);
  const duelPhase = useStore(s => s.duelState?.phase);
  const transitionState = useStore(s => s.transitionState);
  const currentChapter = useStore(s => s.getCurrentChapter?.());
  const activeEvents = useStore((s: any) => s.activeEvents ?? EMPTY_EVENTS);
  const prevEventsRef = useRef<Record<string, string>>({});

  // ─── 转章过渡动画 ───
  useEffect(() => {
    if (transitionState !== 'transitioning') return;

    const chapterTitle = currentChapter?.displayName || '新章节';
    const epigraph = currentChapter?.sceneConstraints?.narrativeTheme || '';

    // 用 rAF 等待 ChapterTransition 组件渲染出 DOM 节点后，再启动 GSAP 动画
    // 避免 GSAP target ".chapter-epigraph" not found 错误
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        import('gsap').then(async (gsapModule) => {
          const gsap = gsapModule.default;
          const { playChapterTransition } = await import('../animations/gsap/chapterTransition');
          animQueue.enqueue(() => playChapterTransition(gsap, chapterTitle, epigraph));
        }).catch((err) => {
          console.warn('[useAnimationBridge] GSAP 章节过渡加载失败:', err);
        });
      });
    });
  }, [transitionState]);

  // ─── 战斗杀招动画 ───
  useEffect(() => {
    if (duelPhase !== 'resolution') return;
    // 仅当存在杀招标记（从 CombatOverlay 或 narrative 中携带）时触发
    const hasKillerMove = (useStore.getState() as any).activeKillerMove;
    if (!hasKillerMove) return;

    const killerName = hasKillerMove.name || '杀招';
    const killerPath = hasKillerMove.path || '力道';

    import('gsap').then(async (gsapModule) => {
      const gsap = gsapModule.default;
      const { playKillerMove } = await import('../animations/gsap/killerMove');
      animQueue.enqueue(() => playKillerMove(gsap, killerName, killerPath, true));
    }).catch((err) => {
      console.warn('[useAnimationBridge] GSAP 杀招动画加载失败:', err);
    });
  }, [duelPhase]);

  // ─── 名场面涟漪动画 ───
  useEffect(() => {
    const events = activeEvents as Record<string, string>;
    const eventIds = Object.keys(events);
    const prevIds = prevEventsRef.current;

    for (const eventId of eventIds) {
      // 仅当事件被新触发（active）时播放涟漪
      if (events[eventId] === 'active' && prevIds[eventId] !== 'active') {
        import('gsap').then(async (gsapModule) => {
          const gsap = gsapModule.default;
          const { playGrandEventRipple } = await import('../animations/gsap/grandEventRipple');
          animQueue.enqueue(() => playGrandEventRipple(gsap, eventId, 'normal'));
        }).catch((err) => {
          console.warn('[useAnimationBridge] GSAP 名场面动画加载失败:', err);
        });
        break; // 一帧最多触发一个涟漪
      }
    }
    prevEventsRef.current = { ...events };
  }, [activeEvents]);

  // ─── 回合变更 ───
  useEffect(() => {
    if (turn > 1 && turn !== prevTurnRef.current) {
      prevTurnRef.current = turn;
    }
  }, [turn]);
}

/**
 * 触发蛊虫升转动画（外部手动调用，非 Hook 响应式监听）
 * 因为 gu evolution 是即时操作触发，不是 Zustand 状态变更触发
 */
export function playGuEvolutionAnimation(guName: string, fromRank: number, toRank: number): void {
  import('gsap').then(async (gsapModule) => {
    const gsap = gsapModule.default;
    const { playGuEvolution } = await import('../animations/gsap/guEvolution');
    animQueue.enqueue(() => playGuEvolution(gsap, guName, fromRank, toRank));
  }).catch((err) => {
    console.warn('[useAnimationBridge] GSAP 蛊虫升转动画加载失败:', err);
  });
}
