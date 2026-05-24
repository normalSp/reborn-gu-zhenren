import {
  V340_ALLOWED_AREA_KEY,
  type V340AgentLayer,
  type V340BuildInput,
  type V340RejectedProbe,
} from './v340-transient-agent-proposal';
import {
  V350_AGENT_PROPOSAL_LIFECYCLE_VERSION,
  V350_TRANSIENT_HARDENING_VERSION,
  buildV350TransientAgentProposalHardening,
  type V350DeterministicProbeResult,
  type V350LifecycleItem,
  type V350LifecycleStatus,
} from './v350-transient-agent-proposal-hardening';

export const V360_SYNTHETIC_L2_L3_MODEL_VERSION = 'v360_a1_synthetic_l2_l3_micro_expansion_model_v1';
export const V360_CANDIDATE_LANE_COPY_GATE_VERSION = 'v360_a2_candidate_lane_copy_gate_v1';
export const V360_TRANSIENT_MICRO_EXPANSION_VERSION = 'v360_b1_transient_agent_micro_expansion_v1';
export const V360_DETERMINISTIC_ROUNDS = 90;

export type V360LaneStatus = V350LifecycleStatus;
export type V360LaneKind =
  | 'synthetic_l2_candidate'
  | 'synthetic_l3_candidate'
  | 'rejected_safety_lane'
  | 'expired_safety_lane'
  | 'needs_user_decision_lane';

export interface V360MicroExpansionLane {
  id: string;
  label: string;
  laneKind: V360LaneKind;
  lifecycleStatus: V360LaneStatus;
  decision: V350LifecycleItem['decision'];
  displayPolicy: V350LifecycleItem['displayPolicy'];
  layer: V340AgentLayer | 'none';
  agentRole: string;
  genericArchetype: string;
  areaKey: typeof V340_ALLOWED_AREA_KEY;
  publicExpression: string;
  safeNextStep: string;
  playerFacingBoundary: string;
  reason: string;
  laneSignature: string;
  factsCommitted: false;
  saveWritten: false;
  promptWritten: false;
  canonPromoted: false;
  sourceRefs: string[];
  evidenceRefs: string[];
  copyGuardLines: string[];
}

export interface V360DeterministicProbeResult {
  recommendedRoundCount: typeof V360_DETERMINISTIC_ROUNDS;
  roundsChecked: number;
  acceptedRounds: number;
  uniqueLaneSignatures: number;
  rescoreStable: boolean;
  acceptedForGate: boolean;
  failures: string[];
  driftFamilies: string[];
  boundaryAssertions: {
    factsCommitted: false;
    saveWritten: false;
    promptWritten: false;
    canonPromoted: false;
    runFingerprintUsed: false;
    liveDeepSeekCalled: false;
    mirofishUsed: false;
    backendUsed: false;
    externalFrameworkUsed: false;
  };
}

export interface V360TransientAgentMicroExpansionReport {
  schemaVersion: typeof V360_SYNTHETIC_L2_L3_MODEL_VERSION;
  copyGateVersion: typeof V360_CANDIDATE_LANE_COPY_GATE_VERSION;
  microExpansionVersion: typeof V360_TRANSIENT_MICRO_EXPANSION_VERSION;
  inheritedLifecycleVersion: typeof V350_AGENT_PROPOSAL_LIFECYCLE_VERSION;
  inheritedHardeningVersion: typeof V350_TRANSIENT_HARDENING_VERSION;
  areaKey: typeof V340_ALLOWED_AREA_KEY;
  status: 'synthetic_micro_expansion_active' | 'synthetic_micro_expansion_evidence_light';
  statusLabel: string;
  publicSummary: string;
  lanes: V360MicroExpansionLane[];
  candidateLanes: V360MicroExpansionLane[];
  rejectedLanes: V360MicroExpansionLane[];
  expiredLanes: V360MicroExpansionLane[];
  needsUserDecisionLanes: V360MicroExpansionLane[];
  inheritedRejectedProbes: V340RejectedProbe[];
  lifecycleSummary: Record<V360LaneStatus, number>;
  syntheticLayerSummary: {
    L2: number;
    L3: number;
    none: number;
  };
  audit: {
    persistenceMode: 'transient_proposal_only';
    microExpansionMode: 'synthetic_generic_l2_l3_multiple_lanes';
    worldCoreAuthority: 'local_worldcore_postcheck_final';
    saveWritePolicy: 'no_save_field_no_migration_no_runFingerprint';
    runFingerprintUsed: false;
    liveDeepSeekCalled: false;
    liveDeepSeekModel: 'none';
    liveDeepSeekRounds: 0;
    mirofishNeedLevel: 'not_needed';
    mirofishUsed: false;
    backendUsed: false;
    externalFrameworkUsed: false;
    selfLearningWritesUsed: false;
  };
  inheritedDeterministicProbe: V350DeterministicProbeResult;
  deterministicProbe: V360DeterministicProbeResult;
  playerAdvocatePlan: {
    requiredRounds: 30;
    liveDeepSeekCalled: false;
    purpose: string;
  };
  oldSaveEvidence: {
    oldSaveRequiredFields: 'none';
    newSaveFieldsAdded: false;
    migrationRequired: false;
    rollbackMode: 'drop_transient_report_only';
  };
  boundaryLines: string[];
  sourceRefs: string[];
}

