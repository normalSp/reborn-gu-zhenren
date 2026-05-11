import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { audioManager } from './utils/audio';
import achievementsData from './canon/achievements.json';
import { useStore } from './store';

// ─── P4修复: AudioContext 首次用户交互时解锁（浏览器自动播放策略）───
let audioInitDone = false;
function initAudioOnInteraction() {
  if (audioInitDone) return;
  audioInitDone = true;
  audioManager.init();
  console.log('[Audio] 音频系统已激活 (Web Audio API)');
  // 取消注册所有监听器
  ['click', 'keydown', 'touchstart'].forEach(ev => {
    document.removeEventListener(ev, initAudioOnInteraction);
  });
}
['click', 'keydown', 'touchstart'].forEach(ev => {
  document.addEventListener(ev, initAudioOnInteraction, { once: false });
});

function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const element = target.closest('button,a,[role="button"],input,select,textarea,summary,[data-audio-click]');
  if (!element) return false;
  if ((element as HTMLButtonElement).disabled || element.getAttribute('aria-disabled') === 'true') return false;
  return !element.closest('[data-audio-muted="true"]');
}

let lastHoverAt = 0;
document.addEventListener('pointerup', event => {
  if (!isInteractiveElement(event.target)) return;
  initAudioOnInteraction();
  const target = event.target as Element;
  const confirmLike = Boolean(target.closest('[data-audio-confirm="true"],[data-testid*="commit"],[data-testid*="confirm"]'));
  audioManager.playUi(confirmLike ? 'confirm' : 'click');
});
document.addEventListener('pointerover', event => {
  if (!isInteractiveElement(event.target)) return;
  const now = Date.now();
  if (now - lastHoverAt < 90) return;
  lastHoverAt = now;
  audioManager.playUi('hover');
});

// ─── P2修复: 启动时加载成就定义到 store ───
try {
  const raw = (achievementsData as any).achievements || [];
  useStore.getState().loadAchievementDefinitions(raw);
  console.log(`[Achievement] 已加载 ${raw.length} 个成就定义`);
} catch (e) {
  console.warn('[Achievement] 成就定义加载失败:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
