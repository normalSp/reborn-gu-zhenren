import { describe, expect, it } from 'vitest';
import qingmaoCanonFactCardsRaw from './qingmao-canon-fact-cards.json';

type V012FactCategory =
  | 'canon_hard_fact'
  | 'player_visible_fact'
  | 'hidden_fact_ref'
  | 'if_deviation_point';

type FactCard = {
  id: string;
  scope: string;
  classification: string;
  v012Category: V012FactCategory;
  visibility: string;
  confidence: string;
  summary: string;
  playerVisibleSummary?: string;
  anchorRefs?: string[];
  ifAxes?: string[];
  sourcePointers: Array<{
    path: string;
    locator: string;
    keywords: string[];
    note?: string;
  }>;
  runtimeExposure?: string;
  revealPolicyId?: string;
  designBoundary: string;
};

const data = qingmaoCanonFactCardsRaw as {
  version: string;
  status: string;
  copyrightPolicy: string;
  sourcePolicy: {
    forbiddenStoredContent: string[];
    runtimeAuthority: string;
    deepSeekAuthority: string;
  };
  cards: FactCard[];
};

const allowedFactCategories = new Set<V012FactCategory>([
  'canon_hard_fact',
  'player_visible_fact',
  'hidden_fact_ref',
  'if_deviation_point',
]);

const allowedQingmaoIfAxes = new Set([
  'npc_attention',
  'faction_pressure',
  'resource_control',
  'route_escape',
  'hidden_fact_probe',
  'local_survival',
  'canon_anchor_pressure',
]);

const forbiddenHighLevelAxes = new Set([
  'protect_fate',
  'break_fate',
  'venerable_balance',
  'immortal_trade',
  'rank_nine_acquisition',
  'treasure_yellow_heaven_transaction',
]);

describe('v0.12.0-a1 Qingmao canon fact cards', () => {
  it('stores summaries and source pointers only', () => {
    expect(data.version).toBe('v0.12.0-a1');
    expect(data.status).toBe('expanded_static_truth_source');
    expect(data.copyrightPolicy).toBe('summary_and_locator_only');
    expect(data.sourcePolicy.forbiddenStoredContent).toContain('original_text_excerpt');
    expect(data.sourcePolicy.forbiddenStoredContent).toContain('verbatim_original_prose');
    expect(data.sourcePolicy.deepSeekAuthority).toMatch(/narrative|candidates|pressure/);
    expect(data.cards.length).toBeGreaterThanOrEqual(20);

    for (const card of data.cards) {
      expect(card.id).toMatch(/^[a-z0-9_]+$/);
      expect(card.summary.length, card.id).toBeGreaterThan(8);
      expect(card.summary.length, card.id).toBeLessThanOrEqual(90);
      expect(card.designBoundary.length, card.id).toBeLessThanOrEqual(120);
      expect(allowedFactCategories.has(card.v012Category), card.id).toBe(true);
      expect(card.anchorRefs?.length, card.id).toBeGreaterThan(0);
      expect((card as any).originalText).toBeUndefined();
      expect((card as any).excerpt).toBeUndefined();
      expect((card as any).quote).toBeUndefined();
      expect(card.sourcePointers.length, card.id).toBeGreaterThan(0);
      for (const pointer of card.sourcePointers) {
        expect(pointer.path).toBe('doc/original work/reverend-insanity.txt');
        expect(pointer.locator, card.id).toMatch(/^L\d+(?:-L\d+)?$/);
        expect(pointer.keywords.length, card.id).toBeGreaterThan(0);
      }
    }
  });

  it('keeps hidden facts as refs and never as player-visible summaries', () => {
    const hiddenCards = data.cards.filter(card => card.visibility === 'hidden');
    expect(hiddenCards.length).toBeGreaterThanOrEqual(5);

    for (const card of hiddenCards) {
      expect(card.classification, card.id).toBe('hidden_fact');
      expect(card.v012Category, card.id).toBe('hidden_fact_ref');
      expect(card.runtimeExposure, card.id).toBe('hidden_ref_only');
      expect(card.revealPolicyId, card.id).toBeTruthy();
      expect(card.playerVisibleSummary, card.id).toBeUndefined();
      expect(card.designBoundary, card.id).toMatch(/DeepSeek|UI|隐藏事实|不可见|不能泄露/);
    }
  });

  it('uses low-rank IF axes only for Qingmao deviation points', () => {
    const deviationCards = data.cards.filter(card => card.v012Category === 'if_deviation_point');
    expect(deviationCards.map(card => card.id)).toEqual(expect.arrayContaining([
      'qingmao_caravan_trade_window',
      'qingmao_wolf_tide_recurring_pressure',
      'qingmao_three_clan_alliance_war_merit',
    ]));

    for (const card of deviationCards) {
      expect(card.ifAxes?.length, card.id).toBeGreaterThan(0);
      for (const axis of card.ifAxes || []) {
        expect(allowedQingmaoIfAxes.has(axis), `${card.id}:${axis}`).toBe(true);
        expect(forbiddenHighLevelAxes.has(axis), `${card.id}:${axis}`).toBe(false);
      }
    }
  });

  it('covers the v0.12-a1 Qingmao domains needed before route and reaction work', () => {
    const ids = new Set(data.cards.map(card => card.id));
    expect(ids.has('qingmao_location_guyue_village')).toBe(true);
    expect(ids.has('guyue_aperture_ceremony_and_clan_school')).toBe(true);
    expect(ids.has('guyue_aptitude_grade_public_order')).toBe(true);
    expect(ids.has('primeval_stone_mortal_currency_and_cultivation')).toBe(true);
    expect(ids.has('guyue_moon_orchid_feeding_base')).toBe(true);
    expect(ids.has('qingmao_caravan_trade_window')).toBe(true);
    expect(ids.has('qingmao_wolf_tide_recurring_pressure')).toBe(true);
    expect(ids.has('qingmao_three_clan_alliance_war_merit')).toBe(true);
    expect(ids.has('flower_wine_monk_public_legend')).toBe(true);
    expect(ids.has('flower_wine_inheritance_hidden_location_ref')).toBe(true);
    expect(ids.has('guyue_first_gen_hidden_blood_path_ref')).toBe(true);
    expect(ids.has('bai_ning_bing_extreme_body_hidden_risk_ref')).toBe(true);
  });
});
