import type {
  GuInstance,
  InheritanceCandidateInput,
  InheritanceEntryValidation,
  InheritanceLandState,
  InheritanceResolutionStep,
  InheritanceRewardPreview,
  LandClaimAttemptRecord,
} from '../../types';
import {
  createDefaultInheritanceLandState,
  evaluateLandClaimEntry,
  getInheritanceSiteSpec,
  normalizeInheritanceLandState,
  resolveInheritanceTrialAction as resolveTrialEngine,
  resolveLandClaimAttempt,
  stageInheritanceCandidate,
} from '../../engine/v080-inheritance-land-engine';

export interface InheritanceLandSlice {
  inheritanceLandState: InheritanceLandState;
  recordInheritanceCandidateAction: (candidate: InheritanceCandidateInput) => InheritanceEntryValidation;
  startInheritanceTrialAction: (candidateId: string) => { success: boolean; message: string };
  resolveInheritanceTrialAction: (candidateId: string) => { success: boolean; message: string; steps: InheritanceResolutionStep[] };
  attemptLandClaimAction: (candidateId: string) => { success: boolean; message: string; attempt?: LandClaimAttemptRecord };
  dismissInheritanceCandidateAction: (candidateId: string) => void;
  clearExpiredInheritanceCandidatesAction: () => void;
}

function pushL3Warning(get: any, ruleName: string, details: string): void {
  const store = get() as any;
  if (typeof store.setL3Warnings !== 'function') return;
  const current = Array.isArray(store.l3Warnings) ? store.l3Warnings : [];
  store.setL3Warnings([...current, { ruleName, details }].slice(-20));
}

function commitInheritanceLandState(set: any, get: any, next: InheritanceLandState): void {
  set((s: any) => ({
    inheritanceLandState: next,
    flags: {
      ...(s.flags || {}),
      inheritanceLandCandidates: next.candidates,
      inheritanceClaimAttempts: next.claimAttempts,
      claimedLandIds: next.claimedLandIds,
      lastInheritanceLandResolution: next.lastResolutionSteps,
    },
  }));
  const store = get() as any;
  const last = next.lastResolutionSteps?.[next.lastResolutionSteps.length - 1];
  if (last && typeof store.addGameLog === 'function') {
    store.addGameLog('system', last.message, {
      source: 'v080-inheritance-land',
      siteId: last.siteId,
      candidateId: last.candidateId,
      stepKind: last.kind,
      severity: last.severity,
    });
  }
}

function findCandidate(state: InheritanceLandState, candidateId: string) {
  return state.candidates.find(candidate => candidate.id === candidateId || candidate.siteId === candidateId) || null;
}

function spendInheritanceAp(get: any, candidateId: string, cost: number, summary: string, systemResult: Record<string, unknown>) {
  const store = get() as any;
  if (cost <= 0) return { success: true, message: '无需消耗场景AP。' };
  if (typeof store.spendSceneAp === 'function') {
    return store.spendSceneAp(
      cost,
      'inheritance',
      summary,
      'v0.8.0-c2.5:inheritance-land',
      systemResult,
      ['传承/福地结果将进入下一轮叙事上下文。'],
    );
  }
  if (Number(store.gameTime?.ap || 0) < cost) return { success: false, message: `场景AP不足：需要${cost}点。` };
  return { success: true, message: `消耗${cost}点AP（兼容模式）。`, entry: { id: `inheritance_ap_${candidateId}`, cost } };
}

function rewardGu(reward: InheritanceRewardPreview, turn: number, path = '月道'): GuInstance {
  return {
    id: `inheritance_${reward.id}_${turn}`,
    specId: reward.id,
    name: reward.name,
    tier: 1,
    path,
    currentState: 'optimal',
    hungerCounter: 0,
    proficiency: 20,
    bonded: false,
    active: true,
    acquiredAt: { turn, narrative: '传承试炼本地结算奖励' },
  };
}

