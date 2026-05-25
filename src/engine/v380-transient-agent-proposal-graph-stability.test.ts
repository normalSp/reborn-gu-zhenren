import { describe, expect, it } from 'vitest';
import {
  buildV380TransientAgentProposalGraphStability,
  runV380DeterministicProbe,
  V380_DETERMINISTIC_ROUNDS,
  V380_MULTI_PRESSURE_COPY_GATE_VERSION,
  V380_PROPOSAL_GRAPH_STABILITY_MODEL_VERSION,
  V380_TRANSIENT_PROPOSAL_GRAPH_STABILITY_VERSION,
} from './v380-transient-agent-proposal-graph-stability';

describe('v3.8 transient AgentProposal graph stability', () => {
  it('builds a report-only stability layer over the v3.7 graph', () => {
    const report = buildV380TransientAgentProposalGraphStability(
      { turn: 18, previewLane: 1 },
      { includeDeterministicProbe: false },
    );

    expect(report.schemaVersion).toBe(V380_PROPOSAL_GRAPH_STABILITY_MODEL_VERSION);
    expect(report.copyGateVersion).toBe(V380_MULTI_PRESSURE_COPY_GATE_VERSION);
    expect(report.stabilityVersion).toBe(V380_TRANSIENT_PROPOSAL_GRAPH_STABILITY_VERSION);
    expect(report.status).toBe('transient_proposal_graph_stability_active');
    expect(report.inheritedV370.graphNodes.length).toBeGreaterThanOrEqual(5);
    expect(report.inheritedV370.lifecycleSummary.rejected).toBeGreaterThanOrEqual(3);
    expect(report.multiPressureSummary.pressureSourceCount).toBe(4);
    expect(report.multiPressureSummary.pressureInterferencePairCount).toBeGreaterThanOrEqual(6);
    expect(report.multiPressureSummary.longHorizonRoundGate).toBe(V380_DETERMINISTIC_ROUNDS);
  });

  it('keeps multi-pressure lanes synthetic, generic, and non-authoritative', () => {
    const report = buildV380TransientAgentProposalGraphStability(
      { turn: 41, previewLane: 3 },
      { includeDeterministicProbe: false },
    );

    expect(report.pressureStabilityLanes).toHaveLength(4);
    expect(new Set(report.pressureStabilityLanes.map((lane) => lane.status))).toEqual(
      new Set(['candidate', 'rejected', 'expired', 'needs_user_decision']),
    );

    for (const lane of report.pressureStabilityLanes) {
      expect(lane.connectedNodeIds.length).toBeGreaterThanOrEqual(2);
      expect(lane.publicCopy).toContain('候选');
      expect(lane.publicCopy).toContain('不写事实');
      expect(lane.pressureInterferenceBoundary).toContain('正式封锁');
      expect(lane.sameStartVariationBoundary).toContain('runFingerprint');
      expect(lane.memoryContaminationBoundary).toContain('runtime canon');
      expect(lane.factsCommitted).toBe(false);
      expect(lane.saveWritten).toBe(false);
      expect(lane.promptWritten).toBe(false);
      expect(lane.canonPromoted).toBe(false);
      expect(lane.formalStandingWritten).toBe(false);
      expect(lane.npcLifeDeathWritten).toBe(false);
      expect(lane.rewardGranted).toBe(false);
    }

    expect(Object.values(report.memoryContaminationAudit)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(report.audit.noSaveWrite).toBe(true);
    expect(report.audit.noStoreSlice).toBe(true);
    expect(report.audit.noPromptWrite).toBe(true);
    expect(report.audit.noRunFingerprint).toBe(true);
    expect(report.audit.noLiveDeepSeek).toBe(true);
    expect(report.audit.noMiroFish).toBe(true);
    expect(report.audit.noBackend).toBe(true);
    expect(report.audit.noExternalFramework).toBe(true);
  });

  it('records PA, old-save, no-save, and rollback boundaries for v3.8', () => {
    const report = buildV380TransientAgentProposalGraphStability(
      { turn: 7, previewLane: 2 },
      { includeDeterministicProbe: false },
    );

    expect(report.playerAdvocatePlan.requiredRounds).toBe(50);
    expect(report.playerAdvocatePlan.liveDeepSeek).toBe('no');
    expect(report.playerAdvocatePlan.model).toBe('not_called');
    expect(report.oldSaveNoSaveRollbackEvidence.oldSaveCompatible).toBe(true);
    expect(report.oldSaveNoSaveRollbackEvidence.noSaveMutation).toBe(true);
    expect(report.oldSaveNoSaveRollbackEvidence.rollbackNoop).toBe(true);
    expect(report.boundaryLines.join('\n')).toContain('v3.8 proposal graph stability');
    expect(report.boundaryLines.join('\n')).toContain('候选不是事实');
    expect(report.boundaryLines.join('\n')).toContain('WorldCore');
    expect(report.boundaryLines.join('\n')).toContain('live DeepSeek');
  });

  it('passes the 150-round deterministic proposal graph stability gate', () => {
    const probe = runV380DeterministicProbe(V380_DETERMINISTIC_ROUNDS);

    expect(probe.roundCount).toBe(V380_DETERMINISTIC_ROUNDS);
    expect(probe.acceptedRounds).toBe(V380_DETERMINISTIC_ROUNDS);
    expect(probe.acceptedForGate).toBe(true);
    expect(probe.failures).toEqual([]);
    expect(probe.uniqueStabilitySignatureCount).toBeGreaterThanOrEqual(12);
    expect(probe.pressureLaneCount).toBeGreaterThanOrEqual(4);
    expect(probe.pressureInterferencePairCount).toBeGreaterThanOrEqual(6);
    expect(Object.values(probe.boundaryAssertions)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});
