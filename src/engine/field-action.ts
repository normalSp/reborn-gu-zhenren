import {
  applyEscapeSuccessModifiers,
  applyFieldActionRiskModifiers,
  applyFieldActionSuccessModifiers,
  applyFieldActionYieldModifiers,
  applyTrapDetectionModifiers,
  formatModifierBreakdown,
  type ModifierContext,
} from './modifier-engine';
import { getMaterialOverloadStatus } from './material-overload';
import type {
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
  WorldActionResolutionMode,
  WorldActionRisk,
} from '../types';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';

export type FieldActionKind = 'scout' | 'gather' | 'trap_check' | 'escape_support';

export interface FieldActionInput {
  kind: FieldActionKind;
  realmGrand: number;
  aptitude: number;
  mind: number;
  luck: number;
  turn: number;
  locationType?: 'safe' | 'caravan' | 'field' | 'wild' | 'aperture';
  store?: any;
  seed?: number;
}

export interface FieldActionResult {
  kind: FieldActionKind;
  success: boolean;
  roll: number;
  successRate: number;
  riskChance: number;
  reward?: {
    yuanStoneEquivalent?: number;
    materials?: Record<string, number>;
    flag?: string;
  };
  message: string;
  modifierLabels: string[];
}

export interface FieldActionWorldActionBridge {
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

const ACTION_BASE = {
  scout: { success: 0.68, risk: 0.08, yield: 0 },
  gather: { success: 0.66, risk: 0.12, yield: 18 },
  trap_check: { success: 0.58, risk: 0.16, yield: 0 },
  escape_support: { success: 0.52, risk: 0.2, yield: 0 },
} satisfies Record<FieldActionKind, { success: number; risk: number; yield: number }>;

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentSceneId(store: any): string {
  return String(store?.sceneSessionState?.sceneId || store?.currentChapterId || store?.flags?.currentSceneId || 'field_action_scene');
}

function currentLocationId(store: any, locationType?: FieldActionInput['locationType']): string {
  return String(store?.currentLocationId || store?.currentDomain || store?.sceneSessionState?.locationId || locationType || '');
}

function fieldTitle(kind: FieldActionKind): string {
  if (kind === 'scout') return '侦察周边';
  if (kind === 'gather') return '野外采集';
  if (kind === 'trap_check') return '排查陷阱';
  return '撤离准备';
}

function fieldRisk(result: FieldActionResult, locationType?: FieldActionInput['locationType']): WorldActionRisk {
  if (locationType === 'wild' || result.riskChance >= 0.18) return 'high';
  if (result.riskChance >= 0.1 || !result.success) return 'medium';
  return 'low';
}

function materialSummary(materials: Record<string, number> | undefined): string {
  const entries = Object.entries(materials || {});
  return entries.length > 0 ? entries.map(([name, amount]) => `${name} x${amount}`).join('、') : '无正式材料入库';
}

function defaultFieldActionFacts(result: FieldActionResult, locationType?: FieldActionInput['locationType']): string[] {
  const facts = [
    `${fieldTitle(result.kind)}由本地引擎结算：${result.success ? '成功' : '失败'}。`,
    `地点类型：${locationType || 'field'}；成功率 ${Math.round(result.successRate * 100)}%；风险 ${Math.round(result.riskChance * 100)}%。`,
  ];
  if (result.kind === 'gather') {
    facts.push(result.success
      ? `本次正式入库材料：${materialSummary(result.reward?.materials)}；元石等价仅作为经济说明：${result.reward?.yuanStoneEquivalent || 0}。`
      : '本次采集未获得正式材料。');
  } else if (result.reward?.flag) {
    facts.push(`本次只登记本地辅助标记：${result.reward.flag}，不解锁正式地点或奖励。`);
  }
  facts.push('DeepSeek 只能承接环境、线索、压力和回流文本，不得追加材料、蛊虫、仙材、仙蛊、正式地点或战斗结果。');
  return facts;
}

function defaultFieldActionRisks(result: FieldActionResult): string[] {
  const risks = [
    '野外行动奖励、材料入库、伤势和战斗触发只认本地引擎/store 输出。',
  ];
  if (result.kind === 'gather') {
    risks.push('普通采集只能获得已登记低阶蛊材；不得升级为仙材、仙蛊、完整蛊方或稳定暴富路径。');
  }
  if (result.kind === 'scout') {
    risks.push('侦察结果只能形成线索或风险提示，不等于正式地点解锁。');
  }
  return risks;
}

export function resolveFieldAction(input: FieldActionInput): FieldActionResult {
  const base = ACTION_BASE[input.kind];
  const realm = Math.max(1, Number(input.realmGrand || 1));
  const aptitude = Math.max(0, Math.min(10, Number(input.aptitude || 5)));
  const mind = Math.max(0, Math.min(10, Number(input.mind || 5)));
  const luck = Math.max(0, Math.min(10, Number(input.luck || 5)));
  const locationRisk = input.locationType === 'safe' || input.locationType === 'aperture' ? 0.5 : input.locationType === 'wild' ? 1.25 : 1;
  const op = input.kind;
  const context: ModifierContext = {
    store: input.store,
    operation: op,
    tier: realm,
    locationType: input.locationType,
  };

  const baseSuccess = base.success + aptitude * 0.008 + mind * 0.01 + luck * 0.004;
  const successQuote = input.kind === 'trap_check'
    ? applyTrapDetectionModifiers(baseSuccess, context)
    : input.kind === 'escape_support'
      ? applyEscapeSuccessModifiers(baseSuccess, context)
      : applyFieldActionSuccessModifiers(baseSuccess, context);
  const riskQuote = applyFieldActionRiskModifiers(Math.max(0, base.risk * locationRisk - luck * 0.004), context);
  const yieldQuote = applyFieldActionYieldModifiers(base.yield, context);
  const overloadStatus = getMaterialOverloadStatus({
    materialBag: input.store?.materialBag,
    capacity: input.store?.materialBagCapacity,
  });
  const overloadSuccessPenalty = input.kind === 'escape_support'
    ? overloadStatus.escapeSuccessPenalty
    : overloadStatus.fieldSuccessPenalty;
  const successRate = Math.max(0.01, successQuote.rate - overloadSuccessPenalty);
  const riskChance = Math.min(0.98, riskQuote.risk * overloadStatus.riskMultiplier);
  const rng = seeded(input.seed ?? (input.turn * 131 + realm * 17 + input.kind.length * 41));
  const roll = rng();
  const success = roll <= successRate;
  const labels = [
    ...formatModifierBreakdown(successQuote.breakdown),
    ...formatModifierBreakdown(riskQuote.breakdown),
    ...formatModifierBreakdown(yieldQuote.breakdown),
    ...(overloadStatus.overloaded ? [overloadStatus.severity === 'heavy' ? '物资袋严重超载' : '物资袋超载'] : []),
  ];

  if (!success) {
    return {
      kind: input.kind,
      success,
      roll,
      successRate,
      riskChance,
      message: input.kind === 'gather' ? '采集未有所得，仍消耗了本时段行动余裕。' : '行动未达成预期，已留下风险线索。',
      modifierLabels: Array.from(new Set(labels)),
    };
  }

  if (input.kind === 'gather') {
    const yuanValue = Math.max(10, Math.min(30, yieldQuote.yieldValue));
    const materialAmount = Math.max(1, Math.round(yuanValue / 12));
    return {
      kind: input.kind,
      success,
      roll,
      successRate,
      riskChance,
      reward: { yuanStoneEquivalent: yuanValue, materials: { 普通蛊材: materialAmount } },
      message: `采集成功，获得普通蛊材 x${materialAmount}（约 ${yuanValue} 元石等价）。`,
      modifierLabels: Array.from(new Set(labels)),
    };
  }

  const flag = `field_action_${input.kind}_turn_${input.turn}`;
  return {
    kind: input.kind,
    success,
    roll,
    successRate,
    riskChance,
    reward: { flag },
    message: input.kind === 'scout'
      ? '侦察成功：下一次野外遭遇会获得更清晰风险提示。'
      : input.kind === 'trap_check'
        ? '陷阱检查成功：已标记本时段可避开的暗手。'
        : '撤离支援准备完成：下一次逃脱判定会获得辅助。',
    modifierLabels: Array.from(new Set(labels)),
  };
}

export function buildFieldActionWorldActionBridge(input: {
  result: FieldActionResult;
  store?: any;
  locationType?: FieldActionInput['locationType'];
  summary?: string;
  status?: WorldActionResolution['status'];
  localFacts?: string[];
  risks?: string[];
  blockedReasons?: string[];
  mode?: WorldActionResolutionMode;
  chargeAp?: boolean;
  metadata?: Record<string, unknown>;
}): FieldActionWorldActionBridge {
  const store = input.store || {};
  const result = input.result;
  const turn = Number(store?.turn || 1);
  const sequence = Array.isArray(store?.sceneSessionState?.localActionLedger) ? store.sceneSessionState.localActionLedger.length + 1 : 1;
  const summary = input.summary || `${fieldTitle(result.kind)}：${result.message}`;
  const risks = uniqueStrings([...defaultFieldActionRisks(result), ...(input.risks || [])]);
  const candidate = createWorldActionCandidate({
    id: `field_action_${result.kind}_${turn}_${sequence}`,
    domain: 'field_action',
    sourceId: result.kind,
    title: fieldTitle(result.kind),
    summary,
    source: 'engine',
    sceneId: currentSceneId(store),
    locationId: currentLocationId(store, input.locationType),
    risk: fieldRisk(result, input.locationType),
    apCost: 1,
    blockers: input.blockedReasons,
    warnings: risks,
    tags: uniqueStrings(['field_action', result.kind, input.locationType || 'field']),
    createdTurn: turn,
    metadata: {
      kind: result.kind,
      sequence,
      locationType: input.locationType || 'field',
      successRate: result.successRate,
      riskChance: result.riskChance,
      roll: result.roll,
      success: result.success,
      reward: result.reward,
      ...input.metadata,
    },
  });
  const status = input.status || (input.blockedReasons?.length ? 'blocked' : result.success ? 'resolved' : 'failed');
  const mode = input.mode || (status === 'blocked' ? 'blocked' : 'local_resolution');
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode,
    chargeAp: input.chargeAp ?? status !== 'blocked',
    summary,
    blockers: input.blockedReasons,
    warnings: risks,
    metadata: {
      kind: result.kind,
      locationType: input.locationType || 'field',
    },
  });
  const worldResolution = createWorldActionResolution({
    departure,
    status,
    summary,
    localFacts: input.localFacts || defaultFieldActionFacts(result, input.locationType),
    risks,
    blockedReasons: input.blockedReasons,
    rewardPolicy: 'local_engine_only',
    metadata: {
      kind: result.kind,
      locationType: input.locationType || 'field',
      reward: result.reward,
      modifierLabels: result.modifierLabels,
      ...input.metadata,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution: worldResolution,
    source: `field_action:${result.kind}:${turn}:${sequence}`,
  });
  return {
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: worldResolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext: buildNarrativeReturnContext({
      sceneId: candidate.sceneId,
      turn,
      ledgerEntries: [ledger],
      resolutions: [worldResolution],
    }),
  };
}
