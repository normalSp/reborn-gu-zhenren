import {
  V340_ALLOWED_AREA_KEY,
  buildV340TransientAgentProposal,
  postCheckV340AgentProposal,
  type V340AgentProposal,
  type V340AgentProposalCandidate,
  type V340BuildInput,
  type V340PostCheckResult,
  type V340RejectedProbe,
} from './v340-transient-agent-proposal';

export const V350_AGENT_PROPOSAL_LIFECYCLE_VERSION = 'v350_a1_agentproposal_lifecycle_v2';
export const V350_TRANSIENT_HARDENING_VERSION = 'v350_b1_transient_proposal_hardening_v1';

export type V350LifecycleStatus = 'candidate' | 'rejected' | 'expired' | 'needs_user_decision';

export interface V350LifecycleItem {
  id: string;
  label: string;
  lifecycleStatus: V350LifecycleStatus;
  decision: 'approved_expression_candidate' | 'rejected_violation' | 'expired_without_persistence' | 'needs_user_decision';
  displayPolicy: 'display_candidate' | 'display_reason_only' | 'hide_sensitive_body';
  layer: 'L2' | 'L3' | 'none';
  agentRole: string;
  areaKey: typeof V340_ALLOWED_AREA_KEY;
  publicExpression: string;
  safeNextStep: string;
  reason: string;
  factsCommitted: false;
  saveWritten: false;
  promptWritten: false;
  canonPromoted: false;
  postCheck?: V340PostCheckResult;
  sourceRefs: string[];
  evidenceRefs: string[];
  copyGuardLines: string[];
}

export interface V350DeterministicProbeResult {
  recommendedRoundCount: 60;
  roundsChecked: number;
  acceptedRounds: number;
  uniqueCandidateSignatures: number;
  rescoreStable: boolean;
  acceptedForGate: boolean;
  failures: string[];
  driftFamilies: string[];
}

export interface V350TransientAgentHardeningReport {
  schemaVersion: typeof V350_AGENT_PROPOSAL_LIFECYCLE_VERSION;
  hardeningVersion: typeof V350_TRANSIENT_HARDENING_VERSION;
  inheritedRuntimeFirstCut: 'v340_b1_transient_proposal_runtime_first_cut_v1';
  areaKey: typeof V340_ALLOWED_AREA_KEY;
  status: 'hardened_transient_runtime_path' | 'evidence_light_hardening_path';
  statusLabel: string;
  publicSummary: string;
  candidateItems: V350LifecycleItem[];
  rejectedItems: V350LifecycleItem[];
  expiredItems: V350LifecycleItem[];
  needsUserDecisionItems: V350LifecycleItem[];
  rejectedProbes: V340RejectedProbe[];
  lifecycleSummary: Record<V350LifecycleStatus, number>;
  audit: {
    persistenceMode: 'transient_proposal_only';
    lifecycleMode: 'candidate_rejected_expired_needs_user_decision';
    worldCoreAuthority: 'local_worldcore_postcheck_final';
    saveWritePolicy: 'no_save_field_no_migration_no_runFingerprint';
    liveDeepSeekCalled: false;
    liveDeepSeekModel: 'none';
    liveDeepSeekRounds: 0;
    mirofishUsed: false;
    backendUsed: false;
    externalFrameworkUsed: false;
    selfLearningWritesUsed: false;
  };
  deterministicProbe: V350DeterministicProbeResult;
  playerAdvocatePlan: {
    requiredRounds: 20;
    liveDeepSeekCalled: false;
    purpose: string;
  };
  boundaryLines: string[];
  sourceRefs: string[];
}

const V350_SOURCE_REFS = [
  'v3.5.0:D-350-001',
  'v3.5.0:D-350-004',
  'v3.5.0:D-350-005',
  'v3.5.0:D-350-006',
  'v3.5.0:D-350-007',
  'v3.5.0:D-350-008',
];

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function makeCopyGuardLines(status: V350LifecycleStatus): string[] {
  const common = [
    '候选不等于事实。',
    'WorldCore 保持最终裁决权。',
    '不写 store，不写 save，不进入 prompt，不晋升 canon。',
  ];

  if (status === 'expired') {
    return [...common, '窗口过期只提示重新取样，不保留隐藏或正式结论。'];
  }
  if (status === 'needs_user_decision') {
    return [...common, '触发 future gate 时只显示待决策原因，不显示敏感正文。'];
  }
  if (status === 'rejected') {
    return [...common, '被阻断候选只展示安全原因，不展示被拒正文。'];
  }
  return common;
}

