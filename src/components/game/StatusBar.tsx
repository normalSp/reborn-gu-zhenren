import { useStore } from '../../store';

const PERIOD_LABELS: Record<string, string> = { morning: '清晨', noon: '日中', evening: '黄昏', night: '深夜' };
const SEASON_LABELS: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

export function StatusBar() {
  const profile = useStore(s => s.profile);
  const vitals = useStore(s => s.vitals);
  const essence = useStore(s => s.vitals.essence);
  const attributes = useStore(s => s.attributes);
  const currency = useStore(s => s.currency);
  const phase = useStore(s => s.pipelinePhase);
  const gameTime = useStore(s => s.gameTime);
  const turn = useStore(s => s.turn);
  const daoHeart = useStore(s => s.daoHeart);
  const toggleSaveDialog = useStore(s => s.toggleSaveDialog);
  const toggleSettings = useStore(s => s.toggleSettings);
  // P1章节弧光：显示当前章节名
  const getCurrentChapter = useStore(s => s.getCurrentChapter);
  const currentChapter = getCurrentChapter?.();

  const healthPct = vitals.health.current / vitals.health.max * 100;
  const essencePct = essence.current / essence.max * 100;

  const healthColor =
    healthPct > 60 ? 'bg-rg-jade-500' :
    healthPct > 30 ? 'bg-rg-gold' :
    'bg-rg-blood-500';

  const phaseLabel: Record<string, string> = {
    IDLE: '就绪', BUILDING_CONTEXT: '梳理因果', FETCHING: '感应天道',
    PARSING: '解读天命', VALIDATING_L3: '天意检校', VALIDATING_FORMAT: '命轨修正',
    RESOLVED: '天命已定', ERROR: '天机紊乱',
  };

  return (
    <div className="w-full bg-rg-ink-700/90 border-b border-rg-ink-300/12 backdrop-blur-md">
      {/* ─── 第一行：角色 + 生命/真元 + 管道 ─── */}
      <div className="px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="text-rg-gold font-narrative text-lg font-bold tracking-wider whitespace-nowrap">
              {profile.name || '蛊师'}
            </div>
            <div className="w-[1px] h-6 bg-rg-ink-300/20" />
            <div className="text-rg-paper-200/80 text-sm font-panel whitespace-nowrap">
              {profile.realm.label}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-rg-paper-200/60 text-xs font-panel w-8">生命</span>
              <div className="w-24 h-2 bg-rg-ink-900 rounded-full overflow-hidden">
                <div className={`h-full ${healthColor} transition-all duration-300 rounded-full`}
                  style={{ width: `${healthPct}%` }} />
              </div>
              <span className="text-rg-paper-200/80 text-xs font-panel w-16">
                {vitals.health.current}/{vitals.health.max}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-rg-paper-200/60 text-xs font-panel w-8">真元</span>
              <div className="w-24 h-2 bg-rg-ink-900 rounded-full overflow-hidden">
                <div className={`h-full bg-blue-500 transition-all duration-300 rounded-full`}
                  style={{ width: `${essencePct}%` }} />
              </div>
              <span className="text-rg-paper-200/80 text-xs font-panel w-16">
                {essence.current}/{essence.max}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3">
              {(['资质', '体魄', '心智', '气运'] as const).map(attr => (
                <div key={attr} className="text-center">
                  <div className="text-rg-paper-200/40 text-[10px] font-panel">{attr}</div>
                  <div className="text-rg-paper-100 text-xs font-panel font-semibold">{attributes[attr]}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {phase === 'FETCHING' && <div className="w-2 h-2 bg-rg-gold rounded-full animate-pulse" />}
              {phase === 'ERROR' && <div className="w-2 h-2 bg-rg-blood-500 rounded-full" />}
              {phase === 'RESOLVED' && <div className="w-2 h-2 bg-rg-jade-500 rounded-full" />}
              <span className={`text-xs font-panel ${phase === 'ERROR' ? 'text-rg-blood-400' :
                phase === 'FETCHING' ? 'text-rg-gold' : phase === 'RESOLVED' ? 'text-rg-jade-400' :
                'text-rg-paper-200/50'}`}>{phaseLabel[phase] || phase}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 第二行：时间/回合/AP/道心 ─── */}
      <div className="px-6 pb-2 border-t border-rg-ink-300/8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-rg-paper-200/50 text-xs font-panel">
              第{turn}回
            </span>
            {currentChapter && (
              <>
                <div className="w-[1px] h-4 bg-rg-ink-300/15" />
                <span className="text-rg-gold/60 text-xs font-panel">
                  {currentChapter.displayName}
                </span>
              </>
            )}
            <div className="w-[1px] h-4 bg-rg-ink-300/15" />
            <span className="text-rg-paper-200/50 text-xs font-panel">
              {SEASON_LABELS[gameTime.season]} · {PERIOD_LABELS[gameTime.period]}
            </span>
            <div className="w-[1px] h-4 bg-rg-ink-300/15" />
            <span className="text-rg-paper-200/50 text-xs font-panel">
              第{gameTime.year}年{gameTime.month}月{gameTime.day}日
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-rg-paper-200/40 text-xs font-panel">
              AP: {gameTime.ap}/{gameTime.max_ap}
            </span>
            <div className="w-[1px] h-4 bg-rg-ink-300/15" />
            <span className="text-rg-gold/70 text-xs font-panel tabular-nums">
              元石 {currency}
            </span>
            <div className="w-[1px] h-4 bg-rg-ink-300/15" />
            <span className="text-rg-paper-200/40 text-xs font-panel">
              杀{daoHeart.kill} · 仁{daoHeart.mercy} · 谋{daoHeart.scheme} · 野{daoHeart.ambition}
            </span>
            <div className="w-[1px] h-4 bg-rg-ink-300/15" />
            <button
              onClick={toggleSaveDialog}
              className="text-rg-gold/60 hover:text-rg-gold text-xs font-button transition-micro"
            >
              存档
            </button>
            <button
              onClick={toggleSettings}
              className="text-rg-paper-200/40 hover:text-rg-paper-100 text-xs font-button transition-micro"
            >
              设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
