import rulesRaw from '../canon/v100-low-rank-life-loop-release-rules.json';
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
const ACTION_ID = 'v100_low_rank_life_loop_release_acceptance_probe';
const FACT_ID = 'v100_low_rank_life_loop_release_acceptance';
const CONSEQUENCE_ID = 'consequence_v100_low_rank_life_loop_release_acceptance_probe';

export interface V100LifeLoopCheckRule {
  id: string;
  label: string;
  summary: string;
  requiredRefs: string[];
  blocking: boolean;
  sourceItemIds: string[];
}

export interface V100LifeLoopCheckPreview extends V100LifeLoopCheckRule {
  satisfied: boolean;
  evidenceRefs: string[];
}

export interface V100LifeLoopPillarRule {
  id: string;
  label: string;
  summary: string;
  sourceItemIds: string[];
}

export interface V100LifeLoopBoundaryRule {
  id: string;
  label: string;
  summary: string;
  sourceItemIds: string[];
}

export interface V100LowRankLifeLoopOverview {
  status: 'blocked' | 'release_loop_ready';
  statusLabel: string;
  publicSummary: string;
  nextStep: string;
  checks: V100LifeLoopCheckPreview[];
  releasePillars: V100LifeLoopPillarRule[];
  deferredRedlines: V100LifeLoopBoundaryRule[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  statePatchApplied: false;
}

interface V100LifeLoopRulesFile {
  sourceReview: {
    intakeReviews: string[];
    sourcePackages: string[];
    sourcePolicy: string;
  };
  boundaries: {
    forbiddenWrites: string[];
    visibleBoundaryLines: string[];
  };
  loopChecks: V100LifeLoopCheckRule[];
  releasePillars: V100LifeLoopPillarRule[];
  deferredRedlines: V100LifeLoopBoundaryRule[];
}

const rulesFile = rulesRaw as V100LifeLoopRulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: V018QingmaoRouteMultiRegionInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: V018QingmaoRouteMultiRegionInput): string {
  return input.sceneId || 'v100_low_rank_life_loop_release';
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
  if (ref.startsWith('gate:')) return [ref];
  if (hasKnownFact(state, ref)) return [ref];
  const consequence = (state?.actionConsequences || []).find(entry => (
    entry.id === ref
    || entry.actionId === ref
    || entry.effectRefs.includes(ref)
    || entry.followUpRefs.includes(ref)
  ));
  if (consequence) return [consequence.id];
  const pressure = (state?.factionPressure || []).find(entry => entry.id === ref);
  if (pressure) return [pressure.id];
  return [];
}

function buildChecks(state: Partial<LivingWorldState> | null | undefined): V100LifeLoopCheckPreview[] {
  return rulesFile.loopChecks.map(rule => {
    const evidenceRefs = unique(rule.requiredRefs.flatMap(ref => refEvidence(state, ref)));
    return {
      ...rule,
      evidenceRefs,
      satisfied: evidenceRefs.length > 0,
    };
  });
}

export function buildV100LowRankLifeLoopOverview(
  input: V018QingmaoRouteMultiRegionInput = {},
): V100LowRankLifeLoopOverview {
  const checks = buildChecks(input.livingWorldState);
  const ready = checks.filter(check => check.blocking).every(check => check.satisfied);
  const visibleSourceRefs = unique([
    ...checks.flatMap(check => check.sourceItemIds),
    ...rulesFile.releasePillars.flatMap(rule => rule.sourceItemIds),
  ]);

  return {
    status: ready ? 'release_loop_ready' : 'blocked',
    statusLabel: ready ? '可验收' : '需补闭环',
    publicSummary: ready
      ? '低阶蛊师 life loop 已具备 v1.0 释出版闭环：路线、生存补给、炼养用、交易窗口和社会压力都可读。'
      : '低阶蛊师 life loop 仍缺核心前置：需要先完成连续体验、补给喂养、炼蛊边界、市场窗口和路线压力回流。',
    nextStep: ready
      ? '可以写入 v1.0 低阶 life loop 验收事实，后续再收束自由意图和公开文案。'
      : '先补齐补给、炼养用、市场窗口和路线压力，再验收低阶 life loop。',
    checks,
    releasePillars: [...rulesFile.releasePillars],
    deferredRedlines: [...rulesFile.deferredRedlines],
    visibleSourceRefs,
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    statePatchApplied: false,
  };
}

