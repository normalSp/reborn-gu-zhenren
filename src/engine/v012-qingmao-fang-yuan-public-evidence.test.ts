import { describe, expect, it } from 'vitest';
import {
  buildQingmaoFangYuanPublicEvidencePlan,
  listQingmaoFangYuanInquiryProfiles,
  listQingmaoFangYuanPublicEvidenceItems,
  resolveQingmaoFangYuanPublicEvidenceAction,
} from './v012-qingmao-fang-yuan-public-evidence';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';

describe('v0.12.0-b3 Fang Yuan public evidence helper', () => {
  it('lists cloned public evidence items and inquiry profiles', () => {
    const items = listQingmaoFangYuanPublicEvidenceItems();
    const profiles = listQingmaoFangYuanInquiryProfiles();
    const originalSummary = items[0].playerVisibleSummary;

    expect(items).toHaveLength(13);
    expect(profiles.map(profile => profile.id)).toEqual(expect.arrayContaining([
      'general_public_evidence',
      'merchant_inquiry_evidence',
      'supply_and_task_evidence',
    ]));
    items[0].playerVisibleSummary = 'mutated';
    expect(listQingmaoFangYuanPublicEvidenceItems()[0].playerVisibleSummary).toBe(originalSummary);
  });

  it('matches public inquiry into visible evidence and hidden boundary refs', () => {
    const plan = buildQingmaoFangYuanPublicEvidencePlan({
      rawText: '我要打听方源在客栈和族学的公开记录',
      targetRef: 'npc:fang_yuan',
    });

    expect(plan.matchedProfiles.map(profile => profile.id)).toEqual(expect.arrayContaining([
      'general_public_evidence',
      'lodging_and_inn_evidence',
      'clan_school_evidence',
    ]));
    expect(plan.evidenceItems.map(item => item.id)).toEqual(expect.arrayContaining([
      'fy_public_inn_lodging_shift',
      'fy_public_clan_school_ranking',
      'fy_public_school_gate_conflict',
    ]));
    expect(plan.hiddenBoundaryRefs.map(item => item.id)).toEqual(expect.arrayContaining([
      'fy_hidden_supply_purpose_boundary',
      'fy_hidden_arena_internal_check_boundary',
    ]));
    expect(plan.forbiddenWrites).toEqual(expect.arrayContaining([
      'tracking_success',
      'capture_result',
      'fang_yuan_hidden_causality',
      'hidden_fact_reveal',
    ]));
  });

  it('resolves Fang Yuan public evidence without hidden reveal or rewards', () => {
    const state = createInitialLivingWorldState({ worldClock: { turn: 50 } } as any);
    const result = resolveQingmaoFangYuanPublicEvidenceAction({
      rawText: '我要跟踪方源，查客栈住处和族学冲突',
      targetRef: 'npc:fang_yuan',
      livingWorldState: state,
      turn: 50,
    });

    expect(result.success).toBe(true);
    expect(result.knownFacts.length).toBeGreaterThanOrEqual(5);
    expect(result.hiddenFactRefs.length).toBeGreaterThanOrEqual(1);
    expect(result.npcMemories).toEqual([
      expect.objectContaining({
        npcId: 'fang_yuan',
        attitudeDelta: 0,
        privateRefId: expect.stringMatching(/^fy_hidden_/),
      }),
    ]);
    expect(result.factionPressure).toEqual([
      expect.objectContaining({
        factionId: 'guyue_shanzhai',
        pressureType: 'suspicion',
        visibility: 'player_visible',
      }),
    ]);
    expect(result.actionConsequences[0].followUpRefs).toEqual(expect.arrayContaining([
      'gate:public_evidence_only',
      'gate:no_tracking_success',
      'gate:no_hidden_fact_reveal',
    ]));
    expect(result.deepSeekVisibleFactIds).toEqual(result.knownFacts.map(fact => fact.id));
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    const playerVisibleText = [
      result.message,
      result.publicSummary,
      ...result.knownFacts.map(fact => fact.summary),
      ...result.npcMemories.map(memory => memory.publicSummary),
      ...result.factionPressure.map(pressure => pressure.reason),
      ...result.actionConsequences.map(consequence => consequence.publicSummary),
    ].join('\n');
    expect(playerVisibleText).not.toContain('春秋蝉');
    expect(playerVisibleText).not.toContain('重生');
    expect(playerVisibleText).not.toContain('回溯');
    expect(playerVisibleText).not.toContain('追踪成功');
  });

  it('blocks non-Fang-Yuan targets', () => {
    const result = resolveQingmaoFangYuanPublicEvidenceAction({
      rawText: '我要调查白家',
      targetRef: 'faction:baijia_zhai',
      turn: 51,
    });

    expect(result.success).toBe(false);
    expect(result.rejectedReasons).toEqual(['target_not_fang_yuan']);
    expect(result.knownFacts).toEqual([]);
    expect(result.hiddenFactRefs).toEqual([]);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
  });
});
