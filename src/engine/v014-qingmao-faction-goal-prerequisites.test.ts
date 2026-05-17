import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import type { LivingPlayerGoalEntry } from '../types';
import { buildQingmaoFactionGoalPrerequisites } from './v014-qingmao-faction-goal-prerequisites';

function joinBaiGoal(turn = 61): LivingPlayerGoalEntry {
  return {
    id: 'goal_v014_join_baijia',
    intentType: 'join_faction',
    targetRef: 'faction:baijia_zhai',
    status: 'deferred',
    createdTurn: turn,
    lastUpdatedTurn: turn,
    rationale: '我想投靠白家，但先要知道接触窗口和风险。',
    nextStepHints: ['route:baijia_contact_window'],
    blockedByRefIds: ['gate:no_faction_transfer', 'risk:guyue_suspicion'],
  };
}

describe('v0.14.0-b3 Qingmao faction goal prerequisites', () => {
  it('shows Bai clan prerequisites from a Gu Yue identity without faction transfer', () => {
    const state = createInitialLivingWorldState({
      worldClock: { turn: 61 },
      playerGoals: [joinBaiGoal(61)],
      factionPressure: [{
        id: 'faction_pressure_qingmao_baijia_contact_window_opportunity',
        factionId: 'baijia_zhai',
        pressureType: 'opportunity',
        delta: 1,
        reason: '白家接触窗口只是一种机会，不等于阵营变化。',
        turn: 61,
        visibility: 'player_visible',
      }],
    } as any);

    const result = buildQingmaoFactionGoalPrerequisites({
      livingWorldState: state,
      intentText: '我要投靠白家',
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      playerFactionId: 'guyue_shanzhai',
    });

    expect(result.status).toBe('read_only_prerequisite_preview');
    expect(result.miroFishNeed).toBe('not_needed');
    expect(result.statePatchApplied).toBe(false);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toEqual(expect.objectContaining({
      routeKey: 'baijia_contact_window',
      disposition: 'cross_faction_prerequisites',
      currentFactionId: 'guyue_shanzhai',
      canPatch: false,
      canChangeFaction: false,
      createsFormalTask: false,
      grantsReward: false,
    }));
    expect(result.cards[0].currentIdentitySummary).toContain('古月山寨');
    expect(result.cards[0].publicSummary).toContain('不能一键转入白家');
    expect(result.cards[0].blockedUpgrades).toEqual(expect.arrayContaining([
      'faction_transfer',
      'standing_delta',
      'formal_recruitment',
      'formal_task',
      'task_reward',
      'location_unlock',
      'hidden_fact_reveal',
    ]));
    expect(JSON.stringify(result)).not.toContain('投靠成功');
    expect(JSON.stringify(result)).not.toContain('faction_transfer_granted');
  });

  it('shows merchant and Shang public-entry prerequisites without city entry', () => {
    const result = buildQingmaoFactionGoalPrerequisites({
      intentText: '我要加入商队去商家城',
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      playerFactionId: 'guyue_shanzhai',
    });
    const routeKeys = result.cards.map(card => card.routeKey);

    expect(routeKeys).toEqual(expect.arrayContaining([
      'merchant_caravan_contact',
      'shang_public_entry_deferred',
    ]));
    expect(result.cards.find(card => card.routeKey === 'merchant_caravan_contact')?.publicSummary)
      .toContain('不直接加入商队');
    expect(result.cards.find(card => card.routeKey === 'shang_public_entry_deferred')?.publicSummary)
      .toContain('不开放完整城市系统');
    expect(result.forbiddenWrites).toEqual(expect.arrayContaining([
      'route_entered',
      'location_unlock',
      'formal_task',
      'reward',
    ]));
    expect(JSON.stringify(result)).not.toContain('进入商家城成功');
  });

  it('uses Bai identity as already-in-faction but still blocks rewards and standing writes', () => {
    const result = buildQingmaoFactionGoalPrerequisites({
      intentText: '我要处理白家内部接触',
      selectedStartProfileId: 'start_qingmaoshan_baijia',
      playerFactionId: 'baijia_zhai',
    });

    expect(result.cards[0]).toEqual(expect.objectContaining({
      routeKey: 'baijia_contact_window',
      disposition: 'already_in_faction',
      currentFactionId: 'baijia_zhai',
      canChangeFaction: false,
      grantsReward: false,
    }));
    expect(result.cards[0].publicSummary).toContain('不写声望、职位或奖励');
    expect(result.cards[0].blockedUpgrades).toContain('standing_delta');
  });

  it('keeps unrelated or extreme input out of the current prerequisite cards', () => {
    const result = buildQingmaoFactionGoalPrerequisites({
      intentText: '一转刚开窍、非天外之魔，想立刻拿到盗天魔尊传承',
      selectedStartProfileId: 'start_qingmaoshan_guyue',
    });

    expect(result.cards).toEqual([]);
    expect(result.rejectedReasons).toEqual(['no_faction_or_identity_goal_matched']);
    expect(result.intentRulingHints[0]).toEqual(expect.objectContaining({
      id: 'R14-INTENT-EXTREME-001',
      disposition: 'future_sample_pool',
    }));
    expect(result.forbiddenWrites).toContain('reward');
    expect(result.forbiddenWrites).toContain('hidden_fact_reveal');
  });
});
