import rulesRaw from '../canon/v018-route-multi-region-rules.json';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import type {
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingPlayerGoalEntry,
  LivingWorldState,
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  PlayerKnownFact,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
} from '../types';

const REGION_ID = 'qingmao_three_clans';
const TARGET_ROUTE_ID = 'southern_border_low_rank_route';
const THRESHOLD_ACTION_ID = 'v018_qingmao_route_entry_threshold_probe';
const THRESHOLD_FACT_ID = 'v018_qingmao_route_entry_threshold_commitment';
const THRESHOLD_CONSEQUENCE_ID = 'consequence_v018_qingmao_route_entry_threshold_probe';
const CONTINUATION_ACTION_ID = 'v018_qingmao_candidate_continuation_probe';
const CONTINUATION_FACT_ID = 'v018_qingmao_route_candidate_continuation_view';
const CONTINUATION_CONSEQUENCE_ID = 'consequence_v018_qingmao_candidate_continuation_probe';
const PRESSURE_ACTION_ID = 'v018_qingmao_route_pressure_backflow_probe';
const PRESSURE_FACT_ID = 'v018_qingmao_route_pressure_backflow_baseline';
const PRESSURE_CONSEQUENCE_ID = 'consequence_v018_qingmao_route_pressure_backflow_probe';
const QUARANTINED_ITEM_ID = 'v018_hidden_982eba1c3730';

const START_PROFILE_FACTIONS: Record<string, string> = {
  start_qingmaoshan_guyue: 'guyue_shanzhai',
  start_qingmaoshan_xiongjia: 'xiongjia_zhai',
  start_qingmaoshan_baijia: 'baijia_zhai',
  start_qingmaoshan_shangjia_caravan: 'shangjia',
  start_qingmaoshan_wujia_branch: 'wujia',
  start_qingmaoshan_tiejia_patrol: 'tiejia',
  start_qingmaoshan_sanxiu: 'sanxiu',
};

export type V018RouteRequirement =
  | 'escape_goal'
  | 'route_preparation'
  | 'cover_tracks'
  | 'mountain_pass_candidate'
  | 'supply_feeding'
  | 'route_threshold_commitment';

export type V018RouteStage =
  | 'blocked'
  | 'candidate'
  | 'threshold_ready'
  | 'commitment_preview'
  | 'candidate_continuation';

export type V018PressureAxis =
  | 'supply'
  | 'pursuit'
  | 'identity'
  | 'caravan_guarantee'
  | 'faction_residual'
  | 'npc_memory';

export type V018EntryKind = 'caravan' | 'rogue' | 'shang_outer';

export interface V018RouteMilestoneRule {
  id: string;
  label: string;
  summary: string;
  requirement: V018RouteRequirement;
  sourceItemIds: string[];
}

export interface V018RouteMilestonePreview extends V018RouteMilestoneRule {
  satisfied: boolean;
  status: 'done' | 'missing';
}

export interface V018RegionFactDraft {
  id: string;
  title: string;
  regionRef: string;
  visibility: 'public' | 'player_visible';
  summary: string;
  allowedPromptUse: boolean;
  sourceItemIds: string[];
  blockedImplications: string[];
}

export interface V018RoutePressureDraft {
  id: string;
  pressureAxis: V018PressureAxis;
  severity: 'low' | 'medium' | 'high' | 'blocked';
  publicReason: string;
  ledgerInputs: string[];
  sourceItemIds: string[];
  blockedEscalations: string[];
}

export interface V018RoutePressurePreview extends V018RoutePressureDraft {
  active: boolean;
  activationRefs: string[];
}

export interface V018EntryBoundaryRule {
  id: string;
  entryKind: V018EntryKind;
  title: string;
  publicSummary: string;
  prerequisites: string[];
  allowedNextSteps: string[];
  blockedUpgrades: string[];
  sourceItemIds: string[];
}

export interface V018EntryBoundaryPreview extends V018EntryBoundaryRule {
  status: 'visible_boundary' | 'needs_context';
  satisfiedPrerequisites: string[];
  missingPrerequisites: string[];
}

export interface V018RouteMultiRegionOverview {
  status: 'read_only_preview';
  routeId: typeof TARGET_ROUTE_ID;
  stage: V018RouteStage;
  stageLabel: string;
  publicSummary: string;
  nextStep: string;
  milestones: V018RouteMilestonePreview[];
  regionFacts: V018RegionFactDraft[];
  pressurePreviews: V018RoutePressurePreview[];
  entryBoundaries: V018EntryBoundaryPreview[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  quarantinedItemIds: string[];
  rejectedReasons: string[];
  statePatchApplied: false;
}

export interface V018QingmaoRouteMultiRegionInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
}

