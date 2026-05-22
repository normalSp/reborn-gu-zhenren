import rulesRaw from '../canon/v200-regional-event-ledger-rules.json';
import {
  buildV170RegionalLifeProjection,
  type V170RegionalLifePressureCard,
  type V170RegionalLifePressureId,
  type V170RegionalLifeProjectionInput,
} from './v170-regional-life-projection';
import type {
  LocalActionLedgerEntry,
  RegionalEventLedger,
  RegionalEventLedgerAuthority,
  RegionalEventLedgerStatus,
  RegionalEventRegionKey,
  RegionalEventStatus,
  RegionalPendingFollowUp,
  RegionalPressureLevel,
  RegionalPublicEvent,
  RegionalPublicEventKind,
} from '../types';

export const V200_REGIONAL_EVENT_LEDGER_ACTION_ID = 'v200_worldcore_regional_event_ledger_sync' as const;

const SCHEMA_VERSION = 1 as const;
const ACTIVE_REGION_KEY: RegionalEventRegionKey = 'southern_border_outer_edge_low_rank';
const MAX_PUBLIC_EVENTS = 40;
const MAX_PENDING_FOLLOWUPS = 40;

interface V200PressureRule {
  pressureId: V170RegionalLifePressureId;
  eventKind: RegionalPublicEventKind;
  summaryKey: string;
  pressureTags: string[];
  forbiddenOutcomes: string[];
}

interface V200RegionalEventLedgerRulesFile {
  sourceReview: {
    version: string;
    intakeBaseline: string;
    sourcePolicy: string;
    runtimePolicy: string;
  };
  allowlist: {
    activeRegionKeys: RegionalEventRegionKey[];
    statuses: RegionalEventLedgerStatus[];
    authorities: RegionalEventLedgerAuthority[];
    eventKinds: RegionalPublicEventKind[];
    eventStatuses: RegionalEventStatus[];
    pressureLevels: RegionalPressureLevel[];
  };
  pressureDeck: V200PressureRule[];
  boundaries: {
    forbiddenWrites: string[];
    visibleBoundaryLines: string[];
    hiddenRefPolicies: string[];
  };
}

export interface V200RegionalEventEnvelope {
  envelopeId: string;
  sourceFamily: 'route' | 'identity' | 'survival' | 'social' | 'conflict' | 'public_observation';
  pressureId: V170RegionalLifePressureId;
  eventKind: RegionalPublicEventKind;
  sourcePointers: string[];
  visiblePressure: string;
  entryPreconditions: string[];
  candidateNextSteps: string[];
  forbiddenOutcomes: string[];
  matrixRefs: string[];
  v2PromotionGate: 'worldcore_ledger_only';
}

export interface V200WorldCoreLedgerResolution {
  success: boolean;
  actionId: typeof V200_REGIONAL_EVENT_LEDGER_ACTION_ID;
  message: string;
  regionalEventLedger: RegionalEventLedger;
  envelopes: V200RegionalEventEnvelope[];
  applied: string[];
  rejected: string[];
  forbiddenUpgrades: string[];
  boundaryLines: string[];
}

const rulesFile = rulesRaw as V200RegionalEventLedgerRulesFile;
const REGION_KEYS = new Set<RegionalEventRegionKey>(rulesFile.allowlist.activeRegionKeys);
const STATUSES = new Set<RegionalEventLedgerStatus>(rulesFile.allowlist.statuses);
const AUTHORITIES = new Set<RegionalEventLedgerAuthority>(rulesFile.allowlist.authorities);
const EVENT_KINDS = new Set<RegionalPublicEventKind>(rulesFile.allowlist.eventKinds);
const EVENT_STATUSES = new Set<RegionalEventStatus>(rulesFile.allowlist.eventStatuses);
const PRESSURE_LEVELS = new Set<RegionalPressureLevel>(rulesFile.allowlist.pressureLevels);
const PRESSURE_RULES = new Map<V170RegionalLifePressureId, V200PressureRule>(
  rulesFile.pressureDeck.map(rule => [rule.pressureId, rule]),
);

