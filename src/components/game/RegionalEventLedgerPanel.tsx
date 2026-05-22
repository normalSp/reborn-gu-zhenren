import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import {
  buildV200RegionalEventEnvelopes,
  resolveV200WorldCoreRegionalEventLedgerSync,
} from '../../engine/v200-regional-event-ledger';
import { buildV200SameStartReplayDiff } from '../../engine/v200-same-start-replay-diff';
import type { RegionalPublicEventKind } from '../../types';

const eventKindLabel: Record<RegionalPublicEventKind, string> = {
  checkpoint_questioning: '盘问',
  caravan_contact: '商队',
  temporary_labor: '短工',
  shelter_debt: '遮蔽',
  market_pressure: '市场',
  road_conflict_pressure: '路途',
  gate_threshold: '门槛',
};

function levelText(level: string): string {
  if (level === 'high') return '高压';
  if (level === 'medium') return '中压';
  return '低压';
}

export function RegionalEventLedgerPanel() {
  const [actionMessage, setActionMessage] = useState('');
  const livingWorldState = useStore((s: any) => s.livingWorldState);
  const routeLocationState = useStore((s: any) => s.routeLocationState);
  const survivalEconomyState = useStore((s: any) => s.survivalEconomyState);
  const regionalEventLedger = useStore((s: any) => s.regionalEventLedger);
  const syncRegionalEventLedgerAction = useStore((s: any) => s.syncRegionalEventLedgerAction);
  const localActionLedger = useStore((s: any) => s.sceneSessionState?.localActionLedger || []);
  const materialBag = useStore((s: any) => s.materialBag || {});
  const combatEventCandidates = useStore((s: any) => s.flags?.combatEventCandidates || []);
  const battleResolutionSteps = useStore((s: any) => s.battlefieldPlaybackSteps || []);
  const battleOutcomeSummary = useStore((s: any) => s.combatEncounterState?.outcomeSummary || null);
  const profile = useStore((s: any) => s.profile);
  const inventory = useStore((s: any) => s.inventory || []);
  const currentChapterId = useStore((s: any) => s.currentChapterId);
  const turn = useStore((s: any) => s.turn);

  const input = useMemo(() => ({
    livingWorldState,
    routeLocationState,
    survivalEconomyState,
    localActionLedger,
    materialBag,
    combatEventCandidates,
    battleResolutionSteps,
    battleOutcomeSummary,
    profile,
    inventory,
    currentChapterId,
    turn,
    previousLedger: regionalEventLedger,
  }), [
    livingWorldState,
    routeLocationState,
    survivalEconomyState,
    localActionLedger,
    materialBag,
    combatEventCandidates,
    battleResolutionSteps,
    battleOutcomeSummary,
    profile,
    inventory,
    currentChapterId,
    turn,
    regionalEventLedger,
  ]);

  const envelopes = useMemo(() => buildV200RegionalEventEnvelopes(input), [input]);
  const preview = useMemo(() => resolveV200WorldCoreRegionalEventLedgerSync(input), [input]);
  const replayDiff = useMemo(() => buildV200SameStartReplayDiff({
    ...input,
    regionalEventLedger,
  }), [input, regionalEventLedger]);
  const publicEvents = Array.isArray(regionalEventLedger?.publicEvents) ? regionalEventLedger.publicEvents : [];
  const pendingFollowUps = Array.isArray(regionalEventLedger?.pendingFollowUps) ? regionalEventLedger.pendingFollowUps : [];
  const canSync = envelopes.length > 0;

  const syncLedger = () => {
    const result = syncRegionalEventLedgerAction?.();
    setActionMessage(result?.message || 'WorldCore 未返回区域事件账本结果。');
  };

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="v200-regional-event-ledger-panel">
      <div className="space-y-3">
        <div className="rounded-sm border border-rg-gold-400/30 bg-rg-gold-500/10 p-3" data-testid="v200-ledger-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-rg-gold-100">WorldCore 区域事件账本</p>
            <span className="text-[10px] text-rg-paper-200/55">
              {regionalEventLedger?.status === 'events_tracked' ? '已登记' : '待登记'}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/78">
            v2.0-b3 以稳定账本承接公开压力，并从同一开局中派生可对照的 replay lane。
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">
            账本只记录公开事件、来源、压力和 pending follow-up；不记录 DeepSeek 原文、hidden body、正式地点、正式身份、奖励或 NPC 生死。
          </p>
        </div>

        <div className="rounded-sm border border-rg-jade-400/25 bg-rg-jade-500/10 p-3" data-testid="v200-ledger-audit">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-rg-jade-100">v25 最小账本</p>
              <p className="mt-1 text-[10px] text-rg-paper-200/55">
                SAVE_FORMAT_VERSION = 25 · 单一 regionalEventLedger · WorldCore local engine
              </p>
            </div>
            <button
              type="button"
              className="rounded-sm border border-rg-jade-300/35 px-3 py-1.5 text-[11px] font-semibold text-rg-jade-100 transition hover:bg-rg-jade-400/10 disabled:cursor-not-allowed disabled:opacity-45"
              data-testid="v200-regional-event-ledger-sync"
              disabled={!canSync}
              onClick={syncLedger}
            >
              登记
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/58">
            当前可晋升 envelope：{envelopes.length}；去重后预览：{preview.regionalEventLedger.publicEvents.length}；账本事件：{publicEvents.length}；待处理：{pendingFollowUps.length}；压力 {levelText(regionalEventLedger?.pressureSummary?.level)} / {regionalEventLedger?.pressureSummary?.score || 0}
          </p>
          {actionMessage && (
            <p className="mt-2 text-[10px] leading-relaxed text-rg-jade-100/80" data-testid="v200-ledger-action-result">
              {actionMessage}
            </p>
          )}
        </div>

        <div className="rounded-sm border border-rg-amber-400/25 bg-rg-amber-500/10 p-3" data-testid="v200-replay-diff-audit">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-rg-amber-100">同开局差异</p>
              <p className="mt-1 text-[10px] text-rg-paper-200/55">
                {replayDiff.statusLabel} · lane {replayDiff.audit.visibleLaneCount} · score {replayDiff.replayDiffScore}
              </p>
            </div>
            <span className="rounded-sm border border-rg-amber-100/15 px-2 py-1 text-[10px] text-rg-paper-200/55">
              no runFingerprint
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/62">
            {replayDiff.publicSummary}
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/48">
            当前 lane：{replayDiff.activeLaneId || '等待更多公开事件'}；差异只来自公开账本、pressure lane、玩家选择和叙事表达，不改稳定事实。
          </p>
          <div className="mt-2 grid gap-1.5 md:grid-cols-2">
            {replayDiff.lanes.filter((lane: any) => lane.status === 'visible').slice(0, 4).map((lane: any) => (
              <p key={lane.id} className="text-[10px] leading-relaxed text-rg-paper-200/58">
                {lane.title}：{lane.nextStep}
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-2" data-testid="v200-ledger-event-list">
          {publicEvents.slice(-8).map((event: any) => (
            <article
              key={event.id}
              className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3"
              data-testid={`v200-ledger-event-${event.eventKind}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-rg-paper-100">{eventKindLabel[event.eventKind as RegionalPublicEventKind] || event.eventKind}</p>
                  <p className="mt-1 text-[10px] text-rg-paper-200/52">T{event.turn} · {event.status}</p>
                </div>
                <span className="shrink-0 rounded-sm border border-rg-ink-100/10 px-2 py-1 text-[10px] text-rg-paper-200/55">
                  WorldCore
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-rg-paper-200/68">{event.publicSummary}</p>
              <p className="mt-2 text-[9px] leading-relaxed text-rg-paper-200/45">
                承接键：{event.publicSummaryKey}
              </p>
              <p className="mt-2 text-[9px] leading-relaxed text-rg-paper-200/48">
                阻断：{(event.forbiddenOutcomes || []).slice(0, 4).join(' / ') || 'formal outcome'}
              </p>
            </article>
          ))}
        </div>

        {publicEvents.length === 0 && (
          <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v200-ledger-empty">
            <p className="text-xs font-semibold text-rg-paper-100">尚未登记区域事件</p>
            <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">
              需要先形成南疆早期低阶外缘的公开路线、生存、社会或冲突压力，再由 WorldCore 登记。
            </p>
          </div>
        )}

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v200-ledger-followups">
          <p className="text-xs font-semibold text-rg-paper-100">待处理后续</p>
          <div className="mt-2 grid gap-1.5">
            {pendingFollowUps.slice(-6).map((item: any) => (
              <p key={item.id} className="text-[10px] leading-relaxed text-rg-paper-200/60">
                {eventKindLabel[item.eventKind as RegionalPublicEventKind] || item.eventKind}：{item.nextStep}
              </p>
            ))}
            {pendingFollowUps.length === 0 && (
              <p className="text-[10px] leading-relaxed text-rg-paper-200/45">暂无 pending follow-up。</p>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v200-ledger-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {preview.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/58">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v200-ledger-source-refs">
          <p className="text-xs font-semibold text-rg-paper-100">来源</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(regionalEventLedger?.sourceRefs || []).slice(0, 16).map((ref: string) => (
              <span key={ref} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
