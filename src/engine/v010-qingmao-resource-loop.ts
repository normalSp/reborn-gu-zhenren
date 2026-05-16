import qingmaoResourceLoopRaw from '../canon/qingmao-resource-loop.json';
import type {
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
  WorldActionRisk,
} from '../types';
import { getMaterialTotalQuantity } from './economy-service';
import { normalizeFeedCandidates } from './feeding-rules';
import { expandMaterialCost, getRefineRecipeForGu, getRegisteredRecipeForFragment } from './recipe-registry';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';

export type QingmaoResourceLoopEntryStatus =
  | 'available'
  | 'ap_blocked'
  | 'scene_used'
  | 'gap_only'
  | 'blocked';

type QingmaoResourceLoopMode = 'material_reward' | 'gap_only';
type QingmaoResourceGapSourceStatus = 'approved' | 'not_approved' | 'engine_private' | 'unknown';

export interface QingmaoResourceMaterialRewardSpec {
  materialName: string;
  quantity: number;
  usage: 'feeding' | 'refinement' | 'trade';
}

export interface QingmaoResourceGapRequirementSpec {
  materialName: string;
  quantity: number;
  sourceStatus: QingmaoResourceGapSourceStatus;
  reason: string;
}

export interface QingmaoResourceActionSpec {
  id: string;
  displayName: string;
  targetGu: string;
  sourceLabel: string;
  mode: QingmaoResourceLoopMode;
  apCost: number;
  risk: WorldActionRisk;
  materialRewards?: QingmaoResourceMaterialRewardSpec[];
  feedingRequirementType?: string;
  feedingCandidates?: string[];
  recipeFragmentId?: string;
  gapRequirements?: QingmaoResourceGapRequirementSpec[];
  notes: string[];
  failureCost: string;
}

export interface QingmaoResourceLoopSpec {
  _meta: {
    version: string;
    status: 'runtime_active' | 'candidate_review';
    saveFormatImpact: 'none' | 'requires_save_migration';
    scope: string;
    rewardBoundary: string;
    deepSeekBoundary: string;
  };
  actions: QingmaoResourceActionSpec[];
}

export interface QingmaoResourceRequirementLine {
  materialName: string;
  required: number;
  owned: number;
  missing: number;
  source: 'feeding' | 'refinement' | 'fragment' | 'gap';
  sourceStatus?: QingmaoResourceGapSourceStatus;
  reason?: string;
}

export interface QingmaoResourceLoopContext {
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  remainingAp?: number | null;
  store?: any;
}

export interface QingmaoResourceLoopEntry {
  id: string;
  action: QingmaoResourceActionSpec;
  status: QingmaoResourceLoopEntryStatus;
  canResolve: boolean;
  apCost: number;
  risk: WorldActionRisk;
  blockers: string[];
  warnings: string[];
  rewardPreview: QingmaoResourceMaterialRewardSpec[];
  feedingRequirements: QingmaoResourceRequirementLine[];
  refinementRequirements: QingmaoResourceRequirementLine[];
  fragmentRequirements: QingmaoResourceRequirementLine[];
  gapRequirements: QingmaoResourceRequirementLine[];
  candidate: WorldActionCandidate;
}

export interface QingmaoResourceLoopValidation {
  valid: boolean;
  entry: QingmaoResourceLoopEntry | null;
  blockers: string[];
  warnings: string[];
}

export interface QingmaoResourceLoopResolution {
  success: boolean;
  message: string;
  entry: QingmaoResourceLoopEntry | null;
  validation: QingmaoResourceLoopValidation;
  rewardMaterials: QingmaoResourceMaterialRewardSpec[];
  feedingCredits: Record<string, number>;
  worldActionCandidate: WorldActionCandidate | null;
  worldActionDeparture: WorldActionDeparture | null;
  worldActionResolution: WorldActionResolution | null;
  worldActionLedgerEntry: LocalActionLedgerEntry | null;
  narrativeReturnContext: NarrativeReturnContext | null;
  saveFormatImpact: 'none';
}

const loopSpec = qingmaoResourceLoopRaw as QingmaoResourceLoopSpec;
const RESOURCE_LOOP_SOURCE_PREFIX = 'qingmao_resource_loop';
const DEFAULT_SCENE_ID = 'qingmao_resource_loop_scene';

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(context: QingmaoResourceLoopContext): number {
  return Number(context.turn ?? context.store?.turn ?? 1);
}

function currentSceneId(context: QingmaoResourceLoopContext): string {
  return String(
    context.sceneId
      || context.store?.sceneSessionState?.sceneId
      || context.store?.currentChapterId
      || DEFAULT_SCENE_ID,
  );
}

