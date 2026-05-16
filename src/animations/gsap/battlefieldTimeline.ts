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
  if (step.kind === 'killer_move' || step.kind === 'formation' || step.kind === 'third_party') return 0.9;
  if (step.kind === 'settlement' || step.kind === 'ambush') return 1;
  if (step.kind === 'morale' || step.kind === 'guard' || step.kind === 'assist') return 0.62;
  if (step.kind === 'counter' || step.kind === 'failure') return 0.55;
  return 0.42;
}

function stepMatches(step: BattleResolutionStep, sources: string[], motifs: string[], tags: string[] = []): boolean {
  const sourceName = step.sourceName ?? '';
  const motif = step.visual.motif ?? '';
  return sources.some(source => sourceName.includes(source))
    || motifs.some(item => motif.includes(item))
    || tags.some(tag => step.tags.includes(tag));
}

function cssVar(root: HTMLElement, name: string, fallback: string): string {
  return root.style.getPropertyValue(name).trim() || fallback;
}

function cssNumber(root: HTMLElement, name: string, fallback: number): number {
  const value = Number.parseFloat(cssVar(root, name, `${fallback}`));
  return Number.isFinite(value) ? value : fallback;
}

export function playQingmaoBattlefieldEntranceTimeline(gsap: GsapModule, root: HTMLElement): void {
  const veil = root.querySelector('.battlefield-entrance-veil');
  const title = root.querySelector('.battlefield-entrance-title');
  const subtitle = root.querySelector('.battlefield-entrance-subtitle');
  const daoLine = root.querySelector('.battlefield-entrance-dao-line');
  const aperture = root.querySelector('.battlefield-entrance-aperture');
  const sweep = root.querySelector('.battlefield-entrance-sweep');

  root.dataset.entranceTimeline = 'playing';
  gsap.set(veil, { opacity: 0, scaleX: 0.6, transformOrigin: '50% 50%' });
  gsap.set(title, { opacity: 0, y: 10 });
  gsap.set(subtitle, { opacity: 0, y: 6 });
  gsap.set(daoLine, { opacity: 0, scaleX: 0.18, transformOrigin: '50% 50%' });
  gsap.set(aperture, { opacity: 0, scale: 0.72 });
  gsap.set(sweep, { opacity: 0, x: '-38%' });

  const timeline = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => {
      root.dataset.entranceTimeline = 'complete';
    },
  });

  timeline
    .to(veil, { opacity: 0.86, scaleX: 1, duration: 0.34 })
    .to(title, { opacity: 1, y: 0, duration: 0.32 }, '<0.06')
    .to(subtitle, { opacity: 1, y: 0, duration: 0.28 }, '<0.08')
    .to(daoLine, { opacity: 0.85, scaleX: 1, duration: 0.46 }, '<0.04')
    .to(aperture, { opacity: 0.72, scale: 1.08, duration: 0.5 }, '<0.05')
    .to(sweep, { opacity: 0.42, x: '38%', duration: 0.62 }, '<0.04')
    .to([aperture, sweep], { opacity: 0.18, duration: 0.42 })
    .to(veil, { opacity: 0.62, duration: 0.34 }, '<');
}

