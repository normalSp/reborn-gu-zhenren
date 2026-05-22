import { describe, expect, it, vi } from 'vitest';
import { createRegionalEventLedgerSlice } from './regionalEventLedgerSlice';
import { createInitialLivingWorldState } from '../defaultLivingWorldState';
import { createInitialRouteLocationState } from '../../engine/v110-route-location-state';
import { createInitialSurvivalEconomyState } from '../../engine/v120-survival-economy-state';
import { createInitialRegionalEventLedger } from '../../engine/v200-regional-event-ledger';

function fact(id: string) {
  return {
    id,
    scope: 'region' as const,
    source: 'engine_result' as const,
    summary: `${id} 公开事实。`,
    learnedTurn: 70,
    confidence: 'confirmed' as const,
    tags: ['v2.0-b1'],
  };
}

function createHarness() {
  let state: any = {
    turn: 70,
    flags: {},
    profile: { name: 'v200账本测试', realm: { grand: 1, sub: '中阶', label: '一转中阶' } },
    inventory: [],
    materialBag: {},
    livingWorldState: createInitialLivingWorldState({
      worldClock: { turn: 70, day: 6, phase: 'afternoon', lastActionId: 'v200_worldcore_regional_event_probe' },
      knownFacts: {
        qingmao_escape_route_preparation_baseline: fact('qingmao_escape_route_preparation_baseline'),
        qingmao_escape_tracks_cover_baseline: fact('qingmao_escape_tracks_cover_baseline'),
        qingmao_mountain_pass_route_continuation_candidate: fact('qingmao_mountain_pass_route_continuation_candidate'),
        qingmao_supply_feeding_preparation_baseline: fact('qingmao_supply_feeding_preparation_baseline'),
        qingmao_market_window_candidate_baseline: fact('qingmao_market_window_candidate_baseline'),
        v018_qingmao_route_candidate_continuation_view: fact('v018_qingmao_route_candidate_continuation_view'),
      },
      actionConsequences: [{
        id: 'consequence_v200_public_route_probe',
        actionId: 'v200_public_route_probe',
        turn: 69,
        scope: 'region',
        publicSummary: '公开准备进入外缘压力。',
        effectRefs: ['v200_public_regional_life_pressure'],
        followUpRefs: ['followup:review_regional_event_ledger'],
      }],
      playerGoals: [{
        id: 'goal_escape_qingmao',
        intentType: 'long_term_goal',
        targetRef: 'region:outside_qingmao',
        rationale: '逃离青茅山并找外缘遮蔽。',
        status: 'active',
        createdTurn: 3,
        lastUpdatedTurn: 70,
        blockedByRefIds: [],
        nextStepHints: ['找商队短工'],
      }],
    } as any),
    routeLocationState: createInitialRouteLocationState({
      status: 'outer_edge_projection',
      routeId: 'southern_border_low_rank_route',
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
      authority: 'route_location_engine',
      evidenceLedgerEntryIds: ['v018_qingmao_route_candidate_continuation_view'],
      sourceRefs: ['test:v200b1'],
      lastUpdatedAtTurn: 70,
    }),
    survivalEconomyState: createInitialSurvivalEconomyState({
      status: 'pressure_tracked',
      authority: 'survival_economy_engine',
      pressureScore: 10,
      ledger: [{
        id: 'survival_trade',
        turn: 70,
        category: 'trade_window',
        pressure: 'medium',
        publicSummary: '临时市场窗口。',
        nextStep: '只询价。',
        evidenceRefs: ['qingmao_market_window_candidate_baseline'],
        sourceRefs: ['v120:test'],
        blockedWrites: ['formal_price_table'],
      }],
      evidenceRefs: ['qingmao_market_window_candidate_baseline'],
      sourceRefs: ['v120:test'],
      lastUpdatedAtTurn: 70,
    }),
    regionalEventLedger: createInitialRegionalEventLedger(),
    sceneSessionState: {
      localActionLedger: [{
        id: 'ledger_v200_action',
        turn: 70,
        sceneId: 'v200_test',
        actionType: 'other',
        source: 'v200:test',
        cost: 0,
        summary: '外缘盘问与商队短工。',
        systemResult: {},
        risks: ['outer_edge_interrogation'],
      }],
    },
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
    ...createRegionalEventLedgerSlice(set, get),
  };
  return { get: () => state };
}

describe('v2.0-b1 regional event ledger store slice', () => {
  it('writes only regionalEventLedger and leaves existing resources and states untouched', () => {
    const harness = createHarness();
    const beforeLivingWorld = harness.get().livingWorldState;
    const beforeRouteLocation = harness.get().routeLocationState;
    const beforeSurvivalEconomy = harness.get().survivalEconomyState;
    const beforeMaterialBag = harness.get().materialBag;

    const result = harness.get().syncRegionalEventLedgerAction();

    expect(result.success).toBe(true);
    expect(result.applied).toEqual(['regionalEventLedger']);
    expect(harness.get().regionalEventLedger.status).toBe('events_tracked');
    expect(harness.get().regionalEventLedger.publicEvents.length).toBeGreaterThan(0);
    expect(harness.get().livingWorldState).toBe(beforeLivingWorld);
    expect(harness.get().routeLocationState).toBe(beforeRouteLocation);
    expect(harness.get().survivalEconomyState).toBe(beforeSurvivalEconomy);
    expect(harness.get().materialBag).toBe(beforeMaterialBag);
    expect(harness.get().flags.lastRegionalEventLedgerPatch).toEqual(expect.objectContaining({
      source: 'v200_worldcore_regional_event_ledger',
      applied: ['regionalEventLedger'],
      rejected: [],
    }));
    expect(harness.get().addGameLog).toHaveBeenCalledWith(
      'system',
      expect.stringContaining('WorldCore 已登记区域事件账本'),
      expect.objectContaining({
        eventCount: expect.any(Number),
        followUpCount: expect.any(Number),
      }),
    );
  });
});
