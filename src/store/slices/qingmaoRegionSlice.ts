import {
  buildQingmaoRegionActionEntries,
  resolveQingmaoRegionAction,
  type QingmaoRegionActionEntry,
  type QingmaoRegionActionInput,
  type QingmaoRegionActionResolution,
} from '../../engine/v010-qingmao-region-engine';
import {
  buildQingmaoResourceLoopEntries,
  resolveQingmaoResourceLoopAction,
  type QingmaoResourceLoopEntry,
  type QingmaoResourceLoopResolution,
} from '../../engine/v010-qingmao-resource-loop';
import {
  buildQingmaoCombatEventCandidate,
  type QingmaoCombatCandidateBuildResult,
} from '../../engine/v010-qingmao-combat-pack';
import type { LocalActionLedgerEntry } from '../../types';
import { buildNarrativeReturnContext } from '../../engine/v090-world-action-protocol';
import { applyLivingWorldPatch } from '../../engine/v011-living-world-patch';

export interface QingmaoRegionActionStoreResult {
  success: boolean;
  message: string;
  saveFormatImpact: QingmaoRegionActionResolution['saveFormatImpact'];
  engine: QingmaoRegionActionResolution;
}

export interface QingmaoResourceLoopStoreResult {
  success: boolean;
  message: string;
  saveFormatImpact: QingmaoResourceLoopResolution['saveFormatImpact'];
  engine: QingmaoResourceLoopResolution;
}

export interface QingmaoRegionSlice {
  listQingmaoRegionActionEntriesAction: () => QingmaoRegionActionEntry[];
  resolveQingmaoRegionActionAction: (input: QingmaoRegionActionInput) => QingmaoRegionActionStoreResult;
  listQingmaoResourceLoopEntriesAction: () => QingmaoResourceLoopEntry[];
  resolveQingmaoResourceLoopActionAction: (actionId: string) => QingmaoResourceLoopStoreResult;
  registerQingmaoCombatCandidateAction: (templateId: string) => {
    success: boolean;
    message: string;
    build: QingmaoCombatCandidateBuildResult;
  };
}

function pushL3Warning(get: any, ruleName: string, details: string): void {
  const store = get() as any;
  if (typeof store.setL3Warnings === 'function') {
    store.setL3Warnings([...(store.l3Warnings || []), { ruleName, details }].slice(-20));
  }
}

function logQingmaoRegionResult(get: any, engine: QingmaoRegionActionResolution, category: 'system' | 'danger'): void {
  const store = get() as any;
  store.addGameLog?.(category, engine.message, {
    regionId: 'qingmao_three_clans',
    sourceId: engine.entry?.source.id,
    actionSlotId: engine.entry?.actionSlot.id,
    saveFormatImpact: engine.saveFormatImpact,
    blockers: engine.validation.blockers,
    warnings: engine.validation.warnings,
    worldAction: engine.worldActionResolution,
  });
}

function logQingmaoResourceResult(get: any, engine: QingmaoResourceLoopResolution, category: 'system' | 'danger'): void {
  const store = get() as any;
  store.addGameLog?.(category, engine.message, {
    source: 'qingmao_resource_loop',
    actionId: engine.entry?.action.id,
    targetGu: engine.entry?.action.targetGu,
    saveFormatImpact: engine.saveFormatImpact,
    rewardMaterials: engine.rewardMaterials,
    blockers: engine.validation.blockers,
    warnings: engine.validation.warnings,
    worldAction: engine.worldActionResolution,
  });
}

function spendQingmaoResourceAp(
  get: any,
  cost: number,
  summary: string,
  source: string,
  systemResult: Record<string, unknown>,
  risks: string[],
): { success: boolean; message: string; entry?: LocalActionLedgerEntry } {
  const store = get() as any;
  if (cost <= 0) return { success: true, message: '无需消耗场景 AP。' };
  if (typeof store.spendSceneAp === 'function') {
    return store.spendSceneAp(cost, 'resource', summary, source, systemResult, risks);
  }
  const success = Boolean(store.spendAp?.(cost, summary));
  return { success, message: success ? summary : '行动点不足。' };
}

function applyQingmaoResourceRewards(set: any, get: any, engine: QingmaoResourceLoopResolution): void {
  if (!engine.success) return;
  const store = get() as any;
  for (const reward of engine.rewardMaterials) {
    const quantity = Math.max(1, Math.round(Number(reward.quantity || 1)));
    if (typeof store.addMaterial === 'function') {
      store.addMaterial(reward.materialName, quantity);
    } else {
      set((s: any) => ({
        materialBag: {
          ...(s.materialBag || {}),
          [reward.materialName]: Number(s.materialBag?.[reward.materialName] || 0) + quantity,
        },
      }));
    }
  }
  for (const [creditKey, amount] of Object.entries(engine.feedingCredits || {})) {
    if (typeof store.addFeedingCredit === 'function') {
      store.addFeedingCredit(creditKey, Number(amount || 0));
    }
  }
}

