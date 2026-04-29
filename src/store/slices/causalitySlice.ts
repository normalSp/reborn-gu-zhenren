import type { ButterflyEffect } from '../../types';

interface CausalitySlice {
  butterflyEffects: ButterflyEffect[];
  timelineDeviation: number;
  trackEffect: (effect: ButterflyEffect) => void;
  updateDeviation: (delta: number) => void;
}

export const createCausalitySlice = (set: any, get: any): CausalitySlice => ({
  butterflyEffects: [],
  timelineDeviation: 0,
  trackEffect: (effect) => set((s: CausalitySlice) => ({
    butterflyEffects: [...s.butterflyEffects, effect],
  })),
  updateDeviation: (delta) => set((s: CausalitySlice) => ({
    timelineDeviation: Math.max(0, Math.min(100, s.timelineDeviation + delta)),
  })),
});
