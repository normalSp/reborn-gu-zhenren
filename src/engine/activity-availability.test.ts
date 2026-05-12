import { describe, expect, it } from 'vitest';
import { deriveActivityAvailabilityContext } from './activity-availability';

const baseStore = {
  profile: { realm: { grand: 1 } },
  vitals: { essenceType: 'mortal' },
  flags: { currentLocation: '古月山寨' },
  currentChapterId: 'qingmaoshan',
};

describe('deriveActivityAvailabilityContext', () => {
  it('locks wild actions inside Gu Yue village for mortal starts', () => {
    const ctx = deriveActivityAvailabilityContext(baseStore);
    expect(ctx.locationContext).toBe('safe');
    expect(ctx.fieldActionsAllowed).toBe(false);
    expect(ctx.fieldActionReason).toContain('安全');
  });

  it('does not expose aperture actions to mortal starts', () => {
    const ctx = deriveActivityAvailabilityContext({
      ...baseStore,
      flags: { currentLocation: '仙窍' },
    });
    expect(ctx.isImmortal).toBe(false);
    expect(ctx.locationContext).not.toBe('aperture');
  });

  it('locks actions while an NPC dialogue is active', () => {
    const ctx = deriveActivityAvailabilityContext({
      ...baseStore,
      flags: { currentLocation: '野外森林' },
      activeDialogue: { npcName: '商心慈' },
    });
    expect(ctx.sceneLocked).toBe(true);
    expect(ctx.fieldActionsAllowed).toBe(false);
  });

  it('locks actions while a battlefield encounter is active', () => {
    const ctx = deriveActivityAvailabilityContext({
      ...baseStore,
      flags: { currentLocation: '野外森林' },
      battlefieldCombatState: { battleId: 'battlefield_1', phase: 'player_turn' },
      combatEncounterState: { status: 'active' },
    });

    expect(ctx.sceneMode).toBe('combat');
    expect(ctx.sceneLocked).toBe(true);
    expect(ctx.fieldActionsAllowed).toBe(false);
    expect(ctx.fieldActionReason).toContain('战斗中');
  });
});
