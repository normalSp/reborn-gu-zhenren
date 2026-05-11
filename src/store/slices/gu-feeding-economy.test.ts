import { describe, expect, it } from 'vitest';
import { createGuSlice } from './guSlice';
import type { GuInstance } from '../../types';

function makeGu(overrides: Partial<GuInstance> = {}): GuInstance {
  return {
    id: 'gu_wine_test',
    specId: 'wine_gu',
    name: '酒虫',
    tier: 1,
    path: '食道',
    currentState: 'hungry',
    hungerCounter: 12,
    proficiency: 0,
    bonded: false,
    active: true,
    acquiredAt: { turn: 1, narrative: '测试获得酒虫' },
    ...overrides,
  };
}

function createHarness(initial: Record<string, any> = {}) {
  let state: Record<string, any> = { ...initial };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = createGuSlice(set, get);
  state = { ...slice, ...state };
  return {
    get state() {
      return state;
    },
  };
}

describe('v0.7.0-pre gu feeding economy loop', () => {
  it('feeds gu by consuming registered feeding material instead of yuan stones', () => {
    const harness = createHarness({
      currency: 999,
      materialBag: { 美酒: 1 },
      inventory: [makeGu()],
      guHungerCounters: { gu_wine_test: 12 },
    });

    const ok = harness.state.feedGuHunger('gu_wine_test');

    expect(ok).toBe(true);
    expect(harness.state.currency).toBe(999);
    expect(harness.state.materialBag).toEqual({});
    expect(harness.state.inventory[0]).toMatchObject({ currentState: 'optimal', hungerCounter: 2 });
  });

  it('lets feeding cost modifiers bank fractional food savings', () => {
    const harness = createHarness({
      currency: 999,
      selectedTalents: ['t_thrifty'],
      feedingDiscountProgress: { material_feeding: 0.95 },
      materialBag: { 美酒: 1 },
      inventory: [makeGu()],
      guHungerCounters: { gu_wine_test: 12 },
    });

    const ok = harness.state.feedGuHunger('gu_wine_test');

    expect(ok).toBe(true);
    expect(harness.state.currency).toBe(999);
    expect(harness.state.materialBag).toEqual({ 美酒: 1 });
    expect(harness.state.feedingDiscountProgress.material_feeding).toBeCloseTo(0);
    expect(harness.state.inventory[0]).toMatchObject({ currentState: 'optimal', hungerCounter: 2 });
  });

  it('does not restore hunger when the registered food is missing', () => {
    const harness = createHarness({
      currency: 999,
      materialBag: {},
      inventory: [makeGu()],
      guHungerCounters: { gu_wine_test: 12 },
    });

    const ok = harness.state.feedGuHunger('gu_wine_test');

    expect(ok).toBe(false);
    expect(harness.state.currency).toBe(999);
    expect(harness.state.inventory[0]).toMatchObject({ currentState: 'hungry', hungerCounter: 12 });
  });

  it('rejects mismatched food without consuming valid stock', () => {
    const harness = createHarness({
      materialBag: { 美酒: 1, 月华草: 1 },
      inventory: [makeGu()],
      guHungerCounters: { gu_wine_test: 12 },
    });

    const ok = harness.state.feedGuHunger('gu_wine_test', '月光');

    expect(ok).toBe(false);
    expect(harness.state.materialBag).toEqual({ 美酒: 1, 月华草: 1 });
    expect(harness.state.inventory[0].currentState).toBe('hungry');
  });

  it('does not let immortal gu use low-rank generic material as food', () => {
    const health = { current: 100, max: 100 };
    const harness = createHarness({
      materialBag: { 普通蛊材: 3 },
      inventory: [makeGu({
        id: 'fixed_immortal_travel_test',
        name: '定仙游',
        tier: 6,
        path: '宇道',
        currentState: 'hungry',
        hungerCounter: 12,
      })],
      guHungerCounters: { fixed_immortal_travel_test: 12 },
      vitals: { health },
      applyHpDelta: (delta: number) => {
        health.current += delta;
      },
    });

    const ok = harness.state.feedGuHunger('fixed_immortal_travel_test', '普通蛊材');

    expect(ok).toBe(false);
    expect(harness.state.materialBag).toEqual({ 普通蛊材: 3 });
    expect(harness.state.inventory[0]).toMatchObject({ currentState: 'hungry', hungerCounter: 12 });
  });

  it('requires non-material feeding credit for event-gated food', () => {
    const harness = createHarness({
      feedingCredits: {},
      inventory: [makeGu({
        id: 'flattery_test',
        name: '捧杀蛊',
        tier: 2,
        path: '人道',
        currentState: 'hungry',
        hungerCounter: 12,
      })],
      guHungerCounters: { flattery_test: 12 },
    });

    const ok = harness.state.feedGuHunger('flattery_test');

    expect(ok).toBe(false);
    expect(harness.state.inventory[0]).toMatchObject({ currentState: 'hungry', hungerCounter: 12 });
  });

  it('blocks ordinary removal for lifebound Gu', () => {
    const logs: any[] = [];
    const harness = createHarness({
      inventory: [makeGu({
        id: 'moonlight',
        name: '月光蛊',
        path: '月道',
        bonded: true,
        currentState: 'optimal',
        hungerCounter: 0,
      })],
      lifeboundGuInfo: { guId: 'moonlight', guName: '月光蛊', boundAt: 1, turnsSinceBound: 0, cooldownRemaining: 0, upgradeCount: 0, onCooldown: false },
      addGameLog: (...args: any[]) => logs.push(args),
    });

    harness.state.removeGu('moonlight');

    expect(harness.state.inventory).toHaveLength(1);
    expect(logs[0]?.[1]).toContain('本命蛊成长协议');
  });

  it('consumes non-material feeding credit when feeding succeeds', () => {
    const harness = createHarness({
      feedingCredits: { 虚情假意: 1 },
      inventory: [makeGu({
        id: 'flattery_test',
        name: '捧杀蛊',
        tier: 2,
        path: '人道',
        currentState: 'hungry',
        hungerCounter: 12,
      })],
      guHungerCounters: { flattery_test: 12 },
    });

    const ok = harness.state.feedGuHunger('flattery_test');

    expect(ok).toBe(true);
    expect(harness.state.feedingCredits.虚情假意).toBe(0);
    expect(harness.state.inventory[0]).toMatchObject({ currentState: 'optimal', hungerCounter: 2 });
  });
});
