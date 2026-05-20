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
import {
  resolveQingmaoCoverEscapeTracksAction,
  type QingmaoCoverEscapeTracksResolution,
} from '../../engine/v014-qingmao-cover-escape-tracks';
import {
  resolveQingmaoMountainPassRouteContinuationAction,
  type QingmaoMountainPassRouteContinuationResolution,
} from '../../engine/v014-qingmao-mountain-pass-route-continuation';
import {
  resolveQingmaoSupplyFeedingPreparationAction,
  type QingmaoSupplyFeedingPreparationResolution,
} from '../../engine/v015-qingmao-supply-feeding-preparation';
import {
  resolveQingmaoRefinementBoundaryAction,
  type QingmaoRefinementBoundaryResolution,
} from '../../engine/v015-qingmao-refinement-boundary';
import {
  resolveQingmaoMarketWindowAction,
  type QingmaoMarketWindowResolution,
} from '../../engine/v015-qingmao-market-window';
import {
  resolveQingmaoGrayTradeBoundaryAction,
  type QingmaoGrayTradeBoundaryResolution,
} from '../../engine/v015-qingmao-gray-trade-boundary';
import {
  resolveV018QingmaoCandidateContinuationAction,
  resolveV018QingmaoPressureBackflowAction,
  resolveV018QingmaoRouteEntryThresholdAction,
  type V018QingmaoRouteActionResolution,
} from '../../engine/v018-qingmao-route-multi-region';
import {
  resolveV100QingmaoSouthernBorderContinuityAction,
} from '../../engine/v100-qingmao-southern-border-continuity';
import {
  resolveV100LowRankLifeLoopReleaseAction,
} from '../../engine/v100-low-rank-life-loop-release';
import {
  resolveV100FreeIntentReleaseClosureAction,
} from '../../engine/v100-free-intent-release-closure';
import {
  createInitialRouteLocationState,
  resolveV110RouteLocationStateAction,
  type V110RouteLocationActionResolution,
} from '../../engine/v110-route-location-state';
import type { LivingPlayerGoalEntry, LivingWorldState, RouteLocationState } from '../../types';

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

export interface QingmaoCoverEscapeTracksCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoCoverEscapeTracksResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoMountainPassRouteContinuationCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoMountainPassRouteContinuationResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoSupplyFeedingPreparationCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoSupplyFeedingPreparationResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoRefinementBoundaryCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoRefinementBoundaryResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoMarketWindowCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoMarketWindowResolution;
  applied: string[];
  rejected: string[];
}

export interface QingmaoGrayTradeBoundaryCommitResult {
  success: boolean;
  message: string;
  resolution: QingmaoGrayTradeBoundaryResolution;
  applied: string[];
  rejected: string[];
}

export interface V018QingmaoRouteActionCommitResult {
  success: boolean;
  message: string;
  resolution: V018QingmaoRouteActionResolution;
  applied: string[];
  rejected: string[];
}

export interface V110RouteLocationStateCommitResult {
  success: boolean;
  message: string;
  resolution: V110RouteLocationActionResolution;
  applied: string[];
  rejected: string[];
}

