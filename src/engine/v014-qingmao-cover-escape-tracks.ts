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

const ACTION_ID = 'qingmao_cover_escape_tracks_probe';
const KNOWN_FACT_ID = 'qingmao_escape_tracks_cover_baseline';
const CONSEQUENCE_ID = 'consequence_qingmao_cover_escape_tracks_probe';
const REGION_ID = 'qingmao_three_clans';

const START_PROFILE_FACTIONS: Record<string, string> = {
  start_qingmaoshan_guyue: 'guyue_shanzhai',
  start_qingmaoshan_xiongjia: 'xiongjia_zhai',
  start_qingmaoshan_baijia: 'baijia_zhai',
  start_qingmaoshan_shangjia_caravan: 'shangjia',
  start_qingmaoshan_wujia_branch: 'wujia',
  start_qingmaoshan_tiejia_patrol: 'tiejia',
  start_qingmaoshan_sanxiu: 'sanxiu',
};

export interface QingmaoCoverEscapeTracksInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
}

export interface QingmaoCoverEscapeTracksResolution {
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

function currentTurn(input: QingmaoCoverEscapeTracksInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoCoverEscapeTracksInput): string {
  return input.sceneId || 'v014_qingmao_cover_escape_tracks';
}

function currentLocationId(input: QingmaoCoverEscapeTracksInput): string {
  return input.locationId || 'qingmaoshan_outer_paths';
}

function currentFactionId(input: QingmaoCoverEscapeTracksInput): string {
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

function visibleSourceRefs(state?: Partial<LivingWorldState> | null): string[] {
  const goal = findEscapeGoal(state);
  return unique([
    goal ? `goal:${goal.id}` : '',
    hasRoutePrep(state) ? 'fact:qingmao_escape_route_preparation_baseline' : '',
    'socialFollowup:followup_prepare_public_reason',
    'routeAction:cover_escape_tracks',
    'mirofish-pack:qingmao_exit_route_aftermath_pack',
  ]);
}

function buildCandidate(
  input: QingmaoCoverEscapeTracksInput,
  blockers: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'followup_prepare_public_reason',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '遮掩逃离痕迹',
    summary: '处理公开理由、行动节奏和路线痕迹，只形成低可见度窗口，不判定离开青茅山成功。',
    risk: 'medium',
    apCost: 0,
    blockers,
    warnings: [
      '不离开当前地点。',
      '不改变阵营或声望。',
      '不消除所有追踪风险。',
      '不发放补给、材料、元石、蛊虫或任务奖励。',
    ],
    tags: ['v0.14.0-b1', 'qingmao_route_continuation', 'cover_escape_tracks'],
    metadata: {
      regionId: REGION_ID,
      saveFormatImpact: 'none',
      forbiddenUpgrades: [
        'route_entered',
        'location_unlock',
        'faction_transfer',
        'reward',
        'pursuit_success',
        'npc_capture_result',
      ],
    },
  });
}

function buildUpdatedGoal(
  goal: LivingPlayerGoalEntry,
  turn: number,
): LivingPlayerGoalEntry {
  return {
    ...goal,
    status: 'deferred',
    lastUpdatedTurn: turn,
    rationale: '逃离青茅山仍是长期目标；当前完成遮掩痕迹前置，只降低公开节奏风险，不判定路线进入。',
    nextStepHints: unique([
      'route:mountain_pass_escape',
      'preparation:gather_travel_supply',
      'preparation:send_caravan_message',
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      'gate:no_location_unlock',
      'gate:no_faction_transfer',
      'risk:pursuit_residual_trace',
      ...goal.blockedByRefIds,
    ]),
  };
}

export function resolveQingmaoCoverEscapeTracksAction(
  input: QingmaoCoverEscapeTracksInput = {},
): QingmaoCoverEscapeTracksResolution {
  const turn = currentTurn(input);
  const goal = findEscapeGoal(input.livingWorldState);
  const routePrepared = hasRoutePrep(input.livingWorldState);
  const rejectedReasons = goal || routePrepared ? [] : ['missing_escape_route_context'];
  const sourceRefs = visibleSourceRefs(input.livingWorldState);
  const candidate = buildCandidate(input, rejectedReasons);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: rejectedReasons.length > 0 ? 'blocked' : 'local_resolution',
    chargeAp: false,
    metadata: {
      regionId: REGION_ID,
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
      summary: '遮掩逃离痕迹被阻断：缺少已确认的离山目标或路线准备上下文。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v014_qingmao_cover_escape_tracks',
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
      message: '请先确认离开青茅山目标，或完成第一轮路线准备，再遮掩逃离痕迹。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
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
  const knownFact: PlayerKnownFact = {
    id: KNOWN_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '你完成了遮掩逃离痕迹的前置处理：公开理由、行动节奏和路线痕迹被整理，但当前仍未离开青茅山。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.14.0-b1', 'qingmao_route_continuation', 'cover_escape_tracks'],
  };
  const factionPressure: LivingFactionPressureEntry[] = [
    {
      id: 'faction_pressure_qingmao_cover_tracks_low_visibility_window',
      factionId,
      pressureType: 'opportunity',
      delta: 1,
      reason: '遮掩逃离痕迹形成低可见度行动窗口；这只是机会，不是路线进入或追踪失败结算。',
      turn,
      visibility: 'player_visible',
    },
    {
      id: `faction_pressure_qingmao_cover_tracks_${factionId}_residual_trace`,
      factionId,
      pressureType: 'suspicion',
      delta: 1,
      reason: '遮掩本身仍可能留下残余痕迹；当前只记录风险，不结算盘问、追捕或处罚。',
      turn,
      visibility: 'player_visible',
    },
  ];
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_qingmao_cover_tracks_public_routine',
    npcId: 'qingmao_local_watch',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '本地耳目只看到你调整了公开行动节奏，尚不足以证明你已经离山。',
    privateRefId: null,
    attitudeDelta: -1,
    weight: 2,
    tags: ['v0.14.0-b1', 'cover_escape_tracks', 'public_routine'],
    expiresTurn: null,
  };
  const updatedGoals = goal ? [buildUpdatedGoal(goal, turn)] : [];
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '遮掩逃离痕迹已记录：你得到一个低可见度前置窗口，但仍没有离开青茅山，也没有改变阵营或获得奖励。',
    localFacts: [
      knownFact.summary,
      '遮掩痕迹只影响路线前置可读性，不结算 route_entered。',
    ],
    risks: [
      'residual_trace',
      'faction_suspicion',
    ],
    rewardPolicy: 'none',
    metadata: {
      visibleSourceRefs: sourceRefs,
      forbiddenUpgrades,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v014_qingmao_cover_escape_tracks',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: '你遮掩了逃离痕迹，形成低可见度行动窗口；路线仍处于前置阶段。',
    effectRefs: [
      KNOWN_FACT_ID,
      ...factionPressure.map(entry => entry.id),
      npcMemory.id,
    ],
    followUpRefs: [
      'preparation:gather_travel_supply',
      'route:mountain_pass_escape',
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
    message: '已遮掩逃离痕迹：获得低可见度前置窗口，但没有离开青茅山。',
    publicSummary: resolution.summary,
    actionId: ACTION_ID,
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
