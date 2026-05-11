import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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

function getChoiceGuAffordances(choice: Choice) {
  const raw = (choice as any).guAffordances ?? (choice as any).gu_affordance;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function getChoiceAnchorTags(choice: Choice) {
  const raw = (choice as any).anchorTags ?? (choice as any).anchor_tags;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function getChoiceSystemTags(choice: Choice) {
  const raw =
    (choice as any).systemTags ??
    (choice as any).system_tags ??
    (choice as any).originTags ??
    (choice as any).origin_tags ??
    (choice as any).lifeboundTags ??
    (choice as any).lifebound_tags;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function getSystemTagTone(tag: any) {
  const status = tag?.status || tag?.kind || tag?.tone;
  if (status === 'available' || status === 'active' || status === 'runtime_active') return 'rg-chip rg-chip--jade';
  if (status === 'blocked' || status === 'forbidden' || status === 'risk') return 'rg-chip rg-chip--blood';
  if (status === 'planned_needs_system' || status === 'pending') return 'rg-chip rg-chip--gold';
  return 'rg-chip rg-chip--muted';
}

function getGuAffordanceTone(status: string | undefined) {
  if (status === 'available') return 'rg-chip rg-chip--jade';
  if (status === 'missing') return 'rg-chip rg-chip--gold';
  if (status === 'forbidden') return 'rg-chip rg-chip--blood';
  return 'rg-chip rg-chip--muted';
}

function getGuAffordanceStatusLabel(status: string | undefined) {
  if (status === 'available') return '蛊虫解法';
  if (status === 'missing') return '缺少蛊虫';
  if (status === 'forbidden') return '禁忌门槛';
  return '待校验';
}

function getAnchorTagTone(kind: string | undefined) {
  if (kind === 'canon_side') return 'rg-chip rg-chip--gold';
  if (kind === 'if_deviation') return 'rg-chip rg-chip--jade';
  if (kind === 'heaven_pressure') return 'rg-chip rg-chip--blood';
  if (kind === 'forbidden_block') return 'rg-chip rg-chip--blood';
  return 'rg-chip rg-chip--muted';
}

export function ChoicePanel({ onSelect, onRetry, pipelineState }: ChoicePanelProps) {
  const reduceMotion = useReducedMotion();
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
      <div className="rg-panel-surface w-full border-t px-4 py-4 sm:px-6" data-testid="choice-panel-error">
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
      <div className="rg-panel-surface w-full border-t px-4 py-5 sm:px-6" data-testid="choice-panel-processing">
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
      <div className="rg-panel-surface w-full border-t px-4 py-4 sm:px-6" data-testid="choice-panel-empty">
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
      className="rg-panel-surface w-full border-t px-4 py-5 sm:px-6"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      data-testid="choice-panel"
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
            choices.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            choices.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}
          variants={choiceContainer}
          initial="hidden"
          animate="visible"
        >
          {choices.map(choice => {
            const style = RISK_STYLES[choice.risk];
            const guAffordances = getChoiceGuAffordances(choice);
            const primaryGuAffordance = guAffordances[0];
            const anchorTags = getChoiceAnchorTags(choice);
            const primaryAnchorTag = anchorTags[0];
            const systemTags = getChoiceSystemTags(choice);
            const primarySystemTag = systemTags[0];
            return (
              <motion.div key={choice.id} className="relative group" variants={choiceItem}>
                <motion.button
                  onClick={() => {
                    audioManager.playSfx('select');
                    onSelect(choice.id);
                  }}
                  className={`rg-choice-card rg-focus-ring w-full text-left p-4 ${style.border} ${style.bg}`}
                  whileHover={reduceMotion ? undefined : { scale: 1.01, borderColor: 'var(--gu-trace-gold)' }}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {/* 风险标签 */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className={`inline-block text-[10px] font-panel font-semibold ${style.labelColor}`}>
                      {style.label}
                    </span>
                    {primaryGuAffordance && (
                      <motion.span
                        className={`max-w-full ${getGuAffordanceTone(primaryGuAffordance.status)}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 3 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        data-testid={`choice-gu-affordance-${primaryGuAffordance.status || 'unknown'}`}
                      >
                        <span>{getGuAffordanceStatusLabel(primaryGuAffordance.status)}</span>
                        <span className="truncate">{primaryGuAffordance.sourceName}</span>
                      </motion.span>
                    )}
                    {primaryAnchorTag && (
                      <motion.span
                        className={`max-w-full ${getAnchorTagTone(primaryAnchorTag.kind)}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 3 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        data-testid={`choice-anchor-tag-${primaryAnchorTag.kind || 'unknown'}`}
                      >
                        <span className="truncate">{primaryAnchorTag.label || '剧情锚点'}</span>
                      </motion.span>
                    )}
                    {primarySystemTag && (
                      <motion.span
                        className={`max-w-full ${getSystemTagTone(primarySystemTag)}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 3 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        data-testid={`choice-system-tag-${primarySystemTag.kind || primarySystemTag.status || 'unknown'}`}
                      >
                        <span className="truncate">{primarySystemTag.label || primarySystemTag.name || '系统约束'}</span>
                      </motion.span>
                    )}
                  </div>
                  {/* 选项文本 */}
                  <p className="text-rg-paper-100 text-sm font-button leading-relaxed">
                    {choice.text}
                  </p>
                </motion.button>
                {/* Risk tooltip */}
                <div className="rg-explain-tooltip invisible absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 p-2 opacity-0
                              group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                              data-testid={`choice-gu-affordance-tooltip-${choice.id}`}>
                  <p className="text-rg-paper-200/80 text-xs font-panel leading-relaxed">
                    {choice.risk_note}
                  </p>
                  {guAffordances.length > 0 && (
                    <div className="mt-2 border-t border-rg-ink-300/20 pt-2">
                      {guAffordances.slice(0, 2).map((affordance: any, index: number) => (
                        <p key={`${affordance.sourceName}-${affordance.utilityId}-${index}`} className="text-[11px] text-rg-paper-200/75 font-panel leading-relaxed">
                          {getGuAffordanceStatusLabel(affordance.status)}：{affordance.label || affordance.sourceName}；{affordance.reason || affordance.riskHint}
                        </p>
                      ))}
                    </div>
                  )}
                  {anchorTags.length > 0 && (
                    <div className="mt-2 border-t border-rg-ink-300/20 pt-2">
                      {anchorTags.slice(0, 3).map((tag: any, index: number) => (
                        <p key={`${tag.kind}-${tag.anchorId || index}`} className="text-[11px] text-rg-paper-200/75 font-panel leading-relaxed">
                          {tag.label || '剧情锚点'}：{tag.reason || tag.anchorId || '等待本地锚点引擎校验'}
                        </p>
                      ))}
                    </div>
                  )}
                  {systemTags.length > 0 && (
                    <div className="mt-2 border-t border-rg-ink-300/20 pt-2">
                      {systemTags.slice(0, 3).map((tag: any, index: number) => (
                        <p key={`${tag.kind || tag.status || 'system'}-${index}`} className="text-[11px] text-rg-paper-200/75 font-panel leading-relaxed">
                          {tag.label || tag.name || '系统约束'}：{tag.reason || tag.riskHint || tag.description || '由本地系统决定可用性、代价和风险。'}
                        </p>
                      ))}
                    </div>
                  )}
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