interface V360BuildOptions {
  includeDeterministicProbe?: boolean;
}

const V360_SOURCE_REFS = [
  'v3.6.0:D-360-001',
  'v3.6.0:D-360-003',
  'v3.6.0:D-360-004',
  'v3.6.0:D-360-005',
  'v3.6.0:D-360-006',
  'v3.6.0:D-360-007',
  'v3.6.0:D-360-009',
  'v3.6.0:D-360-010',
];

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function normalizedTurn(value: unknown): number {
  const turn = Number(value ?? 1);
  if (!Number.isFinite(turn)) return 1;
  return Math.max(1, Math.floor(turn));
}

function normalizedLane(value: unknown): number {
  const lane = Number(value ?? 0);
  if (!Number.isFinite(lane)) return 0;
  return Math.abs(Math.floor(lane)) % 4;
}

function copyGuardLines(status: V360LaneStatus): string[] {
  const base = [
    '候选不是事实。',
    'WorldCore 保持最终裁决权。',
    '不写 store、save、prompt 或 canon。',
    '不调用 live DeepSeek，不使用 MiroFish，不接后端。',
  ];

  if (status === 'expired') return [...base, '过期 lane 只提示重新取样，不保留候选结论。'];
  if (status === 'needs_user_decision') return [...base, '待决策 lane 只显示 future gate 原因。'];
  if (status === 'rejected') return [...base, '阻断 lane 只显示安全原因，不显示被拒正文。'];
  return base;
}

function toMicroLane(item: V350LifecycleItem, index: number): V360MicroExpansionLane {
  const layer = item.layer === 'L2' || item.layer === 'L3' ? item.layer : 'none';
  const laneKind: V360LaneKind = item.lifecycleStatus === 'candidate'
    ? layer === 'L3'
      ? 'synthetic_l3_candidate'
      : 'synthetic_l2_candidate'
    : item.lifecycleStatus === 'rejected'
      ? 'rejected_safety_lane'
      : item.lifecycleStatus === 'expired'
        ? 'expired_safety_lane'
        : 'needs_user_decision_lane';

  return {
    id: `v360_lane_${item.id}`,
    label: item.label,
    laneKind,
    lifecycleStatus: item.lifecycleStatus,
    decision: item.decision,
    displayPolicy: item.displayPolicy,
    layer,
    agentRole: item.agentRole,
    genericArchetype: layer === 'none' ? 'generic_safety_lane' : `generic_${layer.toLowerCase()}_inherited_lane`,
    areaKey: V340_ALLOWED_AREA_KEY,
    publicExpression: item.lifecycleStatus === 'candidate'
      ? `${item.publicExpression} 这只是第 ${index + 1} 条 synthetic/generic 候选 lane，不代表事实已经发生。`
      : item.publicExpression,
    safeNextStep: item.safeNextStep,
    playerFacingBoundary: '候选 lane 只帮助玩家理解可能的意图压力；WorldCore 未裁决前不产生世界事实。',
    reason: item.reason,
    laneSignature: `${item.lifecycleStatus}:${layer}:${item.id}:${index}`,
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    sourceRefs: unique([...(item.sourceRefs || []), ...V360_SOURCE_REFS]).slice(0, 16),
    evidenceRefs: unique([...(item.evidenceRefs || []), 'v3.6.0:b1:micro-expansion']).slice(0, 10),
    copyGuardLines: copyGuardLines(item.lifecycleStatus),
  };
}

