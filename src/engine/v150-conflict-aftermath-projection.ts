import { buildV017OutcomeBackflowView, listV017CombatPreparationViews, listV017CounterBoundaryViews, listV017SquadTacticViews } from './v017-combat-deepening';
import { buildV110RouteLocationOverview } from './v110-route-location-state';
import { buildV120LowRankSurvivalEconomyProjection } from './v120-low-rank-survival-economy-projection';
import { buildV130SocialPressureProjection } from './v130-social-pressure-projection';
import { buildV140RegionSampleProjection } from './v140-region-sample-projection';
import type {
  BattleOutcomeSummary,
  BattleResolutionStep,
  CombatEventCandidate,
  LivingWorldState,
  LocalActionLedgerEntry,
  RouteLocationState,
  SurvivalEconomyState,
} from '../types';

export type V150ConflictAftermathStatus = 'needs_conflict_context' | 'conflict_projection_visible';

export type V150ConflictPostureId =
  | 'route_ambush_risk'
  | 'pursuit_attention_window'
  | 'countermeasure_gap'
  | 'squad_formation_readiness';

export type V150ConflictPostureStatus = 'visible' | 'needs_context';

export interface V150ConflictPostureCard {
  id: V150ConflictPostureId;
  title: string;
  status: V150ConflictPostureStatus;
  summary: string;
  nextStep: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
  canWriteSave: false;
  canGrantReward: false;
  canSetNpcFate: false;
  canSetFormalPursuit: false;
  canPatch: false;
  statePatchApplied: false;
}

export interface V150ConflictSignalGroup {
  id: 'route' | 'survival' | 'social' | 'region' | 'combat';
  title: string;
  statusLabel: string;
  summary: string;
  evidenceRefs: string[];
}

export interface V150ConflictAftermathProjectionAudit {
  phase: 'v1.5.0-b1-conflict-aftermath-projection';
  saveFormatPolicy: 'stay_v24_no_bump';
  persistentWritePolicy: 'none_projection_only';
  runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v017_public_evidence';
  miroFishPolicy: 'v017_reviewed_source_pointer_only_no_new_package';
  deepSeekPolicy: 'no_new_authority';
  legacyFieldPolicy: 'ignored_as_authority';
  canPromoteToStateWithoutUserDecision: false;
  requiredUserDecisionForState: string[];
  pass: boolean;
  notes: string[];
}

export interface V150ConflictAftermathProjection {
  status: V150ConflictAftermathStatus;
  statusLabel: string;
  scopeId: 'low_rank_conflict_outer_sample';
  savePolicy: 'no_new_persistence_v24';
  authority: 'local_projection_only';
  activePostureId: V150ConflictPostureId | null;
  publicSummary: string;
  nextStep: string;
  postureCards: V150ConflictPostureCard[];
  signalGroups: V150ConflictSignalGroup[];
  counterHints: string[];
  squadHints: string[];
  nextStepCandidates: string[];
  boundaryLines: string[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  projectionAudit: V150ConflictAftermathProjectionAudit;
  modules: {
    routeStatus: string;
    survivalStatus: string;
    socialStatus: string;
    regionStatus: string;
    combatCandidateCount: number;
    traceStepCount: number;
  };
  saveFormatImpact: 'none_v24_projection_only';
  statePatchApplied: false;
  canWriteSave: false;
  canGrantReward: false;
  canSetNpcFate: false;
  canSetFormalPursuit: false;
  canExpandDeepSeekAuthority: false;
  deepSeekAuthority: 'no_new_authority';
  legacyFieldsIgnored: true;
}

export interface V150ConflictAftermathProjectionInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  routeLocationState?: Partial<RouteLocationState> | null;
  survivalEconomyState?: Partial<SurvivalEconomyState> | null;
  localActionLedger?: LocalActionLedgerEntry[] | null;
  materialBag?: Record<string, number> | null;
  combatEventCandidates?: CombatEventCandidate[] | null;
  battleResolutionSteps?: BattleResolutionStep[] | null;
  battleOutcomeSummary?: BattleOutcomeSummary | null;
  profile?: Record<string, unknown> | null;
  inventory?: unknown[] | null;
  currentChapterId?: string | null;
  turn?: number;
}

