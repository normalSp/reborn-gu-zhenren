import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type { Achievement, AchievementStats, AchievementCategory, AchievementTier } from '../../types/achievement';

const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: '铜',
  silver: '银',
  gold: '金',
  legendary: '传说',
};

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'text-amber-600',
  silver: 'text-gray-300',
  gold: 'text-yellow-400',
  legendary: 'text-purple-400',
};

const TIER_BG: Record<AchievementTier, string> = {
  bronze: 'bg-amber-900/30 border-amber-700/30',
  silver: 'bg-gray-800/40 border-gray-600/30',
  gold: 'bg-yellow-900/30 border-yellow-600/30',
  legendary: 'bg-purple-900/30 border-purple-600/40',
};

const CATEGORY_TABS: (AchievementCategory | '全部')[] = ['全部', '成长', '剧情', '收集', '探索', '社交', '经济', '战斗', '系统'];

export function AchievementPanel() {
  const achievements = useStore(useShallow((s: any) => s._achievementDefs as Achievement[] | undefined));
  const unlockedIds = useStore(useShallow((s: any) => s.unlockedAchievements as string[] | undefined));
  const [activeTab, setActiveTab] = useState<AchievementCategory | '全部'>('全部');

  const defs = achievements || [];
  const unlocked = new Set(unlockedIds || []);

  // BugFix: 不能从 selector 调用 getAchievementStats()（每次返回新对象引用 → 无限循环）
  // 改为在 useMemo 中本地计算统计
  const stats = useMemo<AchievementStats>(() => {
    const tiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'legendary'];
    const total = defs.length;
    const unlockedCount = unlockedIds?.length || 0;
    const byTier = Object.fromEntries(
      tiers.map(tier => {
        const tierDefs = defs.filter(d => d.tier === tier);
        return [tier, {
          total: tierDefs.length,
          unlocked: tierDefs.filter(d => unlocked.has(d.id)).length,
        }];
      })
    ) as AchievementStats['byTier'];
    const byCategory = Object.fromEntries(
      ['成长', '剧情', '收集', '探索', '社交', '经济', '战斗', '系统'].map(cat => {
        const catDefs = defs.filter(d => d.category === cat);
        return [cat, {
          total: catDefs.length,
          unlocked: catDefs.filter(d => unlocked.has(d.id)).length,
        }];
      })
    ) as AchievementStats['byCategory'];
    return { total, unlocked: unlockedCount, byTier, byCategory };
  }, [defs, unlockedIds]);

  const filtered = defs.filter(a => {
    if (activeTab !== '全部' && a.category !== activeTab) return false;
    if (a.hidden && !unlocked.has(a.id)) return false;
    return true;
  });

  const allUnlocked = defs.filter(a => unlocked.has(a.id));

  const hiddenCount = defs.filter(a => a.hidden).length;
  const hiddenUnlocked = defs.filter(a => a.hidden && unlocked.has(a.id)).length;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* ─── 统计概览 ─── */}
      {stats && (
        <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold">
              成就进度
            </h4>
            <span className="text-rg-paper-200/70 text-xs font-narrative tabular-nums">
              {stats.unlocked} / {stats.total}
            </span>
          </div>
          <div className="h-1.5 bg-rg-ink-900 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-rg-gold to-rg-jade-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}%` }}
            />
          </div>
          {/* ─── 等级分布 ─── */}
          <div className="flex gap-2 text-[9px] font-panel">
            {(['bronze', 'silver', 'gold', 'legendary'] as AchievementTier[]).map(tier => (
              <span key={tier} className={`${TIER_COLORS[tier]} tabular-nums`}>
                {TIER_LABELS[tier]} {stats.byTier[tier]?.unlocked || 0}/{stats.byTier[tier]?.total || 0}
              </span>
            ))}
            {hiddenUnlocked > 0 && (
              <span className="text-rg-ink-400 tabular-nums ml-auto">隐藏 {hiddenUnlocked}</span>
            )}
          </div>
        </div>
      )}

      {/* ─── 分类 Tab ─── */}
      <div className="flex flex-wrap gap-1 mb-3">
        {CATEGORY_TABS.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat as AchievementCategory | '全部')}
            className={`text-[10px] font-panel px-2 py-1 rounded-sm transition-colors ${
              activeTab === cat
                ? 'bg-rg-gold/20 text-rg-gold border border-rg-gold/30'
                : 'bg-rg-ink-800/50 text-rg-ink-300 border border-rg-ink-300/12 hover:text-rg-paper-200/70'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── 成就列表 ─── */}
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-rg-ink-400 text-[11px] font-panel text-center py-4">
            暂无此分类的成就
          </p>
        )}
        {filtered.map(ach => {
          const isUnlocked = unlocked.has(ach.id);
          return (
            <div
              key={ach.id}
              className={`border rounded-sm p-2.5 transition-opacity ${
                isUnlocked
                  ? `${TIER_BG[ach.tier]} opacity-100`
                  : 'bg-rg-ink-900/30 border-rg-ink-400/10 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className={`text-[11px] font-panel font-semibold ${
                    isUnlocked ? TIER_COLORS[ach.tier] : 'text-rg-ink-400'
                  }`}>
                    {ach.hidden && !isUnlocked ? '???' : ach.name}
                  </h5>
                  <p className={`text-[10px] font-panel mt-0.5 ${
                    isUnlocked ? 'text-rg-paper-200/50' : 'text-rg-ink-500'
                  }`}>
                    {ach.hidden && !isUnlocked ? '隐藏成就，达成后揭晓' : ach.description}
                  </p>
                </div>
                <span className={`text-[9px] font-panel px-1.5 py-0.5 rounded-sm shrink-0 ${
                  isUnlocked
                    ? `${TIER_COLORS[ach.tier]} bg-rg-ink-900/50`
                    : 'text-rg-ink-600 bg-rg-ink-900/30'
                }`}>
                  {TIER_LABELS[ach.tier]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
