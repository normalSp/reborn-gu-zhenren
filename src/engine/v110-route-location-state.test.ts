import { describe, expect, it } from 'vitest';
import {
  buildV110DeterministicSoakReport,
  buildV110RouteLocationOverview,
  deriveRouteLocationStateFromLivingWorld,
  normalizeRouteLocationState,
  resolveV110RouteLocationStateAction,
} from './v110-route-location-state';
import type { LivingWorldState, PlayerKnownFact } from '../types';

function fact(id: string, turn = 18): PlayerKnownFact {
  return {
    id,
    scope: 'region',
    source: 'engine_result',
    summary: `${id} 已确认。`,
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v1.1.0-test'],
  };
}

function stateWithFacts(ids: string[]): Partial<LivingWorldState> {
  return {
    worldClock: { turn: 20, day: 6, phase: 'afternoon', lastActionId: ids.at(-1) || null },
    knownFacts: Object.fromEntries(ids.map(id => [id, fact(id)])),
    hiddenFactRefs: {},
    npcMemories: [],
    factionPressure: [],
    playerGoals: [],
    actionConsequences: [],
    ifDeviations: [],
    regions: {},
  };
}

describe('v1.1.0 route/location state engine', () => {
  it('defaults new saves to Qingmao without route/location unlocks', () => {
    const state = deriveRouteLocationStateFromLivingWorld(null, 1);

    expect(state).toMatchObject({
      status: 'not_started',
      routeId: null,
      locationScopeId: 'qingmao_mountain',
      regionScopeId: 'qingmao',
      authority: 'start_profile',
    });
    expect(JSON.stringify(state)).not.toContain('route_entered');
  });

  it('maps escape goals and route prep to preparing_departure only', () => {
    const state = deriveRouteLocationStateFromLivingWorld({
      ...stateWithFacts(['qingmao_escape_route_preparation_baseline']),
      playerGoals: [{
        id: 'goal_escape_qingmao',
        intentType: 'travel',
        targetRef: 'region:outside_qingmao',
        status: 'active',
        createdTurn: 10,
        lastUpdatedTurn: 12,
        rationale: '我要逃离青茅山。',
        nextStepHints: [],
        blockedByRefIds: [],
      }],
    }, 12);

    expect(state.status).toBe('preparing_departure');
    expect(state.routeId).toBe('southern_border_low_rank_route');
    expect(state.locationScopeId).toBe('qingmao_mountain');
    expect(state.regionScopeId).toBe('qingmao');
  });

  it('maps v018 and v100 route evidence to the approved scopes only', () => {
    const inProgress = deriveRouteLocationStateFromLivingWorld(stateWithFacts([
      'v018_qingmao_route_entry_threshold_commitment',
    ]), 18);
    const outerEdge = deriveRouteLocationStateFromLivingWorld(stateWithFacts([
      'v100_qingmao_southern_border_continuity_acceptance',
    ]), 20);

    expect(inProgress).toMatchObject({
      status: 'route_in_progress',
      locationScopeId: 'qingmao_exit_path',
      regionScopeId: 'qingmao',
    });
    expect(outerEdge).toMatchObject({
      status: 'outer_edge_projection',
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
    });
    expect(JSON.stringify(outerEdge)).not.toContain('full_shang_clan_city');
  });

  it('normalizes malformed edited fields conservatively', () => {
    const state = normalizeRouteLocationState({
      status: 'outer_edge_projection',
      routeId: 'direct_shang_city_route',
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
      authority: 'route_location_engine',
      evidenceLedgerEntryIds: ['manual_edit'],
      sourceRefs: ['manual_edit'],
      lastUpdatedAtTurn: 21,
    } as any, 21);

    expect(state.status).toBe('blocked');
    expect(state.locationScopeId).toBe('unknown_conservative');
    expect(state.regionScopeId).toBe('unknown_conservative');
    expect(state.migrationNote).toContain('invalid');
  });

  it('filters hidden/private refs from visible source refs', () => {
    const overview = buildV110RouteLocationOverview({
      routeLocationState: {
        status: 'route_in_progress',
        routeId: 'southern_border_low_rank_route',
        locationScopeId: 'qingmao_exit_path',
        regionScopeId: 'qingmao',
        authority: 'route_location_engine',
        evidenceLedgerEntryIds: ['v018_qingmao_route_entry_threshold_commitment'],
        sourceRefs: ['v110:a2:route_in_progress', 'hidden_ref_only:source'],
        lastUpdatedAtTurn: 18,
      },
      turn: 18,
    });

    expect(overview.visibleSourceRefs).toContain('v110:a2:route_in_progress');
    expect(overview.visibleSourceRefs.join('\n')).not.toContain('hidden_ref_only');
  });

  it('sync action writes only routeLocationState and keeps forbidden upgrades as boundaries', () => {
    const result = resolveV110RouteLocationStateAction({
      livingWorldState: stateWithFacts(['v018_qingmao_route_candidate_continuation_view']),
      turn: 20,
    });

    expect(result.success).toBe(true);
    expect(result.routeLocationState.status).toBe('outer_edge_projection');
    expect(result.routeLocationState.authority).toBe('route_location_engine');
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'reward',
      'formal_faction_standing',
      'npc_life_result',
      'deepseek_authority_expansion',
    ]));
    expect(JSON.stringify(result.routeLocationState)).not.toContain('currentRegion');
  });

  it('passes the approved T0 deterministic soak samples', () => {
    const report = buildV110DeterministicSoakReport();

    expect(report).toHaveLength(8);
    expect(report.map(item => [item.id, item.pass])).toEqual(report.map(item => [item.id, true]));
  });
});
