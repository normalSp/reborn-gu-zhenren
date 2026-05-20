import { describe, expect, it } from 'vitest';
import { INITIAL_STATE } from '../store/initialState';
import { ContextBuilder } from './context-builder';

function makeStore(overrides: Record<string, any> = {}) {
  return {
    ...INITIAL_STATE,
    profile: { name: '缓存测试', background: '青茅山', realm: { grand: 2, sub: '中阶', label: '二转中阶' } },
    attributes: { 资质: 7, 体魄: 6, 心智: 6, 气运: 5 },
    vitals: { health: { current: 120, max: 120 }, essence: { current: 88, max: 100 }, essenceType: 'primeval' },
    currentDomain: '南疆',
    currentChapterId: 'qingmaoshan',
    gameTime: { ap: 3, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' },
    pathBuild: { primary: '光道', secondary: ['炼道'], path_levels: { 光道: '入门' }, dao_marks: { 光道: 10, 炼道: 4 } },
    daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
    flags: { _start_profile: 'start_qingmaoshan_guyue' },
    messages: [],
    keyEvents: [],
    rollingSummary: '',
    inventory: [
      { id: 'moon', specId: '月光蛊', name: '月光蛊', tier: 1, path: '光道', currentState: 'hungry', hungerCounter: 12 },
    ],
    apertureInventory: { gu: [], materials: {}, immortalMaterials: {} },
    ...overrides,
  } as any;
}

describe('ContextBuilder DeepSeek cache stability', () => {
  it('keeps the system prompt stable when only volatile player state changes', () => {
    const builder = new ContextBuilder();
    const baseStore = makeStore();
    const changedStore = makeStore({
      currency: 900,
      messages: [{ role: 'user', content: '我要巡查前山' }],
      pathBuild: { primary: '光道', secondary: ['炼道'], path_levels: { 光道: '入门' }, dao_marks: { 光道: 80, 炼道: 16 } },
      inventory: [
        { id: 'moon', specId: '月光蛊', name: '月光蛊', tier: 1, path: '光道', currentState: 'hungry', hungerCounter: 12 },
        { id: 'white_jade', specId: '白玉蛊', name: '白玉蛊', tier: 2, path: '金道', currentState: 'optimal', hungerCounter: 0 },
      ],
    });

    expect(builder.buildSystemPrompt('canon', changedStore)).toBe(builder.buildSystemPrompt('canon', baseStore));

    const dynamic = builder.buildDynamicContext(changedStore);
    expect(dynamic).toContain('【道痕与流派互斥规则】');
    expect(dynamic).toContain('主修光道：80道痕');
    expect(dynamic).toContain('【玩家经济锚定 — 购买力参考】');
    expect(dynamic).toContain('玩家当前余额：900元石');
    expect(dynamic).toContain('【当前蛊虫状态】');
    expect(dynamic).toContain('白玉蛊');
  });

  it('includes immortal aperture Gu in prompt-visible inventory without duplicating edited-save remnants', () => {
    const builder = new ContextBuilder();
    const store = makeStore({
      profile: { name: '仙窍测试', background: '升仙后', realm: { grand: 6, sub: '初阶', label: '六转初阶' } },
      inventory: [
        { id: 'moon', specId: '月光蛊', name: '月光蛊', tier: 1, path: '光道', currentState: 'optimal' },
      ],
      apertureInventory: {
        gu: [
          { id: 'moon', specId: '月光蛊', name: '月光蛊', tier: 1, path: '光道', currentState: 'optimal' },
          { id: 'jade', specId: '白玉蛊', name: '白玉蛊', tier: 2, path: '金道', currentState: 'optimal' },
        ],
        materials: {},
        immortalMaterials: {},
      },
    });

    const playerState = JSON.parse(builder.buildPlayerStateJSON(store));
    expect(playerState.guInventory.map((gu: any) => gu.name)).toEqual(['月光蛊', '白玉蛊']);
    const dynamic = builder.buildDynamicContext(store);
    expect(dynamic).toContain('【当前蛊虫状态】');
    expect(dynamic).toContain('白玉蛊');
  });

  it('does not expose protected hidden protagonist causality in the cacheable canon prompt', () => {
    const builder = new ContextBuilder();
    const prompt = builder.buildSystemPrompt('canon', makeStore());

    expect(prompt).not.toContain('春秋蝉');
    expect(prompt).not.toContain('方源使用');
    expect(prompt).not.toContain('太白云生');
    expect(prompt).toContain('隐藏因果不得展开为玩家可见文本');
  });
});
