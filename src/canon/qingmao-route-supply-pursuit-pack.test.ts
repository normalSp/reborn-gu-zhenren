import { describe, expect, it } from 'vitest';
import routeSupplyPursuitRaw from './qingmao-route-supply-pursuit-pack.json';

const pack = routeSupplyPursuitRaw as {
  version: string;
  status: string;
  sourceReview: Record<string, string>;
  boundaries: {
    forbiddenWrites: string[];
    deferredItemIds: string[];
  };
  routeCandidates: Array<{
    id: string;
    sourceItemIds: string[];
    sourcePointerIds: string[];
    summary: string;
    blockedOutcome: string;
  }>;
  supplyRequirements: Array<{
    id: string;
    sourceItemIds: string[];
    sourcePointerIds: string[];
    summary: string;
    blockedOutcome: string;
  }>;
  pursuitTriggers: Array<{
    id: string;
    sourceItemIds: string[];
    sourcePointerIds: string[];
    summary: string;
    trigger: string;
    riskDelta: number;
  }>;
};

describe('v0.12.0-b1 Qingmao route/supply/pursuit pack', () => {
  it('keeps MiroFish material as local rule drafts only', () => {
    expect(pack.version).toBe('v0.12.0-b1');
    expect(pack.status).toBe('route_supply_pursuit_rule_draft_first_cut');
    expect(pack.sourceReview.absorptionPolicy).toBe('rewritten_reborng_local_rule_draft');
    expect(pack.sourceReview.runtimeAuthority).toBe('local_canon_and_engine_only');
    expect(pack.sourceReview.deepSeekAuthority).toBe('narrative_candidates_clues_rumors_pressure_only');
  });

  it('absorbs only the review-approved b1 categories', () => {
    expect(pack.routeCandidates).toHaveLength(3);
    expect(pack.supplyRequirements).toHaveLength(4);
    expect(pack.pursuitTriggers).toHaveLength(3);
    expect(pack.boundaries.deferredItemIds).toEqual(expect.arrayContaining([
      'pressure_ch0060_jiafu_caravan_revenge',
      'pressure_ch0092_jiaosan_group_task_authority',
      'hidden_ref_ch0010_household_trap',
    ]));
  });

  it('keeps routes and supplies as previews, not rewards or unlocks', () => {
    expect(pack.boundaries.forbiddenWrites).toEqual(expect.arrayContaining([
      'escape_success',
      'location_unlock',
      'reward',
      'currency_delta',
      'material_reward',
      'faction_identity_change',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));

    for (const entry of [...pack.routeCandidates, ...pack.supplyRequirements]) {
      expect(entry.id).toMatch(/^(route|supply)_qingmao_/);
      expect(entry.sourceItemIds.length, entry.id).toBeGreaterThan(0);
      expect(entry.sourcePointerIds.length, entry.id).toBeGreaterThan(0);
      expect(entry.summary, entry.id).not.toContain('方源');
      expect(entry.blockedOutcome, entry.id).toMatch(/不能|不得/);
    }
  });

  it('keeps pursuit triggers bounded and numeric-light', () => {
    for (const trigger of pack.pursuitTriggers) {
      expect(trigger.id).toMatch(/^pursuit_qingmao_/);
      expect(trigger.sourceItemIds.length, trigger.id).toBe(1);
      expect(trigger.sourcePointerIds.length, trigger.id).toBeGreaterThan(0);
      expect(trigger.summary, trigger.id).not.toContain('方源');
      expect(trigger.trigger.length, trigger.id).toBeGreaterThan(6);
      expect(trigger.riskDelta, trigger.id).toBeGreaterThanOrEqual(1);
      expect(trigger.riskDelta, trigger.id).toBeLessThanOrEqual(2);
    }
  });

  it('does not contain forbidden original-text fields or hidden bodies', () => {
    const serialized = JSON.stringify(pack);
    expect(serialized).not.toMatch(/originalText|excerpt|verbatim/);
    expect(serialized).not.toContain('春秋蝉');
    expect(serialized).not.toContain('hidden body');
  });
});
