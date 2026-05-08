import { describe, expect, it } from 'vitest';
import {
  auditRuntimeProvenanceGate,
  isRuntimeProvenanceAllowed,
} from './provenance-gate';

describe('runtime provenance gate', () => {
  it('requires unreviewed unknown content to stay out of runtime pools', () => {
    expect(isRuntimeProvenanceAllowed({
      id: 'unknown_gu',
      name: '未知蛊',
      provenance: 'unknown',
    })).toBe(false);

    expect(isRuntimeProvenanceAllowed({
      id: 'reviewed_unknown_gu',
      name: '待审白名单蛊',
      provenance: 'unknown',
      review: {
        whitelisted: true,
        worldviewNote: '契合蛊真人炼养用体系，作为二创扩展。',
        designRole: '低转治疗兜底。',
        balanceTier: 'original_support_low',
      },
    })).toBe(true);
  });

  it('keeps current runtime provenance and path gates clean', () => {
    const blockingIssues = auditRuntimeProvenanceGate()
      .filter(issue => issue.severity === 'blocking');
    expect(blockingIssues).toEqual([]);
  });
});
