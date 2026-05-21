import { buildV110RouteLocationOverview } from './v110-route-location-state';
import { buildV120LowRankSurvivalEconomyProjection } from './v120-low-rank-survival-economy-projection';
import { buildV130SocialPressureProjection } from './v130-social-pressure-projection';
import { buildV140RegionSampleProjection } from './v140-region-sample-projection';
import { buildV150ConflictAftermathProjection } from './v150-conflict-aftermath-projection';
import type {
  BattleOutcomeSummary,
  BattleResolutionStep,
  CombatEventCandidate,
  LivingWorldState,
  LocalActionLedgerEntry,
  RouteLocationState,
  SurvivalEconomyState,
} from '../types';

export type V170RegionalLifeStatus = 'needs_regional_context' | 'regional_life_visible';

export type V170RegionalLifePressureId =
  | 'outer_edge_interrogation'
  | 'caravan_contact_by_labor'
  | 'caravan_permission_chain'
  | 'low_status_labor'
  | 'temporary_market_window'
  | 'shelter_debt_window'
  | 'road_event_protocol'
  | 'far_city_as_pressure';

export type V170RegionalLifePressureStatus = 'visible' | 'needs_context';

export interface V170RegionalLifePressureCard {
  id: V170RegionalLifePressureId;
  title: string;
  status: V170RegionalLifePressureStatus;
  summary: string;
  nextStep: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
  canWriteSave: false;
  canUnlockLocation: false;
  canOpenFormalTrade: false;
  canTransferFaction: false;
  canGrantReward: false;
  canSetNpcFate: false;
  canPatch: false;
  statePatchApplied: false;
}

export interface V170RegionalLifeSignalGroup {
  id: 'route' | 'survival' | 'social' | 'region' | 'conflict' | 'topic_slice';
  title: string;
  statusLabel: string;
  summary: string;
  evidenceRefs: string[];
}

export interface V170RegionalLifeReplayabilityAudit {
  policy: 'same_start_replayability_without_persistence';
  variantSourcePolicy: 'local_pressure_deck_and_narrative_expression_only';
  stableFactPolicy: 'route_identity_reward_location_npc_fate_stable';
  candidatePressureIds: V170RegionalLifePressureId[];
  activeVariantIndex: number;
  minimumVisibleVariantsForB1: number;
  pass: boolean;
  forbiddenDifferenceSources: string[];
  notes: string[];
}

export interface V170RegionalLifeProjectionAudit {
  phase: 'v1.7.0-b1-regional-life-projection';
  saveFormatPolicy: 'stay_v24_no_bump';
  persistentWritePolicy: 'none_projection_only';
  runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v150_and_v170_a2_public_evidence';
  miroFishPolicy: 'v170_a2_topic_slice_source_pointer_only';
  deepSeekPolicy: 'no_new_authority_no_visible_mirofish_summary';
  legacyFieldPolicy: 'ignored_as_authority';
  canPromoteToStateWithoutUserDecision: false;
  requiredUserDecisionForState: string[];
  pass: boolean;
  notes: string[];
}

export interface V170RegionalLifeProjection {
  status: V170RegionalLifeStatus;
  statusLabel: string;
  scopeId: 'southern_border_low_rank_outer_edge_life_slice';
  savePolicy: 'no_new_persistence_v24';
  authority: 'local_projection_only';
  activePressureId: V170RegionalLifePressureId | null;
  publicSummary: string;
  nextStep: string;
  pressureCards: V170RegionalLifePressureCard[];
  signalGroups: V170RegionalLifeSignalGroup[];
  nextStepCandidates: string[];
  boundaryLines: string[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  replayabilityAudit: V170RegionalLifeReplayabilityAudit;
  projectionAudit: V170RegionalLifeProjectionAudit;
  modules: {
    routeStatus: string;
    survivalStatus: string;
    socialStatus: string;
    regionStatus: string;
    conflictStatus: string;
    visiblePressureCount: number;
  };
  saveFormatImpact: 'none_v24_projection_only';
  statePatchApplied: false;
  canWriteSave: false;
  canUnlockLocation: false;
  canOpenFormalTrade: false;
  canTransferFaction: false;
  canGrantReward: false;
  canSetNpcFate: false;
  canExpandDeepSeekAuthority: false;
  deepSeekAuthority: 'no_new_authority';
  legacyFieldsIgnored: true;
}

export interface V170RegionalLifeProjectionInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  routeLocationState?: Partial<RouteLocationState> | null;
  survivalEconomyState?: Partial<SurvivalEconomyState> | null;
  localActionLedger?: LocalActionLedgerEntry[] | null;
  materialBag?: Record<string, number> | null;
  combatEventCandidates?: CombatEventCandidate[] | null;
  battleResolutionSteps?: BattleResolutionStep[] | null;
  battleOutcomeSummary?: BattleOutcomeSummary | null;
  profile?: Record<string, unknown> | null;
  inventory?: unknown[] | null;
  currentChapterId?: string | null;
  turn?: number;
  variantIndex?: number;
}

