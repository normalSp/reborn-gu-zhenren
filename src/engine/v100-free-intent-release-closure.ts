import rulesRaw from '../canon/v100-free-intent-release-closure-rules.json';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import {
  adjudicateWorldIntent,
} from './v011-world-intent-engine';
import {
  buildV018QingmaoRouteMultiRegionOverview,
  type V018QingmaoRouteActionResolution,
  type V018QingmaoRouteMultiRegionInput,
} from './v018-qingmao-route-multi-region';
import type {
  IntentCandidate,
  IntentRuling,
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingWorldState,
  PlayerKnownFact,
  WorldActionCandidate,
} from '../types';

const REGION_ID = 'qingmao_three_clans';
const ROUTE_ID = 'southern_border_low_rank_route';
const ACTION_ID = 'v100_free_intent_release_closure_probe';
const FACT_ID = 'v100_free_intent_release_closure_acceptance';
const CONSEQUENCE_ID = 'consequence_v100_free_intent_release_closure_probe';

type IntentType = IntentCandidate['intentType'];
type RulingCategory = IntentRuling['category'];

export interface V100FreeIntentReadinessRule {
  id: string;
  label: string;
  summary: string;
  requiredRefs: string[];
  blocking: boolean;
  sourceItemIds: string[];
}

export interface V100FreeIntentReadinessPreview extends V100FreeIntentReadinessRule {
  satisfied: boolean;
  evidenceRefs: string[];
}

export interface V100FreeIntentSampleRule {
  id: string;
  label: string;
  rawText: string;
  releaseClass: string;
  expectedIntentType: IntentType;
  expectedTargetRefPrefix: string;
  expectedCategory: RulingCategory;
  summary: string;
  sourceItemIds: string[];
}

export interface V100FreeIntentSamplePreview extends V100FreeIntentSampleRule {
  intentType: IntentType;
  targetRef: string;
  category: RulingCategory;
  allowed: boolean;
  riskLevel: IntentRuling['riskLevel'];
  visibleExplanation: string;
  prerequisiteRefs: string[];
  costRefs: string[];
  routeDomain: string;
  matchedExpected: boolean;
}

export interface V100FreeIntentPillarRule {
  id: string;
  label: string;
  summary: string;
  sourceItemIds: string[];
}

export interface V100FreeIntentBoundaryRule {
  id: string;
  label: string;
  summary: string;
  sourceItemIds: string[];
}

export interface V100FreeIntentReleaseClosureOverview {
  status: 'blocked' | 'closure_ready';
  statusLabel: string;
  publicSummary: string;
  nextStep: string;
  readinessChecks: V100FreeIntentReadinessPreview[];
  intentSamples: V100FreeIntentSamplePreview[];
  releasePillars: V100FreeIntentPillarRule[];
  deferredRedlines: V100FreeIntentBoundaryRule[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  statePatchApplied: false;
}

interface V100FreeIntentRulesFile {
  sourceReview: {
    intakeReviews: string[];
    sourcePackages: string[];
    sourcePolicy: string;
  };
  boundaries: {
    forbiddenWrites: string[];
    visibleBoundaryLines: string[];
  };
  readinessChecks: V100FreeIntentReadinessRule[];
  intentSamples: V100FreeIntentSampleRule[];
  releasePillars: V100FreeIntentPillarRule[];
  deferredRedlines: V100FreeIntentBoundaryRule[];
}

const rulesFile = rulesRaw as V100FreeIntentRulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: V018QingmaoRouteMultiRegionInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: V018QingmaoRouteMultiRegionInput): string {
  return input.sceneId || 'v100_free_intent_release_closure';
}

function currentLocationId(input: V018QingmaoRouteMultiRegionInput): string {
  return input.locationId || 'qingmaoshan_outer_paths';
}

