import { describe, expect, it } from 'vitest';
import { SAVE_FORMAT_VERSION } from '../store/initialState';
import { buildV150ConflictAftermathProjection } from './v150-conflict-aftermath-projection';
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

function conflictLivingWorld(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 55,
      day: 4,
      phase: 'afternoon',
      lastActionId: 'v150_conflict_projection_probe',
    },
    regions: {},
    knownFacts: {
      qingmao_escape_route_preparation_baseline: knownFact('qingmao_escape_route_preparation_baseline', '离山路线准备已有公开痕迹。'),
      qingmao_escape_tracks_cover_baseline: knownFact('qingmao_escape_tracks_cover_baseline', '遮掩痕迹已有公开解释。'),
      qingmao_mountain_pass_route_continuation_candidate: knownFact('qingmao_mountain_pass_route_continuation_candidate', '山路候选承接已出现。'),
      qingmao_supply_feeding_preparation_baseline: knownFact('qingmao_supply_feeding_preparation_baseline', '补给与喂养缺口已被看见。'),
      qingmao_market_window_candidate_baseline: knownFact('qingmao_market_window_candidate_baseline', '商队/市场窗口只作为公开接触。'),
      v018_qingmao_route_candidate_continuation_view: knownFact('v018_qingmao_route_candidate_continuation_view', '候选承接可读，但不写正式路线。'),
    },
    hiddenFactRefs: {
      fang_yuan_private_causality_hidden_anchor: {
        id: 'fang_yuan_private_causality_hidden_anchor',
        scope: 'npc',
        sourcePointer: '春秋蝉/重生/回溯/private-body-redacted',
        revealPolicyId: 'never_show_private_body',
        guard: 'hidden',
        lastCheckedTurn: 55,
      },
    },
    playerGoals: [{
      id: 'goal_escape_qingmao',
      intentType: 'long_term_goal',
      targetRef: 'region:outside_qingmao',
      rationale: '逃离青茅山并寻找南疆低阶外缘落脚。',
      status: 'active',
      createdTurn: 3,
      lastUpdatedTurn: 55,
      blockedByRefIds: [],
      nextStepHints: ['补路线准备', '看商队窗口'],
    }],
    factionPressure: [{
      id: 'faction_pressure_pursuit_attention',
      factionId: 'qingmao_watch',
      pressureType: 'suspicion',
      delta: 9,
      reason: '公开冲突让守山弟子注意，但正式通缉已生效、追杀令已生效、敌对关系已确定都必须阻断。',
      turn: 52,
      visibility: 'player_visible',
    }],
    npcMemories: [{
      id: 'npc_memory_public_conflict',
      npcId: 'qingmao_watch',
      turn: 53,
      regionId: 'qingmao',
      actionId: 'v150_public_conflict_probe',
      publicSummary: '只看见公开冲突与围观压力；春秋蝉、重生、回溯都不应显示。',
      privateRefId: 'fang_yuan_private_causality_hidden_anchor',
      attitudeDelta: -5,
      weight: 30,
      tags: ['public_conflict'],
      expiresTurn: null,
    }],
    actionConsequences: [{
      id: 'consequence_v150_public_conflict_probe',
      actionId: 'v150_public_conflict_probe',
      turn: 54,
      scope: 'combat',
      publicSummary: '族学门口公开冲突留下围观痕迹。',
      effectRefs: ['v150_public_conflict_pressure'],
      followUpRefs: ['followup:review_conflict_projection'],
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
    sourceRefs: ['v150:test:outer_edge_projection'],
    lastUpdatedAtTurn: 55,
  };
}

function combatCandidate(): CombatEventCandidate {
  return {
    id: 'v150_test_ambush_candidate',
    type: 'ambush',
    title: '山路伏击候选',
    summary: '本候选只提示山路伏击风险，禁止掉落已获得、NPC已死亡或地点已解锁。',
    risk: 'medium',
    source: 'engine',
    engineValidation: 'pending',
    createdTurn: 55,
    scale: 'battlefield_5x3',
    enemyHint: '山路窥伺与地形压力',
    requiredRealmGrand: 1,
    dropPolicyId: 'local_engine_only',
    gridPresetId: 'skirmish_5x3',
  };
}