function applyRegisteredRewards(set: any, get: any, state: InheritanceLandState, candidateId: string): void {
  const store = get() as any;
  const candidate = findCandidate(state, candidateId);
  const site = candidate ? getInheritanceSiteSpec(candidate.siteId) : null;
  if (!candidate || !site || candidate.status !== 'resolved') return;
  const turn = Number(store.turn || candidate.updatedTurn || 1);
  const path = site.pathTags[0] || '月道';
  const discoveredFragments = Array.isArray(store.flags?.discoveredFragments) ? [...store.flags.discoveredFragments] : [];
  const killerFragments = Array.isArray(store.flags?.discoveredKillerMoveFragments) ? [...store.flags.discoveredKillerMoveFragments] : [];

  set((s: any) => {
    const next: Record<string, any> = {};
    for (const reward of candidate.rewardPreview) {
      if (!reward.registered || reward.kind === 'rumor') continue;
      if (reward.kind === 'gu') {
        const gu = rewardGu(reward, turn, path);
        if (typeof store.addGu === 'function') store.addGu(gu);
        else next.inventory = [...(next.inventory || s.inventory || []), gu];
      } else if (reward.kind === 'material') {
        const quantity = Math.max(1, Number(reward.quantity || 1));
        if (typeof store.addMaterial === 'function') store.addMaterial(reward.name, quantity);
        else next.materialBag = { ...(next.materialBag || s.materialBag || {}), [reward.name]: Number((s.materialBag || {})[reward.name] || 0) + quantity };
      } else if (reward.kind === 'recipe_fragment') {
        discoveredFragments.push(reward.id);
      } else if (reward.kind === 'killer_move_fragment') {
        killerFragments.push(reward.id);
      }
    }
    next.flags = {
      ...(s.flags || {}),
      discoveredFragments: [...new Set(discoveredFragments)],
      discoveredKillerMoveFragments: [...new Set(killerFragments)],
      lastInheritanceRewardSiteId: site.siteId,
    };
    return next;
  });
}

