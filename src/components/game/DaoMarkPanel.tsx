import { useStore } from '../../store';
import type { PathLevel } from '../../types';

// ─── 道痕互斥组（蛊真人设定：对立流派道痕互相削弱）────────────────
const PATH_MUTUAL_EXCLUSION: Record<string, string[]> = {
  '炎道': ['水道', '冰道'],
  '水道': ['炎道', '土道'],
  '木道': ['金道'],
  '金道': ['木道'],
  '土道': ['水道'],
  '冰道': ['炎道'],
  '雷道': ['风道'],
  '风道': ['雷道'],
  '光道': ['暗道'],
  '暗道': ['光道'],
  '力道': ['智道'],
  '智道': ['力道'],
  '奴道': ['魂道'],
  '魂道': ['奴道'],
  '变化道': ['律道'],
  '律道': ['变化道'],
};

// ─── 境界排序（用于柱状图着色强度）────────────────
const PATH_LEVEL_WEIGHTS: Record<PathLevel, number> = {
  '普通': 0.15,
  '大师': 0.30,
  '宗师': 0.50,
  '大宗师': 0.65,
  '准无上': 0.80,
  '无上': 0.90,
  '道主': 1.0,
};

// ─── 道痕柱状图（纯CSS）────────────────
function DaoMarkBars({
  daoMarks,
  pathLevels,
  primary,
  secondary,
}: {
  daoMarks: Record<string, number>;
  pathLevels: Record<string, PathLevel>;
  primary: string;
  secondary: string[];
}) {
  const maxMarks = Math.max(1, ...Object.values(daoMarks));

  return (
    <div className="space-y-2.5">
      {Object.entries(daoMarks)
        .sort(([, a], [, b]) => b - a)
        .map(([path, marks]) => {
          const level = pathLevels[path] || '普通';
          const weight = PATH_LEVEL_WEIGHTS[level];
          const isPrimary = path === primary;
          const isSecondary = secondary.includes(path);

          // 颜色：主修金色，辅修翡翠色，其他按流派分配
          let barColor = 'rgba(184,134,11,0.7)';
          let barBg = 'rgba(184,134,11,0.15)';
          if (isPrimary) {
            barColor = `rgba(184,134,11,${0.5 + weight * 0.5})`;
            barBg = 'rgba(184,134,11,0.2)';
          } else if (isSecondary) {
            barColor = `rgba(72,199,142,${0.4 + weight * 0.4})`;
            barBg = 'rgba(72,199,142,0.12)';
          }

          // 互斥检测
          const exclusions = PATH_MUTUAL_EXCLUSION[path] || [];
          const conflicting = exclusions.filter(e => daoMarks[e] && daoMarks[e] > 0);

          return (
            <div key={path}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-panel w-16 ${isPrimary ? 'text-rg-gold font-semibold' : isSecondary ? 'text-rg-jade-400' : 'text-rg-paper-200/60'}`}>
                  {path}
                  {isPrimary && ' ★'}
                </span>
                <div className="flex-1 h-3 bg-rg-ink-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, (marks / maxMarks) * 100)}%`,
                      background: barColor,
                    }}
                  />
                </div>
                <span className="text-rg-paper-200/80 text-xs font-panel w-10 text-right tabular-nums">
                  {marks}
                </span>
                <span className="text-rg-paper-200/30 text-[10px] font-panel w-12 text-right">
                  {level}
                </span>
              </div>
              {/* 互斥警告 */}
              {conflicting.length > 0 && (
                <div className="ml-[68px] text-[10px] font-panel text-rg-blood-400/70 mb-1">
                  互斥: {conflicting.join('、')} 削弱{path}效果
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

export function DaoMarkPanel() {
  const pathBuild = useStore(s => s.pathBuild);
  const profile = useStore(s => s.profile);

  const { primary, secondary, path_levels, dao_marks } = pathBuild;
  const daoEntries = Object.entries(dao_marks);
  const totalMarks = daoEntries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* ─── 流派概况 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">流派概况</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-rg-paper-200/50 text-xs font-panel">主修流派</div>
              <div className="text-rg-gold font-narrative text-base">
                {primary || '未选择'}
              </div>
              {path_levels[primary] && (
                <div className="text-rg-paper-200/50 text-xs font-panel mt-0.5">
                  {path_levels[primary]}
                </div>
              )}
            </div>
            <div>
              <div className="text-rg-paper-200/50 text-xs font-panel">道痕总计</div>
              <div className="text-rg-paper-100 font-panel text-lg">{totalMarks}</div>
            </div>
            <div className="col-span-2">
              <div className="text-rg-paper-200/50 text-xs font-panel">
                辅修流派
              </div>
              <div className="text-rg-paper-100 font-panel text-sm mt-0.5">
                {secondary.length > 0 ? secondary.join('、') : '无'}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 道痕柱状图 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">
            道痕积累
            <span className="text-rg-paper-200/40 text-xs font-panel ml-2">
              （{daoEntries.length} 流派）
            </span>
          </h3>
          {daoEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-rg-paper-200/30 text-xs font-panel mb-2">
                尚未积累任何道痕
              </p>
              <p className="text-rg-paper-200/20 text-xs font-panel">
                {profile.name || '蛊师'}的修行之路才刚刚开始
              </p>
            </div>
          ) : (
            <DaoMarkBars
              daoMarks={dao_marks}
              pathLevels={path_levels}
              primary={primary}
              secondary={secondary}
            />
          )}
        </div>

        {/* ─── 道痕互斥说明 ─── */}
        {daoEntries.length > 0 && (
          <div className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-lg p-4">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-2">道痕互斥</h3>
            <p className="text-rg-paper-200/40 text-xs font-panel leading-relaxed">
              蛊师修行中，对立流派的道痕会互相削弱。每当一种流派的道痕增加，其对立流派的道痕可能减少，道痕总量并非越多越好。当前{profile.name || '蛊师'}主修「{primary || '未定'}」，
              {secondary.length > 0
                ? `辅修「${secondary.join('」「')}」，请留意流派间的互斥关系。`
                : '单一流派的精进更为纯粹。'}
            </p>

            {/* 当前互斥关系展示 */}
            {daoEntries.length >= 2 && (() => {
              const currentConflicts: { pair: [string, string] }[] = [];
              const checked = new Set<string>();
              for (const [path] of daoEntries) {
                const exclusions = PATH_MUTUAL_EXCLUSION[path] || [];
                for (const excl of exclusions) {
                  if (dao_marks[excl] && !checked.has(`${excl}-${path}`)) {
                    currentConflicts.push({ pair: [path, excl] });
                    checked.add(`${path}-${excl}`);
                    checked.add(`${excl}-${path}`);
                  }
                }
              }

              if (currentConflicts.length === 0) {
                return (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rg-jade-500" />
                    <span className="text-rg-jade-400/70 text-xs font-panel">
                      当前流派间无互斥冲突
                    </span>
                  </div>
                );
              }

              return (
                <div className="mt-2 space-y-1">
                  {currentConflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rg-blood-500" />
                      <span className="text-rg-blood-400/70 text-xs font-panel">
                        {c.pair[0]} ⟷ {c.pair[1]}（互相削弱）
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── 流派境界一览 ─── */}
        {Object.keys(path_levels).length > 0 && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">流派境界</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(path_levels)
                .sort(([a], [b]) => {
                  if (a === primary) return -1;
                  if (b === primary) return 1;
                  return a.localeCompare(b);
                })
                .map(([path, level]) => {
                  const isPrimary = path === primary;
                  return (
                    <div key={path} className="flex justify-between items-center">
                      <span className={`text-xs font-panel ${isPrimary ? 'text-rg-gold' : 'text-rg-paper-200/60'}`}>
                        {path}{isPrimary ? ' ★' : ''}
                      </span>
                      <span className="text-rg-paper-200/50 text-xs font-panel">{level}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
