export const STORAGE_KEYS = {
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
} as const;

export const STORAGE_PREFIXES = {
  SAVE_SLOT: 'gu-zhenren-slot-',
  SAVE_META: 'gu-zhenren-meta-',
} as const;

export function saveSlotKey(slot: number | string): string {
  return `${STORAGE_PREFIXES.SAVE_SLOT}${slot}`;
}

export function saveSlotMetaKey(slot: number | string): string {
  return `${STORAGE_PREFIXES.SAVE_META}${slot}`;
}
