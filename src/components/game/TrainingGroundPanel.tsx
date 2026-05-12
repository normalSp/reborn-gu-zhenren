import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '../../store';
import {
  listTrainingGroundEntries,
  listTrainingGroundSpecs,
  type TrainingGroundEntryView,
} from '../../engine/v090-training-ground-clue-engine';

const TYPE_LABELS: Record<string, string> = {
  '磨练': '磨练',
  '对决': '对决',
  '试炼': '试炼',
  hunt: '狩猎',
};

const TYPE_TONE: Record<string, string> = {
  '磨练': 'text-rg-jade-300 border-rg-jade-400/25 bg-rg-jade-500/10',
  '对决': 'text-rg-gold border-rg-gold/25 bg-rg-gold/10',
  '试炼': 'text-purple-300 border-purple-400/25 bg-purple-500/10',
  hunt: 'text-rg-blood-300 border-rg-blood-400/25 bg-rg-blood-500/10',
};

const STATUS_LABELS: Record<TrainingGroundEntryView['status'], string> = {
  available: '可出发',
  missing_clue: '缺少剧情线索',
  location_mismatch: '地点不匹配',
  realm_blocked: '境界不足',
  cooldown: '冷却中',
  beast_library_pending: '待荒兽敌库',
  blocked: '不可用',
};

const STATUS_TONE: Record<TrainingGroundEntryView['status'], string> = {
  available: 'rg-chip rg-chip--gold',
  missing_clue: 'rg-chip rg-chip--muted',
  location_mismatch: 'rg-chip rg-chip--muted',
  realm_blocked: 'rg-chip rg-chip--blood',
  cooldown: 'rg-chip rg-chip--muted',
  beast_library_pending: 'rg-chip rg-chip--blood',
  blocked: 'rg-chip rg-chip--blood',
};

function getApRemaining(store: any): number {
  const budget = store.sceneSessionState?.actionBudget;
  if (Number.isFinite(budget?.remaining)) return Number(budget.remaining);
  return Number(store.gameTime?.ap ?? 0);
}

function currencyText(store: any, immortalOnly: boolean): string {
  return immortalOnly ? `${Number(store.immortalCurrency || 0)} 仙元石` : `${Number(store.currency || 0)} 元石`;
}

function actionLabel(entry: TrainingGroundEntryView): string {
  if (entry.actionKind === 'duel') return '出发对决';
  if (entry.actionKind === 'trial') return '进入试炼';
  if (entry.actionKind === 'hunt') return '等待 a3';
  return '出发磨练';
}