function makeExtraSyntheticCandidate(turn: number, previewLane: number, refs: string[]): V360MicroExpansionLane {
  const lane = previewLane % 4;
  const variants = [
    {
      layer: 'L2' as const,
      label: '旁观脚夫候选 lane',
      agentRole: '泛化旁观脚夫',
      archetype: 'generic_l2_wayfarer_observer',
      expression: '路边有人只看你的脚程和守口程度，暂时没有给出身份、报酬或地点承诺。',
      nextStep: '玩家可以保持低调、补一句来路说明，或转向粗活窗口；WorldCore 仍不写正式结果。',
    },
    {
      layer: 'L3' as const,
      label: '临场小队谨慎 lane',
      agentRole: '泛化临场小队领头人',
      archetype: 'generic_l3_squad_caution',
      expression: '一个领头人把问题压低成路线风险和同行痕迹，只给出继续观察的场面压力。',
      nextStep: '玩家可以解释短期目标、退一步求杂务，或暂停接触；不产生阵营、队友或追杀结论。',
    },
    {
      layer: 'L2' as const,
      label: '补给摊位听风 lane',
      agentRole: '泛化补给摊位接触',
      archetype: 'generic_l2_supply_broker_candidate',
      expression: '摊位边的视线落在你是否懂规矩，而不是把补给、价格或库存交给你。',
      nextStep: '玩家可以先做观察或轻量跑腿；价格、库存、收益仍由未来正式系统处理。',
    },
    {
      layer: 'L3' as const,
      label: '盘问压力微调 lane',
      agentRole: '泛化盘问压力源',
      archetype: 'generic_l3_checkpoint_pressure',
      expression: '盘问没有升级成定性，只把风险集中在脚印、包袱和回答是否前后稳当。',
      nextStep: '玩家可以降调回答、转为短工请求或离开窗口；不形成通行、封锁或通缉结论。',
    },
  ];
  const variant = variants[lane];

  return {
    id: `v360_extra_${variantHash(variant.archetype, turn)}`,
    label: variant.label,
    laneKind: variant.layer === 'L3' ? 'synthetic_l3_candidate' : 'synthetic_l2_candidate',
    lifecycleStatus: 'candidate',
    decision: 'approved_expression_candidate',
    displayPolicy: 'display_candidate',
    layer: variant.layer,
    agentRole: variant.agentRole,
    genericArchetype: variant.archetype,
    areaKey: V340_ALLOWED_AREA_KEY,
    publicExpression: variant.expression,
    safeNextStep: variant.nextStep,
    playerFacingBoundary: 'v3.6 微扩只增加 synthetic/generic L2/L3 表达 lane，不增加事实权力。',
    reason: 'D-360 批准的 micro-expansion lane；仍继承 v3.5 transient lifecycle 与 WorldCore post-check 边界。',
    laneSignature: `extra:${variant.layer}:${variant.archetype}:${turn % 13}:${lane}`,
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    sourceRefs: unique([...refs, ...V360_SOURCE_REFS]).slice(0, 16),
    evidenceRefs: ['v3.6.0:b1:synthetic_extra_lane', `turn_mod_${turn % 13}`],
    copyGuardLines: copyGuardLines('candidate'),
  };
}

function variantHash(value: string, turn: number): string {
  let acc = 0;
  for (const char of value) acc = (acc * 31 + char.charCodeAt(0)) % 997;
  return `${value}_${(acc + turn) % 997}`;
}

function countLifecycle(items: V360MicroExpansionLane[]): Record<V360LaneStatus, number> {
  return {
    candidate: items.filter(item => item.lifecycleStatus === 'candidate').length,
    rejected: items.filter(item => item.lifecycleStatus === 'rejected').length,
    expired: items.filter(item => item.lifecycleStatus === 'expired').length,
    needs_user_decision: items.filter(item => item.lifecycleStatus === 'needs_user_decision').length,
  };
}

function makePendingProbe(): V360DeterministicProbeResult {
  return {
    recommendedRoundCount: V360_DETERMINISTIC_ROUNDS,
    roundsChecked: 0,
    acceptedRounds: 0,
    uniqueLaneSignatures: 0,
    rescoreStable: false,
    acceptedForGate: false,
    failures: ['probe_not_run_in_nested_build'],
    driftFamilies: [
      'candidate_not_fact',
      'synthetic_l2_l3_lane_variation',
      'multi_lane_lifecycle_copy',
      'no_save_write',
      'no_runFingerprint',
      'no_live_deepseek',
      'no_mirofish',
      'no_backend',
      'no_formal_authority',
    ],
    boundaryAssertions: {
      factsCommitted: false,
      saveWritten: false,
      promptWritten: false,
      canonPromoted: false,
      runFingerprintUsed: false,
      liveDeepSeekCalled: false,
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
    },
  };
}

