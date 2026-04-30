import { useStore } from '../../store';

// ─── 属性分级 ───
// 原著：甲等/乙等/丙等/丁等是空窍真元容量的评价标准（资质专属）
// 体魄、心智、气运不使用此分级体系
function attrGrade(value: number, attrName: string): { label: string; color: string } {
  if (attrName !== '资质') return { label: '', color: 'text-rg-paper-100' };
  if (value >= 9) return { label: '甲等', color: 'text-rg-gold' };
  if (value >= 7) return { label: '乙等', color: 'text-rg-jade-400' };
  if (value >= 5) return { label: '丙等', color: 'text-rg-paper-200' };
  return { label: '丁等', color: 'text-rg-paper-200/50' };
}

// ─── 简易雷达图（纯CSS） ───
function MiniRadar({ values, labels, max }: { values: number[]; labels: string[]; max: number }) {
  const SIZE = 160;
  const cx = SIZE / 2; const cy = SIZE / 2; const r = 62;
  const angles = values.map((_, i) => (Math.PI * 2 * i) / values.length - Math.PI / 2);
  const points = values.map((v, i) => {
    const ratio = Math.max(0, v / max);
    return { x: cx + r * ratio * Math.cos(angles[i]), y: cy + r * ratio * Math.sin(angles[i]) };
  });
  const outerPoints = labels.map((_, i) => ({ x: cx + r * Math.cos(angles[i]), y: cy + r * Math.sin(angles[i]) }));
  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const gridPath = outerPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={SIZE} height={SIZE} className="mx-auto">
      {/* 背景网格 */}
      <path d={gridPath} fill="none" stroke="rgba(144,144,184,0.15)" strokeWidth="1" />
      {[0.5, 1].map(scale => {
        const gp = values.map((_, i) => {
          const ratio = scale;
          return { x: cx + r * ratio * Math.cos(angles[i]), y: cy + r * ratio * Math.sin(angles[i]) };
        });
        const gpStr = gp.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return <path key={scale} d={gpStr} fill="none" stroke="rgba(144,144,184,0.08)" strokeWidth="0.5" />;
      })}
      {/* 轴线 */}
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(144,144,184,0.12)" strokeWidth="0.5" />
      ))}
      {/* 数据多边形 */}
      <path d={polygonPath} fill="rgba(184,134,11,0.15)" stroke="rgba(184,134,11,0.5)" strokeWidth="1.5" />
      {/* 数据点 */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="rgba(184,134,11,0.8)" />
      ))}
      {/* 标签 */}
      {outerPoints.map((p, i) => {
        const dx = p.x - cx; const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const lx = cx + (dx / dist) * (r + 26); const ly = cy + (dy / dist) * (r + 26);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            className="fill-rg-paper-200/60" fontSize="10" fontFamily="sans-serif">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

export function AttributeDetailPanel() {
  const attributes = useStore(s => s.attributes);
  const profile = useStore(s => s.profile);
  const daoHeart = useStore(s => s.daoHeart);
  const standings = useStore(s => s.standings);
  const pathBuild = useStore(s => s.pathBuild);
  const turn = useStore(s => s.turn);

  const attrArr = [attributes.资质, attributes.体魄, attributes.心智, attributes.气运];
  const labels = ['资质', '体魄', '心智', '气运'];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* ─── 角色概况 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">角色概况</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-rg-paper-200/50 text-xs font-panel">名号</div>
              <div className="text-rg-gold font-narrative text-base">{profile.name || '蛊师'}</div>
            </div>
            <div>
              <div className="text-rg-paper-200/50 text-xs font-panel">境界</div>
              <div className="text-rg-paper-100 font-panel text-sm">{profile.realm.label}</div>
            </div>
            <div>
              <div className="text-rg-paper-200/50 text-xs font-panel">出身</div>
              <div className="text-rg-paper-100 font-panel text-sm">{profile.background}</div>
            </div>
            <div>
              <div className="text-rg-paper-200/50 text-xs font-panel">回合</div>
              <div className="text-rg-paper-100 font-panel text-sm">第{turn}回</div>
            </div>
          </div>
        </div>

        {/* ─── 属性雷达图 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">四维资质</h3>
          <MiniRadar values={attrArr} labels={labels} max={10} />
          <div className="grid grid-cols-4 gap-2 mt-3">
            {labels.map((label, i) => {
              const grade = attrGrade(attrArr[i], label);
              return (
                <div key={label} className="text-center">
                  <div className="text-rg-paper-200/60 text-xs font-panel">{label}</div>
                  <div className={`text-lg font-bold font-panel ${grade.color}`}>{attrArr[i]}</div>
                  {grade.label && (
                    <div className={`text-[10px] font-panel ${grade.color}`}>{grade.label}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 道心四维 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">道心倾向</h3>
          <div className="space-y-2">
            {[
              { label: '杀性', key: 'kill' as const, color: 'bg-rg-blood-500' },
              { label: '仁心', key: 'mercy' as const, color: 'bg-rg-jade-500' },
              { label: '谋略', key: 'scheme' as const, color: 'bg-blue-500' },
              { label: '野心', key: 'ambition' as const, color: 'bg-purple-400' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-rg-paper-200/60 text-xs font-panel w-8">{item.label}</span>
                <div className="flex-1 h-2 bg-rg-ink-900 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} transition-all duration-300 rounded-full`}
                    style={{ width: `${Math.min(100, daoHeart[item.key] * 10)}%` }} />
                </div>
                <span className="text-rg-paper-200/80 text-xs font-panel w-6">{daoHeart[item.key]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 势力声望 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">势力声望</h3>
          {Object.keys(standings).length === 0 ? (
            <p className="text-rg-paper-200/30 text-xs font-panel">尚未与任何势力建立关系</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(standings).map(([factionId, data]) => {
                const pct = (data.standing + 100) / 2;
                const tierColor = data.standing >= 40 ? 'text-rg-jade-400' :
                  data.standing >= 0 ? 'text-rg-paper-200' :
                  data.standing >= -40 ? 'text-rg-gold' : 'text-rg-blood-400';
                return (
                  <div key={factionId} className="flex items-center gap-3">
                    <span className="text-rg-paper-200/80 text-xs font-panel w-20">{factionId}</span>
                    <div className="flex-1 h-1.5 bg-rg-ink-900 rounded-full overflow-hidden relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-rg-ink-300/40" />
                      <div className={`h-full transition-all duration-300 rounded-full ${data.standing >= 0 ? 'bg-rg-jade-500' : 'bg-rg-blood-500'}`}
                        style={{ width: `${Math.abs(data.standing)}%`, marginLeft: data.standing >= 0 ? '50%' : `${50 - Math.abs(data.standing) / 2}%` }} />
                    </div>
                    <span className="text-rg-paper-200/80 text-xs font-panel w-8">{data.standing}</span>
                    <span className={`text-xs font-panel ${tierColor}`}>{data.reputation_tier || ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── 流派道痕 ─── */}
        {pathBuild.primary && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">流派道痕</h3>
            <div className="text-rg-paper-200/80 text-xs font-panel mb-2">
              主修: <span className="text-rg-gold">{pathBuild.primary}</span>
              {pathBuild.secondary.length > 0 && (
                <span className="text-rg-paper-200/50"> · 辅修: {pathBuild.secondary.join(', ')}</span>
              )}
            </div>
            {Object.keys(pathBuild.dao_marks).length > 0 ? (
              <div className="space-y-1.5">
                {Object.entries(pathBuild.dao_marks).map(([path, marks]) => (
                  <div key={path} className="flex items-center gap-2">
                    <span className="text-rg-paper-200/60 text-xs font-panel w-16">{path}</span>
                    <div className="flex-1 h-1.5 bg-rg-ink-900 rounded-full overflow-hidden">
                      <div className="h-full bg-rg-gold rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, marks / 10)}%` }} />
                    </div>
                    <span className="text-rg-paper-200/80 text-xs font-panel w-10">{marks}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-rg-paper-200/30 text-xs font-panel">尚未积累道痕</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
