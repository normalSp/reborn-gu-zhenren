import {
  V340_ALLOWED_AREA_KEY,
  type V340AgentLayer,
  type V340BuildInput,
  type V340RejectedProbe,
} from './v340-transient-agent-proposal';
import {
  V360_CANDIDATE_LANE_COPY_GATE_VERSION,
  V360_DETERMINISTIC_ROUNDS,
  V360_SYNTHETIC_L2_L3_MODEL_VERSION,
  V360_TRANSIENT_MICRO_EXPANSION_VERSION,
  buildV360TransientAgentMicroExpansion,
  type V360MicroExpansionLane,
  type V360TransientAgentMicroExpansionReport,
} from './v360-transient-agent-micro-expansion';

export const V370_PROPOSAL_GRAPH_MODEL_VERSION = 'v370_a1_multi_npc_small_faction_proposal_graph_v1';
export const V370_RUMOR_FACT_PRESSURE_COPY_GATE_VERSION = 'v370_a2_rumor_fact_pressure_handoff_copy_gate_v1';
export const V370_TRANSIENT_PROPOSAL_GRAPH_VERSION = 'v370_b1_transient_agent_proposal_graph_v1';
export const V370_DETERMINISTIC_ROUNDS = 120;

export type V370GraphStatus = 'candidate' | 'rejected' | 'expired' | 'needs_user_decision';
export type V370GraphNodeKind =
  | 'npc_intent_candidate'
  | 'small_faction_pressure_candidate'
  | 'rejected_safety_node'
  | 'expired_safety_node'
  | 'needs_user_decision_node';

export interface V370ProposalGraphNode {
  id: string;
  label: string;
  graphKind: V370GraphNodeKind;
  lifecycleStatus: V370GraphStatus;
  decision: V360MicroExpansionLane['decision'];
  displayPolicy: V360MicroExpansionLane['displayPolicy'];
  layer: V340AgentLayer | 'none';
  agentRole: string;
  genericArchetype: string;
  areaKey: typeof V340_ALLOWED_AREA_KEY;
  publicEventRef: string;
  motive: string;
  pressureVector: string;
  publicExpression: string;
  reason: string;
  rumorFactBoundary: string;
  pressureHandoffBoundary: string;
  safeNextStep: string;
  graphSignature: string;
  connectedNodeIds: string[];
  factsCommitted: false;
  saveWritten: false;
  promptWritten: false;
  canonPromoted: false;
  formalRelationWritten: false;
  factionStandingWritten: false;
  warrantWritten: false;
  recruitmentWritten: false;
  blockadeWritten: false;
  sourceRefs: string[];
  evidenceRefs: string[];
  copyGuardLines: string[];
}

export interface V370DeterministicProbeResult {
  recommendedRoundCount: typeof V370_DETERMINISTIC_ROUNDS;
  roundsChecked: number;
  acceptedRounds: number;
  uniqueGraphSignatures: number;
  rescoreStable: boolean;
  acceptedForGate: boolean;
  failures: string[];
  driftFamilies: string[];
  boundaryAssertions: {
    factsCommitted: false;
    saveWritten: false;
    promptWritten: false;
    canonPromoted: false;
    formalRelationWritten: false;
    factionStandingWritten: false;
    warrantWritten: false;
    recruitmentWritten: false;
    blockadeWritten: false;
    runFingerprintUsed: false;
    liveDeepSeekCalled: false;
    mirofishUsed: false;
    backendUsed: false;
    externalFrameworkUsed: false;
  };
}

