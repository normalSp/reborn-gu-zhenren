import { describe, expect, it } from 'vitest';
import { resolveQingmaoSupplyFeedingPreparationAction } from './v015-qingmao-supply-feeding-preparation';
import type { LivingWorldState } from '../types';

function buildRouteState(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 70,
      day: 1,
      phase: 'afternoon',
      lastActionId: 'qingmao_mountain_pass_route_continuation_probe',
    },
    knownFacts: {
      qingmao_escape_route_preparation_baseline: {
        id: 'qingmao_escape_route_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '逃离青茅山路线准备已形成基线。',
        learnedTurn: 61,
        confidence: 'confirmed',
        tags: ['test'],
      },
      qingmao_mountain_pass_route_continuation_candidate: {
        id: 'qingmao_mountain_pass_route_continuation_candidate',
        scope: 'region',
        source: 'engine_result',
        summary: '山路逃离路线已是候选。',
        learnedTurn: 64,
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
        lastUpdatedTurn: 64,
        rationale: '我要逃离青茅山。',
        nextStepHints: ['preparation:gather_travel_supply'],
        blockedByRefIds: ['risk:pursuit_attention'],
      },
    ],
    actionConsequences: [
      {
        id: 'consequence_qingmao_mountain_pass_route_continuation_probe',
        actionId: 'qingmao_mountain_pass_route_continuation_probe',
        turn: 64,
        scope: 'region',
        publicSummary: '山路逃离路线已是候选。',
        effectRefs: ['qingmao_mountain_pass_route_continuation_candidate'],
        followUpRefs: ['route_candidate:mountain_pass_escape', 'preparation:gather_travel_supply'],
      },
    ],
  };
}

describe('v0.15.0-b1 Qingmao supply/feeding preparation action', () => {
  it('blocks without an escape goal and route context', () => {
    const result = resolveQingmaoSupplyFeedingPreparationAction({
      livingWorldState: {
        worldClock: {
          turn: 70,
          day: 1,
          phase: 'afternoon',
          lastActionId: null,
        },
        knownFacts: {},
        playerGoals: [],
        actionConsequences: [],
      },
      turn: 70,
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.rejectedReasons).toEqual(expect.arrayContaining([
      'missing_escape_goal',
      'missing_route_context',
    ]));
    expect(result.knownFacts).toEqual([]);
    expect(result.playerGoals).toEqual([]);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'material_reward',
      'currency_delta',
      'formal_market_trade',
      'save_format_bump',
      'deepseek_authority_expansion',
    ]));
  });

  it('turns route supply and liquor-worm feeding gaps into local preparation state only', () => {
    const result = resolveQingmaoSupplyFeedingPreparationAction({
      livingWorldState: buildRouteState(),
      turn: 71,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
    });

    expect(result.success).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.rejectedReasons).toEqual([]);
    expect(result.supplyPlan.ruleDrafts.map(rule => rule.id)).toEqual(expect.arrayContaining([
      'supply_qingmao_route_food_water_pack',
      'supply_qingmao_route_shelter_and_trade_cover',
    ]));
    expect(result.feedingPlan.ruleDrafts.map(rule => rule.id)).toEqual([
      'feeding_liquor_worm_wine_stock_pressure',
    ]);
    expect(result.marketPreparationRule?.id).toBe('market_supply_preparation_before_trade');
    expect(result.knownFacts).toEqual([
      expect.objectContaining({
        id: 'qingmao_supply_feeding_preparation_baseline',
        summary: expect.stringContaining('没有补给入库'),
      }),
    ]);
    expect(result.factionPressure).toEqual([
      expect.objectContaining({
        id: 'faction_pressure_qingmao_supply_preparation_guyue_shanzhai_watch',
        pressureType: 'suspicion',
      }),
    ]);
    expect(result.npcMemories.map(entry => entry.id)).toEqual([
      'npc_memory_qingmao_supply_feeding_local_watch',
    ]);
    expect(result.playerGoals[0]).toEqual(expect.objectContaining({
      id: 'goal_escape_qingmao',
      status: 'deferred',
      nextStepHints: expect.arrayContaining([
        'supply:supply_qingmao_route_food_water_pack',
        'feeding:feeding_liquor_worm_wine_stock_pressure',
        'market:market_supply_preparation_before_trade',
      ]),
      blockedByRefIds: expect.arrayContaining([
        'gate:no_material_reward',
        'gate:no_currency_delta',
        'gate:no_formal_market_trade',
        'gap:liquor_worm_wine_stock',
      ]),
    }));
    expect(result.actionConsequences[0]).toEqual(expect.objectContaining({
      id: 'consequence_qingmao_supply_feeding_preparation_probe',
      scope: 'resource',
      followUpRefs: expect.arrayContaining([
        'supply:supply_qingmao_route_food_water_pack',
        'feeding:feeding_liquor_worm_wine_stock_pressure',
        'gate:no_material_reward',
      ]),
    }));
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(JSON.stringify(result)).not.toContain('material_reward_granted');
    expect(JSON.stringify(result)).not.toContain('currency_delta_applied');
    expect(JSON.stringify(result)).not.toContain('formal_market_trade_opened');
    expect(JSON.stringify(result)).not.toContain('route_entered_granted');
  });
});
