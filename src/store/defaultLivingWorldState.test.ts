import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState, normalizeLivingWorldState } from './defaultLivingWorldState';

describe('v0.11.0-a2 living world state defaults', () => {
  it('creates the minimal persistent living-world root without derived UI state', () => {
    const state = createInitialLivingWorldState();

    expect(state).toEqual({
      schemaVersion: 1,
      worldClock: {
        turn: 0,
        day: 1,
        phase: 'start',
        lastActionId: null,
      },
      regions: {},
      knownFacts: {},
      hiddenFactRefs: {},
      npcMemories: [],
      factionPressure: [],
      playerGoals: [],
      actionConsequences: [],
      ifDeviations: [],
    });
  });

  it('normalizes malformed fields and strips hidden fact text down to refs only', () => {
    const normalized = normalizeLivingWorldState({
      worldClock: {
        turn: -12,
        day: 0,
        phase: 'invalid' as any,
        lastActionId: 123 as any,
      },
      regions: {
        qingmao: {
          status: 'unknown',
          pressure: 999,
          alertLevel: 9,
          access: 'teleport',
          knownEventIds: ['event_a', 2],
          hiddenFactRefIds: 'hidden_fact',
          factionPressureIds: ['fp_1'],
          lastUpdatedTurn: -1,
        } as any,
      },
      hiddenFactRefs: {
        qingmao_secret: {
          id: 'qingmao_secret',
          scope: 'region',
          sourcePointer: 'doc/original-work#qingmao-secret',
          revealPolicyId: 'reveal_after_investigation',
          guard: 'visible',
          summary: '不应该被存入的隐藏事实正文',
          lastCheckedTurn: '4',
        } as any,
      },
      npcMemories: {} as any,
    });

    expect(normalized.worldClock).toEqual({
      turn: 0,
      day: 1,
      phase: 'start',
      lastActionId: null,
    });
    expect(normalized.regions.qingmao).toMatchObject({
      regionId: 'qingmao',
      status: 'stable',
      pressure: 100,
      alertLevel: 3,
      access: 'known',
      knownEventIds: ['event_a'],
      hiddenFactRefIds: [],
      factionPressureIds: ['fp_1'],
      lastUpdatedTurn: 0,
    });
    expect(normalized.hiddenFactRefs.qingmao_secret).toEqual({
      id: 'qingmao_secret',
      scope: 'region',
      sourcePointer: 'doc/original-work#qingmao-secret',
      revealPolicyId: 'reveal_after_investigation',
      guard: 'hidden',
      lastCheckedTurn: 4,
    });
    expect((normalized.hiddenFactRefs.qingmao_secret as any).summary).toBeUndefined();
    expect(normalized.npcMemories).toEqual([]);
  });
});