export interface V370TransientAgentProposalGraphReport {
  schemaVersion: typeof V370_PROPOSAL_GRAPH_MODEL_VERSION;
  copyGateVersion: typeof V370_RUMOR_FACT_PRESSURE_COPY_GATE_VERSION;
  proposalGraphVersion: typeof V370_TRANSIENT_PROPOSAL_GRAPH_VERSION;
  inheritedV360SchemaVersion: typeof V360_SYNTHETIC_L2_L3_MODEL_VERSION;
  inheritedV360CopyGateVersion: typeof V360_CANDIDATE_LANE_COPY_GATE_VERSION;
  inheritedV360MicroExpansionVersion: typeof V360_TRANSIENT_MICRO_EXPANSION_VERSION;
  areaKey: typeof V340_ALLOWED_AREA_KEY;
  status: 'transient_proposal_graph_active' | 'transient_proposal_graph_evidence_light';
  statusLabel: string;
  publicSummary: string;
  inheritedV360: V360TransientAgentMicroExpansionReport;
  graphNodes: V370ProposalGraphNode[];
  npcCandidateNodes: V370ProposalGraphNode[];
  smallFactionPressureNodes: V370ProposalGraphNode[];
  rejectedNodes: V370ProposalGraphNode[];
  expiredNodes: V370ProposalGraphNode[];
  needsUserDecisionNodes: V370ProposalGraphNode[];
  inheritedRejectedProbes: V340RejectedProbe[];
  lifecycleSummary: Record<V370GraphStatus, number>;
  graphSummary: {
    npcCandidateCount: number;
    smallFactionPressureCount: number;
    connectedEdgeCount: number;
    publicEventRefCount: number;
    rumorFactBoundaryCount: number;
    pressureHandoffBoundaryCount: number;
  };
  audit: {
    persistenceMode: 'transient_proposal_only';
    graphMode: 'synthetic_generic_multi_npc_small_faction_pressure';
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
    formalFactionAuthorityUsed: false;
  };
  deterministicProbe: V370DeterministicProbeResult;
  playerAdvocatePlan: {
    requiredRounds: 40;
    liveDeepSeekCalled: false;
    purpose: string;
  };
  oldSaveEvidence: {
    oldSaveRequiredFields: 'none';
    newSaveFieldsAdded: false;
    migrationRequired: false;
    rollbackMode: 'drop_transient_graph_report_only';
  };
  boundaryLines: string[];
  sourceRefs: string[];
}

interface V370BuildOptions {
  includeDeterministicProbe?: boolean;
}

const V370_SOURCE_REFS = [
  'v3.7.0:D-370-001',
  'v3.7.0:D-370-002',
  'v3.7.0:D-370-003',
  'v3.7.0:D-370-004',
  'v3.7.0:D-370-005',
  'v3.7.0:D-370-006',
  'v3.7.0:D-370-007',
  'v3.7.0:D-370-009',
  'v3.7.0:D-370-010',
];

const V370_PUBLIC_EVENTS = [
  'outer_edge_labor_window',
  'low_rank_route_question',
  'supply_noise_public',
  'watcher_attention_shift',
  'minor_pressure_echo',
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
  return Math.abs(Math.floor(lane)) % 5;
}

function publicEventRef(turn: number, lane: number): string {
  return V370_PUBLIC_EVENTS[(turn + lane) % V370_PUBLIC_EVENTS.length];
}

function copyGuardLines(status: V370GraphStatus): string[] {
  const base = [
    '候选不是事实。',
    '传闻不是事实，压力不是正式 standing。',
    'WorldCore 保持最终裁决权。',
    '不写 store、save、prompt 或 canon。',
    '不调用 live DeepSeek，不使用 MiroFish，不接后端。',
  ];
  if (status === 'expired') return [...base, '过期 graph node 只提示重新取样，不保留候选结论。'];
  if (status === 'needs_user_decision') return [...base, '待决策 graph node 只显示 future gate 原因。'];
  if (status === 'rejected') return [...base, '阻断 graph node 只显示安全原因，不显示被拒正文。'];
  return base;
}

