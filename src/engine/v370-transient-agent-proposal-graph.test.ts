import { describe, expect, it } from 'vitest';
import {
  V370_DETERMINISTIC_ROUNDS,
  V370_PROPOSAL_GRAPH_MODEL_VERSION,
  V370_TRANSIENT_PROPOSAL_GRAPH_VERSION,
  buildV370TransientAgentProposalGraph,
  runV370DeterministicProbe,
} from './v370-transient-agent-proposal-graph';

describe('v3.7 transient AgentProposal graph', () => {
  it('connects 3-5 synthetic NPC candidates with one small-faction pressure source without persistence', () => {
    const report = buildV370TransientAgentProposalGraph({
      turn: 27,
      previewLane: 2,
      regionalEventLedger: {
        status: 'events_tracked',
        sourceRefs: ['v3.7.0:test:regionalEventLedger'],
        publicEvents: [
          { id: 'v370_labor', eventKind: 'labor_window' },
          { id: 'v370_route', eventKind: 'route_question' },
          { id: 'v370_supply', eventKind: 'supply_noise' },
        ],
      },
    });

    expect(report.schemaVersion).toBe(V370_PROPOSAL_GRAPH_MODEL_VERSION);
    expect(report.proposalGraphVersion).toBe(V370_TRANSIENT_PROPOSAL_GRAPH_VERSION);
    expect(report.inheritedV360MicroExpansionVersion).toBe('v360_b1_transient_agent_micro_expansion_v1');
    expect(report.audit).toMatchObject({
      persistenceMode: 'transient_proposal_only',
      graphMode: 'synthetic_generic_multi_npc_small_faction_pressure',
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
      formalFactionAuthorityUsed: false,
    });
    expect(report.npcCandidateNodes.length).toBeGreaterThanOrEqual(3);
    expect(report.npcCandidateNodes.length).toBeLessThanOrEqual(5);
    expect(report.smallFactionPressureNodes).toHaveLength(1);
    expect(report.smallFactionPressureNodes[0].connectedNodeIds.length).toBe(report.npcCandidateNodes.length);
    expect(report.graphSummary.connectedEdgeCount).toBe(report.npcCandidateNodes.length);
    expect(report.graphNodes.every(item => item.factsCommitted === false && item.saveWritten === false)).toBe(true);
    expect(report.graphNodes.every(item => item.promptWritten === false && item.canonPromoted === false)).toBe(true);
    expect(report.graphNodes.every(item => item.factionStandingWritten === false)).toBe(true);
  });

  it('keeps rumor/fact and pressure handoff boundaries explicit', () => {
    const report = buildV370TransientAgentProposalGraph({ turn: 8, previewLane: 1 });
    const graphText = report.graphNodes
      .map(item => `${item.rumorFactBoundary}\n${item.pressureHandoffBoundary}\n${item.safeNextStep}`)
      .join('\n');

    expect(report.graphSummary.rumorFactBoundaryCount).toBe(report.graphNodes.length);
    expect(report.graphSummary.pressureHandoffBoundaryCount).toBe(report.graphNodes.length);
    expect(graphText).toContain('传闻');
    expect(graphText).toContain('pressure handoff');
    expect(graphText).toContain('WorldCore');
    expect(graphText).toContain('不写 standing');
    expect(report.smallFactionPressureNodes[0]).toMatchObject({
      graphKind: 'small_faction_pressure_candidate',
      formalRelationWritten: false,
      factionStandingWritten: false,
      warrantWritten: false,
      recruitmentWritten: false,
      blockadeWritten: false,
    });
  });

  it('keeps rejected, expired, and needs-user-decision graph nodes reason-only', () => {
    const report = buildV370TransientAgentProposalGraph({ turn: 11 });

    expect(report.rejectedNodes).toHaveLength(3);
    expect(report.rejectedNodes.every(item => item.displayPolicy === 'display_reason_only')).toBe(true);
    expect(report.rejectedNodes.every(item => item.lifecycleStatus === 'rejected')).toBe(true);
    expect(report.expiredNodes[0]).toMatchObject({
      lifecycleStatus: 'expired',
      factsCommitted: false,
      saveWritten: false,
    });
    expect(report.needsUserDecisionNodes[0]).toMatchObject({
      lifecycleStatus: 'needs_user_decision',
      decision: 'needs_user_decision',
      displayPolicy: 'display_reason_only',
      factsCommitted: false,
      saveWritten: false,
    });
    expect(report.needsUserDecisionNodes[0].safeNextStep).toContain('future_gate_required');
  });

  it('passes the 120-round deterministic same-start multi-NPC drift gate without runFingerprint', () => {
    const probe = runV370DeterministicProbe(120);

    expect(probe.recommendedRoundCount).toBe(V370_DETERMINISTIC_ROUNDS);
    expect(probe.roundsChecked).toBe(120);
    expect(probe.acceptedRounds).toBe(120);
    expect(probe.rescoreStable).toBe(true);
    expect(probe.acceptedForGate).toBe(true);
    expect(probe.failures).toEqual([]);
    expect(probe.uniqueGraphSignatures).toBeGreaterThanOrEqual(8);
    expect(probe.boundaryAssertions).toMatchObject({
      factsCommitted: false,
      saveWritten: false,
      promptWritten: false,
      canonPromoted: false,
      formalRelationWritten: false,
      factionStandingWritten: false,
      warrantWritten: false,
      recruitmentWritten: false,
      blockadeWritten: false,
      runFingerprintUsed: false,
      liveDeepSeekCalled: false,
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
    });
    expect(probe.driftFamilies).toEqual(expect.arrayContaining([
      'multi_npc_differentiation',
      'small_faction_pressure_not_formal_standing',
      'rumor_fact_boundary',
      'pressure_handoff_boundary',
      'same_start_variation_without_persistence',
      'no_runFingerprint',
      'no_live_deepseek',
      'no_mirofish',
      'no_backend',
      'no_formal_authority',
    ]));
  });

  it('works on old-save-like empty input and records 40-round Player Advocate plan', () => {
    const report = buildV370TransientAgentProposalGraph({});

    expect(report.status).toBe('transient_proposal_graph_evidence_light');
    expect(report.oldSaveEvidence).toMatchObject({
      oldSaveRequiredFields: 'none',
      newSaveFieldsAdded: false,
      migrationRequired: false,
      rollbackMode: 'drop_transient_graph_report_only',
    });
    expect(report.playerAdvocatePlan).toMatchObject({
      requiredRounds: 40,
      liveDeepSeekCalled: false,
    });
    expect(report.boundaryLines.join('\n')).toContain('不新增 save field');
    expect(report.boundaryLines.join('\n')).toContain('不调用 live DeepSeek');
    expect(report.sourceRefs).toEqual(expect.arrayContaining(['v3.7.0:D-370-001']));
  });
});
