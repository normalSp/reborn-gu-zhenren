import { describe, expect, it, vi } from 'vitest';
import rulesRaw from '../canon/v080-cultivation-calamity-rules.json';
import pathRegistryRaw from '../canon/path-registry.json';
import type { CultivationDeepeningState, GuInstance, ImmortalAperture, ResourceNode } from '../types';
import {
  buildCalamityPreview,
  buildCultivationEnvironmentProfile,
  createDefaultCultivationState,
  normalizeCultivationState,
  resolveAscensionAttempt,
  resolveCalamityConsequence,
  resolveCultivationSession,
  resolveMajorBreakthroughAttempt,
  validateAscensionAttempt,
  validateMajorBreakthroughAttempt,
} from './v080-cultivation-calamity-engine';

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
    primevalSea: { color: '#8f6', colorName: '黄金', fillPercent: 96 },
    apertureWall: { state: '潮汐涌动', opacity: 0.7, description: 'test' },
    capacity: 15,
    carriedGu: 4,
    capacityLocked: false,
  };
}

function immortalAperture(): ImmortalAperture {
  const nodes: ResourceNode[] = [
    { id: 'node_fire', type: '炎道', name: '火脉灵田', output_rate: 3, quality: 80, grade: '仙材', active: true },
    { id: 'node_wood', type: '木道', name: '青木药圃', output_rate: 2, quality: 70, grade: '精品', active: true },
    { id: 'node_qi', type: '气道', name: '三气回旋口', output_rate: 2, quality: 68, grade: '仙材', active: true },
  ];
  return {
    type: '福地',
    grade: '中等福地',
    area_mu: 520,
    time_flow_ratio: 18,
    resource_nodes: nodes,
    dao_mark_density: { 炎道: 70, 木道: 40, 气道: 120 },
    next_disaster_type: '地火',
    disaster_countdown: 6,
  };
}

function baseStore(overrides: Record<string, any> = {}) {
  const profile = overrides.profile ?? { name: '测试蛊师', realm: { grand: 5, sub: SUB.peak, label: '五转巅峰' } };
  return {
    turn: 12,
    currentDomain: '南疆',
    currentChapterId: 'test_safe_scene',
    gameTime: { period: 'night', day: 3, month: 6, year: 1, season: 'summer', ap: 3, max_ap: 3 },
    profile,
    attributes: { 资质: 10, 体魄: 9, 心智: 9, 气运: 8 },
    vitals: {
      health: { current: 240, max: 240 },
      essence: { current: 180, max: 180 },
      essenceType: 'primeval',
    },
    pathBuild: { primary: '气道', dao_marks: { 气道: 260, 炎道: 80, 木道: 40 } },
    flags: { cultivationProgress: 180, completedFamousScenes: { sanwangshan: true } },
    inventory: [gu('moon'), gu('stone', '石皮蛊', 4), gu('heal', '治愈蛊', 4)],
    killMoves: [{ name: '月刃连斩' }, { name: '酒虫精炼阵' }],
    aperture: mortalAperture(profile.realm.grand, profile.realm.sub),
    ...overrides,
  };
}

function findAscension(seedPrefix: string, wantSuccess: boolean, state: CultivationDeepeningState, store: any) {
  for (let i = 0; i < 80; i += 1) {
    const result = resolveAscensionAttempt({ store, state, seed: `${seedPrefix}:${i}`, turn: i + 1 });
    if (result.success === wantSuccess) return result;
  }
  return null;
}

