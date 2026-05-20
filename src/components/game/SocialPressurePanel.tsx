import { useMemo } from 'react';
import { useStore } from '../../store';
import {
  buildV130SocialPressureProjection,
  type V130SocialSignalKind,
  type V130SocialSignalSeverity,
} from '../../engine/v130-social-pressure-projection';

const kindLabel: Record<V130SocialSignalKind, string> = {
  faction_pressure: '势力',
  npc_memory: '记忆',
  public_event: '事件',
  social_followup: '后续',
};

const severityClass: Record<V130SocialSignalSeverity, string> = {
  low: 'border-rg-jade-400/30 bg-rg-jade-500/10 text-rg-jade-100',
  medium: 'border-rg-gold-400/30 bg-rg-gold-500/10 text-rg-gold-100',
  high: 'border-rg-blood-400/35 bg-rg-blood-500/12 text-rg-blood-100',
  blocked: 'border-rg-ink-300/20 bg-rg-ink-700/35 text-rg-paper-100',
};

function severityLabel(severity: V130SocialSignalSeverity): string {
  if (severity === 'low') return '低';
  if (severity === 'medium') return '中';
  if (severity === 'high') return '高';
  return '阻断';
}

export function SocialPressurePanel() {
  const livingWorldState = useStore((s: any) => s.livingWorldState);
  const localActionLedger = useStore((s: any) => s.sceneSessionState?.localActionLedger || []);

  const projection = useMemo(() => buildV130SocialPressureProjection({
    livingWorldState,
    localActionLedger,
  }), [livingWorldState, localActionLedger]);

  const countCards = [
    ['势力压力', projection.moduleCounts.factionPressure],
    ['记忆痕迹', projection.moduleCounts.npcMemory],
    ['公开事件', projection.moduleCounts.publicEvent],
    ['后续候选', projection.moduleCounts.socialFollowup],
  ] as const;

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="v130-social-pressure-panel">
      <div className="space-y-3">
        <div className="rounded-sm border border-rg-gold-400/30 bg-rg-gold-500/10 p-3" data-testid="v130-social-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-rg-gold-100">社会压力</p>
            <span className="text-[10px] text-rg-paper-200/55">{projection.statusLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/78">{projection.publicSummary}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">{projection.nextStep}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-rg-paper-200/55 sm:grid-cols-4" data-testid="v130-social-counts">
          {countCards.map(([label, value]) => (
            <div key={label} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-2">
              <p className="text-rg-paper-200/38">{label}</p>
              <p className="mt-1 text-sm font-semibold text-rg-paper-100/78">{value}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-sm border border-rg-jade-400/22 bg-rg-jade-500/10 p-3"
          data-testid="v130-social-projection-audit"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rg-jade-100">投影审计</p>
            <span className="text-[10px] text-rg-paper-200/55">
              {projection.projectionAudit.saveFormatPolicy} · {projection.projectionAudit.persistentWritePolicy}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/58">
            旧字段不作为权威；当前只返回可重算投影和审计，不返回可写 ledger patch。
          </p>
        </div>

        {projection.promptSafePublicSummary && (
          <div
            className="rounded-sm border border-rg-jade-400/20 bg-rg-jade-500/10 p-3"
            data-testid="v130-social-prompt-safe-summary"
          >
            <p className="text-xs font-semibold text-rg-jade-100">公开摘要</p>
            <p className="mt-2 text-[11px] leading-relaxed text-rg-paper-200/68">{projection.promptSafePublicSummary}</p>
          </div>
        )}

        {projection.npcContactWindows.length > 0 && (
          <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v130-npc-contact-windows">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-rg-paper-100">NPC 接触窗口</p>
              <span className="text-[10px] text-rg-paper-200/55">candidate only · no relationship score</span>
            </div>
            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              {projection.npcContactWindows.slice(0, 4).map(window => (
                <article key={window.id} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/28 p-3" data-testid="v130-npc-contact-window">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-rg-paper-100">{window.subjectLabel}</p>
                      <p className="mt-1 text-[10px] text-rg-paper-200/42">{window.contactMode} · 接触前置</p>
                    </div>
                    <span className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] ${severityClass[window.riskLevel]}`}>
                      {severityLabel(window.riskLevel)}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/62">{window.publicReason}</p>
                  <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/50">{window.prerequisite}</p>
                  <p className="mt-2 text-[9px] leading-relaxed text-rg-paper-200/38">
                    不写好感度 · 不创建正式命名 NPC 规则 · 不写 NPC 生死
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}

        {projection.factionPreconditions.length > 0 && (
          <div className="rounded-sm border border-rg-blood-400/20 bg-rg-blood-500/10 p-3" data-testid="v130-faction-preconditions">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-rg-blood-100">势力前置条件</p>
              <span className="text-[10px] text-rg-paper-200/55">risk only · no formal result</span>
            </div>
            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              {projection.factionPreconditions.slice(0, 4).map(item => (
                <article key={item.id} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-900/28 p-3" data-testid="v130-faction-precondition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-rg-paper-100">{item.factionLabel}</p>
                      <p className="mt-1 text-[10px] text-rg-paper-200/42">{item.kind} · {item.blockedConclusion}</p>
                    </div>
                    <span className={`shrink-0 rounded-sm border px-2 py-1 text-[10px] ${severityClass[item.severity]}`}>
                      {severityLabel(item.severity)}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/62">{item.publicReason}</p>
                  <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/50">{item.precondition}</p>
                  <p className="mt-2 text-[9px] leading-relaxed text-rg-paper-200/38">
                    不写通缉 · 不写招揽/转阵营 · 不写封锁结果 · 不发奖励
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-2 lg:grid-cols-2" data-testid="v130-social-signal-list">
          {projection.signals.length > 0 ? (
            projection.signals.map(signal => (
              <article
                key={signal.id}
                className={`rounded-sm border p-3 ${severityClass[signal.severity]}`}
                data-testid={`v130-social-signal-${signal.kind}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{signal.subjectLabel}</p>
                    <p className="mt-1 text-[10px] opacity-65">
                      {kindLabel[signal.kind]} · {signal.title} · {signal.statusLabel}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] opacity-70">{severityLabel(signal.severity)}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed opacity-80">{signal.summary}</p>
                <p className="mt-2 text-[10px] leading-relaxed opacity-70">{signal.nextStep}</p>
                {signal.visibleSourceRefs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {signal.visibleSourceRefs.slice(0, 4).map(ref => (
                      <span key={ref} className="rounded-sm border border-rg-ink-100/10 px-1.5 py-0.5 text-[9px] opacity-65">{ref}</span>
                    ))}
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3 text-xs leading-relaxed text-rg-paper-200/55">
              还没有可公开归因的社会证据。完成调查、路线准备、递话、补给或遮掩等本地行动后，这里才会投影社会压力。
            </div>
          )}
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v130-social-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {projection.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/58">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v130-social-source-refs">
          <p className="text-xs font-semibold text-rg-paper-100">来源</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {projection.visibleSourceRefs.slice(0, 12).map(ref => (
              <span key={ref} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
