import { describe, expect, it } from 'vitest';
import {
  buildV018QingmaoRouteMultiRegionOverview,
  resolveV018QingmaoCandidateContinuationAction,
  resolveV018QingmaoPressureBackflowAction,
  resolveV018QingmaoRouteEntryThresholdAction,
} from './v018-qingmao-route-multi-region';
import type { LivingWorldState } from '../types';

function baseState(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 18,
      day: 8,
      phase: 'afternoon',
      lastActionId: 'qingmao_supply_feeding_preparation_probe',
    },
    knownFacts: {
      qingmao_escape_route_preparation_baseline: {
        id: 'qingmao_escape_route_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '离开青茅山路线准备已完成。',
        learnedTurn: 12,
        confidence: 'confirmed',
        tags: ['route_preparation'],
      },
      qingmao_escape_tracks_cover_baseline: {
        id: 'qingmao_escape_tracks_cover_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '逃离痕迹遮掩已完成。',
        learnedTurn: 13,
        confidence: 'confirmed',
        tags: ['cover_tracks'],
      },
      qingmao_mountain_pass_route_continuation_candidate: {
        id: 'qingmao_mountain_pass_route_continuation_candidate',
        scope: 'region',
        source: 'engine_result',
        summary: '山路逃离路线是候选承接。',
        learnedTurn: 14,
        confidence: 'confirmed',
        tags: ['mountain_pass_escape'],
      },
      qingmao_supply_feeding_preparation_baseline: {
        id: 'qingmao_supply_feeding_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '补给与喂养缺口已整理。',
        learnedTurn: 15,
        confidence: 'confirmed',
        tags: ['supply_feeding'],
      },
      qingmao_market_window_candidate_baseline: {
        id: 'qingmao_market_window_candidate_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '商队与市场窗口是候选。',
        learnedTurn: 16,
        confidence: 'confirmed',
        tags: ['market_window'],
      },
    },
    hiddenFactRefs: {},
    npcMemories: [
      {
        id: 'npc_memory_qingmao_cover_tracks_public_routine',
        npcId: 'qingmao_local_watch',
        turn: 13,
        regionId: 'qingmao_three_clans',
        actionId: 'qingmao_cover_escape_tracks_probe',
        publicSummary: '本地耳目看到公开行动节奏变化。',
        privateRefId: null,
        attitudeDelta: -1,
        weight: 2,
        tags: ['cover_escape_tracks'],
        expiresTurn: null,
      },
    ],
    factionPressure: [
      {
        id: 'faction_pressure_qingmao_mountain_pass_guyue_shanzhai_pursuit_attention',
        factionId: 'guyue_shanzhai',
        pressureType: 'suspicion',
        delta: 1,
        reason: '山路承接会让公开节奏和补给缺口更显眼。',
        turn: 14,
        visibility: 'player_visible',
      },
    ],
    playerGoals: [
      {
        id: 'goal_escape_qingmao',
        intentType: 'travel',
        targetRef: 'region:outside_qingmao',
        status: 'active',
        createdTurn: 10,
        lastUpdatedTurn: 15,
        rationale: '我要逃离青茅山。',
        nextStepHints: ['route:mountain_pass_escape'],
        blockedByRefIds: [],
      },
    ],
    actionConsequences: [
      {
        id: 'consequence_qingmao_supply_feeding_preparation_probe',
        actionId: 'qingmao_supply_feeding_preparation_probe',
        turn: 15,
        scope: 'resource',
        publicSummary: '补给、落脚遮掩和酒虫食料压力进入行动账本。',
        effectRefs: ['qingmao_supply_feeding_preparation_baseline'],
        followUpRefs: ['gate:no_route_entered'],
      },
      {
        id: 'consequence_qingmao_market_window_probe',
        actionId: 'qingmao_market_window_probe',
        turn: 16,
        scope: 'resource',
        publicSummary: '商队和问价窗口进入行动账本。',
        effectRefs: ['qingmao_market_window_candidate_baseline'],
        followUpRefs: ['gap:identity_and_guarantee'],
      },
    ],
    ifDeviations: [],
    regions: {},
  };
}

