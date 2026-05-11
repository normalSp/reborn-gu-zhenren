import type {
  CanonAnchorPressure,
  HeavenWillTrigger,
  IfBranchCandidate,
  StoryAnchorEntryValidation,
  StoryAnchorState,
  StoryEventCandidate,
} from '../../types';
import {
  applyHeavenWillTrigger,
  createDefaultStoryAnchorState,
  evaluateStoryAnchorEntry,
  normalizeStoryAnchorState,
  recordCanonAnchorPressure,
  resolveIfBranchCandidate,
  resolveStoryEventCandidate,
} from '../../engine/v080-midgame-anchor-engine';

export interface StoryAnchorSlice {
  storyAnchorState: StoryAnchorState;
  evaluateStoryAnchorEntryAction: (anchorId: string) => StoryAnchorEntryValidation;
  setCurrentStoryAnchor: (anchorId: string | null) => void;
  resolveStoryEventCandidateAction: (candidate: StoryEventCandidate) => { accepted: boolean; message: string };
  resolveIfBranchCandidateAction: (candidate: IfBranchCandidate) => { accepted: boolean; message: string };
  recordCanonAnchorPressureAction: (pressure: CanonAnchorPressure) => { accepted: boolean; message: string };
  applyStoryHeavenWillTrigger: (trigger: HeavenWillTrigger) => { success: boolean; message: string };
}

function mirrorStoryAnchorFlags(state: StoryAnchorState, existingFlags: Record<string, any> = {}): Record<string, any> {
  return {
    ...existingFlags,
    fateState: state.fateState,
    currentCanonAnchorId: state.currentAnchorId,
    anchorResults: state.anchorResults,
    ifBranchVectors: state.ifBranchVectors,
    heavenWillLedger: state.heavenWillLedger,
    karmicDebtLedger: state.karmicDebtLedger,
    storyEventCandidates: state.storyEventCandidates,
    ifBranchCandidates: state.ifBranchCandidates,
    canonAnchorPressureLog: state.canonAnchorPressureLog,
    lastStoryAnchorResolution: state.lastResolutionSteps,
  };
}

function commitStoryAnchorState(set: any, get: any, next: StoryAnchorState): void {
  set((s: any) => ({
    storyAnchorState: next,
    flags: mirrorStoryAnchorFlags(next, s.flags || {}),
  }));
  const store = get() as any;
  const last = next.lastResolutionSteps?.[next.lastResolutionSteps.length - 1];
  if (last && typeof store.addGameLog === 'function') {
    store.addGameLog('pipeline', last.message, {
      source: 'v080-story-anchor',
      stepKind: last.kind,
      anchorId: last.anchorId,
      severity: last.severity,
    });
  }
}

function pushL3Warning(get: any, ruleName: string, details: string): void {
  const store = get() as any;
  if (typeof store.setL3Warnings !== 'function') return;
  const current = Array.isArray(store.l3Warnings) ? store.l3Warnings : [];
  store.setL3Warnings([...current, { ruleName, details }].slice(-20));
}

export const createStoryAnchorSlice = (set: any, get: any): StoryAnchorSlice => ({
  storyAnchorState: createDefaultStoryAnchorState(),

  evaluateStoryAnchorEntryAction: (anchorId) => {
    const store = get() as any;
    const state = normalizeStoryAnchorState(store.storyAnchorState, store.flags || {});
    const validation = evaluateStoryAnchorEntry({ state, store, anchorId });
    const next = {
      ...state,
      currentAnchorId: validation.allowed ? anchorId : state.currentAnchorId,
      anchorRecords: {
        ...state.anchorRecords,
        [anchorId]: {
          ...(state.anchorRecords[anchorId] || { anchorId, canonDeviation: 0 }),
          status: validation.status,
          entryIssues: validation.issues,
          lastUpdatedTurn: Number(store.turn || 0),
        },
      },
      lastResolutionSteps: [{
        id: `anchor_entry_${store.turn || 0}_${anchorId}`,
        kind: validation.allowed ? 'entry' : 'block',
        anchorId,
        turn: Number(store.turn || 0),
        message: validation.allowed ? `剧情锚点可进入：${anchorId}` : `剧情锚点暂不可进入：${anchorId}`,
        severity: validation.allowed ? 'success' : 'warning',
        metadata: { issues: validation.issues, warnings: validation.warnings },
      }],
    } as StoryAnchorState;
    commitStoryAnchorState(set, get, next);
    return validation;
  },

  setCurrentStoryAnchor: (anchorId) => {
    const store = get() as any;
    const state = normalizeStoryAnchorState(store.storyAnchorState, store.flags || {});
    const next: StoryAnchorState = {
      ...state,
      currentAnchorId: anchorId,
      lastResolutionSteps: anchorId ? [{
        id: `anchor_current_${store.turn || 0}_${anchorId}`,
        kind: 'entry',
        anchorId,
        turn: Number(store.turn || 0),
        message: `当前剧情锚点切换为：${anchorId}`,
        severity: 'info',
      }] : state.lastResolutionSteps,
    };
    commitStoryAnchorState(set, get, next);
  },

  resolveStoryEventCandidateAction: (candidate) => {
    const store = get() as any;
    const result = resolveStoryEventCandidate({
      state: store.storyAnchorState,
      store,
      candidate,
      mode: store.gameMode || 'canon',
    });
    commitStoryAnchorState(set, get, result.state);
    if (result.record.engineValidation === 'blocked') {
      pushL3Warning(get, 'story_anchor_candidate_blocked', result.record.validationIssues.join('；') || result.record.title);
    }
    return {
      accepted: result.record.engineValidation !== 'blocked',
      message: result.steps.at(-1)?.message || result.record.title,
    };
  },

  resolveIfBranchCandidateAction: (candidate) => {
    const store = get() as any;
    const result = resolveIfBranchCandidate({
      state: store.storyAnchorState,
      store,
      candidate,
      mode: store.gameMode || 'canon',
    });
    commitStoryAnchorState(set, get, result.state);
    if (result.record.engineValidation === 'blocked') {
      pushL3Warning(get, 'if_branch_candidate_blocked', result.record.validationIssues.join('；') || result.record.summary);
    }
    return {
      accepted: result.record.engineValidation === 'accepted',
      message: result.steps.at(-1)?.message || result.record.summary,
    };
  },

  recordCanonAnchorPressureAction: (pressure) => {
    const store = get() as any;
    const result = recordCanonAnchorPressure({
      state: store.storyAnchorState,
      store,
      pressure,
      mode: store.gameMode || 'canon',
    });
    commitStoryAnchorState(set, get, result.state);
    if (result.record.engineDecision === 'block') {
      pushL3Warning(get, 'canon_anchor_pressure_blocked', `${result.record.anchorId}: ${result.record.reason}`);
    }
    return {
      accepted: result.record.engineDecision !== 'block',
      message: result.steps.at(-1)?.message || result.record.reason,
    };
  },

  applyStoryHeavenWillTrigger: (trigger) => {
    const store = get() as any;
    const result = applyHeavenWillTrigger({
      state: store.storyAnchorState,
      store,
      trigger,
    });
    commitStoryAnchorState(set, get, result.state);
    return { success: true, message: result.steps.at(-1)?.message || trigger.reason };
  },
});
