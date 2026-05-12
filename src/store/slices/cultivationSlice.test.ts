import { describe, expect, it, vi } from 'vitest';
import type { GuInstance, ImmortalAperture, ResourceNode } from '../../types';
import { createDefaultCultivationState } from '../../engine/v080-cultivation-calamity-engine';
import { SAVE_FORMAT_VERSION } from '../initialState';
import { migrateSave } from '../index';
import { createCultivationSlice } from './cultivationSlice';

const SUB = {
  initial: '初阶',
  middle: '中阶',
  high: '高阶',
  peak: '巅峰',
} as const;

function gu(id: string, name = '月光蛊', tier = 5): GuInstance {
  return {
    id,
    specId: id,
    name,
    tier,
    path: '月道',
    currentState: 'optimal',
    hungerCounter: 0,
    proficiency: 80,
    bonded: true,
    active: true,
    acquiredAt: { turn: 1, narrative: 'test' },
  };
}

function mortalAperture(rank = 5, subRank: '初阶' | '中阶' | '高阶' | '巅峰' = SUB.peak) {
  return {
    type: 'mortal',
    rank,
    subRank,
    primevalSea: { color: '#d8b94a', colorName: '黄金', fillPercent: 96 },
    apertureWall: { state: '潮汐涌动', opacity: 0.7, description: 'test' },
    capacity: 15,
    carriedGu: 4,
    capacityLocked: false,
  };
}

function immortalAperture(): ImmortalAperture {
  const resourceNodes: ResourceNode[] = [
    { id: 'node_fire', type: '炎道', name: '火脉灵田', output_rate: 3, quality: 80, grade: '仙材', active: true },
    { id: 'node_wood', type: '木道', name: '青木药圃', output_rate: 2, quality: 70, grade: '精品', active: true },
  ];
  return {
    type: '福地',
    grade: '中等福地',
    area_mu: 520,
    time_flow_ratio: 18,
    resource_nodes: resourceNodes,
    dao_mark_density: { 炎道: 70, 木道: 40, 气道: 120 },
    next_disaster_type: '地火',
    disaster_countdown: 6,
  };
}

