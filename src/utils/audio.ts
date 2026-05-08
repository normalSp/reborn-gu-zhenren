/**
 * ═══ 音频管理器 — P2-7 增强 ═══
 *
 * 五通道音效系统：master / bgm / sfx / voice / ui。
 * 零外部依赖，纯浏览器 Web Audio API。
 *
 * 使用方式：
 *   import { audioManager } from '../utils/audio';
 *   audioManager.playBgm('bgm/nanjiang.mp3');  // 切换 BGM
 *   audioManager.playSfx('hurt');               // 播放 SFX
 *   audioManager.playUi('select');             // 播放 UI 音效
 */
import { audioSourceManifest } from '../engine/audio-resource-policy';
import { recordDiagnostic } from './diagnostic-log';

// ─── 类型定义 ───

type OscType = OscillatorType;
type SfxName = 'breakthrough' | 'dice' | 'hurt' | 'death' | 'select' | 'save' | 'achievement';
type UiName = 'select' | 'click' | 'hover' | 'confirm' | 'cancel' | 'save';

interface BgmTrack {
  source: AudioBufferSourceNode | null;
  gain: GainNode | null;
  url: string | null;
  buffer: AudioBuffer | null;
  loading: boolean;
}

interface SfxDef {
  freq: number;
  dur: number;
  type: OscType;
  vol: number;
  sequence?: { freq: number; dur: number; delay: number }[];
}

// ─── SFX 预设表 ───

const SFX_PRESETS: Record<SfxName, SfxDef> = {
  breakthrough: { freq: 523, dur: 0.3, type: 'sine', vol: 0.06, sequence: [
    { freq: 523, dur: 0.3, delay: 0 },
    { freq: 659, dur: 0.3, delay: 150 },
    { freq: 784, dur: 0.5, delay: 300 },
  ]},
  dice: { freq: 200, dur: 0.06, type: 'square', vol: 0.03, sequence: [
    { freq: 300, dur: 0.06, delay: 80 },
    { freq: 450, dur: 0.06, delay: 160 },
    { freq: 250, dur: 0.06, delay: 240 },
    { freq: 380, dur: 0.06, delay: 320 },
  ]},
  hurt: { freq: 120, dur: 0.25, type: 'sawtooth', vol: 0.05, sequence: [
    { freq: 120, dur: 0.25, delay: 0 },
    { freq: 80, dur: 0.3, delay: 100 },
  ]},
  death: { freq: 440, dur: 0.2, type: 'sine', vol: 0.06, sequence: [
    { freq: 440, dur: 0.2, delay: 0 },
    { freq: 330, dur: 0.2, delay: 200 },
    { freq: 220, dur: 0.4, delay: 400 },
    { freq: 110, dur: 0.6, delay: 600 },
  ]},
  select: { freq: 660, dur: 0.08, type: 'sine', vol: 0.04 },
  save: { freq: 440, dur: 0.12, type: 'sine', vol: 0.04, sequence: [
    { freq: 440, dur: 0.12, delay: 0 },
    { freq: 554, dur: 0.12, delay: 100 },
  ]},
  achievement: { freq: 784, dur: 0.12, type: 'sine', vol: 0.05, sequence: [
    { freq: 784, dur: 0.12, delay: 0 },
    { freq: 988, dur: 0.16, delay: 110 },
  ]},
};

const UI_PRESETS: Record<UiName, { freq: number; dur: number; type: OscType; vol: number }> = {
  select:  { freq: 660, dur: 0.08, type: 'sine', vol: 0.04 },
  click:   { freq: 440, dur: 0.05, type: 'square', vol: 0.02 },
  hover:   { freq: 880, dur: 0.04, type: 'sine', vol: 0.015 },
  confirm: { freq: 523, dur: 0.12, type: 'sine', vol: 0.05 },
  cancel:  { freq: 330, dur: 0.12, type: 'sine', vol: 0.04 },
  save:    { freq: 440, dur: 0.15, type: 'sine', vol: 0.05 },
};

