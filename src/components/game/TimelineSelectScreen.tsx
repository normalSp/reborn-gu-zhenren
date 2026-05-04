import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import timelineNodesRaw from '../../canon/timeline-nodes.json';
import type { TimelineNode } from '../../store/slices/timelineSlice';

const TIMELINE_DATA = (timelineNodesRaw as any).nodes as TimelineNode[];

interface TimelineSelectProps {
  onNext: () => void;
  onBack: () => void;
}

// ─── 时间线按叙事顺序排列的节点分组 ───
const ARC_GROUPS: { label: string; color: string; nodeIds: string[]; isRecommended?: boolean }[] = [
  { label: '青茅山篇', color: 'border-l-rg-jade-400', nodeIds: ['qingmaoshan', 'shanglu_qiusheng'], isRecommended: true },
  { label: '南疆篇', color: 'border-l-rg-jade-400', nodeIds: ['nanjiang_chutan', 'shili_jueqi'] },
  { label: '三王山篇', color: 'border-l-amber-400', nodeIds: ['sanwang_yitian'] },
  { label: '北原篇', color: 'border-l-cyan-400', nodeIds: ['north_youth', 'north_wangting'] },
  { label: '东海篇', color: 'border-l-blue-400', nodeIds: ['donghai_island', 'donghai_seaclan'] },
  { label: '西漠篇', color: 'border-l-orange-400', nodeIds: ['ximo_walker', 'ximo_oasis'] },
  { label: '中洲篇', color: 'border-l-purple-400', nodeIds: ['zhongzhou_entry'] },
  { label: '义天山篇', color: 'border-l-rg-blood-400', nodeIds: ['yitian_wind', 'yitian_peak'] },
  { label: '逆流河篇', color: 'border-l-rg-gold', nodeIds: ['nilu_ascent'] },
];

const REALM_LABELS: Record<number, string> = {
  1: '一转蛊师', 2: '二转蛊师', 3: '三转蛊师', 4: '四转蛊师', 5: '五转蛊师',
  6: '六转蛊仙', 7: '七转蛊仙', 8: '八转蛊仙', 9: '九转蛊尊',
};

const DOMAIN_COLORS: Record<string, string> = {
  '南疆': 'text-rg-jade-400 border-rg-jade-400/30 bg-rg-jade-400/5',
  '北原': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  '东海': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  '西漠': 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  '中洲': 'text-purple-400 border-purple-400/30 bg-purple-400/5',
};