const SCOPE_ID = 'southern_border_low_rank_outer_edge_life_slice';

const BASE_FORBIDDEN_WRITES = [
  'SAVE_FORMAT_VERSION_25',
  'regionalLifeState',
  'areaLivingState',
  'regionalEventLedger',
  'runFingerprint',
  'formal_region_state',
  'route_entered',
  'currentRegion',
  'location_unlock',
  'region_unlock',
  'full_southern_border_map',
  'full_shang_clan_city',
  'formal_caravan_membership',
  'formal_rogue_identity',
  'formal_faction_relation',
  'formal_trade',
  'formal_price_table',
  'formal_shop_inventory',
  'inventory_delta',
  'currency_delta',
  'material_reward',
  'gu_reward',
  'reward',
  'standing_delta',
  'faction_transfer',
  'warrant_active',
  'formal_pursuit',
  'formal_blockade',
  'npc_death',
  'npc_capture',
  'npc_fate_result',
  'hidden_fact_reveal',
  'fang_yuan_private_causality',
  'canon_promotion',
  'knowledge_index_entry',
  'deepseek_visible_mirofish_summary',
  'deepseek_rag',
  'deepseek_authority_expansion',
];

const REQUIRED_STATE_DECISIONS = [
  'approve_SAVE_FORMAT_VERSION_25',
  'approve_regionalLifeState_or_equivalent_single_aggregate',
  'approve_migration_defaults_tests',
  'approve_per_save_runFingerprint_or_regionalEventLedger',
  'approve_formal_region_location_or_caravan_scope',
  'approve_DeepSeek_visible_context_or_authority_change_if_any',
  'approve_Player_Advocate_and_live_probe_upgrade_if_scope_expands',
];

const HIDDEN_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/春秋蝉/g, '受保护隐秘'],
  [/回溯/g, '受保护因果'],
  [/重生/g, '受保护经历'],
  [/fang_yuan_private_causality_hidden_anchor/g, '受保护私密引用'],
  [/private-body-redacted/g, '受保护私密引用'],
  [/hidden_ref_only/g, '受保护引用'],
  [/hidden\/private/gi, '受保护内容'],
  [/隐藏因果/g, '受保护因果'],
];

const FORMAL_CONCLUSION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/正式加入商队/g, '正式商队身份结论已阻断'],
  [/加入商队成功/g, '正式商队身份结论已阻断'],
  [/成为正式成员/g, '正式成员结论已阻断'],
  [/进入商家城/g, '抵近商家城外缘'],
  [/商家城核心/g, '商家城外缘门槛'],
  [/地点已解锁/g, '地点解锁结论已阻断'],
  [/路线已进入/g, '路线进入结论已阻断'],
  [/投靠成功/g, '正式阵营结论已阻断'],
  [/招揽成功/g, '正式招揽结论已阻断'],
  [/正式通缉已生效/g, '正式通缉结论已阻断'],
  [/追杀令已生效/g, '正式追杀结论已阻断'],
  [/奖励已发放/g, '奖励结算已阻断'],
  [/获得强力蛊/g, '强力蛊奖励结论已阻断'],
  [/NPC已死亡/g, 'NPC 生死结论已阻断'],
  [/价格表已生成/g, '价格表结论已阻断'],
  [/库存已生成/g, '库存结论已阻断'],
];

