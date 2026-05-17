import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import {
  buildQingmaoRouteContinuationPreview,
  type QingmaoRouteConditionPreview,
} from './v014-qingmao-route-continuation';
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

const ACTION_ID = 'qingmao_mountain_pass_route_continuation_probe';
const KNOWN_FACT_ID = 'qingmao_mountain_pass_route_continuation_candidate';
const CONSEQUENCE_ID = 'consequence_qingmao_mountain_pass_route_continuation_probe';
const REGION_ID = 'qingmao_three_clans';
const ROUTE_KEY = 'mountain_pass_escape';

const START_PROFILE_FACTIONS: Record<string, string> = {
  start_qingmaoshan_guyue: 'guyue_shanzhai',
  start_qingmaoshan_xiongjia: 'xiongjia_zhai',
  start_qingmaoshan_baijia: 'baijia_zhai',
  start_qingmaoshan_shangjia_caravan: 'shangjia',
  start_qingmaoshan_wujia_branch: 'wujia',
  start_qingmaoshan_tiejia_patrol: 'tiejia',
  start_qingmaoshan_sanxiu: 'sanxiu',
};

export interface QingmaoMountainPassRouteContinuationInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
}

export interface QingmaoMountainPassRouteContinuationResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  routeKey: typeof ROUTE_KEY;
  routePreview: QingmaoRouteConditionPreview | null;
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

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: QingmaoMountainPassRouteContinuationInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoMountainPassRouteContinuationInput): string {
  return input.sceneId || 'v014_qingmao_mountain_pass_route_continuation';
}

function currentLocationId(input: QingmaoMountainPassRouteContinuationInput): string {
  return input.locationId || 'qingmaoshan_outer_paths';
}

function currentFactionId(input: QingmaoMountainPassRouteContinuationInput): string {
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

function hasRoutePrep(state?: Partial<LivingWorldState> | null): boolean {
  return Boolean(
    state?.knownFacts?.qingmao_escape_route_preparation_baseline
    || (state?.actionConsequences || []).some(entry => (
      entry.actionId === 'qingmao_escape_route_preparation_probe'
      || entry.followUpRefs.includes('route:route_qingmao_outer_night_mountain_road')
    )),
  );
}

function hasCoverTracks(state?: Partial<LivingWorldState> | null): boolean {
  return Boolean(
    state?.knownFacts?.qingmao_escape_tracks_cover_baseline
    || (state?.actionConsequences || []).some(entry => (
      entry.actionId === 'qingmao_cover_escape_tracks_probe'
      || entry.followUpRefs.includes('route:mountain_pass_escape')
    )),
  );
}

function mountainRoutePreview(state?: Partial<LivingWorldState> | null): QingmaoRouteConditionPreview | null {
  const preview = buildQingmaoRouteContinuationPreview({
    livingWorldState: state,
    intentText: '我想离开青茅山，走山路逃离路线',
  });
  return preview.previews.find(route => route.routeKey === ROUTE_KEY) || null;
}

function visibleSourceRefs(
  state: Partial<LivingWorldState> | null | undefined,
  routePreview: QingmaoRouteConditionPreview | null,
): string[] {
  const goal = findEscapeGoal(state);
  return unique([
    goal ? `goal:${goal.id}` : '',
    hasRoutePrep(state) ? 'fact:qingmao_escape_route_preparation_baseline' : '',
    hasCoverTracks(state) ? 'fact:qingmao_escape_tracks_cover_baseline' : '',
    routePreview ? `route:${routePreview.routeKey}` : '',
    ...(routePreview?.sourceRefs || []).slice(0, 4),
    'mirofish-pack:qingmao_exit_route_aftermath_pack',
    'mirofish-pack:southern_border_low_rank_route_pack',
  ]);
}

function blockedReasons(
  state: Partial<LivingWorldState> | null | undefined,
  routePreview: QingmaoRouteConditionPreview | null,
): string[] {
  return unique([
    findEscapeGoal(state) ? '' : 'missing_escape_goal',
    hasRoutePrep(state) ? '' : 'missing_route_preparation',
    hasCoverTracks(state) ? '' : 'missing_cover_tracks_context',
    routePreview && (routePreview.eligibility === 'candidate' || routePreview.eligibility === 'ready')
      ? ''
      : 'route_not_candidate',
  ]);
}

function buildCandidate(
  input: QingmaoMountainPassRouteContinuationInput,
  blockers: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'route:mountain_pass_escape',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '承接山路逃离路线',
    summary: '把已准备和遮掩过的山路逃离推进为路线承接候选；仍不判定离开青茅山成功。',
    risk: 'medium',
    apCost: 0,
    blockers,
    warnings: [
      '不进入新地点。',
      '不结算逃离成功。',
      '不改变阵营或声望。',
      '不发放补给、材料、元石、蛊虫或任务奖励。',
    ],
    tags: ['v0.14.0-b2', 'qingmao_route_continuation', ROUTE_KEY],
    metadata: {
      regionId: REGION_ID,
      routeKey: ROUTE_KEY,
      saveFormatImpact: 'none',
      forbiddenUpgrades: [
        'route_entered',
        'escape_success',
        'location_unlock',
        'faction_transfer',
        'reward',
      ],
    },
  });
}

