import type { KillMove, KillMoveProficiency } from '../../types';
import { incrementUsage, getProficiencyCooldownBonus } from '../../engine/killmove-bridge';

interface KillMoveSlice {
  killMoves: KillMove[];
  cooldowns: Record<string, number>;
  learnKillMove: (move: KillMove) => void;
  /** B2.0: 使用杀招 — 设置冷却 + 递增熟练度 */
  useKillMove: (id: string) => void;
  tickCooldowns: () => void;
  /** B2.0: 主动传授杀招（宗师级杀招解锁） */
  teachKillMove: (move: KillMove) => boolean;
  /** B3.2: 材料强化杀招 — 消耗同流派材料提升倍率（持续N回合） */
  enhanceKillMove: (id: string) => { success: boolean; message: string };
}

export const createKillMoveSlice = (set: any, get: any): KillMoveSlice => ({
  killMoves: [],
  cooldowns: {},
  learnKillMove: (move) => set((s: KillMoveSlice) => ({
    killMoves: [...s.killMoves, move],
  })),
  // ═══ B2.0: 使用杀招 — 冷却 + 熟练度递增 ═══
  useKillMove: (id) => set((s: KillMoveSlice) => {
    const idx = s.killMoves.findIndex(m => m.id === id);
    if (idx < 0) return s;
    const move = s.killMoves[idx];
    const newMoves = [...s.killMoves];

    // 递增熟练度
    const { proficiency, usageCount } = incrementUsage(move);
    const updatedMove: KillMove = { ...move, usageCount };
    if (proficiency !== undefined) {
      updatedMove.proficiency = proficiency;
      // 熟练度提升 → 日志
      const profLabels: Record<number, string> = { 1: '熟练', 2: '精通', 3: '大师', 4: '宗师' };
      const logStore = get() as any;
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('combat', `杀招「${move.name}」熟练度提升至【${profLabels[proficiency] || '入门'}】`, {
          killMoveId: id, proficiency,
        });
      }
      // 宗师级解锁传授
      if (proficiency >= 4) updatedMove.canTeach = true;
    }
    newMoves[idx] = updatedMove;

    // 冷却（含熟练度减免）
    const cdReduction = getProficiencyCooldownBonus(move.proficiency);
    const effectiveCd = Math.max(1, move.cooldown - cdReduction);

    return {
      killMoves: newMoves,
      cooldowns: { ...s.cooldowns, [id]: effectiveCd },
      // ═══ GSAP: 写入 activeKillerMove 触发杀招释放动画 ═══
      activeKillerMove: { name: move.name, path: move.path, multiplier: move.multiplier },
    };
  }),
  tickCooldowns: () => set((s: KillMoveSlice) => {
    const updated: Record<string, number> = {};
    for (const [id, cd] of Object.entries(s.cooldowns)) {
      if (cd > 1) updated[id] = cd - 1;
    }
    return { cooldowns: updated };
  }),
  // ═══ B2.0: 传授杀招（仅宗师级可用） ═══
  teachKillMove: (move) => {
    const s = get() as KillMoveSlice;
    const existing = s.killMoves.find(m => m.id === move.id);
    if (!existing || !existing.canTeach) return false;
    set((st: KillMoveSlice) => ({
      killMoves: [...st.killMoves, { ...move, source: 'taught', canTeach: false }],
    }));
    return true;
  },
  // ═══ B3.2: 材料强化杀招 — 消耗同流派蛊材提升倍率 ═══
  enhanceKillMove: (id) => {
    const s = get() as KillMoveSlice;
    const idx = s.killMoves.findIndex(m => m.id === id);
    if (idx < 0) return { success: false, message: '杀招不存在' };
    const km = s.killMoves[idx];
    const fullStore = get() as any;
    const matBag = fullStore.materialBag || {};
    const matName = `${km.path}蛊材`;
    if ((matBag[matName] || 0) < 3) {
      return { success: false, message: `${matName}不足（需3份）` };
    }
    fullStore.removeMaterial?.(matName, 3);
    const newMoves = [...s.killMoves];
    newMoves[idx] = { ...km, multiplier: km.multiplier * 1.2 };
    set({ killMoves: newMoves });
    return { success: true, message: `「${km.name}」已强化——倍率临时提升20%` };
  },
});