function hasKnownFact(state: Partial<LivingWorldState> | null | undefined, id: string): boolean {
  return Boolean(state?.knownFacts?.[id]);
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

function buildReadinessChecks(
  state: Partial<LivingWorldState> | null | undefined,
): V100FreeIntentReadinessPreview[] {
  return rulesFile.readinessChecks.map(rule => {
    const evidenceRefs = unique(rule.requiredRefs.flatMap(ref => refEvidence(state, ref)));
    return {
      ...rule,
      evidenceRefs,
      satisfied: rule.blocking ? evidenceRefs.length > 0 : true,
    };
  });
}

function buildIntentSamples(input: V018QingmaoRouteMultiRegionInput): V100FreeIntentSamplePreview[] {
  const visibleFactIds = Object.keys(input.livingWorldState?.knownFacts || {});
  return rulesFile.intentSamples.map(rule => {
    const adjudication = adjudicateWorldIntent({
      actorId: 'player',
      rawText: rule.rawText,
      source: 'engine_suggestion',
      turn: currentTurn(input),
      regionId: REGION_ID,
      selectedStartProfileId: input.selectedStartProfileId || 'start_qingmaoshan_guyue',
      playerFactionId: input.playerFactionId || null,
      playerRealmGrand: 1,
      timelineMode: 'canon',
      livingWorldState: input.livingWorldState || null,
      visibleFactIds,
    });
    const targetMatches = adjudication.candidate.targetRef.startsWith(rule.expectedTargetRefPrefix);
    return {
      ...rule,
      intentType: adjudication.candidate.intentType,
      targetRef: adjudication.candidate.targetRef,
      category: adjudication.ruling.category,
      allowed: adjudication.ruling.allowed,
      riskLevel: adjudication.ruling.riskLevel,
      visibleExplanation: adjudication.ruling.visibleExplanation,
      prerequisiteRefs: adjudication.ruling.prerequisiteRefs,
      costRefs: adjudication.ruling.costRefs,
      routeDomain: String(adjudication.route.domain || '暂不路由'),
      matchedExpected: (
        targetMatches
        && adjudication.candidate.intentType === rule.expectedIntentType
        && adjudication.ruling.category === rule.expectedCategory
      ),
    };
  });
}

export function buildV100FreeIntentReleaseClosureOverview(
  input: V018QingmaoRouteMultiRegionInput = {},
): V100FreeIntentReleaseClosureOverview {
  const readinessChecks = buildReadinessChecks(input.livingWorldState);
  const intentSamples = buildIntentSamples(input);
  const readinessReady = readinessChecks.filter(check => check.blocking).every(check => check.satisfied);
  const samplesReady = intentSamples.every(sample => sample.matchedExpected);
  const ready = readinessReady && samplesReady;
  const visibleSourceRefs = unique([
    ...readinessChecks.flatMap(check => check.sourceItemIds),
    ...intentSamples.flatMap(sample => sample.sourceItemIds),
    ...rulesFile.releasePillars.flatMap(rule => rule.sourceItemIds),
  ]);

  return {
    status: ready ? 'closure_ready' : 'blocked',
    statusLabel: ready ? '可验收' : '需补裁决',
    publicSummary: ready
      ? 'v1.0 自由意图收束已具备释出版样板：正常目标、路线目标、阵营目标、隐藏事实调查、远期野心和极端越权都有本地裁决。'
      : 'v1.0 自由意图仍缺收束前置：需要先完成 low-rank life loop，并确保极端样本不会被解释成即时成功。',
    nextStep: ready
      ? '可以写入 v1.0 自由意图收束验收事实，后续进入公开素材边界和 rc 长测。'
      : '先完成低阶 life loop 验收，或修正未匹配的极端样本裁决。',
    readinessChecks,
    intentSamples,
    releasePillars: [...rulesFile.releasePillars],
    deferredRedlines: [...rulesFile.deferredRedlines],
    visibleSourceRefs,
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    statePatchApplied: false,
  };
}

function buildActionCandidate(
  input: V018QingmaoRouteMultiRegionInput,
  overview: V100FreeIntentReleaseClosureOverview,
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'v100:free_intent_release_closure',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '验收 v1.0 自由意图收束',
    summary: '把逃离、投靠、跟踪、去商家城、盗天传承、九转蛊和关键 NPC 生死等样本收束为本地裁决；不写正式结果。',
    risk: 'medium',
    apCost: 0,
    blockers: [
      ...overview.readinessChecks.filter(check => check.blocking && !check.satisfied).map(check => check.id),
      ...overview.intentSamples.filter(sample => !sample.matchedExpected).map(sample => sample.id),
    ],
    warnings: [
      ...rulesFile.boundaries.visibleBoundaryLines,
      '不发高阶蛊、不授传承、不转阵营、不改地点、不判定 NPC 生死。',
    ],
    tags: ['v1.0.0-b3', 'free_intent_closure', 'candidate_only'],
    metadata: {
      routeId: ROUTE_ID,
      saveFormatImpact: 'none',
      sourcePackages: rulesFile.sourceReview.sourcePackages,
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    },
  });
}

