import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import type { LivingWorldState } from '../types';
import { resolveQingmaoEscapeRoutePreparationAction } from './v011-qingmao-escape-route-prep';
import { resolveQingmaoCoverEscapeTracksAction } from './v014-qingmao-cover-escape-tracks';
import { resolveQingmaoMountainPassRouteContinuationAction } from './v014-qingmao-mountain-pass-route-continuation';

function preparedState(): LivingWorldState {
  let state = createInitialLivingWorldState({
    worldClock: { turn: 61 },
    playerGoals: [{
      id: 'goal_v014_mountain_pass_escape',
      intentType: 'travel',
      targetRef: 'region:outside_qingmao',
      status: 'deferred',
      createdTurn: 61,
      lastUpdatedTurn: 61,
      rationale: '我要逃离青茅山，先找低阶山路路线。',
      nextStepHints: ['route:mountain_pass_escape'],
      blockedByRefIds: ['route:qingmao_exit', 'risk:pursuit'],
    }],
  } as any);

  const prep = resolveQingmaoEscapeRoutePreparationAction({
    livingWorldState: state,
    goalId: 'goal_v014_mountain_pass_escape',
    turn: 61,
  });
  state = {
    ...state,
    knownFacts: {
      ...state.knownFacts,
      ...Object.fromEntries(prep.knownFacts.map(fact => [fact.id, fact])),
    },
    factionPressure: [...state.factionPressure, ...prep.factionPressure],
    playerGoals: prep.playerGoals,
    actionConsequences: [...state.actionConsequences, ...prep.actionConsequences],
    worldClock: { ...state.worldClock, lastActionId: prep.actionId },
  };

  const cover = resolveQingmaoCoverEscapeTracksAction({
    livingWorldState: state,
    selectedStartProfileId: 'start_qingmaoshan_guyue',
    turn: 62,
  });
  state = {
    ...state,
    knownFacts: {
      ...state.knownFacts,
      ...Object.fromEntries(cover.knownFacts.map(fact => [fact.id, fact])),
    },
    factionPressure: [...state.factionPressure, ...cover.factionPressure],
    npcMemories: [...state.npcMemories, ...cover.npcMemories],
    playerGoals: cover.playerGoals.length > 0 ? cover.playerGoals : state.playerGoals,
    actionConsequences: [...state.actionConsequences, ...cover.actionConsequences],
    worldClock: { ...state.worldClock, lastActionId: cover.actionId },
  };

  return state;
}

describe('v0.14.0-b2 Qingmao mountain-pass route continuation', () => {
  it('blocks before the player has goal, route preparation, and cover context', () => {
    const empty = createInitialLivingWorldState({ worldClock: { turn: 60 } } as any);
    const noCover = createInitialLivingWorldState({
      worldClock: { turn: 60, lastActionId: 'qingmao_escape_route_preparation_probe' },
      playerGoals: [{
        id: 'goal_missing_cover',
        intentType: 'travel',
        targetRef: 'region:outside_qingmao',
        status: 'deferred',
        createdTurn: 60,
        lastUpdatedTurn: 60,
        rationale: '我要逃离青茅山。',
        nextStepHints: [],
        blockedByRefIds: [],
      }],
      knownFacts: {
        qingmao_escape_route_preparation_baseline: {
          id: 'qingmao_escape_route_preparation_baseline',
          scope: 'region',
          source: 'engine_result',
          summary: '逃离青茅山的第一轮准备只确认路线、补给、身份遮掩和追踪风险四类前置。',
          learnedTurn: 60,
          confidence: 'confirmed',
          tags: ['v0.12.0-b1'],
        },
      },
    } as any);

    const missingAll = resolveQingmaoMountainPassRouteContinuationAction({ livingWorldState: empty });
    const missingCover = resolveQingmaoMountainPassRouteContinuationAction({ livingWorldState: noCover });

    expect(missingAll.success).toBe(false);
    expect(missingAll.rejectedReasons).toEqual(expect.arrayContaining([
      'missing_escape_goal',
      'missing_route_preparation',
      'missing_cover_tracks_context',
    ]));
    expect(missingAll.knownFacts).toEqual([]);
    expect(missingAll.worldActionResolution.rewardPolicy).toBe('none');

    expect(missingCover.success).toBe(false);
    expect(missingCover.rejectedReasons).toContain('missing_cover_tracks_context');
    expect(missingCover.knownFacts).toEqual([]);
  });

  it('commits a mountain-pass route candidate without entering a route or granting rewards', () => {
    const state = preparedState();
    const result = resolveQingmaoMountainPassRouteContinuationAction({
      livingWorldState: state,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      sceneId: 'v014_mountain_pass_test',
      locationId: 'qingmaoshan_outer_paths',
      turn: 63,
    });

    expect(result.success).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.routePreview?.routeKey).toBe('mountain_pass_escape');
    expect(result.routePreview?.eligibility).toBe('candidate');
    expect(result.routePreview?.missingConditions.map(condition => condition.id)).toContain('travel_supply_gap');
    expect(result.worldActionCandidate.domain).toBe('field_action');
    expect(result.worldActionDeparture.mode).toBe('local_resolution');
    expect(result.worldActionDeparture.chargeAp).toBe(false);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.knownFacts).toEqual([
      expect.objectContaining({
        id: 'qingmao_mountain_pass_route_continuation_candidate',
        summary: expect.stringContaining('仍未离开青茅山'),
      }),
    ]);
    expect(result.factionPressure.map(entry => entry.id)).toEqual([
      'faction_pressure_qingmao_mountain_pass_route_window',
      'faction_pressure_qingmao_mountain_pass_guyue_shanzhai_pursuit_attention',
    ]);
    expect(result.npcMemories).toEqual([
      expect.objectContaining({
        id: 'npc_memory_qingmao_mountain_pass_outer_watch',
        privateRefId: null,
      }),
    ]);
    expect(result.playerGoals).toEqual([
      expect.objectContaining({
        id: 'goal_v014_mountain_pass_escape',
        blockedByRefIds: expect.arrayContaining([
          'gate:no_route_entered',
          'gate:no_location_unlock',
          'gap:travel_supply_gap',
          'risk:pursuit_attention',
        ]),
      }),
    ]);
    expect(result.actionConsequences).toEqual([
      expect.objectContaining({
        id: 'consequence_qingmao_mountain_pass_route_continuation_probe',
        followUpRefs: expect.arrayContaining([
          'route_candidate:mountain_pass_escape',
          'gate:no_route_entered',
          'gate:no_location_unlock',
          'gate:no_faction_transfer',
          'gate:no_reward',
          'missing:travel_supply_gap',
        ]),
      }),
    ]);
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'route_entered',
      'escape_success',
      'location_unlock',
      'faction_transfer',
      'reward',
      'npc_death',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));
    expect(JSON.stringify(result)).not.toContain('location_unlock_granted');
    expect(JSON.stringify(result)).not.toContain('route_entered_granted');
    expect(JSON.stringify(result)).not.toContain('投靠成功');
    expect(JSON.stringify(result)).not.toContain('春秋蝉');
    expect(JSON.stringify(result)).not.toContain('奖励已发放');
  });
});
