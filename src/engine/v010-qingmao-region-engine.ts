import qingmaoRegionBoardRaw from '../canon/qingmao-region-board.json';
import type {
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionDomain,
  WorldActionRisk,
  WorldActionResolution,
  WorldActionSource,
} from '../types';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import {
  createDefaultTrainingGroundState,
  resolveTrainingGroundAction as resolveTrainingGroundActionEngine,
  stageTrainingGroundCandidate,
  type TrainingGroundActionResolution,
} from './v090-training-ground-clue-engine';
import {
  buildFieldActionWorldActionBridge,
  resolveFieldAction,
  type FieldActionResult,
  type FieldActionWorldActionBridge,
} from './field-action';

export type QingmaoRegionActionEntryStatus =
  | 'available'
  | 'blocked'
  | 'identity_blocked'
  | 'ap_blocked'
  | 'persistent_state_blocked'
  | 'rumor_only';

export interface QingmaoRegionIdentityScope {
  startProfileId: string;
  originProfileId: string;
  factionId: string;
  role: string;
  provenance: 'canon-near' | 'derived' | 'original';
  identityBoundary: string;
  startingAccess: string[];
}

export interface QingmaoRegionClueSource {
  id: string;
  displayName: string;
  sourceType: 'faction' | 'location' | 'rumor';
  allowedRoles: string[];
  worldActionSource: WorldActionSource;
  allowedDomains: WorldActionDomain[];
  aiAuthority: 'candidate_only' | 'rumor_only';
  localGate: string;
}

export interface QingmaoRegionActionSlot {
  id: string;
  displayName: string;
  targetPhase: string;
  worldActionDomain: WorldActionDomain;
  localOwner: string;
  requiresPersistentState: boolean;
  notes: string;
}

export interface QingmaoRegionBoard {
  version: string;
  regionId: string;
  displayName: string;
  status: string;
  canonMode: 'canon-near+if';
  identityScope: QingmaoRegionIdentityScope[];
  clueSources: QingmaoRegionClueSource[];
  actionSlots: QingmaoRegionActionSlot[];
  deepSeekBoundary: string[];
  loreBoundaries: string[];
}

export interface QingmaoRegionContext {
  startProfileId?: string | null;
  factionId?: string | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  currentLocationName?: string | null;
  remainingAp?: number | null;
  includePersistentPreview?: boolean;
  store?: any;
}

export interface QingmaoRegionResolvedIdentity {
  scope: QingmaoRegionIdentityScope;
  issues: string[];
}

export interface QingmaoRegionSourceEntry {
  source: QingmaoRegionClueSource;
  identity: QingmaoRegionIdentityScope;
  status: 'available' | 'blocked';
  blockers: string[];
  warnings: string[];
}

export interface QingmaoRegionActionEntry {
  id: string;
  source: QingmaoRegionClueSource;
  actionSlot: QingmaoRegionActionSlot;
  identity: QingmaoRegionIdentityScope;
  status: QingmaoRegionActionEntryStatus;
  canDepart: boolean;
  apCost: number;
  risk: WorldActionRisk;
  blockers: string[];
  warnings: string[];
  candidate: WorldActionCandidate;
}

