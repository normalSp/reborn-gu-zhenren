import type { Talent } from '../../types';

interface TalentSlice {
  selectedTalents: Talent[];
  activeModifiers: any[];
  selectTalent: (talent: Talent) => void;
}

export const createTalentSlice = (set: any, get: any): TalentSlice => ({
  selectedTalents: [],
  activeModifiers: [],
  selectTalent: (talent) => set((s: TalentSlice) => ({
    selectedTalents: [...s.selectedTalents, talent],
  })),
});
