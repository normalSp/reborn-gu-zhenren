import type {
  CombatEventCandidate,
  TrainingGroundCandidateInput,
  TrainingGroundState,
} from '../../types';
import {
  createDefaultTrainingGroundState,
  evaluateTrainingGroundEntry,
  normalizeTrainingGroundState,
  resolveTrainingGroundAction as resolveTrainingGroundActionEngine,
  stageTrainingGroundCandidate,
  type TrainingGroundCandidateValidation,
} from '../../engine/v090-training-ground-clue-engine';

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

function spendTrainingSceneAp(get: any, groundId: string, cost: number, summary: string, risks: string[]) {
  const store = get() as any;
  if (typeof store.spendSceneAp !== 'function') {
    return { success: false, message: '场景 AP 系统不可用。' };
  }
  return store.spendSceneAp(cost, 'training_ground', summary, `training_ground:${groundId}`, { groundId }, risks);
}

export const createTrainingGroundSlice = (set: any, get: any): TrainingGroundSlice => ({
  trainingGroundState: createDefaultTrainingGroundState(),

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

    const spend = spendTrainingSceneAp(
      get,
      groundId,
      entry.apCost,
      `${entry.ground.name}道场行动`,
      [...entry.warnings, ...entry.blockers],
    );
    if (!spend.success) {
      pushL3Warning(get, 'training_ground_scene_ap_insufficient', spend.message);
      return { success: false, message: spend.message };
    }

    const result = resolveTrainingGroundActionEngine(state, groundId, get(), `${store.turn || 1}:${groundId}:action`);
    commitTrainingGroundState(set, get, result.state);
    applyTrainingSessionEffects(set, get, result);

    if (result.combatCandidate) appendCombatCandidate(set, get, result.combatCandidate);
    if (entry.actionKind === 'duel' || entry.actionKind === 'trial') {
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
