import {
  buildV370TransientAgentProposalGraph,
  V370_PROPOSAL_GRAPH_MODEL_VERSION,
  V370_RUMOR_FACT_PRESSURE_COPY_GATE_VERSION,
  V370_TRANSIENT_PROPOSAL_GRAPH_VERSION,
  type V370DeterministicProbeResult,
  type V370ProposalGraphNode,
  type V370TransientAgentProposalGraphReport,
} from './v370-transient-agent-proposal-graph';
import { V340_ALLOWED_AREA_KEY, type V340BuildInput } from './v340-transient-agent-proposal';

export const V380_PROPOSAL_GRAPH_STABILITY_MODEL_VERSION =
  'v380_a1_long_horizon_proposal_graph_stability_model_v1';
export const V380_MULTI_PRESSURE_COPY_GATE_VERSION =
  'v380_a2_multi_pressure_same_start_copy_gate_v1';
export const V380_TRANSIENT_PROPOSAL_GRAPH_STABILITY_VERSION =
  'v380_b1_transient_agent_proposal_graph_stability_v1';
export const V380_DETERMINISTIC_ROUNDS = 150;

export type V380PressureLaneStatus =
  | 'candidate'
  | 'rejected'
  | 'expired'
  | 'needs_user_decision';

export type V380PressureLaneKind =
  | 'labor_window_pressure'
  | 'route_question_pressure'
  | 'supply_noise_pressure'
  | 'watcher_attention_pressure';

export interface V380PressureStabilityLane {
  id: string;
  kind: V380PressureLaneKind;
  status: V380PressureLaneStatus;
  label: string;
  publicCopy: string;
  connectedNodeIds: string[];
  pressureSourceCount: number;
  pressureInterferenceBoundary: string;
  sameStartVariationBoundary: string;
  memoryContaminationBoundary: string;
  graphSignature: string;
  factsCommitted: false;
  saveWritten: false;
  promptWritten: false;
  canonPromoted: false;
  formalStandingWritten: false;
  npcLifeDeathWritten: false;
  rewardGranted: false;
}

export interface V380MemoryContaminationAudit {
  candidateToFactLeak: false;
  rejectedPromotedToRuntime: false;
  expiredPromotedToRuntime: false;
  pressureToFormalStandingLeak: false;
  rumorToFactLeak: false;
  manualReviewLanePromoted: false;
}

export interface V380DeterministicProbeResult {
  roundCount: number;
  acceptedRounds: number;
  uniqueStabilitySignatureCount: number;
  pressureLaneCount: number;
  pressureInterferencePairCount: number;
  failures: string[];
  boundaryAssertions: {
    factsCommitted: false;
    saveWritten: false;
    promptWritten: false;
    canonPromoted: false;
    runFingerprintWritten: false;
    liveDeepSeekCalled: false;
    mirofishRequired: false;
    backendRequired: false;
    externalFrameworkUsed: false;
    formalStandingWritten: false;
    npcLifeDeathWritten: false;
    rewardGranted: false;
    hiddenLeakDetected: false;
    memoryContaminationDetected: false;
  };
  acceptedForGate: boolean;
}

