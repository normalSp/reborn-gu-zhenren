import { describe, expect, it } from 'vitest';
import {
  V360_DETERMINISTIC_ROUNDS,
  V360_SYNTHETIC_L2_L3_MODEL_VERSION,
  V360_TRANSIENT_MICRO_EXPANSION_VERSION,
  buildV360TransientAgentMicroExpansion,
  runV360DeterministicProbe,
} from './v360-transient-agent-micro-expansion';

describe('v3.6 transient AgentProposal micro-expansion', () => {
  it('adds synthetic L2/L3 multi-lanes without creating persistence authority', () => {
    const report = buildV360TransientAgentMicroExpansion({
      turn: 18,
      previewLane: 3,
      regionalEventLedger: {
        status: 'events_tracked',
        sourceRefs: ['v3.6.0:test:regionalEventLedger'],
        publicEvents: [
          { id: 'v360_checkpoint', eventKind: 'checkpoint_pressure' },
          { id: 'v360_labor', eventKind: 'labor_window' },
        ],
      },
    });

    expect(report.schemaVersion).toBe(V360_SYNTHETIC_L2_L3_MODEL_VERSION);
    expect(report.microExpansionVersion).toBe(V360_TRANSIENT_MICRO_EXPANSION_VERSION);
    expect(report.inheritedHardeningVersion).toBe('v350_b1_transient_proposal_hardening_v1');
    expect(report.audit).toMatchObject({
      persistenceMode: 'transient_proposal_only',
      microExpansionMode: 'synthetic_generic_l2_l3_multiple_lanes',
      saveWritePolicy: 'no_save_field_no_migration_no_runFingerprint',
      runFingerprintUsed: false,
      liveDeepSeekCalled: false,
      liveDeepSeekModel: 'none',
      liveDeepSeekRounds: 0,
      mirofishNeedLevel: 'not_needed',
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
      selfLearningWritesUsed: false,
    });
    expect(report.lifecycleSummary.candidate).toBeGreaterThanOrEqual(4);
    expect(report.lifecycleSummary.rejected).toBeGreaterThanOrEqual(3);
    expect(report.lifecycleSummary.expired).toBe(1);
    expect(report.lifecycleSummary.needs_user_decision).toBe(1);
    expect(report.candidateLanes.some(item => item.laneKind === 'synthetic_l2_candidate')).toBe(true);
    expect(report.candidateLanes.some(item => item.laneKind === 'synthetic_l3_candidate')).toBe(true);
    expect(report.lanes.every(item => item.factsCommitted === false && item.saveWritten === false)).toBe(true);
    expect(report.lanes.every(item => item.promptWritten === false && item.canonPromoted === false)).toBe(true);
    expect(report.lanes.every(item => item.copyGuardLines.includes('候选不是事实。'))).toBe(true);
  });

  it('keeps rejected, expired, and needs-user-decision lanes reason-only', () => {
    const report = buildV360TransientAgentMicroExpansion({ turn: 5 });

    expect(report.rejectedLanes).toHaveLength(3);
    expect(report.rejectedLanes.every(item => item.displayPolicy === 'display_reason_only')).toBe(true);
    expect(report.rejectedLanes.every(item => item.lifecycleStatus === 'rejected')).toBe(true);
    expect(report.expiredLanes[0]).toMatchObject({
      lifecycleStatus: 'expired',
      decision: 'expired_without_persistence',
      factsCommitted: false,
      saveWritten: false,
    });
    expect(report.needsUserDecisionLanes[0]).toMatchObject({
      lifecycleStatus: 'needs_user_decision',
      decision: 'needs_user_decision',
      displayPolicy: 'display_reason_only',
      factsCommitted: false,
      saveWritten: false,
    });
    expect(report.needsUserDecisionLanes[0].safeNextStep).toContain('future_gate_required');
  });

  it('passes the 90-round deterministic same-start variation gate without runFingerprint', () => {
    const probe = runV360DeterministicProbe(90);

    expect(probe.recommendedRoundCount).toBe(V360_DETERMINISTIC_ROUNDS);
    expect(probe.roundsChecked).toBe(90);
    expect(probe.acceptedRounds).toBe(90);
    expect(probe.rescoreStable).toBe(true);
    expect(probe.acceptedForGate).toBe(true);
    expect(probe.failures).toEqual([]);
    expect(probe.uniqueLaneSignatures).toBeGreaterThanOrEqual(6);
    expect(probe.boundaryAssertions).toMatchObject({
      factsCommitted: false,
      saveWritten: false,
      promptWritten: false,
      canonPromoted: false,
      runFingerprintUsed: false,
      liveDeepSeekCalled: false,
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
    });
    expect(probe.driftFamilies).toEqual(expect.arrayContaining([
      'candidate_not_fact',
      'synthetic_l2_l3_lane_variation',
      'same_start_variation_without_persistence',
      'old_save_no_save_field',
      'no_runFingerprint',
      'no_live_deepseek',
      'no_mirofish',
      'no_backend',
      'no_formal_authority',
    ]));
  });

  it('works on old-save-like empty input and records no-save rollback evidence', () => {
    const report = buildV360TransientAgentMicroExpansion({});

    expect(report.status).toBe('synthetic_micro_expansion_evidence_light');
    expect(report.oldSaveEvidence).toMatchObject({
      oldSaveRequiredFields: 'none',
      newSaveFieldsAdded: false,
      migrationRequired: false,
      rollbackMode: 'drop_transient_report_only',
    });
    expect(report.playerAdvocatePlan).toMatchObject({
      requiredRounds: 30,
      liveDeepSeekCalled: false,
    });
    expect(report.boundaryLines.join('\n')).toContain('不新增 save field');
    expect(report.boundaryLines.join('\n')).toContain('不调用 live DeepSeek');
    expect(report.sourceRefs).toEqual(expect.arrayContaining(['v3.6.0:D-360-001']));
  });
});
