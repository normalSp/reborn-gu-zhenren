import { describe, expect, it } from 'vitest';
import { buildV120LowRankSurvivalEconomyProjection } from './v120-low-rank-survival-economy-projection';
import type { LivingWorldState, RouteLocationState } from '../types';

function livingWorldWithEconomyFacts(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 12,
      day: 1,
      phase: 'morning',
      lastActionId: 'v100_low_rank_life_loop_release_acceptance_probe',
    },
    knownFacts: {
      qingmao_supply_feeding_preparation_baseline: {
        id: 'qingmao_supply_feeding_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '补给和食料压力已整理。',
        learnedTurn: 4,
        confidence: 'confirmed',
        tags: ['supply_feeding'],
      },
      qingmao_refinement_fragment_boundary_baseline: {
        id: 'qingmao_refinement_fragment_boundary_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '残方边界已整理。',
        learnedTurn: 5,
        confidence: 'confirmed',
        tags: ['refinement'],
      },
      qingmao_market_window_candidate_baseline: {
        id: 'qingmao_market_window_candidate_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '商队窗口已整理。',
        learnedTurn: 6,
        confidence: 'confirmed',
        tags: ['market'],
      },
    },
    hiddenFactRefs: {},
    regions: {},
    npcMemories: [],
    factionPressure: [],
    playerGoals: [],
    actionConsequences: [],
    ifDeviations: [],
  };
}

function outerEdgeRoute(): Partial<RouteLocationState> {
  return {
    status: 'outer_edge_projection',
    routeId: 'southern_border_low_rank_route',
    locationScopeId: 'southern_border_outer_edge',
    regionScopeId: 'southern_border_outer_edge',
    authority: 'route_location_engine',
    evidenceLedgerEntryIds: ['v100_qingmao_southern_border_continuity_acceptance'],
    sourceRefs: ['v1.1:test'],
    lastUpdatedAtTurn: 10,
  };
}

describe('v1.2 low-rank survival economy projection', () => {
  it('projects low-rank survival pressure without save writes, rewards, prices, or trade settlement', () => {
    const projection = buildV120LowRankSurvivalEconomyProjection({
      livingWorldState: livingWorldWithEconomyFacts(),
      routeLocationState: outerEdgeRoute(),
      materialBag: { '美酒': 1, '月华草': 2 },
      turn: 12,
    });

    expect(projection.status).toBe('pressure_visible');
    expect(projection.saveFormatImpact).toBe('none');
    expect(projection.statePatchApplied).toBe(false);
    expect(projection.canWriteSave).toBe(false);
    expect(projection.canGrantReward).toBe(false);
    expect(projection.canSettleConsumption).toBe(false);
    expect(projection.canOpenMarket).toBe(false);
    expect(projection.deepSeekAuthority).toBe('no_new_authority');
    expect(projection.boundaryLines.join('\n')).toContain('不写 survivalEconomyState');
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'save_format_bump',
      'survivalEconomyState_write',
      'material_reward',
      'currency_delta',
      'material_consumption',
      'formal_inventory',
      'formal_price_table',
      'formal_shop_inventory',
      'formal_market_trade',
      'black_market_trade',
      'commission_profit',
      'trade_success',
      'deepseek_authority_expansion',
    ]));
    expect(projection.pressureItems.map(item => item.id)).toEqual([
      'route_supply',
      'gu_upkeep',
      'refinement_preparation',
      'trade_window',
      'gray_trade_boundary',
      'anti_farm',
    ]);
    expect(projection.pressureItems.find(item => item.id === 'trade_window')?.nextStep).toContain('不写价格');
  });

  it('stays conservative when route and economy evidence are missing', () => {
    const projection = buildV120LowRankSurvivalEconomyProjection({ turn: 1 });

    expect(projection.status).toBe('needs_context');
    expect(projection.publicSummary).toContain('不写任何状态');
    expect(projection.pressureItems.find(item => item.id === 'route_supply')?.status).toBe('needs_context');
    expect(projection.pressureItems.find(item => item.id === 'gray_trade_boundary')?.status).toBe('deferred');
    expect(projection.canWriteSave).toBe(false);
  });
});