function ClueCard({
  entry,
  onDepart,
  busy,
}: {
  entry: TrainingGroundEntryView;
  onDepart: (entry: TrainingGroundEntryView) => void;
  busy: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const tone = TYPE_TONE[entry.ground.type] || 'text-rg-paper-200/60 border-rg-ink-300/20 bg-rg-ink-700/30';
  const clue = entry.clue;
  const blockers = entry.blockers.slice(0, 3);
  const warnings = entry.warnings.slice(0, 2);
  return (
    <motion.article
      className="rg-panel-card space-y-3 p-3"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      data-testid="training-ground-clue-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-rg-paper-100">{clue?.title || entry.ground.name}</h4>
            <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${tone}`}>
              {TYPE_LABELS[entry.ground.type] || entry.ground.type}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/55">
            {clue?.summary || entry.ground.description}
          </p>
        </div>
        <span className={STATUS_TONE[entry.status]}>{STATUS_LABELS[entry.status]}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-rg-paper-200/55 sm:grid-cols-4">
        <span>地点：{clue?.locationHint || entry.ground.domain || '待剧情定位'}</span>
        <span>流派：{entry.ground.pathType || '未定'}</span>
        <span>AP：{entry.apCost}</span>
        <span>路线：{entry.routeHint || '本地校验'}</span>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1 rounded-sm border border-rg-gold/15 bg-rg-gold/5 px-2 py-2">
          {warnings.map((warning, index) => (
            <p key={`warning-${index}`} className="text-[10px] leading-relaxed text-rg-gold/70">{warning}</p>
          ))}
        </div>
      )}

      {blockers.length > 0 && (
        <div className="space-y-1 rounded-sm border border-rg-blood-400/15 bg-rg-blood-500/5 px-2 py-2">
          {blockers.map((blocker, index) => (
            <p key={`blocker-${index}`} className="text-[10px] leading-relaxed text-rg-blood-200/75">{blocker}</p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rg-ink-300/10 pt-3">
        <p className="text-[10px] text-rg-paper-200/40">
          来源：{clue?.source || 'system'} · 冷却 {entry.ground.cooldownTurns || 0} 回合
        </p>
        <button
          className={`rg-button rg-button--primary px-3 py-1.5 text-[11px] ${!entry.canEnter || busy ? 'cursor-not-allowed opacity-45' : ''}`}
          disabled={!entry.canEnter || busy}
          onClick={() => onDepart(entry)}
          data-testid="training-ground-departure-action"
        >
          {actionLabel(entry)}
        </button>
      </div>
    </motion.article>
  );
}

export function TrainingGroundPanel() {
  const store = useStore();
  const state = useStore(s => (s as any).trainingGroundState);
  const [message, setMessage] = useState('');
  const isPipelineBusy = useStore(s => {
    const phase = (s as any).pipelinePhase;
    return Boolean(phase && phase !== 'IDLE' && phase !== 'RESOLVED' && phase !== 'ERROR');
  });

  const entries = useMemo(() => listTrainingGroundEntries(state, store), [state, store]);
  const lastSteps = state?.lastResolutionSteps || [];
  const blockedRecords = state?.blockedRecords || [];
  const specs = useMemo(() => listTrainingGroundSpecs(), []);
  const debugSpecs = specs.filter(spec => spec.type !== 'hunt').slice(0, 3);

  const handleDepart = (entry: TrainingGroundEntryView) => {
    const result = (useStore.getState() as any).startTrainingGroundDepartureAction(entry.ground.id);
    setMessage(result.message);
  };

  const handleDebugClue = (groundId: string) => {
    const spec = specs.find(item => item.id === groundId);
    if (!spec) return;
    const validation = (useStore.getState() as any).recordTrainingGroundCandidateAction({
      groundId,
      title: `${spec.name}调试线索`,
      summary: `Debug/兼容入口：模拟剧情给出的${spec.name}线索，不代表正式刷池。`,
      source: 'engine',
      locationHint: spec.domain,
      apCostHint: spec.type === '试炼' ? 2 : 1,
      risk: spec.tier >= 4 ? 'high' : 'medium',
      sceneTags: ['debug_training_ground_clue'],
    });
    setMessage(validation?.valid ? '已生成调试线索。' : validation?.blockers?.join('；') || '调试线索被拦截。');
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-rg-ink-900/95 font-panel text-rg-paper-200" data-testid="training-ground-panel">
      <header className="border-b border-rg-ink-700/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-rg-gold">道场线索账本</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-rg-paper-200/50" data-testid="training-ground-clue-policy">
              v0.9.0-a2：正式道场不再靠刷新刷池，只能由剧情、地点、势力、传承或福地资源点给出线索。出发、消耗、奖励与战斗路由都由本地引擎校验，并写入场景 AP 账本。
            </p>
          </div>
          <div className="rounded-sm border border-rg-gold/15 bg-rg-gold/5 px-3 py-2 text-right text-[10px] text-rg-paper-200/55">
            <p>场景 AP：{getApRemaining(store)}</p>
            <p>余额：{currencyText(store, Number(store.profile?.realm?.grand || 1) >= 6)}</p>
          </div>
        </div>
        {message && (
          <p className="mt-3 rounded-sm border border-rg-gold/20 bg-rg-gold/10 px-3 py-2 text-[11px] text-rg-gold">
            {message}
          </p>
        )}
      </header>

      <main className="flex-1 space-y-3 p-3">
        {entries.length === 0 ? (
          <section className="rg-panel-card p-4" data-testid="training-ground-empty-policy">
            <p className="text-sm font-semibold text-rg-gold">当前没有可出发道场线索</p>
            <p className="mt-2 text-[11px] leading-relaxed text-rg-paper-200/55">
              这不是刷新坏掉，而是当前剧情尚未给出可追踪的道场入口。推进剧情、侦察地点、向势力求证、追查传承，或经营福地资源点后，线索会进入这里。
            </p>
            <div className="mt-3 grid gap-2 text-[10px] text-rg-paper-200/45 sm:grid-cols-2">
              <p>· 磨练：消耗场景 AP，结算道痕、冷却和代价。</p>
              <p>· 对决：生成正式战斗候选，走统一战斗路由。</p>
              <p>· 试炼：写入行动账本，由下一轮剧情承接。</p>
              <p>· 狩猎：等待 a3 荒兽/兽群敌库，不结算掉落。</p>
            </div>
            {blockedRecords.length > 0 && (
              <div className="mt-3 border-t border-rg-ink-300/10 pt-3">
                {blockedRecords.slice(-3).map((step: any) => (
                  <p key={step.id} className="text-[10px] leading-relaxed text-rg-blood-200/70">{step.message}</p>
                ))}
              </div>
            )}
          </section>
        ) : entries.map(entry => (
          <ClueCard key={entry.ground.id} entry={entry} busy={isPipelineBusy} onDepart={handleDepart} />
        ))}

        <details className="rg-panel-card p-3" data-testid="training-ground-debug-legacy">
          <summary className="cursor-pointer text-[11px] font-semibold text-rg-paper-200/55">
            Debug/兼容入口（不进入正式剧情闭环）
          </summary>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/40">
            旧刷新/旧训练入口已降级。这里仅用于测试和兼容，不代表玩家可以绕过剧情线索反复刷道场。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {debugSpecs.map(spec => (
              <button
                key={spec.id}
                className="rg-button rg-button--ghost px-2 py-1 text-[10px]"
                onClick={() => handleDebugClue(spec.id)}
              >
                生成 {spec.name}
              </button>
            ))}
          </div>
        </details>
      </main>

      {lastSteps.length > 0 && (
        <footer className="border-t border-rg-ink-300/12 p-3">
          <p className="mb-2 text-[10px] tracking-[0.12em] text-rg-paper-200/45">本地结算轨迹</p>
          <div className="space-y-1">
            {lastSteps.slice(-6).map((step: any) => (
              <p key={step.id} className="text-[10px] leading-relaxed text-rg-paper-200/55">
                <span className="text-rg-gold">{step.kind}</span> · {step.message}
              </p>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
