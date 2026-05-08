import { useStore } from '../../store';

const EMPTY_LOCATIONS: any[] = [];

// ─── 五域地理布局（SVG坐标空间 400×280）────────────────────
// P4 重新设计：不再使用重叠椭圆，改为五域地理排列（北/中/南东西合围）

interface RegionDef {
  id: string;
  path: string;        // SVG path 闭合路径
  label: { x: number; y: number };
  // 区域内归一化坐标 → SVG像素的缩放基准
  centerSvg: { x: number; y: number };
  scaleX: number;
  scaleY: number;
  // 风格
  color: string;
  border: string;
  labelColor: string;
  terrainHint: string;  // 副标题
}

const REGIONS: RegionDef[] = [
  {
    id: '北原',
    path: 'M 0,0 L 400,0 L 390,75 L 300,80 L 200,82 L 100,80 L 20,70 Z',
    label: { x: 200, y: 38 },
    centerSvg: { x: 200, y: 40 },
    scaleX: 170, scaleY: 35,
    color: 'rgba(120,160,220,0.12)',
    border: 'rgba(120,160,220,0.25)',
    labelColor: '#8ca8d4',
    terrainHint: '黄金血脉 · 王庭草原',
  },
  {
    id: '西漠',
    path: 'M 0,70 L 20,70 L 100,80 L 150,100 L 185,125 L 180,165 L 150,205 L 100,240 L 60,270 L 0,280 Z',
    label: { x: 75, y: 170 },
    centerSvg: { x: 85, y: 170 },
    scaleX: 75, scaleY: 80,
    color: 'rgba(200,160,80,0.12)',
    border: 'rgba(200,160,80,0.25)',
    labelColor: '#c8a050',
    terrainHint: '人祖遗迹 · 蓝海秘境',
  },
  {
    id: '中洲',
    path: 'M 100,80 L 200,82 L 300,80 L 330,120 L 320,170 L 280,205 L 200,210 L 160,195 L 150,165 L 185,125 L 150,100 Z',
    label: { x: 240, y: 138 },
    centerSvg: { x: 235, y: 140 },
    scaleX: 90, scaleY: 55,
    color: 'rgba(170,110,170,0.12)',
    border: 'rgba(170,110,170,0.28)',
    labelColor: '#aa6eaa',
    terrainHint: '十大古派 · 天庭俯瞰',
  },
  {
    id: '南疆',
    path: 'M 150,165 L 200,210 L 280,205 L 340,210 L 380,250 L 400,260 L 400,280 L 180,280 L 100,240 L 150,205 Z',
    label: { x: 290, y: 238 },
    centerSvg: { x: 260, y: 235 },
    scaleX: 130, scaleY: 50,
    color: 'rgba(184,134,11,0.12)',
    border: 'rgba(184,134,11,0.28)',
    labelColor: '#b8860b',
    terrainHint: '山寨林立 · 丛林法则',
  },
  {
    id: '东海',
    path: 'M 300,80 L 390,75 L 400,70 L 400,180 L 380,195 L 340,210 L 280,205 L 320,170 L 330,120 Z',
    label: { x: 360, y: 130 },
    centerSvg: { x: 350, y: 135 },
    scaleX: 45, scaleY: 55,
    color: 'rgba(90,170,170,0.12)',
    border: 'rgba(90,170,170,0.25)',
    labelColor: '#5aaaaa',
    terrainHint: '散修天地 · 群岛漂泊',
  },
];

// 装饰：山脉纹理符号（简化SVG三角）
const MountainIcon = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <path d="M-6,4 L0,-6 L6,4 Z" fill="rgba(120,180,120,0.15)" stroke="rgba(120,180,120,0.2)" strokeWidth="0.5" />
    <path d="M-2,4 L0,-2 L2,4 Z" fill="rgba(120,180,120,0.1)" />
  </g>
);

const WaveIcon = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <path d="M-6,0 Q-3,-4 0,0 Q3,4 6,0" fill="none" stroke="rgba(90,170,170,0.2)" strokeWidth="1" />
  </g>
);

function regionAtlas(regionId: string): RegionDef | undefined {
  return REGIONS.find(r => r.id === regionId);
}

function toSvg(r: RegionDef, x: number, y: number): { px: number; py: number } {
  return {
    px: r.centerSvg.x + (x - 0.5) * r.scaleX * 1.6,
    py: r.centerSvg.y + (y - 0.5) * r.scaleY * 1.6,
  };
}

