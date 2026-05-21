import { describe, expect, it } from 'vitest';
import { SAVE_FORMAT_VERSION } from '../store/initialState';
import { buildV170RegionalLifeProjection } from './v170-regional-life-projection';
import type { BattleOutcomeSummary, BattleResolutionStep, CombatEventCandidate, LivingWorldState, RouteLocationState } from '../types';

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

function regionalLifeWorld(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 70,
      day: 6,
      phase: 'afternoon',
      lastActionId: 'v170_regional_life_projection_probe',
    },
    regions: {},
    knownFacts: {
      qingmao_escape_route_preparation_baseline: knownFact('qingmao_escape_route_preparation_baseline', '离山路线准备已有公开痕迹。'),
      qingmao_escape_tracks_cover_baseline: knownFact('qingmao_escape_tracks_cover_baseline', '遮掩痕迹已有公开解释。'),
      qingmao_mountain_pass_route_continuation_candidate: knownFact('qingmao_mountain_pass_route_continuation_candidate', '山路候选承接已出现，外缘盘问需要解释身份。'),
      qingmao_supply_feeding_preparation_baseline: knownFact('qingmao_supply_feeding_preparation_baseline', '补给与喂养缺口已被看见。'),
      qingmao_market_window_candidate_baseline: knownFact('qingmao_market_window_candidate_baseline', '商队/市场窗口只作为公开接触，压价和询价都可能发生。'),
      v018_qingmao_route_candidate_continuation_view: knownFact('v018_qingmao_route_candidate_continuation_view', '候选承接可读，但不写正式路线。'),
    },
    hiddenFactRefs: {
      fang_yuan_private_causality_hidden_anchor: {
        id: 'fang_yuan_private_causality_hidden_anchor',
        scope: 'npc',
        sourcePointer: '春秋蝉/重生/回溯/private-body-redacted',
        revealPolicyId: 'never_show_private_body',
        guard: 'hidden',
        lastCheckedTurn: 70,
      },
    },
    playerGoals: [{
      id: 'goal_escape_qingmao',
      intentType: 'long_term_goal',
      targetRef: 'region:outside_qingmao',
      rationale: '逃离青茅山并在南疆低阶外缘寻找短期遮蔽。',
      status: 'active',
      createdTurn: 3,
      lastUpdatedTurn: 70,
      blockedByRefIds: [],
      nextStepHints: ['解释身份', '找商队短工', '打听补给'],
    }],
    factionPressure: [{
      id: 'faction_pressure_caravan_window',
      factionId: 'outer_caravan',
      pressureType: 'opportunity',
      delta: 8,
      reason: '商队窗口出现，但正式加入商队、投靠成功、奖励已发放都必须阻断。',
      turn: 67,
      visibility: 'player_visible',
    }],
    npcMemories: [{
      id: 'npc_memory_public_route_trace',
      npcId: 'outer_edge_watch',
      turn: 68,
      regionId: 'southern_border_outer_edge',
      actionId: 'v170_public_route_probe',
      publicSummary: '只看见公开遮掩和盘问压力；春秋蝉、重生、回溯都不应显示。',
      privateRefId: 'fang_yuan_private_causality_hidden_anchor',
      attitudeDelta: -3,
      weight: 20,
      tags: ['public_trace'],
      expiresTurn: null,
    }],
    actionConsequences: [{
      id: 'consequence_v170_public_route_probe',
      actionId: 'v170_public_route_probe',
      turn: 69,
      scope: 'region',
      publicSummary: '候选承接已经进入公开准备，守卫盘问、商队短工和临时市场都只是压力窗口。',
      effectRefs: ['v170_public_regional_life_pressure'],
      followUpRefs: ['followup:review_regional_life_projection'],
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
    sourceRefs: ['v170:test:outer_edge_projection'],
    lastUpdatedAtTurn: 70,
  };
}

function combatCandidate(): CombatEventCandidate {
  return {
    id: 'v170_test_road_event_candidate',
    type: 'ambush',
    title: '路途事件候选',
    summary: '只提示路途事件协议，禁止奖励已发放、NPC已死亡或地点已解锁。',
    risk: 'medium',
    source: 'engine',
    engineValidation: 'pending',
    createdTurn: 70,
    scale: 'battlefield_5x3',
    enemyHint: '山路窥伺与绕路压力',
    requiredRealmGrand: 1,
    dropPolicyId: 'local_engine_only',
    gridPresetId: 'skirmish_5x3',
  };
}

function battleStep(): BattleResolutionStep {
  return {
    id: 'v170_step_detour',
    round: 1,
    kind: 'objective',
    sourceName: '山路绕行',
    message: '货物让步换来绕路窗口。',
    visual: { motif: 'dust', primaryTint: '#B8A46A', motion: 'scatter' },
    tags: ['v170', 'road_event'],
  };
}

