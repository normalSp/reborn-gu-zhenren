import type { LocalActionLedgerEntry, NarrativeAdvanceIntent, SceneSessionState } from '../../types';
import {
  buildNarrativeAdvanceIntent,
  buildSceneSessionFromStore,
  normalizeSceneSessionState,
  spendSceneActionBudget,
} from '../../engine/v080-scene-session-engine';
import { createInitialSceneSessionState } from '../defaultEngineStates';

export interface SceneSessionSlice {
  sceneSessionState: SceneSessionState;
  ensureSceneSession: () => SceneSessionState;
  spendSceneAp: (
    cost: number,
    actionType: LocalActionLedgerEntry['actionType'],
    summary: string,
    source: string,
    systemResult?: Record<string, unknown>,
    risks?: string[],
  ) => { success: boolean; message: string; entry?: LocalActionLedgerEntry };
  recordLocalActionLedger: (entry: LocalActionLedgerEntry) => void;
  prepareNarrativeAdvanceIntent: (reason?: string) => NarrativeAdvanceIntent;
  resetSceneActionBudget: (reason?: string) => SceneSessionState;
}

export const createSceneSessionSlice = (set: any, get: any): SceneSessionSlice => ({
  sceneSessionState: createInitialSceneSessionState(),

  ensureSceneSession: () => {
    const store = get() as any;
    const current = normalizeSceneSessionState(store.sceneSessionState);
    const synced = buildSceneSessionFromStore(store, current);
    set((s: any) => ({
      sceneSessionState: synced,
      gameTime: { ...(s.gameTime || {}), ap: synced.actionBudget.remainingAp, max_ap: synced.actionBudget.maxAp },
    }));
    return synced;
  },

  spendSceneAp: (cost, actionType, summary, source, systemResult, risks) => {
    const store = get() as any;
    const current = normalizeSceneSessionState(store.sceneSessionState);
    const result = spendSceneActionBudget({
      state: current,
      cost,
      actionType,
      summary,
      source,
      systemResult,
      risks,
      turn: store.turn || current.narrativeTurn,
    });
    if (!result.success) return { success: false, message: result.message };
    set((s: any) => ({
      sceneSessionState: result.state,
      gameTime: { ...(s.gameTime || {}), ap: result.state.actionBudget.remainingAp, max_ap: result.state.actionBudget.maxAp },
    }));
    return { success: true, message: result.message, entry: result.entry };
  },

  recordLocalActionLedger: (entry) => {
    set((s: any) => {
      const scene = normalizeSceneSessionState(s.sceneSessionState);
      return {
        sceneSessionState: normalizeSceneSessionState({
          ...scene,
          localActionLedger: [...scene.localActionLedger, entry].slice(-30),
        }),
      };
    });
  },

  prepareNarrativeAdvanceIntent: (reason = 'player_advance') => {
    const store = get() as any;
    const scene = normalizeSceneSessionState(store.sceneSessionState);
    const intent = buildNarrativeAdvanceIntent(scene, reason);
    set((s: any) => ({
      sceneSessionState: normalizeSceneSessionState({
        ...scene,
        pendingAdvanceIntent: intent,
      }),
      flags: { ...(s.flags || {}), pendingNarrativeAdvanceIntent: intent },
    }));
    return intent;
  },

  resetSceneActionBudget: (reason = 'narrative_scene') => {
    const store = get() as any;
    const next = buildSceneSessionFromStore(store, {
      ...store.sceneSessionState,
      actionBudget: {
        maxAp: store.gameTime?.max_ap || 3,
        remainingAp: store.gameTime?.max_ap || 3,
        grantedBy: reason === 'calamity' ? 'calamity_scene' : 'narrative_scene',
        exhaustedPolicy: 'advance_narrative',
      },
      localActionLedger: [],
      pendingAdvanceIntent: null,
    });
    set((s: any) => ({
      sceneSessionState: next,
      gameTime: { ...(s.gameTime || {}), ap: next.actionBudget.remainingAp, max_ap: next.actionBudget.maxAp },
      flags: { ...(s.flags || {}), pendingNarrativeAdvanceIntent: null },
    }));
    return next;
  },
});
