import { describe, expect, it } from 'vitest';
import { buildActivityPanelState } from './activity-panel';

const makeStore = (overrides: Record<string, any> = {}) => ({
  profile: { name: '测试蛊师', realm: { grand: 2 } },
  attributes: { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
  vitals: {
    health: { current: 100, max: 100 },
    essence: { current: 20, max: 100 },
    essenceType: 'mortal',
  },
  currency: 10,
  immortalCurrency: 0,
  gameTime: { ap: 1, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' },
  flags: { cultivationProgress: 40 },
  turn: 1,
  selectedTalents: [],
  ...overrides,
});

describe('activity panel derived state', () => {
  it('summarizes AP-gated cultivation, breakthrough, meditation, and field actions', () => {
    const state = buildActivityPanelState(makeStore(), 'field');

    expect(state.ap).toBe(1);
    expect(state.essenceLabel).toBe('真元');
    expect(state.cards.map(card => card.id)).toEqual(expect.arrayContaining([
      'meditate',
      'cultivate',
      'breakthrough',
      'scout',
      'gather',
      'trap_check',
      'escape_support',
    ]));
    expect(state.cards.find(card => card.id === 'gather')?.successRate).toBeGreaterThan(0);
  });

  it('marks all action cards blocked when AP is exhausted', () => {
    const state = buildActivityPanelState(makeStore({
      gameTime: { ap: 0, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' },
    }), 'safe');

    expect(state.cards.every(card => card.status === 'blocked')).toBe(true);
    expect(state.cards.every(card => card.disabledReason === 'AP不足')).toBe(true);
  });
});
