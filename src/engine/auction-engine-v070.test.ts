import { describe, expect, it } from 'vitest';
import {
  generateKillerMovePool,
  generateMaterialPool,
  generateRecipePool,
} from './auction-engine';

describe('v0.7.0 treasure yellow heaven pools', () => {
  it('generates immortal material lots with prices and expiry', () => {
    const pool = generateMaterialPool([], 20);

    expect(pool.length).toBeGreaterThan(0);
    for (const item of pool) {
      expect(item.name).toBeTruthy();
      expect(item.grade).toBe('仙材');
      expect(item.currentBid).toBeGreaterThan(0);
      expect(item.basePrice).toBeGreaterThan(0);
      expect(item.expiresTurn).toBeGreaterThan(20);
    }
  });

  it('excludes owned immortal materials from the generated lot list', () => {
    const pool = generateMaterialPool(['空间晶石'], 20);

    expect(pool.some(item => item.name === '空间晶石')).toBe(false);
  });

  it('generates immortal recipe lots from canon fragment recipes', () => {
    const pool = generateRecipePool([], 20);

    expect(pool.length).toBeGreaterThan(0);
    for (const item of pool) {
      expect(item.name).toBeTruthy();
      expect(item.targetTier).toBeGreaterThanOrEqual(2);
      expect(item.fragmentsRequired).toBeGreaterThan(0);
      expect(item.currentBid).toBeGreaterThan(0);
      expect(item.expiresTurn).toBeGreaterThan(20);
    }
  });

  it('excludes already unlocked recipes by id, name, or target gu', () => {
    const first = generateRecipePool([], 20)[0];
    expect(first).toBeTruthy();

    expect(generateRecipePool([first.id], 20).some(item => item.id === first.id)).toBe(false);
    expect(generateRecipePool([first.name], 20).some(item => item.id === first.id)).toBe(false);
    expect(generateRecipePool([first.targetGu], 20).some(item => item.id === first.id)).toBe(false);
  });

  it('generates killer move inheritance lots with residual or complete forms', () => {
    const pool = generateKillerMovePool([], 20);

    expect(pool.length).toBeGreaterThan(0);
    for (const item of pool) {
      expect(item.name).toBeTruthy();
      expect(item.tier).toBeGreaterThanOrEqual(6);
      expect(['残方', '完整传承']).toContain(item.form);
      expect(item.currentBid).toBeGreaterThan(0);
      expect(item.expiresTurn).toBeGreaterThan(20);
    }
  });
});
