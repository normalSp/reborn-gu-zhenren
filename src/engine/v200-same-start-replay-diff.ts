import {
  normalizeRegionalEventLedger,
  resolveV200WorldCoreRegionalEventLedgerSync,
} from './v200-regional-event-ledger';
import type {
  RegionalEventLedger,
  RegionalPublicEvent,
  RegionalPublicEventKind,
} from '../types';
import type { V170RegionalLifeProjectionInput } from './v170-regional-life-projection';

export type V200ReplayDiffStatus = 'needs_regional_event_ledger' | 'replay_diff_visible';

export type V200ReplayLaneId =
  | 'explain_identity'
  | 'caravan_labor'
  | 'market_supply'
  | 'shelter_debt'
  | 'road_caution'
  | 'far_city_boundary';

export interface V200ReplayDiffLane {
  id: V200ReplayLaneId;
  title: string;
  status: 'visible' | 'needs_event';
  publicSummary: string;
  nextStep: string;
  eventKinds: RegionalPublicEventKind[];
  eventIds: string[];
  evidenceRefs: string[];
  sourceRefs: string[];
  forbiddenDifferenceSources: string[];
  canWriteSave: false;
  canCreateRunFingerprint: false;
  canChangeStableFacts: false;
  canGrantReward: false;
  canSetNpcFate: false;
}

export interface V200ReplayDiffAudit {
  policy: 'same_start_replay_diff_without_persistent_fingerprint';
  variantSourcePolicy: 'regional_event_ledger_pressure_lanes_only';
  stableFactPolicy: 'facts_rewards_locations_identity_npc_fate_do_not_vary';
  activeVariantIndex: number;
  visibleLaneCount: number;
  uniqueEventKindCount: number;
  minimumVisibleLanesForB3: number;
  pass: boolean;
  notes: string[];
}

export interface V200SameStartReplayDiff {
  status: V200ReplayDiffStatus;
  statusLabel: string;
  scopeId: 'v200_same_start_replay_diff_without_fingerprint';
  authority: 'local_report_only';
  saveFormatImpact: 'none_v25_existing_ledger_only';
  activeLaneId: V200ReplayLaneId | null;
  replayDiffScore: number;
  publicSummary: string;
  nextStep: string;
  lanes: V200ReplayDiffLane[];
  boundaryLines: string[];
  visibleSourceRefs: string[];
  audit: V200ReplayDiffAudit;
  canWriteSave: false;
  canCreateRunFingerprint: false;
  canCreateRegionalLifeState: false;
  canCreateIdentityRouteState: false;
  canExpandDeepSeekAuthority: false;
}

interface LaneRule {
  id: V200ReplayLaneId;
  title: string;
  eventKinds: RegionalPublicEventKind[];
  visibleSummary: string;
  missingSummary: string;
  nextStep: string;
}

export interface V200SameStartReplayDiffInput extends V170RegionalLifeProjectionInput {
  regionalEventLedger?: Partial<RegionalEventLedger> | null;
  previousLedger?: Partial<RegionalEventLedger> | null;
}

const MIN_VISIBLE_LANES = 3;

