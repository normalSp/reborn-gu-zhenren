import { useStore } from '../store';

type E2eSave = string | Record<string, unknown>;

declare global {
  interface Window {
    __REBORN_E2E__?: {
      loadSave: (save: E2eSave) => { success: boolean; error?: string };
      getStateSummary: () => Record<string, unknown>;
      clearRuntime: () => void;
    };
  }
}

function isE2eEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('e2e');
}

function summarizeStore(): Record<string, unknown> {
  const state = useStore.getState() as any;
  return {
    screenState: state.screenState,
    turn: state.turn,
    playerName: state.profile?.name || '',
    playerRole: 'original_participant',
    realm: state.profile?.realm?.label || '',
    currentDomain: state.currentDomain || state.playerPosition?.region || '',
    currentChapterId: state.currentChapterId || null,
    partySize: Array.isArray(state.partyState?.members) ? state.partyState.members.length : 0,
    partyFormation: state.partyState?.formation || null,
    squadCombatPhase: state.squadCombatState?.phase || null,
    duelPhase: state.duelState?.phase || null,
    auctionActive: !!state.isAuctionActive,
    auctionPools: {
      immortalGu: Array.isArray(state.auctionItems) ? state.auctionItems.length : 0,
      materials: Array.isArray(state.materialAuctionItems) ? state.materialAuctionItems.length : 0,
      recipes: Array.isArray(state.recipeAuctionItems) ? state.recipeAuctionItems.length : 0,
      killerMoves: Array.isArray(state.killerMoveAuctionItems) ? state.killerMoveAuctionItems.length : 0,
    },
    gameLogCount: Array.isArray(state.gameLog) ? state.gameLog.length : 0,
    eventHistoryCount: Array.isArray(state.eventHistory) ? state.eventHistory.length : 0,
    battleVisualQueueLength: Array.isArray(state.battleVisualQueue) ? state.battleVisualQueue.length : 0,
    currentBgm: state.soundState?.currentBgm || state.audioState?.currentBgm || null,
    voiceActive: !!state.soundState?.voiceActive,
    pipelinePhase: state.pipelinePhase,
    pipelineError: state.pipelineError || null,
  };
}

export function installE2eHarness(): void {
  if (!isE2eEnabled()) return;

  window.__REBORN_E2E__ = {
    loadSave(save: E2eSave) {
      const payload = typeof save === 'string' ? save : JSON.stringify(save);
      const store = useStore.getState() as any;
      const result = store.loadFromFile?.(payload) ?? { success: false, error: 'loadFromFile is unavailable' };
      if (result.success) {
        const next = useStore.getState() as any;
        next.setScreenState?.('game_play');
        next.setGameMode?.('canon');
        useStore.setState({ gameLoadVersion: (next.gameLoadVersion || 0) + 1 } as any);
      }
      return result;
    },
    getStateSummary: summarizeStore,
    clearRuntime() {
      try {
        window.localStorage.removeItem('gu-zhenren-save');
      } catch {
        /* no-op */
      }
      const store = useStore.getState() as any;
      store.resetStore?.();
      store.setScreenState?.('title');
    },
  };
}