function makeNpcCandidate(
  source: V360MicroExpansionLane,
  index: number,
  turn: number,
  previewLane: number,
  refs: string[],
): V370ProposalGraphNode {
  const variants = [
    {
      label: '短工旁观者 graph node',
      role: '泛化短工旁观者',
      archetype: 'generic_l2_labor_observer_graph',
      motive: '想判断玩家是否能先做低风险粗活。',
      pressure: '劳力窗口压力',
      expression: '旁观者把注意力放在你是否能守口、搬运和不追问来源；这只是场面意图候选。',
      nextStep: '玩家可以选择低调接近、先做短活，或离开窗口；WorldCore 不写报酬、身份或关系。',
    },
    {
      label: '山路问话者 graph node',
      role: '泛化山路问话者',
      archetype: 'generic_l3_route_questioner_graph',
      motive: '想确认玩家的来路说法是否前后稳当。',
      pressure: '路线盘问压力',
      expression: '问话者只把问题压在脚印、包袱和同行痕迹上，没有给出正式结论。',
      nextStep: '玩家可以降调回答、转成杂务请求或暂停接触；不产生通行、封锁或追捕结论。',
    },
    {
      label: '补给听风者 graph node',
      role: '泛化补给听风者',
      archetype: 'generic_l2_supply_listener_graph',
      motive: '想观察玩家是否懂得低阶交易窗口的规矩。',
      pressure: '补给传闻压力',
      expression: '补给边的视线只形成听风候选，不给出价格、库存、收益或正式交易。',
      nextStep: '玩家可以继续观察或尝试轻量跑腿；经济结算仍由未来正式系统处理。',
    },
    {
      label: '临场小队谨慎 graph node',
      role: '泛化临场小队谨慎者',
      archetype: 'generic_l3_squad_caution_graph',
      motive: '想把陌生人的行动先压在可观察范围内。',
      pressure: '小队谨慎压力',
      expression: '小队没有把你纳入任何名册，只把接触限制在可撤回的观察范围。',
      nextStep: '玩家可以说明短期目标、降低姿态，或不再推进；不写队友、阵营或身份。',
    },
  ];
  const variant = variants[(index + previewLane) % variants.length];
  const layer = source.layer === 'L3' || variant.archetype.includes('_l3_') ? 'L3' : 'L2';
  const eventRef = publicEventRef(turn, index + previewLane);
  const id = `v370_npc_${index + 1}_${eventRef}_${turn % 17}`;

  return {
    id,
    label: variant.label,
    graphKind: 'npc_intent_candidate',
    lifecycleStatus: 'candidate',
    decision: 'approved_expression_candidate',
    displayPolicy: 'display_candidate',
    layer,
    agentRole: variant.role,
    genericArchetype: variant.archetype,
    areaKey: V340_ALLOWED_AREA_KEY,
    publicEventRef: eventRef,
    motive: variant.motive,
    pressureVector: variant.pressure,
    publicExpression: variant.expression,
    reason: 'D-370 批准的 multi-NPC synthetic/generic graph node；只用于候选表达和玩家理解。',
    rumorFactBoundary: '传闻/观察只是一条候选线索，不是事实、承诺、正式关系或结算。',
    pressureHandoffBoundary: 'pressure handoff 只把公开事件压力交给 WorldCore post-check；未裁决前不写 standing。',
    safeNextStep: variant.nextStep,
    graphSignature: `npc:${variant.archetype}:${eventRef}:${turn % 17}:${previewLane}`,
    connectedNodeIds: [],
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    formalRelationWritten: false,
    factionStandingWritten: false,
    warrantWritten: false,
    recruitmentWritten: false,
    blockadeWritten: false,
    sourceRefs: unique([...refs, ...source.sourceRefs, ...V370_SOURCE_REFS]).slice(0, 18),
    evidenceRefs: unique([...source.evidenceRefs, 'v3.7.0:b1:multi_npc_graph_node', eventRef]).slice(0, 10),
    copyGuardLines: copyGuardLines('candidate'),
  };
}

function makeSmallFactionPressureNode(
  npcNodes: V370ProposalGraphNode[],
  turn: number,
  previewLane: number,
  refs: string[],
): V370ProposalGraphNode {
  const eventRef = publicEventRef(turn, previewLane + 4);
  const id = `v370_small_faction_pressure_${eventRef}_${turn % 19}`;

  return {
    id,
    label: '小势力公开压力 graph node',
    graphKind: 'small_faction_pressure_candidate',
    lifecycleStatus: 'candidate',
    decision: 'approved_expression_candidate',
    displayPolicy: 'display_candidate',
    layer: 'L3',
    agentRole: '泛化小势力公开压力源',
    genericArchetype: 'generic_l3_small_faction_pressure_graph',
    areaKey: V340_ALLOWED_AREA_KEY,
    publicEventRef: eventRef,
    motive: '想把多个低阶观察点合并成可撤回的公开压力，而不是正式势力规则。',
    pressureVector: '小势力公开压力候选',
    publicExpression: '附近小势力只显出公开压力：多看一眼、多问一句、少给一步空间；它不是正式势力关系。',
    reason: 'D-370 批准的小势力公开压力源；只聚合公开压力，不写正式势力规则。',
    rumorFactBoundary: '小势力压力来自公开场面，不是真实原著事实、命名势力结论或隐藏事实。',
    pressureHandoffBoundary: 'pressure handoff 只用于候选表达；不写 formal standing、warrant、recruitment 或 blockade。',
    safeNextStep: '玩家可以避开压力、降低姿态、转为短工或继续观察；WorldCore 不结算阵营、通缉、招揽或封锁。',
    graphSignature: `small_faction:${eventRef}:${turn % 19}:${previewLane}:${npcNodes.map(item => item.id).join(',')}`,
    connectedNodeIds: npcNodes.map(item => item.id),
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    formalRelationWritten: false,
    factionStandingWritten: false,
    warrantWritten: false,
    recruitmentWritten: false,
    blockadeWritten: false,
    sourceRefs: unique([...refs, ...V370_SOURCE_REFS]).slice(0, 18),
    evidenceRefs: unique(['v3.7.0:b1:small_faction_pressure_node', eventRef, ...npcNodes.map(item => item.id)]).slice(0, 12),
    copyGuardLines: copyGuardLines('candidate'),
  };
}

