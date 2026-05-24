import { describe, expect, it } from 'vitest';
import {
  V340_ALLOWED_AREA_KEY,
  buildV340TransientAgentProposal,
  postCheckV340AgentProposal,
  type V340AgentProposalCandidate,
} from './v340-transient-agent-proposal';

const baseCandidate: V340AgentProposalCandidate = {
  id: 'test_v340_candidate',
  layer: 'L2',
  agentRole: '外缘短工联络人',
  areaKey: V340_ALLOWED_AREA_KEY,
  persistenceMode: 'transient_proposal_only',
  intent: '观察玩家是否愿意先以粗活换取公开问路窗口。',
  publicExpression: '对方只观察你的行动和口风，没有给出任何事实承诺。',
  safeNextStep: '玩家可以展示劳力或退开；WorldCore 仍保留最终裁决权。',
  candidateEffects: [],
  evidenceRefs: ['synthetic:public_event'],
  sourceRefs: ['v3.4.0:D-340-002'],
  audit: {
    proposalOnly: true,
    expressionOnly: true,
    worldCorePostCheck: true,
    noSaveWrite: true,
    liveDeepSeekCalled: false,
  },
};

describe('v3.4 transient AgentProposal runtime first cut', () => {
  it('builds approved L2/L3 transient proposals without save, live DeepSeek, backend, or MiroFish authority', () => {
    const report = buildV340TransientAgentProposal({
      turn: 17,
      previewLane: 2,
      regionalEventLedger: {
        status: 'events_tracked',
        sourceRefs: ['v2.0.0-b1:regionalEventLedger'],
        publicEvents: [
          { id: 'event_checkpoint', eventKind: 'checkpoint_questioning' },
          { id: 'event_market', eventKind: 'market_pressure' },
        ],
      },
    });

    expect(report.schemaVersion).toBe('v340_a1_transient_agentproposal_contract_v1');
    expect(report.status).toBe('active_transient_runtime_path');
    expect(report.areaKey).toBe(V340_ALLOWED_AREA_KEY);
    expect(report.audit).toMatchObject({
      persistenceMode: 'transient_proposal_only',
      worldCoreAuthority: 'local_worldcore_postcheck_final',
      saveWritePolicy: 'no_save_field_no_migration_no_runFingerprint',
      liveDeepSeekCalled: false,
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
    });
    expect(report.proposals.length).toBeGreaterThanOrEqual(3);
    for (const proposal of report.proposals) {
      expect(['L2', 'L3']).toContain(proposal.layer);
      expect(proposal.persistenceMode).toBe('transient_proposal_only');
      expect(proposal.postCheck.decision).toBe('approved_expression_candidate');
      expect(proposal.postCheck.allowedForDisplay).toBe(true);
      expect(proposal.postCheck.findings).toEqual([]);
      expect(proposal.areaKey).toBe(V340_ALLOWED_AREA_KEY);
      expect(proposal.candidateEffects).toEqual([]);
    }
    expect(report.boundaryLines.join('\n')).toContain('不新增 save field');
    expect(report.boundaryLines.join('\n')).toContain('不调用 live DeepSeek');
    expect(report.rejectedProbes.map(item => item.family)).toEqual(expect.arrayContaining([
      'save_boundary',
      'formal_authority_boundary',
      'deepseek_authority_boundary',
    ]));
  });

  it('rejects save writes, formal authority, live calls, L4/L5, and hidden-adjacent proposals', () => {
    const blockedCases: Array<[string, Partial<V340AgentProposalCandidate>, string]> = [
      ['save', { candidateEffects: ['save_write'] }, 'save_boundary'],
      ['reward', { candidateEffects: ['formal_reward'] }, 'formal_authority_boundary'],
      ['live', { candidateEffects: ['live_deepseek_call'] }, 'deepseek_authority_boundary'],
      ['l4', { layer: 'L4', candidateEffects: ['l4_runtime'] }, 'l4_l5_boundary'],
      ['hidden', { candidateEffects: ['hidden_adjacent'] }, 'hidden_boundary'],
      ['named', { candidateEffects: ['named_npc'] }, 'mirofish_boundary'],
    ];

    for (const [label, patch, family] of blockedCases) {
      const result = postCheckV340AgentProposal({ ...baseCandidate, ...patch, id: `case_${label}` });
      expect(result.decision).toBe('rejected_violation');
      expect(result.allowedForDisplay).toBe(false);
      expect(result.blockedFamilies).toContain(family);
      expect(result.findings.some(item => item.severity === 'P0')).toBe(true);
    }
  });

  it('routes future framework or DeepSeek visible requests to user decision without approving display', () => {
    const result = postCheckV340AgentProposal({
      ...baseCandidate,
      id: 'case_future_gate',
      requestedScope: ['future_gate'],
      publicExpression: '这个候选需要 external framework 对照后再议。',
    });

    expect(result.decision).toBe('needs_user_decision');
    expect(result.allowedForDisplay).toBe(false);
    expect(result.blockedFamilies).toContain('future_gate');
  });

  it('keeps 30 deterministic rounds stable without drifting candidates into facts', () => {
    const fingerprints = new Set<string>();
    for (let round = 1; round <= 30; round += 1) {
      const report = buildV340TransientAgentProposal({
        turn: round,
        previewLane: round,
        regionalEventLedger: {
          status: 'events_tracked',
          publicEvents: [
            { id: `event_checkpoint_${round % 3}`, eventKind: 'checkpoint_questioning' },
            { id: `event_market_${round % 2}`, eventKind: 'market_pressure' },
          ],
        },
      });
      expect(report.deterministicProbe.recommendedRoundCount).toBe(30);
      expect(report.deterministicProbe.rescoreStable).toBe(true);
      expect(report.proposals.every(item => item.postCheck.decision === 'approved_expression_candidate')).toBe(true);
      expect(report.audit.liveDeepSeekCalled).toBe(false);
      expect(report.audit.saveWritePolicy).toBe('no_save_field_no_migration_no_runFingerprint');
      expect(report.boundaryLines.join('\n')).not.toContain('奖励已发放');
      expect(report.boundaryLines.join('\n')).not.toContain('NPC已死亡');
      fingerprints.add(report.proposals.map(item => `${item.id}:${item.layer}:${item.postCheck.decision}`).join('|'));
    }
    expect(fingerprints.size).toBeGreaterThan(1);
  });

  it('works on old-save-like input without requiring migration or new persistent state', () => {
    const report = buildV340TransientAgentProposal({});
    expect(report.status).toBe('evidence_light_transient_path');
    expect(report.proposals.length).toBeGreaterThanOrEqual(3);
    expect(report.audit.saveWritePolicy).toBe('no_save_field_no_migration_no_runFingerprint');
    expect(report.sourceRefs).toEqual(expect.arrayContaining(['v3.4.0:D-340-001']));
  });
});
