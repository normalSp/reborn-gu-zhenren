import { describe, expect, it } from 'vitest';
import qingmaoCanonAnchorsRaw from './qingmao-canon-anchors.json';
import qingmaoCanonFactCardsRaw from './qingmao-canon-fact-cards.json';

type FactCard = {
  id: string;
  visibility: string;
  v012Category: string;
};

type CanonAnchor = {
  id: string;
  title: string;
  stage: string;
  anchorType: string;
  canonStatus: string;
  visibility: string;
  factCardIds: string[];
  playerVisibleFactIds: string[];
  hiddenFactRefIds: string[];
  ifDeviationPointIds: string[];
  lowRankIfAxes: string[];
  allowedPlayerLevers: string[];
  protectedOutcomes: string[];
  deepSeekAllowed: string[];
  deepSeekForbidden: string[];
  nextPhaseUse: string;
};

const facts = qingmaoCanonFactCardsRaw as { cards: FactCard[] };
const anchors = qingmaoCanonAnchorsRaw as {
  version: string;
  status: string;
  saveFormatDecision: {
    currentSaveFormatVersion: number;
    bumpRequiredInA1: boolean;
  };
  classificationPolicy: {
    allowedFactCategories: string[];
    hiddenExposure: string;
    deepSeekAuthority: string;
    localAuthority: string;
  };
  allowedLowRankIfAxes: string[];
  forbiddenHighLevelAxes: string[];
  anchors: CanonAnchor[];
};

const factById = new Map(facts.cards.map(card => [card.id, card]));
const allowedAxes = new Set(anchors.allowedLowRankIfAxes);
const forbiddenAxes = new Set(anchors.forbiddenHighLevelAxes);

describe('v0.12.0-a1 Qingmao canon anchor table', () => {
  it('declares a static, non-save-format-changing anchor source', () => {
    expect(anchors.version).toBe('v0.12.0-a1');
    expect(anchors.status).toBe('static_anchor_truth_source');
    expect(anchors.saveFormatDecision.currentSaveFormatVersion).toBe(22);
    expect(anchors.saveFormatDecision.bumpRequiredInA1).toBe(false);
    expect(anchors.classificationPolicy.hiddenExposure).toBe('hidden_ref_only');
    expect(anchors.classificationPolicy.deepSeekAuthority).toBe('narrative_candidates_clues_rumors_pressure_only');
    expect(anchors.classificationPolicy.localAuthority).toBe('facts_rewards_locations_battles_fate_and_endings');
    expect(anchors.classificationPolicy.allowedFactCategories).toEqual([
      'canon_hard_fact',
      'player_visible_fact',
      'hidden_fact_ref',
      'if_deviation_point',
    ]);
  });

  it('links anchors only to known fact cards with correct visibility boundaries', () => {
    const ids = new Set<string>();

    for (const anchor of anchors.anchors) {
      expect(anchor.id).toMatch(/^[a-z0-9_]+$/);
      expect(ids.has(anchor.id), anchor.id).toBe(false);
      ids.add(anchor.id);
      expect(anchor.title.length, anchor.id).toBeGreaterThan(4);
      expect(anchor.factCardIds.length, anchor.id).toBeGreaterThan(0);
      expect(anchor.allowedPlayerLevers.length, anchor.id).toBeGreaterThan(0);
      expect(anchor.protectedOutcomes.length, anchor.id).toBeGreaterThan(0);
      expect(anchor.deepSeekAllowed.length, anchor.id).toBeGreaterThan(0);
      expect(anchor.deepSeekForbidden.length, anchor.id).toBeGreaterThan(0);
      expect(anchor.nextPhaseUse.length, anchor.id).toBeGreaterThan(12);

      for (const factId of anchor.factCardIds) {
        expect(factById.has(factId), `${anchor.id}:${factId}`).toBe(true);
      }
      for (const factId of anchor.playerVisibleFactIds) {
        expect(anchor.factCardIds.includes(factId), `${anchor.id}:${factId}`).toBe(true);
        expect(factById.get(factId)?.visibility, `${anchor.id}:${factId}`).not.toBe('hidden');
      }
      for (const factId of anchor.hiddenFactRefIds) {
        expect(anchor.factCardIds.includes(factId), `${anchor.id}:${factId}`).toBe(true);
        expect(factById.get(factId)?.visibility, `${anchor.id}:${factId}`).toBe('hidden');
        expect(factById.get(factId)?.v012Category, `${anchor.id}:${factId}`).toBe('hidden_fact_ref');
      }
      for (const factId of anchor.ifDeviationPointIds) {
        expect(anchor.factCardIds.includes(factId), `${anchor.id}:${factId}`).toBe(true);
        expect(factById.get(factId)?.v012Category, `${anchor.id}:${factId}`).toBe('if_deviation_point');
      }
      for (const axis of anchor.lowRankIfAxes) {
        expect(allowedAxes.has(axis), `${anchor.id}:${axis}`).toBe(true);
        expect(forbiddenAxes.has(axis), `${anchor.id}:${axis}`).toBe(false);
      }
    }
  });

  it('contains the required Qingmao anchors before route and reaction development', () => {
    const ids = new Set(anchors.anchors.map(anchor => anchor.id));
    expect(ids.has('qingmao_region_foundation')).toBe(true);
    expect(ids.has('guyue_clan_school_order')).toBe(true);
    expect(ids.has('qingmao_mortal_resource_loop')).toBe(true);
    expect(ids.has('qingmao_caravan_and_route_window')).toBe(true);
    expect(ids.has('qingmao_wolf_tide_pressure_chain')).toBe(true);
    expect(ids.has('qingmao_three_clan_pressure_chain')).toBe(true);
    expect(ids.has('fang_yuan_hidden_causality_guard')).toBe(true);
    expect(ids.has('bai_ning_bing_pressure_guard')).toBe(true);
    expect(ids.has('guyue_first_gen_hidden_anchor_guard')).toBe(true);
    expect(ids.has('qingmao_resource_and_crisis_chain')).toBe(true);
  });

  it('guards hidden canon and key NPC outcomes from DeepSeek or free-text settlement', () => {
    const hiddenGuardAnchors = anchors.anchors.filter(anchor => anchor.anchorType === 'hidden_guard');
    expect(hiddenGuardAnchors.length).toBeGreaterThanOrEqual(4);

    for (const anchor of hiddenGuardAnchors) {
      expect(anchor.hiddenFactRefIds.length, anchor.id).toBeGreaterThan(0);
      expect(anchor.deepSeekForbidden.join(' '), anchor.id).toMatch(/reveal|hidden|settle|award|truth|location/);
      expect(anchor.protectedOutcomes.join(' '), anchor.id).toMatch(/cannot|hidden|force|free_text|reveal/);
    }

    const baiNingBing = anchors.anchors.find(anchor => anchor.id === 'bai_ning_bing_pressure_guard')!;
    expect(baiNingBing.protectedOutcomes).toContain('player_cannot_kill_bai_ning_bing_by_free_text');

    const fangYuan = anchors.anchors.find(anchor => anchor.id === 'fang_yuan_hidden_causality_guard')!;
    expect(fangYuan.protectedOutcomes).toContain('player_cannot_know_fang_yuan_private_causality');
  });
});