const HIDDEN_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/春秋蝉/g, '受保护隐秘'],
  [/重生/g, '受保护经历'],
  [/回溯/g, '受保护因果'],
  [/fang_yuan_private_causality_hidden_anchor/g, '受保护私密引用'],
  [/private-body-redacted/g, '受保护私密引用'],
  [/hidden_ref_only/g, '受保护引用'],
  [/hidden\/private/gi, '受保护内容'],
  [/隐藏因果/g, '受保护因果'],
];

const FORMAL_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/正式加入商队/g, '正式商队身份结论已阻断'],
  [/成为正式成员/g, '正式成员结论已阻断'],
  [/进入商家城/g, '抵近商家城外缘'],
  [/地点已解锁/g, '地点解锁结论已阻断'],
  [/奖励已发放/g, '奖励结算已阻断'],
  [/NPC已死亡/g, 'NPC 生死结论已阻断'],
  [/价格表已生成/g, '价格表结论已阻断'],
  [/库存已生成/g, '库存结论已阻断'],
];

function unique(values: Array<string | null | undefined>, max = 80): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))]
    .slice(0, max);
}

function finiteNumber(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function finiteTurn(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(finiteNumber(value, fallback)));
}

function objectRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? unique(value.filter((item): item is string => typeof item === 'string')) : [];
}

function sanitizeVisibleText(value: unknown, fallback: string): string {
  let text = stringValue(value, fallback).trim() || fallback;
  for (const [pattern, replacement] of HIDDEN_TEXT_REPLACEMENTS) text = text.replace(pattern, replacement);
  for (const [pattern, replacement] of FORMAL_TEXT_REPLACEMENTS) text = text.replace(pattern, replacement);
  return text.trim() || fallback;
}

function sanitizeVisibleRefs(values: string[], max = 24): string[] {
  const blockedTokens = ['hidden', 'private', 'source_text', 'source-text', 'raw', 'quote', 'original', 'body'];
  return unique(values, max).filter(value => !blockedTokens.some(token => value.toLowerCase().includes(token)));
}

function hasMeaningfulState(input: unknown): boolean {
  const raw = objectRecord(input);
  return [
    'status',
    'authority',
    'activeRegionKey',
    'publicEvents',
    'pendingFollowUps',
    'pressureSummary',
    'audit',
  ].some(key => key in raw);
}

function emptyPressureSummary(): RegionalEventLedger['pressureSummary'] {
  return {
    level: 'low',
    score: 0,
    tags: [],
    activeEventKinds: [],
    visibleEventCount: 0,
  };
}

function buildAudit(actionId: string | null, notes: string[] = []): RegionalEventLedger['audit'] {
  return {
    lastWorldCoreActionId: actionId,
    sourcePolicy: 'reviewed_source_pointer_only',
    deepSeekPolicy: 'narrative_only_no_ledger_writes',
    hiddenFactPolicy: 'refs_only_no_hidden_body',
    forbiddenOutcomePolicy: 'record_and_block_not_resolve',
    notes,
  };
}

function buildDefaultLedger(migrationNote?: string): RegionalEventLedger {
  const state: RegionalEventLedger = {
    schemaVersion: SCHEMA_VERSION,
    status: 'not_started',
    authority: 'migration_default',
    activeRegionKey: ACTIVE_REGION_KEY,
    publicEvents: [],
    pendingFollowUps: [],
    pressureSummary: emptyPressureSummary(),
    evidenceRefs: [],
    sourceRefs: ['v2.0.0-b1:v25-default'],
    lastUpdatedAtTurn: null,
    audit: buildAudit(null, [
      'v25 migration default: regionalEventLedger starts empty and waits for WorldCore sync.',
    ]),
  };
  if (migrationNote) state.migrationNote = migrationNote;
  return state;
}

