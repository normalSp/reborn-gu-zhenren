import { describe, expect, it } from 'vitest';
import { createAuctionSlice } from './auctionSlice';
import { createMerchantSlice } from './merchantSlice';

function createHarness<T>(factory: (set: any, get: any) => T, initial: Record<string, any> = {}) {
  let state: Record<string, any> = { ...initial };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = factory(set, get);
  state = { ...slice, ...state };
  return {
    get state() {
      return state;
    },
  };
}

describe('v0.7.0-pre economy closure store guards', () => {
  it('does not initialize treasure yellow heaven for mortal players', () => {
    const harness = createHarness(createAuctionSlice, {
      profile: { realm: { grand: 1 } },
      turn: 10,
      flags: {},
      materialBag: {},
      apertureInventory: { gu: [], materials: {}, immortalMaterials: {} },
    });

    harness.state.initAuction();

    expect(harness.state.isAuctionActive).toBe(false);
    expect(harness.state.auctionLastTurn).toBe(10);
  });

  it('blocks treasure purchases for mortal players even if stale auction data exists', () => {
    const harness = createHarness(createAuctionSlice, {
      profile: { realm: { grand: 1 } },
      immortalCurrency: 99,
      materialAuctionItems: [{
        id: 'mat_1',
        name: '通用仙材',
        grade: '仙材',
        path: '炼道',
        basePrice: 10,
        currentBid: 10,
        bidderCount: 0,
        expiresTurn: 20,
      }],
      recipeAuctionItems: [],
      killerMoveAuctionItems: [],
      auctionItems: [],
    });

    const result = harness.state.purchaseTreasureItem('materials', 'mat_1');

    expect(result.success).toBe(false);
    expect(harness.state.immortalCurrency).toBe(99);
  });

  it('unlocks auction recipes through completedRecipes for immortal players', () => {
    const harness = createHarness(createAuctionSlice, {
      profile: { realm: { grand: 6 } },
      immortalCurrency: 50,
      flags: {},
      setImmortalCurrency(value: number) {
        harness.state.immortalCurrency = value;
      },
      unlockRecipe(targetGu: string, source: string) {
        harness.state.flags = {
          ...harness.state.flags,
          completedRecipes: { ...(harness.state.flags?.completedRecipes || {}), [targetGu]: true },
          recipeUnlockSources: { ...(harness.state.flags?.recipeUnlockSources || {}), [targetGu]: source },
        };
        return true;
      },
      recipeAuctionItems: [{
        id: 'recipe_1',
        name: '月光蛊残方',
        targetGu: '月光蛊',
        targetTier: 1,
        path: '光道',
        fragmentsRequired: 3,
        basePrice: 10,
        currentBid: 10,
        bidderCount: 0,
        expiresTurn: 20,
      }],
      materialAuctionItems: [],
      killerMoveAuctionItems: [],
      auctionItems: [],
    });

    const result = harness.state.purchaseTreasureItem('recipes', 'recipe_1');

    expect(result.success).toBe(true);
    expect(harness.state.immortalCurrency).toBe(40);
    expect(harness.state.flags.completedRecipes).toEqual({ 月光蛊: true });
    expect(harness.state.flags.recipeUnlockSources).toEqual({ 月光蛊: 'auction:recipe_1' });
    expect(harness.state.recipeAuctionItems).toEqual([]);
  });

  it('merchant gu purchase uses spendCurrency once and grants the gu', () => {
    const harness = createHarness(createMerchantSlice, {
      currency: 100,
      turn: 1,
      spendCalls: 0,
      granted: [] as any[],
      spendCurrency(amount: number) {
        harness.state.spendCalls += 1;
        if (harness.state.currency < amount) return false;
        harness.state.currency -= amount;
        return true;
      },
      addGu(gu: any) {
        harness.state.granted.push(gu);
      },
    });
    harness.state.shopGroups[1] = {
      items: [{ name: '月光蛊', tier: 1, path: '光道', price: 30, rank: 'common' }],
      lastRefreshed: 1,
      refreshCount: 1,
    };

    const ok = harness.state.buyGuFromShop(1, '月光蛊');

    expect(ok).toBe(true);
    expect(harness.state.spendCalls).toBe(1);
    expect(harness.state.currency).toBe(70);
    expect(harness.state.granted).toHaveLength(1);
    expect(harness.state.shopGroups[1].items).toEqual([]);
  });
});
