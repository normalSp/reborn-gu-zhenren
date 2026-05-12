import { describe, expect, it, vi } from 'vitest';
import { createDefaultTrainingGroundState } from '../../engine/v090-training-ground-clue-engine';
import { SAVE_FORMAT_VERSION } from '../initialState';
import { migrateSave } from '../index';
import { createTrainingGroundSlice } from './trainingGroundSlice';

function createHarness(overrides: Record<string, any> = {}) {
  let state: any = {
    turn: 12,
    currentChapterId: 'qingmaoshan',
    currentDomain: '南疆',
    profile: { name: '道场测试蛊师', realm: { grand: 2, sub: '中阶', label: '二转中阶' } },
    attributes: { 资质: 8, 体魄: 6, 心智: 6, 气运: 5 },
    pathBuild: { primary: '炼道', secondary: [], path_levels: {}, dao_marks: {} },
    currency: 1000,
    immortalCurrency: 0,
    flags: {},
    gameLog: [],
    gameTime: { ap: 3, max_ap: 3, period: 'afternoon', day: 1, month: 1, year: 1, season: 'spring' },
    sceneSessionState: {
      sceneId: 'training_ground_store_test',
      actionBudget: { remaining: 3, remainingAp: 3, max: 3, maxAp: 3, spent: 0, spentAp: 0 },
      localActionLedger: [],
    },
    trainingGroundState: createDefaultTrainingGroundState(),
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
  state.addDaoMarks = vi.fn((pathType: string, amount: number) => {
    state.pathBuild = {
      ...state.pathBuild,
      dao_marks: {
        ...(state.pathBuild.dao_marks || {}),
        [pathType]: Number(state.pathBuild.dao_marks?.[pathType] || 0) + amount,
      },
    };
  });
  state.prepareNarrativeAdvanceIntent = vi.fn((reason: string) => {
    state.sceneSessionState = {
      ...state.sceneSessionState,
      pendingAdvanceIntent: { reason },
    };
  });
  state.spendSceneAp = vi.fn((cost: number, actionType: string, summary: string, source: string, systemResult: any, risks: string[]) => {
    const remaining = Number(state.sceneSessionState.actionBudget.remaining ?? state.sceneSessionState.actionBudget.remainingAp ?? 0);
    if (remaining < cost) return { success: false, message: `AP不足，需要${cost}` };
    const entry = {
      id: `ledger_${state.turn}_${state.sceneSessionState.localActionLedger.length}`,
      turn: state.turn,
      actionType,
      source,
      cost,
      summary,
      systemResult,
      risks,
    };
    state.sceneSessionState = {
      ...state.sceneSessionState,
      actionBudget: {
        ...state.sceneSessionState.actionBudget,
        remaining: remaining - cost,
        remainingAp: remaining - cost,
        spent: Number(state.sceneSessionState.actionBudget.spent || 0) + cost,
        spentAp: Number(state.sceneSessionState.actionBudget.spentAp || 0) + cost,
      },
      localActionLedger: [...state.sceneSessionState.localActionLedger, entry],
    };
    state.gameTime = { ...state.gameTime, ap: remaining - cost };
    return { success: true, message: 'spent', entry };
  });
  state = { ...state, ...createTrainingGroundSlice(set, get) };
  return { get: () => state };
}

describe('v0.9.0-a2 training ground store slice', () => {
  it('migrates v20 saves to v21 with trainingGroundState defaults', () => {
    const migrated = migrateSave({
      formatVersion: 20,
      timestamp: 'test',
      meta: { playerName: '旧档', realm: '二转中阶', turn: 7, gameMode: 'canon' },
      state: {
        turn: 7,
        profile: { name: '旧档', realm: { grand: 2, sub: '中阶', label: '二转中阶' } },
        flags: {},
      },
    } as any);

    expect(migrated.formatVersion).toBe(SAVE_FORMAT_VERSION);
    expect((migrated.state as any).trainingGroundState.version).toBe('v0.9.0-a2');
    expect((migrated.state as any).trainingGroundState.clues).toEqual([]);
  });

  it('records a clue and resolves a training action through scene AP ledger', () => {
    const harness = createHarness();
    const validation = harness.get().recordTrainingGroundCandidateAction({
      groundId: 'tg_nanjiang_refine',
      title: '青茅山炼蛊台竹牌',
      summary: '剧情给出炼蛊台入口。',
      source: 'ai-rumor',
    });
    expect(validation.valid).toBe(true);

    const result = harness.get().resolveTrainingGroundAction('tg_nanjiang_refine');
    expect(result.success).toBe(true);
    expect(harness.get().sceneSessionState.localActionLedger[0].actionType).toBe('training_ground');
    expect(harness.get().sceneSessionState.actionBudget.remaining).toBeLessThan(3);
    expect(harness.get().addDaoMarks).toHaveBeenCalled();
    expect(harness.get().trainingGroundState.lastResolutionSteps.length).toBeGreaterThan(0);
  });

  it('creates unified combat candidates for duel grounds without touching old duel state', () => {
    const harness = createHarness({
      turn: 15,
      currentChapterId: 'shili_jueqi',
      profile: { name: '骨道测试', realm: { grand: 3, sub: '高阶', label: '三转高阶' } },
      pathBuild: { primary: '骨道', secondary: [], path_levels: {}, dao_marks: {} },
    });
    expect(harness.get().recordTrainingGroundCandidateAction({
      groundId: 'tg_nanjiang_bone',
      title: '白骨山外围对决',
      summary: '剧情引向白骨山外围对决。',
      source: 'ai-rumor',
    }).valid).toBe(true);

    const result = harness.get().resolveTrainingGroundAction('tg_nanjiang_bone');
    expect(result.success).toBe(true);
    expect(harness.get().flags.combatEventCandidates[0].scale).toBe('duel');
    expect(harness.get().duelState).toBeUndefined();
    expect(harness.get().prepareNarrativeAdvanceIntent).toHaveBeenCalledWith('training_ground_duel');
  });

  it('blocks hunt clues until a3 and records a warning instead of drops', () => {
    const harness = createHarness({
      currentChapterId: 'nilu_ascent',
      profile: { name: '七转测试', realm: { grand: 7, sub: '巅峰', label: '七转巅峰' } },
      immortalCurrency: 1000,
    });
    const validation = harness.get().recordTrainingGroundCandidateAction({
      groundId: 'tg_white_heaven',
      title: '白天荒兽狩猎',
      summary: 'AI 只能登记狩猎传闻，不能给荒兽掉落。',
      source: 'ai-rumor',
    });

    expect(validation.valid).toBe(false);
    expect(harness.get().trainingGroundState.clues[0].status).toBe('blocked');
    expect(harness.get().setL3Warnings).toHaveBeenCalled();
    const result = harness.get().resolveTrainingGroundAction('tg_white_heaven');
    expect(result.success).toBe(false);
    expect(harness.get().flags.combatEventCandidates).toBeUndefined();
  });
});
