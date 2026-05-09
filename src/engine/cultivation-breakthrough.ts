import {
  applyBreakthroughFailurePenaltyModifiers,
  applyBreakthroughSuccessModifiers,
  applyCultivationProgressModifiers,
  type ModifierContext,
} from './modifier-engine';

export interface CultivationProgressInput {
  realmGrand: number;
  aptitude: number;
  mind: number;
  currentProgress: number;
  store?: any;
  period?: string;
}

export interface CultivationProgressResult {
  progressGain: number;
  newProgress: number;
  multiplier: number;
  labels: string[];
}

export function calculateCultivationProgress(input: CultivationProgressInput): CultivationProgressResult {
  const realm = Math.max(1, Number(input.realmGrand || 1));
  const aptitude = Math.max(0, Math.min(10, Number(input.aptitude || 5)));
  const mind = Math.max(0, Math.min(10, Number(input.mind || 5)));
  const base = Math.max(3, Math.round(5 + aptitude * 1.1 + mind * 0.35 + realm * 0.6));
  const quote = applyCultivationProgressModifiers(base, {
    store: input.store,
    operation: 'cultivation',
    tier: realm,
    period: input.period,
  });
  return {
    progressGain: quote.progress,
    newProgress: Math.max(0, Number(input.currentProgress || 0) + quote.progress),
    multiplier: quote.multiplier,
    labels: quote.breakdown.map(item => item.label),
  };
}

export type BreakthroughFailurePenaltyKind =
  | 'hp_loss'
  | 'essence_shock'
  | 'gu_hunger'
  | 'gu_injury'
  | 'aperture_pressure'
  | 'progress_loss';

export interface BreakthroughFailurePenalty {
  kind: BreakthroughFailurePenaltyKind;
  amount: number;
  description: string;
}

export interface BreakthroughFailureInput {
  realmGrand: number;
  aptitude: number;
  mind: number;
  progress: number;
  seed?: number;
  store?: any;
  extremePhysiquePressure?: number;
}

export interface BreakthroughFailureResult {
  severity: number;
  penalties: BreakthroughFailurePenalty[];
  labels: string[];
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

export function calculateBreakthroughSuccessRate(input: BreakthroughFailureInput) {
  const realm = Math.max(1, Number(input.realmGrand || 1));
  const aptitude = Math.max(0, Math.min(10, Number(input.aptitude || 5)));
  const mind = Math.max(0, Math.min(10, Number(input.mind || 5)));
  const progressBonus = Math.max(0, Math.min(0.18, Number(input.progress || 0) / 1000));
  const base = 0.42 + aptitude * 0.025 + mind * 0.008 + progressBonus - Math.max(0, realm - 3) * 0.035;
  const quote = applyBreakthroughSuccessModifiers(base, {
    store: input.store,
    operation: 'breakthrough',
    tier: realm,
  });
  return {
    rate: quote.rate,
    labels: quote.breakdown.map(item => item.label),
  };
}

export function resolveBreakthroughFailure(input: BreakthroughFailureInput): BreakthroughFailureResult {
  const realm = Math.max(1, Number(input.realmGrand || 1));
  const pressure = Math.max(0, Number(input.extremePhysiquePressure || 0));
  const baseSeverity = 0.75 + realm * 0.1 + (pressure >= 110 ? 0.35 : pressure >= 95 ? 0.15 : 0);
  const quote = applyBreakthroughFailurePenaltyModifiers(baseSeverity, {
    store: input.store,
    operation: 'breakthrough',
    tier: realm,
  });
  const severity = quote.severity;
  const rng = seeded(input.seed ?? (realm * 997 + Math.round(input.progress || 0) * 13));
  const penalties: BreakthroughFailurePenalty[] = [];

  const hpPct = Math.max(4, Math.round((8 + realm * 2) * severity));
  penalties.push({
    kind: 'hp_loss',
    amount: hpPct,
    description: `空窍反震，生命损伤 ${hpPct}%`,
  });

  const essencePct = Math.max(8, Math.round((14 + realm * 3) * severity));
  penalties.push({
    kind: 'essence_shock',
    amount: essencePct,
    description: `真元/仙元震荡，当前能量损失 ${essencePct}%`,
  });

  const roll = rng();
  if (roll < 0.32) {
    penalties.push({
      kind: 'gu_hunger',
      amount: 1,
      description: '一只启用中的蛊虫受到牵连，饥饿计数上升',
    });
  } else if (roll < 0.58) {
    penalties.push({
      kind: 'gu_injury',
      amount: 1,
      description: '一只启用中的蛊虫气息紊乱，可能受伤',
    });
  } else if (roll < 0.78 || pressure >= 95) {
    penalties.push({
      kind: 'aperture_pressure',
      amount: Math.round(8 * severity),
      description: '空窍压力短期上升',
    });
  }

  penalties.push({
    kind: 'progress_loss',
    amount: Math.max(4, Math.round((8 + rng() * 8) * severity)),
    description: '修行进度少量回退',
  });

  return {
    severity,
    penalties,
    labels: quote.breakdown.map(item => item.label),
  };
}
