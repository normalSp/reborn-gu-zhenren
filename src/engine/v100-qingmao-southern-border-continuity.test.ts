import { describe, expect, it } from 'vitest';
import {
  buildV100QingmaoSouthernBorderContinuityOverview,
  resolveV100QingmaoSouthernBorderContinuityAction,
} from './v100-qingmao-southern-border-continuity';
import type { LivingWorldState } from '../types';

function stateWithV018Route(): Partial<LivingWorldState> {
  return {
    schemaVersion: 1,
    worldClock: {
      turn: 18,
      day: 1,
      phase: 'afternoon',
      lastActionId: 'v018_qingmao_pressure_backflow',
    },
    knownFacts: {
      qingmao_escape_route_preparation_baseline: {
        id: 'qingmao_escape_route_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '已准备离开青茅山的公开路线。',
        learnedTurn: 11,
        confidence: 'confirmed',
        tags: ['route_preparation'],
      },
      v018_qingmao_route_entry_threshold_commitment: {
        id: 'v018_qingmao_route_entry_threshold_commitment',
        scope: 'region',
        source: 'engine_result',
        summary: '门槛已确认。',
        learnedTurn: 16,
        confidence: 'confirmed',
        tags: ['v0.18'],
      },
      v018_qingmao_route_candidate_continuation_view: {
        id: 'v018_qingmao_route_candidate_continuation_view',
        scope: 'region',
        source: 'engine_result',
        summary: '候选承接已确认。',
        learnedTurn: 17,
        confidence: 'confirmed',
        tags: ['v0.18'],
      },
      v018_qingmao_route_pressure_backflow_baseline: {
        id: 'v018_qingmao_route_pressure_backflow_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '压力已回流。',
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
        status: 'active',
        createdTurn: 10,
        lastUpdatedTurn: 18,
        rationale: '我要逃离青茅山并找南疆落脚处。',
        nextStepHints: ['v018:candidate_continuation'],
        blockedByRefIds: [],
      },
    ],
    factionPressure: [],
    npcMemories: [],
    actionConsequences: [],
  };
}

describe('v100 Qingmao southern border continuity', () => {
  it('blocks until v018 continuity prerequisites are visible', () => {
    const overview = buildV100QingmaoSouthernBorderContinuityOverview({
      livingWorldState: {
        knownFacts: {},
        playerGoals: [],
      },
    });
    expect(overview.status).toBe('blocked');
    expect(overview.checks.some(check => !check.satisfied)).toBe(true);

    const resolution = resolveV100QingmaoSouthernBorderContinuityAction({
      livingWorldState: {
        knownFacts: {},
        playerGoals: [],
      },
    });
    expect(resolution.success).toBe(false);
    expect(resolution.knownFacts).toEqual([]);
    expect(resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(resolution.forbiddenUpgrades).toContain('route_entered');
  });

  it('writes only existing living-world fields for the v1 continuity acceptance', () => {
    const livingWorldState = stateWithV018Route();
    const overview = buildV100QingmaoSouthernBorderContinuityOverview({ livingWorldState });
    expect(overview.status).toBe('release_ready_preview');
    expect(overview.deferredRedlines.map(item => item.id)).toContain('v100_redline_hidden_fact');

    const resolution = resolveV100QingmaoSouthernBorderContinuityAction({
      livingWorldState,
      turn: 20,
      sceneId: 'test_scene',
      locationId: 'qingmaoshan_outer_paths',
    });
    expect(resolution.success).toBe(true);
    expect(resolution.knownFacts.map(fact => fact.id)).toContain('v100_qingmao_southern_border_continuity_acceptance');
    expect(resolution.factionPressure.map(entry => entry.id)).toEqual(expect.arrayContaining([
      'faction_pressure_v100_route_release_candidate_window',
      'faction_pressure_v100_qingmao_residual_watch',
    ]));
    expect(resolution.npcMemories.map(entry => entry.id)).toContain('npc_memory_v100_route_public_trace');
    expect(resolution.actionConsequences.map(entry => entry.id)).toContain('consequence_v100_qingmao_southern_border_continuity_acceptance_probe');
    expect(resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(resolution.worldActionCandidate.metadata).toMatchObject({
      saveFormatImpact: 'none',
    });
    expect(resolution.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'route_entered',
      'current_region',
      'location_unlock',
      'reward',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
      'save_format_bump',
    ]));
  });
});
