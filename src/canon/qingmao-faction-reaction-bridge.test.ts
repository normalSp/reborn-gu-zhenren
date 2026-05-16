import { describe, expect, it } from 'vitest';
import reactionBridgeRaw from './qingmao-faction-reaction-bridge.json';

const bridge = reactionBridgeRaw as {
  version: string;
  status: string;
  sourceReview: Record<string, string>;
  boundaries: {
    forbiddenWrites: string[];
  };
  reactionRules: Array<{
    id: string;
    summary: string;
    sourceItemIds: string[];
    sourcePointerIds: string[];
    subjectId: string;
    pressureAxis: string;
    pressureType: string;
    likelyReactions: string[];
    triggerRefs: string[];
  }>;
};

describe('v0.12.0-b2 Qingmao faction reaction bridge rules', () => {
  it('keeps MiroFish material as RebornG-owned rule drafts', () => {
    expect(bridge.version).toBe('v0.12.0-b2');
    expect(bridge.status).toBe('faction_reaction_bridge_rule_draft_first_cut');
    expect(bridge.sourceReview.absorptionPolicy).toBe('rewritten_reborng_local_rule_draft');
    expect(bridge.sourceReview.runtimeAuthority).toBe('local_canon_and_engine_only');
    expect(bridge.sourceReview.deepSeekAuthority).toBe('narrative_candidates_clues_rumors_pressure_only');
  });

  it('absorbs all reviewed items with source pointers and non-empty summaries', () => {
    expect(bridge.reactionRules).toHaveLength(12);

    for (const rule of bridge.reactionRules) {
      expect(rule.id).toMatch(/^reaction_[a-z0-9_]+$/);
      expect(rule.summary.length, rule.id).toBeGreaterThan(10);
      expect(rule.sourceItemIds.length, rule.id).toBeGreaterThan(0);
      expect(rule.sourcePointerIds.length, rule.id).toBeGreaterThan(0);
      expect(rule.subjectId.length, rule.id).toBeGreaterThan(3);
      expect(rule.pressureAxis.length, rule.id).toBeGreaterThan(3);
      expect(['suspicion', 'favor', 'hostility', 'opportunity']).toContain(rule.pressureType);
      expect(rule.likelyReactions.length, rule.id).toBeGreaterThan(0);
      expect(rule.triggerRefs.length, rule.id).toBeGreaterThan(0);
    }
  });

  it('keeps reaction outputs bounded away from faction identity, rewards, hidden facts, and NPC fate', () => {
    expect(bridge.boundaries.forbiddenWrites).toEqual(expect.arrayContaining([
      'standing_delta',
      'faction_transfer',
      'faction_identity_change',
      'reward',
      'location_unlock',
      'npc_death',
      'pursuit_success',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));

    const serialized = JSON.stringify(bridge);
    expect(serialized).not.toMatch(/originalText|excerpt|verbatim/);
    expect(serialized).not.toContain('春秋蝉');
    expect(serialized).not.toContain('回溯');
    expect(serialized).not.toContain('重生');
  });
});