function currentLocationId(context: QingmaoResourceLoopContext): string {
  return String(
    context.locationId
      || context.store?.sceneSessionState?.locationId
      || context.store?.currentLocationId
      || context.store?.currentDomain
      || 'qingmaoshan',
  );
}

function remainingAp(context: QingmaoResourceLoopContext): number {
  const explicit = Number(context.remainingAp);
  if (Number.isFinite(explicit)) return Math.max(0, explicit);
  const budget = context.store?.sceneSessionState?.actionBudget;
  const budgetAp = Number(budget?.remainingAp ?? budget?.remaining);
  if (Number.isFinite(budgetAp)) return Math.max(0, budgetAp);
  const gameAp = Number(context.store?.gameTime?.ap);
  return Number.isFinite(gameAp) ? Math.max(0, gameAp) : 0;
}

function hasUsedActionInScene(context: QingmaoResourceLoopContext, actionId: string): boolean {
  const sceneId = currentSceneId(context);
  const ledger = Array.isArray(context.store?.sceneSessionState?.localActionLedger)
    ? context.store.sceneSessionState.localActionLedger
    : [];
  return ledger.some((entry: any) => (
    entry?.sceneId === sceneId
    && String(entry?.source || '') === `${RESOURCE_LOOP_SOURCE_PREFIX}:${actionId}`
  ));
}

function materialLine(
  context: QingmaoResourceLoopContext,
  materialName: string,
  required: number,
  source: QingmaoResourceRequirementLine['source'],
  extra: Partial<QingmaoResourceRequirementLine> = {},
): QingmaoResourceRequirementLine {
  const owned = getMaterialTotalQuantity(context.store || {}, materialName);
  const safeRequired = Math.max(0, Math.round(Number(required || 0)));
  return {
    materialName,
    required: safeRequired,
    owned,
    missing: Math.max(0, safeRequired - owned),
    source,
    ...extra,
  };
}

function groupMaterialNames(names: string[]): Record<string, number> {
  return names.reduce<Record<string, number>>((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
}

function feedingLines(action: QingmaoResourceActionSpec, context: QingmaoResourceLoopContext): QingmaoResourceRequirementLine[] {
  const candidates = action.feedingCandidates?.length
    ? action.feedingCandidates
    : action.feedingRequirementType
      ? normalizeFeedCandidates(action.feedingRequirementType)
      : [];
  return candidates.map(name => materialLine(context, name, 1, 'feeding'));
}

function refinementLines(action: QingmaoResourceActionSpec, context: QingmaoResourceLoopContext): QingmaoResourceRequirementLine[] {
  const recipe = getRefineRecipeForGu(action.targetGu);
  if (!recipe) return [];
  return Object.entries(groupMaterialNames(expandMaterialCost(recipe)))
    .map(([name, required]) => materialLine(context, name, required, 'refinement'));
}

function fragmentLines(action: QingmaoResourceActionSpec, context: QingmaoResourceLoopContext): QingmaoResourceRequirementLine[] {
  if (!action.recipeFragmentId) return [];
  const fragment = getRegisteredRecipeForFragment(action.recipeFragmentId);
  if (!fragment) return [];
  return Object.entries(groupMaterialNames(expandMaterialCost(fragment)))
    .map(([name, required]) => materialLine(context, name, required, 'fragment'));
}

function gapLines(action: QingmaoResourceActionSpec, context: QingmaoResourceLoopContext): QingmaoResourceRequirementLine[] {
  return (action.gapRequirements || []).map(item => materialLine(
    context,
    item.materialName,
    item.quantity,
    'gap',
    { sourceStatus: item.sourceStatus, reason: item.reason },
  ));
}

function candidateSummary(action: QingmaoResourceActionSpec): string {
  if (action.mode === 'gap_only') {
    return `${action.targetGu} 只核对食料缺口：${action.notes[0] || '不开放稳定来源。'}`;
  }
  const rewards = (action.materialRewards || [])
    .map(item => `${item.materialName} x${item.quantity}`)
    .join('、');
  return `${action.sourceLabel} 提供低阶炼养用资源：${rewards || '无奖励'}。`;
}

function buildCandidate(
  action: QingmaoResourceActionSpec,
  context: QingmaoResourceLoopContext,
  blockers: string[],
  warnings: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: `qingmao_resource_candidate_${action.id}_${currentTurn(context)}`,
    domain: 'field_action',
    sourceId: action.id,
    title: action.displayName,
    summary: candidateSummary(action),
    source: 'engine',
    sceneId: currentSceneId(context),
    locationId: currentLocationId(context),
    risk: action.risk,
    apCost: Math.max(0, Number(action.apCost || 0)),
    blockers,
    warnings,
    tags: uniqueStrings([
      'v0.10.0-b3',
      'qingmao_resource_loop',
      action.id,
      action.targetGu,
      action.mode,
    ]),
    createdTurn: currentTurn(context),
    metadata: {
      loopVersion: loopSpec._meta.version,
      actionId: action.id,
      targetGu: action.targetGu,
      saveFormatImpact: loopSpec._meta.saveFormatImpact,
      rewardBoundary: loopSpec._meta.rewardBoundary,
    },
  });
}

