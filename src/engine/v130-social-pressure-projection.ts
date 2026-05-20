import {
  buildQingmaoFactionStanceProjection,
  type QingmaoFactionStanceProjectionResult,
  type QingmaoFactionStanceSeverity,
} from './v013-qingmao-faction-stance';
import {
  buildQingmaoNpcMemoryProjection,
  type QingmaoNpcMemoryProjectionResult,
  type QingmaoNpcMemoryRisk,
} from './v013-qingmao-npc-memory';
import {
  buildQingmaoPublicEventChronicle,
  type QingmaoPublicEventChronicleResult,
} from './v013-qingmao-public-event-chronicle';
import {
  buildQingmaoSocialFollowups,
  type QingmaoSocialFollowupResult,
  type QingmaoSocialFollowupRisk,
} from './v013-qingmao-social-followups';
import type { LivingWorldState, LocalActionLedgerEntry } from '../types';

export type V130SocialProjectionStatus = 'needs_public_evidence' | 'pressure_visible';

export type V130SocialSignalKind =
  | 'faction_pressure'
  | 'npc_memory'
  | 'public_event'
  | 'social_followup';

export type V130SocialSignalSeverity = 'low' | 'medium' | 'high' | 'blocked';

export interface V130SocialPressureSignal {
  id: string;
  kind: V130SocialSignalKind;
  title: string;
  subjectLabel: string;
  statusLabel: string;
  summary: string;
  nextStep: string;
  severity: V130SocialSignalSeverity;
  visibleSourceRefs: string[];
  blockedUpgrades: string[];
  forbiddenWrites: string[];
  canPatch: false;
  statePatchApplied: false;
  hiddenBoundaryProtected: boolean;
}

export interface V130SocialPressureProjection {
  status: V130SocialProjectionStatus;
  statusLabel: string;
  publicSummary: string;
  nextStep: string;
  promptSafePublicSummary: string | null;
  signals: V130SocialPressureSignal[];
  moduleCounts: {
    factionPressure: number;
    npcMemory: number;
    publicEvent: number;
    socialFollowup: number;
  };
  boundaryLines: string[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  projectionAudit: V130SocialProjectionAudit;
  modules: {
    factionStance: QingmaoFactionStanceProjectionResult;
    npcMemory: QingmaoNpcMemoryProjectionResult;
    publicChronicle: QingmaoPublicEventChronicleResult;
    socialFollowups: QingmaoSocialFollowupResult;
  };
  saveFormatImpact: 'none_v24_projection_only';
  statePatchApplied: false;
  canWriteSave: false;
  canOpenFormalRelation: false;
  canCreateWarrant: false;
  canRecruitOrTransferFaction: false;
  canSetNpcFate: false;
  deepSeekAuthority: 'no_new_authority';
  legacyFieldsIgnored: true;
}

export interface V130SocialProjectionAudit {
  phase: 'v1.3.0-b2-projection-hardening';
  saveFormatPolicy: 'stay_v24_no_bump';
  persistentWritePolicy: 'none_projection_only';
  legacyFieldPolicy: 'ignored_as_authority';
  runtimeSourcePolicy: 'living_world_public_evidence_only';
  miroFishPolicy: 'reviewed_rule_source_only_no_raw_runtime_read';
  deepSeekPolicy: 'no_new_authority';
  canPromoteToLedgerWithoutUserDecision: false;
  requiredUserDecisionForLedger: string[];
  pass: boolean;
  notes: string[];
}

export interface V130SocialPressureProjectionInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  localActionLedger?: LocalActionLedgerEntry[] | null;
  maxSignals?: number;
}

const BASE_FORBIDDEN_WRITES = [
  'SAVE_FORMAT_VERSION_25',
  'socialRelationState',
  'formal_social_relation_ledger',
  'named_npc_allowlist',
  'standing_delta',
  'standing_score',
  'relationship_score',
  'reputation_score',
  'warrant_active',
  'formal_warrant',
  'recruitment_success',
  'faction_transfer',
  'faction_identity_change',
  'formal_blockade',
  'task_created',
  'task_reward',
  'reward',
  'currency_delta',
  'material_reward',
  'gu_reward',
  'recipe_unlock',
  'location_unlock',
  'npc_death',
  'npc_capture_result',
  'npc_fate_result',
  'hidden_fact_reveal',
  'canon_anchor_change',
  'deepseek_authority_expansion',
];

