import type {
  LocalActionLedgerEntry,
  NarrativeAdvanceIntent,
  SceneActionBudget,
  SceneSessionState,
} from '../types';

export const SCENE_SESSION_VERSION = 'v0.8.0-c2.2';

export function createDefaultSceneSessionState(input: Partial<SceneSessionState> = {}): SceneSessionState {
  const maxAp = Math.max(1, Math.min(8, Number(input.actionBudget?.maxAp ?? 3)));
  const remainingAp = Math.max(0, Math.min(maxAp, Number(input.actionBudget?.remainingAp ?? maxAp)));
  const actionBudget: SceneActionBudget = {
    maxAp,
    remainingAp,
    grantedBy: input.actionBudget?.grantedBy || 'narrative_scene',
    exhaustedPolicy: input.actionBudget?.exhaustedPolicy || 'advance_narrative',
  };
  return {
    version: SCENE_SESSION_VERSION,
    sceneId: input.sceneId || 'scene_bootstrap',
    narrativeTurn: Number(input.narrativeTurn ?? 1),
    locationId: input.locationId || 'unknown',
    period: input.period || 'morning',
    safety: input.safety || 'safe',
    actionBudget,
    localActionLedger: Array.isArray(input.localActionLedger) ? input.localActionLedger.slice(-30) : [],
    pendingAdvanceIntent: input.pendingAdvanceIntent || null,
    lastNarrativeSummary: input.lastNarrativeSummary || '',
  };
}

export function normalizeSceneSessionState(input: Partial<SceneSessionState> | null | undefined): SceneSessionState {
  return createDefaultSceneSessionState(input || {});
}

export function buildSceneSessionFromStore(store: any, previous?: Partial<SceneSessionState> | null): SceneSessionState {
  const gameTime = store?.gameTime || {};
  const sceneId = `${store?.currentChapterId || 'chapter'}:${store?.turn || 1}:${gameTime.period || 'morning'}`;
  return createDefaultSceneSessionState({
    ...previous,
    sceneId,
    narrativeTurn: store?.turn || previous?.narrativeTurn || 1,
    locationId: store?.currentLocationId || store?.currentDomain || previous?.locationId || 'unknown',
    period: gameTime.period || previous?.period || 'morning',
    safety: store?.flags?._sceneSafety || previous?.safety || 'safe',
    actionBudget: {
      maxAp: Number(gameTime.max_ap ?? previous?.actionBudget?.maxAp ?? 3),
      remainingAp: Number(gameTime.ap ?? previous?.actionBudget?.remainingAp ?? 3),
      grantedBy: previous?.actionBudget?.grantedBy || 'narrative_scene',
      exhaustedPolicy: 'advance_narrative',
    },
  });
}

export function spendSceneActionBudget(input: {
  state: SceneSessionState;
  cost: number;
  actionType: LocalActionLedgerEntry['actionType'];
  summary: string;
  source: string;
  systemResult?: Record<string, unknown>;
  risks?: string[];
  turn?: number;
}): { success: boolean; state: SceneSessionState; entry?: LocalActionLedgerEntry; message: string } {
  const state = normalizeSceneSessionState(input.state);
  const cost = Math.max(1, Math.round(Number(input.cost || 1)));
  if (state.actionBudget.remainingAp < cost) {
    return {
      success: false,
      state,
      message: '当前剧情场景 AP 已用尽，需要推进剧情或结束时段后再行动。',
    };
  }
  const entry: LocalActionLedgerEntry = {
    id: `scene_action_${state.narrativeTurn}_${state.localActionLedger.length + 1}`,
    turn: Number(input.turn ?? state.narrativeTurn),
    sceneId: state.sceneId,
    actionType: input.actionType,
    source: input.source,
    cost,
    summary: input.summary,
    systemResult: input.systemResult || {},
    risks: input.risks || [],
  };
  const next = normalizeSceneSessionState({
    ...state,
    actionBudget: {
      ...state.actionBudget,
      remainingAp: Math.max(0, state.actionBudget.remainingAp - cost),
    },
    localActionLedger: [...state.localActionLedger, entry].slice(-30),
    pendingAdvanceIntent: null,
  });
  return { success: true, state: next, entry, message: input.summary };
}

export function buildNarrativeAdvanceIntent(state: SceneSessionState, reason = 'player_advance'): NarrativeAdvanceIntent {
  const normalized = normalizeSceneSessionState(state);
  return {
    id: `narrative_advance_${normalized.narrativeTurn}_${normalized.localActionLedger.length}`,
    sceneId: normalized.sceneId,
    reason,
    spentAp: normalized.actionBudget.maxAp - normalized.actionBudget.remainingAp,
    ledgerEntryIds: normalized.localActionLedger.map(entry => entry.id),
    summary: normalized.localActionLedger.length > 0
      ? normalized.localActionLedger.map(entry => `${entry.actionType}:${entry.summary}`).join('；')
      : '玩家未进行本地行动，直接推进剧情。',
  };
}

export function formatSceneSessionForPrompt(state: SceneSessionState | null | undefined): string {
  const normalized = normalizeSceneSessionState(state || undefined);
  const ledger = normalized.localActionLedger.slice(-8);
  if (ledger.length === 0) {
    return [
      '【场景行动预算】',
      `当前场景：${normalized.sceneId}；AP ${normalized.actionBudget.remainingAp}/${normalized.actionBudget.maxAp}。`,
      '玩家尚未消耗本地行动。DeepSeek 只能承接剧情候选，不得私自改写行动结算。',
    ].join('\n');
  }
  return [
    '【场景行动预算】',
    `当前场景：${normalized.sceneId}；AP ${normalized.actionBudget.remainingAp}/${normalized.actionBudget.maxAp}。`,
    '本轮本地行动账本：',
    ...ledger.map(entry => `- ${entry.actionType} 消耗${entry.cost}AP：${entry.summary}`),
    '下一轮叙事必须承接这些本地结算事实；不得改写数值、胜负、资源或状态结果。',
  ].join('\n');
}
