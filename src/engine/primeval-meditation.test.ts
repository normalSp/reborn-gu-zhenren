import { describe, expect, it } from 'vitest';
import {
  assessMeditationRisk,
  calculatePrimevalMeditation,
  PRIMEVAL_STONE_RECOVERY_RATIO_BY_REALM,
} from './primeval-meditation';

describe('primeval-meditation', () => {
  it('uses realm-scaled recovery instead of flat +100 true essence', () => {
    expect(PRIMEVAL_STONE_RECOVERY_RATIO_BY_REALM[1]).toBe(0.35);
    expect(PRIMEVAL_STONE_RECOVERY_RATIO_BY_REALM[5]).toBe(0.08);

    const rankOne = calculatePrimevalMeditation({
      realmGrand: 1,
      essenceCurrent: 10,
      essenceMax: 100,
      availableStones: 3,
      requestedStones: 1,
    });
    expect(rankOne.essenceGain).toBe(35);
    expect(rankOne.stonesConsumed).toBe(1);

    const rankFive = calculatePrimevalMeditation({
      realmGrand: 5,
      essenceCurrent: 0,
      essenceMax: 100,
      availableStones: 10,
      requestedStones: 1,
    });
    expect(rankFive.essenceGain).toBe(8);
  });

  it('blocks immortal stage from mortal primeval stone meditation', () => {
    const result = calculatePrimevalMeditation({
      realmGrand: 6,
      essenceCurrent: 100,
      essenceMax: 500,
      availableStones: 10,
      requestedStones: 1,
    });
    expect(result.allowed).toBe(false);
  });

  it('adds deterministic field risk while safe places stay safe', () => {
    expect(assessMeditationRisk({ context: 'safe', turn: 10, luck: 5 }).riskChance).toBe(0);
    const field = assessMeditationRisk({ context: 'field', turn: 10, luck: 5 });
    expect(field.riskChance).toBeGreaterThan(0);
  });
});
