import { describe, expect, it } from 'vitest';
import type { MortalAperture, SquadMember } from '../types';
import { resolveTerrainCombatModifier } from './terrain-combat';
import { evaluateSquadDispatch, resolveSquadDispatchOutcome } from './squad-dispatch';
import { buildExtremePhysiqueCalamityProfile } from './extreme-physique-calamity';
import {
  generateKillerMovePool,
  generateMaterialPool,
  generateRareTradePool,
  generateRecipePool,
} from './auction-engine';

const member: SquadMember = {
  id: 'm1',
  name: '商队斥候',
  path: '信道',
  realm: 3,
  loyalty: 60,
  personality: 'cautious',
  alive: true,
  hp: 120,
  maxHp: 120,
  atk: 20,
  def: 12,
  adventureTrust: 70,
  interestDrive: 55,
};

describe('v0.7.0-c expansion system gates', () => {
  it('applies terrain and formation as clamped lightweight combat modifiers', () => {
    const mod = resolveTerrainCombatModifier({
      terrainId: 'dense_forest',
      formationId: 'concealment_array',
      actorPath: '暗道',
    });

    expect(mod.terrainName).toBe('密林');
    expect(mod.formationName).toBe('遮掩阵');
    expect(mod.damageMultiplier).toBeGreaterThanOrEqual(0.82);
    expect(mod.damageMultiplier).toBeLessThanOrEqual(1.18);
    expect(mod.eventRiskModifier).toBeLessThanOrEqual(0.16);
  });

  it('keeps squad dispatch as a gated candidate instead of direct reward writes', () => {
    const evaluation = evaluateSquadDispatch(member, 'scout', { morale: 55, turn: 30 });
    const outcome = resolveSquadDispatchOutcome(member, 'scout', 'stable-seed', {
      morale: 55,
      turn: 30,
      location: '北原草原',
    });

    expect(evaluation.canDispatch).toBe(true);
    expect(evaluation.successChance).toBeGreaterThan(0.6);
    expect(outcome.taskId).toBe('scout');
    expect(outcome.rewards.yuanStone ?? 0).toBeLessThanOrEqual(220);
    expect(Object.keys(outcome.rewards).every(key => ['yuanStone', 'materials', 'rumors', 'reputation', 'relationship'].includes(key))).toBe(true);
  });

  it('reports ten-extreme physique aperture pressure without adding persistent fields', () => {
    const aperture: MortalAperture = {
      type: 'mortal',
      rank: 3,
      subRank: '高阶',
      primevalSea: { color: '#fff', colorName: '白银', fillPercent: 100 },
      apertureWall: { state: '壁薄如纸', opacity: 0.4, description: '十绝体高压' },
      capacity: 3,
      carriedGu: 3,
      extremePhysiqueType: '北冥冰魄体',
      capacityLocked: true,
    };

    const profile = buildExtremePhysiqueCalamityProfile(aperture, { hpPercent: 4, recentForcedGuUse: 2 });

    expect(profile?.pressureLevel).toBe('critical');
    expect(profile?.blockedActions).toContain('HP低于5%，禁止强行换蛊、强行承载和高压修炼');
    expect(profile?.visualState.tint).toBe('#8fd7ff');
  });

  it('keeps treasure yellow heaven full-category pools non-empty and priced', () => {
    const materials = generateMaterialPool([], 40);
    const recipes = generateRecipePool([], 40);
    const inheritances = generateKillerMovePool([], 40);
    const rareTrades = generateRareTradePool([], 40);

    expect(materials.length).toBeGreaterThan(0);
    expect(recipes.length).toBeGreaterThan(0);
    expect(inheritances.length).toBeGreaterThan(0);
    expect(rareTrades.length).toBeGreaterThan(0);
    expect(materials.every(item => item.currentBid > 0)).toBe(true);
    expect(recipes.every(item => item.currentBid > 0)).toBe(true);
    expect(inheritances.every(item => item.currentBid > 0)).toBe(true);
    expect(rareTrades.every(item => item.runtimeEffect !== undefined && item.currentBid > 0)).toBe(true);
    expect(rareTrades.some(item => item.category === '第二空窍线索')).toBe(true);
  });
});
