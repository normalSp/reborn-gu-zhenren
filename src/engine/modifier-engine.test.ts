import { describe, expect, it } from 'vitest';
import {
  applyMaterialArrayCostModifiers,
  applyEncounterRiskModifiers,
  applyGuFeedCostModifiers,
  applyMerchantPrice,
  applyRefineMaterialCostModifiers,
  applyRefineSuccessModifiers,
  applyRefineTimeModifiers,
  getModifierCoverageRowsForSource,
  getSelectedTalentIds,
} from './modifier-engine';

const makeStore = (overrides: Record<string, any> = {}) => ({
  flags: {},
  selectedTalents: [],
  materialBag: {},
  apertureInventory: { materials: {}, immortalMaterials: {} },
  ...overrides,
});

describe('modifier-engine', () => {
  it('normalizes selected talent objects and ids', () => {
    const ids = getSelectedTalentIds(makeStore({
      selectedTalents: ['talent_steady', { id: 't_refinement_savant' }, { name: '临时天赋名' }, null],
    }));
    expect(ids).toEqual(['talent_steady', 't_refinement_savant', '临时天赋名']);
  });

  it('applies faction and P4 talent refine success bonuses', () => {
    const quote = applyRefineSuccessModifiers(0.4, {
      store: makeStore({
        flags: { _faction: 'tiejia' },
        selectedTalents: [{ id: 't_steady' }],
      }),
      operation: 'refine',
      path: '炼道',
      tier: 2,
      guName: '铁皮蛊',
    });

    expect(quote.value).toBeCloseTo(0.5);
    expect(quote.breakdown.map((entry) => entry.sourceId).sort()).toEqual(['t_steady', 'tiejia']);
  });

  it('applies legacy and P4 refine material/time modifiers without double counting unrelated operations', () => {
    const store = makeStore({ selectedTalents: [{ id: 't_refinement_savant' }] });
    const materialQuote = applyRefineMaterialCostModifiers({ 精品蛊材: 4, 铁片: 1 }, {
      store,
      operation: 'refine',
      path: '炼道',
      tier: 3,
    });
    const timeQuote = applyRefineTimeModifiers(3, {
      store,
      operation: 'refine',
      path: '炼道',
      tier: 3,
    });

    expect(materialQuote.costs).toEqual({ 精品蛊材: 3, 铁片: 1 });
    expect(timeQuote.value).toBe(3);
    expect(applyRefineSuccessModifiers(0.02, {
      store,
      operation: 'immortal_ascend',
      path: '炼道',
      tier: 6,
    }).value).toBeCloseTo(0.04);
  });

  it('expands adjusted material arrays for engine consumption', () => {
    const quote = applyMaterialArrayCostModifiers(['精品蛊材', '精品蛊材', '精品蛊材', '精品蛊材'], {
      store: makeStore({ selectedTalents: ['talent_refinement_savant'] }),
      operation: 'refine',
      path: '炼道',
      tier: 3,
    });

    expect(quote.costs).toEqual({ 精品蛊材: 3 });
    expect(quote.materials).toHaveLength(3);
  });

  it('applies merchant faction and bargaining discounts to buy prices', () => {
    const quote = applyMerchantPrice(100, {
      store: makeStore({
        flags: { _faction: 'shangjia' },
        selectedTalents: ['t_barter'],
      }),
      operation: 'merchant_buy',
      itemType: 'gu',
      itemName: '月光蛊',
    });

    expect(quote.price).toBe(81);
    expect(quote.multiplier).toBeCloseTo(0.8075);
  });

  it('applies inventory item modifiers only when the item exists', () => {
    const withoutKit = applyRefineSuccessModifiers(0.5, {
      store: makeStore(),
      operation: 'refine',
      path: '炼道',
      tier: 1,
    });
    const withKit = applyRefineSuccessModifiers(0.5, {
      store: makeStore({ materialBag: { 便携炼蛊工具包: 1 } }),
      operation: 'refine',
      path: '炼道',
      tier: 1,
    });

    expect(withoutKit.value).toBeCloseTo(0.5);
    expect(withKit.value).toBeCloseTo(0.55);
  });

  it('banks gu feeding discounts as fractional saved food units', () => {
    const quote = applyGuFeedCostModifiers(1, {
      store: makeStore({ selectedTalents: ['t_thrifty'] }),
      operation: 'feeding',
      guName: '酒虫',
      itemName: '美酒',
    });

    expect(quote.multiplier).toBeCloseTo(0.95);
    expect(quote.savedUnits).toBeCloseTo(0.05);
    expect(quote.breakdown.map((entry) => entry.sourceId)).toContain('t_thrifty');
  });

  it('applies encounter risk modifiers to trigger chance', () => {
    const quote = applyEncounterRiskModifiers(0.45, {
      store: makeStore({ flags: { _faction: 'mojia_oasis' } }),
      operation: 'encounter',
    });

    expect(quote.riskMultiplier).toBeCloseTo(0.85);
    expect(quote.triggerChance).toBeCloseTo(0.3825);
  });

  it('classifies displayed promises that still need a subsystem', () => {
    const rows = getModifierCoverageRowsForSource('talent', 't_thrifty', [
      '蛊虫喂养消耗-5%',
      '采集成功率+15%',
    ]);

    expect(rows.some((row) => row.status === 'runtime_active' && row.claim.includes('喂养'))).toBe(true);
    expect(rows.some((row) => row.status === 'planned_needs_system' && row.claim.includes('采集'))).toBe(true);
  });
});