export function getQingmaoResourceLoopSpec(): QingmaoResourceLoopSpec {
  return loopSpec;
}

export function buildQingmaoResourceLoopEntries(context: QingmaoResourceLoopContext = {}): QingmaoResourceLoopEntry[] {
  const ap = remainingAp(context);
  return loopSpec.actions.map(action => {
    const blockers: string[] = [];
    const warnings = uniqueStrings([
      loopSpec._meta.rewardBoundary,
      loopSpec._meta.deepSeekBoundary,
      action.failureCost,
      ...action.notes,
    ]);

    const rewardPreview = action.materialRewards || [];
    const isGapOnly = action.mode === 'gap_only';
    const alreadyUsed = !isGapOnly && hasUsedActionInScene(context, action.id);
    if (!isGapOnly && ap < action.apCost) blockers.push(`场景 AP 不足：需要 ${action.apCost} 点，当前 ${ap} 点。`);
    if (alreadyUsed) blockers.push('同一场景内该资源入口已经结算过，需要推进剧情或重置场景后再尝试。');
    if (isGapOnly) blockers.push('该入口只显示缺口，不扣 AP，不发放材料。');

    const status: QingmaoResourceLoopEntryStatus = isGapOnly
      ? 'gap_only'
      : alreadyUsed
        ? 'scene_used'
        : ap < action.apCost
          ? 'ap_blocked'
          : blockers.length > 0
            ? 'blocked'
            : 'available';
    const candidate = buildCandidate(action, context, blockers, warnings);

    return {
      id: `qingmao_resource_entry_${action.id}`,
      action,
      status,
      canResolve: status === 'available',
      apCost: action.apCost,
      risk: action.risk,
      blockers: uniqueStrings(blockers),
      warnings,
      rewardPreview,
      feedingRequirements: feedingLines(action, context),
      refinementRequirements: refinementLines(action, context),
      fragmentRequirements: fragmentLines(action, context),
      gapRequirements: gapLines(action, context),
      candidate,
    };
  });
}

export function validateQingmaoResourceLoopAction(
  actionId: string,
  context: QingmaoResourceLoopContext = {},
): QingmaoResourceLoopValidation {
  const entry = buildQingmaoResourceLoopEntries(context).find(item => item.action.id === actionId) || null;
  if (!entry) {
    return {
      valid: false,
      entry: null,
      blockers: [`未知青茅资源入口：${actionId}`],
      warnings: [loopSpec._meta.deepSeekBoundary],
    };
  }
  return {
    valid: entry.canResolve,
    entry,
    blockers: entry.blockers,
    warnings: entry.warnings,
  };
}

function blockedResolution(
  validation: QingmaoResourceLoopValidation,
  context: QingmaoResourceLoopContext,
): QingmaoResourceLoopResolution {
  const entry = validation.entry;
  const candidate = entry?.candidate || null;
  if (!entry || !candidate) {
    return {
      success: false,
      message: validation.blockers.join('；') || '青茅资源入口不可用。',
      entry: null,
      validation,
      rewardMaterials: [],
      feedingCredits: {},
      worldActionCandidate: null,
      worldActionDeparture: null,
      worldActionResolution: null,
      worldActionLedgerEntry: null,
      narrativeReturnContext: null,
      saveFormatImpact: 'none',
    };
  }
  const message = validation.blockers.join('；') || `${entry.action.displayName} 当前不可结算。`;
  const departure = createWorldActionDeparture({
    candidate,
    turn: currentTurn(context),
    mode: 'blocked',
    chargeAp: false,
    summary: message,
    blockers: validation.blockers,
    warnings: validation.warnings,
  });
  const resolution = createWorldActionResolution({
    departure,
    status: 'blocked',
    summary: message,
    localFacts: ['青茅资源小循环入口被本地引擎阻断，未扣 AP，未发放材料、蛊虫或蛊方。'],
    blockedReasons: validation.blockers,
    risks: validation.warnings,
    rewardPolicy: 'none',
    metadata: {
      loopVersion: loopSpec._meta.version,
      actionId: entry.action.id,
      saveFormatImpact: 'none',
    },
  });
  const ledger = {
    ...projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: `${RESOURCE_LOOP_SOURCE_PREFIX}:${entry.action.id}`,
    }),
    actionType: 'resource' as const,
  };
  return {
    success: false,
    message,
    entry,
    validation,
    rewardMaterials: [],
    feedingCredits: {},
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext: buildNarrativeReturnContext({
      sceneId: candidate.sceneId,
      turn: currentTurn(context),
      ledgerEntries: [ledger],
      resolutions: [resolution],
    }),
    saveFormatImpact: 'none',
  };
}