const SOURCE_REFS = [
  'v1.3.0-a1:D-131-001',
  'v1.3.0-a1:D-131-002',
  'v1.3.0-a1:D-131-003',
  'v1.3.0-a1:D-131-004',
  'v1.3.0-a2:D-131-005',
  'v1.3.0-a2:D-131-006',
  'v1.3.0-a2:D-131-007',
  'v0.13:qingmao_npc_memory_motive_pack:intake-reviewed-rule-draft',
  'v0.13:qingmao_faction_reputation_pressure_pack:intake-reviewed-rule-draft',
  'v0.13:qingmao_public_event_chronicle_pack:intake-reviewed-rule-draft',
];

const LEDGER_DECISION_REQUIREMENTS = [
  'approve_SAVE_FORMAT_VERSION_25',
  'approve_socialRelationState_or_equivalent_single_aggregate',
  'approve_migration_defaults_tests',
  'approve_formal_social_ledger_scope',
  'approve_Player_Advocate_upgrade',
];

const HIDDEN_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/春秋蝉/g, '受保护隐秘'],
  [/回溯/g, '受保护因果'],
  [/重生/g, '受保护经历'],
  [/fang_yuan_private_causality_hidden_anchor/g, '受保护私密引用'],
  [/私密轨迹/g, '受保护轨迹'],
  [/隐藏因果/g, '受保护因果'],
];

