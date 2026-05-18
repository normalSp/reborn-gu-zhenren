import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import {
  buildQingmaoLowRankEconomyPlan,
  listQingmaoLowRankEconomyRuleDrafts,
  type QingmaoLowRankEconomyPlan,
  type QingmaoLowRankEconomyRuleDraft,
} from './v015-qingmao-low-rank-economy';
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

const ACTION_ID = 'qingmao_supply_feeding_preparation_probe';
const KNOWN_FACT_ID = 'qingmao_supply_feeding_preparation_baseline';
const CONSEQUENCE_ID = 'consequence_qingmao_supply_feeding_preparation_probe';
const REGION_ID = 'qingmao_three_clans';
const MARKET_PREP_RULE_ID = 'market_supply_preparation_before_trade';

const START_PROFILE_FACTIONS: Record<string, string> = {
  start_qingmaoshan_guyue: 'guyue_shanzhai',
  start_qingmaoshan_xiongjia: 'xiongjia_zhai',
  start_qingmaoshan_baijia: 'baijia_zhai',
  start_qingmaoshan_shangjia_caravan: 'shangjia',
  start_qingmaoshan_wujia_branch: 'wujia',
  start_qingmaoshan_tiejia_patrol: 'tiejia',
  start_qingmaoshan_sanxiu: 'sanxiu',
};

export interface QingmaoSupplyFeedingPreparationInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
}

export interface QingmaoSupplyFeedingPreparationResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  supplyPlan: QingmaoLowRankEconomyPlan;
  feedingPlan: QingmaoLowRankEconomyPlan;
  marketPreparationRule: QingmaoLowRankEconomyRuleDraft | null;
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

function currentTurn(input: QingmaoSupplyFeedingPreparationInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoSupplyFeedingPreparationInput): string {
  return input.sceneId || 'v015_qingmao_supply_feeding_preparation';
}

function currentLocationId(input: QingmaoSupplyFeedingPreparationInput): string {
  return input.locationId || 'qingmaoshan_outer_paths';
}

