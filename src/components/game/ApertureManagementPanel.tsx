/**
 * ═══ 仙窍资源节点管理面板 — P4 ═══
 * 展示每个资源节点的产出内容、速率、质量等级，支持开关切换
 */
import { useMemo } from 'react';
import { useStore } from '../../store';
import type { ImmortalAperture, ResourceNode, ApertureStorage } from '../../types';

const GRADE_COLORS: Record<string, string> = {
  '普通': 'text-rg-paper-200/60',
  '精品': 'text-rg-jade-400',
  '稀有': 'text-rg-gold',
  '仙材': 'text-rg-blood-400',
};

const GRADE_BG: Record<string, string> = {
  '普通': 'bg-rg-ink-700/40',
  '精品': 'bg-rg-jade-400/10',
  '稀有': 'bg-rg-gold/10',
  '仙材': 'bg-rg-blood-400/10',
};

export function ApertureManagementPanel() {
  const profile = useStore(s => s.profile);
  const aperture = useStore(s => s.aperture) as ImmortalAperture | null;
  const apertureInventory = useStore(s => (s as any).apertureInventory) as ApertureStorage | null;
  const setNodeActive = useStore(s => (s as any).setNodeActive) as ((nodeId: string, active: boolean) => void) | undefined;

  const isImmortal = profile.realm.grand >= 6;
  const nodes = aperture?.resource_nodes || [];

  // 汇总仙窍存储
  const materialSummary = useMemo(() => {
    if (!apertureInventory) return { guCount: 0, matCount: 0, immatCount: 0, matEntries: [] as [string, number][], immatEntries: [] as [string, number][] };
    return {
      guCount: apertureInventory.gu?.length || 0,
      matCount: Object.values(apertureInventory.materials || {}).reduce((a, b) => a + b, 0),
      immatCount: Object.values(apertureInventory.immortalMaterials || {}).reduce((a, b) => a + b, 0),
      matEntries: Object.entries(apertureInventory.materials || {}).filter(([, q]) => q > 0),
      immatEntries: Object.entries(apertureInventory.immortalMaterials || {}).filter(([, q]) => q > 0),
    };
  }, [apertureInventory]);

  if (!isImmortal || !aperture || aperture.type === 'mortal') {
    return (
      <div className="h-full flex items-center justify-center bg-rg-ink-900/95">
        <p className="text-rg-ink-300 text-sm font-panel">仙窍未开辟——六转升仙后解锁</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-rg-ink-900/95 text-rg-paper-200 font-panel overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-rg-ink-700/50">
        <h3 className="text-sm font-semibold text-rg-gold tracking-wider">
          仙窍 · {aperture.grade || aperture.type}
        </h3>
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-rg-paper-200/50">
          <span>面积: {aperture.area_mu}万亩</span>
          <span>流速比: 1:{aperture.time_flow_ratio}</span>
          <span>资源节点: {nodes.length}个</span>
          <span>天灾倒计时: {aperture.disaster_countdown}回合</span>
        </div>
        <div className="mt-2 text-[10px] text-rg-paper-200/30">
          仙窍存储: {materialSummary.guCount}蛊虫 · {materialSummary.matCount}蛊材 · {materialSummary.immatCount}仙材
        </div>
      </div>

      {/* 资源节点列表 */}
      <div className="p-4">
        <h4 className="text-xs font-semibold text-rg-paper-200/60 mb-3">
          资源节点 ({nodes.length})
        </h4>
        {nodes.length === 0 ? (
          <p className="text-[10px] text-rg-paper-200/20 italic py-4">暂无资源节点——升仙自动生成，或后续开辟</p>
        ) : (
          <div className="space-y-2">
            {nodes.map(node => (
              <div key={node.id}
                className={`rounded-md border p-3 flex items-center justify-between ${node.active ? GRADE_BG[node.grade] || 'bg-rg-ink-700/40' : 'bg-rg-ink-800/20 border-rg-ink-700/10 opacity-60'}`}
                style={{ borderColor: node.active ? undefined : undefined }}>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-narrative ${node.active ? 'text-rg-paper-200' : 'text-rg-paper-200/30'}`}>
                      {node.name}
                    </span>
                    <span className={`text-[9px] px-1 py-0.5 rounded-sm ${GRADE_COLORS[node.grade]} ${GRADE_BG[node.grade]}`}>
                      {node.grade}
                    </span>
                  </div>
                  <span className="text-[10px] text-rg-paper-200/40">
                    产出速率: {node.output_rate}/回合 · 质量: {node.quality}%
                  </span>
                </div>
                <button
                  onClick={() => setNodeActive?.(node.id, !node.active)}
                  className={`text-[10px] font-button px-2 py-1 rounded-sm border transition-micro ${
                    node.active
                      ? 'border-rg-jade-400/30 text-rg-jade-400 hover:bg-rg-jade-400/10'
                      : 'border-rg-ink-400/20 text-rg-paper-200/30 hover:border-rg-ink-400/40'
                  }`}>
                  {node.active ? '启用中' : '已关闭'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 仙窍存储快照 */}
      {(materialSummary.matEntries.length > 0 || materialSummary.immatEntries.length > 0) && (
        <div className="p-4 border-t border-rg-ink-700/50">
          <h4 className="text-xs font-semibold text-rg-paper-200/60 mb-2">仙窍蛊材库存</h4>
          <div className="grid grid-cols-2 gap-1.5">
            {materialSummary.matEntries.slice(0, 8).map(([name, qty]) => (
              <div key={name} className="flex justify-between text-[10px] px-2 py-1 bg-rg-ink-700/40 rounded-sm">
                <span className="text-rg-paper-200/60 truncate">{name}</span>
                <span className="text-rg-paper-200/30">×{qty}</span>
              </div>
            ))}
            {materialSummary.immatEntries.slice(0, 4).map(([name, qty]) => (
              <div key={name} className="flex justify-between text-[10px] px-2 py-1 bg-rg-blood-400/10 rounded-sm">
                <span className="text-rg-blood-400/80 truncate">{name}</span>
                <span className="text-rg-blood-400/60">×{qty}</span>
              </div>
            ))}
          </div>
          {(materialSummary.matEntries.length > 8 || materialSummary.immatEntries.length > 4) && (
            <p className="text-[9px] text-rg-paper-200/20 mt-1">更多蛊材请在物资袋查看</p>
          )}
        </div>
      )}
    </div>
  );
}