export function runV360DeterministicProbe(roundCount = V360_DETERMINISTIC_ROUNDS): V360DeterministicProbeResult {
  const rounds = Math.max(1, Math.floor(roundCount));
  const signatures = new Set<string>();
  const failures: string[] = [];
  let acceptedRounds = 0;

  for (let round = 1; round <= rounds; round += 1) {
    const report = buildV360TransientAgentMicroExpansion({
      turn: round,
      previewLane: round % 4,
      regionalEventLedger: {
        status: 'events_tracked',
        sourceRefs: ['v3.6.0:D-360-006'],
        publicEvents: [
          { id: `v360_checkpoint_${round % 5}`, eventKind: 'checkpoint_pressure' },
          { id: `v360_labor_${round % 7}`, eventKind: 'labor_window' },
          { id: `v360_supply_${round % 4}`, eventKind: 'supply_noise' },
        ],
      },
      localActionLedger: [
        { id: `v360_local_action_${round % 6}`, actionType: 'generic_low_rank_observation' },
      ],
    }, { includeDeterministicProbe: false });

    const allLaneSafe = report.lanes.every(item =>
      item.factsCommitted === false
      && item.saveWritten === false
      && item.promptWritten === false
      && item.canonPromoted === false
      && item.areaKey === V340_ALLOWED_AREA_KEY);
    const auditSafe = report.audit.runFingerprintUsed === false
      && report.audit.liveDeepSeekCalled === false
      && report.audit.mirofishUsed === false
      && report.audit.backendUsed === false
      && report.audit.externalFrameworkUsed === false
      && report.audit.selfLearningWritesUsed === false;
    const hasMicroExpansion = report.candidateLanes.some(item => item.laneKind === 'synthetic_l2_candidate')
      && report.candidateLanes.some(item => item.laneKind === 'synthetic_l3_candidate')
      && report.lifecycleSummary.candidate >= 4
      && report.lifecycleSummary.rejected >= 3
      && report.lifecycleSummary.expired >= 1
      && report.lifecycleSummary.needs_user_decision >= 1;
    const noForbiddenClaim = !report.lanes
      .map(item => `${item.publicExpression}\n${item.safeNextStep}\n${item.playerFacingBoundary}`)
      .join('\n')
      .match(/奖励已发放|NPC已死亡|正式加入|通缉成立|招揽成功|封锁生效|SAVE_FORMAT_VERSION\s*=\s*26/i);

    if (allLaneSafe && auditSafe && hasMicroExpansion && noForbiddenClaim) {
      acceptedRounds += 1;
    } else {
      failures.push(`round_${round}`);
    }

    signatures.add(report.candidateLanes.map(item => item.laneSignature).join('|'));
  }

  return {
    recommendedRoundCount: V360_DETERMINISTIC_ROUNDS,
    roundsChecked: rounds,
    acceptedRounds,
    uniqueLaneSignatures: signatures.size,
    rescoreStable: failures.length === 0,
    acceptedForGate: failures.length === 0 && signatures.size >= 6,
    failures,
    driftFamilies: [
      'candidate_not_fact',
      'synthetic_l2_l3_lane_variation',
      'multi_lane_lifecycle_copy',
      'same_start_variation_without_persistence',
      'old_save_no_save_field',
      'no_runFingerprint',
      'no_live_deepseek',
      'no_mirofish',
      'no_backend',
      'no_formal_authority',
    ],
    boundaryAssertions: {
      factsCommitted: false,
      saveWritten: false,
      promptWritten: false,
      canonPromoted: false,
      runFingerprintUsed: false,
      liveDeepSeekCalled: false,
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
    },
  };
}

