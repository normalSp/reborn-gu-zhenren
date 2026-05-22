import {
  buildV018QingmaoRouteMultiRegionOverview,
  type V018EntryBoundaryPreview,
  type V018EntryKind,
} from './v018-qingmao-route-multi-region';
import { buildV110RouteLocationOverview } from './v110-route-location-state';
import { buildV120LowRankSurvivalEconomyProjection } from './v120-low-rank-survival-economy-projection';
import { buildV130SocialPressureProjection } from './v130-social-pressure-projection';
import type { LivingWorldState, LocalActionLedgerEntry, RouteLocationState, SurvivalEconomyState } from '../types';

export type V140RegionSampleStatus = 'needs_route_context' | 'sample_visible';

export type V140RegionPostureId =
  | 'mountain_road_outer_edge'
  | 'caravan_contact_window'
  | 'rogue_settlement_hint'
  | 'city_outer_threshold';

export type V140RegionPostureStatus = 'visible' | 'needs_context';

export interface V140RegionPostureCard {
  id: V140RegionPostureId;
  title: string;
  status: V140RegionPostureStatus;
  summary: string;
  nextStep: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
  canUnlockLocation: false;
  canTransferFaction: false;
  canGrantReward: false;
  canSetNpcFate: false;
  canPatch: false;
  statePatchApplied: false;
}

export interface V140RegionSignalGroup {
  id: 'route' | 'survival' | 'social' | 'v018_boundary';
  title: string;
  statusLabel: string;
  summary: string;
  evidenceRefs: string[];
}

export interface V140RegionSampleProjectionAudit {
  phase: 'v1.4.0-b1-region-sample-projection';
  saveFormatPolicy: 'stay_v24_no_bump';
  persistentWritePolicy: 'none_projection_only';
  runtimeSourcePolicy: 'reuse_v110_v120_v130_v018_public_evidence';
  miroFishPolicy: 'topic_slice_reviewed_source_pointer_only';
  deepSeekPolicy: 'no_new_authority';
  legacyFieldPolicy: 'ignored_as_authority';
  canPromoteToStateWithoutUserDecision: false;
  requiredUserDecisionForState: string[];
  pass: boolean;
  notes: string[];
}

export interface V140RegionSampleProjection {
  status: V140RegionSampleStatus;
  statusLabel: string;
  scopeId: 'southern_border_low_rank_outer_sample';
  activePostureId: V140RegionPostureId | null;
  publicSummary: string;
  nextStep: string;
  postureCards: V140RegionPostureCard[];
  signalGroups: V140RegionSignalGroup[];
  boundaryLines: string[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  projectionAudit: V140RegionSampleProjectionAudit;
  modules: {
    v018Stage: string;
    routeStatus: string;
    survivalStatus: string;
    socialStatus: string;
  };
  saveFormatImpact: 'none_v24_projection_only';
  statePatchApplied: false;
  canWriteSave: false;
  canUnlockLocation: false;
  canOpenFormalTrade: false;
  canTransferFaction: false;
  canGrantReward: false;
  canSetNpcFate: false;
  deepSeekAuthority: 'no_new_authority';
  legacyFieldsIgnored: true;
}

export interface V140RegionSampleProjectionInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  routeLocationState?: Partial<RouteLocationState> | null;
  survivalEconomyState?: Partial<SurvivalEconomyState> | null;
  localActionLedger?: LocalActionLedgerEntry[] | null;
  materialBag?: Record<string, number> | null;
  turn?: number;
}

const REGION_SCOPE_ID = 'southern_border_low_rank_outer_sample';

const HIDDEN_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/春秋蝉/g, '受保护隐秘'],
  [/回溯/g, '受保护因果'],
  [/重生/g, '受保护经历'],
  [/fang_yuan_private_causality_hidden_anchor/g, '受保护私密引用'],
  [/private-body-redacted/g, '受保护私密引用'],
  [/v018_hidden_982eba1c3730/g, '受保护条目'],
  [/隐藏因果/g, '受保护因果'],
];

const FORMAL_CONCLUSION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/进入商家城/g, '抵近商家城外缘'],
  [/商家城核心/g, '商家城外缘门槛'],
  [/地点已解锁/g, '地点解锁结论已阻断'],
  [/路线已进入/g, '路线进入结论已阻断'],
  [/投靠成功/g, '正式阵营结论已阻断'],
  [/招揽成功/g, '正式招揽结论已阻断'],
  [/正式通缉已生效/g, '正式通缉结论已阻断'],
  [/奖励已发放/g, '奖励结算已阻断'],
  [/NPC已死亡/g, 'NPC 生死结论已阻断'],
];

