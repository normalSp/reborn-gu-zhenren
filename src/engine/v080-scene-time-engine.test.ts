import { describe, expect, it } from 'vitest';
import {
  buildSceneTimeContext,
  resolveCurrentCanonAnchorId,
  validateResourceEcologyGate,
  validateSceneAction,
} from './v080-scene-time-engine';

const makeStore = (overrides: Record<string, any> = {}) => ({
  profile: { realm: { grand: 1 } },
  flags: {},
  currentChapterId: 'qingmaoshan',
  currentDomain: '南疆',
  gameTime: { period: 'day' },
  ...overrides,
});

describe('v080 scene time engine', () => {
  it('maps front and midgame chapters to canon anchor ids', () => {
    expect(resolveCurrentCanonAnchorId(makeStore())).toBe('qingmao_mountain');
    expect(resolveCurrentCanonAnchorId(makeStore({ currentChapterId: 'three_kings' }))).toBe('san_wang_mountain');
    expect(resolveCurrentCanonAnchorId(makeStore({ currentChapterId: 'wangting' }))).toBe('northern_plains_wangting');
  });

  it('blocks unrelated hostile or ambush jumps while dialogue is locked', () => {
    const validation = validateSceneAction(
      makeStore({ activeDialogue: { npcId: 'elder' }, flags: { sceneLock: 'dialogue' } }),
      'ambush',
    );

    expect(validation.allowed).toBe(false);
    expect(validation.disposition).toBe('block');
    expect(validation.context.sceneLockState).toBe('dialogue_locked');
  });

  it('downgrades mortal immortal-material gains and blocks Treasure Yellow Heaven trades', () => {
    const mortalStore = makeStore({ profile: { realm: { grand: 4 } } });
    const immortalMaterial = validateResourceEcologyGate(mortalStore, 'immortal_resource_gather', 'immortal material clue');
    const tyh = validateResourceEcologyGate(mortalStore, 'treasure_yellow_heaven', 'treasure yellow heaven auction');

    expect(immortalMaterial.disposition).toBe('downgrade_to_rumor');
    expect(tyh.disposition).toBe('block');
  });

  it('allows high-realm resource actions while still reporting scene context', () => {
    const immortalStore = makeStore({
      profile: { realm: { grand: 6 } },
      flags: { currentScene: 'aperture blessed land' },
    });

    const context = buildSceneTimeContext(immortalStore);
    const validation = validateResourceEcologyGate(immortalStore, 'immortal_resource_gather', 'immortal material');

    expect(context.locationContext).toBe('aperture');
    expect(validation.disposition).toBe('allow');
  });
});
