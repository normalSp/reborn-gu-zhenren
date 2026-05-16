import { describe, expect, it } from 'vitest';
import { SAVE_FORMAT_VERSION } from './initialState';
import { migrateSave, normalizePersistedGameState } from './index';

describe('v0.11.0 persisted state normalization', () => {
  it('normalizes shared save defaults, derived engine states, and living-world defaults', () => {
    const normalized = normalizePersistedGameState({
      turn: 9,
      flags: { cultivationProgress: 66 },
      partyState: { formation: '圆阵', morale: 180, coordination: -20 },
      squadDispatchState: {
        activeAssignments: [{ id: 'missing-member' }],
        recentResults: Array.from({ length: 25 }, (_, index) => ({ id: `result_${index}` })),
      },
      deathRecord: { deathSummary: '旧档死亡记录' },
    });

    expect(normalized.dynamicNPCs).toEqual({});
    expect(normalized.maxDynamicNPCs).toBe(500);
    expect(normalized.npcContacts).toEqual([]);
    expect(normalized.targetedGuEffects).toEqual([]);
    expect(normalized.feedingCredits).toEqual({});
    expect(normalized.feedingDiscountProgress).toEqual({});
    expect(normalized.gameLog).toEqual([]);
    expect(normalized.gameLogArchive).toEqual([]);
    expect(normalized.rumorLocations).toEqual([]);
    expect(normalized.materialShelf.items).toEqual([]);
    expect(normalized.lastFactionEconomyLedger).toBeNull();
    expect(normalized.lastFactionEconomyTurn).toBe(0);
    expect(normalized.partyState.formation).toBeNull();
    expect(normalized.partyState.morale).toBe(100);
    expect(normalized.partyState.coordination).toBe(0);
    expect(normalized.partyState.lastUpdatedTurn).toBe(9);
    expect(normalized.squadDispatchState.activeAssignments).toEqual([]);
    expect(normalized.squadDispatchState.recentResults).toHaveLength(20);
    expect(normalized.cultivationState.progress).toBe(66);
    expect(normalized.trainingGroundState.version).toBe('v0.9.0-a3');
    expect(normalized.livingWorldState.schemaVersion).toBe(1);
    expect(normalized.livingWorldState.worldClock).toEqual({
      turn: 0,
      day: 1,
      phase: 'start',
      lastActionId: null,
    });
    expect(normalized.livingWorldState.regions).toEqual({});
    expect(normalized.flags.trainingGroundClues).toEqual([]);
    expect(normalized.flags.activeTrainingGroundId).toBeNull();
    expect(normalized.deathRecord.majorChoices).toEqual([]);
    expect(normalized.deathRecord.deathCauseTags).toEqual([]);
  });

  it('routes v21 file-save migration through the same normalization path and bumps to v22', () => {
    const migrated = migrateSave({
      formatVersion: 21,
      timestamp: 'test',
      meta: { playerName: '旧档', realm: '一转初阶', turn: 3, gameMode: 'canon' },
      state: {
        turn: 3,
        flags: { cultivationProgress: 31 },
        partyState: { formation: '圆阵' },
      },
    });

    expect(migrated.formatVersion).toBe(SAVE_FORMAT_VERSION);
    expect(migrated.state.partyState.formation).toBeNull();
    expect(migrated.state.cultivationState.progress).toBe(31);
    expect(migrated.state.trainingGroundState.version).toBe('v0.9.0-a3');
    expect(migrated.state.livingWorldState.schemaVersion).toBe(1);
    expect(migrated.state.livingWorldState.playerGoals).toEqual([]);
    expect(migrated.state.flags.trainingGroundClues).toEqual([]);
    expect(migrated.state.materialShelf.items).toEqual([]);
  });

  it('normalizes malformed living-world fields during save hydration', () => {
    const normalized = normalizePersistedGameState({
      turn: 7,
      livingWorldState: {
        worldClock: { turn: -1, day: 0, phase: 'bad' },
        regions: {
          qingmao: { pressure: 999, alertLevel: 99, access: 'free' },
        },
        hiddenFactRefs: {
          hidden_qingmao: {
            sourcePointer: 'original#hidden',
            revealPolicyId: 'after_fact_card',
            summary: '隐藏事实正文不能进入存档结构',
          },
        },
        npcMemories: {},
      },
    });

    expect(normalized.livingWorldState.worldClock.turn).toBe(0);
    expect(normalized.livingWorldState.worldClock.day).toBe(1);
    expect(normalized.livingWorldState.worldClock.phase).toBe('start');
    expect(normalized.livingWorldState.regions.qingmao.pressure).toBe(100);
    expect(normalized.livingWorldState.regions.qingmao.alertLevel).toBe(3);
    expect(normalized.livingWorldState.hiddenFactRefs.hidden_qingmao).toEqual({
      id: 'hidden_qingmao',
      scope: 'world',
      sourcePointer: 'original#hidden',
      revealPolicyId: 'after_fact_card',
      guard: 'hidden',
      lastCheckedTurn: null,
    });
    expect((normalized.livingWorldState.hiddenFactRefs.hidden_qingmao as any).summary).toBeUndefined();
    expect(normalized.livingWorldState.npcMemories).toEqual([]);
  });
});