export interface V018QingmaoRouteActionResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  routeId: typeof TARGET_ROUTE_ID;
  overview: V018RouteMultiRegionOverview;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  knownFacts: PlayerKnownFact[];
  factionPressure: LivingFactionPressureEntry[];
  npcMemories: LivingNpcMemoryEntry[];
  playerGoals: LivingPlayerGoalEntry[];
  actionConsequences: LivingActionConsequenceEntry[];
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
  statePatchApplied: false;
}

interface V018RulesFile {
  sourceReview: {
    intakeReviews: string[];
    sourcePackages: string[];
    sourcePolicy: string;
  };
  boundaries: {
    forbiddenWrites: string[];
    quarantinedItemIds: string[];
    visibleBoundaryLines: string[];
  };
  routeEntryMilestones: V018RouteMilestoneRule[];
  regionFactDrafts: V018RegionFactDraft[];
  routePressureDrafts: V018RoutePressureDraft[];
  entryBoundaries: V018EntryBoundaryRule[];
}

const rulesFile = rulesRaw as V018RulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: V018QingmaoRouteMultiRegionInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: V018QingmaoRouteMultiRegionInput): string {
  return input.sceneId || 'v018_qingmao_route_multi_region';
}

function currentLocationId(input: V018QingmaoRouteMultiRegionInput): string {
  return input.locationId || 'qingmaoshan_outer_paths';
}

function currentFactionId(input: V018QingmaoRouteMultiRegionInput): string {
  if (input.playerFactionId) return input.playerFactionId;
  const startProfileId = input.selectedStartProfileId || '';
  return START_PROFILE_FACTIONS[startProfileId] || 'qingmao_local_watch';
}

function findEscapeGoal(state?: Partial<LivingWorldState> | null): LivingPlayerGoalEntry | null {
  return (state?.playerGoals || []).find(goal => (
    goal.status !== 'failed'
    && (goal.targetRef === 'region:outside_qingmao' || goal.rationale.includes('逃离青茅山'))
  )) || null;
}

function hasKnownFact(state: Partial<LivingWorldState> | null | undefined, id: string): boolean {
  return Boolean(state?.knownFacts?.[id]);
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
  ].join('|')));
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
  ].join('|')));
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
  ].join('|')));
}

function requirementSatisfied(
  requirement: V018RouteRequirement,
  state?: Partial<LivingWorldState> | null,
): boolean {
  switch (requirement) {
    case 'escape_goal':
      return Boolean(findEscapeGoal(state));
    case 'route_preparation':
      return hasKnownFact(state, 'qingmao_escape_route_preparation_baseline')
        || consequenceMatches(state, entry => entry.actionId === 'qingmao_escape_route_preparation_probe');
    case 'cover_tracks':
      return hasKnownFact(state, 'qingmao_escape_tracks_cover_baseline')
        || consequenceMatches(state, entry => entry.actionId === 'qingmao_cover_escape_tracks_probe');
    case 'mountain_pass_candidate':
      return hasKnownFact(state, 'qingmao_mountain_pass_route_continuation_candidate')
        || consequenceMatches(state, entry => entry.actionId === 'qingmao_mountain_pass_route_continuation_probe');
    case 'supply_feeding':
      return hasKnownFact(state, 'qingmao_supply_feeding_preparation_baseline')
        || consequenceMatches(state, entry => entry.actionId === 'qingmao_supply_feeding_preparation_probe');
    case 'route_threshold_commitment':
      return hasKnownFact(state, THRESHOLD_FACT_ID)
        || consequenceMatches(state, entry => entry.actionId === THRESHOLD_ACTION_ID);
    default:
      return false;
  }
}

function buildMilestones(state?: Partial<LivingWorldState> | null): V018RouteMilestonePreview[] {
  return rulesFile.routeEntryMilestones.map(milestone => {
    const satisfied = requirementSatisfied(milestone.requirement, state);
    return {
      ...milestone,
      sourceItemIds: [...milestone.sourceItemIds],
      satisfied,
      status: satisfied ? 'done' : 'missing',
    };
  });
}

function activeRefsForPressure(
  pressure: V018RoutePressureDraft,
  state?: Partial<LivingWorldState> | null,
): string[] {
  const refs: string[] = [];
  for (const input of pressure.ledgerInputs) {
    if (input === 'factionPressure' && (state?.factionPressure || []).length > 0) {
      refs.push(`factionPressure:${state?.factionPressure?.[0]?.id}`);
    } else if (input === 'npcMemories' && (state?.npcMemories || []).length > 0) {
      refs.push(`npcMemory:${state?.npcMemories?.[0]?.id}`);
    } else if (input === 'actionConsequences' && (state?.actionConsequences || []).length > 0) {
      refs.push(`consequence:${state?.actionConsequences?.[0]?.id}`);
    } else if (input === 'localActionLedger') {
      continue;
    } else if (hasKnownFact(state, input)) {
      refs.push(`fact:${input}`);
    } else if (consequenceMatches(state, entry => entry.actionId === input || entry.followUpRefs.includes(input))) {
      refs.push(`consequence:${input}`);
    }
  }

  if (pressure.pressureAxis === 'pursuit' && pressureMatches(state, (entry, text) => (
    entry.pressureType === 'suspicion' || text.includes('pursuit') || text.includes('追')
  ))) {
    refs.push('factionPressure:pursuit_or_suspicion');
  }
  if (pressure.pressureAxis === 'identity' && memoryMatches(state, (_entry, text) => (
    text.includes('身份') || text.includes('遮掩') || text.includes('public')
  ))) {
    refs.push('npcMemory:identity_or_cover_trace');
  }

  return unique(refs);
}

