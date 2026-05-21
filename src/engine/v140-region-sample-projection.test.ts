import { describe, expect, it } from 'vitest';
import { buildV140RegionSampleProjection } from './v140-region-sample-projection';
import type { LivingWorldState, RouteLocationState } from '../types';

function knownFact(id: string, summary = '公开事实。') {
  return {
    id,
    scope: 'region' as const,
    source: 'engine_result' as const,
    summary,
    learnedTurn: 12,
    confidence: 'confirmed' as const,
    tags: ['public'],
  };
}

function routeReadyLivingWorld(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 42,
      day: 3,
      phase: 'afternoon',
      lastActionId: 'v018_qingmao_candidate_continuation_probe',
    },
    regions: {},
    knownFacts: {
      qingmao_escape_route_preparation_baseline: knownFact('qingmao_escape_route_preparation_baseline', '离山路线准备已有公开痕迹。'),
      qingmao_escape_tracks_cover_baseline: knownFact('qingmao_escape_tracks_cover_baseline', '遮掩痕迹已有公开解释。'),
      qingmao_mountain_pass_route_continuation_candidate: knownFact('qingmao_mountain_pass_route_continuation_candidate', '山路候选承接已出现。'),
      qingmao_supply_feeding_preparation_baseline: knownFact('qingmao_supply_feeding_preparation_baseline', '补给与喂养缺口已被看见。'),
      qingmao_market_window_candidate_baseline: knownFact('qingmao_market_window_candidate_baseline', '商队/市场窗口只作为公开接触。'),
      v018_qingmao_route_entry_threshold_commitment: knownFact('v018_qingmao_route_entry_threshold_commitment', '离山门槛已记录，但不进入地点。'),
      v018_qingmao_route_candidate_continuation_view: knownFact('v018_qingmao_route_candidate_continuation_view', '候选承接可读，但不写正式路线。'),
    },
    hiddenFactRefs: {
      fang_yuan_private_causality_hidden_anchor: {
        id: 'fang_yuan_private_causality_hidden_anchor',
        scope: 'npc',
        sourcePointer: '春秋蝉/重生/回溯/private-body-redacted',
        revealPolicyId: 'never_show_private_body',
        guard: 'hidden',
        lastCheckedTurn: 42,
      },
    },
    playerGoals: [{
      id: 'goal_escape_qingmao',
      intentType: 'long_term_goal',
      targetRef: 'region:outside_qingmao',
      rationale: '逃离青茅山并寻找南疆低阶外缘落脚。',
      status: 'active',
      createdTurn: 3,
      lastUpdatedTurn: 42,
      blockedByRefIds: [],
      nextStepHints: ['补路线准备', '看商队窗口'],
    }],
    factionPressure: [{
      id: 'faction_pressure_caravan_window',
      factionId: 'shangjia_caravan',
      pressureType: 'opportunity',
      delta: 8,
      reason: '商队窗口出现，但投靠成功、招揽成功、正式通缉已生效、奖励已发放都必须阻断。',
      turn: 30,
      visibility: 'player_visible',
    }],
    npcMemories: [{
      id: 'npc_memory_route_trace',
      npcId: 'qingmao_watch',
      turn: 31,
      regionId: 'qingmao',
      actionId: 'qingmao_cover_escape_tracks_probe',
      publicSummary: '只看见公开遮掩痕迹；春秋蝉、重生、回溯都不应显示。',
      privateRefId: 'fang_yuan_private_causality_hidden_anchor',
      attitudeDelta: -5,
      weight: 30,
      tags: ['public_trace'],
      expiresTurn: null,
    }],
    actionConsequences: [{
      id: 'consequence_v018_qingmao_candidate_continuation_probe',
      actionId: 'v018_qingmao_candidate_continuation_probe',
      turn: 41,
      scope: 'region',
      publicSummary: '候选承接已经进入公开准备。',
      effectRefs: ['v018_qingmao_route_candidate_continuation_view'],
      followUpRefs: ['followup:review_region_sample'],
    }],
    ifDeviations: [],
  };
}

function outerEdgeRoute(): Partial<RouteLocationState> {
  return {
    status: 'outer_edge_projection',
    routeId: 'southern_border_low_rank_route',
    locationScopeId: 'southern_border_outer_edge',
    regionScopeId: 'southern_border_outer_edge',
    authority: 'route_location_engine',
    evidenceLedgerEntryIds: ['v018_qingmao_route_candidate_continuation_view'],
    sourceRefs: ['v140:test:outer_edge_projection'],
    lastUpdatedAtTurn: 42,
  };
}

