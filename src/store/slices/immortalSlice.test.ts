import { describe, expect, it, vi } from 'vitest';
import { createApertureSlice } from './immortalSlice';

function makeGu(id: string, name: string) {
  return {
    id,
    specId: name,
    name,
    tier: 5,
    path: '月道',
    currentState: 'optimal',
    hungerCounter: 0,
  };
}

describe('aperture storage migration', () => {
  it('moves mortal inventory into aperture storage without leaving duplicate source Gu', () => {
    let state: any = {
      inventory: [makeGu('moon', '月光蛊'), makeGu('stone', '石皮蛊')],
      materialBag: { 月华草: 2 },
      materialBagCapacity: 20,
      apertureInventory: {
        gu: [makeGu('moon', '月光蛊')],
        materials: { 陈年酒: 1 },
        immortalMaterials: {},
      },
      addGameLog: vi.fn(),
    };
    const set = (patch: any) => {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    };
    const get = () => state;
    state = { ...state, ...createApertureSlice(set, get) };
    state.apertureInventory = {
      gu: [makeGu('moon', '月光蛊')],
      materials: { 陈年酒: 1 },
      immortalMaterials: {},
    };

    state.migrateToApertureStorage();

    expect(state.inventory).toEqual([]);
    expect(state.apertureInventory.gu.map((gu: any) => gu.name)).toEqual(['月光蛊', '石皮蛊']);
    expect(state.apertureInventory.materials).toMatchObject({ 陈年酒: 1, 月华草: 2 });
    expect(state.materialBagCapacity).toBe(Infinity);
  });
});
