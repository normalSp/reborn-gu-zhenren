import {
  applyImmortalRecoveryModifiers,
  applyNaturalRecoveryModifiers,
  type ModifierContext,
} from './modifier-engine';

export interface NaturalRecoveryInput {
  realmGrand: number;
  aptitude: number;
  mind?: number;
  essenceCurrent: number;
  essenceMax: number;
  essenceType?: 'mortal' | 'immortal';
  store?: any;
  period?: string;
}

export interface EssenceRecoveryResult {
  amount: number;
  newEssence: number;
  multiplier: number;
  labels: string[];
}

export function calculateNaturalEssenceRecovery(input: NaturalRecoveryInput): EssenceRecoveryResult {
  const max = Math.max(1, input.essenceMax || 1);
  const current = Math.max(0, Math.min(input.essenceCurrent || 0, max));
  if (current >= max) return { amount: 0, newEssence: current, multiplier: 1, labels: [] };

  const realmGrand = Math.max(1, Number(input.realmGrand || 1));
  const aptitude = Math.max(0, Math.min(10, Number(input.aptitude || 5)));
  const mind = Math.max(0, Math.min(10, Number(input.mind ?? 5)));

  const context: ModifierContext = {
    store: input.store,
    tier: realmGrand,
    period: input.period,
  };

  if (input.essenceType === 'immortal' || realmGrand >= 6) {
    const aperture = input.store?.aperture;
    const areaMu = Number(aperture?.area_mu || 100);
    const flowRatio = Number(aperture?.time_flow_ratio || 5);
    const base = Math.max(10, Math.round(areaMu * 0.015 * flowRatio));
    const quote = applyImmortalRecoveryModifiers(base, context);
    return {
      amount: Math.min(max - current, quote.amount),
      newEssence: Math.min(max, current + quote.amount),
      multiplier: quote.multiplier,
      labels: quote.breakdown.map(item => item.label),
    };
  }

  // Natural recovery is deliberately slower than active stone meditation.
  // It makes time matter without forcing players to burn yuan stones for every minor Gu use.
  const baseRatio = 0.025 + aptitude * 0.004 + mind * 0.0015 + realmGrand * 0.001;
  const base = Math.max(1, Math.round(max * baseRatio));
  const quote = applyNaturalRecoveryModifiers(base, context);
  return {
    amount: Math.min(max - current, quote.amount),
    newEssence: Math.min(max, current + quote.amount),
    multiplier: quote.multiplier,
    labels: quote.breakdown.map(item => item.label),
  };
}

export interface ImmortalStoneMeditationInput {
  essenceCurrent: number;
  essenceMax: number;
  availableStones: number;
  requestedStones?: number;
}

export function calculateImmortalStoneMeditation(input: ImmortalStoneMeditationInput) {
  const requested = Math.max(1, Math.floor(input.requestedStones || 1));
  const stonesConsumed = Math.min(requested, Math.max(0, Math.floor(input.availableStones || 0)));
  if (stonesConsumed <= 0) {
    return { allowed: false, reason: '仙元石不足。', stonesConsumed: 0, essenceGain: 0, newEssence: input.essenceCurrent };
  }
  if (input.essenceCurrent >= input.essenceMax) {
    return { allowed: false, reason: '仙元已满，无需调息。', stonesConsumed: 0, essenceGain: 0, newEssence: input.essenceCurrent };
  }
  const perStone = Math.max(80, Math.round(input.essenceMax * 0.08));
  const essenceGain = Math.min(input.essenceMax - input.essenceCurrent, perStone * stonesConsumed);
  return {
    allowed: essenceGain > 0,
    stonesConsumed,
    essenceGain,
    newEssence: Math.min(input.essenceMax, input.essenceCurrent + essenceGain),
  };
}
