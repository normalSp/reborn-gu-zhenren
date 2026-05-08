import { describe, expect, it } from 'vitest';
import combatConfigRaw from '../canon/combat-config.json';
import {
  calcDamage,
  calcDaoResonance,
  createSeededRng,
  getPathMultiplier,
  getRealmCoefficients,
} from './combat-formulas';
import { buildBattlePreview } from './combat-preview';
import { createDuelEnemy, initDuel } from './combat-engine';
import { isRuntimePathAllowed } from './path-registry';

const combatConfig = combatConfigRaw as any;

describe('v0.7.0-a combat numeric source', () => {
  it('uses the v0.7.0-a rank pressure table', () => {
    const lowTwoRanks = getRealmCoefficients(3, 5);
    expect(lowTwoRanks.playerDamageMult).toBeCloseTo(0.4);
    expect(lowTwoRanks.playerHitBonus).toBe(-22);
    expect(lowTwoRanks.enemyDamageMult).toBeCloseTo(1.75);
    expect(lowTwoRanks.enemyHitPenalty).toBe(22);

    const highThreeRanks = getRealmCoefficients(6, 3);
    expect(highThreeRanks.playerDamageMult).toBeGreaterThanOrEqual(2.5);
    expect(highThreeRanks.playerHitBonus).toBeGreaterThanOrEqual(35);
  });

  it('keeps combat path counters in runtime paths and clamps multipliers', () => {
    const matrix = combatConfig.pathMatrix.matrix as Record<string, Record<string, number>>;
    for (const [attackerPath, row] of Object.entries(matrix)) {
      expect(isRuntimePathAllowed(attackerPath), `attacker path ${attackerPath}`).toBe(true);
      for (const defenderPath of Object.keys(row)) {
        expect(isRuntimePathAllowed(defenderPath), `defender path ${defenderPath}`).toBe(true);
        const multiplier = getPathMultiplier(attackerPath, defenderPath);
        expect(multiplier).toBeGreaterThanOrEqual(0.70);
        expect(multiplier).toBeLessThanOrEqual(1.35);
      }
    }
  });

  it('uses logarithmic dao resonance instead of linear blow-up', () => {
    expect(calcDaoResonance(100_000, 0)).toBeLessThanOrEqual(1.35);
    expect(calcDaoResonance(0, 100_000)).toBeGreaterThanOrEqual(0.75);
    expect(calcDaoResonance(500, 500)).toBeGreaterThan(0.9);
    expect(calcDaoResonance(500, 500)).toBeLessThan(1.2);
  });

  it('supports seeded reproducible damage rolls', () => {
    const matrix = combatConfig.pathMatrix.matrix as Record<string, Record<string, number>>;
    const attackerPath = Object.keys(matrix)[0];
    const defenderPath = Object.keys(matrix[attackerPath])[0];
    const first = calcDamage(80, 25, attackerPath, defenderPath, 1.25, 1.1, false, 200, 80, createSeededRng('same-seed'));
    const second = calcDamage(80, 25, attackerPath, defenderPath, 1.25, 1.1, false, 200, 80, createSeededRng('same-seed'));
    const third = calcDamage(80, 25, attackerPath, defenderPath, 1.25, 1.1, false, 200, 80, createSeededRng('other-seed'));

    expect(first).toBe(second);
    expect(third).toBeGreaterThan(0);
  });

  it('builds a runtime battle preview without mutating duel state', () => {
    const state = initDuel({
      name: '预览测试蛊师',
      realm: '三转',
      path: '力道',
      daoMarks: 180,
      hp: 180,
      maxHp: 180,
      attack: 72,
      defense: 22,
      accuracy: 88,
      evasion: 22,
      essence: { current: 40, max: 100 },
      gu: [{ name: '月光蛊', path: '光道', tier: 1 }],
      moves: [{
        name: '预览杀招',
        damageMultiplier: 1.8,
        pathBonus: 8,
        description: '测试预览用',
        requiredCoreGu: ['月光蛊'],
      }],
    }, createDuelEnemy({
      name: '预览敌人',
      realm: '四转',
      hp: 180,
      attack: 55,
      defense: 24,
      path: '智道',
      daoMarks: 120,
    }));

    const preview = buildBattlePreview(state);
    expect(preview.pressure.rankDiff).toBe(1);
    expect(preview.pressure.playerDamageMult).toBeCloseTo(0.7);
    expect(preview.pressure.pathMultiplier).toBeGreaterThan(1);
    expect(preview.escape.chance).toBeGreaterThan(0);
    expect(preview.actions.some(action => action.label === '预览杀招' && action.available)).toBe(true);
    expect(state.log).toEqual([]);
  });
});
