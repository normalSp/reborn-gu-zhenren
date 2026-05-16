import type {
  CalamitySceneSpec,
  CultivationDeepeningState,
  CultivationEnvironmentProfile,
  CultivationLocationContext,
  LocalActionLedgerEntry,
} from '../../types';
import {
  buildCalamityPreview,
  buildCultivationEnvironmentProfile,
  normalizeCultivationState,
  resolveAscensionAttempt,
  resolveCalamityConsequence,
  resolveCultivationSession,
  resolveMajorBreakthroughAttempt,
  validateAscensionAttempt,
  validateMajorBreakthroughAttempt,
} from '../../engine/v080-cultivation-calamity-engine';
import {
  buildCalamitySceneSpec,
  buildCalamityWorldActionBridge,
  type CalamityWorldActionBridge,
} from '../../engine/v080-calamity-scene-engine';
import { buildNarrativeReturnContext } from '../../engine/v090-world-action-protocol';
import { createInitialCultivationState } from '../defaultCultivationState';

interface CultivationPreview {
  environment: CultivationEnvironmentProfile;
  breakthrough: ReturnType<typeof validateMajorBreakthroughAttempt>;
  ascension: ReturnType<typeof validateAscensionAttempt>;
  calamity: ReturnType<typeof buildCalamityPreview>;
}

export interface CultivationSlice {
  cultivationState: CultivationDeepeningState;
  previewCultivationDeepening: (location?: CultivationLocationContext) => CultivationPreview;
  practiceCultivationDeep: (location?: CultivationLocationContext) => { success: boolean; message: string; progressGain: number; progress: number };
  attemptMajorBreakthrough: () => { success: boolean; message: string; rate: number };
  attemptAscension: () => { success: boolean; message: string; rate: number };
  stageCalamityScene: () => { success: boolean; message: string; spec?: CalamitySceneSpec };
  resolveApertureCalamity: () => { success: boolean; message: string; areaLoss?: number };
  practiceCultivation: () => { success: boolean; message: string; progressGain: number; progress: number };
  attemptBreakthrough: () => { success: boolean; message: string; rate: number };
}

function setCultivationState(set: any, get: any, next: CultivationDeepeningState): void {
  set((s: any) => ({
    cultivationState: next,
    flags: {
      ...(s.flags || {}),
      cultivationProgress: next.progress,
      lastCultivationResolution: next.lastResolution,
    },
  }));
  const fullStore = get() as any;
  if (typeof fullStore.addGameLog === 'function' && next.lastResolution.length > 0) {
    const last = next.lastResolution[next.lastResolution.length - 1];
    fullStore.addGameLog('system', last.message, {
      source: 'v080-cultivation',
      stepKind: last.kind,
      stepCount: next.lastResolution.length,
    });
  }
}

function spendEssence(set: any, get: any, amount: number): void {
  if (amount <= 0) return;
  const state = get() as any;
  const essence = state.vitals?.essence || { current: 0, max: 1 };
  set((s: any) => ({
    vitals: {
      ...s.vitals,
      essence: {
        ...essence,
        current: Math.max(0, Number(essence.current || 0) - amount),
      },
    },
  }));
}

function applyPercentHealth(set: any, get: any, percent: number, source: string): void {
  const store = get() as any;
  if (typeof store.applyHpPercent === 'function') {
    store.applyHpPercent(-percent, source);
    return;
  }
  const health = store.vitals?.health || { current: 100, max: 100 };
  const loss = Math.round(Number(health.max || 100) * percent / 100);
  set((s: any) => ({
    vitals: {
      ...s.vitals,
      health: { ...health, current: Math.max(0, Number(health.current || 0) - loss) },
    },
  }));
}

function applyEssencePercentLoss(set: any, get: any, percent: number): void {
  const store = get() as any;
  const essence = store.vitals?.essence || { current: 0, max: 1 };
  const loss = Math.round(Number(essence.max || 1) * percent / 100);
  set((s: any) => ({
    vitals: {
      ...s.vitals,
      essence: { ...essence, current: Math.max(0, Number(essence.current || 0) - loss) },
    },
  }));
}

function applyGuPenalty(set: any, get: any, kind: string, amount: number): void {
  const store = get() as any;
  const inventory = Array.isArray(store.inventory) ? store.inventory : [];
  const target = inventory.find((gu: any) => gu && gu.currentState !== 'dead' && (gu.active !== false || gu.bonded))
    || inventory.find((gu: any) => gu && gu.currentState !== 'dead');
  if (!target) return;
  set({
    inventory: inventory.map((gu: any) => {
      if (gu.id !== target.id) return gu;
      if (kind === 'gu_injury') return { ...gu, currentState: gu.currentState === 'dead' ? 'dead' : 'injured' };
      return {
        ...gu,
        currentState: gu.currentState === 'optimal' || gu.currentState === 'fed' ? 'hungry' : gu.currentState,
        hungerCounter: Number(gu.hungerCounter || 0) + Math.max(1, amount),
      };
    }),
  } as any);
}

