import { describe, expect, it } from 'vitest';
import { createDuelEnemy, initDuel } from './combat-engine';
import { auditBattleRewardArbitrage, simulateDuelToEnd } from './combat-simulation';
import type { DuelMove } from '../types';

const STANDARD_MOVE: DuelMove = {
  name: '稳态杀招',
  damageMultiplier: 1.45,
  pathBonus: 12,
  description: 'TTK模拟用标准杀招',
  requiredCoreGu: [],
};

const REVERSAL_MOVE: DuelMove = {
  name: '伏击杀招',
  damageMultiplier: 2.15,
  pathBonus: 24,
  description: '越级挑战时用于制造逆转窗口',
  requiredCoreGu: [],
};

function makePlayer(overrides: Partial<Parameters<typeof initDuel>[0]> = {}) {
  return {
    name: '模拟蛊师',
    realm: '三转',
    path: '力道',
    daoMarks: 160,
    hp: 190,
    maxHp: 190,
    attack: 56,
    defense: 24,
    accuracy: 82,
    evasion: 30,
    essence: { current: 100, max: 100 },
    gu: [{ name: '月光蛊', path: '光道', tier: 1 }],
    moves: [STANDARD_MOVE],
    ...overrides,
  };
}

describe('v0.7.0-a combat simulation gates', () => {
  it('keeps same-rank normal fights inside the 4-7 round target', () => {
    const state = initDuel(makePlayer(), createDuelEnemy({
      name: '同转敌人',
      realm: '三转',
      hp: 210,
      attack: 32,
      defense: 18,
      path: '智道',
      daoMarks: 100,
    }));

    const result = simulateDuelToEnd(state, { seed: 'same-rank-normal', strategy: 'best_available' });
    expect(result.winner).toBe('player');
    expect(result.rounds).toBeGreaterThanOrEqual(4);
    expect(result.rounds).toBeLessThanOrEqual(7);
  });

  it('keeps elite fights inside the 6-10 round target', () => {
    const state = initDuel(makePlayer({
      moves: [STANDARD_MOVE],
      essence: { current: 70, max: 100 },
    }), createDuelEnemy({
      name: '精英敌人',
      realm: '三转',
      hp: 255,
      attack: 35,
      defense: 24,
      path: '魂道',
      daoMarks: 180,
    }));

    const result = simulateDuelToEnd(state, { seed: 'elite-fight', strategy: 'best_available' });
    expect(result.winner).toBe('player');
    expect(result.rounds).toBeGreaterThanOrEqual(6);
    expect(result.rounds).toBeLessThanOrEqual(10);
  });

  it('keeps boss or story fights inside the 8-14 round target', () => {
    const state = initDuel(makePlayer({
      moves: [STANDARD_MOVE],
      hp: 240,
      maxHp: 240,
      essence: { current: 80, max: 100 },
    }), createDuelEnemy({
      name: '剧情强敌',
      realm: '三转',
      hp: 380,
      attack: 38,
      defense: 28,
      path: '血道',
      daoMarks: 260,
    }));

    const result = simulateDuelToEnd(state, { seed: 'boss-fight', strategy: 'best_available', maxRounds: 20 });
    expect(result.winner).toBe('player');
    expect(result.rounds).toBeGreaterThanOrEqual(8);
    expect(result.rounds).toBeLessThanOrEqual(14);
  });

  it('allows a low-one-rank challenge only with an explicit reversal window', () => {
    const state = initDuel(makePlayer({
      moves: [REVERSAL_MOVE],
      hp: 240,
      maxHp: 240,
      essence: { current: 100, max: 100 },
    }), createDuelEnemy({
      name: '高一转敌人',
      realm: '四转',
      hp: 380,
      attack: 40,
      defense: 28,
      path: '智道',
      daoMarks: 180,
    }));

    const result = simulateDuelToEnd(state, { seed: 'low-one-with-reversal', strategy: 'best_available', maxRounds: 20 });
    expect(result.winner).toBe('player');
    expect(result.rounds).toBeGreaterThanOrEqual(7);
    expect(result.rounds).toBeLessThanOrEqual(12);
  });

  it('discourages low-two-rank hard fights and closes mortal-vs-immortal wins', () => {
    const lowTwo = initDuel(makePlayer({
      moves: [],
    }), createDuelEnemy({
      name: '高二转敌人',
      realm: '五转',
      hp: 260,
      attack: 52,
      defense: 30,
      path: '智道',
      daoMarks: 260,
    }));
    const lowTwoResult = simulateDuelToEnd(lowTwo, { seed: 'low-two-hard-fight', strategy: 'attack_only', maxRounds: 20 });
    expect(lowTwoResult.winner).not.toBe('player');

    const mortalVsImmortal = initDuel(makePlayer({
      hp: 260,
      maxHp: 260,
    }), createDuelEnemy({
      name: '六转蛊仙',
      realm: '六转',
      hp: 1200,
      attack: 160,
      defense: 90,
      path: '宙道',
      daoMarks: 1200,
    }));
    const immortalResult = simulateDuelToEnd(mortalVsImmortal, { seed: 'mortal-vs-immortal', strategy: 'best_available', maxRounds: 10 });
    expect(immortalResult.winner).not.toBe('player');
  });

  it('keeps repeated battle rewards below the economy benchmark', () => {
    for (const turns of [100, 300]) {
      const audit = auditBattleRewardArbitrage({
        turns,
        battlesPerTurn: 0.45,
        expectedMaterialValuePerBattle: 18,
        benchmarkIncomePerTurn: 30,
      });
      expect(audit.safe).toBe(true);
      expect(audit.battleValue).toBeLessThanOrEqual(audit.maxAllowedValue);
    }
  });
});
