import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import { resolveQingmaoEscapeRoutePreparationAction } from './v011-qingmao-escape-route-prep';
import {
  buildQingmaoFactionReactionBridgePlan,
  listQingmaoFactionReactionRules,
  resolveQingmaoFactionReactionBridgeAction,
} from './v012-qingmao-faction-reaction-bridge';
import type { LivingPlayerGoalEntry, LivingWorldState } from '../types';

function escapeGoal(turn = 40): LivingPlayerGoalEntry {
  return {
    id: 'goal_escape_qingmao_for_reaction',
    intentType: 'travel',
    targetRef: 'region:outside_qingmao',
    status: 'deferred',
    createdTurn: turn,
    lastUpdatedTurn: turn,
    rationale: '准备离开青茅山。',
    nextStepHints: ['route:qingmao_exit'],
    blockedByRefIds: ['route:qingmao_exit'],
  };
}

function stateAfterEscapePrep(): LivingWorldState {
  const goal = escapeGoal(40);
  const state = createInitialLivingWorldState({
    worldClock: { turn: 40 },
    knownFacts: {
      qingmao_three_clans_layout: {
        id: 'qingmao_three_clans_layout',
        scope: 'region',
        source: 'engine_result',
        summary: '三寨格局已知。',
        learnedTurn: 39,
        confidence: 'confirmed',
        tags: ['test'],
      },
    },
    playerGoals: [goal],
  } as any);
  const prep = resolveQingmaoEscapeRoutePreparationAction({
    livingWorldState: state,
    goalId: goal.id,
    turn: 40,
    selectedStartProfileId: 'start_qingmaoshan_guyue',
  });
  return createInitialLivingWorldState({
    ...state,
    worldClock: { ...state.worldClock, lastActionId: prep.actionId },
    knownFacts: {
      ...state.knownFacts,
      ...Object.fromEntries(prep.knownFacts.map(fact => [fact.id, fact])),
    },
    factionPressure: prep.factionPressure,
    playerGoals: prep.playerGoals,
    actionConsequences: prep.actionConsequences,
  } as any);
}

describe('v0.12.0-b2 Qingmao faction reaction bridge helper', () => {
  it('lists cloned rules from the reviewed MiroFish package', () => {
    const rules = listQingmaoFactionReactionRules();

    expect(rules).toHaveLength(12);
    expect(rules.map(rule => rule.id)).toContain('reaction_jiaosan_task_authority');
    const firstReaction = rules[0].likelyReactions[0];
    rules[0].likelyReactions[0] = 'mutated';
    expect(listQingmaoFactionReactionRules()[0].likelyReactions[0]).toBe(firstReaction);
  });

  it('blocks reaction resolution before public behavior evidence exists', () => {
    const state = createInitialLivingWorldState({ worldClock: { turn: 41 } } as any);
    const result = resolveQingmaoFactionReactionBridgeAction({ livingWorldState: state, turn: 41 });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.rejectedReasons).toEqual(['missing_public_reaction_evidence']);
    expect(result.factionPressure).toEqual([]);
    expect(result.npcMemories).toEqual([]);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
  });

  it('matches route-prep and known public facts into bounded reaction pressure', () => {
    const state = stateAfterEscapePrep();
    const plan = buildQingmaoFactionReactionBridgePlan({ livingWorldState: state });
    const result = resolveQingmaoFactionReactionBridgeAction({ livingWorldState: state, turn: 42 });

    expect(plan.matchedRules.length).toBeGreaterThanOrEqual(6);
    expect(plan.matchedRules.map(rule => rule.id)).toEqual(expect.arrayContaining([
      'reaction_guyue_faction_competition',
      'reaction_elder_security_alert',
      'reaction_jiaosan_task_authority',
      'reaction_internal_affairs_task_trace',
    ]));
    expect(result.success).toBe(true);
    expect(result.factionPressure.length).toBe(plan.matchedRules.length);
    expect(result.npcMemories.length).toBe(plan.matchedRules.length);
    expect(result.actionConsequences).toEqual([
      expect.objectContaining({
        id: 'consequence_qingmao_faction_reaction_bridge_review',
        followUpRefs: expect.arrayContaining([
          'gate:no_standing_delta',
          'gate:no_faction_transfer',
          'gate:no_npc_fate_result',
          'gate:no_reward',
        ]),
      }),
    ]);
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'standing_delta',
      'faction_transfer',
      'reward',
      'npc_death',
      'location_unlock',
      'hidden_fact_reveal',
    ]));
    expect(JSON.stringify(result)).not.toContain('春秋蝉');
    expect(JSON.stringify(result)).not.toContain('投靠成功');
  });
});
