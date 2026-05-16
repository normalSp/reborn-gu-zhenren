import { createInitialLivingWorldState } from '../defaultLivingWorldState';
import { applyLivingWorldPatch } from '../../engine/v011-living-world-patch';
import {
  adjudicateWorldIntent,
  buildWorldIntentContextFromStore,
  type WorldIntentAdjudication,
} from '../../engine/v011-world-intent-engine';
import {
  resolveQingmaoVisibleInvestigation,
  type QingmaoVisibleInvestigationResolution,
} from '../../engine/v011-qingmao-visible-investigation';
import {
  resolveQingmaoBaiContactWindowAction,
  type QingmaoBaiContactWindowResolution,
} from '../../engine/v011-qingmao-bai-contact-window';
import {
  resolveQingmaoEscapeRoutePreparationAction,
  type QingmaoEscapeRoutePreparationResolution,
} from '../../engine/v011-qingmao-escape-route-prep';
import {
  resolveQingmaoFactionReactionBridgeAction,
  type QingmaoFactionReactionBridgeResolution,
} from '../../engine/v012-qingmao-faction-reaction-bridge';
import {
  resolveQingmaoFangYuanPublicEvidenceAction,
  type QingmaoFangYuanPublicEvidenceResolution,
} from '../../engine/v012-qingmao-fang-yuan-public-evidence';
import type { LivingPlayerGoalEntry, LivingWorldState } from '../../types';

export interface WorldIntentPreviewResult {
  success: boolean;
  message: string;
  adjudication: WorldIntentAdjudication | null;
}

export interface WorldIntentGoalCommitResult {
  success: boolean;
  message: string;
  adjudication: WorldIntentAdjudication;
  goal?: LivingPlayerGoalEntry;
  applied: string[];
  rejected: string[];
}

