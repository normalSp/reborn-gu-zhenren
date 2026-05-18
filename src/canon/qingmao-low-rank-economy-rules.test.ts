import { describe, expect, it } from 'vitest';
import economyRulesRaw from './qingmao-low-rank-economy-rules.json';

type RuleDraft = {
  id: string;
  category: string;
  title: string;
  summary: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  visibility: 'public' | 'limited_public' | 'hidden_ref_only';
  allowedUse: string[];
  blockedUse: string[];
  authorityOwner: string;
  rewardPolicy: string;
  antiFarmPolicy: string;
  saveImpact: string;
  blockedOutcome: string;
  publicHint: string;
};

const pack = economyRulesRaw as {
  version: string;
  status: string;
  sourceReview: {
    absorptionPolicy: string;
    runtimeAuthority: string;
    deepSeekAuthority: string;
    intakeReviews: string[];
    sourcePackages: string[];
  };
  boundaries: {
    forbiddenWrites: string[];
    allowedRuntimeOutputs: string[];
    deferredItemIds: string[];
  };
  materialCandidates: RuleDraft[];
  feedingRequirements: RuleDraft[];
  refinementBoundaries: RuleDraft[];
  supplyRequirements: RuleDraft[];
  marketWindows: RuleDraft[];
  antiFarmRules: RuleDraft[];
  factionAttentionRules: RuleDraft[];
  deferredGrayTradeBoundaries: RuleDraft[];
};

function currentRuleDrafts(): RuleDraft[] {
  return [
    ...pack.materialCandidates,
    ...pack.feedingRequirements,
    ...pack.refinementBoundaries,
    ...pack.supplyRequirements,
    ...pack.marketWindows,
    ...pack.antiFarmRules,
    ...pack.factionAttentionRules,
  ];
}

describe('v0.15.0-a2 Qingmao low-rank economy rule drafts', () => {
  it('keeps MiroFish intake as rewritten local rule drafts only', () => {
    expect(pack.version).toBe('v0.15.0-a2');
    expect(pack.status).toBe('low_rank_economy_rule_draft_first_cut');
    expect(pack.sourceReview.absorptionPolicy).toBe('rewritten_reborng_local_rule_draft');
    expect(pack.sourceReview.runtimeAuthority).toBe('local_canon_and_engine_only');
    expect(pack.sourceReview.deepSeekAuthority).toBe('narrative_candidates_clues_rumors_pressure_only');
    expect(pack.sourceReview.intakeReviews).toHaveLength(4);
    expect(pack.sourceReview.sourcePackages).toEqual(expect.arrayContaining([
      'v015_low_rank_economy_refinement_feeding_pack_export_ready.json',
      'v015_southern_border_market_caravan_trade_pack_export_ready.json',
      'v015_low_rank_black_market_commission_boundary_pack_export_ready.json',
    ]));
  });

  it('splits current low-rank economy drafts from deferred gray-trade boundaries', () => {
    expect(pack.materialCandidates).toHaveLength(1);
    expect(pack.feedingRequirements).toHaveLength(1);
    expect(pack.refinementBoundaries).toHaveLength(4);
    expect(pack.supplyRequirements).toHaveLength(2);
    expect(pack.marketWindows).toHaveLength(10);
    expect(pack.antiFarmRules).toHaveLength(3);
    expect(pack.factionAttentionRules).toHaveLength(3);
    expect(currentRuleDrafts()).toHaveLength(24);
    expect(pack.deferredGrayTradeBoundaries).toHaveLength(10);
    expect(pack.boundaries.deferredItemIds).toEqual(expect.arrayContaining([
      'v015_a938170c7e18',
      'v015_8cdcf3e40d61',
      'v015_457ae2b114ee',
      'v015_950991beff5c',
      'v015_c1fa4e5b5724',
      'v015_a566d84abb5e',
      'v015_7dcda82b76c1',
      'v015_4a0a8c48eee4',
      'v015_02d34210193f',
      'v015_7d1646a97dfb',
    ]));
  });

  it('blocks rewards, market authority, black-market runtime, DeepSeek authority, and save bumps', () => {
    expect(pack.boundaries.forbiddenWrites).toEqual(expect.arrayContaining([
      'material_reward',
      'currency_delta',
      'gu_reward',
      'recipe_unlock',
      'complete_recipe_unlock',
      'refinement_success',
      'formal_market_trade',
      'formal_shop_inventory',
      'black_market_trade',
      'commission_profit',
      'stable_arbitrage',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
      'save_format_bump',
    ]));
    expect(pack.boundaries.allowedRuntimeOutputs).toEqual(expect.arrayContaining([
      'economy_rule_preview',
      'feeding_gap_preview',
      'refinement_boundary_preview',
      'market_window_preview',
      'anti_farm_block_reason',
      'deferred_gray_trade_warning',
    ]));
  });

  it('requires every current draft to keep source traceability and non-reward policy', () => {
    const ids = new Set<string>();
    for (const entry of currentRuleDrafts()) {
      expect(entry.id).toMatch(/^[a-z0-9_]+$/);
      expect(ids.has(entry.id), entry.id).toBe(false);
      ids.add(entry.id);
      expect(entry.title.length, entry.id).toBeGreaterThan(4);
      expect(entry.summary.length, entry.id).toBeGreaterThan(12);
      expect(entry.sourceItemIds.length, entry.id).toBeGreaterThan(0);
      expect(entry.sourcePointerIds.length, entry.id).toBeGreaterThan(0);
      expect(entry.allowedUse, entry.id).toEqual(expect.arrayContaining(['rule_draft']));
      expect(entry.blockedUse, entry.id).toEqual(expect.arrayContaining(['deepseek_authority']));
      expect(entry.rewardPolicy, entry.id).toBe('none');
      expect(entry.saveImpact, entry.id).toBe('none');
      expect(entry.blockedOutcome, entry.id).toMatch(/不得|不能|不开放|不可/);
    }
  });

  it('keeps deferred gray-trade entries out of player-facing and runtime authority', () => {
    for (const entry of pack.deferredGrayTradeBoundaries) {
      expect(entry.visibility, entry.id).toBe('hidden_ref_only');
      expect(entry.allowedUse, entry.id).toEqual(expect.arrayContaining(['deferred', 'test_sample']));
      expect(entry.blockedUse, entry.id).toEqual(expect.arrayContaining(['runtime_truth', 'deepseek_authority']));
      expect(entry.rewardPolicy, entry.id).toBe('none');
      expect(entry.blockedOutcome, entry.id).toMatch(/不得|不能|不开放|不可/);
    }
  });

  it('does not contain forbidden original-text fields or high-rank overreach', () => {
    const serialized = JSON.stringify(pack);
    expect(serialized).not.toMatch(/originalText|excerpt|verbatim|quote|body/);
    expect(serialized).not.toContain('仙蛊');
    expect(serialized).not.toContain('宝黄天');
    expect(serialized).not.toContain('商家城成功');
    expect(serialized).not.toContain('黑市交易成功');
  });
});
