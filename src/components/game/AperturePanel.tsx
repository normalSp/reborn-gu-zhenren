import { useStore } from '../../store';
import { buildExtremePhysiqueCalamityProfile, type ExtremePhysiqueCalamityProfile } from '../../engine/extreme-physique-calamity';
import type { MortalAperture, ImmortalAperture } from '../../types';

/** AperturePanel Props — P2 空窍/福地双层类型 */
export interface AperturePanelProps {
  /** 空窍/仙窍数据，null 时显示空状态 */
  aperture: MortalAperture | ImmortalAperture | null;
  /** 可选：是否展示道痕密度面板（仅仙窍时生效） */
  showDaoDensity?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  '福地': '福地',
  '洞天': '洞天',
};

/** 空窍元海颜色名 → 中文标签 */
const SEA_COLOR_LABELS: Record<string, string> = {
  '青铜': '青铜元海',
  '赤铁': '赤铁元海',
  '白银': '白银元海',
  '黄金': '黄金元海',
  '紫晶': '紫晶元海',
};

/** 窍壁状态 → 中文描述 */
const WALL_STATE_LABELS: Record<string, string> = {
  '坚实': '窍壁坚实',
  '潮汐初现': '潮汐初现',
  '潮汐涌动': '潮汐涌动',
  '壁薄如纸': '壁薄如纸',
};

/** 小境界 → 简称 */
const SUB_RANK_SHORT: Record<string, string> = {
  '初阶': '初',
  '中阶': '中',
  '高阶': '高',
  '巅峰': '巅',
};

/** 转数 → 中文标签 */
const RANK_LABELS: Record<number, string> = {
  1: '一转蛊师',
  2: '二转蛊师',
  3: '三转蛊师',
  4: '四转蛊师',
  5: '五转蛊师',
  6: '六转蛊仙',
  7: '七转蛊仙',
  8: '八转蛊仙',
  9: '九转蛊尊',
};

/** 类型守卫 */
function isMortal(a: MortalAperture | ImmortalAperture): a is MortalAperture {
  return a.type === 'mortal';
}

function isImmortal(a: MortalAperture | ImmortalAperture): a is ImmortalAperture {
  return !isMortal(a);
}

