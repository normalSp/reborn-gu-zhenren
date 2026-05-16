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
  LivingPlayerGoalEntry,
  LivingWorldState,
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  PlayerKnownFact,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
} from '../types';
import {
  buildQingmaoRouteSupplyPursuitPlan,
  type QingmaoRouteSupplyPursuitPlan,
} from './v012-qingmao-route-supply-pursuit';

const ACTION_ID = 'qingmao_escape_route_preparation_probe';
const KNOWN_FACT_ID = 'qingmao_escape_route_preparation_baseline';
const CONSEQUENCE_ID = 'consequence_qingmao_escape_route_preparation_probe';

const START_PROFILE_FACTIONS: Record<string, string> = {
  start_qingmaoshan_guyue: 'guyue_shanzhai',
  start_qingmaoshan_xiongjia: 'xiongjia_zhai',
  start_qingmaoshan_baijia: 'baijia_zhai',
  start_qingmaoshan_shangjia_caravan: 'shangjia',
  start_qingmaoshan_wujia_branch: 'wujia',
  start_qingmaoshan_tiejia_patrol: 'tiejia',
  start_qingmaoshan_sanxiu: 'sanxiu',
};

export interface QingmaoEscapeRoutePreparationInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  goalId?: string | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
}

export interface QingmaoEscapeRoutePreparationResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  knownFacts: PlayerKnownFact[];
  factionPressure: LivingFactionPressureEntry[];
  playerGoals: LivingPlayerGoalEntry[];
  actionConsequences: LivingActionConsequenceEntry[];
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
  routeSupplyPursuitPlan: QingmaoRouteSupplyPursuitPlan;
  statePatchApplied: false;
}

function currentTurn(input: QingmaoEscapeRoutePreparationInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoEscapeRoutePreparationInput): string {
  return input.sceneId || 'v011_qingmao_escape_route_preparation';
}

function currentLocationId(input: QingmaoEscapeRoutePreparationInput): string {
  return input.locationId || 'qingmaoshan_outer_paths';
}

function currentFactionId(input: QingmaoEscapeRoutePreparationInput): string {
  if (input.playerFactionId) return input.playerFactionId;
  const startProfileId = input.selectedStartProfileId || '';
  return START_PROFILE_FACTIONS[startProfileId] || 'qingmao_local_watch';
}

function findEscapeGoal(input: QingmaoEscapeRoutePreparationInput): LivingPlayerGoalEntry | null {
  const goals = input.livingWorldState?.playerGoals || [];
  if (input.goalId) {
    const byId = goals.find(goal => goal.id === input.goalId);
    if (byId?.targetRef === 'region:outside_qingmao') return byId;
  }
  return goals.find(goal => goal.targetRef === 'region:outside_qingmao') || null;
}

function visibleSourceRefs(input: QingmaoEscapeRoutePreparationInput, goal: LivingPlayerGoalEntry | null): string[] {
  const known = new Set(Object.keys(input.livingWorldState?.knownFacts || {}));
  return [
    goal ? `goal:${goal.id}` : '',
    known.has('qingmao_three_clans_layout') ? 'fact:qingmao_three_clans_layout' : '',
  ].filter(Boolean);
}

function buildCandidate(
  input: QingmaoEscapeRoutePreparationInput,
  blockers: string[],
  plan: QingmaoRouteSupplyPursuitPlan,
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'goal:region:outside_qingmao',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '逃离青茅山路线准备',
    summary: `${plan.publicSummary} 当前不离开青茅山。`,
    risk: 'medium',
    apCost: 0,
    blockers,
    warnings: [
      '不开放新地域。',
      '不传送到青茅山外。',
      '不判定逃离成功。',
      '不规避追踪或身份暴露风险。',
      ...plan.blockedOutcomes.slice(0, 2),
    ],
    tags: ['v0.12.0-b1', 'qingmao_living_world', 'escape_route_preparation', 'route_supply_pursuit'],
    metadata: {
      saveFormatImpact: 'none',
      routeCandidateIds: plan.routeCandidates.map(route => route.id),
      supplyRequirementIds: plan.supplyRequirements.map(supply => supply.id),
      pursuitTriggerIds: plan.pursuitTriggers.map(trigger => trigger.id),
      intakeReviewRef: plan.intakeReviewRef,
      forbiddenUpgrades: plan.forbiddenWrites,
    },
  });
}

function buildUpdatedGoal(
  goal: LivingPlayerGoalEntry,
  turn: number,
  plan: QingmaoRouteSupplyPursuitPlan,
): LivingPlayerGoalEntry {
  return {
    ...goal,
    status: 'deferred',
    lastUpdatedTurn: turn,
    rationale: `逃离青茅山仍是长期目标；本次只完成 route/supply/pursuit 准备第一步。${plan.publicSummary}`,
    nextStepHints: [
      ...plan.routeCandidates.slice(0, 2).map(route => `route:${route.id}`),
      ...plan.supplyRequirements.slice(0, 1).map(supply => `supply:${supply.id}`),
      ...plan.pursuitTriggers.slice(0, 1).map(trigger => `pursuit:${trigger.id}`),
      'identity:cover_story',
    ],
    blockedByRefIds: [
      ...plan.routeCandidates.map(route => `route:${route.id}`),
      ...plan.supplyRequirements.map(supply => `supply:${supply.id}`),
      ...plan.pursuitTriggers.map(trigger => `pursuit:${trigger.id}`),
    ],
  };
}

