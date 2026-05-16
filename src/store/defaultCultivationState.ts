import type { CultivationDeepeningState } from '../types';

export function createInitialCultivationState(
  overrides: Partial<CultivationDeepeningState> = {},
): CultivationDeepeningState {
  return {
    version: 'v0.8.0-b2',
    progress: 0,
    progressByRealm: {},
    breakthroughHistory: [],
    ascension: {
      threeQi: { human: 0, earth: 0, heaven: 0 },
      preparationScore: 0,
      heavenWillPressure: 0,
      karmicDebt: 0,
    },
    calamityLedger: [],
    nextCalamityPreview: null,
    lastEnvironment: null,
    lastResolution: [],
    ...overrides,
  };
}
