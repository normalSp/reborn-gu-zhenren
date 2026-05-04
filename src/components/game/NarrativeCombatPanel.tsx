import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import type { CombatConstraint } from '../../types';

interface NarrativeCombatPanelProps {
  onSelectStrategem?: (strategy: string) => void;
}

export function NarrativeCombatPanel({ onSelectStrategem }: NarrativeCombatPanelProps) {
  const cc = useStore((s: any) => s.transientCombatConstraint) as CombatConstraint | null;
  const setCC = useStore((s: any) => s.setTransientCombatConstraint) as ((c: CombatConstraint | null) => void) | undefined;
  const realm = useStore((s: any) => s.realm) as string | undefined;
  const guInventory = useStore((s: any) => s.gu_inventory) as any[] | undefined;

  const [visible, setVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (cc) {
      setVisible(true);
      const t = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(t);
    } else {
      setShowContent(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [cc]);

  if (!visible || !cc) return null;

  const realmNum = realmToNum(realm || '一转蛊师');
  const realmDiff = realmNum - (cc.recommendedRealm || 2);
  const baseChance = cc.baseChance || 0.5;
  const realmWeight = cc.statBridge?.realmWeight || 0.15;
  const guTags = guInventory?.flatMap((g: any) => (cc.statBridge?.guTagInfluence || []).filter((t: any) => t.tag === g.path).map((t: any) => t.bonus)) || [];
  const guBonus = guTags.reduce((s: number, v: number) => s + (v || 0), 0);
  const successChance = Math.max(0.05, Math.min(0.95, baseChance + realmDiff * realmWeight + guBonus));
  const chanceColor = successChance >= 0.7 ? 'var(--gu-life-verdant)' : successChance >= 0.4 ? 'var(--gu-trace-gold)' : 'var(--gu-life-crimson)';
  const riskLabel = successChance >= 0.7 ? '高胜算' : successChance >= 0.4 ? '有风险' : '极大风险';

  const strategyCount = Math.min(cc.strategicChoiceCount || 2, 4);

  const handleDismiss = () => {
    if (setCC) setCC(null);
  };

  const handleSelect = (strategyLabel: string) => {
    // 提交策略选择到游戏管线，格式: combat_strategy_<策略名>
    // 注：不在此处清除 constraint，保留给下一轮管线的 injectCombatConstraint 消费
    // 管线消费后 cc 变为 null，useEffect 会自动隐藏面板
    if (onSelectStrategem) {
      onSelectStrategem(`combat_strategy_${strategyLabel}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-45 flex items-end justify-center pb-6 transition-all duration-300 pointer-events-none"
      style={{ backgroundColor: showContent ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0)' }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl overflow-hidden pointer-events-auto transition-all duration-300"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          backgroundColor: 'var(--gu-bg-standard)',
          border: '1px solid var(--gu-trace-gold-dim)',
          boxShadow: 'var(--gu-shadow-lg)',
        }}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-bold text-rg-gold-400">{cc.scale === 'battle' ? '大规模战斗' : '战斗遭遇'}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-rg-paper-200/40">成功概率</span>
              <span className="text-sm font-bold" style={{ color: chanceColor }}>{Math.round(successChance * 100)}%</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--gu-bg-elevated)', color: chanceColor, border: `1px solid ${chanceColor}` }}>{riskLabel}</span>
            </div>
          </div>

          {cc.narrativeStyle && (
            <div className="text-xs text-rg-paper-200/60 mb-3 leading-relaxed">{cc.narrativeStyle.substring(0, 200)}</div>
          )}

          <div className="flex gap-2">
            {Array.from({ length: strategyCount }, (_, i) => {
              const labels = ['正面迎战', '迂回作战', '埋伏设陷', '观望待机'];
              const risks = ['高风险——直面敌人主力', '中等风险——需要地形优势', '中等风险——需要判断时机', '低风险——但可能错失战机'];
              const label = labels[i] || `选项${i + 1}`;
              return (
                <button
                  key={i}
                  className="flex-1 py-2 rounded-lg text-xs font-panel font-medium transition-all duration-150 cursor-pointer active:scale-95 text-center"
                  style={{ backgroundColor: 'var(--gu-trace-gold-dim)', color: 'var(--gu-trace-gold)', border: '1px solid var(--gu-trace-gold)' }}
                  onClick={() => handleSelect(label)}
                >
                  <div>{label}</div>
                  <div className="text-[10px] text-rg-paper-200/40 mt-0.5">{risks[i] || ''}</div>
                </button>
              );
            })}
          </div>

          <button
            className="w-full mt-3 py-1.5 rounded-lg text-xs font-panel text-rg-paper-200/40 hover:text-rg-paper-200/70 transition-all cursor-pointer"
            onClick={handleDismiss}
          >关闭</button>
        </div>
      </div>
    </div>
  );
}

function realmToNum(realm: string): number {
  const map: Record<string, number> = { '凡人': 0, '一转蛊师': 1, '二转蛊师': 2, '三转蛊师': 3, '四转蛊师': 4, '五转蛊师': 5 };
  return map[realm] ?? 1;
}