const SFX_MANIFEST_ID_BY_NAME: Partial<Record<SfxName, string>> = {
  hurt: 'sfx_combat_hit_3',
  breakthrough: 'sfx_achievement_unlock',
  achievement: 'sfx_achievement_unlock',
  select: 'sfx_ui_click',
  save: 'sfx_ui_confirm',
};

// ─── AudioManager 类 ───

class AudioManager {
  private ctx: AudioContext | null = null;
  private bgm: BgmTrack = { source: null, gain: null, url: null, buffer: null, loading: false };
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private uiGain: GainNode | null = null;
  private voiceSource: AudioBufferSourceNode | null = null;
  private initialized = false;

  // 音量回调（由 soundSlice 注入）
  private getBgmVol: () => number = () => 0.35;
  private getSfxVol: () => number = () => 0.49;
  private getVoiceVol: () => number = () => 0.56;
  private getUiVol: () => number = () => 0.49;
  private onVoiceActive: (active: boolean) => void = () => {};

  /** 获取或创建 AudioContext */
  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** 延迟初始化音频图（需要用户交互后才能创建 AudioContext） */
  init(): void {
    if (this.initialized) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    this.masterGain = ctx.createGain();
    this.bgmGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.voiceGain = ctx.createGain();
    this.uiGain = ctx.createGain();

    this.masterGain.connect(ctx.destination);
    this.bgmGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.voiceGain.connect(this.masterGain);
    this.uiGain.connect(this.masterGain);

    this.masterGain.gain.value = 0.7;
    this.bgmGain.gain.value = 0.5;
    this.sfxGain.gain.value = 0.7;
    this.voiceGain.gain.value = 0.8;
    this.uiGain.gain.value = 0.7;

    this.initialized = true;
  }

  /** 设置音量回调 */
  setVolumeGetters(
    getBgm: () => number,
    getSfx: () => number,
    getVoice: () => number = () => 0.56,
    getUi: () => number = () => 0.49,
  ): void {
    this.getBgmVol = getBgm;
    this.getSfxVol = getSfx;
    this.getVoiceVol = getVoice;
    this.getUiVol = getUi;
  }

  setVoiceActiveHandler(handler: (active: boolean) => void): void {
    this.onVoiceActive = handler;
  }