const FORMAL_CONCLUSION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/投靠成功/g, '正式阵营结论已阻断'],
  [/招揽成功/g, '正式招揽结论已阻断'],
  [/正式通缉已生效/g, '正式通缉结论已阻断'],
  [/奖励已发放/g, '奖励结算已阻断'],
  [/NPC已死亡/g, 'NPC 生死结论已阻断'],
  [/地点已解锁/g, '地点解锁结论已阻断'],
];

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function sanitizeVisibleText(value: string, fallback: string): string {
  let text = String(value || '').trim();
  for (const [pattern, replacement] of HIDDEN_TEXT_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of FORMAL_CONCLUSION_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text || fallback;
}

function severityScore(severity: V130SocialSignalSeverity): number {
  return {
    blocked: 4,
    high: 3,
    medium: 2,
    low: 1,
  }[severity];
}

function normalizeSeverity(value: QingmaoFactionStanceSeverity | QingmaoNpcMemoryRisk | QingmaoSocialFollowupRisk | string): V130SocialSignalSeverity {
  if (value === 'blocked' || value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

function signalSortScore(signal: V130SocialPressureSignal): number {
  const kindScore: Record<V130SocialSignalKind, number> = {
    faction_pressure: 4,
    social_followup: 3,
    npc_memory: 2,
    public_event: 1,
  };
  return severityScore(signal.severity) * 20 + kindScore[signal.kind] * 4 + signal.visibleSourceRefs.length;
}

function selectSignals(allSignals: V130SocialPressureSignal[], maxSignals: number): V130SocialPressureSignal[] {
  const sorted = [...allSignals].sort((a, b) => signalSortScore(b) - signalSortScore(a));
  const selected: V130SocialPressureSignal[] = [];
  const requiredKinds: V130SocialSignalKind[] = ['faction_pressure', 'npc_memory', 'public_event', 'social_followup'];
  for (const kind of requiredKinds) {
    const signal = sorted.find(item => item.kind === kind);
    if (signal && !selected.some(item => item.id === signal.id)) selected.push(signal);
  }
  for (const signal of sorted) {
    if (selected.length >= maxSignals) break;
    if (!selected.some(item => item.id === signal.id)) selected.push(signal);
  }
  return selected.sort((a, b) => signalSortScore(b) - signalSortScore(a));
}

function toFactionSignals(result: QingmaoFactionStanceProjectionResult): V130SocialPressureSignal[] {
  return result.projections.map(projection => ({
    id: `v130_${projection.id}`,
    kind: 'faction_pressure',
    title: '势力压力',
    subjectLabel: sanitizeVisibleText(projection.factionLabel, '未知势力'),
    statusLabel: projection.stanceAxis,
    summary: sanitizeVisibleText(projection.publicReason, '公开势力压力需要更多证据。'),
    nextStep: projection.escalationBlocked
      ? '只显示前置压力；正式通缉、招揽、封锁、阵营变化和奖励结算都必须留给后续门禁。'
      : '只保留公开解释和风险候选，不写声望、阵营或任务。',
    severity: normalizeSeverity(projection.severity),
    visibleSourceRefs: [...projection.visibleSourceRefs],
    blockedUpgrades: [...projection.blockedUpgrades],
    forbiddenWrites: [...result.forbiddenWrites],
    canPatch: false,
    statePatchApplied: false,
    hiddenBoundaryProtected: projection.blockedUpgrades.includes('hidden_fact_reveal'),
  }));
}

function toNpcSignals(result: QingmaoNpcMemoryProjectionResult): V130SocialPressureSignal[] {
  return result.projections.map(projection => ({
    id: `v130_${projection.id}`,
    kind: 'npc_memory',
    title: '记忆痕迹',
    subjectLabel: sanitizeVisibleText(projection.subjectLabel, '未知视线'),
    statusLabel: projection.memoryAxis,
    summary: sanitizeVisibleText(projection.publicReason, '公开记忆痕迹需要更多证据。'),
    nextStep: projection.hiddenBoundaryProtected
      ? '只沿公开旁证解释，不触碰隐藏事实、私密因果、NPC 生死或正式关系分数。'
      : '只显示谁可能记住公开痕迹，不写关系分数、NPC 状态或奖励。',
    severity: normalizeSeverity(projection.riskLevel),
    visibleSourceRefs: [...projection.visibleSourceRefs],
    blockedUpgrades: [...projection.blockedUpgrades],
    forbiddenWrites: [...result.forbiddenWrites],
    canPatch: false,
    statePatchApplied: false,
    hiddenBoundaryProtected: projection.hiddenBoundaryProtected,
  }));
}

function toPublicEventSignals(result: QingmaoPublicEventChronicleResult): V130SocialPressureSignal[] {
  return result.events.map(event => ({
    id: `v130_${event.id}`,
    kind: 'public_event',
    title: '公开事件',
    subjectLabel: event.eventScope,
    statusLabel: event.promptSafe ? 'prompt_safe' : 'player_only',
    summary: sanitizeVisibleText(event.publicSummary, '公开事件摘要需要更多证据。'),
    nextStep: '只作为公开编年和叙事摘要候选，不写公开事件存档、不揭露隐藏事实、不产生正式结果。',
    severity: event.eventScope === 'region_public' || event.eventScope === 'faction_visible' ? 'medium' : 'low',
    visibleSourceRefs: [...event.visibleSourceRefs],
    blockedUpgrades: [...event.blockedUpgrades],
    forbiddenWrites: [...result.forbiddenWrites],
    canPatch: false,
    statePatchApplied: false,
    hiddenBoundaryProtected: event.hiddenRefsRedacted,
  }));
}

function toFollowupSignals(result: QingmaoSocialFollowupResult): V130SocialPressureSignal[] {
  return result.candidates.map(candidate => ({
    id: `v130_${candidate.id}`,
    kind: 'social_followup',
    title: sanitizeVisibleText(candidate.title, '社会后续候选'),
    subjectLabel: candidate.kind,
    statusLabel: 'candidate_only',
    summary: sanitizeVisibleText(candidate.publicReason, '社会后续需要更多公开证据。'),
    nextStep: '只给下一步候选；不创建正式任务、不发奖励、不改变阵营、不写追捕或封锁结果。',
    severity: normalizeSeverity(candidate.riskLevel),
    visibleSourceRefs: [...candidate.visibleSourceRefs],
    blockedUpgrades: [...candidate.blockedUpgrades],
    forbiddenWrites: [...result.forbiddenWrites],
    canPatch: false,
    statePatchApplied: false,
    hiddenBoundaryProtected: candidate.blockedUpgrades.includes('hidden_fact_reveal'),
  }));
}

export function buildV130SocialPressureProjection(
  input: V130SocialPressureProjectionInput = {},
): V130SocialPressureProjection {
  const npcMemory = buildQingmaoNpcMemoryProjection({
    livingWorldState: input.livingWorldState,
    localActionLedger: input.localActionLedger,
    maxProjections: 5,
  });
  const factionStance = buildQingmaoFactionStanceProjection({
    livingWorldState: input.livingWorldState,
    localActionLedger: input.localActionLedger,
    maxProjections: 5,
  });
  const publicChronicle = buildQingmaoPublicEventChronicle({
    livingWorldState: input.livingWorldState,
    localActionLedger: input.localActionLedger,
    maxEvents: 5,
  });
  const socialFollowups = buildQingmaoSocialFollowups({
    npcMemory,
    factionStance,
    publicChronicle,
    maxFollowups: 5,
  });
  const maxSignals = Math.max(1, Math.floor(Number(input.maxSignals ?? 10)));
  const allSignals = [
    ...toFactionSignals(factionStance),
    ...toNpcSignals(npcMemory),
    ...toPublicEventSignals(publicChronicle),
    ...toFollowupSignals(socialFollowups),
  ];
  const signals = selectSignals(allSignals, maxSignals);

  const moduleCounts = {
    factionPressure: factionStance.projections.length,
    npcMemory: npcMemory.projections.length,
    publicEvent: publicChronicle.events.length,
    socialFollowup: socialFollowups.candidates.length,
  };
  const signalCount = moduleCounts.factionPressure
    + moduleCounts.npcMemory
    + moduleCounts.publicEvent
    + moduleCounts.socialFollowup;
  const status: V130SocialProjectionStatus = signalCount > 0 ? 'pressure_visible' : 'needs_public_evidence';
  const forbiddenWrites = unique([
    ...BASE_FORBIDDEN_WRITES,
    ...npcMemory.forbiddenWrites,
    ...factionStance.forbiddenWrites,
    ...publicChronicle.forbiddenWrites,
    ...socialFollowups.forbiddenWrites,
    ...signals.flatMap(signal => signal.forbiddenWrites),
    ...signals.flatMap(signal => signal.blockedUpgrades),
  ]);
  const visibleSourceRefs = unique([
    ...SOURCE_REFS,
    ...npcMemory.visibleSourceRefs,
    ...factionStance.visibleSourceRefs,
    ...publicChronicle.visibleSourceRefs,
    ...socialFollowups.visibleSourceRefs,
    ...signals.flatMap(signal => signal.visibleSourceRefs),
  ]);

  return {
    status,
    statusLabel: status === 'pressure_visible' ? '社会压力可读' : '等待公开证据',
    publicSummary: status === 'pressure_visible'
      ? `已从现有活世界证据投影 ${signalCount} 条社会信号：势力压力 ${moduleCounts.factionPressure}、记忆痕迹 ${moduleCounts.npcMemory}、公开事件 ${moduleCounts.publicEvent}、后续候选 ${moduleCounts.socialFollowup}。`
      : '当前缺少可公开归因的社会证据；v1.3 b1 不凭旧声望字段或隐藏事实推演关系。',
    nextStep: status === 'pressure_visible'
      ? '优先处理高风险公开痕迹和解释/遮掩候选；仍不写正式通缉、招揽、封锁、阵营、奖励或 NPC 生死。'
      : '先通过本地行动产生公开事实、势力压力、NPC 记忆或公开事件，再读取社会压力投影。',
    promptSafePublicSummary: publicChronicle.promptSafePublicSummary
      ? sanitizeVisibleText(publicChronicle.promptSafePublicSummary, '公开事件摘要需要更多证据。')
      : null,
    signals,
    moduleCounts,
    boundaryLines: [
      'v1.3 b1 是 projection-only：不 bump SAVE_FORMAT_VERSION，不新增 socialRelationState，不写持久社会关系字段。',
      'v1.3 b2 继续 projection-only 硬化：当前 helper 只返回 audit，不返回可写 ledger patch。',
      '输入只读取 livingWorldState.npcMemories、factionPressure、actionConsequences、knownFacts 与本地行动账本；旧 npcRelations、standings、faction standing 字段一律不是权威。',
      'MiroFish v0.13 包与全书基础包只作为已审查的候选/规则/测试来源，不是运行时 canon、DeepSeek 权限或隐藏事实可见上下文。',
      '正式地点、阵营、通缉、招揽、封锁、奖励、NPC 生死和隐藏事实揭露仍需单独门禁与用户决策。',
      'DeepSeek 只能写叙事、线索、传闻、请求和压力表达；本地 engine/store 才能拥有事实结算。',
    ],
    visibleSourceRefs,
    forbiddenWrites,
    projectionAudit: {
      phase: 'v1.3.0-b2-projection-hardening',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      legacyFieldPolicy: 'ignored_as_authority',
      runtimeSourcePolicy: 'living_world_public_evidence_only',
      miroFishPolicy: 'reviewed_rule_source_only_no_raw_runtime_read',
      deepSeekPolicy: 'no_new_authority',
      canPromoteToLedgerWithoutUserDecision: false,
      requiredUserDecisionForLedger: [...LEDGER_DECISION_REQUIREMENTS],
      pass: true,
      notes: [
        'b2 did not create a minimum social ledger because v25/socialRelationState are not approved.',
        'projection output is recomputable from current public living-world evidence.',
        'formal relation, warrant, recruitment, blockade, faction, reward, NPC fate, and hidden-fact writes remain forbidden.',
      ],
    },
    modules: {
      factionStance,
      npcMemory,
      publicChronicle,
      socialFollowups,
    },
    saveFormatImpact: 'none_v24_projection_only',
    statePatchApplied: false,
    canWriteSave: false,
    canOpenFormalRelation: false,
    canCreateWarrant: false,
    canRecruitOrTransferFaction: false,
    canSetNpcFate: false,
    deepSeekAuthority: 'no_new_authority',
    legacyFieldsIgnored: true,
  };
}
