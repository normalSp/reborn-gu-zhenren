import { useStore } from '../../store';

const TYPE_LABELS: Record<string, string> = {
  '福地': '福地',
  '洞天': '洞天',
};

export function AperturePanel() {
  const aperture = useStore(s => s.aperture);

  if (!aperture) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-rg-ink-300 text-sm font-panel">尚未开辟空窍</p>
      </div>
    );
  }

  const centerX = 140;
  const centerY = 140;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* ─── 同心圆 SVG ─── */}
      <div className="flex justify-center mb-4">
        <svg width="280" height="280" viewBox="0 0 280 280" className="shrink-0">
          {/* 外环 — 空窍类型 */}
          <circle
            cx={centerX} cy={centerY} r={120}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-rg-gold/40"
          />
          <text
            x={centerX} y={centerY - 95}
            textAnchor="middle"
            className="fill-rg-paper-200/60 font-panel text-[10px]"
          >
            {TYPE_LABELS[aperture.type] || aperture.type}
          </text>
          <text
            x={centerX} y={centerY - 82}
            textAnchor="middle"
            className="fill-rg-paper-200/30 font-panel text-[9px]"
          >
            空窍类型
          </text>

          {/* 中环 — 面积 + 时间流速 */}
          <circle
            cx={centerX} cy={centerY} r={85}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-rg-ink-300/30"
          />
          <text
            x={centerX} y={centerY - 25}
            textAnchor="middle"
            className="fill-rg-paper-200/70 font-narrative text-sm"
          >
            {aperture.area_mu} 亩
          </text>
          <text
            x={centerX} y={centerY - 10}
            textAnchor="middle"
            className="fill-rg-ink-400 font-panel text-[10px]"
          >
            面积
          </text>

          {/* 内环 — 时间流速比 */}
          <circle
            cx={centerX} cy={centerY} r={50}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-rg-jade-500/30"
          />
          <text
            x={centerX} y={centerY + 2}
            textAnchor="middle"
            className="fill-rg-paper-200/70 font-narrative text-sm"
          >
            1:{aperture.time_flow_ratio}
          </text>
          <text
            x={centerX} y={centerY + 16}
            textAnchor="middle"
            className="fill-rg-ink-400 font-panel text-[10px]"
          >
            时间流速
          </text>
        </svg>
      </div>

      {/* ─── 资源节点卡片 ─── */}
      <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3 mb-3">
        <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold mb-2">
          资源节点
        </h4>
        {aperture.resource_nodes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {aperture.resource_nodes.map(node => (
              <span
                key={node.id}
                className="text-[10px] font-panel text-rg-paper-200/70 bg-rg-ink-700/90 border border-rg-ink-300/12 px-2 py-1 rounded-sm"
              >
                {node.type} · 产出 {node.output_rate}/季 · 品质 {node.quality}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-rg-ink-400 text-[10px] font-panel">暂无资源节点</p>
        )}
      </div>

      {/* ─── 道痕密度概览 ─── */}
      {Object.keys(aperture.dao_mark_density).length > 0 && (
        <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3 mb-3">
          <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold mb-2">
            道痕密度
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(aperture.dao_mark_density).map(([path, density]) => (
              <span
                key={path}
                className="text-[10px] font-panel text-rg-paper-200/70 bg-rg-ink-700/90 border border-rg-ink-300/12 px-2 py-1 rounded-sm"
              >
                {path} {density}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── 灾劫倒计时 ─── */}
      {aperture.next_disaster_type && (
        <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3">
          <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold mb-2">
            天劫预警
          </h4>
          <p className="text-rg-blood-400 text-xs font-narrative mb-2">
            {aperture.next_disaster_type}
          </p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-panel text-rg-ink-400">距离天劫</span>
            <span className="text-[10px] font-button text-rg-blood-400 tabular-nums">
              {aperture.disaster_countdown} 回合
            </span>
          </div>
          <div className="h-1.5 bg-rg-ink-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rg-gold to-rg-blood-600 rounded-full"
              style={{ width: `${Math.max(5, 100 - aperture.disaster_countdown)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