export function resolveQingmaoEscapeRoutePreparationAction(
  input: QingmaoEscapeRoutePreparationInput = {},
): QingmaoEscapeRoutePreparationResolution {
  const turn = currentTurn(input);
  const goal = findEscapeGoal(input);
  const rejectedReasons = goal ? [] : ['missing_escape_goal'];
  const plan = buildQingmaoRouteSupplyPursuitPlan();
  const sourceRefs = [...new Set([
    ...visibleSourceRefs(input, goal),
    ...plan.visibleSourceRefs,
  ])];
  const candidate = buildCandidate(input, rejectedReasons, plan);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: rejectedReasons.length > 0 ? 'blocked' : 'local_resolution',
    chargeAp: false,
    metadata: {
      visibleSourceRefs: sourceRefs,
    },
  });
  const forbiddenUpgrades = [
    ...new Set([
      ...plan.forbiddenWrites,
      'location_unlock',
      'teleport',
      'escape_success',
      'reward',
      'hidden_fact_reveal',
      'canon_anchor_change',
    ]),
  ];

  if (!goal) {
    const resolution = createWorldActionResolution({
      departure,
      status: 'blocked',
      summary: '逃离青茅山路线准备被阻断：玩家尚未确认逃离青茅山目标。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v011_qingmao_escape_route_preparation',
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
      message: '请先把“逃离青茅山”记录为自由目标，再准备路线。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      visibleSourceRefs: sourceRefs,
      rejectedReasons,
      forbiddenUpgrades,
      knownFacts: [],
      factionPressure: [],
      playerGoals: [],
      actionConsequences: [],
      worldActionCandidate: candidate,
      worldActionDeparture: departure,
      worldActionResolution: resolution,
      worldActionLedgerEntry: ledger,
      narrativeReturnContext,
      routeSupplyPursuitPlan: plan,
      statePatchApplied: false,
    };
  }

  const fact: PlayerKnownFact = {
    id: KNOWN_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: `逃离青茅山的第一轮准备只确认路线、补给、身份遮掩和追踪风险四类前置；${plan.publicSummary} 当前没有离开青茅山。`,
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.12.0-b1', 'qingmao_escape_route', 'route_supply_pursuit'],
  };
  const pressure: LivingFactionPressureEntry = {
    id: `faction_pressure_qingmao_escape_route_${currentFactionId(input)}_pursuit_risk`,
    factionId: currentFactionId(input),
    pressureType: 'suspicion',
    delta: 2,
    reason: `离山路线准备会留下被本地势力察觉或追踪的风险；当前追击触发包括：${plan.pursuitTriggers.map(trigger => trigger.title).join('、')}。`,
    turn,
    visibility: 'player_visible',
  };
  const updatedGoal = buildUpdatedGoal(goal, turn, plan);
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: `你完成了逃离青茅山的路线准备第一步：${plan.publicSummary} 身份遮掩和追踪风险仍需后续行动处理。`,
    effectRefs: [fact.id, pressure.id, updatedGoal.id],
    followUpRefs: [
      ...plan.routeCandidates.slice(0, 2).map(route => `route:${route.id}`),
      ...plan.supplyRequirements.slice(0, 2).map(supply => `supply:${supply.id}`),
      ...plan.pursuitTriggers.slice(0, 2).map(trigger => `pursuit:${trigger.id}`),
      'gate:no_location_unlock',
    ],
  };
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '逃离青茅山路线准备已记录：只完成前置梳理，不开放新地域、不判定逃离成功。',
    localFacts: [
      fact.summary,
      `路线候选：${plan.routeCandidates.map(route => route.title).join('、')}。`,
      `补给缺口：${plan.supplyRequirements.map(supply => supply.title).join('、')}。`,
      `追击触发：${plan.pursuitTriggers.map(trigger => trigger.title).join('、')}。`,
      '当前行动不改变当前位置、不开放青茅山外地域、不发放奖励。',
    ],
    risks: [
      'pursuit_risk',
      'identity_exposure',
      'wilderness_risk',
      ...plan.pursuitTriggers.map(trigger => trigger.pressureType),
    ],
    rewardPolicy: 'none',
    metadata: {
      visibleSourceRefs: sourceRefs,
      forbiddenUpgrades,
      routeCandidateIds: plan.routeCandidates.map(route => route.id),
      supplyRequirementIds: plan.supplyRequirements.map(supply => supply.id),
      pursuitTriggerIds: plan.pursuitTriggers.map(trigger => trigger.id),
      intakeReviewRef: plan.intakeReviewRef,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v011_qingmao_escape_route_preparation',
  });
  const narrativeReturnContext = buildNarrativeReturnContext({
    sceneId: candidate.sceneId,
    turn,
    ledgerEntries: [ledger],
    resolutions: [resolution],
  });

  return {
    success: true,
    blocked: false,
    message: `已完成逃离青茅山路线准备第一步：${plan.publicSummary} 不开放新地域。`,
    publicSummary: consequence.publicSummary,
    actionId: ACTION_ID,
    visibleSourceRefs: sourceRefs,
    rejectedReasons: [],
    forbiddenUpgrades,
    knownFacts: [fact],
    factionPressure: [pressure],
    playerGoals: [updatedGoal],
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    routeSupplyPursuitPlan: plan,
    statePatchApplied: false,
  };
}
