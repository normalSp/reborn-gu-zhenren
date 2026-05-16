import type {
  HiddenFactRefState,
  LivingActionConsequenceEntry,
  LivingFactConfidence,
  LivingFactionPressureEntry,
  LivingGoalStatus,
  LivingIfDeviationEntry,
  LivingIfDeviationLevel,
  LivingKnownFactSource,
  LivingNpcMemoryEntry,
  LivingPlayerGoalEntry,
  LivingRegionAccess,
  LivingRegionState,
  LivingRegionStatus,
  LivingWorldPhase,
  LivingWorldState,
  PlayerKnownFact,
} from '../types';

const LIVING_WORLD_SCHEMA_VERSION = 1 as const;

const PHASES = new Set<LivingWorldPhase>(['start', 'morning', 'afternoon', 'night']);
const REGION_STATUSES = new Set<LivingRegionStatus>(['stable', 'tense', 'restricted', 'collapsing']);
const REGION_ACCESS = new Set<LivingRegionAccess>(['known', 'rumored', 'restricted', 'blocked']);
const FACT_SCOPES = new Set(['world', 'region', 'npc', 'faction', 'item', 'quest']);
const FACT_SOURCES = new Set<LivingKnownFactSource>(['canon_summary', 'engine_result', 'deepseek_clue', 'player_observation']);
const FACT_CONFIDENCE = new Set<LivingFactConfidence>(['confirmed', 'rumor', 'misleading']);
const GOAL_INTENTS = new Set(['obtain_item', 'join_faction', 'investigate', 'travel', 'long_term_goal']);
const GOAL_STATUSES = new Set<LivingGoalStatus>(['active', 'blocked', 'deferred', 'completed', 'failed']);
const PRESSURE_TYPES = new Set(['suspicion', 'favor', 'hostility', 'opportunity']);
const PRESSURE_VISIBILITY = new Set(['player_visible', 'system_hidden']);
const CONSEQUENCE_SCOPES = new Set(['world', 'region', 'npc', 'faction', 'combat', 'resource']);
const IF_LEVELS = new Set<LivingIfDeviationLevel>(['none', 'minor', 'major', 'critical']);
const IF_STATUSES = new Set(['recorded', 'resolved', 'rejected']);

function finiteNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function finiteTurn(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(finiteNumber(value, fallback)));
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return Math.max(min, Math.min(max, finiteNumber(value, fallback)));
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function objectRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function normalizeRegion(regionId: string, value: unknown, turn: number): LivingRegionState | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.regionId, regionId);
  if (!id) return null;
  const alertLevel = Math.round(clamp(raw.alertLevel, 0, 3, 0)) as 0 | 1 | 2 | 3;
  const status = REGION_STATUSES.has(raw.status) ? raw.status as LivingRegionStatus : 'stable';
  const access = REGION_ACCESS.has(raw.access) ? raw.access as LivingRegionAccess : 'known';
  return {
    regionId: id,
    status,
    pressure: clamp(raw.pressure, 0, 100, 0),
    alertLevel,
    access,
    knownEventIds: stringArray(raw.knownEventIds),
    hiddenFactRefIds: stringArray(raw.hiddenFactRefIds),
    factionPressureIds: stringArray(raw.factionPressureIds),
    lastUpdatedTurn: finiteTurn(raw.lastUpdatedTurn, turn),
  };
}

function normalizeKnownFact(idKey: string, value: unknown, turn: number): PlayerKnownFact | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id, idKey);
  if (!id) return null;
  const scope = FACT_SCOPES.has(raw.scope) ? raw.scope as PlayerKnownFact['scope'] : 'world';
  const source = FACT_SOURCES.has(raw.source) ? raw.source as LivingKnownFactSource : 'engine_result';
  const confidence = FACT_CONFIDENCE.has(raw.confidence) ? raw.confidence as LivingFactConfidence : 'rumor';
  return {
    id,
    scope,
    source,
    summary: stringValue(raw.summary),
    learnedTurn: finiteTurn(raw.learnedTurn, turn),
    confidence,
    tags: stringArray(raw.tags),
  };
}

function normalizeHiddenFactRef(idKey: string, value: unknown, turn: number): HiddenFactRefState | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id, idKey);
  if (!id) return null;
  const scope = FACT_SCOPES.has(raw.scope) ? raw.scope as HiddenFactRefState['scope'] : 'world';
  return {
    id,
    scope,
    sourcePointer: stringValue(raw.sourcePointer),
    revealPolicyId: stringValue(raw.revealPolicyId),
    guard: 'hidden',
    lastCheckedTurn: raw.lastCheckedTurn === null || raw.lastCheckedTurn === undefined
      ? null
      : finiteTurn(raw.lastCheckedTurn, turn),
  };
}

function normalizeNpcMemory(value: unknown, turn: number): LivingNpcMemoryEntry | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id);
  const npcId = stringValue(raw.npcId);
  if (!id || !npcId) return null;
  return {
    id,
    npcId,
    turn: finiteTurn(raw.turn, turn),
    regionId: stringOrNull(raw.regionId),
    actionId: stringOrNull(raw.actionId),
    publicSummary: stringValue(raw.publicSummary),
    privateRefId: stringOrNull(raw.privateRefId),
    attitudeDelta: clamp(raw.attitudeDelta, -100, 100, 0),
    weight: clamp(raw.weight, 0, 100, 1),
    tags: stringArray(raw.tags),
    expiresTurn: raw.expiresTurn === null || raw.expiresTurn === undefined ? null : finiteTurn(raw.expiresTurn, turn),
  };
}

