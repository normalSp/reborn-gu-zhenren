import qingmaoRegionBoardRaw from '../canon/qingmao-region-board.json';
import type { LivingWorldState } from '../types';
import {
  buildQingmaoRouteContinuationPreview,
  type QingmaoRouteConditionPreview,
  type QingmaoRouteIntentRulingHint,
} from './v014-qingmao-route-continuation';

type FactionGoalRouteKey =
  | 'baijia_contact_window'
  | 'merchant_caravan_contact'
  | 'shang_public_entry_deferred'
  | 'rogue_cultivator_path';

type FactionGoalDisposition =
  | 'already_in_faction'
  | 'cross_faction_prerequisites'
  | 'outer_contact_prerequisites'
  | 'merchant_contact_prerequisites'
  | 'city_entry_deferred'
  | 'identity_gap_prerequisites';

interface QingmaoIdentityScope {
  startProfileId: string;
  factionId: string;
  role: string;
  identityBoundary: string;
}

interface QingmaoRegionBoard {
  identityScope: QingmaoIdentityScope[];
}

export interface QingmaoFactionGoalPrerequisiteInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  intentText?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
  maxCards?: number;
}

export interface QingmaoFactionGoalPrerequisiteCard {
  id: string;
  routeKey: FactionGoalRouteKey;
  title: string;
  disposition: FactionGoalDisposition;
  currentFactionId: string | null;
  currentIdentitySummary: string;
  publicSummary: string;
  prerequisiteLines: string[];
  riskLines: string[];
  allowedNextSteps: string[];
  blockedUpgrades: string[];
  visibleSourceRefs: string[];
  canPatch: false;
  canChangeFaction: false;
  createsFormalTask: false;
  grantsReward: false;
}

export interface QingmaoFactionGoalPrerequisiteResult {
  status: 'read_only_prerequisite_preview';
  message: string;
  publicSummary: string;
  cards: QingmaoFactionGoalPrerequisiteCard[];
  intentRulingHints: QingmaoRouteIntentRulingHint[];
  sourceRefs: string[];
  forbiddenWrites: string[];
  rejectedReasons: string[];
  miroFishNeed: 'not_needed';
  statePatchApplied: false;
}

const qingmaoRegionBoard = qingmaoRegionBoardRaw as QingmaoRegionBoard;

const TARGET_ROUTE_KEYS: FactionGoalRouteKey[] = [
  'baijia_contact_window',
  'merchant_caravan_contact',
  'shang_public_entry_deferred',
  'rogue_cultivator_path',
];

const ROUTE_TITLES: Record<FactionGoalRouteKey, string> = {
  baijia_contact_window: '白家接触前置',
  merchant_caravan_contact: '商队接触前置',
  shang_public_entry_deferred: '商家城公开入口前置',
  rogue_cultivator_path: '散修身份过渡前置',
};

const FACTION_LABELS: Record<string, string> = {
  guyue_shanzhai: '古月山寨',
  xiongjia_zhai: '熊家寨',
  baijia_zhai: '白家寨',
  shangjia: '商家/商队',
  wujia: '武家支脉',
  tiejia: '铁家巡查',
  sanxiu: '散修/外来蛊师',
};

const EXTRA_FORBIDDEN_WRITES = [
  'faction_transfer',
  'standing_delta',
  'warrant',
  'formal_recruitment',
  'formal_task',
  'task_reward',
  'location_unlock',
  'route_entered',
  'npc_death',
  'npc_capture',
  'hidden_fact_reveal',
  'deepseek_authority_expansion',
];

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function normalizeText(text?: string | null): string {
  return String(text || '').trim().toLowerCase();
}

function textIncludesAny(text: string, needles: string[]): boolean {
  return needles.some(needle => text.includes(needle));
}

function identityScopeFromStartProfile(startProfileId?: string | null): QingmaoIdentityScope | null {
  if (!startProfileId) return null;
  return qingmaoRegionBoard.identityScope.find(scope => scope.startProfileId === startProfileId) || null;
}

