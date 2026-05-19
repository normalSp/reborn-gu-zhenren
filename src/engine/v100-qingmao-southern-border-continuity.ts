import rulesRaw from '../canon/v100-qingmao-southern-border-continuity-rules.json';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import {
  buildV018QingmaoRouteMultiRegionOverview,
  type V018QingmaoRouteActionResolution,
  type V018QingmaoRouteMultiRegionInput,
} from './v018-qingmao-route-multi-region';
import type {
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingPlayerGoalEntry,
  LivingWorldState,
  PlayerKnownFact,
  WorldActionCandidate,
} from '../types';

const REGION_ID = 'qingmao_three_clans';
const ROUTE_ID = 'southern_border_low_rank_route';
const ACTION_ID = 'v100_qingmao_southern_border_continuity_acceptance_probe';
const FACT_ID = 'v100_qingmao_southern_border_continuity_acceptance';
const CONSEQUENCE_ID = 'consequence_v100_qingmao_southern_border_continuity_acceptance_probe';

export interface V100ContinuityCheckRule {
  id: string;
  label: string;
  summary: string;
  requiredRefs: string[];
  sourceItemIds: string[];
}

export interface V100ContinuityCheckPreview extends V100ContinuityCheckRule {
  satisfied: boolean;
  evidenceRefs: string[];
}

export interface V100ContinuityBoundaryRule {
  id: string;
  label: string;
  summary: string;
  allowedUse?: string[];
  sourceItemIds: string[];
}

export interface V100QingmaoSouthernBorderContinuityOverview {
  status: 'blocked' | 'release_ready_preview';
  statusLabel: string;
  publicSummary: string;
  nextStep: string;
  checks: V100ContinuityCheckPreview[];
  candidateBoundaries: V100ContinuityBoundaryRule[];
  deferredRedlines: V100ContinuityBoundaryRule[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  statePatchApplied: false;
}

interface V100RulesFile {
  sourceReview: {
    intakeReviews: string[];
    sourcePackages: string[];
    sourcePolicy: string;
  };
  boundaries: {
    forbiddenWrites: string[];
    visibleBoundaryLines: string[];
  };
  requiredContinuityChecks: V100ContinuityCheckRule[];
  candidateBoundaries: V100ContinuityBoundaryRule[];
  deferredRedlines: V100ContinuityBoundaryRule[];
}

const rulesFile = rulesRaw as V100RulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: V018QingmaoRouteMultiRegionInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: V018QingmaoRouteMultiRegionInput): string {
  return input.sceneId || 'v100_qingmao_southern_border_continuity';
}

function currentLocationId(input: V018QingmaoRouteMultiRegionInput): string {
  return input.locationId || 'qingmaoshan_outer_paths';
}

function hasKnownFact(state: Partial<LivingWorldState> | null | undefined, id: string): boolean {
  return Boolean(state?.knownFacts?.[id]);
}

function findEscapeGoal(state?: Partial<LivingWorldState> | null): LivingPlayerGoalEntry | null {
  return (state?.playerGoals || []).find(goal => (
    goal.status !== 'failed'
    && (goal.targetRef === 'region:outside_qingmao' || goal.rationale.includes('逃离青茅山') || goal.rationale.includes('南疆'))
  )) || null;
}

function refEvidence(state: Partial<LivingWorldState> | null | undefined, ref: string): string[] {
  if (ref === 'gate:hidden_ref_only') return ['gate:hidden_ref_only'];
  if (ref === 'player_goal:region:outside_qingmao') {
    const goal = findEscapeGoal(state);
    return goal ? [goal.id] : [];
  }
  if (hasKnownFact(state, ref)) return [ref];
  const consequences = state?.actionConsequences || [];
  const consequence = consequences.find(entry => (
    entry.id === ref
    || entry.actionId === ref
    || entry.effectRefs.includes(ref)
    || entry.followUpRefs.includes(ref)
  ));
  if (consequence) return [consequence.id];
  return [];
}

function buildChecks(state: Partial<LivingWorldState> | null | undefined): V100ContinuityCheckPreview[] {
  return rulesFile.requiredContinuityChecks.map(rule => {
    const evidenceRefs = unique(rule.requiredRefs.flatMap(ref => refEvidence(state, ref)));
    const satisfied = rule.id === 'v100_check_hidden_boundary'
      ? true
      : evidenceRefs.length > 0;
    return {
      ...rule,
      satisfied,
      evidenceRefs,
    };
  });
}

