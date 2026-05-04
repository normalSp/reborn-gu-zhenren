/**
 * 音效 Slice — P2-7
 * 三通道音量管理（master/bgm/sfx）+ mute + localStorage 持久化
 *
 * 集成点：
 * - StatusBar.tsx：音量控制按钮
 * - GameScreen.tsx：场景切换时 crossFade BGM
 * - CombatOverlay.tsx：战斗触发时切换至战斗 BGM
 */

/** 五域 BGM 映射（P3修复：路径指向子目录） */
export const DOMAIN_BGM: Record<string, string> = {
  '南疆': 'bgm/nanjiang/nanjiang.mp3',
  '北原': 'bgm/beiyuan/beiyuan.mp3',
  '东海': 'bgm/donghai/donghai.mp3',
  '西漠': 'bgm/ximo/ximo.mp3',
  '中洲': 'bgm/zhongzhou/zhongzhou.mp3',
};

/** 特殊 BGM */
export const SPECIAL_BGM = {
  combat: 'bgm/combat.mp3',
  menu: 'bgm/menu.mp3',
  death: 'bgm/death.mp3',
};

export interface SoundState {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  muted: boolean;
  currentBgm: string | null;
}

export interface SoundSlice {
  soundState: SoundState;

  /** 设置主音量 (0-1) */
  setMasterVolume: (vol: number) => void;
  /** 设置 BGM 音量 (0-1) */
  setBgmVolume: (vol: number) => void;
  /** 设置 SFX 音量 (0-1) */
  setSfxVolume: (vol: number) => void;
  /** 切换静音 */
  toggleMute: () => void;
  /** 设置当前播放的 BGM */
  setCurrentBgm: (bgm: string | null) => void;
  /** 获取有效 BGM 音量 (master * bgm，考虑静音) */
  getEffectiveBgmVolume: () => number;
  /** 获取有效 SFX 音量 (master * sfx，考虑静音) */
  getEffectiveSfxVolume: () => number;
}

const STORAGE_KEY = 'gu-zhenren-sound-settings';

function loadSoundSettings(): Partial<SoundState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSoundSettings(state: SoundState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      masterVolume: state.masterVolume,
      bgmVolume: state.bgmVolume,
      sfxVolume: state.sfxVolume,
      muted: state.muted,
    }));
  } catch {
    // silently fail
  }
}

export const createSoundSlice = (set: any, get: any): SoundSlice => {
  const saved = loadSoundSettings();

  const initialState: SoundState = {
    masterVolume: saved.masterVolume ?? 0.7,
    bgmVolume: saved.bgmVolume ?? 0.5,
    sfxVolume: saved.sfxVolume ?? 0.7,
    muted: saved.muted ?? false,
    currentBgm: null,
  };

  return {
    soundState: initialState,

    setMasterVolume: (vol) => {
      const clamped = Math.max(0, Math.min(1, vol));
      set((s: any) => {
        const newState = { ...s.soundState, masterVolume: clamped };
        saveSoundSettings(newState);
        return { soundState: newState };
      });
    },

    setBgmVolume: (vol) => {
      const clamped = Math.max(0, Math.min(1, vol));
      set((s: any) => {
        const newState = { ...s.soundState, bgmVolume: clamped };
        saveSoundSettings(newState);
        return { soundState: newState };
      });
    },

    setSfxVolume: (vol) => {
      const clamped = Math.max(0, Math.min(1, vol));
      set((s: any) => {
        const newState = { ...s.soundState, sfxVolume: clamped };
        saveSoundSettings(newState);
        return { soundState: newState };
      });
    },

    toggleMute: () => {
      set((s: any) => {
        const newState = { ...s.soundState, muted: !s.soundState.muted };
        saveSoundSettings(newState);
        return { soundState: newState };
      });
    },

    setCurrentBgm: (bgm) => {
      set((s: any) => ({
        soundState: { ...s.soundState, currentBgm: bgm },
      }));
    },

    getEffectiveBgmVolume: () => {
      const s = get().soundState as SoundState;
      if (s.muted) return 0;
      return s.masterVolume * s.bgmVolume;
    },

    getEffectiveSfxVolume: () => {
      const s = get().soundState as SoundState;
      if (s.muted) return 0;
      return s.masterVolume * s.sfxVolume;
    },
  };
};
