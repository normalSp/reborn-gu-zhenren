import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { buildV110RouteLocationOverview } from '../../engine/v110-route-location-state';

const statusClass: Record<string, string> = {
  not_started: 'border-rg-ink-300/15 bg-rg-ink-700/30 text-rg-paper-100',
  preparing_departure: 'border-rg-gold-400/35 bg-rg-gold-500/10 text-rg-gold-100',
  route_in_progress: 'border-rg-blood-400/35 bg-rg-blood-500/10 text-rg-blood-100',
  outer_edge_projection: 'border-rg-jade-400/35 bg-rg-jade-500/10 text-rg-jade-100',
  blocked: 'border-rg-blood-400/55 bg-rg-blood-500/15 text-rg-blood-100',
};

function DetailRow({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-rg-ink-300/10 py-2 last:border-b-0">
      <span className="shrink-0 text-[10px] text-rg-paper-200/45">{label}</span>
      <span className="text-right text-xs font-medium leading-relaxed text-rg-paper-100" data-testid={testId}>{value}</span>
    </div>
  );
}

export function RouteLocationPanel() {
  const routeLocationState = useStore((s: any) => s.routeLocationState);
  const livingWorldState = useStore((s: any) => s.livingWorldState);
  const turn = useStore((s: any) => s.turn);
  const resolveRouteLocation = useStore((s: any) => s.resolveV110RouteLocationStateAction);
  const [message, setMessage] = useState('');

  const overview = useMemo(() => buildV110RouteLocationOverview({
    routeLocationState,
    livingWorldState,
    turn,
  }), [routeLocationState, livingWorldState, turn]);
  const state = overview.routeLocationState;

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="route-location-panel">
      <div className="space-y-3">
        <div className={`rounded-sm border p-3 ${statusClass[state.status] || statusClass.not_started}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold" data-testid="route-location-status">{overview.statusLabel}</p>
            <span className="text-[10px] text-rg-paper-200/55">T{state.lastUpdatedAtTurn ?? '-'}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/80">{overview.publicSummary}</p>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="route-location-scope">
          <DetailRow label="路线" value={state.routeId || '未记录'} />
          <DetailRow label="地点范围" value={overview.locationLabel} />
          <DetailRow label="区域范围" value={overview.regionLabel} />
          <DetailRow label="写入来源" value={state.authority} />
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3">
          <p className="text-xs font-semibold text-rg-paper-100">下一步</p>
          <p className="mt-2 text-[11px] leading-relaxed text-rg-paper-200/62">{overview.nextStep}</p>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="route-location-evidence">
          <p className="text-xs font-semibold text-rg-paper-100">证据</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {overview.evidenceLedgerEntryIds.length > 0 ? overview.evidenceLedgerEntryIds.map(id => (
              <span key={id} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">{id}</span>
            )) : (
              <span className="text-[10px] text-rg-paper-200/45">无路线账本证据</span>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="route-location-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {overview.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/55">{line}</p>
            ))}
            <p className="text-[10px] leading-relaxed text-rg-paper-200/55">
              禁止：完整南疆、商家城核心、正式阵营、奖励、NPC 生死、DeepSeek 字段写入。
            </p>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-sm border border-rg-gold-400/40 bg-rg-gold-500/10 px-3 py-2 text-xs font-semibold text-rg-gold-100 transition-micro hover:border-rg-gold-300/70"
          onClick={() => {
            const result = resolveRouteLocation?.();
            setMessage(result?.message || '');
          }}
          data-testid="route-location-sync"
        >
          同步路线范围
        </button>
        {message && (
          <p className="text-[10px] leading-relaxed text-rg-paper-200/55" data-testid="route-location-message">{message}</p>
        )}
      </div>
    </div>
  );
}