function commitQingmaoResourceReturnContext(
  set: any,
  get: any,
  engine: QingmaoResourceLoopResolution,
  spentEntry?: LocalActionLedgerEntry,
): void {
  if (!engine.worldActionResolution) return;
  const store = get() as any;
  const ledgerEntries = spentEntry
    ? [spentEntry]
    : engine.worldActionLedgerEntry
      ? [engine.worldActionLedgerEntry]
      : [];
  const context = buildNarrativeReturnContext({
    sceneId: engine.worldActionCandidate?.sceneId || store.sceneSessionState?.sceneId || 'current_scene',
    turn: Number(store.turn || engine.worldActionResolution.turn || 1),
    ledgerEntries,
    resolutions: [engine.worldActionResolution],
  });
  set((s: any) => ({
    flags: {
      ...(s.flags || {}),
      lastWorldActionReturnContext: context,
    },
  }));
}

function qingmaoLivingWorldPhase(store: any): 'morning' | 'afternoon' | 'night' {
  const period = String(store.gameTime?.period || '').toLowerCase();
  if (period === 'night') return 'night';
  if (period === 'noon' || period === 'afternoon') return 'afternoon';
  if (period === 'evening') return 'night';
  return 'morning';
}

function commitQingmaoLivingWorldBackflow(
  set: any,
  get: any,
  engine: QingmaoRegionActionResolution,
  source: string,
): void {
  if (!engine.success || !engine.worldActionResolution) return;
  const store = get() as any;
  const resolution = engine.worldActionResolution;
  const turn = Number(store.turn || resolution.turn || 1);
  const factId = `qingmao_known_${resolution.id}`;
  const consequenceId = `qingmao_consequence_${resolution.id}`;
  const patch = applyLivingWorldPatch(store.livingWorldState, {
    source: 'action_protocol',
    worldClock: {
      turn,
      day: Number(store.gameTime?.day || 1),
      phase: qingmaoLivingWorldPhase(store),
      lastActionId: resolution.departureId,
    },
    knownFacts: [{
      id: factId,
      scope: 'region',
      source: 'engine_result',
      summary: resolution.summary,
      learnedTurn: turn,
      confidence: resolution.status === 'resolved' ? 'confirmed' : 'rumor',
      tags: ['v0.11.0-a2', 'qingmao_region', source],
    }],
    actionConsequences: [{
      id: consequenceId,
      actionId: resolution.departureId,
      turn,
      scope: 'region',
      publicSummary: resolution.summary,
      effectRefs: [factId, ...resolution.localFacts.map((_, index) => `${resolution.id}:local_fact:${index}`)],
      followUpRefs: [],
    }],
  });
  set((s: any) => ({
    livingWorldState: patch.state,
    flags: {
      ...(s.flags || {}),
      lastLivingWorldPatch: {
        source: `qingmao_region:${source}`,
        applied: patch.applied,
        rejected: patch.rejected,
        consequenceId,
        factId,
      },
    },
  }));
}

function clanSchoolCandidate(engine: QingmaoRegionActionResolution) {
  return {
    id: `qingmao_b1_clan_school_${engine.entry?.identity.role || 'unknown'}_${Date.now()}`,
    groundId: 'tg_nanjiang_refine',
    title: engine.worldActionCandidate?.title || '青茅山族学炼蛊台竹牌',
    summary: engine.worldActionCandidate?.summary || '族学告示引向青茅山炼蛊台。该入口由道场引擎正式结算。',
    source: 'faction' as const,
    locationHint: '青茅山族学与炼蛊台',
    risk: engine.worldActionCandidate?.risk || 'low',
    apCostHint: engine.worldActionCandidate?.apCost || 1,
    sceneTags: ['v0.10.0-b1', 'qingmao_region', 'clan_school_training'],
    unlockReason: '青茅山区域行动入口桥接。',
  };
}

