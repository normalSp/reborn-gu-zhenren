import { useState } from 'react';
import { useStore } from '../../store';
import { checkEvolution, evolveKillMove } from '../../engine/killmove-evolution';

export function KillMovePanel() {
  const killMoves = useStore(s => s.killMoves);
  const cooldowns = useStore(s => s.cooldowns);
  const enhanceKillMove = useStore((s: any) => s.enhanceKillMove) as ((id: string) => { success: boolean; message: string }) | undefined;
  const materialBag = useStore((s: any) => s.materialBag) || {} as Record<string, number>;
  const realm = useStore((s: any) => s.profile?.realm?.grand || 1);
  const [msg, setMsg] = useState('');
  const [evolveMsg, setEvolveMsg] = useState('');

  if (killMoves.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-rg-ink-300 text-sm font-panel">尚未掌握任何杀招</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {msg && (
        <div className="px-4 py-2 bg-rg-jade-500/10 border-b border-rg-jade-500/20 text-rg-jade-400 text-[10px] font-panel text-center">
          {msg}
        </div>
      )}
      {evolveMsg && (
        <div className="px-4 py-2 bg-rg-gold/10 border-b border-rg-gold/20 text-rg-gold text-[10px] font-panel text-center">
          {evolveMsg}
        </div>
      )}
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
            <div className="mt-1.5 flex items-center gap-2">
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
              {/* P4: 材料强化杀招按钮 */}
              <button
                onClick={() => {
                  if (!enhanceKillMove) return;
                  const matName = `${move.path}蛊材`;
                  const count = materialBag[matName] || 0;
                  if (count < 3) { setMsg(`${matName}不足（需3份，当前${count}份）`); setTimeout(() => setMsg(''), 2500); return; }
                  const result = enhanceKillMove(move.id);
                  setMsg(result.message);
                  setTimeout(() => setMsg(''), 2500);
                }}
                className="text-[9px] font-button px-1.5 py-0.5 rounded-sm border border-rg-ink-400/20 text-rg-paper-200/40 hover:border-rg-gold/30 hover:text-rg-gold transition-micro"
                title={`消耗3份${move.path}蛊材强化此杀招`}
              >
                强化 ({materialBag[`${move.path}蛊材`] || 0}/3)
              </button>
              {/* CR1: 杀招进化按钮 */}
              <button
                onClick={() => {
                  const check = checkEvolution(move);
                  if (!check.canEvolve) {
                    setEvolveMsg(`进化条件不足: ${check.missingReqs.join('、')}`);
                    setTimeout(() => setEvolveMsg(''), 3000);
                    return;
                  }
                  const result = evolveKillMove(move);
                  if (result.success && result.evolvedKillMove) {
                    const ms = useStore.getState() as any;
                    const newMoves = (ms.killMoves || []).map((m: any) =>
                      m.id === move.id ? result.evolvedKillMove : m
                    );
                    useStore.setState({ killMoves: newMoves } as any);
                  }
                  setEvolveMsg(result.message);
                  setTimeout(() => setEvolveMsg(''), 3000);
                }}
                className="text-[9px] font-button px-1.5 py-0.5 rounded-sm border border-rg-gold/20 text-rg-gold/60 hover:border-rg-gold/40 hover:text-rg-gold transition-micro"
                title={`杀招进化 — 提升转数与倍率`}
              >
                进化
              </button>
              {/* P2修复: 强行使用 — 冷却中可强制使用(承受反噬) */}
              {isOnCooldown && (
                <button
                  onClick={() => {
                    const backlash = 20 + remainingCD * 5;
                    const ms = useStore.getState() as any;
                    if (typeof ms.applyHpDelta === 'function') ms.applyHpDelta(-backlash, '杀招强行使用反噬');
                    // 清除冷却
                    const newCD = { ...(ms.cooldowns || {}) };
                    delete newCD[move.id];
                    useStore.setState({ cooldowns: newCD } as any);
                    setMsg(`强行使用「${move.name}」！承受反噬伤害 ${backlash}`);
                    setTimeout(() => setMsg(''), 2500);
                  }}
                  className="text-[9px] font-button px-1.5 py-0.5 rounded-sm border border-rg-blood-400/20 text-rg-blood-400/60 hover:border-rg-blood-400/40 hover:text-rg-blood-400 transition-micro"
                  title={`强行使用（清除冷却，承受反噬伤害 ${20 + remainingCD * 5}）`}
                >
                  强行({20 + remainingCD * 5})
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