describe('v1.4 region sample projection', () => {
  it('projects early Southern Border region sample without save-format, location, faction, reward, or NPC writes', () => {
    const projection = buildV140RegionSampleProjection({
      livingWorldState: {
        ...routeReadyLivingWorld(),
        regionSampleState: { illegal: true },
        regionalSampleState: { illegal: true },
      } as any,
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: {
        status: 'pressure_tracked',
        authority: 'survival_economy_engine',
        pressureScore: 3,
        ledger: [{
          id: 'survival_ledger_route_supply',
          turn: 42,
          category: 'route_supply',
          pressureDelta: 1,
          publicSummary: '路线补给压力已登记。',
          evidenceRefs: ['fact:qingmao_supply_feeding_preparation_baseline'],
          blockedWrites: ['inventory_delta'],
        }],
        sourceRefs: ['v120:test:pressure_ledger'],
      } as any,
      materialBag: { 美酒: 1, 月华草: 2 },
    });

    expect(projection.status).toBe('sample_visible');
    expect(projection.scopeId).toBe('southern_border_low_rank_outer_sample');
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.statePatchApplied).toBe(false);
    expect(projection.canWriteSave).toBe(false);
    expect(projection.canUnlockLocation).toBe(false);
    expect(projection.canOpenFormalTrade).toBe(false);
    expect(projection.canTransferFaction).toBe(false);
    expect(projection.canGrantReward).toBe(false);
    expect(projection.canSetNpcFate).toBe(false);
    expect(projection.deepSeekAuthority).toBe('no_new_authority');
    expect(projection.legacyFieldsIgnored).toBe(true);
    expect(projection.projectionAudit).toEqual(expect.objectContaining({
      phase: 'v1.4.0-b1-region-sample-projection',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      runtimeSourcePolicy: 'reuse_v110_v120_v130_v018_public_evidence',
      miroFishPolicy: 'topic_slice_reviewed_source_pointer_only',
      deepSeekPolicy: 'no_new_authority',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToStateWithoutUserDecision: false,
      pass: true,
    }));
    expect(projection.projectionAudit.requiredUserDecisionForState).toEqual(expect.arrayContaining([
      'approve_SAVE_FORMAT_VERSION_25',
      'approve_regionSampleState_or_equivalent_single_aggregate',
      'approve_migration_defaults_tests',
    ]));
    expect(projection.postureCards.map(card => card.id)).toEqual([
      'mountain_road_outer_edge',
      'caravan_contact_window',
      'rogue_settlement_hint',
      'city_outer_threshold',
    ]);
    expect(projection.postureCards.every(card => card.canPatch === false && card.statePatchApplied === false)).toBe(true);
    expect(projection.postureCards.some(card => card.id === 'caravan_contact_window' && card.status === 'visible')).toBe(true);
    expect(projection.postureCards.some(card => card.id === 'city_outer_threshold' && card.status === 'visible')).toBe(true);
    expect(projection.boundaryLines.join('\n')).toContain('SAVE_FORMAT_VERSION 保持 24');
    expect(projection.boundaryLines.join('\n')).toContain('不新增 regionSampleState');
    expect(projection.boundaryLines.join('\n')).toContain('DeepSeek 只能写叙事');
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'SAVE_FORMAT_VERSION_25',
      'regionSampleState',
      'regionalSampleState',
      'route_entered',
      'location_unlock',
      'full_southern_border_map',
      'formal_trade',
      'faction_transfer',
      'reward',
      'npc_death',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));
    expect(projection.visibleSourceRefs).toEqual(expect.arrayContaining([
      'v1.4.0-a1:D-141-001',
      'v1.4.0-a2:mirofish-topic-slice-intake',
      'v120:test:pressure_ledger',
    ]));
    expect(projection.signalGroups.find(group => group.id === 'survival')?.evidenceRefs).toEqual(expect.arrayContaining([
      'survivalState:pressure_tracked',
      'survivalLedger:1',
    ]));
  });

  it('stays inert for empty or old-save-like state and still forbids region state promotion', () => {
    const projection = buildV140RegionSampleProjection({
      livingWorldState: { knownFacts: {}, playerGoals: [], actionConsequences: [] },
      routeLocationState: null,
    });

    expect(projection.status).toBe('needs_route_context');
    expect(projection.activePostureId).toBeNull();
    expect(projection.postureCards.every(card => card.status === 'needs_context')).toBe(true);
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.canWriteSave).toBe(false);
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'regionSampleState',
      'regionalSampleState',
      'location_unlock',
      'deepseek_authority_expansion',
    ]));
  });

  it('sanitizes hidden and formal conclusion wording from player-visible projection text', () => {
    const projection = buildV140RegionSampleProjection({
      livingWorldState: routeReadyLivingWorld(),
      routeLocationState: outerEdgeRoute(),
      localActionLedger: [{
        id: 'ledger_hidden_formal_text',
        source: 'local_engine',
        turn: 43,
        title: '隐藏边界',
        publicSummary: '春秋蝉、重生、回溯、投靠成功、招揽成功、正式通缉已生效、奖励已发放、进入商家城都不该泄露。',
        risks: ['hidden_fact_reveal'],
        rewards: [],
        blockedUpgrades: ['hidden_fact_reveal', 'location_unlock'],
      } as any],
    });

    const visibleText = JSON.stringify({
      publicSummary: projection.publicSummary,
      nextStep: projection.nextStep,
      postureCards: projection.postureCards,
      signalGroups: projection.signalGroups,
      visibleSourceRefs: projection.visibleSourceRefs,
    });
    expect(visibleText).not.toContain('春秋蝉');
    expect(visibleText).not.toContain('重生');
    expect(visibleText).not.toContain('回溯');
    expect(visibleText).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(visibleText).not.toContain('v018_hidden_982eba1c3730');
    expect(visibleText).not.toContain('投靠成功');
    expect(visibleText).not.toContain('招揽成功');
    expect(visibleText).not.toContain('正式通缉已生效');
    expect(visibleText).not.toContain('奖励已发放');
    expect(visibleText).not.toContain('进入商家城');
  });
});