function buildPressurePreviews(state?: Partial<LivingWorldState> | null): V018RoutePressurePreview[] {
  return rulesFile.routePressureDrafts.map(pressure => {
    const activationRefs = activeRefsForPressure(pressure, state);
    return {
      ...pressure,
      ledgerInputs: [...pressure.ledgerInputs],
      sourceItemIds: [...pressure.sourceItemIds],
      blockedEscalations: [...pressure.blockedEscalations],
      active: activationRefs.length > 0,
      activationRefs,
    };
  });
}

function entryPrerequisiteSatisfied(
  prerequisite: string,
  overview: Pick<V018RouteMultiRegionOverview, 'milestones' | 'pressurePreviews'>,
  state?: Partial<LivingWorldState> | null,
): boolean {
  switch (prerequisite) {
    case 'market_window':
      return hasKnownFact(state, 'qingmao_market_window_candidate_baseline');
    case 'caravan_guarantee_pressure':
      return overview.pressurePreviews.some(item => item.pressureAxis === 'caravan_guarantee' && item.active);
    case 'public_reason':
      return requirementSatisfied('cover_tracks', state);
    case 'route_threshold_commitment':
      return requirementSatisfied('route_threshold_commitment', state);
    case 'supply_pressure_reviewed':
      return overview.pressurePreviews.some(item => item.pressureAxis === 'supply' && item.active);
    case 'identity_pressure_reviewed':
      return overview.pressurePreviews.some(item => item.pressureAxis === 'identity' && item.active);
    case 'candidate_continuation':
      return hasKnownFact(state, CONTINUATION_FACT_ID)
        || consequenceMatches(state, entry => entry.actionId === CONTINUATION_ACTION_ID);
    case 'caravan_or_market_context':
      return hasKnownFact(state, 'qingmao_market_window_candidate_baseline')
        || overview.pressurePreviews.some(item => item.pressureAxis === 'caravan_guarantee' && item.active);
    case 'public_entry_reason':
      return requirementSatisfied('cover_tracks', state)
        || hasKnownFact(state, PRESSURE_FACT_ID);
    default:
      return false;
  }
}

function buildEntryBoundaries(
  state: Partial<LivingWorldState> | null | undefined,
  milestones: V018RouteMilestonePreview[],
  pressurePreviews: V018RoutePressurePreview[],
): V018EntryBoundaryPreview[] {
  const overviewLite = { milestones, pressurePreviews };
  return rulesFile.entryBoundaries.map(entry => {
    const satisfiedPrerequisites = entry.prerequisites.filter(item => entryPrerequisiteSatisfied(item, overviewLite, state));
    const missingPrerequisites = entry.prerequisites.filter(item => !satisfiedPrerequisites.includes(item));
    return {
      ...entry,
      prerequisites: [...entry.prerequisites],
      allowedNextSteps: [...entry.allowedNextSteps],
      blockedUpgrades: [...entry.blockedUpgrades],
      sourceItemIds: [...entry.sourceItemIds],
      status: missingPrerequisites.length === 0 ? 'visible_boundary' : 'needs_context',
      satisfiedPrerequisites,
      missingPrerequisites,
    };
  });
}

function stageFromMilestones(
  state: Partial<LivingWorldState> | null | undefined,
  milestones: V018RouteMilestonePreview[],
): V018RouteStage {
  if (hasKnownFact(state, CONTINUATION_FACT_ID)) return 'candidate_continuation';
  if (hasKnownFact(state, THRESHOLD_FACT_ID)) return 'commitment_preview';
  const required = ['escape_goal', 'route_preparation', 'cover_tracks', 'mountain_pass_candidate', 'supply_feeding'];
  const ready = required.every(requirement => milestones.some(milestone => (
    milestone.requirement === requirement && milestone.satisfied
  )));
  if (ready) return 'threshold_ready';
  if (milestones.some(milestone => milestone.satisfied)) return 'candidate';
  return 'blocked';
}

function stageLabel(stage: V018RouteStage): string {
  if (stage === 'candidate_continuation') return '候选承接已形成';
  if (stage === 'commitment_preview') return '承诺前门槛已记录';
  if (stage === 'threshold_ready') return '门槛可确认';
  if (stage === 'candidate') return '候选准备中';
  return '尚未形成路线';
}