const SCOPE_ID = 'low_rank_conflict_outer_sample';

const BASE_FORBIDDEN_WRITES = [
  'SAVE_FORMAT_VERSION_25',
  'conflictConsequenceState',
  'pursuitState',
  'combatAftermathState',
  'formal_pursuit',
  'formal_warrant',
  'formal_blockade',
  'formal_hostility',
  'formal_drop_pool',
  'reward',
  'currency_delta',
  'material_reward',
  'gu_reward',
  'rare_gu_reward',
  'immortal_gu_reward',
  'killer_move_inheritance',
  'complete_killer_move_inheritance',
  'npc_death',
  'npc_capture',
  'npc_betrayal',
  'npc_permanent_injury',
  'npc_fate_result',
  'route_entered',
  'location_unlock',
  'region_unlock',
  'faction_transfer',
  'standing_delta',
  'hidden_fact_reveal',
  'fang_yuan_private_causality',
  'canon_promotion',
  'deepseek_combat_authority',
  'deepseek_reward_authority',
  'deepseek_npc_fate_authority',
  'large_combat_motion_asset_pack',
];

const REQUIRED_STATE_DECISIONS = [
  'approve_SAVE_FORMAT_VERSION_25',
  'approve_conflictConsequenceState_or_equivalent_single_aggregate',
  'approve_migration_defaults_tests',
  'approve_formal_pursuit_or_warrant_scope',
  'approve_NPC_life_death_or_permanent_injury_scope',
  'approve_reward_drop_or_killer_move_inheritance_scope',
  'approve_DeepSeek_visible_context_or_authority_change_if_any',
];

const HIDDEN_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/春秋蝉/g, '受保护隐秘'],
  [/回溯/g, '受保护因果'],
  [/重生/g, '受保护经历'],
  [/fang_yuan_private_causality_hidden_anchor/g, '受保护私密引用'],
  [/private-body-redacted/g, '受保护私密引用'],
  [/hidden_ref_only/g, '受保护引用'],
  [/隐藏因果/g, '受保护因果'],
];

const FORMAL_CONCLUSION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/正式通缉已生效/g, '正式通缉结论已阻断'],
  [/追杀令已生效/g, '正式追杀结论已阻断'],
  [/围剿成功/g, '正式围剿结论已阻断'],
  [/敌对关系已确定/g, '正式敌对结论已阻断'],
  [/NPC已死亡/g, 'NPC 生死结论已阻断'],
  [/已捕获/g, '捕获结论已阻断'],
  [/永久伤势已写入/g, '永久伤势结论已阻断'],
  [/奖励已发放/g, '奖励结算已阻断'],
  [/掉落已获得/g, '掉落结算已阻断'],
  [/获得仙蛊/g, '仙蛊奖励结论已阻断'],
  [/完整杀招传承已获得/g, '完整杀招传承结论已阻断'],
  [/地点已解锁/g, '地点解锁结论已阻断'],
  [/阵营敌对已写入/g, '阵营结论已阻断'],
];

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
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

function sanitizeVisibleRefs(values: string[], max = 20): string[] {
  const blockedTokens = ['hidden', 'private', 'source_text', 'human_review', 'raw', 'quote', 'original'];
  return unique(values)
    .filter(value => !blockedTokens.some(token => value.toLowerCase().includes(token)))
    .slice(0, max);
}

function ledgerRefs(entries: LocalActionLedgerEntry[] = []): string[] {
  return entries.slice(-8).flatMap(entry => [
    `ledger:${entry.id}`,
    entry.actionType === 'combat' ? `combatLedger:${entry.id}` : '',
    ...(entry.risks || []).map(risk => `risk:${risk}`),
  ]);
}

function livingWorldCombatRefs(state?: Partial<LivingWorldState> | null): string[] {
  const consequences = state?.actionConsequences || [];
  const pressures = state?.factionPressure || [];
  const memories = state?.npcMemories || [];
  return [
    ...consequences
      .filter(entry => entry.scope === 'combat' || /战|冲突|追|截|伏击|风险/.test(entry.publicSummary))
      .map(entry => `consequence:${entry.id}`),
    ...pressures
      .filter(entry => (
        entry.visibility === 'player_visible'
        && (['suspicion', 'hostility'].includes(entry.pressureType) || /追|截|疑|敌|冲突/.test(entry.reason))
      ))
      .map(entry => `factionPressure:${entry.id}`),
    ...memories
      .filter(entry => /战|冲突|围观|截|追|伏击/.test(entry.publicSummary))
      .map(entry => `npcMemory:${entry.id}`),
  ];
}