  /** 更新 BGM 增益节点 */
  private updateBgmGain(): void {
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.getBgmVol();
    }
  }

  /** 更新 SFX 增益节点 */
  private updateSfxGain(): void {
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.getSfxVol();
    }
  }

  private updateVoiceGain(): void {
    if (this.voiceGain) {
      this.voiceGain.gain.value = this.getVoiceVol();
    }
  }

  private updateUiGain(): void {
    if (this.uiGain) {
      this.uiGain.gain.value = this.getUiVol();
    }
  }

  // ─── BGM 播放 ───

  /** 播放 BGM（自动停止当前 BGM） */
  playBgm(url: string): void {
    this.init();
    const ctx = this.getCtx();
    if (!ctx || !this.bgmGain) return;

    // 停止当前 BGM
    this.stopBgm();

    // 加载并播放新的 BGM
    this.bgm.url = url;
    this.bgm.loading = true;

    this.loadAudioBuffer(url)
      .then(buffer => {
        if (this.bgm.url !== url) return; // 已被替换
        this.bgm.buffer = buffer;
        this.bgm.loading = false;
        this.startBgmPlayback(ctx);
      })
      .catch(() => {
        this.bgm.loading = false;
        console.warn(`[Audio] 无法加载 BGM: ${url}`);
        recordDiagnostic({
          category: 'audio',
          severity: 'warning',
          message: 'BGM 加载失败',
          detail: { url },
        });
      });
  }

  /** 创建 BGM 播放节点 */
  private startBgmPlayback(ctx: AudioContext): void {
    if (!this.bgm.buffer || !this.bgmGain) return;

    const source = ctx.createBufferSource();
    source.buffer = this.bgm.buffer;
    source.loop = true;
    source.connect(this.bgmGain);
    source.start(0);
    this.bgm.source = source;
    this.updateBgmGain();
  }

  /** 加载音频文件为 AudioBuffer */
  private async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    const ctx = this.getCtx();
    if (!ctx) throw new Error('No AudioContext');

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return ctx.decodeAudioData(arrayBuffer);
  }

  /** 停止当前 BGM */
  stopBgm(): void {
    if (this.bgm.source) {
      try { this.bgm.source.stop(); } catch {}
      this.bgm.source.disconnect();
      this.bgm.source = null;
    }
    this.bgm.url = null;
    this.bgm.buffer = null;
    this.bgm.loading = false;
  }

  /**
   * BGM 交叉淡入淡出
   * @param url 新 BGM URL
   * @param duration 淡入淡出时长（秒）
   */
  crossFade(url: string, duration: number = 1.0): void {
    this.init();
    const ctx = this.getCtx();
    if (!ctx || !this.bgmGain) {
      this.playBgm(url);
      return;
    }

    // 如果当前没有 BGM，直接播放
    if (!this.bgm.source) {
      this.playBgm(url);
      return;
    }

    // 淡出旧 BGM
    const oldGain = this.bgm.gain || this.bgmGain;
    const currentTime = ctx.currentTime;
    oldGain.gain.linearRampToValueAtTime(0, currentTime + duration);

    // 加载新 BGM
    this.bgm.url = url;
    this.bgm.loading = true;

    this.loadAudioBuffer(url)
      .then(buffer => {
        if (this.bgm.url !== url) return;
        this.bgm.buffer = buffer;
        this.bgm.loading = false;

        // 停止旧音源
        if (this.bgm.source) {
          try { this.bgm.source.stop(currentTime + duration + 0.1); } catch {}
          this.bgm.source.disconnect();
          this.bgm.source = null;
        }

        // 创建新音源
        const newSource = ctx.createBufferSource();
        newSource.buffer = buffer;
        newSource.loop = true;

        // 新音源用独立增益节点实现淡入
        const newGain = ctx.createGain();
        newGain.gain.setValueAtTime(0, currentTime + duration);
        newGain.gain.linearRampToValueAtTime(this.getBgmVol(), currentTime + duration + duration);
        newSource.connect(newGain);
        newGain.connect(this.bgmGain!);
        newSource.start(currentTime + duration);

        this.bgm.source = newSource;
        this.bgm.gain = newGain;
      })
      .catch(() => {
        this.bgm.loading = false;
        console.warn(`[Audio] crossFade: 无法加载 ${url}`);
        recordDiagnostic({
          category: 'audio',
          severity: 'warning',
          message: 'BGM 淡入失败',
          detail: { url },
        });
      });
  }

  // ─── SFX 播放 ───

  /** 播放 SFX。战斗/成就必须优先真实素材；缺资源时只记录诊断，不再用合成音冒充。 */
  playSfx(name: SfxName): void {
    this.init();
    const ctx = this.getCtx();
    if (!ctx || !this.sfxGain) return;
    this.updateSfxGain();

    if (this.playManifestSfx(name, 'sfx')) return;

    if (name !== 'select' && name !== 'save') {
      recordDiagnostic({
        category: 'audio',
        severity: 'warning',
        message: '非 UI 音效缺少已确认真实素材，已阻止合成 fallback',
        detail: { cue: name },
      });
      return;
    }

    const preset = SFX_PRESETS[name];
    if (!preset) return;

    const effectiveVol = this.getSfxVol();

    if (preset.sequence) {
      for (const step of preset.sequence) {
        this.playToneOnChannel(ctx, this.sfxGain, step.freq, step.dur, preset.type, effectiveVol, step.delay / 1000);
      }
    } else {
      this.playToneOnChannel(ctx, this.sfxGain, preset.freq, preset.dur, preset.type, effectiveVol, 0);
    }
  }

  // ─── UI 音效播放 ───

  /** 播放 UI 音效 */
  playUi(name: UiName): void {
    this.init();
    const ctx = this.getCtx();
    if (!ctx || !this.uiGain) return;
    this.updateUiGain();

    if (this.playManifestSfx(name === 'save' || name === 'confirm' ? 'save' : 'select', 'ui')) return;

    const preset = UI_PRESETS[name];
    if (!preset) return;

    this.playToneOnChannel(ctx, this.uiGain, preset.freq, preset.dur, preset.type, this.getUiVol(), 0);
  }

  /** 播放配音。播放期间通过 soundSlice 触发 BGM -6dB ducking。 */
  playVoice(url: string): void {
    this.init();
    const ctx = this.getCtx();
    if (!ctx || !this.voiceGain) return;
    this.updateVoiceGain();

    if (this.voiceSource) {
      try { this.voiceSource.stop(); } catch {}
      this.voiceSource.disconnect();
      this.voiceSource = null;
    }

    this.onVoiceActive(true);
    this.loadAudioBuffer(url)
      .then(buffer => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.voiceGain!);
        source.onended = () => {
          this.onVoiceActive(false);
          this.voiceSource = null;
        };
        this.voiceSource = source;
        source.start(0);
      })
      .catch(() => {
        this.onVoiceActive(false);
        recordDiagnostic({
          category: 'audio',
          severity: 'warning',
          message: '配音资源加载失败',
          detail: { url },
        });
      });
  }

  private playManifestSfx(name: SfxName, channel: 'sfx' | 'ui'): boolean {
    const manifestId = SFX_MANIFEST_ID_BY_NAME[name];
    if (!manifestId) return false;
    const entry = audioSourceManifest.sfx.find(item => item.id === manifestId);
    if (!entry?.runtimeEnabled || entry.aiOrSyntheticAllowed) return false;
    const ctx = this.getCtx();
    const output = channel === 'ui' ? this.uiGain : this.sfxGain;
    if (!ctx || !output) return false;
    const volume = channel === 'ui' ? this.getUiVol() : this.getSfxVol();
    this.playAudioFileOnChannel(entry.filePath, output, volume);
    return true;
  }

  private playAudioFileOnChannel(url: string, output: GainNode, volume: number): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.loadAudioBuffer(url)
      .then(buffer => {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(output);
        source.start(0);
      })
      .catch(() => {
        recordDiagnostic({
          category: 'audio',
          severity: 'warning',
          message: '音效资源加载失败',
          detail: { url },
        });
      });
  }

  // ─── 底层音频生成 ───

  private playToneOnChannel(
    ctx: AudioContext, output: GainNode,
    freq: number, dur: number, type: OscType,
    vol: number, delaySec: number,
  ): void {
    if (dur <= 0 || freq <= 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const startTime = ctx.currentTime + delaySec;
    gain.gain.setValueAtTime(vol * 0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.connect(gain);
    gain.connect(output);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.01);
  }

  // ─── 全局静音/恢复 ───

  /** 设置主增益静音状态 */
  setMuted(muted: boolean): void {
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.7;
    }
  }

  /** 获取 AudioContext 状态 */
  getContextState(): string {
    return this.ctx?.state ?? 'closed';
  }
}

// ─── 向后兼容的函数导出 ───

/** 全局音频管理器单例 */
export const audioManager = new AudioManager();

/** 播放境界突破音效 */
export function playBreakthroughSound(): void { audioManager.playSfx('breakthrough'); }
/** 播放筛子/随机音效 */
export function playDiceSound(): void { audioManager.playSfx('dice'); }
/** 播放受伤音效 */
export function playHurtSound(): void { audioManager.playSfx('hurt'); }
/** 播放死亡音效 */
export function playDeathSound(): void { audioManager.playSfx('death'); }
/** 播放选择音效 */
export function playSelectSound(): void { audioManager.playSfx('select'); }
/** 播放存档音效 */
export function playSaveSound(): void { audioManager.playSfx('save'); }
/** 播放成就解锁音效 */
export function playAchievementSound(): void { audioManager.playSfx('achievement'); }