export function buildV360TransientAgentMicroExpansion(
  input: V340BuildInput = {},
  options: V360BuildOptions = {},
): V360TransientAgentMicroExpansionReport {
  const inherited = buildV350TransientAgentProposalHardening(input);
  const turn = normalizedTurn(input.turn);
  const previewLane = normalizedLane(input.previewLane);
  const inheritedLanes = [
    ...inherited.candidateItems,
    ...inherited.rejectedItems,
    ...inherited.expiredItems,
    ...inherited.needsUserDecisionItems,
  ].map(toMicroLane);
  const extraLane = makeExtraSyntheticCandidate(turn, previewLane, inherited.sourceRefs);
  const lanes = [...inheritedLanes, extraLane];
  const candidateLanes = lanes.filter(item => item.lifecycleStatus === 'candidate');
  const rejectedLanes = lanes.filter(item => item.lifecycleStatus === 'rejected');
  const expiredLanes = lanes.filter(item => item.lifecycleStatus === 'expired');
  const needsUserDecisionLanes = lanes.filter(item => item.lifecycleStatus === 'needs_user_decision');
  const deterministicProbe = options.includeDeterministicProbe === false
    ? makePendingProbe()
    : runV360DeterministicProbe(V360_DETERMINISTIC_ROUNDS);

  return {
    schemaVersion: V360_SYNTHETIC_L2_L3_MODEL_VERSION,
    copyGateVersion: V360_CANDIDATE_LANE_COPY_GATE_VERSION,
    microExpansionVersion: V360_TRANSIENT_MICRO_EXPANSION_VERSION,
    inheritedLifecycleVersion: V350_AGENT_PROPOSAL_LIFECYCLE_VERSION,
    inheritedHardeningVersion: V350_TRANSIENT_HARDENING_VERSION,
    areaKey: V340_ALLOWED_AREA_KEY,
    status: inherited.status === 'hardened_transient_runtime_path'
      ? 'synthetic_micro_expansion_active'
      : 'synthetic_micro_expansion_evidence_light',
    statusLabel: inherited.status === 'hardened_transient_runtime_path'
      ? 'v3.6 synthetic L2/L3 micro-expansion 已接管；继承 v3.5 lifecycle v2'
      : 'v3.6 synthetic L2/L3 micro-expansion 证据较轻，仍只显示安全候选；继承 v3.5 lifecycle v2',
    publicSummary: 'v3.6 只在 v3.5 transient lifecycle 外增加 synthetic/generic L2/L3 多 lane 表达：候选、阻断、过期、待决策都更可读，但都不写事实、不写存档、不调用 live DeepSeek。',
    lanes,
    candidateLanes,
    rejectedLanes,
    expiredLanes,
    needsUserDecisionLanes,
    inheritedRejectedProbes: inherited.rejectedProbes,
    lifecycleSummary: countLifecycle(lanes),
    syntheticLayerSummary: {
      L2: lanes.filter(item => item.layer === 'L2').length,
      L3: lanes.filter(item => item.layer === 'L3').length,
      none: lanes.filter(item => item.layer === 'none').length,
    },
    audit: {
      persistenceMode: 'transient_proposal_only',
      microExpansionMode: 'synthetic_generic_l2_l3_multiple_lanes',
      worldCoreAuthority: 'local_worldcore_postcheck_final',
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
    },
    inheritedDeterministicProbe: inherited.deterministicProbe,
    deterministicProbe,
    playerAdvocatePlan: {
      requiredRounds: 30,
      liveDeepSeekCalled: false,
      purpose: '验证玩家能理解 v3.6 多 lane 候选差异、候选/事实边界和 next step，不把 synthetic/generic lane 当成正式结论。',
    },
    oldSaveEvidence: {
      oldSaveRequiredFields: 'none',
      newSaveFieldsAdded: false,
      migrationRequired: false,
      rollbackMode: 'drop_transient_report_only',
    },
    boundaryLines: [
      'v3.6 micro-expansion 只增加 synthetic/generic L2/L3 多 lane 候选表达，不增加 agent 裁决权。',
      '候选 lane 不是事实、承诺、奖励、地点、身份或 NPC 命运。',
      'WorldCore post-check 保持最终裁决权；被拒、过期、待决策 lane 不进入 store、save、prompt 或 canon。',
      'v3.6 不新增 save field，不 bump SAVE_FORMAT_VERSION，不新增 runFingerprint。',
      'v3.6 不调用 live DeepSeek，不做 MiroFish export/intake，不使用 backend/BFF/external framework/subagent。',
      'v3.6 不触碰真实原著事实、命名 NPC、hidden-adjacent、L4/L5、正式 lore 结论或知识库正文。',
    ],
    sourceRefs: unique([...inherited.sourceRefs, ...V360_SOURCE_REFS]).slice(0, 20),
  };
}
