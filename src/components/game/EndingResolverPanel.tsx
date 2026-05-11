import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useStore } from '../../store';

const PROVENANCE_LABEL: Record<string, string> = {
  'canon-near': '原著近线',
  'if-derived': 'IF推演',
  'original-if': '原创IF',
};

const STATUS_LABEL: Record<string, string> = {
  idle: '待解析',
  ready: '可结算',
  committed: '已结算',
  blocked: '有阻断',
};

function riskClass(risk: string): string {
  if (risk === 'high') return 'border-rg-blood-400/45 bg-rg-blood-600/10 text-rg-blood-200';
  if (risk === 'medium') return 'border-rg-gold/35 bg-rg-gold/10 text-rg-gold';
  return 'border-rg-jade-400/35 bg-rg-jade-600/10 text-rg-jade-200';
}

function Meter({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  const tone = clamped >= 70 ? 'bg-rg-jade-400' : clamped >= 45 ? 'bg-rg-gold' : 'bg-rg-blood-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-panel text-rg-paper-200/62">
        <span>{label}</span>
        <span>{clamped}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-rg-ink-900/70">
        <div className={`h-full rounded-sm ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function EndingResolverPanel() {
  const reduceMotion = useReducedMotion();
  const endingState = useStore(s => (s as any).endingState);
  const refreshEndingCandidatesAction = useStore(s => (s as any).refreshEndingCandidatesAction);
  const commitEndingCandidateAction = useStore(s => (s as any).commitEndingCandidateAction);

  const state = endingState || {};
  const input = state.lastInput;
  const candidates = Array.isArray(state.candidates) ? state.candidates : [];
  const pressureLog = Array.isArray(state.pressureLog) ? [...state.pressureLog].reverse().slice(0, 6) : [];
  const steps = Array.isArray(state.lastResolutionSteps) ? state.lastResolutionSteps : [];
  const evidence = input?.evidence;

  useEffect(() => {
    if (!state?.candidates?.length) refreshEndingCandidatesAction?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="rg-scrollable h-full overflow-y-auto px-3 py-4 text-rg-paper-100 sm:px-4"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24 }}
      data-testid="ending-panel"
    >
      <div className="mb-4 border-b border-rg-gold/25 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-panel tracking-[0.18em] text-rg-gold/80">v0.8.0-c1</p>
            <h2 className="font-title text-lg text-rg-gold">终局解析</h2>
          </div>
          <span
            className="rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-2 py-1 text-xs font-panel text-rg-gold"
            data-testid="ending-state-status"
          >
            {STATUS_LABEL[state.status || 'idle'] || state.status || '待解析'}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/62">
          终局由本地引擎结算。DeepSeek 只能提供候选、压力与传闻；宿命、尊者、结局与永生禁区不能被文本直接写入。
        </p>
        <button
          type="button"
          onClick={() => refreshEndingCandidatesAction?.()}
          className="rg-toolbar-btn rg-focus-ring mt-3 px-3 py-1.5 text-xs"
          data-testid="refresh-ending-candidates"
        >
          重算终局候选
        </button>
      </div>

      {evidence && (
        <section className="mb-4 grid gap-2 sm:grid-cols-2" data-testid="ending-evidence">
          <div className="rg-explain-card p-3">
            <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">长期证据</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-rg-paper-200/62">
              <span>战斗 {evidence.battle.totalBattles}</span>
              <span>胜利 {evidence.battle.combatWins}</span>
              <span>群战伤亡 {evidence.battle.squadDeaths}</span>
              <span>灾劫 {evidence.cultivation.calamityCount}</span>
              <span>锚点 {evidence.anchors.resolvedCount + evidence.anchors.activeCount}</span>
              <span>势力 {evidence.faction.score}</span>
            </div>
          </div>
          <div className="rg-explain-card p-3">
            <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">宿命压力</p>
            <Meter label="天意关注" value={input?.heavenWillLedger?.attention || 0} />
            <Meter label="因果债" value={input?.karmicDebtLedger?.totalDebt || 0} />
          </div>
        </section>
      )}

      <section className="mb-4" data-testid="ending-candidate-list">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">结局候选</p>
        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {candidates.map((candidate: any) => (
              <motion.div
                key={candidate.id}
                className={`rg-explain-card p-3 ${candidate.canCommit ? 'border-rg-jade-400/35 bg-rg-jade-600/10' : ''}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                data-testid={`ending-candidate-${candidate.familyId}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-title text-sm text-rg-paper-100">{candidate.displayName}</h3>
                    <p className="mt-0.5 text-[11px] text-rg-paper-200/45">
                      {PROVENANCE_LABEL[candidate.provenance] || candidate.provenance} · 稳定度 {candidate.readiness}
                    </p>
                  </div>
                  <span className={`rounded-sm border px-2 py-1 text-[11px] font-panel ${riskClass(candidate.risk)}`}>
                    {candidate.risk}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-rg-paper-200/62">{candidate.summary}</p>
                <div className="mt-2 space-y-1">
                  {(candidate.reasons || []).slice(0, 2).map((reason: string) => (
                    <p key={reason} className="text-[11px] text-rg-paper-200/48">· {reason}</p>
                  ))}
                  {(candidate.blockers || []).slice(0, 2).map((reason: string) => (
                    <p key={reason} className="text-[11px] text-rg-blood-200/80">· {reason}</p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => commitEndingCandidateAction?.(candidate.id)}
                  disabled={!candidate.canCommit || state.status === 'committed'}
                  className={`mt-3 rounded-sm px-3 py-1.5 text-xs font-button transition-micro ${
                    candidate.canCommit && state.status !== 'committed'
                      ? 'border border-rg-gold/45 bg-rg-gold/12 text-rg-gold hover:bg-rg-gold/20'
                      : 'border border-rg-ink-300/16 text-rg-paper-200/32'
                  }`}
                  data-testid={`ending-commit-button-${candidate.familyId}`}
                  title={candidate.canCommit ? '由本地终局引擎正式结算' : (candidate.blockers || ['终局门槛不足']).join('；')}
                >
                  结算终局
                </button>
              </motion.div>
            ))}
            {candidates.length === 0 && <p className="text-[11px] text-rg-paper-200/38">暂无终局候选，先重算一次。</p>}
          </div>
        </AnimatePresence>
      </section>

      <section className="mb-4" data-testid="ending-pressure-log">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">禁区与压力</p>
        <div className="space-y-2">
          {pressureLog.map((item: any) => (
            <div key={item.id} className="rg-explain-card border-rg-blood-400/25 bg-rg-blood-600/10 p-3">
              <div className="flex justify-between gap-2 text-[11px]">
                <span className="truncate text-rg-blood-200">{item.engineDecision}</span>
                <span className="text-rg-gold">{item.severity}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/58">{item.attemptedOutcome}</p>
            </div>
          ))}
          {pressureLog.length === 0 && <p className="text-[11px] text-rg-paper-200/38">暂无终局禁区记录。</p>}
        </div>
      </section>

      <section data-testid="ending-resolution-steps">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">本地结算轨迹</p>
        <div className="rg-trace-list space-y-1.5">
          {steps.map((step: any) => (
            <div key={step.id} className="flex gap-2 text-[11px] leading-relaxed text-rg-paper-200/62">
              <span className="shrink-0 text-rg-gold">{step.kind}</span>
              <span>{step.message}</span>
            </div>
          ))}
          {steps.length === 0 && <p className="text-[11px] text-rg-paper-200/38">等待终局引擎产生轨迹。</p>}
        </div>
      </section>
    </motion.div>
  );
}
