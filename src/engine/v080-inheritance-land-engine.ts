import rulesRaw from '../canon/v080-inheritance-land-rules.json';
import type {
  CombatEncounterScale,
  HeavenlyLand,
  InheritanceCandidateInput,
  InheritanceCandidateRecord,
  InheritanceEntryValidation,
  InheritanceLandState,
  InheritanceResolutionStep,
  InheritanceRewardPreview,
  InheritanceSiteKind,
  InheritanceSiteSpec,
  LandClaimAttemptRecord,
  LandClaimTerm,
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
  WorldActionResolutionMode,
} from '../types';
import { createSeededRng, type CombatRng } from './combat-formulas';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';

type InheritanceRules = typeof rulesRaw;

const rules = rulesRaw as InheritanceRules;
const VERSION: InheritanceLandState['version'] = 'v0.8.0-c2.5';
const DEFAULT_RISK: InheritanceCandidateRecord['risk'] = 'medium';
const DEFAULT_SOURCE: InheritanceCandidateRecord['source'] = 'ai-rumor';

export interface InheritanceStageResolution {
  state: InheritanceLandState;
  validation: InheritanceEntryValidation;
  steps: InheritanceResolutionStep[];
}

export type InheritanceWorldActionPhase = 'departure' | 'trial' | 'land_claim';

export interface InheritanceWorldActionBridge {
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
}

export interface InheritanceTrialResolution {
  success: boolean;
  blockedReason?: string;
  state: InheritanceLandState;
  candidate: InheritanceCandidateRecord | null;
  site: InheritanceSiteSpec | null;
  steps: InheritanceResolutionStep[];
  combatCandidate?: {
    title: string;
    summary: string;
    scale: CombatEncounterScale;
    risk: 'low' | 'medium' | 'high';
    source: 'engine';
    sceneId: string;
    enemyHint: string;
  };
  worldActionCandidate?: WorldActionCandidate;
  worldActionDeparture?: WorldActionDeparture;
  worldActionResolution?: WorldActionResolution;
  worldActionLedgerEntry?: LocalActionLedgerEntry;
  narrativeReturnContext?: NarrativeReturnContext;
}

export interface LandClaimEntryValidation extends InheritanceEntryValidation {
  terms: LandClaimTerm[];
}

export interface LandClaimResolution {
  success: boolean;
  blockedReason?: string;
  state: InheritanceLandState;
  candidate: InheritanceCandidateRecord | null;
  site: InheritanceSiteSpec | null;
  attempt: LandClaimAttemptRecord;
  steps: InheritanceResolutionStep[];
  heavenlyLand?: HeavenlyLand;
  worldActionCandidate?: WorldActionCandidate;
  worldActionDeparture?: WorldActionDeparture;
  worldActionResolution?: WorldActionResolution;
  worldActionLedgerEntry?: LocalActionLedgerEntry;
  narrativeReturnContext?: NarrativeReturnContext;
}

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cloneTerms(terms: LandClaimTerm[] | undefined): LandClaimTerm[] {
  return ensureArray(terms).map(term => ({ ...term }));
}

function normalizeReward(reward: InheritanceRewardPreview): InheritanceRewardPreview {
  return {
    kind: reward.kind,
    id: String(reward.id || reward.name || 'unknown_reward'),
    name: String(reward.name || reward.id || '未知奖励'),
    quantity: Number.isFinite(reward.quantity) ? Number(reward.quantity) : undefined,
    registered: reward.kind === 'rumor' ? false : reward.registered === true,
    note: String(reward.note || ''),
  };
}

function normalizeSite(raw: any): InheritanceSiteSpec {
  return {
    siteId: String(raw.siteId),
    title: String(raw.title),
    kind: raw.kind as InheritanceSiteKind,
    anchorId: raw.anchorId ? String(raw.anchorId) : undefined,
    minRealmGrand: Number(raw.minRealmGrand || 1),
    maxRealmGrand: Number.isFinite(raw.maxRealmGrand) ? Number(raw.maxRealmGrand) : undefined,
    entryCostAp: Number(raw.entryCostAp || 0),
    pathTags: ensureArray(raw.pathTags).map(String),
    provenance: raw.provenance || 'original-if',
    summary: String(raw.summary || ''),
    trialLabels: ensureArray(raw.trialLabels).map(String),
    rewardPreview: ensureArray(raw.rewardPreview).map(normalizeReward),
    landClaimTerms: cloneTerms(raw.landClaimTerms),
    combatScale: raw.combatScale as CombatEncounterScale | undefined,
    calamityKinds: ensureArray(raw.calamityKinds).map(String),
    blockedRuntimeClaims: ensureArray(raw.blockedRuntimeClaims).map(String),
  };
}

const sites = ensureArray((rules as any).sites).map(normalizeSite);
const siteById = new Map(sites.map(site => [site.siteId, site]));
const forbiddenRuntimeClaims = [
  ...ensureArray((rules as any)._meta?.forbiddenRuntimeClaims).map(String),
  '十转',
  '永生蛊',
  '真正永生',
  '玩家获得宿命蛊',
  '宿命蛊归属',
  '普通战斗击杀尊者',
  '洞天正式认主',
  '吞并洞天',
  '洞天资源节点',
  'Immortal Gu',
  'Eternal Life Gu',
  'rank ten',
  'true immortality',
  'Fate Gu ownership',
];

export function listInheritanceSiteSpecs(): InheritanceSiteSpec[] {
  return sites.map(site => ({
    ...site,
    rewardPreview: site.rewardPreview.map(reward => ({ ...reward })),
    landClaimTerms: cloneTerms(site.landClaimTerms),
  }));
}

