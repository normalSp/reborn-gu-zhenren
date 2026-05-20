import {
  buildQingmaoLowRankEconomyPlan,
  type QingmaoLowRankEconomyPlan,
} from './v015-qingmao-low-rank-economy';
import { buildV110RouteLocationOverview } from './v110-route-location-state';
import type { LivingActionConsequenceEntry, LivingWorldState, RouteLocationState } from '../types';

export type V120SurvivalProjectionStatus = 'needs_context' | 'pressure_visible';

export type V120SurvivalPressureItemStatus = 'visible' | 'needs_context' | 'deferred';

export type V120SurvivalPressureItemId =
  | 'route_supply'
  | 'gu_upkeep'
  | 'refinement_preparation'
  | 'trade_window'
  | 'gray_trade_boundary'
  | 'anti_farm';

export interface V120SurvivalPressureItem {
  id: V120SurvivalPressureItemId;
  title: string;
  status: V120SurvivalPressureItemStatus;
  summary: string;
  nextStep: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
}

export interface V120LowRankSurvivalEconomyProjection {
  status: V120SurvivalProjectionStatus;
  statusLabel: string;
  publicSummary: string;
  nextStep: string;
  routeSummary: string;
  routeStatusLabel: string;
  pressureItems: V120SurvivalPressureItem[];
  boundaryLines: string[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  plans: {
    supply: QingmaoLowRankEconomyPlan;
    feeding: QingmaoLowRankEconomyPlan;
    refinement: QingmaoLowRankEconomyPlan;
    market: QingmaoLowRankEconomyPlan;
    antiFarm: QingmaoLowRankEconomyPlan;
    grayTrade: QingmaoLowRankEconomyPlan;
  };
  saveFormatImpact: 'none';
  statePatchApplied: false;
  canWriteSave: false;
  canGrantReward: false;
  canSettleConsumption: false;
  canOpenMarket: false;
  deepSeekAuthority: 'no_new_authority';
}

export interface V120LowRankSurvivalEconomyInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  routeLocationState?: Partial<RouteLocationState> | null;
  materialBag?: Record<string, number> | null;
  turn?: number;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function hasKnownFact(state: Partial<LivingWorldState> | null | undefined, id: string): boolean {
  return Boolean(state?.knownFacts?.[id]);
}

function consequenceMatches(
  state: Partial<LivingWorldState> | null | undefined,
  predicate: (entry: LivingActionConsequenceEntry) => boolean,
): boolean {
  return (state?.actionConsequences || []).some(predicate);
}

function hasConsequenceAction(state: Partial<LivingWorldState> | null | undefined, actionId: string): boolean {
  return consequenceMatches(state, entry => entry.actionId === actionId);
}

function materialCount(input: V120LowRankSurvivalEconomyInput, name: string): number {
  return Math.max(0, Math.floor(Number(input.materialBag?.[name] || 0)));
}

function hasRoutePressure(input: V120LowRankSurvivalEconomyInput): boolean {
  const routeStatus = input.routeLocationState?.status || '';
  if (['preparing_departure', 'route_in_progress', 'outer_edge_projection'].includes(routeStatus)) return true;
  return Boolean(
    hasKnownFact(input.livingWorldState, 'qingmao_escape_route_preparation_baseline')
    || hasKnownFact(input.livingWorldState, 'qingmao_mountain_pass_route_continuation_candidate')
    || hasKnownFact(input.livingWorldState, 'v100_low_rank_life_loop_release_acceptance')
    || hasConsequenceAction(input.livingWorldState, 'qingmao_escape_route_preparation_probe')
    || hasConsequenceAction(input.livingWorldState, 'qingmao_mountain_pass_route_continuation_probe')
  );
}

function evidenceFor(
  input: V120LowRankSurvivalEconomyInput,
  ids: string[],
): string[] {
  return unique(ids.flatMap(id => {
    if (hasKnownFact(input.livingWorldState, id)) return [`fact:${id}`];
    if (hasConsequenceAction(input.livingWorldState, id)) return [`action:${id}`];
    return [];
  }));
}

function baseForbiddenWrites(plans: QingmaoLowRankEconomyPlan[]): string[] {
  return unique([
    ...plans.flatMap(plan => plan.forbiddenWrites),
    'save_format_bump',
    'survivalEconomyState_write',
    'material_reward',
    'currency_delta',
    'material_consumption',
    'gu_reward',
    'recipe_unlock',
    'refinement_success',
    'refinement_failure_cost_settlement',
    'formal_inventory',
    'formal_price_table',
    'formal_shop_inventory',
    'formal_market_trade',
    'black_market_trade',
    'commission_profit',
    'trade_success',
    'item_purchase',
    'item_sale',
    'route_entered',
    'location_unlock',
    'region_unlock',
    'faction_transfer',
    'standing_delta',
    'npc_death',
    'npc_capture',
    'hidden_fact_reveal',
    'deepseek_authority_expansion',
  ]);
}

function sourceRefsFor(plan: QingmaoLowRankEconomyPlan, max = 8): string[] {
  return unique([
    ...plan.ruleDrafts.flatMap(rule => rule.sourceItemIds),
    ...plan.visibleSourceRefs,
  ]).slice(0, max);
}

function planHint(plan: QingmaoLowRankEconomyPlan, fallback: string): string {
  return plan.ruleDrafts[0]?.publicHint || plan.publicSummary || fallback;
}

export function buildV120LowRankSurvivalEconomyProjection(
  input: V120LowRankSurvivalEconomyInput = {},
): V120LowRankSurvivalEconomyProjection {
  const turn = Math.max(0, Math.floor(Number(input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0)));
  const routeOverview = buildV110RouteLocationOverview({
    routeLocationState: input.routeLocationState,
    livingWorldState: input.livingWorldState,
    turn,
  });
  const plans = {
    supply: buildQingmaoLowRankEconomyPlan({ focus: 'supply', includeDeferredWarnings: false, maxRules: 4 }),
    feeding: buildQingmaoLowRankEconomyPlan({ focus: 'feeding', includeDeferredWarnings: false, maxRules: 4 }),
    refinement: buildQingmaoLowRankEconomyPlan({ focus: 'refinement', includeDeferredWarnings: false, maxRules: 4 }),
    market: buildQingmaoLowRankEconomyPlan({ focus: 'market', includeDeferredWarnings: false, maxRules: 5 }),
    antiFarm: buildQingmaoLowRankEconomyPlan({ focus: 'anti_farm', includeDeferredWarnings: false, maxRules: 3 }),
    grayTrade: buildQingmaoLowRankEconomyPlan({ focus: 'gray_trade', includeDeferredWarnings: true, maxRules: 2 }),
  };
  const allPlans = Object.values(plans);
  const forbiddenWrites = baseForbiddenWrites(allPlans);
  const routePressure = hasRoutePressure(input);
  const supplyEvidence = evidenceFor(input, [
    'qingmao_supply_feeding_preparation_baseline',
    'qingmao_supply_feeding_preparation_probe',
    'v100_low_rank_life_loop_release_acceptance',
  ]);
  const refinementEvidence = evidenceFor(input, [
    'qingmao_refinement_fragment_boundary_baseline',
    'qingmao_refinement_boundary_probe',
    'v100_low_rank_life_loop_release_acceptance',
  ]);
  const marketEvidence = evidenceFor(input, [
    'qingmao_market_window_candidate_baseline',
    'qingmao_market_window_probe',
    'v100_low_rank_life_loop_release_acceptance',
  ]);
  const wineCount = materialCount(input, '美酒');
  const moonGrassCount = materialCount(input, '月华草');
  const anyEconomyEvidence = supplyEvidence.length > 0 || refinementEvidence.length > 0 || marketEvidence.length > 0;
  const status: V120SurvivalProjectionStatus = routePressure || anyEconomyEvidence ? 'pressure_visible' : 'needs_context';

  const pressureItems: V120SurvivalPressureItem[] = [
    {
      id: 'route_supply',
      title: '路线补给压力',
      status: routePressure || supplyEvidence.length > 0 ? 'visible' : 'needs_context',
      summary: routePressure
        ? `路线范围为${routeOverview.locationLabel}；补给、落脚和遮掩仍是前置压力。`
        : '尚缺明确路线/地点压力；先同步路线范围或完成离山准备。',
      nextStep: routePressure
        ? '把食水、落脚理由和遮掩口径作为下一步准备，不写路线进入或地点解锁。'
        : '先建立逃离青茅或南疆外缘目标，再查看补给缺口。',
      evidenceRefs: unique([routePressure ? 'route:v110' : '', ...supplyEvidence]),
      sourceRefs: sourceRefsFor(plans.supply),
      forbiddenWrites,
    },
    {
      id: 'gu_upkeep',
      title: '蛊虫喂养与维护',
      status: supplyEvidence.length > 0 || wineCount > 0 ? 'visible' : 'needs_context',
      summary: `${planHint(plans.feeding, '食料压力只显示缺口。')}${wineCount > 0 ? ` 当前可见美酒 ${wineCount} 份，但本投影不自动消耗。` : ''}`,
      nextStep: '显示酒虫等低阶蛊的食料压力；不扣食料、不补库存、不写成长收益。',
      evidenceRefs: supplyEvidence,
      sourceRefs: sourceRefsFor(plans.feeding),
      forbiddenWrites,
    },
    {
      id: 'refinement_preparation',
      title: '炼养用准备',
      status: refinementEvidence.length > 0 || moonGrassCount > 0 ? 'visible' : 'needs_context',
      summary: `${planHint(plans.refinement, '残方、材料缺口和失败风险只作为准备压力。')}${moonGrassCount > 0 ? ` 当前可见月华草 ${moonGrassCount} 份，但本投影不判定炼成。` : ''}`,
      nextStep: '把残方不完整、材料验证和失败代价列为准备项；不消耗材料、不解锁蛊方、不判定成功失败。',
      evidenceRefs: refinementEvidence,
      sourceRefs: sourceRefsFor(plans.refinement),
      forbiddenWrites,
    },
    {
      id: 'trade_window',
      title: '商队与交易窗口',
      status: marketEvidence.length > 0 || routePressure ? 'visible' : 'needs_context',
      summary: planHint(plans.market, '商队接触只能作为窗口。'),
      nextStep: '只允许询价、递话、身份担保和风险提示；不写价格、不成交、不开放库存。',
      evidenceRefs: marketEvidence,
      sourceRefs: sourceRefsFor(plans.market),
      forbiddenWrites,
    },
    {
      id: 'gray_trade_boundary',
      title: '灰色渠道边界',
      status: 'deferred',
      summary: plans.grayTrade.deferredGrayTradeBoundaries[0]?.publicHint || '黑市、委托和代售只作为风险边界，不作为 v1.2 第一刀功能。',
      nextStep: '保留为测试样本和风险提示；不开放黑市、委托收益或稳定套利。',
      evidenceRefs: [],
      sourceRefs: sourceRefsFor(plans.grayTrade),
      forbiddenWrites,
    },
    {
      id: 'anti_farm',
      title: '反刷与套利防线',
      status: 'visible',
      summary: planHint(plans.antiFarm, '重复补给、询价和资源动作必须有上限、递减或风险。'),
      nextStep: '把重复刷补给、刷价格、刷委托和刷 DeepSeek 奖励列入测试矩阵。',
      evidenceRefs: ['matrix:V12-ANTIFARM-001'],
      sourceRefs: sourceRefsFor(plans.antiFarm),
      forbiddenWrites,
    },
  ];

  const visibleSourceRefs = unique([
    'v1.2.0-a1:D-121-003',
    'v1.2.0-a1:D-121-004',
    'v1.2.0-a1:D-121-005',
    'v1.1:D-025-C27',
    ...pressureItems.flatMap(item => item.sourceRefs),
  ]);

  return {
    status,
    statusLabel: status === 'pressure_visible' ? '压力投影可读' : '等待前置',
    publicSummary: status === 'pressure_visible'
      ? '低阶生存经济压力已可投影：路线补给、蛊虫喂养、炼养用准备和交易窗口都保持为缺口/风险，不写正式结算。'
      : '低阶生存经济仍缺路线或历史经济证据；当前只显示规则边界，不写任何状态。',
    nextStep: status === 'pressure_visible'
      ? 'b1 可将这些压力作为只读/投影 UI 展示；若要持久账本，必须等 b2 再由用户批准 v24。'
      : '先完成路线范围同步、补给/喂养缺口或 v0.15/v1.0 life-loop 前置，再进入正式投影体验。',
    routeSummary: routeOverview.publicSummary,
    routeStatusLabel: routeOverview.statusLabel,
    pressureItems,
    boundaryLines: [
      'projection-only：不写 survivalEconomyState，不 bump SAVE_FORMAT_VERSION = 24。',
      '不发材料、不扣元石、不消耗食料、不结算炼蛊成功或失败。',
      '不写正式价格、商店库存、买卖、黑市、委托或稳定套利。',
      'DeepSeek 只能写压力、线索、传闻和请求；本地 engine/store 才能拥有事实结算。',
    ],
    visibleSourceRefs,
    forbiddenWrites,
    plans,
    saveFormatImpact: 'none',
    statePatchApplied: false,
    canWriteSave: false,
    canGrantReward: false,
    canSettleConsumption: false,
    canOpenMarket: false,
    deepSeekAuthority: 'no_new_authority',
  };
}
