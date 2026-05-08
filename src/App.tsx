import { useState, useEffect, useCallback } from 'react';
import { useStore } from './store';
import { TitleScreen } from './components/title/TitleScreen';
import { CharacterCreate } from './components/game/CharacterCreate';
import { GameScreen } from './components/game/GameScreen';
import { GameOverScreen } from './components/game/GameOverScreen';
import { OriginSelectScreen } from './components/game/OriginSelectScreen';
import { TimelineSelectScreen } from './components/game/TimelineSelectScreen';
import { TimelineConfigScreen } from './components/game/TimelineConfigScreen';
import { ErrorBoundary } from './components/game/ErrorBoundary';
import { audioManager } from './utils/audio';
import { installE2eHarness } from './e2e/installE2eHarness';

type ScreenState = 'title' | 'origin_select' | 'timeline_select' | 'timeline_config' | 'character_create' | 'game_play' | 'game_over';

const TRANSITION_MS = 350;

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
        return s.soundState.muted ? 0 : s.soundState.masterVolume * s.soundState.bgmVolume;
      },
      () => {
        const s = useStore.getState();
        return s.soundState.muted ? 0 : s.soundState.masterVolume * s.soundState.sfxVolume;
      },
    );
    audioManager.setMuted(soundState.muted);
  }, [soundState.muted, soundState.masterVolume, soundState.bgmVolume, soundState.sfxVolume]);

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
      {renderScreen('title')}
      {renderScreen('origin_select')}
      {renderScreen('timeline_select')}
      {renderScreen('timeline_config')}
      {renderScreen('character_create')}
      {renderScreen('game_play')}
      {renderScreen('game_over')}
    </ErrorBoundary>
  );
}

export default App;
