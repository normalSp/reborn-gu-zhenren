import factionReactionRaw from '../canon/qingmao-faction-reaction-bridge.json';
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
  LivingWorldState,
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
} from '../types';

const ACTION_ID = 'qingmao_faction_reaction_bridge_review';

export interface QingmaoFactionReactionRule {
  id: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  category: 'factionPressure' | 'npcReactionCandidate' | string;
  subjectType: string;
  subjectId: string;
  pressureAxis: string;
  pressureType: LivingFactionPressureEntry['pressureType'];
  delta: number;
  publicTrigger: string;
  summary: string;
  likelyReactions: string[];
  playerVisibleRisk: string;
  triggerRefs: string[];
  memoryTargetId: string;
}

export interface QingmaoFactionReactionBridgeInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
}

export interface QingmaoFactionReactionBridgePlan {
  matchedRules: QingmaoFactionReactionRule[];
  visibleSourceRefs: string[];
  publicSummary: string;
  forbiddenWrites: string[];
  intakeReviewRef: string;
}

export interface QingmaoFactionReactionBridgeResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  factionPressure: LivingFactionPressureEntry[];
  npcMemories: LivingNpcMemoryEntry[];
  actionConsequences: LivingActionConsequenceEntry[];
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
  reactionPlan: QingmaoFactionReactionBridgePlan;
  statePatchApplied: false;
}

interface QingmaoFactionReactionBridgeFile {
  sourceReview: {
    intakeReview: string;
  };
  boundaries: {
    forbiddenWrites: string[];
  };
  reactionRules: QingmaoFactionReactionRule[];
}

const bridge = factionReactionRaw as QingmaoFactionReactionBridgeFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cloneRule(rule: QingmaoFactionReactionRule): QingmaoFactionReactionRule {
  return {
    ...rule,
    sourceItemIds: [...rule.sourceItemIds],
    sourcePointerIds: [...rule.sourcePointerIds],
    likelyReactions: [...rule.likelyReactions],
    triggerRefs: [...rule.triggerRefs],
  };
}

function currentTurn(input: QingmaoFactionReactionBridgeInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoFactionReactionBridgeInput): string {
  return input.sceneId || 'v012_qingmao_faction_reaction_bridge';
}

function currentLocationId(input: QingmaoFactionReactionBridgeInput): string {
  return input.locationId || 'qingmao_living_world_reaction';
}

function collectStateRefs(state?: Partial<LivingWorldState> | null): string[] {
  const knownFactRefs = Object.keys(state?.knownFacts || {}).map(id => `knownFact:${id}`);
  const factAliases = Object.keys(state?.knownFacts || {}).map(id => `fact:${id}`);
  const pressureRefs = (state?.factionPressure || []).flatMap(entry => [
    `pressure:${entry.id}`,
    `pressure:${entry.factionId}`,
    `pressure:${entry.factionId}:${entry.pressureType}`,
  ]);
  const consequenceRefs = (state?.actionConsequences || []).flatMap(entry => [
    `consequence:${entry.id}`,
    ...entry.followUpRefs,
    ...entry.effectRefs,
  ]);
  const goalRefs = (state?.playerGoals || []).map(goal => `goal:${goal.targetRef}`);
  const lastActionRef = state?.worldClock?.lastActionId ? [`action:${state.worldClock.lastActionId}`] : [];
  return unique([
    ...knownFactRefs,
    ...factAliases,
    ...pressureRefs,
    ...consequenceRefs,
    ...goalRefs,
    ...lastActionRef,
  ]);
}

function refMatches(triggerRef: string, stateRefs: string[]): boolean {
  return stateRefs.some(ref => ref === triggerRef || ref.startsWith(triggerRef));
}

export function listQingmaoFactionReactionRules(): QingmaoFactionReactionRule[] {
  return bridge.reactionRules.map(cloneRule);
}

export function buildQingmaoFactionReactionBridgePlan(
  input: QingmaoFactionReactionBridgeInput = {},
): QingmaoFactionReactionBridgePlan {
  const stateRefs = collectStateRefs(input.livingWorldState);
  const matchedRules = bridge.reactionRules
    .filter(rule => rule.triggerRefs.some(ref => refMatches(ref, stateRefs)))
    .map(cloneRule);
  const visibleSourceRefs = unique([
    ...stateRefs,
    ...matchedRules.flatMap(rule => rule.sourceItemIds.map(id => `mirofish:${id}`)),
  ]);

  return {
    matchedRules,
    visibleSourceRefs,
    publicSummary: matchedRules.length > 0
      ? `已匹配 ${matchedRules.length} 条青茅轻量反应规则；只记录压力、公开记忆和后果，不结算声望或阵营。`
      : '缺少可公开推演的青茅行为痕迹，暂不生成势力反应。',
    forbiddenWrites: [...bridge.boundaries.forbiddenWrites],
    intakeReviewRef: bridge.sourceReview.intakeReview,
  };
}

function buildCandidate(
  input: QingmaoFactionReactionBridgeInput,
  plan: QingmaoFactionReactionBridgePlan,
  blockers: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'other',
    source: 'player_choice',
    sourceId: 'living_world:faction_reaction_bridge',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '青茅局势反应推演',
    summary: plan.publicSummary,
    risk: plan.matchedRules.length >= 4 ? 'high' : 'medium',
    apCost: 0,
    blockers,
    warnings: [
      '不改变阵营身份。',
      '不写声望数值。',
      '不结算 NPC 生死或追击成败。',
      '不发奖励，不开放地点。',
    ],
    tags: ['v0.12.0-b2', 'qingmao_living_world', 'faction_reaction_bridge'],
    metadata: {
      saveFormatImpact: 'none',
      matchedRuleIds: plan.matchedRules.map(rule => rule.id),
      intakeReviewRef: plan.intakeReviewRef,
      forbiddenUpgrades: plan.forbiddenWrites,
    },
  });
}

