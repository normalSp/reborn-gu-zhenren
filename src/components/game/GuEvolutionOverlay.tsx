/**
 * GuEvolutionOverlay — 蛊虫升转动画叠加层
 * M7 Phase 2: GSAP Timeline 目标（guEvolution.ts 的 CSS class targets）
 * 触发: playGuEvolutionAnimation(guName, fromRank, toRank)
 */
import { useStore } from '../../store';

export function GuEvolutionOverlay() {
  const active = useStore(s => (s as any).guEvolutionState?.active);
  const guName = useStore(s => (s as any).guEvolutionState?.guName || '');
  const fromRank = useStore(s => (s as any).guEvolutionState?.fromRank || 0);
  const toRank = useStore(s => (s as any).guEvolutionState?.toRank || 0);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-55 flex items-center justify-center pointer-events-none"
      style={{ backgroundColor: 'var(--gu-bg-deep)' }}
    >
      {/* 升转光晕 */}
      <div
        className="gu-evolution-glow"
        style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--gu-trace-gold) 0%, transparent 70%)',
          opacity: 0,
          transform: 'scale(0.5)',
        }}
      />

      {/* 蛊虫图标区 */}
      <div className="gu-evolution-icon" style={{ opacity: 0.8, transform: 'scale(1)' }}>
        <div className="gu-evolution-name text-rg-gold font-narrative text-2xl mb-2 text-center">
          {guName}
        </div>
      </div>

      {/* 转数变化 */}
      <div
        className="gu-rank-number"
        style={{
          fontSize: '56px',
          fontWeight: 'bold',
          color: 'var(--gu-trace-gold)',
          fontFamily: '"Serif", serif',
          transform: 'scale(1)',
          textShadow: '0 0 30px var(--gu-trace-gold-dim)',
        }}
      >
        {toRank}转
      </div>

      {/* 信息文本 */}
      <div
        className="gu-evolution-info"
        style={{
          fontSize: '16px',
          color: 'var(--gu-trace-gold)',
          fontFamily: '"Serif", serif',
          opacity: 0,
          transform: 'translateY(20px)',
        }}
      >
        {fromRank}转 → {toRank}转
      </div>
    </div>
  );
}