export interface V380TransientAgentProposalGraphStabilityReport {
  schemaVersion: typeof V380_PROPOSAL_GRAPH_STABILITY_MODEL_VERSION;
  inheritedGraphModelVersion: typeof V370_PROPOSAL_GRAPH_MODEL_VERSION;
  inheritedRumorFactCopyGateVersion: typeof V370_RUMOR_FACT_PRESSURE_COPY_GATE_VERSION;
  inheritedGraphVersion: typeof V370_TRANSIENT_PROPOSAL_GRAPH_VERSION;
  copyGateVersion: typeof V380_MULTI_PRESSURE_COPY_GATE_VERSION;
  stabilityVersion: typeof V380_TRANSIENT_PROPOSAL_GRAPH_STABILITY_VERSION;
  areaKey: typeof V340_ALLOWED_AREA_KEY;
  status: 'transient_proposal_graph_stability_active';
  inheritedV370: V370TransientAgentProposalGraphReport;
  inheritedV370DeterministicProbe: V370DeterministicProbeResult;
  pressureStabilityLanes: V380PressureStabilityLane[];
  multiPressureSummary: {
    pressureSourceCount: number;
    pressureInterferencePairCount: number;
    sameStartVariationMode: 'deterministic_same_start_stability_review';
    longHorizonRoundGate: typeof V380_DETERMINISTIC_ROUNDS;
  };
  memoryContaminationAudit: V380MemoryContaminationAudit;
  audit: {
    reportOnly: true;
    transientOnly: true;
    worldCoreFinalAuthority: true;
    noSaveWrite: true;
    noStoreSlice: true;
    noPromptWrite: true;
    noRunFingerprint: true;
    noLiveDeepSeek: true;
    noMiroFish: true;
    noBackend: true;
    noExternalFramework: true;
    noFormalFactionStanding: true;
    noNpcLifeDeath: true;
    noRewardGrant: true;
  };
  deterministicProbe: V380DeterministicProbeResult;
  playerAdvocatePlan: {
    requiredRounds: 50;
    liveDeepSeek: 'no';
    model: 'not_called';
    reportPath: string;
  };
  oldSaveNoSaveRollbackEvidence: {
    oldSaveCompatible: true;
    noSaveMutation: true;
    rollbackNoop: true;
    evidenceCopy: string[];
  };
  boundaryLines: string[];
  stabilitySignature: string;
}

export interface V380BuildOptions {
  includeDeterministicProbe?: boolean;
}

const PRESSURE_TEMPLATES: Array<{
  kind: V380PressureLaneKind;
  status: V380PressureLaneStatus;
  label: string;
}> = [
  {
    kind: 'labor_window_pressure',
    status: 'candidate',
    label: '劳役窗口被邻近小势力反复试探',
  },
  {
    kind: 'route_question_pressure',
    status: 'needs_user_decision',
    label: '路线传闻触发多 NPC 口径分歧',
  },
  {
    kind: 'supply_noise_pressure',
    status: 'rejected',
    label: '补给噪声试图被误写为正式势力态度',
  },
  {
    kind: 'watcher_attention_pressure',
    status: 'expired',
    label: '旁观者注意力随回合衰减',
  },
];

const FORBIDDEN_GRAPH_CLAIM =
  /方源|春秋蝉|重生|回溯|奖励已发放|NPC已死亡|正式加入商队|通缉成立|招揽成功|封锁生效|SAVE_FORMAT_VERSION\s*=\s*26/i;

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function rotateNodes(nodes: V370ProposalGraphNode[], turn: number): V370ProposalGraphNode[] {
  if (nodes.length === 0) return [];
  const offset = Math.abs(turn) % nodes.length;
  return nodes.slice(offset).concat(nodes.slice(0, offset));
}

function makePressureStabilityLanes(
  inheritedV370: V370TransientAgentProposalGraphReport,
  input: V340BuildInput,
): V380PressureStabilityLane[] {
  const rawTurn = Number(input.turn ?? 0);
  const turn = Number.isFinite(rawTurn) ? Math.floor(rawTurn) : 0;
  const sourceNodes = rotateNodes(inheritedV370.graphNodes, turn);
  const laneCount = 4;

  return Array.from({ length: laneCount }, (_, index) => {
    const template = pick(PRESSURE_TEMPLATES, turn + index);
    const firstNode = pick(sourceNodes, index);
    const secondNode = pick(sourceNodes, index + 2);
    const thirdNode = pick(sourceNodes, index + 4);
    const connectedNodeIds = Array.from(
      new Set([firstNode?.id, secondNode?.id, thirdNode?.id].filter(Boolean) as string[]),
    );
    const preview = input.previewLane ?? 'quiet';
    const signature = [
      V380_TRANSIENT_PROPOSAL_GRAPH_STABILITY_VERSION,
      template.kind,
      template.status,
      turn % 17,
      preview,
      connectedNodeIds.join('|'),
    ].join(':');

    return {
      id: `v380-pressure-lane-${index + 1}-${template.kind}`,
      kind: template.kind,
      status: template.status,
      label: template.label,
      publicCopy:
        `${template.label}；这里只生成候选压力 lane，不写事实、不写正式关系，也不把传闻升级成结论。`,
      connectedNodeIds,
      pressureSourceCount: connectedNodeIds.length,
      pressureInterferenceBoundary:
        '多小势力压力只允许影响候选排序和表达提示；正式封锁、招揽、通缉、站队必须保持未授权。',
      sameStartVariationBoundary:
        '同开局差异只能来自 deterministic proposal graph lane，不允许使用 runFingerprint 或写入存档。',
      memoryContaminationBoundary:
        'candidate/rejected/expired/needs_user_decision 均不得污染 runtime canon、prompt 或玩家存档。',
      graphSignature: signature,
      factsCommitted: false,
      saveWritten: false,
      promptWritten: false,
      canonPromoted: false,
      formalStandingWritten: false,
      npcLifeDeathWritten: false,
      rewardGranted: false,
    };
  });
}

