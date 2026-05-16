import { describe, expect, it } from 'vitest';
import { saveSlotKey, saveSlotMetaKey, STORAGE_KEYS, STORAGE_PREFIXES } from './storageKeys';

describe('storage key registry', () => {
  it('preserves existing localStorage key strings', () => {
    expect(STORAGE_KEYS).toMatchObject({
      MAIN_SAVE: 'gu-zhenren-save',
      ACHIEVEMENTS: 'gu-zhenren-achievements',
      ACHIEVEMENT_PROGRESS: 'gu-zhenren-achievement-progress',
      DEEPSEEK_API_KEY: 'deepseek_api_key',
      FONT_SIZE: 'gu-font-size',
      SOUND_SETTINGS: 'gu-zhenren-sound-settings',
      UNLOCKED_ORIGINS: 'gu-zhenren-unlocked-origins',
      TUTORIAL_COMPLETED: 'gu-zhenren-tutorial-completed',
      TUTORIAL_SKIPPED: 'gu-zhenren-tutorial-skipped',
      DIAGNOSTICS: 'reborn-v070c-diagnostics',
    });
    expect(STORAGE_PREFIXES.SAVE_SLOT).toBe('gu-zhenren-slot-');
    expect(STORAGE_PREFIXES.SAVE_META).toBe('gu-zhenren-meta-');
  });

  it('builds slot keys without changing legacy prefixes', () => {
    expect(saveSlotKey(2)).toBe('gu-zhenren-slot-2');
    expect(saveSlotMetaKey('03')).toBe('gu-zhenren-meta-03');
  });
});
