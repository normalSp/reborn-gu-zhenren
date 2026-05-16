import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import { applyLivingWorldPatch } from './v011-living-world-patch';

describe('v0.11.0-a2 living-world controlled patch API', () => {
  it('rejects DeepSeek and UI as direct state writers', () => {
    const initial = createInitialLivingWorldState();

    const fromDeepSeek = applyLivingWorldPatch(initial, {
      source: 'deepseek',
      knownFacts: [{
        id: 'ai_claimed_reward',
        scope: 'item',
        source: 'deepseek_clue',
        summary: '获得九转蛊',
        learnedTurn: 1,
        confidence: 'confirmed',
        tags: ['forbidden'],
      }],
    });

    const fromUi = applyLivingWorldPatch(initial, {
      source: 'ui',
      actionConsequences: [{
        id: 'ui_wrote_result',
        actionId: 'button_click',
        turn: 1,
        scope: 'resource',
        publicSummary: 'UI 直接给奖励',
        effectRefs: ['reward:stone'],
        followUpRefs: [],
      }],
    });

    expect(fromDeepSeek.state).toEqual(initial);
    expect(fromDeepSeek.applied).toEqual([]);
    expect(fromDeepSeek.rejected).toEqual(['source_not_allowed:deepseek']);
    expect(fromUi.state).toEqual(initial);
    expect(fromUi.rejected).toEqual(['source_not_allowed:ui']);
  });

  it('applies locally verified action consequences and strips hidden fact body text', () => {
    const result = applyLivingWorldPatch(createInitialLivingWorldState(), {
      source: 'action_protocol',
      worldClock: { turn: 3, day: 1, phase: 'morning', lastActionId: 'act_patrol_1' },
      actionConsequences: [{
        id: 'consequence_patrol_1',
        actionId: 'act_patrol_1',
        turn: 3,
        scope: 'region',
        publicSummary: '你确认山路近期有陌生蛊师活动。',
        effectRefs: ['known_fact:qingmao_patrol_pressure'],
        followUpRefs: ['goal:investigate_qingmao_patrol'],
      }],
      knownFacts: [{
        id: 'qingmao_patrol_pressure',
        scope: 'region',
        source: 'engine_result',
        summary: '青茅山前山巡查压力上升。',
        learnedTurn: 3,
        confidence: 'confirmed',
        tags: ['qingmao', 'patrol'],
      }],
      hiddenFactRefs: [{
        id: 'hidden_qingmao_source',
        scope: 'region',
        sourcePointer: 'doc/original-work#hidden-qingmao-source',
        revealPolicyId: 'requires_fact_card_b1',
        guard: 'hidden',
        lastCheckedTurn: 3,
        summary: '这段正文不应进入状态',
      } as any],
    });

    expect(result.rejected).toEqual([]);
    expect(result.applied).toEqual([
      'knownFact:qingmao_patrol_pressure',
      'hiddenFactRef:hidden_qingmao_source',
      'actionConsequence:consequence_patrol_1',
      'worldClock',
    ]);
    expect(result.state.worldClock.lastActionId).toBe('act_patrol_1');
    expect(result.state.knownFacts.qingmao_patrol_pressure.confidence).toBe('confirmed');
    expect(result.state.actionConsequences).toHaveLength(1);
    expect(result.state.hiddenFactRefs.hidden_qingmao_source).toEqual({
      id: 'hidden_qingmao_source',
      scope: 'region',
      sourcePointer: 'doc/original-work#hidden-qingmao-source',
      revealPolicyId: 'requires_fact_card_b1',
      guard: 'hidden',
      lastCheckedTurn: 3,
    });
    expect((result.state.hiddenFactRefs.hidden_qingmao_source as any).summary).toBeUndefined();
  });

  it('upserts ledgers by id instead of duplicating repeated effects', () => {
    const first = applyLivingWorldPatch(createInitialLivingWorldState(), {
      source: 'living_world_engine',
      playerGoals: [{
        id: 'goal_escape_qingmao',
        intentType: 'travel',
        targetRef: 'region:outside_qingmao',
        status: 'deferred',
        createdTurn: 1,
        lastUpdatedTurn: 1,
        rationale: '需要路线与风险信息。',
        nextStepHints: ['调查山路', '打听商队'],
        blockedByRefIds: [],
      }],
    });

    const second = applyLivingWorldPatch(first.state, {
      source: 'living_world_engine',
      playerGoals: [{
        id: 'goal_escape_qingmao',
        intentType: 'travel',
        targetRef: 'region:outside_qingmao',
        status: 'active',
        createdTurn: 1,
        lastUpdatedTurn: 5,
        rationale: '已获得山路线索。',
        nextStepHints: ['准备补给'],
        blockedByRefIds: [],
      }],
    });

    expect(second.state.playerGoals).toHaveLength(1);
    expect(second.state.playerGoals[0].status).toBe('active');
    expect(second.state.playerGoals[0].lastUpdatedTurn).toBe(5);
  });
});
