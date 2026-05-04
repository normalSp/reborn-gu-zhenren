import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { TriangleAlertIcon } from '../../icons/TriangleAlertIcon';
import { ZapIcon } from '../../icons/ZapIcon';
import type { SemanticValidationResult } from '../../engine/semantic-validator';

// ═══ M7: Narrative text transition variants ═══
const textBlockVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.2 } },
};

interface NarrativePanelProps {
  validation?: SemanticValidationResult | null;
}

export function NarrativePanel({ validation }: NarrativePanelProps) {
  const narrative = useStore(s => s.currentNarrative);
  const isLoading = useStore(s => s.isLoading);
  const phase = useStore(s => s.pipelinePhase);
  const speed = useStore(s => s.typewriterSpeed);
  const l3Warnings = useStore(s => s.l3Warnings);

  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const textRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 当新叙事到来时，启动打字机效果
  useEffect(() => {
    if (narrative?.narrative?.text) {
      const text = narrative.narrative.text;
      textRef.current = text;
      setDisplayedText('');
      setCharIndex(0);
      setTypingComplete(false);

      // 清除之前的计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setCharIndex(prev => {
          const next = prev + 1;
          if (next >= text.length) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setTypingComplete(true);
            return text.length;
          }
          setDisplayedText(text.substring(0, next));
          return next;
        });
      }, speed);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [narrative, speed]);

  // 点击跳过打字机效果，直接显示全文
  const handleSkipTyping = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (textRef.current) {
      setDisplayedText(textRef.current);
      setCharIndex(textRef.current.length);
      setTypingComplete(true);
    }
  }, []);

  // Loading 状态
  if (phase === 'FETCHING' || phase === 'BUILDING_CONTEXT' || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-rg-gold rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-rg-gold rounded-full animate-pulse delay-100" />
            <div className="w-2 h-2 bg-rg-gold rounded-full animate-pulse delay-200" />
          </div>
          <p className="text-rg-paper-200/50 text-sm font-panel">
            {phase === 'BUILDING_CONTEXT' ? '天道正在梳理因果...' :
             phase === 'FETCHING' ? '正在感应天意，谋定命轨...' :
             '命运正在书写...'}
          </p>
        </div>
      </div>
    );
  }

  // 暂无叙事
  if (!narrative?.narrative?.text && phase !== 'FETCHING') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-rg-paper-200/40 font-narrative text-lg">
          等待天命显现...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 overflow-y-auto p-8"
      onClick={handleSkipTyping}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-3xl mx-auto">
        {/* 叙事正文 */}
        <motion.div
          key={narrative?.narrative?.text?.substring(0, 40)}
          className="narrative-text text-rg-paper-200 text-base tracking-[0.02em] whitespace-pre-line select-none"
          style={{ lineHeight: 1.85 }}
          variants={textBlockVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {displayedText}
          {!typingComplete && (
            <span className="cursor-blink text-rg-gold" />
          )}
        </motion.div>

        {/* 打字机未完成时，提示可点击跳过 */}
        {!typingComplete && (
          <p className="text-rg-ink-300 text-xs font-panel mt-6 text-center cursor-pointer hover:text-rg-paper-200/50 transition-micro">
            点击任意处跳过打字效果
          </p>
        )}

        {/* Layer 3 语义警告 */}
        {validation && (validation.failedRules.length > 0 || validation.warningRules.length > 0) && (
          <div className={`mt-6 p-4 rounded-sm border ${
            validation.failedRules.length > 0
              ? 'bg-rg-blood-600/10 border-rg-blood-400/30'
              : 'bg-rg-gold/10 border-rg-gold/25'
          }`}>
            <p className={`text-xs font-panel font-semibold mb-2 ${
              validation.failedRules.length > 0 ? 'text-rg-blood-300' : 'text-rg-gold'
            } flex items-center gap-1.5`}>
              {validation.failedRules.length > 0 ? (
                <><TriangleAlertIcon size={14} /> 天意检校发现异常</>
              ) : (
                <><ZapIcon size={14} /> 天意提示</>
              )}
            </p>
            {validation.failedRules.map(rule => (
              <div key={rule.ruleId} className="text-rg-blood-200/80 text-xs font-panel mt-1">
                {rule.ruleName}: {rule.details}
              </div>
            ))}
            {!validation.failedRules.length && validation.warningRules.map(rule => (
              <div key={rule.ruleId} className="text-rg-gold/80 text-xs font-panel mt-1">
                {rule.ruleName}: {rule.details || '注意细节'}
              </div>
            ))}
          </div>
        )}

        {/* L3 警告标记 */}
        {l3Warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-sm bg-rg-gold/10 border border-rg-gold/20">
            {l3Warnings.map((w, i) => (
              <p key={i} className="text-rg-gold/70 text-xs font-panel">
                {w.ruleName}: {w.details}
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