describe('v0.8.0-b2 cultivation calamity engine', () => {
  it('keeps cultivation rules on registered paths and fixed calamity enums', () => {
    const allowedPaths = new Set(
      (pathRegistryRaw.paths || [])
        .filter((path: any) => path.runtimeAllowed === true)
        .map((path: any) => path.id),
    );
    const categories = new Set(['earth_calamity', 'heavenly_tribulation']);
    const consequenceTags = new Set([
      'progress_gain',
      'resource_spend',
      'realm_change',
      'injury',
      'essence_shock',
      'gu_damage',
      'aperture_pressure',
      'dao_mark_shift',
      'calamity_warning',
      'calamity_consequence',
      'failure',
      'settlement',
    ]);

    for (const calamity of rulesRaw.calamities) {
      expect(allowedPaths.has(calamity.path), `${calamity.id} path should be registered`).toBe(true);
      expect(categories.has(calamity.category), `${calamity.id} category should be fixed`).toBe(true);
      for (const pathName of Object.keys(calamity.daoMarkDelta || {})) {
        expect(allowedPaths.has(pathName), `${calamity.id} dao mark path should be registered`).toBe(true);
      }
    }
    expect(rulesRaw.consequenceTags.every(tag => consequenceTags.has(tag))).toBe(true);
  });

  it('normalizes v16 state and applies time, location, and safety modifiers', () => {
    const normalized = normalizeCultivationState({ progress: 999, ascension: { threeQi: { human: 200, earth: -1, heaven: 50 } as any } });
    expect(normalized.version).toBe('v0.8.0-b2');
    expect(normalized.progress).toBe(rulesRaw.cultivation.progressOverflowCap);
    expect(normalized.ascension.threeQi.human).toBe(100);
    expect(normalized.ascension.threeQi.earth).toBe(0);

    const safe = buildCultivationEnvironmentProfile({ period: 'morning', location: 'safe' });
    const wild = buildCultivationEnvironmentProfile({ period: 'night', location: 'wild' });
    expect(safe.safety).toBe('secure');
    expect(wild.safety).toBe('dangerous');
    expect(wild.progressMultiplier).toBeGreaterThan(safe.progressMultiplier);
    expect(wild.warnings.length).toBeGreaterThan(0);
  });

  it('resolves cultivation progress with essence spend and deterministic output', () => {
    const store = baseStore({ profile: { name: '二转测试', realm: { grand: 2, sub: SUB.middle, label: '二转中阶' } } });
    const state = createDefaultCultivationState({ progress: 40 });
    const first = resolveCultivationSession({ store, state, period: 'night', location: 'wild', turn: 9 });
    const second = resolveCultivationSession({ store, state, period: 'night', location: 'wild', turn: 9 });

    expect(first.success).toBe(true);
    expect(first.progressGain).toBeGreaterThan(0);
    expect(first.essenceCost).toBeGreaterThan(0);
    expect(first.state.progress).toBeGreaterThan(state.progress);
    expect(first.steps.map(step => step.kind)).toEqual(expect.arrayContaining(['environment', 'resource_spend', 'progress_gain']));
    expect(second.steps).toEqual(first.steps);

    const blocked = resolveCultivationSession({
      store: baseStore({ vitals: { health: { current: 100, max: 100 }, essence: { current: 0, max: 80 }, essenceType: 'primeval' } }),
      state,
    });
    expect(blocked.success).toBe(false);
    expect(blocked.blockedReason).toBe('essence_insufficient');
  });

  it('validates and resolves major breakthroughs with local deterministic backlash', () => {
    const store = baseStore({
      profile: { name: '一转测试', realm: { grand: 1, sub: SUB.initial, label: '一转初阶' } },
      aperture: mortalAperture(1, SUB.initial),
      vitals: { health: { current: 100, max: 100 }, essence: { current: 100, max: 100 }, essenceType: 'primeval' },
    });
    const state = createDefaultCultivationState({ progress: 120 });
    const validation = validateMajorBreakthroughAttempt({ store, state });
    expect(validation.valid).toBe(true);
    expect(validation.targetRealm?.sub).toBe(SUB.middle);

    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used by b2 cultivation engine');
    });
    const deterministicA = resolveMajorBreakthroughAttempt({ store, state, seed: 'bt-fixed', turn: 2 });
    const deterministicB = resolveMajorBreakthroughAttempt({ store, state, seed: 'bt-fixed', turn: 2 });
    expect(deterministicB.steps).toEqual(deterministicA.steps);

    let failure: ReturnType<typeof resolveMajorBreakthroughAttempt> | null = null;
    const lowOddsStore = baseStore({
      profile: { name: '低资质测试', realm: { grand: 4, sub: SUB.peak, label: '四转巅峰' } },
      attributes: { 资质: 1, 体魄: 4, 心智: 1, 气运: 3 },
      aperture: { ...mortalAperture(4, SUB.peak), extremePhysiqueType: '北冥冰魄体', capacityLocked: true },
      vitals: { health: { current: 90, max: 120 }, essence: { current: 120, max: 120 }, essenceType: 'primeval' },
    });
    const lowState = createDefaultCultivationState({ progress: 150 });
    for (let i = 0; i < 80; i += 1) {
      const result = resolveMajorBreakthroughAttempt({ store: lowOddsStore, state: lowState, seed: `bt-fail:${i}`, turn: i + 3 });
      if (!result.success && result.penalties?.length) {
        failure = result;
        break;
      }
    }
    randomSpy.mockRestore();

    expect(failure).toBeTruthy();
    expect(failure?.record.outcome).toBe('failure');
    expect(failure?.steps.some(step => ['injury', 'essence_shock', 'gu_damage', 'aperture_pressure'].includes(step.kind))).toBe(true);
  });

  it('validates ascension, creates only blessed land on success, and records failure pressure', () => {
    const store = baseStore();
    const state = createDefaultCultivationState({
      progress: 210,
      ascension: {
        threeQi: { human: 90, earth: 90, heaven: 90 },
        preparationScore: 90,
        heavenWillPressure: 0,
        karmicDebt: 0,
      },
    });
    const validation = validateAscensionAttempt({ store, state });
    expect(validation.valid).toBe(true);
    expect(validation.threeQi.human).toBeGreaterThanOrEqual(45);

    const success = findAscension('asc-success', true, state, store);
    expect(success).toBeTruthy();
    expect(success?.realmAfter?.grand).toBe(6);
    expect(success?.aperture?.type).toBe('福地');
    expect(success?.heavenlyLand?.type).toBe('福地');
    expect(success?.aperture?.type).not.toBe('洞天');
    expect(success?.steps.map(step => step.kind)).toEqual(expect.arrayContaining(['resource_spend', 'realm_change', 'settlement']));

    const pressureState = createDefaultCultivationState({
      progress: 180,
      ascension: {
        threeQi: { human: 80, earth: 80, heaven: 80 },
        preparationScore: 80,
        heavenWillPressure: 100,
        karmicDebt: 20,
      },
    });
    const failure = findAscension('asc-failure', false, pressureState, store);
    expect(failure).toBeTruthy();
    expect(failure?.state.ascension.heavenWillPressure).toBeGreaterThanOrEqual(pressureState.ascension.heavenWillPressure);
    expect(failure?.state.ascension.karmicDebt).toBeGreaterThan(pressureState.ascension.karmicDebt);
    expect(failure?.steps.map(step => step.kind)).toEqual(expect.arrayContaining(['injury', 'essence_shock', 'aperture_pressure']));
  });

  it('previews and resolves blessed-land calamity consequences deterministically', () => {
    const aperture = immortalAperture();
    const store = baseStore({
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
      inventory: [gu('moon'), gu('guard', '金钟蛊', 5)],
    });
    const state = createDefaultCultivationState();
    const preview = buildCalamityPreview({ store, state, turn: 20 });
    expect(preview?.name).toBe(aperture.next_disaster_type);
    expect(preview?.affectedResourceNodeIds.length).toBeGreaterThan(0);

    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used by b2 calamity engine');
    });
    const first = resolveCalamityConsequence({ store, state, seed: 'cal-fixed', turn: 20 });
    const second = resolveCalamityConsequence({ store, state, seed: 'cal-fixed', turn: 20 });
    randomSpy.mockRestore();

    expect(first.success).toBe(true);
    expect(second.steps).toEqual(first.steps);
    expect(first.aperture?.area_mu).toBeLessThan(aperture.area_mu);
    expect(first.record?.daoMarkDelta).toBeTruthy();
    expect(Object.keys(first.record?.resourceNodeDamage || {}).length).toBeGreaterThan(0);
    expect(first.steps.map(step => step.kind)).toEqual(expect.arrayContaining(['calamity_warning', 'calamity_consequence', 'dao_mark_shift', 'settlement']));
  });
});
