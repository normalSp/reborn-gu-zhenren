import { describe, expect, it } from 'vitest';
import {
  V350_AGENT_PROPOSAL_LIFECYCLE_VERSION,
  V350_TRANSIENT_HARDENING_VERSION,
  buildV350TransientAgentProposalHardening,
  runV350DeterministicProbe,
} from './v350-transient-agent-proposal-hardening';

describe('v3.5 transient AgentProposal hardening', () => {
  it('wraps v3.4 runtime candidates in lifecycle v2 without creating persistence authority', () => {
    const report = buildV350TransientAgentProposalHardening({
      turn: 12,
      previewLane: 1,
      regionalEventLedger: {
        status: 'events_tracked',
        sourceRefs: ['v2.0.0-b1:regionalEventLedger'],
        publicEvents: [
          { id: 'v350_checkpoint', eventKind: 'checkpoint_questioning' },
          { id: 'v350_labor', eventKind: 'labor_window' },
        ],
      },
    });

    expect(report.schemaVersion).toBe(V350_AGENT_PROPOSAL_LIFECYCLE_VERSION);
    expect(report.hardeningVersion).toBe(V350_TRANSIENT_HARDENING_VERSION);
    expect(report.inheritedRuntimeFirstCut).toBe('v340_b1_transient_proposal_runtime_first_cut_v1');
    expect(report.audit).toMatchObject({
      persistenceMode: 'transient_proposal_only',
      lifecycleMode: 'candidate_rejected_expired_needs_user_decision',
      saveWritePolicy: 'no_save_field_no_migration_no_runFingerprint',
      liveDeepSeekCalled: false,
      liveDeepSeekModel: 'none',
      liveDeepSeekRounds: 0,
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
      selfLearningWritesUsed: false,
    });
    expect(report.lifecycleSummary).toMatchObject({
      candidate: 3,
      rejected: 3,
      expired: 1,
      needs_user_decision: 1,
    });
    expect(report.candidateItems.every(item => item.lifecycleStatus === 'candidate')).toBe(true);
    expect(report.candidateItems.every(item => item.factsCommitted === false && item.saveWritten === false)).toBe(true);
    expect(report.candidateItems.every(item => item.copyGuardLines.includes('候选不等于事实。'))).toBe(true);
    expect(report.boundaryLines.join('\n')).toContain('不新增 save field');
    expect(report.boundaryLines.join('\n')).toContain('不调用 live DeepSeek');
  });

  it('shows rejected, expired, and needs-user-decision states without exposing them as facts', () => {
    const report = buildV350TransientAgentProposalHardening({ turn: 9 });

    expect(report.rejectedItems).toHaveLength(3);
    expect(report.rejectedItems.every(item => item.decision === 'rejected_violation')).toBe(true);
    expect(report.rejectedItems.every(item => item.displayPolicy === 'display_reason_only')).toBe(true);
    expect(report.rejectedItems.flatMap(item => item.postCheck?.blockedFamilies || [])).toEqual(expect.arrayContaining([
      'save_boundary',
      'formal_authority_boundary',
      'deepseek_authority_boundary',
    ]));

    expect(report.expiredItems).toHaveLength(1);
    expect(report.expiredItems[0]).toMatchObject({
      lifecycleStatus: 'expired',
      decision: 'expired_without_persistence',
      factsCommitted: false,
      saveWritten: false,
      canonPromoted: false,
    });

    expect(report.needsUserDecisionItems).toHaveLength(1);
    expect(report.needsUserDecisionItems[0]).toMatchObject({
      lifecycleStatus: 'needs_user_decision',
      decision: 'needs_user_decision',
      displayPolicy: 'display_reason_only',
      factsCommitted: false,
      saveWritten: false,
    });
    expect(report.needsUserDecisionItems[0].postCheck?.allowedForDisplay).toBe(false);
  });

  it('passes the 60-round deterministic same-start variation gate without runFingerprint', () => {
    const probe = runV350DeterministicProbe(60);

    expect(probe.recommendedRoundCount).toBe(60);
    expect(probe.roundsChecked).toBe(60);
    expect(probe.acceptedRounds).toBe(60);
    expect(probe.rescoreStable).toBe(true);
    expect(probe.acceptedForGate).toBe(true);
    expect(probe.failures).toEqual([]);
    expect(probe.uniqueCandidateSignatures).toBeGreaterThanOrEqual(3);
    expect(probe.driftFamilies).toEqual(expect.arrayContaining([
      'candidate_not_fact',
      'no_save_write',
      'no_runFingerprint',
      'same_start_variation_without_persistence',
    ]));
  });

  it('works on old-save-like empty input and keeps live DeepSeek metadata false', () => {
    const report = buildV350TransientAgentProposalHardening({});

    expect(report.status).toBe('evidence_light_hardening_path');
    expect(report.candidateItems.length).toBeGreaterThanOrEqual(3);
    expect(report.audit.liveDeepSeekCalled).toBe(false);
    expect(report.playerAdvocatePlan).toMatchObject({
      requiredRounds: 20,
      liveDeepSeekCalled: false,
    });
    expect(report.sourceRefs).toEqual(expect.arrayContaining(['v3.5.0:D-350-001']));
  });
});