function createHarness(overrides: Record<string, any> = {}) {
  let state: any = {
    turn: 8,
    currentDomain: '南疆',
    currentChapterId: 'test_safe_scene',
    gameTime: { period: 'night', day: 3, month: 6, year: 1, season: 'summer', ap: 3, max_ap: 3 },
    profile: { name: '测试蛊师', realm: { grand: 5, sub: SUB.peak, label: '五转巅峰' } },
    attributes: { 资质: 10, 体魄: 9, 心智: 9, 气运: 8 },
    vitals: {
      health: { current: 240, max: 240 },
      essence: { current: 180, max: 180 },
      essenceType: 'primeval',
    },
    pathBuild: { primary: '气道', dao_marks: { 气道: 260, 炎道: 80, 木道: 40 } },
    flags: { cultivationProgress: 180, completedFamousScenes: { sanwangshan: true } },
    inventory: [gu('moon'), gu('stone', '石皮蛊', 4), gu('heal', '治愈蛊', 4)],
    apertureInventory: { gu: [], materials: {}, immortalMaterials: {} },
    killMoves: [{ name: '月刃连斩' }, { name: '酒虫精炼阵' }],
    aperture: mortalAperture(),
    heavenlyLand: null,
    gameLog: [],
    ...overrides,
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state.spendAp = vi.fn((amount: number) => {
    if (state.gameTime.ap < amount) return false;
    state.gameTime = { ...state.gameTime, ap: state.gameTime.ap - amount };
    return true;
  });
  state.advanceTurn = vi.fn(() => {
    state.turn += 1;
  });
  state.addGameLog = vi.fn((category: string, message: string, meta: any) => {
    state.gameLog = [...state.gameLog, { category, message, meta }];
  });
  state.applyHpPercent = vi.fn((delta: number) => {
    const health = state.vitals.health;
    const change = Math.round(health.max * delta / 100);
    state.vitals = {
      ...state.vitals,
      health: { ...health, current: Math.max(0, Math.min(health.max, health.current + change)) },
    };
  });
  state.applyStateUpdate = vi.fn((update: any) => {
    const label = update?.realm?.value;
    if (label) {
      const grandMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
      const match = String(label).match(/^([一二三四五六七八九])转(初阶|中阶|高阶|巅峰)$/);
      if (match) {
        state.profile = { ...state.profile, realm: { grand: grandMap[match[1]], sub: match[2], label } };
      }
    }
  });
  state.initializeAperture = vi.fn((aperture: ImmortalAperture) => {
    state.aperture = aperture;
  });
  state.migrateToApertureStorage = vi.fn(() => {
    state.apertureInventory = { ...state.apertureInventory, gu: [...state.inventory] };
  });
  const seededCultivationState = state.cultivationState;
  state = { ...state, ...createCultivationSlice(set, get) };
  if (seededCultivationState) {
    state.cultivationState = seededCultivationState;
  }
  return { get: () => state };
}

describe('v0.8.0-b2 cultivation store slice', () => {
  it('migrates v15 saves to v16 cultivation state defaults', () => {
    const migrated = migrateSave({
      formatVersion: 15,
      timestamp: 'test',
      state: {
        profile: { name: '旧档', realm: { grand: 2, sub: SUB.middle, label: '二转中阶' } },
        flags: { cultivationProgress: 77 },
      },
    } as any);

    expect(migrated.formatVersion).toBe(SAVE_FORMAT_VERSION);
    expect((migrated.state as any).cultivationState.version).toBe('v0.8.0-b2');
    expect((migrated.state as any).cultivationState.progress).toBe(77);
  });

  it('previews and practices cultivation through the new persistent state', () => {
    const harness = createHarness({
      profile: { name: '二转测试', realm: { grand: 2, sub: SUB.middle, label: '二转中阶' } },
      aperture: mortalAperture(2, SUB.middle),
      cultivationState: createDefaultCultivationState({ progress: 40 }),
      flags: { cultivationProgress: 40 },
    });
    const beforeEssence = harness.get().vitals.essence.current;

    const preview = harness.get().previewCultivationDeepening('safe');
    expect(preview.environment.safety).toBe('secure');
    expect(preview.breakthrough.requiredProgress).toBeGreaterThan(0);

    const result = harness.get().practiceCultivationDeep('safe');
    expect(result.success).toBe(true);
    expect(harness.get().cultivationState.progress).toBeGreaterThan(40);
    expect(harness.get().flags.cultivationProgress).toBe(harness.get().cultivationState.progress);
    expect(harness.get().vitals.essence.current).toBeLessThan(beforeEssence);
    expect(harness.get().gameTime.ap).toBe(2);
    expect(harness.get().addGameLog).toHaveBeenCalled();

    const legacyResult = harness.get().practiceCultivation();
    expect(legacyResult.success).toBe(true);
    expect(harness.get().cultivationState.lastResolution.length).toBeGreaterThan(0);
  });

  it('keeps the old breakthrough button compatible while writing breakthrough history', () => {
    const harness = createHarness({
      profile: { name: '一转测试', realm: { grand: 1, sub: SUB.initial, label: '一转初阶' } },
      aperture: mortalAperture(1, SUB.initial),
      vitals: { health: { current: 120, max: 120 }, essence: { current: 100, max: 100 }, essenceType: 'primeval' },
      cultivationState: createDefaultCultivationState({ progress: 120 }),
      flags: { cultivationProgress: 120 },
    });
    const beforeEssence = harness.get().vitals.essence.current;

    const result = harness.get().attemptBreakthrough();
    expect(typeof result.success).toBe('boolean');
    expect(result.rate).toBeGreaterThan(0);
    expect(harness.get().cultivationState.breakthroughHistory.length).toBe(1);
    expect(harness.get().vitals.essence.current).toBeLessThan(beforeEssence);
    expect(harness.get().gameTime.ap).toBe(2);
  });

  it('can locally resolve rank five ascension into blessed land without direct AI realm writes', () => {
    let successfulHarness: ReturnType<typeof createHarness> | null = null;
    let actionResult: any = null;

    for (let turn = 1; turn <= 80; turn += 1) {
      const harness = createHarness({
        turn,
        cultivationState: createDefaultCultivationState({
          progress: 210,
          ascension: {
            threeQi: { human: 90, earth: 90, heaven: 90 },
            preparationScore: 90,
            heavenWillPressure: 0,
            karmicDebt: 0,
          },
        }),
        flags: { cultivationProgress: 210, completedFamousScenes: { sanwangshan: true } },
      });
      const result = harness.get().attemptAscension();
      if (result.success) {
        successfulHarness = harness;
        actionResult = result;
        break;
      }
    }

    expect(actionResult?.success).toBe(true);
    expect(successfulHarness?.get().profile.realm.grand).toBe(6);
    expect(successfulHarness?.get().aperture.type).toBe('福地');
    expect(successfulHarness?.get().heavenlyLand.type).toBe('福地');
    expect(successfulHarness?.get().vitals.essenceType).toBe('immortal');
    expect(successfulHarness?.get().initializeAperture).toHaveBeenCalled();
    expect(successfulHarness?.get().migrateToApertureStorage).toHaveBeenCalled();
  });

  it('resolves blessed-land calamity consequences through local b2 action', () => {
    const aperture = immortalAperture();
    const harness = createHarness({
      profile: { name: '六转测试', realm: { grand: 6, sub: SUB.initial, label: '六转初阶' } },
      vitals: { health: { current: 320, max: 320 }, essence: { current: 1200, max: 1200 }, essenceType: 'immortal' },
      aperture,
      heavenlyLand: {
        id: 'land_test',
        type: '福地',
        domain: '南疆',
        name: '测试福地',
        areaMu: aperture.area_mu,
        timeFlowRatio: aperture.time_flow_ratio,
        resourceOutputRate: 24,
        earthSpirit: { formed: false, approval: 0 },
        disasterCountdown: aperture.disaster_countdown,
        nextDisasterType: aperture.next_disaster_type,
        createdAt: 1,
        accessible: true,
      },
      cultivationState: createDefaultCultivationState(),
      flags: {},
    });

    const result = harness.get().resolveApertureCalamity();
    expect(result.success).toBe(true);
    expect(harness.get().aperture.area_mu).toBeLessThan(aperture.area_mu);
    expect(harness.get().heavenlyLand.areaMu).toBe(harness.get().aperture.area_mu);
    expect(harness.get().cultivationState.calamityLedger.length).toBe(1);
    expect(harness.get().gameTime.ap).toBe(2);
    expect(harness.get().gameLog.some((entry: any) => entry.category === 'danger')).toBe(true);
  });

  it('stages immortal calamity as narrative scene before local consequence settlement', () => {
    const aperture = immortalAperture();
    const harness = createHarness({
      turn: 24,
      profile: { name: '七转测试', realm: { grand: 7, sub: SUB.peak, label: '七转巅峰' } },
      vitals: { health: { current: 2520, max: 2520 }, essence: { current: 2000, max: 2000 }, essenceType: 'immortal' },
      aperture,
      heavenlyLand: {
        id: 'land_rank7',
        type: '福地',
        domain: '中洲',
        name: '七转测试福地',
        areaMu: aperture.area_mu,
        timeFlowRatio: aperture.time_flow_ratio,
        resourceOutputRate: 24,
        earthSpirit: { formed: false, approval: 0 },
        disasterCountdown: aperture.disaster_countdown,
        nextDisasterType: aperture.next_disaster_type,
        createdAt: 1,
        accessible: true,
      },
      cultivationState: createDefaultCultivationState(),
      flags: {},
      sceneSessionState: {
        sceneId: 'immortal_aperture_calamity',
        budget: { remainingAp: 2, maxAp: 3, spentAp: 1 },
        localActionLedger: [],
      },
    });
    harness.get().spendSceneAp = vi.fn((
      amount: number,
      actionType: string,
      summary: string,
      source: string,
      systemResult: Record<string, unknown> = {},
      risks: string[] = [],
    ) => {
      const scene = harness.get().sceneSessionState;
      if (scene.budget.remainingAp < amount) return { success: false };
      const entry = {
        id: `ledger_${source}`,
        turn: harness.get().turn,
        sceneId: scene.sceneId,
        actionType,
        cost: amount,
        summary,
        source,
        systemResult,
        risks,
      };
      harness.get().sceneSessionState = {
        ...scene,
        budget: {
          ...scene.budget,
          remainingAp: scene.budget.remainingAp - amount,
          spentAp: scene.budget.spentAp + amount,
        },
        localActionLedger: [...scene.localActionLedger, entry],
      };
      return { success: true, entry };
    });

    const result = harness.get().stageCalamityScene();

    expect(result.success).toBe(true);
    expect(result.spec?.realmGrand).toBe(7);
    expect(result.spec?.sceneId).toBe('immortal_aperture_calamity');
    expect(harness.get().flags.pendingCalamitySceneSpec.kind).toBeTruthy();
    expect(harness.get().cultivationState.calamityLedger.length).toBe(0);
    expect(harness.get().cultivationState.lastResolution[0].kind).toBe('calamity_warning');
    expect(harness.get().sceneSessionState.budget.remainingAp).toBe(1);
    expect(harness.get().sceneSessionState.localActionLedger[0].source).toBe(`calamity:${result.spec?.id}:omen`);
    expect(harness.get().sceneSessionState.localActionLedger[0].systemResult.worldAction.domain).toBe('calamity');
    expect(harness.get().flags.lastWorldActionReturnContext.promptSummary).toContain('灾劫预兆');
    expect(harness.get().flags.lastCalamityWorldAction.resolution.status).toBe('pending_narrative');
    expect(harness.get().spendSceneAp).toHaveBeenCalledWith(
      1,
      'calamity',
      expect.stringContaining('灾劫预兆入场'),
      `calamity:${result.spec?.id}:omen`,
      expect.objectContaining({
        worldAction: expect.objectContaining({
          domain: 'calamity',
          status: 'pending_narrative',
        }),
      }),
      expect.arrayContaining([expect.stringContaining('本地引擎结算')]),
    );
  });

  it('reuses staged calamity AP when settling local consequences', () => {
    const aperture = immortalAperture();
    const harness = createHarness({
      turn: 25,
      profile: { name: '七转测试', realm: { grand: 7, sub: SUB.peak, label: '七转巅峰' } },
      vitals: { health: { current: 2520, max: 2520 }, essence: { current: 2000, max: 2000 }, essenceType: 'immortal' },
      aperture,
      heavenlyLand: {
        id: 'land_rank7',
        type: '福地',
        domain: '中洲',
        name: '七转测试福地',
        areaMu: aperture.area_mu,
        timeFlowRatio: aperture.time_flow_ratio,
        resourceOutputRate: 24,
        earthSpirit: { formed: false, approval: 0 },
        disasterCountdown: aperture.disaster_countdown,
        nextDisasterType: aperture.next_disaster_type,
        createdAt: 1,
        accessible: true,
      },
      cultivationState: createDefaultCultivationState(),
      flags: {},
      sceneSessionState: {
        sceneId: 'immortal_aperture_calamity',
        budget: { remainingAp: 2, maxAp: 3, spentAp: 1 },
        localActionLedger: [],
      },
    });
    harness.get().spendSceneAp = vi.fn((
      amount: number,
      actionType: string,
      summary: string,
      source: string,
      systemResult: Record<string, unknown> = {},
      risks: string[] = [],
    ) => {
      const scene = harness.get().sceneSessionState;
      if (scene.budget.remainingAp < amount) return { success: false };
      const entry = {
        id: `ledger_${source}`,
        turn: harness.get().turn,
        sceneId: scene.sceneId,
        actionType,
        cost: amount,
        summary,
        source,
        systemResult,
        risks,
      };
      harness.get().sceneSessionState = {
        ...scene,
        budget: {
          ...scene.budget,
          remainingAp: scene.budget.remainingAp - amount,
          spentAp: scene.budget.spentAp + amount,
        },
        localActionLedger: [...scene.localActionLedger, entry],
      };
      return { success: true, entry };
    });

    const staged = harness.get().stageCalamityScene();
    const settled = harness.get().resolveApertureCalamity();

    expect(staged.success).toBe(true);
    expect(settled.success).toBe(true);
    expect(harness.get().spendSceneAp).toHaveBeenCalledTimes(1);
    expect(harness.get().sceneSessionState.budget.remainingAp).toBe(1);
    expect(harness.get().sceneSessionState.localActionLedger).toHaveLength(1);
    expect(harness.get().flags.pendingCalamitySceneSpec).toBeNull();
    expect(harness.get().flags.lastWorldActionReturnContext.promptSummary).toContain('灾劫后果由本地引擎结算');
    expect(harness.get().flags.lastCalamityWorldAction.resolution.status).toBe('resolved');
    expect(harness.get().cultivationState.calamityLedger.length).toBe(1);
  });
});