export function SVGMapPanel() {
  const knownLocations = useStore(s => s.knownLocations);
  const rumorLocations = useStore(s => (s as any).rumorLocations);
  const playerPosition = useStore(s => s.playerPosition);
  const exploredRegions = useStore(s => s.exploredRegions);
  const fogOfWar = useStore(s => s.fogOfWar);
  const currentDomain = useStore(s => s.currentDomain);

  const exploredSet = new Set(Array.isArray(exploredRegions) ? exploredRegions : []);
  const rumorList = Array.isArray(rumorLocations) ? rumorLocations : EMPTY_LOCATIONS;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* ─── SVG 地图 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold tracking-wide">
              <span className="text-rg-gold font-narrative">{currentDomain || '南疆'}</span>
              <span className="text-rg-paper-200/50"> · 舆图</span>
            </h3>
            {fogOfWar && (
              <span className="text-rg-paper-200/30 text-xs font-panel px-2 py-0.5 border border-rg-ink-300/10 rounded">
                迷雾
              </span>
            )}
          </div>

          <svg viewBox="0 0 400 280" className="w-full h-auto rounded-md" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}>
            <defs>
              {/* 区域渐变 */}
              <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* 脉冲动画 */}
              <animate id="pulse" attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
            </defs>

            {/* ─── 五域地理区域 ─── */}
            {REGIONS.map(region => {
              const isExplored = fogOfWar ? exploredSet.has(region.id) : true;
              return (
                <g key={region.id}>
                  {/* 区域底色 */}
                  <path
                    d={region.path}
                    fill={isExplored ? region.color : 'rgba(30,30,50,0.5)'}
                    stroke={isExplored ? region.border : 'rgba(80,80,100,0.12)'}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {/* 区域标签 */}
                  <text
                    x={region.label.x}
                    y={region.label.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isExplored ? region.labelColor : 'rgba(100,100,120,0.2)'}
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="serif"
                    letterSpacing="2"
                    filter={isExplored ? 'url(#glow)' : undefined}
                  >
                    {isExplored ? region.id : '???'}
                  </text>
                  {isExplored && (
                    <text
                      x={region.label.x}
                      y={region.label.y + 14}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={region.labelColor.replace('1)', '0.4)')}
                      fontSize="7"
                      fontFamily="sans-serif"
                    >
                      {region.terrainHint}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ─── 装饰：山脉纹理（南疆/中洲交界） ─── */}
            <MountainIcon x={205} y={195} scale={1.2} />
            <MountainIcon x={220} y={200} scale={0.8} />
            <MountainIcon x={190} y={205} scale={0.9} />
            <MountainIcon x={150} y={118} scale={0.7} />

            {/* ─── 装饰：海浪纹理（东海） ─── */}
            <WaveIcon x={360} y={155} scale={1.2} />
            <WaveIcon x={370} y={165} scale={1} />
            <WaveIcon x={350} y={160} scale={0.8} />

            {/* ─── 装饰：沙漠符号（西漠） ─── */}
            <circle cx="50" cy="160" r="1.5" fill="rgba(200,160,80,0.15)" />
            <circle cx="70" cy="175" r="1" fill="rgba(200,160,80,0.12)" />
            <circle cx="60" cy="190" r="1.5" fill="rgba(200,160,80,0.15)" />

            {/* ─── 区域连接道标（虚线路径） ─── */}
            {fogOfWar && exploredSet.size >= 2 && (
              <>
                <line x1="200" y1="82" x2="200" y2="210" stroke="rgba(184,134,11,0.12)" strokeWidth="0.8" strokeDasharray="4,4" />
                <line x1="100" y1="80" x2="50" y2="170" stroke="rgba(184,134,11,0.12)" strokeWidth="0.8" strokeDasharray="4,4" />
              </>
            )}

            {/* ─── 已发现地点标记 ─── */}
            {knownLocations
              .filter(loc => {
                if (fogOfWar && !exploredSet.has(loc.region)) return false;
                return loc.discovered;
              })
              .map(loc => {
                const r = regionAtlas(loc.region);
                if (!r) return null;
                const { px, py } = toSvg(r, loc.x, loc.y);
                return (
                  <g key={loc.id}>
                    <circle cx={px} cy={py} r="4" fill="rgba(184,134,11,0.7)" />
                    <circle cx={px} cy={py} r="7" fill="none" stroke="rgba(184,134,11,0.2)" strokeWidth="0.8" />
                    <text
                      x={px}
                      y={py - 8}
                      textAnchor="middle"
                      fill="rgba(224,216,200,0.65)"
                      fontSize="7"
                      fontFamily="sans-serif"
                    >
                      {loc.name}
                    </text>
                  </g>
                );
              })}

            {/* ─── 玩家位置（脉动标记） ─── */}
            {(() => {
              const r = regionAtlas(playerPosition.region);
              if (!r) return null;
              const { px, py } = toSvg(r, playerPosition.x, playerPosition.y);
              return (
                <g filter="url(#glow)">
                  {/* 脉冲环 */}
                  <circle cx={px} cy={py} r="8" fill="none" stroke="rgba(184,134,11,0.5)" strokeWidth="2">
                    <animate attributeName="r" from="8" to="16" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* 玩家光点 */}
                  <circle cx={px} cy={py} r="4" fill="rgba(255,200,80,0.95)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  {/* 光晕 */}
                  <circle cx={px} cy={py} r="2" fill="rgba(255,255,200,0.6)">
                    <animate attributeName="r" from="2" to="3" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })()}

            {/* ─── 罗盘玫瑰（右上角） ─── */}
            <g transform="translate(370, 20)">
              <circle cx="0" cy="0" r="12" fill="rgba(20,20,40,0.6)" stroke="rgba(160,140,100,0.3)" strokeWidth="0.8" />
              <line x1="0" y1="-9" x2="0" y2="9" stroke="rgba(160,140,100,0.4)" strokeWidth="0.8" />
              <line x1="-9" y1="0" x2="9" y2="0" stroke="rgba(160,140,100,0.4)" strokeWidth="0.8" />
              <polygon points="0,-10 -2,-3 2,-3" fill="rgba(184,134,11,0.7)" />
              <polygon points="0,10 -2,3 2,3" fill="rgba(160,140,100,0.3)" />
              <polygon points="-10,0 -3,-2 -3,2" fill="rgba(160,140,100,0.3)" />
              <polygon points="10,0 3,-2 3,2" fill="rgba(160,140,100,0.3)" />
              <text x="0" y="16" textAnchor="middle" fill="rgba(160,140,100,0.4)" fontSize="6">北</text>
            </g>
          </svg>

          {/* ─── 当前位置+图例 ─── */}
          <div className="mt-3 flex items-center justify-between text-xs font-panel">
            <span className="text-rg-paper-200/50">
              位置：<span className="text-rg-gold font-semibold">{playerPosition.region || '未知'}</span>
              {playerPosition.region && (
                <span className="text-rg-paper-200/30 ml-1">
                  ({playerPosition.x.toFixed(2)},{playerPosition.y.toFixed(2)})
                </span>
              )}
            </span>
            <div className="flex items-center gap-2 text-rg-paper-200/30">
              <span className="w-2 h-2 rounded-full bg-rg-gold/60" /> 玩家
              <span>{exploredSet.size}/5 域</span>
              <span>{knownLocations.filter(l => l.discovered).length} 地点</span>
            </div>
          </div>
        </div>

        {/* ─── 五域总览 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">五域纪行</h3>
          <div className="grid grid-cols-2 gap-2">
            {REGIONS.map(region => {
              const isExplored = !fogOfWar || exploredSet.has(region.id);
              return (
                <div
                  key={region.id}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded ${
                    region.id === currentDomain
                      ? 'bg-rg-gold/10 border border-rg-gold/15'
                      : 'border border-transparent'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ background: isExplored ? region.labelColor : '#333' }}
                  />
                  <div className="min-w-0">
                    <span className="text-rg-paper-200 text-xs font-panel">
                      {isExplored ? region.id : '???'}
                    </span>
                    {isExplored && (
                      <span className="text-rg-paper-200/25 text-xs block truncate">
                        {region.terrainHint}
                      </span>
                    )}
                  </div>
                  {region.id === currentDomain && (
                    <span className="text-rg-gold text-xs flex-shrink-0 ml-auto">当前</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 已知地点列表 ─── */}
        {knownLocations.filter(l => l.discovered).length > 0 && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">已知地点</h3>
            <div className="space-y-1.5">
              {knownLocations
                .filter(l => l.discovered)
                .slice(0, 10)
                .map(loc => {
                  const r = regionAtlas(loc.region);
                  return (
                    <div key={loc.id} className="py-2 border-b border-rg-ink-300/6 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="text-rg-paper-200 text-sm font-panel">{loc.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ background: (r?.color || 'rgba(144,144,184,0.1)'), color: r?.labelColor || '#999', fontSize: '10px' }}>
                          {loc.region}
                        </span>
                        {loc.dangerLevel && <span className="text-[10px] text-rg-gold/70 ml-auto">危险 {loc.dangerLevel}</span>}
                      </div>
                      {loc.description && <p className="text-[10px] text-rg-paper-200/40 mt-1 leading-4">{loc.description}</p>}
                      <div className="text-[10px] text-rg-paper-200/30 mt-1 truncate">
                        {loc.facilities?.length ? `设施：${loc.facilities.join(' / ')}` : '设施：待探索'}
                        {loc.resourceHints?.length ? ` · 线索：${loc.resourceHints.join(' / ')}` : ''}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        {rumorList.length > 0 && (
          <div className="bg-rg-ink-700/90 border border-rg-gold/15 rounded-lg p-4 backdrop-blur-md">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">传闻地点</h3>
            <div className="space-y-2">
              {rumorList.slice(0, 8).map((loc: any) => (
                <div key={loc.id} className="rounded-sm border border-rg-ink-300/10 bg-rg-ink-800/35 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-rg-paper-200/80 text-xs font-panel">{loc.name}</span>
                    <span className="text-[10px] text-rg-paper-200/35">{loc.region}</span>
                    <span className="ml-auto text-[10px] text-rg-gold/70">可信 {loc.credibility ?? 35}%</span>
                  </div>
                  <p className="text-[10px] text-rg-paper-200/35 mt-1 leading-4">{loc.description || '未核验地点，需打听或亲自前往。'}</p>
                  <div className="text-[10px] text-rg-paper-200/25 mt-1">
                    {(loc.actions || ['打听消息', '前往核验']).join(' / ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
