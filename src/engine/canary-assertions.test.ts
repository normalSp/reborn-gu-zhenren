import { describe, it, expect, beforeEach } from 'vitest';
import { validateCanaryAssertions, resetC09Counter } from './canary-assertions';
import type { NarrativeJSON } from '../types';
import type { Choice } from '../types';

// 模拟 store
function makeStore(overrides: any = {}) {
  return {
    profile: { realm: { grand: overrides.realmGrand ?? 1, sub: '初阶', label: '一转初阶' }, name: '测试蛊师', background: '南疆' },
    attributes: overrides.attributes ?? { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
    vitals: { health: { max: 100 }, essence: { max: 100 } },
    inventory: overrides.inventory ?? [],
    flags: overrides.flags ?? {},
  } as any;
}

function makeNarrative(opts: {
  text?: string;
  choices?: Choice[];
  stateUpdate?: any;
}): NarrativeJSON {
  return {
    narrative: {
      text: opts.text || '测试叙事文本，至少需要足够的长度来通过各种检测。这个世界充满危险和不确定。',
      choices: opts.choices || [
        { id: 'c1', text: '保守选择', risk: 'low', risk_note: '安全但收获少' },
        { id: 'c2', text: '冒险选择', risk: 'high', risk_note: '大风险大回报' },
      ],
    },
    state_update: opts.stateUpdate || {},
  };
}

describe('Layer 4 金丝雀断言', () => {
  beforeEach(() => { resetC09Counter(); });

  it('C01: 跨境界战胜无合理性标记→warn', () => {
    const store = makeStore({ realmGrand: 1 });
    const narrative = makeNarrative({ text: '你以一转修为击败了三转蛊师，他倒在你面前' });
    const result = validateCanaryAssertions(narrative, store);
    const c01 = result.results.find(r => r.ruleId === 'C01')!;
    expect(c01.passed).toBe(false);
  });

  it('C01: 跨境界战胜有合理性标记→通过', () => {
    const store = makeStore({ realmGrand: 1 });
    const narrative = makeNarrative({ text: '你燃烧生命力催动杀招，以巨大代价击败了三转蛊师' });
    const result = validateCanaryAssertions(narrative, store);
    const c01 = result.results.find(r => r.ruleId === 'C01')!;
    expect(c01.passed).toBe(true);
  });

  it('C02: 方源友善→critical reject', () => {
    const store = makeStore();
    const narrative = makeNarrative({ text: '方源欣赏你的勇气，信任你并全力支持你。这个世界很大。' });
    const result = validateCanaryAssertions(narrative, store);
    const c02 = result.results.find(r => r.ruleId === 'C02')!;
    expect(c02.passed).toBe(false);
  });

  it('C03: 境界跳跃→critical reject', () => {
    const store = makeStore({ realmGrand: 1 });
    const narrative = makeNarrative({
      text: '你突破了境界，实力大增。世界在你眼中都不一样了。',
      stateUpdate: { player: { realm: { action: 'set', value: '三转初阶' } } },
    });
    const result = validateCanaryAssertions(narrative, store);
    const c03 = result.results.find(r => r.ruleId === 'C03')!;
    expect(c03.passed).toBe(false);
  });

  it('C04: 获得高级蛊无代价→critical reject', () => {
    const store = makeStore();
    const narrative = makeNarrative({
      text: '你轻松获得了强大的蛊虫，非常顺利地拿到了宝物。一切都那么顺利。',
      stateUpdate: { gu_inventory: { add: [{ name: '神蛊', tier: 6, path: '光道', rarity: 'legendary', description: '强大' }] } },
    });
    const result = validateCanaryAssertions(narrative, store);
    const c04 = result.results.find(r => r.ruleId === 'C04')!;
    expect(c04.passed).toBe(false);
  });

  it('C06: 生命溢出→critical reject', () => {
    const store = makeStore();
    const narrative = makeNarrative({
      text: '你恢复了健康，生命值大幅提升。这个世界有很多危险。',
      stateUpdate: { player: { health: { current: 150, max: 100 } } },
    });
    const result = validateCanaryAssertions(narrative, store);
    const c06 = result.results.find(r => r.ruleId === 'C06')!;
    expect(c06.passed).toBe(false);
  });

  it('C07: 选择结构→5E降级为warning(全中风险)', () => {
    const store = makeStore();
    const narrative = makeNarrative({
      text: '你需要做出选择。前方有无数未知的危险和挑战。',
      choices: [
        { id: 'c1', text: '选项A', risk: 'medium', risk_note: '中等' },
        { id: 'c2', text: '选项B', risk: 'medium', risk_note: '也中等' },
      ],
    });
    const result = validateCanaryAssertions(narrative, store);
    const c07 = result.results.find(r => r.ruleId === 'C07')!;
    expect(c07.passed).toBe(false);
    expect(c07.level).toBe('warning');
  });

  it('C08: 叙事过短→critical reject', () => {
    const store = makeStore();
    const narrative = makeNarrative({ text: '你好' });
    const result = validateCanaryAssertions(narrative, store);
    const c08 = result.results.find(r => r.ruleId === 'C08')!;
    expect(c08.passed).toBe(false);
  });

  it('C09: 爽文禁词→warn', () => {
    const store = makeStore();
    const narrative = makeNarrative({ text: '你热血沸腾地战斗，充满希望地展望美好未来。世界真大。' });
    const result = validateCanaryAssertions(narrative, store);
    const c09 = result.results.find(r => r.ruleId === 'C09')!;
    expect(c09.passed).toBe(false);
  });

  it('C11: 杀敌获蛊无正当手段→critical reject', () => {
    const store = makeStore();
    const narrative = makeNarrative({ text: '你杀死了蛊师，从他身上获得了月光蛊，欣喜若狂。收好蛊虫继续前行。' });
    const result = validateCanaryAssertions(narrative, store);
    const c11 = result.results.find(r => r.ruleId === 'C11')!;
    expect(c11.passed).toBe(false);
  });

  it('正常叙事应全部通过', () => {
    const store = makeStore();
    const narrative = makeNarrative({
      text: '你小心地探索着这片危险的区域，每走一步都感受到四周潜伏的威胁。你知道在这个残酷的世界里，任何机缘都需要付出对等的代价。前方似乎有什么在等待着你的到来，但你需要做出艰难的选择。',
    });
    const result = validateCanaryAssertions(narrative, store);
    expect(result.passed).toBe(true);
    expect(result.failedCritical.length).toBe(0);
  });

  it('C27: 玩家可见叙事不得复述受保护隐藏因果名词', () => {
    const store = makeStore();
    const narrative = makeNarrative({
      text: '巡山弟子摇头说，关于方源与春秋蝉的说法只是危险流言。这个世界仍然阴冷。',
    });

    const result = validateCanaryAssertions(narrative, store);
    const c27 = result.results.find(r => r.ruleId === 'C27')!;
    expect(c27.passed).toBe(false);
    expect(result.recommendation).toBe('reject');
  });

  it('C27: 玩家可见叙事不得用否定句复述重生或回溯', () => {
    const store = makeStore();
    const narrative = makeNarrative({
      text: '茶馆里的人说这些只是关于重生与回溯的无稽之谈，但这句话本身已经不该进入玩家可见文本。',
    });

    const result = validateCanaryAssertions(narrative, store);
    const c27 = result.results.find(r => r.ruleId === 'C27')!;
    expect(c27.passed).toBe(false);
    expect(result.recommendation).toBe('reject');
  });

  it('C27: 明确授权后才允许隐藏因果名词进入可见文本', () => {
    const store = makeStore({ flags: { allowProtectedHiddenFactNames: true } });
    const narrative = makeNarrative({
      text: '受授权的回顾文本提到方源与春秋蝉，但不进入普通玩家路线。',
    });

    const result = validateCanaryAssertions(narrative, store);
    const c27 = result.results.find(r => r.ruleId === 'C27')!;
    expect(c27.passed).toBe(true);
  });
});
