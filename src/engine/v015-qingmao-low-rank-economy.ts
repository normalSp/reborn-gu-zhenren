import economyRulesRaw from '../canon/qingmao-low-rank-economy-rules.json';

export type QingmaoLowRankEconomyCategory =
  | 'market_cost_hint'
  | 'feeding_requirement'
  | 'low_rank_material_candidate'
  | 'refinement_failure_cost'
  | 'refinement_fragment'
  | 'scarcity_rule'
  | 'supply_requirement'
  | 'anti_farm_rule'
  | 'caravan_contact_window'
  | 'market_window'
  | 'trade_requirement'
  | 'price_pressure_hint'
  | 'risk_factor'
  | 'public_reason_requirement'
  | 'supply_preparation'
  | 'social_cover_requirement'
  | 'faction_attention_trigger'
  | 'commission_candidate'
  | 'fraud_or_trap_risk'
  | 'gray_trade_risk'
  | 'rumor_only_trade'
  | 'forbidden_reward_boundary';

export type QingmaoLowRankEconomyFocus =
  | 'material'
  | 'feeding'
  | 'refinement'
  | 'supply'
  | 'market'
  | 'anti_farm'
  | 'faction_attention'
  | 'gray_trade';

export type QingmaoLowRankEconomyVisibility = 'public' | 'limited_public' | 'hidden_ref_only';

export interface QingmaoLowRankEconomyRuleDraft {
  id: string;
  category: QingmaoLowRankEconomyCategory;
  focus: QingmaoLowRankEconomyFocus;
  title: string;
  summary: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  visibility: QingmaoLowRankEconomyVisibility;
  allowedUse: string[];
  blockedUse: string[];
  authorityOwner: 'canon' | 'engine' | 'store_action' | 'ui_readonly';
  rewardPolicy: 'none' | 'candidate_only' | 'local_engine_capped';
  antiFarmPolicy: string;
  saveImpact: 'none' | 'uses_existing_v22' | 'requires_save_decision';
  blockedOutcome: string;
  publicHint: string;
}

interface RawRuleDraft extends Omit<QingmaoLowRankEconomyRuleDraft, 'focus'> {}

interface QingmaoLowRankEconomyRulesPack {
  version: string;
  status: string;
  sourceReview: {
    absorptionPolicy: string;
    runtimeAuthority: string;
    deepSeekAuthority: string;
    intakeReviews: string[];
    sourcePackages: string[];
  };
  boundaries: {
    forbiddenWrites: string[];
    allowedRuntimeOutputs: string[];
    deferredItemIds: string[];
    visibleBoundaries: Array<{
      id: string;
      type: string;
      visibleText: string;
    }>;
  };
  materialCandidates: RawRuleDraft[];
  feedingRequirements: RawRuleDraft[];
  refinementBoundaries: RawRuleDraft[];
  supplyRequirements: RawRuleDraft[];
  marketWindows: RawRuleDraft[];
  antiFarmRules: RawRuleDraft[];
  factionAttentionRules: RawRuleDraft[];
  deferredGrayTradeBoundaries: RawRuleDraft[];
}

export interface QingmaoLowRankEconomyPlanInput {
  focus?: QingmaoLowRankEconomyFocus | null;
  intentText?: string | null;
  includeDeferredWarnings?: boolean;
  maxRules?: number;
}

