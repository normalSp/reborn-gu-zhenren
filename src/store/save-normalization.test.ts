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
    expect(normalized.routeLocationState).toMatchObject({
      status: 'not_started',
      routeId: null,
      locationScopeId: 'qingmao_mountain',
      regionScopeId: 'qingmao',
      authority: 'start_profile',
    });
    expect(normalized.survivalEconomyState).toMatchObject({
      schemaVersion: 1,
      status: 'not_started',
      authority: 'migration_default',
      pressureScore: 0,
      ledger: [],
    });
    expect(normalized.regionalEventLedger).toMatchObject({
      schemaVersion: 1,
      status: 'not_started',
      authority: 'migration_default',
      activeRegionKey: 'southern_border_outer_edge_low_rank',
      publicEvents: [],
      pendingFollowUps: [],
    });
    expect(normalized.flags.trainingGroundClues).toEqual([]);
    expect(normalized.flags.activeTrainingGroundId).toBeNull();
    expect(normalized.deathRecord.majorChoices).toEqual([]);
    expect(normalized.deathRecord.deathCauseTags).toEqual([]);
  });

  it('routes v22 file-save migration through the same normalization path and bumps to v25', () => {
    const migrated = migrateSave({
      formatVersion: 22,
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
    expect(migrated.state.routeLocationState.status).toBe('not_started');
    expect(migrated.state.survivalEconomyState.status).toBe('not_started');
    expect(migrated.state.survivalEconomyState.ledger).toEqual([]);
    expect(migrated.state.regionalEventLedger.status).toBe('not_started');
    expect(migrated.state.regionalEventLedger.publicEvents).toEqual([]);
    expect(migrated.state.flags.trainingGroundClues).toEqual([]);
    expect(migrated.state.materialShelf.items).toEqual([]);
  });

  it('derives v23 route/location state from v22 route facts without unlocking full regions', () => {
    const migrated = migrateSave({
      formatVersion: 22,
      timestamp: 'test',
      meta: { playerName: '离山旧档', realm: '一转中阶', turn: 20, gameMode: 'canon' },
      state: {
        turn: 20,
        livingWorldState: {
          worldClock: { turn: 20, day: 5, phase: 'afternoon', lastActionId: 'v100_qingmao_southern_border_continuity_acceptance_probe' },
          regions: {},
          hiddenFactRefs: {},
          npcMemories: [],
          factionPressure: [],
          playerGoals: [],
          actionConsequences: [],
          ifDeviations: [],
          knownFacts: {
            v100_qingmao_southern_border_continuity_acceptance: {
              id: 'v100_qingmao_southern_border_continuity_acceptance',
              scope: 'region',
              source: 'engine_result',
              summary: 'v1.0 连续体验验收完成。',
              learnedTurn: 20,
              confidence: 'confirmed',
              tags: ['v1.0.0-b1'],
            },
          },
        },
      },
    });

    expect(migrated.state.routeLocationState).toMatchObject({
      status: 'outer_edge_projection',
      routeId: 'southern_border_low_rank_route',
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
      authority: 'living_world_engine',
    });
    expect((migrated.state.materialBag || {}).route_entered).toBeUndefined();
    expect((migrated.state as any).currentRegion).toBeUndefined();
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

  it('blocks malformed v23 route/location fields during save hydration', () => {
    const normalized = normalizePersistedGameState({
      turn: 21,
      routeLocationState: {
        status: 'outer_edge_projection',
        routeId: 'direct_shang_city_route',
        locationScopeId: 'southern_border_outer_edge',
        regionScopeId: 'southern_border_outer_edge',
        authority: 'deepseek',
        evidenceLedgerEntryIds: ['manual_edit'],
      },
    });

    expect(normalized.routeLocationState.status).toBe('blocked');
    expect(normalized.routeLocationState.locationScopeId).toBe('unknown_conservative');
    expect(normalized.routeLocationState.regionScopeId).toBe('unknown_conservative');
    expect(normalized.routeLocationState.migrationNote).toContain('invalid');
  });

  it('adds v24 survivalEconomyState and v25 regionalEventLedger to v23 saves without opening formal economy or regional fields', () => {
    const migrated = migrateSave({
      formatVersion: 23,
      timestamp: 'test',
      meta: { playerName: 'v23旧档', realm: '一转中阶', turn: 21, gameMode: 'canon' },
      state: {
        turn: 21,
        routeLocationState: {
          status: 'outer_edge_projection',
          routeId: 'southern_border_low_rank_route',
          locationScopeId: 'southern_border_outer_edge',
          regionScopeId: 'southern_border_outer_edge',
          authority: 'route_location_engine',
          evidenceLedgerEntryIds: ['v100_qingmao_southern_border_continuity_acceptance'],
          sourceRefs: ['v1.1:test'],
          lastUpdatedAtTurn: 21,
        },
      },
    });

    expect(migrated.formatVersion).toBe(SAVE_FORMAT_VERSION);
    expect(migrated.state.survivalEconomyState).toMatchObject({
      schemaVersion: 1,
      status: 'not_started',
      authority: 'migration_default',
      pressureScore: 0,
      ledger: [],
    });
    expect(migrated.state.regionalEventLedger).toMatchObject({
      schemaVersion: 1,
      status: 'not_started',
      authority: 'migration_default',
      activeRegionKey: 'southern_border_outer_edge_low_rank',
      publicEvents: [],
      pendingFollowUps: [],
    });
    expect((migrated.state as any).formal_price_table).toBeUndefined();
    expect((migrated.state as any).formal_market_trade).toBeUndefined();
    expect((migrated.state as any).runFingerprint).toBeUndefined();
    expect((migrated.state as any).regionalLifeState).toBeUndefined();
  });

  it('repairs edited immortal saves by moving duplicate mortal inventory into aperture storage', () => {
    const normalized = normalizePersistedGameState({
      turn: 12,
      profile: { name: '手改升仙档', realm: { grand: 6, sub: '初阶', label: '六转初阶' } },
      inventory: [
        { id: 'moon', specId: '月光蛊', name: '月光蛊', tier: 1, path: '光道', currentState: 'optimal' },
        { id: 'stone', specId: '石皮蛊', name: '石皮蛊', tier: 2, path: '土道', currentState: 'optimal' },
      ],
      apertureInventory: {
        gu: [
          { id: 'moon', specId: '月光蛊', name: '月光蛊', tier: 1, path: '光道', currentState: 'optimal' },
        ],
        materials: {},
        immortalMaterials: {},
      },
    });

    expect(normalized.inventory).toEqual([]);
    expect(normalized.apertureInventory.gu.map((gu: any) => gu.name)).toEqual(['月光蛊', '石皮蛊']);
  });
});
