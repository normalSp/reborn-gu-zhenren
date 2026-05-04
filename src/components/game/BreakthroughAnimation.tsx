import { useState, useEffect, useCallback, useRef } from 'react';
import { audioManager } from '../../utils/audio';

// ─── 粒子数据 ───
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
  hue: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 50 + Math.random() * 30,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    drift: (Math.random() - 0.5) * 40,
    opacity: 0.3 + Math.random() * 0.7,
    hue: 35 + Math.random() * 20, // gold range
  }));
}

export interface BreakthroughPayload {
  oldRealm: string;
  newRealm: string;
}

// ─── 暴露给外部的触发函数 ───
let triggerBreakthroughFn: ((payload: BreakthroughPayload) => void) | null = null;

export function triggerBreakthrough(payload: BreakthroughPayload) {
  triggerBreakthroughFn?.(payload);
}

export function BreakthroughAnimation() {
  const [active, setActive] = useState(false);
  const [payload, setPayload] = useState<BreakthroughPayload | null>(null);
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const particlesRef = useRef(generateParticles(30));

  const doTrigger = useCallback((p: BreakthroughPayload) => {
    setPayload(p);
    setActive(true);
    setPhase('enter');
    particlesRef.current = generateParticles(30);
    // P4修复: 境界突破音效
    audioManager.playSfx('breakthrough');
  }, []);

  useEffect(() => {
    triggerBreakthroughFn = doTrigger;
    return () => { triggerBreakthroughFn = null; };
  }, [doTrigger]);

  // 动画阶段计时
  useEffect(() => {
    if (!active) return;
    if (phase === 'enter') {
      const t = setTimeout(() => setPhase('show'), 1200);
      return () => clearTimeout(t);
    }
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('exit'), 3000);
      return () => clearTimeout(t);
    }
    if (phase === 'exit') {
      const t = setTimeout(() => { setActive(false); setPayload(null); }, 800);
      return () => clearTimeout(t);
    }
  }, [active, phase]);

  if (!active || !payload) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none
        ${phase === 'enter' ? 'animate-in fade-in duration-1000' : ''}
        ${phase === 'exit' ? 'animate-out fade-out duration-700' : ''}`}
    >
      {/* ─── 背景光晕层 ─── */}
      <div className="absolute inset-0 bg-rg-ink-800/70 backdrop-blur-sm" />
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(184,134,11,0.25) 0%, transparent 60%)',
        }}
      />

      {/* ─── 光晕脉冲 ─── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* 外环 */}
        <div
          className="absolute rounded-full border border-rg-gold/20"
          style={{
            width: 300,
            height: 300,
            top: -150,
            left: -150,
            animation: 'pulse-ring 2s ease-out infinite',
          }}
        />
        {/* 中环 */}
        <div
          className="absolute rounded-full border border-rg-gold/30"
          style={{
            width: 200,
            height: 200,
            top: -100,
            left: -100,
            animation: 'pulse-ring 2s ease-out 0.3s infinite',
          }}
        />
        {/* 内环 */}
        <div
          className="absolute rounded-full border border-rg-gold/40"
          style={{
            width: 120,
            height: 120,
            top: -60,
            left: -60,
            animation: 'pulse-ring 2s ease-out 0.6s infinite',
          }}
        />
      </div>

      {/* ─── 粒子 ─── */}
      {particlesRef.current.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `hsl(${p.hue}, 80%, 60%)`,
            opacity: 0,
            animation: `particle-rise ${p.duration}s ease-out ${p.delay}s forwards`,
            '--drift': `${p.drift}px`,
            '--particle-opacity': p.opacity,
          } as React.CSSProperties}
        />
      ))}

      {/* ─── 文字层 ─── */}
      <div className="relative text-center z-10">
        {/* 旧境界褪去 */}
        <p
          className={`text-rg-paper-200/40 text-sm font-panel mb-2 transition-all duration-700
            ${phase === 'enter' ? 'opacity-40 translate-y-0' : 'opacity-0 -translate-y-4'}`}
        >
          {payload.oldRealm}
        </p>

        {/* 突破提示 */}
        <p
          className={`text-rg-gold/50 text-xs font-panel tracking-widest mb-4 transition-all duration-500 delay-300
            ${phase !== 'exit' ? 'opacity-50' : 'opacity-0'}`}
        >
          —— 境界突破 ——
        </p>

        {/* 新境界浮现 */}
        <h1
          className={`text-rg-gold font-narrative transition-all duration-1000 ease-out
            ${phase === 'enter'
              ? 'text-3xl opacity-0 scale-75 blur-sm'
              : 'text-5xl opacity-100 scale-100 blur-none'}`}
          style={{
            textShadow: '0 0 40px rgba(184,134,11,0.5), 0 0 80px rgba(184,134,11,0.25)',
          }}
        >
          {payload.newRealm}
        </h1>
      </div>

      {/* ─── 内联关键帧 ─── */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes particle-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: var(--particle-opacity, 0.5); }
          100% { transform: translateY(-120px) translateX(var(--drift, 0px)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
