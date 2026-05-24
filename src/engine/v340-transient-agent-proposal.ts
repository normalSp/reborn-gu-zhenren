export const V340_AGENT_PROPOSAL_SCHEMA_VERSION = 'v340_a1_transient_agentproposal_contract_v1';
export const V340_RUNTIME_FIRST_CUT_VERSION = 'v340_b1_transient_proposal_runtime_first_cut_v1';
export const V340_ALLOWED_AREA_KEY = 'southern_border_outer_edge_low_rank';

export type V340AgentLayer = 'L2' | 'L3';
export type V340PostCheckDecision = 'approved_expression_candidate' | 'rejected_violation' | 'needs_user_decision';
export type V340FindingSeverity = 'P0' | 'P1' | 'P2';

export interface V340PostCheckFinding {
  severity: V340FindingSeverity;
  family: string;
  code: string;
  message: string;
}

export interface V340AgentProposalCandidate {
  id: string;
  layer: string;
  agentRole: string;
  areaKey: string;
  persistenceMode: string;
  intent: string;
  publicExpression: string;
  safeNextStep: string;
  candidateEffects?: string[];
  evidenceRefs?: string[];
  sourceRefs?: string[];
  requestedScope?: string[];
  audit?: Record<string, unknown>;
}

export interface V340PostCheckResult {
  decision: V340PostCheckDecision;
  allowedForDisplay: boolean;
  worldCoreFinalAuthority: true;
  findings: V340PostCheckFinding[];
  blockedFamilies: string[];
}

export interface V340AgentProposal extends V340AgentProposalCandidate {
  schemaVersion: typeof V340_AGENT_PROPOSAL_SCHEMA_VERSION;
  layer: V340AgentLayer;
  persistenceMode: 'transient_proposal_only';
  postCheck: V340PostCheckResult;
  sourceRefs: string[];
  evidenceRefs: string[];
}

export interface V340RejectedProbe {
  id: string;
  label: string;
  decision: 'rejected_violation';
  family: string;
  reason: string;
}

export interface V340BuildInput {
  turn?: number;
  previewLane?: number;
  regionalEventLedger?: unknown;
  routeLocationState?: unknown;
  livingWorldState?: unknown;
  localActionLedger?: unknown[];
}

export interface V340RuntimeAgentProposalReport {
  schemaVersion: typeof V340_AGENT_PROPOSAL_SCHEMA_VERSION;
  runtimeFirstCutVersion: typeof V340_RUNTIME_FIRST_CUT_VERSION;
  areaKey: typeof V340_ALLOWED_AREA_KEY;
  status: 'active_transient_runtime_path' | 'evidence_light_transient_path';
  statusLabel: string;
  publicSummary: string;
  proposals: V340AgentProposal[];
  rejectedProbes: V340RejectedProbe[];
  audit: {
    persistenceMode: 'transient_proposal_only';
    worldCoreAuthority: 'local_worldcore_postcheck_final';
    saveWritePolicy: 'no_save_field_no_migration_no_runFingerprint';
    liveDeepSeekCalled: false;
    mirofishUsed: false;
    backendUsed: false;
    externalFrameworkUsed: false;
  };
  deterministicProbe: {
    recommendedRoundCount: 30;
    rescoreStable: true;
    driftFamilies: string[];
  };
  boundaryLines: string[];
  sourceRefs: string[];
}

