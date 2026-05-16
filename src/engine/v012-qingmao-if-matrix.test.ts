import { describe, expect, it } from 'vitest';
import {
  getQingmaoLowRankIfAxis,
  getQingmaoLowRankIfRule,
  listQingmaoLowRankIfAxes,
  listQingmaoLowRankIfRules,
  matchQingmaoLowRankIfRules,
  previewQingmaoLowRankIfAdjudication,
} from './v012-qingmao-if-matrix';

describe('v0.12.0-a2 Qingmao IF matrix helper', () => {
  it('lists cloned axes and rules', () => {
    const axes = listQingmaoLowRankIfAxes();
    const rules = listQingmaoLowRankIfRules();

    expect(axes.map(axis => axis.id)).toEqual([
      'npc_attention',
      'faction_pressure',
      'resource_control',
      'route_escape',
      'hidden_fact_probe',
      'local_survival',
      'canon_anchor_pressure',
    ]);
    expect(rules.length).toBeGreaterThanOrEqual(12);

    const firstAllowedWrite = axes[0].allowedWrites[0];
    axes[0].allowedWrites[0] = 'mutated_in_test';
    expect(listQingmaoLowRankIfAxes()[0].allowedWrites[0]).toBe(firstAllowedWrite);

    const firstMatcherTerm = rules[0].matcher.rawTextIncludesAny?.[0];
    if (firstMatcherTerm) {
      rules[0].matcher.rawTextIncludesAny![0] = 'mutated_in_test';
      expect(listQingmaoLowRankIfRules()[0].matcher.rawTextIncludesAny?.[0]).toBe(firstMatcherTerm);
    }
  });

  it('resolves specific axis and rule records', () => {
    expect(getQingmaoLowRankIfAxis('route_escape')).toEqual(expect.objectContaining({
      id: 'route_escape',
      defaultDeviationLevel: 'precondition_required',
    }));
    expect(getQingmaoLowRankIfRule('block_bai_ning_bing_direct_kill')).toEqual(expect.objectContaining({
      id: 'block_bai_ning_bing_direct_kill',
      deviationLevel: 'blocked',
    }));
    expect(getQingmaoLowRankIfAxis('missing')).toBeNull();
    expect(getQingmaoLowRankIfRule('missing')).toBeNull();
  });

  it('prioritizes hard blocks over lower-rank rumor or preparation rules', () => {
    const flowerWine = matchQingmaoLowRankIfRules({
      rawText: '我要调查花酒传承的位置',
      intentType: 'investigate',
    });
    const baiNingBing = matchQingmaoLowRankIfRules({
      rawText: '我要杀死白凝冰阻止他自爆',
      targetRef: 'npc:bai_ning_bing:defeat_or_kill',
      intentType: 'defeat_key_npc',
    });

    expect(flowerWine[0].id).toBe('block_flower_wine_hidden_location');
    expect(flowerWine[0].deviationLevel).toBe('blocked');
    expect(flowerWine.map(rule => rule.id)).toContain('rumor_flower_wine_public');
    expect(baiNingBing[0].id).toBe('block_bai_ning_bing_direct_kill');
    expect(baiNingBing[0].hiddenFactRefIds).toContain('bai_ning_bing_extreme_body_hidden_risk_ref');
  });

  it('previews meaningful v0.12 low-rank outcomes without granting final writes', () => {
    const escape = previewQingmaoLowRankIfAdjudication({
      rawText: '我要跟着商队逃离青茅山',
      targetRef: 'route:caravan',
      intentType: 'escape_region',
    });
    const joinBai = previewQingmaoLowRankIfAdjudication({
      rawText: '我要投靠白家',
      targetRef: 'faction:baijia_zhai',
      intentType: 'join_faction',
    });
    const resource = previewQingmaoLowRankIfAdjudication({
      rawText: '我想省元石买月兰花喂养月光蛊',
      intentType: 'manage_resources',
    });
    const patrol = previewQingmaoLowRankIfAdjudication({
      rawText: '我要参加巡逻，争取三寨战功',
      intentType: 'take_patrol',
    });

    expect(escape).toEqual(expect.objectContaining({
      matched: true,
      ruleId: 'precondition_escape_qingmao_route',
      deviationLevel: 'precondition_required',
      allowedOutcome: 'route_preparation_chain_only',
    }));
    expect(escape.forbiddenWrites).toEqual(expect.arrayContaining(['escape_success', 'location_unlock']));
    expect(escape.requiredPreconditions).toEqual(expect.arrayContaining(['route_candidate', 'supply_pack', 'pursuit_risk_review']));

    expect(joinBai).toEqual(expect.objectContaining({
      ruleId: 'major_candidate_join_bai_clan',
      deviationLevel: 'major_deviation_candidate',
      allowedOutcome: 'contact_window_or_pressure_only',
    }));
    expect(joinBai.forbiddenWrites).toContain('faction_identity_change');

    expect(resource).toEqual(expect.objectContaining({
      ruleId: 'minor_resource_feeding_plan',
      deviationLevel: 'minor_deviation',
      allowedOutcome: 'local_engine_resource_plan_only',
    }));
    expect(resource.forbiddenWrites).toContain('direct_reward');

    expect(patrol).toEqual(expect.objectContaining({
      ruleId: 'minor_war_merit_patrol',
      deviationLevel: 'minor_deviation',
      allowedOutcome: 'local_patrol_candidate_only',
    }));
    expect(patrol.forbiddenWrites).toContain('war_merit_reward_without_engine');
  });

  it('blocks hidden facts and high-rank demands with ids only, not hidden bodies', () => {
    const rankNine = previewQingmaoLowRankIfAdjudication({ rawText: '我要拿九转蛊' });
    const spiritSpring = previewQingmaoLowRankIfAdjudication({ rawText: '我要调查灵泉枯竭秘密' });
    const firstGen = previewQingmaoLowRankIfAdjudication({ rawText: '我要揭露古月一代血道真相' });
    const fangYuan = previewQingmaoLowRankIfAdjudication({
      rawText: '我要跟踪方源',
      targetRef: 'npc:fang_yuan',
      intentType: 'investigate',
    });

    expect(rankNine.ruleId).toBe('block_rank_nine_or_immortal_demand');
    expect(rankNine.deviationLevel).toBe('blocked');
    expect(rankNine.forbiddenWrites).toContain('rank_nine_acquisition');

    expect(spiritSpring.ruleId).toBe('block_spirit_spring_hidden_cause');
    expect(spiritSpring.hiddenFactRefIds).toEqual(['guyue_spirit_spring_resource_basis']);
    expect(firstGen.ruleId).toBe('block_first_gen_hidden_truth');
    expect(firstGen.hiddenFactRefIds).toEqual(['guyue_first_gen_hidden_blood_path_ref']);

    expect(fangYuan.ruleId).toBe('precondition_follow_fang_yuan_public_only');
    expect(fangYuan.hiddenFactRefIds).toContain('fang_yuan_private_causality_hidden_anchor');

    const serialized = JSON.stringify([rankNine, spiritSpring, firstGen, fangYuan]);
    expect(serialized).not.toContain('summary');
    expect(serialized).not.toContain('sourcePointers');
    expect(serialized).not.toContain('playerVisibleSummary');
  });

  it('returns an empty preview for unrelated inputs', () => {
    expect(previewQingmaoLowRankIfAdjudication({ rawText: '我今天想安静读书' })).toEqual({
      matched: false,
      ruleId: null,
      deviationLevel: null,
      axisIds: [],
      anchorIds: [],
      factCardIds: [],
      hiddenFactRefIds: [],
      costTypes: [],
      requiredPreconditions: [],
      allowedOutcome: null,
      forbiddenWrites: [],
      playerFacingResult: null,
    });
  });
});