function buildActionCandidate(
  input: V018QingmaoRouteMultiRegionInput,
  overview: V100LowRankLifeLoopOverview,
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'v100:low_rank_life_loop_release',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '验收 v1.0 低阶蛊师生活闭环',
    summary: '把修行压力、补给食料、炼养用边界、交易窗口和社会压力合并为 v1.0 释出版 life loop；不写收益或库存。',
    risk: 'medium',
    apCost: 0,
    blockers: overview.checks.filter(check => check.blocking && !check.satisfied).map(check => check.id),
    warnings: [
      ...rulesFile.boundaries.visibleBoundaryLines,
      '不发材料、不写价格、不开放正式任务或市场。',
    ],
    tags: ['v1.0.0-b2', 'low_rank_life_loop', 'candidate_only'],
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
    rationale: 'v1.0 低阶 life loop 已验收为释出版闭环；下一步处理自由意图极端样本和公开发布边界，不写正式路线或地点。',
    nextStepHints: unique([
      'v100:free_intent_closure',
      'v100:public_release_boundary',
      'gate:no_formal_market_trade',
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      'gate:no_material_reward',
      'gate:no_formal_market_trade',
      'gate:no_route_entered',
      'gate:no_location_unlock',
      ...goal.blockedByRefIds,
    ]),
  }];
}

export function resolveV100LowRankLifeLoopReleaseAction(
  input: V018QingmaoRouteMultiRegionInput = {},
): V018QingmaoRouteActionResolution {
  const turn = currentTurn(input);
  const overview = buildV100LowRankLifeLoopOverview(input);
  const v018Overview = buildV018QingmaoRouteMultiRegionOverview(input);
  const candidate = buildActionCandidate(input, overview);
  const blockedReasons = overview.checks.filter(check => check.blocking && !check.satisfied).map(check => check.id);
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
      summary: 'v1.0 低阶 life loop 验收被阻断：仍缺连续体验、补给喂养、炼蛊边界、市场窗口或路线压力前置。',
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
      source: 'v100_low_rank_life_loop_release',
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
      message: '请先补齐 v1.0 低阶 life loop 前置，再验收释出版闭环。',
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
    summary: 'v1.0 低阶蛊师 life loop 已验收为释出版闭环：修行压力、补给食料、炼养用边界、交易窗口和社会压力都可读；当前不写材料、价格、正式任务收益或地点。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v1.0.0-b2', 'low_rank_life_loop', ROUTE_ID],
  };
  const factionPressure: LivingFactionPressureEntry[] = [
    {
      id: 'faction_pressure_v100_life_loop_supply_cost',
      factionId: REGION_ID,
      pressureType: 'suspicion',
      delta: 1,
      reason: '补给、食料、炼养用和交易窗口已形成公开生活压力；本地只记录可见消耗感，不发材料或扣元石。',
      turn,
      visibility: 'player_visible',
    },
    {
      id: 'faction_pressure_v100_life_loop_market_attention',
      factionId: ROUTE_ID,
      pressureType: 'opportunity',
      delta: 1,
      reason: '商队/市场窗口与路线压力可读；当前只是外缘机会，不开放正式交易、价格表或委托收益。',
      turn,
      visibility: 'player_visible',
    },
  ];
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_v100_life_loop_public_routine',
    npcId: 'low_rank_life_loop_observer',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '旁观者只看到玩家在补给、食料、炼养用和交易窗口之间做取舍，不能据此决定奖励、通缉、入城或关键人物命运。',
    privateRefId: null,
    attitudeDelta: 0,
    weight: 3,
    tags: ['v1.0.0-b2', 'low_rank_life_loop', 'public_routine'],
    expiresTurn: null,
  };
  const playerGoals = updateEscapeGoal(input.livingWorldState, turn);
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: 'v1.0 低阶蛊师 life loop 已验收为释出版闭环；仍不开放正式收益、地点、市场或任务结算。',
    localFacts: [
      knownFact.summary,
      ...overview.releasePillars.map(item => item.summary),
      ...rulesFile.boundaries.visibleBoundaryLines,
    ],
    risks: [
      'material_inventory_not_persisted',
      'market_trade_blocked',
      'commission_reward_blocked',
      'route_status_not_persisted',
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
    source: 'v100_low_rank_life_loop_release',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: 'v1.0 低阶 life loop 验收已记录；它只证明低阶生活循环可读，不是正式资源、市场、委托、路线或地点结算。',
    effectRefs: [
      FACT_ID,
      ...factionPressure.map(entry => entry.id),
      npcMemory.id,
    ],
    followUpRefs: [
      'v100:free_intent_closure',
      'v100:public_release_boundary',
      'gate:no_formal_market_trade',
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
    message: '已验收 v1.0 低阶蛊师 life loop 释出版闭环；下一步收束自由意图与公开边界。',
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