const FORBIDDEN_EFFECT_FAMILIES: Record<string, { family: string; severity: V340FindingSeverity; message: string }> = {
  save_write: { family: 'save_boundary', severity: 'P0', message: 'AgentProposal cannot write save state.' },
  save_field_add: { family: 'save_boundary', severity: 'P0', message: 'AgentProposal cannot add a save field.' },
  save_format_bump: { family: 'save_boundary', severity: 'P0', message: 'AgentProposal cannot bump SAVE_FORMAT_VERSION.' },
  migration: { family: 'save_boundary', severity: 'P0', message: 'AgentProposal cannot require migration.' },
  run_fingerprint: { family: 'save_boundary', severity: 'P0', message: 'AgentProposal cannot add runFingerprint.' },
  live_deepseek_call: { family: 'deepseek_authority_boundary', severity: 'P0', message: 'AgentProposal cannot call live DeepSeek in v3.4.' },
  prompt_change: { family: 'deepseek_authority_boundary', severity: 'P0', message: 'AgentProposal cannot change DeepSeek prompt.' },
  context_expansion: { family: 'deepseek_authority_boundary', severity: 'P0', message: 'AgentProposal cannot expand visible context.' },
  mirofish_export: { family: 'mirofish_boundary', severity: 'P0', message: 'AgentProposal cannot trigger MiroFish export.' },
  named_npc: { family: 'mirofish_boundary', severity: 'P0', message: 'AgentProposal cannot open named NPC material.' },
  hidden_adjacent: { family: 'hidden_boundary', severity: 'P0', message: 'AgentProposal cannot use hidden-adjacent material.' },
  backend_service: { family: 'backend_boundary', severity: 'P0', message: 'AgentProposal cannot require a backend service.' },
  external_framework_poc: { family: 'external_framework_boundary', severity: 'P0', message: 'AgentProposal cannot open an external framework PoC.' },
  dependency_install: { family: 'external_framework_boundary', severity: 'P0', message: 'AgentProposal cannot add dependencies.' },
  subagent_use: { family: 'external_framework_boundary', severity: 'P0', message: 'AgentProposal cannot use subagents.' },
  l4_runtime: { family: 'l4_l5_boundary', severity: 'P0', message: 'L4 runtime is not open.' },
  l5_runtime: { family: 'l4_l5_boundary', severity: 'P0', message: 'L5 runtime is not open.' },
  heaven_will_verdict: { family: 'l4_l5_boundary', severity: 'P0', message: 'Heaven/Fate verdicts are not open.' },
  formal_location: { family: 'formal_authority_boundary', severity: 'P0', message: 'Formal location writes are not open.' },
  formal_faction: { family: 'formal_authority_boundary', severity: 'P0', message: 'Formal faction writes are not open.' },
  formal_identity: { family: 'formal_authority_boundary', severity: 'P0', message: 'Formal identity writes are not open.' },
  formal_reward: { family: 'formal_authority_boundary', severity: 'P0', message: 'Formal rewards are not open.' },
  npc_life_death: { family: 'formal_authority_boundary', severity: 'P0', message: 'NPC life/death settlement is not open.' },
  formal_warrant: { family: 'formal_authority_boundary', severity: 'P0', message: 'Formal warrant/recruitment/blockade is not open.' },
  self_learning_direct_write: { family: 'self_learning_boundary', severity: 'P0', message: 'Self-learning cannot directly write canon/runtime/save.' },
  future_gate: { family: 'future_gate', severity: 'P2', message: 'This capability needs a future user decision.' },
};

const HARD_TEXT_PATTERNS: Array<{ pattern: RegExp; family: string; severity: V340FindingSeverity; code: string }> = [
  { pattern: /SAVE_FORMAT_VERSION\s*=\s*26/i, family: 'save_boundary', severity: 'P0', code: 'save_format_bump_text' },
  { pattern: /runFingerprint/i, family: 'save_boundary', severity: 'P0', code: 'run_fingerprint_text' },
  { pattern: /正式加入|正式地点|正式身份|奖励已发放|NPC已死亡|通缉成立|招揽成功|封锁生效/i, family: 'formal_authority_boundary', severity: 'P0', code: 'formal_authority_text' },
  { pattern: /方源|春秋蝉|重生|回溯|天道裁决|宿命裁决/i, family: 'l4_l5_boundary', severity: 'P0', code: 'l4_l5_or_hidden_text' },
  { pattern: /DeepSeek visible|visible RAG|MiroFish export|backend service|external framework|subagent/i, family: 'future_gate', severity: 'P2', code: 'future_gate_text' },
  { pattern: /SYNTHETIC_HIDDEN_PRIVATE_BODY|SYNTHETIC_PROMPT_BODY|hidden private body/i, family: 'hidden_boundary', severity: 'P0', code: 'hidden_private_body_text' },
];

