import { describe, expect, it, vi } from 'vitest';
import { createInitialLivingWorldState } from '../defaultLivingWorldState';
import { createLivingWorldSlice } from './livingWorldSlice';
import { applyLivingWorldPatch } from '../../engine/v011-living-world-patch';

function createHarness(overrides: Record<string, any> = {}) {
  let state: any = {
    turn: 12,
    selectedStartProfileId: 'start_qingmaoshan_guyue',
    currentDomain: '南疆',
    gameMode: 'canon',
    profile: { name: '自由目标测试蛊师', realm: { grand: 1, sub: '中阶', label: '一转中阶' } },
    sceneSessionState: {
      sceneId: 'v011_free_goal_store_test',
      locationId: 'qingmaoshan_clan_school',
    },
    flags: {},
    inventory: [{ id: 'moonlight', name: '月光蛊' }],
    materialBag: {},
    currency: 500,
    livingWorldState: createInitialLivingWorldState({ worldClock: { turn: 12 } } as any),
    gameLog: [],
    ...overrides,
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state.addGameLog = vi.fn((category: string, message: string, meta?: any) => {
    state.gameLog = [...state.gameLog, { category, message, meta }];
  });
  state = { ...state, ...createLivingWorldSlice(set, get) };
  return { get: () => state };
}

describe('v0.11.0-a3-2 living world free-goal store bridge', () => {
  it('previews a free intent without mutating living-world state', () => {
    const harness = createHarness();
    const before = harness.get().livingWorldState;
    const result = harness.get().previewWorldIntentAction('我要拿九转蛊');

    expect(result.success).toBe(true);
    expect(result.adjudication?.candidate.targetRef).toBe('item:rank_nine_gu');
    expect(result.adjudication?.ruling.category).toBe('long_term_goal');
    expect(harness.get().livingWorldState).toBe(before);
    expect(harness.get().livingWorldState.playerGoals).toHaveLength(0);
  });

  it('persists a confirmed long-term goal only through livingWorldState.playerGoals', () => {
    const harness = createHarness();
    const beforeInventory = harness.get().inventory;
    const beforeCurrency = harness.get().currency;
    const preview = harness.get().previewWorldIntentAction('我要逃离青茅山').adjudication!;
    const result = harness.get().confirmWorldIntentGoalAction(preview);

    expect(result.success).toBe(true);
    expect(result.applied.some((entry: string) => entry.startsWith('playerGoal:'))).toBe(true);
    expect(result.rejected).toHaveLength(0);
    expect(harness.get().livingWorldState.playerGoals).toEqual([
      expect.objectContaining({
        intentType: 'travel',
        targetRef: 'region:outside_qingmao',
        status: 'deferred',
        blockedByRefIds: ['route:qingmao_exit', 'resource:travel_supply', 'risk:pursuit'],
      }),
    ]);
    expect(harness.get().inventory).toBe(beforeInventory);
    expect(harness.get().currency).toBe(beforeCurrency);
    expect(harness.get().flags.lastLivingWorldPatch).toEqual(expect.objectContaining({
      source: 'world_intent_goal',
      applied: [expect.stringMatching(/^playerGoal:/)],
      rejected: [],
    }));
    expect(harness.get().addGameLog).toHaveBeenCalledWith(
      'system',
      '自由目标记录：region:outside_qingmao',
      expect.objectContaining({ intentType: 'travel', status: 'deferred' }),
    );
  });

  it('does not persist immediately routeable intents without a goal draft', () => {
    const harness = createHarness();
    const preview = harness.get().previewWorldIntentAction('我要跟踪方源').adjudication!;
    const result = harness.get().confirmWorldIntentGoalAction(preview);

    expect(preview.ruling.category).toBe('available_with_cost');
    expect(preview.suggestedPlayerGoal).toBeNull();
    expect(result.success).toBe(false);
    expect(result.rejected).toEqual(['missing_player_goal_draft']);
    expect(harness.get().livingWorldState.playerGoals).toHaveLength(0);
  });

  it('persists visible investigation facts through the living-world patch gate', () => {
    const harness = createHarness();
    const beforeInventory = harness.get().inventory;
    const beforeCurrency = harness.get().currency;
    const preview = harness.get().previewWorldIntentAction('我要调查白家').adjudication!;
    const result = harness.get().resolveVisibleInvestigationAction(preview);

    expect(result.success).toBe(true);
    expect(result.applied).toEqual(expect.arrayContaining([
      'knownFact:qingmao_three_clans_layout',
      'knownFact:baijia_bai_ning_bing_public_talent',
      expect.stringMatching(/^factionPressure:/),
      expect.stringMatching(/^actionConsequence:/),
      'worldClock',
    ]));
    expect(result.rejected).toEqual([]);
    expect(Object.keys(harness.get().livingWorldState.knownFacts)).toEqual([
      'qingmao_three_clans_layout',
      'baijia_bai_ning_bing_public_talent',
    ]);
    expect(harness.get().livingWorldState.actionConsequences).toHaveLength(1);
    expect(harness.get().livingWorldState.factionPressure).toEqual([
      expect.objectContaining({
        factionId: 'baijia_zhai',
        pressureType: 'opportunity',
        visibility: 'player_visible',
      }),
    ]);
    expect(harness.get().livingWorldState.playerGoals).toHaveLength(0);
    expect(harness.get().livingWorldState.worldClock.lastActionId).toContain('qingmao_visible_investigation_');
    expect(harness.get().inventory).toBe(beforeInventory);
    expect(harness.get().currency).toBe(beforeCurrency);
    expect(harness.get().flags.lastLivingWorldPatch).toEqual(expect.objectContaining({
      source: 'visible_investigation',
      success: true,
      applied: expect.arrayContaining(['knownFact:qingmao_three_clans_layout']),
      rejected: [],
    }));
  });

  it('executes Bai contact-window action without faction transfer or rewards', () => {
    const harness = createHarness({ currentFaction: 'guyue_shanzhai' });
    const beforeInventory = harness.get().inventory;
    const beforeCurrency = harness.get().currency;
    const preview = harness.get().previewWorldIntentAction('我要调查白家').adjudication!;
    harness.get().resolveVisibleInvestigationAction(preview);

    const first = harness.get().resolveBaiContactWindowAction();
    const second = harness.get().resolveBaiContactWindowAction();

    expect(first.success).toBe(true);
    expect(first.applied).toEqual(expect.arrayContaining([
      'factionPressure:faction_pressure_qingmao_baijia_contact_window_opportunity',
      'factionPressure:faction_pressure_qingmao_baijia_contact_window_guyue_shanzhai_suspicion',
      'actionConsequence:consequence_qingmao_baijia_contact_window_probe',
      'worldClock',
    ]));
    expect(first.resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(first.resolution.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'faction_transfer',
      'standing_delta',
      'reward',
      'location_unlock',
      'canon_anchor_change',
    ]));
    expect(second.success).toBe(true);
    expect(harness.get().livingWorldState.factionPressure.map((entry: any) => entry.id)).toEqual([
      expect.stringContaining('baijia_opportunity'),
      'faction_pressure_qingmao_baijia_contact_window_opportunity',
      'faction_pressure_qingmao_baijia_contact_window_guyue_shanzhai_suspicion',
    ]);
    expect(harness.get().livingWorldState.actionConsequences.map((entry: any) => entry.id)).toEqual([
      expect.stringContaining('qingmao_visible_investigation'),
      'consequence_qingmao_baijia_contact_window_probe',
    ]);
    expect(harness.get().inventory).toBe(beforeInventory);
    expect(harness.get().currency).toBe(beforeCurrency);
    expect(harness.get().currentFaction).toBe('guyue_shanzhai');
    expect(harness.get().flags.lastWorldActionReturnContext.promptSummary).toContain('白家接触窗口试探');
    expect(harness.get().flags.lastLivingWorldPatch).toEqual(expect.objectContaining({
      source: 'bai_contact_window',
      success: true,
      rejected: [],
    }));
  });

  it('prepares Qingmao escape route from a confirmed player goal without unlocking regions', () => {
    const harness = createHarness({ currentFaction: 'guyue_shanzhai' });
    const beforeInventory = harness.get().inventory;
    const beforeCurrency = harness.get().currency;
    const beforeDomain = harness.get().currentDomain;
    const preview = harness.get().previewWorldIntentAction('我要逃离青茅山').adjudication!;
    const goalResult = harness.get().confirmWorldIntentGoalAction(preview);
    const goalId = goalResult.goal!.id;

    const first = harness.get().resolveQingmaoEscapeRoutePreparationAction(goalId);
    const second = harness.get().resolveQingmaoEscapeRoutePreparationAction(goalId);

    expect(first.success).toBe(true);
    expect(first.applied).toEqual(expect.arrayContaining([
      'knownFact:qingmao_escape_route_preparation_baseline',
      'factionPressure:faction_pressure_qingmao_escape_route_guyue_shanzhai_pursuit_risk',
      `playerGoal:${goalId}`,
      'actionConsequence:consequence_qingmao_escape_route_preparation_probe',
      'worldClock',
    ]));
    expect(first.resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(first.resolution.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'location_unlock',
      'teleport',
      'escape_success',
      'reward',
      'canon_anchor_change',
    ]));
    expect(second.success).toBe(true);
    expect(Object.keys(harness.get().livingWorldState.knownFacts)).toEqual([
      'qingmao_escape_route_preparation_baseline',
    ]);
    expect(harness.get().livingWorldState.factionPressure.map((entry: any) => entry.id)).toEqual([
      'faction_pressure_qingmao_escape_route_guyue_shanzhai_pursuit_risk',
    ]);
    expect(harness.get().livingWorldState.actionConsequences.map((entry: any) => entry.id)).toEqual([
      'consequence_qingmao_escape_route_preparation_probe',
    ]);
    expect(harness.get().livingWorldState.playerGoals).toEqual([
      expect.objectContaining({
        id: goalId,
        targetRef: 'region:outside_qingmao',
        status: 'deferred',
        nextStepHints: expect.arrayContaining([
          'route:route_qingmao_outer_night_mountain_road',
          'supply:supply_qingmao_food_wine_short_trip',
          'pursuit:pursuit_qingmao_task_absence_north_gate',
        ]),
      }),
    ]);
    expect(harness.get().inventory).toBe(beforeInventory);
    expect(harness.get().currency).toBe(beforeCurrency);
    expect(harness.get().currentDomain).toBe(beforeDomain);
    expect(harness.get().flags.lastWorldActionReturnContext.promptSummary).toContain('当前没有离开青茅山');
    expect(harness.get().flags.lastLivingWorldPatch).toEqual(expect.objectContaining({
      source: 'qingmao_escape_route_preparation',
      success: true,
      rejected: [],
    }));
    expect(harness.get().gameLog.at(-1).meta).toEqual(expect.objectContaining({
      routeCandidateIds: [
        'route_qingmao_outer_night_mountain_road',
        'route_qingmao_bamboo_forest_riverbank',
        'route_qingmao_task_valley',
      ],
      supplyRequirementIds: expect.arrayContaining(['supply_qingmao_food_wine_short_trip']),
      pursuitTriggerIds: expect.arrayContaining(['pursuit_qingmao_task_absence_north_gate']),
      intakeReviewRef: '指导大纲/vMiroFish/intake-reviews/2026-05-16-qingmao-route-supply-pursuit-pack-intake-review.md',
    }));
  });

  it('projects Qingmao faction reactions from public traces without standing, rewards, or location unlocks', () => {
    const harness = createHarness({ currentFaction: 'guyue_shanzhai' });
    const beforeInventory = harness.get().inventory;
    const beforeCurrency = harness.get().currency;
    const beforeDomain = harness.get().currentDomain;
    const preview = harness.get().previewWorldIntentAction('我要逃离青茅山').adjudication!;
    const goalResult = harness.get().confirmWorldIntentGoalAction(preview);
    const goalId = goalResult.goal!.id;
    harness.get().resolveQingmaoEscapeRoutePreparationAction(goalId);

    const first = harness.get().resolveQingmaoFactionReactionBridgeAction();
    const second = harness.get().resolveQingmaoFactionReactionBridgeAction();

    expect(first.success).toBe(true);
    expect(first.resolution.reactionPlan.matchedRules.length).toBeGreaterThanOrEqual(6);
    expect(first.applied).toEqual(expect.arrayContaining([
      expect.stringMatching(/^factionPressure:faction_pressure_qingmao_reaction_/),
      expect.stringMatching(/^npcMemory:npc_memory_qingmao_reaction_/),
      'actionConsequence:consequence_qingmao_faction_reaction_bridge_review',
      'worldClock',
    ]));
    expect(first.resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(first.resolution.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'standing_delta',
      'faction_transfer',
      'reward',
      'location_unlock',
      'npc_death',
      'hidden_fact_reveal',
    ]));
    expect(second.success).toBe(true);
    expect(harness.get().livingWorldState.factionPressure.map((entry: any) => entry.id)).toEqual([
      'faction_pressure_qingmao_escape_route_guyue_shanzhai_pursuit_risk',
      ...first.resolution.factionPressure.map((entry: any) => entry.id),
    ]);
    expect(harness.get().livingWorldState.npcMemories.map((entry: any) => entry.id)).toEqual(
      first.resolution.npcMemories.map((entry: any) => entry.id),
    );
    expect(harness.get().livingWorldState.actionConsequences.map((entry: any) => entry.id)).toEqual([
      'consequence_qingmao_escape_route_preparation_probe',
      'consequence_qingmao_faction_reaction_bridge_review',
    ]);
    expect(harness.get().inventory).toBe(beforeInventory);
    expect(harness.get().currency).toBe(beforeCurrency);
    expect(harness.get().currentDomain).toBe(beforeDomain);
    expect(harness.get().currentFaction).toBe('guyue_shanzhai');
    expect(JSON.stringify(harness.get().livingWorldState)).not.toContain('投靠成功');
    expect(JSON.stringify(harness.get().livingWorldState)).not.toContain('春秋蝉');
    expect(harness.get().flags.lastWorldActionReturnContext.promptSummary).toContain('已匹配');
    expect(harness.get().flags.lastLivingWorldPatch).toEqual(expect.objectContaining({
      source: 'qingmao_faction_reaction_bridge',
      success: true,
      rejected: [],
    }));
    expect(harness.get().gameLog.at(-1).meta).toEqual(expect.objectContaining({
      matchedRuleIds: expect.arrayContaining([
        'reaction_elder_security_alert',
        'reaction_jiaosan_task_authority',
      ]),
      intakeReviewRef: '指导大纲/vMiroFish/intake-reviews/2026-05-16-qingmao-faction-pressure-pack-intake-review.md',
    }));
  });

  it('records hidden investigation refs without creating visible known facts', () => {
    const harness = createHarness();
    const preview = harness.get().previewWorldIntentAction('我要调查灵泉').adjudication!;
    const result = harness.get().resolveVisibleInvestigationAction(preview);

    expect(result.success).toBe(false);
    expect(result.rejected).toContain('hidden_fact_ref_only');
    expect(harness.get().livingWorldState.knownFacts).toEqual({});
    expect(harness.get().livingWorldState.factionPressure).toEqual([]);
    expect(Object.keys(harness.get().livingWorldState.hiddenFactRefs)).toEqual([
      'guyue_spirit_spring_resource_basis',
    ]);
    expect(JSON.stringify(harness.get().livingWorldState.hiddenFactRefs)).not.toContain('summary');
    expect(harness.get().flags.lastLivingWorldPatch).toEqual(expect.objectContaining({
      source: 'visible_investigation',
      success: false,
      rejected: expect.arrayContaining(['hidden_fact_ref_only']),
    }));
  });

  it('records Fang Yuan probes as protected public failures without leaking hidden facts', () => {
    const harness = createHarness();
    const preview = harness.get().previewWorldIntentAction('我要跟踪方源').adjudication!;
    const result = harness.get().resolveVisibleInvestigationAction(preview);

    expect(result.success).toBe(false);
    expect(result.applied).toEqual(expect.arrayContaining([
      'hiddenFactRef:fang_yuan_private_causality_hidden_anchor',
      expect.stringMatching(/^npcMemory:/),
      expect.stringMatching(/^actionConsequence:/),
      'worldClock',
    ]));
    expect(harness.get().livingWorldState.knownFacts).toEqual({});
    expect(harness.get().livingWorldState.npcMemories).toEqual([
      expect.objectContaining({
        npcId: 'fang_yuan',
        privateRefId: 'fang_yuan_private_causality_hidden_anchor',
        attitudeDelta: 0,
      }),
    ]);
    expect(JSON.stringify(harness.get().livingWorldState.npcMemories)).not.toContain('春秋蝉');
    expect(JSON.stringify(harness.get().livingWorldState.npcMemories)).not.toContain('回溯');
    expect(harness.get().livingWorldState.actionConsequences).toEqual([
      expect.objectContaining({
        scope: 'npc',
        effectRefs: ['fang_yuan_private_causality_hidden_anchor'],
      }),
    ]);
  });

  it('executes Fang Yuan public-evidence inquiry without tracking success or hidden reveal', () => {
    const harness = createHarness({ currentFaction: 'guyue_shanzhai' });
    const beforeInventory = harness.get().inventory;
    const beforeCurrency = harness.get().currency;
    const beforeDomain = harness.get().currentDomain;
    const preview = harness.get().previewWorldIntentAction('我要打听方源在客栈和族学的公开记录').adjudication!;

    const first = harness.get().resolveFangYuanPublicEvidenceAction(preview);
    const second = harness.get().resolveFangYuanPublicEvidenceAction(preview);

    expect(first.success).toBe(true);
    expect(first.applied).toEqual(expect.arrayContaining([
      expect.stringMatching(/^knownFact:fang_yuan_public_evidence_/),
      expect.stringMatching(/^hiddenFactRef:fy_hidden_/),
      'npcMemory:npc_memory_fang_yuan_public_evidence_inquiry_caution',
      'factionPressure:faction_pressure_fang_yuan_public_evidence_guyue_shanzhai_suspicion',
      'actionConsequence:consequence_qingmao_fang_yuan_public_evidence_inquiry',
      'worldClock',
    ]));
    expect(first.resolution.worldActionResolution.rewardPolicy).toBe('none');
    expect(first.resolution.deepSeekVisibleFactIds).toEqual(first.resolution.knownFacts.map((fact: any) => fact.id));
    expect(first.resolution.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'tracking_success',
      'capture_result',
      'fang_yuan_hidden_causality',
      'hidden_fact_reveal',
      'reward',
      'location_unlock',
    ]));
    expect(second.success).toBe(true);
    expect(Object.keys(harness.get().livingWorldState.knownFacts).length).toBe(first.resolution.knownFacts.length);
    expect(Object.keys(harness.get().livingWorldState.hiddenFactRefs)).toEqual(
      first.resolution.hiddenFactRefs.map((ref: any) => ref.id),
    );
    expect(harness.get().livingWorldState.npcMemories.map((entry: any) => entry.id)).toEqual([
      'npc_memory_fang_yuan_public_evidence_inquiry_caution',
    ]);
    expect(harness.get().livingWorldState.actionConsequences.map((entry: any) => entry.id)).toEqual([
      'consequence_qingmao_fang_yuan_public_evidence_inquiry',
    ]);
    expect(harness.get().inventory).toBe(beforeInventory);
    expect(harness.get().currency).toBe(beforeCurrency);
    expect(harness.get().currentDomain).toBe(beforeDomain);
    expect(harness.get().currentFaction).toBe('guyue_shanzhai');
    const playerVisibleText = [
      first.message,
      ...Object.values(harness.get().livingWorldState.knownFacts).map((fact: any) => fact.summary),
      ...harness.get().livingWorldState.npcMemories.map((memory: any) => memory.publicSummary),
      ...harness.get().livingWorldState.actionConsequences.map((consequence: any) => consequence.publicSummary),
    ].join('\n');
    expect(playerVisibleText).not.toContain('春秋蝉');
    expect(playerVisibleText).not.toContain('重生');
    expect(playerVisibleText).not.toContain('回溯');
    expect(playerVisibleText).not.toContain('追踪成功');
    expect(harness.get().flags.lastWorldActionReturnContext.promptSummary).toContain('公开旁证');
    expect(harness.get().flags.lastLivingWorldPatch).toEqual(expect.objectContaining({
      source: 'fang_yuan_public_evidence',
      success: true,
      rejected: [],
    }));
    expect(harness.get().gameLog.at(-1).meta).toEqual(expect.objectContaining({
      matchedProfileIds: expect.arrayContaining(['general_public_evidence']),
      intakeReviewRef: '指导大纲/vMiroFish/intake-reviews/2026-05-16-fang-yuan-public-evidence-pack-intake-review.md',
    }));
  });

  it('keeps DeepSeek and UI direct patch sources blocked', () => {
    const state = createInitialLivingWorldState({ worldClock: { turn: 12 } } as any);
    const goal = {
      id: 'goal_illegal_ui',
      intentType: 'obtain_item' as const,
      targetRef: 'item:rank_nine_gu',
      status: 'deferred' as const,
      createdTurn: 12,
      lastUpdatedTurn: 12,
      rationale: 'blocked source test',
      nextStepHints: [],
      blockedByRefIds: [],
    };

    const uiResult = applyLivingWorldPatch(state, {
      source: 'ui',
      playerGoals: [goal],
    });
    const deepSeekResult = applyLivingWorldPatch(state, {
      source: 'deepseek',
      playerGoals: [goal],
    });

    expect(uiResult.rejected).toContain('source_not_allowed:ui');
    expect(deepSeekResult.rejected).toContain('source_not_allowed:deepseek');
    expect(uiResult.state.playerGoals).toHaveLength(0);
    expect(deepSeekResult.state.playerGoals).toHaveLength(0);
  });
});
