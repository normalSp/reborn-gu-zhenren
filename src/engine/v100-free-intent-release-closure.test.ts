import { describe, expect, it } from 'vitest';
import {
  buildV100FreeIntentReleaseClosureOverview,
  resolveV100FreeIntentReleaseClosureAction,
} from './v100-free-intent-release-closure';
import type { LivingWorldState } from '../types';

function stateWithV100LifeLoop(): Partial<LivingWorldState> {
  return {
    schemaVersion: 1,
    worldClock: {
      turn: 31,
      day: 3,
      phase: 'morning',
      lastActionId: 'v100_low_rank_life_loop_release_acceptance_probe',
    },
    knownFacts: {
      v100_low_rank_life_loop_release_acceptance: {
        id: 'v100_low_rank_life_loop_release_acceptance',
        scope: 'region',
        source: 'engine_result',
        summary: 'v1.0 低阶 life loop 已验收。',
        learnedTurn: 28,
        confidence: 'confirmed',
        tags: ['v1.0.0-b2'],
      },
    },
    hiddenFactRefs: {},
    playerGoals: [],
    factionPressure: [],
    npcMemories: [],
    actionConsequences: [],
    ifDeviations: [],
  };
}

describe('v100 free intent release closure', () => {
  it('blocks release closure until the low-rank life loop acceptance is visible', () => {
    const overview = buildV100FreeIntentReleaseClosureOverview({
      livingWorldState: {
        knownFacts: {},
        playerGoals: [],
      },
    });
    expect(overview.status).toBe('blocked');
    expect(overview.readinessChecks.find(check => check.id === 'v100_intent_life_loop_ready')?.satisfied).toBe(false);
    expect(overview.intentSamples.map(sample => sample.id)).toEqual(expect.arrayContaining([
      'v100_intent_theft_heaven_inheritance',
      'v100_intent_rank_nine_gu',
      'v100_intent_kill_key_npc',
    ]));
    expect(overview.intentSamples.every(sample => sample.matchedExpected)).toBe(true);

    const resolution = resolveV100FreeIntentReleaseClosureAction({
      livingWorldState: { knownFacts: {}, playerGoals: [] },
    });
    expect(resolution.success).toBe(false);
    expect(resolution.rejectedReasons).toContain('v100_intent_life_loop_ready');
    expect(resolution.knownFacts).toEqual([]);
    expect(resolution.worldActionResolution.rewardPolicy).toBe('none');
  });

  it('summarizes normal, long-term and extreme player intents without granting outcomes', () => {
    const livingWorldState = stateWithV100LifeLoop();
    const overview = buildV100FreeIntentReleaseClosureOverview({
      livingWorldState,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      playerFactionId: 'guyue_shanzhai',
    });
    expect(overview.status).toBe('closure_ready');
    expect(overview.intentSamples).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'v100_intent_escape_qingmao',
        targetRef: 'region:outside_qingmao',
        category: 'requires_prerequisite',
        allowed: false,
        matchedExpected: true,
      }),
      expect.objectContaining({
        id: 'v100_intent_track_fang_yuan',
        targetRef: 'npc:fang_yuan',
        category: 'available_with_cost',
        allowed: true,
        matchedExpected: true,
      }),
      expect.objectContaining({
        id: 'v100_intent_theft_heaven_inheritance',
        targetRef: 'inheritance:theft_heaven_demon_venerable',
        category: 'world_rule_blocked',
        allowed: false,
        matchedExpected: true,
      }),
      expect.objectContaining({
        id: 'v100_intent_rank_nine_gu',
        targetRef: 'item:rank_nine_gu',
        category: 'long_term_goal',
        allowed: false,
        matchedExpected: true,
      }),
      expect.objectContaining({
        id: 'v100_intent_kill_key_npc',
        targetRef: 'npc:key_character:death_or_capture',
        category: 'major_if_deviation',
        allowed: false,
        matchedExpected: true,
      }),
    ]));
    expect(overview.forbiddenWrites).toEqual(expect.arrayContaining([
      'rank_nine_gu_reward',
      'inheritance_grant',
      'location_unlock',
      'faction_transfer',
      'npc_life_result',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
      'save_format_bump',
    ]));
  });

  it('writes only v22 living-world fields for release free-intent closure acceptance', () => {
    const resolution = resolveV100FreeIntentReleaseClosureAction({
      livingWorldState: stateWithV100LifeLoop(),
      turn: 32,
      sceneId: 'test_scene',
      locationId: 'qingmaoshan_outer_paths',
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      playerFactionId: 'guyue_shanzhai',
    });

    expect(resolution.success).toBe(true);
    expect(resolution.knownFacts.map(fact => fact.id)).toEqual([
      'v100_free_intent_release_closure_acceptance',
    ]);
    expect(resolution.factionPressure.map(entry => entry.id)).toEqual([
      'faction_pressure_v100_free_intent_public_risk',
    ]);
    expect(resolution.npcMemories.map(entry => entry.id)).toEqual([
      'npc_memory_v100_free_intent_public_boundary',
    ]);
    expect(resolution.actionConsequences.map(entry => entry.id)).toEqual([
      'consequence_v100_free_intent_release_closure_probe',
    ]);
    expect(resolution.playerGoals).toEqual([]);
    expect(resolution.worldActionCandidate.metadata).toMatchObject({
      saveFormatImpact: 'none',
    });
    expect(resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(resolution.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'rank_nine_gu_reward',
      'inheritance_grant',
      'route_entered',
      'current_region',
      'location_unlock',
      'faction_transfer',
      'npc_life_result',
      'canon_anchor_mutation',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
      'save_format_bump',
    ]));
  });
});
