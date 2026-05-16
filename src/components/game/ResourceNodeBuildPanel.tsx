/**
 * ═══ v0.7.0 资源点建造/升级面板 — ResourceNodeBuildPanel.tsx ═══
 * 设计大纲: 建造选择列表（按仙窍等级解锁）+建造消耗显示+成功率预估+升级按钮
 * ~150行
 */
import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import type { ResourceNode, ResourceNodeBuildCost, ImmortalAperture, MortalAperture } from '../../types';

// 从economy.json读取的建造配置（编译时静态导入）
const NODE_TYPE_CONFIG: Array<{
  type: string; name: string; grade: ResourceNode['grade'];
  minApertureLevel: number; description: string;
  cost: number; successRate: number;
}> = [
  { type: '月华草', name: '月华草田', grade: '普通', minApertureLevel: 1, description: '基础草药资源，夜间产出翻倍', cost: 100, successRate: 60 },
  { type: '石粉', name: '石粉矿脉', grade: '普通', minApertureLevel: 1, description: '土道蛊虫基础食料', cost: 100, successRate: 60 },
  { type: '铁屑', name: '铁砂坑', grade: '普通', minApertureLevel: 1, description: '金道蛊虫炼化辅料', cost: 100, successRate: 60 },
  { type: '灵草', name: '灵草园', grade: '精品', minApertureLevel: 2, description: '木道材料，产出精品蛊材', cost: 200, successRate: 55 },
  { type: '金粉', name: '金沙溪', grade: '精品', minApertureLevel: 2, description: '高纯度金道材料', cost: 200, successRate: 55 },
  { type: '冰晶', name: '冰晶矿', grade: '精品', minApertureLevel: 2, description: '冰道材料', cost: 200, successRate: 55 },
  { type: '兽肉', name: '兽场', grade: '精品', minApertureLevel: 2, description: '力道蛊虫食料来源', cost: 200, successRate: 55 },
  { type: '雷击木', name: '雷击林', grade: '稀有', minApertureLevel: 3, description: '雷道稀有材料', cost: 400, successRate: 50 },
  { type: '光耀石', name: '光耀矿脉', grade: '稀有', minApertureLevel: 3, description: '光道稀有材料', cost: 400, successRate: 50 },
  { type: '暗影尘', name: '暗影洞穴', grade: '稀有', minApertureLevel: 3, description: '暗道稀有材料', cost: 400, successRate: 50 },
  { type: '空间晶石', name: '空间裂隙', grade: '仙材', minApertureLevel: 4, description: '宇道仙材，极为珍贵', cost: 800, successRate: 45 },
  { type: '光阴砂', name: '光阴潭', grade: '仙材', minApertureLevel: 4, description: '宙道仙材', cost: 800, successRate: 45 },
  { type: '道痕结晶', name: '道痕矿脉', grade: '仙材', minApertureLevel: 4, description: '通用仙材，提升道痕密度', cost: 800, successRate: 45 },
];

