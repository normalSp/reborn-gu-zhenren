import { describe, expect, it } from 'vitest';
import {
  getV016NavigationResolution,
  listV016AuthorityEntries,
  listV016PrimaryNavigation,
  V016_LEGACY_ENTRY_RESOLUTIONS,
  type V016LegacyEntry,
} from './v016-authority-map';

describe('v0.16 authority map', () => {
  it('freezes the player primary navigation to six grouped entries', () => {
    expect(listV016PrimaryNavigation()).toEqual([
      'map',
      'actions',
      'role',
      'gu_dao',
      'world',
      'records',
    ]);
    expect(listV016PrimaryNavigation()).not.toContain('free_goal');
    expect(listV016PrimaryNavigation()).not.toContain('inheritance');
    expect(listV016PrimaryNavigation()).not.toContain('gu_inventory');
  });

  it('maps all legacy toolbar entries into grouped or gated destinations', () => {
    const expectedEntries: V016LegacyEntry[] = [
      'free_goal',
      'gu_inventory',
      'kill_moves',
      'refine',
      'material_bag',
      'attributes',
      'aperture',
      'characters',
      'dao_marks',
      'achievements',
      'events',
      'qingmao_demo',
      'mortal_battle_demo',
      'group_battle_demo',
      'large_group_battle_demo',
      'training_ground',
      'squad',
      'merchant',
      'inheritance',
      'story_anchor',
      'ending',
    ];
    expect(V016_LEGACY_ENTRY_RESOLUTIONS.map(item => item.legacyEntry).sort()).toEqual([...expectedEntries].sort());
    expect(getV016NavigationResolution('free_goal')).toMatchObject({ target: 'actions', mode: 'hub_tab' });
    expect(getV016NavigationResolution('gu_inventory')).toMatchObject({ target: 'gu_dao', mode: 'hub_tab' });
    expect(getV016NavigationResolution('qingmao_demo')).toMatchObject({ target: 'world', mode: 'dev_drawer' });
    expect(getV016NavigationResolution('inheritance')).toMatchObject({ target: 'world', mode: 'scene_gated' });
  });

  it('keeps DeepSeek, UI, economy, and social authority constrained', () => {
    const entries = listV016AuthorityEntries();
    expect(entries.find(item => item.id === 'ui_grouping')?.forbiddenInV016).toEqual(expect.arrayContaining([
      'grant rewards',
      'unlock locations',
      'change faction',
      'decide NPC life or capture',
    ]));
    expect(entries.find(item => item.id === 'deepseek_runtime')?.forbiddenInV016).toEqual(expect.arrayContaining([
      'write rewards',
      'write locations',
      'write faction identity',
      'write NPC life',
      'write canon facts',
    ]));
    expect(entries.find(item => item.id === 'shop_refine_legacy')?.forbiddenInV016).toEqual(expect.arrayContaining([
      'open formal price table',
      'complete recipe success',
      'grant Gu',
    ]));
    expect(entries.find(item => item.id === 'living_world_social')?.forbiddenInV016).toEqual(expect.arrayContaining([
      'write formal standing',
      'write warrants',
      'write recruitment',
      'decide NPC life',
    ]));
  });
});
