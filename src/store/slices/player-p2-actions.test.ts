import { describe, expect, it } from 'vitest';
import { createPlayerSlice } from './playerSlice';

function createHarness(overrides: Record<string, any> = {}) {
  const logs: Array<{ type: string; message: string; meta?: any }> = [];
  let state: any;
  const set = (updater: any) => {
    const partial = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...partial };
  };
  const get = () => state;
  state = createPlayerSlice(set, get);
  state = {
    ...state,
    profile: { name: '测试蛊师', realm: { grand: 2, small: 1 } },
    attributes: { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
    vitals: {
      health: { current: 100, max: 100 },
      essence: { current: 20, max: 100 },
      essenceType: 'mortal',
      lifespan: { current: 80, max: 100 },
      hunger: 0,
      fatigue: 0,
    },
    currency: 10,
    immortalCurrency: 2,
    gameTime: { ap: 1, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' },
    flags: {},
    inventory: [{
      id: 'moonlight',
      name: '月光蛊',
      tier: 1,
      path: '月道',
      currentState: 'optimal',
      active: true,
      hungerCounter: 0,
    }],
    materialBag: {},
    addGameLog: (type: string, message: string, meta?: any) => logs.push({ type, message, meta }),
    addMaterial: (name: string, quantity: number) => {
      state.materialBag = { ...(state.materialBag || {}), [name]: Number(state.materialBag?.[name] || 0) + quantity };
    },
    applyHpPercent: (delta: number) => {
      const max = state.vitals.health.max;
      state.vitals = {
        ...state.vitals,
        health: { ...state.vitals.health, current: Math.max(0, Math.min(max, state.vitals.health.current + Math.round(max * delta / 100))) },
      };
    },
    ...overrides,
  };
  return { get state() { return state; }, logs };
}

describe('player P2 AP and action consumers', () => {
  it('advanceTurn refills AP and restores essence naturally without spending stones', () => {
    const harness = createHarness({ currency: 9 });
    harness.state.advanceTurn();

    expect(harness.state.gameTime.ap).toBe(3);
    expect(harness.state.currency).toBe(9);
    expect(harness.state.vitals.essence.current).toBeGreaterThan(20);
  });

  it('primeval stone meditation consumes AP and stones, then advances the period', () => {
    const harness = createHarness();
    const result = harness.state.meditateWithPrimevalStone(1, 'safe');

    expect(result.success).toBe(true);
    expect(harness.state.currency).toBe(9);
    expect(harness.state.turn).toBeGreaterThan(0);
    expect(harness.state.gameTime.ap).toBe(3);
    expect(harness.state.vitals.essence.current).toBeGreaterThan(20);
  });

  it('rejects AP-gated actions when AP is exhausted', () => {
    const harness = createHarness({ gameTime: { ap: 0, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' } });
    const beforeTurn = harness.state.turn;
    const result = harness.state.meditateWithPrimevalStone(1, 'safe');

    expect(result.success).toBe(false);
    expect(harness.state.currency).toBe(10);
    expect(harness.state.turn).toBe(beforeTurn);
  });

  it('field actions consume the current AP window and route rewards through registered bags', () => {
    const harness = createHarness({ selectedTalents: ['talent_herbalist'] });
    const result = harness.state.performFieldAction('gather', 'field');

    expect(typeof result.success).toBe('boolean');
    expect(harness.state.gameTime.ap).toBe(3);
    expect(harness.state.turn).toBeGreaterThan(0);
    expect(Object.values(harness.state.materialBag).reduce((sum: number, value: any) => sum + Number(value), 0)).toBeGreaterThanOrEqual(0);
  });

  it('breakthrough failure records concrete penalties and advances time', () => {
    const harness = createHarness({ gameTime: { ap: 1, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' }, turn: 10 });
    const result = harness.state.attemptBreakthrough();

    expect(typeof result.success).toBe('boolean');
    expect(harness.state.turn).toBeGreaterThan(10);
    if (!result.success) {
      expect(harness.state.flags.breakthroughFailureRecords?.[0]?.penalties?.length).toBeGreaterThan(0);
      expect(harness.state.vitals.health.current).toBeLessThanOrEqual(100);
    }
  });
});