function applyAperturePressure(set: any, get: any, amount: number): void {
  const aperture = (get() as any).aperture;
  if (!aperture || aperture.type !== 'mortal') return;
  const currentPressure = Number((aperture as any).aperturePressure || aperture.primevalSea?.fillPercent || 0);
  set({ aperture: { ...aperture, aperturePressure: Math.max(0, currentPressure + amount) } } as any);
}

function applyBreakthroughPenalties(set: any, get: any, penalties: Array<{ kind: string; amount: number }>): void {
  for (const penalty of penalties) {
    if (penalty.kind === 'hp_loss') applyPercentHealth(set, get, penalty.amount, '突破失败反噬');
    if (penalty.kind === 'essence_shock') applyEssencePercentLoss(set, get, penalty.amount);
    if (penalty.kind === 'gu_hunger' || penalty.kind === 'gu_injury') applyGuPenalty(set, get, penalty.kind, penalty.amount);
    if (penalty.kind === 'aperture_pressure') applyAperturePressure(set, get, penalty.amount);
  }
}

function spendCultivationSceneAp(
  store: any,
  type: 'cultivate' | 'breakthrough' | 'calamity',
  cost: number,
  summary: string,
  source: string,
  systemResult: Record<string, unknown> = {},
  risks: string[] = [],
): { success: boolean; message: string; entry?: LocalActionLedgerEntry } {
  if (cost <= 0) {
    return {
      success: true,
      message: '无需消耗行动点。',
      entry: {
        id: `cultivation_ap_${source}`,
        turn: Number(store.turn || 1),
        sceneId: String(store.sceneSessionState?.sceneId || store.currentChapterId || 'current_scene'),
        actionType: type,
        source,
        cost: 0,
        summary,
        systemResult,
        risks,
      },
    };
  }
  if (typeof store.spendSceneAp === 'function') {
    return store.spendSceneAp(cost, type, summary, source, systemResult, risks);
  }
  const success = Boolean(store.spendAp?.(cost, summary));
  return {
    success,
    message: success ? `消耗${cost}点行动点（兼容模式）。` : `行动点不足：需要${cost}点。`,
    entry: success ? {
      id: `cultivation_ap_${source}`,
      turn: Number(store.turn || 1),
      sceneId: String(store.sceneSessionState?.sceneId || store.currentChapterId || 'current_scene'),
      actionType: type,
      source,
      cost,
      summary,
      systemResult,
      risks,
    } : undefined,
  };
}

function findWorldActionLedgerEntry(store: any, source: string): LocalActionLedgerEntry | null {
  const ledger = Array.isArray(store.sceneSessionState?.localActionLedger) ? store.sceneSessionState.localActionLedger : [];
  return ledger.find((entry: any) => entry.source === source) || null;
}

function commitCalamityWorldActionReturnContext(
  set: any,
  get: any,
  bridge: CalamityWorldActionBridge | null,
  spentEntry?: LocalActionLedgerEntry | null,
): void {
  if (!bridge?.worldActionResolution) return;
  const store = get() as any;
  const ledgerEntries = spentEntry ? [spentEntry] : [bridge.worldActionLedgerEntry];
  const context = buildNarrativeReturnContext({
    sceneId: bridge.worldActionCandidate.sceneId || store.sceneSessionState?.sceneId || 'current_scene',
    turn: Number(store.turn || bridge.worldActionResolution.turn || 1),
    ledgerEntries,
    resolutions: [bridge.worldActionResolution],
  });
  set((s: any) => ({
    flags: {
      ...(s.flags || {}),
      lastWorldActionReturnContext: context,
      lastCalamityWorldAction: {
        candidate: bridge.worldActionCandidate,
        departure: bridge.worldActionDeparture,
        resolution: bridge.worldActionResolution,
      },
    },
  }));
}

