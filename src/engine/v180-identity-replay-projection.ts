import {
  buildV170RegionalLifeProjection,
  type V170RegionalLifePressureId,
  type V170RegionalLifeProjectionInput,
} from './v170-regional-life-projection';
import type { LivingWorldState, LocalActionLedgerEntry } from '../types';

export type V180IdentityReplayStatus = 'needs_identity_route_context' | 'identity_route_visible';

export type V180IdentityRouteId =
  | 'caravan_temp_hand'
  | 'rogue_short_work'
  | 'low_rank_guard_candidate'
  | 'gathering_runner'
  | 'message_intel_runner';

export type V180IdentityPressureId =
  | 'identity_check_window'
  | 'caravan_labor_access'
  | 'permission_chain_prop_word'
  | 'low_status_labor'
  | 'temporary_market_observe'
  | 'bargain_refusal_short_work'
  | 'shelter_debt_window'
  | 'guard_or_gathering_pressure'
  | 'far_city_boundary';

export type V180ProjectionItemStatus = 'visible' | 'needs_context';
export type V180PropWordRisk = 'none' | 'detected_and_blocked';

export interface V180IdentityRouteCandidate {
  id: V180IdentityRouteId;
  title: string;
  status: V180ProjectionItemStatus;
  publicSummary: string;
  nextStep: string;
  pressureIds: V180IdentityPressureId[];
  evidenceRefs: string[];
  sourceRefs: string[];
  propWordRisk: V180PropWordRisk;
  forbiddenWrites: string[];
  canWriteSave: false;
  canCreateFormalIdentity: false;
  canCreateProfession: false;
  canTransferFaction: false;
  canUnlockLocation: false;
  canGrantReward: false;
  canSetNpcFate: false;
  canPatch: false;
  statePatchApplied: false;
}

export interface V180IdentityPressureCard {
  id: V180IdentityPressureId;
  title: string;
  status: V180ProjectionItemStatus;
  summary: string;
  nextStep: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
  canWriteSave: false;
  canCreateFormalIdentity: false;
  canOpenFormalTrade: false;
  canTransferFaction: false;
  canUnlockLocation: false;
  canGrantReward: false;
  canSetNpcFate: false;
  canPatch: false;
  statePatchApplied: false;
}

export interface V180IdentitySignalGroup {
  id: 'regional_life' | 'route' | 'survival' | 'social' | 'topic_slice' | 'prop_word_guard';
  title: string;
  statusLabel: string;
  summary: string;
  evidenceRefs: string[];
}

export interface V180IdentityReplayabilityAudit {
  policy: 'same_start_replayability_without_persistence';
  variantSourcePolicy: 'local_identity_pressure_deck_and_narrative_expression_only';
  stableFactPolicy: 'route_identity_profession_reward_location_npc_fate_stable';
  candidateRouteIds: V180IdentityRouteId[];
  activeVariantIndex: number;
  minimumVisibleRoutesForB1: number;
  pass: boolean;
  forbiddenDifferenceSources: string[];
  notes: string[];
}

export interface V180PropWordAudit {
  policy: 'formal_prop_words_blocked_as_p2_or_p1';
  detectedCategoryCount: number;
  blockedCategories: string[];
  visibleTextSanitized: boolean;
  pass: boolean;
  notes: string[];
}

export interface V180ProjectionAudit {
  phase: 'v1.8.0-b1-identity-replay-projection';
  saveFormatPolicy: 'stay_v24_no_bump';
  persistentWritePolicy: 'none_projection_only';
  runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v150_v170_and_v180_a2_public_evidence';
  miroFishPolicy: 'v180_a2_topic_slice_source_pointer_only';
  deepSeekPolicy: 'no_new_authority_no_visible_mirofish_summary';
  legacyFieldPolicy: 'ignored_as_authority';
  canPromoteToStateWithoutUserDecision: false;
  requiredUserDecisionForState: string[];
  pass: boolean;
  notes: string[];
}

