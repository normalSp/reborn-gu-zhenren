import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import {
  buildHiddenFactRefFromQingmaoCard,
  buildPlayerKnownFactFromQingmaoCard,
} from './v011-qingmao-fact-cards';
import { buildQingmaoInvestigationFollowUps } from './v011-qingmao-investigation-followups';

describe('v0.11.0-b2-4 Qingmao investigation follow-up hints', () => {
  it('suggests Bai contact probing from visible investigation state only', () => {
    const layout = buildPlayerKnownFactFromQingmaoCard('qingmao_three_clans_layout', 18)!;
    const baiTalent = buildPlayerKnownFactFromQingmaoCard('baijia_bai_ning_bing_public_talent', 18)!;
    const state = createInitialLivingWorldState({
      knownFacts: {
        [layout.id]: layout,
        [baiTalent.id]: baiTalent,
      },
      factionPressure: [{
        id: 'faction_pressure_test_baijia_opportunity',
        factionId: 'baijia_zhai',
        pressureType: 'opportunity',
        delta: 5,
        reason: 'test visible pressure',
        turn: 18,
        visibility: 'player_visible',
      }],
    } as any);

    const followUps = buildQingmaoInvestigationFollowUps({ livingWorldState: state });

    expect(followUps).toEqual([
      expect.objectContaining({
        id: 'followup_baijia_visible_contact_probe',
        status: 'formal_action_available',
        kind: 'contact',
        visibleSourceRefs: [
          'fact:qingmao_three_clans_layout',
          'fact:baijia_bai_ning_bing_public_talent',
          'pressure:baijia_zhai:opportunity',
        ],
        hiddenSourceRefCount: 0,
        forbiddenUpgrades: expect.arrayContaining([
          'faction_transfer',
          'standing_delta',
          'reward',
          'location_unlock',
          'npc_state_change',
          'canon_anchor_change',
          'bai_ning_bing_major_if',
        ]),
      }),
    ]);
    expect(JSON.stringify(followUps)).not.toContain('standing_delta_applied');
  });

  it('keeps Fang Yuan follow-up as visible-scope caution without hidden leakage', () => {
    const state = createInitialLivingWorldState({
      hiddenFactRefs: {
        fang_yuan_private_causality_hidden_anchor: buildHiddenFactRefFromQingmaoCard(
          'fang_yuan_private_causality_hidden_anchor',
          19,
        )!,
      },
      npcMemories: [{
        id: 'npc_memory_test_fang_yuan_caution',
        npcId: 'fang_yuan',
        turn: 19,
        regionId: 'qingmao_three_clans',
        actionId: 'test_action',
        publicSummary: '有人试图打听方源动向，但没有获得当前可见范围内的可靠事实。',
        privateRefId: 'fang_yuan_private_causality_hidden_anchor',
        attitudeDelta: 0,
        weight: 2,
        tags: ['hidden_fact_protected', 'visible_scope_failed'],
        expiresTurn: null,
      }],
    } as any);

    const followUps = buildQingmaoInvestigationFollowUps({ livingWorldState: state });
    const serialized = JSON.stringify(followUps);

    expect(followUps).toEqual([
      expect.objectContaining({
        id: 'followup_fang_yuan_visible_scope_caution',
        status: 'suggested_only',
        kind: 'avoidance',
        visibleSourceRefs: ['npc_memory:fang_yuan_public_failure'],
        hiddenSourceRefCount: 1,
        forbiddenUpgrades: expect.arrayContaining([
          'hidden_fact_reveal',
          'npc_state_change',
          'npc_death',
          'canon_anchor_change',
          'deepseek_hidden_context',
        ]),
      }),
    ]);
    expect(serialized).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(serialized).not.toContain('春秋蝉');
    expect(serialized).not.toContain('回溯');
    expect(serialized).not.toContain('重生');
  });

  it('suggests public-resource inquiry for protected resource secrets without revealing the secret body', () => {
    const state = createInitialLivingWorldState({
      hiddenFactRefs: {
        guyue_spirit_spring_resource_basis: buildHiddenFactRefFromQingmaoCard(
          'guyue_spirit_spring_resource_basis',
          20,
        )!,
      },
    } as any);

    const followUps = buildQingmaoInvestigationFollowUps({ livingWorldState: state });
    const serialized = JSON.stringify(followUps);

    expect(followUps).toEqual([
      expect.objectContaining({
        id: 'followup_qingmao_resource_public_inquiry',
        status: 'suggested_only',
        kind: 'local_inquiry',
        hiddenSourceRefCount: 1,
        forbiddenUpgrades: expect.arrayContaining([
          'hidden_fact_reveal',
          'resource_reward',
          'faction_secret_reveal',
        ]),
      }),
    ]);
    expect(serialized).not.toContain('guyue_spirit_spring_resource_basis');
    expect(serialized).not.toContain('灵泉');
    expect(serialized).not.toContain('枯竭');
  });

  it('returns no follow-ups when no investigation evidence exists', () => {
    const state = createInitialLivingWorldState();

    expect(buildQingmaoInvestigationFollowUps({ livingWorldState: state })).toEqual([]);
  });
});
