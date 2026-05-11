import { describe, expect, it, vi } from 'vitest';
import {
  createDefaultTrainingGroundRuntime,
  pickTrainingGrounds,
  resolveTrainingGroundRefresh,
  resolveTrainingGroundSession,
  type TrainingGroundContext,
  type TrainingGroundSpec,
} from './training-ground-engine';

const grounds: TrainingGroundSpec[] = [
  {
    id: 'tg_fire',
    name: '火窟',
    domain: '南疆',
    pathType: '炎道',
    type: '磨练',
    tier: 1,
    baseYield: 5,
    costCurrency: 100,
    costImmortalCurrency: 0,
    cooldownTurns: 3,
    immortalOnly: false,
    failureChance: 0,
    failureEffect: 'hpDamage:3',
    description: 'test',
  },
  {
    id: 'tg_immortal',
    name: '黑天',
    domain: '苍穹',
    pathType: '暗道',
    type: 'hunt',
    tier: 5,
    baseYield: 20,
    costCurrency: 0,
    costImmortalCurrency: 500,
    cooldownTurns: 8,
    immortalOnly: true,
    minRealm: 7,
    failureChance: 0,
    failureEffect: 'hpDamage:30',
    description: 'test',
  },
];

function ctx(overrides: Partial<TrainingGroundContext> = {}): TrainingGroundContext {
  return {
    realmGrand: 4,
    isImmortal: false,
    currentChapterId: '',
    primaryPath: '炎道',
    secondaryPaths: [],
    cooldowns: {},
    turn: 10,
    aptitude: 5,
    currency: 500,
    immortalCurrency: 0,
    ...overrides,
  };
}

describe('training ground engine', () => {
  it('filters by immortal and realm gates and picks deterministically', () => {
    const runtime = createDefaultTrainingGroundRuntime(false, 10);
    const first = pickTrainingGrounds(grounds, ctx(), runtime).map(item => item.id);
    const second = pickTrainingGrounds(grounds, ctx(), runtime).map(item => item.id);

    expect(first).toEqual(second);
    expect(first).toEqual(['tg_fire']);
  });

  it('charges refresh cost and increases next cost', () => {
    const result = resolveTrainingGroundRefresh(ctx(), { poolSeed: 10, refreshCost: 200 });

    expect(result.success).toBe(true);
    expect(result.currencyPatch.currency).toBe(300);
    expect(result.nextRuntime.refreshCost).toBe(400);
  });

  it('resolves training without Math.random and writes cooldown/result facts', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('training ground engine must not call Math.random');
    });
    const result = resolveTrainingGroundSession(ctx(), grounds[0], 'same-seed');
    const result2 = resolveTrainingGroundSession(ctx(), grounds[0], 'same-seed');
    spy.mockRestore();

    expect(result).toEqual(result2);
    expect(result.success).toBe(true);
    expect(result.currencyPatch.currency).toBe(400);
    expect(result.pathType).toBe('炎道');
    expect(result.daoMarkGain).toBeGreaterThan(0);
    expect(result.nextCooldowns.tg_fire).toBe(13);
  });
});
