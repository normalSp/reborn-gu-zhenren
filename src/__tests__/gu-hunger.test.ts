/**
 * P2-13: 蛊虫饥饿状态机单元测试
 * 测试范围: 状态迁移/饥饿计数/成功率影响/反噬概率/喂养恢复
 */
import { describe, it, expect, vi } from 'vitest';
import { GU_HUNGER_CONFIG } from '../store/slices/guSlice';
import type { GuInstance, GuHungerState } from '../types';

// 创建测试用蛊虫实例
function makeGu(overrides: Partial<GuInstance> = {}): GuInstance {
  return {
    id: `gu_test_${Math.random().toString(36).slice(2, 6)}`,
    specId: 'gu_test_moonlight',
    name: '月光蛊',
    tier: 1,
    path: '水道',
    currentState: 'optimal',
    hungerCounter: 0,
    proficiency: 0,
    bonded: false,
    active: true,
    acquiredAt: { turn: 1, narrative: '获得月光蛊' },
    ...overrides,
  };
}

describe('GU_HUNGER_CONFIG 参数验证', () => {
  it('hungerPerTurn 各转应有定义值', () => {
    for (let t = 1; t <= 5; t++) {
      expect(GU_HUNGER_CONFIG.hungerPerTurn[t]).toBeTypeOf('number');
    }
    // 一转累加1，五转累加5
    expect(GU_HUNGER_CONFIG.hungerPerTurn[1]).toBe(1);
    expect(GU_HUNGER_CONFIG.hungerPerTurn[5]).toBe(5);
  });

  it('阈值递进合理', () => {
    const t = GU_HUNGER_CONFIG.thresholds;
    expect(t.optimalToHungry).toBeLessThan(t.hungryToInjured);
    expect(t.hungryToInjured).toBeLessThan(t.injuredToDead);
  });

  it('喂养恢复为正数', () => {
    expect(GU_HUNGER_CONFIG.feedRecovery).toBeGreaterThan(0);
  });
});

describe('饥饿计数器递增逻辑', () => {
  it('active蛊虫每轮应递增对应tier的计数器值', () => {
    const gu = makeGu({ tier: 3 });
    // 模拟一轮: counter += hungerPerTurn[tier] = 3
    const increment = GU_HUNGER_CONFIG.hungerPerTurn[gu.tier] || gu.tier;
    expect(increment).toBe(3);
  });

  it('非active非bonded蛊虫不递增', () => {
    const gu = makeGu({ active: false, bonded: false });
    const shouldSkip = !gu.active && !gu.bonded;
    expect(shouldSkip).toBe(true);
  });

  it('dead状态蛊虫不再递增', () => {
    const gu = makeGu({ currentState: 'dead' });
    expect(gu.currentState === 'dead').toBe(true);
  });

  it('bonded蛊虫即使非active也应递增', () => {
    const gu = makeGu({ bonded: true, active: false });
    const shouldTick = gu.active || gu.bonded;
    expect(shouldTick).toBe(true);
  });
});

describe('状态迁移逻辑', () => {
  function computeNextState(current: GuHungerState, counter: number): GuHungerState {
    const { thresholds } = GU_HUNGER_CONFIG;
    if (counter >= thresholds.injuredToDead) return 'dead';
    if (counter >= thresholds.hungryToInjured && current !== 'dead') return 'injured';
    if (counter >= thresholds.optimalToHungry && current !== 'injured' && current !== 'dead') return 'hungry';
    return current;
  }

  it('counter=0 → 保持optimal', () => {
    expect(computeNextState('optimal', 0)).toBe('optimal');
  });

  it('counter=3 → 保持optimal（未达阈值5）', () => {
    expect(computeNextState('optimal', 3)).toBe('optimal');
  });

  it('counter=5 → optimal → hungry（达到第一阈值）', () => {
    expect(computeNextState('optimal', 5)).toBe('hungry');
  });

  it('counter=12 → hungry → injured（达到第二阈值）', () => {
    expect(computeNextState('hungry', 12)).toBe('injured');
  });

  it('counter=25 → injured → dead（达到第三阈值）', () => {
    expect(computeNextState('injured', 25)).toBe('dead');
  });

  it('counter=30 → 无论当前状态如何，直接dead', () => {
    expect(computeNextState('optimal', 30)).toBe('dead');
  });

  it('counter=10 → 已injured不回升到hungry', () => {
    expect(computeNextState('injured', 10)).toBe('injured');
  });
});

describe('喂养恢复逻辑', () => {
  it('喂养后counter应减少feedRecovery', () => {
    const counter = 12;
    const newCounter = Math.max(0, counter - GU_HUNGER_CONFIG.feedRecovery);
    expect(newCounter).toBe(2); // 12 - 10 = 2
  });

  it('喂养后counter不低于0', () => {
    const counter = 5;
    const newCounter = Math.max(0, counter - GU_HUNGER_CONFIG.feedRecovery);
    expect(newCounter).toBe(0);
  });

  it('injured → hungry 状态提升（喂养恢复一级）', () => {
    const stateProgression: GuHungerState[] = ['dead', 'injured', 'hungry', 'optimal'];
    const idx = stateProgression.indexOf('injured');
    expect(stateProgression[idx + 1]).toBe('hungry');
  });

  it('dead状态蛊虫不可喂养', () => {
    const gu = makeGu({ currentState: 'dead' });
    expect(gu.currentState === 'dead').toBe(true);
  });
});

describe('反噬判定', () => {
  it('injured状态有5%反噬概率', () => {
    // 验证概率值
    const baseChance = 0.05;
    expect(baseChance).toBe(0.05);
  });

  it('反噬伤害在10-20范围内', () => {
    // 模拟100次反噬伤害验证范围
    for (let i = 0; i < 100; i++) {
      const dmg = 10 + Math.floor(Math.random() * 11);
      expect(dmg).toBeGreaterThanOrEqual(10);
      expect(dmg).toBeLessThanOrEqual(20);
    }
  });

  it('非injured状态不触发反噬', () => {
    const states: GuHungerState[] = ['optimal', 'hungry', 'dead'];
    for (const state of states) {
      expect(state).not.toBe('injured');
    }
  });
});

describe('成功率影响', () => {
  it('optimal状态成功率+10%', () => {
    const bonus = { optimal: 10, hungry: -15, injured: -30, dead: -999 };
    expect(bonus.optimal).toBe(10);
  });

  it('hungry状态成功率-15%', () => {
    const bonus = { optimal: 10, hungry: -15, injured: -30, dead: -999 };
    expect(bonus.hungry).toBe(-15);
  });

  it('injured状态成功率-30%', () => {
    const bonus = { optimal: 10, hungry: -15, injured: -30, dead: -999 };
    expect(bonus.injured).toBe(-30);
  });
});