export interface QingmaoLowRankEconomyPlan {
  status: 'rule_draft_preview_only';
  version: string;
  focus: QingmaoLowRankEconomyFocus | 'all';
  publicSummary: string;
  ruleDrafts: QingmaoLowRankEconomyRuleDraft[];
  deferredGrayTradeBoundaries: QingmaoLowRankEconomyRuleDraft[];
  inferredFocusHints: QingmaoLowRankEconomyFocus[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  allowedRuntimeOutputs: string[];
  blockedOutcomes: string[];
  nextStepHint: string;
  statePatchApplied: false;
  canGrantReward: false;
  canOpenMarket: false;
  canWriteSave: false;
  deepSeekAuthority: 'no_new_authority';
  miroFishNeed: 'not_needed';
}

const economyRules = economyRulesRaw as QingmaoLowRankEconomyRulesPack;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function normalizeText(text?: string | null): string {
  return String(text || '').trim().toLowerCase();
}

function textIncludesAny(text: string, needles: string[]): boolean {
  return needles.some(needle => text.includes(needle));
}

function focusForCategory(category: QingmaoLowRankEconomyCategory): QingmaoLowRankEconomyFocus {
  if (category === 'low_rank_material_candidate') return 'material';
  if (category === 'feeding_requirement') return 'feeding';
  if (category === 'refinement_failure_cost' || category === 'refinement_fragment') return 'refinement';
  if (category === 'supply_requirement' || category === 'supply_preparation') return 'supply';
  if (category === 'anti_farm_rule') return 'anti_farm';
  if (category === 'faction_attention_trigger') return 'faction_attention';
  if (
    category === 'commission_candidate'
    || category === 'fraud_or_trap_risk'
    || category === 'gray_trade_risk'
    || category === 'rumor_only_trade'
    || category === 'forbidden_reward_boundary'
  ) {
    return 'gray_trade';
  }
  return 'market';
}

function copyRuleDraft(entry: RawRuleDraft): QingmaoLowRankEconomyRuleDraft {
  return {
    ...entry,
    focus: focusForCategory(entry.category),
    sourceItemIds: [...entry.sourceItemIds],
    sourcePointerIds: [...entry.sourcePointerIds],
    allowedUse: [...entry.allowedUse],
    blockedUse: [...entry.blockedUse],
  };
}

function currentRawRuleDrafts(): RawRuleDraft[] {
  return [
    ...economyRules.materialCandidates,
    ...economyRules.feedingRequirements,
    ...economyRules.refinementBoundaries,
    ...economyRules.supplyRequirements,
    ...economyRules.marketWindows,
    ...economyRules.antiFarmRules,
    ...economyRules.factionAttentionRules,
  ];
}

export function listQingmaoLowRankEconomyRuleDrafts(): QingmaoLowRankEconomyRuleDraft[] {
  return currentRawRuleDrafts().map(copyRuleDraft);
}

export function listDeferredQingmaoGrayTradeBoundaries(): QingmaoLowRankEconomyRuleDraft[] {
  return economyRules.deferredGrayTradeBoundaries.map(copyRuleDraft);
}

export function isForbiddenQingmaoLowRankEconomyWrite(writeType: string): boolean {
  return economyRules.boundaries.forbiddenWrites.includes(writeType);
}

export function inferQingmaoLowRankEconomyFocusHints(intentText?: string | null): QingmaoLowRankEconomyFocus[] {
  const text = normalizeText(intentText);
  const hints: QingmaoLowRankEconomyFocus[] = [];

  if (textIncludesAny(text, ['材料', '蛊材', '采集', '草药', '月兰', 'resource', 'material'])) {
    hints.push('material');
  }
  if (textIncludesAny(text, ['喂养', '食料', '酒虫', '饲养', 'feeding'])) {
    hints.push('feeding');
  }
  if (textIncludesAny(text, ['炼蛊', '残方', '蛊方', '失败', 'refine', 'recipe'])) {
    hints.push('refinement');
  }
  if (textIncludesAny(text, ['补给', '行囊', '食物', '离开青茅', '逃离青茅', 'supply'])) {
    hints.push('supply');
  }
  if (textIncludesAny(text, ['商队', '市场', '买', '卖', '问价', 'trade', 'market', 'caravan'])) {
    hints.push('market');
  }
  if (textIncludesAny(text, ['反复', '刷', '套利', 'farm', 'loop'])) {
    hints.push('anti_farm');
  }
  if (textIncludesAny(text, ['关注', '怀疑', '盘问', '势力', 'suspicion', 'attention'])) {
    hints.push('faction_attention');
  }
  if (textIncludesAny(text, ['黑市', '灰色', '委托', '代售', '掮客', 'black market', 'commission'])) {
    hints.push('gray_trade');
  }

  return unique(hints) as QingmaoLowRankEconomyFocus[];
}

function publicSummaryFor(focus: QingmaoLowRankEconomyFocus | 'all'): string {
  if (focus === 'material') return '当前只展示低阶材料候选与采集边界，不发放材料。';
  if (focus === 'feeding') return '当前只展示蛊虫食料缺口，不写库存或成长收益。';
  if (focus === 'refinement') return '当前只展示残方、炼蛊失败代价和缺项，不判定炼蛊成功。';
  if (focus === 'supply') return '当前只展示路线补给缺口，不判定离山成功或地点解锁。';
  if (focus === 'market') return '当前只展示商队/市场窗口、价格压力和公开理由，不开放完整交易。';
  if (focus === 'anti_farm') return '当前只展示反刷边界，防止重复采集、交易或身份越级。';
  if (focus === 'faction_attention') return '当前只展示经济行为引发的关注，不写正式通缉、声望或抓捕。';
  if (focus === 'gray_trade') return '黑市、委托代售和灰色交易默认延期，只能作为风险样本。';
  return '当前是 v0.15 低阶经济、补给、喂养、炼蛊、市场与反刷的规则草案预览。';
}

function nextStepFor(focus: QingmaoLowRankEconomyFocus | 'all'): string {
  if (focus === 'feeding' || focus === 'supply') return '下一步可升级为补给/喂养正式行动样板，但必须仍使用本地结算和现有 v22 字段。';
  if (focus === 'refinement') return '下一步可设计炼蛊失败代价可读闭环，但不得解锁完整蛊方或成功结果。';
  if (focus === 'market') return '下一步可做商队/市场窗口候选，但不开放完整坊市或价格表。';
  if (focus === 'gray_trade') return '灰色交易风险高，默认等 b2 后或 v0.16+ 再由用户决策。';
  return '下一步进入 b1 时只能挑一个低风险缺口做正式行动样板。';
}

export function buildQingmaoLowRankEconomyPlan(input: QingmaoLowRankEconomyPlanInput = {}): QingmaoLowRankEconomyPlan {
  const inferredFocusHints = inferQingmaoLowRankEconomyFocusHints(input.intentText);
  const inferredFocus: QingmaoLowRankEconomyFocus | undefined = inferredFocusHints.length > 0 ? inferredFocusHints[0] : undefined;
  const selectedFocus: QingmaoLowRankEconomyFocus | 'all' = input.focus || inferredFocus || 'all';
  const allDrafts = listQingmaoLowRankEconomyRuleDrafts();
  const matchingDrafts = selectedFocus === 'all'
    ? allDrafts
    : allDrafts.filter(entry => entry.focus === selectedFocus);
  const maxRules = Math.max(0, input.maxRules ?? matchingDrafts.length);
  const ruleDrafts = matchingDrafts.slice(0, maxRules);
  const deferredGrayTradeBoundaries = input.includeDeferredWarnings === false
    ? []
    : listDeferredQingmaoGrayTradeBoundaries();
  const sourceRefs = unique(ruleDrafts.flatMap(entry => [
    ...entry.sourceItemIds,
    ...entry.sourcePointerIds,
  ]));

  return {
    status: 'rule_draft_preview_only',
    version: economyRules.version,
    focus: selectedFocus,
    publicSummary: publicSummaryFor(selectedFocus),
    ruleDrafts,
    deferredGrayTradeBoundaries,
    inferredFocusHints,
    visibleSourceRefs: sourceRefs,
    forbiddenWrites: [...economyRules.boundaries.forbiddenWrites],
    allowedRuntimeOutputs: [...economyRules.boundaries.allowedRuntimeOutputs],
    blockedOutcomes: unique(ruleDrafts.map(entry => entry.blockedOutcome)),
    nextStepHint: nextStepFor(selectedFocus),
    statePatchApplied: false,
    canGrantReward: false,
    canOpenMarket: false,
    canWriteSave: false,
    deepSeekAuthority: 'no_new_authority',
    miroFishNeed: 'not_needed',
  };
}
