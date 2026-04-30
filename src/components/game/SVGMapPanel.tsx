import { useStore } from '../../store';

// ─── 南疆区域坐标映射（SVG坐标空间 360×240）────────────────────
const REGION_BOUNDS: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
  '南疆': { cx: 180, cy: 120, rx: 160, ry: 100 },
  '北原': { cx: 180, cy: 60, rx: 140, ry: 50 },
  '东海': { cx: 300, cy: 140, rx: 70, ry: 100 },
  '西漠': { cx: 60, cy: 140, rx: 70, ry: 100 },
  '中州': { cx: 180, cy: 180, rx: 90, ry: 50 },
};

const REGION_COLORS: Record<string, string> = {
  '南疆': 'rgba(184,134,11,0.15)',
  '北原': 'rgba(100,140,200,0.10)',
  '东海': 'rgba(80,160,160,0.10)',
  '西漠': 'rgba(180,140,80,0.10)',
  '中州': 'rgba(160,100,160,0.10)',
};

const REGION_BORDERS: Record<string, string> = {
  '南疆': 'rgba(184,134,11,0.30)',
  '北原': 'rgba(100,140,200,0.20)',
  '东海': 'rgba(80,160,160,0.20)',
  '西漠': 'rgba(180,140,80,0.20)',
  '中州': 'rgba(160,100,160,0.20)',
};

export function SVGMapPanel() {
  const knownLocations = useStore(s => s.knownLocations);
  const playerPosition = useStore(s => s.playerPosition);
  const exploredRegions = useStore(s => s.exploredRegions);
  const fogOfWar = useStore(s => s.fogOfWar);

  const exploredSet = new Set(Array.isArray(exploredRegions) ? exploredRegions : []);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* ─── SVG地图 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">
            南疆舆图
            {fogOfWar && (
              <span className="text-rg-paper-200/40 text-xs font-panel ml-2">（战争迷雾开启）</span>
            )}
          </h3>
          <svg viewBox="0 0 360 240" className="w-full h-auto rounded-md bg-rg-ink-900/60">
            {/* ─── 区域底色 ─── */}
            {Object.entries(REGION_BOUNDS).map(([region, bounds]) => {
              const isExplored = exploredSet.has(region);
              const fill = isExplored || !fogOfWar
                ? REGION_COLORS[region] || 'rgba(144,144,184,0.08)'
                : 'rgba(40,40,60,0.3)';
              const stroke = isExplored || !fogOfWar
                ? REGION_BORDERS[region] || 'rgba(144,144,184,0.2)'
                : 'rgba(144,144,184,0.08)';
              return (
                <ellipse
                  key={region}
                  cx={bounds.cx}
                  cy={bounds.cy}
                  rx={bounds.rx}
                  ry={bounds.ry}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="1"
                />
              );
            })}

            {/* ─── 区域标签 ─── */}
            {Object.entries(REGION_BOUNDS).map(([region, bounds]) => {
              const isExplored = exploredSet.has(region);
              if (fogOfWar && !isExplored) {
                return (
                  <text
                    key={region}
                    x={bounds.cx}
                    y={bounds.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(144,144,184,0.15)"
                    fontSize="10"
                    fontFamily="sans-serif"
                  >
                    ???
                  </text>
                );
              }
              return (
                <text
                  key={region}
                  x={bounds.cx}
                  y={bounds.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(224,216,200,0.3)"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {region}
                </text>
              );
            })}

            {/* ─── 已发现地点标记 ─── */}
            {knownLocations
              .filter(loc => {
                if (fogOfWar && !exploredSet.has(loc.region)) return false;
                return loc.discovered;
              })
              .map(loc => {
                // 按区域映射到SVG坐标
                const bounds = REGION_BOUNDS[loc.region];
                if (!bounds) return null;
                const spreadX = (loc.x - 0.5) * bounds.rx * 1.6;
                const spreadY = (loc.y - 0.5) * bounds.ry * 1.6;
                const cx = bounds.cx + spreadX;
                const cy = bounds.cy + spreadY;
                return (
                  <g key={loc.id}>
                    <circle cx={cx} cy={cy} r="5" fill="rgba(184,134,11,0.7)" />
                    <circle cx={cx} cy={cy} r="8" fill="none" stroke="rgba(184,134,11,0.3)" strokeWidth="0.5" />
                    <text
                      x={cx}
                      y={cy + 16}
                      textAnchor="middle"
                      fill="rgba(224,216,200,0.7)"
                      fontSize="8"
                      fontFamily="sans-serif"
                    >
                      {loc.name}
                    </text>
                  </g>
                );
              })}

            {/* ─── 玩家位置指示 ─── */}
            {(() => {
              const bounds = REGION_BOUNDS[playerPosition.region];
              if (!bounds) return null;
              const spreadX = (playerPosition.x - 0.5) * bounds.rx * 1.6;
              const spreadY = (playerPosition.y - 0.5) * bounds.ry * 1.6;
              const px = bounds.cx + spreadX;
              const py = bounds.cy + spreadY;
              return (
                <g>
                  {/* 脉冲光环 */}
                  <circle cx={px} cy={py} r="10" fill="none" stroke="rgba(184,134,11,0.4)" strokeWidth="2">
                    <animate attributeName="r" from="10" to="18" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  {/* 玩家圆点 */}
                  <circle cx={px} cy={py} r="4" fill="rgba(184,134,11,0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="1">
                    <animate attributeName="r" from="4" to="5" dur="1s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })()}
          </svg>

          {/* ─── 当前位置信息 ─── */}
          <div className="mt-3 flex items-center justify-between text-xs font-panel">
            <span className="text-rg-paper-200/50">
              当前位置：<span className="text-rg-gold">{playerPosition.region}</span>
            </span>
            <span className="text-rg-paper-200/30">
              已探索 {exploredSet.size} 区域 · 发现 {knownLocations.filter(l => l.discovered).length} 处地点
            </span>
          </div>
        </div>

        {/* ─── 已发现地点列表 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">已知地点</h3>
          {knownLocations.filter(l => l.discovered).length === 0 ? (
            <p className="text-rg-paper-200/30 text-xs font-panel">尚未发现任何地点，继续探索吧</p>
          ) : (
            <div className="space-y-2">
              {knownLocations
                .filter(l => l.discovered)
                .map(loc => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between py-2 border-b border-rg-ink-300/8 last:border-b-0"
                  >
                    <div>
                      <span className="text-rg-paper-200 text-sm font-panel">{loc.name}</span>
                      <span className="text-rg-paper-200/30 text-xs font-panel ml-2">{loc.region}</span>
                    </div>
                    <span className="text-rg-paper-200/40 text-xs font-panel">
                      ({loc.x.toFixed(2)}, {loc.y.toFixed(2)})
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
