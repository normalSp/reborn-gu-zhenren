import { describe, expect, it } from 'vitest';
import { getMaterialEntry, getMaterialRegistryEntries, isMaterialUsableFor } from './material-registry';
import {
  expandMaterialCost,
  getAscendRecipeForGu,
  getRecipeRegistryEntries,
  getRefineRecipeForGu,
} from './recipe-registry';

describe('v0.7.0-pre lore-aligned recipe registry', () => {
  it('keeps the material registry limited to gu materials and immortal materials', () => {
    const entries = getMaterialRegistryEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(new Set(entries.map(entry => entry.kind))).toEqual(new Set(['gu_material', 'immortal_material']));
    expect(entries.some(entry => entry.id.includes('蛊方') || entry.id.includes('残方') || entry.id.includes('杀招'))).toBe(false);
    expect(getMaterialEntry('商路地图')).toBeUndefined();
  });

  it('treats feeding as a usage tag instead of a separate worldbuilding category', () => {
    const beastMeat = getMaterialEntry('新鲜兽肉');

    expect(beastMeat?.kind).toBe('gu_material');
    expect(beastMeat?.usageTags).toContain('feeding');
    expect(isMaterialUsableFor('新鲜兽肉', 'feeding')).toBe(true);
  });

  it('creates path generic gu materials from the canonical path registry', () => {
    expect(getMaterialEntry('食道普通蛊材')).toBeTruthy();
    expect(getMaterialEntry('人道普通蛊材')).toBeTruthy();
    expect(getMaterialEntry('炎道普通蛊材')).toBeTruthy();
  });

  it('keeps source gu and auxiliary gu out of material costs', () => {
    const ascend = getAscendRecipeForGu('月光蛊');
    const refine = getRefineRecipeForGu('月光蛊');

    expect(ascend?.sourceGu).toEqual({ 月光蛊: 1 });
    expect(ascend?.materials).not.toHaveProperty('月光蛊');
    expect(refine?.sourceGu).toEqual({});
    expect(expandMaterialCost(refine!)).toContain('月华草');
  });

  it('normalizes every registered recipe material into the material truth source', () => {
    const missing: string[] = [];

    for (const recipe of getRecipeRegistryEntries()) {
      for (const materialName of Object.keys({ ...recipe.materials, ...recipe.immortalMaterials })) {
        if (!getMaterialEntry(materialName)) missing.push(`${recipe.id}:${materialName}`);
      }
    }

    expect(missing).toEqual([]);
  });
});