export interface WorldIntentInvestigationCommitResult {
  success: boolean;
  message: string;
  adjudication: WorldIntentAdjudication;
  resolution: QingmaoVisibleInvestigationResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoBaiContactWindowCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoBaiContactWindowResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoEscapeRoutePreparationCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoEscapeRoutePreparationResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoFactionReactionBridgeCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoFactionReactionBridgeResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoFangYuanPublicEvidenceCommitResult {
  success: boolean;
  message: string;
  adjudication: WorldIntentAdjudication;
  resolution: QingmaoFangYuanPublicEvidenceResolution;
  applied: string[];
  rejected: string[];
}

export interface LivingWorldSlice {
  livingWorldState: LivingWorldState;
  previewWorldIntentAction: (rawText: string) => WorldIntentPreviewResult;
  confirmWorldIntentGoalAction: (adjudication: WorldIntentAdjudication) => WorldIntentGoalCommitResult;
  resolveVisibleInvestigationAction: (adjudication: WorldIntentAdjudication) => WorldIntentInvestigationCommitResult;
  resolveBaiContactWindowAction: () => QingmaoBaiContactWindowCommitResult;
  resolveQingmaoEscapeRoutePreparationAction: (goalId?: string) => QingmaoEscapeRoutePreparationCommitResult;
  resolveQingmaoFactionReactionBridgeAction: () => QingmaoFactionReactionBridgeCommitResult;
  resolveFangYuanPublicEvidenceAction: (adjudication: WorldIntentAdjudication) => QingmaoFangYuanPublicEvidenceCommitResult;
}

type SliceSet = (...args: any[]) => void;
type SliceGet = () => any;

export const createLivingWorldSlice = (
  set?: SliceSet,
  get?: SliceGet,
): LivingWorldSlice => ({
  livingWorldState: createInitialLivingWorldState(),
  previewWorldIntentAction: (rawText) => {
    const text = rawText.trim();
    if (!text) {
      return {
        success: false,
        message: '请输入自由目标。',
        adjudication: null,
      };
    }

    const store = get?.() || {};
    const adjudication = adjudicateWorldIntent({
      ...buildWorldIntentContextFromStore(store),
      rawText: text,
      source: 'player_input',
    });

    return {
      success: true,
      message: adjudication.ruling.visibleExplanation,
      adjudication,
    };
  },
  confirmWorldIntentGoalAction: (adjudication) => {
    const goal = adjudication.suggestedPlayerGoal;
    if (!goal) {
      return {
        success: false,
        message: '当前裁决没有可记录的长期目标。',
        adjudication,
        applied: [],
        rejected: ['missing_player_goal_draft'],
      };
    }

    if (adjudication.candidate.source !== 'player_input') {
      return {
        success: false,
        message: '只有玩家主动输入的目标可以写入自由目标。',
        adjudication,
        applied: [],
        rejected: ['non_player_intent_source'],
      };
    }

    const store = get?.() || {};
    const result = applyLivingWorldPatch(store.livingWorldState, {
      source: 'living_world_engine',
      playerGoals: [goal],
    });

    if (set) {
      set({
        livingWorldState: result.state,
        flags: {
          ...(store.flags || {}),
          lastLivingWorldPatch: {
            source: 'world_intent_goal',
            candidateId: adjudication.candidate.id,
            goalId: goal.id,
            applied: result.applied,
            rejected: result.rejected,
          },
        },
      });
    }

    store.addGameLog?.('system', `自由目标记录：${goal.targetRef}`, {
      candidateId: adjudication.candidate.id,
      goalId: goal.id,
      intentType: goal.intentType,
      status: goal.status,
      applied: result.applied,
      rejected: result.rejected,
    });

    return {
      success: result.rejected.length === 0,
      message: result.rejected.length === 0
        ? '已记录自由目标。'
        : `自由目标部分写入被拒绝：${result.rejected.join('、')}`,
      adjudication,
      goal,
      applied: result.applied,
      rejected: result.rejected,
    };
  },
  resolveVisibleInvestigationAction: (adjudication) => {
    if (adjudication.candidate.source !== 'player_input') {
      const store = get?.() || {};
      const resolution = resolveQingmaoVisibleInvestigation({
        adjudication,
        livingWorldState: store.livingWorldState,
      });
      return {
        success: false,
        message: '只有玩家主动输入的调查可以执行可见范围调查。',
        adjudication,
        resolution,
        applied: [],
        rejected: ['non_player_intent_source'],
      };
    }

    const store = get?.() || {};
    const resolution = resolveQingmaoVisibleInvestigation({
      adjudication,
      livingWorldState: store.livingWorldState,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.hiddenFactRefs.length > 0
      || resolution.factionPressure.length > 0
      || resolution.npcMemories.length > 0
      || resolution.actionConsequences.length > 0
    );
    const patch = shouldPatch
      ? applyLivingWorldPatch(store.livingWorldState, {
        source: 'living_world_engine',
        worldClock: {
          ...(store.livingWorldState?.worldClock || {}),
          lastActionId: resolution.actionId,
        },
        knownFacts: resolution.knownFacts,
        hiddenFactRefs: resolution.hiddenFactRefs,
        npcMemories: resolution.npcMemories,
        factionPressure: resolution.factionPressure,
        actionConsequences: resolution.actionConsequences,
      })
      : {
        state: store.livingWorldState,
        applied: [],
        rejected: [],
      };

    if (set) {
      set({
        livingWorldState: patch.state,
        flags: {
          ...(store.flags || {}),
          lastLivingWorldPatch: {
            source: 'visible_investigation',
            candidateId: adjudication.candidate.id,
            actionId: resolution.actionId,
            success: resolution.success,
            applied: patch.applied,
            rejected: [...resolution.rejectedReasons, ...patch.rejected],
          },
        },
      });
    }

    store.addGameLog?.('system', `可见范围调查：${adjudication.candidate.targetRef}`, {
      candidateId: adjudication.candidate.id,
      actionId: resolution.actionId,
      success: resolution.success,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      hiddenFactRefIds: resolution.hiddenFactRefs.map(ref => ref.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      deepSeekVisibleFactIds: resolution.deepSeekVisibleFactIds,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    });

    return {
      success: resolution.success && patch.rejected.length === 0,
      message: patch.rejected.length === 0
        ? resolution.message
        : `${resolution.message}；部分写入被拒绝：${patch.rejected.join('、')}`,
      adjudication,
      resolution,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    };
  },
  resolveBaiContactWindowAction: () => {
    const store = get?.() || {};
    const resolution = resolveQingmaoBaiContactWindowAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });

    const shouldPatch = (
      resolution.factionPressure.length > 0
      || resolution.actionConsequences.length > 0
    );
    const patch = shouldPatch
      ? applyLivingWorldPatch(store.livingWorldState, {
        source: 'action_protocol',
        worldClock: {
          ...(store.livingWorldState?.worldClock || {}),
          lastActionId: resolution.actionId,
        },
        factionPressure: resolution.factionPressure,
        actionConsequences: resolution.actionConsequences,
      })
      : {
        state: store.livingWorldState,
        applied: [],
        rejected: resolution.rejectedReasons,
      };

    if (set) {
      set((state: any) => {
        const currentLedger = Array.isArray(state.sceneSessionState?.localActionLedger)
          ? state.sceneSessionState.localActionLedger
          : [];
        const nextLedger = resolution.success
          ? [
            ...currentLedger.filter((entry: any) => entry?.id !== resolution.worldActionLedgerEntry.id),
            resolution.worldActionLedgerEntry,
          ].slice(-40)
          : currentLedger;
        return {
          livingWorldState: patch.state,
          sceneSessionState: state.sceneSessionState
            ? {
              ...state.sceneSessionState,
              localActionLedger: nextLedger,
            }
            : state.sceneSessionState,
          flags: {
            ...(state.flags || {}),
            lastWorldActionReturnContext: resolution.narrativeReturnContext,
            lastLivingWorldPatch: {
              source: 'bai_contact_window',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `白家接触窗口：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
      rewardPolicy: resolution.worldActionResolution.rewardPolicy,
      forbiddenUpgrades: resolution.forbiddenUpgrades,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    });

    return {
      success: resolution.success && patch.rejected.length === 0,
      message: patch.rejected.length === 0
        ? resolution.message
        : `${resolution.message}；部分写入被拒绝：${patch.rejected.join('、')}`,
      resolution,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    };
  },
  resolveQingmaoEscapeRoutePreparationAction: (goalId) => {
    const store = get?.() || {};
    const resolution = resolveQingmaoEscapeRoutePreparationAction({
      livingWorldState: store.livingWorldState,
      goalId,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.factionPressure.length > 0
      || resolution.playerGoals.length > 0
      || resolution.actionConsequences.length > 0
    );
    const patch = shouldPatch
      ? applyLivingWorldPatch(store.livingWorldState, {
        source: 'action_protocol',
        worldClock: {
          ...(store.livingWorldState?.worldClock || {}),
          lastActionId: resolution.actionId,
        },
        knownFacts: resolution.knownFacts,
        factionPressure: resolution.factionPressure,
        playerGoals: resolution.playerGoals,
        actionConsequences: resolution.actionConsequences,
      })
      : {
        state: store.livingWorldState,
        applied: [],
        rejected: [],
      };

    if (set) {
      set((state: any) => {
        const currentLedger = Array.isArray(state.sceneSessionState?.localActionLedger)
          ? state.sceneSessionState.localActionLedger
          : [];
        const nextLedger = resolution.success
          ? [
            ...currentLedger.filter((entry: any) => entry?.id !== resolution.worldActionLedgerEntry.id),
            resolution.worldActionLedgerEntry,
          ].slice(-40)
          : currentLedger;
        return {
          livingWorldState: patch.state,
          sceneSessionState: state.sceneSessionState
            ? {
              ...state.sceneSessionState,
              localActionLedger: nextLedger,
            }
            : state.sceneSessionState,
          flags: {
            ...(state.flags || {}),
            lastWorldActionReturnContext: resolution.narrativeReturnContext,
            lastLivingWorldPatch: {
              source: 'qingmao_escape_route_preparation',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `逃离青茅山路线准备：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      playerGoalIds: resolution.playerGoals.map(goal => goal.id),
      actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
      routeCandidateIds: resolution.routeSupplyPursuitPlan.routeCandidates.map(route => route.id),
      supplyRequirementIds: resolution.routeSupplyPursuitPlan.supplyRequirements.map(supply => supply.id),
      pursuitTriggerIds: resolution.routeSupplyPursuitPlan.pursuitTriggers.map(trigger => trigger.id),
      intakeReviewRef: resolution.routeSupplyPursuitPlan.intakeReviewRef,
      rewardPolicy: resolution.worldActionResolution.rewardPolicy,
      forbiddenUpgrades: resolution.forbiddenUpgrades,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    });

    return {
      success: resolution.success && patch.rejected.length === 0,
      message: patch.rejected.length === 0
        ? resolution.message
        : `${resolution.message}；部分写入被拒绝：${patch.rejected.join('、')}`,
      resolution,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    };
  },
  resolveQingmaoFactionReactionBridgeAction: () => {
    const store = get?.() || {};
    const resolution = resolveQingmaoFactionReactionBridgeAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
    });

    const shouldPatch = (
      resolution.factionPressure.length > 0
      || resolution.npcMemories.length > 0
      || resolution.actionConsequences.length > 0
    );
    const patch = shouldPatch
      ? applyLivingWorldPatch(store.livingWorldState, {
        source: 'action_protocol',
        worldClock: {
          ...(store.livingWorldState?.worldClock || {}),
          lastActionId: resolution.actionId,
        },
        factionPressure: resolution.factionPressure,
        npcMemories: resolution.npcMemories,
        actionConsequences: resolution.actionConsequences,
      })
      : {
        state: store.livingWorldState,
        applied: [],
        rejected: resolution.rejectedReasons,
      };

    if (set) {
      set((state: any) => {
        const currentLedger = Array.isArray(state.sceneSessionState?.localActionLedger)
          ? state.sceneSessionState.localActionLedger
          : [];
        const nextLedger = resolution.success
          ? [
            ...currentLedger.filter((entry: any) => entry?.id !== resolution.worldActionLedgerEntry.id),
            resolution.worldActionLedgerEntry,
          ].slice(-40)
          : currentLedger;
        return {
          livingWorldState: patch.state,
          sceneSessionState: state.sceneSessionState
            ? {
              ...state.sceneSessionState,
              localActionLedger: nextLedger,
            }
            : state.sceneSessionState,
          flags: {
            ...(state.flags || {}),
            lastWorldActionReturnContext: resolution.narrativeReturnContext,
            lastLivingWorldPatch: {
              source: 'qingmao_faction_reaction_bridge',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `青茅局势反应推演：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      matchedRuleIds: resolution.reactionPlan.matchedRules.map(rule => rule.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
      intakeReviewRef: resolution.reactionPlan.intakeReviewRef,
      rewardPolicy: resolution.worldActionResolution.rewardPolicy,
      forbiddenUpgrades: resolution.forbiddenUpgrades,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    });

    return {
      success: resolution.success && patch.rejected.length === 0,
      message: patch.rejected.length === 0
        ? resolution.message
        : `${resolution.message}；部分写入被拒绝：${patch.rejected.join('、')}`,
      resolution,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    };
  },
  resolveFangYuanPublicEvidenceAction: (adjudication) => {
    if (adjudication.candidate.source !== 'player_input') {
      const store = get?.() || {};
      const resolution = resolveQingmaoFangYuanPublicEvidenceAction({
        adjudication,
        livingWorldState: store.livingWorldState,
        turn: store.turn,
        sceneId: store.sceneSessionState?.sceneId,
        locationId: store.sceneSessionState?.locationId,
      });
      return {
        success: false,
        message: '只有玩家主动输入的方源公开旁证可以执行。',
        adjudication,
        resolution,
        applied: [],
        rejected: ['non_player_intent_source'],
      };
    }

    const store = get?.() || {};
    const resolution = resolveQingmaoFangYuanPublicEvidenceAction({
      adjudication,
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.hiddenFactRefs.length > 0
      || resolution.npcMemories.length > 0
      || resolution.factionPressure.length > 0
      || resolution.actionConsequences.length > 0
    );
    const patch = shouldPatch
      ? applyLivingWorldPatch(store.livingWorldState, {
        source: 'action_protocol',
        worldClock: {
          ...(store.livingWorldState?.worldClock || {}),
          lastActionId: resolution.actionId,
        },
        knownFacts: resolution.knownFacts,
        hiddenFactRefs: resolution.hiddenFactRefs,
        npcMemories: resolution.npcMemories,
        factionPressure: resolution.factionPressure,
        actionConsequences: resolution.actionConsequences,
      })
      : {
        state: store.livingWorldState,
        applied: [],
        rejected: resolution.rejectedReasons,
      };

    if (set) {
      set((state: any) => {
        const currentLedger = Array.isArray(state.sceneSessionState?.localActionLedger)
          ? state.sceneSessionState.localActionLedger
          : [];
        const nextLedger = resolution.success
          ? [
            ...currentLedger.filter((entry: any) => entry?.id !== resolution.worldActionLedgerEntry.id),
            resolution.worldActionLedgerEntry,
          ].slice(-40)
          : currentLedger;
        return {
          livingWorldState: patch.state,
          sceneSessionState: state.sceneSessionState
            ? {
              ...state.sceneSessionState,
              localActionLedger: nextLedger,
            }
            : state.sceneSessionState,
          flags: {
            ...(state.flags || {}),
            lastWorldActionReturnContext: resolution.narrativeReturnContext,
            lastLivingWorldPatch: {
              source: 'fang_yuan_public_evidence',
              candidateId: adjudication.candidate.id,
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `方源公开旁证询问：${resolution.publicSummary}`, {
      candidateId: adjudication.candidate.id,
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      hiddenFactRefIds: resolution.hiddenFactRefs.map(ref => ref.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
      deepSeekVisibleFactIds: resolution.deepSeekVisibleFactIds,
      matchedProfileIds: resolution.evidencePlan.matchedProfiles.map(profile => profile.id),
      intakeReviewRef: resolution.evidencePlan.intakeReviewRef,
      rewardPolicy: resolution.worldActionResolution.rewardPolicy,
      forbiddenUpgrades: resolution.forbiddenUpgrades,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    });

    return {
      success: resolution.success && patch.rejected.length === 0,
      message: patch.rejected.length === 0
        ? resolution.message
        : `${resolution.message}；部分写入被拒绝：${patch.rejected.join('、')}`,
      adjudication,
      resolution,
      applied: patch.applied,
      rejected: [...resolution.rejectedReasons, ...patch.rejected],
    };
  },
});
