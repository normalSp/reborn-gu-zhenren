import { describe, expect, it } from 'vitest';
import {
  buildV100LowRankLifeLoopOverview,
  resolveV100LowRankLifeLoopReleaseAction,
} from './v100-low-rank-life-loop-release';
import type { LivingWorldState } from '../types';

function stateWithReleaseLoop(): Partial<LivingWorldState> {
  return {
    schemaVersion: 1,
    worldClock: {
      turn: 23,
      day: 2,
      phase: 'afternoon',
      lastActionId: 'v100_qingmao_southern_border_continuity_acceptance_probe',
    },
    knownFacts: {
      v100_qingmao_southern_border_continuity_acceptance: {
        id: 'v100_qingmao_southern_border_continuity_acceptance',
        scope: 'region',
        source: 'engine_result',
        summary: '连续体验已验收。',
        learnedTurn: 20,
        confidence: 'confirmed',
        tags: ['v1.0'],
      },
      qingmao_supply_feeding_preparation_baseline: {
        id: 'qingmao_supply_feeding_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '补给喂养缺口已整理。',
        learnedTurn: 15,
        confidence: 'confirmed',
        tags: ['supply'],
      },
      qingmao_refinement_fragment_boundary_baseline: {
        id: 'qingmao_refinement_fragment_boundary_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '炼蛊边界已整理。',
        learnedTurn: 16,
        confidence: 'confirmed',
        tags: ['refinement'],
      },
      qingmao_market_window_candidate_baseline: {
        id: 'qingmao_market_window_candidate_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '市场窗口已整理。',
        learnedTurn: 17,
        confidence: 'confirmed',
        tags: ['market'],
      },
      v018_qingmao_route_pressure_backflow_baseline: {
        id: 'v018_qingmao_route_pressure_backflow_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '路线压力已回流。',
        learnedTurn: 18,
        confidence: 'confirmed',
        tags: ['v0.18'],
      },
    },
    playerGoals: [
      {
        id: 'goal_escape_qingmao',
        intentType: 'travel',
        targetRef: 'region:outside_qingmao',
        status: 'deferred',
        createdTurn: 10,
        lastUpdatedTurn: 20,
        rationale: '我要逃离青茅山并在南疆低阶路线里活下去。',
        nextStepHints: ['v100:low_rank_life_loop'],
        blockedByRefIds: ['gate:no_route_entered'],
      },
    ],
    factionPressure: [],
    npcMemories: [],
    actionConsequences: [],
  };
}

describe('v100 low-rank life loop release', () => {
  it('blocks until continuity, supply, refinement, market and route pressure are visible', () => {
    const overview = buildV100LowRankLifeLoopOverview({
      livingWorldState: {
        knownFacts: {},
        playerGoals: [],
      },
    });
    expect(overview.status).toBe('blocked');
    expect(overview.checks.filter(check => check.blocking && !check.satisfied).length).toBeGreaterThan(0);

    const resolution = resolveV100LowRankLifeLoopReleaseAction({
      livingWorldState: {
        knownFacts: {},
        playerGoals: [],
      },
    });
    expect(resolution.success).toBe(false);
    expect(resolution.knownFacts).toEqual([]);
    expect(resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(resolution.forbiddenUpgrades).toContain('formal_market_trade');
  });

  it('writes only existing living-world fields for release life-loop acceptance', () => {
    const livingWorldState = stateWithReleaseLoop();
    const overview = buildV100LowRankLifeLoopOverview({ livingWorldState });
    expect(overview.status).toBe('release_loop_ready');
    expect(overview.deferredRedlines.map(item => item.id)).toContain('v100_life_redline_reward');

    const resolution = resolveV100LowRankLifeLoopReleaseAction({
      livingWorldState,
      turn: 24,
      sceneId: 'test_scene',
      locationId: 'qingmaoshan_outer_paths',
    });
    expect(resolution.success).toBe(true);
    expect(resolution.knownFacts.map(fact => fact.id)).toContain('v100_low_rank_life_loop_release_acceptance');
    expect(resolution.factionPressure.map(entry => entry.id)).toEqual(expect.arrayContaining([
      'faction_pressure_v100_life_loop_supply_cost',
      'faction_pressure_v100_life_loop_market_attention',
    ]));
    expect(resolution.npcMemories.map(entry => entry.id)).toContain('npc_memory_v100_life_loop_public_routine');
    expect(resolution.actionConsequences.map(entry => entry.id)).toContain('consequence_v100_low_rank_life_loop_release_acceptance_probe');
    expect(resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(resolution.worldActionCandidate.metadata).toMatchObject({
      saveFormatImpact: 'none',
    });
    expect(resolution.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'material_reward',
      'currency_delta',
      'recipe_unlock',
      'formal_market_trade',
      'commission_profit',
      'route_entered',
      'location_unlock',
      'deepseek_authority_expansion',
      'save_format_bump',
    ]));
  });
});
