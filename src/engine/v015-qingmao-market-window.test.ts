import { describe, expect, it } from 'vitest';
import { resolveQingmaoMarketWindowAction } from './v015-qingmao-market-window';
import type { LivingWorldState } from '../types';

function buildLowRankEconomyState(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 90,
      day: 1,
      phase: 'afternoon',
      lastActionId: 'qingmao_refinement_boundary_probe',
    },
    knownFacts: {
      qingmao_supply_feeding_preparation_baseline: {
        id: 'qingmao_supply_feeding_preparation_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '补给和喂养缺口已经整理，但没有补给入库。',
        learnedTurn: 72,
        confidence: 'confirmed',
        tags: ['test'],
      },
      qingmao_refinement_fragment_boundary_baseline: {
        id: 'qingmao_refinement_fragment_boundary_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '残方和失败代价已经试读，但没有解锁蛊方。',
        learnedTurn: 82,
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
        lastUpdatedTurn: 82,
        rationale: '我要逃离青茅山，同时打听商队和市场窗口。',
        nextStepHints: ['market:market_supply_preparation_before_trade'],
        blockedByRefIds: ['gate:no_formal_market_trade'],
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
        followUpRefs: ['market:market_supply_preparation_before_trade'],
      },
      {
        id: 'consequence_qingmao_refinement_boundary_probe',
        actionId: 'qingmao_refinement_boundary_probe',
        turn: 82,
        scope: 'resource',
        publicSummary: '残方和失败代价边界已经整理。',
        effectRefs: ['qingmao_refinement_fragment_boundary_baseline'],
        followUpRefs: ['gate:no_refinement_success', 'gate:no_material_consumption'],
      },
    ],
  };
}

describe('v0.15.0-b3 Qingmao caravan and market window action', () => {
  it('blocks before low-rank market context exists', () => {
    const result = resolveQingmaoMarketWindowAction({
      livingWorldState: {
        worldClock: {
          turn: 90,
          day: 1,
          phase: 'afternoon',
          lastActionId: null,
        },
        knownFacts: {},
        playerGoals: [],
        actionConsequences: [],
      },
      turn: 90,
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.rejectedReasons).toContain('missing_low_rank_market_context');
    expect(result.knownFacts).toEqual([]);
    expect(result.factionPressure).toEqual([]);
    expect(result.npcMemories).toEqual([]);
    expect(result.actionConsequences).toEqual([]);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'formal_market_trade',
      'formal_shop_inventory',
      'currency_delta',
      'caravan_join',
      'save_format_bump',
      'deepseek_authority_expansion',
    ]));
  });

  it('records a candidate market window without trade, prices, inventory, or caravan joining', () => {
    const result = resolveQingmaoMarketWindowAction({
      livingWorldState: buildLowRankEconomyState(),
      turn: 91,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
    });

    expect(result.success).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.rejectedReasons).toEqual([]);
    expect(result.marketPlan.ruleDrafts.map(rule => rule.id)).toEqual(expect.arrayContaining([
      'market_caravan_contact_window_first_touch',
      'market_window_public_trade_observation',
      'market_trade_requirement_identity_and_guarantee',
      'market_public_reason_requirement',
    ]));
    expect(result.knownFacts).toEqual([
      expect.objectContaining({
        id: 'qingmao_market_window_candidate_baseline',
        summary: expect.stringContaining('没有买卖、价格表、库存、元石变化或商队加入'),
      }),
    ]);
    expect(result.factionPressure).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'faction_pressure_qingmao_market_window_caravan_opportunity',
        pressureType: 'opportunity',
      }),
      expect.objectContaining({
        id: 'faction_pressure_qingmao_market_window_guyue_shanzhai_attention',
        pressureType: 'suspicion',
      }),
    ]));
    expect(result.npcMemories.map(entry => entry.id)).toEqual([
      'npc_memory_qingmao_market_window_caravan_runner',
    ]);
    expect(result.playerGoals[0]).toEqual(expect.objectContaining({
      id: 'goal_escape_qingmao',
      status: 'deferred',
      nextStepHints: expect.arrayContaining([
        'market:market_caravan_contact_window_first_touch',
        'market:market_trade_requirement_identity_and_guarantee',
        'market:market_public_reason_requirement',
      ]),
      blockedByRefIds: expect.arrayContaining([
        'gate:no_formal_market_trade',
        'gate:no_formal_shop_inventory',
        'gate:no_currency_delta',
        'gate:no_caravan_join',
        'gap:identity_and_guarantee',
        'gap:public_trade_reason',
      ]),
    }));
    expect(result.actionConsequences[0]).toEqual(expect.objectContaining({
      id: 'consequence_qingmao_market_window_probe',
      scope: 'resource',
      followUpRefs: expect.arrayContaining([
        'market:market_caravan_contact_window_first_touch',
        'market:market_trade_requirement_identity_and_guarantee',
        'gate:no_formal_market_trade',
        'gate:no_formal_shop_inventory',
        'gate:no_currency_delta',
        'gate:no_caravan_join',
      ]),
    }));
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.message).toContain('不买卖、不写价格、不开放库存');
    expect(JSON.stringify(result)).not.toContain('交易成功！');
    expect(JSON.stringify(result)).not.toContain('购买成功');
    expect(JSON.stringify(result)).not.toContain('出售成功');
    expect(JSON.stringify(result)).not.toContain('市场已开放');
    expect(JSON.stringify(result)).not.toContain('formal_market_trade_opened');
    expect(JSON.stringify(result)).not.toContain('shop_inventory_opened');
    expect(JSON.stringify(result)).not.toContain('currency_delta_applied');
    expect(JSON.stringify(result)).not.toContain('caravan_joined');
  });
});
