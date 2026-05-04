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
