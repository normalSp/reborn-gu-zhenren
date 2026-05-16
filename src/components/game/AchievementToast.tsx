import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { CheckIcon, TrophyIcon, StarIcon, GemIcon } from '../../icons';
import type { AchievementUnlockEvent, AchievementTier } from '../../types/achievement';

// ═══ M7: Toast spring variants ═══
const toastVariants = {
  initial: { opacity: 0, y: -32, scale: 0.85 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 12, mass: 0.6 },
  },
  exit: {
    opacity: 0, y: -12, scale: 0.9,
    transition: { duration: 0.25, ease: [0.7, 0, 0.84, 0] },
  },
};

const TIER_GLOW: Record<AchievementTier, string> = {
  bronze: 'from-amber-600/20 to-amber-800/10',
  silver: 'from-gray-400/20 to-gray-600/10',
  gold: 'from-yellow-400/20 to-yellow-600/10',
  legendary: 'from-purple-500/20 to-purple-800/10',
};

const TIER_ICON_COLOR: Record<AchievementTier, string> = {
  bronze: 'text-amber-400',
  silver: 'text-gray-300',
  gold: 'text-yellow-300',
  legendary: 'text-purple-300',
};

export function AchievementToast() {
  const recentUnlocks = useStore(s => s.recentUnlocks as AchievementUnlockEvent[] | undefined);
  const clearRecentUnlocks = useStore(s => s.clearRecentUnlocks as (() => void) | undefined);
  const [visible, setVisible] = useState(false);
  const [event, setEvent] = useState<AchievementUnlockEvent | null>(null);
  const [animPhase, setAnimPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    if (recentUnlocks && recentUnlocks.length > 0) {
      const evt = recentUnlocks[0];
      setEvent(evt);
      setVisible(true);
      setAnimPhase('enter');

      // 入场动画 → 展示
      const t1 = setTimeout(() => setAnimPhase('show'), 600);
      // 展示 → 退场
      const t2 = setTimeout(() => setAnimPhase('exit'), 3500);
      // 清理
      const t3 = setTimeout(() => {
        setVisible(false);
        setEvent(null);
        clearRecentUnlocks?.();
      }, 4200);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [recentUnlocks]);

  return (
    <AnimatePresence mode="wait">
      {visible && event && (
        <motion.div
          key={event.achievementId || event.name}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          variants={toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className={`
            bg-rg-ink-900/95 border border-rg-gold/30 rounded-lg px-4 py-3
            shadow-lg shadow-rg-gold/10
            bg-gradient-to-r ${TIER_GLOW[event.tier]}
            backdrop-blur-sm
          `}>
            <div className="flex items-center gap-3">
              <motion.span
                className={TIER_ICON_COLOR[event.tier]}
                animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {event.tier === 'legendary' ? <GemIcon size={20} /> :
                 event.tier === 'gold' ? <TrophyIcon size={20} /> :
                 event.tier === 'silver' ? <StarIcon size={20} /> :
                 <CheckIcon size={20} />}
              </motion.span>
              <div>
                <p className="text-rg-paper-200/80 text-[10px] font-panel tracking-wider uppercase">
                  成就解锁
                </p>
                <p className={`text-sm font-narrative font-semibold ${TIER_ICON_COLOR[event.tier]}`}>
                  {event.name}
                </p>
                <p className="text-rg-ink-300 text-[10px] font-panel mt-0.5">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