function nextStep(stage: V018RouteStage): string {
  if (stage === 'candidate_continuation') return '查看南疆低阶区域事实、压力回流和入口边界；仍不进入正式地点。';
  if (stage === 'commitment_preview') return '可以做候选承接第一刀，展示低阶区域和入口边界，但不写 route_entered。';
  if (stage === 'threshold_ready') return '可以确认离山承诺前门槛；这一步仍不进入新地点。';
  if (stage === 'candidate') return '继续补路线准备、遮掩痕迹、山路候选和补给喂养缺口。';
  return '先记录离开青茅山长期目标，再按既有行动链准备路线。';
}

function buildVisibleSourceRefs(
  state: Partial<LivingWorldState> | null | undefined,
  milestones: V018RouteMilestonePreview[],
): string[] {
  const goal = findEscapeGoal(state);
  return unique([
    goal ? `goal:${goal.id}` : '',
    ...milestones.filter(item => item.satisfied).map(item => `milestone:${item.id}`),
    ...Object.keys(state?.knownFacts || {}).map(id => `fact:${id}`),
    ...(state?.actionConsequences || []).map(entry => `consequence:${entry.id}`),
    ...rulesFile.sourceReview.intakeReviews.map(ref => `review:${ref}`),
    ...rulesFile.sourceReview.sourcePackages.map(ref => `mirofish-pack:${ref}`),
  ]);
}

export function buildV018QingmaoRouteMultiRegionOverview(
  input: Pick<V018QingmaoRouteMultiRegionInput, 'livingWorldState'> = {},
): V018RouteMultiRegionOverview {
  const milestones = buildMilestones(input.livingWorldState);
  const pressurePreviews = buildPressurePreviews(input.livingWorldState)
    .filter(item => !item.sourceItemIds.includes(QUARANTINED_ITEM_ID));
  const entryBoundaries = buildEntryBoundaries(input.livingWorldState, milestones, pressurePreviews);
  const stage = stageFromMilestones(input.livingWorldState, milestones);
  const rejectedReasons = milestones
    .filter(item => !item.satisfied && item.requirement !== 'route_threshold_commitment')
    .map(item => `missing:${item.requirement}`);

  return {
    status: 'read_only_preview',
    routeId: TARGET_ROUTE_ID,
    stage,
    stageLabel: stageLabel(stage),
    publicSummary: 'v0.18 只把青茅离山后的低阶路线整理成门槛、候选承接、区域事实、压力和入口边界，不写正式路线/地点状态。',
    nextStep: nextStep(stage),
    milestones,
    regionFacts: rulesFile.regionFactDrafts.map(fact => ({
      ...fact,
      sourceItemIds: [...fact.sourceItemIds],
      blockedImplications: [...fact.blockedImplications],
    })),
    pressurePreviews,
    entryBoundaries,
    visibleSourceRefs: buildVisibleSourceRefs(input.livingWorldState, milestones),
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    quarantinedItemIds: [...rulesFile.boundaries.quarantinedItemIds],
    rejectedReasons: stage === 'blocked' || stage === 'candidate' ? rejectedReasons : [],
    statePatchApplied: false,
  };
}

function blockedReasonsForThreshold(overview: V018RouteMultiRegionOverview): string[] {
  return unique([
    overview.milestones.find(item => item.requirement === 'escape_goal')?.satisfied ? '' : 'missing_escape_goal',
    overview.milestones.find(item => item.requirement === 'route_preparation')?.satisfied ? '' : 'missing_route_preparation',
    overview.milestones.find(item => item.requirement === 'cover_tracks')?.satisfied ? '' : 'missing_cover_tracks',
    overview.milestones.find(item => item.requirement === 'mountain_pass_candidate')?.satisfied ? '' : 'missing_mountain_pass_candidate',
    overview.milestones.find(item => item.requirement === 'supply_feeding')?.satisfied ? '' : 'missing_supply_feeding',
  ]);
}

function buildActionCandidate(input: V018QingmaoRouteMultiRegionInput, options: {
  actionId: string;
  sourceId: string;
  title: string;
  summary: string;
  blockers: string[];
  tags: string[];
  risk?: 'low' | 'medium' | 'high';
}): WorldActionCandidate {
  return createWorldActionCandidate({
    id: options.actionId,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: options.sourceId,
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: options.title,
    summary: options.summary,
    risk: options.risk || 'medium',
    apCost: 0,
    blockers: options.blockers,
    warnings: [
      '不写 route_entered。',
      '不开放新地点或完整南疆地图。',
      '不改变阵营、声望、任务或 NPC 生死。',
      '不发放材料、元石、蛊虫、蛊方或路线奖励。',
    ],
    tags: options.tags,
    metadata: {
      routeId: TARGET_ROUTE_ID,
      regionId: REGION_ID,
      saveFormatImpact: 'none',
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    },
  });
}

