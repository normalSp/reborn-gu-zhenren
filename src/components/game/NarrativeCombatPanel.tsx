import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import type { CombatConstraint } from '../../types';

interface NarrativeCombatPanelProps {
  onSelectStrategem?: (strategy: string) => void;
}

export function NarrativeCombatPanel({ onSelectStrategem }: NarrativeCombatPanelProps) {
  const cc = useStore((s: any) => s.transientCombatConstraint) as CombatConstraint | null;
  const setCC = useStore((s: any) => s.setTransientCombatConstraint) as ((c: CombatConstraint | null) => void) | undefined;
  const setFlag = useStore((s: any) => s.setFlag) as ((key: string, value: any) => void) | undefined;
  const turn = useStore((s: any) => s.turn) as number | undefined;
  const realm = useStore((s: any) => s.realm) as string | undefined;
  const guInventory = useStore((s: any) => s.gu_inventory) as any[] | undefined;

  const [visible, setVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (cc) {
      setVisible(true);
      const t = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(t);
    }

    setShowContent(false);
    const t = setTimeout(() => setVisible(false), 300);
    return () => clearTimeout(t);
  }, [cc]);

  if (!visible || !cc) return null;

  const realmNum = realmToNum(realm || '一转蛊师');
  const realmDiff = realmNum - (cc.recommendedRealm || 2);
  const baseChance = cc.baseChance || 0.5;
  const realmWeight = cc.statBridge?.realmWeight || 0.15;
  const guTags = guInventory?.flatMap((g: any) => (cc.statBridge?.guTagInfluence || [])
    .filter((t: any) => t.tag === g.path)
    .map((t: any) => t.bonus)) || [];
  const guBonus = guTags.reduce((sum: number, value: number) => sum + (value || 0), 0);
  const successChance = Math.max(0.05, Math.min(0.95, baseChance + realmDiff * realmWeight + guBonus));
  const chanceColor = successChance >= 0.7
    ? 'var(--gu-life-verdant)'
    : successChance >= 0.4
      ? 'var(--gu-trace-gold)'
      : 'var(--gu-life-crimson)';
  const riskLabel = successChance >= 0.7 ? '高胜算' : successChance >= 0.4 ? '有风险' : '极大风险';
  const strategyCount = Math.min(cc.strategicChoiceCount || 2, 4);

  const handleDismiss = () => {
    setCC?.(null);
  };

  const handleSelect = (strategyLabel: string) => {
    setCC?.(null);
    setFlag?.('_lastCombatStrategy', {
      strategy: strategyLabel,
      sceneId: cc.sceneId || cc.scale || 'narrative',
      turn: turn || 1,
    });
    onSelectStrategem?.(`combat_strategy_${strategyLabel}`);
  };

  return (
    <div
      className="fixed inset-0 z-45 flex items-end justify-center px-3 pb-3 sm:pb-6 transition-all duration-300 pointer-events-none"
      style={{ backgroundColor: showContent ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0)' }}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden pointer-events-auto transition-all duration-300 max-h-[82vh] overflow-y-auto"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          backgroundColor: 'var(--gu-bg-standard)',
          border: '1px solid var(--gu-trace-gold-dim)',
          boxShadow: 'var(--gu-shadow-lg)',
        }}
      >
        <div className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="text-sm font-bold text-rg-gold-400">
              {cc.scale === 'battle' ? '大规模战斗' : '战斗遭遇'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-rg-paper-200/40">成功概率</span>
              <span className="text-sm font-bold" style={{ color: chanceColor }}>{Math.round(successChance * 100)}%</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'var(--gu-bg-elevated)', color: chanceColor, border: `1px solid ${chanceColor}` }}
              >
                {riskLabel}
              </span>
            </div>
          </div>

          {cc.narrativeStyle && (
            <div className="text-xs text-rg-paper-200/60 mb-3 leading-relaxed">
              {cc.narrativeStyle.substring(0, 220)}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: strategyCount }, (_, i) => {
              const labels = ['正面迎战', '迂回作战', '埋伏设陷', '观察待机'];
              const risks = [
                '高风险，直面敌人主力',
                '中等风险，需要地形优势',
                '中等风险，需要判断时机',
                '低风险，但可能错失战机',
              ];
              const label = labels[i] || `选项${i + 1}`;
              return (
                <button
                  key={label}
                  className="min-h-14 py-2 px-2 rounded-lg text-xs font-panel font-medium transition-all duration-150 cursor-pointer active:scale-95 text-center"
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
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function realmToNum(realm: string): number {
  const map: Record<string, number> = {
    凡人: 0,
    一转蛊师: 1,
    二转蛊师: 2,
    三转蛊师: 3,
    四转蛊师: 4,
    五转蛊师: 5,
  };
  return map[realm] ?? 1;
}
