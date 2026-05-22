import { useMemo } from 'react';
import { useStore } from '../../store';
import {
  buildV180IdentityReplayProjection,
  type V180IdentityPressureId,
  type V180IdentityRouteId,
  type V180ProjectionItemStatus,
} from '../../engine/v180-identity-replay-projection';

const routeLabel: Record<V180IdentityRouteId, string> = {
  caravan_temp_hand: '临工',
  rogue_short_work: '短活',
  low_rank_guard_candidate: '护送',
  gathering_runner: '采集',
  message_intel_runner: '消息',
};

const pressureLabel: Record<V180IdentityPressureId, string> = {
  identity_check_window: '盘问',
  caravan_labor_access: '商队',
  permission_chain_prop_word: '许可',
  low_status_labor: '劳作',
  temporary_market_observe: '临市',
  bargain_refusal_short_work: '压价',
  shelter_debt_window: '遮蔽',
  guard_or_gathering_pressure: '护采',
  far_city_boundary: '远城',
};

const statusClass: Record<V180ProjectionItemStatus, string> = {
  visible: 'border-rg-gold-400/30 bg-rg-gold-500/10 text-rg-paper-100',
  needs_context: 'border-rg-ink-300/15 bg-rg-ink-700/25 text-rg-paper-100',
};

function statusText(status: V180ProjectionItemStatus): string {
  return status === 'visible' ? '可读' : '待证据';
}

export function IdentityReplayPanel() {
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

  const projection = useMemo(() => buildV180IdentityReplayProjection({
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
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="v180-identity-replay-panel">
      <div className="space-y-3">
        <div className="rounded-sm border border-rg-gold-400/30 bg-rg-gold-500/10 p-3" data-testid="v180-identity-replay-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-rg-gold-100">身份路线</p>
            <span className="text-[10px] text-rg-paper-200/55">{projection.statusLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/78">{projection.publicSummary}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">{projection.nextStep}</p>
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          <div className="rounded-sm border border-rg-jade-400/22 bg-rg-jade-500/10 p-3" data-testid="v180-identity-replay-audit">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-rg-jade-100">投影审计</p>
              <span className="text-[10px] text-rg-paper-200/55">
                {projection.projectionAudit.saveFormatPolicy} · {projection.projectionAudit.persistentWritePolicy}
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/58">
              projection-first · 当前 SAVE_FORMAT_VERSION = 25 · 不返回 identityRouteState / professionState patch · DeepSeek 无新增权限
            </p>
          </div>

          <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v180-identity-replay-prop-word-audit">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-rg-paper-100">许可词护栏</p>
              <span className="text-[10px] text-rg-paper-200/55">
                {projection.propWordAudit.detectedCategoryCount > 0 ? '已阻断' : '干净'}
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/60">
              正式凭信、名单、许可、身份和固定落脚词只作为风险类别，不成为玩家可见事实。
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v180-identity-replay-replayability">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rg-paper-100">同开局差异度</p>
            <span className="text-[10px] text-rg-paper-200/55">
              {projection.replayabilityAudit.candidateRouteIds.length} / {projection.replayabilityAudit.minimumVisibleRoutesForB1}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/60">
            差异来自本地身份 route deck 与叙事表达；路线、身份、职业、奖励、地点和 NPC 命运保持稳定。
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {projection.replayabilityAudit.candidateRouteIds.slice(0, 8).map(id => (
              <span key={id} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/60">
                {routeLabel[id]}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-2" data-testid="v180-identity-route-list">
          {projection.routeCandidates.map(route => (
            <article
              key={route.id}
              className={`rounded-sm border p-3 ${statusClass[route.status]}`}
              data-testid={`v180-identity-route-${route.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{route.title}</p>
                  <p className="mt-1 text-[10px] opacity-65">{routeLabel[route.id]} · {statusText(route.status)}</p>
                </div>
                <span className="shrink-0 rounded-sm border border-rg-ink-100/10 px-2 py-1 text-[10px] opacity-70">
                  {projection.activeRouteId === route.id ? '当前' : statusText(route.status)}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed opacity-82">{route.publicSummary}</p>
              <p className="mt-2 text-[10px] leading-relaxed opacity-72">{route.nextStep}</p>
              <p className="mt-2 text-[9px] leading-relaxed opacity-58">
                不写身份 · 不写职业 · 不发奖励 · 不定 NPC 生死
              </p>
              {route.pressureIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {route.pressureIds.map(id => (
                    <span key={id} className="rounded-sm border border-rg-ink-100/10 px-1.5 py-0.5 text-[9px] opacity-65">{pressureLabel[id]}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="grid gap-2 lg:grid-cols-3" data-testid="v180-identity-pressure-list">
          {projection.pressureCards.map(card => (
            <article
              key={card.id}
              className={`rounded-sm border p-3 ${statusClass[card.status]}`}
              data-testid={`v180-identity-pressure-${card.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-semibold">{card.title}</p>
                <span className="shrink-0 text-[10px] opacity-70">{projection.activePressureId === card.id ? '当前' : statusText(card.status)}</span>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed opacity-75">{card.summary}</p>
              <p className="mt-2 text-[10px] leading-relaxed opacity-65">{card.nextStep}</p>
            </article>
          ))}
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v180-identity-next-steps">
          <p className="text-xs font-semibold text-rg-paper-100">下一步候选</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {projection.nextStepCandidates.map(item => (
              <p key={item} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/25 px-2 py-1.5 text-[10px] leading-relaxed text-rg-paper-200/60">
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v180-identity-signals">
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

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v180-identity-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {projection.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/58">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v180-identity-source-refs">
          <p className="text-xs font-semibold text-rg-paper-100">来源</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {projection.visibleSourceRefs.slice(0, 18).map(ref => (
              <span key={ref} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
