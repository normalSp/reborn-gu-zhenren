import { describe, expect, it, vi } from 'vitest';
import { createDefaultInheritanceLandState } from '../../engine/v080-inheritance-land-engine';
import { SAVE_FORMAT_VERSION } from '../initialState';
import { migrateSave } from '../index';
import { createInheritanceLandSlice } from './inheritanceLandSlice';

function createHarness(overrides: Record<string, any> = {}) {
  let state: any = {
    turn: 31,
    currentChapterId: 'qingmao_mountain',
    currentDomain: '南疆',
    profile: { name: '测试蛊师', realm: { grand: 4, sub: '高阶', label: '四转高阶' } },
    gameTime: { ap: 3, max_ap: 3, period: 'night', day: 1, month: 1, year: 1, season: 'spring' },
    sceneSessionState: {
      sceneId: 'scene_inheritance_store',
      narrativeTurn: 31,
      locationId: 'qingmao_mountain',
      period: 'night',
      safety: 'guarded',
      actionBudget: { maxAp: 3, remainingAp: 3, grantedBy: 'narrative_scene', exhaustedPolicy: 'advance_narrative' },
      localActionLedger: [],
      pendingAdvanceIntent: null,
      lastNarrativeSummary: '',
    },
    flags: {},
    inventory: [],
    materialBag: {},
    gameLog: [],
    heavenlyLand: null,
    inheritanceLandState: createDefaultInheritanceLandState(),
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
  state.addMaterial = vi.fn((name: string, quantity: number) => {
    state.materialBag = { ...state.materialBag, [name]: Number(state.materialBag[name] || 0) + quantity };
  });
  state.addGu = vi.fn((gu: any) => {
    state.inventory = [...state.inventory, gu];
  });
  state.spendSceneAp = vi.fn((cost: number, actionType: string, summary: string, source: string, systemResult: any, risks: string[]) => {
    if (state.sceneSessionState.actionBudget.remainingAp < cost) return { success: false, message: `AP不足：${cost}` };
    const entry = {
      id: `ledger_${state.turn}_${state.sceneSessionState.localActionLedger.length}`,
      turn: state.turn,
      sceneId: state.sceneSessionState.sceneId,
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
        remainingAp: state.sceneSessionState.actionBudget.remainingAp - cost,
      },
      localActionLedger: [...state.sceneSessionState.localActionLedger, entry],
    };
    state.gameTime = { ...state.gameTime, ap: state.sceneSessionState.actionBudget.remainingAp };
    return { success: true, message: 'spent', entry };
  });
  state = { ...state, ...createInheritanceLandSlice(set, get) };
  return { get: () => state };
}