function normalizeForbiddenOutcomes(values: unknown): string[] {
  return stringArray(values).filter(value => rulesFile.boundaries.forbiddenWrites.includes(value) || value.includes('_'));
}

function normalizePublicEvent(value: unknown, turn: number): RegionalPublicEvent | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id);
  const eventKind = EVENT_KINDS.has(raw.eventKind) ? raw.eventKind as RegionalPublicEventKind : null;
  const status = EVENT_STATUSES.has(raw.status) ? raw.status as RegionalEventStatus : null;
  if (!id || !eventKind || !status) return null;
  return {
    id,
    turn: finiteTurn(raw.turn, turn),
    eventKind,
    sourceActionRefs: sanitizeVisibleRefs(stringArray(raw.sourceActionRefs), 16),
    sourceFactRefs: sanitizeVisibleRefs(stringArray(raw.sourceFactRefs), 16),
    sourceRefs: sanitizeVisibleRefs(stringArray(raw.sourceRefs), 16),
    publicSummaryKey: stringValue(raw.publicSummaryKey, `v200_summary_${eventKind}`),
    publicSummary: sanitizeVisibleText(raw.publicSummary, '公开区域事件已登记。'),
    pressureTags: stringArray(raw.pressureTags).slice(0, 12),
    status,
    forbiddenOutcomes: normalizeForbiddenOutcomes(raw.forbiddenOutcomes),
  };
}

function normalizePendingFollowUp(value: unknown, turn: number): RegionalPendingFollowUp | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id);
  const eventId = stringValue(raw.eventId);
  const eventKind = EVENT_KINDS.has(raw.eventKind) ? raw.eventKind as RegionalPublicEventKind : null;
  const status = raw.status === 'resolved' || raw.status === 'expired' ? raw.status : 'pending';
  if (!id || !eventId || !eventKind) return null;
  return {
    id,
    turn: finiteTurn(raw.turn, turn),
    eventId,
    eventKind,
    publicSummary: sanitizeVisibleText(raw.publicSummary, '后续仍待本地系统复核。'),
    nextStep: sanitizeVisibleText(raw.nextStep, '继续收集公开证据，不能直接结算正式结果。'),
    sourceRefs: sanitizeVisibleRefs(stringArray(raw.sourceRefs), 16),
    status,
    forbiddenOutcomes: normalizeForbiddenOutcomes(raw.forbiddenOutcomes),
  };
}

function normalizePressureSummary(value: unknown, events: RegionalPublicEvent[]): RegionalEventLedger['pressureSummary'] {
  const raw = objectRecord(value);
  const level = PRESSURE_LEVELS.has(raw.level) ? raw.level as RegionalPressureLevel : scoreToLevel(scoreEvents(events));
  const activeEventKinds = stringArray(raw.activeEventKinds)
    .filter((kind): kind is RegionalPublicEventKind => EVENT_KINDS.has(kind as RegionalPublicEventKind));
  const derivedKinds = unique(events.map(event => event.eventKind)) as RegionalPublicEventKind[];
  return {
    level,
    score: clampScore(raw.score, scoreEvents(events)),
    tags: stringArray(raw.tags).slice(0, 24),
    activeEventKinds: activeEventKinds.length > 0 ? activeEventKinds : derivedKinds,
    visibleEventCount: Math.max(0, Math.floor(finiteNumber(raw.visibleEventCount, events.length))),
  };
}

function clampScore(value: unknown, fallback: number): number {
  return Math.max(0, Math.min(100, Math.round(finiteNumber(value, fallback))));
}

function scoreToLevel(score: number): RegionalPressureLevel {
  if (score >= 64) return 'high';
  if (score >= 24) return 'medium';
  return 'low';
}

function eventWeight(kind: RegionalPublicEventKind): number {
  if (kind === 'road_conflict_pressure') return 16;
  if (kind === 'gate_threshold') return 14;
  if (kind === 'checkpoint_questioning') return 12;
  return 10;
}

