import routeContinuationRulesRaw from '../canon/qingmao-route-continuation-rules.json';
import type {
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingPlayerGoalEntry,
  LivingWorldState,
} from '../types';

export type QingmaoRouteEligibility = 'blocked' | 'needs_preparation' | 'candidate' | 'ready';

export type QingmaoRouteMissingConditionType =
  | 'supply'
  | 'social_cover'
  | 'public_reason'
  | 'faction_pressure'
  | 'route_knowledge'
  | 'risk_acceptance';

export type QingmaoRouteRiskAxis =
  | 'pursuit'
  | 'resource'
  | 'hidden_fact_probe'
  | 'faction_pressure'
  | 'local_survival'
  | 'canon_anchor_pressure';

export type QingmaoRoutePreparationActionType =
  | 'cover_tracks'
  | 'send_message'
  | 'avoid_attention'
  | 'gather_supply'
  | 'ask_public_evidence';

export type QingmaoRouteBoundaryType =
  | 'no_location_unlock'
  | 'no_faction_transfer'
  | 'no_reward'
  | 'no_npc_life_result'
  | 'hidden_ref_only'
  | 'deepseek_no_authority';

export type QingmaoIntentBucket = 'normal' | 'short_term' | 'long_term' | 'extreme';

export interface QingmaoRouteConditionRule {
  id: string;
  type: QingmaoRouteMissingConditionType;
  label: string;
  severity: 'soft' | 'hard';
  canPrepareNow: boolean;
  preparationActionId?: string;
}

export interface QingmaoRouteMissingCondition {
  id: string;
  type: QingmaoRouteMissingConditionType;
  label: string;
  severity: 'soft' | 'hard';
  canPrepareNow: boolean;
  preparationActionId?: string;
}

export interface QingmaoRouteRiskRule {
  id: string;
  axis: QingmaoRouteRiskAxis;
  label: string;
  level: 'low' | 'medium' | 'high' | 'blocked';
  visibleSummary: string;
}

export interface QingmaoRouteRiskFactor extends QingmaoRouteRiskRule {
  sourceRefs: string[];
}

export interface QingmaoRouteSocialModifier {
  id: string;
  subjectRef: string;
  modifierType: 'opportunity' | 'suspicion' | 'cover' | 'obstruction' | 'rumor';
  visibleSummary: string;
  sourceActionIds: string[];
}

export interface QingmaoRoutePreparationAction {
  id: string;
  label: string;
  actionType: QingmaoRoutePreparationActionType;
  rewardPolicy: 'none';
  canChangeLocation: false;
  canChangeFaction: false;
}

export interface QingmaoRouteBoundary {
  id: string;
  type: QingmaoRouteBoundaryType;
  visibleText: string;
}

export interface QingmaoRouteArchetypeRule {
  routeKey: string;
  displayName: string;
  summary: string;
  intentTags: string[];
  requiredConditionIds: string[];
  softConditionIds: string[];
  riskRuleIds: string[];
  preparationActionIds: string[];
  sourceRefs: string[];
  deferred?: boolean;
}

export interface QingmaoRouteConditionPreview {
  routeKey: string;
  displayName: string;
  eligibility: QingmaoRouteEligibility;
  reason: string;
  missingConditions: QingmaoRouteMissingCondition[];
  riskFactors: QingmaoRouteRiskFactor[];
  socialModifiers: QingmaoRouteSocialModifier[];
  availablePreparations: QingmaoRoutePreparationAction[];
  sourceRefs: string[];
  boundaries: QingmaoRouteBoundary[];
  statePatchApplied: false;
}

export interface QingmaoRouteIntentSample {
  id: string;
  bucket: QingmaoIntentBucket;
  sample: string;
  expectedDisposition: string;
  matrixTriage: 'current_matrix' | 'future_sample_pool' | 'discarded';
}

