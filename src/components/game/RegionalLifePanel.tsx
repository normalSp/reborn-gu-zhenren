import { useMemo } from 'react';
import { useStore } from '../../store';
import {
  buildV170RegionalLifeProjection,
  type V170RegionalLifePressureId,
  type V170RegionalLifePressureStatus,
} from '../../engine/v170-regional-life-projection';

const pressureLabel: Record<V170RegionalLifePressureId, string> = {
  outer_edge_interrogation: '盘问',
  caravan_contact_by_labor: '短工',
  caravan_permission_chain: '许可',
  low_status_labor: '杂务',
  temporary_market_window: '市场',
  shelter_debt_window: '遮蔽',
  road_event_protocol: '路途',
  far_city_as_pressure: '远城',
};

const pressureClass: Record<V170RegionalLifePressureStatus, string> = {
  visible: 'border-rg-gold-400/30 bg-rg-gold-500/10 text-rg-paper-100',
  needs_context: 'border-rg-ink-300/15 bg-rg-ink-700/25 text-rg-paper-100',
};

function statusText(status: V170RegionalLifePressureStatus): string {
  return status === 'visible' ? '可读' : '待证据';
}

export function RegionalLifePanel() {
  const livingWorldState = useStore((s: any) => s.livingWorldState);
  const routeLocationState = useStore((s: any) => s.routeLocationState);
  const survivalEconomyState = useStore((s: any) => s.survivalEconomyState);
  const localActionLedger = useStore((s: any) => s.sceneSessionState?.localActionLedger || []);
  const materialBag = useStore((s: any) => s.materialBag || {});
  const combatEventCandidates = useStore((s: any) => s.flags?.combatEventCandidates || []);
  const battleResolutionSteps = useStore((s: any) => s.battlefieldPlaybackSteps || []);
  const battleOutcomeSummary = useStore((s: any) => s.combatEncounterState?.outcomeSummary || null);
  const profile = useStore((s: any) => s.profile);
  const inventory = useStore((s: any) => s.inventory || []);
  const currentChapterId = useStore((s: any) => s.currentChapterId);
  const turn = useStore((s: any) => s.turn);

  const projection = useMemo(() => buildV170RegionalLifeProjection({
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
  ]);

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="v170-regional-life-panel">
      <div className="space-y-3">
        <div className="rounded-sm border border-rg-gold-400/30 bg-rg-gold-500/10 p-3" data-testid="v170-regional-life-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-rg-gold-100">区域活世界</p>
            <span className="text-[10px] text-rg-paper-200/55">{projection.statusLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/78">{projection.publicSummary}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">{projection.nextStep}</p>
        </div>

        <div className="rounded-sm border border-rg-jade-400/22 bg-rg-jade-500/10 p-3" data-testid="v170-regional-life-audit">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rg-jade-100">投影审计</p>
            <span className="text-[10px] text-rg-paper-200/55">
              {projection.projectionAudit.saveFormatPolicy} · {projection.projectionAudit.persistentWritePolicy}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/58">
            projection-first · SAVE_FORMAT_VERSION = 24 · 不返回 regionalLifeState / areaLivingState patch · DeepSeek 无新增权限
          </p>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v170-regional-life-replayability">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rg-paper-100">同开局差异度</p>
            <span className="text-[10px] text-rg-paper-200/55">
              {projection.replayabilityAudit.candidatePressureIds.length} / {projection.replayabilityAudit.minimumVisibleVariantsForB1}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/60">
            差异来自本地 pressure deck 与叙事表达；路线、身份、奖励、地点和 NPC 命运保持稳定。
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {projection.replayabilityAudit.candidatePressureIds.slice(0, 8).map(id => (
              <span key={id} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/60">
                {pressureLabel[id]}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-2" data-testid="v170-regional-life-pressure-list">
          {projection.pressureCards.map(card => (
            <article
              key={card.id}
              className={`rounded-sm border p-3 ${pressureClass[card.status]}`}
              data-testid={`v170-regional-life-pressure-${card.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{card.title}</p>
                  <p className="mt-1 text-[10px] opacity-65">{pressureLabel[card.id]} · {statusText(card.status)}</p>
                </div>
                <span className="shrink-0 rounded-sm border border-rg-ink-100/10 px-2 py-1 text-[10px] opacity-70">
                  {projection.activePressureId === card.id ? '当前' : statusText(card.status)}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed opacity-82">{card.summary}</p>
              <p className="mt-2 text-[10px] leading-relaxed opacity-72">{card.nextStep}</p>
              <p className="mt-2 text-[9px] leading-relaxed opacity-58">
                不写地点 · 不转阵营 · 不发奖励 · 不定 NPC 生死
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

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v170-regional-life-next-steps">
          <p className="text-xs font-semibold text-rg-paper-100">下一步候选</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {projection.nextStepCandidates.map(item => (
              <p key={item} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/25 px-2 py-1.5 text-[10px] leading-relaxed text-rg-paper-200/60">
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v170-regional-life-signals">
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

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v170-regional-life-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {projection.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/58">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v170-regional-life-source-refs">
          <p className="text-xs font-semibold text-rg-paper-100">来源</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {projection.visibleSourceRefs.slice(0, 16).map(ref => (
              <span key={ref} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