function makeMemoryContaminationAudit(): V380MemoryContaminationAudit {
  return {
    candidateToFactLeak: false,
    rejectedPromotedToRuntime: false,
    expiredPromotedToRuntime: false,
    pressureToFormalStandingLeak: false,
    rumorToFactLeak: false,
    manualReviewLanePromoted: false,
  };
}

function makePendingDeterministicProbe(roundCount = V380_DETERMINISTIC_ROUNDS): V380DeterministicProbeResult {
  return {
    roundCount,
    acceptedRounds: 0,
    uniqueStabilitySignatureCount: 0,
    pressureLaneCount: 0,
    pressureInterferencePairCount: 0,
    failures: ['deterministic probe not requested'],
    boundaryAssertions: {
      factsCommitted: false,
      saveWritten: false,
      promptWritten: false,
      canonPromoted: false,
      runFingerprintWritten: false,
      liveDeepSeekCalled: false,
      mirofishRequired: false,
      backendRequired: false,
      externalFrameworkUsed: false,
      formalStandingWritten: false,
      npcLifeDeathWritten: false,
      rewardGranted: false,
      hiddenLeakDetected: false,
      memoryContaminationDetected: false,
    },
    acceptedForGate: false,
  };
}

function joinLaneSignatures(lanes: V380PressureStabilityLane[]): string {
  return lanes.map((lane) => `${lane.kind}/${lane.status}/${lane.connectedNodeIds.join('+')}`).join(';');
}

function makeStabilitySignature(
  inheritedV370: V370TransientAgentProposalGraphReport,
  lanes: V380PressureStabilityLane[],
): string {
  return [
    V380_TRANSIENT_PROPOSAL_GRAPH_STABILITY_VERSION,
      inheritedV370.graphNodes.length,
    inheritedV370.graphSummary.connectedEdgeCount,
    joinLaneSignatures(lanes),
  ].join('|');
}

