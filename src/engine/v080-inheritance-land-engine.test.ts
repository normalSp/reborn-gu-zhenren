import { describe, expect, it, vi } from 'vitest';
import anchorRegistryRaw from '../canon/canon-anchor-registry.json';
import pathRegistryRaw from '../canon/path-registry.json';
import rulesRaw from '../canon/v080-inheritance-land-rules.json';
import {
  createDefaultInheritanceLandState,
  evaluateInheritanceEntry,
  evaluateLandClaimEntry,
  formatInheritanceContextForPrompt,
  listInheritanceSiteSpecs,
  normalizeInheritanceLandState,
  resolveInheritanceTrialAction,
  resolveLandClaimAttempt,
  stageInheritanceCandidate,
} from './v080-inheritance-land-engine';

const anchorIds = new Set((anchorRegistryRaw as any).anchors.map((anchor: any) => anchor.id));
const runtimePaths = new Set(
  (pathRegistryRaw as any).paths
    .filter((path: any) => path.runtimeAllowed === true)
    .map((path: any) => path.id),
);

function store(overrides: Record<string, any> = {}) {
  return {
    turn: 25,
    currentChapterId: 'qingmao_mountain',
    currentDomain: '南疆',
    profile: { name: '测试蛊师', realm: { grand: 5, sub: '巅峰', label: '五转巅峰' } },
    gameTime: { ap: 3, max_ap: 3, period: 'night', day: 1, month: 1, year: 1, season: 'spring' },
    sceneSessionState: {
      sceneId: 'scene_inheritance_test',
      actionBudget: { maxAp: 3, remainingAp: 3, grantedBy: 'narrative_scene', exhaustedPolicy: 'advance_narrative' },
      localActionLedger: [],
    },
    storyAnchorState: { heavenWillLedger: { rejection: 0 } },
    cultivationState: { ascension: { heavenWillPressure: 0 } },
    ...overrides,
  };
}

describe('v0.8.0-c2.5 inheritance/land canon rules', () => {
  it('keeps sites, anchors, paths, and forbidden rewards registered', () => {
    expect((rulesRaw as any)._meta.version).toBe('v0.8.0-c2.5');
    const sites = listInheritanceSiteSpecs();
    expect(sites.map(site => site.siteId)).toEqual(expect.arrayContaining([
      'minor_cave_inheritance',
      'three_kings_side_branch',
      'unclaimed_blessed_land_seed',
      'grotto_heaven_boundary_rumor',
    ]));

    for (const site of sites) {
      if (site.anchorId) expect(anchorIds.has(site.anchorId), `${site.siteId} anchor should be registered`).toBe(true);
      for (const path of site.pathTags) {
        expect(runtimePaths.has(path), `${site.siteId}/${path} should be a runtime path`).toBe(true);
      }
      for (const reward of site.rewardPreview) {
        if (reward.kind !== 'rumor') expect(reward.registered, `${site.siteId}/${reward.name} should be registered`).toBe(true);
        expect(String(reward.name)).not.toContain('永生蛊');
        expect(String(reward.name)).not.toContain('十转');
        expect(String(reward.name)).not.toContain('宿命蛊');
      }
    }
  });
});