export function buildV100QingmaoSouthernBorderContinuityOverview(
  input: V018QingmaoRouteMultiRegionInput = {},
): V100QingmaoSouthernBorderContinuityOverview {
  const checks = buildChecks(input.livingWorldState);
  const requiredChecks = checks.filter(check => check.id !== 'v100_check_hidden_boundary');
  const ready = requiredChecks.every(check => check.satisfied);
  const visibleSourceRefs = unique([
    ...checks.flatMap(check => check.sourceItemIds),
    ...rulesFile.candidateBoundaries.flatMap(rule => rule.sourceItemIds),
  ]);

  return {
    status: ready ? 'release_ready_preview' : 'blocked',
    statusLabel: ready ? '可验收' : '需补前置',
    publicSummary: ready
      ? '青茅到南疆早期路线已具备 v1.0 连续体验候选：目标、门槛、承接和压力都可读，但仍不写正式路线/地点状态。'
      : 'v1.0 连续体验仍缺前置：需要先完成离山目标、v0.18 门槛、候选承接和压力回流。',
    nextStep: ready
      ? '可以写入 v1.0 连续体验验收事实，继续进入低阶 life loop 收束。'
      : '先在自由目标面板完成路线准备、v0.18 门槛、候选承接和压力回流。',
    checks,
    candidateBoundaries: [...rulesFile.candidateBoundaries],
    deferredRedlines: [...rulesFile.deferredRedlines],
    visibleSourceRefs,
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    statePatchApplied: false,
  };
}

function buildActionCandidate(
  input: V018QingmaoRouteMultiRegionInput,
  overview: V100QingmaoSouthernBorderContinuityOverview,
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'v100:qingmao_southern_border_continuity',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '验收 v1.0 青茅到南疆连续体验',
    summary: '把青茅离山目标、南疆早期候选、路线压力和隐藏边界合并为 v1.0 连续体验验收；不写正式路线或地点状态。',
    risk: 'medium',
    apCost: 0,
    blockers: overview.checks.filter(check => !check.satisfied).map(check => check.id),
    warnings: [
      ...rulesFile.boundaries.visibleBoundaryLines,
      '不发奖励、不转阵营、不决定 NPC 生死。',
    ],
    tags: ['v1.0.0-b1', 'continuity_acceptance', 'candidate_only'],
    metadata: {
      routeId: ROUTE_ID,
      saveFormatImpact: 'none',
      sourcePackages: rulesFile.sourceReview.sourcePackages,
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    },
  });
}

function updateEscapeGoal(
  state: Partial<LivingWorldState> | null | undefined,
  turn: number,
): LivingPlayerGoalEntry[] {
  const goal = findEscapeGoal(state);
  if (!goal) return [];
  return [{
    ...goal,
    status: 'deferred',
    lastUpdatedTurn: turn,
    rationale: 'v1.0 已把青茅到南疆早期路线识别为连续体验候选；下一步只能继续补 life loop、身份和公开路线压力，不写正式地点。',
    nextStepHints: unique([
      'v100:low_rank_life_loop',
      'v100:public_route_pressure',
      'gate:no_route_entered',
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      'gate:no_route_entered',
      'gate:no_location_unlock',
      'gate:no_faction_transfer',
      'gate:no_reward',
      ...goal.blockedByRefIds,
    ]),
  }];
}

