import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { refineGu } from '../../engine/refine-engine';
import guDbRaw from '../../canon/gu-database.json';

const GU_DB = guDbRaw as Record<string, any>;

export function RefinePanel() {
  const inventory = useStore(s => s.inventory);
  const materialBag = useStore(s => (s as any).materialBag || {}) as Record<string, number>;
  const daoMarks = useStore(s => (s as any).pathBuild?.dao_marks || {}) as Record<string, number>;
  const talents = useStore(s => (s as any).selectedTalents || []) as any[];
  const refinedGuCount = useStore(s => (s as any).refinedGuCount || 0) as number;

  const [selectedGu, setSelectedGu] = useState<string | null>(null);
  const [refineResult, setRefineResult] = useState<{ success: boolean; message: string } | null>(null);

  // 可炼制的蛊虫 = inventory中在gu-database中有refineMaterials且非仙蛊的
  const refinableList = useMemo(() => {
    return inventory.filter(g => {
      const spec = GU_DB[g.specId] || GU_DB[g.name];
      if (!spec || spec.isImmortalGu || spec.isImmortalGu) return false;
      const mats = spec.refineMaterials;
      return mats && !mats.includes('不可凡蛊炼制');
    });
  }, [inventory]);

  const selectedSpec = selectedGu ? (GU_DB[selectedGu] || null) : null;

  // 成功率预览
  const successPreview = useMemo(() => {
    if (!selectedSpec) return null;
    const diff = selectedSpec.refineDifficulty || 1;
    let rate = Math.max(0.1, 1 - diff * 0.1);
    const lianDao = daoMarks['炼道'] || 0;
    rate += lianDao * 0.02;
    const hasLianDao = talents.some((t: any) => t.id === 'talent_hundred_refinements');
    const hasSavant = talents.some((t: any) => t.id === 'talent_refinement_savant' || t.id === 'ti_refine_genius');
    if (hasLianDao) rate += 0.15;
    if (hasSavant) rate += 0.20;
    return Math.min(0.95, rate);
  }, [selectedSpec, daoMarks, talents]);

  const handleRefine = () => {
    if (!selectedSpec || !selectedGu) return;
    const guItem = inventory.find(g => g.name === selectedGu || g.specId === selectedGu);
    if (!guItem) return;

    const result = refineGu({
      specId: guItem.specId || guItem.name,
      name: guItem.name,
      tier: guItem.tier,
      path: (guItem as any).path || '未知',
      refineMaterials: selectedSpec.refineMaterials,
      refineDifficulty: selectedSpec.refineDifficulty || 1,
    });
    setRefineResult({ success: result.success, message: result.message });
  };

  const hasLianDao = talents.some((t: any) => t.id === 'talent_hundred_refinements');
  const hasSavant = talents.some((t: any) => t.id === 'talent_refinement_savant' || t.id === 'ti_refine_genius');

  return (
    <div className="h-full flex flex-col bg-rg-ink-900/95 text-rg-paper-200 font-panel">
      {/* Header */}
      <div className="p-4 border-b border-rg-ink-700/50">
        <h3 className="text-sm font-semibold text-rg-gold tracking-wider">炼蛊</h3>
        <p className="text-[11px] text-rg-paper-200/40 mt-1">累计炼制: {refinedGuCount} 次</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧: 可炼蛊虫列表 */}
        <div className="w-1/2 border-r border-rg-ink-700/30 overflow-y-auto p-2">
          <p className="text-[10px] text-rg-paper-200/30 mb-2 px-1">拥有蛊虫({refinableList.length})</p>
          {refinableList.length === 0 ? (
            <p className="text-xs text-rg-paper-200/20 italic px-1">暂无可炼制蛊虫</p>
          ) : (
            refinableList.map(gu => (
              <button
                key={gu.id}
                onClick={() => { setSelectedGu(gu.specId || gu.name); setRefineResult(null); }}
                className={`w-full text-left px-2 py-1.5 rounded-sm mb-1 text-xs transition-colors ${
                  selectedGu === (gu.specId || gu.name)
                    ? 'bg-rg-gold/15 border border-rg-gold/30 text-rg-gold'
                    : 'bg-rg-ink-800/50 border border-rg-ink-700/20 hover:border-rg-gold/20'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>{gu.name}</span>
                  <span className="text-[9px] text-rg-paper-200/30 ml-auto">{gu.tier}转</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 右侧: 详情 */}
        <div className="w-1/2 p-3 overflow-y-auto">
          {selectedSpec ? (
            <div className="space-y-3">
              <div>
                <span className="text-xs text-rg-paper-200/40">蛊虫</span>
                <p className="text-sm text-rg-paper-100 font-semibold">{selectedGu}</p>
              </div>
              <div>
                <span className="text-xs text-rg-paper-200/40">流派</span>
                <p className="text-xs text-rg-paper-200/80">{selectedSpec.path || '未知'} · {selectedSpec.tier || '?'}转</p>
              </div>
              <div>
                <span className="text-xs text-rg-paper-200/40">所需蛊材</span>
                <p className="text-xs text-rg-paper-200/60">{selectedSpec.refineMaterials || '无'}</p>
              </div>

              {/* 成功率预览 */}
              {successPreview !== null && (
                <div>
                  <span className="text-xs text-rg-paper-200/40">成功率</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-3 bg-rg-ink-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${successPreview >= 0.7 ? 'bg-rg-jade-400' : successPreview >= 0.4 ? 'bg-amber-400' : 'bg-rg-blood-400'}`}
                        style={{ width: `${Math.round(successPreview * 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${successPreview >= 0.7 ? 'text-rg-jade-400' : successPreview >= 0.4 ? 'text-amber-400' : 'text-rg-blood-400'}`}>
                      {Math.round(successPreview * 100)}%
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1 text-[9px] text-rg-paper-200/30">
                    <span>炼道道痕: +{Math.round((daoMarks['炼道'] || 0) * 2)}%</span>
                    {hasLianDao && <span>百炼蛊师: +15%</span>}
                    {hasSavant && <span>炼道奇才: +20%</span>}
                  </div>
                </div>
              )}

              {/* 炼制按钮 */}
              <button
                onClick={handleRefine}
                className="w-full py-2 rounded-sm text-xs font-button font-semibold bg-rg-gold text-rg-ink-900 hover:brightness-115 transition-colors"
              >
                开始炼制
              </button>

              {/* 结果提示 */}
              {refineResult && (
                <div className={`p-2 rounded-sm text-xs ${
                  refineResult.success ? 'bg-rg-jade-400/10 border border-rg-jade-400/30 text-rg-jade-400' : 'bg-rg-blood-400/10 border border-rg-blood-400/30 text-rg-blood-400'
                }`}>
                  {refineResult.message}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-rg-paper-200/20 italic">选择左侧蛊虫查看炼制详情</p>
          )}
        </div>
      </div>
    </div>
  );
}