const LANE_RULES: LaneRule[] = [
  {
    id: 'explain_identity',
    title: '解释身份',
    eventKinds: ['checkpoint_questioning'],
    visibleSummary: '同一开局可从外缘盘问切入：解释来路、降低嫌疑、寻找公开旁证。',
    missingSummary: '尚缺外缘盘问事件，解释身份 lane 暂不展开。',
    nextStep: '准备可公开的来路说辞和短期目的，不生成正式通行或身份。',
  },
  {
    id: 'caravan_labor',
    title: '商队短工',
    eventKinds: ['caravan_contact', 'temporary_labor'],
    visibleSummary: '同一开局可偏向商队短工：搬运、递话、低身份劳作和许可压力。',
    missingSummary: '尚缺商队或短工事件，商队短工 lane 暂不展开。',
    nextStep: '用低身份劳作换取话口，不写正式成员、工资、库存或奖励。',
  },
  {
    id: 'market_supply',
    title: '临市补给',
    eventKinds: ['market_pressure'],
    visibleSummary: '同一开局可偏向临时市场：询价、压价、打听补给和拒绝压力。',
    missingSummary: '尚缺市场压力事件，临市补给 lane 暂不展开。',
    nextStep: '观察货物和人流，交易结算、价格表和库存仍不开放。',
  },
  {
    id: 'shelter_debt',
    title: '遮蔽人情',
    eventKinds: ['shelter_debt'],
    visibleSummary: '同一开局可偏向短期遮蔽：求助、人情债、守夜或尽快脱身。',
    missingSummary: '尚缺遮蔽或人情债事件，遮蔽 lane 暂不展开。',
    nextStep: '把遮蔽当作压力和后续候选，不写长期债务字段或 NPC 命运。',
  },
  {
    id: 'road_caution',
    title: '路途避险',
    eventKinds: ['road_conflict_pressure'],
    visibleSummary: '同一开局可偏向路途避险：绕路、等待、押运压力或冲突后续。',
    missingSummary: '尚缺路途冲突压力事件，路途避险 lane 暂不展开。',
    nextStep: '选择避让、等待或低风险协助；战斗奖励和 NPC 生死仍归本地系统。',
  },
  {
    id: 'far_city_boundary',
    title: '远城门槛',
    eventKinds: ['gate_threshold'],
    visibleSummary: '同一开局可偏向远城门槛：把大城当作方向压力，而不是正式地点开放。',
    missingSummary: '尚缺远城门槛事件，远城 lane 暂不展开。',
    nextStep: '继续积累公开理由和担保，不进入完整城市或正式身份系统。',
  },
];

const FORBIDDEN_DIFFERENCE_SOURCES = [
  'runFingerprint',
  'regionalLifeState',
  'identityRouteState',
  'formal_location_change',
  'formal_identity_or_faction_change',
  'reward_or_inventory_change',
  'npc_life_death_change',
  'hidden_or_private_fact_reveal',
  'deepseek_fact_authority',
];

function unique(values: Array<string | null | undefined>, max = 80): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))]
    .slice(0, max);
}

function sanitizeRefs(values: string[], max = 32): string[] {
  const blocked = ['hidden', 'private', 'source_text', 'raw', 'quote', 'original', 'body'];
  return unique(values, max).filter(value => !blocked.some(token => value.toLowerCase().includes(token)));
}

function eventsForLane(events: RegionalPublicEvent[], rule: LaneRule): RegionalPublicEvent[] {
  return events.filter(event => rule.eventKinds.includes(event.eventKind));
}

function buildLane(rule: LaneRule, events: RegionalPublicEvent[]): V200ReplayDiffLane {
  const matched = eventsForLane(events, rule);
  const visible = matched.length > 0;
  return {
    id: rule.id,
    title: rule.title,
    status: visible ? 'visible' : 'needs_event',
    publicSummary: visible ? rule.visibleSummary : rule.missingSummary,
    nextStep: rule.nextStep,
    eventKinds: rule.eventKinds,
    eventIds: matched.map(event => event.id),
    evidenceRefs: sanitizeRefs(matched.flatMap(event => [
      ...event.sourceActionRefs,
      ...event.sourceFactRefs,
    ]), 16),
    sourceRefs: sanitizeRefs(matched.flatMap(event => event.sourceRefs), 16),
    forbiddenDifferenceSources: [...FORBIDDEN_DIFFERENCE_SOURCES],
    canWriteSave: false,
    canCreateRunFingerprint: false,
    canChangeStableFacts: false,
    canGrantReward: false,
    canSetNpcFate: false,
  };
}

function selectActiveLane(visible: V200ReplayDiffLane[], variantIndex: number): V200ReplayLaneId | null {
  if (visible.length === 0) return null;
  const safeIndex = Math.abs(Math.floor(Number.isFinite(variantIndex) ? variantIndex : 0)) % visible.length;
  return visible[safeIndex].id;
}

function scoreReplayDiff(visibleLaneCount: number, uniqueEventKindCount: number): number {
  return Math.min(100, visibleLaneCount * 16 + uniqueEventKindCount * 6);
}

function normalizeInputLedger(input: V200SameStartReplayDiffInput): RegionalEventLedger {
  if (input.regionalEventLedger) return normalizeRegionalEventLedger(input.regionalEventLedger, input.turn ?? 0);
  if (input.previousLedger) return normalizeRegionalEventLedger(input.previousLedger, input.turn ?? 0);
  const preview = resolveV200WorldCoreRegionalEventLedgerSync(input);
  return preview.regionalEventLedger;
}