function currentFactionId(input: QingmaoSupplyFeedingPreparationInput): string {
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

function hasRouteContext(state?: Partial<LivingWorldState> | null): boolean {
  return Boolean(
    state?.knownFacts?.qingmao_escape_route_preparation_baseline
    || state?.knownFacts?.qingmao_escape_tracks_cover_baseline
    || state?.knownFacts?.qingmao_mountain_pass_route_continuation_candidate
    || (state?.actionConsequences || []).some(entry => (
      entry.actionId === 'qingmao_escape_route_preparation_probe'
      || entry.actionId === 'qingmao_cover_escape_tracks_probe'
      || entry.actionId === 'qingmao_mountain_pass_route_continuation_probe'
      || entry.followUpRefs.includes('preparation:gather_travel_supply')
      || entry.followUpRefs.includes('route_candidate:mountain_pass_escape')
    )),
  );
}

function findMarketPreparationRule(): QingmaoLowRankEconomyRuleDraft | null {
  return listQingmaoLowRankEconomyRuleDrafts().find(rule => rule.id === MARKET_PREP_RULE_ID) || null;
}

function economyRuleRefs(plan: QingmaoLowRankEconomyPlan): string[] {
  return plan.ruleDrafts.map(rule => `${rule.focus}:${rule.id}`);
}

function visibleSourceRefs(
  state: Partial<LivingWorldState> | null | undefined,
  supplyPlan: QingmaoLowRankEconomyPlan,
  feedingPlan: QingmaoLowRankEconomyPlan,
  marketPreparationRule: QingmaoLowRankEconomyRuleDraft | null,
): string[] {
  const goal = findEscapeGoal(state);
  return unique([
    goal ? `goal:${goal.id}` : '',
    state?.knownFacts?.qingmao_escape_route_preparation_baseline ? 'fact:qingmao_escape_route_preparation_baseline' : '',
    state?.knownFacts?.qingmao_escape_tracks_cover_baseline ? 'fact:qingmao_escape_tracks_cover_baseline' : '',
    state?.knownFacts?.qingmao_mountain_pass_route_continuation_candidate ? 'fact:qingmao_mountain_pass_route_continuation_candidate' : '',
    ...economyRuleRefs(supplyPlan),
    ...economyRuleRefs(feedingPlan),
    marketPreparationRule ? `market:${marketPreparationRule.id}` : '',
    ...supplyPlan.visibleSourceRefs.slice(0, 4),
    ...feedingPlan.visibleSourceRefs.slice(0, 4),
    'mirofish-pack:v015_low_rank_economy_refinement_feeding_pack',
    'mirofish-pack:v015_southern_border_market_caravan_trade_pack',
  ]);
}

function blockedReasons(
  state: Partial<LivingWorldState> | null | undefined,
  supplyPlan: QingmaoLowRankEconomyPlan,
  feedingPlan: QingmaoLowRankEconomyPlan,
): string[] {
  return unique([
    findEscapeGoal(state) ? '' : 'missing_escape_goal',
    hasRouteContext(state) ? '' : 'missing_route_context',
    supplyPlan.ruleDrafts.length > 0 ? '' : 'missing_supply_rules',
    feedingPlan.ruleDrafts.length > 0 ? '' : 'missing_feeding_rules',
  ]);
}

function forbiddenUpgrades(
  supplyPlan: QingmaoLowRankEconomyPlan,
  feedingPlan: QingmaoLowRankEconomyPlan,
): string[] {
  return unique([
    ...supplyPlan.forbiddenWrites,
    ...feedingPlan.forbiddenWrites,
    'material_reward',
    'currency_delta',
    'gu_reward',
    'formal_market_trade',
    'black_market_trade',
    'commission_profit',
    'route_entered',
    'location_unlock',
    'region_unlock',
    'faction_transfer',
    'standing_delta',
    'formal_task',
    'hidden_fact_reveal',
    'deepseek_authority_expansion',
    'save_format_bump',
  ]);
}

function buildCandidate(
  input: QingmaoSupplyFeedingPreparationInput,
  blockers: string[],
  forbidden: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'low_rank_economy:supply_feeding_preparation',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '整理补给与喂养缺口',
    summary: '把离山补给、落脚遮掩和酒虫食料压力整理为前置清单；当前不发材料、不扣元石、不开放市场。',
    risk: 'medium',
    apCost: 0,
    blockers,
    warnings: [
      '不写材料包或库存。',
      '不扣除或发放元石。',
      '不开放正式市场、黑市或委托交易。',
      '不判定路线进入、逃离成功或蛊虫成长收益。',
    ],
    tags: ['v0.15.0-b1', 'low_rank_economy', 'supply_feeding_preparation'],
    metadata: {
      regionId: REGION_ID,
      saveFormatImpact: 'none',
      forbiddenUpgrades: forbidden,
    },
  });
}

function buildUpdatedGoal(goal: LivingPlayerGoalEntry, turn: number): LivingPlayerGoalEntry {
  return {
    ...goal,
    status: 'deferred',
    lastUpdatedTurn: turn,
    rationale: '离开青茅山仍是长期目标；当前只完成补给、落脚遮掩和酒虫食料缺口整理，不发放补给、不扣元石、不开放交易。',
    nextStepHints: unique([
      'supply:supply_qingmao_route_food_water_pack',
      'supply:supply_qingmao_route_shelter_and_trade_cover',
      'feeding:feeding_liquor_worm_wine_stock_pressure',
      'market:market_supply_preparation_before_trade',
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      'gate:no_material_reward',
      'gate:no_currency_delta',
      'gate:no_formal_market_trade',
      'gap:liquor_worm_wine_stock',
      'gap:route_food_water_pack',
      ...goal.blockedByRefIds,
    ]),
  };
}