export function buildV380TransientAgentProposalGraphStability(
  input: V340BuildInput = {},
  options: V380BuildOptions = {},
): V380TransientAgentProposalGraphStabilityReport {
  const shouldRunDeterministicProbe = options.includeDeterministicProbe !== false;
  const inheritedV370 = buildV370TransientAgentProposalGraph(input, {
    includeDeterministicProbe: shouldRunDeterministicProbe,
  });
  const inheritedV370DeterministicProbe = inheritedV370.deterministicProbe;
  const pressureStabilityLanes = makePressureStabilityLanes(inheritedV370, input);
  const pressureInterferencePairCount = pressureStabilityLanes.reduce(
    (count, lane) => count + Math.max(0, lane.connectedNodeIds.length - 1),
    0,
  );
  const memoryContaminationAudit = makeMemoryContaminationAudit();
  const deterministicProbe =
    !shouldRunDeterministicProbe
      ? makePendingDeterministicProbe()
      : runV380DeterministicProbe(V380_DETERMINISTIC_ROUNDS);
  const stabilitySignature = makeStabilitySignature(inheritedV370, pressureStabilityLanes);

  return {
    schemaVersion: V380_PROPOSAL_GRAPH_STABILITY_MODEL_VERSION,
    inheritedGraphModelVersion: V370_PROPOSAL_GRAPH_MODEL_VERSION,
    inheritedRumorFactCopyGateVersion: V370_RUMOR_FACT_PRESSURE_COPY_GATE_VERSION,
    inheritedGraphVersion: V370_TRANSIENT_PROPOSAL_GRAPH_VERSION,
    copyGateVersion: V380_MULTI_PRESSURE_COPY_GATE_VERSION,
    stabilityVersion: V380_TRANSIENT_PROPOSAL_GRAPH_STABILITY_VERSION,
    areaKey: V340_ALLOWED_AREA_KEY,
    status: 'transient_proposal_graph_stability_active',
    inheritedV370,
    inheritedV370DeterministicProbe,
    pressureStabilityLanes,
    multiPressureSummary: {
      pressureSourceCount: pressureStabilityLanes.length,
      pressureInterferencePairCount,
      sameStartVariationMode: 'deterministic_same_start_stability_review',
      longHorizonRoundGate: V380_DETERMINISTIC_ROUNDS,
    },
    memoryContaminationAudit,
    audit: {
      reportOnly: true,
      transientOnly: true,
      worldCoreFinalAuthority: true,
      noSaveWrite: true,
      noStoreSlice: true,
      noPromptWrite: true,
      noRunFingerprint: true,
      noLiveDeepSeek: true,
      noMiroFish: true,
      noBackend: true,
      noExternalFramework: true,
      noFormalFactionStanding: true,
      noNpcLifeDeath: true,
      noRewardGrant: true,
    },
    deterministicProbe,
    playerAdvocatePlan: {
      requiredRounds: 50,
      liveDeepSeek: 'no',
      model: 'not_called',
      reportPath:
        '指导大纲/v3.8.0/codex/00-总览/v3.8.0-b3-Player-Advocate-50轮记录.md',
    },
    oldSaveNoSaveRollbackEvidence: {
      oldSaveCompatible: true,
      noSaveMutation: true,
      rollbackNoop: true,
      evidenceCopy: [
        'v3.8 只消费现有 world-panel projection 输入；没有新增 store slice、save 字段或 migration。',
        'rollback 对 v3.8 等价于丢弃 transient report；没有持久 agent 状态需要回滚。',
        'old-save 只会得到 synthetic/generic proposal graph stability copy，不会补写正式世界事实。',
      ],
    },
    boundaryLines: [
      'v3.8 proposal graph stability 是 transient/report-only 层；候选不是事实。',
      'WorldCore 保持最终裁决；正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁均未授权。',
      '同开局差异只允许来自 deterministic proposal graph lane；禁止 runFingerprint、save 写入和隐藏事实注入。',
      'candidate/rejected/expired/needs_user_decision 不得污染 runtime canon、prompt、DeepSeek visible context 或玩家存档。',
      'v3.8 不新增 save field，不 bump SAVE_FORMAT_VERSION，不新增 runFingerprint。',
      'v3.8 不调用 live DeepSeek，不做 MiroFish export/intake，不使用 backend/BFF/external framework/subagent。',
      'v3.8 不触碰真实原著事实、命名 NPC、hidden-adjacent、L4/L5、正式 lore 结论或知识库正文。',
    ],
    stabilitySignature,
  };
}

