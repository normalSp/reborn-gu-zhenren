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
  type QingmaoLowRankEconomyRuleDraft,
} from './v015-qingmao-low-rank-economy';
import type {
  LivingActionConsequenceEntry,
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

const ACTION_ID = 'qingmao_gray_trade_boundary_probe';
const KNOWN_FACT_ID = 'qingmao_gray_trade_commission_boundary_baseline';
const CONSEQUENCE_ID = 'consequence_qingmao_gray_trade_boundary_probe';
const REGION_ID = 'qingmao_three_clans';

export interface QingmaoGrayTradeBoundaryInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
}

export interface QingmaoGrayTradeBoundaryResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  grayTradePlan: QingmaoLowRankEconomyPlan;
  boundaryRules: QingmaoLowRankEconomyRuleDraft[];
  knownFacts: PlayerKnownFact[];
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

function currentTurn(input: QingmaoGrayTradeBoundaryInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoGrayTradeBoundaryInput): string {
  return input.sceneId || 'v015_qingmao_gray_trade_boundary';
}

function currentLocationId(input: QingmaoGrayTradeBoundaryInput): string {
  return input.locationId || 'qingmaoshan_trade_crossroads_outer';
}

function hasGrayTradeBoundaryContext(state?: Partial<LivingWorldState> | null): boolean {
  return Boolean(
    state?.knownFacts?.qingmao_market_window_candidate_baseline
    || (state?.actionConsequences || []).some(entry => (
      entry.actionId === 'qingmao_market_window_probe'
      || entry.followUpRefs.includes('gate:no_formal_market_trade')
      || entry.followUpRefs.includes('gap:identity_and_guarantee')
      || entry.followUpRefs.includes('gap:public_trade_reason')
    )),
  );
}

function findRelevantGoal(state?: Partial<LivingWorldState> | null): LivingPlayerGoalEntry | null {
  return (state?.playerGoals || []).find(goal => (
    goal.status !== 'failed'
    && (
      goal.targetRef === 'region:outside_qingmao'
      || goal.rationale.includes('逃离青茅山')
      || goal.rationale.includes('商队')
      || goal.rationale.includes('市场')
      || goal.rationale.includes('黑市')
      || goal.rationale.includes('灰色')
      || goal.rationale.includes('委托')
      || goal.rationale.includes('代售')
      || goal.nextStepHints.some(hint => hint.startsWith('market:') || hint.startsWith('gray_trade:'))
    )
  )) || null;
}

function visibleSourceRefs(
  state: Partial<LivingWorldState> | null | undefined,
  boundaryRules: QingmaoLowRankEconomyRuleDraft[],
): string[] {
  const goal = findRelevantGoal(state);
  return unique([
    goal ? `goal:${goal.id}` : '',
    state?.knownFacts?.qingmao_market_window_candidate_baseline ? 'fact:qingmao_market_window_candidate_baseline' : '',
    ...(state?.actionConsequences || [])
      .filter(entry => entry.actionId === 'qingmao_market_window_probe')
      .map(entry => `consequence:${entry.id}`),
    ...boundaryRules.map(rule => `gray_boundary:${rule.id}`),
    'mirofish-pack:v015_low_rank_black_market_commission_boundary_pack',
  ]);
}

function blockedReasons(
  state: Partial<LivingWorldState> | null | undefined,
  boundaryRules: QingmaoLowRankEconomyRuleDraft[],
): string[] {
  return unique([
    hasGrayTradeBoundaryContext(state) ? '' : 'missing_market_window_context',
    boundaryRules.length > 0 ? '' : 'missing_gray_trade_boundary_rules',
  ]);
}

function forbiddenUpgrades(
  plan: QingmaoLowRankEconomyPlan,
  boundaryRules: QingmaoLowRankEconomyRuleDraft[],
): string[] {
  return unique([
    ...plan.forbiddenWrites,
    ...boundaryRules.flatMap(rule => rule.blockedUse),
    'formal_black_market',
    'black_market_trade',
    'formal_commission',
    'commission_profit',
    'gray_trade_inventory',
    'formal_market_trade',
    'formal_shop_inventory',
    'formal_price_table',
    'stable_arbitrage',
    'identity_wash',
    'trade_success',
    'item_purchase',
    'item_sale',
    'material_reward',
    'gu_reward',
    'recipe_unlock',
    'currency_delta',
    'standing_delta',
    'faction_pressure_write',
    'faction_identity_change',
    'formal_task',
    'npc_capture',
    'npc_death',
    'location_unlock',
    'deepseek_authority_expansion',
    'save_format_bump',
  ]);
}

function buildCandidate(
  input: QingmaoGrayTradeBoundaryInput,
  blockers: string[],
  forbidden: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'low_rank_economy:gray_trade_boundary',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '试探灰色交易与委托边界',
    summary: '把黑市、委托、代售、假货、陷阱和反刷风险整理为边界样本；当前不开放正式交易或收益。',
    risk: 'high',
    apCost: 0,
    blockers,
    warnings: [
      '不开放正式黑市、委托代售或灰色交易库存。',
      '不写价格、元石变化、买卖成功、被骗或被抓结论。',
      '不创建正式任务、通缉、声望或阵营变化。',
      '不让 DeepSeek 决定奖励、交易、陷阱或 NPC 生死。',
    ],
    tags: ['v0.15.0-b4', 'low_rank_economy', 'gray_trade_boundary'],
    metadata: {
      regionId: REGION_ID,
      saveFormatImpact: 'none',
      forbiddenUpgrades: forbidden,
    },
  });
}

