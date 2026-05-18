import { describe, expect, it } from 'vitest';
import { resolveQingmaoGrayTradeBoundaryAction } from './v015-qingmao-gray-trade-boundary';
import type { LivingWorldState } from '../types';

function buildMarketWindowState(): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: 100,
      day: 1,
      phase: 'afternoon',
      lastActionId: 'qingmao_market_window_probe',
    },
    knownFacts: {
      qingmao_market_window_candidate_baseline: {
        id: 'qingmao_market_window_candidate_baseline',
        scope: 'region',
        source: 'engine_result',
        summary: '商队和市场窗口已经整理，但没有买卖、价格表或库存。',
        learnedTurn: 91,
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
        lastUpdatedTurn: 91,
        rationale: '我要逃离青茅山，顺便打听黑市和委托代售风险。',
        nextStepHints: ['market:market_caravan_contact_window_first_touch'],
        blockedByRefIds: ['gate:no_formal_market_trade'],
      },
    ],
    actionConsequences: [
      {
        id: 'consequence_qingmao_market_window_probe',
        actionId: 'qingmao_market_window_probe',
        turn: 91,
        scope: 'resource',
        publicSummary: '商队市场窗口候选已经整理。',
        effectRefs: ['qingmao_market_window_candidate_baseline'],
        followUpRefs: [
          'gate:no_formal_market_trade',
          'gap:identity_and_guarantee',
          'gap:public_trade_reason',
        ],
      },
    ],
  };
}

describe('v0.15.0-b4 Qingmao gray-trade and commission boundary action', () => {
  it('blocks before a market-window context exists', () => {
    const result = resolveQingmaoGrayTradeBoundaryAction({
      livingWorldState: {
        worldClock: {
          turn: 100,
          day: 1,
          phase: 'afternoon',
          lastActionId: null,
        },
        knownFacts: {},
        playerGoals: [],
        actionConsequences: [],
      },
      turn: 100,
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.rejectedReasons).toContain('missing_market_window_context');
    expect(result.knownFacts).toEqual([]);
    expect(result.npcMemories).toEqual([]);
    expect(result.actionConsequences).toEqual([]);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'formal_black_market',
      'black_market_trade',
      'commission_profit',
      'formal_task',
      'save_format_bump',
      'deepseek_authority_expansion',
    ]));
  });

  it('records only deferred gray-trade boundaries without market, commission, rewards, or capture settlement', () => {
    const result = resolveQingmaoGrayTradeBoundaryAction({
      livingWorldState: buildMarketWindowState(),
      turn: 101,
    });

    expect(result.success).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.rejectedReasons).toEqual([]);
    expect(result.grayTradePlan.ruleDrafts).toEqual([]);
    expect(result.boundaryRules.map(rule => rule.id)).toEqual(expect.arrayContaining([
      'deferred_gray_commission_candidate_outer_broker',
      'deferred_gray_fraud_fake_goods_risk',
      'deferred_gray_trade_route_risk',
      'deferred_forbidden_reward_boundary',
      'deferred_gray_anti_farm_commission_loop',
    ]));
    expect(result.knownFacts).toEqual([
      expect.objectContaining({
        id: 'qingmao_gray_trade_commission_boundary_baseline',
        summary: expect.stringContaining('没有正式黑市、委托收益、库存、价格、元石变化、交易成功或地点开放'),
      }),
    ]);
    expect(result.npcMemories.map(entry => entry.id)).toEqual([
      'npc_memory_qingmao_gray_trade_boundary_rumor_listener',
    ]);
    expect(result.playerGoals[0]).toEqual(expect.objectContaining({
      id: 'goal_escape_qingmao',
      status: 'deferred',
      nextStepHints: expect.arrayContaining([
        'gray_trade:deferred_gray_commission_candidate_outer_broker',
        'gray_trade:deferred_gray_fraud_fake_goods_risk',
      ]),
      blockedByRefIds: expect.arrayContaining([
        'gate:no_formal_black_market',
        'gate:no_commission_profit',
        'gate:no_gray_trade_inventory',
        'gate:no_formal_task',
        'gate:no_currency_delta',
        'risk:fraud_or_trap_unresolved',
        'risk:identity_wash_blocked',
      ]),
    }));
    expect(result.actionConsequences[0]).toEqual(expect.objectContaining({
      id: 'consequence_qingmao_gray_trade_boundary_probe',
      scope: 'resource',
      followUpRefs: expect.arrayContaining([
        'gray_trade:deferred_gray_commission_candidate_outer_broker',
        'gray_trade:deferred_forbidden_reward_boundary',
        'gate:no_formal_black_market',
        'gate:no_commission_profit',
        'gate:no_gray_trade_inventory',
        'gate:no_currency_delta',
      ]),
    }));
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.message).toContain('不开放黑市、不开放委托收益、不写交易结算');
    expect(JSON.stringify(result)).not.toContain('黑市已开放');
    expect(JSON.stringify(result)).not.toContain('委托收益已发放');
    expect(JSON.stringify(result)).not.toContain('交易成功！');
    expect(JSON.stringify(result)).not.toContain('库存已开放');
    expect(JSON.stringify(result)).not.toContain('currency_delta_applied');
    expect(JSON.stringify(result)).not.toContain('npc_capture_resolved');
  });
});
