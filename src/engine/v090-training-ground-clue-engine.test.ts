import { describe, expect, it, vi } from 'vitest';
import {
  createDefaultTrainingGroundState,
  evaluateTrainingGroundEntry,
  listTrainingGroundEntries,
  resolveTrainingGroundAction,
  stageTrainingGroundCandidate,
} from './v090-training-ground-clue-engine';

function store(overrides: Record<string, any> = {}) {
  return {
    turn: 12,
    currentChapterId: 'qingmaoshan',
    currentDomain: '南疆',
    profile: { realm: { grand: 2, sub: '中阶', label: '二转中阶' } },
    attributes: { 资质: 8 },
    pathBuild: { primary: '炼道', secondary: [], dao_marks: {} },
    currency: 1000,
    immortalCurrency: 0,
    flags: {},
    sceneSessionState: {
      actionBudget: { remaining: 3, max: 3, spent: 0 },
      localActionLedger: [],
    },
    ...overrides,
  };
}

describe('v0.9.0-a2 training ground clue engine', () => {
  it('registers a legal clue and exposes a readable entry', () => {
    const staged = stageTrainingGroundCandidate(createDefaultTrainingGroundState(), {
      groundId: 'tg_nanjiang_refine',
      title: '青茅山炼蛊台竹牌',
      summary: '执事给出竹牌，只能登记线索，不能直接派奖励。',
      source: 'ai-rumor',
      locationHint: '青茅山',
    }, store());

    expect(staged.validation.valid).toBe(true);
    expect(staged.state.clues).toHaveLength(1);

    const entries = listTrainingGroundEntries(staged.state, store());
    expect(entries).toHaveLength(1);
    expect(entries[0].canEnter).toBe(true);
    expect(entries[0].actionKind).toBe('train');
  });

  it('blocks unknown grounds and forbidden runtime rewards as rumors or blocked clues', () => {
    const unknown = stageTrainingGroundCandidate(createDefaultTrainingGroundState(), {
      groundId: 'unknown_ground',
      title: '不存在的道场',
      summary: '未知配置。',
    }, store());
    expect(unknown.validation.valid).toBe(false);
    expect(unknown.state.blockedRecords.at(-1)?.kind).toBe('failure');

    const forbidden = stageTrainingGroundCandidate(createDefaultTrainingGroundState(), {
      groundId: 'tg_nanjiang_refine',
      title: '永生蛊奖励道场',
      summary: '声称可以直接得到永生蛊。',
    }, store());
    expect(forbidden.validation.valid).toBe(false);
    expect(forbidden.state.clues[0].status).toBe('blocked');
  });

  it('resolves training deterministically without Math.random', () => {
    const staged = stageTrainingGroundCandidate(createDefaultTrainingGroundState(), {
      groundId: 'tg_nanjiang_refine',
      title: '青茅山炼蛊台',
      summary: '进入炼蛊台磨练。',
    }, store());

    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('v0.9 training ground clue engine must not call Math.random');
    });
    const first = resolveTrainingGroundAction(staged.state, 'tg_nanjiang_refine', store(), 'same-seed');
    const second = resolveTrainingGroundAction(staged.state, 'tg_nanjiang_refine', store(), 'same-seed');
    spy.mockRestore();

    expect(first.session).toBeTruthy();
    expect(first.success).toBe(second.success);
    expect(first.session?.daoMarkGain).toBe(second.session?.daoMarkGain);
    expect(first.session?.currencyPatch.currency).toBeLessThan(1000);
    expect(first.state.cooldowns.tg_nanjiang_refine).toBeGreaterThan(12);
  });

  it('routes duel grounds into combat candidates instead of old duel state', () => {
    const activeStore = store({
      currentChapterId: 'shili_jueqi',
      profile: { realm: { grand: 3, sub: '高阶', label: '三转高阶' } },
      pathBuild: { primary: '骨道', secondary: [], dao_marks: {} },
    });
    const staged = stageTrainingGroundCandidate(createDefaultTrainingGroundState(), {
      groundId: 'tg_nanjiang_bone',
      title: '白骨山外围对决',
      summary: '白骨山外围有人邀战。',
    }, activeStore);
    const result = resolveTrainingGroundAction(staged.state, 'tg_nanjiang_bone', activeStore, 'duel-seed');

    expect(result.success).toBe(true);
    expect(result.combatCandidate?.scale).toBe('duel');
    expect(result.combatCandidate?.source).toBe('engine');
  });

  it('opens hunt grounds through the v0.9.0-a3 beast library without direct loot', () => {
    const activeStore = store({
      currentChapterId: 'nilu_ascent',
      profile: { realm: { grand: 7, sub: '巅峰', label: '七转巅峰' } },
      immortalCurrency: 1000,
      sceneSessionState: { actionBudget: { remaining: 5, max: 5, spent: 0 } },
    });
    const staged = stageTrainingGroundCandidate(createDefaultTrainingGroundState(), {
      groundId: 'tg_white_heaven',
      title: '白天荒兽狩猎',
      summary: '只登记传闻，不结算荒兽掉落。',
    }, activeStore);

    expect(staged.validation.valid).toBe(true);
    const entry = evaluateTrainingGroundEntry(staged.state, 'tg_white_heaven', activeStore);
    expect(entry.status).toBe('available');
    expect(entry.canEnter).toBe(true);
    expect(entry.enemyPreview?.length).toBeGreaterThan(0);

    const result = resolveTrainingGroundAction(staged.state, 'tg_white_heaven', activeStore, 'hunt-seed');
    expect(result.success).toBe(true);
    expect(result.combatCandidate?.scale).toBe('group_7x5');
    expect(result.combatCandidate?.enemySpecIds?.length).toBeGreaterThan(0);
    expect(result.combatCandidate?.dropPolicyId).toBeTruthy();
  });
});