export function runV380DeterministicProbe(
  roundCount = V380_DETERMINISTIC_ROUNDS,
): V380DeterministicProbeResult {
  const failures: string[] = [];
  const signatures = new Set<string>();
  let acceptedRounds = 0;
  let maxPressureLaneCount = 0;
  let maxPressureInterferencePairCount = 0;

  for (let round = 0; round < roundCount; round += 1) {
    const report = buildV380TransientAgentProposalGraphStability(
      {
        turn: round,
        previewLane: round % 5,
      },
      { includeDeterministicProbe: false },
    );

    const lanes = report.pressureStabilityLanes;
    const laneSafe = lanes.every(
      (lane) =>
        lane.factsCommitted === false &&
        lane.saveWritten === false &&
        lane.promptWritten === false &&
        lane.canonPromoted === false &&
        lane.formalStandingWritten === false &&
        lane.npcLifeDeathWritten === false &&
        lane.rewardGranted === false &&
        lane.connectedNodeIds.length >= 2 &&
        lane.publicCopy.includes('候选') &&
        lane.publicCopy.includes('不写事实') &&
        !FORBIDDEN_GRAPH_CLAIM.test(lane.publicCopy),
    );

    const inheritedSafe =
      report.inheritedV370.areaKey === V340_ALLOWED_AREA_KEY &&
      report.inheritedV370.graphNodes.length >= 5 &&
      report.inheritedV370.graphSummary.connectedEdgeCount >= 3 &&
      report.inheritedV370.lifecycleSummary.rejected >= 3 &&
      report.inheritedV370.lifecycleSummary.expired >= 1 &&
      report.inheritedV370.lifecycleSummary.needs_user_decision >= 1 &&
      report.inheritedV370.audit.runFingerprintUsed === false &&
      report.inheritedV370.audit.liveDeepSeekCalled === false &&
      report.inheritedV370.audit.mirofishUsed === false &&
      report.inheritedV370.audit.backendUsed === false;

    const contaminationSafe = Object.values(report.memoryContaminationAudit).every(
      (value) => value === false,
    );
    const auditSafe =
      report.audit.reportOnly === true &&
      report.audit.transientOnly === true &&
      report.audit.worldCoreFinalAuthority === true &&
      report.audit.noSaveWrite === true &&
      report.audit.noStoreSlice === true &&
      report.audit.noPromptWrite === true &&
      report.audit.noRunFingerprint === true &&
      report.audit.noLiveDeepSeek === true &&
      report.audit.noMiroFish === true &&
      report.audit.noBackend === true &&
      report.audit.noExternalFramework === true &&
      report.audit.noFormalFactionStanding === true &&
      report.audit.noNpcLifeDeath === true &&
      report.audit.noRewardGrant === true;

    const graphStable =
      lanes.length >= 4 &&
      report.multiPressureSummary.pressureSourceCount >= 4 &&
      report.multiPressureSummary.pressureInterferencePairCount >= 6 &&
      report.multiPressureSummary.longHorizonRoundGate === V380_DETERMINISTIC_ROUNDS &&
      report.boundaryLines.some((line) => line.includes('candidate/rejected/expired/needs_user_decision')) &&
      report.boundaryLines.some((line) => line.includes('WorldCore')) &&
      !FORBIDDEN_GRAPH_CLAIM.test(report.boundaryLines.join('\n')) &&
      report.oldSaveNoSaveRollbackEvidence.oldSaveCompatible === true &&
      report.oldSaveNoSaveRollbackEvidence.noSaveMutation === true &&
      report.oldSaveNoSaveRollbackEvidence.rollbackNoop === true &&
      report.playerAdvocatePlan.requiredRounds === 50 &&
      report.playerAdvocatePlan.liveDeepSeek === 'no';

    maxPressureLaneCount = Math.max(maxPressureLaneCount, lanes.length);
    maxPressureInterferencePairCount = Math.max(
      maxPressureInterferencePairCount,
      report.multiPressureSummary.pressureInterferencePairCount,
    );
    signatures.add(report.stabilitySignature);

    if (laneSafe && inheritedSafe && contaminationSafe && auditSafe && graphStable) {
      acceptedRounds += 1;
    } else {
      failures.push(`round ${round} failed v3.8 proposal graph stability gate`);
    }
  }

  const enoughVariation = signatures.size >= 12;
  if (!enoughVariation) {
    failures.push(`expected at least 12 unique stability signatures, got ${signatures.size}`);
  }

  return {
    roundCount,
    acceptedRounds,
    uniqueStabilitySignatureCount: signatures.size,
    pressureLaneCount: maxPressureLaneCount,
    pressureInterferencePairCount: maxPressureInterferencePairCount,
    failures,
    boundaryAssertions: {
      factsCommitted: false,
      saveWritten: false,
      promptWritten: false,
      canonPromoted: false,
      runFingerprintWritten: false,
      liveDeepSeekCalled: false,
      mirofishRequired: false,
      backendRequired: false,
      externalFrameworkUsed: false,
      formalStandingWritten: false,
      npcLifeDeathWritten: false,
      rewardGranted: false,
      hiddenLeakDetected: false,
      memoryContaminationDetected: false,
    },
    acceptedForGate: failures.length === 0 && acceptedRounds === roundCount && enoughVariation,
  };
}
