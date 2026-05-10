import type { BattleResolutionStep } from '../../types';

type GsapModule = {
  timeline: (options?: Record<string, unknown>) => any;
  set: (target: Element | null, vars: Record<string, unknown>) => void;
};

function intensityScale(step: BattleResolutionStep): number {
  if (step.visual.intensity === 'high') return 1.35;
  if (step.visual.intensity === 'subtle') return 0.78;
  return 1;
}

function durationFor(step: BattleResolutionStep): number {
  if (step.kind === 'killer_move') return 0.9;
  if (step.kind === 'settlement') return 1;
  if (step.kind === 'counter' || step.kind === 'failure') return 0.55;
  return 0.42;
}

export function playBattlefieldStepTimeline(gsap: GsapModule, step: BattleResolutionStep, root: HTMLElement): void {
  const flare = root.querySelector('.battlefield-gsap-flare');
  const ring = root.querySelector('.battlefield-gsap-ring');
  const pulse = root.querySelector('.battlefield-gsap-pulse');
  const tint = step.visual.primaryTint || '#C9A96E';
  const scale = intensityScale(step);
  const duration = durationFor(step);

  gsap.set(flare, {
    opacity: 0,
    scale: 0.64,
    background: `radial-gradient(circle, ${tint}55 0%, ${tint}22 34%, transparent 70%)`,
  });
  gsap.set(ring, {
    opacity: 0,
    scale: 0.82,
    borderColor: tint,
    boxShadow: `0 0 22px ${tint}44`,
  });
  gsap.set(pulse, {
    opacity: 0,
    scale: 0.9,
    background: `linear-gradient(90deg, transparent, ${tint}66, transparent)`,
  });

  const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
  if (step.kind === 'killer_move' || step.kind === 'settlement') {
    timeline
      .to(ring, { opacity: 0.95, scale: scale * 1.22, duration: duration * 0.42 })
      .to(flare, { opacity: 0.75, scale: scale * 1.8, duration: duration * 0.5 }, '<')
      .to(pulse, { opacity: 0.55, scaleX: 1.2, duration: duration * 0.35 }, '<0.08')
      .to([ring, flare, pulse], { opacity: 0, duration: duration * 0.42 });
    return;
  }

  if (step.kind === 'counter' || step.kind === 'failure') {
    timeline
      .to(ring, { opacity: 0.85, scale: scale * 1.05, duration: duration * 0.35 })
      .to(ring, { x: 8, duration: 0.08 })
      .to(ring, { x: -8, duration: 0.08 })
      .to(ring, { x: 0, opacity: 0, duration: duration * 0.45 });
    return;
  }

  timeline
    .to(flare, { opacity: 0.5, scale: scale * 1.25, duration: duration * 0.4 })
    .to(flare, { opacity: 0, scale: scale * 1.65, duration: duration * 0.58 });
}
