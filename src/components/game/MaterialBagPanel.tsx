/**
 * ═══ 蛊材物资袋面板 — P4 新增 ═══
 * 展示 materialBag 内容，按等级分组（普通/精品/稀有/仙材）
 * 容量进度条，materialBagSize / materialBagCapacity
 */
import { useMemo } from 'react';
import { useStore } from '../../store';
import { MATERIAL_GRADE_MAP } from '../../engine/material-region';
import type { MaterialGrade } from '../../engine/refine-engine';
import { getMaterialOverloadStatus } from '../../engine/material-overload';

const GRADE_ORDER: MaterialGrade[] = ['普通', '精品', '稀有', '仙材'];
const GRADE_LABELS: Record<MaterialGrade, string> = {'普通':'普通蛊材','精品':'精品蛊材','稀有':'稀有蛊材','仙材':'仙材'};
const GRADE_COLORS: Record<MaterialGrade, string> = {
  '普通': 'text-rg-paper-200/60', '精品': 'text-rg-jade-400', '稀有': 'text-rg-gold', '仙材': 'text-rg-blood-400'
};
const GRADE_BG: Record<MaterialGrade, string> = {
  '普通': 'bg-rg-ink-700/40', '精品': 'bg-rg-jade-400/10', '稀有': 'bg-rg-gold/10', '仙材': 'bg-rg-blood-400/10'
};
const GRADE_BORDER: Record<MaterialGrade, string> = {
  '普通': 'border-rg-ink-300/10', '精品': 'border-rg-jade-400/20', '稀有': 'border-rg-gold/20', '仙材': 'border-rg-blood-400/20'
};

const _MB_EMPTY = Object.freeze({}) as Record<string, number>;

export function MaterialBagPanel() {
  const materialBag = useStore(s => s.materialBag || _MB_EMPTY) as Record<string, number>;
  const materialBagCapacity = useStore(s => (s as any).materialBagCapacity || 20) as number;
  const aperture = useStore(s => s.aperture);

  // 按等级分组
  const grouped = useMemo(() => {
    const groups: Record<MaterialGrade, Record<string, number>> = { '普通': {}, '精品': {}, '稀有': {}, '仙材': {} };
    for (const [name, qty] of Object.entries(materialBag)) {
      if (qty <= 0) continue;
      const grade = MATERIAL_GRADE_MAP[name] || '普通';
      groups[grade][name] = qty;
    }
    return groups;
  }, [materialBag]);

  const totalCount = useMemo(() => {
    return Object.values(materialBag).reduce((a: number, b: number) => a + b, 0);
  }, [materialBag]);

  const usagePercent = Math.min(100, Math.round((totalCount / Math.max(1, materialBagCapacity)) * 100));
  const overloadStatus = useMemo(
    () => getMaterialOverloadStatus({ materialBag, capacity: materialBagCapacity }),
    [materialBag, materialBagCapacity],
  );

  return (
    <div className="rg-panel-surface h-full flex flex-col text-rg-paper-200 font-panel">
      {/* Header */}
      <div className="p-4 border-b border-rg-ink-700/50">
        <h3 className="text-sm font-semibold text-rg-gold tracking-wider">蛊材物资袋</h3>

        {/* 容量进度条 */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-rg-paper-200/40">容量</span>
            <span className={`${usagePercent >= 90 ? 'text-rg-blood-400' : usagePercent >= 70 ? 'text-rg-gold' : 'text-rg-paper-200/60'}`}>
              {totalCount} / {materialBagCapacity}
            </span>
          </div>
          <div className="h-2 bg-rg-ink-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-rg-blood-400' : usagePercent >= 70 ? 'bg-rg-gold' : 'bg-rg-jade-400'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        {overloadStatus.overloaded && (
          <div className="mt-3 rounded-sm border border-rg-blood-400/30 bg-rg-blood-400/10 p-2 text-[10px] leading-relaxed text-rg-blood-400">
            <div className="font-semibold">物资袋超载 {overloadStatus.excess} 份</div>
            <div className="text-rg-paper-200/45 mt-0.5">
              野外采集、撤离和逃脱会受影响；请先到商会出售蛊材，或整理资源后再行动。
            </div>
          </div>
        )}

        {/* 洞天福地状态 */}
        {aperture && aperture.type !== 'mortal' && (
          <p className="text-[10px] text-rg-paper-200/30 mt-2">
            仙窍 · {aperture.grade || '未知'} · 面积{(aperture as any).area_mu || '?'}亩
          </p>
        )}
      </div>

      {/* 材料列表 */}
      <div className="rg-scrollable flex-1 overflow-y-auto p-3 space-y-3">
        {Object.entries(materialBag).length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs text-rg-paper-200/20 italic">物资袋空空如也——探索、战斗、商会获取蛊材</p>
          </div>
        ) : (
          GRADE_ORDER.map(grade => {
            const items = grouped[grade];
            const itemEntries = Object.entries(items);
            if (itemEntries.length === 0) return null;
            return (
              <div key={grade}>
                <h4 className={`text-[10px] font-semibold mb-1.5 px-1 ${GRADE_COLORS[grade]}`}>
                  {GRADE_LABELS[grade]} ({itemEntries.reduce((s, [, q]) => s + q, 0)})
                </h4>
                <div className="space-y-0.5">
                  {itemEntries.map(([name, qty]) => (
                    <div key={name}
                      className={`rg-explain-card flex items-center justify-between px-2 py-1 text-xs ${GRADE_BG[grade]} ${GRADE_BORDER[grade]}`}>
                      <span className="truncate mr-2">{name}</span>
                      <span className="text-rg-paper-200/40 shrink-0">×{qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
