import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { audioManager } from '../../utils/audio';
import { buildDeathRecordFallback } from '../../engine/death-record';

// ═══ M7: GameOver animation variants ═══
const titleVariants = {
  hidden: { opacity: 0, y: -40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14, delay: 0.2 } },
};

const subtitleVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: 0.6 } },
};

const statsContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.9 },
  },
};

const statItem = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

const epilogueVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: 1.8 } },
};

const btnContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: 2.2 } },
};

interface GameOverScreenProps {
  onRestart: () => void;
}

export function GameOverScreen({ onRestart }: GameOverScreenProps) {
  const profile = useStore(s => s.profile);
  const turn = useStore(s => s.turn);
  const deathCause = useStore(s => (s as any).deathCause || '生命耗尽');
  const deathTurn = useStore(s => (s as any).deathTurn || turn);
  const deathRecord = useStore(s => (s as any).deathRecord);
  const record = useMemo(() => deathRecord || buildDeathRecordFallback(useStore.getState()), [deathRecord]);
  const isEndingSummary = Boolean(record.endingFamilyId && record.endingFamilyId !== 'death_and_dust');

  // P2修复: 死亡时播放死亡音效
  useEffect(() => {
    if (!isEndingSummary) audioManager.playSfx('death');
  }, [isEndingSummary]);

  const handleRestart = () => {
    // ═══ 全量重置存档状态，再返回标题 ═══
    (useStore.getState() as any).resetStore?.();
    onRestart();
  };

  const handleSaveDeath = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isEndingSummary ? 'ending-record' : 'death-record'}-${record.turn || deathTurn}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      data-testid={isEndingSummary ? 'ending-summary-screen' : 'game-over-screen'}
      className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
    >
      <motion.h1
        data-testid={isEndingSummary ? 'ending-summary-title' : 'game-over-title'}
        className="text-4xl font-bold text-rg-blood font-narrative tracking-widest mb-6"
        variants={titleVariants}
        initial="hidden"
        animate="visible"
      >
        {isEndingSummary ? '终局' : '道陨'}
      </motion.h1>
      <motion.p
        className="text-rg-paper-200/60 text-lg font-narrative mb-4"
        variants={subtitleVariants}
        initial="hidden"
        animate="visible"
      >
        {isEndingSummary ? '此行因果已由本地终局引擎收束' : '你的蛊师之路在此终结'}
      </motion.p>

      {/* 死因详情 */}
      <motion.div
        className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 mb-8 max-w-sm w-full backdrop-blur-md"
        variants={statsContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <motion.div variants={statItem}>
            <span className="text-rg-paper-200/40 text-xs font-panel">蛊师</span>
            <p className="text-rg-gold font-narrative">{profile.name || '无名蛊师'}</p>
          </motion.div>
          <motion.div variants={statItem}>
            <span className="text-rg-paper-200/40 text-xs font-panel">境界</span>
            <p className="text-rg-paper-100 font-panel">{profile.realm.label}</p>
          </motion.div>
          <motion.div variants={statItem}>
            <span className="text-rg-paper-200/40 text-xs font-panel">{isEndingSummary ? '收束于' : '陨落于'}</span>
            <p className="text-rg-paper-100 font-panel">第{record.turn || deathTurn}回</p>
          </motion.div>
          <motion.div variants={statItem}>
            <span className="text-rg-paper-200/40 text-xs font-panel">{isEndingSummary ? '结局' : '死因'}</span>
            <p className="text-rg-blood-400 font-panel">{record.cause || deathCause}</p>
          </motion.div>
        </div>
        {record.endingFamilyId && (
          <div className="mt-4 border-t border-rg-ink-300/10 pt-3" data-testid="ending-summary-family">
            <span className="text-rg-paper-200/40 text-xs font-panel">终局族群</span>
            <p className="text-rg-gold text-xs font-panel leading-relaxed mt-1">
              {record.endingFamilyId} · {record.endingProvenance || 'unknown'}
            </p>
            {(record.unresolvedWarnings?.length || 0) > 0 && (
              <div className="mt-2 space-y-1">
                {record.unresolvedWarnings!.slice(0, 2).map((warning: string) => (
                  <p key={warning} className="text-rg-paper-200/42 text-[11px] font-panel leading-relaxed">· {warning}</p>
                ))}
              </div>
            )}
          </div>
        )}
        {record.lifeSummary && (
          <div className="mt-4 border-t border-rg-ink-300/10 pt-3">
            <span className="text-rg-paper-200/40 text-xs font-panel">一生摘要</span>
            <p className="text-rg-paper-200/65 text-xs font-panel leading-relaxed mt-1">{record.lifeSummary}</p>
          </div>
        )}
        {(record.majorChoices?.length || 0) > 0 && (
          <div className="mt-3">
            <span className="text-rg-paper-200/40 text-xs font-panel">关键选择</span>
            <div className="mt-1 space-y-1">
              {record.majorChoices.slice(0, 3).map((choice: string, index: number) => (
                <p key={`${choice}-${index}`} className="text-rg-paper-200/45 text-[11px] font-panel leading-relaxed">· {choice}</p>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {record.closingPoem && (
        <motion.div
          className="bg-rg-ink-700/70 border border-rg-gold/20 rounded-lg p-4 mb-8 max-w-md w-full backdrop-blur-md"
          variants={epilogueVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="text-rg-gold text-sm font-narrative mb-2">{record.poemTitle || '定场诗'}</h3>
          <p className="text-rg-paper-100/75 text-sm font-narrative leading-7 whitespace-pre-wrap">{record.closingPoem}</p>
        </motion.div>
      )}

      <motion.p
        className="text-rg-paper-200/30 text-sm font-panel mb-8"
        variants={epilogueVariants}
        initial="hidden"
        animate="visible"
      >
        {isEndingSummary ? '蛊界仍在运转，真正永生仍只是雾中未证之问' : '蛊界从不因一个人的死亡而停止运转'}
      </motion.p>

      <motion.div className="flex gap-4" variants={btnContainer} initial="hidden" animate="visible">
        {/* 导出存档（留作纪念） */}
        <motion.button
          onClick={handleSaveDeath}
          className="border border-rg-gold/40 text-rg-gold font-button text-sm px-5 py-2.5 rounded-sm cursor-pointer"
          whileHover={{ scale: 1.04, backgroundColor: 'var(--gu-trace-gold-dim)' }}
          whileTap={{ scale: 0.96 }}
        >
          导出此行
        </motion.button>

        {/* 重入轮回 */}
        <motion.button
          onClick={handleRestart}
          className="bg-rg-gold hover:bg-rg-gold/80 text-rg-ink-900 font-button font-semibold px-6 py-2.5 rounded-sm cursor-pointer"
          whileHover={{ scale: 1.04, filter: 'brightness(1.15)' }}
          whileTap={{ scale: 0.96 }}
        >
          重入轮回
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