export interface QingmaoRouteIntentRulingHint {
  id: string;
  bucket: QingmaoIntentBucket;
  disposition:
    | 'route_preview'
    | 'preparation_only'
    | 'route_preview_with_prerequisites'
    | 'faction_goal_prerequisites_only'
    | 'future_sample_pool'
    | 'not_matched';
  visibleSummary: string;
  testMatrixRef: string;
  forbiddenUpgrades: string[];
}

export interface QingmaoRouteContinuationInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  intentText?: string | null;
  maxRoutes?: number;
}

export interface QingmaoRouteContinuationPreviewResult {
  status: 'read_only_preview';
  message: string;
  publicSummary: string;
  previews: QingmaoRouteConditionPreview[];
  intentRulingHints: QingmaoRouteIntentRulingHint[];
  intentSamples: QingmaoRouteIntentSample[];
  sourceRefs: string[];
  forbiddenWrites: string[];
  quarantinedItemIds: string[];
  deferredItemIds: string[];
  rejectedReasons: string[];
  statePatchApplied: false;
}

interface QingmaoRouteContinuationRulesFile {
  sourceReview: {
    intakeReviews: string[];
    sourcePackages: string[];
  };
  boundaries: {
    forbiddenWrites: string[];
    deferredItemIds: string[];
    visibleBoundaries: QingmaoRouteBoundary[];
  };
  routeArchetypes: QingmaoRouteArchetypeRule[];
  conditions: QingmaoRouteConditionRule[];
  riskRules: QingmaoRouteRiskRule[];
  preparationActions: QingmaoRoutePreparationAction[];
  intentSampleBuckets: QingmaoRouteIntentSample[];
}

const rulesFile = routeContinuationRulesRaw as QingmaoRouteContinuationRulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cloneCondition(condition: QingmaoRouteConditionRule): QingmaoRouteConditionRule {
  return { ...condition };
}

function cloneRisk(risk: QingmaoRouteRiskRule): QingmaoRouteRiskRule {
  return { ...risk };
}

function cloneAction(action: QingmaoRoutePreparationAction): QingmaoRoutePreparationAction {
  return { ...action };
}

function cloneBoundary(boundary: QingmaoRouteBoundary): QingmaoRouteBoundary {
  return { ...boundary };
}

function cloneRoute(route: QingmaoRouteArchetypeRule): QingmaoRouteArchetypeRule {
  return {
    ...route,
    intentTags: [...route.intentTags],
    requiredConditionIds: [...route.requiredConditionIds],
    softConditionIds: [...route.softConditionIds],
    riskRuleIds: [...route.riskRuleIds],
    preparationActionIds: [...route.preparationActionIds],
    sourceRefs: [...route.sourceRefs],
  };
}

function conditionById(id: string): QingmaoRouteConditionRule {
  const condition = rulesFile.conditions.find(entry => entry.id === id);
  if (!condition) {
    throw new Error(`Unknown Qingmao route condition: ${id}`);
  }
  return condition;
}

function riskById(id: string): QingmaoRouteRiskRule {
  const risk = rulesFile.riskRules.find(entry => entry.id === id);
  if (!risk) {
    throw new Error(`Unknown Qingmao route risk: ${id}`);
  }
  return risk;
}

function actionById(id: string): QingmaoRoutePreparationAction {
  const action = rulesFile.preparationActions.find(entry => entry.id === id);
  if (!action) {
    throw new Error(`Unknown Qingmao preparation action: ${id}`);
  }
  return action;
}

function textIncludesAny(text: string, needles: string[]): boolean {
  return needles.some(needle => text.includes(needle));
}

function normalizeText(text?: string | null): string {
  return String(text || '').trim().toLowerCase();
}

function hasGoal(
  goals: LivingPlayerGoalEntry[],
  predicate: (goal: LivingPlayerGoalEntry) => boolean,
): boolean {
  return goals.some(goal => goal.status !== 'failed' && predicate(goal));
}

function factMatches(state: Partial<LivingWorldState> | null | undefined, predicate: (text: string) => boolean): boolean {
  return Object.values(state?.knownFacts || {}).some(fact => predicate([
    fact.id,
    fact.scope,
    fact.source,
    fact.summary,
    ...(fact.tags || []),
  ].join('|').toLowerCase()));
}