// ─── 空窍视图（1-5转蛊师）─────────────────
function MortalApertureView({ aperture, calamityProfile }: { aperture: MortalAperture; calamityProfile: ExtremePhysiqueCalamityProfile | null }) {
  const cx = 140, cy = 140;
  const { primevalSea, apertureWall, capacity, carriedGu, rank, subRank } = aperture;
  const usageFrac = capacity > 0 ? carriedGu / capacity : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 gu-ink-splash">
      {/* ─── 同心圆 SVG：元海 + 窍壁 + 容量 ─── */}
      <div className="flex justify-center mb-4">
        <svg width="280" height="280" viewBox="0 0 280 280" className="shrink-0">
          {/* 外环背景模糊光晕 */}
          <circle cx={cx} cy={cy} r="130" fill="none"
            stroke={primevalSea.color} strokeWidth="24"
            opacity="0.08" />
          
          {/* 外环 — 元海 */}
          <circle cx={cx} cy={cy} r="120" fill="none"
            stroke={primevalSea.color} strokeWidth="3" opacity="0.5" />
          <text x={cx} y={cy - 96} textAnchor="middle"
            className="fill-rg-paper-200/40 font-panel text-[9px]">
            元海
          </text>
          
          {/* 窍壁渐变环（中环） — 坚硬度用描边宽度表达 */}
          <circle cx={cx} cy={cy} r="85" fill="none"
            stroke={primevalSea.color} strokeWidth={apertureWall.opacity * 4}
            opacity={apertureWall.opacity * 0.35} />
          <circle cx={cx} cy={cy} r="85" fill="none"
            stroke="currentColor" strokeWidth="1"
            className="text-rg-ink-300/20"
            strokeDasharray={apertureWall.opacity < 0.7 ? '4 3' : undefined} />
          <text x={cx} y={cy - 60} textAnchor="middle"
            className="fill-rg-paper-200/40 font-panel text-[9px]">
            窍壁
          </text>

          {/* 内环 — 容量占用 */}
          <circle cx={cx} cy={cy} r="50" fill="none"
            stroke={primevalSea.color} strokeWidth="3" opacity="0.4" />
          {/* 容量占用扇形填充 */}
          <circle cx={cx} cy={cy} r="50" fill="none"
            stroke={carriedGu > 0 ? primevalSea.color : 'transparent'}
            strokeWidth="10" opacity="0.15"
            strokeDasharray={`${(usageFrac * Math.PI * 50 * 2).toFixed(0)} ${(Math.PI * 50 * 2).toFixed(0)}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round" />
          
          {/* 中心：转数 + 小境界 */}
          <text x={cx} y={cy - 4} textAnchor="middle"
            className="fill-rg-paper-200/90 font-narrative text-base font-bold tracking-wider">
            {RANK_LABELS[rank]?.replace('蛊师', '').replace('蛊仙', '').replace('蛊尊', '') || `${rank}转`}
            {SUB_RANK_SHORT[subRank]}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle"
            className="fill-rg-ink-400 font-panel text-[9px]">
            {RANK_LABELS[rank] || ''}
          </text>
        </svg>
      </div>

      {/* ─── 元海信息卡片 ─── */}
      <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold">
            {SEA_COLOR_LABELS[primevalSea.colorName] || '元海'}
          </h4>
          <span className="text-[10px] font-panel text-rg-paper-200/50" style={{ color: primevalSea.color }}>
            饱满度 {primevalSea.fillPercent}%
          </span>
        </div>
        <div className="h-2 bg-rg-ink-900 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${primevalSea.fillPercent}%`,
              background: `linear-gradient(90deg, ${primevalSea.color}88, ${primevalSea.color})`,
            }} />
        </div>
        {primevalSea.fillPercent >= 100 && (
          <p className="text-rg-gold/60 text-[9px] font-panel mt-1.5">
            · 十绝体 — 元海无空腔
          </p>
        )}
      </div>

      {/* ─── 窍壁状态卡片 ─── */}
      <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold">
            {WALL_STATE_LABELS[apertureWall.state] || apertureWall.state}
          </h4>
          <span className="text-[10px] font-panel text-rg-ink-400">
            {Math.round(apertureWall.opacity * 100)}%
          </span>
        </div>
        <p className="text-rg-ink-400 text-[10px] font-panel leading-relaxed">
          {apertureWall.description}
        </p>
      </div>

      {/* ─── 容量信息 ─── */}
      <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold">
            蛊虫容量
          </h4>
          <span className="text-rg-paper-200/70 text-xs font-button tabular-nums">
            {carriedGu} / {capacity}
          </span>
        </div>
        <div className="h-1.5 bg-rg-ink-900 rounded-full overflow-hidden mt-2">
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, usageFrac * 100)}%`,
              background: usageFrac > 0.8
                ? 'linear-gradient(90deg, var(--gu-life-crimson-dim), var(--gu-life-crimson))'
                : `linear-gradient(90deg, ${primevalSea.color}88, ${primevalSea.color})`,
            }} />
        </div>
        {carriedGu >= capacity && (
          <p className="text-rg-blood/60 text-[9px] font-panel mt-1.5">· 容量已满 — 需升级转数或丢弃蛊虫</p>
        )}
      </div>

      {calamityProfile && (
        <div className="mt-3 bg-rg-ink-800/50 border border-rg-gold/18 rounded-md p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h4 className="text-rg-paper-200/70 text-[11px] font-panel font-semibold">十绝体压力</h4>
            <span className={`text-[10px] font-button ${
              calamityProfile.pressureLevel === 'critical'
                ? 'text-rg-blood-400'
                : calamityProfile.pressureLevel === 'strained'
                  ? 'text-rg-gold'
                  : 'text-rg-jade-300'
            }`}>
              {calamityProfile.pressureLevel}
            </span>
          </div>
          <div className="h-2 bg-rg-ink-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, calamityProfile.aperturePressure)}%`,
                background: calamityProfile.visualState.tint,
              }}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-rg-paper-200/45">
            <span>压力 {calamityProfile.aperturePressure}</span>
            <span>安全 {calamityProfile.safeTurnsEstimate} 回合</span>
            <span className="col-span-2">亲和：{calamityProfile.favoredPaths.slice(0, 4).join(' / ') || '未登记'}</span>
            <span className="col-span-2">禁制：{calamityProfile.forbiddenPaths.slice(0, 4).join(' / ') || '暂无'}</span>
          </div>
          {(calamityProfile.warnings.length || calamityProfile.blockedActions.length) ? (
            <div className="mt-2 space-y-1 text-[10px] leading-4">
              {calamityProfile.warnings.map((warning, index) => (
                <p key={`w-${index}`} className="text-rg-gold/75">{warning}</p>
              ))}
              {calamityProfile.blockedActions.map((blocked, index) => (
                <p key={`b-${index}`} className="text-rg-blood-400/75">{blocked}</p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[10px] leading-4 text-rg-paper-200/35">
              {calamityProfile.visualState.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 仙窍视图（6转+蛊仙）─────────────────
function ImmortalApertureView({ aperture, showDaoDensity }: { aperture: ImmortalAperture; showDaoDensity: boolean }) {
  const cx = 140, cy = 140;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* ─── 同心圆 SVG ─── */}
      <div className="flex justify-center mb-4">
        <svg width="280" height="280" viewBox="0 0 280 280" className="shrink-0">
          <circle cx={cx} cy={cy} r="120" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-rg-gold/40" />
          <text x={cx} y={cy - 95} textAnchor="middle"
            className="fill-rg-paper-200/60 font-panel text-[10px]">
            {TYPE_LABELS[aperture.type] || aperture.type}
          </text>
          <text x={cx} y={cy - 82} textAnchor="middle"
            className="fill-rg-paper-200/30 font-panel text-[9px]">
            仙窍类型
          </text>

          <circle cx={cx} cy={cy} r="85" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-rg-ink-300/30" />
          <text x={cx} y={cy - 25} textAnchor="middle"
            className="fill-rg-paper-200/70 font-narrative text-sm">
            {aperture.area_mu} 亩
          </text>
          <text x={cx} y={cy - 10} textAnchor="middle"
            className="fill-rg-ink-400 font-panel text-[10px]">
            面积
          </text>

          <circle cx={cx} cy={cy} r="50" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-rg-jade-500/30" />
          <text x={cx} y={cy + 2} textAnchor="middle"
            className="fill-rg-paper-200/70 font-narrative text-sm">
            1:{aperture.time_flow_ratio}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle"
            className="fill-rg-ink-400 font-panel text-[10px]">
            时间流速
          </text>
        </svg>
      </div>

      {/* ─── 资源节点 ─── */}
      <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3 mb-3">
        <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold mb-2">资源节点</h4>
        {aperture.resource_nodes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {aperture.resource_nodes.map((node, i) => (
              <span key={node.id || `${node.type}-${i}`}
                className="text-[10px] font-panel text-rg-paper-200/70 bg-rg-ink-700/90 border border-rg-ink-300/12 px-2 py-1 rounded-sm">
                {node.type} · 产出 {node.output_rate}/季 · 品质 {node.quality}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-rg-ink-400 text-[10px] font-panel">暂无资源节点</p>
        )}
      </div>

      {/* ─── 道痕密度 ─── */}
      {showDaoDensity && Object.keys(aperture.dao_mark_density).length > 0 && (
        <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3 mb-3">
          <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold mb-2">道痕密度</h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(aperture.dao_mark_density).map(([path, density]) => (
              <span key={path}
                className="text-[10px] font-panel text-rg-paper-200/70 bg-rg-ink-700/90 border border-rg-ink-300/12 px-2 py-1 rounded-sm">
                {path} {density}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── 天劫预警 ─── */}
      {aperture.next_disaster_type && (
        <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3">
          <h4 className="text-rg-paper-200/60 text-[11px] font-panel font-semibold mb-2">天劫预警</h4>
          <p className="text-rg-blood-400 text-xs font-narrative mb-2">{aperture.next_disaster_type}</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-panel text-rg-ink-400">距离天劫</span>
            <span className="text-[10px] font-button text-rg-blood-400 tabular-nums">
              {aperture.disaster_countdown} 回合
            </span>
          </div>
          <div className="h-1.5 bg-rg-ink-900 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rg-gold to-rg-blood-600 rounded-full"
              style={{ width: `${Math.max(5, 100 - aperture.disaster_countdown)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 主组件：三层渲染 ─────────────────
export function AperturePanel({ aperture: apertureOverride, showDaoDensity = true }: AperturePanelProps = {} as any) {
  const storeAperture = useStore(s => s.aperture);
  const vitals = useStore(s => s.vitals);
  const turn = useStore(s => s.turn);
  const flags = useStore(s => s.flags);
  const aperture = apertureOverride ?? storeAperture as MortalAperture | ImmortalAperture | null;

  if (!aperture) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-rg-ink-300 text-sm font-panel">尚未开辟空窍</p>
      </div>
    );
  }

  if (isMortal(aperture)) {
    const hpPercent = vitals?.health?.max ? (vitals.health.current / vitals.health.max) * 100 : 100;
    const calamityProfile = buildExtremePhysiqueCalamityProfile(aperture, {
      hpPercent,
      turn,
      recentForcedGuUse: Number((flags as any)?.recentForcedGuUse || 0),
    });
    return <MortalApertureView aperture={aperture} calamityProfile={calamityProfile} />;
  }

  return <ImmortalApertureView aperture={aperture} showDaoDensity={showDaoDensity} />;
}
