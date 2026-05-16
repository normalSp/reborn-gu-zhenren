import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import { buildPlayerKnownFactFromQingmaoCard } from './v011-qingmao-fact-cards';
import { resolveQingmaoBaiContactWindowAction } from './v011-qingmao-bai-contact-window';

describe('v0.11.0-b2-5 Qingmao Bai contact-window action', () => {
  it('turns visible Bai investigation evidence into a formal but limited action', () => {
    const layout = buildPlayerKnownFactFromQingmaoCard('qingmao_three_clans_layout', 24)!;
    const baiTalent = buildPlayerKnownFactFromQingmaoCard('baijia_bai_ning_bing_public_talent', 24)!;
    const state = createInitialLivingWorldState({
      worldClock: { turn: 24 },
      knownFacts: {
        [layout.id]: layout,
        [baiTalent.id]: baiTalent,
      },
      factionPressure: [{
        id: 'faction_pressure_visible_baijia_opportunity',
        factionId: 'baijia_zhai',
        pressureType: 'opportunity',
        delta: 5,
        reason: 'visible investigation opportunity',
        turn: 24,
        visibility: 'player_visible',
      }],
    } as any);

    const result = resolveQingmaoBaiContactWindowAction({
      livingWorldState: state,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      sceneId: 'v011_test_scene',
      locationId: 'qingmao_public_square',
    });

    expect(result.success).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.worldActionCandidate.id).toBe('qingmao_baijia_contact_window_probe');
    expect(result.worldActionDeparture.mode).toBe('local_resolution');
    expect(result.worldActionDeparture.chargeAp).toBe(false);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.visibleSourceRefs).toEqual([
      'fact:qingmao_three_clans_layout',
      'fact:baijia_bai_ning_bing_public_talent',
      'pressure:baijia_zhai:opportunity',
    ]);
    expect(result.factionPressure).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'faction_pressure_qingmao_baijia_contact_window_opportunity',
        factionId: 'baijia_zhai',
        pressureType: 'opportunity',
      }),
      expect.objectContaining({
        id: 'faction_pressure_qingmao_baijia_contact_window_guyue_shanzhai_suspicion',
        factionId: 'guyue_shanzhai',
        pressureType: 'suspicion',
      }),
    ]));
    expect(result.actionConsequences).toEqual([
      expect.objectContaining({
        id: 'consequence_qingmao_baijia_contact_window_probe',
        scope: 'faction',
        effectRefs: expect.arrayContaining([
          'faction_pressure_qingmao_baijia_contact_window_opportunity',
          'faction_pressure_qingmao_baijia_contact_window_guyue_shanzhai_suspicion',
        ]),
      }),
    ]);
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'faction_transfer',
      'standing_delta',
      'reward',
      'location_unlock',
      'canon_anchor_change',
      'bai_ning_bing_major_if',
    ]));
    expect(JSON.stringify(result)).not.toContain('投靠成功');
    expect(JSON.stringify(result)).not.toContain('春秋蝉');
    expect(JSON.stringify(result)).not.toContain('回溯');
  });

  it('blocks the action when no visible Bai evidence exists', () => {
    const state = createInitialLivingWorldState({ worldClock: { turn: 25 } } as any);
    const result = resolveQingmaoBaiContactWindowAction({
      livingWorldState: state,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.rejectedReasons).toEqual(['missing_visible_baijia_contact_evidence']);
    expect(result.factionPressure).toEqual([]);
    expect(result.actionConsequences).toEqual([]);
    expect(result.worldActionResolution.status).toBe('blocked');
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
  });

  it('keeps repeated action ids stable so the living-world patch can upsert instead of farming pressure', () => {
    const baiTalent = buildPlayerKnownFactFromQingmaoCard('baijia_bai_ning_bing_public_talent', 26)!;
    const state = createInitialLivingWorldState({
      worldClock: { turn: 26 },
      knownFacts: { [baiTalent.id]: baiTalent },
    } as any);

    const first = resolveQingmaoBaiContactWindowAction({ livingWorldState: state, turn: 26 });
    const second = resolveQingmaoBaiContactWindowAction({ livingWorldState: state, turn: 26 });

    expect(first.factionPressure.map(entry => entry.id)).toEqual(second.factionPressure.map(entry => entry.id));
    expect(first.actionConsequences.map(entry => entry.id)).toEqual(second.actionConsequences.map(entry => entry.id));
    expect(first.worldActionLedgerEntry.id).toBe(second.worldActionLedgerEntry.id);
  });
});
