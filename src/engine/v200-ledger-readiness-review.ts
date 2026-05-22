import {
  normalizeRegionalEventLedger,
} from './v200-regional-event-ledger';
import type { RegionalEventLedger } from '../types';

export type V200LedgerReadinessStatus =
  | 'old_save_default'
  | 'ready_for_replay'
  | 'blocked_for_review';

export type V200LedgerReadinessCardStatus = 'ok' | 'watch' | 'blocked';

export interface V200LedgerReadinessCard {
  id: 'old_save' | 'entry_consistency' | 'rollback' | 't3_ready';
  title: string;
  status: V200LedgerReadinessCardStatus;
  detail: string;
}

export interface V200LedgerReadinessReview {
  status: V200LedgerReadinessStatus;
  statusLabel: string;
  scopeId: 'v200_b4_ledger_entry_save_rollback_review';
  authority: 'local_report_only';
  saveFormatImpact: 'none_v25_existing_ledger_only';
  eventCount: number;
  followUpCount: number;
  compactUiMaxCards: number;
  publicSummary: string;
  nextStep: string;
  cards: V200LedgerReadinessCard[];
  rollbackLines: string[];
  sourceRefs: string[];
  canWriteSave: false;
  canCreateRunFingerprint: false;
  canCreateRegionalLifeState: false;
  canCreateIdentityRouteState: false;
  canExpandDeepSeekAuthority: false;
}

export interface V200LedgerReadinessReviewInput {
  regionalEventLedger?: Partial<RegionalEventLedger> | null;
  turn?: number;
}

const COMPACT_UI_MAX_CARDS = 4;

function statusFromLedger(ledger: RegionalEventLedger): V200LedgerReadinessStatus {
  if (ledger.status === 'blocked') return 'blocked_for_review';
  if (ledger.publicEvents.length === 0 && ledger.pendingFollowUps.length === 0) return 'old_save_default';
  return 'ready_for_replay';
}

function buildCards(ledger: RegionalEventLedger): V200LedgerReadinessCard[] {
  const eventCount = ledger.publicEvents.length;
  const followUpCount = ledger.pendingFollowUps.length;
  const blocked = ledger.status === 'blocked';
  return [
    {
      id: 'old_save',
      title: '旧档默认',
      status: blocked ? 'blocked' : 'ok',
      detail: eventCount === 0
        ? 'v24/v25 旧档可保持空账本，等待 WorldCore 登记公开事件。'
        : `已承接 ${eventCount} 个公开事件，旧档不会重复膨胀。`,
    },
    {
      id: 'entry_consistency',
      title: '入口一致',
      status: blocked ? 'blocked' : 'ok',
      detail: 'b1-b4 仍共用世界面板 `账本` tab，不新增地图/身份/奖励入口。',
    },
    {
      id: 'rollback',
      title: '回滚边界',
      status: blocked ? 'blocked' : 'ok',
      detail: '回滚只影响 v25 账本展示与同步，不删除路线、生存、社会、冲突等既有证据。',
    },
    {
      id: 't3_ready',
      title: 'T3 前置',
      status: blocked ? 'blocked' : eventCount >= 3 && followUpCount >= 3 ? 'ok' : 'watch',
      detail: eventCount >= 3 && followUpCount >= 3
        ? '已有足够公开事件进入 rc T3 对照样本池。'
        : '需要更多公开事件后再判断同开局差异强度。',
    },
  ];
}

export function buildV200LedgerReadinessReview(
  input: V200LedgerReadinessReviewInput = {},
): V200LedgerReadinessReview {
  const ledger = normalizeRegionalEventLedger(input.regionalEventLedger, input.turn ?? 0);
  const status = statusFromLedger(ledger);
  const eventCount = ledger.publicEvents.length;
  const followUpCount = ledger.pendingFollowUps.length;
  const cards = buildCards(ledger);
  const statusLabel = status === 'blocked_for_review'
    ? '账本需保守复核'
    : status === 'ready_for_replay'
      ? '入口与回滚可读'
      : '旧档空账本安全';

  return {
    status,
    statusLabel,
    scopeId: 'v200_b4_ledger_entry_save_rollback_review',
    authority: 'local_report_only',
    saveFormatImpact: 'none_v25_existing_ledger_only',
    eventCount,
    followUpCount,
    compactUiMaxCards: COMPACT_UI_MAX_CARDS,
    publicSummary: status === 'blocked_for_review'
      ? '账本 authority 或 region key 曾被手改，当前只显示保守复核提示，不信任其正式结果。'
      : status === 'ready_for_replay'
        ? 'v25 区域事件账本、同开局差异卡和 pending follow-up 已共用同一入口；旧档与回滚边界保持可读。'
        : '旧档会补空的 v25 区域事件账本；没有公开事件前不制造 replay 差异、地点、身份或奖励。',
    nextStep: status === 'blocked_for_review'
      ? '先回到本地 WorldCore 重新登记公开事件，不手动信任编辑档。'
      : status === 'ready_for_replay'
        ? '继续进入 process-1 与 rc，检查移动端密度、旧档默认和 T3 入口一致性。'
        : '继续推进公开盘问、商队、市场、遮蔽或路途事件，再登记账本。',
    cards,
    rollbackLines: [
      '不写新字段，不 bump SAVE_FORMAT_VERSION。',
      '不创建 runFingerprint、regionalLifeState、identityRouteState。',
      '不让 DeepSeek 写 ledger、地点、身份、奖励或 NPC 生死。',
      '回滚时优先移除 b4 UI/helper；v25 账本字段仍由 b1 门禁管理。',
    ],
    sourceRefs: [
      'v2.0.0-b1:regionalEventLedger',
      'v2.0.0-b2:regional-event-continuity-dedupe',
      'v2.0.0-b3:same-start-replay-diff',
      'v2.0.0-b4:ui-save-rollback-readiness',
    ],
    canWriteSave: false,
    canCreateRunFingerprint: false,
    canCreateRegionalLifeState: false,
    canCreateIdentityRouteState: false,
    canExpandDeepSeekAuthority: false,
  };
}
