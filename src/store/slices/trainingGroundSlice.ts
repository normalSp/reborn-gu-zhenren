import type {
  CombatEventCandidate,
  TrainingGroundCandidateInput,
  TrainingGroundState,
} from '../../types';
import {
  evaluateTrainingGroundEntry,
  normalizeTrainingGroundState,
  resolveTrainingGroundAction as resolveTrainingGroundActionEngine,
  stageTrainingGroundCandidate,
  type TrainingGroundCandidateValidation,
} from '../../engine/v090-training-ground-clue-engine';
import { buildNarrativeReturnContext } from '../../engine/v090-world-action-protocol';
import { createInitialTrainingGroundState } from '../defaultEngineStates';

export interface TrainingGroundSlice {
  trainingGroundState: TrainingGroundState;
  recordTrainingGroundCandidateAction: (candidate: TrainingGroundCandidateInput) => TrainingGroundCandidateValidation;
  startTrainingGroundDepartureAction: (groundId: string) => { success: boolean; message: string };
  resolveTrainingGroundAction: (groundId: string) => { success: boolean; message: string };
  dismissTrainingGroundCandidateAction: (clueId: string) => void;
  clearExpiredTrainingGroundCandidatesAction: () => void;
}

function pushL3Warning(get: any, ruleName: string, details: string): void {
  const store = get() as any;
  if (typeof store.setL3Warnings === 'function') {
    store.setL3Warnings([...(store.l3Warnings || []), { ruleName, details }].slice(-20));
  }
}

function commitTrainingGroundState(set: any, get: any, state: TrainingGroundState): void {
  set((s: any) => ({
    trainingGroundState: normalizeTrainingGroundState(state),
    flags: {
      ...(s.flags || {}),
      trainingCooldowns: normalizeTrainingGroundState(state).cooldowns,
      trainingGroundClues: normalizeTrainingGroundState(state).clues,
      lastTrainingGroundResolution: normalizeTrainingGroundState(state).lastResolutionSteps,
    },
  }));
}

function appendCombatCandidate(set: any, get: any, candidate: CombatEventCandidate): void {
  const store = get() as any;
  const current = Array.isArray(store.flags?.combatEventCandidates) ? store.flags.combatEventCandidates : [];
  set((s: any) => ({
    flags: {
      ...(s.flags || {}),
      combatEventCandidates: [...current, candidate].slice(-40),
    },
  }));
}

function applyTrainingSessionEffects(set: any, get: any, resolution: ReturnType<typeof resolveTrainingGroundActionEngine>): void {
  const store = get() as any;
  const session = resolution.session;
  if (!session) return;
  if (session.currencyPatch.currency !== undefined || session.currencyPatch.immortalCurrency !== undefined) {
    const patch: Record<string, number> = {};
    if (session.currencyPatch.currency !== undefined) patch.currency = session.currencyPatch.currency;
    if (session.currencyPatch.immortalCurrency !== undefined) patch.immortalCurrency = session.currencyPatch.immortalCurrency;
    // This is a narrow currency patch produced by the local engine, not UI-private calculation.
    set(patch as any);
  }
  if (session.success && session.pathType && session.daoMarkGain > 0 && typeof store.addDaoMarks === 'function') {
    store.addDaoMarks(session.pathType, session.daoMarkGain);
  }
}

function spendTrainingSceneAp(
  get: any,
  cost: number,
  summary: string,
  source: string,
  systemResult: Record<string, unknown>,
  risks: string[],
) {
  const store = get() as any;
  if (typeof store.spendSceneAp !== 'function') {
    return { success: false, message: '场景 AP 系统不可用。' };
  }
  return store.spendSceneAp(cost, 'training_ground', summary, source, systemResult, risks);
}

function commitWorldActionReturnContext(set: any, get: any, resolution: ReturnType<typeof resolveTrainingGroundActionEngine>, spentEntry: any): void {
  if (!resolution.worldActionResolution) return;
  const store = get() as any;
  const ledgerEntries = spentEntry ? [spentEntry] : resolution.worldActionLedgerEntry ? [resolution.worldActionLedgerEntry] : [];
  const context = buildNarrativeReturnContext({
    sceneId: resolution.worldActionCandidate?.sceneId || store.sceneSessionState?.sceneId || 'current_scene',
    turn: Number(store.turn || resolution.worldActionResolution.turn || 1),
    ledgerEntries,
    resolutions: [resolution.worldActionResolution],
  });
  set((s: any) => ({
    flags: {
      ...(s.flags || {}),
      lastWorldActionReturnContext: context,
      lastTrainingGroundWorldAction: {
        candidate: resolution.worldActionCandidate,
        departure: resolution.worldActionDeparture,
        resolution: resolution.worldActionResolution,
      },
    },
  }));
}

