import { describe, expect, it } from 'vitest';
import { resolveQingmaoRefinementBoundaryAction } from './v015-qingmao-refinement-boundary';
import type { LivingWorldState } from '../types';

function buildEconomyState(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 80,
      day: 1,
      phase: 'afternoon',
      lastActionId: 'qingmao_supply_feeding_preparation_probe',
    },
    knownFacts: {
      qingmao_supply_feeding_preparation_baseline: {
        id: 'qingmao_supply_feeding_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '补给和食料缺口已经进入账本。',
        learnedTurn: 72,
        confidence: 'confirmed',
        tags: ['test'],
      },
    },
    playerGoals: [
      {
        id: 'goal_escape_qingmao',
        intentType: 'travel',
        targetRef: 'region:outside_qingmao',
        status: 'deferred',
        createdTurn: 60,
        lastUpdatedTurn: 72,
        rationale: '我要逃离青茅山。',
        nextStepHints: ['feeding:feeding_liquor_worm_wine_stock_pressure'],
        blockedByRefIds: ['gate:no_material_reward'],
      },
    ],
    actionConsequences: [
      {
        id: 'consequence_qingmao_supply_feeding_preparation_probe',
        actionId: 'qingmao_supply_feeding_preparation_probe',
        turn: 72,
        scope: 'resource',
        publicSummary: '补给和喂养缺口已经整理。',
        effectRefs: ['qingmao_supply_feeding_preparation_baseline'],
        followUpRefs: ['feeding:feeding_liquor_worm_wine_stock_pressure', 'gate:no_material_reward'],
      },
    ],
  };
}

describe('v0.15.0-b2 Qingmao refinement and fragment boundary action', () => {
  it('blocks before low-rank economy preparation context exists', () => {
    const result = resolveQingmaoRefinementBoundaryAction({
      livingWorldState: {
        worldClock: {
          turn: 80,
          day: 1,
          phase: 'afternoon',
          lastActionId: null,
        },
        knownFacts: {},
        playerGoals: [],
        actionConsequences: [],
      },
      materialBag: {},
      turn: 80,
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.rejectedReasons).toContain('missing_low_rank_economy_context');
    expect(result.knownFacts).toEqual([]);
    expect(result.actionConsequences).toEqual([]);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'complete_recipe_unlock',
      'refinement_success',
      'material_consumption',
      'save_format_bump',
      'deepseek_authority_expansion',
    ]));
  });

  it('records fragment and refinement failure boundaries without consuming materials or unlocking recipes', () => {
    const result = resolveQingmaoRefinementBoundaryAction({
      livingWorldState: buildEconomyState(),
      materialBag: {
        '月华草': 1,
      },
      turn: 81,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
    });

    expect(result.success).toBe(true);
    expect(result.rejectedReasons).toEqual([]);
    expect(result.refinementPlan.ruleDrafts.map(rule => rule.id)).toEqual(expect.arrayContaining([
      'refine_failure_cost_aperture_and_material_loss',
      'refine_failure_cost_social_attention',
      'recipe_fragment_incomplete_formula_boundary',
      'recipe_fragment_verification_cost_boundary',
    ]));
    expect(result.fragmentPreview).toEqual(expect.objectContaining({
      fragmentId: 'frag_moonlight_advanced',
      targetGu: '月光蛊',
      targetTier: 2,
      canAttemptNow: false,
      canUnlockRecipeNow: false,
    }));
    expect(result.fragmentPreview?.requiredMaterials).toEqual(expect.arrayContaining([
      expect.objectContaining({ materialName: '月华草', owned: 1, enough: true }),
      expect.objectContaining({ materialName: '精品蛊材', owned: 0, enough: false }),
    ]));
    expect(result.knownFacts).toEqual([
      expect.objectContaining({
        id: 'qingmao_refinement_fragment_boundary_baseline',
        summary: expect.stringContaining('没有消耗材料'),
      }),
    ]);
    expect(result.factionPressure).toEqual([
      expect.objectContaining({
        id: 'faction_pressure_qingmao_refinement_boundary_guyue_shanzhai_attention',
        pressureType: 'suspicion',
      }),
    ]);
    expect(result.npcMemories.map(entry => entry.id)).toEqual([
      'npc_memory_qingmao_refinement_boundary_local_watch',
    ]);
    expect(result.playerGoals[0]).toEqual(expect.objectContaining({
      id: 'goal_escape_qingmao',
      nextStepHints: expect.arrayContaining([
        'refinement:recipe_fragment_incomplete_formula_boundary',
        'fragment:frag_moonlight_advanced',
      ]),
      blockedByRefIds: expect.arrayContaining([
        'gate:no_complete_recipe_unlock',
        'gate:no_refinement_success',
        'gate:no_material_consumption',
        'gap:fragment_material_verification',
      ]),
    }));
    expect(result.actionConsequences[0]).toEqual(expect.objectContaining({
      id: 'consequence_qingmao_refinement_boundary_probe',
      followUpRefs: expect.arrayContaining([
        'refinement:recipe_fragment_incomplete_formula_boundary',
        'gate:no_complete_recipe_unlock',
        'gate:no_refinement_success',
        'gate:no_material_consumption',
      ]),
    }));
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(JSON.stringify(result)).not.toContain('补全成功');
    expect(JSON.stringify(result)).not.toContain('解锁「');
    expect(result.message).not.toContain('炼蛊成功');
    expect(result.publicSummary).not.toContain('炼蛊成功');
    expect(result.knownFacts[0].summary).not.toContain('炼蛊成功');
    expect(JSON.stringify(result)).not.toContain('炼蛊成功！');
    expect(JSON.stringify(result)).not.toContain('material_consumed');
  });
});
