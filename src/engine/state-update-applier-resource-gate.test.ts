import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyStateUpdate } from './state-update-applier';

const mocks = vi.hoisted(() => ({
  store: undefined as any,
}));

vi.mock('../store', () => ({
  useStore: {
    getState: () => mocks.store,
  },
}));

function resetStore(grand = 4) {
  mocks.store = {
    profile: { realm: { grand } },
    flags: {},
    materialBag: {},
    addMaterial: vi.fn((name: string, qty: number) => {
      mocks.store.materialBag[name] = (mocks.store.materialBag[name] || 0) + qty;
    }),
    setFlag: vi.fn((key: string, value: unknown) => {
      mocks.store.flags[key] = value;
    }),
    addGameLog: vi.fn(),
  };
}

describe('state-update-applier resource ecology gates', () => {
  beforeEach(() => {
    resetStore();
  });

  it('downgrades mortal immortal-material rewards into rumors instead of inventory', () => {
    applyStateUpdate({
      materials: {
        add: {
          'immortal material shard': 2,
        },
      },
    } as any);

    expect(mocks.store.addMaterial).not.toHaveBeenCalled();
    expect(mocks.store.flags.aiRumorDiscoveries).toEqual([
      expect.objectContaining({
        type: 'resource_rumor',
        name: 'immortal material shard',
        source: 'v080-scene-time-resource-gate',
      }),
    ]);
    expect(mocks.store.addGameLog).toHaveBeenCalledWith(
      'pipeline',
      expect.stringContaining('immortal material shard'),
      expect.objectContaining({ disposition: 'downgrade_to_rumor' }),
    );
  });

  it('blocks mortal Treasure Yellow Heaven material rewards outright', () => {
    applyStateUpdate({
      materials: {
        add: {
          'treasure yellow heaven core lot': 1,
        },
      },
    } as any);

    expect(mocks.store.addMaterial).not.toHaveBeenCalled();
    expect(mocks.store.flags.aiRumorDiscoveries).toBeUndefined();
    expect(mocks.store.addGameLog).toHaveBeenCalledWith(
      'pipeline',
      expect.stringContaining('treasure yellow heaven core lot'),
      expect.objectContaining({ disposition: 'block' }),
    );
  });

  it('allows ordinary materials through the existing inventory path', () => {
    applyStateUpdate({
      materials: {
        add: {
          'ordinary gu material': 3,
        },
      },
    } as any);

    expect(mocks.store.addMaterial).toHaveBeenCalledWith('ordinary gu material', 3);
    expect(mocks.store.materialBag['ordinary gu material']).toBe(3);
  });
});