export function resolveQingmaoResourceLoopAction(
  actionId: string,
  context: QingmaoResourceLoopContext = {},
): QingmaoResourceLoopResolution {
  const validation = validateQingmaoResourceLoopAction(actionId, context);
  if (!validation.valid || !validation.entry) return blockedResolution(validation, context);

  const entry = validation.entry;
  const rewardMaterials = entry.rewardPreview
    .map(item => ({ ...item, quantity: Math.max(1, Math.min(2, Math.round(Number(item.quantity || 1)))) }))
    .filter(item => item.quantity > 0);
  const rewardText = rewardMaterials.length > 0
    ? rewardMaterials.map(item => `${item.materialName} x${item.quantity}`).join('、')
    : '无材料';
  const departure = createWorldActionDeparture({
    candidate: entry.candidate,
    turn: currentTurn(context),
    mode: 'local_resolution',
    chargeAp: entry.apCost > 0,
    summary: `${entry.action.displayName} 出发，结算由青茅资源小循环本地引擎负责。`,
  });
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: `${entry.action.displayName} 完成：获得 ${rewardText}。`,
    localFacts: [
      `${entry.action.displayName} 由本地青茅资源小循环结算，奖励为 ${rewardText}。`,
      `${entry.action.targetGu} 相关食料/蛊材只写入既有 materialBag 或 feedingCredits；不新增存档字段。`,
      'DeepSeek 只能承接这些本地事实生成回流文本，不得追加材料、蛊虫、完整蛊方、声望或地点解锁。',
    ],
    risks: entry.warnings,
    rewardPolicy: 'local_engine_only',
    metadata: {
      loopVersion: loopSpec._meta.version,
      actionId: entry.action.id,
      targetGu: entry.action.targetGu,
      rewardMaterials,
      saveFormatImpact: 'none',
      failureCost: entry.action.failureCost,
    },
  });
  const ledger = {
    ...projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: `${RESOURCE_LOOP_SOURCE_PREFIX}:${entry.action.id}`,
    }),
    actionType: 'resource' as const,
  };
  return {
    success: true,
    message: `${entry.action.displayName} 完成：获得 ${rewardText}。`,
    entry,
    validation,
    rewardMaterials,
    feedingCredits: {},
    worldActionCandidate: entry.candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext: buildNarrativeReturnContext({
      sceneId: entry.candidate.sceneId,
      turn: currentTurn(context),
      ledgerEntries: [ledger],
      resolutions: [resolution],
    }),
    saveFormatImpact: 'none',
  };
}

export function formatQingmaoResourceLoopContextForPrompt(context: QingmaoResourceLoopContext = {}): string {
  const entries = buildQingmaoResourceLoopEntries(context);
  const lines = [
    '【v0.10 青茅低阶炼养用资源小循环】',
    loopSpec._meta.rewardBoundary,
    loopSpec._meta.deepSeekBoundary,
    `场景：${currentSceneId(context)}；AP ${remainingAp(context)}。`,
  ];
  for (const entry of entries) {
    const reward = entry.rewardPreview.length > 0
      ? entry.rewardPreview.map(item => `${item.materialName}x${item.quantity}`).join('、')
      : '无奖励';
    lines.push(`- ${entry.action.displayName}：${entry.status}，AP=${entry.apCost}，目标=${entry.action.targetGu}，预览=${reward}`);
    const missing = [
      ...entry.feedingRequirements,
      ...entry.fragmentRequirements,
      ...entry.gapRequirements,
    ].filter(item => item.missing > 0);
    if (missing.length > 0) {
      lines.push(`  缺口：${missing.slice(0, 4).map(item => `${item.materialName}缺${item.missing}`).join('；')}`);
    }
  }
  return lines.join('\n');
}
