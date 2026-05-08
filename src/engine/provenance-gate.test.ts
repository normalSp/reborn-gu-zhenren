import { describe, expect, it } from 'vitest';
import {
  auditAuctionRuntimePoolProvenance,
  auditRuntimeProvenanceGate,
  auditTrainingGroundMetadata,
  generateReleaseProvenanceCoverage,
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

  it('builds a release provenance coverage report for every runtime dataset record', () => {
    const report = generateReleaseProvenanceCoverage();
    expect(report.summary.totalRecords).toBeGreaterThan(250);
    expect(report.summary.blockingCount).toBe(0);
    expect(report.rows.every(row => row.runtimePools.length > 0)).toBe(true);
    expect(report.rows.some(row => row.datasetId === 'encounters' && row.recordId.includes('qingmaoshan'))).toBe(true);
    expect(report.rows.some(row => row.datasetId === 'npcs' && `${row.recordId}:${row.name}`.includes('方源'))).toBe(true);
  });

  it('keeps training ground metadata and treasure yellow heaven generated pools publishable', () => {
    expect(auditTrainingGroundMetadata()).toEqual([]);
    expect(auditAuctionRuntimePoolProvenance()).toEqual([]);
  });
});
