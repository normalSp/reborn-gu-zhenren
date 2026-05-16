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
  buildInheritanceWorldActionBridge,
  evaluateLandClaimEntry,
  getInheritanceSiteSpec,
  normalizeInheritanceLandState,
  resolveInheritanceTrialAction as resolveTrialEngine,
  resolveLandClaimAttempt,
  stageInheritanceCandidate,
} from '../../engine/v080-inheritance-land-engine';
import { buildNarrativeReturnContext } from '../../engine/v090-world-action-protocol';
import { createInitialInheritanceLandState } from '../defaultEngineStates';

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

function spendInheritanceAp(
  get: any,
  cost: number,
  summary: string,
  source: string,
  systemResult: Record<string, unknown>,
  risks: string[],
) {
  const store = get() as any;
  if (cost <= 0) return { success: true, message: '无需消耗场景AP。' };
  if (typeof store.spendSceneAp === 'function') {
    return store.spendSceneAp(
      cost,
      'inheritance',
      summary,
      source,
      systemResult,
      risks,
    );
  }
  if (Number(store.gameTime?.ap || 0) < cost) return { success: false, message: `场景AP不足：需要${cost}点。` };
  return {
    success: true,
    message: `消耗${cost}点AP（兼容模式）。`,
    entry: {
      id: `inheritance_ap_${source}`,
      turn: Number(store.turn || 1),
      sceneId: String(store.sceneSessionState?.sceneId || 'current_scene'),
      actionType: 'inheritance',
      source,
      cost,
      summary,
      systemResult,
      risks,
    },
  };
}

function findWorldActionLedgerEntry(store: any, source: string) {
  const ledger = Array.isArray(store.sceneSessionState?.localActionLedger) ? store.sceneSessionState.localActionLedger : [];
  return ledger.find((entry: any) => entry.source === source) || null;
}

function commitInheritanceWorldActionReturnContext(set: any, get: any, resolution: any, spentEntry?: any): void {
  if (!resolution?.worldActionResolution) return;
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
      lastInheritanceWorldAction: {
        candidate: resolution.worldActionCandidate,
        departure: resolution.worldActionDeparture,
        resolution: resolution.worldActionResolution,
      },
    },
  }));
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
  inheritanceLandState: createInitialInheritanceLandState(),

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
    const site = candidate ? getInheritanceSiteSpec(candidate.siteId) : null;
    if (!candidate || candidate.status !== 'candidate' || !site) {
      const message = '传承候选不可进入试炼。';
      pushL3Warning(get, 'inheritance_trial_unavailable', message);
      return { success: false, message };
    }
    const bridge = buildInheritanceWorldActionBridge({
      candidate,
      site,
      store,
      phase: 'departure',
      summary: `已出发前往传承线索地：${candidate.title}。试炼结果需由剧情与本地引擎继续承接。`,
      status: 'pending_narrative',
      mode: 'narrative_return',
      chargeAp: site.entryCostAp > 0,
      localFacts: [
        `玩家已出发前往传承线索地：${candidate.title}。`,
        '本次出发只建立试炼承接关系；奖励、认主和资源归属仍等待本地引擎结算。',
      ],
      risks: ['传承/福地结果将进入下一轮叙事上下文。'],
    });
    const spend = spendInheritanceAp(
      get,
      bridge.worldActionLedgerEntry.cost,
      bridge.worldActionLedgerEntry.summary,
      bridge.worldActionLedgerEntry.source,
      bridge.worldActionLedgerEntry.systemResult,
      bridge.worldActionLedgerEntry.risks,
    );
    if (!spend.success) {
      pushL3Warning(get, 'inheritance_departure_scene_ap_insufficient', spend.message);
      return { success: false, message: spend.message };
    }
    if (typeof store.prepareNarrativeAdvanceIntent === 'function') {
      store.prepareNarrativeAdvanceIntent('inheritance_departure');
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
        message: `已出发前往传承线索地：${candidate.title}。试炼结果需由剧情与本地引擎继续承接。`,
        severity: 'info',
      }],
    });
    commitInheritanceLandState(set, get, next);
    commitInheritanceWorldActionReturnContext(set, get, bridge, spend.entry);
    return { success: true, message: `已出发：${candidate.title}。${spend.message}` };
  },

  resolveInheritanceTrialAction: (candidateId) => {
    const store = get() as any;
    const state = normalizeInheritanceLandState(store.inheritanceLandState);
    const candidate = findCandidate(state, candidateId);
    const site = candidate ? getInheritanceSiteSpec(candidate.siteId) : null;
    if (!candidate || !site) return { success: false, message: '传承候选不存在。', steps: [] };

    const departedEntry = findWorldActionLedgerEntry(store, `inheritance:${candidate.id}:departure`);
    const alreadyDeparted = state.activeTrial?.candidateId === candidate.id || Boolean(departedEntry);
    const result = resolveTrialEngine({
      state,
      candidateId: candidate.id,
      store: get(),
      seed: `${store.turn || 1}:${candidate.id}:store-trial`,
      worldActionChargeAp: !alreadyDeparted,
    });
    let spend: any = { success: true, message: alreadyDeparted ? '已在出发阶段消耗场景AP。' : '无需消耗场景AP。', entry: departedEntry };
    if (!alreadyDeparted && result.worldActionLedgerEntry && result.worldActionLedgerEntry.cost > 0) {
      spend = spendInheritanceAp(
        get,
        result.worldActionLedgerEntry.cost,
        result.worldActionLedgerEntry.summary,
        result.worldActionLedgerEntry.source,
        result.worldActionLedgerEntry.systemResult,
        result.worldActionLedgerEntry.risks,
      );
      if (!spend.success) {
        pushL3Warning(get, 'inheritance_scene_ap_insufficient', spend.message);
        return { success: false, message: spend.message, steps: [] };
      }
    }
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
    commitInheritanceWorldActionReturnContext(set, get, result, spend.entry);
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
      const result = resolveLandClaimAttempt({
        state,
        candidateId: candidate.id,
        store,
        seed: `${store.turn || 1}:${candidate.id}:blocked-claim`,
        worldActionChargeAp: false,
      });
      commitInheritanceLandState(set, get, result.state);
      commitInheritanceWorldActionReturnContext(set, get, result);
      pushL3Warning(get, 'land_claim_blocked', result.blockedReason || validation.blockers.join('；'));
      return { success: false, message: result.blockedReason || validation.blockers.join('；'), attempt: result.attempt };
    }

    const result = resolveLandClaimAttempt({
      state,
      candidateId: candidate.id,
      store: get(),
      seed: `${store.turn || 1}:${candidate.id}:store-claim`,
      skipApCheck: true,
      worldActionChargeAp: true,
    });
    let spend: any = { success: true, message: '无需消耗场景AP。' };
    if (result.worldActionLedgerEntry && result.worldActionLedgerEntry.cost > 0) {
      spend = spendInheritanceAp(
        get,
        result.worldActionLedgerEntry.cost,
        result.worldActionLedgerEntry.summary,
        result.worldActionLedgerEntry.source,
        result.worldActionLedgerEntry.systemResult,
        result.worldActionLedgerEntry.risks,
      );
      if (!spend.success) {
        pushL3Warning(get, 'land_claim_scene_ap_insufficient', spend.message);
        return { success: false, message: spend.message };
      }
    }
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
    commitInheritanceWorldActionReturnContext(set, get, result, spend.entry);
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
