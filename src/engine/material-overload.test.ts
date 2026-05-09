import { describe, expect, it } from 'vitest';
import { getMaterialOverloadStatus } from './material-overload';
import { resolveFieldAction } from './field-action';

describe('material overload', () => {
  it('derives soft overload penalties from material bag capacity', () => {
    const status = getMaterialOverloadStatus({
      materialBag: { 普通蛊材: 16, 木道蛊材: 10 },
      capacity: 20,
    });

    expect(status.overloaded).toBe(true);
    expect(status.excess).toBe(6);
    expect(status.fieldSuccessPenalty).toBeGreaterThan(0);
    expect(status.riskMultiplier).toBeGreaterThan(1);
  });

  it('reduces field action success and increases risk when overloaded', () => {
    const base = resolveFieldAction({
      kind: 'gather',
      realmGrand: 2,
      aptitude: 6,
      mind: 6,
      luck: 5,
      turn: 9,
      locationType: 'field',
      store: { selectedTalents: [], materialBag: { 普通蛊材: 5 }, materialBagCapacity: 20 },
      seed: 3,
    });
    const overloaded = resolveFieldAction({
      kind: 'gather',
      realmGrand: 2,
      aptitude: 6,
      mind: 6,
      luck: 5,
      turn: 9,
      locationType: 'field',
      store: { selectedTalents: [], materialBag: { 普通蛊材: 25 }, materialBagCapacity: 20 },
      seed: 3,
    });

    expect(overloaded.successRate).toBeLessThan(base.successRate);
    expect(overloaded.riskChance).toBeGreaterThan(base.riskChance);
    expect(overloaded.modifierLabels).toContain('物资袋超载');
  });
});