function fromApprovedProposal(proposal: V340AgentProposal): V350LifecycleItem {
  return {
    id: `v350_candidate_${proposal.id}`,
    label: proposal.agentRole,
    lifecycleStatus: 'candidate',
    decision: 'approved_expression_candidate',
    displayPolicy: 'display_candidate',
    layer: proposal.layer,
    agentRole: proposal.agentRole,
    areaKey: V340_ALLOWED_AREA_KEY,
    publicExpression: proposal.publicExpression,
    safeNextStep: proposal.safeNextStep,
    reason: '通过 v3.4 post-check，v3.5 仅把它标记为可见候选生命周期。',
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    postCheck: proposal.postCheck,
    sourceRefs: unique([...(proposal.sourceRefs || []), ...V350_SOURCE_REFS]).slice(0, 12),
    evidenceRefs: unique(proposal.evidenceRefs || []).slice(0, 8),
    copyGuardLines: makeCopyGuardLines('candidate'),
  };
}

function makeBlockedCandidate(
  id: string,
  patch: Partial<V340AgentProposalCandidate>,
): V340AgentProposalCandidate {
  return {
    id,
    layer: 'L2',
    agentRole: '越权候选探针',
    areaKey: V340_ALLOWED_AREA_KEY,
    persistenceMode: 'transient_proposal_only',
    intent: '验证 v3.5 lifecycle v2 是否只输出安全原因。',
    publicExpression: '该候选触发未开放能力，不能作为世界事实显示。',
    safeNextStep: '停在 WorldCore post-check，由用户未来单独审批。',
    candidateEffects: [],
    evidenceRefs: ['v3.5.0:test:synthetic_probe'],
    sourceRefs: V350_SOURCE_REFS,
    audit: {
      proposalOnly: true,
      expressionOnly: true,
      worldCorePostCheck: true,
      noSaveWrite: true,
      liveDeepSeekCalled: false,
    },
    ...patch,
  };
}

function fromRejectedProbe(
  id: string,
  label: string,
  candidate: V340AgentProposalCandidate,
): V350LifecycleItem {
  const postCheck = postCheckV340AgentProposal(candidate);
  return {
    id,
    label,
    lifecycleStatus: 'rejected',
    decision: 'rejected_violation',
    displayPolicy: 'display_reason_only',
    layer: candidate.layer === 'L2' || candidate.layer === 'L3' ? candidate.layer : 'none',
    agentRole: candidate.agentRole,
    areaKey: V340_ALLOWED_AREA_KEY,
    publicExpression: '被阻断候选正文不进入玩家可见事实层。',
    safeNextStep: '保留阻断原因，等待未来明确授权或继续停用。',
    reason: postCheck.blockedFamilies.length > 0
      ? `WorldCore post-check blocked: ${postCheck.blockedFamilies.join(', ')}`
      : 'WorldCore post-check rejected this probe.',
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    postCheck,
    sourceRefs: V350_SOURCE_REFS,
    evidenceRefs: ['v3.5.0:b1:rejection_probe'],
    copyGuardLines: makeCopyGuardLines('rejected'),
  };
}