function blockedActionResult(
  input: V018QingmaoRouteMultiRegionInput,
  overview: V018RouteMultiRegionOverview,
  candidate: WorldActionCandidate,
  rejectedReasons: string[],
  message: string,
  summary: string,
): V018QingmaoRouteActionResolution {
  const turn = currentTurn(input);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: 'blocked',
    chargeAp: false,
    metadata: {
      routeId: TARGET_ROUTE_ID,
      visibleSourceRefs: overview.visibleSourceRefs,
    },
  });
  const resolution = createWorldActionResolution({
    departure,
    status: 'blocked',
    summary,
    blockedReasons: rejectedReasons,
    rewardPolicy: 'none',
    metadata: {
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v018_qingmao_route_multi_region',
  });
  const narrativeReturnContext = buildNarrativeReturnContext({
    sceneId: candidate.sceneId,
    turn,
    ledgerEntries: [ledger],
    resolutions: [resolution],
  });

  return {
    success: false,
    blocked: true,
    message,
    publicSummary: resolution.summary,
    actionId: candidate.id,
    routeId: TARGET_ROUTE_ID,
    overview,
    visibleSourceRefs: overview.visibleSourceRefs,
    rejectedReasons,
    forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    knownFacts: [],
    factionPressure: [],
    npcMemories: [],
    playerGoals: [],
    actionConsequences: [],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    statePatchApplied: false,
  };
}

function updatedEscapeGoal(
  state: Partial<LivingWorldState> | null | undefined,
  turn: number,
  rationale: string,
  nextStepHints: string[],
  blockedByRefIds: string[],
): LivingPlayerGoalEntry[] {
  const goal = findEscapeGoal(state);
  if (!goal) return [];
  return [{
    ...goal,
    status: 'deferred',
    lastUpdatedTurn: turn,
    rationale,
    nextStepHints: unique([
      ...nextStepHints,
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      ...blockedByRefIds,
      ...goal.blockedByRefIds,
    ]),
  }];
}

export function resolveV018QingmaoRouteEntryThresholdAction(
  input: V018QingmaoRouteMultiRegionInput = {},
): V018QingmaoRouteActionResolution {
  const turn = currentTurn(input);
  const overview = buildV018QingmaoRouteMultiRegionOverview(input);
  const rejectedReasons = blockedReasonsForThreshold(overview);
  const candidate = buildActionCandidate(input, {
    actionId: THRESHOLD_ACTION_ID,
    sourceId: 'v018:route_entry_threshold',
    title: '确认离山承诺前门槛',
    summary: '把离山目标、路线准备、遮掩痕迹、山路候选和补给缺口组合成承诺前门槛；仍不进入新地点。',
    blockers: rejectedReasons,
    tags: ['v0.18.0-b1', 'route_entry_threshold', 'candidate_only'],
  });

  if (rejectedReasons.length > 0) {
    return blockedActionResult(
      input,
      overview,
      candidate,
      rejectedReasons,
      '请先补齐离山目标、路线准备、遮掩、山路候选和补给缺口，再确认 v0.18 路线门槛。',
      '离山承诺前门槛被阻断：缺少关键前置，当前不写路线状态、地点、奖励或阵营。',
    );
  }

  const factionId = currentFactionId(input);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: 'local_resolution',
    chargeAp: false,
    metadata: {
      routeId: TARGET_ROUTE_ID,
      visibleSourceRefs: overview.visibleSourceRefs,
    },
  });
  const knownFact: PlayerKnownFact = {
    id: THRESHOLD_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '离山承诺前门槛已确认：目标、路线准备、遮掩、山路候选和补给缺口可被一起解释；当前仍未写 route_entered 或新地点。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.18.0-b1', 'route_entry_threshold', TARGET_ROUTE_ID],
  };
  const factionPressure: LivingFactionPressureEntry[] = [
    {
      id: 'faction_pressure_v018_route_threshold_window',
      factionId: 'southern_border_low_rank_route',
      pressureType: 'opportunity',
      delta: 1,
      reason: '离山承诺前门槛已形成，可进入候选承接和区域事实展示；这不是正式地点进入。',
      turn,
      visibility: 'player_visible',
    },
    {
      id: `faction_pressure_v018_route_threshold_${factionId}_watch`,
      factionId,
      pressureType: 'suspicion',
      delta: 1,
      reason: '目标、补给和遮掩痕迹汇合后，本地势力更容易注意到离山意图；当前只记录轻量压力。',
      turn,
      visibility: 'player_visible',
    },
  ];
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_v018_route_threshold_outer_trace',
    npcId: 'qingmao_outer_watch',
    turn,
    regionId: REGION_ID,
    actionId: THRESHOLD_ACTION_ID,
    publicSummary: '外圈耳目只看到目标、补给和行动节奏开始汇合，尚不足以证明你已离开青茅山。',
    privateRefId: null,
    attitudeDelta: -1,
    weight: 3,
    tags: ['v0.18.0-b1', 'route_threshold', 'public_route_trace'],
    expiresTurn: null,
  };
  const playerGoals = updatedEscapeGoal(
    input.livingWorldState,
    turn,
    '离开青茅山已进入 v0.18 承诺前门槛：路线、遮掩、补给和追索压力可以一起解释，但仍未写 route_entered 或新地点。',
    [
      'v018:route_threshold_commitment',
      'v018:candidate_continuation',
      'v018:pressure_backflow',
      'gate:no_route_entered',
    ],
    [
      'gate:no_route_entered',
      'gate:no_location_unlock',
      'gate:no_faction_transfer',
      'gate:no_reward',
    ],
  );
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '离山承诺前门槛已确认：路线可以继续承接为候选，但没有正式进入新地点。',
    localFacts: [
      knownFact.summary,
      'candidate/commitment/route_entered 已区分：本阶段只写 commitment preview。',
      ...rulesFile.boundaries.visibleBoundaryLines.slice(0, 3),
    ],
    risks: unique([
      'route_threshold_only',
      'supply_gap_still_visible',
      'pursuit_attention_not_settled',
      'identity_pressure_not_resolved',
    ]),
    rewardPolicy: 'none',
    metadata: {
      routeId: TARGET_ROUTE_ID,
      milestoneIds: overview.milestones.map(item => item.id),
      visibleSourceRefs: overview.visibleSourceRefs,
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v018_qingmao_route_entry_threshold',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: THRESHOLD_CONSEQUENCE_ID,
    actionId: THRESHOLD_ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: '离山承诺前门槛已记录；当前只是候选承接的前门，不是 route_entered 或地点解锁。',
    effectRefs: [
      THRESHOLD_FACT_ID,
      ...factionPressure.map(entry => entry.id),
      npcMemory.id,
    ],
    followUpRefs: [
      'v018:candidate_continuation',
      'v018:region_fact_panel',
      'v018:route_pressure_backflow',
      'gate:no_route_entered',
      'gate:no_location_unlock',
      'gate:no_faction_transfer',
      'gate:no_reward',
    ],
  };
  const narrativeReturnContext = buildNarrativeReturnContext({
    sceneId: candidate.sceneId,
    turn,
    ledgerEntries: [ledger],
    resolutions: [resolution],
  });

  return {
    success: true,
    blocked: false,
    message: '已确认 v0.18 离山门槛：形成承诺前门槛，但没有写 route_entered 或新地点。',
    publicSummary: resolution.summary,
    actionId: THRESHOLD_ACTION_ID,
    routeId: TARGET_ROUTE_ID,
    overview,
    visibleSourceRefs: overview.visibleSourceRefs,
    rejectedReasons,
    forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    knownFacts: [knownFact],
    factionPressure,
    npcMemories: [npcMemory],
    playerGoals,
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    statePatchApplied: false,
  };
}