describe('v0.8.0-c2.5 inheritance/land engine', () => {
  it('normalizes persistent state and stages minor inheritance candidates', () => {
    const normalized = normalizeInheritanceLandState({ candidates: [{ siteId: 'minor_cave_inheritance', title: '旧洞府' }] as any });
    expect(normalized.version).toBe('v0.8.0-c2.5');
    expect(normalized.candidates[0].siteId).toBe('minor_cave_inheritance');

    const staged = stageInheritanceCandidate(createDefaultInheritanceLandState(), {
      siteId: 'minor_cave_inheritance',
      title: '山腹小传承',
      summary: '石门后有凡蛊与残方碎片。',
      risk: 'medium',
    }, store({ profile: { realm: { grand: 3, sub: '中阶', label: '三转中阶' } } }));
    expect(staged.validation.valid).toBe(true);
    expect(staged.state.candidates[0].status).toBe('candidate');
    expect(staged.steps[0].kind).toBe('candidate');
  });

  it('blocks realm overflow, forbidden claims, and unknown rewards', () => {
    const mortalOverflow = evaluateInheritanceEntry({
      siteId: 'minor_cave_inheritance',
      title: '过期凡人传承',
      summary: '六转还想刷凡人小洞府。',
    }, store({ profile: { realm: { grand: 6, sub: '初阶', label: '六转初阶' } } }));
    expect(mortalOverflow.valid).toBe(false);
    expect(mortalOverflow.blockers.join('\n')).toContain('最高5转');

    const forbidden = evaluateInheritanceEntry({
      siteId: 'three_kings_side_branch',
      title: '夺取定仙游',
      summary: '玩家直接获得仙蛊并改写三王传承核心归属。',
      rewardPreview: [{ kind: 'immortal_gu', name: '定仙游', registered: false }],
    } as any, store());
    expect(forbidden.valid).toBe(false);
    expect(forbidden.candidate?.status).toBe('blocked');
    expect(forbidden.blockers.join('\n')).toMatch(/运行时禁区|仙蛊奖励|未授权仙蛊/);
  });

  it('resolves trials with seeded RNG and never calls Math.random', () => {
    const staged = stageInheritanceCandidate(createDefaultInheritanceLandState(), {
      siteId: 'minor_cave_inheritance',
      title: '月道洞府',
      summary: '需要破开石门禁制。',
    }, store({ profile: { realm: { grand: 4, sub: '高阶', label: '四转高阶' } } }));
    const candidateId = staged.state.candidates[0].id;

    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used by c2.5 inheritance engine');
    });
    const first = resolveInheritanceTrialAction({ state: staged.state, candidateId, store: store(), seed: 'trial-fixed' });
    const second = resolveInheritanceTrialAction({ state: staged.state, candidateId, store: store(), seed: 'trial-fixed' });
    randomSpy.mockRestore();

    expect(second.steps).toEqual(first.steps);
    expect(first.steps.map(step => step.kind)).toContain('trial');
    expect(first.steps.map(step => step.kind)).toContain('settlement');
  });

  it('allows Three Kings side branch pressure without rewriting the canon core', () => {
    const staged = stageInheritanceCandidate(createDefaultInheritanceLandState(), {
      siteId: 'three_kings_side_branch',
      title: '三王旁支兽群试炼',
      summary: '只争夺旁支资源和线索，不触碰主线归属。',
      risk: 'high',
    }, store());
    expect(staged.validation.valid).toBe(true);
    expect(staged.validation.warnings.join('\n')).toContain('旁支');

    const resolved = resolveInheritanceTrialAction({
      state: staged.state,
      candidateId: staged.state.candidates[0].id,
      store: store(),
      seed: 'three-kings-side',
    });
    expect(resolved.combatCandidate?.scale).toBe('group_5x3');
    expect(resolved.steps.some(step => step.kind === 'anchor_pressure')).toBe(resolved.success);
  });

  it('gates blessed land claim to rank six plus local terms', () => {
    const rankFive = stageInheritanceCandidate(createDefaultInheritanceLandState(), {
      siteId: 'unclaimed_blessed_land_seed',
      title: '待认主福地',
      summary: '地灵提出执念条款。',
      claimIntent: true,
    }, store());
    expect(rankFive.validation.valid).toBe(false);
    expect(rankFive.validation.blockers.join('\n')).toContain('至少需要6转');

    const immortalStore = store({ profile: { realm: { grand: 6, sub: '初阶', label: '六转初阶' } } });
    const staged = stageInheritanceCandidate(createDefaultInheritanceLandState(), {
      siteId: 'unclaimed_blessed_land_seed',
      title: '玉苔待认主福地',
      summary: '地灵要求守护核心资源节点。',
      claimIntent: true,
    }, immortalStore);
    const candidateId = staged.state.candidates[0].id;
    const validation = evaluateLandClaimEntry(staged.state, candidateId, immortalStore);
    expect(validation.valid).toBe(true);
    expect(validation.terms.length).toBeGreaterThanOrEqual(3);

    const result = resolveLandClaimAttempt({ state: staged.state, candidateId, store: immortalStore, seed: 'land-claim-fixed' });
    expect(result.attempt.outcome).toMatch(/success|failure/);
    if (result.success) {
      expect(result.heavenlyLand?.type).toBe('福地');
      expect(result.heavenlyLand?.name).toContain('福地');
      expect(result.heavenlyLand?.nextDisasterType).toBeTruthy();
    }
  });

  it('keeps grotto-heaven entries as boundary rumors only', () => {
    const staged = stageInheritanceCandidate(createDefaultInheritanceLandState(), {
      siteId: 'grotto_heaven_boundary_rumor',
      title: '洞天边界传闻',
      summary: '只能记录洞天边界和天意排斥。',
    }, store({ profile: { realm: { grand: 8, sub: '高阶', label: '八转高阶' } } }));
    expect(staged.validation.valid).toBe(false);
    expect(staged.validation.downgradedTo).toBe('boundary_rumor');
    expect(staged.state.candidates[0].status).toBe('rumor');

    const trial = resolveInheritanceTrialAction({
      state: staged.state,
      candidateId: staged.state.candidates[0].id,
      store: store({ profile: { realm: { grand: 8, sub: '高阶', label: '八转高阶' } } }),
      seed: 'grotto',
    });
    expect(trial.success).toBe(false);
    expect(trial.steps[0].kind).toBe('rumor');
  });

  it('formats prompt context with local boundaries', () => {
    const staged = stageInheritanceCandidate(createDefaultInheritanceLandState(), {
      siteId: 'unclaimed_blessed_land_seed',
      title: '地灵残愿',
      summary: '等待剧情场景承接。',
      claimIntent: true,
    }, store({ profile: { realm: { grand: 6, sub: '初阶', label: '六转初阶' } } }));
    const prompt = formatInheritanceContextForPrompt(staged.state);
    expect(prompt).toContain('inheritance_land_candidates.add');
    expect(prompt).toContain('奖励、认主、资源节点、归属全部由本地引擎结算');
    expect(prompt).toContain('地灵残愿');
  });
});