export interface LivingWorldSlice {
  livingWorldState: LivingWorldState;
  routeLocationState: RouteLocationState;
  previewWorldIntentAction: (rawText: string) => WorldIntentPreviewResult;
  confirmWorldIntentGoalAction: (adjudication: WorldIntentAdjudication) => WorldIntentGoalCommitResult;
  resolveVisibleInvestigationAction: (adjudication: WorldIntentAdjudication) => WorldIntentInvestigationCommitResult;
  resolveBaiContactWindowAction: () => QingmaoBaiContactWindowCommitResult;
  resolveQingmaoEscapeRoutePreparationAction: (goalId?: string) => QingmaoEscapeRoutePreparationCommitResult;
  resolveQingmaoFactionReactionBridgeAction: () => QingmaoFactionReactionBridgeCommitResult;
  resolveFangYuanPublicEvidenceAction: (adjudication: WorldIntentAdjudication) => QingmaoFangYuanPublicEvidenceCommitResult;
  resolveQingmaoCoverEscapeTracksAction: () => QingmaoCoverEscapeTracksCommitResult;
  resolveQingmaoMountainPassRouteContinuationAction: () => QingmaoMountainPassRouteContinuationCommitResult;
  resolveQingmaoSupplyFeedingPreparationAction: () => QingmaoSupplyFeedingPreparationCommitResult;
  resolveQingmaoRefinementBoundaryAction: () => QingmaoRefinementBoundaryCommitResult;
  resolveQingmaoMarketWindowAction: () => QingmaoMarketWindowCommitResult;
  resolveQingmaoGrayTradeBoundaryAction: () => QingmaoGrayTradeBoundaryCommitResult;
  resolveV018QingmaoRouteEntryThresholdAction: () => V018QingmaoRouteActionCommitResult;
  resolveV018QingmaoCandidateContinuationAction: () => V018QingmaoRouteActionCommitResult;
  resolveV018QingmaoPressureBackflowAction: () => V018QingmaoRouteActionCommitResult;
  resolveV100QingmaoSouthernBorderContinuityAction: () => V018QingmaoRouteActionCommitResult;
  resolveV100LowRankLifeLoopReleaseAction: () => V018QingmaoRouteActionCommitResult;
  resolveV100FreeIntentReleaseClosureAction: () => V018QingmaoRouteActionCommitResult;
  resolveV110RouteLocationStateAction: () => V110RouteLocationStateCommitResult;
}

type SliceSet = (...args: any[]) => void;
type SliceGet = () => any;

