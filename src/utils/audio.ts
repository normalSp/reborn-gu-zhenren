// ═══ Web Audio API 音效系统 ═══
// 零外部依赖，浏览器原生API

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch { return null; }
}

function enabled(): boolean {
  return localStorage.getItem('gu-audio-on') !== 'false';
}

function playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.08) {
  if (!enabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export function playBreakthroughSound() {
  playTone(523, 0.3, 'sine', 0.06);
  setTimeout(() => playTone(659, 0.3, 'sine', 0.06), 150);
  setTimeout(() => playTone(784, 0.5, 'sine', 0.06), 300);
}

export function playDiceSound() {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => playTone(200 + Math.random() * 400, 0.06, 'square', 0.03), i * 80);
  }
}

export function playHurtSound() {
  playTone(120, 0.25, 'sawtooth', 0.05);
  playTone(80, 0.3, 'sawtooth', 0.04);
}

export function playDeathSound() {
  playTone(440, 0.2, 'sine', 0.06);
  setTimeout(() => playTone(330, 0.2, 'sine', 0.06), 200);
  setTimeout(() => playTone(220, 0.4, 'sine', 0.06), 400);
  setTimeout(() => playTone(110, 0.6, 'sine', 0.06), 600);
}

export function playSelectSound() {
  playTone(660, 0.08, 'sine', 0.04);
}

export function playSaveSound() {
  playTone(440, 0.12, 'sine', 0.04);
  setTimeout(() => playTone(554, 0.12, 'sine', 0.04), 100);
}
