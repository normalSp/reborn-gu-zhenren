import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import {
  buildQingmaoPublicEventChronicle,
  listQingmaoPublicEventRules,
} from './v013-qingmao-public-event-chronicle';
import type { LivingWorldState } from '../types';

function publicState(): LivingWorldState {
  return createInitialLivingWorldState({
    worldClock: {
      turn: 78,
      phase: 'night',
      day: 5,
      lastActionId: 'qingmao_escape_route_preparation_probe',
    },
    knownFacts: {
      guyue_aperture_ceremony_and_clan_school: {
        id: 'guyue_aperture_ceremony_and_clan_school',
        scope: 'region',
        source: 'canon_summary',
        summary: '公开层面的开窍与族学秩序。',
        learnedTurn: 3,
        confidence: 'confirmed',
        tags: ['test'],
      },
      qingmao_three_clans_layout: {
        id: 'qingmao_three_clans_layout',
        scope: 'region',
        source: 'canon_summary',
        summary: '青茅三寨公开格局。',
        learnedTurn: 4,
        confidence: 'confirmed',
        tags: ['test'],
      },
      baijia_bai_ning_bing_public_talent: {
        id: 'baijia_bai_ning_bing_public_talent',
        scope: 'npc',
        source: 'canon_summary',
        summary: '白家公开天才压力。',
        learnedTurn: 6,
        confidence: 'confirmed',
        tags: ['test'],
      },
      qingmao_escape_route_preparation_baseline: {
        id: 'qingmao_escape_route_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '逃离青茅山准备只确认前置。',
        learnedTurn: 60,
        confidence: 'confirmed',
        tags: ['test'],
      },
    },
    factionPressure: [
      {
        id: 'faction_pressure_visible_baijia_opportunity',
        factionId: 'baijia_zhai',
        pressureType: 'opportunity',
        delta: 1,
        reason: '白家方向存在公开接触窗口。',
        turn: 64,
        visibility: 'player_visible',
      },
      {
        id: 'faction_pressure_visible_jiafu_caravan',
        factionId: 'jiafu_caravan',
        pressureType: 'opportunity',
        delta: 1,
        reason: '商队窗口存在补给和递话机会。',
        turn: 64,
        visibility: 'player_visible',
      },
    ],
    npcMemories: [
      {
        id: 'npc_memory_fang_yuan_public_evidence_inquiry_caution',
        npcId: 'fang_yuan',
        turn: 65,
        regionId: 'qingmao',
        actionId: 'qingmao_fang_yuan_public_evidence_inquiry',
        publicSummary: '有人试图打听方源动向，但没有获得当前可见范围内的可靠事实。',
        privateRefId: 'fang_yuan_private_causality_hidden_anchor',
        attitudeDelta: 0,
        weight: 2,
        tags: ['hidden_fact_protected', 'visible_scope_failed'],
        expiresTurn: null,
      },
    ],
    actionConsequences: [
      {
        id: 'consequence_qingmao_escape_route_preparation_probe',
        actionId: 'qingmao_escape_route_preparation_probe',
        turn: 60,
        scope: 'region',
        publicSummary: '路线准备留下可见流程痕迹。',
        effectRefs: ['knownFact:qingmao_escape_route_preparation_baseline'],
        followUpRefs: [
          'pursuit:pursuit_qingmao_internal_affairs_trace',
          'pursuit:pursuit_qingmao_task_absence_north_gate',
          'supply:supply_qingmao_caravan_wine_window',
          'gate:no_location_unlock',
        ],
      },
    ],
    hiddenFactRefs: {
      fang_yuan_private_causality_hidden_anchor: {
        id: 'fang_yuan_private_causality_hidden_anchor',
        scope: 'npc',
        sourcePointer: 'hidden:test',
        revealPolicyId: 'fang_yuan_hidden_causality_guard',
        guard: 'hidden',
        lastCheckedTurn: 65,
      },
    },
  } as any);
}

describe('v0.13.0-b2 Qingmao public event chronicle', () => {
  it('lists cloned public event rules from reviewed MiroFish intake', () => {
    const rules = listQingmaoPublicEventRules();

    expect(rules.length).toBeGreaterThanOrEqual(6);
    expect(rules.map(rule => rule.id)).toContain('public_event_fang_yuan_public_inquiry');
    const firstTrigger = rules[0].triggerRefs[0];
    rules[0].triggerRefs[0] = 'mutated';
    expect(listQingmaoPublicEventRules()[0].triggerRefs[0]).toBe(firstTrigger);
  });

  it('blocks public summary when only hidden refs exist', () => {
    const state = createInitialLivingWorldState({
      hiddenFactRefs: {
        fang_yuan_private_causality_hidden_anchor: {
          id: 'fang_yuan_private_causality_hidden_anchor',
          scope: 'npc',
          sourcePointer: 'hidden:test',
          revealPolicyId: 'fang_yuan_hidden_causality_guard',
          guard: 'hidden',
          lastCheckedTurn: 1,
        },
      },
    } as any);
    const result = buildQingmaoPublicEventChronicle({ livingWorldState: state });

    expect(result.blocked).toBe(true);
    expect(result.promptSafePublicSummary).toBeNull();
    expect(result.events).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('fang_yuan_private_causality_hidden_anchor');
  });

  it('builds prompt-safe public summaries from public action traces', () => {
    const result = buildQingmaoPublicEventChronicle({ livingWorldState: publicState(), maxEvents: 5 });

    expect(result.blocked).toBe(false);
    expect(result.statePatchApplied).toBe(false);
    expect(result.events).toHaveLength(5);
    expect(result.events.every(event => event.canPatch === false && event.hiddenRefsRedacted)).toBe(true);
    expect(result.matchedRuleIds).toEqual(expect.arrayContaining([
      'public_event_baijia_contact_window',
      'public_event_escape_route_preparation',
      'public_event_internal_affairs_trace',
      'public_event_caravan_supply_window',
      'public_event_fang_yuan_public_inquiry',
    ]));
    expect(result.promptSafePublicSummary).toContain('公开');
    expect(JSON.stringify(result)).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(JSON.stringify(result)).not.toContain('春秋蝉');
    expect(JSON.stringify(result)).not.toContain('重生');
    expect(JSON.stringify(result)).not.toContain('隐藏因果已揭示');
  });

  it('keeps formal consequences blocked from the public chronicle', () => {
    const result = buildQingmaoPublicEventChronicle({ livingWorldState: publicState(), maxEvents: 6 });

    expect(result.forbiddenWrites).toEqual(expect.arrayContaining([
      'hidden_fact_body',
      'hidden_fact_reveal',
      'standing_delta',
      'warrant_active',
      'recruitment_success',
      'task_reward',
      'deepseek_authority_expansion',
    ]));
    expect(JSON.stringify(result)).not.toContain('投靠成功');
    expect(JSON.stringify(result)).not.toContain('通缉生效');
    expect(JSON.stringify(result)).not.toContain('任务奖励已发放');
  });
});