export function getInheritanceSiteSpec(siteId: string): InheritanceSiteSpec | null {
  const site = siteById.get(siteId);
  if (!site) return null;
  return {
    ...site,
    rewardPreview: site.rewardPreview.map(reward => ({ ...reward })),
    landClaimTerms: cloneTerms(site.landClaimTerms),
  };
}

function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function currentTurn(store: any, explicit?: number): number {
  return Number(explicit ?? store?.turn ?? 1);
}

function currentSceneId(store: any, fallback?: string): string {
  return String(
    fallback
      || store?.sceneSessionState?.sceneId
      || store?.currentChapterId
      || store?.flags?.currentSceneId
      || 'current_scene',
  );
}

function currentLocationId(store: any, fallback?: string): string {
  return String(fallback || store?.currentLocationId || store?.currentDomain || store?.sceneSessionState?.locationId || '');
}

function getRealmGrand(store: any): number {
  return Number(store?.profile?.realm?.grand || store?.realm?.grand || 1);
}

function remainingSceneAp(store: any): number {
  const budget = store?.sceneSessionState?.actionBudget;
  if (Number.isFinite(budget?.remainingAp)) return Number(budget.remainingAp);
  if (Number.isFinite(store?.sceneSessionState?.budget?.remainingAp)) return Number(store.sceneSessionState.budget.remainingAp);
  if (Number.isFinite(store?.gameTime?.ap)) return Number(store.gameTime.ap);
  return 0;
}

function normalizeRisk(value: unknown): InheritanceCandidateRecord['risk'] {
  return value === 'low' || value === 'medium' || value === 'high' ? value : DEFAULT_RISK;
}

function normalizeSource(value: unknown): InheritanceCandidateRecord['source'] {
  return value === 'engine' ? 'engine' : DEFAULT_SOURCE;
}

function candidateId(input: InheritanceCandidateInput, site: InheritanceSiteSpec, turn: number): string {
  if (input.id) return String(input.id);
  const base = `${site.siteId}_${String(input.title || site.title).slice(0, 16)}`;
  return `inheritance_${turn}_${Math.abs(hashText(base)).toString(36)}`;
}

function makeStep(
  kind: InheritanceResolutionStep['kind'],
  message: string,
  input: {
    turn?: number;
    siteId?: string;
    candidateId?: string;
    severity?: InheritanceResolutionStep['severity'];
    metadata?: Record<string, unknown>;
    index?: number;
  } = {},
): InheritanceResolutionStep {
  const turn = Number(input.turn || 0);
  return {
    id: `inheritance_${turn}_${kind}_${input.siteId || 'global'}_${input.index ?? Math.abs(hashText(message)).toString(36)}`,
    turn,
    kind,
    siteId: input.siteId,
    candidateId: input.candidateId,
    message,
    severity: input.severity || 'info',
    metadata: input.metadata,
  };
}

function worldActionDomainForSite(site: InheritanceSiteSpec): WorldActionCandidate['domain'] {
  return site.kind === 'blessed_land_claim' ? 'blessed_land' : 'inheritance';
}

function rewardBoundaryFact(site: InheritanceSiteSpec): string {
  const registered = site.rewardPreview
    .filter(reward => reward.registered && reward.kind !== 'rumor')
    .map(reward => reward.name);
  const rumors = site.rewardPreview
    .filter(reward => !reward.registered || reward.kind === 'rumor')
    .map(reward => reward.name);
  const facts = ['传承奖励、资源节点、福地归属和洞天边界只能由本地引擎/canon 决定。'];
  if (registered.length > 0) facts.push(`已登记奖励候选：${registered.join('、')}。`);
  if (rumors.length > 0) facts.push(`传闻或边界项不得直接入库：${rumors.join('、')}。`);
  return facts.join('');
}