export function playBattlefieldStepTimeline(gsap: GsapModule, step: BattleResolutionStep, root: HTMLElement): void {
  const flare = root.querySelector('.battlefield-gsap-flare');
  const ring = root.querySelector('.battlefield-gsap-ring');
  const pulse = root.querySelector('.battlefield-gsap-pulse');
  const moonBlade = root.querySelector('.battlefield-gsap-moon-blade');
  const moonEcho = root.querySelector('.battlefield-gsap-moon-echo');
  const jadeShell = root.querySelector('.battlefield-gsap-jade-shell');
  const jadeCrack = root.querySelector('.battlefield-gsap-jade-crack');
  const boundaryThread = root.querySelector('.battlefield-gsap-boundary-thread');
  const boundarySigil = root.querySelector('.battlefield-gsap-boundary-sigil');
  const tint = step.visual.primaryTint || '#C9A96E';
  const scale = intensityScale(step);
  const duration = durationFor(step);
  const fromX = cssVar(root, '--battlefield-effect-from-x', '50%');
  const fromY = cssVar(root, '--battlefield-effect-from-y', '50%');
  const targetX = cssVar(root, '--battlefield-effect-target-x', '50%');
  const targetY = cssVar(root, '--battlefield-effect-target-y', '50%');
  const distance = cssNumber(root, '--battlefield-effect-distance', 320);
  const angle = cssNumber(root, '--battlefield-effect-angle', 0);
  const shellSize = cssVar(root, '--battlefield-effect-shell-size', '120px');
  const moonBladeStep = stepMatches(step, ['月光蛊', '月刃连斩'], ['crescent_blade', 'moon_gather', 'crescent_chain']);
  const whiteJadeStep = stepMatches(step, ['白玉蛊'], ['white_jade_shell', 'jade_gloss']);
  const forbiddenStep = step.kind === 'failure'
    || step.kind === 'counter'
    || stepMatches(step, [], ['action_blocked', 'hazard'], ['aperture_pressure', 'forbidden', 'backlash', 'hazard']);

  root.dataset.qingmaoPolish = 'idle';
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
    left: fromX,
    top: fromY,
    right: 'auto',
    width: `${Math.max(72, distance)}px`,
    rotate: `${angle}deg`,
    transformOrigin: '0% 50%',
    background: `linear-gradient(90deg, transparent, ${tint}66, transparent)`,
  });
  gsap.set(moonBlade, {
    opacity: 0,
    left: fromX,
    top: fromY,
    width: `${Math.max(72, distance)}px`,
    x: '-10%',
    y: 0,
    rotate: `${angle}deg`,
    scaleX: 0.28,
    transformOrigin: '0% 50%',
    background: 'linear-gradient(90deg, transparent, rgba(224,199,138,0.95), rgba(255,255,235,0.78), transparent)',
    boxShadow: '0 0 18px rgba(224,199,138,0.48)',
  });
  gsap.set(moonEcho, {
    opacity: 0,
    left: fromX,
    top: fromY,
    width: `${Math.max(68, distance * 0.92)}px`,
    x: '-8%',
    y: 12,
    rotate: `${angle - 3}deg`,
    scaleX: 0.18,
    transformOrigin: '0% 50%',
    background: 'linear-gradient(90deg, transparent, rgba(224,199,138,0.46), rgba(143,208,179,0.22), transparent)',
    boxShadow: '0 0 14px rgba(224,199,138,0.24)',
  });
  gsap.set(jadeShell, {
    opacity: 0,
    left: targetX,
    top: targetY,
    width: shellSize,
    height: shellSize,
    xPercent: -50,
    yPercent: -50,
    scale: 0.82,
    borderColor: 'rgba(220,231,218,0.78)',
    boxShadow: 'inset 0 0 28px rgba(143,208,179,0.16), 0 0 22px rgba(143,208,179,0.22)',
  });
  gsap.set(jadeCrack, {
    opacity: 0,
    left: targetX,
    top: targetY,
    width: shellSize,
    xPercent: -50,
    yPercent: -50,
    scaleX: 0.34,
    rotate: '-18deg',
    transformOrigin: '50% 50%',
    background: 'linear-gradient(90deg, transparent, rgba(220,231,218,0.78), rgba(143,208,179,0.34), transparent)',
    boxShadow: '0 0 12px rgba(143,208,179,0.26)',
  });
  gsap.set(boundaryThread, {
    opacity: 0,
    left: fromX,
    top: targetY,
    width: `${Math.max(96, distance)}px`,
    x: 0,
    rotate: `${angle}deg`,
    transformOrigin: '0% 50%',
    background: 'linear-gradient(90deg, transparent, rgba(196,75,75,0.8), rgba(224,199,138,0.36), transparent)',
    boxShadow: '0 0 16px rgba(196,75,75,0.38)',
  });
  gsap.set(boundarySigil, {
    opacity: 0,
    left: targetX,
    top: targetY,
    width: shellSize,
    height: shellSize,
    xPercent: -50,
    yPercent: -50,
    scale: 0.7,
    borderColor: 'rgba(196,75,75,0.62)',
    boxShadow: 'inset 0 0 24px rgba(196,75,75,0.12), 0 0 18px rgba(196,75,75,0.22)',
  });

  const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
  if (forbiddenStep) {
    root.dataset.qingmaoPolish = 'forbidden-transition';
    timeline
      .to(boundaryThread, { opacity: 0.86, duration: duration * 0.22 })
      .to(boundarySigil, { opacity: 0.66, scale: scale * 1.02, duration: duration * 0.22 }, '<')
      .to(boundaryThread, { x: 10, duration: 0.06 })
      .to(boundaryThread, { x: -8, duration: 0.06 })
      .to(ring, { opacity: 0.72, scale: scale * 1.06, duration: duration * 0.25 }, '<')
      .to(boundarySigil, { opacity: 0.26, scale: scale * 1.16, duration: duration * 0.26 }, '<')
      .to([boundaryThread, boundarySigil, ring], { x: 0, opacity: 0, duration: duration * 0.42 });
    return;
  }

  if (moonBladeStep) {
    root.dataset.qingmaoPolish = 'moon-transition';
    timeline
      .to(moonBlade, { opacity: 0.92, x: '7%', scaleX: 1.05, duration: duration * 0.34 })
      .to(moonEcho, { opacity: 0.42, x: '9%', scaleX: 0.86, duration: duration * 0.28 }, '<0.08')
      .to(pulse, { opacity: 0.42, scaleX: 1.18, duration: duration * 0.25 }, '<0.04')
      .to(moonBlade, { opacity: 0.55, x: '16%', y: 18, rotate: `${angle + 4}deg`, duration: duration * 0.24 })
      .to(moonEcho, { opacity: 0.25, x: '18%', y: -8, rotate: `${angle - 7}deg`, duration: duration * 0.22 }, '<')
      .to(moonBlade, { opacity: 0, x: '28%', scaleX: 0.78, duration: duration * 0.38 })
      .to([moonEcho, pulse], { opacity: 0, duration: duration * 0.25 }, '<');
    return;
  }

  if (whiteJadeStep) {
    root.dataset.qingmaoPolish = 'white-jade-transition';
    timeline
      .to(jadeShell, { opacity: 0.84, scale: scale * 1.02, duration: duration * 0.36 })
      .to(ring, { opacity: 0.72, scale: scale * 1.08, duration: duration * 0.3 }, '<')
      .to(jadeCrack, { opacity: 0.56, scaleX: 0.92, duration: duration * 0.22 }, '<0.12')
      .to(jadeShell, { opacity: 0.42, scale: scale * 1.06, duration: duration * 0.32 })
      .to(jadeCrack, { opacity: 0.18, scaleX: 1.08, duration: duration * 0.22 }, '<')
      .to([jadeShell, jadeCrack, ring], { opacity: 0, duration: duration * 0.4 });
    return;
  }

  if (step.kind === 'killer_move' || step.kind === 'settlement' || step.kind === 'ambush' || step.kind === 'formation' || step.kind === 'third_party') {
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
