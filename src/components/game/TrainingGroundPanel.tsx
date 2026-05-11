import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import trainingData from '../../canon/training-grounds.json';
import {
  createDefaultTrainingGroundRuntime,
  pickTrainingGrounds,
  resolveTrainingGroundRefresh,
  resolveTrainingGroundSession,
  type TrainingGroundRuntime,
  type TrainingGroundSpec,
} from '../../engine/training-ground-engine';

const GROUNDS = (trainingData as any).grounds as TrainingGroundSpec[];
const TYPE_LABELS: Record<string, string> = { '磨练': '磨练', '对决': '对决', '试炼': '试炼', hunt: '猎场' };
const TYPE_COLORS: Record<string, string> = { '磨练': 'text-rg-jade-400', '对决': 'text-amber-400', '试炼': 'text-purple-400', hunt: 'text-rg-gold' };
const EMPTY_SECONDARY_PATHS = Object.freeze([]) as string[];
const EMPTY_TRAINING_COOLDOWNS = Object.freeze({}) as Record<string, number>;

export function TrainingGroundPanel() {
  const realm = useStore(s => s.profile?.realm?.grand || 1);
  const isImmortal = realm >= 6;
  const currentChapterId = useStore(s => (s as any).currentChapterId || '');
  const primaryPath = useStore(s => s.pathBuild?.primary || (s as any).primaryPath || '');
  const secondaryPaths = useStore(s => s.pathBuild?.secondary ?? (s as any).secondaryPaths ?? EMPTY_SECONDARY_PATHS);
  const cooldowns = useStore(s => (s as any).flags?.trainingCooldowns ?? EMPTY_TRAINING_COOLDOWNS) as Record<string, number>;
  const turn = useStore(s => s.turn || 1);
  const aptitude = useStore(s => s.attributes?.资质 || 5);
  const currency = useStore(s => s.currency || 0);
  const immortalCurrency = useStore(s => (s as any).immortalCurrency || 0);
  const isInCriticalPlot = useStore(s => !!(s as any).battleState || !!(s as any).flags?._ascension_in_progress);
  const isPipelineBusy = useStore(s => {
    const phase = (s as any).pipelinePhase;
    return !!phase && phase !== 'IDLE' && phase !== 'RESOLVED' && phase !== 'ERROR';
  });

  const [runtime, setRuntime] = useState<TrainingGroundRuntime>(() => createDefaultTrainingGroundRuntime(isImmortal, turn));
  const [resultMsg, setResultMsg] = useState('');
  const [lastSteps, setLastSteps] = useState<Array<{ kind: string; message: string }>>([]);

  const context = useMemo(() => ({
    realmGrand: realm,
    isImmortal,
    currentChapterId,
    primaryPath,
    secondaryPaths,
    cooldowns,
    turn,
    aptitude,
    currency,
    immortalCurrency,
  }), [realm, isImmortal, currentChapterId, primaryPath, secondaryPaths, cooldowns, turn, aptitude, currency, immortalCurrency]);

  const picked = useMemo(() => pickTrainingGrounds(GROUNDS, context, runtime), [context, runtime]);

  const commitCurrencyPatch = (patch: { currency?: number; immortalCurrency?: number }) => {
    if (patch.currency !== undefined || patch.immortalCurrency !== undefined) {
      useStore.setState(s => ({
        ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
        ...(patch.immortalCurrency !== undefined ? { immortalCurrency: patch.immortalCurrency } : {}),
      } as any));
    }
  };

  const handleRefresh = () => {
    if (isPipelineBusy) return;
    const resolution = resolveTrainingGroundRefresh(context, runtime);
    setResultMsg(resolution.message);
    setLastSteps([{ kind: resolution.success ? 'refresh' : 'failure', message: resolution.message }]);
    if (!resolution.success) return;
    commitCurrencyPatch(resolution.currencyPatch);
    setRuntime(resolution.nextRuntime);
  };

  const handleTrain = (ground: TrainingGroundSpec) => {
    if (isPipelineBusy) return;
    const store = useStore.getState() as any;
    const resolution = resolveTrainingGroundSession(context, ground, `training:${turn}:${runtime.poolSeed}:${ground.id}`);
    commitCurrencyPatch(resolution.currencyPatch);
    if (resolution.success && resolution.pathType && resolution.daoMarkGain > 0 && typeof store.addDaoMarks === 'function') {
      store.addDaoMarks(resolution.pathType, resolution.daoMarkGain);
    }
    if (resolution.cooldownUntil) {
      useStore.setState(s => ({
        flags: {
          ...(s as any).flags,
          trainingCooldowns: resolution.nextCooldowns,
        },
      } as any));
    }
    setResultMsg(resolution.message);
    setLastSteps(resolution.steps.map(step => ({ kind: step.kind, message: step.message })));
    setTimeout(() => setResultMsg(''), 3000);
  };

  if (isInCriticalPlot) {
    return (
      <div className="flex h-full items-center justify-center bg-rg-ink-900/95 p-6">
        <p className="font-panel text-xs text-rg-paper-200/35">当前剧情关键节点，无法进入道场修炼。</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-rg-ink-900/95 font-panel text-rg-paper-200">
      <div className="border-b border-rg-ink-700/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-rg-gold">道场</h3>
            <p className="mt-1 text-[10px] text-rg-paper-200/40">
              本地引擎结算：扣费、失败、冷却、道痕产出均由规则输出。
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isPipelineBusy}
            className={`rounded-sm border border-rg-gold/20 px-2 py-1 text-[10px] font-button text-rg-gold/70 hover:text-rg-gold ${isPipelineBusy ? 'cursor-not-allowed opacity-45' : ''}`}
          >
            刷新 ({runtime.refreshCost}{isImmortal ? '仙元石' : '元石'})
          </button>
        </div>
        <p className="mt-2 text-[10px] text-rg-paper-200/35">
          流派偏向：主修x2，辅修x1.5。当前余额：{isImmortal ? `${immortalCurrency}仙元石` : `${currency}元石`}。
        </p>
      </div>

      {resultMsg && <div className="border-b border-rg-gold/20 bg-rg-gold/10 px-4 py-2 text-center text-[10px] text-rg-gold">{resultMsg}</div>}

      <div className="flex-1 space-y-3 p-3">
        {picked.length === 0 ? (
          <p className="py-8 text-center text-xs italic text-rg-paper-200/25">当前无可用道场，可能是章节未解锁、境界不足或仍在冷却。</p>
        ) : picked.map(ground => (
          <div key={ground.id} className="rounded-md border border-rg-ink-300/12 bg-rg-ink-800/50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold">{ground.name}</span>
              <span className={`text-[9px] ${TYPE_COLORS[ground.type] || 'text-rg-paper-200/45'}`}>{TYPE_LABELS[ground.type] || ground.type}</span>
            </div>
            <p className="mb-2 text-[10px] leading-relaxed text-rg-paper-200/45">{ground.description}</p>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-rg-paper-200/35">{ground.pathType} · Lv{ground.tier} · 产出{ground.baseYield}道痕</span>
              <span className="text-rg-paper-200/25">{ground.cooldownTurns}回冷却</span>
            </div>
            <button
              onClick={() => handleTrain(ground)}
              disabled={isPipelineBusy}
              className={`mt-2 w-full rounded-sm py-1.5 text-[10px] font-button transition-colors ${ground.immortalOnly ? 'border border-rg-gold/30 bg-rg-gold/10 text-rg-gold hover:bg-rg-gold/20' : 'border border-rg-ink-300/15 bg-rg-ink-700/50 text-rg-paper-200/65 hover:border-rg-gold/25'} ${isPipelineBusy ? 'cursor-not-allowed opacity-45' : ''}`}
            >
              {ground.type === 'hunt' ? '开始狩猎' : '修炼'} ({isImmortal ? `${ground.costImmortalCurrency}仙元石` : `${ground.costCurrency}元石`})
            </button>
          </div>
        ))}
      </div>

      {lastSteps.length > 0 && (
        <div className="border-t border-rg-ink-300/12 p-3">
          <p className="mb-2 text-[10px] tracking-[0.12em] text-rg-paper-200/45">本地结算轨迹</p>
          <div className="space-y-1">
            {lastSteps.map((step, index) => (
              <p key={`${step.kind}-${index}`} className="text-[10px] leading-relaxed text-rg-paper-200/55">
                <span className="text-rg-gold">{step.kind}</span> · {step.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
