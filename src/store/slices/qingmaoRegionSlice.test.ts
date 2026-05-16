import { describe, expect, it, vi } from 'vitest';
import { createQingmaoRegionSlice } from './qingmaoRegionSlice';

function createHarness(overrides: Record<string, any> = {}) {
  let state: any = {
    turn: 21,
    currentChapterId: 'qingmao_region_store_test',
    currentDomain: '南疆',
    selectedStartProfileId: 'start_qingmaoshan_guyue',
    profile: { name: '青茅测试蛊师', realm: { grand: 1, sub: '中阶', label: '一转中阶' } },
    attributes: { 资质: 7, 体魄: 6, 心智: 6, 气运: 5 },
    pathBuild: { primary: '月道', secondary: [], path_levels: {}, dao_marks: {} },
    flags: { _start_profile: 'start_qingmaoshan_guyue' },
    gameTime: { ap: 3, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' },
    inventory: [
      { id: 'moonlight', name: '月光蛊', currentState: 'normal' },
      { id: 'white_jade', name: '白玉蛊', currentState: 'normal' },
    ],
    sceneSessionState: {
      sceneId: 'qingmao_region_store_test',
      actionBudget: { remaining: 3, remainingAp: 3, max: 3, maxAp: 3, spent: 0, spentAp: 0 },
      localActionLedger: [],
    },
    l3Warnings: [],
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
  state.setL3Warnings = vi.fn((warnings: any[]) => {
    state.l3Warnings = warnings;
  });
  state.recordTrainingGroundCandidateAction = vi.fn(() => ({ valid: true, blockers: [], warnings: [] }));
  state.resolveTrainingGroundAction = vi.fn(() => ({ success: true, message: '道场磨练完成。' }));
  state.performFieldAction = vi.fn(() => ({ success: true, message: '山道巡查完成。' }));
  state = { ...state, ...createQingmaoRegionSlice(set, get) };
  return { get: () => state };
}

describe('v0.10.0-b1 Qingmao region store slice', () => {
  it('lists action entries from the selected Qingmao start without adding persistent state', () => {
    const harness = createHarness();
    const entries = harness.get().listQingmaoRegionActionEntriesAction();

    expect(entries.some(entry => entry.source.id === 'clan_school_notice' && entry.actionSlot.id === 'clan_school_training')).toBe(true);
    expect(entries.some(entry => entry.source.id === 'caravan_rumor')).toBe(false);
    expect(Object.keys(createQingmaoRegionSlice(() => undefined, harness.get))).toEqual([
      'listQingmaoRegionActionEntriesAction',
      'listQingmaoResourceLoopEntriesAction',
      'resolveQingmaoRegionActionAction',
      'resolveQingmaoResourceLoopActionAction',
      'registerQingmaoCombatCandidateAction',
    ]);
  });

  it('routes clan-school training into the existing training-ground store actions', () => {
    const harness = createHarness();
    const result = harness.get().resolveQingmaoRegionActionAction({
      sourceId: 'clan_school_notice',
      actionSlotId: 'clan_school_training',
      title: '族学告示',
      summary: '族学告示引向青茅山炼蛊台。',
      seed: 'store-clan-school',
    });

    expect(result.success).toBe(true);
    expect(result.saveFormatImpact).toBe('none');
    expect(harness.get().recordTrainingGroundCandidateAction).toHaveBeenCalledWith(expect.objectContaining({
      groundId: 'tg_nanjiang_refine',
      source: 'faction',
    }));
    expect(harness.get().resolveTrainingGroundAction).toHaveBeenCalledWith('tg_nanjiang_refine');
    expect(harness.get().performFieldAction).not.toHaveBeenCalled();
    expect(harness.get().livingWorldState).toBeUndefined();
  });

  it('routes mountain patrol into the existing field-action store action', () => {
    const harness = createHarness();
    const result = harness.get().resolveQingmaoRegionActionAction({
      sourceId: 'mountain_path_patrol',
      actionSlotId: 'mountain_patrol',
      title: '山道巡查',
      summary: '查看青茅山前山路况。',
      seed: 7,
    });

    expect(result.saveFormatImpact).toBe('none');
    expect(harness.get().performFieldAction).toHaveBeenCalledWith('scout', 'field');
    expect(harness.get().recordTrainingGroundCandidateAction).not.toHaveBeenCalled();
    expect(harness.get().livingWorldState.worldClock.lastActionId).toContain('world_departure_');
    expect(Object.keys(harness.get().livingWorldState.knownFacts).some(id => id.startsWith('qingmao_known_world_resolution_'))).toBe(true);
    expect(harness.get().livingWorldState.actionConsequences[0]).toEqual(expect.objectContaining({
      scope: 'region',
      publicSummary: '查看青茅山前山路况。',
    }));
  });

  it('blocks three-clan commission until persistent Qingmao region state is approved', () => {
    const harness = createHarness({
      selectedStartProfileId: 'start_qingmaoshan_shangjia_caravan',
      flags: { _start_profile: 'start_qingmaoshan_shangjia_caravan' },
    });
    const result = harness.get().resolveQingmaoRegionActionAction({
      sourceId: 'caravan_rumor',
      actionSlotId: 'three_clan_commission',
      title: '商队传闻',
      summary: '有人提到三寨委托需要核验。',
    });

    expect(result.success).toBe(false);
    expect(result.saveFormatImpact).toBe('requires_persistent_region_state');
    expect(result.message).toContain('持久化区域状态');
    expect(harness.get().recordTrainingGroundCandidateAction).not.toHaveBeenCalled();
    expect(harness.get().performFieldAction).not.toHaveBeenCalled();
    expect(harness.get().l3Warnings[0].ruleName).toBe('qingmao_region_action_blocked');
    expect(harness.get().livingWorldState).toBeUndefined();
  });

  it('blocks AI identity/lore overreach before delegating to local action systems', () => {
    const harness = createHarness({
      selectedStartProfileId: 'start_qingmaoshan_xiongjia',
      flags: { _start_profile: 'start_qingmaoshan_xiongjia' },
    });
    const result = harness.get().resolveQingmaoRegionActionAction({
      sourceId: 'mountain_path_patrol',
      actionSlotId: 'mountain_patrol',
      title: '古月族人仙蛊巡查',
      summary: '把熊家起点写成古月族人，并获得仙蛊。',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('身份越界');
    expect(result.message).toContain('世界观/运行时禁区');
    expect(harness.get().performFieldAction).not.toHaveBeenCalled();
    expect(harness.get().l3Warnings[0].details).toContain('身份越界');
  });

  it('registers ready Qingmao combat templates into the existing combat candidate queue only', () => {
    const harness = createHarness();
    const result = harness.get().registerQingmaoCombatCandidateAction('qingmao_encounter_clan_school_spar');

    expect(result.success).toBe(true);
    expect(result.build.saveFormatImpact).toBe('none');
    expect(harness.get().flags.combatEventCandidates).toHaveLength(1);
    expect(harness.get().flags.combatEventCandidates[0].title).toBe('族学切磋');
    expect(harness.get().flags.combatEventCandidates[0].engineValidation).toBe('pending');
    expect(harness.get().flags.combatEventCandidates[0].dropPolicyId).toBe('local_engine_only');
    expect(harness.get().flags.combatEventCandidates[0].entryValidation.valid).toBe(true);
  });

  it('keeps candidate-only combat templates out of the queue', () => {
    const harness = createHarness();
    const result = harness.get().registerQingmaoCombatCandidateAction('qingmao_encounter_forest_thread_trap');

    expect(result.success).toBe(false);
    expect(harness.get().flags.combatEventCandidates).toBeUndefined();
    expect(harness.get().l3Warnings[0].ruleName).toBe('qingmao_combat_candidate_blocked');
  });
});