const BASE_SOURCE_REFS = [
  'v3.4.0:D-340-001',
  'v3.4.0:D-340-002',
  'v3.4.0:D-340-003',
  'v3.4.0-b1:transient-proposal-runtime-first-cut',
];

function textOf(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(' ');
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(textOf).join(' ');
  return '';
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function finding(family: string, code: string, severity: V340FindingSeverity, message: string): V340PostCheckFinding {
  return { family, code, severity, message };
}

function getRegionalSignalRefs(input: V340BuildInput): string[] {
  const ledger = objectValue(input.regionalEventLedger);
  const events = Array.isArray(ledger.publicEvents) ? ledger.publicEvents : [];
  const eventRefs = events
    .map((event, index) => objectValue(event).id || objectValue(event).eventKind || `regional_event_${index + 1}`)
    .map(String)
    .slice(0, 6);
  const sourceRefs = stringArray(ledger.sourceRefs).slice(0, 6);
  const localRefs = Array.isArray(input.localActionLedger)
    ? input.localActionLedger.map((entry, index) => String(objectValue(entry).id || objectValue(entry).actionType || `local_action_${index + 1}`)).slice(-4)
    : [];
  return unique([...eventRefs, ...sourceRefs, ...localRefs, ...BASE_SOURCE_REFS]);
}

function normalizeLane(value: unknown): number {
  const lane = Number(value ?? 0);
  if (!Number.isFinite(lane)) return 0;
  return Math.abs(Math.floor(lane)) % 3;
}

function makeProposal(candidate: V340AgentProposalCandidate): V340AgentProposal | null {
  const postCheck = postCheckV340AgentProposal(candidate);
  if (postCheck.decision !== 'approved_expression_candidate') return null;
  return {
    ...candidate,
    schemaVersion: V340_AGENT_PROPOSAL_SCHEMA_VERSION,
    layer: candidate.layer as V340AgentLayer,
    persistenceMode: 'transient_proposal_only',
    postCheck,
    sourceRefs: unique([...(candidate.sourceRefs || []), ...BASE_SOURCE_REFS]).slice(0, 10),
    evidenceRefs: unique(candidate.evidenceRefs || []).slice(0, 8),
  };
}

function buildDeck(input: V340BuildInput): V340AgentProposalCandidate[] {
  const lane = normalizeLane(input.previewLane);
  const turn = Math.max(1, Math.floor(Number(input.turn || 1)));
  const refs = getRegionalSignalRefs(input);
  const laneTag = ['watch', 'labor', 'market'][lane];
  const commonAudit = {
    proposalOnly: true,
    expressionOnly: true,
    worldCorePostCheck: true,
    noSaveWrite: true,
    liveDeepSeekCalled: false,
    noFormalAuthority: true,
  };

  const deck: V340AgentProposalCandidate[] = [
    {
      id: `v340_l2_outer_edge_labor_${laneTag}_${turn % 7}`,
      layer: 'L2',
      agentRole: '外缘短工联络人',
      areaKey: V340_ALLOWED_AREA_KEY,
      persistenceMode: 'transient_proposal_only',
      intent: '判断玩家是否愿意用半日粗活换取下一段公开问路窗口。',
      publicExpression: lane === 1
        ? '有人把视线落在你的包袱和手掌上，话头先绕到搬运、守口和夜里轮值。'
        : '短工窗口还没有变成承诺，对方只在观察你是否能先交出可信的行动。',
      safeNextStep: '玩家可以展示低阶劳力、守口或绕开接触；WorldCore 不写身份、报酬或势力结果。',
      candidateEffects: [],
      evidenceRefs: refs.slice(0, 4),
      sourceRefs: refs,
      audit: commonAudit,
    },
    {
      id: `v340_l3_route_sentry_${laneTag}_${turn % 5}`,
      layer: 'L3',
      agentRole: '山路巡看者',
      areaKey: V340_ALLOWED_AREA_KEY,
      persistenceMode: 'transient_proposal_only',
      intent: '把当前外缘盘问压力转成一句可见的场景反应候选。',
      publicExpression: lane === 0
        ? '山口的目光先扫过鞋底泥痕，再看你是否把来路说得太满。'
        : '巡看者没有给出结论，只把问题压回脚印、包袱和同行痕迹。',
      safeNextStep: '玩家可以降调回答、转为杂务请求或暂退；WorldCore 只批准表达候选。',
      candidateEffects: [],
      evidenceRefs: refs.slice(1, 5),
      sourceRefs: refs,
      audit: commonAudit,
    },
    {
      id: `v340_l2_market_errand_${laneTag}_${turn % 11}`,
      layer: 'L2',
      agentRole: '临时市场跑腿接触',
      areaKey: V340_ALLOWED_AREA_KEY,
      persistenceMode: 'transient_proposal_only',
      intent: '给临时市场窗口生成一个不结算交易、不发放物品的接触候选。',
      publicExpression: lane === 2
        ? '市口的零散声音把你推向跑腿、看货和避开正面询问的缝隙。'
        : '市场窗口只是短暂松动，周围人更在意你是否懂得不追问来源。',
      safeNextStep: '玩家可以接一个不结算的跑腿候选或继续观察；正式价格、库存和收益仍未开放。',
      candidateEffects: [],
      evidenceRefs: refs.slice(2, 6),
      sourceRefs: refs,
      audit: commonAudit,
    },
  ];

  return deck;
}

export function postCheckV340AgentProposal(candidate: V340AgentProposalCandidate): V340PostCheckResult {
  const findings: V340PostCheckFinding[] = [];
  const requestedScope = new Set(candidate.requestedScope || []);
  const effects = new Set(candidate.candidateEffects || []);

  if (!candidate.id) findings.push(finding('schema', 'missing_id', 'P0', 'AgentProposal id is required.'));
  if (candidate.layer !== 'L2' && candidate.layer !== 'L3') {
    findings.push(finding('l4_l5_boundary', 'non_l2_l3_layer', 'P0', 'v3.4 only allows L2/L3 proposals.'));
  }
  if (candidate.areaKey !== V340_ALLOWED_AREA_KEY) {
    findings.push(finding('area_boundary', 'bad_area_key', 'P0', 'v3.4 first cut is limited to one small outer-edge area.'));
  }
  if (candidate.persistenceMode !== 'transient_proposal_only') {
    findings.push(finding('transient_persistence', 'bad_persistence_mode', 'P0', 'v3.4 requires transient proposal-only persistence.'));
  }

  for (const effect of effects) {
    const rule = FORBIDDEN_EFFECT_FAMILIES[effect];
    if (rule) findings.push(finding(rule.family, `effect_${effect}`, rule.severity, rule.message));
  }

  for (const scope of requestedScope) {
    const rule = FORBIDDEN_EFFECT_FAMILIES[scope];
    if (rule) findings.push(finding(rule.family, `scope_${scope}`, rule.severity, rule.message));
  }

  const text = textOf(candidate);
  for (const item of HARD_TEXT_PATTERNS) {
    if (item.pattern.test(text)) {
      findings.push(finding(item.family, item.code, item.severity, `AgentProposal text matched forbidden pattern ${item.pattern}.`));
    }
  }

  if (candidate.audit?.liveDeepSeekCalled === true) {
    findings.push(finding('deepseek_authority_boundary', 'audit_live_deepseek_called', 'P0', 'v3.4 first cut cannot call live DeepSeek.'));
  }
  if (candidate.audit?.noSaveWrite === false) {
    findings.push(finding('save_boundary', 'audit_save_write_enabled', 'P0', 'v3.4 first cut cannot write save state.'));
  }
  if (candidate.audit?.worldCorePostCheck === false) {
    findings.push(finding('worldcore_postcheck', 'audit_postcheck_disabled', 'P0', 'WorldCore post-check cannot be disabled.'));
  }

  const hasP0OrP1 = findings.some(item => item.severity === 'P0' || item.severity === 'P1');
  const hasFutureGate = findings.some(item => item.family === 'future_gate' || item.severity === 'P2');
  const decision: V340PostCheckDecision = hasP0OrP1
    ? 'rejected_violation'
    : hasFutureGate
      ? 'needs_user_decision'
      : 'approved_expression_candidate';

  return {
    decision,
    allowedForDisplay: decision === 'approved_expression_candidate',
    worldCoreFinalAuthority: true,
    findings,
    blockedFamilies: unique(findings.map(item => item.family)),
  };
}

export function buildV340TransientAgentProposal(input: V340BuildInput = {}): V340RuntimeAgentProposalReport {
  const ledger = objectValue(input.regionalEventLedger);
  const eventCount = Array.isArray(ledger.publicEvents) ? ledger.publicEvents.length : 0;
  const proposals = buildDeck(input).map(makeProposal).filter((item): item is V340AgentProposal => !!item);
  const refs = getRegionalSignalRefs(input);

  return {
    schemaVersion: V340_AGENT_PROPOSAL_SCHEMA_VERSION,
    runtimeFirstCutVersion: V340_RUNTIME_FIRST_CUT_VERSION,
    areaKey: V340_ALLOWED_AREA_KEY,
    status: eventCount > 0 ? 'active_transient_runtime_path' : 'evidence_light_transient_path',
    statusLabel: eventCount > 0 ? '临时意图候选可读' : '证据较轻，仍仅显示安全候选',
    publicSummary: '本面板只把 L2/L3 小区域 agent 意图转成可见候选表达。WorldCore post-check 拥有最终裁决权，候选不会写入存档或变成事实。',
    proposals,
    rejectedProbes: [
      {
        id: 'v340_reject_save_write',
        label: '持久化写入候选',
        decision: 'rejected_violation',
        family: 'save_boundary',
        reason: 'F-340-002 未开放；候选不能新增字段、迁移或 runFingerprint。',
      },
      {
        id: 'v340_reject_formal_authority',
        label: '正式结果候选',
        decision: 'rejected_violation',
        family: 'formal_authority_boundary',
        reason: 'F-340-008 未开放；候选不能决定地点、阵营、身份、奖励或 NPC 生死。',
      },
      {
        id: 'v340_reject_live_deepseek',
        label: 'live DeepSeek 候选',
        decision: 'rejected_violation',
        family: 'deepseek_authority_boundary',
        reason: 'F-340-003 未开放；本刀不调用 live DeepSeek，也不改 prompt/context/model/authority。',
      },
    ],
    audit: {
      persistenceMode: 'transient_proposal_only',
      worldCoreAuthority: 'local_worldcore_postcheck_final',
      saveWritePolicy: 'no_save_field_no_migration_no_runFingerprint',
      liveDeepSeekCalled: false,
      mirofishUsed: false,
      backendUsed: false,
      externalFrameworkUsed: false,
    },
    deterministicProbe: {
      recommendedRoundCount: 30,
      rescoreStable: true,
      driftFamilies: [
        'candidate_not_fact',
        'no_save_write',
        'no_formal_authority',
        'no_hidden_or_l4_l5',
      ],
    },
    boundaryLines: [
      'AgentProposal 是候选表达，不是事实、承诺、奖励、地点、身份或 NPC 命运。',
      'WorldCore post-check 保持最终裁决权；被拒候选不会进入 store、save、prompt 或 canon。',
      'v3.4 不新增 save field，不 bump SAVE_FORMAT_VERSION，不新增 runFingerprint。',
      'v3.4 不调用 live DeepSeek，不做 MiroFish export/intake，不使用 backend/BFF/external framework/subagent。',
      'v3.4 只开放 L2/L3 小区域 transient proposal-only 窄口；L4/L5、天道/宿命和原著关键人物继续 future gate。',
    ],
    sourceRefs: unique(refs).slice(0, 12),
  };
}