function pressureId(rule: QingmaoFactionReactionRule): string {
  return `faction_pressure_qingmao_reaction_${rule.id.replace(/^reaction_/, '')}`;
}

function memoryId(rule: QingmaoFactionReactionRule): string {
  return `npc_memory_qingmao_reaction_${rule.id.replace(/^reaction_/, '')}`;
}

export function resolveQingmaoFactionReactionBridgeAction(
  input: QingmaoFactionReactionBridgeInput = {},
): QingmaoFactionReactionBridgeResolution {
  const turn = currentTurn(input);
  const plan = buildQingmaoFactionReactionBridgePlan(input);
  const rejectedReasons = plan.matchedRules.length === 0 ? ['missing_public_reaction_evidence'] : [];
  const candidate = buildCandidate(input, plan, rejectedReasons);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: rejectedReasons.length > 0 ? 'blocked' : 'local_resolution',
    chargeAp: false,
    metadata: {
      visibleSourceRefs: plan.visibleSourceRefs,
      intakeReviewRef: plan.intakeReviewRef,
    },
  });

  if (rejectedReasons.length > 0) {
    const resolution = createWorldActionResolution({
      departure,
      status: 'blocked',
      summary: '青茅局势反应推演被阻断：缺少可公开推演的玩家行为痕迹。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades: plan.forbiddenWrites },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v012_qingmao_faction_reaction_bridge',
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
      message: '缺少公开行为痕迹，暂不能推演青茅势力反应。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      visibleSourceRefs: plan.visibleSourceRefs,
      rejectedReasons,
      forbiddenUpgrades: plan.forbiddenWrites,
      factionPressure: [],
      npcMemories: [],
      actionConsequences: [],
      worldActionCandidate: candidate,
      worldActionDeparture: departure,
      worldActionResolution: resolution,
      worldActionLedgerEntry: ledger,
      narrativeReturnContext,
      reactionPlan: plan,
      statePatchApplied: false,
    };
  }

  const factionPressure: LivingFactionPressureEntry[] = plan.matchedRules.map(rule => ({
    id: pressureId(rule),
    factionId: rule.subjectId,
    pressureType: rule.pressureType,
    delta: Math.max(1, Math.min(3, Math.floor(rule.delta))),
    reason: `${rule.summary} 候选反应：${rule.likelyReactions.join('、')}。`,
    turn,
    visibility: 'player_visible',
  }));
  const npcMemories: LivingNpcMemoryEntry[] = plan.matchedRules.map(rule => ({
    id: memoryId(rule),
    npcId: rule.memoryTargetId,
    turn,
    regionId: 'qingmao',
    actionId: ACTION_ID,
    publicSummary: `${rule.subjectId} 记下了公开触发：${rule.publicTrigger}`,
    privateRefId: null,
    attitudeDelta: 0,
    weight: Math.max(1, Math.min(3, Math.floor(rule.delta))),
    tags: ['v0.12.0-b2', 'reaction_bridge', rule.pressureAxis, rule.subjectType],
    expiresTurn: null,
  }));
  const consequence: LivingActionConsequenceEntry = {
    id: 'consequence_qingmao_faction_reaction_bridge_review',
    actionId: ACTION_ID,
    turn,
    scope: 'region',
    publicSummary: `青茅局势反应推演完成：${plan.matchedRules.length} 条轻量反应进入压力和公开记忆，但没有声望、阵营、奖励或地点结算。`,
    effectRefs: [
      ...factionPressure.map(entry => entry.id),
      ...npcMemories.map(entry => entry.id),
    ],
    followUpRefs: [
      'gate:no_standing_delta',
      'gate:no_faction_transfer',
      'gate:no_npc_fate_result',
      'gate:no_reward',
    ],
  };
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: consequence.publicSummary,
    localFacts: [
      plan.publicSummary,
      `匹配反应：${plan.matchedRules.map(rule => rule.likelyReactions[0]).join('、')}。`,
      '本行动不改变阵营、不写声望、不发奖励、不开放地点、不结算 NPC 生死。',
    ],
    risks: unique(plan.matchedRules.map(rule => rule.pressureAxis)),
    rewardPolicy: 'none',
    metadata: {
      visibleSourceRefs: plan.visibleSourceRefs,
      matchedRuleIds: plan.matchedRules.map(rule => rule.id),
      forbiddenUpgrades: plan.forbiddenWrites,
      intakeReviewRef: plan.intakeReviewRef,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v012_qingmao_faction_reaction_bridge',
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
    message: `已推演青茅局势反应：${plan.matchedRules.length} 条反应进入压力和公开记忆，不改变阵营或声望。`,
    publicSummary: consequence.publicSummary,
    actionId: ACTION_ID,
    visibleSourceRefs: plan.visibleSourceRefs,
    rejectedReasons: [],
    forbiddenUpgrades: plan.forbiddenWrites,
    factionPressure,
    npcMemories,
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    reactionPlan: plan,
    statePatchApplied: false,
  };
}