export function buildInheritanceWorldActionBridge(input: {
  candidate: InheritanceCandidateRecord;
  site: InheritanceSiteSpec;
  store?: any;
  phase: InheritanceWorldActionPhase;
  summary: string;
  status: WorldActionResolution['status'];
  localFacts?: string[];
  risks?: string[];
  blockedReasons?: string[];
  mode?: WorldActionResolutionMode;
  chargeAp?: boolean;
  rewardPolicy?: WorldActionResolution['rewardPolicy'];
  metadata?: Record<string, unknown>;
}): InheritanceWorldActionBridge {
  const store = input.store || {};
  const turn = currentTurn(store, input.candidate.updatedTurn);
  const domain = worldActionDomainForSite(input.site);
  const candidate = createWorldActionCandidate({
    domain,
    sourceId: input.site.siteId,
    title: input.candidate.title,
    summary: input.candidate.summary || input.site.summary,
    source: input.candidate.source,
    sceneId: currentSceneId(store, input.candidate.sceneId),
    locationId: currentLocationId(store, input.candidate.entryPoint),
    risk: input.candidate.risk,
    apCost: input.site.entryCostAp,
    blockers: input.blockedReasons,
    warnings: uniqueStrings([...input.candidate.warnings, ...ensureArray(input.risks)]),
    tags: ['inheritance_land', input.phase, input.site.kind, ...input.site.pathTags],
    createdTurn: Number(input.candidate.createdTurn || turn),
    metadata: {
      siteId: input.site.siteId,
      candidateId: input.candidate.id,
      siteKind: input.site.kind,
      phase: input.phase,
      anchorId: input.site.anchorId,
      claimIntent: input.candidate.claimIntent,
    },
  });
  const mode = input.mode || (input.status === 'blocked' ? 'blocked' : 'local_resolution');
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode,
    chargeAp: input.chargeAp ?? (input.status !== 'blocked' && input.site.entryCostAp > 0),
    summary: input.summary,
    blockers: input.blockedReasons,
    warnings: input.risks,
    metadata: {
      siteId: input.site.siteId,
      candidateId: input.candidate.id,
      siteKind: input.site.kind,
      phase: input.phase,
    },
  });
  const worldResolution = createWorldActionResolution({
    departure,
    status: input.status,
    summary: input.summary,
    localFacts: input.localFacts,
    risks: input.risks,
    blockedReasons: input.blockedReasons,
    rewardPolicy: input.rewardPolicy || (input.site.kind === 'grotto_heaven_rumor' ? 'rumor_only' : 'local_engine_only'),
    metadata: {
      siteId: input.site.siteId,
      candidateId: input.candidate.id,
      siteKind: input.site.kind,
      phase: input.phase,
      ...input.metadata,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution: worldResolution,
    source: `inheritance:${input.candidate.id}:${input.phase}`,
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

function textForbiddenHits(text: string, site?: InheritanceSiteSpec | null): string[] {
  const lower = String(text || '').toLowerCase();
  const direct = [
    ...forbiddenRuntimeClaims,
    ...ensureArray(site?.blockedRuntimeClaims),
  ].filter(phrase => phrase && (text.includes(phrase) || lower.includes(phrase.toLowerCase())));
  return [...new Set(direct)];
}

function candidateRewardBlockers(input: InheritanceCandidateInput): string[] {
  const rewards = ensureArray((input as any).rewardPreview || (input as any).rewards);
  const blockers: string[] = [];
  for (const reward of rewards) {
    const kind = String(reward?.kind || '').toLowerCase();
    const name = String(reward?.name || reward?.id || '');
    if (kind.includes('immortal') || kind === 'immortal_gu' || name.includes('仙蛊')) {
      blockers.push(`AI候选包含未授权仙蛊奖励：${name || kind}`);
    }
    if (reward?.registered === false && kind !== 'rumor') {
      blockers.push(`AI候选包含未登记奖励：${name || reward?.id || 'unknown'}`);
    }
  }
  return blockers;
}

function candidateFromInput(
  input: InheritanceCandidateInput,
  site: InheritanceSiteSpec,
  store: any,
  status: InheritanceCandidateRecord['status'],
  issues: string[],
  warnings: string[],
): InheritanceCandidateRecord {
  const turn = currentTurn(store);
  return {
    id: candidateId(input, site, turn),
    siteId: site.siteId,
    title: String(input.title || site.title),
    summary: String(input.summary || site.summary),
    kind: site.kind,
    status,
    source: normalizeSource(input.source),
    risk: normalizeRisk(input.risk),
    anchorId: input.anchorId || site.anchorId,
    sceneId: currentSceneId(store, input.sceneId),
    entryPoint: String(input.entryPoint || '剧情线索'),
    claimIntent: Boolean(input.claimIntent || site.kind === 'blessed_land_claim'),
    validationIssues: issues,
    warnings,
    rewardPreview: site.rewardPreview.map(reward => ({ ...reward })),
    landClaimTerms: cloneTerms(site.landClaimTerms),
    createdTurn: turn,
    updatedTurn: turn,
  };
}

function normalizeCandidate(raw: any): InheritanceCandidateRecord | null {
  if (!raw?.siteId) return null;
  const site = getInheritanceSiteSpec(String(raw.siteId));
  if (!site) return null;
  const turn = Number(raw.createdTurn || raw.updatedTurn || 1);
  return {
    id: String(raw.id || `inheritance_${turn}_${site.siteId}`),
    siteId: site.siteId,
    title: String(raw.title || site.title),
    summary: String(raw.summary || site.summary),
    kind: (raw.kind || site.kind) as InheritanceSiteKind,
    status: (raw.status || 'candidate') as InheritanceCandidateRecord['status'],
    source: normalizeSource(raw.source),
    risk: normalizeRisk(raw.risk),
    anchorId: raw.anchorId || site.anchorId,
    sceneId: String(raw.sceneId || 'current_scene'),
    entryPoint: String(raw.entryPoint || '剧情线索'),
    claimIntent: Boolean(raw.claimIntent),
    validationIssues: ensureArray(raw.validationIssues).map(String),
    warnings: ensureArray(raw.warnings).map(String),
    rewardPreview: ensureArray(raw.rewardPreview).length ? ensureArray(raw.rewardPreview).map(normalizeReward) : site.rewardPreview.map(reward => ({ ...reward })),
    landClaimTerms: ensureArray(raw.landClaimTerms).length ? cloneTerms(raw.landClaimTerms) : cloneTerms(site.landClaimTerms),
    createdTurn: Number(raw.createdTurn || turn),
    updatedTurn: Number(raw.updatedTurn || turn),
  };
}

function stepLimit(): number {
  return Number((rules as any).defaults?.resolutionStepLimit || 40);
}

function candidateLimit(): number {
  return Number((rules as any).defaults?.candidateLimit || 24);
}

function limitSteps(steps: InheritanceResolutionStep[]): InheritanceResolutionStep[] {
  return steps.slice(-stepLimit());
}

export function createDefaultInheritanceLandState(): InheritanceLandState {
  return {
    version: VERSION,
    candidates: [],
    claimAttempts: [],
    completedSiteIds: [],
    claimedLandIds: [],
    activeTrial: null,
    blockedRecords: [],
    lastResolutionSteps: [],
  };
}

export function normalizeInheritanceLandState(input?: Partial<InheritanceLandState> | null): InheritanceLandState {
  const base = createDefaultInheritanceLandState();
  const candidates = ensureArray(input?.candidates).map(normalizeCandidate).filter(Boolean) as InheritanceCandidateRecord[];
  const claimAttempts = ensureArray(input?.claimAttempts).map((attempt: any) => ({
    id: String(attempt?.id || `claim_${attempt?.siteId || 'unknown'}_${attempt?.turn || 0}`),
    candidateId: String(attempt?.candidateId || ''),
    siteId: String(attempt?.siteId || ''),
    turn: Number(attempt?.turn || 0),
    outcome: attempt?.outcome === 'success' || attempt?.outcome === 'failure' || attempt?.outcome === 'blocked' ? attempt.outcome : 'blocked',
    approvalDelta: Number(attempt?.approvalDelta || 0),
    roll: Number.isFinite(attempt?.roll) ? Number(attempt.roll) : undefined,
    terms: cloneTerms(attempt?.terms),
    heavenlyLandId: attempt?.heavenlyLandId ? String(attempt.heavenlyLandId) : undefined,
    steps: ensureArray(attempt?.steps),
  }));
  return {
    ...base,
    ...input,
    version: VERSION,
    candidates: candidates.slice(-candidateLimit()),
    claimAttempts: claimAttempts.slice(-30),
    completedSiteIds: [...new Set(ensureArray(input?.completedSiteIds).map(String))],
    claimedLandIds: [...new Set(ensureArray(input?.claimedLandIds).map(String))],
    activeTrial: input?.activeTrial && input.activeTrial.candidateId
      ? {
          candidateId: String(input.activeTrial.candidateId),
          trialIndex: Number(input.activeTrial.trialIndex || 0),
          startedTurn: Number(input.activeTrial.startedTurn || 0),
        }
      : null,
    blockedRecords: limitSteps(ensureArray(input?.blockedRecords)),
    lastResolutionSteps: limitSteps(ensureArray(input?.lastResolutionSteps)),
  };
}

export function evaluateInheritanceEntry(
  input: InheritanceCandidateInput,
  store: any = {},
): InheritanceEntryValidation {
  const site = getInheritanceSiteSpec(input.siteId);
  if (!site) {
    return {
      valid: false,
      site: null,
      candidate: null,
      blockers: [`未知传承 siteId：${input.siteId}`],
      warnings: [],
      downgradedTo: 'rumor',
    };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  const realmGrand = getRealmGrand(store);
  if (realmGrand < site.minRealmGrand) {
    blockers.push(`境界不足：至少需要${site.minRealmGrand}转。`);
  }
  if (site.maxRealmGrand && realmGrand > site.maxRealmGrand) {
    blockers.push(`境界已越过此凡人传承承载范围：最高${site.maxRealmGrand}转。`);
  }
  if (remainingSceneAp(store) < site.entryCostAp) {
    blockers.push(`场景AP不足：需要${site.entryCostAp}点。`);
  }
  const text = `${input.title || ''}\n${input.summary || ''}\n${site.summary}`;
  const forbiddenHits = textForbiddenHits(text, site);
  if (forbiddenHits.length > 0) {
    blockers.push(`触及运行时禁区：${forbiddenHits.slice(0, 4).join('、')}`);
  }
  blockers.push(...candidateRewardBlockers(input));

  if (site.kind === 'canon_side_branch') {
    warnings.push('正史旁支只允许支线争夺、试炼和线索，不改写核心正史结果。');
  }
  if (site.kind === 'grotto_heaven_rumor') {
    warnings.push('洞天在v0.8只作为传闻、禁区边界和后续入口，不开放正式认主。');
  }
  if (site.kind === 'blessed_land_claim' && realmGrand >= 6) {
    warnings.push('待认主福地必须经地灵执念、守护试炼和资源压力结算，不能作为刷奖励按钮。');
  }

  const status: InheritanceCandidateRecord['status'] = site.kind === 'grotto_heaven_rumor'
    ? 'rumor'
    : blockers.length > 0
      ? (forbiddenHits.length > 0 ? 'blocked' : 'rumor')
      : 'candidate';
  const candidate = candidateFromInput(input, site, store, status, blockers, warnings);
  const valid = blockers.length === 0 && site.kind !== 'grotto_heaven_rumor';

  return {
    valid,
    site,
    candidate,
    blockers,
    warnings,
    downgradedTo: valid ? undefined : (site.kind === 'grotto_heaven_rumor' ? 'boundary_rumor' : blockers.length > 0 ? 'blocked' : 'rumor'),
  };
}

export function stageInheritanceCandidate(
  state: Partial<InheritanceLandState> | null | undefined,
  input: InheritanceCandidateInput,
  store: any = {},
): InheritanceStageResolution {
  const current = normalizeInheritanceLandState(state);
  const validation = evaluateInheritanceEntry(input, store);
  const turn = currentTurn(store);
  const steps: InheritanceResolutionStep[] = [];
  if (!validation.candidate || !validation.site) {
    steps.push(makeStep('failure', validation.blockers.join('；') || '传承候选无法登记。', {
      turn,
      severity: 'warning',
      metadata: { input },
    }));
    const next = normalizeInheritanceLandState({
      ...current,
      blockedRecords: limitSteps([...current.blockedRecords, ...steps]),
      lastResolutionSteps: steps,
    });
    return { state: next, validation, steps };
  }

  const candidate = validation.candidate;
  steps.push(makeStep(
    validation.valid ? 'candidate' : candidate.status === 'rumor' ? 'rumor' : 'failure',
    validation.valid
      ? `传承候选已登记：${candidate.title}。`
      : candidate.status === 'rumor'
        ? `传承候选降级为传闻：${candidate.title}。`
        : `传承候选被本地拦截：${candidate.title}。`,
    {
      turn,
      siteId: candidate.siteId,
      candidateId: candidate.id,
      severity: validation.valid ? 'success' : candidate.status === 'rumor' ? 'warning' : 'danger',
      metadata: { blockers: validation.blockers, warnings: validation.warnings, downgradedTo: validation.downgradedTo },
    },
  ));

  const deduped = current.candidates.filter(item => item.id !== candidate.id && item.siteId !== candidate.siteId);
  const nextCandidates = [...deduped, candidate].slice(-candidateLimit());
  const nextBlocked = candidate.status === 'blocked'
    ? limitSteps([...current.blockedRecords, ...steps])
    : current.blockedRecords;
  const next = normalizeInheritanceLandState({
    ...current,
    candidates: nextCandidates,
    blockedRecords: nextBlocked,
    lastResolutionSteps: steps,
  });
  return { state: next, validation, steps };
}

function trialChance(site: InheritanceSiteSpec, store: any): number {
  const defaults = (rules as any).defaults || {};
  const base = site.kind === 'canon_side_branch'
    ? Number(defaults.sideBranchTrialBaseChance || 0.58)
    : site.kind === 'blessed_land_claim'
      ? Number(defaults.blessedLandClaimBaseChance || 0.62)
      : Number(defaults.minorTrialBaseChance || 0.72);
  const realmBonus = Math.max(0, getRealmGrand(store) - site.minRealmGrand) * 0.04;
  const pressure = Number(store?.storyAnchorState?.heavenWillLedger?.rejection || 0) * 0.001;
  return Math.max(0.08, Math.min(0.92, base + realmBonus - pressure));
}

function findCandidate(state: InheritanceLandState, candidateId: string): InheritanceCandidateRecord | null {
  return state.candidates.find(candidate => candidate.id === candidateId || candidate.siteId === candidateId) || null;
}

function updateCandidate(
  state: InheritanceLandState,
  candidateId: string,
  patch: Partial<InheritanceCandidateRecord>,
): InheritanceCandidateRecord[] {
  return state.candidates.map(candidate => candidate.id === candidateId
    ? { ...candidate, ...patch, updatedTurn: Number(patch.updatedTurn ?? candidate.updatedTurn) }
    : candidate);
}

function trialWorldFacts(result: InheritanceTrialResolution, candidate: InheritanceCandidateRecord, site: InheritanceSiteSpec): string[] {
  const facts = result.success
    ? [`传承试炼由本地引擎结算通过：${candidate.title}。`]
    : result.blockedReason
      ? [`传承试炼被本地规则阻断：${result.blockedReason}`]
      : [`传承试炼由本地引擎结算失败：${candidate.title}。`];
  facts.push(rewardBoundaryFact(site));
  if (result.combatCandidate) {
    facts.push(`传承守护战候选已生成：${result.combatCandidate.scale}；胜负仍由战斗引擎结算。`);
  }
  return facts;
}

function attachTrialWorldActionBridge(
  result: InheritanceTrialResolution,
  store: any,
  chargeAp: boolean,
): InheritanceTrialResolution {
  if (!result.candidate || !result.site) return result;
  const status: WorldActionResolution['status'] = result.blockedReason
    && (result.candidate.status === 'blocked' || result.candidate.status === 'rumor' || result.site.kind === 'grotto_heaven_rumor')
    ? 'blocked'
    : result.success
      ? 'resolved'
      : 'failed';
  const bridge = buildInheritanceWorldActionBridge({
    candidate: result.candidate,
    site: result.site,
    store,
    phase: 'trial',
    summary: result.steps.at(-1)?.message || result.blockedReason || `传承试炼结算：${result.candidate.title}`,
    status,
    mode: status === 'blocked' ? 'blocked' : 'local_resolution',
    chargeAp: chargeAp && status !== 'blocked',
    localFacts: trialWorldFacts(result, result.candidate, result.site),
    risks: uniqueStrings([
      ...result.candidate.warnings,
      result.site.kind === 'canon_side_branch' ? '正史旁支不能改写核心原著结果。' : '',
      result.site.kind === 'grotto_heaven_rumor' ? '洞天只作为边界传闻，不开放正式认主。' : '',
      result.combatCandidate ? '传承守护战胜负不得由 DeepSeek 判定。' : '',
    ]),
    blockedReasons: status === 'blocked' ? [result.blockedReason || '传承试炼被阻断。'] : [],
    metadata: {
      stepIds: result.steps.map(step => step.id),
      combatCandidate: result.combatCandidate,
    },
  });
  return { ...result, ...bridge };
}

export function resolveInheritanceTrialAction(input: {
  state?: Partial<InheritanceLandState> | null;
  candidateId: string;
  store?: any;
  seed?: string | number;
  worldActionChargeAp?: boolean;
}): InheritanceTrialResolution {
  const state = normalizeInheritanceLandState(input.state);
  const store = input.store || {};
  const turn = currentTurn(store);
  const candidate = findCandidate(state, input.candidateId);
  const site = candidate ? getInheritanceSiteSpec(candidate.siteId) : null;
  const steps: InheritanceResolutionStep[] = [];

  if (!candidate || !site) {
    const message = '传承试炼失败：候选不存在或规则未登记。';
    steps.push(makeStep('failure', message, { turn, severity: 'warning', candidateId: input.candidateId }));
    return {
      success: false,
      blockedReason: message,
      state: normalizeInheritanceLandState({ ...state, lastResolutionSteps: steps }),
      candidate: null,
      site: null,
      steps,
    };
  }
  if (candidate.status === 'blocked' || candidate.status === 'rumor' || site.kind === 'grotto_heaven_rumor') {
    const message = site.kind === 'grotto_heaven_rumor'
      ? '洞天边界只可记录传闻和禁区压力，不能进入正式试炼。'
      : `候选状态为${candidate.status}，不能进入正式试炼。`;
    steps.push(makeStep(site.kind === 'grotto_heaven_rumor' ? 'rumor' : 'failure', message, {
      turn,
      siteId: site.siteId,
      candidateId: candidate.id,
      severity: 'warning',
    }));
    const result: InheritanceTrialResolution = {
      success: false,
      blockedReason: message,
      state: normalizeInheritanceLandState({ ...state, blockedRecords: [...state.blockedRecords, ...steps], lastResolutionSteps: steps }),
      candidate,
      site,
      steps,
    };
    return attachTrialWorldActionBridge(result, store, false);
  }

  const rng = createSeededRng(input.seed ?? `${turn}:${candidate.id}:inheritance-trial`);
  const chance = trialChance(site, store);
  const roll = rng.next();
  const success = roll <= chance;
  steps.push(makeStep('trial', success ? `传承试炼通过：${candidate.title}。` : `传承试炼失败：${candidate.title}。`, {
    turn,
    siteId: site.siteId,
    candidateId: candidate.id,
    severity: success ? 'success' : 'warning',
    metadata: { chance, roll, trialLabels: site.trialLabels },
  }));

  if (site.combatScale) {
    steps.push(makeStep('combat_hook', `传承守护战已生成战斗入口：${site.combatScale}。`, {
      turn,
      siteId: site.siteId,
      candidateId: candidate.id,
      severity: 'info',
      metadata: { combatScale: site.combatScale },
    }));
  }

  if (success) {
    steps.push(makeStep('reward_preview', `奖励待本地入库校验：${site.rewardPreview.map(item => item.name).join('、') || '线索' }。`, {
      turn,
      siteId: site.siteId,
      candidateId: candidate.id,
      severity: 'success',
      metadata: { rewardPreview: site.rewardPreview },
    }));
    if (site.kind === 'canon_side_branch') {
      steps.push(makeStep('anchor_pressure', '正史旁支完成，只记录局部战果与锚点压力，不改写核心结果。', {
        turn,
        siteId: site.siteId,
        candidateId: candidate.id,
        severity: 'warning',
        metadata: { anchorId: site.anchorId },
      }));
    }
  } else {
    steps.push(makeStep('failure', '失败只产生伤势、因果债或线索断裂压力，不直接扣出未登记奖励。', {
      turn,
      siteId: site.siteId,
      candidateId: candidate.id,
      severity: 'warning',
      metadata: { karmicDebt: Number((rules as any).defaults?.trialFailureKarmicDebt || 4) },
    }));
  }
  steps.push(makeStep('settlement', success ? '传承试炼结算完成，结果将进入本轮行动账本。' : '传承试炼未通过，候选保留为失败记录。', {
    turn,
    siteId: site.siteId,
    candidateId: candidate.id,
    severity: success ? 'success' : 'warning',
  }));

  const next = normalizeInheritanceLandState({
    ...state,
    candidates: updateCandidate(state, candidate.id, {
      status: success ? 'resolved' : 'failed',
      updatedTurn: turn,
      validationIssues: success ? candidate.validationIssues : [...candidate.validationIssues, 'trial_failed'],
    }),
    completedSiteIds: success ? [...new Set([...state.completedSiteIds, site.siteId])] : state.completedSiteIds,
    activeTrial: null,
    lastResolutionSteps: steps,
  });

  const result: InheritanceTrialResolution = {
    success,
    state: next,
    candidate: next.candidates.find(item => item.id === candidate.id) || candidate,
    site,
    steps,
    combatCandidate: site.combatScale
      ? {
          title: `${site.title}守护试炼`,
          summary: `${site.summary}（由传承引擎生成，胜负仍交由战斗引擎结算。）`,
          scale: site.combatScale,
          risk: candidate.risk,
          source: 'engine',
          sceneId: candidate.sceneId,
          enemyHint: site.kind === 'blessed_land_claim' ? '福地守护压力' : '传承守护者',
        }
      : undefined,
  };
  return attachTrialWorldActionBridge(result, store, input.worldActionChargeAp ?? true);
}

export function evaluateLandClaimEntry(
  stateInput: Partial<InheritanceLandState> | null | undefined,
  candidateId: string,
  store: any = {},
  options: { skipApCheck?: boolean } = {},
): LandClaimEntryValidation {
  const state = normalizeInheritanceLandState(stateInput);
  const candidate = findCandidate(state, candidateId);
  const site = candidate ? getInheritanceSiteSpec(candidate.siteId) : null;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!candidate || !site) {
    return {
      valid: false,
      site: null,
      candidate: null,
      blockers: ['待认主福地候选不存在。'],
      warnings,
      terms: [],
      downgradedTo: 'blocked',
    };
  }
  if (site.kind !== 'blessed_land_claim') blockers.push('此候选不是待认主福地，不能执行认主。');
  if (getRealmGrand(store) < 6) blockers.push('认主福地至少需要六转以上。');
  if (!options.skipApCheck && remainingSceneAp(store) < site.entryCostAp) blockers.push(`场景AP不足：需要${site.entryCostAp}点。`);
  if (state.claimedLandIds.includes(site.siteId) || state.claimedLandIds.includes(candidate.id)) {
    blockers.push('此福地已被当前轮回认主记录占用。');
  }
  const terms = cloneTerms(candidate.landClaimTerms.length ? candidate.landClaimTerms : site.landClaimTerms);
  if (terms.length === 0) blockers.push('待认主福地缺少地灵条款，不能直接认主。');
  warnings.push('认主结果将写入福地归属、资源压力、终局证据；洞天仍不开放正式认主。');
  return {
    valid: blockers.length === 0,
    site,
    candidate,
    blockers,
    warnings,
    terms,
    downgradedTo: blockers.length > 0 ? 'blocked' : undefined,
  };
}

function claimChance(store: any): number {
  const defaults = (rules as any).defaults || {};
  const realmBonus = Math.max(0, getRealmGrand(store) - 6) * 0.05;
  const pressure = Number(store?.cultivationState?.ascension?.heavenWillPressure || 0) * 0.0015;
  return Math.max(0.12, Math.min(0.88, Number(defaults.blessedLandClaimBaseChance || 0.62) + realmBonus - pressure));
}

function createClaimedHeavenlyLand(site: InheritanceSiteSpec, candidate: InheritanceCandidateRecord, turn: number): HeavenlyLand {
  return {
    id: `heavenly_land_${site.siteId}_${turn}`,
    type: '福地',
    domain: '南疆',
    name: candidate.title === site.title ? '玉苔待认主福地' : candidate.title,
    areaMu: 360,
    timeFlowRatio: 16,
    resourceOutputRate: 18,
    earthSpirit: {
      formed: true,
      name: '苔灵',
      personality: '守旧谨慎，重视旧主执念与资源节点稳定。',
      approval: 64,
    },
    disasterCountdown: 44,
    nextDisasterType: '资源节点失衡',
    createdAt: turn,
    accessible: true,
  };
}

function landClaimWorldFacts(result: LandClaimResolution, candidate: InheritanceCandidateRecord, site: InheritanceSiteSpec): string[] {
  const facts = result.success
    ? [`福地认主由本地引擎结算成功：${candidate.title}。`]
    : result.blockedReason
      ? [`福地认主被本地规则阻断：${result.blockedReason}`]
      : [`福地认主由本地引擎结算失败：${candidate.title}。`];
  if (result.heavenlyLand) {
    facts.push(`本地已写入福地归属：${result.heavenlyLand.name}（${result.heavenlyLand.id}）。`);
    facts.push(`资源节点、地灵状态与灾劫压力等待后续本地系统承接；DeepSeek 不得直接追加福地收益。`);
  } else {
    facts.push('福地归属未成立；不能绕过地灵条款、守护试炼或 AP 规则强行占有。');
  }
  facts.push('洞天仍为边界传闻，不开放正式认主或吞并。');
  return facts;
}

function attachLandClaimWorldActionBridge(
  result: LandClaimResolution,
  store: any,
  chargeAp: boolean,
): LandClaimResolution {
  if (!result.candidate || !result.site) return result;
  const status: WorldActionResolution['status'] = result.attempt.outcome === 'blocked'
    ? 'blocked'
    : result.success
      ? 'resolved'
      : 'failed';
  const bridge = buildInheritanceWorldActionBridge({
    candidate: result.candidate,
    site: result.site,
    store,
    phase: 'land_claim',
    summary: result.steps.at(-1)?.message || result.blockedReason || `福地认主结算：${result.candidate.title}`,
    status,
    mode: status === 'blocked' ? 'blocked' : 'local_resolution',
    chargeAp: chargeAp && status !== 'blocked',
    localFacts: landClaimWorldFacts(result, result.candidate, result.site),
    risks: uniqueStrings([
      ...result.candidate.warnings,
      '福地归属、资源节点、地灵与灾劫后果不得由 DeepSeek 判定。',
      '洞天正式认主和洞天吞并不在当前版本开放。',
    ]),
    blockedReasons: status === 'blocked' ? [result.blockedReason || '福地认主被阻断。'] : [],
    metadata: {
      attemptId: result.attempt.id,
      outcome: result.attempt.outcome,
      heavenlyLandId: result.heavenlyLand?.id,
      stepIds: result.steps.map(step => step.id),
      terms: result.attempt.terms.map(term => ({ id: term.id, status: term.status, required: term.required })),
    },
  });
  return { ...result, ...bridge };
}

export function resolveLandClaimAttempt(input: {
  state?: Partial<InheritanceLandState> | null;
  candidateId: string;
  store?: any;
  seed?: string | number;
  skipApCheck?: boolean;
  worldActionChargeAp?: boolean;
}): LandClaimResolution {
  const state = normalizeInheritanceLandState(input.state);
  const store = input.store || {};
  const turn = currentTurn(store);
  const validation = evaluateLandClaimEntry(state, input.candidateId, store, { skipApCheck: input.skipApCheck });
  const site = validation.site;
  const candidate = validation.candidate;
  const steps: InheritanceResolutionStep[] = [];
  let heavenlyLand: HeavenlyLand | undefined;

  if (!validation.valid || !candidate || !site) {
    const message = validation.blockers.join('；') || '待认主福地无法结算。';
    steps.push(makeStep('failure', message, {
      turn,
      siteId: site?.siteId,
      candidateId: candidate?.id || input.candidateId,
      severity: 'warning',
      metadata: { blockers: validation.blockers },
    }));
    const attempt: LandClaimAttemptRecord = {
      id: `land_claim_${turn}_${input.candidateId}`,
      candidateId: candidate?.id || input.candidateId,
      siteId: site?.siteId || 'unknown',
      turn,
      outcome: 'blocked',
      approvalDelta: 0,
      terms: validation.terms.map(term => ({ ...term, status: term.required ? 'blocked' : term.status })),
      steps,
    };
    const result: LandClaimResolution = {
      success: false,
      blockedReason: message,
      state: normalizeInheritanceLandState({
        ...state,
        claimAttempts: [...state.claimAttempts, attempt],
        blockedRecords: [...state.blockedRecords, ...steps],
        lastResolutionSteps: steps,
      }),
      candidate,
      site,
      attempt,
      steps,
    };
    return attachLandClaimWorldActionBridge(result, store, false);
  }

  const chance = claimChance(store);
  const rng: CombatRng = createSeededRng(input.seed ?? `${turn}:${candidate.id}:land-claim`);
  const roll = rng.next();
  const success = roll <= chance;
  const terms = validation.terms.map(term => ({
    ...term,
    status: success ? 'satisfied' as const : term.required ? 'failed' as const : term.status,
  }));

  steps.push(makeStep('land_claim', success ? `福地认主成功：${candidate.title}。` : `福地认主失败：${candidate.title}。`, {
    turn,
    siteId: site.siteId,
    candidateId: candidate.id,
    severity: success ? 'success' : 'warning',
    metadata: { chance, roll, terms },
  }));
  if (success) {
    heavenlyLand = createClaimedHeavenlyLand(site, candidate, turn);
    steps.push(makeStep('settlement', '待认主福地已写入福地归属，资源节点与灾劫压力等待后续系统承接。', {
      turn,
      siteId: site.siteId,
      candidateId: candidate.id,
      severity: 'success',
      metadata: { heavenlyLandId: heavenlyLand.id, disasterCountdown: heavenlyLand.disasterCountdown },
    }));
  } else {
    steps.push(makeStep('failure', '地灵认可度下降，候选保留为失败记录；不能绕过条款强行占有福地。', {
      turn,
      siteId: site.siteId,
      candidateId: candidate.id,
      severity: 'warning',
      metadata: { approvalDelta: -Number((rules as any).defaults?.claimFailureEarthSpiritApprovalPenalty || 12) },
    }));
  }

  const attempt: LandClaimAttemptRecord = {
    id: `land_claim_${turn}_${candidate.id}`,
    candidateId: candidate.id,
    siteId: site.siteId,
    turn,
    outcome: success ? 'success' : 'failure',
    approvalDelta: success ? 18 : -Number((rules as any).defaults?.claimFailureEarthSpiritApprovalPenalty || 12),
    roll,
    terms,
    heavenlyLandId: heavenlyLand?.id,
    steps,
  };
  const next = normalizeInheritanceLandState({
    ...state,
    candidates: updateCandidate(state, candidate.id, {
      status: success ? 'resolved' : 'failed',
      landClaimTerms: terms,
      updatedTurn: turn,
    }),
    claimAttempts: [...state.claimAttempts, attempt],
    completedSiteIds: success ? [...new Set([...state.completedSiteIds, site.siteId])] : state.completedSiteIds,
    claimedLandIds: success ? [...new Set([...state.claimedLandIds, site.siteId, candidate.id, heavenlyLand!.id])] : state.claimedLandIds,
    lastResolutionSteps: steps,
  });

  const result: LandClaimResolution = {
    success,
    state: next,
    candidate: next.candidates.find(item => item.id === candidate.id) || candidate,
    site,
    attempt,
    steps,
    heavenlyLand,
  };
  return attachLandClaimWorldActionBridge(result, store, input.worldActionChargeAp ?? true);
}

function siteKindLabel(kind: InheritanceSiteKind): string {
  switch (kind) {
    case 'minor_cave': return '小传承';
    case 'canon_side_branch': return '正史旁支传承';
    case 'blessed_land_claim': return '待认主福地';
    case 'grotto_heaven_rumor': return '洞天边界传闻';
    default: return String(kind);
  }
}

export function formatInheritanceContextForPrompt(stateInput?: Partial<InheritanceLandState> | null): string {
  const state = normalizeInheritanceLandState(stateInput);
  const candidates = state.candidates.slice(-6);
  const lines = [
    '【v0.8传承/福地协议】',
    'DeepSeek只能提出 inheritance_land_candidates.add 线索、候选、地灵条件、洞天传闻；奖励、认主、资源节点、归属全部由本地引擎结算。',
    '禁止直接写十转、永生蛊、真正永生、玩家获得宿命蛊、洞天正式认主、普通战斗击杀尊者。',
  ];
  if (candidates.length === 0) {
    lines.push('当前没有已登记传承候选。可在合适剧情中提出小传承洞府、三王旁支、待认主福地或洞天边界传闻。');
  } else {
    lines.push('当前候选：');
    for (const candidate of candidates) {
      const issues = candidate.validationIssues.length ? `；限制：${candidate.validationIssues.slice(0, 2).join('、')}` : '';
      lines.push(`- ${candidate.title}（${siteKindLabel(candidate.kind)}，${candidate.status}，风险${candidate.risk}${issues}）`);
    }
  }
  const last = state.lastResolutionSteps.at(-1);
  if (last) lines.push(`最近本地结算：${last.message}`);
  return lines.join('\n');
}
