import { describe, expect, it, vi } from 'vitest';
import { createSurvivalEconomySlice } from './survivalEconomySlice';
import { createInitialLivingWorldState } from '../defaultLivingWorldState';
import { createInitialRouteLocationState } from '../../engine/v110-route-location-state';
import { createInitialSurvivalEconomyState } from '../../engine/v120-survival-economy-state';

function createHarness() {
  let state: any = {
    turn: 33,
    flags: {},
    inventory: [{ id: 'moonlight', name: '月光蛊' }],
    currency: 200,
    materialBag: { '美酒': 1, '月华草': 1 },
    livingWorldState: createInitialLivingWorldState({
      worldClock: { turn: 33, day: 3, phase: 'morning', lastActionId: 'qingmao_market_window_probe' },
      knownFacts: {
        qingmao_supply_feeding_preparation_baseline: {
          id: 'qingmao_supply_feeding_preparation_baseline',
          scope: 'region',
          source: 'engine_result',
          summary: '补给压力已整理。',
          learnedTurn: 30,
          confidence: 'confirmed',
          tags: ['v1.2'],
        },
        qingmao_refinement_fragment_boundary_baseline: {
          id: 'qingmao_refinement_fragment_boundary_baseline',
          scope: 'region',
          source: 'engine_result',
          summary: '炼养用压力已整理。',
          learnedTurn: 31,
          confidence: 'confirmed',
          tags: ['v1.2'],
        },
        qingmao_market_window_candidate_baseline: {
          id: 'qingmao_market_window_candidate_baseline',
          scope: 'region',
          source: 'engine_result',
          summary: '交易窗口已整理。',
          learnedTurn: 32,
          confidence: 'confirmed',
          tags: ['v1.2'],
        },
      },
    } as any),
    routeLocationState: createInitialRouteLocationState({
      status: 'outer_edge_projection',
      routeId: 'southern_border_low_rank_route',
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
      authority: 'route_location_engine',
      evidenceLedgerEntryIds: ['v100_qingmao_southern_border_continuity_acceptance'],
      sourceRefs: ['test:v120b2'],
      lastUpdatedAtTurn: 32,
    }),
    survivalEconomyState: createInitialSurvivalEconomyState(),
    gameLog: [],
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state.addGameLog = vi.fn((category: string, message: string, meta?: any) => {
    state.gameLog = [...state.gameLog, { category, message, meta }];
  });
  state = {
    ...state,
    ...createSurvivalEconomySlice(set, get),
  };
  return { get: () => state };
}

describe('v1.2-b2 survival economy store slice', () => {
  it('writes only survivalEconomyState and leaves resources untouched', () => {
    const harness = createHarness();
    const beforeInventory = harness.get().inventory;
    const beforeCurrency = harness.get().currency;
    const beforeMaterialBag = harness.get().materialBag;

    const result = harness.get().syncSurvivalEconomyLedgerAction();

    expect(result.success).toBe(true);
    expect(result.applied).toEqual(['survivalEconomyState']);
    expect(harness.get().survivalEconomyState.status).toBe('pressure_tracked');
    expect(harness.get().survivalEconomyState.ledger).toHaveLength(6);
    expect(harness.get().inventory).toBe(beforeInventory);
    expect(harness.get().currency).toBe(beforeCurrency);
    expect(harness.get().materialBag).toBe(beforeMaterialBag);
    expect(harness.get().flags.lastSurvivalEconomyLedgerPatch).toEqual(expect.objectContaining({
      source: 'v120_survival_economy_ledger',
      applied: ['survivalEconomyState'],
      rejected: [],
    }));
    expect(harness.get().addGameLog).toHaveBeenCalledWith(
      'system',
      expect.stringContaining('已登记低阶生存经济压力账本'),
      expect.objectContaining({
        saveFormatImpact: 'v24_survival_economy_ledger',
        ledgerCount: 6,
      }),
    );
  });
});
