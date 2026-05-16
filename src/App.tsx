import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { useStore } from './store';
import { ErrorBoundary } from './components/game/ErrorBoundary';
import { audioManager } from './utils/audio';
import { installE2eHarness } from './e2e/installE2eHarness';
import type { ScreenState } from './store/slices/uiSlice';

const TRANSITION_MS = 350;

const TitleScreen = lazy(() => import('./components/title/TitleScreen').then(m => ({ default: m.TitleScreen })));
const CharacterCreate = lazy(() => import('./components/game/CharacterCreate').then(m => ({ default: m.CharacterCreate })));
const GameScreen = lazy(() => import('./components/game/GameScreen').then(m => ({ default: m.GameScreen })));
const GameOverScreen = lazy(() => import('./components/game/GameOverScreen').then(m => ({ default: m.GameOverScreen })));
const OriginSelectScreen = lazy(() => import('./components/game/OriginSelectScreen').then(m => ({ default: m.OriginSelectScreen })));
const TimelineSelectScreen = lazy(() => import('./components/game/TimelineSelectScreen').then(m => ({ default: m.TimelineSelectScreen })));
const TimelineConfigScreen = lazy(() => import('./components/game/TimelineConfigScreen').then(m => ({ default: m.TimelineConfigScreen })));

function ScreenFallback() {
  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex items-center justify-center text-rg-paper-200/60 font-panel text-sm">
      载入中...
    </div>
  );
}

function App() {
  const screenState = useStore(s => s.screenState);
  const setScreenState = useStore(s => s.setScreenState);
  const [displayScreen, setDisplayScreen] = useState<ScreenState>(screenState);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    installE2eHarness();
  }, []);

  // ─── P4修复: Zustand soundSlice → AudioManager 音量桥接 ───
  const soundState = useStore(s => s.soundState);
  useEffect(() => {
    audioManager.setVolumeGetters(
      () => {
        const s = useStore.getState();
        return s.getEffectiveBgmVolume();
      },
      () => {
        const s = useStore.getState();
        return s.getEffectiveSfxVolume();
      },
      () => {
        const s = useStore.getState();
        return s.getEffectiveVoiceVolume();
      },
      () => {
        const s = useStore.getState();
        return s.getEffectiveUiVolume();
      },
    );
    audioManager.setVoiceActiveHandler((active) => {
      useStore.getState().setVoiceActive(active);
    });
    audioManager.setMuted(soundState.muted);
  }, [
    soundState.muted,
    soundState.masterVolume,
    soundState.bgmVolume,
    soundState.sfxVolume,
    soundState.voiceVolume,
    soundState.uiVolume,
    soundState.voiceActive,
  ]);

  useEffect(() => {
    if (screenState === displayScreen) return;
    setTransitioning(true);
    const t = setTimeout(() => {
      setDisplayScreen(screenState);
      setTransitioning(false);
    }, TRANSITION_MS);
    return () => clearTimeout(t);
  }, [screenState, displayScreen]);

  const goTo = useCallback((target: ScreenState) => {
    if (transitioning) return;
    setScreenState(target);
  }, [transitioning, setScreenState]);

  const renderScreen = (screen: ScreenState) => {
    const isActive = screen === displayScreen;
    const opacityClass = isActive && !transitioning
      ? 'opacity-100'
      : isActive && transitioning
        ? 'opacity-0'
        : !isActive && transitioning
          ? 'opacity-0'
          : 'hidden';

    const wrapperClass = `transition-opacity duration-${TRANSITION_MS} ${opacityClass}`;

    switch (screen) {
      case 'title':
        return (
          <div className={wrapperClass}>
            <TitleScreen onStart={() => {
              goTo('timeline_select');
            }} onContinue={() => {
              goTo('game_play');
            }} />
          </div>
        );
      case 'origin_select':
        return (
          <div className={wrapperClass}>
            <OriginSelectScreen onNext={() => goTo('character_create')} onBack={() => goTo('timeline_select')} />
          </div>
        );
      case 'timeline_select':
        return (
          <div className={wrapperClass}>
            <TimelineSelectScreen onNext={() => goTo('timeline_config')} onBack={() => goTo('title')} />
          </div>
        );
      case 'timeline_config':
        return (
          <div className={wrapperClass}>
            <TimelineConfigScreen onConfirm={() => goTo('character_create')} onBack={() => goTo('timeline_select')} />
          </div>
        );
      case 'character_create':
        return (
          <div className={wrapperClass}>
            <CharacterCreate onConfirm={() => goTo('game_play')} onBack={() => goTo('timeline_config')} />
          </div>
        );
      case 'game_play':
        return (
          <div className={wrapperClass}>
            <GameScreen />
          </div>
        );
      case 'game_over':
        return (
          <div className={wrapperClass}>
            <GameOverScreen onRestart={() => goTo('title')} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<ScreenFallback />}>
        {renderScreen(displayScreen)}
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