function consequenceMatches(
  state: Partial<LivingWorldState> | null | undefined,
  predicate: (entry: LivingActionConsequenceEntry, text: string) => boolean,
): boolean {
  return (state?.actionConsequences || []).some(entry => predicate(entry, [
    entry.id,
    entry.actionId,
    entry.publicSummary,
    ...(entry.effectRefs || []),
    ...(entry.followUpRefs || []),
  ].join('|').toLowerCase()));
}

function pressureMatches(
  state: Partial<LivingWorldState> | null | undefined,
  predicate: (entry: LivingFactionPressureEntry, text: string) => boolean,
): boolean {
  return (state?.factionPressure || []).some(entry => predicate(entry, [
    entry.id,
    entry.factionId,
    entry.pressureType,
    entry.reason,
    entry.visibility,
  ].join('|').toLowerCase()));
}

function memoryMatches(
  state: Partial<LivingWorldState> | null | undefined,
  predicate: (entry: LivingNpcMemoryEntry, text: string) => boolean,
): boolean {
  return (state?.npcMemories || []).some(entry => predicate(entry, [
    entry.id,
    entry.npcId,
    entry.regionId || '',
    entry.actionId || '',
    entry.publicSummary,
    ...(entry.tags || []),
  ].join('|').toLowerCase()));
}

function classifyIntent(intentText?: string | null): Set<string> {
  const text = normalizeText(intentText);
  const tags = new Set<string>();
  if (!text) return tags;

  if (textIncludesAny(text, ['逃离', '离开青茅', '离开古月', '青茅山外', '外面', '南疆'])) {
    tags.add('escape_qingmao');
    tags.add('outside_qingmao');
  }
  if (textIncludesAny(text, ['商队', '加入商队', '商家城', '商量山'])) {
    tags.add('merchant_caravan');
    tags.add('join_caravan');
  }
  if (textIncludesAny(text, ['商家城', '商量山'])) {
    tags.add('shang_city');
    tags.add('shang_public_entry');
  }
  if (textIncludesAny(text, ['白家', '投靠白家', '加入白家'])) {
    tags.add('baijia_contact');
    tags.add('join_baijia');
    tags.add('faction_goal');
  }
  if (textIncludesAny(text, ['散修', '独自闯荡'])) {
    tags.add('rogue_cultivator');
    tags.add('survival_route');
  }
  if (textIncludesAny(text, ['盗天魔尊', '天外之魔', '九转', '十转', '仙蛊', '永生'])) {
    tags.add('extreme_high_rank_inheritance');
  }
  return tags;
}

function hasRelevantIntent(route: QingmaoRouteArchetypeRule, intentTags: Set<string>, state?: Partial<LivingWorldState> | null): boolean {
  if (route.intentTags.some(tag => intentTags.has(tag))) return true;
  const goals = state?.playerGoals || [];
  if (route.routeKey === 'mountain_pass_escape' || route.routeKey === 'rogue_cultivator_path') {
    return hasGoal(goals, goal => goal.targetRef === 'region:outside_qingmao' || goal.rationale.includes('逃离青茅山'));
  }
  if (route.routeKey === 'baijia_contact_window') {
    return hasGoal(goals, goal => goal.targetRef.includes('baijia') || goal.rationale.includes('白家'));
  }
  if (route.routeKey === 'merchant_caravan_contact' || route.routeKey === 'shang_public_entry_deferred') {
    return hasGoal(goals, goal => goal.rationale.includes('商队') || goal.rationale.includes('商家城'));
  }
  return false;
}