export function resolveV100FreeIntentReleaseClosureAction(
  input: V018QingmaoRouteMultiRegionInput = {},
): V018QingmaoRouteActionResolution {
  const turn = currentTurn(input);
  const overview = buildV100FreeIntentReleaseClosureOverview(input);
  const v018Overview = buildV018QingmaoRouteMultiRegionOverview(input);
  const candidate = buildActionCandidate(input, overview);
  const blockedReasons = [
    ...overview.readinessChecks.filter(check => check.blocking && !check.satisfied).map(check => check.id),
    ...overview.intentSamples.filter(sample => !sample.matchedExpected).map(sample => `sample_mismatch:${sample.id}`),
  ];
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
      summary: 'v1.0 自由意图收束被阻断：仍缺低阶 life loop 前置，或极端样本裁决未匹配预期。',
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
      source: 'v100_free_intent_release_closure',
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
      message: '请先补齐 v1.0 自由意图收束前置，再验收极端意图样板。',
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
    summary: 'v1.0 自由意图收束已验收：逃离、投靠、跟踪、去商家城、盗天传承、九转蛊和关键 NPC 生死样本均由本地规则裁决、降级或阻断；当前不写正式结果。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v1.0.0-b3', 'free_intent_closure', ROUTE_ID],
  };
  const factionPressure: LivingFactionPressureEntry[] = [
    {
      id: 'faction_pressure_v100_free_intent_public_risk',
      factionId: REGION_ID,
      pressureType: 'suspicion',
      delta: 1,
      reason: '玩家的长期/极端目标已被记录为公开风险感和前置压力；不会据此转阵营、开地点或判定 NPC 生死。',
      turn,
      visibility: 'player_visible',
    },
  ];
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_v100_free_intent_public_boundary',
    npcId: 'free_intent_boundary_observer',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '旁观者只感到玩家有离山、投靠、探查和求取机缘的意图；隐藏事实、高阶传承和关键人物命运仍不可见。',
    privateRefId: null,
    attitudeDelta: 0,
    weight: 3,
    tags: ['v1.0.0-b3', 'free_intent_closure', 'public_boundary'],
    expiresTurn: null,
  };
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: 'v1.0 自由意图与极端意图收束已验收；所有样本只产生裁决、前置、风险或长期目标，不写正式奖励、地点、阵营或 NPC 生死。',
    localFacts: [
      knownFact.summary,
      ...overview.intentSamples.map(sample => `${sample.label}: ${sample.visibleExplanation}`),
      ...rulesFile.boundaries.visibleBoundaryLines,
    ],
    risks: [
      'extreme_goal_downgraded',
      'hidden_fact_protected',
      'formal_outcome_blocked',
      'deepseek_authority_unchanged',
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
    source: 'v100_free_intent_release_closure',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: 'v1.0 自由意图收束已记录；它只证明极端目标会被本地裁决、降级或阻断，不是正式结果结算。',
    effectRefs: [
      FACT_ID,
      ...factionPressure.map(entry => entry.id),
      npcMemory.id,
    ],
    followUpRefs: [
      'v100:public_release_boundary',
      'v100:release_candidate_long_playtest',
      'gate:no_formal_outcome_from_free_intent',
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
    message: '已验收 v1.0 自由意图与极端意图收束；下一步进入公开素材边界和 rc 长测。',
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
    playerGoals: [],
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    statePatchApplied: false,
  };
}