function scoreEvents(events: RegionalPublicEvent[]): number {
  return Math.min(100, events.reduce((sum, event) => sum + eventWeight(event.eventKind), 0));
}

export function createInitialRegionalEventLedger(
  input: Partial<RegionalEventLedger> = {},
): RegionalEventLedger {
  if (!hasMeaningfulState(input)) return buildDefaultLedger();
  return normalizeRegionalEventLedger(input);
}

export function normalizeRegionalEventLedger(
  input?: Partial<RegionalEventLedger> | null,
  turnFallback = 0,
): RegionalEventLedger {
  if (!hasMeaningfulState(input)) {
    return buildDefaultLedger('v25 migration default: regionalEventLedger starts empty.');
  }

  const raw = objectRecord(input);
  const turn = raw.lastUpdatedAtTurn === null || raw.lastUpdatedAtTurn === undefined
    ? turnFallback
    : finiteTurn(raw.lastUpdatedAtTurn, turnFallback);
  const authority = AUTHORITIES.has(raw.authority) ? raw.authority as RegionalEventLedgerAuthority : null;
  const regionKey = REGION_KEYS.has(raw.activeRegionKey) ? raw.activeRegionKey as RegionalEventRegionKey : null;
  const publicEvents = Array.isArray(raw.publicEvents)
    ? raw.publicEvents.map(event => normalizePublicEvent(event, turn)).filter((event): event is RegionalPublicEvent => Boolean(event)).slice(-MAX_PUBLIC_EVENTS)
    : [];
  const pendingFollowUps = Array.isArray(raw.pendingFollowUps)
    ? raw.pendingFollowUps.map(item => normalizePendingFollowUp(item, turn)).filter((item): item is RegionalPendingFollowUp => Boolean(item)).slice(-MAX_PENDING_FOLLOWUPS)
    : [];
  const status = STATUSES.has(raw.status)
    ? raw.status as RegionalEventLedgerStatus
    : (publicEvents.length > 0 ? 'events_tracked' : 'not_started');

  if (!authority || !regionKey) {
    return {
      ...buildDefaultLedger('regionalEventLedger contained invalid authority or region key; normalized conservatively.'),
      status: 'blocked',
      authority: 'worldcore_region_engine',
      activeRegionKey: 'unknown_conservative',
      lastUpdatedAtTurn: turn,
      audit: buildAudit(V200_REGIONAL_EVENT_LEDGER_ACTION_ID, [
        'Invalid edited ledger authority/region was blocked.',
      ]),
    };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    status: status === 'not_started' && publicEvents.length > 0 ? 'events_tracked' : status,
    authority,
    activeRegionKey: regionKey,
    publicEvents,
    pendingFollowUps,
    pressureSummary: normalizePressureSummary(raw.pressureSummary, publicEvents),
    evidenceRefs: sanitizeVisibleRefs(stringArray(raw.evidenceRefs), 32),
    sourceRefs: sanitizeVisibleRefs(stringArray(raw.sourceRefs), 32).length > 0
      ? sanitizeVisibleRefs(stringArray(raw.sourceRefs), 32)
      : ['v2.0.0-b1:normalize'],
    lastUpdatedAtTurn: raw.lastUpdatedAtTurn === null || raw.lastUpdatedAtTurn === undefined ? null : turn,
    audit: {
      ...buildAudit(stringValue(raw.audit?.lastWorldCoreActionId) || null),
      notes: stringArray(raw.audit?.notes).slice(0, 8),
    },
    ...(typeof raw.migrationNote === 'string' && raw.migrationNote.trim() ? { migrationNote: raw.migrationNote } : {}),
  };
}