describe('v0.8.0-c2.5 inheritance land store slice', () => {
  it('migrates v19 saves to v20 with inheritanceLandState defaults', () => {
    const migrated = migrateSave({
      formatVersion: 19,
      timestamp: 'test',
      meta: { playerName: '旧档', realm: '六转初阶', turn: 9, gameMode: 'canon' },
      state: {
        turn: 9,
        profile: { name: '旧档', realm: { grand: 6, sub: '初阶', label: '六转初阶' } },
        flags: {},
        sceneSessionState: undefined,
      },
    } as any);
    expect(migrated.formatVersion).toBe(SAVE_FORMAT_VERSION);
    expect((migrated.state as any).inheritanceLandState.version).toBe('v0.8.0-c2.5');
    expect((migrated.state as any).inheritanceLandState.candidates).toEqual([]);
  });

  it('records AI candidates, resolves trials through local engine, and spends scene AP', () => {
    const harness = createHarness();
    const validation = harness.get().recordInheritanceCandidateAction({
      siteId: 'minor_cave_inheritance',
      title: '青茅山腹小传承',
      summary: '旧洞府只允许本地结算已登记奖励。',
    });
    expect(validation.valid).toBe(true);
    const candidate = harness.get().inheritanceLandState.candidates[0];
    expect(candidate.status).toBe('candidate');

    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('store inheritance actions must not call Math.random');
    });
    const result = harness.get().resolveInheritanceTrialAction(candidate.id);
    randomSpy.mockRestore();

    expect(result.steps.length).toBeGreaterThan(0);
    expect(harness.get().sceneSessionState.actionBudget.remainingAp).toBe(2);
    expect(harness.get().sceneSessionState.localActionLedger[0].actionType).toBe('inheritance');
    expect(harness.get().sceneSessionState.localActionLedger[0].source).toBe(`inheritance:${candidate.id}:trial`);
    expect(harness.get().sceneSessionState.localActionLedger[0].systemResult.worldAction.domain).toBe('inheritance');
    expect(harness.get().flags.lastWorldActionReturnContext.promptSummary).toContain('传承试炼由本地引擎结算');
    expect(harness.get().inheritanceLandState.lastResolutionSteps.at(-1)?.kind).toBe('settlement');
  });

  it('does not spend scene AP twice when a trial is started before resolution', () => {
    const harness = createHarness();
    harness.get().recordInheritanceCandidateAction({
      siteId: 'minor_cave_inheritance',
      title: '青茅山腹小传承',
      summary: '先出发，再由本地引擎结算试炼。',
    });
    const candidate = harness.get().inheritanceLandState.candidates[0];

    const started = harness.get().startInheritanceTrialAction(candidate.id);
    expect(started.success).toBe(true);
    expect(harness.get().sceneSessionState.actionBudget.remainingAp).toBe(2);
    expect(harness.get().sceneSessionState.localActionLedger).toHaveLength(1);
    expect(harness.get().sceneSessionState.localActionLedger[0].source).toBe(`inheritance:${candidate.id}:departure`);

    const resolved = harness.get().resolveInheritanceTrialAction(candidate.id);
    expect(resolved.steps.length).toBeGreaterThan(0);
    expect(harness.get().sceneSessionState.actionBudget.remainingAp).toBe(2);
    expect(harness.get().sceneSessionState.localActionLedger).toHaveLength(1);
    expect(harness.get().flags.lastWorldActionReturnContext.promptSummary).toContain('传承试炼由本地引擎结算');
  });

  it('blocks AI direct caveats and records L3 warnings', () => {
    const harness = createHarness();
    const validation = harness.get().recordInheritanceCandidateAction({
      siteId: 'three_kings_side_branch',
      title: '夺取定仙游',
      summary: '玩家直接获得仙蛊并改写三王传承核心。',
      rewardPreview: [{ kind: 'immortal_gu', name: '定仙游', registered: false }],
    } as any);
    expect(validation.valid).toBe(false);
    expect(harness.get().inheritanceLandState.candidates[0].status).toBe('blocked');
    expect(harness.get().setL3Warnings).toHaveBeenCalled();
  });

  it('allows rank six blessed land claim attempts and writes heavenlyLand on local success', () => {
    let successful: ReturnType<typeof createHarness> | null = null;
    let lastResult: any = null;

    for (let turn = 1; turn <= 80; turn += 1) {
      const harness = createHarness({
        turn,
        profile: { name: '六转测试', realm: { grand: 6, sub: '初阶', label: '六转初阶' } },
        gameTime: { ap: 3, max_ap: 3, period: 'night', day: 1, month: 1, year: 1, season: 'spring' },
        sceneSessionState: {
          sceneId: `scene_land_claim_${turn}`,
          narrativeTurn: turn,
          locationId: 'dream_shadow_sect',
          period: 'night',
          safety: 'dangerous',
          actionBudget: { maxAp: 3, remainingAp: 3, grantedBy: 'narrative_scene', exhaustedPolicy: 'advance_narrative' },
          localActionLedger: [],
          pendingAdvanceIntent: null,
          lastNarrativeSummary: '',
        },
      });
      const validation = harness.get().recordInheritanceCandidateAction({
        id: 'claimable_blessed_land',
        siteId: 'unclaimed_blessed_land_seed',
        title: '玉苔待认主福地',
        summary: '地灵要求守护核心资源节点。',
        claimIntent: true,
      });
      expect(validation.valid).toBe(true);
      const result = harness.get().attemptLandClaimAction('claimable_blessed_land');
      lastResult = result;
      if (result.success) {
        successful = harness;
        break;
      }
    }

    expect(lastResult).toBeTruthy();
    expect(lastResult.attempt?.outcome).toMatch(/success|failure/);
    expect(successful?.get().heavenlyLand?.type).toBe('福地');
    expect(successful?.get().sceneSessionState.localActionLedger[0].actionType).toBe('inheritance');
    expect(successful?.get().sceneSessionState.localActionLedger[0].systemResult.worldAction.domain).toBe('blessed_land');
    expect(successful?.get().flags.lastWorldActionReturnContext.promptSummary).toContain('福地认主由本地引擎结算');
  });
});