export interface V180IdentityReplayProjection {
  status: V180IdentityReplayStatus;
  statusLabel: string;
  scopeId: 'southern_border_low_rank_identity_routes_outer_edge_slice';
  savePolicy: 'no_new_persistence_v24';
  authority: 'local_projection_only';
  activeRouteId: V180IdentityRouteId | null;
  activePressureId: V180IdentityPressureId | null;
  publicSummary: string;
  nextStep: string;
  routeCandidates: V180IdentityRouteCandidate[];
  pressureCards: V180IdentityPressureCard[];
  signalGroups: V180IdentitySignalGroup[];
  nextStepCandidates: string[];
  boundaryLines: string[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  replayabilityAudit: V180IdentityReplayabilityAudit;
  propWordAudit: V180PropWordAudit;
  projectionAudit: V180ProjectionAudit;
  modules: {
    regionalLifeStatus: string;
    visibleRegionalLifePressureCount: number;
    visibleIdentityRouteCount: number;
    visibleIdentityPressureCount: number;
    propWordRiskCount: number;
  };
  saveFormatImpact: 'none_v24_projection_only';
  statePatchApplied: false;
  canWriteSave: false;
  canCreateFormalIdentity: false;
  canCreateProfession: false;
  canUnlockLocation: false;
  canOpenFormalTrade: false;
  canTransferFaction: false;
  canGrantReward: false;
  canSetNpcFate: false;
  canExpandDeepSeekAuthority: false;
  deepSeekAuthority: 'no_new_authority';
  legacyFieldsIgnored: true;
}

export type V180IdentityReplayProjectionInput = V170RegionalLifeProjectionInput;

const SCOPE_ID = 'southern_border_low_rank_identity_routes_outer_edge_slice';

const BASE_FORBIDDEN_WRITES = [
  'SAVE_FORMAT_VERSION_25',
  'identityRouteState',
  'professionState',
  'runFingerprint',
  'regionalEventLedger',
  'formal_identity',
  'formal_profession',
  'formal_guard_status',
  'formal_rogue_status',
  'formal_caravan_membership',
  'formal_faction_relation',
  'formal_location',
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
  'approve_identityRouteState_or_equivalent_single_aggregate',
  'approve_professionState_if_formal_professions_are_needed',
  'approve_migration_defaults_tests',
  'approve_per_save_runFingerprint_or_regionalEventLedger',
  'approve_formal_identity_route_or_profession_scope',
  'approve_formal_location_faction_reward_or_npc_fate_scope',
  'approve_DeepSeek_visible_context_or_authority_change_if_any',
  'approve_Player_Advocate_and_live_probe_upgrade_if_scope_expands',
];

const ROUTE_SOURCE_REFS: Record<V180IdentityRouteId, string[]> = {
  caravan_temp_hand: [
    'v180:a2:identity_ch0234_caravan_temp_labor_contact',
    'v180:a2:identity_ch0235_goods_entry_ticket',
    'v180:a2:identity_ch0236_low_status_labor_assignment',
  ],
  rogue_short_work: [
    'v180:a2:identity_ch0235_trade_refusal_short_work',
    'v180:a2:identity_ch0237_bargain_refusal',
    'v180:a2:identity_ch0240_shelter_debt_short_work',
  ],
  low_rank_guard_candidate: [
    'v180:a2:identity_ch0241_road_event_guard_candidate',
    'v180:a2:identity_ch0242_goods_toll_gathering_runner',
  ],
  gathering_runner: [
    'v180:a2:identity_ch0242_goods_toll_gathering_runner',
    'v180:a2:identity_ch0237_temporary_market_observe',
  ],
  message_intel_runner: [
    'v180:a2:identity_ch0231_outer_edge_interrogation',
    'v180:a2:identity_ch0237_temporary_market_observe',
  ],
};

const PRESSURE_SOURCE_REFS: Record<V180IdentityPressureId, string[]> = {
  identity_check_window: ['v180:a2:identity_ch0231_outer_edge_interrogation'],
  caravan_labor_access: ['v180:a2:identity_ch0234_caravan_temp_labor_contact'],
  permission_chain_prop_word: ['v180:a2:identity_ch0236_permission_chain_prop_word_risk'],
  low_status_labor: ['v180:a2:identity_ch0236_low_status_labor_assignment'],
  temporary_market_observe: ['v180:a2:identity_ch0237_temporary_market_observe'],
  bargain_refusal_short_work: [
    'v180:a2:identity_ch0235_trade_refusal_short_work',
    'v180:a2:identity_ch0237_bargain_refusal',
  ],
  shelter_debt_window: ['v180:a2:identity_ch0240_shelter_debt_short_work'],
  guard_or_gathering_pressure: [
    'v180:a2:identity_ch0241_road_event_guard_candidate',
    'v180:a2:identity_ch0242_goods_toll_gathering_runner',
  ],
  far_city_boundary: ['v180:a2:identity_ch0231_far_city_boundary'],
};

const ROUTE_PRESSURES: Record<V180IdentityRouteId, V180IdentityPressureId[]> = {
  caravan_temp_hand: ['identity_check_window', 'caravan_labor_access', 'permission_chain_prop_word', 'low_status_labor'],
  rogue_short_work: ['temporary_market_observe', 'bargain_refusal_short_work', 'shelter_debt_window'],
  low_rank_guard_candidate: ['identity_check_window', 'guard_or_gathering_pressure'],
  gathering_runner: ['temporary_market_observe', 'guard_or_gathering_pressure'],
  message_intel_runner: ['identity_check_window', 'temporary_market_observe', 'far_city_boundary'],
};

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
  [/正式商队成员/g, '正式商队身份结论已阻断'],
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

const FORMAL_PROP_REPLACEMENTS: Array<[RegExp, string]> = [
  [/木牌|令牌|腰牌/g, '正式凭信词已阻断'],
  [/名册|登记/g, '正式名单词已阻断'],
  [/报到|负责人点头|管事安排|跟队/g, '正式许可词已阻断'],
  [/临时帐篷/g, '短期遮蔽'],
  [/商队成员/g, '商队接触候选'],
  [/护卫身份/g, '护送候选'],
  [/散修落脚点/g, '短期遮蔽线索'],
  [/情报人/g, '消息线索'],
];

const PROP_WORD_PATTERNS: Array<{ category: string; pattern: RegExp }> = [
  { category: 'credential_marker', pattern: /木牌|令牌|腰牌/ },
  { category: 'roster_or_registration', pattern: /名册|登记/ },
  { category: 'permission_chain_marker', pattern: /报到|负责人点头|管事安排|跟队/ },
  { category: 'shelter_object_marker', pattern: /临时帐篷/ },
  { category: 'formal_caravan_role_marker', pattern: /商队成员/ },
  { category: 'formal_guard_role_marker', pattern: /护卫身份/ },
  { category: 'formal_rogue_node_marker', pattern: /散修落脚点/ },
  { category: 'formal_intel_role_marker', pattern: /情报人/ },
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
  for (const [pattern, replacement] of FORMAL_PROP_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text || fallback;
}

function sanitizeVisibleRefs(values: string[], max = 28): string[] {
  const blockedTokens = ['hidden', 'private', 'source_text', 'human_review', 'raw', 'quote', 'original', 'body'];
  return unique(values)
    .filter(value => !blockedTokens.some(token => value.toLowerCase().includes(token)))
    .slice(0, max);
}

function anyTextMatches(values: string[], pattern: RegExp): boolean {
  return values.some(value => pattern.test(value));
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

function detectPropWordCategories(values: string[]): string[] {
  return PROP_WORD_PATTERNS
    .filter(({ pattern }) => values.some(value => pattern.test(value)))
    .map(({ category }) => category);
}

function pressureVisible(visiblePressureIds: Set<V170RegionalLifePressureId>, ids: V170RegionalLifePressureId[]): boolean {
  return ids.some(id => visiblePressureIds.has(id));
}

function sourceRefsForRoute(id: V180IdentityRouteId, extraRefs: string[] = []): string[] {
  return sanitizeVisibleRefs([...ROUTE_SOURCE_REFS[id], ...extraRefs], 14);
}

function sourceRefsForPressure(id: V180IdentityPressureId, extraRefs: string[] = []): string[] {
  return sanitizeVisibleRefs([...PRESSURE_SOURCE_REFS[id], ...extraRefs], 14);
}

function buildPressureCard(input: {
  id: V180IdentityPressureId;
  title: string;
  visible: boolean;
  summaryVisible: string;
  summaryMissing: string;
  nextStepVisible: string;
  nextStepMissing: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
}): V180IdentityPressureCard {
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
    canCreateFormalIdentity: false,
    canOpenFormalTrade: false,
    canTransferFaction: false,
    canUnlockLocation: false,
    canGrantReward: false,
    canSetNpcFate: false,
    canPatch: false,
    statePatchApplied: false,
  };
}

function buildRouteCandidate(input: {
  id: V180IdentityRouteId;
  title: string;
  visible: boolean;
  publicSummaryVisible: string;
  publicSummaryMissing: string;
  nextStepVisible: string;
  nextStepMissing: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenWrites: string[];
  propWordRisk: V180PropWordRisk;
}): V180IdentityRouteCandidate {
  return {
    id: input.id,
    title: input.title,
    status: input.visible ? 'visible' : 'needs_context',
    publicSummary: sanitizeVisibleText(input.visible ? input.publicSummaryVisible : input.publicSummaryMissing, input.publicSummaryMissing),
    nextStep: sanitizeVisibleText(input.visible ? input.nextStepVisible : input.nextStepMissing, input.nextStepMissing),
    pressureIds: ROUTE_PRESSURES[input.id],
    evidenceRefs: sanitizeVisibleRefs(input.evidenceRefs, 12),
    sourceRefs: sourceRefsForRoute(input.id, input.sourceRefs),
    propWordRisk: input.propWordRisk,
    forbiddenWrites: unique([...BASE_FORBIDDEN_WRITES, ...input.forbiddenWrites]),
    canWriteSave: false,
    canCreateFormalIdentity: false,
    canCreateProfession: false,
    canTransferFaction: false,
    canUnlockLocation: false,
    canGrantReward: false,
    canSetNpcFate: false,
    canPatch: false,
    statePatchApplied: false,
  };
}

function selectActiveRouteId(routes: V180IdentityRouteCandidate[], variantIndex: number): V180IdentityRouteId | null {
  const visible = routes.filter(route => route.status === 'visible');
  if (visible.length === 0) return null;
  const safeIndex = Math.abs(Math.floor(Number.isFinite(variantIndex) ? variantIndex : 0)) % visible.length;
  return visible[safeIndex].id;
}

function selectActivePressureId(cards: V180IdentityPressureCard[], variantIndex: number): V180IdentityPressureId | null {
  const visible = cards.filter(card => card.status === 'visible');
  if (visible.length === 0) return null;
  const safeIndex = Math.abs(Math.floor(Number.isFinite(variantIndex) ? variantIndex : 0)) % visible.length;
  return visible[safeIndex].id;
}

export function buildV180IdentityReplayProjection(
  input: V180IdentityReplayProjectionInput = {},
): V180IdentityReplayProjection {
  const turn = Math.max(0, Math.floor(Number(input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0)));
  const localActionLedger = Array.isArray(input.localActionLedger) ? input.localActionLedger : [];
  const textSignals = livingText(input.livingWorldState, localActionLedger);
  const propWordCategories = detectPropWordCategories(textSignals);
  const propWordRisk: V180PropWordRisk = propWordCategories.length > 0 ? 'detected_and_blocked' : 'none';
  const regionalLife = buildV170RegionalLifeProjection(input);
  const visibleRegionalPressure = regionalLife.pressureCards.filter(card => card.status === 'visible');
  const visibleRegionalPressureIds = new Set(visibleRegionalPressure.map(card => card.id));

  const regionalRefs = visibleRegionalPressure.flatMap(card => [
    `v170Pressure:${card.id}`,
    ...card.evidenceRefs,
    ...card.sourceRefs,
  ]);
  const routeTextVisible = pressureVisible(visibleRegionalPressureIds, ['outer_edge_interrogation'])
    || anyTextMatches(textSignals, /盘问|守卫|身份|来意|山路|外缘/);
  const caravanVisible = pressureVisible(visibleRegionalPressureIds, [
    'caravan_contact_by_labor',
    'caravan_permission_chain',
    'low_status_labor',
  ]) || anyTextMatches(textSignals, /商队|货物|短工|搬运|卸货|杂务|低身份/);
  const rogueVisible = pressureVisible(visibleRegionalPressureIds, [
    'temporary_market_window',
    'shelter_debt_window',
  ]) || anyTextMatches(textSignals, /散修|短活|临时|压价|求助|人情|遮蔽|摆摊|拒绝/);
  const guardVisible = pressureVisible(visibleRegionalPressureIds, [
    'outer_edge_interrogation',
    'road_event_protocol',
  ]) || anyTextMatches(textSignals, /护送|路障|巡查|站岗|押运|守夜|守卫/);
  const gatheringVisible = pressureVisible(visibleRegionalPressureIds, [
    'road_event_protocol',
    'temporary_market_window',
  ]) || anyTextMatches(textSignals, /采集|药草|野外|货物|山路|收集|杂务/);
  const messageVisible = routeTextVisible
    || pressureVisible(visibleRegionalPressureIds, ['temporary_market_window', 'far_city_as_pressure'])
    || anyTextMatches(textSignals, /打听|递话|传话|消息|观察|盘问|中介/);
  const farCityVisible = pressureVisible(visibleRegionalPressureIds, ['far_city_as_pressure'])
    || anyTextMatches(textSignals, /远城|大城|商家城|城外缘|入城/);

  const forbiddenWrites = unique([
    ...BASE_FORBIDDEN_WRITES,
    ...regionalLife.forbiddenWrites,
  ]);

  const pressureCards: V180IdentityPressureCard[] = [
    buildPressureCard({
      id: 'identity_check_window',
      title: '身份盘问窗口',
      visible: routeTextVisible,
      summaryVisible: '外缘盘问已经能读到，身份只作为公开说辞压力，不生成正式身份。',
      summaryMissing: '尚缺外缘盘问或公开身份压力证据，身份窗口保持等待。',
      nextStepVisible: '准备低调来路、短期目的和可公开解释的行动理由。',
      nextStepMissing: '先建立山路、外缘或公开接触证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'caravan_labor_access',
      title: '商队临工接触',
      visible: caravanVisible,
      summaryVisible: '商队接触只表现为货物、搬运、递话或临时劳作，不成为正式商队身份。',
      summaryMissing: '尚缺商队、货物或临时劳作证据，商队临工保持候选。',
      nextStepVisible: '以可替换低身份价值换取短期话口或遮蔽，结算仍不开放。',
      nextStepMissing: '先补市场、补给或商队接触证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'permission_chain_prop_word',
      title: '许可词风险',
      visible: caravanVisible || propWordRisk === 'detected_and_blocked',
      summaryVisible: '凡涉及凭信、名单或固定许可的词都降级为压力提醒，不让文本写成身份凭据。',
      summaryMissing: '尚未触发许可词风险；继续保持身份词和凭信词阻断。',
      nextStepVisible: '只说需要公开认可或担保，不写具体凭信、名单、长期岗位或固定许可。',
      nextStepMissing: '后续出现凭信类措辞时进入 P2/P1 审查，而不是直接进 runtime authority。',
      evidenceRefs: unique([...regionalRefs, ...propWordCategories.map(category => `propWordCategory:${category}`)]),
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'low_status_labor',
      title: '低身份劳作',
      visible: caravanVisible || gatheringVisible,
      summaryVisible: '低身份劳作只提供搬运、杂务、守夜或跑腿候选，不写职业、薪酬、职位或奖励。',
      summaryMissing: '尚缺劳作、商队或采集压力证据；低身份劳作保持等待。',
      nextStepVisible: '把劳作当作公开理由和短期换取窗口，避免结算化。',
      nextStepMissing: '先建立生存经济或区域生活证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'temporary_market_observe',
      title: '临市观察',
      visible: pressureVisible(visibleRegionalPressureIds, ['temporary_market_window']) || anyTextMatches(textSignals, /市场|集市|摆摊|询价|观察/),
      summaryVisible: '临时市场只允许观察、询价、压价和消息流动，不生成价格表、库存或正式交易。',
      summaryMissing: '尚缺市场或询价证据；临市观察保持候选。',
      nextStepVisible: '可以观察人流、货物和话头，交易结算等待后续门禁。',
      nextStepMissing: '先补充补给压力或公开市场接触。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'bargain_refusal_short_work',
      title: '压价短活',
      visible: rogueVisible,
      summaryVisible: '压价、拒绝和短活可以改变叙事压力，但不写工资、职位、库存或阵营关系。',
      summaryMissing: '尚缺压价、拒绝或短活证据；该压力保持等待。',
      nextStepVisible: '接受低价、绕开、继续打听或换一个低风险短活。',
      nextStepMissing: '先建立临市、散修或人情压力证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'shelter_debt_window',
      title: '遮蔽人情债',
      visible: pressureVisible(visibleRegionalPressureIds, ['shelter_debt_window']) || rogueVisible,
      summaryVisible: '遮蔽与人情债只作为短期压力，不能转成 NPC 命运、正式庇护或阵营归属。',
      summaryMissing: '尚缺遮蔽、求助或人情压力证据。',
      nextStepVisible: '用守夜、低调帮忙或离开时机偿还压力，不写正式关系。',
      nextStepMissing: '先建立冲突、补给缺口或公开求助证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'guard_or_gathering_pressure',
      title: '护送采集压力',
      visible: guardVisible || gatheringVisible,
      summaryVisible: '护送、采集和货物压力只作为低阶行动候选，不写岗位、战斗结果、消耗或奖励。',
      summaryMissing: '尚缺护送、采集或路途事件证据。',
      nextStepVisible: '选择低调护送、采集、绕路或等待；战斗和资源结算仍归本地系统。',
      nextStepMissing: '先建立路线、野外或区域事件证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
    buildPressureCard({
      id: 'far_city_boundary',
      title: '远城边界',
      visible: farCityVisible,
      summaryVisible: '远方大城只能作为方向压力和外缘门槛，不开放完整城市、商铺、身份或任务奖励。',
      summaryMissing: '尚缺远城或外缘门槛证据；远城只保留为后续方向。',
      nextStepVisible: '继续收集公开理由、担保和补给，不进入城市核心。',
      nextStepMissing: '先完成路线承接、商队或市场公开接触。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
    }),
  ];

  const routes: V180IdentityRouteCandidate[] = [
    buildRouteCandidate({
      id: 'caravan_temp_hand',
      title: '商队临工',
      visible: caravanVisible,
      publicSummaryVisible: '可从商队临工角度推进同开局差异：搬运、递话、低身份劳作和许可压力都只保持候选。',
      publicSummaryMissing: '尚缺商队、货物或临时劳作证据；商队临工路线不展开。',
      nextStepVisible: '选择低调劳作、递话或等待担保，避免正式成员、薪酬、库存和奖励结论。',
      nextStepMissing: '先取得商队接触、市场窗口或补给压力证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
      propWordRisk,
    }),
    buildRouteCandidate({
      id: 'rogue_short_work',
      title: '散修短活',
      visible: rogueVisible,
      publicSummaryVisible: '散修短活只提供压价、拒绝、求助和人情压力，不写落脚、归属或长期身份。',
      publicSummaryMissing: '尚缺散修、短活、临市或遮蔽证据；散修短活保持候选。',
      nextStepVisible: '可选择压价短活、临时帮忙、求助或尽快脱身，保持低阶外缘味道。',
      nextStepMissing: '先建立临市、遮蔽或人情债压力。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
      propWordRisk,
    }),
    buildRouteCandidate({
      id: 'low_rank_guard_candidate',
      title: '护送候选',
      visible: guardVisible,
      publicSummaryVisible: '护送候选只表现为站岗、守夜、押运或路障压力，不给正式护卫身份。',
      publicSummaryMissing: '尚缺路途、守夜或护送证据；护送候选保持等待。',
      nextStepVisible: '先以短期护送或守夜换公开话口，战斗、奖励和身份结论另走本地裁决。',
      nextStepMissing: '先建立路途事件、山路压力或冲突 aftermath 证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
      propWordRisk,
    }),
    buildRouteCandidate({
      id: 'gathering_runner',
      title: '采集跑腿',
      visible: gatheringVisible,
      publicSummaryVisible: '采集跑腿只显示低阶野外、货物和杂务压力，不写资源入账或奖励。',
      publicSummaryMissing: '尚缺采集、货物或野外压力证据；采集跑腿保持候选。',
      nextStepVisible: '可选择采集、收集消息、送货或绕路；收益结算暂不开放。',
      nextStepMissing: '先建立路线、生存或市场证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
      propWordRisk,
    }),
    buildRouteCandidate({
      id: 'message_intel_runner',
      title: '消息跑腿',
      visible: messageVisible,
      publicSummaryVisible: '消息跑腿只让玩家打听、递话、观察和试探，不塑造正式情报身份。',
      publicSummaryMissing: '尚缺盘问、市场观察或远城方向证据；消息跑腿保持候选。',
      nextStepVisible: '从公开话头、临市观察或外缘盘问中找下一步，不写 hidden fact 或正式 NPC 线。',
      nextStepMissing: '先建立公开盘问、临市观察或社会压力证据。',
      evidenceRefs: regionalRefs,
      sourceRefs: regionalLife.visibleSourceRefs,
      forbiddenWrites,
      propWordRisk,
    }),
  ];

  const visibleRoutes = routes.filter(route => route.status === 'visible');
  const visiblePressureCards = pressureCards.filter(card => card.status === 'visible');
  const computedVariantIndex = input.variantIndex ?? (
    turn
    + localActionLedger.length
    + regionalLife.modules.visiblePressureCount
    + Object.keys(input.livingWorldState?.knownFacts || {}).length
  );
  const activeRouteId = selectActiveRouteId(routes, computedVariantIndex);
  const activePressureId = selectActivePressureId(pressureCards, computedVariantIndex);
  const status: V180IdentityReplayStatus = visibleRoutes.length > 0 ? 'identity_route_visible' : 'needs_identity_route_context';

  const visibleSourceRefs = sanitizeVisibleRefs([
    'v1.8.0-a1:D-181-002',
    'v1.8.0-a1:D-181-003',
    'v1.8.0-a1:D-181-006',
    'v1.8.0-a2:southern_border_low_rank_identity_route_life_slice:intake-reviewed',
    'v1.8.0-a2:identity-route-rule-draft',
    ...Object.values(ROUTE_SOURCE_REFS).flat(),
    ...Object.values(PRESSURE_SOURCE_REFS).flat(),
    ...regionalLife.visibleSourceRefs,
  ], 96);

  const rawSignalGroups: V180IdentitySignalGroup[] = [
    {
      id: 'regional_life',
      title: '区域活世界',
      statusLabel: regionalLife.statusLabel,
      summary: regionalLife.publicSummary,
      evidenceRefs: regionalLife.pressureCards.filter(card => card.status === 'visible').flatMap(card => card.evidenceRefs),
    },
    {
      id: 'route',
      title: '路线/外缘',
      statusLabel: routeTextVisible ? 'identity pressure visible' : 'needs route context',
      summary: routeTextVisible ? '外缘盘问和路线说辞可作为身份路线入口。' : '尚缺外缘或路线承接证据。',
      evidenceRefs: regionalRefs,
    },
    {
      id: 'survival',
      title: '生存经济',
      statusLabel: caravanVisible || rogueVisible || gatheringVisible ? 'low-rank work pressure visible' : 'needs survival context',
      summary: '生存压力只转成低阶短活、临市观察和遮蔽候选，不生成库存、价格或消耗。',
      evidenceRefs: regionalRefs,
    },
    {
      id: 'social',
      title: '社会压力',
      statusLabel: messageVisible ? 'public talk pressure visible' : 'needs public talk context',
      summary: '社会压力只表现公开话头、传言和后续候选，不写 NPC 关系或阵营归属。',
      evidenceRefs: regionalRefs,
    },
    {
      id: 'topic_slice',
      title: 'a2 切片',
      statusLabel: 'source-pointer ready',
      summary: 'a2 提供五类身份路线和九类压力 deck 的规则草案，进入 runtime 时只用改写后的公开候选。',
      evidenceRefs: visibleSourceRefs.slice(0, 12),
    },
    {
      id: 'prop_word_guard',
      title: '道具词护栏',
      statusLabel: propWordRisk === 'detected_and_blocked' ? 'risk blocked' : 'clean',
      summary: propWordRisk === 'detected_and_blocked'
        ? '输入中出现正式凭信/名单/身份词风险，runtime 已降级为压力提醒。'
        : '当前未发现正式凭信、名单或身份词风险。',
      evidenceRefs: propWordCategories.map(category => `propWordCategory:${category}`),
    },
  ];
  const signalGroups: V180IdentitySignalGroup[] = rawSignalGroups.map(group => ({
    ...group,
    summary: sanitizeVisibleText(group.summary, '需要更多公开证据。'),
    evidenceRefs: sanitizeVisibleRefs(group.evidenceRefs, 10),
  }));

  const replayabilityAudit: V180IdentityReplayabilityAudit = {
    policy: 'same_start_replayability_without_persistence',
    variantSourcePolicy: 'local_identity_pressure_deck_and_narrative_expression_only',
    stableFactPolicy: 'route_identity_profession_reward_location_npc_fate_stable',
    candidateRouteIds: visibleRoutes.map(route => route.id),
    activeVariantIndex: Math.abs(Math.floor(Number(computedVariantIndex) || 0)),
    minimumVisibleRoutesForB1: 3,
    pass: visibleRoutes.length >= 3 && routes.every(route => (
      !route.canWriteSave
      && !route.canCreateFormalIdentity
      && !route.canCreateProfession
      && !route.canGrantReward
      && !route.canSetNpcFate
    )),
    forbiddenDifferenceSources: [
      'formal_identity_or_profession_change',
      'formal_location_change',
      'faction_or_caravan_membership_change',
      'reward_or_inventory_change',
      'npc_life_death_change',
      'hidden_or_private_fact_reveal',
      'deepseek_fact_authority',
      'per_save_random_seed_without_gate',
    ],
    notes: [
      '同开局差异来自身份 route candidate、压力 deck 顺序、现有公开证据组合和 DeepSeek 叙事措辞。',
      'v1.8 b1 不新增 runFingerprint 或 regionalEventLedger；跨存档长期稳定差异需要另走持久字段门禁。',
      '身份路线只描述低阶生活入口，不把身份、职业、地点、奖励或 NPC 命运变成事实。',
    ],
  };

  const propWordAudit: V180PropWordAudit = {
    policy: 'formal_prop_words_blocked_as_p2_or_p1',
    detectedCategoryCount: propWordCategories.length,
    blockedCategories: propWordCategories,
    visibleTextSanitized: true,
    pass: true,
    notes: [
      '正式凭信、名单、许可、身份和固定落脚词只作为风险类别记录，不输出具体词。',
      '若 live probe 出现这些词并把它们写成事实，按 P2/P1 处理；若伴随正式身份/地点/阵营结论，升级 P0。',
    ],
  };

  return {
    status,
    statusLabel: status === 'identity_route_visible' ? '身份路线投影可读' : '等待身份路线证据',
    scopeId: SCOPE_ID,
    savePolicy: 'no_new_persistence_v24',
    authority: 'local_projection_only',
    activeRouteId,
    activePressureId,
    publicSummary: status === 'identity_route_visible'
      ? 'v1.8 身份路线第一刀已可投影：同一个低阶外缘开局可以走商队临工、散修短活、护送候选、采集跑腿或消息跑腿等公开压力差异，但不写正式身份、职业、地点、奖励、NPC 命运或隐藏事实。'
      : '当前还没有足够公开证据支撑身份路线投影；v1.8 保持 projection-first，不写新存档字段。',
    nextStep: status === 'identity_route_visible'
      ? '从当前身份 route candidate 里选择一个低阶公开下一步：低调劳作、压价短活、护送守夜、采集跑腿、打听递话；所有事实结算仍归本地 engine/store。'
      : '先建立路线、外缘盘问、生存经济、区域活世界或公开社会压力证据，再读取身份路线投影。',
    routeCandidates: routes,
    pressureCards,
    signalGroups,
    nextStepCandidates: status === 'identity_route_visible'
      ? [
        '以商队临工切入，但不成为正式成员。',
        '接压价短活或散修边缘求助，但不形成长期身份。',
        '用护送、守夜或绕路换公开话口，战斗结算另走本地系统。',
        '做采集或货物跑腿，收益与库存暂不结算。',
        '从临市观察和盘问里递话打听，隐藏事实仍不可见。',
      ].map(item => sanitizeVisibleText(item, item))
      : [
        '先完成外缘盘问、商队/市场接触、遮蔽或区域活世界证据。',
        '不要让叙事文本直接生成身份、职业、地点、阵营、奖励或 NPC 命运。',
      ],
    boundaryLines: [
      'v1.8 b1 是 projection-first：SAVE_FORMAT_VERSION 保持 24，不新增 identityRouteState / professionState。',
      '不写 per-save runFingerprint / regionalEventLedger；同开局差异只来自本地候选 deck、公开证据组合和叙事表达。',
      '五类身份路线只是候选：商队临工、散修短活、护送候选、采集跑腿、消息跑腿。',
      '不开放正式身份、正式职业、正式商队身份、完整地点、正式交易、价格表、库存、奖励、NPC 生死或隐藏事实。',
      'MiroFish a2 export 只作为 source pointer / rule draft / test sample；不是 runtime canon、DeepSeek 可见摘要或玩家可见隐藏事实。',
      'DeepSeek 只能写叙事、线索、传闻、请求和压力表达；本地 engine/store 才能拥有事实结算。',
      '正式凭信、名单、许可、身份和固定落脚词一律先降级为风险，不作为玩家可见事实。',
    ],
    visibleSourceRefs,
    forbiddenWrites,
    replayabilityAudit,
    propWordAudit,
    projectionAudit: {
      phase: 'v1.8.0-b1-identity-replay-projection',
      saveFormatPolicy: 'stay_v24_no_bump',
      persistentWritePolicy: 'none_projection_only',
      runtimeSourcePolicy: 'reuse_v110_v120_v130_v140_v150_v170_and_v180_a2_public_evidence',
      miroFishPolicy: 'v180_a2_topic_slice_source_pointer_only',
      deepSeekPolicy: 'no_new_authority_no_visible_mirofish_summary',
      legacyFieldPolicy: 'ignored_as_authority',
      canPromoteToStateWithoutUserDecision: false,
      requiredUserDecisionForState: [...REQUIRED_STATE_DECISIONS],
      pass: true,
      notes: [
        'b1 keeps identity route candidates recomputable from existing public evidence and reviewed topic-slice source pointers.',
        'formal identity, profession, location, trade, faction, reward, NPC fate, hidden reveal, and DeepSeek authority remain forbidden.',
        'same-start replayability is measured as route/pressure deck diversity, not as persistent fact drift.',
      ],
    },
    modules: {
      regionalLifeStatus: regionalLife.status,
      visibleRegionalLifePressureCount: regionalLife.modules.visiblePressureCount,
      visibleIdentityRouteCount: visibleRoutes.length,
      visibleIdentityPressureCount: visiblePressureCards.length,
      propWordRiskCount: propWordCategories.length,
    },
    saveFormatImpact: 'none_v24_projection_only',
    statePatchApplied: false,
    canWriteSave: false,
    canCreateFormalIdentity: false,
    canCreateProfession: false,
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
