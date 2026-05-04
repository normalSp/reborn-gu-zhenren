import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import type { Choice } from '../../types';
import type { PipeState } from '../../engine/response-pipeline';
import { audioManager } from '../../utils/audio';

// ═══ M7: Choice stagger variants ═══
const choiceContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const choiceItem = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 22 },
  },
};

interface ChoicePanelProps {
  onSelect: (choiceId: string) => void;
  onRetry?: () => Promise<void>;
  pipelineState: PipeState;
}

// ─── 风险颜色映射 ───
const RISK_STYLES: Record<Choice['risk'], {
  border: string;
  bg: string;
  text: string;
  label: string;
  labelColor: string;
}> = {
  high: {
    border: 'border-rg-blood-400/50 hover:border-rg-blood-400/80',
    bg: 'hover:bg-rg-blood-600/10',
    text: 'text-rg-blood-300',
    label: '高风险',
    labelColor: 'text-rg-blood-400',
  },
  medium: {
    border: 'border-rg-gold/40 hover:border-rg-gold/60',
    bg: 'hover:bg-rg-gold/10',
    text: 'text-rg-gold',
    label: '中风险',
    labelColor: 'text-rg-gold',
  },
  low: {
    border: 'border-rg-jade-400/30 hover:border-rg-jade-400/50',
    bg: 'hover:bg-rg-jade-600/10',
    text: 'text-rg-jade-300',
    label: '低风险',
    labelColor: 'text-rg-jade-400',
  },
};

export function ChoicePanel({ onSelect, onRetry, pipelineState }: ChoicePanelProps) {
  const narrative = useStore(s => s.currentNarrative);
  const phase = useStore(s => s.pipelinePhase);

  const choices = narrative?.narrative?.choices || [];

  const isProcessing =
    phase === 'FETCHING' ||
    phase === 'BUILDING_CONTEXT' ||
    phase === 'PARSING' ||
    phase === 'VALIDATING_L3' ||
    phase === 'VALIDATING_FORMAT';

  const isError = phase === 'ERROR' || pipelineState === 'ERROR';

  if (isError) {
    return (
      <div className="w-full bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-4 backdrop-blur-md">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-rg-blood-400 text-sm font-panel mb-3">
            天机紊乱，感应天道失败
          </p>
          <button
            onClick={() => onRetry?.()}
            className="bg-rg-gold/80 hover:bg-rg-gold text-rg-ink-900 font-button font-semibold text-sm px-4 py-2 rounded-sm transition-micro"
          >
            重新感应
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    const phaseText =
      phase === 'FETCHING' ? '天道正在回应...' :
      phase === 'BUILDING_CONTEXT' ? '凝聚天命...' :
      phase === 'PARSING' ? '解读天机...' :
      phase === 'VALIDATING_L4' ? '金丝雀检校...' :
      phase === 'VALIDATING_L3' ? '天道审核中...' :
      phase === 'VALIDATING_FORMAT' ? '命数交织...' :
      '命运正在汇聚...';

    return (
      <div className="w-full bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-5 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          {/* 加载条 */}
          <div className="mb-3">
            <div className="h-1 w-full bg-rg-ink-600/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, var(--gu-trace-gold-dim), var(--gu-trace-gold), var(--gu-trace-gold-dim))',
                  animation: 'choice-loading-bar 2.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>
          {/* 状态文字 + 脉动指示器 */}
          <div className="flex items-center justify-center gap-3">
            {/* 三重脉动圆点 */}
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rg-gold/60 animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-rg-gold/60 animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-rg-gold/60 animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
            <p className="text-rg-paper-200/50 text-sm font-panel tracking-[0.05em]">
              {phaseText}
            </p>
            {/* 对称脉动点 */}
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rg-gold/60 animate-pulse" style={{ animationDelay: '400ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-rg-gold/60 animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-rg-gold/60 animate-pulse" style={{ animationDelay: '0ms' }} />
            </div>
          </div>
        </div>
        {/* 注入 keyframes 动画 */}
        <style>{`
          @keyframes choice-loading-bar {
            0% { width: 0%; margin-left: 0%; }
            25% { width: 40%; margin-left: 0%; }
            50% { width: 30%; margin-left: 35%; }
            75% { width: 40%; margin-left: 60%; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  if (choices.length === 0) {
    return (
      <div className="w-full bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-4 backdrop-blur-md">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-rg-paper-200/30 text-sm font-panel">
            等待命运的分岔...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-5 backdrop-blur-md"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.p
          className="text-rg-paper-200/50 text-xs font-panel mb-3 tracking-[0.1em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          做出你的选择
        </motion.p>
        <motion.div
          className={`grid gap-3 ${
            choices.length === 2 ? 'grid-cols-2' :
            choices.length === 3 ? 'grid-cols-3' :
            'grid-cols-2 sm:grid-cols-4'
          }`}
          variants={choiceContainer}
          initial="hidden"
          animate="visible"
        >
          {choices.map(choice => {
            const style = RISK_STYLES[choice.risk];
            return (
              <motion.div key={choice.id} className="relative group" variants={choiceItem}>
                <motion.button
                  onClick={() => {
                    audioManager.playSfx('select');
                    onSelect(choice.id);
                  }}
                  className={`w-full text-left p-4 rounded-sm border bg-rg-ink-800/50 transition-micro ${style.border} ${style.bg}`}
                  whileHover={{ scale: 1.02, borderColor: 'var(--gu-trace-gold)' }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {/* 风险标签 */}
                  <span className={`inline-block text-[10px] font-panel font-semibold mb-1.5 ${style.labelColor}`}>
                    {style.label}
                  </span>
                  {/* 选项文本 */}
                  <p className="text-rg-paper-100 text-sm font-button leading-relaxed">
                    {choice.text}
                  </p>
                </motion.button>
                {/* Risk tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-rg-ink-600 border border-rg-gold/30 rounded-sm
                              opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50
                              pointer-events-none shadow-lg shadow-black/50">
                  <p className="text-rg-paper-200/80 text-xs font-panel leading-relaxed">
                    {choice.risk_note}
                  </p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                                w-0 h-0 border-l-4 border-r-4 border-t-4
                                border-l-transparent border-r-transparent border-t-rg-ink-600" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