export const createTrainingGroundSlice = (set: any, get: any): TrainingGroundSlice => ({
  trainingGroundState: createInitialTrainingGroundState(),

  recordTrainingGroundCandidateAction: (candidate) => {
    const store = get() as any;
    const result = stageTrainingGroundCandidate(store.trainingGroundState, candidate, store);
    commitTrainingGroundState(set, get, result.state);
    if (!result.validation.valid) {
      pushL3Warning(get, 'training_ground_candidate_downgraded', result.validation.blockers.join('；') || candidate.groundId);
    }
    return result.validation;
  },

  startTrainingGroundDepartureAction: (groundId) => {
    const store = get() as any;
    const state = normalizeTrainingGroundState(store.trainingGroundState);
    const entry = evaluateTrainingGroundEntry(state, groundId, store);
    if (!entry.canEnter) {
      const message = entry.blockers.join('；') || '道场入口不可用。';
      pushL3Warning(get, 'training_ground_entry_blocked', message);
      return { success: false, message };
    }
    return (get() as any).resolveTrainingGroundAction(groundId);
  },

  resolveTrainingGroundAction: (groundId) => {
    const store = get() as any;
    const state = normalizeTrainingGroundState(store.trainingGroundState);
    const entry = evaluateTrainingGroundEntry(state, groundId, store);
    if (!entry.canEnter) {
      const result = resolveTrainingGroundActionEngine(state, groundId, store, `${store.turn || 1}:${groundId}:blocked`);
      commitTrainingGroundState(set, get, result.state);
      pushL3Warning(get, 'training_ground_action_blocked', result.message);
      return { success: false, message: result.message };
    }

    const result = resolveTrainingGroundActionEngine(state, groundId, store, `${store.turn || 1}:${groundId}:action`);
    const ledger = result.worldActionLedgerEntry;
    const spend = spendTrainingSceneAp(
      get,
      ledger?.cost ?? entry.apCost,
      ledger?.summary ?? `${entry.ground.name}道场行动`,
      ledger?.source ?? `training_ground:${groundId}`,
      (ledger?.systemResult as Record<string, unknown>) ?? { groundId },
      ledger?.risks ?? [...entry.warnings, ...entry.blockers],
    );
    if (!spend.success) {
      pushL3Warning(get, 'training_ground_scene_ap_insufficient', spend.message);
      return { success: false, message: spend.message };
    }

    commitTrainingGroundState(set, get, result.state);
    applyTrainingSessionEffects(set, get, result);
    commitWorldActionReturnContext(set, get, result, spend.entry);

    if (result.combatCandidate) appendCombatCandidate(set, get, result.combatCandidate);
    if (entry.actionKind === 'duel' || entry.actionKind === 'trial' || entry.actionKind === 'hunt') {
      (get() as any).prepareNarrativeAdvanceIntent?.(`training_ground_${entry.actionKind}`);
    }
    (get() as any).addGameLog?.('system', result.message, {
      groundId,
      actionKind: entry.actionKind,
      steps: result.steps,
    });
    return { success: result.success, message: result.message };
  },

  dismissTrainingGroundCandidateAction: (clueId) => {
    const store = get() as any;
    const state = normalizeTrainingGroundState(store.trainingGroundState);
    const clues = state.clues.filter(clue => clue.id !== clueId);
    commitTrainingGroundState(set, get, {
      ...state,
      clues,
      unlockedGroundIds: state.unlockedGroundIds.filter(id => clues.some(clue => clue.groundId === id)),
    });
  },

  clearExpiredTrainingGroundCandidatesAction: () => {
    const store = get() as any;
    const state = normalizeTrainingGroundState(store.trainingGroundState);
    const turn = Number(store.turn || 1);
    commitTrainingGroundState(set, get, {
      ...state,
      clues: state.clues.filter(clue => !clue.expiresTurn || clue.expiresTurn >= turn),
    });
  },
});
