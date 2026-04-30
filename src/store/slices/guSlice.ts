import type { GuInstance } from '../../types';

interface GuSlice {
  inventory: GuInstance[];
  materialBag: Record<string, number>;
  addGu: (gu: GuInstance) => void;
  removeGu: (id: string) => void;
  updateGuState: (id: string, state: GuInstance['currentState']) => void;
  toggleActive: (id: string) => void;
  addMaterial: (name: string, qty: number) => void;
  removeMaterial: (name: string, qty: number) => boolean;
}

export const createGuSlice = (set: any, get: any): GuSlice => ({
  inventory: [],
  materialBag: {},
  addGu: (gu) => set((s: GuSlice) => ({ inventory: [...s.inventory, gu] })),
  removeGu: (id) => set((s: GuSlice) => ({ inventory: s.inventory.filter(g => g.id !== id) })),
  updateGuState: (id, state) => set((s: GuSlice) => ({
    inventory: s.inventory.map(g => g.id === id ? { ...g, currentState: state } : g)
  })),
  toggleActive: (id) => set((s: GuSlice) => ({
    inventory: s.inventory.map(g =>
      g.id === id ? { ...g, active: g.bonded ? true : !(g as any).active } : g
    )
  })),
  addMaterial: (name, qty) => set((s: GuSlice) => ({
    materialBag: { ...s.materialBag, [name]: (s.materialBag[name] || 0) + qty }
  })),
  removeMaterial: (name, qty) => {
    const state = get() as GuSlice;
    if ((state.materialBag[name] || 0) < qty) return false;
    set((s: GuSlice) => ({ materialBag: { ...s.materialBag, [name]: s.materialBag[name] - qty } }));
    return true;
  },
});