function normalizeFactionPressure(value: unknown, turn: number): LivingFactionPressureEntry | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id);
  const factionId = stringValue(raw.factionId);
  if (!id || !factionId) return null;
  return {
    id,
    factionId,
    pressureType: PRESSURE_TYPES.has(raw.pressureType) ? raw.pressureType as LivingFactionPressureEntry['pressureType'] : 'suspicion',
    delta: clamp(raw.delta, -100, 100, 0),
    reason: stringValue(raw.reason),
    turn: finiteTurn(raw.turn, turn),
    visibility: PRESSURE_VISIBILITY.has(raw.visibility) ? raw.visibility as LivingFactionPressureEntry['visibility'] : 'player_visible',
  };
}

function normalizePlayerGoal(value: unknown, turn: number): LivingPlayerGoalEntry | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id);
  if (!id) return null;
  return {
    id,
    intentType: GOAL_INTENTS.has(raw.intentType) ? raw.intentType as LivingPlayerGoalEntry['intentType'] : 'long_term_goal',
    targetRef: stringValue(raw.targetRef),
    status: GOAL_STATUSES.has(raw.status) ? raw.status as LivingGoalStatus : 'active',
    createdTurn: finiteTurn(raw.createdTurn, turn),
    lastUpdatedTurn: finiteTurn(raw.lastUpdatedTurn, turn),
    rationale: stringValue(raw.rationale),
    nextStepHints: stringArray(raw.nextStepHints),
    blockedByRefIds: stringArray(raw.blockedByRefIds),
  };
}

function normalizeActionConsequence(value: unknown, turn: number): LivingActionConsequenceEntry | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id);
  const actionId = stringValue(raw.actionId);
  if (!id || !actionId) return null;
  return {
    id,
    actionId,
    turn: finiteTurn(raw.turn, turn),
    scope: CONSEQUENCE_SCOPES.has(raw.scope) ? raw.scope as LivingActionConsequenceEntry['scope'] : 'world',
    publicSummary: stringValue(raw.publicSummary),
    effectRefs: stringArray(raw.effectRefs),
    followUpRefs: stringArray(raw.followUpRefs),
  };
}

function normalizeIfDeviation(value: unknown, turn: number): LivingIfDeviationEntry | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id);
  const anchorRefId = stringValue(raw.anchorRefId);
  if (!id || !anchorRefId) return null;
  return {
    id,
    anchorRefId,
    level: IF_LEVELS.has(raw.level) ? raw.level as LivingIfDeviationLevel : 'none',
    reason: stringValue(raw.reason),
    turn: finiteTurn(raw.turn, turn),
    status: IF_STATUSES.has(raw.status) ? raw.status as LivingIfDeviationEntry['status'] : 'recorded',
    visibleToPlayer: Boolean(raw.visibleToPlayer),
  };
}

function normalizeRecord<T>(
  value: unknown,
  normalizer: (id: string, item: unknown, turn: number) => T | null,
  turn: number,
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [id, item] of Object.entries(objectRecord(value))) {
    const normalized = normalizer(id, item, turn);
    if (normalized) result[id] = normalized;
  }
  return result;
}

function normalizeArray<T>(
  value: unknown,
  normalizer: (item: unknown, turn: number) => T | null,
  turn: number,
): T[] {
  return Array.isArray(value)
    ? value.map(item => normalizer(item, turn)).filter((item): item is T => Boolean(item))
    : [];
}

export function createInitialLivingWorldState(
  input: Partial<LivingWorldState> = {},
): LivingWorldState {
  return normalizeLivingWorldState(input);
}

export function normalizeLivingWorldState(
  input?: Partial<LivingWorldState> | null,
  turnFallback = 0,
): LivingWorldState {
  const raw = objectRecord(input);
  const rawClock = objectRecord(raw.worldClock);
  const hasExistingState = Boolean(input && typeof input === 'object');
  const turn = finiteTurn(rawClock.turn, hasExistingState ? turnFallback : 0);
  const phase = PHASES.has(rawClock.phase) ? rawClock.phase as LivingWorldPhase : 'start';

  return {
    schemaVersion: LIVING_WORLD_SCHEMA_VERSION,
    worldClock: {
      turn,
      day: Math.max(1, Math.floor(finiteNumber(rawClock.day, 1))),
      phase,
      lastActionId: stringOrNull(rawClock.lastActionId),
    },
    regions: normalizeRecord(raw.regions, normalizeRegion, turn),
    knownFacts: normalizeRecord(raw.knownFacts, normalizeKnownFact, turn),
    hiddenFactRefs: normalizeRecord(raw.hiddenFactRefs, normalizeHiddenFactRef, turn),
    npcMemories: normalizeArray(raw.npcMemories, normalizeNpcMemory, turn),
    factionPressure: normalizeArray(raw.factionPressure, normalizeFactionPressure, turn),
    playerGoals: normalizeArray(raw.playerGoals, normalizePlayerGoal, turn),
    actionConsequences: normalizeArray(raw.actionConsequences, normalizeActionConsequence, turn),
    ifDeviations: normalizeArray(raw.ifDeviations, normalizeIfDeviation, turn),
  };
}
