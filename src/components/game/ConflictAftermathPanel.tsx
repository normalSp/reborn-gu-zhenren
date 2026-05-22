import { useMemo } from 'react';
import { useStore } from '../../store';
import {
  buildV150ConflictAftermathProjection,
  type V150ConflictPostureId,
  type V150ConflictPostureStatus,
} from '../../engine/v150-conflict-aftermath-projection';

const postureLabel: Record<V150ConflictPostureId, string> = {
  route_ambush_risk: '伏击',
  pursuit_attention_window: '追踪',
  countermeasure_gap: '反制',
  squad_formation_readiness: '小队',
};

const postureClass: Record<V150ConflictPostureStatus, string> = {
  visible: 'border-rg-blood-400/32 bg-rg-blood-500/10 text-rg-paper-100',
  needs_context: 'border-rg-ink-300/15 bg-rg-ink-700/25 text-rg-paper-100',
};

function statusText(status: V150ConflictPostureStatus): string {
  return status === 'visible' ? '可读' : '待证据';
}

export function ConflictAftermathPanel() {
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

  const projection = useMemo(() => buildV150ConflictAftermathProjection({
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
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="v150-conflict-aftermath-panel">
      <div className="space-y-3">
        <div className="rounded-sm border border-rg-blood-400/30 bg-rg-blood-500/10 p-3" data-testid="v150-conflict-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-rg-blood-100">冲突后果解释层</p>
            <span className="text-[10px] text-rg-paper-200/55">{projection.statusLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/78">{projection.publicSummary}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">{projection.nextStep}</p>
        </div>

        <div className="rounded-sm border border-rg-jade-400/22 bg-rg-jade-500/10 p-3" data-testid="v150-conflict-audit">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rg-jade-100">投影审计</p>
            <span className="text-[10px] text-rg-paper-200/55">
              {projection.projectionAudit.saveFormatPolicy} · {projection.projectionAudit.persistentWritePolicy}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/58">
            projection-first · 当前 SAVE_FORMAT_VERSION = 25 · 不返回 conflictConsequenceState / pursuitState / combatAftermathState patch · DeepSeek 无新增权限
          </p>
        </div>

        <div className="grid gap-2 lg:grid-cols-2" data-testid="v150-conflict-posture-list">
          {projection.postureCards.map(card => (
            <article
              key={card.id}
              className={`rounded-sm border p-3 ${postureClass[card.status]}`}
              data-testid={`v150-conflict-posture-${card.id}`}
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
                不写奖励 · 不定生死 · 不写追杀结论 · 不扩 DeepSeek 权限
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

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v150-conflict-next-steps">
          <p className="text-xs font-semibold text-rg-paper-100">下一步候选</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {projection.nextStepCandidates.map(item => (
              <p key={item} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/25 px-2 py-1.5 text-[10px] leading-relaxed text-rg-paper-200/60">
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v150-conflict-signals">
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

        <div className="grid gap-2 lg:grid-cols-2">
          <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v150-conflict-counter-hints">
            <p className="text-xs font-semibold text-rg-paper-100">反制提示</p>
            <div className="mt-2 grid gap-1.5">
              {projection.counterHints.slice(0, 5).map(hint => (
                <p key={hint} className="text-[10px] leading-relaxed text-rg-paper-200/58">{hint}</p>
              ))}
            </div>
          </div>
          <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v150-conflict-squad-hints">
            <p className="text-xs font-semibold text-rg-paper-100">小队/阵法提示</p>
            <div className="mt-2 grid gap-1.5">
              {projection.squadHints.slice(0, 4).map(hint => (
                <p key={hint} className="text-[10px] leading-relaxed text-rg-paper-200/58">{hint}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v150-conflict-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {projection.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/58">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v150-conflict-source-refs">
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
