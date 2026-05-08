import { describe, expect, it } from 'vitest';
import { generateMaterialShopShelf, getMaterialRefreshCost } from './shop-engine';

describe('v0.7.0-pre merchant material shelf gate', () => {
  it('builds an eight-slot shelf even when the chapter fixed list is sparse', () => {
    const shelf = generateMaterialShopShelf({
      currentChapterName: '三王山前夜',
      playerRealmTier: 4,
      turn: 20,
      randomFn: () => 0.25,
    });

    expect(shelf.items.length).toBe(8);
    expect(new Set(shelf.items.map(item => item.id)).size).toBe(shelf.items.length);
  });

  it('prioritizes urgent low-mid rank feeding shortages', () => {
    const shelf = generateMaterialShopShelf({
      currentChapterName: '商队求生',
      playerRealmTier: 2,
      turn: 8,
      shortages: [{
        guName: '熊力蛊',
        tier: 1,
        hungerCounter: 24,
        feedRequirement: '生肉',
        stock: 0,
      }],
      randomFn: () => 0.1,
    });

    expect(shelf.emergencyActive).toBe(true);
    expect(shelf.shortageItems[0]).toMatchObject({
      name: '新鲜兽肉',
      source: 'shortage_food',
    });
    expect(shelf.items[0].name).toBe('新鲜兽肉');
  });

  it('keeps ordinary mortal material refresh cheap but not free after the turn allowance', () => {
    expect(getMaterialRefreshCost(1, false)).toBeGreaterThan(0);
    expect(getMaterialRefreshCost(6, true)).toBe(1);
  });
});