describe('v0.18 Qingmao route multi-region bridge', () => {
  it('shows threshold-ready state without writing route_entered or leaking quarantined items', () => {
    const overview = buildV018QingmaoRouteMultiRegionOverview({
      livingWorldState: baseState(),
    });

    expect(overview.stage).toBe('threshold_ready');
    expect(overview.milestones.filter(item => item.satisfied).map(item => item.requirement)).toEqual(expect.arrayContaining([
      'escape_goal',
      'route_preparation',
      'cover_tracks',
      'mountain_pass_candidate',
      'supply_feeding',
    ]));
    expect(overview.forbiddenWrites).toEqual(expect.arrayContaining([
      'route_entered',
      'location_unlock',
      'faction_transfer',
      'reward',
      'deepseek_authority_expansion',
    ]));
    expect(overview.pressurePreviews.flatMap(item => item.sourceItemIds)).not.toContain('v018_hidden_982eba1c3730');
    expect(JSON.stringify(overview)).not.toContain('hidden source summary withheld');
  });

  it('records the route-entry threshold as existing v22 facts and ledger only', () => {
    const result = resolveV018QingmaoRouteEntryThresholdAction({
      livingWorldState: baseState(),
      turn: 18,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
    });

    expect(result.success).toBe(true);
    expect(result.knownFacts.map(fact => fact.id)).toContain('v018_qingmao_route_entry_threshold_commitment');
    expect(result.actionConsequences[0].followUpRefs).toEqual(expect.arrayContaining([
      'gate:no_route_entered',
      'gate:no_location_unlock',
      'gate:no_faction_transfer',
      'gate:no_reward',
    ]));
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.worldActionResolution.metadata).toMatchObject({ routeId: 'southern_border_low_rank_route' });
    expect(result.worldActionResolution.metadata).not.toHaveProperty('route_entered');
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'route_entered',
      'save_format_bump',
      'bff_backend',
    ]));
  });

  it('blocks candidate continuation until the threshold fact exists', () => {
    const result = resolveV018QingmaoCandidateContinuationAction({
      livingWorldState: baseState(),
      turn: 19,
    });

    expect(result.success).toBe(false);
    expect(result.rejectedReasons).toEqual(['missing_route_threshold_commitment']);
    expect(result.knownFacts).toEqual([]);
  });

  it('continues route candidate and exposes public region facts after threshold', () => {
    const state = baseState();
    state.knownFacts = {
      ...(state.knownFacts || {}),
      v018_qingmao_route_entry_threshold_commitment: {
        id: 'v018_qingmao_route_entry_threshold_commitment',
        scope: 'region',
        source: 'engine_result',
        summary: '门槛已确认。',
        learnedTurn: 18,
        confidence: 'confirmed',
        tags: ['v0.18.0-b1'],
      },
    };
    const result = resolveV018QingmaoCandidateContinuationAction({
      livingWorldState: state,
      turn: 19,
    });

    expect(result.success).toBe(true);
    expect(result.knownFacts.map(fact => fact.id)).toContain('v018_qingmao_route_candidate_continuation_view');
    expect(result.actionConsequences[0].followUpRefs).toEqual(expect.arrayContaining([
      'v018:entry:caravan_outer',
      'v018:entry:rogue_survival',
      'v018:entry:shang_outer',
      'gate:no_full_map',
    ]));
    expect(result.worldActionResolution.localFacts.join('\n')).toContain('商家城外缘');
    expect(result.forbiddenUpgrades).toContain('location_unlock');
  });

  it('backflows supply, pursuit, identity and caravan pressure without formal outcomes', () => {
    const state = baseState();
    state.knownFacts = {
      ...(state.knownFacts || {}),
      v018_qingmao_route_entry_threshold_commitment: {
        id: 'v018_qingmao_route_entry_threshold_commitment',
        scope: 'region',
        source: 'engine_result',
        summary: '门槛已确认。',
        learnedTurn: 18,
        confidence: 'confirmed',
        tags: ['v0.18.0-b1'],
      },
      v018_qingmao_route_candidate_continuation_view: {
        id: 'v018_qingmao_route_candidate_continuation_view',
        scope: 'region',
        source: 'engine_result',
        summary: '候选承接已形成。',
        learnedTurn: 19,
        confidence: 'confirmed',
        tags: ['v0.18.0-b2'],
      },
    };
    const result = resolveV018QingmaoPressureBackflowAction({
      livingWorldState: state,
      turn: 20,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
    });

    expect(result.success).toBe(true);
    expect(result.knownFacts.map(fact => fact.id)).toContain('v018_qingmao_route_pressure_backflow_baseline');
    expect(result.factionPressure.length).toBeGreaterThanOrEqual(3);
    expect(result.actionConsequences[0].followUpRefs).toEqual(expect.arrayContaining([
      'gate:no_formal_warrant',
      'gate:no_faction_transfer',
      'gate:no_npc_life_result',
      'gate:no_reward',
    ]));
    expect(result.worldActionResolution.risks).toEqual(expect.arrayContaining([
      'formal_warrant_blocked',
      'npc_life_result_blocked',
      'deepseek_no_pressure_authority',
    ]));
    expect(result.worldActionResolution.localFacts.join('\n')).not.toContain('v018_hidden_982eba1c3730');
    expect(result.factionPressure.map(entry => entry.reason).join('\n')).not.toContain('v018_hidden_982eba1c3730');
  });
});