function conditionSatisfied(
  id: string,
  state: Partial<LivingWorldState> | null | undefined,
  intentTags: Set<string>,
): boolean {
  const goals = state?.playerGoals || [];
  switch (id) {
    case 'goal_escape_qingmao':
      return intentTags.has('escape_qingmao')
        || intentTags.has('outside_qingmao')
        || hasGoal(goals, goal => goal.targetRef === 'region:outside_qingmao' || goal.rationale.includes('逃离青茅山'));
    case 'route_prep_baseline':
      return factMatches(state, text => text.includes('qingmao_escape_route_preparation_baseline') || text.includes('route_supply_pursuit'))
        || consequenceMatches(state, (_entry, text) => text.includes('qingmao_escape_route_preparation_probe') || text.includes('route:route_qingmao_outer_night_mountain_road'));
    case 'travel_supply_gap':
      return factMatches(state, text => text.includes('travel_supply_ready') || text.includes('短途补给已整理'));
    case 'social_cover_story':
      return consequenceMatches(state, (_entry, text) => text.includes('cover') || text.includes('遮掩') || text.includes('身份遮掩'))
        || memoryMatches(state, (_entry, text) => text.includes('cover') || text.includes('遮掩') || text.includes('递话'));
    case 'public_reason_caravan':
      return intentTags.has('merchant_caravan')
        || intentTags.has('join_caravan')
        || factMatches(state, text => text.includes('caravan') || text.includes('商队'))
        || consequenceMatches(state, (_entry, text) => text.includes('caravan') || text.includes('商队'));
    case 'caravan_timing_window':
      return factMatches(state, text => text.includes('caravan') || text.includes('商队窗口') || text.includes('交易窗口'));
    case 'baijia_contact_evidence':
      return intentTags.has('baijia_contact')
        || hasGoal(goals, goal => goal.targetRef.includes('baijia') || goal.rationale.includes('白家'))
        || pressureMatches(state, (entry, text) => entry.factionId === 'baijia_zhai' || text.includes('baijia') || text.includes('白家'));
    case 'pursuit_risk_ack':
      return pressureMatches(state, entry => entry.pressureType === 'suspicion' || entry.pressureType === 'hostility')
        || consequenceMatches(state, (_entry, text) => text.includes('pursuit') || text.includes('追踪') || text.includes('追击'));
    case 'low_rank_identity_gap':
      return factMatches(state, text => text.includes('low_rank_identity') || text.includes('身份遮掩'));
    default:
      return false;
  }
}

function buildMissingConditions(
  route: QingmaoRouteArchetypeRule,
  state: Partial<LivingWorldState> | null | undefined,
  intentTags: Set<string>,
): QingmaoRouteMissingCondition[] {
  return [...route.requiredConditionIds, ...route.softConditionIds]
    .filter(id => !conditionSatisfied(id, state, intentTags))
    .map(id => {
      const condition = conditionById(id);
      return {
        id: condition.id,
        type: condition.type,
        label: condition.label,
        severity: condition.severity,
        canPrepareNow: condition.canPrepareNow,
        preparationActionId: condition.preparationActionId,
      };
    });
}

function buildRiskFactors(
  route: QingmaoRouteArchetypeRule,
  state: Partial<LivingWorldState> | null | undefined,
): QingmaoRouteRiskFactor[] {
  const pressureRefs = (state?.factionPressure || []).map(entry => `factionPressure:${entry.id}`);
  const hiddenRefs = Object.keys(state?.hiddenFactRefs || {}).map(id => `hiddenRef:${id}`);
  return route.riskRuleIds.map((id) => {
    const risk = riskById(id);
    return {
      ...risk,
      sourceRefs: unique([
        ...route.sourceRefs,
        risk.axis === 'faction_pressure' || risk.axis === 'pursuit' ? pressureRefs[0] || '' : '',
        risk.axis === 'hidden_fact_probe' ? hiddenRefs[0] || '' : '',
      ]),
    };
  });
}