function sourceFamilyFor(rule: V200PressureRule): V200RegionalEventEnvelope['sourceFamily'] {
  switch (rule.eventKind) {
    case 'checkpoint_questioning':
    case 'gate_threshold':
      return 'route';
    case 'caravan_contact':
    case 'temporary_labor':
      return 'identity';
    case 'market_pressure':
    case 'shelter_debt':
      return 'survival';
    case 'road_conflict_pressure':
      return 'conflict';
    default:
      return 'public_observation';
  }
}

function actionRefsFromLedger(entries: LocalActionLedgerEntry[] | null | undefined): string[] {
  return sanitizeVisibleRefs((entries || []).map(entry => entry.id), 12);
}

function envelopeFromCard(card: V170RegionalLifePressureCard): V200RegionalEventEnvelope | null {
  const rule = PRESSURE_RULES.get(card.id);
  if (!rule || card.status !== 'visible') return null;
  return {
    envelopeId: `v200_env_${card.id}`,
    sourceFamily: sourceFamilyFor(rule),
    pressureId: card.id,
    eventKind: rule.eventKind,
    sourcePointers: sanitizeVisibleRefs([...card.sourceRefs, ...card.evidenceRefs], 16),
    visiblePressure: sanitizeVisibleText(card.summary, '区域公开压力可读。'),
    entryPreconditions: sanitizeVisibleRefs(card.evidenceRefs, 8),
    candidateNextSteps: [sanitizeVisibleText(card.nextStep, '继续收集公开证据。')],
    forbiddenOutcomes: unique([...rule.forbiddenOutcomes, ...card.forbiddenWrites], 24),
    matrixRefs: ['V20-A1-LEDGER-001', 'V20-EVENT-001', 'V20-DS-AUTH-001'],
    v2PromotionGate: 'worldcore_ledger_only',
  };
}

export function buildV200RegionalEventEnvelopes(
  input: V170RegionalLifeProjectionInput = {},
): V200RegionalEventEnvelope[] {
  const projection = buildV170RegionalLifeProjection(input);
  if (projection.status !== 'regional_life_visible') return [];
  return projection.pressureCards
    .map(card => envelopeFromCard(card))
    .filter((envelope): envelope is V200RegionalEventEnvelope => Boolean(envelope));
}

function eventFromEnvelope(
  envelope: V200RegionalEventEnvelope,
  turn: number,
  sourceActionRefs: string[],
): RegionalPublicEvent {
  return {
    id: `v200b1_${envelope.eventKind}_${envelope.pressureId}_t${turn}`,
    turn,
    eventKind: envelope.eventKind,
    sourceActionRefs,
    sourceFactRefs: sanitizeVisibleRefs(envelope.entryPreconditions, 12),
    sourceRefs: sanitizeVisibleRefs(envelope.sourcePointers, 12),
    publicSummaryKey: PRESSURE_RULES.get(envelope.pressureId)?.summaryKey || `v200_summary_${envelope.eventKind}`,
    publicSummary: envelope.visiblePressure,
    pressureTags: PRESSURE_RULES.get(envelope.pressureId)?.pressureTags || [],
    status: 'observed',
    forbiddenOutcomes: envelope.forbiddenOutcomes,
  };
}

function followUpFromEvent(event: RegionalPublicEvent, envelope: V200RegionalEventEnvelope): RegionalPendingFollowUp {
  return {
    id: `v200b1_followup_${envelope.pressureId}_t${event.turn}`,
    turn: event.turn,
    eventId: event.id,
    eventKind: event.eventKind,
    publicSummary: `${event.publicSummary} 后续仍需本地系统复核。`,
    nextStep: envelope.candidateNextSteps[0] || '继续收集公开证据，不能直接结算正式结果。',
    sourceRefs: event.sourceRefs,
    status: 'pending',
    forbiddenOutcomes: event.forbiddenOutcomes,
  };
}

function pressureSummary(events: RegionalPublicEvent[]): RegionalEventLedger['pressureSummary'] {
  const score = scoreEvents(events);
  return {
    level: scoreToLevel(score),
    score,
    tags: unique(events.flatMap(event => event.pressureTags), 24),
    activeEventKinds: unique(events.map(event => event.eventKind)) as RegionalPublicEventKind[],
    visibleEventCount: events.length,
  };
}