function buildUpdatedGoal(goal: LivingPlayerGoalEntry, turn: number): LivingPlayerGoalEntry {
  return {
    ...goal,
    status: 'deferred',
    lastUpdatedTurn: turn,
    rationale: '离开青茅山已推进到山路逃离路线承接候选；当前仍未离开青茅山，补给和追踪风险仍需处理。',
    nextStepHints: unique([
      'route_continuation:mountain_pass_escape',
      'preparation:gather_travel_supply',
      'risk:pursuit_attention',
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      'gate:no_route_entered',
      'gate:no_location_unlock',
      'gap:travel_supply_gap',
      'risk:pursuit_attention',
      ...goal.blockedByRefIds,
    ]),
  };
}

export function resolveQingmaoMountainPassRouteContinuationAction(
  input: QingmaoMountainPassRouteContinuationInput = {},
): QingmaoMountainPassRouteContinuationResolution {
  const turn = currentTurn(input);
  const goal = findEscapeGoal(input.livingWorldState);
  const routePreview = mountainRoutePreview(input.livingWorldState);
  const rejectedReasons = blockedReasons(input.livingWorldState, routePreview);
  const sourceRefs = visibleSourceRefs(input.livingWorldState, routePreview);
  const candidate = buildCandidate(input, rejectedReasons);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: rejectedReasons.length > 0 ? 'blocked' : 'local_resolution',
    chargeAp: false,
    metadata: {
      regionId: REGION_ID,
      routeKey: ROUTE_KEY,
      visibleSourceRefs: sourceRefs,
    },
  });
  const forbiddenUpgrades = [
    'route_entered',
    'escape_success',
    'location_unlock',
    'region_unlock',
    'teleport',
    'faction_transfer',
    'faction_identity_change',
    'standing_delta',
    'warrant',
    'formal_recruitment',
    'formal_task',
    'reward',
    'material_reward',
    'currency_delta',
    'gu_reward',
    'recipe_unlock',
    'pursuit_success',
    'pursuit_failure',
    'npc_capture_result',
    'npc_death',
    'hidden_fact_reveal',
    'canon_anchor_change',
    'deepseek_authority_expansion',
  ];

  if (rejectedReasons.length > 0) {
    const resolution = createWorldActionResolution({
      departure,
      status: 'blocked',
      summary: '山路逃离路线承接被阻断：缺少目标、路线准备、遮掩上下文或路线候选资格。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v014_qingmao_mountain_pass_route_continuation',
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
      message: '请先记录离开青茅山目标、完成路线准备，并遮掩逃离痕迹，再承接山路路线。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      routeKey: ROUTE_KEY,
      routePreview,
      visibleSourceRefs: sourceRefs,
      rejectedReasons,
      forbiddenUpgrades,
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

  const factionId = currentFactionId(input);
  const missingConditionIds = routePreview?.missingConditions.map(condition => condition.id) || [];
  const knownFact: PlayerKnownFact = {
    id: KNOWN_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '山路逃离路线已推进为路线承接候选：路线方向、遮掩窗口和残余风险已明确，但当前仍未离开青茅山。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.14.0-b2', 'qingmao_route_continuation', ROUTE_KEY],
  };
  const factionPressure: LivingFactionPressureEntry[] = [
    {
      id: 'faction_pressure_qingmao_mountain_pass_route_window',
      factionId,
      pressureType: 'opportunity',
      delta: 1,
      reason: '山路逃离路线形成可承接窗口；这只是候选状态，不是地点进入或逃离成功。',
      turn,
      visibility: 'player_visible',
    },
    {
      id: `faction_pressure_qingmao_mountain_pass_${factionId}_pursuit_attention`,
      factionId,
      pressureType: 'suspicion',
      delta: 1,
      reason: '山路承接会让公开节奏和补给缺口更显眼；当前只记录追踪注意，不结算追捕成功或失败。',
      turn,
      visibility: 'player_visible',
    },
  ];
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_qingmao_mountain_pass_outer_watch',
    npcId: 'qingmao_outer_watch',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '外圈耳目只捕捉到你与山路方向相关的公开节奏变化，尚不足以证明你已经离山。',
    privateRefId: null,
    attitudeDelta: -1,
    weight: 3,
    tags: ['v0.14.0-b2', ROUTE_KEY, 'public_route_trace'],
    expiresTurn: null,
  };
  const updatedGoals = goal ? [buildUpdatedGoal(goal, turn)] : [];
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '山路逃离路线已承接为候选：你仍在青茅阶段，补给和追踪风险仍未结算。',
    localFacts: [
      knownFact.summary,
      '路线承接候选只改变账本解释，不结算 route_entered、location_unlock 或 escape_success。',
      missingConditionIds.length > 0
        ? `仍缺：${missingConditionIds.join('、')}`
        : '当前没有缺口被正式结算为通过。',
    ],
    risks: unique([
      'route_candidate_only',
      'travel_supply_gap',
      'pursuit_attention',
      ...(routePreview?.riskFactors.map(risk => risk.axis) || []),
    ]),
    rewardPolicy: 'none',
    metadata: {
      routeKey: ROUTE_KEY,
      routeEligibility: routePreview?.eligibility,
      missingConditionIds,
      visibleSourceRefs: sourceRefs,
      forbiddenUpgrades,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v014_qingmao_mountain_pass_route_continuation',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: '山路逃离路线已成为可解释的承接候选；当前仍未离开青茅山。',
    effectRefs: [
      KNOWN_FACT_ID,
      ...factionPressure.map(entry => entry.id),
      npcMemory.id,
    ],
    followUpRefs: [
      'route_candidate:mountain_pass_escape',
      'preparation:gather_travel_supply',
      'gate:no_route_entered',
      'gate:no_location_unlock',
      'gate:no_faction_transfer',
      'gate:no_reward',
      ...missingConditionIds.map(id => `missing:${id}`),
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
    message: '已承接山路逃离路线：形成路线候选，但没有离开青茅山。',
    publicSummary: resolution.summary,
    actionId: ACTION_ID,
    routeKey: ROUTE_KEY,
    routePreview,
    visibleSourceRefs: sourceRefs,
    rejectedReasons,
    forbiddenUpgrades,
    knownFacts: [knownFact],
    factionPressure,
    npcMemories: [npcMemory],
    playerGoals: updatedGoals,
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    statePatchApplied: false,
  };
}
