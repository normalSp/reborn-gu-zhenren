import { describe, expect, it } from 'vitest';
import { SAVE_FORMAT_VERSION } from '../store/initialState';
import { buildV180IdentityReplayProjection } from './v180-identity-replay-projection';
import type { BattleOutcomeSummary, BattleResolutionStep, CombatEventCandidate, LivingWorldState, RouteLocationState } from '../types';

function knownFact(id: string, summary = '公开事实。') {
  return {
    id,
    scope: 'region' as const,
    source: 'engine_result' as const,
    summary,
    learnedTurn: 82,
    confidence: 'confirmed' as const,
    tags: ['public'],
  };
}

function identityWorld(extraSummary = ''): Partial<LivingWorldState> {
  return {
    worldClock: { turn: 82, day: 7, phase: 'afternoon', lastActionId: 'v180_identity_replay_projection_probe' },
    regions: {},
    knownFacts: {
      qingmao_escape_route_preparation_baseline: knownFact('qingmao_escape_route_preparation_baseline', '离山路线准备已有公开痕迹。'),
      qingmao_mountain_pass_route_continuation_candidate: knownFact('qingmao_mountain_pass_route_continuation_candidate', '山路候选承接已出现，外缘盘问需要解释身份。'),
      qingmao_supply_feeding_preparation_baseline: knownFact('qingmao_supply_feeding_preparation_baseline', '补给与喂养缺口已被看见。'),
      qingmao_market_window_candidate_baseline: knownFact('qingmao_market_window_candidate_baseline', '商队、临时市场、压价和询价都可能发生。'),
      v180_identity_route_candidate_baseline: knownFact('v180_identity_route_candidate_baseline', `商队短工、散修短活、护送、采集、打听递话都只是公开候选。${extraSummary}`),
    },
    hiddenFactRefs: {
      fang_yuan_private_causality_hidden_anchor: {
        id: 'fang_yuan_private_causality_hidden_anchor',
        scope: 'npc',
        sourcePointer: '春秋蝉/重生/回溯/private-body-redacted',
        revealPolicyId: 'never_show_private_body',
        guard: 'hidden',
        lastCheckedTurn: 82,
      },
    },
    playerGoals: [{
      id: 'goal_escape_qingmao',
      intentType: 'long_term_goal',
      targetRef: 'region:outside_qingmao',
      rationale: '逃离青茅山并在南疆低阶外缘寻找短期遮蔽。',
      status: 'active',
      createdTurn: 3,
      lastUpdatedTurn: 82,
      blockedByRefIds: [],
      nextStepHints: ['解释身份', '找商队短工', '打听补给', '采集跑腿'],
    }],
    factionPressure: [{
      id: 'faction_pressure_caravan_window',
      factionId: 'outer_caravan',
      pressureType: 'opportunity',
      delta: 8,
      reason: '商队窗口出现，但正式加入商队、投靠成功、奖励已发放都必须阻断。',
      turn: 80,
      visibility: 'player_visible',
    }],
    npcMemories: [{
      id: 'npc_memory_public_route_trace',
      npcId: 'outer_edge_watch',
      turn: 81,
      regionId: 'southern_border_outer_edge',
      actionId: 'v180_public_identity_probe',
      publicSummary: '只看见公开遮掩、盘问压力、临市观察和消息跑腿；春秋蝉、重生、回溯都不应显示。',
      privateRefId: 'fang_yuan_private_causality_hidden_anchor',
      attitudeDelta: -3,
      weight: 20,
      tags: ['public_trace'],
      expiresTurn: null,
    }],
    actionConsequences: [{
      id: 'consequence_v180_public_identity_probe',
      actionId: 'v180_public_identity_probe',
      turn: 82,
      scope: 'region',
      publicSummary: '候选承接进入公开准备，守卫盘问、商队短工、临时市场、护送守夜和采集跑腿都只是压力窗口。',
      effectRefs: ['v180_public_identity_pressure'],
      followUpRefs: ['followup:review_identity_replay_projection'],
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
    sourceRefs: ['v180:test:outer_edge_projection'],
    lastUpdatedAtTurn: 82,
  };
}

function combatCandidate(): CombatEventCandidate {
  return {
    id: 'v180_test_road_event_candidate',
    type: 'ambush',
    title: '路途事件候选',
    summary: '只提示路途事件协议，禁止正式护卫身份、奖励已发放、NPC已死亡或地点已解锁。',
    risk: 'medium',
    source: 'engine',
    engineValidation: 'pending',
    createdTurn: 82,
    scale: 'battlefield_5x3',
    enemyHint: '山路窥伺、护送压力与采集绕路',
    requiredRealmGrand: 1,
    dropPolicyId: 'local_engine_only',
    gridPresetId: 'skirmish_5x3',
  };
}

function battleStep(): BattleResolutionStep {
  return {
    id: 'v180_step_detour',
    round: 1,
    kind: 'objective',
    sourceName: '山路绕行',
    message: '低调让步换来绕路窗口。',
    visual: { motif: 'dust', primaryTint: '#B8A46A', motion: 'scatter' },
    tags: ['v180', 'identity_route'],
  };
}

function outcome(): BattleOutcomeSummary {
  return {
    id: 'v180_outcome_test',
    encounterId: 'v180_test_road_event_candidate',
    scale: 'battlefield_5x3',
    result: 'retreat',
    summary: '路途事件：撤退。价格表已生成、库存已生成、NPC已死亡都必须阻断。',
    winner: 'escaped',
    roundsTaken: 1,
    hpDelta: 0,
    essenceDelta: 0,
    consumedGu: [],
    daoMarkDelta: {},
    createdTurn: 82,
    steps: ['绕路。'],
  };
}

function richProjectionInput(extraSummary = ''): any {
  return {
    livingWorldState: {
      ...identityWorld(extraSummary),
      identityRouteState: { illegal: true },
      professionState: { illegal: true },
      runFingerprint: 'illegal',
      regionalEventLedger: [{ illegal: true }],
    } as any,
    routeLocationState: outerEdgeRoute(),
    survivalEconomyState: {
      status: 'pressure_tracked',
      authority: 'survival_economy_engine',
      pressureScore: 5,
      ledger: [
        {
          id: 'survival_ledger_route_supply',
          turn: 82,
          category: 'route_supply',
          pressure: 'medium',
          publicSummary: '路线补给压力已登记。',
          nextStep: '先确认补给和遮蔽。',
          evidenceRefs: ['fact:qingmao_supply_feeding_preparation_baseline'],
          sourceRefs: ['v120:test:pressure_ledger'],
          blockedWrites: ['inventory_delta'],
        },
        {
          id: 'survival_ledger_trade_window',
          turn: 82,
          category: 'trade_window',
          pressure: 'low',
          publicSummary: '临时市场窗口已登记。',
          nextStep: '只询价，不成交。',
          evidenceRefs: ['fact:qingmao_market_window_candidate_baseline'],
          sourceRefs: ['v120:test:trade_window'],
          blockedWrites: ['formal_price_table', 'formal_shop_inventory'],
        },
      ],
      evidenceRefs: ['fact:qingmao_supply_feeding_preparation_baseline'],
      sourceRefs: ['v120:test:pressure_ledger'],
      lastUpdatedAtTurn: 82,
    },
    localActionLedger: [{
      id: 'ledger_v180_identity_replay',
      turn: 82,
      sceneId: 'v180_test',
      actionType: 'other',
      source: 'v180:test',
      cost: 0,
      summary: '玩家被盘问后考虑商队短工、散修短活、护送守夜、采集跑腿、临时市场询价和打听递话。',
      systemResult: {},
      risks: ['outer_edge_interrogation', 'identity_route_candidate', 'prop_word_guard'],
    }],
    combatEventCandidates: [combatCandidate()],
    battleResolutionSteps: [battleStep()],
    battleOutcomeSummary: outcome(),
    variantIndex: 2,
    turn: 82,
  };
}

describe('v1.8 identity replay projection', () => {
  it('projects five low-rank identity route candidates without save, formal identity, or DeepSeek authority writes', () => {
    const projection = buildV180IdentityReplayProjection(richProjectionInput());

    expect(SAVE_FORMAT_VERSION).toBe(25);
    expect(projection.status).toBe('identity_route_visible');
    expect(projection.scopeId).toBe('southern_border_low_rank_identity_routes_outer_edge_slice');
    expect(projection.savePolicy).toBe('no_new_persistence_v24');
    expect(projection.authority).toBe('local_projection_only');
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.statePatchApplied).toBe(false);
    expect(projection.canWriteSave).toBe(false);
    expect(projection.canCreateFormalIdentity).toBe(false);
    expect(projection.canCreateProfession).toBe(false);
    expect(projection.canUnlockLocation).toBe(false);
    expect(projection.canOpenFormalTrade).toBe(false);
    expect(projection.canTransferFaction).toBe(false);
    expect(projection.canGrantReward).toBe(false);
    expect(projection.canSetNpcFate).toBe(false);
    expect(projection.canExpandDeepSeekAuthority).toBe(false);
    expect(projection.deepSeekAuthority).toBe('no_new_authority');
    expect(projection.legacyFieldsIgnored).toBe(true);
    expect(projection.routeCandidates.map(route => route.id)).toEqual([
      'caravan_temp_hand',
      'rogue_short_work',
      'low_rank_guard_candidate',
      'gathering_runner',
      'message_intel_runner',
    ]);
    expect(projection.routeCandidates.every(route => route.status === 'visible')).toBe(true);
    expect(projection.routeCandidates.every(route => route.canWriteSave === false && route.statePatchApplied === false)).toBe(true);
    expect(projection.pressureCards.map(card => card.id)).toEqual([
      'identity_check_window',
      'caravan_labor_access',
      'permission_chain_prop_word',
      'low_status_labor',
      'temporary_market_observe',
      'bargain_refusal_short_work',
      'shelter_debt_window',
      'guard_or_gathering_pressure',
      'far_city_boundary',
    ]);
    expect(projection.modules.visibleIdentityRouteCount).toBeGreaterThanOrEqual(5);
    expect(projection.replayabilityAudit).toEqual(expect.objectContaining({
      policy: 'same_start_replayability_without_persistence',
      variantSourcePolicy: 'local_identity_pressure_deck_and_narrative_expression_only',
      stableFactPolicy: 'route_identity_profession_reward_location_npc_fate_stable',
      minimumVisibleRoutesForB1: 3,
      pass: true,
    }));
    expect(projection.projectionAudit).toEqual(expect.objectContaining({
      phase: 'v1.8.0-b1-identity-replay-projection',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v150_v170_and_v180_a2_public_evidence',
      miroFishPolicy: 'v180_a2_topic_slice_source_pointer_only',
      deepSeekPolicy: 'no_new_authority_no_visible_mirofish_summary',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToStateWithoutUserDecision: false,
      pass: true,
    }));
    expect(projection.projectionAudit.requiredUserDecisionForState).toEqual(expect.arrayContaining([
      'approve_identityRouteState_or_equivalent_single_aggregate',
      'approve_professionState_if_formal_professions_are_needed',
      'approve_per_save_runFingerprint_or_regionalEventLedger',
    ]));
    expect(projection.boundaryLines.join('\n')).toContain('不新增 identityRouteState');
    expect(projection.boundaryLines.join('\n')).toContain('不新增 identityRouteState');
    expect(projection.boundaryLines.join('\n')).toContain('五类身份路线');
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'SAVE_FORMAT_VERSION_25',
      'identityRouteState',
      'professionState',
      'runFingerprint',
      'regionalEventLedger',
      'formal_identity',
      'formal_profession',
      'reward',
      'npc_death',
      'hidden_fact_reveal',
      'deepseek_visible_mirofish_summary',
      'deepseek_rag',
    ]));
    expect(projection.visibleSourceRefs).toEqual(expect.arrayContaining([
      'v1.8.0-a1:D-181-002',
      'v1.8.0-a2:southern_border_low_rank_identity_route_life_slice:intake-reviewed',
      'v180:a2:identity_ch0234_caravan_temp_labor_contact',
      'v180:a2:identity_ch0242_goods_toll_gathering_runner',
    ]));
  });

  it('rotates active identity route by variant index while keeping facts stable', () => {
    const base = richProjectionInput();
    const variants = [0, 1, 2, 3, 4].map(variantIndex => buildV180IdentityReplayProjection({ ...base, variantIndex }));
    expect(new Set(variants.map(item => item.activeRouteId)).size).toBeGreaterThanOrEqual(5);
    for (const projection of variants) {
      expect(projection.replayabilityAudit.pass).toBe(true);
      expect(projection.canCreateFormalIdentity).toBe(false);
      expect(projection.canCreateProfession).toBe(false);
      expect(projection.canGrantReward).toBe(false);
      expect(projection.canSetNpcFate).toBe(false);
      expect(projection.deepSeekAuthority).toBe('no_new_authority');
    }
  });

  it('stays inert for empty or old-save-like state and forbids identity persistence', () => {
    const projection = buildV180IdentityReplayProjection({
      livingWorldState: {
        knownFacts: {},
        playerGoals: [],
        actionConsequences: [],
        identityRouteState: { illegal: true },
        professionState: { illegal: true },
      } as any,
      routeLocationState: null,
    });

    expect(projection.status).toBe('needs_identity_route_context');
    expect(projection.activeRouteId).toBeNull();
    expect(projection.routeCandidates.every(route => route.status === 'needs_context')).toBe(true);
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.canWriteSave).toBe(false);
    expect(projection.replayabilityAudit.pass).toBe(false);
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'identityRouteState',
      'professionState',
      'regionalEventLedger',
      'runFingerprint',
      'deepseek_authority_expansion',
    ]));
  });

  it('sanitizes hidden, formal conclusion, and formal prop-word risks from player-visible identity text', () => {
    const projection = buildV180IdentityReplayProjection(richProjectionInput(
      '木牌、令牌、腰牌、名册、登记、报到、负责人点头、管事安排、跟队、临时帐篷、商队成员、护卫身份、散修落脚点、情报人、春秋蝉、重生、回溯、进入商家城、奖励已发放、NPC已死亡都不该泄露。',
    ));

    expect(projection.propWordAudit.pass).toBe(true);
    expect(projection.propWordAudit.detectedCategoryCount).toBeGreaterThan(0);
    expect(projection.modules.propWordRiskCount).toBeGreaterThan(0);

    const visibleText = JSON.stringify({
      publicSummary: projection.publicSummary,
      nextStep: projection.nextStep,
      routeCandidates: projection.routeCandidates,
      pressureCards: projection.pressureCards,
      signalGroups: projection.signalGroups,
      nextStepCandidates: projection.nextStepCandidates,
      boundaryLines: projection.boundaryLines,
      visibleSourceRefs: projection.visibleSourceRefs,
    });
    for (const blocked of [
      '春秋蝉',
      '重生',
      '回溯',
      'fang_yuan_private_causality_hidden_anchor',
      'private-body-redacted',
      '木牌',
      '令牌',
      '腰牌',
      '名册',
      '登记',
      '报到',
      '负责人点头',
      '管事安排',
      '跟队',
      '临时帐篷',
      '商队成员',
      '护卫身份',
      '散修落脚点',
      '情报人',
      '进入商家城',
      '奖励已发放',
      'NPC已死亡',
    ]) {
      expect(visibleText).not.toContain(blocked);
    }
  });
});
