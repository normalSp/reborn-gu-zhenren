import { describe, expect, it } from 'vitest';
import combatConfigRaw from '../canon/combat-config.json';
import { SAVE_FORMAT_VERSION } from '../store/initialState';
import { normalizePartyState } from '../store';

const combatConfig = combatConfigRaw as any;

describe('v0.7.0-b squad data source', () => {
  it('uses combat-config.json as the squad numeric source', () => {
    expect(combatConfig.squad.version).toBe('v0.7.0-b');
    expect(combatConfig.squad.maxPartySize).toBe(4);
    expect(Object.keys(combatConfig.squad.formations).sort()).toEqual(['合击', '掠阵', '斩首', '牵制'].sort());
    expect(combatConfig.squad.rewardArbitrage.enemyGuDropPolicy).toBe('destroy_or_story_whitelist_only');
  });

  it('bumps save format for persistent party fields', () => {
    expect(SAVE_FORMAT_VERSION).toBe(14);
  });

  it('normalizes older party saves into the v0.7.0-b shape', () => {
    const migrated = normalizePartyState({ members: [{ id: 'npc-1' }], maxSize: 4, formation: '牵制' }, 42);
    expect(migrated.members).toHaveLength(1);
    expect(migrated.formation).toBe('牵制');
    expect(migrated.morale).toBe(50);
    expect(migrated.coordination).toBe(50);
    expect(migrated.lastUpdatedTurn).toBe(42);
    expect(migrated.memberCooldowns).toEqual({});
    expect(migrated.memberRolePausedUntil).toEqual({});
  });

  it('rejects non-canon squad formation values during migration', () => {
    const migrated = normalizePartyState({ formation: '圆阵' }, 1);
    expect(migrated.formation).toBeNull();
  });
});
