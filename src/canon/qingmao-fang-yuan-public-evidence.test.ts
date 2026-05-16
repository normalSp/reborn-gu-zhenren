import { describe, expect, it } from 'vitest';
import evidenceRaw from './qingmao-fang-yuan-public-evidence.json';

const quoteLikeKeys = ['quote', 'quotes', 'originalText', 'excerpt', 'verbatim'];
const forbiddenTerms = ['春秋蝉', '重生', '回溯', '未来记忆'];

function walk(value: unknown, hits: string[] = [], path = '$'): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, hits, `${path}[${index}]`));
    return hits;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (quoteLikeKeys.includes(key)) hits.push(`${path}.${key}`);
      if (key === 'forbiddenPlayerVisibleTerms') continue;
      walk(child, hits, `${path}.${key}`);
    }
    return hits;
  }
  if (typeof value === 'string') {
    for (const term of forbiddenTerms) {
      if (value.includes(term)) hits.push(`${path}:${term}`);
    }
  }
  return hits;
}

describe('v0.12.0-b3 Qingmao Fang Yuan public evidence canon draft', () => {
  it('keeps the package as local rule draft without quote-like fields or hidden terms', () => {
    expect(evidenceRaw.status).toBe('fang_yuan_public_evidence_rule_draft_first_cut');
    expect(evidenceRaw.sourceReview.runtimeAuthority).toBe('reborn_local_rule_draft_only');
    expect(evidenceRaw.sourceReview.deepSeekAuthority).toBe('narrative_explanation_only');
    expect(walk(evidenceRaw)).toEqual([]);
  });

  it('contains the reviewed public and hidden-boundary surfaces', () => {
    expect(evidenceRaw.evidenceItems).toHaveLength(13);
    expect(evidenceRaw.hiddenBoundaryRefs).toHaveLength(2);
    expect(evidenceRaw.inquiryProfiles.length).toBeGreaterThanOrEqual(5);
    expect(evidenceRaw.evidenceItems.map(item => item.sourceItemId)).toContain('fy_public_ch0022_clan_school_ranking_board');
    expect(evidenceRaw.hiddenBoundaryRefs.map(item => item.sourceItemId)).toEqual([
      'fy_hidden_boundary_ch0024_supply_purpose',
      'fy_hidden_boundary_ch0087_arena_internal_check',
    ]);
  });

  it('keeps runtime boundaries stricter than public evidence summaries', () => {
    expect(evidenceRaw.boundaries.forbiddenWrites).toEqual(expect.arrayContaining([
      'tracking_success',
      'capture_result',
      'fang_yuan_hidden_causality',
      'hidden_fact_reveal',
      'reward',
      'location_unlock',
      'deepseek_authority_expansion',
    ]));

    for (const item of evidenceRaw.evidenceItems) {
      expect(item.sourcePointerIds.length).toBeGreaterThan(0);
      expect(item.playerVisibleSummary).not.toMatch(/真实目的已经确定|追踪成功|抓捕成功/);
      for (const term of forbiddenTerms) {
        expect(item.playerVisibleSummary).not.toContain(term);
      }
    }
  });
});