function buildUpdatedGoal(
  goal: LivingPlayerGoalEntry,
  turn: number,
  boundaryRules: QingmaoLowRankEconomyRuleDraft[],
): LivingPlayerGoalEntry {
  return {
    ...goal,
    status: 'deferred',
    lastUpdatedTurn: turn,
    rationale: '黑市、委托和灰色交易目前只形成边界样本；不能转成正式买卖、代售收益、库存、价格表、身份洗白或稳定套利。',
    nextStepHints: unique([
      ...boundaryRules.slice(0, 5).map(rule => `gray_trade:${rule.id}`),
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      'gate:no_formal_black_market',
      'gate:no_commission_profit',
      'gate:no_gray_trade_inventory',
      'gate:no_formal_task',
      'gate:no_currency_delta',
      'risk:fraud_or_trap_unresolved',
      'risk:identity_wash_blocked',
      ...goal.blockedByRefIds,
    ]),
  };
}

export function resolveQingmaoGrayTradeBoundaryAction(
  input: QingmaoGrayTradeBoundaryInput = {},
): QingmaoGrayTradeBoundaryResolution {
  const turn = currentTurn(input);
  const grayTradePlan = buildQingmaoLowRankEconomyPlan({
    focus: 'gray_trade',
    includeDeferredWarnings: true,
  });
  const boundaryRules = grayTradePlan.deferredGrayTradeBoundaries;
  const rejectedReasons = blockedReasons(input.livingWorldState, boundaryRules);
  const forbidden = forbiddenUpgrades(grayTradePlan, boundaryRules);
  const sourceRefs = visibleSourceRefs(input.livingWorldState, boundaryRules);
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
      summary: '灰色交易/委托边界试探被阻断：缺少商队/市场候选窗口上下文，或缺少边界样本。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades: forbidden },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v015_qingmao_gray_trade_boundary',
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
      message: '请先完成商队/市场窗口候选，再试探灰色交易或委托边界。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      visibleSourceRefs: sourceRefs,
      rejectedReasons,
      forbiddenUpgrades: forbidden,
      grayTradePlan,
      boundaryRules,
      knownFacts: [],
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
  const knownFact: PlayerKnownFact = {
    id: KNOWN_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '灰色交易、黑市传闻和委托代售被整理为风险边界：当前没有正式黑市、委托收益、库存、价格、元石变化、交易成功或地点开放。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.15.0-b4', 'low_rank_economy', 'gray_trade_boundary'],
  };
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_qingmao_gray_trade_boundary_rumor_listener',
    npcId: 'qingmao_market_rumor_listener',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '旁听者只记得你追问过灰色渠道和委托风险；这不是正式接头、交易或任务。',
    privateRefId: null,
    attitudeDelta: 0,
    weight: 1,
    tags: ['v0.15.0-b4', 'gray_trade_boundary', 'rumor_trace'],
    expiresTurn: null,
  };
  const updatedGoals = goal ? [buildUpdatedGoal(goal, turn, boundaryRules)] : [];
  const boundaryRuleIds = boundaryRules.map(rule => rule.id);
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '灰色交易与委托被整理为风险边界：只提示骗局、关注、反刷和禁发奖励，不开放正式收益。',
    localFacts: [
      knownFact.summary,
      ...boundaryRules.slice(0, 5).map(rule => rule.publicHint),
    ],
    risks: unique([
      'formal_black_market_deferred',
      'commission_profit_blocked',
      'fraud_or_trap_unresolved',
      'faction_attention_not_settled',
      'stable_arbitrage_blocked',
      'forbidden_reward_boundary',
    ]),
    rewardPolicy: 'none',
    metadata: {
      boundaryRuleIds,
      visibleSourceRefs: sourceRefs,
      forbiddenUpgrades: forbidden,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v015_qingmao_gray_trade_boundary',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'resource',
    publicSummary: '黑市、委托、灰色交易、假货、陷阱和反刷进入边界账本；当前仍是延期样本，不是正式玩法。',
    effectRefs: [
      KNOWN_FACT_ID,
      npcMemory.id,
    ],
    followUpRefs: unique([
      ...boundaryRuleIds.map(id => `gray_trade:${id}`),
      'gate:no_formal_black_market',
      'gate:no_commission_profit',
      'gate:no_gray_trade_inventory',
      'gate:no_formal_task',
      'gate:no_currency_delta',
      'risk:fraud_or_trap_unresolved',
      'risk:identity_wash_blocked',
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
    message: '已记录灰色交易/委托边界：只形成风险账本，不开放黑市、不开放委托收益、不写交易结算。',
    publicSummary: resolution.summary,
    actionId: ACTION_ID,
    visibleSourceRefs: sourceRefs,
    rejectedReasons,
    forbiddenUpgrades: forbidden,
    grayTradePlan,
    boundaryRules,
    knownFacts: [knownFact],
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