const TOPIC_SOURCE_REFS: Record<V170RegionalLifePressureId, string[]> = {
  outer_edge_interrogation: ['v170:a2:outer_edge_ch0231_village_gate_interrogation'],
  caravan_contact_by_labor: [
    'v170:a2:caravan_ch0234_join_by_goods_and_labor',
    'v170:a2:caravan_ch0235_goods_as_entry_ticket',
  ],
  caravan_permission_chain: ['v170:a2:caravan_ch0236_request_and_report_to_manager'],
  low_status_labor: ['v170:a2:caravan_ch0236_low_status_labor_assignment'],
  temporary_market_window: [
    'v170:a2:market_ch0237_stall_sale_and_small_market',
    'v170:a2:market_ch0237_bargain_refusal',
  ],
  shelter_debt_window: [
    'v170:a2:caravan_ch0240_shelter_request_after_conflict',
    'v170:a2:caravan_ch0241_shelter_tent_arrangement',
  ],
  road_event_protocol: [
    'v170:a2:caravan_ch0241_road_event_protocol',
    'v170:a2:caravan_ch0242_goods_toll_event',
  ],
  far_city_as_pressure: ['v170:a2:outer_edge_ch0231_destination_hint_only'],
};

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

function sanitizeVisibleRefs(values: string[], max = 24): string[] {
  const blockedTokens = ['hidden', 'private', 'source_text', 'human_review', 'raw', 'quote', 'original', 'body'];
  return unique(values)
    .filter(value => !blockedTokens.some(token => value.toLowerCase().includes(token)))
    .slice(0, max);
}

function anyTextMatches(values: string[], pattern: RegExp): boolean {
  return values.some(value => pattern.test(value));
}

function ledgerRefs(entries: LocalActionLedgerEntry[] = []): string[] {
  return entries.slice(-8).flatMap(entry => [
    `ledger:${entry.id}`,
    `ledgerAction:${entry.actionType}`,
    ...(entry.risks || []).map(risk => `risk:${risk}`),
  ]);
}

function livingText(state?: Partial<LivingWorldState> | null, ledger: LocalActionLedgerEntry[] = []): string[] {
  return [
    ...Object.values(state?.knownFacts || {}).map(item => item.summary),
    ...(state?.actionConsequences || []).map(item => item.publicSummary),
    ...(state?.factionPressure || []).map(item => item.reason),
    ...(state?.npcMemories || []).map(item => item.publicSummary),
    ...(state?.playerGoals || []).flatMap(item => [item.rationale, ...item.nextStepHints]),
    ...ledger.flatMap(entry => [entry.summary, ...entry.risks]),
  ].map(value => String(value || ''));
}

function sourceRefsForPressure(id: V170RegionalLifePressureId, extraRefs: string[] = []): string[] {
  return sanitizeVisibleRefs([...TOPIC_SOURCE_REFS[id], ...extraRefs], 12);
}

function buildPressureCard(input: {
  id: V170RegionalLifePressureId;
  title: string;
  visible: boolean;
  summaryVisible: string;
  summaryMissing: string;
  nextStepVisible: string;
  nextStepMissing: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
}): V170RegionalLifePressureCard {
  return {
    id: input.id,
    title: input.title,
    status: input.visible ? 'visible' : 'needs_context',
    summary: sanitizeVisibleText(input.visible ? input.summaryVisible : input.summaryMissing, input.summaryMissing),
    nextStep: sanitizeVisibleText(input.visible ? input.nextStepVisible : input.nextStepMissing, input.nextStepMissing),
    evidenceRefs: sanitizeVisibleRefs(input.evidenceRefs, 10),
    sourceRefs: sourceRefsForPressure(input.id, input.sourceRefs),
    forbiddenWrites: unique([...BASE_FORBIDDEN_WRITES, ...input.forbiddenWrites]),
    canWriteSave: false,
    canUnlockLocation: false,
    canOpenFormalTrade: false,
    canTransferFaction: false,
    canGrantReward: false,
    canSetNpcFate: false,
    canPatch: false,
    statePatchApplied: false,
  };
}

