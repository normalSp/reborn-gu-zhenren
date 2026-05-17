import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import type { LivingPlayerGoalEntry } from '../types';
import { resolveQingmaoCoverEscapeTracksAction } from './v014-qingmao-cover-escape-tracks';

function escapeGoal(turn = 51): LivingPlayerGoalEntry {
  return {
    id: 'goal_cover_tracks_escape_qingmao',
    intentType: 'travel',
    targetRef: 'region:outside_qingmao',
    status: 'deferred',
    createdTurn: turn,
    lastUpdatedTurn: turn,
    rationale: '逃离青茅山需要先处理路线、补给和痕迹。',
    nextStepHints: ['route:mountain_pass_escape'],
    blockedByRefIds: ['risk:pursuit'],
  };
}

describe('v0.14.0-b1 Qingmao cover escape tracks action', () => {
  it('blocks without an escape goal or route preparation context', () => {
    const state = createInitialLivingWorldState({ worldClock: { turn: 50 } } as any);
    const result = resolveQingmaoCoverEscapeTracksAction({ livingWorldState: state });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.rejectedReasons).toEqual(['missing_escape_route_context']);
    expect(result.knownFacts).toEqual([]);
    expect(result.factionPressure).toEqual([]);
    expect(result.npcMemories).toEqual([]);
    expect(result.playerGoals).toEqual([]);
    expect(result.actionConsequences).toEqual([]);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
  });

  it('commits a low-visibility preparation window without entering a route', () => {
    const goal = escapeGoal(51);
    const state = createInitialLivingWorldState({
      worldClock: { turn: 51, lastActionId: 'qingmao_escape_route_preparation_probe' },
      playerGoals: [goal],
      knownFacts: {
        qingmao_escape_route_preparation_baseline: {
          id: 'qingmao_escape_route_preparation_baseline',
          scope: 'region',
          source: 'engine_result',
          summary: '逃离青茅山的第一轮准备只确认路线、补给、身份遮掩和追踪风险四类前置。',
          learnedTurn: 51,
          confidence: 'confirmed',
          tags: ['v0.12.0-b1', 'route_supply_pursuit'],
        },
      },
    } as any);

    const result = resolveQingmaoCoverEscapeTracksAction({
      livingWorldState: state,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      sceneId: 'v014_cover_tracks_test',
      locationId: 'qingmaoshan_outer_paths',
    });

    expect(result.success).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.worldActionCandidate.domain).toBe('field_action');
    expect(result.worldActionDeparture.mode).toBe('local_resolution');
    expect(result.worldActionDeparture.chargeAp).toBe(false);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.knownFacts).toEqual([
      expect.objectContaining({
        id: 'qingmao_escape_tracks_cover_baseline',
        summary: expect.stringContaining('仍未离开青茅山'),
      }),
    ]);
    expect(result.factionPressure.map(entry => entry.id)).toEqual([
      'faction_pressure_qingmao_cover_tracks_low_visibility_window',
      'faction_pressure_qingmao_cover_tracks_guyue_shanzhai_residual_trace',
    ]);
    expect(result.npcMemories).toEqual([
      expect.objectContaining({
        id: 'npc_memory_qingmao_cover_tracks_public_routine',
        privateRefId: null,
      }),
    ]);
    expect(result.playerGoals).toEqual([
      expect.objectContaining({
        id: goal.id,
        status: 'deferred',
        blockedByRefIds: expect.arrayContaining([
          'gate:no_location_unlock',
          'gate:no_faction_transfer',
          'risk:pursuit_residual_trace',
        ]),
      }),
    ]);
    expect(result.actionConsequences).toEqual([
      expect.objectContaining({
        id: 'consequence_qingmao_cover_escape_tracks_probe',
        followUpRefs: expect.arrayContaining([
          'route:mountain_pass_escape',
          'gate:no_location_unlock',
          'gate:no_faction_transfer',
          'gate:no_reward',
        ]),
      }),
    ]);
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'route_entered',
      'location_unlock',
      'faction_transfer',
      'reward',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));
    expect(JSON.stringify(result)).not.toContain('春秋蝉');
    expect(JSON.stringify(result)).not.toContain('重生');
    expect(JSON.stringify(result)).not.toContain('离开成功');
    expect(JSON.stringify(result)).not.toContain('奖励已发放');
  });

  it('can use route preparation evidence even when the goal is not present', () => {
    const state = createInitialLivingWorldState({
      worldClock: { turn: 52 },
      actionConsequences: [{
        id: 'consequence_qingmao_escape_route_preparation_probe',
        actionId: 'qingmao_escape_route_preparation_probe',
        turn: 52,
        scope: 'region',
        publicSummary: '已完成路线准备第一步，但当前没有离开青茅山。',
        effectRefs: [],
        followUpRefs: ['route:route_qingmao_outer_night_mountain_road'],
      }],
    } as any);

    const result = resolveQingmaoCoverEscapeTracksAction({ livingWorldState: state });

    expect(result.success).toBe(true);
    expect(result.playerGoals).toEqual([]);
    expect(result.visibleSourceRefs).toContain('fact:qingmao_escape_route_preparation_baseline');
  });
});
