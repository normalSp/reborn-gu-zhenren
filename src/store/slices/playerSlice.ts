import { create } from 'zustand';
import type { PlayerState, RealmInfo, PathType, PathLevel } from '../../types';

interface PlayerSlice extends PlayerState {
  applyStateUpdate: (update: import('../../types').StateUpdate['player']) => void;
  setRealm: (realm: RealmInfo) => void;
  addAttribute: (attr: '资质' | '根骨' | '心智' | '气运', delta: number) => void;
  setHealth: (current: number, max: number) => void;
  setEssence: (current: number, max: number) => void;
  setPrimaryPath: (path: PathType) => void;
  setFlag: (key: string, value: any) => void;
  removeFlag: (key: string) => void;
}

export const createPlayerSlice = (set: any, get: any): PlayerSlice => ({
  profile: { name: '', realm: { grand: 1, sub: '初阶', label: '一转初阶' }, background: '南疆' },
  attributes: { 资质: 5, 根骨: 5, 心智: 5, 气运: 5 },
  vitals: { health: { current: 100, max: 100 }, essence: { current: 100, max: 100 } },
  pathBuild: { primary: '' as PathType, secondary: [], path_levels: {}, dao_marks: {} },
  daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
  flags: {},

  applyStateUpdate: (update) => {
    if (!update) return;
    const state = get();
    // 留空，阶段2B实现
  },
  setRealm: (realm) => set({ profile: { ...get().profile, realm } }),
  addAttribute: (attr, delta) => set((s: PlayerSlice) => ({
    attributes: { ...s.attributes, [attr]: Math.max(0, Math.min(10, s.attributes[attr] + delta)) }
  })),
  setHealth: (current, max) => set({ vitals: { ...get().vitals, health: { current: Math.min(current, max), max } } }),
  setEssence: (current, max) => set({ vitals: { ...get().vitals, essence: { current: Math.min(current, max), max } } }),
  setPrimaryPath: (path) => set((s: PlayerSlice) => ({ pathBuild: { ...s.pathBuild, primary: path } })),
  setFlag: (key, value) => set((s: PlayerSlice) => ({ flags: { ...s.flags, [key]: value } })),
  removeFlag: (key) => set((s: PlayerSlice) => {
    const { [key]: _, ...rest } = s.flags;
    return { flags: rest };
  }),
});