export function resolveV200WorldCoreRegionalEventLedgerSync(input: V170RegionalLifeProjectionInput & {
  previousLedger?: Partial<RegionalEventLedger> | null;
} = {}): V200WorldCoreLedgerResolution {
  const turn = finiteTurn(input.turn ?? input.livingWorldState?.worldClock?.turn, 0);
  const previous = normalizeRegionalEventLedger(input.previousLedger, turn);
  const projection = buildV170RegionalLifeProjection(input);
  const envelopes = projection.status === 'regional_life_visible'
    ? projection.pressureCards.map(card => envelopeFromCard(card)).filter((item): item is V200RegionalEventEnvelope => Boolean(item))
    : [];

  if (envelopes.length === 0) {
    return {
      success: false,
      actionId: V200_REGIONAL_EVENT_LEDGER_ACTION_ID,
      message: '当前缺少南疆早期低阶外缘公开区域事件证据，暂不写 regionalEventLedger。',
      regionalEventLedger: previous,
      envelopes: [],
      applied: [],
      rejected: ['needs_regional_life_visible_context'],
      forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
      boundaryLines: [...rulesFile.boundaries.visibleBoundaryLines],
    };
  }

  const sourceActionRefs = actionRefsFromLedger(input.localActionLedger);
  const nextEvents = envelopes.map(envelope => eventFromEnvelope(envelope, turn, sourceActionRefs));
  const nextIds = new Set(nextEvents.map(event => event.id));
  const publicEvents = [
    ...previous.publicEvents.filter(event => !nextIds.has(event.id)),
    ...nextEvents,
  ].slice(-MAX_PUBLIC_EVENTS);
  const pendingFollowUps = [
    ...previous.pendingFollowUps.filter(item => !nextIds.has(item.eventId)),
    ...nextEvents.map((event, index) => followUpFromEvent(event, envelopes[index])),
  ].slice(-MAX_PENDING_FOLLOWUPS);

  const regionalEventLedger: RegionalEventLedger = {
    schemaVersion: SCHEMA_VERSION,
    status: 'events_tracked',
    authority: 'worldcore_region_engine',
    activeRegionKey: ACTIVE_REGION_KEY,
    publicEvents,
    pendingFollowUps,
    pressureSummary: pressureSummary(publicEvents),
    evidenceRefs: sanitizeVisibleRefs(publicEvents.flatMap(event => [
      ...event.sourceActionRefs,
      ...event.sourceFactRefs,
    ]), 32),
    sourceRefs: sanitizeVisibleRefs([
      'v2.0.0-a1:D-201-003',
      'v2.0.0-b1:regionalEventLedger',
      'v1.9.0-a2:southern_border_low_rank_region_life_v2_prelude_slice:intake-reviewed',
      'v1.9.0-b2:regional-event-envelope',
      ...publicEvents.flatMap(event => event.sourceRefs),
    ], 32),
    lastUpdatedAtTurn: turn,
    audit: buildAudit(V200_REGIONAL_EVENT_LEDGER_ACTION_ID, [
      'WorldCore converted visible regional-life pressure into a v25 public event ledger.',
      'No DeepSeek text, hidden body, reward, formal location, formal identity, or NPC fate is stored.',
    ]),
  };

  return {
    success: true,
    actionId: V200_REGIONAL_EVENT_LEDGER_ACTION_ID,
    message: 'WorldCore 已登记区域事件账本；本次只记录公开压力与待处理后续，不结算正式地点、身份、奖励或 NPC 生死。',
    regionalEventLedger,
    envelopes,
    applied: ['regionalEventLedger'],
    rejected: [],
    forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
    boundaryLines: [...rulesFile.boundaries.visibleBoundaryLines],
  };
}