const BASE_FORBIDDEN_WRITES = [
  'SAVE_FORMAT_VERSION_25',
  'regionSampleState',
  'regionalSampleState',
  'formal_region_state',
  'currentRegion',
  'route_entered',
  'location_unlock',
  'region_unlock',
  'full_southern_border_map',
  'full_shang_clan_city',
  'formal_caravan_membership',
  'formal_rogue_identity',
  'formal_trade',
  'formal_price_table',
  'formal_shop_inventory',
  'inventory_delta',
  'currency_delta',
  'material_reward',
  'gu_reward',
  'recipe_unlock',
  'reward',
  'faction_transfer',
  'standing_delta',
  'warrant_active',
  'formal_blockade',
  'npc_death',
  'npc_capture',
  'npc_fate_result',
  'hidden_fact_reveal',
  'canon_promotion',
  'deepseek_authority_expansion',
];

const REQUIRED_STATE_DECISIONS = [
  'approve_SAVE_FORMAT_VERSION_25',
  'approve_regionSampleState_or_equivalent_single_aggregate',
  'approve_migration_defaults_tests',
  'approve_formal_region_scope',
  'approve_Player_Advocate_upgrade',
  'approve_DeepSeek_visible_context_change_if_any',
];

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
}

function sanitizeVisibleText(value: string, fallback: string): string {
  let text = String(value || '').trim();
  for (const [pattern, replacement] of HIDDEN_TEXT_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of FORMAL_CONCLUSION_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text || fallback;
}

function sanitizeVisibleRefs(values: string[], max = 18): string[] {
  const blockedTokens = ['hidden', 'private', 'source_text', 'human_review', 'v018_hidden_982eba1c3730'];
  return unique(values)
    .filter(value => !blockedTokens.some(token => value.toLowerCase().includes(token)))
    .slice(0, max);
}

function boundaryByKind(boundaries: V018EntryBoundaryPreview[], kind: V018EntryKind): V018EntryBoundaryPreview | null {
  return boundaries.find(item => item.entryKind === kind) || null;
}

function boundaryVisible(boundaries: V018EntryBoundaryPreview[], kind: V018EntryKind): boolean {
  return boundaryByKind(boundaries, kind)?.status === 'visible_boundary';
}

function refsForBoundary(boundary: V018EntryBoundaryPreview | null): string[] {
  if (!boundary) return [];
  return sanitizeVisibleRefs([
    `entry:${boundary.id}`,
    ...boundary.satisfiedPrerequisites.map(item => `satisfied:${item}`),
    ...boundary.sourceItemIds.map(item => `source:${item}`),
  ], 8);
}

function routeEvidence(routeStatus: string, evidenceLedgerEntryIds: string[]): string[] {
  return sanitizeVisibleRefs([
    routeStatus ? `routeStatus:${routeStatus}` : '',
    ...evidenceLedgerEntryIds.map(id => `routeEvidence:${id}`),
  ], 8);
}

function sampleIsVisible(input: {
  routeStatus: string;
  v018Stage: string;
  survivalStatus: string;
  socialStatus: string;
}): boolean {
  return !['not_started', 'blocked'].includes(input.routeStatus)
    || !['blocked'].includes(input.v018Stage)
    || input.survivalStatus === 'pressure_visible'
    || input.socialStatus === 'pressure_visible';
}

function chooseActivePosture(cards: V140RegionPostureCard[]): V140RegionPostureId | null {
  const priority: V140RegionPostureId[] = [
    'city_outer_threshold',
    'caravan_contact_window',
    'rogue_settlement_hint',
    'mountain_road_outer_edge',
  ];
  return priority.find(id => cards.some(card => card.id === id && card.status === 'visible')) || null;
}

function buildPostureCard(input: {
  id: V140RegionPostureId;
  title: string;
  visible: boolean;
  summaryVisible: string;
  summaryMissing: string;
  nextStepVisible: string;
  nextStepMissing: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
}): V140RegionPostureCard {
  return {
    id: input.id,
    title: input.title,
    status: input.visible ? 'visible' : 'needs_context',
    summary: sanitizeVisibleText(input.visible ? input.summaryVisible : input.summaryMissing, input.summaryMissing),
    nextStep: sanitizeVisibleText(input.visible ? input.nextStepVisible : input.nextStepMissing, input.nextStepMissing),
    evidenceRefs: sanitizeVisibleRefs(input.evidenceRefs, 10),
    sourceRefs: sanitizeVisibleRefs(input.sourceRefs, 10),
    forbiddenWrites: unique([...BASE_FORBIDDEN_WRITES, ...input.forbiddenWrites]),
    canUnlockLocation: false,
    canTransferFaction: false,
    canGrantReward: false,
    canSetNpcFate: false,
    canPatch: false,
    statePatchApplied: false,
  };
}

export function buildV140RegionSampleProjection(
  input: V140RegionSampleProjectionInput = {},
): V140RegionSampleProjection {
  const turn = Math.max(0, Math.floor(Number(input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0)));
  const routeOverview = buildV110RouteLocationOverview({
    livingWorldState: input.livingWorldState,
    routeLocationState: input.routeLocationState,
    turn,
  });
  const survivalProjection = buildV120LowRankSurvivalEconomyProjection({
    livingWorldState: input.livingWorldState,
    routeLocationState: routeOverview.routeLocationState,
    materialBag: input.materialBag,
    turn,
  });
  const survivalStateStatus = typeof input.survivalEconomyState?.status === 'string'
    ? input.survivalEconomyState.status
    : '';
  const survivalStateLedgerCount = Array.isArray(input.survivalEconomyState?.ledger)
    ? input.survivalEconomyState.ledger.length
    : 0;
  const socialProjection = buildV130SocialPressureProjection({
    livingWorldState: input.livingWorldState,
    localActionLedger: input.localActionLedger,
    maxSignals: 8,
  });
  const v018Overview = buildV018QingmaoRouteMultiRegionOverview({
    livingWorldState: input.livingWorldState,
  });

  const routeStatus = routeOverview.routeLocationState.status;
  const survivalVisible = survivalProjection.status === 'pressure_visible'
    || survivalStateStatus === 'pressure_tracked'
    || survivalStateLedgerCount > 0;
  const socialVisible = socialProjection.status === 'pressure_visible';
  const mountainVisible = ['preparing_departure', 'route_in_progress', 'outer_edge_projection'].includes(routeStatus)
    || v018Overview.milestones.some(item => item.requirement === 'mountain_pass_candidate' && item.satisfied);
  const caravanVisible = boundaryVisible(v018Overview.entryBoundaries, 'caravan')
    || survivalProjection.pressureItems.some(item => item.id === 'trade_window' && item.status === 'visible')
    || socialProjection.factionPreconditions.some(item => item.kind === 'trade_window');
  const rogueVisible = boundaryVisible(v018Overview.entryBoundaries, 'rogue')
    || v018Overview.stage === 'candidate_continuation'
    || (mountainVisible && survivalVisible);
  const cityVisible = boundaryVisible(v018Overview.entryBoundaries, 'shang_outer')
    || ['commitment_preview', 'candidate_continuation'].includes(v018Overview.stage);

  const caravanBoundary = boundaryByKind(v018Overview.entryBoundaries, 'caravan');
  const rogueBoundary = boundaryByKind(v018Overview.entryBoundaries, 'rogue');
  const cityBoundary = boundaryByKind(v018Overview.entryBoundaries, 'shang_outer');

  const forbiddenWrites = unique([
    ...BASE_FORBIDDEN_WRITES,
    ...routeOverview.forbiddenWrites,
    ...survivalProjection.forbiddenWrites,
    ...socialProjection.forbiddenWrites,
    ...v018Overview.forbiddenWrites,
  ]);

  const postureCards: V140RegionPostureCard[] = [
    buildPostureCard({
      id: 'mountain_road_outer_edge',
      title: '山路外缘',
      visible: mountainVisible,
      summaryVisible: `已能把路线读到${routeOverview.locationLabel} / ${routeOverview.regionLabel}；这里只是山路与离山外缘样板。`,
      summaryMissing: '尚缺离山目标、路线准备或山路候选证据；区域样板保持等待。',
      nextStepVisible: '继续核对补给、遮掩和追查压力；不写 route_entered、正式地点或完整南疆地图。',
      nextStepMissing: '先通过本地行动建立逃离青茅、路线准备或山路候选，再打开区域样板。',
      evidenceRefs: routeEvidence(routeStatus, routeOverview.evidenceLedgerEntryIds),
      sourceRefs: routeOverview.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPostureCard({
      id: 'caravan_contact_window',
      title: '商队接触窗口',
      visible: caravanVisible,
      summaryVisible: caravanBoundary?.publicSummary || '商队只能作为询价、递话、担保和风险窗口；交易与身份都不是正式结论。',
      summaryMissing: '尚缺商队、市场窗口或公开担保证据；商队接触只保留为候选。',
      nextStepVisible: '可提示公开话头、身份遮掩和补给风险；不成交、不写价格、不写库存、不写正式商队身份。',
      nextStepMissing: '先补市场窗口、公开理由或路线门槛证据。',
      evidenceRefs: unique([
        ...refsForBoundary(caravanBoundary),
        ...survivalProjection.pressureItems.find(item => item.id === 'trade_window')?.evidenceRefs || [],
      ]),
      sourceRefs: unique([
        ...refsForBoundary(caravanBoundary),
        ...survivalProjection.pressureItems.find(item => item.id === 'trade_window')?.sourceRefs || [],
      ]),
      forbiddenWrites,
    }),
    buildPostureCard({
      id: 'rogue_settlement_hint',
      title: '散修落脚提示',
      visible: rogueVisible,
      summaryVisible: rogueBoundary?.publicSummary || '散修落脚只显示外缘传闻、补给压力和身份风险；不创建正式身份或稳定据点。',
      summaryMissing: '尚缺候选承接、补给压力或身份遮掩证据；散修落脚不主动展开。',
      nextStepVisible: '把补给、身份和追查作为风险提示；不写据点、不写阵营、不发奖励。',
      nextStepMissing: '先完成山路候选、补给缺口或公开遮掩，再考虑散修落脚提示。',
      evidenceRefs: unique([
        ...refsForBoundary(rogueBoundary),
        ...survivalProjection.pressureItems.filter(item => item.status === 'visible').flatMap(item => item.evidenceRefs),
        ...socialProjection.signals.slice(0, 3).flatMap(signal => signal.visibleSourceRefs),
      ]),
      sourceRefs: unique([
        ...refsForBoundary(rogueBoundary),
        ...survivalProjection.visibleSourceRefs.slice(0, 4),
        ...socialProjection.visibleSourceRefs.slice(0, 4),
      ]),
      forbiddenWrites,
    }),
    buildPostureCard({
      id: 'city_outer_threshold',
      title: '商家城外缘门槛',
      visible: cityVisible,
      summaryVisible: cityBoundary?.publicSummary || '只显示大型城池外缘门槛、公开理由和风险，不开放城市核心。',
      summaryMissing: '尚缺路线承诺、候选承接和公开入城理由；城外缘保持门槛态。',
      nextStepVisible: '继续检查公开理由、担保和追查风险；不进入城市核心、不开放正式地点、商店或任务奖励。',
      nextStepMissing: '先完成离山门槛、候选承接和商队/市场公开理由。',
      evidenceRefs: refsForBoundary(cityBoundary),
      sourceRefs: refsForBoundary(cityBoundary),
      forbiddenWrites,
    }),
  ];

  const status: V140RegionSampleStatus = sampleIsVisible({
    routeStatus,
    v018Stage: v018Overview.stage,
    survivalStatus: survivalProjection.status,
    socialStatus: socialProjection.status,
  }) ? 'sample_visible' : 'needs_route_context';
  const activePostureId = chooseActivePosture(postureCards);
  const rawSignalGroups: V140RegionSignalGroup[] = [
    {
      id: 'route',
      title: '路线证据',
      statusLabel: routeOverview.statusLabel,
      summary: routeOverview.publicSummary,
      evidenceRefs: routeEvidence(routeStatus, routeOverview.evidenceLedgerEntryIds),
    },
    {
      id: 'survival',
      title: '生存压力',
      statusLabel: survivalProjection.statusLabel,
      summary: survivalProjection.publicSummary,
      evidenceRefs: unique([
        survivalStateStatus ? `survivalState:${survivalStateStatus}` : '',
        survivalStateLedgerCount > 0 ? `survivalLedger:${survivalStateLedgerCount}` : '',
        ...survivalProjection.pressureItems
          .filter(item => item.status === 'visible')
          .flatMap(item => item.evidenceRefs),
      ]),
    },
    {
      id: 'social',
      title: '社会反应',
      statusLabel: socialProjection.statusLabel,
      summary: socialProjection.publicSummary,
      evidenceRefs: socialProjection.signals.slice(0, 5).flatMap(signal => signal.visibleSourceRefs),
    },
    {
      id: 'v018_boundary',
      title: '区域边界',
      statusLabel: v018Overview.stageLabel,
      summary: v018Overview.publicSummary,
      evidenceRefs: v018Overview.entryBoundaries
        .filter(item => item.status === 'visible_boundary')
        .map(item => `entry:${item.id}`),
    },
  ];
  const signalGroups: V140RegionSignalGroup[] = rawSignalGroups.map(group => ({
    ...group,
    summary: sanitizeVisibleText(group.summary, '需要更多公开证据。'),
    evidenceRefs: sanitizeVisibleRefs(group.evidenceRefs, 8),
  }));

  const visibleSourceRefs = sanitizeVisibleRefs([
    'v1.4.0-a1:D-141-001',
    'v1.4.0-a1:D-141-002',
    'v1.4.0-a1:D-141-003',
    'v1.4.0-a1:D-141-004',
    'v1.4.0-a1:D-141-005',
    'v1.4.0-a1:D-141-006',
    'v1.4.0-a1:D-141-007',
    'v1.4.0-a1:D-141-008',
    'v1.4.0-a2:mirofish-topic-slice-intake',
    'v0.18:route-entry-state-and-milestones-pack:intake-reviewed-rule-source',
    'v0.18:southern-border-low-rank-region-fact-cards-pack:intake-reviewed-rule-source',
    'v0.18:post-qingmao-pressure-reaction-pack:intake-reviewed-rule-source',
    ...routeOverview.visibleSourceRefs,
    ...sanitizeVisibleRefs(input.survivalEconomyState?.sourceRefs || []),
    ...survivalProjection.visibleSourceRefs,
    ...socialProjection.visibleSourceRefs,
    ...v018Overview.visibleSourceRefs,
  ]);

  return {
    status,
    statusLabel: status === 'sample_visible' ? '南疆低阶区域样板可读' : '等待路线上下文',
    scopeId: REGION_SCOPE_ID,
    activePostureId,
    publicSummary: status === 'sample_visible'
      ? '南疆早期低阶区域样板已可投影：只显示山路外缘、商队接触、散修落脚提示和城外缘门槛，不写正式地点、阵营、交易、奖励或 NPC 生死。'
      : '当前还没有足够路线/生存/社会证据支撑南疆区域样板；v1.4 保持 projection-first，不写新存档字段。',
    nextStep: status === 'sample_visible'
      ? '按当前最强公开证据选择下一步准备：路线、补给、公开理由或风险回避；所有区域结论仍需后续门禁。'
      : '先完成离山目标、路线准备、补给/喂养或公开反应，再读取区域样板。',
    postureCards,
    signalGroups,
    boundaryLines: [
      'v1.4 b1 是 projection-first：当前版本不新增 regionSampleState / regionalSampleState。',
      '本 helper 只读 v1.1 routeLocationState、v1.2 survivalEconomyState、v1.3 livingWorld 社会证据与 v0.18 已审查区域边界。',
      '山路外缘、商队接触、散修落脚、商家城外缘只作为早期样板；不开放完整南疆地图、正式地点、城市核心或势力身份。',
      '不写交易、价格、库存、奖励、正式任务、通缉、封锁、NPC 生死或隐藏事实揭露。',
      'MiroFish 基础包和 v0.18 包只作为 source pointer / reviewed rule source；不是 runtime canon、DeepSeek 权限或玩家可见隐藏事实。',
      'DeepSeek 只能写叙事、线索、传闻、请求和压力表达；本地 engine/store 才能拥有事实结算。',
    ],
    visibleSourceRefs,
    forbiddenWrites,
    projectionAudit: {
      phase: 'v1.4.0-b1-region-sample-projection',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      runtimeSourcePolicy: 'reuse_v110_v120_v130_v018_public_evidence',
      miroFishPolicy: 'topic_slice_reviewed_source_pointer_only',
      deepSeekPolicy: 'no_new_authority',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToStateWithoutUserDecision: false,
      requiredUserDecisionForState: [...REQUIRED_STATE_DECISIONS],
      pass: true,
      notes: [
        'b1 keeps region sample recomputable from existing public evidence.',
        'region state, formal location unlock, formal trade, faction transfer, reward, NPC fate, and hidden-fact writes remain forbidden.',
        'v1.4 does not change DeepSeek visible context or runtime authority.',
      ],
    },
    modules: {
      v018Stage: v018Overview.stage,
      routeStatus,
      survivalStatus: survivalStateStatus || survivalProjection.status,
      socialStatus: socialProjection.status,
    },
    saveFormatImpact: 'none_v24_projection_only',
    statePatchApplied: false,
    canWriteSave: false,
    canUnlockLocation: false,
    canOpenFormalTrade: false,
    canTransferFaction: false,
    canGrantReward: false,
    canSetNpcFate: false,
    deepSeekAuthority: 'no_new_authority',
    legacyFieldsIgnored: true,
  };
}
