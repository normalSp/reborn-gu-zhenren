import { describe, expect, it } from 'vitest';
import {
  addMaterialToState,
  canSpendMaterials,
  getMaterialInventoryView,
  getMaterialTotalQuantity,
  removeMaterialFromState,
  unlockRecipeInFlags,
} from './economy-service';

describe('v0.7.0-pre economy service', () => {
  it('removes exact mortal materials from the material bag', () => {
    const state = { materialBag: { 铁屑: 2 } };
    const result = removeMaterialFromState(state, '铁屑', 1);

    expect(result.ok).toBe(true);
    expect(result.patch?.materialBag).toEqual({ 铁屑: 1 });
  });

  it('allows generic gu-material costs to consume registered concrete materials', () => {
    const state = { materialBag: { 金道普通蛊材: 2 } };
    const result = removeMaterialFromState(state, '普通蛊材', 1);

    expect(result.ok).toBe(true);
    expect(result.consumed[0]).toMatchObject({ requested: '普通蛊材', actual: '金道普通蛊材' });
    expect(result.patch?.materialBag).toEqual({ 金道普通蛊材: 1 });
    expect(canSpendMaterials(result.patch || {}, ['普通蛊材']).ok).toBe(true);
    expect(getMaterialTotalQuantity(result.patch || {}, '普通蛊材')).toBe(1);
  });

  it('routes immortal materials into aperture immortal storage for immortal players', () => {
    const state = {
      profile: { realm: { grand: 6 } },
      materialBag: {},
      apertureInventory: { gu: [], materials: {}, immortalMaterials: {} },
    };

    const patch = addMaterialToState(state, '通用仙材', 2);

    expect(patch.materialBag).toEqual({});
    expect(patch.apertureInventory?.immortalMaterials).toEqual({ 通用仙材: 2 });
    expect(getMaterialInventoryView(patch)).toEqual({ 通用仙材: 2 });
  });

  it('removes immortal materials from aperture storage', () => {
    const state = {
      profile: { realm: { grand: 6 } },
      apertureInventory: { gu: [], materials: {}, immortalMaterials: { 通用仙材: 1 } },
    };

    const result = removeMaterialFromState(state, '通用仙材', 1);

    expect(result.ok).toBe(true);
    expect(result.patch?.apertureInventory?.immortalMaterials).toEqual({});
  });

  it('unlocks recipes through the shared completedRecipes flag shape', () => {
    const flags = unlockRecipeInFlags({ current_chapter: '测试章' }, '月光蛊', 'auction:test');

    expect(flags.completedRecipes).toEqual({ 月光蛊: true });
    expect(flags.recipeUnlockSources).toEqual({ 月光蛊: 'auction:test' });
    expect(flags.current_chapter).toBe('测试章');
  });
});
