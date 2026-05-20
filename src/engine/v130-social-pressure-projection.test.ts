import { describe, expect, it } from 'vitest';
import { buildV130SocialPressureProjection } from './v130-social-pressure-projection';
import type { LivingWorldState } from '../types';

function livingWorldWithPublicSocialEvidence(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 24,
      day: 2,
      phase: 'morning',
      lastActionId: 'qingmao_escape_route_preparation_probe',
    },
    regions: {},
    knownFacts: {
      qingmao_escape_route_preparation_baseline: {
        id: 'qingmao_escape_route_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '离山准备已留下公开前置痕迹。',
        learnedTurn: 10,
        confidence: 'confirmed',
        tags: ['route', 'public_trace'],
      },
      baijia_bai_ning_bing_public_talent: {
        id: 'baijia_bai_ning_bing_public_talent',
        scope: 'faction',
        source: 'canon_summary',
        summary: '白家天才的公开名声可以成为递话窗口。',
        learnedTurn: 11,
        confidence: 'confirmed',
        tags: ['baijia', 'public'],
      },
    },
    hiddenFactRefs: {
      fang_yuan_private_causality_hidden_anchor: {
        id: 'fang_yuan_private_causality_hidden_anchor',
        scope: 'npc',
        sourcePointer: '春秋蝉/重生/回溯/private-body-redacted',
        revealPolicyId: 'never_show_private_body',
        guard: 'hidden',
        lastCheckedTurn: 24,
      },
    },
    npcMemories: [{
      id: 'npc_memory_public_trace',
      npcId: 'guyue_task_group_watch',
      turn: 18,
      regionId: 'qingmao',
      actionId: 'qingmao_faction_reaction_bridge_review',
      publicSummary: '任务小组只看见公开缺席痕迹；春秋蝉、重生、回溯都不应显示。',
      privateRefId: 'fang_yuan_private_causality_hidden_anchor',
      attitudeDelta: -8,
      weight: 40,
      tags: ['public_trace'],
      expiresTurn: null,
    }],
    factionPressure: [{
      id: 'faction_pressure_baijia_window',
      factionId: 'baijia_zhai',
      pressureType: 'opportunity',
      delta: 12,
      reason: '公开递话窗口出现，但投靠成功、招揽成功、正式通缉已生效、奖励已发放都必须阻断。',
      turn: 19,
      visibility: 'player_visible',
    }],
    playerGoals: [],
    actionConsequences: [{
      id: 'consequence_public_route_trace',
      actionId: 'qingmao_escape_route_preparation_probe',
      turn: 20,
      scope: 'region',
      publicSummary: '离山准备公开痕迹已进入编年候选。',
      effectRefs: ['pursuit:pursuit_qingmao_internal_affairs_trace'],
      followUpRefs: ['followup:prepare_public_reason'],
    }],
    ifDeviations: [],
  };
}