function makeSafetyNode(
  source: V360MicroExpansionLane,
  index: number,
  refs: string[],
): V370ProposalGraphNode {
  const status = source.lifecycleStatus;
  const graphKind: V370GraphNodeKind = status === 'rejected'
    ? 'rejected_safety_node'
    : status === 'expired'
      ? 'expired_safety_node'
      : 'needs_user_decision_node';

  return {
    id: `v370_${graphKind}_${source.id}_${index}`,
    label: source.label,
    graphKind,
    lifecycleStatus: status,
    decision: source.decision,
    displayPolicy: 'display_reason_only',
    layer: source.layer,
    agentRole: source.agentRole,
    genericArchetype: source.genericArchetype,
    areaKey: V340_ALLOWED_AREA_KEY,
    publicEventRef: 'safety_boundary',
    motive: '只用于显示安全原因，不输出被拒正文。',
    pressureVector: '安全边界压力',
    publicExpression: source.publicExpression,
    reason: source.reason,
    rumorFactBoundary: '安全 node 不产生传闻事实，也不继承隐藏或正式信息。',
    pressureHandoffBoundary: '安全 node 只把阻断/过期/待决策原因交给玩家，不交给 runtime state。',
    safeNextStep: source.safeNextStep,
    graphSignature: `safety:${graphKind}:${source.id}:${index}`,
    connectedNodeIds: [],
    factsCommitted: false,
    saveWritten: false,
    promptWritten: false,
    canonPromoted: false,
    formalRelationWritten: false,
    factionStandingWritten: false,
    warrantWritten: false,
    recruitmentWritten: false,
    blockadeWritten: false,
    sourceRefs: unique([...refs, ...source.sourceRefs, ...V370_SOURCE_REFS]).slice(0, 18),
    evidenceRefs: unique([...source.evidenceRefs, 'v3.7.0:b1:safety_graph_node']).slice(0, 10),
    copyGuardLines: copyGuardLines(status),
  };
}

function countLifecycle(items: V370ProposalGraphNode[]): Record<V370GraphStatus, number> {
  return {
    candidate: items.filter(item => item.lifecycleStatus === 'candidate').length,
    rejected: items.filter(item => item.lifecycleStatus === 'rejected').length,
    expired: items.filter(item => item.lifecycleStatus === 'expired').length,
    needs_user_decision: items.filter(item => item.lifecycleStatus === 'needs_user_decision').length,
  };
}

function makePendingProbe(): V370DeterministicProbeResult {
  return {
    recommendedRoundCount: V370_DETERMINISTIC_ROUNDS,
    roundsChecked: 0,
    acceptedRounds: 0,
    uniqueGraphSignatures: 0,
    rescoreStable: false,
    acceptedForGate: false,
    failures: ['probe_not_run_in_nested_build'],
    driftFamilies: [
      'candidate_not_fact',
      'multi_npc_differentiation',
      'small_faction_pressure_not_formal_standing',
      'rumor_fact_boundary',
      'pressure_handoff_boundary',
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
    },
  };
}

function noForbiddenClaim(report: V370TransientAgentProposalGraphReport): boolean {
  const text = [
    report.publicSummary,
    ...report.graphNodes.flatMap(item => [
      item.publicExpression,
      item.rumorFactBoundary,
      item.pressureHandoffBoundary,
      item.safeNextStep,
    ]),
    ...report.boundaryLines,
  ].join('\n');

  return !/方源|春秋蝉|重生|回溯|奖励已发放|NPC已死亡|正式加入商队|通缉成立|招揽成功|封锁生效|SAVE_FORMAT_VERSION\s*=\s*26/i.test(text);
}