function calamityConsequenceFacts(result: ReturnType<typeof resolveCalamityConsequence>, spec: CalamitySceneSpec): string[] {
  if (!result.success || !result.record) {
    return [
      `灾劫结算被本地引擎阻断：${result.blockedReason || result.steps.at(-1)?.message || spec.name}。`,
      '阻断状态下不得让 DeepSeek 私自补写面积、资源点、道痕、蛊虫损伤或奖励。',
    ];
  }
  const record = result.record;
  const resourceDamageCount = Object.keys(record.resourceNodeDamage || {}).length;
  const daoMarkText = Object.entries(record.daoMarkDelta || {})
    .map(([path, delta]) => `${path}${Number(delta) >= 0 ? '+' : ''}${delta}`)
    .join('、');
  return [
    `灾劫后果由本地引擎结算：${record.calamityName}。`,
    `福地面积损失 ${record.areaLoss} 亩，${resourceDamageCount} 个资源点受损。`,
    daoMarkText ? `道痕变化：${daoMarkText}。` : '本次未产生新增道痕变化。',
    record.guDamageIds.length > 0 ? `${record.guDamageIds.length} 只蛊虫被灾劫波及。` : '本次未产生蛊虫损伤。',
    result.preview ? `下一劫预兆：${result.preview.name}，倒计时 ${result.preview.countdown}。` : '下一劫预兆暂未形成。',
    'DeepSeek 只能承接这些本地事实写回流文本，不得改写灾劫后果。',
  ];
}