function makeNeedsDecisionItem(): V350LifecycleItem {
  const candidate = makeBlockedCandidate('v350_future_gate_probe', {
    requestedScope: ['future_gate'],
    agentRole: '外部能力待审批探针',
    intent: '验证 future gate 不被误批准。',
    publicExpression: '该候选需要未来授权包，不在当前 v3.5 范围内。',
  });
  const postCheck = postCheckV340AgentProposal(candidate);

  return {
    id: 'v350_needs_user_decision_future_gate',
    label: 'future gate 待决策候选',
    lifecycleStatus: 'needs_user_decision',
    decision: 'needs_user_decision',
    displayPolicy: 'display_reason_only',
    layer: 'L2',
    agentRole: candidate.agentRole,
    areaKey: V340_ALLOWED_AREA_KEY,
    publicExpression: '需要用户未来审批，不进入 runtime 事实。',
    safeNextStep: '保持 future_gate_required，后续单独给风险收益和测试档位。',
    reason: '触发 future_gate；v3.5 只显示待决策状态。',
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    postCheck,
    sourceRefs: V350_SOURCE_REFS,
    evidenceRefs: ['v3.5.0:b1:future_gate_probe'],
    copyGuardLines: makeCopyGuardLines('needs_user_decision'),
  };
}

function makeExpiredItem(turn: number): V350LifecycleItem {
  const windowId = Math.max(1, Math.floor(turn || 1)) % 9;
  return {
    id: `v350_expired_window_${windowId}`,
    label: '过期窗口候选',
    lifecycleStatus: 'expired',
    decision: 'expired_without_persistence',
    displayPolicy: 'display_reason_only',
    layer: 'none',
    agentRole: '过期窗口',
    areaKey: V340_ALLOWED_AREA_KEY,
    publicExpression: '旧窗口已经过期，只保留安全提示，不保留候选事实。',
    safeNextStep: '从最新 WorldCore snapshot 重新生成候选。',
    reason: 'previewLane 或回合变化后，旧候选不得写入 save 或继续影响事实。',
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    sourceRefs: V350_SOURCE_REFS,
    evidenceRefs: ['v3.5.0:b1:expired_window_probe'],
    copyGuardLines: makeCopyGuardLines('expired'),
  };
}

function countLifecycle(items: V350LifecycleItem[]): Record<V350LifecycleStatus, number> {
  return {
    candidate: items.filter(item => item.lifecycleStatus === 'candidate').length,
    rejected: items.filter(item => item.lifecycleStatus === 'rejected').length,
    expired: items.filter(item => item.lifecycleStatus === 'expired').length,
    needs_user_decision: items.filter(item => item.lifecycleStatus === 'needs_user_decision').length,
  };
}

export function runV350DeterministicProbe(roundCount = 60): V350DeterministicProbeResult {
  const rounds = Math.max(1, Math.floor(roundCount));
  const signatures = new Set<string>();
  const failures: string[] = [];
  let acceptedRounds = 0;

  for (let round = 1; round <= rounds; round += 1) {
    const report = buildV340TransientAgentProposal({
      turn: round,
      previewLane: round % 3,
      regionalEventLedger: {
        status: 'events_tracked',
        publicEvents: [
          { id: `v350_checkpoint_${round % 4}`, eventKind: 'checkpoint_questioning' },
          { id: `v350_labor_${round % 5}`, eventKind: 'labor_window' },
          { id: `v350_market_${round % 3}`, eventKind: 'market_pressure' },
        ],
        sourceRefs: ['v3.5.0:D-350-007'],
      },
    });

    const allApproved = report.proposals.every(item => item.postCheck.decision === 'approved_expression_candidate');
    const noSave = report.audit.saveWritePolicy === 'no_save_field_no_migration_no_runFingerprint';
    const noLive = report.audit.liveDeepSeekCalled === false;
    const noBoundaryText = !report.boundaryLines.join('\n').match(/奖励已发放|NPC已死亡|通缉成立|正式加入/i);

    if (allApproved && noSave && noLive && noBoundaryText) {
      acceptedRounds += 1;
    } else {
      failures.push(`round_${round}`);
    }

    signatures.add(report.proposals.map(item => `${item.id}:${item.layer}:${item.publicExpression}`).join('|'));
  }

  return {
    recommendedRoundCount: 60,
    roundsChecked: rounds,
    acceptedRounds,
    uniqueCandidateSignatures: signatures.size,
    rescoreStable: failures.length === 0,
    acceptedForGate: failures.length === 0 && signatures.size >= 3,
    failures,
    driftFamilies: [
      'candidate_not_fact',
      'lifecycle_status_stable',
      'no_save_write',
      'no_runFingerprint',
      'no_live_deepseek',
      'no_formal_authority',
      'same_start_variation_without_persistence',
    ],
  };
}