function buildSocialModifiers(state: Partial<LivingWorldState> | null | undefined): QingmaoRouteSocialModifier[] {
  const pressureModifiers = (state?.factionPressure || []).slice(0, 4).map((entry): QingmaoRouteSocialModifier => ({
    id: `pressure_modifier_${entry.id}`,
    subjectRef: `faction:${entry.factionId}`,
    modifierType: entry.pressureType === 'opportunity' || entry.pressureType === 'favor'
      ? 'opportunity'
      : entry.pressureType === 'hostility'
        ? 'obstruction'
        : 'suspicion',
    visibleSummary: entry.reason,
    sourceActionIds: [`factionPressure:${entry.id}`],
  }));
  const memoryModifiers = (state?.npcMemories || []).slice(0, 4).map((entry): QingmaoRouteSocialModifier => ({
    id: `memory_modifier_${entry.id}`,
    subjectRef: `npc:${entry.npcId}`,
    modifierType: entry.attitudeDelta >= 0 ? 'cover' : 'suspicion',
    visibleSummary: entry.publicSummary,
    sourceActionIds: [entry.actionId || `npcMemory:${entry.id}`],
  }));
  return [...pressureModifiers, ...memoryModifiers].slice(0, 6);
}

function buildAvailablePreparations(missing: QingmaoRouteMissingCondition[], route: QingmaoRouteArchetypeRule): QingmaoRoutePreparationAction[] {
  const ids = unique([
    ...missing
      .filter(condition => condition.canPrepareNow && condition.preparationActionId)
      .map(condition => condition.preparationActionId || ''),
    ...route.preparationActionIds,
  ]).slice(0, 4);
  return ids.map(id => actionById(id)).map(cloneAction);
}

function computeEligibility(route: QingmaoRouteArchetypeRule, relevant: boolean, missing: QingmaoRouteMissingCondition[]): QingmaoRouteEligibility {
  if (route.deferred) return 'blocked';
  if (!relevant) return 'blocked';
  if (missing.some(condition => condition.severity === 'hard')) return 'needs_preparation';
  if (missing.length > 0) return 'candidate';
  return 'ready';
}

function buildReason(route: QingmaoRouteArchetypeRule, eligibility: QingmaoRouteEligibility, missing: QingmaoRouteMissingCondition[]): string {
  if (route.deferred) {
    return `${route.displayName} 在 v0.14 只做公开入口条件评估，不开放完整城市或地点进入。`;
  }
  if (eligibility === 'blocked') {
    return `${route.displayName} 缺少相关目标或账本证据，当前只保留为路线候选。`;
  }
  if (eligibility === 'needs_preparation') {
    const hard = missing.filter(condition => condition.severity === 'hard').map(condition => condition.label).join('；');
    return `${route.displayName} 需要先补齐硬前置：${hard}。`;
  }
  if (eligibility === 'candidate') {
    return `${route.displayName} 已可作为候选展示，但仍有补给、遮掩或风险接受等软前置。`;
  }
  return `${route.displayName} 的预览条件已足够；正式进入路线状态仍需后续阶段和用户决策。`;
}

function buildRoutePreview(
  route: QingmaoRouteArchetypeRule,
  input: QingmaoRouteContinuationInput,
  intentTags: Set<string>,
): QingmaoRouteConditionPreview {
  const relevant = hasRelevantIntent(route, intentTags, input.livingWorldState);
  const missing = buildMissingConditions(route, input.livingWorldState, intentTags);
  const eligibility = computeEligibility(route, relevant, missing);
  return {
    routeKey: route.routeKey,
    displayName: route.displayName,
    eligibility,
    reason: buildReason(route, eligibility, missing),
    missingConditions: missing,
    riskFactors: buildRiskFactors(route, input.livingWorldState),
    socialModifiers: buildSocialModifiers(input.livingWorldState),
    availablePreparations: buildAvailablePreparations(missing, route),
    sourceRefs: unique([
      ...route.sourceRefs,
      ...rulesFile.sourceReview.intakeReviews.map(ref => `review:${ref}`),
      ...(input.livingWorldState?.playerGoals || []).map(goal => `goal:${goal.id}`),
      ...Object.keys(input.livingWorldState?.knownFacts || {}).map(id => `fact:${id}`),
      ...(input.livingWorldState?.actionConsequences || []).map(entry => `consequence:${entry.id}`),
    ]),
    boundaries: rulesFile.boundaries.visibleBoundaries.map(cloneBoundary),
    statePatchApplied: false,
  };
}