function outcome(): BattleOutcomeSummary {
  return {
    id: 'v170_outcome_test',
    encounterId: 'v170_test_road_event_candidate',
    scale: 'battlefield_5x3',
    result: 'retreat',
    summary: '路途事件：撤退。价格表已生成、库存已生成、NPC已死亡都必须阻断。',
    winner: 'escaped',
    roundsTaken: 1,
    hpDelta: 0,
    essenceDelta: 0,
    consumedGu: [],
    daoMarkDelta: {},
    createdTurn: 70,
    steps: ['绕路。'],
  };
}

describe('v1.7 regional life projection', () => {
  it('projects regional life pressure deck without save, formal outcome, canon, or DeepSeek authority writes', () => {
    const projection = buildV170RegionalLifeProjection({
      livingWorldState: {
        ...regionalLifeWorld(),
        regionalLifeState: { illegal: true },
        areaLivingState: { illegal: true },
        runFingerprint: 'illegal',
        regionalEventLedger: [{ illegal: true }],
      } as any,
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: {
        status: 'pressure_tracked',
        authority: 'survival_economy_engine',
        pressureScore: 4,
        ledger: [
          {
            id: 'survival_ledger_route_supply',
            turn: 70,
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
            turn: 70,
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
        lastUpdatedAtTurn: 70,
      },
      localActionLedger: [{
        id: 'ledger_v170_low_rank_life',
        turn: 70,
        sceneId: 'v170_test',
        actionType: 'other',
        source: 'v170:test',
        cost: 0,
        summary: '玩家被盘问后考虑商队短工、临时市场询价和求助遮蔽。',
        systemResult: {},
        risks: ['outer_edge_interrogation', 'caravan_labor_window', 'shelter_debt'],
      }],
      combatEventCandidates: [combatCandidate()],
      battleResolutionSteps: [battleStep()],
      battleOutcomeSummary: outcome(),
      variantIndex: 1,
      turn: 70,
    });

    expect(SAVE_FORMAT_VERSION).toBe(24);
    expect(projection.status).toBe('regional_life_visible');
    expect(projection.scopeId).toBe('southern_border_low_rank_outer_edge_life_slice');
    expect(projection.savePolicy).toBe('no_new_persistence_v24');
    expect(projection.authority).toBe('local_projection_only');
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.statePatchApplied).toBe(false);
    expect(projection.canWriteSave).toBe(false);
    expect(projection.canUnlockLocation).toBe(false);
    expect(projection.canOpenFormalTrade).toBe(false);
    expect(projection.canTransferFaction).toBe(false);
    expect(projection.canGrantReward).toBe(false);
    expect(projection.canSetNpcFate).toBe(false);
    expect(projection.canExpandDeepSeekAuthority).toBe(false);
    expect(projection.deepSeekAuthority).toBe('no_new_authority');
    expect(projection.legacyFieldsIgnored).toBe(true);
    expect(projection.pressureCards.map(card => card.id)).toEqual([
      'outer_edge_interrogation',
      'caravan_contact_by_labor',
      'caravan_permission_chain',
      'low_status_labor',
      'temporary_market_window',
      'shelter_debt_window',
      'road_event_protocol',
      'far_city_as_pressure',
    ]);
    expect(projection.pressureCards.every(card => card.canPatch === false && card.statePatchApplied === false)).toBe(true);
    expect(projection.modules.visiblePressureCount).toBeGreaterThanOrEqual(6);
    expect(projection.replayabilityAudit).toEqual(expect.objectContaining({
      policy: 'same_start_replayability_without_persistence',
      variantSourcePolicy: 'local_pressure_deck_and_narrative_expression_only',
      stableFactPolicy: 'route_identity_reward_location_npc_fate_stable',
      minimumVisibleVariantsForB1: 3,
      pass: true,
    }));
    expect(projection.replayabilityAudit.candidatePressureIds).toEqual(expect.arrayContaining([
      'outer_edge_interrogation',
      'caravan_contact_by_labor',
      'temporary_market_window',
    ]));
    expect(projection.projectionAudit).toEqual(expect.objectContaining({
      phase: 'v1.7.0-b1-regional-life-projection',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v150_and_v170_a2_public_evidence',
      miroFishPolicy: 'v170_a2_topic_slice_source_pointer_only',
      deepSeekPolicy: 'no_new_authority_no_visible_mirofish_summary',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToStateWithoutUserDecision: false,
      pass: true,
    }));
    expect(projection.projectionAudit.requiredUserDecisionForState).toEqual(expect.arrayContaining([
      'approve_SAVE_FORMAT_VERSION_25',
      'approve_regionalLifeState_or_equivalent_single_aggregate',
      'approve_per_save_runFingerprint_or_regionalEventLedger',
    ]));
    expect(projection.boundaryLines.join('\n')).toContain('SAVE_FORMAT_VERSION 保持 24');
    expect(projection.boundaryLines.join('\n')).toContain('不新增 regionalLifeState');
    expect(projection.boundaryLines.join('\n')).toContain('同开局可重玩差异度');
    expect(projection.boundaryLines.join('\n')).toContain('DeepSeek 只能写叙事');
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'SAVE_FORMAT_VERSION_25',
      'regionalLifeState',
      'areaLivingState',
      'regionalEventLedger',
      'runFingerprint',
      'location_unlock',
      'formal_caravan_membership',
      'formal_price_table',
      'formal_shop_inventory',
      'reward',
      'npc_death',
      'hidden_fact_reveal',
      'deepseek_visible_mirofish_summary',
      'deepseek_rag',
    ]));
    expect(projection.visibleSourceRefs).toEqual(expect.arrayContaining([
      'v1.7.0-a1:D-171-002',
      'v1.7.0-a2:southern_border_low_rank_outer_edge_life_slice:intake-reviewed',
      'v170:a2:outer_edge_ch0231_village_gate_interrogation',
      'v170:a2:market_ch0237_stall_sale_and_small_market',
    ]));
  });

  it('rotates active pressure by variant index while keeping stable facts unchanged', () => {
    const base = {
      livingWorldState: regionalLifeWorld(),
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: {
        status: 'pressure_tracked',
        authority: 'survival_economy_engine',
        pressureScore: 2,
        ledger: [{
          id: 'survival_ledger_trade_window',
          turn: 70,
          category: 'trade_window',
          pressure: 'low',
          publicSummary: '临时市场窗口已登记。',
          nextStep: '只询价，不成交。',
          evidenceRefs: ['fact:qingmao_market_window_candidate_baseline'],
          sourceRefs: ['v120:test:trade_window'],
          blockedWrites: ['formal_price_table'],
        }],
        evidenceRefs: ['fact:qingmao_market_window_candidate_baseline'],
        sourceRefs: ['v120:test:trade_window'],
        lastUpdatedAtTurn: 70,
      } as any,
      turn: 70,
    };
    const variants = [0, 1, 2].map(variantIndex => buildV170RegionalLifeProjection({ ...base, variantIndex }));
    expect(new Set(variants.map(item => item.activePressureId)).size).toBeGreaterThanOrEqual(3);
    for (const projection of variants) {
      expect(projection.replayabilityAudit.pass).toBe(true);
      expect(projection.canUnlockLocation).toBe(false);
      expect(projection.canGrantReward).toBe(false);
      expect(projection.canSetNpcFate).toBe(false);
      expect(projection.deepSeekAuthority).toBe('no_new_authority');
    }
  });

  it('stays inert for empty or old-save-like state and forbids regional life persistence', () => {
    const projection = buildV170RegionalLifeProjection({
      livingWorldState: {
        knownFacts: {},
        playerGoals: [],
        actionConsequences: [],
        regionalLifeState: { illegal: true },
        areaLivingState: { illegal: true },
      } as any,
      routeLocationState: null,
    });

    expect(projection.status).toBe('needs_regional_context');
    expect(projection.activePressureId).toBeNull();
    expect(projection.pressureCards.every(card => card.status === 'needs_context')).toBe(true);
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.canWriteSave).toBe(false);
    expect(projection.replayabilityAudit.pass).toBe(false);
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'regionalLifeState',
      'areaLivingState',
      'regionalEventLedger',
      'runFingerprint',
      'deepseek_authority_expansion',
    ]));
  });

  it('sanitizes hidden and formal conclusion wording from player-visible regional life text', () => {
    const projection = buildV170RegionalLifeProjection({
      livingWorldState: regionalLifeWorld(),
      routeLocationState: outerEdgeRoute(),
      localActionLedger: [{
        id: 'ledger_hidden_formal_text',
        turn: 71,
        sceneId: 'v170_test',
        actionType: 'other',
        source: 'v170:test',
        cost: 0,
        summary: '春秋蝉、重生、回溯、正式加入商队、进入商家城、地点已解锁、奖励已发放、NPC已死亡、价格表已生成都不该泄露。',
        systemResult: {},
        risks: ['hidden_fact_reveal', 'formal_location_change'],
      }],
      combatEventCandidates: [combatCandidate()],
    });

    const visibleText = JSON.stringify({
      publicSummary: projection.publicSummary,
      nextStep: projection.nextStep,
      pressureCards: projection.pressureCards,
      signalGroups: projection.signalGroups,
      nextStepCandidates: projection.nextStepCandidates,
      visibleSourceRefs: projection.visibleSourceRefs,
    });
    expect(visibleText).not.toContain('春秋蝉');
    expect(visibleText).not.toContain('重生');
    expect(visibleText).not.toContain('回溯');
    expect(visibleText).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(visibleText).not.toContain('private-body-redacted');
    expect(visibleText).not.toContain('正式加入商队');
    expect(visibleText).not.toContain('进入商家城');
    expect(visibleText).not.toContain('地点已解锁');
    expect(visibleText).not.toContain('奖励已发放');
    expect(visibleText).not.toContain('NPC已死亡');
    expect(visibleText).not.toContain('价格表已生成');
  });
});
