import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import {
  buildQingmaoFactionStanceProjection,
  listQingmaoFactionStanceRules,
  listQingmaoFactionStanceSubjects,
} from './v013-qingmao-faction-stance';
import type { LivingWorldState } from '../types';

function publicState(): LivingWorldState {
  return createInitialLivingWorldState({
    worldClock: {
      turn: 72,
      phase: 'afternoon',
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
        id: 'faction_pressure_qingmao_escape_route_guyue_shanzhai_pursuit_risk',
        factionId: 'guyue_shanzhai',
        pressureType: 'suspicion',
        delta: 2,
        reason: '路线准备留下追踪风险。',
        turn: 65,
        visibility: 'player_visible',
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
          'pursuit:pursuit_qingmao_residence_check',
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

describe('v0.13.0-b1 Qingmao faction stance projection', () => {
  it('lists cloned faction subjects and rule drafts from reviewed MiroFish intake', () => {
    const subjects = listQingmaoFactionStanceSubjects();
    const rules = listQingmaoFactionStanceRules();

    expect(subjects.length).toBeGreaterThanOrEqual(6);
    expect(subjects.every(subject => subject.runtimeStandingScore === false)).toBe(true);
    expect(rules.map(rule => rule.id)).toContain('faction_stance_baijia_contact_opportunity');
    const firstTrigger = rules[0].triggerRefs[0];
    rules[0].triggerRefs[0] = 'mutated';
    expect(listQingmaoFactionStanceRules()[0].triggerRefs[0]).toBe(firstTrigger);
  });

  it('blocks projection when there is no public faction evidence', () => {
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
    const result = buildQingmaoFactionStanceProjection({ livingWorldState: state });

    expect(result.blocked).toBe(true);
    expect(result.projections).toEqual([]);
    expect(result.rejectedReasons).toEqual(['missing_public_faction_stance_evidence']);
    expect(JSON.stringify(result)).not.toContain('fang_yuan_private_causality_hidden_anchor');
  });

  it('projects bounded read-only faction pressure candidates from public state', () => {
    const result = buildQingmaoFactionStanceProjection({ livingWorldState: publicState(), maxProjections: 5 });

    expect(result.blocked).toBe(false);
    expect(result.statePatchApplied).toBe(false);
    expect(result.projections).toHaveLength(5);
    expect(result.matchedRuleIds).toEqual(expect.arrayContaining([
      'faction_stance_baijia_contact_opportunity',
      'faction_stance_guyue_internal_affairs_trace',
      'faction_stance_task_group_authority_pressure',
      'faction_stance_route_blockade_hint',
      'faction_stance_caravan_supply_window',
    ]));
    expect(result.projections.every(projection => projection.canPatch === false)).toBe(true);
    expect(result.projections.some(projection => projection.escalationBlocked)).toBe(true);
    expect(result.forbiddenWrites).toEqual(expect.arrayContaining([
      'standing_delta',
      'warrant_active',
      'recruitment_success',
      'task_created',
      'task_reward',
      'deepseek_authority_expansion',
    ]));
    expect(JSON.stringify(result)).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(JSON.stringify(result)).not.toContain('投靠成功');
    expect(JSON.stringify(result)).not.toContain('通缉生效');
    expect(JSON.stringify(result)).not.toContain('任务奖励');
    expect(JSON.stringify(result)).not.toContain('声望+');
  });

  it('keeps formal escalation blocked even when hints are present', () => {
    const result = buildQingmaoFactionStanceProjection({ livingWorldState: publicState(), maxProjections: 7 });
    const blocked = result.projections.filter(projection => projection.escalationBlocked);

    expect(blocked.length).toBeGreaterThanOrEqual(4);
    expect(blocked.flatMap(projection => projection.blockedUpgrades)).toEqual(expect.arrayContaining([
      'recruitment_success',
      'warrant_active',
      'task_created',
      'task_reward',
      'faction_transfer',
    ]));
  });
});
