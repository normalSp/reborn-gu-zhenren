import { useState, useEffect, useCallback, useRef } from 'react';
import { bindDiceRollTrigger, type DiceRollPayload } from '../../ui/dice-roll-bus';

const BORDER_COLORS = [
  'border-rg-gold',
  'border-rg-jade-500',
  'border-blue-400',
  'border-purple-400',
  'border-rg-blood-400',
  'border-orange-400',
];

function randomDiceBorder() {
  return BORDER_COLORS[Math.floor(Math.random() * BORDER_COLORS.length)];
}

export function DiceRollAnimation() {
  const [active, setActive] = useState(false);
  const [payload, setPayload] = useState<DiceRollPayload | null>(null);
  const [phase, setPhase] = useState<'roll' | 'reveal' | 'result' | 'exit'>('roll');
  const [rollValue, setRollValue] = useState(1);
  const [finalResult, setFinalResult] = useState<{ roll: number; passed: boolean } | null>(null);
  const [diceBorder, setDiceBorder] = useState('border-rg-gold');
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doTrigger = useCallback((p: DiceRollPayload) => {
    setPayload(p);
    setActive(true);
    setPhase('roll');
    setFinalResult(null);
    setRollValue(1);
    setDiceBorder(randomDiceBorder());
  }, []);

  useEffect(() => {
    bindDiceRollTrigger(doTrigger);
    return () => { bindDiceRollTrigger(null); };
  }, [doTrigger]);

  // 骰子翻滚阶段
  useEffect(() => {
    if (!active || phase !== 'roll') return;

    let count = 0;
    rollIntervalRef.current = setInterval(() => {
      setRollValue(Math.floor(Math.random() * 20) + 1);
      setDiceBorder(randomDiceBorder());
      count++;
      if (count >= 12) {
        // 停止翻滚，进入揭晓
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        setTimeout(() => {
          const finalRoll = Math.floor(Math.random() * 20) + 1;
          setRollValue(finalRoll);
          const p = payload!;
          const passed = finalRoll + p.difficulty >= p.target;
          setFinalResult({ roll: finalRoll, passed });
          setPhase('reveal');
        }, 50);
      }
    }, 120);

    return () => { if (rollIntervalRef.current) clearInterval(rollIntervalRef.current); };
  }, [active, phase, payload]);

  // 结果展示 → 关闭
  useEffect(() => {
    if (phase === 'reveal') {
      const t = setTimeout(() => setPhase('result'), 600);
      return () => clearTimeout(t);
    }
    if (phase === 'result') {
      const t = setTimeout(() => {
        setPhase('exit');
        if (finalResult && payload?.onComplete) {
          payload.onComplete(finalResult);
        }
      }, 2000);
      return () => clearTimeout(t);
    }
    if (phase === 'exit') {
      const t = setTimeout(() => { setActive(false); setPayload(null); }, 500);
      return () => clearTimeout(t);
    }
  }, [phase, finalResult, payload]);

  if (!active || !payload) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none
        ${phase === 'exit' ? 'animate-out fade-out duration-400' : ''}`}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-rg-ink-800/60 backdrop-blur-sm" />

      {/* 检定卡片 */}
      <div className="relative z-10 bg-rg-ink-700/95 border border-rg-ink-300/15 rounded-xl p-8 max-w-xs w-full backdrop-blur-xl shadow-2xl">
        {/* 检定标题 */}
        <p className="text-rg-paper-200/50 text-xs font-panel tracking-widest text-center mb-6">
          命运博弈
        </p>
        <h3 className="text-rg-paper-200 text-lg font-narrative text-center mb-2">
          {payload.label}
        </h3>

        {/* 骰子区域 */}
        <div className="flex items-center justify-center my-6">
          <div
            className={`w-20 h-20 rounded-xl border-2 ${diceBorder} bg-rg-ink-900 flex items-center justify-center
              transition-all duration-200
              ${phase === 'roll' ? 'animate-spin-y' : ''}
              ${phase === 'reveal'
                ? finalResult?.passed
                  ? 'scale-110 border-rg-jade-400 shadow-lg shadow-rg-jade-500/30'
                  : 'scale-90 border-rg-blood-400/70'
                : ''}`}
          >
            <span
              className={`font-narrative transition-all duration-200
                ${phase === 'roll' ? 'text-xl text-rg-gold' :
                  finalResult?.passed
                    ? 'text-3xl text-rg-jade-400'
                    : 'text-3xl text-rg-blood-400'}`}
            >
              {rollValue}
            </span>
          </div>
        </div>

        {/* 难度/目标信息 */}
        <div className="flex justify-center gap-6 mb-4 text-xs font-panel">
          <div className="text-center">
            <div className="text-rg-paper-200/40">难度加值</div>
            <div className="text-rg-paper-200 text-sm">+{payload.difficulty}</div>
          </div>
          <div className="text-center">
            <div className="text-rg-paper-200/40">目标</div>
            <div className="text-rg-paper-200 text-sm">{payload.target}</div>
          </div>
        </div>

        {/* 结果揭晓 */}
        {phase === 'reveal' && finalResult && (
          <div className={`text-center mt-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2`}>
            <p className={`text-xs font-panel mb-1 ${finalResult.passed ? 'text-rg-jade-400' : 'text-rg-blood-400'}`}>
              最终值: {finalResult.roll + payload.difficulty}
            </p>
            <p className={`text-sm font-narrative font-semibold ${finalResult.passed ? 'text-rg-jade-400' : 'text-rg-blood-400'}`}
              style={finalResult.passed
                ? { textShadow: '0 0 16px rgba(72,199,142,0.4)' }
                : { textShadow: '0 0 16px rgba(220,53,69,0.4)' }}>
              {finalResult.passed ? '检定通过' : '检定失败'}
            </p>
          </div>
        )}

        {phase === 'result' && finalResult && (
          <div className={`text-center mt-4 animate-in fade-in duration-300`}>
            <p className={`text-sm font-narrative font-semibold ${finalResult.passed ? 'text-rg-jade-400' : 'text-rg-blood-400'}`}
              style={finalResult.passed
                ? { textShadow: '0 0 16px rgba(72,199,142,0.4)' }
                : { textShadow: '0 0 16px rgba(220,53,69,0.4)' }}>
              {finalResult.passed ? '检定通过' : '检定失败'}
            </p>
          </div>
        )}
      </div>

      {/* 内联动画关键帧 */}
      <style>{`
        @keyframes spin-y {
          0% { transform: rotateY(0deg) scale(1); }
          25% { transform: rotateY(90deg) scale(1.05); }
          50% { transform: rotateY(180deg) scale(0.95); }
          75% { transform: rotateY(270deg) scale(1.05); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        .animate-spin-y {
          animation: spin-y 0.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
