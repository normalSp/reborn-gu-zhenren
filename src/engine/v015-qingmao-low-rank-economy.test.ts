import { describe, expect, it } from 'vitest';
import {
  buildQingmaoLowRankEconomyPlan,
  inferQingmaoLowRankEconomyFocusHints,
  isForbiddenQingmaoLowRankEconomyWrite,
  listDeferredQingmaoGrayTradeBoundaries,
  listQingmaoLowRankEconomyRuleDrafts,
} from './v015-qingmao-low-rank-economy';

describe('v0.15.0-a2 Qingmao low-rank economy helper', () => {
  it('lists current rule drafts separately from deferred gray-trade boundaries', () => {
    const current = listQingmaoLowRankEconomyRuleDrafts();
    const deferred = listDeferredQingmaoGrayTradeBoundaries();

    expect(current).toHaveLength(24);
    expect(deferred).toHaveLength(10);
    expect(current.some(entry => entry.focus === 'gray_trade')).toBe(false);
    expect(deferred.every(entry => entry.focus === 'gray_trade' || entry.focus === 'anti_farm' || entry.focus === 'faction_attention')).toBe(true);
    expect(current.map(entry => entry.id)).toEqual(expect.arrayContaining([
      'feeding_liquor_worm_wine_stock_pressure',
      'recipe_fragment_incomplete_formula_boundary',
      'market_caravan_contact_window_first_touch',
      'anti_farm_low_rank_identity_ceiling',
    ]));
  });

  it('builds a read-only all-focus plan without store, save, market, reward, or DeepSeek authority', () => {
    const plan = buildQingmaoLowRankEconomyPlan();

    expect(plan.status).toBe('rule_draft_preview_only');
    expect(plan.version).toBe('v0.15.0-a2');
    expect(plan.focus).toBe('all');
    expect(plan.ruleDrafts).toHaveLength(24);
    expect(plan.deferredGrayTradeBoundaries).toHaveLength(10);
    expect(plan.statePatchApplied).toBe(false);
    expect(plan.canGrantReward).toBe(false);
    expect(plan.canOpenMarket).toBe(false);
    expect(plan.canWriteSave).toBe(false);
    expect(plan.deepSeekAuthority).toBe('no_new_authority');
    expect(plan.miroFishNeed).toBe('not_needed');
    expect(plan.forbiddenWrites).toEqual(expect.arrayContaining([
      'material_reward',
      'currency_delta',
      'gu_reward',
      'complete_recipe_unlock',
      'formal_market_trade',
      'black_market_trade',
      'commission_profit',
      'deepseek_authority_expansion',
      'save_format_bump',
    ]));
  });

  it('filters by explicit focus and keeps source references visible for audit only', () => {
    const plan = buildQingmaoLowRankEconomyPlan({ focus: 'market', maxRules: 3 });

    expect(plan.focus).toBe('market');
    expect(plan.ruleDrafts).toHaveLength(3);
    expect(plan.ruleDrafts.every(entry => entry.focus === 'market')).toBe(true);
    expect(plan.visibleSourceRefs).toEqual(expect.arrayContaining([
      'v015_476f44fe7d11',
      'sp_43cce366ab6b',
    ]));
    expect(plan.publicSummary).toContain('不开放完整交易');
    expect(plan.nextStepHint).toContain('不开放完整坊市');
  });

  it('infers focus hints from player intent without granting the requested outcome', () => {
    const hints = inferQingmaoLowRankEconomyFocusHints('我想喂养酒虫，再拿残方炼蛊，然后找商队问价，最好去黑市委托代售');
    const plan = buildQingmaoLowRankEconomyPlan({
      intentText: '我想喂养酒虫，再拿残方炼蛊，然后找商队问价，最好去黑市委托代售',
      includeDeferredWarnings: false,
      maxRules: 2,
    });

    expect(hints).toEqual(expect.arrayContaining(['feeding', 'refinement', 'market', 'gray_trade']));
    expect(plan.focus).toBe('feeding');
    expect(plan.ruleDrafts).toHaveLength(1);
    expect(plan.ruleDrafts[0]).toEqual(expect.objectContaining({
      id: 'feeding_liquor_worm_wine_stock_pressure',
      rewardPolicy: 'none',
      saveImpact: 'none',
    }));
    expect(JSON.stringify(plan)).not.toContain('交易成功');
    expect(JSON.stringify(plan)).not.toContain('炼蛊成功');
  });

  it('shows gray trade as deferred risk instead of runtime rules', () => {
    const plan = buildQingmaoLowRankEconomyPlan({ focus: 'gray_trade' });

    expect(plan.ruleDrafts).toEqual([]);
    expect(plan.deferredGrayTradeBoundaries).toHaveLength(10);
    expect(plan.publicSummary).toContain('默认延期');
    expect(plan.nextStepHint).toContain('用户决策');
    expect(plan.deferredGrayTradeBoundaries[0]).toEqual(expect.objectContaining({
      visibility: 'hidden_ref_only',
      rewardPolicy: 'none',
    }));
  });

  it('protects forbidden write categories through the helper', () => {
    expect(isForbiddenQingmaoLowRankEconomyWrite('material_reward')).toBe(true);
    expect(isForbiddenQingmaoLowRankEconomyWrite('formal_market_trade')).toBe(true);
    expect(isForbiddenQingmaoLowRankEconomyWrite('black_market_trade')).toBe(true);
    expect(isForbiddenQingmaoLowRankEconomyWrite('deepseek_authority_expansion')).toBe(true);
    expect(isForbiddenQingmaoLowRankEconomyWrite('save_format_bump')).toBe(true);
    expect(isForbiddenQingmaoLowRankEconomyWrite('economy_rule_preview')).toBe(false);
  });

  it('returns defensive copies rather than mutable canon references', () => {
    const first = listQingmaoLowRankEconomyRuleDrafts();
    first[0].sourceItemIds.push('mutated');
    first[0].allowedUse.push('mutated');

    const second = listQingmaoLowRankEconomyRuleDrafts();
    expect(second[0].sourceItemIds).not.toContain('mutated');
    expect(second[0].allowedUse).not.toContain('mutated');
  });
});