export function buildV200SameStartReplayDiff(
  input: V200SameStartReplayDiffInput = {},
): V200SameStartReplayDiff {
  const ledger = normalizeInputLedger(input);
  const events = ledger.publicEvents || [];
  const lanes = LANE_RULES.map(rule => buildLane(rule, events));
  const visibleLanes = lanes.filter(lane => lane.status === 'visible');
  const uniqueEventKindCount = unique(events.map(event => event.eventKind)).length;
  const computedVariantIndex = input.variantIndex ?? (
    (ledger.lastUpdatedAtTurn || input.turn || 0)
    + events.length
    + ledger.pendingFollowUps.length
    + ledger.sourceRefs.length
  );
  const activeLaneId = selectActiveLane(visibleLanes, computedVariantIndex);
  const pass = visibleLanes.length >= MIN_VISIBLE_LANES
    && lanes.every(lane => (
      !lane.canWriteSave
      && !lane.canCreateRunFingerprint
      && !lane.canChangeStableFacts
      && !lane.canGrantReward
      && !lane.canSetNpcFate
    ));
  const status: V200ReplayDiffStatus = pass ? 'replay_diff_visible' : 'needs_regional_event_ledger';

  return {
    status,
    statusLabel: status === 'replay_diff_visible' ? '同开局差异可读' : '等待更多账本事件',
    scopeId: 'v200_same_start_replay_diff_without_fingerprint',
    authority: 'local_report_only',
    saveFormatImpact: 'none_v25_existing_ledger_only',
    activeLaneId,
    replayDiffScore: scoreReplayDiff(visibleLanes.length, uniqueEventKindCount),
    publicSummary: status === 'replay_diff_visible'
      ? '同一低阶外缘开局已经能从公开账本派生多个 replay lane；差异来自事件压力和玩家路径，不来自事实漂移或新持久随机字段。'
      : '当前账本事件不足，同开局差异仍需更多公开盘问、商队、市场、遮蔽、冲突或远城门槛证据。',
    nextStep: status === 'replay_diff_visible'
      ? '在 b3 先用 replay lane 对照和 T3 样本验证差异是否足够；若不足，再让用户单独决策是否需要 runFingerprint。'
      : '先登记更多公开区域事件，再评估 replay lane 覆盖度。',
    lanes,
    boundaryLines: [
      'b3 只做同开局差异可测化，不新增 runFingerprint。',
      '差异只能来自公开区域事件、pressure lane、玩家选择和叙事表达。',
      '稳定事实、正式地点、身份、阵营、奖励、NPC 生死和 hidden/private 不得随机变化。',
      'DeepSeek 只能根据本地账本写表达，不拥有差异事实裁决权。',
      '若 T3 证明无持久字段差异不足，再单独进入字段设计门禁。',
    ],
    visibleSourceRefs: sanitizeRefs([
      'v1.9.0-b3:runFingerprint-evaluation',
      'v2.0.0-a1:D-201-004',
      'v2.0.0-b2:regional-event-continuity-dedupe',
      ...ledger.sourceRefs,
      ...events.flatMap(event => event.sourceRefs),
    ], 48),
    audit: {
      policy: 'same_start_replay_diff_without_persistent_fingerprint',
      variantSourcePolicy: 'regional_event_ledger_pressure_lanes_only',
      stableFactPolicy: 'facts_rewards_locations_identity_npc_fate_do_not_vary',
      activeVariantIndex: Math.abs(Math.floor(Number(computedVariantIndex) || 0)),
      visibleLaneCount: visibleLanes.length,
      uniqueEventKindCount,
      minimumVisibleLanesForB3: MIN_VISIBLE_LANES,
      pass,
      notes: [
        'b3 uses the existing v25 regionalEventLedger and does not add a save field.',
        'Replay differences are auditable because each lane points back to public event ids and source refs.',
        'runFingerprint remains a future gate until T3 proves pressure-lane replay is insufficient.',
      ],
    },
    canWriteSave: false,
    canCreateRunFingerprint: false,
    canCreateRegionalLifeState: false,
    canCreateIdentityRouteState: false,
    canExpandDeepSeekAuthority: false,
  };
}