function selectActivePressureId(cards: V170RegionalLifePressureCard[], variantIndex: number): V170RegionalLifePressureId | null {
  const visible = cards.filter(card => card.status === 'visible');
  if (visible.length === 0) return null;
  const safeIndex = Math.abs(Math.floor(Number.isFinite(variantIndex) ? variantIndex : 0)) % visible.length;
  return visible[safeIndex].id;
}

export function buildV170RegionalLifeProjection(
  input: V170RegionalLifeProjectionInput = {},
): V170RegionalLifeProjection {
  const turn = Math.max(0, Math.floor(Number(input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0)));
  const localActionLedger = Array.isArray(input.localActionLedger) ? input.localActionLedger : [];
  const textSignals = livingText(input.livingWorldState, localActionLedger);
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
  const socialProjection = buildV130SocialPressureProjection({
    livingWorldState: input.livingWorldState,
    localActionLedger,
    maxSignals: 8,
  });
  const regionProjection = buildV140RegionSampleProjection({
    livingWorldState: input.livingWorldState,
    routeLocationState: routeOverview.routeLocationState,
    survivalEconomyState: input.survivalEconomyState,
    localActionLedger,
    materialBag: input.materialBag,
    turn,
  });
  const conflictProjection = buildV150ConflictAftermathProjection({
    livingWorldState: input.livingWorldState,
    routeLocationState: routeOverview.routeLocationState,
    survivalEconomyState: input.survivalEconomyState,
    localActionLedger,
    materialBag: input.materialBag,
    combatEventCandidates: input.combatEventCandidates,
    battleResolutionSteps: input.battleResolutionSteps,
    battleOutcomeSummary: input.battleOutcomeSummary,
    profile: input.profile,
    inventory: input.inventory,
    currentChapterId: input.currentChapterId,
    turn,
  });

  const routeStatus = routeOverview.routeLocationState.status;
  const routeVisible = !['not_started', 'blocked'].includes(routeStatus);
  const survivalStateStatus = typeof input.survivalEconomyState?.status === 'string'
    ? input.survivalEconomyState.status
    : '';
  const survivalLedger = Array.isArray(input.survivalEconomyState?.ledger) ? input.survivalEconomyState.ledger : [];
  const tradeWindowVisible = survivalProjection.pressureItems.some(item => item.id === 'trade_window' && item.status === 'visible')
    || survivalLedger.some(item => item.category === 'trade_window');
  const routeSupplyVisible = survivalProjection.pressureItems.some(item => item.id === 'route_supply' && item.status === 'visible')
    || survivalLedger.some(item => item.category === 'route_supply');
  const socialVisible = socialProjection.status === 'pressure_visible';
  const regionVisible = regionProjection.status === 'sample_visible';
  const conflictVisible = conflictProjection.status === 'conflict_projection_visible';
  const caravanVisible = regionProjection.postureCards.some(card => card.id === 'caravan_contact_window' && card.status === 'visible')
    || tradeWindowVisible
    || anyTextMatches(textSignals, /商队|货物|短工|管事|市|摆摊|询价|压价/);
  const marketVisible = tradeWindowVisible || anyTextMatches(textSignals, /市场|集市|摆摊|询价|压价|补给/);
  const cityOuterVisible = regionProjection.postureCards.some(card => card.id === 'city_outer_threshold' && card.status === 'visible')
    || anyTextMatches(textSignals, /商家城|城门|大城|入城/);
  const interrogationVisible = routeVisible
    || regionProjection.postureCards.some(card => card.id === 'mountain_road_outer_edge' && card.status === 'visible')
    || anyTextMatches(textSignals, /盘问|守卫|身份|来意|山路|外缘/);
  const shelterVisible = conflictVisible
    || routeSupplyVisible
    || anyTextMatches(textSignals, /求助|收留|帐篷|受伤|遮蔽|人情|宿处/);
  const roadEventVisible = routeVisible
    || regionVisible
    || conflictVisible
    || anyTextMatches(textSignals, /路障|绕路|让步|货物|野外|山路/);

  const forbiddenWrites = unique([
    ...BASE_FORBIDDEN_WRITES,
    ...routeOverview.forbiddenWrites,
    ...survivalProjection.forbiddenWrites,
    ...socialProjection.forbiddenWrites,
    ...regionProjection.forbiddenWrites,
    ...conflictProjection.forbiddenWrites,
  ]);
  const routeRefs = routeOverview.evidenceLedgerEntryIds.map(id => `routeEvidence:${id}`);
  const survivalRefs = [
    survivalStateStatus ? `survivalState:${survivalStateStatus}` : '',
    survivalLedger.length > 0 ? `survivalLedger:${survivalLedger.length}` : '',
    ...survivalLedger.map(item => `survivalLedgerCategory:${item.category}`),
    ...survivalProjection.pressureItems.filter(item => item.status === 'visible').flatMap(item => item.evidenceRefs),
  ];
  const socialRefs = socialProjection.signals.slice(0, 5).flatMap(signal => signal.visibleSourceRefs);
  const regionRefs = regionProjection.postureCards.filter(card => card.status === 'visible').flatMap(card => card.evidenceRefs);
  const conflictRefs = conflictProjection.signalGroups.flatMap(group => group.evidenceRefs).slice(0, 12);

  const pressureCards: V170RegionalLifePressureCard[] = [
    buildPressureCard({
      id: 'outer_edge_interrogation',
      title: '外缘盘问',
      visible: interrogationVisible,
      summaryVisible: '山路或村口外缘已经有公开盘问压力；这里只提示解释身份和来意，不解锁正式地点。',
      summaryMissing: '尚缺山路、守卫或外缘身份压力证据；盘问候选保持等待。',
      nextStepVisible: '准备公开理由、遮掩痕迹或低调绕行；不写阵营身份、地点进入或追杀结论。',
      nextStepMissing: '先建立离山路线、外缘证据或公开接触痕迹。',
      evidenceRefs: unique([...routeRefs, ...regionRefs, ...ledgerRefs(localActionLedger)]),
      sourceRefs: [...routeOverview.visibleSourceRefs, ...regionProjection.visibleSourceRefs],
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'caravan_contact_by_labor',
      title: '商队短工窗口',
      visible: caravanVisible,
      summaryVisible: '商队接触只能表现为货物、短工、递话或中介窗口；不是正式加入商队。',
      summaryMissing: '尚缺商队、货物或市场接触证据；商队短工窗口保持候选。',
      nextStepVisible: '可以选择搬运、递话、展示普通货物或找担保；不写正式商队成员身份。',
      nextStepMissing: '先补市场窗口、补给压力或公开引荐理由。',
      evidenceRefs: unique([...survivalRefs, ...socialRefs, ...regionRefs]),
      sourceRefs: [...survivalProjection.visibleSourceRefs, ...socialProjection.visibleSourceRefs, ...regionProjection.visibleSourceRefs],
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'caravan_permission_chain',
      title: '商队许可链',
      visible: caravanVisible && (socialVisible || routeSupplyVisible),
      summaryVisible: '接近商队需要引荐、报到和负责人点头；本阶段只显示许可链，不绑定命名 NPC 权威。',
      summaryMissing: '尚缺社会压力、担保或补给理由；许可链不展开。',
      nextStepVisible: '先找公开担保、解释来路和能提供的短期价值；不写 NPC 关系结论。',
      nextStepMissing: '先产生公开社会证据或商队接触证据。',
      evidenceRefs: unique([...socialRefs, ...survivalRefs]),
      sourceRefs: [...socialProjection.visibleSourceRefs, ...survivalProjection.visibleSourceRefs],
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'low_status_labor',
      title: '低身份杂务',
      visible: caravanVisible && (routeSupplyVisible || marketVisible),
      summaryVisible: '低阶外缘可显示搬运、卸货、杂务和被安排的低身份压力；不结算奖励或长期职位。',
      summaryMissing: '尚缺商队接触或补给缺口；低身份杂务不主动出现。',
      nextStepVisible: '把劳动作为换取消息、遮蔽或临时容身的候选；不写工资、奖励、职位或库存。',
      nextStepMissing: '先建立商队、市场或生存压力证据。',
      evidenceRefs: unique([...survivalRefs, ...regionRefs]),
      sourceRefs: [...survivalProjection.visibleSourceRefs, ...regionProjection.visibleSourceRefs],
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'temporary_market_window',
      title: '临时市场窗口',
      visible: marketVisible,
      summaryVisible: '小集市、摆摊、询价、压价和拒绝可以作为公开压力；不生成价格表、库存或正式交易。',
      summaryMissing: '尚缺市场、补给或货物接触证据；临时市场窗口保持候选。',
      nextStepVisible: '可打听补给、接受压价或等待更好话头；交易结算仍由未来门禁决定。',
      nextStepMissing: '先补充生存经济压力或市场公开接触。',
      evidenceRefs: unique([...survivalRefs, ...routeRefs]),
      sourceRefs: [...survivalProjection.visibleSourceRefs, ...routeOverview.visibleSourceRefs],
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'shelter_debt_window',
      title: '遮蔽与人情债',
      visible: shelterVisible,
      summaryVisible: '受伤、低调求助或临时遮蔽可以形成短期人情压力；不决定 NPC 生死或正式庇护关系。',
      summaryMissing: '尚缺冲突、补给缺口或求助证据；遮蔽窗口保持等待。',
      nextStepVisible: '选择低调求助、守夜、偿还人情或暂避风险；不写 NPC 命运或正式关系。',
      nextStepMissing: '先建立冲突、路线补给或公开求助证据。',
      evidenceRefs: unique([...survivalRefs, ...conflictRefs, ...ledgerRefs(localActionLedger)]),
      sourceRefs: [...conflictProjection.visibleSourceRefs, ...survivalProjection.visibleSourceRefs],
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'road_event_protocol',
      title: '路途事件协议',
      visible: roadEventVisible,
      summaryVisible: '路障、野外事件、货物让步和绕路压力只作为事件协议；不直接生成战斗、消耗或奖励结算。',
      summaryMissing: '尚缺路线、区域或冲突证据；路途事件协议保持等待。',
      nextStepVisible: '先选择让步、绕路、等待或公开解释；战斗和消耗由本地系统另行裁决。',
      nextStepMissing: '先建立路线承接、区域外缘或冲突压力证据。',
      evidenceRefs: unique([...routeRefs, ...regionRefs, ...conflictRefs]),
      sourceRefs: [...routeOverview.visibleSourceRefs, ...regionProjection.visibleSourceRefs, ...conflictProjection.visibleSourceRefs],
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'far_city_as_pressure',
      title: '远城压力指向',
      visible: cityOuterVisible,
      summaryVisible: '远方大城只能作为长期方向和外缘门槛提醒；不开放完整商家城或正式入城。',
      summaryMissing: '尚缺城外缘、路线承诺或公开入城理由；远城压力仅保留为后续方向。',
      nextStepVisible: '继续收集担保、补给和低阶公开理由；不进入城市核心、不开放商店或任务奖励。',
      nextStepMissing: '先完成路线承接、商队或市场公开接触。',
      evidenceRefs: unique([...regionRefs, ...routeRefs]),
      sourceRefs: [...regionProjection.visibleSourceRefs, ...routeOverview.visibleSourceRefs],
      forbiddenWrites,
    }),
  ];

  const visibleCards = pressureCards.filter(card => card.status === 'visible');
  const computedVariantIndex = input.variantIndex ?? (
    turn
    + localActionLedger.length
    + survivalLedger.length
    + Object.keys(input.livingWorldState?.knownFacts || {}).length
  );
  const activePressureId = selectActivePressureId(pressureCards, computedVariantIndex);
  const status: V170RegionalLifeStatus = visibleCards.length > 0 ? 'regional_life_visible' : 'needs_regional_context';

  const rawSignalGroups: V170RegionalLifeSignalGroup[] = [
    {
      id: 'route',
      title: '路线承接',
      statusLabel: routeOverview.statusLabel,
      summary: routeOverview.publicSummary,
      evidenceRefs: routeRefs,
    },
    {
      id: 'survival',
      title: '生存经济',
      statusLabel: survivalProjection.statusLabel,
      summary: survivalProjection.publicSummary,
      evidenceRefs: survivalRefs,
    },
    {
      id: 'social',
      title: '社会压力',
      statusLabel: socialProjection.statusLabel,
      summary: socialProjection.publicSummary,
      evidenceRefs: socialRefs,
    },
    {
      id: 'region',
      title: '区域样板',
      statusLabel: regionProjection.statusLabel,
      summary: regionProjection.publicSummary,
      evidenceRefs: regionRefs,
    },
    {
      id: 'conflict',
      title: '冲突风险',
      statusLabel: conflictProjection.statusLabel,
      summary: conflictProjection.publicSummary,
      evidenceRefs: conflictRefs,
    },
    {
      id: 'topic_slice',
      title: 'a2 切片',
      statusLabel: 'source-pointer ready',
      summary: 'a2 只提供低阶外缘生活压力 deck：盘问、商队短工、许可链、市场、遮蔽、人情债和路途协议。',
      evidenceRefs: visibleCards.flatMap(card => card.sourceRefs.slice(0, 2)),
    },
  ];
  const signalGroups: V170RegionalLifeSignalGroup[] = rawSignalGroups.map(group => ({
    ...group,
    summary: sanitizeVisibleText(group.summary, '需要更多公开证据。'),
    evidenceRefs: sanitizeVisibleRefs(group.evidenceRefs, 10),
  }));

  const visibleSourceRefs = sanitizeVisibleRefs([
    'v1.7.0-a1:D-171-002',
    'v1.7.0-a1:D-171-003',
    'v1.7.0-a1:D-171-005',
    'v1.7.0-a2:southern_border_low_rank_outer_edge_life_slice:intake-reviewed',
    'v1.7.0-a2:regional-life-rule-draft',
    ...Object.values(TOPIC_SOURCE_REFS).flat(),
    ...routeOverview.visibleSourceRefs,
    ...survivalProjection.visibleSourceRefs,
    ...socialProjection.visibleSourceRefs,
    ...regionProjection.visibleSourceRefs,
    ...conflictProjection.visibleSourceRefs,
  ], 80);

  const candidatePressureIds = visibleCards.map(card => card.id);
  const replayabilityAudit: V170RegionalLifeReplayabilityAudit = {
    policy: 'same_start_replayability_without_persistence',
    variantSourcePolicy: 'local_pressure_deck_and_narrative_expression_only',
    stableFactPolicy: 'route_identity_reward_location_npc_fate_stable',
    candidatePressureIds,
    activeVariantIndex: Math.abs(Math.floor(Number(computedVariantIndex) || 0)),
    minimumVisibleVariantsForB1: 3,
    pass: candidatePressureIds.length >= 3 && pressureCards.every(card => (
      !card.canWriteSave
      && !card.canUnlockLocation
      && !card.canGrantReward
      && !card.canSetNpcFate
    )),
    forbiddenDifferenceSources: [
      'formal_location_change',
      'faction_or_caravan_membership_change',
      'reward_or_inventory_change',
      'npc_life_death_change',
      'hidden_or_private_fact_reveal',
      'deepseek_fact_authority',
    ],
    notes: [
      '同开局差异来自本地 pressure deck 的候选顺序、当前证据组合和 DeepSeek 叙事措辞。',
      'v1.7 不新增 per-save runFingerprint 或 regionalEventLedger；这些已放入 v1.8-v2.0 future_sample_pool。',
      '若后续要让差异跨存档长期稳定，必须另走持久字段门禁。',
    ],
  };

  return {
    status,
    statusLabel: status === 'regional_life_visible' ? '区域活世界投影可读' : '等待区域生活证据',
    scopeId: SCOPE_ID,
    savePolicy: 'no_new_persistence_v24',
    authority: 'local_projection_only',
    activePressureId,
    publicSummary: status === 'regional_life_visible'
      ? 'v1.7 区域活世界第一刀已可投影：只显示外缘盘问、商队短工、市场压价、遮蔽人情和路途协议等低阶生活压力，不写正式地点、阵营、奖励、NPC 生死或隐藏事实。'
      : '当前还没有足够路线、生存、社会、区域或冲突证据支撑区域活世界投影；v1.7 保持 projection-first，不写新存档字段。',
    nextStep: status === 'regional_life_visible'
      ? '从当前压力 deck 选择一个低阶公开下一步：解释身份、绕路、短工、询价、求助、等待或打听；所有事实结算仍归本地 engine/store。'
      : '先建立离山路线、补给压力、公开社会反应或区域样板证据，再读取区域活世界投影。',
    pressureCards,
    signalGroups,
    nextStepCandidates: status === 'regional_life_visible'
      ? [
        '解释身份或来意，降低外缘盘问风险。',
        '找商队短工、递话或搬运窗口，但不成为正式成员。',
        '在临时市场询价、接受压价或继续打听补给。',
        '用遮蔽、守夜或人情债换短期容身。',
        '遇到路障或货物压力时先让步、绕路或等待。',
      ].map(item => sanitizeVisibleText(item, item))
      : [
        '先完成路线准备、补给准备、公开反应或低阶区域样板证据。',
        '不要让叙事文本直接生成地点、阵营、奖励或 NPC 命运。',
      ],
    boundaryLines: [
      'v1.7 b1 是 projection-first：SAVE_FORMAT_VERSION 保持 24，不新增 regionalLifeState / areaLivingState。',
      '本 helper 只读 v1.1 routeLocationState、v1.2 survivalEconomyState、v1.3 social pressure、v1.4 region sample、v1.5 conflict aftermath 和 v1.7-a2 source pointers。',
      '同开局可重玩差异度来自本地 pressure deck 和叙事表达，不来自正式事实漂移。',
      '不写 per-save runFingerprint / regionalEventLedger；它们是 v1.8-v2.0 future_sample_pool。',
      '不开放完整南疆、完整商家城、正式商队身份、正式交易、价格表、库存、奖励、NPC 生死或隐藏事实。',
      'MiroFish a2 export 只作为 source pointer / rule draft / test sample；不是 runtime canon、DeepSeek 可见摘要或玩家可见隐藏事实。',
      'DeepSeek 只能写叙事、线索、传闻、请求和压力表达；本地 engine/store 才能拥有事实结算。',
    ],
    visibleSourceRefs,
    forbiddenWrites,
    replayabilityAudit,
    projectionAudit: {
      phase: 'v1.7.0-b1-regional-life-projection',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v150_and_v170_a2_public_evidence',
      miroFishPolicy: 'v170_a2_topic_slice_source_pointer_only',
      deepSeekPolicy: 'no_new_authority_no_visible_mirofish_summary',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToStateWithoutUserDecision: false,
      requiredUserDecisionForState: [...REQUIRED_STATE_DECISIONS],
      pass: true,
      notes: [
        'b1 keeps regional life recomputable from existing public evidence and reviewed topic-slice source pointers.',
        'regional persistence, formal region/location/trade/faction/reward/NPC fate, hidden reveal, and DeepSeek authority remain forbidden.',
        'same-start replayability is measured as pressure deck diversity, not as persistent fact drift.',
      ],
    },
    modules: {
      routeStatus,
      survivalStatus: survivalStateStatus || survivalProjection.status,
      socialStatus: socialProjection.status,
      regionStatus: regionProjection.status,
      conflictStatus: conflictProjection.status,
      visiblePressureCount: visibleCards.length,
    },
    saveFormatImpact: 'none_v24_projection_only',
    statePatchApplied: false,
    canWriteSave: false,
    canUnlockLocation: false,
    canOpenFormalTrade: false,
    canTransferFaction: false,
    canGrantReward: false,
    canSetNpcFate: false,
    canExpandDeepSeekAuthority: false,
    deepSeekAuthority: 'no_new_authority',
    legacyFieldsIgnored: true,
  };
}