function commitLivingWorldActionResolution(
  set: SliceSet | undefined,
  get: SliceGet | undefined,
  resolution: V018QingmaoRouteActionResolution,
  source: string,
  logPrefix: string,
): V018QingmaoRouteActionCommitResult {
  const store = get?.() || {};
  const shouldPatch = (
    resolution.knownFacts.length > 0
    || resolution.factionPressure.length > 0
    || resolution.npcMemories.length > 0
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
      npcMemories: resolution.npcMemories,
      playerGoals: resolution.playerGoals,
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
            source,
            actionId: resolution.actionId,
            success: resolution.success,
            applied: patch.applied,
            rejected: [...resolution.rejectedReasons, ...patch.rejected],
          },
        },
      };
    });
  }

  store.addGameLog?.('system', `${logPrefix}：${resolution.publicSummary}`, {
    actionId: resolution.actionId,
    routeId: resolution.routeId,
    success: resolution.success,
    stage: resolution.overview.stage,
    knownFactIds: resolution.knownFacts.map(fact => fact.id),
    factionPressureIds: resolution.factionPressure.map(entry => entry.id),
    npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
    playerGoalIds: resolution.playerGoals.map(goal => goal.id),
    actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
    visibleSourceRefs: resolution.visibleSourceRefs,
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
}

export const createLivingWorldSlice = (
  set?: SliceSet,
  get?: SliceGet,
): LivingWorldSlice => ({
  livingWorldState: createInitialLivingWorldState(),
  routeLocationState: createInitialRouteLocationState(),
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
  resolveQingmaoCoverEscapeTracksAction: () => {
    const store = get?.() || {};
    const resolution = resolveQingmaoCoverEscapeTracksAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.factionPressure.length > 0
      || resolution.npcMemories.length > 0
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
        npcMemories: resolution.npcMemories,
        playerGoals: resolution.playerGoals,
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
              source: 'qingmao_cover_escape_tracks',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `遮掩逃离痕迹：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      playerGoalIds: resolution.playerGoals.map(goal => goal.id),
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
  resolveQingmaoMountainPassRouteContinuationAction: () => {
    const store = get?.() || {};
    const resolution = resolveQingmaoMountainPassRouteContinuationAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.factionPressure.length > 0
      || resolution.npcMemories.length > 0
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
        npcMemories: resolution.npcMemories,
        playerGoals: resolution.playerGoals,
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
              source: 'qingmao_mountain_pass_route_continuation',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `青茅山路路线承接：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      routeKey: resolution.routeKey,
      success: resolution.success,
      routeEligibility: resolution.routePreview?.eligibility,
      missingConditionIds: resolution.routePreview?.missingConditions.map(condition => condition.id) || [],
      visibleSourceRefs: resolution.visibleSourceRefs,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      playerGoalIds: resolution.playerGoals.map(goal => goal.id),
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
  resolveQingmaoSupplyFeedingPreparationAction: () => {
    const store = get?.() || {};
    const resolution = resolveQingmaoSupplyFeedingPreparationAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.factionPressure.length > 0
      || resolution.npcMemories.length > 0
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
        npcMemories: resolution.npcMemories,
        playerGoals: resolution.playerGoals,
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
              source: 'qingmao_supply_feeding_preparation',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `青茅补给喂养缺口整理：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      playerGoalIds: resolution.playerGoals.map(goal => goal.id),
      actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
      supplyRequirementIds: resolution.supplyPlan.ruleDrafts.map(rule => rule.id),
      feedingRequirementIds: resolution.feedingPlan.ruleDrafts.map(rule => rule.id),
      marketPreparationRuleId: resolution.marketPreparationRule?.id || null,
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
  resolveQingmaoRefinementBoundaryAction: () => {
    const store = get?.() || {};
    const resolution = resolveQingmaoRefinementBoundaryAction({
      livingWorldState: store.livingWorldState,
      materialBag: store.materialBag,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.factionPressure.length > 0
      || resolution.npcMemories.length > 0
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
        npcMemories: resolution.npcMemories,
        playerGoals: resolution.playerGoals,
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
              source: 'qingmao_refinement_boundary',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `青茅残方炼蛊边界试读：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      playerGoalIds: resolution.playerGoals.map(goal => goal.id),
      actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
      refinementRuleIds: resolution.refinementPlan.ruleDrafts.map(rule => rule.id),
      fragmentId: resolution.fragmentPreview?.fragmentId || null,
      fragmentTargetGu: resolution.fragmentPreview?.targetGu || null,
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
  resolveQingmaoMarketWindowAction: () => {
    const store = get?.() || {};
    const resolution = resolveQingmaoMarketWindowAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.factionPressure.length > 0
      || resolution.npcMemories.length > 0
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
        npcMemories: resolution.npcMemories,
        playerGoals: resolution.playerGoals,
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
              source: 'qingmao_market_window',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `青茅商队市场窗口试探：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      factionPressureIds: resolution.factionPressure.map(entry => entry.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      playerGoalIds: resolution.playerGoals.map(goal => goal.id),
      actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
      marketRuleIds: resolution.marketPlan.ruleDrafts.map(rule => rule.id),
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
  resolveQingmaoGrayTradeBoundaryAction: () => {
    const store = get?.() || {};
    const resolution = resolveQingmaoGrayTradeBoundaryAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
    });

    const shouldPatch = (
      resolution.knownFacts.length > 0
      || resolution.npcMemories.length > 0
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
        npcMemories: resolution.npcMemories,
        playerGoals: resolution.playerGoals,
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
              source: 'qingmao_gray_trade_boundary',
              actionId: resolution.actionId,
              success: resolution.success,
              applied: patch.applied,
              rejected: [...resolution.rejectedReasons, ...patch.rejected],
            },
          },
        };
      });
    }

    store.addGameLog?.('system', `青茅灰色交易委托边界：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      visibleSourceRefs: resolution.visibleSourceRefs,
      knownFactIds: resolution.knownFacts.map(fact => fact.id),
      npcMemoryIds: resolution.npcMemories.map(entry => entry.id),
      playerGoalIds: resolution.playerGoals.map(goal => goal.id),
      actionConsequenceIds: resolution.actionConsequences.map(entry => entry.id),
      boundaryRuleIds: resolution.boundaryRules.map(rule => rule.id),
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
  resolveV018QingmaoRouteEntryThresholdAction: () => {
    const store = get?.() || {};
    const resolution = resolveV018QingmaoRouteEntryThresholdAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });
    return commitLivingWorldActionResolution(
      set,
      get,
      resolution,
      'v018_qingmao_route_entry_threshold',
      'v0.18青茅离山门槛',
    );
  },
  resolveV018QingmaoCandidateContinuationAction: () => {
    const store = get?.() || {};
    const resolution = resolveV018QingmaoCandidateContinuationAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });
    return commitLivingWorldActionResolution(
      set,
      get,
      resolution,
      'v018_qingmao_candidate_continuation',
      'v0.18南疆路线候选承接',
    );
  },
  resolveV018QingmaoPressureBackflowAction: () => {
    const store = get?.() || {};
    const resolution = resolveV018QingmaoPressureBackflowAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });
    return commitLivingWorldActionResolution(
      set,
      get,
      resolution,
      'v018_qingmao_pressure_backflow',
      'v0.18路线压力回流',
    );
  },
  resolveV100QingmaoSouthernBorderContinuityAction: () => {
    const store = get?.() || {};
    const resolution = resolveV100QingmaoSouthernBorderContinuityAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });
    return commitLivingWorldActionResolution(
      set,
      get,
      resolution,
      'v100_qingmao_southern_border_continuity',
      'v1.0青茅南疆连续体验',
    );
  },
  resolveV100LowRankLifeLoopReleaseAction: () => {
    const store = get?.() || {};
    const resolution = resolveV100LowRankLifeLoopReleaseAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });
    return commitLivingWorldActionResolution(
      set,
      get,
      resolution,
      'v100_low_rank_life_loop_release',
      'v1.0低阶life loop',
    );
  },
  resolveV100FreeIntentReleaseClosureAction: () => {
    const store = get?.() || {};
    const resolution = resolveV100FreeIntentReleaseClosureAction({
      livingWorldState: store.livingWorldState,
      turn: store.turn,
      sceneId: store.sceneSessionState?.sceneId,
      locationId: store.sceneSessionState?.locationId,
      selectedStartProfileId: store.selectedStartProfileId,
      playerFactionId: store.timelineState?.factionId || store.currentFaction,
    });
    return commitLivingWorldActionResolution(
      set,
      get,
      resolution,
      'v100_free_intent_release_closure',
      'v1.0自由意图收束',
    );
  },
  resolveV110RouteLocationStateAction: () => {
    const store = get?.() || {};
    const resolution = resolveV110RouteLocationStateAction({
      livingWorldState: store.livingWorldState,
      routeLocationState: store.routeLocationState,
      turn: store.turn,
    });

    if (set) {
      set((state: any) => ({
        routeLocationState: resolution.routeLocationState,
        flags: {
          ...(state.flags || {}),
          lastLivingWorldPatch: {
            source: 'v110_route_location_state',
            actionId: resolution.actionId,
            success: resolution.success,
            applied: resolution.success ? ['routeLocationState'] : [],
            rejected: resolution.rejectedReasons,
          },
        },
      }));
    }

    store.addGameLog?.('system', `v1.1路线/地点范围：${resolution.publicSummary}`, {
      actionId: resolution.actionId,
      success: resolution.success,
      routeLocationState: resolution.routeLocationState,
      visibleSourceRefs: resolution.visibleSourceRefs,
      forbiddenUpgrades: resolution.forbiddenUpgrades,
      rejected: resolution.rejectedReasons,
    });

    return {
      success: resolution.success,
      message: resolution.message,
      resolution,
      applied: resolution.success ? ['routeLocationState'] : [],
      rejected: resolution.rejectedReasons,
    };
  },
});
