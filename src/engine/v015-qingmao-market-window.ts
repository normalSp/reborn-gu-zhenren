import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import {
  buildQingmaoLowRankEconomyPlan,
  type QingmaoLowRankEconomyPlan,
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

const ACTION_ID = 'qingmao_market_window_probe';
const KNOWN_FACT_ID = 'qingmao_market_window_candidate_baseline';
const CONSEQUENCE_ID = 'consequence_qingmao_market_window_probe';
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

export interface QingmaoMarketWindowInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
}

export interface QingmaoMarketWindowResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  marketPlan: QingmaoLowRankEconomyPlan;
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

function currentTurn(input: QingmaoMarketWindowInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoMarketWindowInput): string {
  return input.sceneId || 'v015_qingmao_market_window';
}

function currentLocationId(input: QingmaoMarketWindowInput): string {
  return input.locationId || 'qingmaoshan_trade_crossroads_outer';
}

function currentFactionId(input: QingmaoMarketWindowInput): string {
  if (input.playerFactionId) return input.playerFactionId;
  const startProfileId = input.selectedStartProfileId || '';
  return START_PROFILE_FACTIONS[startProfileId] || 'qingmao_local_watch';
}

function findRelevantGoal(state?: Partial<LivingWorldState> | null): LivingPlayerGoalEntry | null {
  return (state?.playerGoals || []).find(goal => (
    goal.status !== 'failed'
    && (
      goal.targetRef === 'region:outside_qingmao'
      || goal.rationale.includes('逃离青茅山')
      || goal.rationale.includes('商队')
      || goal.rationale.includes('市场')
      || goal.rationale.includes('买')
      || goal.rationale.includes('卖')
      || goal.nextStepHints.some(hint => hint.startsWith('market:') || hint.startsWith('refinement:'))
    )
  )) || null;
}

function hasMarketPreparationContext(state?: Partial<LivingWorldState> | null): boolean {
  return Boolean(
    state?.knownFacts?.qingmao_supply_feeding_preparation_baseline
    || state?.knownFacts?.qingmao_refinement_fragment_boundary_baseline
    || (state?.actionConsequences || []).some(entry => (
      entry.actionId === 'qingmao_supply_feeding_preparation_probe'
      || entry.actionId === 'qingmao_refinement_boundary_probe'
      || entry.followUpRefs.includes('market:market_supply_preparation_before_trade')
      || entry.followUpRefs.includes('gate:no_formal_market_trade')
    )),
  );
}

function visibleSourceRefs(
  state: Partial<LivingWorldState> | null | undefined,
  plan: QingmaoLowRankEconomyPlan,
): string[] {
  const goal = findRelevantGoal(state);
  return unique([
    goal ? `goal:${goal.id}` : '',
    state?.knownFacts?.qingmao_supply_feeding_preparation_baseline ? 'fact:qingmao_supply_feeding_preparation_baseline' : '',
    state?.knownFacts?.qingmao_refinement_fragment_boundary_baseline ? 'fact:qingmao_refinement_fragment_boundary_baseline' : '',
    ...plan.ruleDrafts.map(rule => `${rule.focus}:${rule.id}`),
    ...plan.visibleSourceRefs.slice(0, 8),
    'mirofish-pack:v015_southern_border_market_caravan_trade_pack',
  ]);
}

function blockedReasons(
  state: Partial<LivingWorldState> | null | undefined,
  plan: QingmaoLowRankEconomyPlan,
): string[] {
  return unique([
    hasMarketPreparationContext(state) ? '' : 'missing_low_rank_market_context',
    plan.ruleDrafts.length > 0 ? '' : 'missing_market_window_rules',
  ]);
}

function forbiddenUpgrades(plan: QingmaoLowRankEconomyPlan): string[] {
  return unique([
    ...plan.forbiddenWrites,
    'formal_price_table',
    'formal_shop_inventory',
    'formal_market_trade',
    'black_market_trade',
    'commission_profit',
    'caravan_join',
    'trade_success',
    'item_purchase',
    'item_sale',
    'material_consumption',
    'material_reward',
    'currency_delta',
    'standing_delta',
    'warrant',
    'formal_task',
    'location_unlock',
    'region_unlock',
    'hidden_fact_reveal',
    'deepseek_authority_expansion',
    'save_format_bump',
  ]);
}

function buildCandidate(
  input: QingmaoMarketWindowInput,
  blockers: string[],
  forbidden: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'low_rank_economy:market_window',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '试探商队与市场窗口',
    summary: '把商队接触、公开问价、身份担保、交易前补给和风险提示整理为候选窗口；当前不买卖、不写价格、不开放库存。',
    risk: 'medium',
    apCost: 0,
    blockers,
    warnings: [
      '不开放完整坊市或商店库存。',
      '不写正式价格表或元石变化。',
      '不判定交易成交、被骗、被抓或加入商队。',
      '不让 DeepSeek 决定价格、材料、奖励或交易结果。',
    ],
    tags: ['v0.15.0-b3', 'low_rank_economy', 'market_window'],
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
    rationale: '低阶行动继续受市场窗口和身份担保约束；当前只试探商队、问价与公开理由，不买卖、不写价格、不开放库存。',
    nextStepHints: unique([
      'market:market_caravan_contact_window_first_touch',
      'market:market_window_public_trade_observation',
      'market:market_trade_requirement_identity_and_guarantee',
      'market:market_public_reason_requirement',
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      'gate:no_formal_market_trade',
      'gate:no_formal_shop_inventory',
      'gate:no_currency_delta',
      'gate:no_caravan_join',
      'gap:identity_and_guarantee',
      'gap:public_trade_reason',
      ...goal.blockedByRefIds,
    ]),
  };
}

