import { describe, expect, it } from 'vitest';
import qingmaoCanonAnchorsRaw from './qingmao-canon-anchors.json';
import qingmaoCanonFactCardsRaw from './qingmao-canon-fact-cards.json';
import qingmaoLowRankIfMatrixRaw from './qingmao-low-rank-if-matrix.json';

type Axis = {
  id: string;
  relatedAnchorIds: string[];
  defaultDeviationLevel: string;
  allowedWrites: string[];
  forbiddenWrites: string[];
  deepSeekAllowed: string[];
  deepSeekForbidden: string[];
};

type Rule = {
  id: string;
  priority: number;
  matcher: {
    targetRefs?: string[];
    intentTypes?: string[];
    rawTextIncludesAny?: string[];
  };
  axisIds: string[];
  anchorIds: string[];
  factCardIds: string[];
  hiddenFactRefIds: string[];
  deviationLevel: string;
  costTypes: string[];
  requiredPreconditions: string[];
  allowedOutcome: string;
  forbiddenWrites: string[];
  playerFacingResult: string;
};

const matrix = qingmaoLowRankIfMatrixRaw as {
  version: string;
  status: string;
  sourcePolicy: {
    runtimeAuthority: string;
    deepSeekAuthority: string;
  };
  deviationLevels: Array<{ id: string; runtimeWritePolicy: string }>;
  costTypes: Array<{ id: string }>;
  axes: Axis[];
  rules: Rule[];
};
const anchors = qingmaoCanonAnchorsRaw as {
  forbiddenHighLevelAxes: string[];
  anchors: Array<{ id: string }>;
};
const facts = qingmaoCanonFactCardsRaw as {
  cards: Array<{ id: string; visibility: string; v012Category: string }>;
};

const expectedAxes = [
  'npc_attention',
  'faction_pressure',
  'resource_control',
  'route_escape',
  'hidden_fact_probe',
  'local_survival',
  'canon_anchor_pressure',
];

describe('v0.12.0-a2 Qingmao low-rank IF matrix', () => {
  it('declares the approved low-rank levels and axes only', () => {
    expect(matrix.version).toBe('v0.12.0-a2');
    expect(matrix.status).toBe('low_rank_if_matrix_first_cut');
    expect(matrix.sourcePolicy.runtimeAuthority).toBe('local_canon_and_engine_only');
    expect(matrix.sourcePolicy.deepSeekAuthority).toBe('narrative_candidates_clues_rumors_pressure_only');
    expect(matrix.deviationLevels.map(level => level.id)).toEqual([
      'blocked',
      'rumor_only',
      'precondition_required',
      'minor_deviation',
      'major_deviation_candidate',
    ]);
    expect(matrix.deviationLevels.every(level => level.runtimeWritePolicy.length > 4)).toBe(true);
    expect(matrix.axes.map(axis => axis.id)).toEqual(expectedAxes);

    const forbiddenHighAxes = new Set(anchors.forbiddenHighLevelAxes);
    for (const axis of matrix.axes) {
      expect(forbiddenHighAxes.has(axis.id), axis.id).toBe(false);
      expect(axis.allowedWrites.length, axis.id).toBeGreaterThan(0);
      expect(axis.forbiddenWrites.length, axis.id).toBeGreaterThan(0);
      expect(axis.deepSeekAllowed.length, axis.id).toBeGreaterThan(0);
      expect(axis.deepSeekForbidden.length, axis.id).toBeGreaterThan(0);
    }
  });

  it('links rules to existing anchors, fact cards, levels, and cost types', () => {
    const anchorIds = new Set(anchors.anchors.map(anchor => anchor.id));
    const factById = new Map(facts.cards.map(card => [card.id, card]));
    const levelIds = new Set(matrix.deviationLevels.map(level => level.id));
    const costTypeIds = new Set(matrix.costTypes.map(cost => cost.id));
    const axisIds = new Set(matrix.axes.map(axis => axis.id));

    expect(matrix.rules.length).toBeGreaterThanOrEqual(12);

    for (const rule of matrix.rules) {
      expect(rule.id).toMatch(/^[a-z0-9_]+$/);
      expect(rule.priority, rule.id).toBeGreaterThan(0);
      expect(levelIds.has(rule.deviationLevel), rule.id).toBe(true);
      expect(rule.allowedOutcome.length, rule.id).toBeGreaterThan(4);
      expect(rule.playerFacingResult.length, rule.id).toBeGreaterThan(10);
      expect(rule.forbiddenWrites.length, rule.id).toBeGreaterThan(0);
      expect(
        !!rule.matcher.rawTextIncludesAny?.length || !!rule.matcher.targetRefs?.length || !!rule.matcher.intentTypes?.length,
        rule.id,
      ).toBe(true);

      for (const axisId of rule.axisIds) {
        expect(axisIds.has(axisId), `${rule.id}:${axisId}`).toBe(true);
      }
      for (const anchorId of rule.anchorIds) {
        expect(anchorIds.has(anchorId), `${rule.id}:${anchorId}`).toBe(true);
      }
      for (const factId of rule.factCardIds) {
        expect(factById.has(factId), `${rule.id}:${factId}`).toBe(true);
        expect(factById.get(factId)?.visibility, `${rule.id}:${factId}`).not.toBe('hidden');
      }
      for (const factId of rule.hiddenFactRefIds) {
        expect(factById.has(factId), `${rule.id}:${factId}`).toBe(true);
        expect(factById.get(factId)?.visibility, `${rule.id}:${factId}`).toBe('hidden');
        expect(factById.get(factId)?.v012Category, `${rule.id}:${factId}`).toBe('hidden_fact_ref');
      }
      for (const costType of rule.costTypes) {
        expect(costTypeIds.has(costType), `${rule.id}:${costType}`).toBe(true);
      }
    }
  });

  it('has at least two rule samples per approved IF axis', () => {
    for (const axisId of expectedAxes) {
      const rules = matrix.rules.filter(rule => rule.axisIds.includes(axisId));
      expect(rules.length, axisId).toBeGreaterThanOrEqual(2);
    }
  });

  it('covers the agreed extreme and meaningful-choice samples', () => {
    const ids = new Set(matrix.rules.map(rule => rule.id));
    expect(ids.has('block_rank_nine_or_immortal_demand')).toBe(true);
    expect(ids.has('block_unbounded_resource_reward')).toBe(true);
    expect(ids.has('block_bai_ning_bing_direct_kill')).toBe(true);
    expect(ids.has('block_first_gen_hidden_truth')).toBe(true);
    expect(ids.has('block_spirit_spring_hidden_cause')).toBe(true);
    expect(ids.has('block_flower_wine_hidden_location')).toBe(true);
    expect(ids.has('precondition_follow_fang_yuan_public_only')).toBe(true);
    expect(ids.has('major_candidate_join_bai_clan')).toBe(true);
    expect(ids.has('precondition_escape_qingmao_route')).toBe(true);
    expect(ids.has('minor_resource_feeding_plan')).toBe(true);
    expect(ids.has('minor_war_merit_patrol')).toBe(true);
  });
});
