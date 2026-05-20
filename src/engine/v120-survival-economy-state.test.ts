import { describe, expect, it } from 'vitest';
import { buildV120LowRankSurvivalEconomyProjection } from './v120-low-rank-survival-economy-projection';
import {
  createInitialSurvivalEconomyState,
  normalizeSurvivalEconomyState,
  resolveV120SurvivalEconomyLedgerSync,
} from './v120-survival-economy-state';

function pressureProjection() {
  return buildV120LowRankSurvivalEconomyProjection({
    turn: 17,
    routeLocationState: {
      status: 'outer_edge_projection',
      routeId: 'southern_border_low_rank_route',
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
      authority: 'route_location_engine',
      evidenceLedgerEntryIds: ['v100_qingmao_southern_border_continuity_acceptance'],
      sourceRefs: ['test:v120b2'],
      lastUpdatedAtTurn: 16,
    },
    livingWorldState: {
      worldClock: { turn: 17, day: 2, phase: 'morning', lastActionId: 'qingmao_market_window_probe' },
      knownFacts: {
        qingmao_supply_feeding_preparation_baseline: {
          id: 'qingmao_supply_feeding_preparation_baseline',
          scope: 'region',
          source: 'engine_result',
          summary: '补给压力已整理。',
          learnedTurn: 10,
          confidence: 'confirmed',
          tags: ['supply'],
        },
        qingmao_market_window_candidate_baseline: {
          id: 'qingmao_market_window_candidate_baseline',
          scope: 'region',
          source: 'engine_result',
          summary: '商队窗口已整理。',
          learnedTurn: 12,
          confidence: 'confirmed',
          tags: ['market'],
        },
      },
      regions: {},
      hiddenFactRefs: {},
      npcMemories: [],
      factionPressure: [],
      playerGoals: [],
      actionConsequences: [],
      ifDeviations: [],
    },
    materialBag: { '美酒': 1 },
  });
}

describe('v1.2-b2 survival economy state', () => {
  it('creates a conservative empty v24 ledger by default', () => {
    const state = createInitialSurvivalEconomyState();

    expect(state).toMatchObject({
      schemaVersion: 1,
      status: 'not_started',
      authority: 'migration_default',
      pressureScore: 0,
      ledger: [],
      lastUpdatedAtTurn: null,
    });
  });

  it('syncs pressure projection into survivalEconomyState only', () => {
    const projection = pressureProjection();
    const resolution = resolveV120SurvivalEconomyLedgerSync({
      projection,
      previousState: createInitialSurvivalEconomyState(),
      turn: 17,
    });

    expect(resolution.success).toBe(true);
    expect(resolution.applied).toEqual(['survivalEconomyState']);
    expect(resolution.survivalEconomyState.status).toBe('pressure_tracked');
    expect(resolution.survivalEconomyState.authority).toBe('survival_economy_engine');
    expect(resolution.survivalEconomyState.ledger.map(entry => entry.category)).toEqual([
      'route_supply',
      'gu_upkeep',
      'refinement_preparation',
      'trade_window',
      'gray_trade_boundary',
      'anti_farm',
    ]);
    expect(resolution.survivalEconomyState.ledger[0].blockedWrites).toEqual(expect.arrayContaining([
      'material_reward',
      'currency_delta',
      'formal_price_table',
      'formal_market_trade',
      'deepseek_authority_expansion',
    ]));
    expect(JSON.stringify(resolution.survivalEconomyState)).not.toContain('trade_success_granted');
    expect(JSON.stringify(resolution.survivalEconomyState)).not.toContain('currency_delta_applied');
  });

  it('does not register ledger entries when route and economy context are missing', () => {
    const projection = buildV120LowRankSurvivalEconomyProjection({ turn: 1 });
    const resolution = resolveV120SurvivalEconomyLedgerSync({
      projection,
      previousState: null,
      turn: 1,
    });

    expect(resolution.success).toBe(false);
    expect(resolution.rejected).toEqual(['needs_route_or_economy_pressure_context']);
    expect(resolution.survivalEconomyState.ledger).toEqual([]);
  });

  it('normalizes edited or malformed ledgers conservatively', () => {
    const normalized = normalizeSurvivalEconomyState({
      status: 'pressure_tracked',
      authority: 'deepseek' as any,
      ledger: [{
        id: 'bad',
        turn: 99,
        category: 'trade_window',
        pressure: 'high',
        publicSummary: 'bad',
        nextStep: 'bad',
        evidenceRefs: ['manual'],
        sourceRefs: ['manual'],
        blockedWrites: ['formal_market_trade'],
      }],
      lastUpdatedAtTurn: 99,
    }, 99);

    expect(normalized.status).toBe('blocked');
    expect(normalized.authority).toBe('survival_economy_engine');
    expect(normalized.ledger).toEqual([]);
    expect(normalized.migrationNote).toContain('invalid authority');
  });
});