function candidateRefs(candidates: CombatEventCandidate[] = []): string[] {
  return candidates.slice(-8).flatMap(candidate => [
    candidate.id ? `combatCandidate:${candidate.id}` : '',
    candidate.type ? `combatType:${candidate.type}` : '',
    candidate.engineValidation ? `engineValidation:${candidate.engineValidation}` : '',
    candidate.dropPolicyId ? `dropPolicy:${candidate.dropPolicyId}` : '',
  ]);
}

function battleStepRefs(steps: BattleResolutionStep[] = []): string[] {
  return steps.slice(-8).flatMap(step => [
    `battleStep:${step.id}`,
    `battleStepKind:${step.kind}`,
    ...(step.tags || []).map(tag => `battleTag:${tag}`),
  ]);
}

function blockedOutcomeRefs(values: string[]): string[] {
  return unique(values.map(value => `blocked:${value}`));
}

function conflictCandidateVisible(candidates: CombatEventCandidate[], steps: BattleResolutionStep[], outcome?: BattleOutcomeSummary | null): boolean {
  return candidates.length > 0 || steps.length > 0 || Boolean(outcome);
}

function buildPostureCard(input: {
  id: V150ConflictPostureId;
  title: string;
  visible: boolean;
  summaryVisible: string;
  summaryMissing: string;
  nextStepVisible: string;
  nextStepMissing: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
}): V150ConflictPostureCard {
  return {
    id: input.id,
    title: input.title,
    status: input.visible ? 'visible' : 'needs_context',
    summary: sanitizeVisibleText(input.visible ? input.summaryVisible : input.summaryMissing, input.summaryMissing),
    nextStep: sanitizeVisibleText(input.visible ? input.nextStepVisible : input.nextStepMissing, input.nextStepMissing),
    evidenceRefs: sanitizeVisibleRefs(input.evidenceRefs, 10),
    sourceRefs: sanitizeVisibleRefs(input.sourceRefs, 10),
    forbiddenWrites: unique([...BASE_FORBIDDEN_WRITES, ...input.forbiddenWrites]),
    canWriteSave: false,
    canGrantReward: false,
    canSetNpcFate: false,
    canSetFormalPursuit: false,
    canPatch: false,
    statePatchApplied: false,
  };
}

function chooseActivePosture(cards: V150ConflictPostureCard[]): V150ConflictPostureId | null {
  const priority: V150ConflictPostureId[] = [
    'pursuit_attention_window',
    'route_ambush_risk',
    'countermeasure_gap',
    'squad_formation_readiness',
  ];
  return priority.find(id => cards.some(card => card.id === id && card.status === 'visible')) || null;
}

