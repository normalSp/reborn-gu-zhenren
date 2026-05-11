import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '../../store';
import { B3_MIDGAME_ANCHOR_IDS } from '../../engine/v080-midgame-anchor-engine';
import { getCanonAnchor } from '../../engine/v080-narrative-engine';

const FATE_LABEL: Record<string, string> = {
  intact: '宿命完整',
  fractured: '宿命裂痕',
  destroyed: '宿命破碎',
};

const STATUS_LABEL: Record<string, string> = {
  unseen: '未触发',
  active: '进行中',
  resolved: '已结算',
  missed: '已错过',
  blocked: '已拦截',
  locked: '未入场',
  available: '可入场',
};

function meterClass(value: number): string {
  if (value >= 70) return 'bg-rg-blood-500';
  if (value >= 35) return 'bg-rg-gold';
  return 'bg-rg-jade-400';
}

function AnchorMeter({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-panel text-rg-paper-200/65">
        <span>{label}</span>
        <span>{clamped}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-rg-ink-900/70">
        <div className={`h-full rounded-sm ${meterClass(clamped)}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function getAnchorTone(status: string | undefined): string {
  if (status === 'active' || status === 'available') return 'border-rg-jade-400/35 bg-rg-jade-600/10';
  if (status === 'blocked') return 'border-rg-blood-400/45 bg-rg-blood-600/10';
  if (status === 'resolved') return 'border-rg-gold/40 bg-rg-gold/10';
  return 'border-rg-ink-300/16 bg-rg-ink-800/55';
}

export function StoryAnchorPanel() {
  const reduceMotion = useReducedMotion();
  const storyAnchorState = useStore(s => (s as any).storyAnchorState);
  const gameMode = useStore(s => s.gameMode);
  const evaluateStoryAnchorEntryAction = useStore(s => (s as any).evaluateStoryAnchorEntryAction);
  const setCurrentStoryAnchor = useStore(s => (s as any).setCurrentStoryAnchor);

  const state = storyAnchorState || {};
  const heaven = state.heavenWillLedger || { attention: 0, correction: 0, rejection: 0, ambiguity: 20 };
  const karma = state.karmicDebtLedger || { totalDebt: 0, byKind: {}, pendingReturns: [] };
  const candidates = Array.isArray(state.storyEventCandidates) ? [...state.storyEventCandidates].reverse().slice(0, 8) : [];
  const ifVectors = Array.isArray(state.ifBranchVectors) ? [...state.ifBranchVectors].reverse().slice(0, 8) : [];
  const pressureLog = Array.isArray(state.canonAnchorPressureLog) ? [...state.canonAnchorPressureLog].reverse().slice(0, 8) : [];
  const steps = Array.isArray(state.lastResolutionSteps) ? state.lastResolutionSteps : [];

  return (
    <motion.div
      className="rg-scrollable h-full overflow-y-auto px-3 py-4 text-rg-paper-100 sm:px-4"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24 }}
      data-testid="story-anchor-panel"
    >
      <div className="mb-4 border-b border-rg-gold/25 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-panel tracking-[0.18em] text-rg-gold/80">v0.8.0-b3</p>
            <h2 className="font-title text-lg text-rg-gold">宿命锚点</h2>
          </div>
          <span
            className="rounded-sm border border-rg-gold/35 bg-rg-gold/10 px-2 py-1 text-xs font-panel text-rg-gold"
            data-testid="story-anchor-fate-state"
          >
            {FATE_LABEL[state.fateState || 'intact'] || state.fateState || '宿命完整'}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-rg-paper-200/62">
          当前模式：{gameMode === 'if' ? 'IF偏移' : '正史侧翼'}。DeepSeek 只能提交候选和压力；锚点、宿命、因果与结局由本地引擎结算。
        </p>
      </div>

      <section className="mb-4 grid grid-cols-2 gap-2">
        <AnchorMeter label="天意关注" value={heaven.attention} />
        <AnchorMeter label="天意修正" value={heaven.correction} />
        <AnchorMeter label="天意排斥" value={heaven.rejection} />
        <AnchorMeter label="模糊余地" value={heaven.ambiguity} />
      </section>

      <section className="mb-4" data-testid="story-anchor-midgame-list">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">中后期锚点</p>
        <div className="space-y-2">
          {B3_MIDGAME_ANCHOR_IDS.map(anchorId => {
            const anchor = getCanonAnchor(anchorId);
            const result = state.anchorResults?.[anchorId];
            const record = state.anchorRecords?.[anchorId];
            const status = result?.status || record?.status || 'unseen';
            const active = state.currentAnchorId === anchorId;
            return (
              <motion.button
                key={anchorId}
                type="button"
                onClick={() => {
                  evaluateStoryAnchorEntryAction?.(anchorId);
                  setCurrentStoryAnchor?.(anchorId);
                }}
                className={`rg-action-card rg-focus-ring w-full p-3 text-left ${getAnchorTone(status)} ${active ? 'ring-1 ring-rg-gold/60' : ''}`}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                data-testid={`story-anchor-card-${anchorId}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-title text-sm text-rg-paper-100">{anchor?.displayName || anchorId}</span>
                  <span className="text-[11px] font-panel text-rg-gold/80">{STATUS_LABEL[status] || status}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/58">
                  {anchor?.canonStatus === 'fixed' ? '正史固定：仅允许旁观、侧翼、救援、撤退和局部战果。' : '正史可局部变化；IF 偏移必须登记向量和代价。'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {anchor?.ifDeviationAxes?.slice(0, 4).map(axis => (
                    <span key={axis} className="rg-chip rg-chip--muted">
                      {axis}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="rg-explain-card p-3" data-testid="story-anchor-karma">
          <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">因果债</p>
          <p className="font-title text-xl text-rg-blood-300">{karma.totalDebt || 0}</p>
          <div className="mt-2 space-y-1">
            {Object.entries(karma.byKind || {}).slice(0, 4).map(([kind, value]) => (
              <div key={kind} className="flex justify-between gap-2 text-[11px] text-rg-paper-200/62">
                <span className="truncate">{kind}</span>
                <span>{String(value)}</span>
              </div>
            ))}
            {Object.keys(karma.byKind || {}).length === 0 && (
              <p className="text-[11px] text-rg-paper-200/38">暂无可追踪因果债。</p>
            )}
          </div>
        </div>
        <div className="rg-explain-card p-3" data-testid="story-anchor-if-vectors">
          <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">IF 向量</p>
          <div className="space-y-2">
            {ifVectors.slice(0, 4).map(vector => (
              <div key={vector.id} className="text-[11px] text-rg-paper-200/65">
                <div className="flex justify-between gap-2">
                  <span className="truncate text-rg-jade-300">{vector.axis}</span>
                  <span>{vector.delta > 0 ? '+' : ''}{vector.delta}</span>
                </div>
                <p className="truncate text-rg-paper-200/40">{vector.anchorId} · {vector.cost}</p>
              </div>
            ))}
            {ifVectors.length === 0 && <p className="text-[11px] text-rg-paper-200/38">暂无已验证 IF 偏移。</p>}
          </div>
        </div>
      </section>

      <section className="mb-4" data-testid="story-anchor-candidate-list">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">候选事件</p>
        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {candidates.map(candidate => (
              <motion.div
                key={candidate.id}
                className="rg-explain-card p-3"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-button text-rg-paper-100">{candidate.title}</span>
                  <span className={`text-[11px] font-panel ${candidate.engineValidation === 'blocked' ? 'text-rg-blood-300' : 'text-rg-jade-300'}`}>
                    {candidate.engineValidation}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/58">{candidate.summary}</p>
              </motion.div>
            ))}
            {candidates.length === 0 && <p className="text-[11px] text-rg-paper-200/38">暂无剧情候选。</p>}
          </div>
        </AnimatePresence>
      </section>

      <section className="mb-4" data-testid="story-anchor-pressure-log">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">拦截与压力</p>
        <div className="space-y-2">
          {pressureLog.map((item, index) => (
            <div key={`${item.anchorId}-${index}`} className="rg-explain-card border-rg-blood-400/25 bg-rg-blood-600/10 p-3">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-rg-blood-200">{item.anchorId}</span>
                <span className="text-rg-gold">{item.engineDecision}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/58">{item.attemptedMutation}</p>
            </div>
          ))}
          {pressureLog.length === 0 && <p className="text-[11px] text-rg-paper-200/38">暂无正史压力记录。</p>}
        </div>
      </section>

      <section data-testid="story-anchor-resolution-steps">
        <p className="mb-2 text-xs font-panel tracking-[0.12em] text-rg-paper-200/55">本地结算轨迹</p>
        <div className="rg-trace-list space-y-1.5">
          {steps.map(step => (
            <div key={step.id} className="flex gap-2 text-[11px] leading-relaxed text-rg-paper-200/62">
              <span className="shrink-0 text-rg-gold">{step.kind}</span>
              <span>{step.message}</span>
            </div>
          ))}
          {steps.length === 0 && <p className="text-[11px] text-rg-paper-200/38">等待本地引擎产生轨迹。</p>}
        </div>
      </section>
    </motion.div>
  );
}
