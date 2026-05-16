import type {
  EndingEntryValidation,
  EndingFrameworkState,
  EndingRouteCandidate,
} from '../../types';
import {
  buildEndingResolutionInput,
  commitEndingOutcome,
  evaluateEndingReadiness,
  generateEndingRouteCandidates,
  normalizeEndingFrameworkState,
  recordEndingPressure,
} from '../../engine/v080-ending-framework-engine';
import { createInitialEndingFrameworkState } from '../defaultEngineStates';

export interface EndingSlice {
  endingState: EndingFrameworkState;
  previewEndingFramework: () => { validation: EndingEntryValidation; candidates: EndingRouteCandidate[] };
  refreshEndingCandidatesAction: () => { validation: EndingEntryValidation; candidates: EndingRouteCandidate[] };
  commitEndingCandidateAction: (candidateId: string) => { success: boolean; message: string };
  commitBestEndingCandidateAction: () => { success: boolean; message: string };
  recordEndingPressureAction: (attemptedOutcome: string, reason?: string) => { success: boolean; message: string };
}

function pushL3Warning(get: any, ruleName: string, details: string): void {
  const store = get() as any;
  if (typeof store.setL3Warnings !== 'function') return;
  const current = Array.isArray(store.l3Warnings) ? store.l3Warnings : [];
  store.setL3Warnings([...current, { ruleName, details }].slice(-20));
}

function commitEndingState(set: any, get: any, next: EndingFrameworkState): void {
  set((s: any) => ({
    endingState: next,
    flags: {
      ...(s.flags || {}),
      endingStatus: next.status,
      endingCandidates: next.candidates,
      endingCommitRecord: next.commitRecord,
      lastEndingResolution: next.lastResolutionSteps,
    },
  }));
  const store = get() as any;
  const last = next.lastResolutionSteps?.[next.lastResolutionSteps.length - 1];
  if (last && typeof store.addGameLog === 'function') {
    store.addGameLog('system', last.message, {
      source: 'v080-ending',
      stepKind: last.kind,
      familyId: last.familyId,
      severity: last.severity,
    });
  }
}

export const createEndingSlice = (set: any, get: any): EndingSlice => ({
  endingState: createInitialEndingFrameworkState(),

  previewEndingFramework: () => {
    const store = get() as any;
    const state = normalizeEndingFrameworkState(store.endingState);
    const input = buildEndingResolutionInput({
      state,
      storyAnchorState: store.storyAnchorState,
      store,
    });
    const validation = evaluateEndingReadiness(input);
    const candidates = generateEndingRouteCandidates(input);
    return { validation, candidates };
  },

  refreshEndingCandidatesAction: () => {
    const store = get() as any;
    const state = normalizeEndingFrameworkState(store.endingState);
    const input = buildEndingResolutionInput({
      state,
      storyAnchorState: store.storyAnchorState,
      store,
    });
    const validation = evaluateEndingReadiness(input);
    const candidates = generateEndingRouteCandidates(input);
    const next = normalizeEndingFrameworkState({
      ...state,
      status: validation.canCommit ? 'ready' : 'blocked',
      lastInput: input,
      candidates,
      lastResolutionSteps: [{
        id: `ending_refresh_${input.turn}`,
        kind: validation.canCommit ? 'readiness' : 'input',
        turn: input.turn,
        message: validation.canCommit ? '终局候选已刷新，可正式结算。' : `终局候选已刷新，但仍缺条件：${validation.issues.join('；') || '证据不足'}`,
        severity: validation.canCommit ? 'success' : 'warning',
      }],
    });
    commitEndingState(set, get, next);
    return { validation, candidates };
  },

  commitEndingCandidateAction: (candidateId) => {
    const store = get() as any;
    const state = normalizeEndingFrameworkState(store.endingState);
    const input = buildEndingResolutionInput({
      state,
      storyAnchorState: store.storyAnchorState,
      store,
    });
    const result = commitEndingOutcome({
      state,
      resolutionInput: input,
      candidateId,
    });
    commitEndingState(set, get, result.state);
    if (!result.success) {
      pushL3Warning(get, 'ending_commit_blocked', result.issues.join('；') || '终局候选不可结算');
      return { success: false, message: result.issues.join('；') || '终局候选不可结算。' };
    }

    set((s: any) => ({
      deathRecord: {
        ...result.deathRecord,
        achievementCount: Array.isArray(s.unlockedAchievements) ? s.unlockedAchievements.length : 0,
      },
      deathCause: result.outcome.displayName,
      deathTurn: input.turn,
      screenState: result.commitRecord?.screenStateAfterCommit || 'game_over',
      flags: {
        ...(s.flags || {}),
        endingStatus: result.state.status,
        endingCommitRecord: result.commitRecord,
        endingOutcome: result.outcome,
      },
    }));
    const nextStore = get() as any;
    nextStore.addGameLog?.('system', `终局结算：${result.outcome.displayName}`, {
      source: 'v080-ending',
      familyId: result.outcome.familyId,
      provenance: result.outcome.provenance,
    });
    return { success: true, message: `终局已结算：${result.outcome.displayName}` };
  },

  commitBestEndingCandidateAction: () => {
    const store = get() as any;
    const refreshed = store.refreshEndingCandidatesAction?.();
    const validation = refreshed?.validation;
    const candidates: EndingRouteCandidate[] = Array.isArray(refreshed?.candidates) ? refreshed.candidates : [];
    const best = candidates.find(item => item.canCommit && item.familyId === validation?.recommendedFamilyId)
      || candidates.find(item => item.canCommit);
    if (!best) {
      const issues = validation?.issues?.join('；') || candidates.flatMap(item => item.blockers || []).slice(0, 3).join('；') || '终局证据不足，无法自动收束。';
      pushL3Warning(get, 'ending_auto_commit_blocked', issues);
      return { success: false, message: issues };
    }
    return store.commitEndingCandidateAction?.(best.id) || { success: false, message: '终局结算动作不可用。' };
  },

  recordEndingPressureAction: (attemptedOutcome, reason) => {
    const store = get() as any;
    const state = normalizeEndingFrameworkState(store.endingState);
    const result = recordEndingPressure({
      state,
      attemptedOutcome,
      reason,
      turn: store.turn || 0,
    });
    commitEndingState(set, get, result.state);
    if (result.state.status === 'blocked') {
      pushL3Warning(get, 'ending_pressure_blocked', attemptedOutcome);
    }
    return { success: true, message: result.steps.at(-1)?.message || '终局压力已记录。' };
  },
});