export function resolveQingmaoMarketWindowAction(
  input: QingmaoMarketWindowInput = {},
): QingmaoMarketWindowResolution {
  const turn = currentTurn(input);
  const marketPlan = buildQingmaoLowRankEconomyPlan({
    focus: 'market',
    includeDeferredWarnings: false,
  });
  const rejectedReasons = blockedReasons(input.livingWorldState, marketPlan);
  const forbidden = forbiddenUpgrades(marketPlan);
  const sourceRefs = visibleSourceRefs(input.livingWorldState, marketPlan);
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
      summary: '商队与市场窗口试探被阻断：缺少补给/炼蛊边界等低阶经济上下文，或缺少市场窗口规则。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades: forbidden },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v015_qingmao_market_window',
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
      message: '请先完成低阶经济前置，如补给/喂养缺口或残方边界试读，再试探商队与市场窗口。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      visibleSourceRefs: sourceRefs,
      rejectedReasons,
      forbiddenUpgrades: forbidden,
      marketPlan,
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

  const goal = findRelevantGoal(input.livingWorldState);
  const factionId = currentFactionId(input);
  const knownFact: PlayerKnownFact = {
    id: KNOWN_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '商队接触、公开问价、身份担保和交易前准备已整理为候选窗口；当前没有买卖、价格表、库存、元石变化或商队加入。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.15.0-b3', 'low_rank_economy', 'market_window'],
  };
  const caravanOpportunity: LivingFactionPressureEntry = {
    id: 'faction_pressure_qingmao_market_window_caravan_opportunity',
    factionId: 'southern_border_caravan_window',
    pressureType: 'opportunity',
    delta: 1,
    reason: '商队或公开交易场合可能提供问价、递话、观察和传闻窗口；本阶段不写正式交易、库存、价格或加入商队。',
    turn,
    visibility: 'player_visible',
  };
  const localAttention: LivingFactionPressureEntry = {
    id: `faction_pressure_qingmao_market_window_${factionId}_attention`,
    factionId,
    pressureType: 'suspicion',
    delta: 1,
    reason: '低阶蛊师突然追问补给、材料或商队渠道，可能被本地势力或旁观者记住；本阶段只记录轻微注意。',
    turn,
    visibility: 'player_visible',
  };
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_qingmao_market_window_caravan_runner',
    npcId: 'qingmao_caravan_runner_public_face',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '商队外围的人只记得你在问价、打听口径和观察人流，尚不足以形成正式交易或委托。',
    privateRefId: null,
    attitudeDelta: 0,
    weight: 2,
    tags: ['v0.15.0-b3', 'market_window', 'public_trade_trace'],
    expiresTurn: null,
  };
  const updatedGoals = goal ? [buildUpdatedGoal(goal, turn)] : [];
  const ruleIds = marketPlan.ruleDrafts.map(rule => rule.id);
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '商队与市场窗口已整理为候选：可问价、递话、观察和准备公开理由，但没有交易结算。',
    localFacts: [
      knownFact.summary,
      ...marketPlan.ruleDrafts.slice(0, 6).map(rule => rule.publicHint),
    ],
    risks: unique([
      'identity_and_guarantee_required',
      'public_reason_required',
      'price_pressure_only',
      'fake_goods_or_attention_risk',
      'no_formal_trade',
    ]),
    rewardPolicy: 'none',
    metadata: {
      marketRuleIds: ruleIds,
      visibleSourceRefs: sourceRefs,
      forbiddenUpgrades: forbidden,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v015_qingmao_market_window',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'resource',
    publicSummary: '商队、市场、问价和公开理由进入行动账本；当前仍只是窗口候选，不是交易结算。',
    effectRefs: [
      KNOWN_FACT_ID,
      caravanOpportunity.id,
      localAttention.id,
      npcMemory.id,
    ],
    followUpRefs: unique([
      ...ruleIds.map(id => `market:${id}`),
      'gate:no_formal_market_trade',
      'gate:no_formal_shop_inventory',
      'gate:no_currency_delta',
      'gate:no_caravan_join',
      'gap:identity_and_guarantee',
      'gap:public_trade_reason',
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
    message: '已试探商队与市场窗口：形成候选账本，不买卖、不写价格、不开放库存。',
    publicSummary: resolution.summary,
    actionId: ACTION_ID,
    visibleSourceRefs: sourceRefs,
    rejectedReasons,
    forbiddenUpgrades: forbidden,
    marketPlan,
    knownFacts: [knownFact],
    factionPressure: [caravanOpportunity, localAttention],
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