function currentFactionId(input: QingmaoFactionGoalPrerequisiteInput): string | null {
  return input.playerFactionId || identityScopeFromStartProfile(input.selectedStartProfileId)?.factionId || null;
}

function currentIdentitySummary(input: QingmaoFactionGoalPrerequisiteInput, factionId: string | null): string {
  const scope = identityScopeFromStartProfile(input.selectedStartProfileId);
  if (scope) {
    return `${FACTION_LABELS[scope.factionId] || scope.factionId} · ${scope.role}`;
  }
  return factionId ? `${FACTION_LABELS[factionId] || factionId} · 当前身份` : '未知开局身份 · 需先确认身份边界';
}

function routeKeysFromIntent(input: QingmaoFactionGoalPrerequisiteInput): Set<FactionGoalRouteKey> {
  const text = normalizeText(input.intentText);
  const keys = new Set<FactionGoalRouteKey>();
  if (textIncludesAny(text, ['白家', '投靠白家', '加入白家', '拜入白家'])) {
    keys.add('baijia_contact_window');
  }
  if (textIncludesAny(text, ['商队', '加入商队', '跟商队', '递话商队'])) {
    keys.add('merchant_caravan_contact');
  }
  if (textIncludesAny(text, ['商家城', '商量山'])) {
    keys.add('merchant_caravan_contact');
    keys.add('shang_public_entry_deferred');
  }
  if (textIncludesAny(text, ['散修', '独自闯荡', '脱离古月', '离开古月', '叛逃'])) {
    keys.add('rogue_cultivator_path');
  }

  for (const goal of input.livingWorldState?.playerGoals || []) {
    const goalText = normalizeText(`${goal.targetRef}|${goal.rationale}|${goal.nextStepHints.join('|')}`);
    if (goalText.includes('baijia') || goalText.includes('白家')) keys.add('baijia_contact_window');
    if (goalText.includes('商队') || goalText.includes('caravan')) keys.add('merchant_caravan_contact');
    if (goalText.includes('商家城') || goalText.includes('shang')) keys.add('shang_public_entry_deferred');
    if (goalText.includes('region:outside_qingmao') || goalText.includes('散修')) keys.add('rogue_cultivator_path');
  }

  return keys;
}

function dispositionForRoute(routeKey: FactionGoalRouteKey, factionId: string | null): FactionGoalDisposition {
  if (routeKey === 'baijia_contact_window') {
    if (factionId === 'baijia_zhai') return 'already_in_faction';
    if (factionId === 'sanxiu' || factionId === 'shangjia' || factionId === 'tiejia' || factionId === 'wujia') {
      return 'outer_contact_prerequisites';
    }
    return 'cross_faction_prerequisites';
  }
  if (routeKey === 'merchant_caravan_contact') return 'merchant_contact_prerequisites';
  if (routeKey === 'shang_public_entry_deferred') return 'city_entry_deferred';
  return 'identity_gap_prerequisites';
}

function publicSummaryFor(route: QingmaoRouteConditionPreview, disposition: FactionGoalDisposition): string {
  if (disposition === 'already_in_faction') {
    return '你已有对应身份，本阶段只提示可从本地接触、公开理由和风险账本开始，不写声望、职位或奖励。';
  }
  if (disposition === 'cross_faction_prerequisites') {
    return '这是跨阵营目标，只能显示接触窗口、信任缺口和原势力疑心，不能一键转入白家。';
  }
  if (disposition === 'outer_contact_prerequisites') {
    return '外来身份可以尝试递话或求庇护，但必须先补公开理由、担保和代价说明。';
  }
  if (disposition === 'merchant_contact_prerequisites') {
    return '商队目标先走公开理由、递话窗口、补给和身份盘问，不直接加入商队。';
  }
  if (disposition === 'city_entry_deferred') {
    return '商家城是远期公开入口候选，v0.14 只展示条件，不开放完整城市系统。';
  }
  return '散修/脱离身份是过渡目标，只能展示低阶生存、补给、遮掩和落脚点缺口。';
}