export function buildV350TransientAgentProposalHardening(input: V340BuildInput = {}): V350TransientAgentHardeningReport {
  const baseReport = buildV340TransientAgentProposal(input);
  const candidateItems = baseReport.proposals.map(fromApprovedProposal);
  const rejectedItems = [
    fromRejectedProbe(
      'v350_rejected_save_write',
      '持久化写入候选',
      makeBlockedCandidate('v350_rejected_save_write_candidate', { candidateEffects: ['save_write'] }),
    ),
    fromRejectedProbe(
      'v350_rejected_formal_result',
      '正式结果候选',
      makeBlockedCandidate('v350_rejected_formal_result_candidate', { candidateEffects: ['formal_reward'] }),
    ),
    fromRejectedProbe(
      'v350_rejected_live_deepseek',
      'live DeepSeek 候选',
      makeBlockedCandidate('v350_rejected_live_deepseek_candidate', { candidateEffects: ['live_deepseek_call'] }),
    ),
  ];
  const expiredItems = [makeExpiredItem(Number(input.turn || 1))];
  const needsUserDecisionItems = [makeNeedsDecisionItem()];
  const allItems = [...candidateItems, ...rejectedItems, ...expiredItems, ...needsUserDecisionItems];
  const deterministicProbe = runV350DeterministicProbe(60);

  return {
    schemaVersion: V350_AGENT_PROPOSAL_LIFECYCLE_VERSION,
    hardeningVersion: V350_TRANSIENT_HARDENING_VERSION,
    inheritedRuntimeFirstCut: 'v340_b1_transient_proposal_runtime_first_cut_v1',
    areaKey: V340_ALLOWED_AREA_KEY,
    status: baseReport.status === 'active_transient_runtime_path'
      ? 'hardened_transient_runtime_path'
      : 'evidence_light_hardening_path',
    statusLabel: baseReport.status === 'active_transient_runtime_path'
      ? 'v3.5 lifecycle v2 已接管候选展示'
      : 'v3.5 lifecycle v2 证据较轻，仍只显示硬化后的安全候选',
    publicSummary: 'v3.5 只硬化 v3.4 的 transient AgentProposal：候选、阻断、过期、待决策都可解释，但都不写事实、不写存档、不调用 live DeepSeek。',
    candidateItems,
    rejectedItems,
    expiredItems,
    needsUserDecisionItems,
    rejectedProbes: baseReport.rejectedProbes,
    lifecycleSummary: countLifecycle(allItems),
    audit: {
      persistenceMode: 'transient_proposal_only',
      lifecycleMode: 'candidate_rejected_expired_needs_user_decision',
      worldCoreAuthority: 'local_worldcore_postcheck_final',
      saveWritePolicy: 'no_save_field_no_migration_no_runFingerprint',
      liveDeepSeekCalled: false,
      liveDeepSeekModel: 'none',
      liveDeepSeekRounds: 0,
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
      selfLearningWritesUsed: false,
    },
    deterministicProbe,
    playerAdvocatePlan: {
      requiredRounds: 20,
      liveDeepSeekCalled: false,
      purpose: '验证玩家能分清 candidate/rejected/expired/needs_user_decision 与正式世界事实。',
    },
    boundaryLines: [
      'AgentProposal 是候选表达，不是事实、承诺、奖励、地点、身份或 NPC 命运。',
      'candidate / rejected / expired / needs_user_decision 是显示生命周期，不是存档状态。',
      'WorldCore post-check 保持最终裁决权；被拒、过期、待决策候选不会进入 store、save、prompt 或 canon。',
      'v3.5 不新增 save field，不 bump SAVE_FORMAT_VERSION，不新增 runFingerprint。',
      'v3.5 不调用 live DeepSeek，不做 MiroFish export/intake，不使用 backend/BFF/external framework/subagent。',
      'v3.5 只硬化 L2/L3 小区域 transient proposal-only 窄口；L4/L5、天道/宿命和原著关键人物继续 future gate。',
    ],
    sourceRefs: unique([...baseReport.sourceRefs, ...V350_SOURCE_REFS]).slice(0, 16),
  };
}