export function resolveV018QingmaoCandidateContinuationAction(
  input: V018QingmaoRouteMultiRegionInput = {},
): V018QingmaoRouteActionResolution {
  const turn = currentTurn(input);
  const overview = buildV018QingmaoRouteMultiRegionOverview(input);
  const rejectedReasons = requirementSatisfied('route_threshold_commitment', input.livingWorldState)
    ? []
    : ['missing_route_threshold_commitment'];
  const candidate = buildActionCandidate(input, {
    actionId: CONTINUATION_ACTION_ID,
    sourceId: 'v018:candidate_continuation',
    title: '承接低阶南疆路线候选',
    summary: '把 v0.18 门槛承接为南疆低阶路线候选视图；展示区域事实、压力和入口边界，不写正式路线状态。',
    blockers: rejectedReasons,
    tags: ['v0.18.0-b2', 'candidate_continuation', 'region_fact_panel'],
  });

  if (rejectedReasons.length > 0) {
    return blockedActionResult(
      input,
      overview,
      candidate,
      rejectedReasons,
      '请先确认 v0.18 离山承诺前门槛，再做候选承接。',
      '南疆低阶路线候选承接被阻断：缺少门槛事实，当前不写 route_entered。',
    );
  }

  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: 'local_resolution',
    chargeAp: false,
    metadata: {
      routeId: TARGET_ROUTE_ID,
      visibleSourceRefs: overview.visibleSourceRefs,
    },
  });
  const publicFacts = overview.regionFacts.slice(0, 5);
  const knownFact: PlayerKnownFact = {
    id: CONTINUATION_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '南疆低阶路线已承接为候选视图：公开区域事实、路线压力和外缘入口可见；当前仍不写 route_entered、location_unlock 或完整地图。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.18.0-b2', 'candidate_continuation', TARGET_ROUTE_ID],
  };
  const playerGoals = updatedEscapeGoal(
    input.livingWorldState,
    turn,
    '青茅离开路线已承接到南疆低阶候选视图；玩家可查看区域事实、入口边界和压力回流，但仍未正式进入新地点。',
    [
      'v018:region_fact_panel',
      'v018:entry_boundaries',
      'v018:pressure_backflow',
      'gate:no_full_map',
    ],
    [
      'gate:no_route_entered',
      'gate:no_location_unlock',
      'gate:no_full_shang_clan_city',
      'gate:no_formal_trade',
    ],
  );
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '南疆低阶路线候选视图已承接：可见区域事实和入口边界，但没有正式进入路线状态。',
    localFacts: [
      knownFact.summary,
      ...publicFacts.map(fact => `${fact.title}：${fact.summary}`),
    ],
    risks: unique([
      'candidate_continuation_only',
      'full_map_deferred',
      'shang_outer_only',
      'deepseek_no_route_authority',
    ]),
    rewardPolicy: 'none',
    metadata: {
      routeId: TARGET_ROUTE_ID,
      regionFactIds: publicFacts.map(fact => fact.id),
      entryBoundaryIds: overview.entryBoundaries.map(entry => entry.id),
      visibleSourceRefs: overview.visibleSourceRefs,
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v018_qingmao_candidate_continuation',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONTINUATION_CONSEQUENCE_ID,
    actionId: CONTINUATION_ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: '南疆低阶路线候选视图已承接：公开事实和入口边界进入账本，但没有路线/地点持久状态。',
    effectRefs: [
      CONTINUATION_FACT_ID,
      ...publicFacts.map(fact => fact.id),
    ],
    followUpRefs: [
      'v018:pressure_backflow',
      'v018:entry:caravan_outer',
      'v018:entry:rogue_survival',
      'v018:entry:shang_outer',
      'gate:no_route_entered',
      'gate:no_location_unlock',
      'gate:no_full_map',
    ],
  };
  const narrativeReturnContext = buildNarrativeReturnContext({
    sceneId: candidate.sceneId,
    turn,
    ledgerEntries: [ledger],
    resolutions: [resolution],
  });

  return {
    success: true,
    blocked: false,
    message: '已承接南疆低阶路线候选视图：显示区域事实和入口边界，不写 route_entered。',
    publicSummary: resolution.summary,
    actionId: CONTINUATION_ACTION_ID,
    routeId: TARGET_ROUTE_ID,
    overview,
    visibleSourceRefs: overview.visibleSourceRefs,
    rejectedReasons,
    forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    knownFacts: [knownFact],
    factionPressure: [],
    npcMemories: [],
    playerGoals,
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    statePatchApplied: false,
  };
}

