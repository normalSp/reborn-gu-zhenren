import { describe, expect, it } from 'vitest';
import {
  canApplyAttributeMutation,
  getAttributeMutationPolicy,
} from './attribute-mutation-policy';

describe('attribute-mutation-policy', () => {
  it('gates blood skull aptitude growth behind scene validation', () => {
    const policy = getAttributeMutationPolicy('blood_skull_gu');
    expect(policy.attribute).toBe('资质');
    expect(policy.rarity).toBe('forbidden');

    expect(canApplyAttributeMutation(policy, {
      realmGrand: 2,
      targetScope: 'self',
      sceneValidated: false,
    }).ok).toBe(false);

    expect(canApplyAttributeMutation(policy, {
      realmGrand: 2,
      targetScope: 'self',
      sceneValidated: true,
    }).ok).toBe(true);
  });

  it('keeps luck mutation hidden without observation means', () => {
    const policy = getAttributeMutationPolicy('luck_path_gu');
    expect(policy.attribute).toBe('气运');
    expect(policy.visibleWithoutDetection).toBe(false);
    expect(policy.targetScope).toBe('any_known_character');
  });
});