export const createInheritanceLandSlice = (set: any, get: any): InheritanceLandSlice => ({
  inheritanceLandState: createDefaultInheritanceLandState(),

  recordInheritanceCandidateAction: (candidate) => {
    const store = get() as any;
    const result = stageInheritanceCandidate(store.inheritanceLandState, candidate, store);
    commitInheritanceLandState(set, get, result.state);
    if (!result.validation.valid && result.validation.downgradedTo === 'blocked') {
      pushL3Warning(get, 'inheritance_candidate_blocked', result.validation.blockers.join('；') || candidate.siteId);
    }
    return result.validation;
  },

  startInheritanceTrialAction: (candidateId) => {
    const store = get() as any;
    const state = normalizeInheritanceLandState(store.inheritanceLandState);
    const candidate = findCandidate(state, candidateId);
    if (!candidate || candidate.status !== 'candidate') {
      const message = '传承候选不可进入试炼。';
      pushL3Warning(get, 'inheritance_trial_unavailable', message);
      return { success: false, message };
    }
    const next = normalizeInheritanceLandState({
      ...state,
      candidates: state.candidates.map(item => item.id === candidate.id ? { ...item, status: 'active', updatedTurn: Number(store.turn || 1) } : item),
      activeTrial: { candidateId: candidate.id, trialIndex: 0, startedTurn: Number(store.turn || 1) },
      lastResolutionSteps: [{
        id: `inheritance_trial_start_${store.turn || 1}_${candidate.id}`,
        turn: Number(store.turn || 1),
        kind: 'trial',
        siteId: candidate.siteId,
        candidateId: candidate.id,
        message: `传承试炼开始：${candidate.title}。`,
        severity: 'info',
      }],
    });
    commitInheritanceLandState(set, get, next);
    return { success: true, message: `传承试炼开始：${candidate.title}` };
  },

  resolveInheritanceTrialAction: (candidateId) => {
    const store = get() as any;
    const state = normalizeInheritanceLandState(store.inheritanceLandState);
    const candidate = findCandidate(state, candidateId);
    const site = candidate ? getInheritanceSiteSpec(candidate.siteId) : null;
    if (!candidate || !site) return { success: false, message: '传承候选不存在。', steps: [] };

    const spend = spendInheritanceAp(get, candidate.id, site.entryCostAp, `传承试炼：${candidate.title}`, {
      siteId: site.siteId,
      candidateId: candidate.id,
      kind: site.kind,
    });
    if (!spend.success) {
      pushL3Warning(get, 'inheritance_scene_ap_insufficient', spend.message);
      return { success: false, message: spend.message, steps: [] };
    }

    const result = resolveTrialEngine({
      state,
      candidateId: candidate.id,
      store: get(),
      seed: `${store.turn || 1}:${candidate.id}:store-trial`,
    });
    commitInheritanceLandState(set, get, result.state);
    if (result.success) {
      applyRegisteredRewards(set, get, result.state, candidate.id);
      if (result.combatCandidate) {
        const current = Array.isArray(store.flags?.combatEventCandidates) ? store.flags.combatEventCandidates : [];
        set((s: any) => ({
          flags: {
            ...(s.flags || {}),
            combatEventCandidates: [...current, result.combatCandidate].slice(-20),
          },
        }));
      }
    }
    return {
      success: result.success,
      message: result.steps.at(-1)?.message || (result.success ? '传承试炼完成。' : result.blockedReason || '传承试炼失败。'),
      steps: result.steps,
    };
  },

  attemptLandClaimAction: (candidateId) => {
    const store = get() as any;
    const state = normalizeInheritanceLandState(store.inheritanceLandState);
    const validation = evaluateLandClaimEntry(state, candidateId, store);
    const candidate = validation.candidate;
    const site = validation.site;
    if (!candidate || !site) {
      const message = validation.blockers.join('；') || '待认主福地候选不存在。';
      pushL3Warning(get, 'land_claim_candidate_missing', message);
      return { success: false, message };
    }
    if (!validation.valid) {
      const result = resolveLandClaimAttempt({ state, candidateId: candidate.id, store, seed: `${store.turn || 1}:${candidate.id}:blocked-claim` });
      commitInheritanceLandState(set, get, result.state);
      pushL3Warning(get, 'land_claim_blocked', result.blockedReason || validation.blockers.join('；'));
      return { success: false, message: result.blockedReason || validation.blockers.join('；'), attempt: result.attempt };
    }

    const spend = spendInheritanceAp(get, candidate.id, site.entryCostAp, `尝试认主福地：${candidate.title}`, {
      siteId: site.siteId,
      candidateId: candidate.id,
      terms: validation.terms.map(term => term.id),
    });
    if (!spend.success) {
      pushL3Warning(get, 'land_claim_scene_ap_insufficient', spend.message);
      return { success: false, message: spend.message };
    }

    const result = resolveLandClaimAttempt({
      state,
      candidateId: candidate.id,
      store: get(),
      seed: `${store.turn || 1}:${candidate.id}:store-claim`,
      skipApCheck: true,
    });
    const nextPatch: Record<string, any> = {
      inheritanceLandState: result.state,
      flags: {
        ...(store.flags || {}),
        inheritanceLandCandidates: result.state.candidates,
        inheritanceClaimAttempts: result.state.claimAttempts,
        claimedLandIds: result.state.claimedLandIds,
        lastInheritanceLandResolution: result.state.lastResolutionSteps,
      },
    };
    if (result.heavenlyLand) nextPatch.heavenlyLand = result.heavenlyLand;
    set(nextPatch);
    commitInheritanceLandState(set, get, result.state);
    return {
      success: result.success,
      message: result.steps.at(-1)?.message || (result.success ? '福地认主完成。' : '福地认主失败。'),
      attempt: result.attempt,
    };
  },

  dismissInheritanceCandidateAction: (candidateId) => {
    const store = get() as any;
    const state = normalizeInheritanceLandState(store.inheritanceLandState);
    const next = normalizeInheritanceLandState({
      ...state,
      candidates: state.candidates.filter(candidate => candidate.id !== candidateId && candidate.siteId !== candidateId),
      activeTrial: state.activeTrial?.candidateId === candidateId ? null : state.activeTrial,
    });
    commitInheritanceLandState(set, get, next);
  },

  clearExpiredInheritanceCandidatesAction: () => {
    const store = get() as any;
    const turn = Number(store.turn || 0);
    const state = normalizeInheritanceLandState(store.inheritanceLandState);
    const next = normalizeInheritanceLandState({
      ...state,
      candidates: state.candidates.filter(candidate => (
        candidate.status === 'resolved'
        || candidate.status === 'blocked'
        || turn - Number(candidate.updatedTurn || candidate.createdTurn || turn) <= 40
      )),
    });
    commitInheritanceLandState(set, get, next);
  },
});
