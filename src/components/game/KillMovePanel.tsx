import { useStore } from '../../store';

export function KillMovePanel() {
  const killMoves = useStore(s => s.killMoves);
  const cooldowns = useStore(s => s.cooldowns);

  if (killMoves.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-rg-ink-300 text-sm font-panel">尚未掌握任何杀招</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {killMoves.map((move, idx) => {
        const remainingCD = cooldowns[move.id] ?? 0;
        const isOnCooldown = remainingCD > 0;

        return (
          <div
            key={move.id}
            className={`px-4 py-3 ${
              idx < killMoves.length - 1 ? 'border-b border-rg-ink-300/8' : ''
            }`}
          >
            {/* 杀招名 + 流派 */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-rg-paper-200 font-narrative text-sm truncate">
                  {move.name}
                </span>
                <span className="text-[10px] font-panel text-rg-paper-200/50 bg-rg-ink-800/50 px-1.5 py-0.5 rounded-sm shrink-0">
                  {move.path}
                </span>
              </div>
              <span className="text-[10px] font-button text-rg-ink-400 shrink-0 ml-2">
                Lv.{move.level}
              </span>
            </div>

            {/* 描述 */}
            {move.description && (
              <p className="text-rg-paper-200/40 text-[11px] font-panel leading-relaxed mb-2 line-clamp-2">
                {move.description}
              </p>
            )}

            {/* 消耗/倍率/冷却 */}
            <div className="flex items-center gap-3 text-[10px] font-panel">
              <span className="text-rg-ink-400">
                消耗 <span className="text-rg-paper-200/70">{move.baseCost}</span> 真元
              </span>
              <span className="text-rg-ink-400">
                倍率 <span className="text-rg-paper-200/70">x{move.multiplier}</span>
              </span>
              <span className="text-rg-ink-400">
                CD <span className="text-rg-paper-200/70">{move.cooldown}回合</span>
              </span>
            </div>

            {/* 冷却状态指示 */}
            <div className="mt-1.5">
              {isOnCooldown ? (
                <span className="text-[10px] font-button text-rg-gold bg-rg-gold/10 border border-rg-gold/25 px-2 py-0.5 rounded-sm inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-rg-gold" />
                  冷却中（剩余 {remainingCD} 回合）
                </span>
              ) : (
                <span className="text-[10px] font-button text-rg-jade-400 bg-rg-jade-500/10 border border-rg-jade-500/25 px-2 py-0.5 rounded-sm inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-rg-jade-400" />
                  可用
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