function battleStep(): BattleResolutionStep {
  return {
    id: 'v150_step_counter',
    round: 1,
    kind: 'counter',
    sourceName: '月光蛊',
    message: '月刃被遮挡削弱，伏击者退到树影后。',
    visual: { motif: 'moonlight', primaryTint: '#B9D7FF', motion: 'slash' },
    tags: ['v150', 'counter', 'ambush'],
  };
}

function outcome(): BattleOutcomeSummary {
  return {
    id: 'v150_outcome_test',
    encounterId: 'v150_test_ambush_candidate',
    scale: 'battlefield_5x3',
    result: 'retreat',
    summary: '山路伏击：撤退。奖励已发放、NPC已死亡、完整杀招传承已获得都必须阻断。',
    winner: 'escaped',
    roundsTaken: 2,
    hpDelta: -3,
    essenceDelta: -6,
    consumedGu: [],
    daoMarkDelta: {},
    createdTurn: 55,
    steps: ['月刃被遮挡削弱。'],
  };
}

describe('v1.5 conflict aftermath projection', () => {
  it('projects conflict aftermath without save-format, reward, NPC fate, pursuit, or DeepSeek authority writes', () => {
    const projection = buildV150ConflictAftermathProjection({
      livingWorldState: {
        ...conflictLivingWorld(),
        conflictConsequenceState: { illegal: true },
        pursuitState: { illegal: true },
        combatAftermathState: { illegal: true },
      } as any,
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: {
        status: 'pressure_tracked',
        authority: 'survival_economy_engine',
        pressureScore: 3,
        ledger: [{
          id: 'survival_ledger_conflict_supply',
          turn: 55,
          category: 'route_supply',
          pressure: 'medium',
          publicSummary: '冲突后补给压力已登记。',
          nextStep: '先确认补给和撤退路线。',
          evidenceRefs: ['fact:qingmao_supply_feeding_preparation_baseline'],
          sourceRefs: ['v120:test:pressure_ledger'],
          blockedWrites: ['inventory_delta'],
        }],
        evidenceRefs: ['fact:qingmao_supply_feeding_preparation_baseline'],
        sourceRefs: ['v120:test:pressure_ledger'],
        lastUpdatedAtTurn: 55,
      },
      combatEventCandidates: [combatCandidate()],
      battleResolutionSteps: [battleStep()],
      battleOutcomeSummary: outcome(),
      inventory: [
        { id: 'moonlight', name: '月光蛊', currentState: 'normal' },
        { id: 'white_jade', name: '白玉蛊', currentState: 'normal' },
      ],
      profile: { realm: { grand: 1, sub: '中阶', label: '一转中阶' } },
      turn: 55,
    });

    expect(SAVE_FORMAT_VERSION).toBe(25);
    expect(projection.status).toBe('conflict_projection_visible');
    expect(projection.scopeId).toBe('low_rank_conflict_outer_sample');
    expect(projection.savePolicy).toBe('no_new_persistence_v24');
    expect(projection.authority).toBe('local_projection_only');
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.statePatchApplied).toBe(false);
    expect(projection.canWriteSave).toBe(false);
    expect(projection.canGrantReward).toBe(false);
    expect(projection.canSetNpcFate).toBe(false);
    expect(projection.canSetFormalPursuit).toBe(false);
    expect(projection.canExpandDeepSeekAuthority).toBe(false);
    expect(projection.deepSeekAuthority).toBe('no_new_authority');
    expect(projection.legacyFieldsIgnored).toBe(true);
    expect(projection.projectionAudit).toEqual(expect.objectContaining({
      phase: 'v1.5.0-b1-conflict-aftermath-projection',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v017_public_evidence',
      miroFishPolicy: 'v017_reviewed_source_pointer_only_no_new_package',
      deepSeekPolicy: 'no_new_authority',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToStateWithoutUserDecision: false,
      pass: true,
    }));
    expect(projection.projectionAudit.requiredUserDecisionForState).toEqual(expect.arrayContaining([
      'approve_SAVE_FORMAT_VERSION_25',
      'approve_conflictConsequenceState_or_equivalent_single_aggregate',
      'approve_formal_pursuit_or_warrant_scope',
      'approve_NPC_life_death_or_permanent_injury_scope',
    ]));
    expect(projection.postureCards.map(card => card.id)).toEqual([
      'route_ambush_risk',
      'pursuit_attention_window',
      'countermeasure_gap',
      'squad_formation_readiness',
    ]);
    expect(projection.postureCards.every(card => card.canPatch === false && card.statePatchApplied === false)).toBe(true);
    expect(projection.postureCards.some(card => card.id === 'route_ambush_risk' && card.status === 'visible')).toBe(true);
    expect(projection.postureCards.some(card => card.id === 'pursuit_attention_window' && card.status === 'visible')).toBe(true);
    expect(projection.postureCards.some(card => card.id === 'countermeasure_gap' && card.status === 'visible')).toBe(true);
    expect(projection.postureCards.some(card => card.id === 'squad_formation_readiness' && card.status === 'visible')).toBe(true);
    expect(projection.boundaryLines.join('\n')).toContain('不新增 conflictConsequenceState');
    expect(projection.boundaryLines.join('\n')).toContain('不新增 conflictConsequenceState');
    expect(projection.boundaryLines.join('\n')).toContain('DeepSeek 只能写叙事');
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'SAVE_FORMAT_VERSION_25',
      'conflictConsequenceState',
      'pursuitState',
      'combatAftermathState',
      'formal_pursuit',
      'formal_warrant',
      'reward',
      'gu_reward',
      'npc_death',
      'npc_capture',
      'location_unlock',
      'faction_transfer',
      'hidden_fact_reveal',
      'deepseek_combat_authority',
      'large_combat_motion_asset_pack',
    ]));
    expect(projection.visibleSourceRefs).toEqual(expect.arrayContaining([
      'v1.5.0-a1:D-151-001',
      'v1.5.0-a2:conflict-topic-slice-intake',
      'v0.17:combat-deepening-rules:reviewed-rule-source',
      'v120:test:pressure_ledger',
    ]));
    expect(projection.signalGroups.find(group => group.id === 'combat')?.evidenceRefs).toEqual(expect.arrayContaining([
      'combatCandidate:v150_test_ambush_candidate',
      'battleStep:v150_step_counter',
    ]));
  });

  it('stays inert for empty or old-save-like state and ignores legacy conflict fields as authority', () => {
    const projection = buildV150ConflictAftermathProjection({
      livingWorldState: {
        knownFacts: {},
        playerGoals: [],
        actionConsequences: [],
        conflictConsequenceState: { illegal: true },
        pursuitState: { illegal: true },
        combatAftermathState: { illegal: true },
      } as any,
      routeLocationState: null,
      combatEventCandidates: [],
      battleResolutionSteps: [],
    });

    expect(projection.status).toBe('needs_conflict_context');
    expect(projection.activePostureId).toBeNull();
    expect(projection.postureCards.every(card => card.status === 'needs_context')).toBe(true);
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.canWriteSave).toBe(false);
    expect(projection.legacyFieldsIgnored).toBe(true);
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'conflictConsequenceState',
      'pursuitState',
      'combatAftermathState',
      'deepseek_combat_authority',
    ]));
  });

  it('sanitizes hidden and formal conclusion wording from player-visible projection text', () => {
    const projection = buildV150ConflictAftermathProjection({
      livingWorldState: conflictLivingWorld(),
      routeLocationState: outerEdgeRoute(),
      localActionLedger: [{
        id: 'ledger_hidden_formal_text',
        turn: 56,
        sceneId: 'v150_test',
        actionType: 'combat',
        source: 'local_engine',
        cost: 0,
        summary: '春秋蝉、重生、回溯、正式通缉已生效、追杀令已生效、NPC已死亡、奖励已发放、地点已解锁都不该泄露。',
        systemResult: {},
        risks: ['pursuit_attention', 'hidden_fact_reveal'],
      }],
      combatEventCandidates: [combatCandidate()],
      battleOutcomeSummary: outcome(),
    });

    const visibleText = JSON.stringify({
      publicSummary: projection.publicSummary,
      nextStep: projection.nextStep,
      postureCards: projection.postureCards,
      signalGroups: projection.signalGroups,
      nextStepCandidates: projection.nextStepCandidates,
      visibleSourceRefs: projection.visibleSourceRefs,
    });
    expect(visibleText).not.toContain('春秋蝉');
    expect(visibleText).not.toContain('重生');
    expect(visibleText).not.toContain('回溯');
    expect(visibleText).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(visibleText).not.toContain('private-body-redacted');
    expect(visibleText).not.toContain('正式通缉已生效');
    expect(visibleText).not.toContain('追杀令已生效');
    expect(visibleText).not.toContain('NPC已死亡');
    expect(visibleText).not.toContain('奖励已发放');
    expect(visibleText).not.toContain('地点已解锁');
  });
});