function prerequisiteLines(route: QingmaoRouteConditionPreview): string[] {
  const missing = route.missingConditions.map(condition => `${condition.label}${condition.severity === 'hard' ? '（硬前置）' : '（软前置）'}`);
  if (missing.length > 0) return missing.slice(0, 5);
  return ['当前预览条件暂时足够，但正式行动仍需要后续阶段开放。'];
}

function riskLines(route: QingmaoRouteConditionPreview): string[] {
  const risks = route.riskFactors.map(risk => `${risk.label}：${risk.visibleSummary}`);
  return risks.length > 0 ? risks.slice(0, 4) : ['暂无额外风险条目，但仍禁止阵营、地点、奖励自动写入。'];
}

function allowedNextSteps(route: QingmaoRouteConditionPreview): string[] {
  const actions = route.availablePreparations.map(action => action.label);
  if (actions.length > 0) return actions.slice(0, 4);
  return ['先记录为长期目标，再等待后续正式行动样板。'];
}

function buildCard(
  route: QingmaoRouteConditionPreview,
  input: QingmaoFactionGoalPrerequisiteInput,
): QingmaoFactionGoalPrerequisiteCard | null {
  const routeKey = route.routeKey as FactionGoalRouteKey;
  if (!TARGET_ROUTE_KEYS.includes(routeKey)) return null;
  const factionId = currentFactionId(input);
  const disposition = dispositionForRoute(routeKey, factionId);
  const blockedUpgrades = unique([
    ...route.boundaries.map(boundary => boundary.type),
    ...EXTRA_FORBIDDEN_WRITES,
  ]);
  return {
    id: `faction_goal_prereq_${routeKey}`,
    routeKey,
    title: ROUTE_TITLES[routeKey],
    disposition,
    currentFactionId: factionId,
    currentIdentitySummary: currentIdentitySummary(input, factionId),
    publicSummary: publicSummaryFor(route, disposition),
    prerequisiteLines: prerequisiteLines(route),
    riskLines: riskLines(route),
    allowedNextSteps: allowedNextSteps(route),
    blockedUpgrades,
    visibleSourceRefs: unique(route.sourceRefs).slice(0, 8),
    canPatch: false,
    canChangeFaction: false,
    createsFormalTask: false,
    grantsReward: false,
  };
}

export function buildQingmaoFactionGoalPrerequisites(
  input: QingmaoFactionGoalPrerequisiteInput = {},
): QingmaoFactionGoalPrerequisiteResult {
  const requestedKeys = routeKeysFromIntent(input);
  const preview = buildQingmaoRouteContinuationPreview({
    livingWorldState: input.livingWorldState,
    intentText: input.intentText,
    maxRoutes: 12,
  });
  const maxCards = Math.max(1, Math.floor(Number(input.maxCards ?? 4)));
  const cards = preview.previews
    .filter(route => requestedKeys.has(route.routeKey as FactionGoalRouteKey))
    .map(route => buildCard(route, input))
    .filter((card): card is QingmaoFactionGoalPrerequisiteCard => Boolean(card))
    .slice(0, maxCards);
  const sourceRefs = unique(cards.flatMap(card => card.visibleSourceRefs));
  const forbiddenWrites = unique([...preview.forbiddenWrites, ...EXTRA_FORBIDDEN_WRITES]);

  return {
    status: 'read_only_prerequisite_preview',
    message: cards.length > 0
      ? `已生成 ${cards.length} 条阵营/身份目标前置说明；当前只读，不改变阵营。`
      : '当前输入没有命中阵营/身份目标前置展示。',
    publicSummary: '阵营、商队、城市和散修身份目标只能先展示前置、风险和禁止升级，不创建正式转投或任务。',
    cards,
    intentRulingHints: preview.intentRulingHints,
    sourceRefs,
    forbiddenWrites,
    rejectedReasons: cards.length > 0 ? [] : ['no_faction_or_identity_goal_matched'],
    miroFishNeed: 'not_needed',
    statePatchApplied: false,
  };
}