export function TimelineSelectScreen({ onNext, onBack }: TimelineSelectProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  // v1.6: gameMode合并到TimelineSelect，初始默认'canon'
  const [gameMode, setLocalMode] = useState<'canon' | 'if'>('canon');
  const selectNode = useStore(s => (s as any).selectNode);
  const selectedNodeId = useStore(s => (s as any).selectedNodeId);
  const setGameMode = useStore(s => (s as any).setGameMode);

  const handleModeChange = (mode: 'canon' | 'if') => {
    setLocalMode(mode);
    setGameMode(mode);
  };

  const handleSelect = (node: TimelineNode) => {
    selectNode(node.id, TIMELINE_DATA);
  };

  const handleConfirm = () => {
    if (selectedNodeId) onNext();
  };

  const nodeMap = useMemo(() => new Map(TIMELINE_DATA.map(n => [n.id, n])), []);

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center py-8 px-4 overflow-y-auto">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-rg-gold font-narrative tracking-wider">抉择天命</h2>
          <p className="text-rg-paper-200/50 text-sm font-panel mt-2 tracking-[0.1em]">
            选择你在蛊界时间线中的起点——从哪里开始你的传奇
          </p>
          <div className="mt-3 w-12 h-[1px] bg-rg-gold/30 mx-auto" />
          {/* v1.6: gameMode横幅合并自ModeSelect */}
          <div className="flex justify-center gap-2 mt-5">
            <button
              onClick={() => handleModeChange('canon')}
              className={`text-xs font-panel px-4 py-1.5 rounded-full border transition-colors ${
                gameMode === 'canon'
                  ? 'border-rg-gold/60 bg-rg-gold/10 text-rg-gold'
                  : 'border-rg-ink-300/15 text-rg-paper-200/40 hover:text-rg-paper-200/70'
              }`}
            >
              正史线 — 原著命运
            </button>
            <button
              onClick={() => handleModeChange('if')}
              className={`text-xs font-panel px-4 py-1.5 rounded-full border transition-colors ${
                gameMode === 'if'
                  ? 'border-rg-jade-400/60 bg-rg-jade-400/10 text-rg-jade-400'
                  : 'border-rg-ink-300/15 text-rg-paper-200/40 hover:text-rg-paper-200/70'
              }`}
            >
              IF线 — 自由探索
            </button>
          </div>
        </div>

        {/* Timeline — vertical scroll */}
        <div className="relative">
          {/* 竖向时间线 */}
          <div className="absolute left-8 top-4 bottom-4 w-[2px] bg-rg-ink-300/15" />

          <div className="flex flex-col gap-4 pl-12 pr-2">
            {ARC_GROUPS.map(group => {
              const arcNodes = group.nodeIds.map(id => nodeMap.get(id)).filter(Boolean) as TimelineNode[];
              if (arcNodes.length === 0) return null;

              return (
                <div key={group.label} className="relative">
                  {/* Arc label */}
                  <div className="flex items-center gap-2 mb-2 -ml-12">
                    <div className={`w-2 h-2 rounded-full border-2 ${group.color.replace('border-l-', 'border-')}`} />
                    <span className="text-xs font-panel text-rg-paper-200/40 tracking-wider">{group.label}</span>
                  </div>

                  {/* Arc nodes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-2">
                    {arcNodes.map((node, nodeIdx) => {
                      const isSelected = selectedNodeId === node.id;
                      const isHovered = hoveredNode === node.id;
                      const isImmortal = node.talentCategory === 'immortal';
                      const domainStyle = DOMAIN_COLORS[node.domain] || DOMAIN_COLORS['南疆'];
                      // v1.6: 推荐组+第一个节点=推荐起点
                      const isRecommended = group.isRecommended && nodeIdx === 0;

                      return (
                        <button
                          key={node.id}
                          onClick={() => handleSelect(node)}
                          onMouseEnter={() => setHoveredNode(node.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                          className={`text-left p-3 rounded-sm border transition-all duration-200 relative
                            ${isSelected
                              ? 'border-rg-gold/60 bg-rg-gold/10 ring-1 ring-rg-gold/20'
                              : 'border-rg-ink-300/12 bg-rg-ink-700/60 hover:border-rg-gold/30 hover:bg-rg-ink-700/80'}
                          `}
                        >
                          {/* 境界标签 */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-panel px-1.5 py-0.5 rounded-sm ${domainStyle}`}>
                              {node.domain}
                            </span>
                            <span className={`text-[10px] font-panel px-1.5 py-0.5 rounded-sm ${
                              isImmortal
                                ? 'text-rg-gold border border-rg-gold/30 bg-rg-gold/5'
                                : 'text-rg-paper-200/50 border border-rg-ink-300/15 bg-rg-ink-800/40'
                            }`}>
                              {REALM_LABELS[node.startingRealm.grand] || '蛊师'}
                            </span>
                            {isImmortal && (
                              <span className="text-[9px] text-rg-blood-400 font-panel ml-auto">仙</span>
                            )}
                            {isRecommended && (
                              <span className="text-[9px] text-rg-gold font-panel px-1 py-0.5 rounded-sm border border-rg-gold/40 bg-rg-gold/10 ml-auto tracking-wider">
                                推荐起点
                              </span>
                            )}
                          </div>

                          {/* 标题 */}
                          <div className="text-rg-paper-100 font-narrative text-sm font-semibold">
                            {node.displayTitle}
                          </div>

                          {/* 简介预览 */}
                          <p className={`text-xs font-panel leading-relaxed mt-1 transition-all duration-200 ${
                            isSelected || isHovered ? 'text-rg-paper-200/70' : 'text-rg-paper-200/40'
                          }`}>
                            {node.preview}
                          </p>

                          {/* 选中标记 */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rg-gold shadow-[0_0_6px_rgba(201,168,74,0.4)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between mt-8 pb-12">
          <button
            onClick={onBack}
            className="text-rg-paper-200/50 hover:text-rg-paper-200/80 text-xs font-button px-4 py-2 border border-rg-ink-300/20 rounded-sm transition-micro"
          >
            返回
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedNodeId}
            className="bg-rg-gold text-rg-ink-900 font-button font-semibold px-8 py-3 rounded-sm
                       hover:brightness-115 hover:scale-[1.02] transition-micro
                       disabled:opacity-40 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:cursor-not-allowed"
          >
            {selectedNodeId ? '确认选择' : '请选择时间节点'}
          </button>
        </div>
      </div>
    </div>
  );
}
