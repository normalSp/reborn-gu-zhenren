import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { GU_SPRING_DEFAULT, GU_SPRING_PANEL, GU_SPRING_DAMAGE } from '../../animations/motion/springTokens';

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
  const phase = useStore(s => s.pipelinePhase);
  const gameTime = useStore(s => s.gameTime);
  const turn = useStore(s => s.turn);
  const daoHeart = useStore(s => s.daoHeart);
  const inventory = useStore(s => s.inventory);
  const toggleSaveDialog = useStore(s => s.toggleSaveDialog);
  const toggleSettings = useStore(s => s.toggleSettings);
  const toggleAchievementPanel = useStore(s => s.toggleAchievementPanel);
  const unlockedAchievements = useStore(s => s.unlockedAchievements as string[] | undefined);
  const _achievementDefs = useStore(s => (s as any)._achievementDefs as any[] | undefined);
  const achievementCount = _achievementDefs?.length || 0;
  const unlockedCount = unlockedAchievements?.length || 0;
  // P1章节弧光：显示当前章节名
  const getCurrentChapter = useStore(s => s.getCurrentChapter);
  const currentChapter = getCurrentChapter?.();
  // P2-P8-5: 气运可见性检测 — 需有运道蛊虫（如察运蛊）
  const canSeeQiYun = (inventory || []).some((g: any) => g.path === '运道');

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

          <motion.div className="flex items-center gap-5" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div className="flex items-center gap-2" variants={barItem}>
              <span className="text-rg-paper-200/60 text-xs font-panel w-8">生命</span>
              <div className="w-24 h-2 bg-rg-ink-900 rounded-full overflow-hidden">
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
              <div className="w-24 h-2 bg-rg-ink-900 rounded-full overflow-hidden">
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

          <div className="flex items-center gap-4">
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
            <button
              onClick={() => (useStore.getState() as any).meditateWithPrimevalStone?.(1, 'caravan')}
              className="text-rg-gold/60 hover:text-rg-gold text-xs font-button transition-micro"
              title="消耗1回合调息吸收元石；野外或商路可能触发干扰"
            >
              调息
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
