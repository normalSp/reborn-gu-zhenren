import { useState, useEffect, useCallback } from 'react';
import { useStore } from './store';
import { TitleScreen } from './components/title/TitleScreen';
import { CharacterCreate } from './components/game/CharacterCreate';
import { GameScreen } from './components/game/GameScreen';
import { GameOverScreen } from './components/game/GameOverScreen';
import { ModeSelectScreen } from './components/game/ModeSelectScreen';
import { OriginSelectScreen } from './components/game/OriginSelectScreen';
import { ErrorBoundary } from './components/game/ErrorBoundary';

type ScreenState = 'title' | 'mode_select' | 'origin_select' | 'character_create' | 'game_play' | 'game_over';

const TRANSITION_MS = 350;

function App() {
  const screenState = useStore(s => s.screenState);
  const setScreenState = useStore(s => s.setScreenState);
  const [displayScreen, setDisplayScreen] = useState<ScreenState>(screenState);
  const [transitioning, setTransitioning] = useState(false);

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
              // ═══ 新游戏入口：全量重置旧存档数据 ═══
              (useStore.getState() as any).resetStore?.();
              goTo('mode_select');
            }} />
          </div>
        );
      case 'mode_select':
        return (
          <div className={wrapperClass}>
            <ModeSelectScreen onNext={() => goTo('origin_select')} onBack={() => goTo('title')} />
          </div>
        );
      case 'origin_select':
        return (
          <div className={wrapperClass}>
            <OriginSelectScreen onNext={() => goTo('character_create')} onBack={() => goTo('mode_select')} />
          </div>
        );
      case 'character_create':
        return (
          <div className={wrapperClass}>
            <CharacterCreate onConfirm={() => goTo('game_play')} />
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
      {renderScreen('mode_select')}
      {renderScreen('origin_select')}
      {renderScreen('character_create')}
      {renderScreen('game_play')}
      {renderScreen('game_over')}
    </ErrorBoundary>
  );
}

export default App;
