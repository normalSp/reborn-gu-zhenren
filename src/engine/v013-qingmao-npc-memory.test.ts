import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import {
  buildQingmaoNpcMemoryProjection,
  listQingmaoNpcMemoryRules,
  listQingmaoNpcMemorySubjects,
} from './v013-qingmao-npc-memory';
import type { LivingWorldState } from '../types';

function publicState(): LivingWorldState {
  return createInitialLivingWorldState({
    worldClock: {
      turn: 66,
      phase: 'morning',
      day: 4,
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
        summary: '逃离青茅山准备只确认路线、补给、身份遮掩和追踪风险四类前置。',
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

describe('v0.13.0-a2 Qingmao NPC memory projection', () => {
  it('lists cloned subjects and rule drafts from reviewed MiroFish intake', () => {
    const subjects = listQingmaoNpcMemorySubjects();
    const rules = listQingmaoNpcMemoryRules();

    expect(subjects.length).toBeGreaterThanOrEqual(8);
    expect(subjects.every(subject => subject.runtimeNamedNpc === false)).toBe(true);
    expect(rules.map(rule => rule.id)).toContain('npc_memory_fang_yuan_public_probe_caution');
    const firstTrigger = rules[0].triggerRefs[0];
    rules[0].triggerRefs[0] = 'mutated';
    expect(listQingmaoNpcMemoryRules()[0].triggerRefs[0]).toBe(firstTrigger);
  });

  it('blocks projection when there is no public social-memory evidence', () => {
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
    const result = buildQingmaoNpcMemoryProjection({ livingWorldState: state });

    expect(result.blocked).toBe(true);
    expect(result.projections).toEqual([]);
    expect(result.rejectedReasons).toEqual(['missing_public_social_memory_evidence']);
    expect(JSON.stringify(result)).not.toContain('fang_yuan_private_causality_hidden_anchor');
  });

  it('projects bounded read-only NPC memory candidates from public state', () => {
    const result = buildQingmaoNpcMemoryProjection({ livingWorldState: publicState(), maxProjections: 5 });

    expect(result.blocked).toBe(false);
    expect(result.statePatchApplied).toBe(false);
    expect(result.projections.length).toBeGreaterThanOrEqual(4);
    expect(result.projections).toHaveLength(5);
    expect(result.matchedRuleIds).toEqual(expect.arrayContaining([
      'npc_memory_baijia_contact_interest',
      'npc_memory_fang_yuan_public_probe_caution',
      'npc_memory_internal_affairs_route_trace',
      'npc_memory_task_group_absence_pressure',
    ]));
    expect(result.projections.every(projection => projection.canPatch === false)).toBe(true);
    expect(result.forbiddenWrites).toEqual(expect.arrayContaining([
      'npc_memory_store_write',
      'relationship_score',
      'standing_delta',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));
    expect(JSON.stringify(result)).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(JSON.stringify(result)).not.toContain('春秋蝉');
    expect(JSON.stringify(result)).not.toContain('重生');
    expect(JSON.stringify(result)).not.toContain('投靠成功');
    expect(JSON.stringify(result)).not.toContain('通缉生效');
  });

  it('keeps the first cut capped and candidate-only', () => {
    const result = buildQingmaoNpcMemoryProjection({ livingWorldState: publicState(), maxProjections: 3 });

    expect(result.projections).toHaveLength(3);
    expect(result.publicSummary).toContain('候选投影');
    expect(result.projections.flatMap(projection => projection.blockedUpgrades)).toEqual(expect.arrayContaining([
      'faction_transfer',
      'reward',
      'location_unlock',
      'npc_death',
    ]));
  });
});
