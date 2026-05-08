import { describe, expect, it } from 'vitest';
import {
  auditGuFeedingClosure,
  auditRecipeSourceClosure,
  findMaterialSources,
  generateGuFeedingClosureMatrix,
  generateRecipeMaterialSourceMatrix,
  getFeedingMaterialEntries,
} from './material-source-audit';

describe('v0.7.0-pre recipe material source closure', () => {
  it('builds a source matrix for every registered recipe material cost', () => {
    const matrix = generateRecipeMaterialSourceMatrix();

    expect(matrix.length).toBeGreaterThan(0);
    expect(matrix.some(row => row.materialName === '月华草' && row.sources.some(source => source.tag === 'shop'))).toBe(true);
    expect(matrix.some(row => row.sources.some(source => source.tag === 'regional_generation'))).toBe(true);
  });

  it('keeps current registered recipe materials reachable through at least one source path', () => {
    expect(auditRecipeSourceClosure()).toEqual([]);
  });

  it('exposes feeding materials as usage-tagged gu materials, not a separate resource class', () => {
    const feeding = getFeedingMaterialEntries();

    expect(feeding.length).toBeGreaterThan(0);
    expect(feeding.some(entry => entry.id === '新鲜兽肉')).toBe(true);
    expect(findMaterialSources('新鲜兽肉').some(source => source.tag === 'shop')).toBe(true);
  });

  it('builds gu feeding closure rows from material food or non-material rules', () => {
    const matrix = generateGuFeedingClosureMatrix();
    const springAutumn = matrix.find(row => row.guName === '春秋蝉');
    const fixedImmortalTravel = matrix.find(row => row.guName === '定仙游');

    expect(matrix.length).toBeGreaterThanOrEqual(128);
    expect(springAutumn).toMatchObject({
      rank: 6,
      feedRequirement: '时间流逝',
      fallbackPolicy: 'non_material_rule',
      blocking: false,
    });
    expect(springAutumn?.sources.some(source => source.tag === 'special_rule')).toBe(true);
    expect(fixedImmortalTravel).toMatchObject({
      rank: 6,
      feedRequirement: '仙元',
      acceptedFoods: [],
      blocking: false,
    });
    expect(fixedImmortalTravel?.sources.some(source => source.tag === 'aperture_resource')).toBe(true);
  });

  it('does not leave rank-6+ gu feeding on unresolved generic stock', () => {
    const immortalBlockers = auditGuFeedingClosure().filter(row => row.rank >= 6);

    expect(immortalBlockers).toEqual([]);
  });

  it('does not treat event-only or regional-only feeding sources as stable by default', () => {
    const matrix = generateGuFeedingClosureMatrix();
    const flatteryGu = matrix.find(row => row.guName === '捧杀蛊');
    const weightedRows = matrix.filter(row => row.sourceReliability === 'weighted');

    expect(flatteryGu).toMatchObject({
      feedRequirement: '虚情假意',
      sourceReliability: 'event_gated',
      turnsToAcquireEstimate: null,
      blocking: false,
    });
    expect(flatteryGu?.recommendedAction).toContain('虚情假意');
    expect(weightedRows.some(row => row.sources.some(source => source.tag === 'regional_generation'))).toBe(true);
  });
});
