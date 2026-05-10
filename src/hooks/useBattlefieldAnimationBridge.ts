import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { BattleResolutionStep } from '../types';
import { isReducedMotion } from './useReducedMotion';

export function useBattlefieldAnimationBridge(
  step: BattleResolutionStep | undefined,
  rootRef: RefObject<HTMLDivElement>,
): void {
  useEffect(() => {
    if (!step || !rootRef.current || isReducedMotion()) return;
    let cancelled = false;

    Promise.all([
      import('gsap'),
      import('../animations/gsap/battlefieldTimeline'),
    ]).then(([gsapModule, timelineModule]) => {
      if (cancelled || !rootRef.current) return;
      const gsap = (gsapModule as any).gsap ?? gsapModule.default ?? gsapModule;
      timelineModule.playBattlefieldStepTimeline(gsap, step, rootRef.current);
    }).catch((error) => {
      console.warn('[BattlefieldAnimationBridge] GSAP battlefield timeline failed', error);
    });

    return () => {
      cancelled = true;
    };
  }, [step?.id, rootRef]);
}