function buildIntentRulingHints(intentTags: Set<string>, intentText?: string | null): QingmaoRouteIntentRulingHint[] {
  if (!intentText || intentTags.size === 0) return [];
  if (intentTags.has('extreme_high_rank_inheritance')) {
    return [{
      id: 'R14-INTENT-EXTREME-001',
      bucket: 'extreme',
      disposition: 'future_sample_pool',
      visibleSummary: '这个目标超过 v0.14 路线承接范围，预期处理是降级为长期目标、前置条件和风险提示，不开放高阶传承。',
      testMatrixRef: 'R14-GOV-001',
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    }];
  }
  if (intentTags.has('join_baijia')) {
    return [{
      id: 'R14-INTENT-FACTION-001',
      bucket: 'long_term',
      disposition: 'faction_goal_prerequisites_only',
      visibleSummary: '可以承认投靠白家的长期目标，但当前只显示接触前置、信任缺口和古月疑心，不改变阵营。',
      testMatrixRef: 'R14-007',
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    }];
  }
  if (intentTags.has('merchant_caravan') || intentTags.has('shang_public_entry')) {
    return [{
      id: 'R14-INTENT-LONG-001',
      bucket: 'long_term',
      disposition: 'route_preview_with_prerequisites',
      visibleSummary: '商队和商家城相关目标只进入路线预览与公开入口前置，不直接加入商队或进入城市。',
      testMatrixRef: 'R14-008/R14-010',
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    }];
  }
  return [{
    id: 'R14-INTENT-NORMAL-001',
    bucket: 'normal',
    disposition: 'route_preview',
    visibleSummary: '当前输入可进入青茅路线承接预览，输出条件、风险和可做前置。',
    testMatrixRef: 'R14-001',
    forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
  }];
}

export function listQingmaoRouteContinuationRules(): QingmaoRouteArchetypeRule[] {
  return rulesFile.routeArchetypes.map(cloneRoute);
}

export function listQingmaoRouteContinuationIntentSamples(): QingmaoRouteIntentSample[] {
  return rulesFile.intentSampleBuckets.map(sample => ({ ...sample }));
}

export function buildQingmaoRouteContinuationPreview(
  input: QingmaoRouteContinuationInput = {},
): QingmaoRouteContinuationPreviewResult {
  const intentTags = classifyIntent(input.intentText);
  const maxRoutes = Math.max(1, Math.floor(Number(input.maxRoutes ?? rulesFile.routeArchetypes.length)));
  const previews = rulesFile.routeArchetypes
    .map(route => buildRoutePreview(route, input, intentTags))
    .sort((a, b) => {
      const order: Record<QingmaoRouteEligibility, number> = {
        ready: 0,
        candidate: 1,
        needs_preparation: 2,
        blocked: 3,
      };
      return order[a.eligibility] - order[b.eligibility] || a.routeKey.localeCompare(b.routeKey);
    })
    .slice(0, maxRoutes);
  const sourceRefs = unique(previews.flatMap(preview => preview.sourceRefs));
  const activePreviews = previews.filter(preview => preview.eligibility !== 'blocked');
  const rejectedReasons = activePreviews.length > 0 ? [] : ['no_route_condition_ready'];

  return {
    status: 'read_only_preview',
    message: activePreviews.length > 0
      ? `已生成 ${previews.length} 条青茅后续路线条件预览；当前只读，不改变地点或阵营。`
      : `已生成 ${previews.length} 条路线候选，但当前缺少足够目标或账本证据。`,
    publicSummary: '路线承接会读取目标、事实、社会记忆、势力压力和行动后果，但本阶段只展示条件与风险。',
    previews,
    intentRulingHints: buildIntentRulingHints(intentTags, input.intentText),
    intentSamples: listQingmaoRouteContinuationIntentSamples(),
    sourceRefs,
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    quarantinedItemIds: [...rulesFile.boundaries.deferredItemIds],
    deferredItemIds: [...rulesFile.boundaries.deferredItemIds],
    rejectedReasons,
    statePatchApplied: false,
  };
}
