import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { GU_SPRING_DEFAULT, GU_SPRING_PANEL, GU_SPRING_DAMAGE } from '../../animations/motion/springTokens';
import { normalizePathDaoMarkState } from '../../engine/path-dao-mark-normalizer';

const PERIOD_LABELS: Record<string, string> = { morning: '清晨', noon: '日中', evening: '黄昏', night: '深夜' };
const SEASON_LABELS: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

// ═══ M7: Motion 动画 variant ═══
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const barItem = {
  hidden: { opacity: 0, y: 6, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: GU_SPRING_PANEL },
};

const numVariants = {
  initial: { opacity: 0, scale: 1.3 },
  animate: { opacity: 1, scale: 1, transition: GU_SPRING_DAMAGE },
};

export function StatusBar() {
  const profile = useStore(s => s.profile);
  const vitals = useStore(s => s.vitals);
  const essence = useStore(s => s.vitals.essence);
  const attributes = useStore(s => s.attributes);
  const currency = useStore(s => s.currency);
  const immortalCurrency = useStore(s => (s as any).immortalCurrency ?? 0);
  const phase = useStore(s => s.pipelinePhase);
  const gameTime = useStore(s => s.gameTime);
  const turn = useStore(s => s.turn);
  const daoHeart = useStore(s => s.daoHeart);
  const inventory = useStore(s => s.inventory);
  const killMoves = useStore(s => s.killMoves);
  const pathBuild = useStore(s => s.pathBuild);
  const daoMarksTop = useStore(s => (s as any).daoMarks);
  const aperture = useStore(s => (s as any).aperture);
  const primaryPath = useStore(s => (s as any).primaryPath);
  const secondaryPaths = useStore(s => (s as any).secondaryPaths);
  const pathLevelsTop = useStore(s => (s as any).pathLevels);
  const toggleSaveDialog = useStore(s => s.toggleSaveDialog);
  const toggleSettings = useStore(s => s.toggleSettings);
  const toggleAchievementPanel = useStore(s => s.toggleAchievementPanel);
  const unlockedAchievements = useStore(s => s.unlockedAchievements as string[] | undefined);
  const _achievementDefs = useStore(s => (s as any)._achievementDefs as any[] | undefined);
  const achievementCount = _achievementDefs?.length || 0;
  const unlockedCount = unlockedAchievements?.length || 0;
  const isImmortal = (profile?.realm?.grand ?? 1) >= 6 || vitals.essenceType === 'immortal';
  // P1章节弧光：显示当前章节名
  const getCurrentChapter = useStore(s => s.getCurrentChapter);
  const currentChapter = getCurrentChapter?.();
  // P2-P8-5: 气运可见性检测 — 需有运道蛊虫（如察运蛊）
  const canSeeQiYun = (inventory || []).some((g: any) => g.path === '运道');
  const daoSummary = normalizePathDaoMarkState({
    pathBuild,
    daoMarks: daoMarksTop,
    aperture,
    primaryPath,
    secondaryPaths,
    pathLevels: pathLevelsTop,
    inventory,
    killMoves,
  });

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
    <div className="rg-statusbar w-full border-b backdrop-blur-md" data-testid="game-status-bar">
      {/* ─── 第一行：角色 + 生命/真元 + 管道 ─── */}
      <div className="px-3 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <motion.div
              className="text-rg-gold font-narrative text-lg font-bold tracking-wider whitespace-nowrap"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={GU_SPRING_PANEL}
            >
              {profile.name || '蛊师'}
            </motion.div>
            <div className="w-[1px] h-6 bg-rg-ink-300/20" />
            <motion.div
              className="text-rg-paper-200/80 text-sm font-panel whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {profile.realm.label}
            </motion.div>
          </div>

          <motion.div className="order-3 flex w-full flex-wrap items-center gap-3 sm:gap-5 md:order-none md:w-auto" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div className="flex items-center gap-2" variants={barItem}>
              <span className="text-rg-paper-200/60 text-xs font-panel w-8">生命</span>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-rg-ink-900 sm:w-24">
                <motion.div
                  className={`h-full ${healthColor} rounded-full health-bar-breath`}
                  layout
                  transition={GU_SPRING_PANEL}
                  style={{ width: `${healthPct}%` }}
                />
              </div>
              <motion.span
                key={`hp-${vitals.health.current}-${vitals.health.max}`}
                className="text-rg-paper-200/80 text-xs font-panel w-16 tabular-nums"
                variants={numVariants}
                initial="initial"
                animate="animate"
              >
                {vitals.health.current}/{vitals.health.max}
              </motion.span>
            </motion.div>
            <motion.div className="flex items-center gap-2" variants={barItem}>
              <span className="text-rg-paper-200/60 text-xs font-panel w-8">真元</span>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-rg-ink-900 sm:w-24">
                <motion.div
                  className="h-full bg-blue-500 rounded-full essence-bar-breath"
                  layout
                  transition={GU_SPRING_PANEL}
                  style={{ width: `${essencePct}%` }}
                />
              </div>
              <motion.span
                key={`ess-${essence.current}-${essence.max}`}
                className="text-rg-paper-200/80 text-xs font-panel w-16 tabular-nums"
                variants={numVariants}
                initial="initial"
                animate="animate"
              >
                {essence.current}/{essence.max}
              </motion.span>
            </motion.div>
          </motion.div>

          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex items-center gap-3">
              {(['资质', '体魄', '心智', '气运'] as const).map(attr => (
                <div key={attr} className="text-center">
                  <div className="text-rg-paper-200/40 text-[10px] font-panel">{attr}</div>
                  <div className="text-rg-paper-100 text-xs font-panel font-semibold">
                    {attr === '气运' && !canSeeQiYun ? '???' : attributes[attr]}
                  </div>
                </div>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {phase === 'FETCHING' && <motion.div className="w-2 h-2 bg-rg-gold rounded-full" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                {phase === 'ERROR' && <div className="w-2 h-2 bg-rg-blood-500 rounded-full" />}
                {phase === 'RESOLVED' && <div className="w-2 h-2 bg-rg-jade-500 rounded-full" />}
                <span className={`text-xs font-panel ${phase === 'ERROR' ? 'text-rg-blood-400' :
                  phase === 'FETCHING' ? 'text-rg-gold' : phase === 'RESOLVED' ? 'text-rg-jade-400' :
                  'text-rg-paper-200/50'}`}>{phaseLabel[phase] || phase}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── 第二行：时间/回合/AP/道心 ─── */}
      <div className="border-t border-rg-ink-300/8 px-3 pb-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4">
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

          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4">
            <span className="text-rg-paper-200/40 text-xs font-panel">
              AP: {gameTime.ap}/{gameTime.max_ap}
            </span>
            <div className="w-[1px] h-4 bg-rg-ink-300/15" />
            <span className="text-rg-gold/70 text-xs font-panel tabular-nums">
              {isImmortal ? `仙元石 ${immortalCurrency}` : `元石 ${currency}`}
            </span>
            <div className="hidden h-4 w-[1px] bg-rg-ink-300/15 lg:block" />
            <span
              className="hidden max-w-[220px] truncate text-xs font-panel text-rg-paper-200/45 lg:inline"
              title={`主修：${daoSummary.primary || '未定'}；辅修：${daoSummary.secondary.join('、') || '无'}；道痕总计：${daoSummary.totalMarks}`}
            >
              {daoSummary.primary || '未定道'} · 道痕 {daoSummary.totalMarks}
              {daoSummary.topDaoMarks[0] ? ` · ${daoSummary.topDaoMarks[0][0]}${daoSummary.topDaoMarks[0][1]}` : ''}
            </span>
            <button
              onClick={() => {
                const api = useStore.getState() as any;
                if (isImmortal) api.meditateWithImmortalStone?.(1, 'aperture');
                else api.meditateWithPrimevalStone?.(1, 'caravan');
              }}
              disabled={(gameTime.ap ?? 0) <= 0}
              className={`text-xs font-button transition-micro ${
                (gameTime.ap ?? 0) <= 0
                  ? 'text-rg-paper-200/20 cursor-not-allowed'
                  : 'text-rg-gold/60 hover:text-rg-gold'
              }`}
              title={isImmortal
                ? '消耗1 AP与1仙元石调息补充仙元；仙窍内较安全'
                : '消耗1 AP与1元石调息补充真元；商路/野外可能触发干扰'}
            >
              {isImmortal ? '补仙元' : '调息'}
            </button>
            <div className="w-[1px] h-4 bg-rg-ink-300/15" />
            <motion.span
              key={`dh-${daoHeart.kill}-${daoHeart.mercy}-${daoHeart.scheme}-${daoHeart.ambition}`}
              className="text-rg-paper-200/40 text-xs font-panel tabular-nums"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              杀{daoHeart.kill} · 仁{daoHeart.mercy} · 谋{daoHeart.scheme} · 野{daoHeart.ambition}
            </motion.span>
            <div className="w-[1px] h-4 bg-rg-ink-300/15" />
            <button
              onClick={toggleSaveDialog}
              className="text-rg-gold/60 hover:text-rg-gold text-xs font-button transition-micro"
            >
              存档
            </button>
            <button
              onClick={toggleAchievementPanel}
              className="text-rg-paper-200/40 hover:text-rg-paper-100 text-xs font-button transition-micro"
            >
              成就{unlockedCount > 0 ? ` ${unlockedCount}` : ''}
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
      {/* P4: 呼吸光动画注入 — 暗金命火脉动 + 真元潮汐 */}
      <style>{`
        @keyframes health-breath {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15) drop-shadow(0 0 3px var(--gu-trace-gold-dim)); }
        }
        @keyframes essence-breath {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.12) drop-shadow(0 0 3px var(--gu-life-azure)); }
        }
        .health-bar-breath { animation: health-breath 3s ease-in-out infinite; }
        .essence-bar-breath { animation: essence-breath 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
