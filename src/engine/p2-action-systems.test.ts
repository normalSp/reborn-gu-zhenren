import { describe, expect, it } from 'vitest';
import { calculateBreakthroughSuccessRate, calculateCultivationProgress, resolveBreakthroughFailure } from './cultivation-breakthrough';
import { calculateImmortalStoneMeditation, calculateNaturalEssenceRecovery } from './essence-recovery';
import { buildFieldActionWorldActionBridge, resolveFieldAction } from './field-action';

const makeStore = (overrides: Record<string, any> = {}) => ({
  flags: {},
  selectedTalents: [],
  profile: { realm: { grand: 2 } },
  ...overrides,
});

describe('P2 action subsystem engines', () => {
  it('recovers essence naturally without stones and applies recovery modifiers', () => {
    const base = calculateNaturalEssenceRecovery({
      realmGrand: 2,
      aptitude: 5,
      mind: 5,
      essenceCurrent: 20,
      essenceMax: 100,
      store: makeStore(),
    });
    const boosted = calculateNaturalEssenceRecovery({
      realmGrand: 2,
      aptitude: 5,
      mind: 5,
      essenceCurrent: 20,
      essenceMax: 100,
      store: makeStore({ selectedTalents: ['talent_diligent'] }),
    });

    expect(base.amount).toBeGreaterThan(0);
    expect(boosted.amount).toBeGreaterThanOrEqual(base.amount);
    expect(boosted.multiplier).toBeGreaterThan(1);
  });

  it('uses immortal essence stones only as an explicit meditation result', () => {
    const result = calculateImmortalStoneMeditation({
      essenceCurrent: 100,
      essenceMax: 1000,
      availableStones: 2,
      requestedStones: 1,
    });

    expect(result.allowed).toBe(true);
    expect(result.stonesConsumed).toBe(1);
    expect(result.essenceGain).toBe(80);
    expect(result.newEssence).toBe(180);
  });

  it('calculates cultivation progress and breakthrough modifiers separately from failure penalties', () => {
    const prodigyStore = makeStore({ selectedTalents: ['talent_prodigy'] });
    const progress = calculateCultivationProgress({
      realmGrand: 3,
      aptitude: 7,
      mind: 6,
      currentProgress: 20,
      store: prodigyStore,
    });
    const success = calculateBreakthroughSuccessRate({
      realmGrand: 3,
      aptitude: 7,
      mind: 6,
      progress: progress.newProgress,
      store: prodigyStore,
    });
    const failure = resolveBreakthroughFailure({
      realmGrand: 3,
      aptitude: 7,
      mind: 6,
      progress: progress.newProgress,
      seed: 7,
      store: makeStore({ selectedTalents: ['talent_steady'] }),
    });

    expect(progress.progressGain).toBeGreaterThan(0);
    expect(success.rate).toBeGreaterThan(0.5);
    expect(failure.penalties.map(p => p.kind)).toEqual(expect.arrayContaining(['hp_loss', 'essence_shock', 'progress_loss']));
    expect(failure.severity).toBeLessThan(1.2);
  });

  it('keeps field gather rewards inside low-rank economy limits and applies action modifiers', () => {
    const result = resolveFieldAction({
      kind: 'gather',
      realmGrand: 2,
      aptitude: 6,
      mind: 6,
      luck: 5,
      turn: 1,
      locationType: 'field',
      store: makeStore({ selectedTalents: ['talent_herbalist'] }),
      seed: 1,
    });

    expect(result.successRate).toBeGreaterThan(0.7);
    expect(result.riskChance).toBeGreaterThan(0);
    if (result.success) {
      expect(result.reward?.yuanStoneEquivalent).toBeLessThanOrEqual(30);
      expect(Object.values(result.reward?.materials || {}).reduce((sum, value) => sum + Number(value), 0)).toBeGreaterThan(0);
    }
  });

  it('projects field gather into the unified world-action protocol without upgrading rewards', () => {
    const result = resolveFieldAction({
      kind: 'gather',
      realmGrand: 2,
      aptitude: 6,
      mind: 6,
      luck: 5,
      turn: 3,
      locationType: 'field',
      store: makeStore({ turn: 3, currentChapterId: 'qingmao_field_edge' }),
      seed: 1,
    });
    const bridge = buildFieldActionWorldActionBridge({
      result,
      store: { turn: 3, currentChapterId: 'qingmao_field_edge', currentDomain: '南疆' },
      locationType: 'field',
    });

    expect(bridge.worldActionCandidate.domain).toBe('field_action');
    expect(bridge.worldActionLedgerEntry.actionType).toBe('field_action');
    expect(bridge.worldActionResolution.rewardPolicy).toBe('local_engine_only');
    expect(bridge.narrativeReturnContext.promptSummary).toContain('野外采集由本地引擎结算');
    expect(bridge.narrativeReturnContext.promptSummary).toContain('不得追加材料');
    expect(bridge.worldActionResolution.risks.join('；')).toContain('不得升级为仙材、仙蛊');
  });
});
