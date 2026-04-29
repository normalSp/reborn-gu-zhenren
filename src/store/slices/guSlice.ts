import type { GuInstance } from '../../types';

interface GuSlice {
  inventory: GuInstance[];
  addGu: (gu: GuInstance) => void;
  removeGu: (id: string) => void;
  updateGuState: (id: string, state: GuInstance['currentState']) => void;
}

export const createGuSlice = (set: any, get: any): GuSlice => ({
  inventory: [],
  addGu: (gu) => set((s: GuSlice) => ({ inventory: [...s.inventory, gu] })),
  removeGu: (id) => set((s: GuSlice) => ({ inventory: s.inventory.filter(g => g.id !== id) })),
  updateGuState: (id, state) => set((s: GuSlice) => ({
    inventory: s.inventory.map(g => g.id === id ? { ...g, currentState: state } : g)
  })),
});