export const createCultivationSlice = (set: any, get: any): CultivationSlice => ({
  cultivationState: createInitialCultivationState(),

  previewCultivationDeepening: (location) => {
    const store = get() as any;
    const state = normalizeCultivationState(store.cultivationState);
    return {
      environment: buildCultivationEnvironmentProfile({ store, state, location }),
      breakthrough: validateMajorBreakthroughAttempt({ store, state }),
      ascension: validateAscensionAttempt({ store, state }),
      calamity: buildCalamityPreview({ store, state }),
    };
  },

  practiceCultivationDeep: (location) => {
    const store = get() as any;
    const state = normalizeCultivationState(store.cultivationState);
    const result = resolveCultivationSession({ store, state, location, seed: `cult:${store.turn}:${store.gameTime?.period}` });
    if (!result.success) {
      setCultivationState(set, get, result.state);
      return { success: false, message: result.steps.at(-1)?.message || '修行条件不足。', progressGain: 0, progress: result.state.progress };
    }
    if (!spendCultivationSceneAp(store, 'cultivate', 1, `v0.8 深修：进度 +${result.progressGain}`, 'practiceCultivationDeep').success) {
      return { success: false, message: '行动点不足，无法专注修行。', progressGain: 0, progress: state.progress };
    }
    spendEssence(set, get, result.essenceCost);
    setCultivationState(set, get, result.state);
    return {
      success: true,
      message: `修行进度 +${result.progressGain}，${result.environment.periodLabel}气机已记录。`,
      progressGain: result.progressGain,
      progress: result.state.progress,
    };
  },

  attemptMajorBreakthrough: () => {
    const store = get() as any;
    const state = normalizeCultivationState(store.cultivationState);
    const validation = validateMajorBreakthroughAttempt({ store, state });
    if (!validation.valid) {
      return { success: false, message: validation.reason || '突破条件不足。', rate: validation.successRate };
    }
    if (!spendCultivationSceneAp(store, 'breakthrough', 1, 'v0.8 大境界突破：成败由本地引擎结算', 'attemptMajorBreakthrough').success) {
      return { success: false, message: '行动点不足，无法冲击境界。', rate: validation.successRate };
    }
    const result = resolveMajorBreakthroughAttempt({ store: get(), state, seed: `bt:${store.turn}:${state.progress}` });
    spendEssence(set, get, result.validation.essenceCost);
    if (result.success && result.realmAfter) {
      (get() as any).applyStateUpdate?.({ realm: { action: 'set', value: result.realmAfter.label } });
    } else if (result.penalties) {
      applyBreakthroughPenalties(set, get, result.penalties);
    }
    setCultivationState(set, get, result.state);
    return {
      success: result.success,
      message: result.success ? `突破成功：${result.realmAfter?.label}` : '突破失败，反噬已由本地引擎结算。',
      rate: result.validation.successRate,
    };
  },

  attemptAscension: () => {
    const store = get() as any;
    const state = normalizeCultivationState(store.cultivationState);
    const validation = validateAscensionAttempt({ store, state });
    if (!validation.valid) {
      return { success: false, message: validation.reason || '升仙条件不足。', rate: validation.successRate };
    }
    if (!spendCultivationSceneAp(store, 'breakthrough', 1, 'v0.8 升仙尝试：三气与福地由本地引擎结算', 'attemptAscension').success) {
      return { success: false, message: '行动点不足，无法布置升仙。', rate: validation.successRate };
    }
    const oldAperture = store.aperture;
    const result = resolveAscensionAttempt({ store: get(), state, seed: `asc:${store.turn}:${state.progress}` });
    if (result.success && result.realmAfter && result.aperture && result.heavenlyLand) {
      set((s: any) => ({
        cultivationState: result.state,
        profile: { ...s.profile, realm: result.realmAfter },
        vitals: {
          ...s.vitals,
          essenceType: 'immortal',
          essence: { current: 2000, max: 2000 },
        },
        heavenlyLand: result.heavenlyLand,
        maxRealmReached: Math.max(Number(s.maxRealmReached || 1), 6),
        flags: {
          ...(s.flags || {}),
          cultivationProgress: result.state.progress,
          lastCultivationResolution: result.steps,
          ascendedExtremePhysiqueType: oldAperture?.extremePhysiqueType || s.flags?.ascendedExtremePhysiqueType,
        },
      }));
      const after = get() as any;
      after.initializeAperture?.(result.aperture);
      after.migrateToApertureStorage?.();
      after.addGameLog?.('system', `升仙成功：开辟${result.aperture.grade}，下一劫为${result.aperture.next_disaster_type}`, {
        source: 'v080-cultivation',
        grade: result.aperture.grade,
        areaMu: result.aperture.area_mu,
      });
    } else {
      if (result.penalties) {
        applyPercentHealth(set, get, result.penalties.healthPct, '升仙失败反噬');
        applyEssencePercentLoss(set, get, result.penalties.essencePct);
        applyAperturePressure(set, get, result.penalties.aperturePressure);
      }
      setCultivationState(set, get, result.state);
    }
    return {
      success: result.success,
      message: result.success ? '升仙成功，福地已开辟。' : '升仙失败，三气反噬已结算。',
      rate: result.validation.successRate,
    };
  },

  stageCalamityScene: () => {
    const store = get() as any;
    const state = normalizeCultivationState(store.cultivationState);
    const preview = buildCalamityPreview({ store, state });
    const spec = buildCalamitySceneSpec({ store, preview });
    if (!spec) {
      return { success: false, message: '尚未形成可进入剧情的灾劫预兆。' };
    }
    const bridge = buildCalamityWorldActionBridge({
      spec,
      store,
      phase: 'omen',
      summary: `灾劫预兆入场：${spec.name}`,
      status: 'pending_narrative',
      mode: 'narrative_return',
      chargeAp: true,
      localFacts: [
        `灾劫预兆已入场：${spec.name}。`,
        `DeepSeek 可写${spec.allowedResponses.join('、')}等应对方向，但不得结算灾劫后果。`,
        '灾劫面积、资源点、道痕、蛊虫损伤和战斗胜负仍由本地引擎决定。',
      ],
    });
    const spend = spendCultivationSceneAp(
      store,
      'calamity',
      bridge.worldActionLedgerEntry.cost,
      bridge.worldActionLedgerEntry.summary,
      bridge.worldActionLedgerEntry.source,
      bridge.worldActionLedgerEntry.systemResult,
      bridge.worldActionLedgerEntry.risks,
    );
    if (!spend.success) {
      return { success: false, message: spend.message || '行动点不足，无法布置灾劫应对。', spec };
    }
    const turn = Number(store.turn || 1);
    const resolutionStep = {
      id: `calamity_scene_${turn}_${spec.kind}`,
      turn,
      kind: 'calamity_warning' as const,
      message: `${spec.name}已进入剧情场景：${spec.omenText}`,
      source: 'v0.8.0-c2.4',
      severity: spec.severity,
      path: spec.path,
      tags: ['calamity_scene', spec.kind, spec.path],
    };
    set((s: any) => {
      const candidates = Array.isArray(s.flags?.combatEventCandidates) ? s.flags.combatEventCandidates : [];
      const combatCandidate = spec.combatScale ? [{
        id: `calamity_combat_${spec.id}`,
        type: spec.kind === 'human_calamity' ? 'ambush' : 'environment',
        title: spec.name,
        summary: spec.entryText,
        risk: spec.severity >= 4 ? 'high' : 'medium',
        scale: spec.combatScale,
        enemyHint: spec.kind === 'human_calamity' ? '人劫敌袭' : '灾劫化形',
        source: 'engine',
        engineValidation: 'pending',
        createdTurn: turn,
      }] : [];
      const lastResolution = [resolutionStep, ...state.lastResolution].slice(0, 12);
      return {
        cultivationState: normalizeCultivationState({
          ...state,
          nextCalamityPreview: preview,
          lastResolution,
        }),
        flags: {
          ...(s.flags || {}),
          pendingCalamitySceneSpec: spec,
          combatEventCandidates: [...candidates, ...combatCandidate].slice(-40),
          lastCultivationResolution: lastResolution,
        },
      };
    });
    store.addGameLog?.('danger', `灾劫预兆入场：${spec.name}`, {
      source: 'v080-calamity-scene',
      kind: spec.kind,
      path: spec.path,
      severity: spec.severity,
    });
    commitCalamityWorldActionReturnContext(set, get, bridge, spend.entry);
    return { success: true, message: `灾劫预兆已进入剧情：${spec.name}`, spec };
  },

  resolveApertureCalamity: () => {
    const store = get() as any;
    const state = normalizeCultivationState(store.cultivationState);
    const preview = buildCalamityPreview({ store, state });
    const pendingSpec = store.flags?.pendingCalamitySceneSpec as CalamitySceneSpec | undefined;
    const spec = pendingSpec || buildCalamitySceneSpec({ store, preview });
    const stagedSource = spec ? `calamity:${spec.id}:omen` : '';
    const stagedEntry = stagedSource ? findWorldActionLedgerEntry(store, stagedSource) : null;
    const alreadyStaged = Boolean(pendingSpec || stagedEntry);
    const result = resolveCalamityConsequence({ store: get(), state, seed: `cal:${store.turn}:${store.heavenlyLand?.nextDisasterType}` });
    const bridge = spec ? buildCalamityWorldActionBridge({
      spec,
      store,
      phase: 'consequence',
      summary: result.success
        ? `灾劫结算：${result.record?.calamityName || spec.name}，福地损失 ${result.record?.areaLoss || 0} 亩`
        : `灾劫结算受阻：${result.blockedReason || spec.name}`,
      status: result.success ? 'resolved' : result.blockedReason ? 'blocked' : 'failed',
      mode: result.success ? 'local_resolution' : 'blocked',
      chargeAp: !alreadyStaged,
      localFacts: calamityConsequenceFacts(result, spec),
      risks: result.success
        ? ['灾劫回流文本只能解释已结算后果，不得追加奖励或反向修正损失。']
        : ['灾劫被阻断时不得让 AI 私自完成结算。'],
      blockedReasons: result.success ? [] : [result.blockedReason || result.steps.at(-1)?.message || '灾劫无法结算。'],
      metadata: {
        calamityRecordId: result.record?.id,
        areaLoss: result.record?.areaLoss,
        resourceNodeDamage: result.record?.resourceNodeDamage,
        daoMarkDelta: result.record?.daoMarkDelta,
        guDamageIds: result.record?.guDamageIds,
      },
    }) : null;
    let spend: { success: boolean; message: string; entry?: LocalActionLedgerEntry } = {
      success: true,
      message: alreadyStaged ? '已在灾劫预兆入场阶段消耗行动点。' : '无需消耗行动点。',
      entry: stagedEntry || undefined,
    };
    if (!alreadyStaged && bridge?.worldActionLedgerEntry && bridge.worldActionLedgerEntry.cost > 0) {
      spend = spendCultivationSceneAp(
        store,
        'calamity',
        bridge.worldActionLedgerEntry.cost,
        bridge.worldActionLedgerEntry.summary,
        bridge.worldActionLedgerEntry.source,
        bridge.worldActionLedgerEntry.systemResult,
        bridge.worldActionLedgerEntry.risks,
      );
      if (!spend.success) {
        return { success: false, message: spend.message || '行动点不足，无法处置灾劫。' };
      }
    }
    if (!result.success) {
      setCultivationState(set, get, result.state);
      commitCalamityWorldActionReturnContext(set, get, bridge, spend.entry);
      return { success: false, message: result.steps.at(-1)?.message || '灾劫无法结算。' };
    }
    set((s: any) => ({
      cultivationState: result.state,
      aperture: result.aperture || s.aperture,
      heavenlyLand: result.heavenlyLand || s.heavenlyLand,
      inventory: result.inventory || s.inventory,
      flags: {
        ...(s.flags || {}),
        pendingCalamitySceneSpec: null,
        lastCultivationResolution: result.steps,
      },
    }));
    (get() as any).addGameLog?.('danger', `灾劫结算：${result.record?.calamityName}，福地损失 ${result.record?.areaLoss || 0} 亩`, {
      source: 'v080-cultivation',
      record: result.record,
    });
    commitCalamityWorldActionReturnContext(set, get, bridge, spend.entry);
    return {
      success: true,
      message: `灾劫已结算：${result.record?.calamityName}`,
      areaLoss: result.record?.areaLoss,
    };
  },

  practiceCultivation: (location?: CultivationLocationContext) => (get() as any).practiceCultivationDeep(location),
  attemptBreakthrough: () => (get() as any).attemptMajorBreakthrough(),
});
