export type MeditationContext = 'safe' | 'field' | 'caravan' | 'aperture';

export interface PrimevalMeditationInput {
  realmGrand: number;
  essenceCurrent: number;
  essenceMax: number;
  availableStones: number;
  requestedStones?: number;
}

export interface PrimevalMeditationResult {
  allowed: boolean;
  stonesConsumed: number;
  essenceGain: number;
  newEssence: number;
  ratio: number;
  reason?: string;
}

export interface MeditationRiskInput {
  context: MeditationContext;
  turn: number;
  luck?: number;
}

export interface MeditationRiskResult {
  riskChance: number;
  triggered: boolean;
  reason: string;
}

export const PRIMEVAL_STONE_RECOVERY_RATIO_BY_REALM: Record<number, number> = {
  1: 0.35,
  2: 0.25,
  3: 0.18,
  4: 0.12,
  5: 0.08,
};

export function calculatePrimevalMeditation(input: PrimevalMeditationInput): PrimevalMeditationResult {
  if (input.realmGrand >= 6) {
    return {
      allowed: false,
      stonesConsumed: 0,
      essenceGain: 0,
      newEssence: input.essenceCurrent,
      ratio: 0,
      reason: '蛊仙阶段应使用仙元/仙元石，不走凡人元石调息。',
    };
  }

  const ratio = PRIMEVAL_STONE_RECOVERY_RATIO_BY_REALM[input.realmGrand] ?? 0.08;
  const missing = Math.max(0, input.essenceMax - input.essenceCurrent);
  if (missing <= 0) {
    return {
      allowed: false,
      stonesConsumed: 0,
      essenceGain: 0,
      newEssence: input.essenceCurrent,
      ratio,
      reason: '真元已满。',
    };
  }
  if (input.availableStones <= 0) {
    return {
      allowed: false,
      stonesConsumed: 0,
      essenceGain: 0,
      newEssence: input.essenceCurrent,
      ratio,
      reason: '元石不足。',
    };
  }

  const perStoneGain = Math.max(1, Math.ceil(input.essenceMax * ratio));
  const requested = Math.max(1, Math.floor(input.requestedStones ?? 1));
  const needed = Math.ceil(missing / perStoneGain);
  const stonesConsumed = Math.min(input.availableStones, requested, needed);
  const essenceGain = Math.min(missing, perStoneGain * stonesConsumed);

  return {
    allowed: true,
    stonesConsumed,
    essenceGain,
    newEssence: input.essenceCurrent + essenceGain,
    ratio,
  };
}

export function assessMeditationRisk(input: MeditationRiskInput): MeditationRiskResult {
  const luck = input.luck ?? 5;
  if (input.context === 'safe' || input.context === 'aperture') {
    return { riskChance: 0, triggered: false, reason: '安全环境调息，无额外风险。' };
  }

  const base = input.context === 'caravan' ? 0.12 : 0.2;
  const riskChance = Math.max(0.04, base - Math.max(0, luck - 5) * 0.01);
  const deterministicRoll = ((input.turn * 37 + Math.round(luck * 11)) % 100) / 100;
  const triggered = deterministicRoll < riskChance;

  return {
    riskChance,
    triggered,
    reason: triggered
      ? '野外调息时气机外泄，引来突发干扰。'
      : '调息期间保持警惕，暂未引发额外事件。',
  };
}