export function runV370DeterministicProbe(roundCount = V370_DETERMINISTIC_ROUNDS): V370DeterministicProbeResult {
  const rounds = Math.max(1, Math.floor(roundCount));
  const signatures = new Set<string>();
  const failures: string[] = [];
  let acceptedRounds = 0;

  for (let round = 1; round <= rounds; round += 1) {
    const report = buildV370TransientAgentProposalGraph({
      turn: round,
      previewLane: round % 5,
      regionalEventLedger: {
        status: 'events_tracked',
        sourceRefs: ['v3.7.0:D-370-006'],
        publicEvents: [
          { id: `v370_public_labor_${round % 7}`, eventKind: 'labor_window' },
          { id: `v370_public_route_${round % 5}`, eventKind: 'route_question' },
          { id: `v370_public_supply_${round % 4}`, eventKind: 'supply_noise' },
          { id: `v370_public_pressure_${round % 6}`, eventKind: 'minor_pressure' },
        ],
      },
      localActionLedger: [
        { id: `v370_local_action_${round % 8}`, actionType: 'generic_low_rank_multi_npc_observation' },
      ],
    }, { includeDeterministicProbe: false });

    const allNodeSafe = report.graphNodes.every(item =>
      item.factsCommitted === false
      && item.saveWritten === false
      && item.promptWritten === false
      && item.canonPromoted === false
      && item.formalRelationWritten === false
      && item.factionStandingWritten === false
      && item.warrantWritten === false
      && item.recruitmentWritten === false
      && item.blockadeWritten === false
      && item.areaKey === V340_ALLOWED_AREA_KEY);
    const auditSafe = report.audit.runFingerprintUsed === false
      && report.audit.liveDeepSeekCalled === false
      && report.audit.mirofishUsed === false
      && report.audit.backendUsed === false
      && report.audit.externalFrameworkUsed === false
      && report.audit.selfLearningWritesUsed === false
      && report.audit.formalFactionAuthorityUsed === false;
    const hasGraphCoverage = report.npcCandidateNodes.length >= 3
      && report.npcCandidateNodes.length <= 5
      && report.smallFactionPressureNodes.length >= 1
      && report.rejectedNodes.length >= 3
      && report.expiredNodes.length >= 1
      && report.needsUserDecisionNodes.length >= 1
      && report.graphSummary.connectedEdgeCount >= 3
      && report.graphSummary.rumorFactBoundaryCount === report.graphNodes.length
      && report.graphSummary.pressureHandoffBoundaryCount === report.graphNodes.length;

    if (allNodeSafe && auditSafe && hasGraphCoverage && noForbiddenClaim(report)) {
      acceptedRounds += 1;
    } else {
      failures.push(`round_${round}`);
    }

    signatures.add(report.graphNodes.map(item => item.graphSignature).join('|'));
  }

  return {
    recommendedRoundCount: V370_DETERMINISTIC_ROUNDS,
    roundsChecked: rounds,
    acceptedRounds,
    uniqueGraphSignatures: signatures.size,
    rescoreStable: failures.length === 0,
    acceptedForGate: failures.length === 0 && signatures.size >= 8,
    failures,
    driftFamilies: [
      'candidate_not_fact',
      'multi_npc_differentiation',
      'small_faction_pressure_not_formal_standing',
      'rumor_fact_boundary',
      'pressure_handoff_boundary',
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
    },
  };
}

