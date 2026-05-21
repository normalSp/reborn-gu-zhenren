import { useMemo } from 'react';
import { useStore } from '../../store';
import {
  buildV140RegionSampleProjection,
  type V140RegionPostureId,
  type V140RegionPostureStatus,
} from '../../engine/v140-region-sample-projection';

const postureLabel: Record<V140RegionPostureId, string> = {
  mountain_road_outer_edge: '山路',
  caravan_contact_window: '商队',
  rogue_settlement_hint: '散修',
  city_outer_threshold: '城外',
};

const postureClass: Record<V140RegionPostureStatus, string> = {
  visible: 'border-rg-jade-400/30 bg-rg-jade-500/10 text-rg-jade-100',
  needs_context: 'border-rg-ink-300/15 bg-rg-ink-700/25 text-rg-paper-100',
};

function statusText(status: V140RegionPostureStatus): string {
  return status === 'visible' ? '可读' : '待证据';
}

export function RegionSamplePanel() {
  const livingWorldState = useStore((s: any) => s.livingWorldState);
  const routeLocationState = useStore((s: any) => s.routeLocationState);
  const survivalEconomyState = useStore((s: any) => s.survivalEconomyState);
  const localActionLedger = useStore((s: any) => s.sceneSessionState?.localActionLedger || []);
  const materialBag = useStore((s: any) => s.materialBag || {});
  const turn = useStore((s: any) => s.turn);

  const projection = useMemo(() => buildV140RegionSampleProjection({
    livingWorldState,
    routeLocationState,
    survivalEconomyState,
    localActionLedger,
    materialBag,
    turn,
  }), [livingWorldState, routeLocationState, survivalEconomyState, localActionLedger, materialBag, turn]);

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="v140-region-sample-panel">
      <div className="space-y-3">
        <div className="rounded-sm border border-rg-gold-400/30 bg-rg-gold-500/10 p-3" data-testid="v140-region-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-rg-gold-100">南疆低阶区域样板</p>
            <span className="text-[10px] text-rg-paper-200/55">{projection.statusLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/78">{projection.publicSummary}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">{projection.nextStep}</p>
        </div>

        <div
          className="rounded-sm border border-rg-jade-400/22 bg-rg-jade-500/10 p-3"
          data-testid="v140-region-audit"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rg-jade-100">投影审计</p>
            <span className="text-[10px] text-rg-paper-200/55">
              {projection.projectionAudit.saveFormatPolicy} · {projection.projectionAudit.persistentWritePolicy}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/58">
            projection-first · SAVE_FORMAT_VERSION = 24 · 不返回 regionSampleState patch · DeepSeek 无新增权限
          </p>
        </div>

        <div className="grid gap-2 lg:grid-cols-2" data-testid="v140-region-posture-list">
          {projection.postureCards.map(card => (
            <article
              key={card.id}
              className={`rounded-sm border p-3 ${postureClass[card.status]}`}
              data-testid={`v140-region-posture-${card.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{card.title}</p>
                  <p className="mt-1 text-[10px] opacity-65">{postureLabel[card.id]} · {statusText(card.status)}</p>
                </div>
                <span className="shrink-0 rounded-sm border border-rg-ink-100/10 px-2 py-1 text-[10px] opacity-70">
                  {statusText(card.status)}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed opacity-82">{card.summary}</p>
              <p className="mt-2 text-[10px] leading-relaxed opacity-72">{card.nextStep}</p>
              <p className="mt-2 text-[9px] leading-relaxed opacity-58">
                不写正式地点 · 不转阵营 · 不发奖励 · 不写 NPC 生死
              </p>
              {card.evidenceRefs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {card.evidenceRefs.slice(0, 4).map(ref => (
                    <span key={ref} className="rounded-sm border border-rg-ink-100/10 px-1.5 py-0.5 text-[9px] opacity-65">{ref}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v140-region-next-steps">
          <p className="text-xs font-semibold text-rg-paper-100">证据组</p>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {projection.signalGroups.map(group => (
              <div key={group.id} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/25 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-rg-paper-100">{group.title}</p>
                  <span className="text-[10px] text-rg-paper-200/55">{group.statusLabel}</span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/60">{group.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v140-region-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {projection.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/58">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v140-region-source-refs">
          <p className="text-xs font-semibold text-rg-paper-100">来源</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {projection.visibleSourceRefs.slice(0, 14).map(ref => (
              <span key={ref} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