export interface QingmaoRegionCandidateInput {
  sourceId: string;
  actionSlotId: string;
  title?: string;
  summary?: string;
  risk?: WorldActionRisk;
  apCost?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface QingmaoRegionCandidateValidation {
  valid: boolean;
  entry: QingmaoRegionActionEntry | null;
  candidate: WorldActionCandidate | null;
  blockers: string[];
  warnings: string[];
}

export interface QingmaoRegionActionInput extends QingmaoRegionCandidateInput {
  seed?: string | number;
}

export interface QingmaoRegionActionResolution {
  success: boolean;
  message: string;
  entry: QingmaoRegionActionEntry | null;
  validation: QingmaoRegionCandidateValidation;
  worldActionCandidate: WorldActionCandidate | null;
  worldActionDeparture: WorldActionDeparture | null;
  worldActionResolution: WorldActionResolution | null;
  worldActionLedgerEntry: LocalActionLedgerEntry | null;
  narrativeReturnContext: NarrativeReturnContext | null;
  trainingGround?: TrainingGroundActionResolution;
  fieldAction?: FieldActionResult;
  fieldBridge?: FieldActionWorldActionBridge;
  nextTrainingGroundState?: unknown;
  saveFormatImpact: 'none' | 'requires_persistent_region_state';
}

const board = qingmaoRegionBoardRaw as QingmaoRegionBoard;
const DEFAULT_AP_COST = 1;
const FORBIDDEN_RUNTIME_TERMS = [
  '仙蛊',
  '十转',
  '永生蛊',
  '真正永生',
  '宿命蛊归属',
  '宝黄天交易',
  '凡人宝黄天',
  '洞天认主',
  'Immortal Gu',
  'rank ten',
  'Eternal Life Gu',
  'Fate Gu ownership',
];
const GU_YUE_IDENTITY_CLAIMS = [
  '古月族人',
  '古月族学弟子',
  '古月山寨族学弟子',
  '继承方源',
  '继承方正',
];

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(context: QingmaoRegionContext): number {
  return Number(context.turn || context.store?.turn || 1);
}

function currentSceneId(context: QingmaoRegionContext): string {
  return String(
    context.sceneId
      || context.store?.sceneSessionState?.sceneId
      || context.store?.currentChapterId
      || context.store?.flags?.currentSceneId
      || 'qingmao_region_scene',
  );
}

function currentLocationId(context: QingmaoRegionContext): string {
  return String(
    context.locationId
      || context.store?.currentLocationId
      || context.store?.sceneSessionState?.locationId
      || context.store?.currentDomain
      || 'qingmao_region',
  );
}

function remainingAp(context: QingmaoRegionContext): number {
  const explicit = Number(context.remainingAp);
  if (Number.isFinite(explicit)) return explicit;
  const budget = context.store?.sceneSessionState?.actionBudget;
  if (Number.isFinite(Number(budget?.remainingAp))) return Number(budget.remainingAp);
  if (Number.isFinite(Number(budget?.remaining))) return Number(budget.remaining);
  if (Number.isFinite(Number(context.store?.gameTime?.ap))) return Number(context.store.gameTime.ap);
  return DEFAULT_AP_COST;
}

function contextStartProfileId(context: QingmaoRegionContext): string {
  return String(
    context.startProfileId
      || context.store?.flags?._start_profile
      || context.store?.selectedStartProfileId
      || context.store?.startProfileId
      || context.store?.profile?.startProfileId
      || '',
  );
}

function contextFactionId(context: QingmaoRegionContext): string {
  return String(
    context.factionId
      || context.store?.flags?._faction_id
      || context.store?.selectedFactionId
      || context.store?.factionId
      || '',
  );
}

function normalizeRisk(value?: WorldActionRisk): WorldActionRisk {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

function defaultRiskForSlot(slot: QingmaoRegionActionSlot, source: QingmaoRegionClueSource): WorldActionRisk {
  if (slot.worldActionDomain === 'combat') return 'high';
  if (source.aiAuthority === 'rumor_only') return 'medium';
  if (slot.worldActionDomain === 'field_action') return 'medium';
  return 'low';
}

function defaultTitle(source: QingmaoRegionClueSource, slot: QingmaoRegionActionSlot): string {
  return `${source.displayName}：${slot.displayName}`;
}

function defaultSummary(identity: QingmaoRegionIdentityScope, source: QingmaoRegionClueSource, slot: QingmaoRegionActionSlot): string {
  return `${identity.role} 可收到 ${source.displayName}，形成 ${slot.displayName} 的本地行动候选。`;
}

function forbiddenHits(text: string): string[] {
  return FORBIDDEN_RUNTIME_TERMS.filter(term => text.toLowerCase().includes(term.toLowerCase()));
}

function identityOverreachHits(text: string, identity: QingmaoRegionIdentityScope): string[] {
  if (identity.role === 'guyue_clan_member') return [];
  return GU_YUE_IDENTITY_CLAIMS.filter(term => text.includes(term));
}

function trainingGroundSourceFor(source?: WorldActionSource): 'ai-rumor' | 'engine' | 'player_choice' | 'location' | 'faction' | 'inheritance' | 'blessed_land' {
  return source === 'engine'
    || source === 'player_choice'
    || source === 'location'
    || source === 'faction'
    || source === 'inheritance'
    || source === 'blessed_land'
    || source === 'ai-rumor'
    ? source
    : 'faction';
}

export function getQingmaoRegionBoard(): QingmaoRegionBoard {
  return board;
}

export function resolveQingmaoRegionIdentity(context: QingmaoRegionContext = {}): QingmaoRegionResolvedIdentity {
  const issues: string[] = [];
  const startProfileId = contextStartProfileId(context);
  const factionId = contextFactionId(context);
  let scope = board.identityScope.find(item => item.startProfileId === startProfileId);
  if (!scope && factionId) {
    scope = board.identityScope.find(item => item.factionId === factionId);
    if (scope) issues.push(`未找到 startProfileId=${startProfileId || 'unknown'}，已按 factionId=${factionId} 回退。`);
  }
  if (!scope) {
    scope = board.identityScope.find(item => item.startProfileId === 'start_qingmaoshan_sanxiu') || board.identityScope[0];
    issues.push(`未找到青茅起点身份，已按散修/外来身份降级。`);
  }
  return { scope, issues };
}

export function listQingmaoRegionSourceEntries(context: QingmaoRegionContext = {}): QingmaoRegionSourceEntry[] {
  const { scope, issues } = resolveQingmaoRegionIdentity(context);
  return board.clueSources.map(source => {
    const allowed = source.allowedRoles.includes(scope.role);
    return {
      source,
      identity: scope,
      status: allowed ? 'available' : 'blocked',
      blockers: allowed ? [] : [`当前身份 ${scope.role} 不能直接接收 ${source.displayName}。`],
      warnings: uniqueStrings([
        ...issues,
        source.aiAuthority === 'rumor_only' ? '该来源只能作为传闻，不能直接变成正式奖励、任务或原著事实。' : '',
        source.localGate,
      ]),
    };
  });
}

export function buildQingmaoRegionActionEntries(context: QingmaoRegionContext = {}): QingmaoRegionActionEntry[] {
  const sourceEntries = listQingmaoRegionSourceEntries(context);
  const ap = remainingAp(context);
  const turn = currentTurn(context);
  const sceneId = currentSceneId(context);
  const locationId = currentLocationId(context);
  const entries: QingmaoRegionActionEntry[] = [];

  for (const sourceEntry of sourceEntries) {
    if (sourceEntry.status === 'blocked') continue;
    for (const slot of board.actionSlots) {
      if (!sourceEntry.source.allowedDomains.includes(slot.worldActionDomain)) continue;
      const blockers = [...sourceEntry.blockers];
      const warnings = [...sourceEntry.warnings];
      const apCost = DEFAULT_AP_COST;
      if (ap < apCost) blockers.push(`场景 AP 不足：需要 ${apCost} 点，当前 ${ap} 点。`);
      if (slot.requiresPersistentState && !context.includePersistentPreview) {
        blockers.push(`行动槽 ${slot.displayName} 需要持久化区域状态；v0.10.0-a2 暂不开放正式出发。`);
      }
      const risk = defaultRiskForSlot(slot, sourceEntry.source);
      const status: QingmaoRegionActionEntryStatus = ap < apCost
        ? 'ap_blocked'
        : slot.requiresPersistentState && !context.includePersistentPreview
          ? 'persistent_state_blocked'
          : sourceEntry.source.aiAuthority === 'rumor_only'
            ? 'rumor_only'
            : 'available';
      const title = defaultTitle(sourceEntry.source, slot);
      const summary = defaultSummary(sourceEntry.identity, sourceEntry.source, slot);
      const candidate = createWorldActionCandidate({
        domain: slot.worldActionDomain,
        sourceId: sourceEntry.source.id,
        title,
        summary,
        source: sourceEntry.source.worldActionSource,
        sceneId,
        locationId,
        risk,
        apCost,
        blockers,
        warnings,
        tags: uniqueStrings([
          'v0.10.0-a2',
          'qingmao_region',
          sourceEntry.source.id,
          slot.id,
          sourceEntry.identity.role,
        ]),
        createdTurn: turn,
        metadata: {
          regionId: board.regionId,
          identityRole: sourceEntry.identity.role,
          startProfileId: sourceEntry.identity.startProfileId,
          originProfileId: sourceEntry.identity.originProfileId,
          actionSlotId: slot.id,
          sourceAuthority: sourceEntry.source.aiAuthority,
          requiresPersistentState: slot.requiresPersistentState,
        },
      });
      entries.push({
        id: `qingmao_entry_${sourceEntry.source.id}_${slot.id}`,
        source: sourceEntry.source,
        actionSlot: slot,
        identity: sourceEntry.identity,
        status,
        canDepart: blockers.length === 0 && sourceEntry.source.aiAuthority !== 'rumor_only',
        apCost,
        risk,
        blockers: uniqueStrings(blockers),
        warnings: uniqueStrings(warnings),
        candidate,
      });
    }
  }

  return entries;
}

export function validateQingmaoRegionCandidate(
  input: QingmaoRegionCandidateInput,
  context: QingmaoRegionContext = {},
): QingmaoRegionCandidateValidation {
  const entries = buildQingmaoRegionActionEntries({
    ...context,
    includePersistentPreview: context.includePersistentPreview ?? true,
  });
  const entry = entries.find(item => item.source.id === input.sourceId && item.actionSlot.id === input.actionSlotId) || null;
  if (!entry) {
    return {
      valid: false,
      entry: null,
      candidate: null,
      blockers: [`未知或不匹配的青茅线索来源/行动槽: ${input.sourceId} -> ${input.actionSlotId}`],
      warnings: [],
    };
  }

  const text = `${input.title || ''}\n${input.summary || ''}`;
  const blockers = [...entry.blockers];
  const forbidden = forbiddenHits(text);
  if (forbidden.length > 0) blockers.push(`触及世界观/运行时禁区: ${forbidden.slice(0, 4).join('、')}`);
  const identityHits = identityOverreachHits(text, entry.identity);
  if (identityHits.length > 0) blockers.push(`身份越界: ${identityHits.slice(0, 4).join('、')}`);
  if (entry.source.aiAuthority === 'rumor_only' && entry.actionSlot.worldActionDomain !== 'field_action') {
    blockers.push('传闻来源不能直接生成正式委托或原著事实。');
  }

  const candidate = createWorldActionCandidate({
    domain: entry.actionSlot.worldActionDomain,
    sourceId: entry.source.id,
    title: String(input.title || entry.candidate.title),
    summary: String(input.summary || entry.candidate.summary),
    source: entry.source.worldActionSource,
    sceneId: currentSceneId(context),
    locationId: currentLocationId(context),
    risk: normalizeRisk(input.risk || entry.risk),
    apCost: Number.isFinite(Number(input.apCost)) ? Math.max(0, Math.round(Number(input.apCost))) : entry.apCost,
    blockers,
    warnings: entry.warnings,
    tags: uniqueStrings([
      ...entry.candidate.tags,
      ...(input.tags || []),
    ]),
    createdTurn: currentTurn(context),
    metadata: {
      ...entry.candidate.metadata,
      ...input.metadata,
      validation: 'v0.10.0-a2',
    },
  });

  return {
    valid: blockers.length === 0 && entry.canDepart,
    entry,
    candidate,
    blockers: uniqueStrings(blockers),
    warnings: entry.warnings,
  };
}

export function formatQingmaoRegionContextForPrompt(context: QingmaoRegionContext = {}): string {
  const { scope, issues } = resolveQingmaoRegionIdentity(context);
  const entries = buildQingmaoRegionActionEntries(context).filter(entry => entry.status !== 'identity_blocked');
  const lines = [
    '【v0.10 青茅山三寨区域线索池】',
    `当前身份：${scope.role}；起点=${scope.startProfileId}；出身=${scope.originProfileId}。`,
    `身份边界：${scope.identityBoundary}`,
    'DeepSeek 只能提出候选线索、传闻、压力提示和回流文本；正式行动、AP、奖励、地点、战斗结果和关系变化由本地系统决定。',
  ];
  if (issues.length > 0) lines.push(`身份解析提示：${issues.join('；')}`);
  if (entries.length === 0) {
    lines.push('当前没有可展示的青茅区域线索来源。');
  } else {
    lines.push('当前可承接的线索/行动入口：');
    for (const entry of entries) {
      const statusText = entry.canDepart ? '可候选' : `受限:${entry.status}`;
      lines.push(`- ${entry.source.displayName} -> ${entry.actionSlot.displayName}，${statusText}，风险=${entry.risk}，AP=${entry.apCost}`);
      if (entry.blockers.length > 0) lines.push(`  阻断：${entry.blockers.join('；')}`);
    }
  }
  return lines.join('\n');
}

function actionStore(context: QingmaoRegionContext): any {
  const store = context.store || {};
  return {
    turn: currentTurn(context),
    currentChapterId: store.currentChapterId || 'qingmaoshan',
    currentDomain: store.currentDomain || '南疆',
    currentLocationId: currentLocationId(context),
    sceneSessionState: {
      ...(store.sceneSessionState || {}),
      sceneId: currentSceneId(context),
      actionBudget: store.sceneSessionState?.actionBudget || {
        remaining: remainingAp(context),
        remainingAp: remainingAp(context),
        max: 3,
        maxAp: 3,
        spent: 0,
        spentAp: 0,
      },
      localActionLedger: store.sceneSessionState?.localActionLedger || [],
    },
    profile: store.profile || { realm: { grand: 1, sub: '初阶', label: '一转初阶' } },
    attributes: store.attributes || { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
    pathBuild: store.pathBuild || { primary: '炼道', secondary: [], dao_marks: {} },
    currency: Number(store.currency ?? 500),
    immortalCurrency: Number(store.immortalCurrency ?? 0),
    flags: store.flags || {},
    materialBag: store.materialBag || {},
    materialBagCapacity: store.materialBagCapacity,
    ...store,
  };
}

function blockedActionResolution(
  validation: QingmaoRegionCandidateValidation,
  context: QingmaoRegionContext,
  message: string,
  saveFormatImpact: QingmaoRegionActionResolution['saveFormatImpact'] = 'none',
): QingmaoRegionActionResolution {
  const candidate = validation.candidate || validation.entry?.candidate || null;
  if (!candidate) {
    return {
      success: false,
      message,
      entry: validation.entry,
      validation,
      worldActionCandidate: null,
      worldActionDeparture: null,
      worldActionResolution: null,
      worldActionLedgerEntry: null,
      narrativeReturnContext: null,
      saveFormatImpact,
    };
  }
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
    localFacts: ['本地青茅区域引擎阻断了该行动，未扣除 AP，未写入正式奖励或世界观事实。'],
    blockedReasons: validation.blockers,
    risks: validation.warnings,
    rewardPolicy: 'none',
    metadata: {
      regionId: board.regionId,
      validation: 'v0.10.0-b1-blocked',
      saveFormatImpact,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: `qingmao_region:${validation.entry?.actionSlot.id || 'blocked'}`,
  });
  const narrativeReturnContext = buildNarrativeReturnContext({
    sceneId: candidate.sceneId,
    turn: currentTurn(context),
    ledgerEntries: [ledger],
    resolutions: [resolution],
  });
  return {
    success: false,
    message,
    entry: validation.entry,
    validation,
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    saveFormatImpact,
  };
}

function resolveQingmaoClanSchoolTraining(
  validation: QingmaoRegionCandidateValidation,
  context: QingmaoRegionContext,
  seed?: string | number,
): QingmaoRegionActionResolution {
  const store = actionStore(context);
  const state = store.trainingGroundState || createDefaultTrainingGroundState();
  const staged = stageTrainingGroundCandidate(state, {
    id: `qingmao_b1_clan_school_${validation.entry?.identity.role || 'unknown'}_${currentTurn(context)}`,
    groundId: 'tg_nanjiang_refine',
    title: validation.candidate?.title || '青茅山族学炼蛊台竹牌',
    summary: validation.candidate?.summary || '族学告示引向青茅山炼蛊台。该线索只允许本地道场引擎结算。',
    source: trainingGroundSourceFor(validation.entry?.source.worldActionSource),
    locationHint: '青茅山族学与炼蛊台',
    risk: validation.candidate?.risk || 'low',
    apCostHint: validation.candidate?.apCost || DEFAULT_AP_COST,
    sceneTags: ['v0.10.0-b1', 'qingmao_clan_school', validation.entry?.identity.role || 'unknown'],
  }, store);
  const storeWithStaged = { ...store, trainingGroundState: staged.state };
  const training = resolveTrainingGroundActionEngine(
    staged.state,
    'tg_nanjiang_refine',
    storeWithStaged,
    seed ?? `${currentTurn(context)}:qingmao:clan_school_training`,
  );
  return {
    success: training.success,
    message: training.message,
    entry: validation.entry,
    validation,
    worldActionCandidate: training.worldActionCandidate || validation.candidate,
    worldActionDeparture: training.worldActionDeparture || null,
    worldActionResolution: training.worldActionResolution || null,
    worldActionLedgerEntry: training.worldActionLedgerEntry || null,
    narrativeReturnContext: training.narrativeReturnContext || null,
    trainingGround: training,
    nextTrainingGroundState: training.state,
    saveFormatImpact: 'none',
  };
}

function resolveQingmaoMountainPatrol(
  validation: QingmaoRegionCandidateValidation,
  context: QingmaoRegionContext,
  seed?: string | number,
): QingmaoRegionActionResolution {
  const store = actionStore(context);
  const fieldAction = resolveFieldAction({
    kind: 'scout',
    realmGrand: Number(store.profile?.realm?.grand || 1),
    aptitude: Number(store.attributes?.资质 ?? 5),
    mind: Number(store.attributes?.心智 ?? 5),
    luck: Number(store.attributes?.气运 ?? 5),
    turn: currentTurn(context),
    locationType: 'field',
    store,
    seed: Number.isFinite(Number(seed)) ? Number(seed) : undefined,
  });
  const bridge = buildFieldActionWorldActionBridge({
    result: fieldAction,
    store,
    locationType: 'field',
    summary: validation.candidate?.summary || `青茅山山道巡查：${fieldAction.message}`,
    status: fieldAction.success ? 'resolved' : 'failed',
    localFacts: [
      `青茅山山道巡查由本地 field-action 引擎结算：${fieldAction.success ? '成功' : '失败'}。`,
      `本次只产出巡查事实、风险提示或本地辅助标记；不直接解锁正式地点、蛊虫、仙材或奖励。`,
    ],
    risks: [
      validation.entry?.identity.identityBoundary || '',
      '山道巡查只能形成候选线索或风险提示；战斗、材料和关系变化等待后续本地系统。',
    ],
    metadata: {
      regionId: board.regionId,
      actionSlotId: validation.entry?.actionSlot.id,
      identityRole: validation.entry?.identity.role,
      validation: 'v0.10.0-b1-mountain-patrol',
    },
  });
  return {
    success: fieldAction.success,
    message: fieldAction.message,
    entry: validation.entry,
    validation,
    worldActionCandidate: bridge.worldActionCandidate,
    worldActionDeparture: bridge.worldActionDeparture,
    worldActionResolution: bridge.worldActionResolution,
    worldActionLedgerEntry: bridge.worldActionLedgerEntry,
    narrativeReturnContext: bridge.narrativeReturnContext,
    fieldAction,
    fieldBridge: bridge,
    saveFormatImpact: 'none',
  };
}

export function resolveQingmaoRegionAction(
  input: QingmaoRegionActionInput,
  context: QingmaoRegionContext = {},
): QingmaoRegionActionResolution {
  const validation = validateQingmaoRegionCandidate(input, context);
  if (validation.entry?.actionSlot.requiresPersistentState) {
    const slot = validation.entry.actionSlot;
    return blockedActionResolution(
      {
        ...validation,
        valid: false,
        blockers: uniqueStrings([
          ...validation.blockers,
          `${slot.displayName} 需要更完整的青茅区域状态机；当前只开放最小活世界账本，不开放正式出发。`,
        ]),
      },
      context,
      `${slot.displayName} 暂缓：需要持久化区域状态。`,
      'requires_persistent_region_state',
    );
  }

  if (!validation.valid || !validation.entry) {
    return blockedActionResolution(
      validation,
      context,
      validation.blockers.join('；') || '青茅区域行动候选未通过本地验证。',
    );
  }

  const slot = validation.entry.actionSlot;
  if (slot.id === 'clan_school_training') {
    return resolveQingmaoClanSchoolTraining(validation, context, input.seed);
  }
  if (slot.id === 'mountain_patrol') {
    return resolveQingmaoMountainPatrol(validation, context, input.seed);
  }

  return blockedActionResolution(
    {
      ...validation,
      valid: false,
      blockers: uniqueStrings([...validation.blockers, `行动槽 ${slot.id} 尚未接入 b1 本地闭环。`]),
    },
    context,
    `行动槽 ${slot.displayName} 尚未接入。`,
  );
}