export function buildV370TransientAgentProposalGraph(
  input: V340BuildInput = {},
  options: V370BuildOptions = {},
): V370TransientAgentProposalGraphReport {
  const turn = normalizedTurn(input.turn);
  const previewLane = normalizedLane(input.previewLane);
  const inheritedV360 = buildV360TransientAgentMicroExpansion(input, {
    includeDeterministicProbe: options.includeDeterministicProbe === false ? false : true,
  });
  const refs = unique([...inheritedV360.sourceRefs, ...V370_SOURCE_REFS]);
  const sourceCandidates = inheritedV360.candidateLanes
    .filter(item => item.layer === 'L2' || item.layer === 'L3')
    .slice(0, 4);
  const npcCandidateNodes = sourceCandidates.map((item, index) => makeNpcCandidate(item, index, turn, previewLane, refs));
  const smallFactionPressureNode = makeSmallFactionPressureNode(npcCandidateNodes, turn, previewLane, refs);
  const rejectedNodes = inheritedV360.rejectedLanes.map((item, index) => makeSafetyNode(item, index, refs));
  const expiredNodes = inheritedV360.expiredLanes.map((item, index) => makeSafetyNode(item, index, refs));
  const needsUserDecisionNodes = inheritedV360.needsUserDecisionLanes.map((item, index) => makeSafetyNode(item, index, refs));
  const graphNodes = [
    ...npcCandidateNodes,
    smallFactionPressureNode,
    ...rejectedNodes,
    ...expiredNodes,
    ...needsUserDecisionNodes,
  ];
  const deterministicProbe = options.includeDeterministicProbe === false
    ? makePendingProbe()
    : runV370DeterministicProbe(V370_DETERMINISTIC_ROUNDS);

  return {
    schemaVersion: V370_PROPOSAL_GRAPH_MODEL_VERSION,
    copyGateVersion: V370_RUMOR_FACT_PRESSURE_COPY_GATE_VERSION,
    proposalGraphVersion: V370_TRANSIENT_PROPOSAL_GRAPH_VERSION,
    inheritedV360SchemaVersion: V360_SYNTHETIC_L2_L3_MODEL_VERSION,
    inheritedV360CopyGateVersion: V360_CANDIDATE_LANE_COPY_GATE_VERSION,
    inheritedV360MicroExpansionVersion: V360_TRANSIENT_MICRO_EXPANSION_VERSION,
    areaKey: V340_ALLOWED_AREA_KEY,
    status: inheritedV360.status === 'synthetic_micro_expansion_active'
      ? 'transient_proposal_graph_active'
      : 'transient_proposal_graph_evidence_light',
    statusLabel: inheritedV360.status === 'synthetic_micro_expansion_active'
      ? 'v3.7 proposal graph 已接管；v3.6 synthetic L2/L3 micro-expansion 与 v3.5 lifecycle v2 继续有效'
      : 'v3.7 proposal graph 证据较轻，仍只显示安全候选；v3.6 synthetic L2/L3 micro-expansion 与 v3.5 lifecycle v2 继续有效',
    publicSummary: 'v3.7 把多个 synthetic/generic L2/L3 候选连接成 transient proposal graph：3-5 个泛化 NPC 候选与 1 个小势力公开压力源可互相解释，但传闻不是事实，压力不是正式 standing，全部仍由 WorldCore post-check 最终裁决。',
    inheritedV360,
    graphNodes,
    npcCandidateNodes,
    smallFactionPressureNodes: [smallFactionPressureNode],
    rejectedNodes,
    expiredNodes,
    needsUserDecisionNodes,
    inheritedRejectedProbes: inheritedV360.inheritedRejectedProbes,
    lifecycleSummary: countLifecycle(graphNodes),
    graphSummary: {
      npcCandidateCount: npcCandidateNodes.length,
      smallFactionPressureCount: 1,
      connectedEdgeCount: smallFactionPressureNode.connectedNodeIds.length,
      publicEventRefCount: unique(graphNodes.map(item => item.publicEventRef)).length,
      rumorFactBoundaryCount: graphNodes.filter(item => item.rumorFactBoundary.length > 0).length,
      pressureHandoffBoundaryCount: graphNodes.filter(item => item.pressureHandoffBoundary.length > 0).length,
    },
    audit: {
      persistenceMode: 'transient_proposal_only',
      graphMode: 'synthetic_generic_multi_npc_small_faction_pressure',
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
      formalFactionAuthorityUsed: false,
    },
    deterministicProbe,
    playerAdvocatePlan: {
      requiredRounds: 40,
      liveDeepSeekCalled: false,
      purpose: '验证玩家能理解 v3.7 多 NPC / 小势力 proposal graph、传闻/事实边界、pressure handoff 和 no-save/no-runFingerprint 规则。',
    },
    oldSaveEvidence: {
      oldSaveRequiredFields: 'none',
      newSaveFieldsAdded: false,
      migrationRequired: false,
      rollbackMode: 'drop_transient_graph_report_only',
    },
    boundaryLines: [
      'v3.7 proposal graph 只连接 synthetic/generic 多 NPC 候选和小势力公开压力，不生成正式世界事实。',
      '传闻不是事实；小势力压力不是正式 standing、通行、通缉、招揽、封锁或阵营结论。',
      'WorldCore post-check 保持最终裁决权；graph node 不进入 store、save、prompt 或 canon。',
      'v3.7 不新增 save field，不 bump SAVE_FORMAT_VERSION，不新增 runFingerprint。',
      'v3.7 不调用 live DeepSeek，不做 MiroFish export/intake，不使用 backend/BFF/external framework/subagent。',
      'v3.7 不触碰真实原著事实、命名 NPC、hidden-adjacent、L4/L5、正式 lore 结论或知识库正文。',
    ],
    sourceRefs: refs.slice(0, 24),
  };
}
