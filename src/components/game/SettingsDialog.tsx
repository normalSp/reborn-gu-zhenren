import { useState } from 'react';
import { useStore } from '../../store';

// ─── API Key 管理 ───
const API_KEY_STORAGE = 'deepseek_api_key';

function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function SettingsDialog() {
  const isSettingsOpen = useStore(s => s.isSettingsOpen);
  const toggleSettings = useStore(s => s.toggleSettings);
  const typewriterSpeed = useStore(s => s.typewriterSpeed);
  const setTypewriterSpeed = useStore(s => s.setTypewriterSpeed);
  const soundState = useStore(s => s.soundState);
  const setMasterVolume = useStore(s => s.setMasterVolume);
  const setBgmVolume = useStore(s => s.setBgmVolume);
  const setSfxVolume = useStore(s => s.setSfxVolume);
  const toggleMute = useStore(s => s.toggleMute);

  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('gu-font-size') || '16', 10);
  });
  const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey());

  if (!isSettingsOpen) return null;

  const handleFontSize = (val: number) => {
    setFontSize(val);
    localStorage.setItem('gu-font-size', String(val));
    document.documentElement.style.fontSize = val + 'px';
  };

  const handleTypewriter = (val: number) => {
    setTypewriterSpeed(Math.max(1, Math.min(100, val)));
  };

  const handleApiKeySave = () => {
    setApiKey(apiKeyInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={toggleSettings}>
      <div className="absolute inset-0 bg-rg-ink-800/70 backdrop-blur-sm" />

      <div
        className="relative z-10 bg-rg-ink-700/95 border border-rg-ink-300/15 rounded-xl p-6 max-w-sm w-full mx-4 backdrop-blur-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-rg-gold font-narrative text-lg">设置</h2>
          <button
            onClick={toggleSettings}
            className="text-rg-ink-300 hover:text-rg-paper-100 text-xs font-button transition-micro"
          >
            关闭
          </button>
        </div>

        <div className="space-y-5">
          {/* ─── 字体大小 ─── */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-rg-paper-200/70 text-xs font-panel">字体大小</span>
              <span className="text-rg-gold text-xs font-panel">{fontSize}px</span>
            </div>
            <input
              type="range" min="12" max="24" value={fontSize}
              onChange={e => handleFontSize(Number(e.target.value))}
              className="w-full h-1.5 bg-rg-ink-900 rounded-full appearance-none cursor-pointer accent-rg-gold"
            />
          </div>

          {/* ─── 打字机速度 ─── */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-rg-paper-200/70 text-xs font-panel">打字机速度</span>
              <span className="text-rg-gold text-xs font-panel">{typewriterSpeed}ms/字</span>
            </div>
            <input
              type="range" min="1" max="80" value={typewriterSpeed}
              onChange={e => handleTypewriter(Number(e.target.value))}
              className="w-full h-1.5 bg-rg-ink-900 rounded-full appearance-none cursor-pointer accent-rg-gold"
            />
            <div className="flex justify-between text-[10px] font-panel text-rg-paper-200/30 mt-0.5">
              <span>快</span><span>慢</span>
            </div>
          </div>

          {/* ─── 音频控制 ─── */}
          <div className="border-t border-rg-ink-300/10 pt-4 mt-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-rg-paper-200/70 text-xs font-panel">音频设置</span>
              <button
                onClick={toggleMute}
                className={`text-[10px] font-button px-2 py-1 rounded-sm border transition-micro ${
                  soundState.muted
                    ? 'border-rg-blood-400/30 text-rg-blood-400 bg-rg-blood-400/10'
                    : 'border-rg-jade-400/30 text-rg-jade-400 bg-rg-jade-400/10'
                }`}
              >
                {soundState.muted ? '已静音' : '播放中'}
              </button>
            </div>

            {/* 主音量 */}
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-rg-paper-200/70 text-[10px] font-panel">主音量</span>
                <span className="text-rg-gold text-[10px] font-panel">{Math.round(soundState.masterVolume * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={soundState.masterVolume}
                onChange={e => setMasterVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-rg-ink-900 rounded-full appearance-none cursor-pointer accent-rg-gold"
              />
            </div>

            {/* BGM 音量 */}
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-rg-paper-200/70 text-[10px] font-panel">背景音乐</span>
                <span className="text-rg-gold text-[10px] font-panel">{Math.round(soundState.bgmVolume * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={soundState.bgmVolume}
                onChange={e => setBgmVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-rg-ink-900 rounded-full appearance-none cursor-pointer accent-rg-gold"
              />
            </div>

            {/* SFX 音量 */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-rg-paper-200/70 text-[10px] font-panel">音效</span>
                <span className="text-rg-gold text-[10px] font-panel">{Math.round(soundState.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={soundState.sfxVolume}
                onChange={e => setSfxVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-rg-ink-900 rounded-full appearance-none cursor-pointer accent-rg-gold"
              />
            </div>
          </div>

          {/* ─── API Key ─── */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-rg-paper-200/70 text-xs font-panel">DeepSeek API Key</span>
            </div>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-rg-ink-900 border border-rg-ink-300/15 rounded px-3 py-1.5 text-rg-paper-200 text-xs font-panel outline-none focus:border-rg-gold/30 transition-micro"
            />
            <button
              onClick={handleApiKeySave}
              className="mt-2 text-xs font-button px-3 py-1 rounded-sm border border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10 transition-micro"
            >
              保存 Key
            </button>
          </div>
        </div>

        <p className="text-rg-paper-200/20 text-[10px] font-panel text-center mt-5">
          设置自动保存在浏览器本地
        </p>
      </div>
    </div>
  );
}