export const createQingmaoRegionSlice = (_set: any, get: any): QingmaoRegionSlice => ({
  listQingmaoRegionActionEntriesAction: () => buildQingmaoRegionActionEntries({ store: get() }),
  listQingmaoResourceLoopEntriesAction: () => buildQingmaoResourceLoopEntries({ store: get() }),

  resolveQingmaoRegionActionAction: (input) => {
    const engine = resolveQingmaoRegionAction(input, { store: get() });
    const slotId = engine.entry?.actionSlot.id;

    if (!engine.validation.valid || !engine.entry) {
      logQingmaoRegionResult(get, engine, 'danger');
      pushL3Warning(get, 'qingmao_region_action_blocked', engine.message);
      return {
        success: false,
        message: engine.message,
        saveFormatImpact: engine.saveFormatImpact,
        engine,
      };
    }

    if (slotId === 'clan_school_training') {
      const store = get() as any;
      if (typeof store.recordTrainingGroundCandidateAction !== 'function'
        || typeof store.resolveTrainingGroundAction !== 'function') {
        const message = '道场行动系统不可用，无法进入青茅山族学炼蛊台。';
        pushL3Warning(get, 'qingmao_region_training_store_missing', message);
        return { success: false, message, saveFormatImpact: engine.saveFormatImpact, engine };
      }

      const validation = store.recordTrainingGroundCandidateAction(clanSchoolCandidate(engine));
      if (!validation?.valid) {
        const message = validation?.blockers?.join('；') || '青茅山族学炼蛊台入口未通过道场验证。';
        pushL3Warning(get, 'qingmao_region_training_candidate_blocked', message);
        return { success: false, message, saveFormatImpact: engine.saveFormatImpact, engine };
      }

      const result = store.resolveTrainingGroundAction('tg_nanjiang_refine');
      return {
        success: Boolean(result?.success),
        message: result?.message || engine.message,
        saveFormatImpact: engine.saveFormatImpact,
        engine,
      };
    }

    if (slotId === 'mountain_patrol') {
      const store = get() as any;
      if (typeof store.performFieldAction !== 'function') {
        const message = '野外行动系统不可用，无法执行青茅山山道巡查。';
        pushL3Warning(get, 'qingmao_region_field_store_missing', message);
        return { success: false, message, saveFormatImpact: engine.saveFormatImpact, engine };
      }

      const result = store.performFieldAction('scout', 'field');
      if (result?.success) {
        commitQingmaoLivingWorldBackflow(_set, get, engine, 'mountain_patrol');
      }
      return {
        success: Boolean(result?.success),
        message: result?.message || engine.message,
        saveFormatImpact: engine.saveFormatImpact,
        engine,
      };
    }

    logQingmaoRegionResult(get, engine, 'danger');
    pushL3Warning(get, 'qingmao_region_action_unrouted', `${slotId || 'unknown'} 尚未接入 store 路由。`);
    return {
      success: false,
      message: `${engine.entry.actionSlot.displayName} 尚未接入 store 路由。`,
      saveFormatImpact: engine.saveFormatImpact,
      engine,
    };
  },

  resolveQingmaoResourceLoopActionAction: (actionId) => {
    const engine = resolveQingmaoResourceLoopAction(actionId, { store: get() });

    if (!engine.validation.valid || !engine.entry) {
      logQingmaoResourceResult(get, engine, 'danger');
      pushL3Warning(get, 'qingmao_resource_loop_blocked', engine.message);
      return {
        success: false,
        message: engine.message,
        saveFormatImpact: engine.saveFormatImpact,
        engine,
      };
    }

    const summary = engine.worldActionResolution?.summary || engine.message;
    const spend = spendQingmaoResourceAp(
      get,
      engine.entry.apCost,
      summary,
      `qingmao_resource_loop:${engine.entry.action.id}`,
      {
        worldAction: engine.worldActionResolution,
        rewardMaterials: engine.rewardMaterials,
        saveFormatImpact: engine.saveFormatImpact,
      },
      engine.worldActionResolution?.risks || engine.validation.warnings,
    );
    if (!spend.success) {
      pushL3Warning(get, 'qingmao_resource_ap_blocked', spend.message);
      return {
        success: false,
        message: spend.message,
        saveFormatImpact: engine.saveFormatImpact,
        engine,
      };
    }

    applyQingmaoResourceRewards(_set, get, engine);
    commitQingmaoResourceReturnContext(_set, get, engine, spend.entry);
    logQingmaoResourceResult(get, engine, engine.success ? 'system' : 'danger');
    return {
      success: Boolean(engine.success),
      message: engine.message,
      saveFormatImpact: engine.saveFormatImpact,
      engine,
    };
  },

  registerQingmaoCombatCandidateAction: (templateId) => {
    const build = buildQingmaoCombatEventCandidate(templateId, get());
    const ready = build.readiness?.status === 'ready_for_local_validation';
    if (!build.candidate || !build.validation?.valid || !ready) {
      const message = build.blockers.join('；')
        || build.readiness?.warnings.join('；')
        || '青茅凡战候选仍处于只读审查，暂不能登记。';
      pushL3Warning(get, 'qingmao_combat_candidate_blocked', message);
      (get() as any).addGameLog?.('danger', message, {
        templateId,
        readiness: build.readiness?.status,
        blockers: build.blockers,
        warnings: build.warnings,
      });
      return { success: false, message, build };
    }

    const candidate = build.candidate;
    const current = Array.isArray((get() as any).flags?.combatEventCandidates)
      ? (get() as any).flags.combatEventCandidates
      : [];
    _set((s: any) => ({
      flags: {
        ...(s.flags || {}),
        combatEventCandidates: [
          ...current.filter((item: any) => item?.id !== candidate.id),
          candidate,
        ].slice(-40),
      },
    }));
    const message = `已登记青茅凡战候选：${candidate.title}。`;
    (get() as any).addGameLog?.('system', message, {
      templateId,
      validation: candidate.entryValidation,
      rewardPolicy: candidate.dropPolicyId,
    });
    return { success: true, message, build };
  },
});