export function resolveV100QingmaoSouthernBorderContinuityAction(
  input: V018QingmaoRouteMultiRegionInput = {},
): V018QingmaoRouteActionResolution {
  const turn = currentTurn(input);
  const overview = buildV100QingmaoSouthernBorderContinuityOverview(input);
  const v018Overview = buildV018QingmaoRouteMultiRegionOverview(input);
  const candidate = buildActionCandidate(input, overview);
  const blockedReasons = overview.checks.filter(check => !check.satisfied).map(check => check.id);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: blockedReasons.length > 0 ? 'blocked' : 'local_resolution',
    chargeAp: false,
    metadata: {
      routeId: ROUTE_ID,
      visibleSourceRefs: overview.visibleSourceRefs,
    },
  });

  if (blockedReasons.length > 0) {
    const blockedResolution = createWorldActionResolution({
      departure,
      status: 'blocked',
      summary: 'v1.0 连续体验验收被阻断：仍缺离山目标、门槛、候选承接或压力回流前置。',
      blockedReasons,
      rewardPolicy: 'none',
      metadata: {
        routeId: ROUTE_ID,
        forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
      },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution: blockedResolution,
      source: 'v100_qingmao_southern_border_continuity',
    });
    const narrativeReturnContext = buildNarrativeReturnContext({
      sceneId: candidate.sceneId,
      turn,
      ledgerEntries: [ledger],
      resolutions: [blockedResolution],
    });
    return {
      success: false,
      blocked: true,
      message: '请先补齐 v1.0 连续体验前置，再验收青茅到南疆早期路线。',
      publicSummary: blockedResolution.summary,
      actionId: ACTION_ID,
      routeId: ROUTE_ID,
      overview: v018Overview,
      visibleSourceRefs: overview.visibleSourceRefs,
      rejectedReasons: blockedReasons,
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
      knownFacts: [],
      factionPressure: [],
      npcMemories: [],
      playerGoals: [],
      actionConsequences: [],
      worldActionCandidate: candidate,
      worldActionDeparture: departure,
      worldActionResolution: blockedResolution,
      worldActionLedgerEntry: ledger,
      narrativeReturnContext,
      statePatchApplied: false,
    };
  }

  const knownFact: PlayerKnownFact = {
    id: FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: 'v1.0 青茅到南疆早期连续体验已验收为候选闭环：离山目标、路线门槛、候选承接和压力回流均可读；当前不写 route_entered、currentRoute 或新地点。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v1.0.0-b1', 'continuity_acceptance', ROUTE_ID],
  };
  const factionPressure: LivingFactionPressureEntry[] = [
    {
      id: 'faction_pressure_v100_route_release_candidate_window',
      factionId: ROUTE_ID,
      pressureType: 'opportunity',
      delta: 1,
      reason: '青茅到南疆早期路线已具备 v1.0 连续体验候选；下一步只进入低阶 life loop 与公开路线压力收束。',
      turn,
      visibility: 'player_visible',
    },
    {
      id: 'faction_pressure_v100_qingmao_residual_watch',
      factionId: REGION_ID,
      pressureType: 'suspicion',
      delta: 1,
      reason: '离山痕迹、路线门槛和压力回流已汇合；本地只记录公开怀疑，不生成通缉或追捕结果。',
      turn,
      visibility: 'player_visible',
    },
  ];
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_v100_route_public_trace',
    npcId: 'qingmao_outer_watch',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '外圈耳目只看到离山目标、公开路线和补给压力逐渐成形，不能据此决定追捕成败或关键人物命运。',
    privateRefId: null,
    attitudeDelta: -1,
    weight: 3,
    tags: ['v1.0.0-b1', 'continuity_acceptance', 'public_trace'],
    expiresTurn: null,
  };
  const playerGoals = updateEscapeGoal(input.livingWorldState, turn);
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: 'v1.0 青茅到南疆早期连续体验已验收为候选闭环；仍不开放正式路线/地点状态。',
    localFacts: [
      knownFact.summary,
      ...overview.candidateBoundaries.map(item => item.summary),
      ...rulesFile.boundaries.visibleBoundaryLines,
    ],
    risks: [
      'route_status_not_persisted',
      'location_unlock_blocked',
      'hidden_fact_protected',
      'public_copy_not_final',
    ],
    rewardPolicy: 'none',
    metadata: {
      routeId: ROUTE_ID,
      visibleSourceRefs: overview.visibleSourceRefs,
      sourcePackages: rulesFile.sourceReview.sourcePackages,
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v100_qingmao_southern_border_continuity',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: 'v1.0 连续体验验收已记录；它只证明青茅到南疆早期路线候选可读，不是正式地点进入、阵营转移或奖励结算。',
    effectRefs: [
      FACT_ID,
      ...factionPressure.map(entry => entry.id),
      npcMemory.id,
    ],
    followUpRefs: [
      'v100:low_rank_life_loop',
      'v100:free_intent_extreme_gate',
      'gate:no_route_entered',
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
    message: '已验收 v1.0 青茅到南疆早期连续体验候选；下一步进入低阶 life loop 收束。',
    publicSummary: resolution.summary,
    actionId: ACTION_ID,
    routeId: ROUTE_ID,
    overview: v018Overview,
    visibleSourceRefs: overview.visibleSourceRefs,
    rejectedReasons: [],
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

export function listV100ContinuityBoundaries(): V100ContinuityBoundaryRule[] {
  return [...rulesFile.candidateBoundaries, ...rulesFile.deferredRedlines];
}