export const ResourceNodeBuildPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const aperture = useStore(s => (s as any).aperture as ImmortalAperture | MortalAperture | null);
  const addResourceNode = useStore(s => (s as any).addResourceNode);
  const upgradeResourceNode = useStore(s => (s as any).upgradeResourceNode);
  const currency = useStore(s => s.currency);
  const immortalCurrency = useStore(s => s.immortalCurrency);
  const attributes = useStore(s => s.attributes);
  const [message, setMessage] = useState<string | null>(null);

  const talent = attributes.资质;
  const currentCurrency = immortalCurrency || currency || 0;

  // 当前仙窍等级（用于解锁判定）
  const apertureLevel = useMemo(() => {
    if (!aperture) return 1;
    // 福地等级映射：小福地=1, 中等=2, 上等=3
    const grade = (aperture as any).grade;
    if (aperture.type === 'mortal') return 1;
    if (grade === '上等福地' || aperture.type === '洞天') return 3;
    if (grade === '中等福地') return 2;
    return 1;
  }, [aperture]);

  // 可用建造类型（按仙窍等级解锁）
  const availableTypes = useMemo(() => {
    return NODE_TYPE_CONFIG.filter(n => n.minApertureLevel <= apertureLevel);
  }, [apertureLevel]);

  // 已有节点名（防止重复建造）
  const existingNodeNames = useMemo(() => {
    if (!aperture || aperture.type === 'mortal') return new Set<string>();
    return new Set((aperture.resource_nodes || []).map(n => n.name));
  }, [aperture]);

  const buildableTypes = availableTypes.filter(n => !existingNodeNames.has(n.name));

  const handleBuild = (nodeConfig: typeof NODE_TYPE_CONFIG[0]) => {
    const adjustedSuccessRate = Math.min(95, nodeConfig.successRate + talent * 2);
    if (currentCurrency < nodeConfig.cost) {
      setMessage(`元石不足！需要${nodeConfig.cost}，当前${currentCurrency}`);
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    const result = addResourceNode(nodeConfig.type, nodeConfig.name, nodeConfig.grade);
    if (result.success) {
      setMessage(`✅ ${nodeConfig.name}建造成功！（成功率${adjustedSuccessRate}%）`);
    } else {
      setMessage(`❌ ${nodeConfig.name}建造失败...（成功率${adjustedSuccessRate}%）`);
    }
    setTimeout(() => setMessage(null), 2500);
  };

  const handleUpgrade = (nodeId: string) => {
    const result = upgradeResourceNode(nodeId);
    if (result.success) {
      setMessage(`✅ 升级成功！品质+${result.qualityGain}`);
    } else {
      setMessage('❌ 升级失败...');
    }
    setTimeout(() => setMessage(null), 2000);
  };

  if (!aperture || aperture.type === 'mortal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-gray-400 text-sm" onClick={e => e.stopPropagation()}>
          升仙后方可建造资源节点。
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto text-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-amber-400 mb-2">开辟资源点</h2>
        <div className="text-xs text-gray-500 mb-4">
          仙窍等级: {apertureLevel} · 当前元石: {currentCurrency} · 资质加成: +{talent * 2}%
        </div>

        {message && (
          <div className={`mb-3 p-2 rounded text-sm text-center ${message.startsWith('✅') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
            {message}
          </div>
        )}

        {/* 建造新节点 */}
        <div className="mb-4">
          <h3 className="text-sm text-gray-400 mb-2">可建造 ({buildableTypes.length}种)</h3>
          {buildableTypes.length === 0 ? (
            <p className="text-gray-600 text-sm">暂无可建造的新类型</p>
          ) : (
            <div className="space-y-2">
              {buildableTypes.map(n => (
                <div key={n.name} className="flex items-center justify-between bg-gray-800 rounded p-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{n.name} <span className="text-xs text-gray-500">({n.grade})</span></div>
                    <div className="text-xs text-gray-600 truncate">{n.description}</div>
                    <div className="text-xs text-gray-500">
                      消耗:{n.cost}元石 · 成功率:{Math.min(95, n.successRate + talent * 2)}%
                    </div>
                  </div>
                  <button
                    className="ml-2 text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded flex-shrink-0 disabled:opacity-50"
                    onClick={() => handleBuild(n)}
                    disabled={currentCurrency < n.cost}
                  >建造</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 已有节点升级 */}
        <div>
          <h3 className="text-sm text-gray-400 mb-2">已有节点 ({aperture.resource_nodes.length})</h3>
          <div className="space-y-2">
            {aperture.resource_nodes.map(node => (
              <div key={node.id} className="flex items-center justify-between bg-gray-800 rounded p-2">
                <div>
                  <div className="text-sm">
                    {node.name}
                    <span className={`ml-1 text-xs ${node.active ? 'text-green-400' : 'text-red-400'}`}>{node.active ? '活跃' : '关闭'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    品质:{node.quality} · 产出:{node.output_rate}/轮 · {node.grade}
                  </div>
                </div>
                <button
                  className="ml-2 text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded flex-shrink-0 disabled:opacity-50"
                  onClick={() => handleUpgrade(node.id)}
                  disabled={node.quality >= 100}
                >升级</button>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
};
