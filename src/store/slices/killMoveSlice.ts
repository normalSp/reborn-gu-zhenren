import type { KillMove } from '../../types';

interface KillMoveSlice {
  killMoves: KillMove[];
  cooldowns: Record<string, number>;
  learnKillMove: (move: KillMove) => void;
  useKillMove: (id: string) => void;
  tickCooldowns: () => void;
}

export const createKillMoveSlice = (set: any, get: any): KillMoveSlice => ({
  killMoves: [],
  cooldowns: {},
  learnKillMove: (move) => set((s: KillMoveSlice) => ({
    killMoves: [...s.killMoves, move],
  })),
  useKillMove: (id) => set((s: KillMoveSlice) => {
    const move = s.killMoves.find(m => m.id === id);
    if (!move) return s;
    return { cooldowns: { ...s.cooldowns, [id]: move.cooldown } };
  }),
  tickCooldowns: () => set((s: KillMoveSlice) => {
    const updated: Record<string, number> = {};
    for (const [id, cd] of Object.entries(s.cooldowns)) {
      if (cd > 1) updated[id] = cd - 1;
    }
    return { cooldowns: updated };
  }),
});
