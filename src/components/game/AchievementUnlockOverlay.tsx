/**
 * ═══ v0.7.0 成就解锁动画覆盖层 — AchievementUnlockOverlay.tsx ═══
 * 设计大纲§2.4: 暗幕展开→成就图标放大→标题渐入→奖励依次弹出→3秒后自动消失
 * 层级颜色边框：铜/银/金/暗金/血 ~150行
 */
import React, { useEffect, useState } from 'react';
import type { AchievementUnlockEvent } from '../../types/achievement';

const TIER_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  bronze: { border: 'border-amber-700', bg: 'from-amber-900/60 to-amber-950/80', text: 'text-amber-300', glow: 'shadow-amber-700/30' },
  silver: { border: 'border-gray-400', bg: 'from-gray-800/60 to-gray-900/80', text: 'text-gray-200', glow: 'shadow-gray-400/30' },
  gold: { border: 'border-yellow-500', bg: 'from-yellow-900/60 to-yellow-950/80', text: 'text-yellow-300', glow: 'shadow-yellow-500/40' },
  legendary: { border: 'border-purple-500', bg: 'from-purple-900/60 to-purple-950/80', text: 'text-purple-200', glow: 'shadow-purple-500/50' },
};

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', legendary: '💎',
};

interface Props {
  event: AchievementUnlockEvent;
  onComplete: () => void;
}

export const AchievementUnlockOverlay: React.FC<Props> = ({ event, onComplete }) => {
  const [phase, setPhase] = useState<'fadeIn' | 'show' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 600);
    const t2 = setTimeout(() => setPhase('fadeOut'), 3000);
    const t3 = setTimeout(onComplete, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const tierStyle = TIER_STYLES[event.tier] || TIER_STYLES.bronze;
  const icon = TIER_ICONS[event.tier] || '🏆';

  const isVisible = phase !== 'fadeOut';
  const scale = phase === 'fadeIn' ? 'scale-50 opacity-0' : 'scale-100 opacity-100';

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${isVisible ? 'bg-black/70' : 'bg-black/0'}`}>
      <div
        className={`
          relative w-80 p-6 rounded-xl border-2 ${tierStyle.border}
          bg-gradient-to-b ${tierStyle.bg} ${tierStyle.glow}
          transform transition-all duration-500 ${scale}
        `}
      >
        {/* 装饰光效 */}
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top, ${tierStyle.border === 'border-yellow-500' ? 'rgba(234,179,8,0.15)' : 'rgba(168,85,247,0.1)'} 0%, transparent 70%)`,
          }}
        />

        {/* 图标 */}
        <div className="text-center mb-3">
          <span className="text-5xl animate-bounce inline-block" style={{ animationDuration: '0.6s' }}>{icon}</span>
        </div>

        {/* 等级标签 */}
        <div className={`text-center text-xs ${tierStyle.text} mb-2`}>
          {event.tier === 'legendary' ? '传奇成就' : event.tier === 'gold' ? '黄金成就' : event.tier === 'silver' ? '白银成就' : '青铜成就'}
        </div>

        {/* 成就名称 */}
        <h2 className={`text-center text-lg font-bold ${tierStyle.text} mb-1`}>
          {event.name}
        </h2>

        {/* 描述 */}
        {event.description && (
          <p className="text-center text-sm text-gray-400">{event.description}</p>
        )}

        {/* 底部装饰线 */}
        <div className={`mt-4 h-0.5 rounded ${tierStyle.border === 'border-yellow-500' ? 'bg-yellow-500/50' : 'bg-gray-600'}`} />
      </div>
    </div>
  );
};