describe('v1.3 social pressure projection', () => {
  it('projects NPC, faction, public-event, and follow-up pressure without save-format or authority expansion', () => {
    const projection = buildV130SocialPressureProjection({
      livingWorldState: {
        ...livingWorldWithPublicSocialEvidence(),
        npcRelations: { legacy: { score: 100 } },
        standings: { legacyFaction: 100 },
        socialRelationState: { standingScore: 100 },
      } as any,
      localActionLedger: [{
        id: 'ledger_qingmao_escape_route_preparation_probe',
        source: 'local_engine',
        turn: 21,
        title: '离山准备',
        publicSummary: '公开路线准备动作。',
        risks: ['pursuit_qingmao_internal_affairs_trace'],
        rewards: [],
        blockedUpgrades: ['location_unlock', 'pursuit_success'],
      } as any],
    });

    expect(projection.status).toBe('pressure_visible');
    expect(projection.saveFormatImpact).toBe('none_v24_projection_only');
    expect(projection.statePatchApplied).toBe(false);
    expect(projection.canWriteSave).toBe(false);
    expect(projection.canOpenFormalRelation).toBe(false);
    expect(projection.canCreateWarrant).toBe(false);
    expect(projection.canRecruitOrTransferFaction).toBe(false);
    expect(projection.canSetNpcFate).toBe(false);
    expect(projection.deepSeekAuthority).toBe('no_new_authority');
    expect(projection.legacyFieldsIgnored).toBe(true);
    expect(projection.projectionAudit).toEqual(expect.objectContaining({
      phase: 'v1.3.0-b2-projection-hardening',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToLedgerWithoutUserDecision: false,
      pass: true,
    }));
    expect(projection.projectionAudit.requiredUserDecisionForLedger).toEqual(expect.arrayContaining([
      'approve_SAVE_FORMAT_VERSION_25',
      'approve_socialRelationState_or_equivalent_single_aggregate',
      'approve_migration_defaults_tests',
    ]));
    expect(projection.moduleCounts.factionPressure).toBeGreaterThan(0);
    expect(projection.moduleCounts.npcMemory).toBeGreaterThan(0);
    expect(projection.moduleCounts.publicEvent).toBeGreaterThan(0);
    expect(projection.moduleCounts.socialFollowup).toBeGreaterThan(0);
    expect(projection.npcContactWindows.length).toBeGreaterThan(0);
    expect(projection.npcContactWindows[0]).toEqual(expect.objectContaining({
      createsRelationshipScore: false,
      canNameFormalNpc: false,
      canSetNpcFate: false,
      canPatch: false,
    }));
    expect(projection.npcContactWindows[0].forbiddenWrites).toEqual(expect.arrayContaining([
      'relationship_score',
      'formal_named_npc_runtime_rule',
      'npc_fate_result',
    ]));
    expect(projection.factionPreconditions.length).toBeGreaterThan(0);
    expect(projection.factionPreconditions[0]).toEqual(expect.objectContaining({
      canCreateWarrant: false,
      canRecruitOrTransferFaction: false,
      canCreateBlockade: false,
      grantsReward: false,
      canPatch: false,
    }));
    expect(projection.factionPreconditions[0].forbiddenWrites).toEqual(expect.arrayContaining([
      'formal_warrant',
      'formal_blockade',
      'recruitment_success',
      'faction_transfer',
      'task_reward',
    ]));
    expect(projection.signals.map(signal => signal.kind)).toEqual(expect.arrayContaining([
      'faction_pressure',
      'npc_memory',
      'public_event',
      'social_followup',
    ]));
    expect(projection.boundaryLines.join('\n')).toContain('不 bump SAVE_FORMAT_VERSION');
    expect(projection.boundaryLines.join('\n')).toContain('不新增 socialRelationState');
    expect(projection.boundaryLines.join('\n')).toContain('MiroFish');
    expect(projection.forbiddenWrites).toEqual(expect.arrayContaining([
      'SAVE_FORMAT_VERSION_25',
      'socialRelationState',
      'standing_delta',
      'warrant_active',
      'recruitment_success',
      'formal_blockade',
      'npc_death',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));

    const visibleText = JSON.stringify({
      publicSummary: projection.publicSummary,
      nextStep: projection.nextStep,
      signals: projection.signals,
      promptSafePublicSummary: projection.promptSafePublicSummary,
    });
    expect(visibleText).not.toContain('春秋蝉');
    expect(visibleText).not.toContain('重生');
    expect(visibleText).not.toContain('回溯');
    expect(visibleText).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(visibleText).not.toContain('投靠成功');
    expect(visibleText).not.toContain('招揽成功');
    expect(visibleText).not.toContain('正式通缉已生效');
    expect(visibleText).not.toContain('奖励已发放');
  });

  it('does not infer social pressure from legacy relation fields alone', () => {
    const projection = buildV130SocialPressureProjection({
      livingWorldState: {
        npcRelations: { legacy: { score: 100 } },
        standings: { legacyFaction: 100 },
        socialRelationState: { standingScore: 100 },
      } as any,
    });

    expect(projection.status).toBe('needs_public_evidence');
    expect(projection.signals).toEqual([]);
    expect(projection.npcContactWindows).toEqual([]);
    expect(projection.factionPreconditions).toEqual([]);
    expect(projection.publicSummary).toContain('旧声望字段');
    expect(projection.projectionAudit.legacyFieldPolicy).toBe('ignored_as_authority');
    expect(projection.canWriteSave).toBe(false);
  });
});