export function buildV150ConflictAftermathProjection(
  input: V150ConflictAftermathProjectionInput = {},
): V150ConflictAftermathProjection {
  const turn = Math.max(0, Math.floor(Number(input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0)));
  const localActionLedger = Array.isArray(input.localActionLedger) ? input.localActionLedger : [];
  const combatEventCandidates = Array.isArray(input.combatEventCandidates) ? input.combatEventCandidates : [];
  const battleResolutionSteps = Array.isArray(input.battleResolutionSteps) ? input.battleResolutionSteps : [];
  const battleOutcomeSummary = input.battleOutcomeSummary || null;
  const routeOverview = buildV110RouteLocationOverview({
    livingWorldState: input.livingWorldState,
    routeLocationState: input.routeLocationState,
    turn,
  });
  const survivalProjection = buildV120LowRankSurvivalEconomyProjection({
    livingWorldState: input.livingWorldState,
    routeLocationState: routeOverview.routeLocationState,
    materialBag: input.materialBag,
    turn,
  });
  const socialProjection = buildV130SocialPressureProjection({
    livingWorldState: input.livingWorldState,
    localActionLedger,
    maxSignals: 8,
  });
  const regionProjection = buildV140RegionSampleProjection({
    livingWorldState: input.livingWorldState,
    routeLocationState: routeOverview.routeLocationState,
    survivalEconomyState: input.survivalEconomyState,
    localActionLedger,
    materialBag: input.materialBag,
    turn,
  });
  const storeSnapshot = {
    turn,
    currentChapterId: input.currentChapterId || 'qingmaoshan',
    profile: input.profile || { realm: { grand: 1, sub: '中阶', label: '一转中阶' } },
    inventory: input.inventory || [],
    flags: { combatEventCandidates },
  };
  const combatPreparation = listV017CombatPreparationViews(storeSnapshot);
  const counters = listV017CounterBoundaryViews();
  const tactics = listV017SquadTacticViews();
  const outcomeBackflow = buildV017OutcomeBackflowView(battleOutcomeSummary);

  const routeStatus = routeOverview.routeLocationState.status;
  const routeVisible = !['not_started', 'blocked'].includes(routeStatus);
  const survivalStateStatus = typeof input.survivalEconomyState?.status === 'string'
    ? input.survivalEconomyState.status
    : '';
  const survivalStateLedgerCount = Array.isArray(input.survivalEconomyState?.ledger)
    ? input.survivalEconomyState.ledger.length
    : 0;
  const survivalVisible = survivalProjection.status === 'pressure_visible'
    || survivalStateStatus === 'pressure_tracked'
    || survivalStateLedgerCount > 0;
  const socialVisible = socialProjection.status === 'pressure_visible';
  const regionVisible = regionProjection.status === 'sample_visible' && Boolean(regionProjection.activePostureId);
  const combatVisible = conflictCandidateVisible(combatEventCandidates, battleResolutionSteps, battleOutcomeSummary)
    || localActionLedger.some(entry => entry.actionType === 'combat');
  const livingCombatRefs = sanitizeVisibleRefs(livingWorldCombatRefs(input.livingWorldState), 12);
  const ledgerEvidence = sanitizeVisibleRefs(ledgerRefs(localActionLedger), 12);
  const candidateEvidence = sanitizeVisibleRefs(candidateRefs(combatEventCandidates), 12);
  const stepEvidence = sanitizeVisibleRefs(battleStepRefs(battleResolutionSteps), 12);
  const anyConflictEvidence = routeVisible || survivalVisible || socialVisible || regionVisible || combatVisible || livingCombatRefs.length > 0 || ledgerEvidence.length > 0;

  const counterHints = counters
    .flatMap(item => item.counterHints.map(hint => sanitizeVisibleText(`${item.displayName}：${hint}`, hint)))
    .slice(0, 6);
  const squadHints = tactics
    .map(item => sanitizeVisibleText(`${item.displayName}：${item.summary}`, item.summary))
    .slice(0, 5);
  const combatSourceRefs = sanitizeVisibleRefs([
    ...combatPreparation.flatMap(view => [`v017:${view.id}`, `sourcePackage:${view.sourcePackageId}`]),
    ...candidateEvidence,
    ...stepEvidence,
  ], 14);
  const forbiddenWrites = unique([
    ...BASE_FORBIDDEN_WRITES,
    ...routeOverview.forbiddenWrites,
    ...survivalProjection.forbiddenWrites,
    ...socialProjection.forbiddenWrites,
    ...regionProjection.forbiddenWrites,
    ...combatPreparation.flatMap(view => view.blockedOutcomes),
    ...counters.flatMap(item => item.blockedImplications),
    ...tactics.flatMap(item => item.blockedEffects),
  ]);

  const routeAmbushVisible = routeVisible
    || regionProjection.activePostureId === 'mountain_road_outer_edge'
    || combatEventCandidates.some(candidate => candidate.type === 'ambush')
    || battleResolutionSteps.some(step => step.kind === 'ambush' || step.tags.includes('ambush'));
  const pursuitVisible = socialVisible
    || livingCombatRefs.length > 0
    || combatEventCandidates.some(candidate => ['pursuit', 'ambush', 'escape_window'].includes(candidate.type))
    || localActionLedger.some(entry => entry.risks.some(risk => /追|截|伏击|敌|通缉|pursuit|ambush/.test(risk)));
  const counterVisible = anyConflictEvidence && (counters.length > 0 || battleResolutionSteps.some(step => ['counter', 'failure', 'resource_spend'].includes(step.kind)));
  const squadVisible = anyConflictEvidence && (tactics.length > 0 || battleResolutionSteps.some(step => ['formation', 'assist', 'guard'].includes(step.kind)));

  const postureCards: V150ConflictPostureCard[] = [
    buildPostureCard({
      id: 'route_ambush_risk',
      title: '路线伏击风险',
      visible: routeAmbushVisible,
      summaryVisible: '路线、区域与战斗候选已能合并为伏击风险提示；它只是风险解释，不是正式追杀或战斗触发。',
      summaryMissing: '尚缺路线、区域或战斗候选证据；伏击风险保持等待。',
      nextStepVisible: '继续核对路线遮掩、补给余量和公开理由；不写 route_entered、正式追杀、地点或奖励。',
      nextStepMissing: '先通过本地路线准备、山路候选或战斗候选建立公开证据。',
      evidenceRefs: unique([
        routeStatus ? `routeStatus:${routeStatus}` : '',
        ...routeOverview.evidenceLedgerEntryIds.map(id => `routeEvidence:${id}`),
        ...candidateEvidence,
        ...stepEvidence,
      ]),
      sourceRefs: unique([...routeOverview.visibleSourceRefs, ...regionProjection.visibleSourceRefs, ...combatSourceRefs]),
      forbiddenWrites,
    }),
    buildPostureCard({
      id: 'pursuit_attention_window',
      title: '追杀注意窗口',
      visible: pursuitVisible,
      summaryVisible: '公开冲突、势力压力或路线痕迹已足以显示注意窗口；这里只提示被盯上风险，不生成正式通缉或追杀结论。',
      summaryMissing: '尚缺公开冲突、势力压力或行动痕迹；追杀注意窗口保持候选态。',
      nextStepVisible: '优先做遮掩、递话、补给和路线降险；正式通缉、封锁、敌对或捕获结论仍需单独门禁。',
      nextStepMissing: '先让本地行动产生公开后果、社会压力或战斗候选，再读取注意窗口。',
      evidenceRefs: unique([
        ...livingCombatRefs,
        ...ledgerEvidence,
        ...socialProjection.signals.slice(0, 4).flatMap(signal => signal.visibleSourceRefs),
      ]),
      sourceRefs: unique([...socialProjection.visibleSourceRefs, ...regionProjection.visibleSourceRefs, ...combatSourceRefs]),
      forbiddenWrites,
    }),
    buildPostureCard({
      id: 'countermeasure_gap',
      title: '反制缺口',
      visible: counterVisible,
      summaryVisible: counterHints.slice(0, 3).join('；') || '已有战斗候选，可显示反制缺口，但不计算新伤害或奖励。',
      summaryMissing: '尚缺战斗候选或战斗轨迹；反制缺口保持等待。',
      nextStepVisible: '查看拥有蛊虫、真元、地形遮挡和撤退余地；UI 不私算伤害、胜负或掉落。',
      nextStepMissing: '先登记安全低阶战斗候选或完成本地战斗轨迹，再显示反制缺口。',
      evidenceRefs: unique([
        ...combatPreparation.slice(0, 4).map(view => `v017Preparation:${view.id}`),
        ...stepEvidence,
        ...blockedOutcomeRefs(counters.flatMap(item => item.blockedImplications)).slice(0, 6),
      ]),
      sourceRefs: combatSourceRefs,
      forbiddenWrites,
    }),
    buildPostureCard({
      id: 'squad_formation_readiness',
      title: '小队/阵法准备度',
      visible: squadVisible,
      summaryVisible: squadHints.slice(0, 3).join('；') || '已有冲突证据，可显示小队/阵法准备度，但不结算正式战局。',
      summaryMissing: '尚缺冲突证据；小队/阵法准备度保持只读候选。',
      nextStepVisible: '只提示守位、轮换、撤退和协作缺口；不写 NPC 生死、永久伤势、正式胜负或阵营敌对。',
      nextStepMissing: '先建立战斗候选、路线风险或公开社会压力，再读取小队准备度。',
      evidenceRefs: unique([
        ...combatPreparation.slice(0, 4).map(view => `v017Preparation:${view.id}`),
        ...stepEvidence,
        ...blockedOutcomeRefs(tactics.flatMap(item => item.blockedEffects)).slice(0, 6),
      ]),
      sourceRefs: combatSourceRefs,
      forbiddenWrites,
    }),
  ];

  const status: V150ConflictAftermathStatus = anyConflictEvidence ? 'conflict_projection_visible' : 'needs_conflict_context';
  const activePostureId = chooseActivePosture(postureCards);
  const rawSignalGroups: V150ConflictSignalGroup[] = [
    {
      id: 'route',
      title: '路线压力',
      statusLabel: routeOverview.statusLabel,
      summary: routeOverview.publicSummary,
      evidenceRefs: routeOverview.evidenceLedgerEntryIds.map(id => `routeEvidence:${id}`),
    },
    {
      id: 'survival',
      title: '生存消耗',
      statusLabel: survivalProjection.statusLabel,
      summary: survivalProjection.publicSummary,
      evidenceRefs: unique([
        survivalStateStatus ? `survivalState:${survivalStateStatus}` : '',
        survivalStateLedgerCount > 0 ? `survivalLedger:${survivalStateLedgerCount}` : '',
        ...survivalProjection.pressureItems.filter(item => item.status === 'visible').flatMap(item => item.evidenceRefs),
      ]),
    },
    {
      id: 'social',
      title: '社会注意',
      statusLabel: socialProjection.statusLabel,
      summary: socialProjection.publicSummary,
      evidenceRefs: socialProjection.signals.slice(0, 5).flatMap(signal => signal.visibleSourceRefs),
    },
    {
      id: 'region',
      title: '区域边界',
      statusLabel: regionProjection.statusLabel,
      summary: regionProjection.publicSummary,
      evidenceRefs: regionProjection.postureCards.filter(card => card.status === 'visible').flatMap(card => card.evidenceRefs),
    },
    {
      id: 'combat',
      title: '战斗证据',
      statusLabel: combatVisible ? '冲突证据可读' : '等待战斗候选',
      summary: combatVisible
        ? sanitizeVisibleText(`${combatPreparation.filter(view => view.canRegister).length} 条安全低阶候选；${outcomeBackflow.boundary}`, '战斗证据可读。')
        : '尚未登记安全战斗候选或本地战斗轨迹；v1.5 不凭叙事文本生成后果。',
      evidenceRefs: unique([...candidateEvidence, ...stepEvidence, ...livingCombatRefs, ...ledgerEvidence]),
    },
  ];
  const signalGroups: V150ConflictSignalGroup[] = rawSignalGroups.map(group => ({
    ...group,
    summary: sanitizeVisibleText(group.summary, '需要更多公开证据。'),
    evidenceRefs: sanitizeVisibleRefs(group.evidenceRefs, 10),
  }));

  const visibleSourceRefs = sanitizeVisibleRefs([
    'v1.5.0-a1:D-151-001',
    'v1.5.0-a1:D-151-002',
    'v1.5.0-a1:D-151-003',
    'v1.5.0-a1:D-151-004',
    'v1.5.0-a1:D-151-005',
    'v1.5.0-a1:D-151-006',
    'v1.5.0-a1:D-151-007',
    'v1.5.0-a1:D-151-008',
    'v1.5.0-a1:D-151-009',
    'v1.5.0-a1:D-151-010',
    'v1.5.0-a2:conflict-topic-slice-intake',
    'v0.17:combat-deepening-rules:reviewed-rule-source',
    'v0.17:killer-move-counter-boundary:reviewed-rule-source',
    'v0.17:squad-formation-tactics:reviewed-rule-source',
    ...routeOverview.visibleSourceRefs,
    ...sanitizeVisibleRefs(input.survivalEconomyState?.sourceRefs || []),
    ...survivalProjection.visibleSourceRefs,
    ...socialProjection.visibleSourceRefs,
    ...regionProjection.visibleSourceRefs,
    ...combatSourceRefs,
  ], 64);

  const nextStepCandidates = status === 'conflict_projection_visible'
    ? [
      '核对路线遮掩与伏击风险。',
      '检查补给、真元和蛊虫反制缺口。',
      '用公开理由降低势力注意。',
      '只登记安全低阶战斗候选，不写正式追杀或奖励。',
    ]
    : [
      '先完成路线准备、补给准备、公开反应或安全战斗候选登记。',
      '避免让叙事文本直接生成战斗后果。',
    ];

  return {
    status,
    statusLabel: status === 'conflict_projection_visible' ? '冲突后果投影可读' : '等待冲突证据',
    scopeId: SCOPE_ID,
    savePolicy: 'no_new_persistence_v24',
    authority: 'local_projection_only',
    activePostureId,
    publicSummary: status === 'conflict_projection_visible'
      ? 'v1.5 冲突后果解释层已可投影：只显示路线伏击风险、追杀注意窗口、反制缺口和小队/阵法准备度，不写正式奖励、生死、通缉、地点或阵营。'
      : '当前还没有足够路线、生存、社会、区域或战斗证据支撑冲突后果投影；v1.5 保持 projection-first，不写新存档字段。',
    nextStep: status === 'conflict_projection_visible'
      ? '按当前最强公开证据选择降险准备；所有战斗后果仍由本地 engine/canon 拥有，DeepSeek 和 UI 不拥有结算权。'
      : '先建立本地公开证据，再读取冲突后果解释层。',
    postureCards,
    signalGroups,
    counterHints: counterHints.slice(0, 5),
    squadHints: squadHints.slice(0, 4),
    nextStepCandidates: nextStepCandidates.map(item => sanitizeVisibleText(item, item)),
    boundaryLines: [
      'v1.5 b1 是 projection-first：SAVE_FORMAT_VERSION 保持 24，不新增 conflictConsequenceState / pursuitState / combatAftermathState。',
      '本 helper 只读 v1.1 routeLocationState、v1.2 survivalEconomyState、v1.3 livingWorld 社会证据、v1.4 区域样板和 v0.17 reviewed 战斗资料。',
      '路线伏击、追杀注意、反制缺口和小队/阵法准备度都是风险解释，不是正式追杀、正式通缉、战局胜负或地点进入。',
      '不写掉落、奖励、稀有蛊、仙蛊、完整杀招传承、NPC 生死、捕获、背叛、永久伤势或阵营敌对。',
      'MiroFish 基础包和 v0.17 包只作为 source pointer / reviewed rule source；不是 runtime canon、DeepSeek 权限或玩家可见隐藏事实。',
      'DeepSeek 只能写叙事、传闻、压力和候选文本；本地 engine/store 才能拥有伤害、胜负、奖励、生死、地点和阵营事实。',
    ],
    visibleSourceRefs,
    forbiddenWrites,
    projectionAudit: {
      phase: 'v1.5.0-b1-conflict-aftermath-projection',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v017_public_evidence',
      miroFishPolicy: 'v017_reviewed_source_pointer_only_no_new_package',
      deepSeekPolicy: 'no_new_authority',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToStateWithoutUserDecision: false,
      requiredUserDecisionForState: [...REQUIRED_STATE_DECISIONS],
      pass: true,
      notes: [
        'b1 keeps conflict aftermath recomputable from existing public evidence.',
        'formal pursuit, reward, NPC fate, location, faction, hidden-fact, and DeepSeek authority writes remain forbidden.',
        'v1.5 does not change DeepSeek visible context or runtime authority.',
      ],
    },
    modules: {
      routeStatus,
      survivalStatus: survivalStateStatus || survivalProjection.status,
      socialStatus: socialProjection.status,
      regionStatus: regionProjection.status,
      combatCandidateCount: combatEventCandidates.length,
      traceStepCount: battleResolutionSteps.length,
    },
    saveFormatImpact: 'none_v24_projection_only',
    statePatchApplied: false,
    canWriteSave: false,
    canGrantReward: false,
    canSetNpcFate: false,
    canSetFormalPursuit: false,
    canExpandDeepSeekAuthority: false,
    deepSeekAuthority: 'no_new_authority',
    legacyFieldsIgnored: true,
  };
}