export function resolveV018QingmaoPressureBackflowAction(
  input: V018QingmaoRouteMultiRegionInput = {},
): V018QingmaoRouteActionResolution {
  const turn = currentTurn(input);
  const overview = buildV018QingmaoRouteMultiRegionOverview(input);
  const rejectedReasons = requirementSatisfied('route_threshold_commitment', input.livingWorldState)
    ? []
    : ['missing_route_threshold_commitment'];
  const candidate = buildActionCandidate(input, {
    actionId: PRESSURE_ACTION_ID,
    sourceId: 'v018:pressure_backflow',
    title: '回流补给/追索/身份压力',
    summary: '读取前期账本，把补给、追索、身份、商队担保和 NPC 公开记忆回流到路线压力；不写正式通缉或阵营。',
    blockers: rejectedReasons,
    tags: ['v0.18.0-b4', 'pressure_backflow', 'candidate_only'],
    risk: 'high',
  });

  if (rejectedReasons.length > 0) {
    return blockedActionResult(
      input,
      overview,
      candidate,
      rejectedReasons,
      '请先确认 v0.18 离山承诺前门槛，再回流路线压力。',
      '路线压力回流被阻断：缺少离山门槛事实，当前不写压力账本。',
    );
  }

  const factionId = currentFactionId(input);
  const activePressures = overview.pressurePreviews.filter(item => item.active);
  const selectedPressures = activePressures.length > 0
    ? activePressures
    : overview.pressurePreviews.filter(item => item.pressureAxis === 'supply' || item.pressureAxis === 'pursuit' || item.pressureAxis === 'identity');
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: 'local_resolution',
    chargeAp: false,
    metadata: {
      routeId: TARGET_ROUTE_ID,
      visibleSourceRefs: overview.visibleSourceRefs,
      pressureIds: selectedPressures.map(item => item.id),
    },
  });
  const knownFact: PlayerKnownFact = {
    id: PRESSURE_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '前期账本已回流为路线压力：补给、追索、身份、商队担保和公开记忆只影响下一步解释，不生成通缉、招揽、阵营或 NPC 结果。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.18.0-b4', 'pressure_backflow', TARGET_ROUTE_ID],
  };
  const factionPressure: LivingFactionPressureEntry[] = selectedPressures.slice(0, 5).map((pressure, index) => ({
    id: `faction_pressure_${pressure.id}`,
    factionId: pressure.pressureAxis === 'caravan_guarantee'
      ? 'southern_border_caravan_window'
      : pressure.pressureAxis === 'faction_residual'
        ? factionId
        : 'southern_border_low_rank_route',
    pressureType: pressure.pressureAxis === 'caravan_guarantee' ? 'opportunity' : 'suspicion',
    delta: pressure.severity === 'high' ? 2 : pressure.severity === 'medium' ? 1 : 0,
    reason: `${pressure.publicReason}（v0.18 压力回流 ${index + 1}，不升级为正式声望/通缉/阵营）。`,
    turn,
    visibility: 'player_visible',
  }));
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_v018_route_pressure_public_trace',
    npcId: 'southern_border_route_public_observers',
    turn,
    regionId: REGION_ID,
    actionId: PRESSURE_ACTION_ID,
    publicSummary: '沿途公开观察者只记得你的补给、行踪、询问和身份口径压力，不知道隐藏事实，也不形成生死/抓捕结论。',
    privateRefId: null,
    attitudeDelta: -1,
    weight: 3,
    tags: ['v0.18.0-b4', 'route_pressure', 'public_memory'],
    expiresTurn: null,
  };
  const playerGoals = updatedEscapeGoal(
    input.livingWorldState,
    turn,
    '前期账本已回流为南疆低阶路线压力：补给、追索、身份和商队担保会影响下一步，但仍不结算地点、阵营、奖励或 NPC 命运。',
    [
      'v018:pressure_backflow_done',
      'v018:entry_boundaries',
      'v018:caravan_or_rogue_or_shang_outer',
    ],
    [
      'gate:no_formal_warrant',
      'gate:no_faction_transfer',
      'gate:no_npc_life_result',
      'gate:no_reward',
    ],
  );
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '路线压力已从前期账本回流：补给、追索、身份和商队担保变得可见，但不形成正式结果。',
    localFacts: [
      knownFact.summary,
      ...selectedPressures.slice(0, 6).map(item => `${item.pressureAxis}：${item.publicReason}`),
    ],
    risks: unique([
      ...selectedPressures.map(item => `pressure:${item.pressureAxis}`),
      'formal_warrant_blocked',
      'npc_life_result_blocked',
      'deepseek_no_pressure_authority',
    ]),
    rewardPolicy: 'none',
    metadata: {
      routeId: TARGET_ROUTE_ID,
      pressureIds: selectedPressures.map(item => item.id),
      visibleSourceRefs: overview.visibleSourceRefs,
      quarantinedItemIds: overview.quarantinedItemIds,
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v018_qingmao_pressure_backflow',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: PRESSURE_CONSEQUENCE_ID,
    actionId: PRESSURE_ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: '前期行动账本已影响南疆低阶路线压力；当前只写压力说明，不写正式通缉、阵营、奖励或 NPC 结论。',
    effectRefs: [
      PRESSURE_FACT_ID,
      ...factionPressure.map(entry => entry.id),
      npcMemory.id,
    ],
    followUpRefs: unique([
      ...selectedPressures.map(item => `route_pressure:${item.id}`),
      'v018:entry:caravan_outer',
      'v018:entry:rogue_survival',
      'v018:entry:shang_outer',
      'gate:no_formal_warrant',
      'gate:no_faction_transfer',
      'gate:no_npc_life_result',
      'gate:no_reward',
    ]),
  };
  const narrativeReturnContext = buildNarrativeReturnContext({
    sceneId: candidate.sceneId,
    turn,
    ledgerEntries: [ledger],
    resolutions: [resolution],
  });

  return {
    success: true,
    blocked: false,
    message: '已回流路线压力：补给、追索、身份和商队担保可见，但不写通缉、阵营、奖励或 NPC 结果。',
    publicSummary: resolution.summary,
    actionId: PRESSURE_ACTION_ID,
    routeId: TARGET_ROUTE_ID,
    overview,
    visibleSourceRefs: overview.visibleSourceRefs,
    rejectedReasons,
    forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    knownFacts: [knownFact],
    factionPressure,
    npcMemories: [npcMemory],
    playerGoals,
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    statePatchApplied: false,
  };
}

export function listV018RegionFactDrafts(): V018RegionFactDraft[] {
  return rulesFile.regionFactDrafts.map(fact => ({
    ...fact,
    sourceItemIds: [...fact.sourceItemIds],
    blockedImplications: [...fact.blockedImplications],
  }));
}

export function listV018EntryBoundaryRules(): V018EntryBoundaryRule[] {
  return rulesFile.entryBoundaries.map(entry => ({
    ...entry,
    prerequisites: [...entry.prerequisites],
    allowedNextSteps: [...entry.allowedNextSteps],
    blockedUpgrades: [...entry.blockedUpgrades],
    sourceItemIds: [...entry.sourceItemIds],
  }));
}
