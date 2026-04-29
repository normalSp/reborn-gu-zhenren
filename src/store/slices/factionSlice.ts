import type { FactionStanding, CharacterRelation } from '../../types';

interface FactionSlice {
  standings: Record<string, FactionStanding>;
  characterRelations: CharacterRelation[];
  updateStanding: (factionId: string, delta: number) => void;
  updateRelation: (charId: string, update: Partial<CharacterRelation>) => void;
}

export const createFactionSlice = (set: any, get: any): FactionSlice => ({
  standings: {},
  characterRelations: [],
  updateStanding: (factionId, delta) => set((s: FactionSlice) => ({
    standings: {
      ...s.standings,
      [factionId]: {
        ...s.standings[factionId],
        standing: Math.max(-100, Math.min(100, (s.standings[factionId]?.standing || 0) + delta)),
      },
    },
  })),
  updateRelation: (charId, update) => set((s: FactionSlice) => ({
    characterRelations: s.characterRelations.map(r =>
      r.character_id === charId ? { ...r, ...update } : r
    ),
  })),
});