export function resolveQingmaoSupplyFeedingPreparationAction(
  input: QingmaoSupplyFeedingPreparationInput = {},
): QingmaoSupplyFeedingPreparationResolution {
  const turn = currentTurn(input);
  const supplyPlan = buildQingmaoLowRankEconomyPlan({
    focus: 'supply',
    includeDeferredWarnings: false,
  });
  const feedingPlan = buildQingmaoLowRankEconomyPlan({
    focus: 'feeding',
    includeDeferredWarnings: false,
  });
  const marketPreparationRule = findMarketPreparationRule();
  const rejectedReasons = blockedReasons(input.livingWorldState, supplyPlan, feedingPlan);
  const forbidden = forbiddenUpgrades(supplyPlan, feedingPlan);
  const sourceRefs = visibleSourceRefs(
    input.livingWorldState,
    supplyPlan,
    feedingPlan,
    marketPreparationRule,
  );
  const candidate = buildCandidate(input, rejectedReasons, forbidden);
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

  if (rejectedReasons.length > 0) {
    const resolution = createWorldActionResolution({
      departure,
      status: 'blocked',
      summary: '补给与喂养缺口整理被阻断：缺少离开青茅山目标、路线承接上下文，或低阶经济规则草案。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades: forbidden },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v015_qingmao_supply_feeding_preparation',
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
      message: '请先记录离开青茅山目标，并完成路线准备或路线承接，再整理补给/喂养缺口。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      visibleSourceRefs: sourceRefs,
      rejectedReasons,
      forbiddenUpgrades: forbidden,
      supplyPlan,
      feedingPlan,
      marketPreparationRule,
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

  const goal = findEscapeGoal(input.livingWorldState);
  const factionId = currentFactionId(input);
  const knownFact: PlayerKnownFact = {
    id: KNOWN_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '离山补给、落脚遮掩和酒虫食料压力已整理为前置清单；当前没有补给入库、元石变化、市场交易或蛊虫成长收益。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.15.0-b1', 'low_rank_economy', 'supply_feeding_preparation'],
  };
  const factionPressure: LivingFactionPressureEntry = {
    id: `faction_pressure_qingmao_supply_preparation_${factionId}_watch`,
    factionId,
    pressureType: 'suspicion',
    delta: 1,
    reason: '公开补给、食料和落脚理由开始变多；本阶段只记录本地耳目的轻微注意，不写声望、通缉或正式任务。',
    turn,
    visibility: 'player_visible',
  };
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_qingmao_supply_feeding_local_watch',
    npcId: 'qingmao_local_watch',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '本地耳目只看见你在整理行囊、食料和落脚理由，尚不足以证明交易完成或已经离山。',
    privateRefId: null,
    attitudeDelta: -1,
    weight: 2,
    tags: ['v0.15.0-b1', 'supply_preparation', 'feeding_pressure'],
    expiresTurn: null,
  };
  const updatedGoals = goal ? [buildUpdatedGoal(goal, turn)] : [];
  const supplyRuleIds = supplyPlan.ruleDrafts.map(rule => rule.id);
  const feedingRuleIds = feedingPlan.ruleDrafts.map(rule => rule.id);
  const marketRuleIds = marketPreparationRule ? [marketPreparationRule.id] : [];
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '补给与喂养缺口已整理成前置清单；没有材料、元石、市场、路线进入或蛊虫成长结算。',
    localFacts: [
      knownFact.summary,
      ...supplyPlan.ruleDrafts.map(rule => rule.publicHint),
      ...feedingPlan.ruleDrafts.map(rule => rule.publicHint),
      marketPreparationRule?.publicHint || '',
    ].filter(Boolean),
    risks: unique([
      'supply_gap',
      'feeding_stock_pressure',
      'local_watch_attention',
      'anti_farm_no_material_reward',
    ]),
    rewardPolicy: 'none',
    metadata: {
      supplyRequirementIds: supplyRuleIds,
      feedingRequirementIds: feedingRuleIds,
      marketPreparationRuleIds: marketRuleIds,
      visibleSourceRefs: sourceRefs,
      forbiddenUpgrades: forbidden,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v015_qingmao_supply_feeding_preparation',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'resource',
    publicSummary: '补给、落脚遮掩和酒虫食料压力进入行动账本；当前仍只是前置缺口，不是资源结算。',
    effectRefs: [
      KNOWN_FACT_ID,
      factionPressure.id,
      npcMemory.id,
    ],
    followUpRefs: unique([
      ...supplyRuleIds.map(id => `supply:${id}`),
      ...feedingRuleIds.map(id => `feeding:${id}`),
      ...marketRuleIds.map(id => `market:${id}`),
      'gate:no_material_reward',
      'gate:no_currency_delta',
      'gate:no_formal_market_trade',
      'gate:no_route_entered',
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
    message: '已整理补给与喂养缺口：形成前置清单，不发材料、不扣元石、不开放市场。',
    publicSummary: resolution.summary,
    actionId: ACTION_ID,
    visibleSourceRefs: sourceRefs,
    rejectedReasons,
    forbiddenUpgrades: forbidden,
    supplyPlan,
    feedingPlan,
    marketPreparationRule,
    knownFacts: [knownFact],
    factionPressure: [factionPressure],
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
