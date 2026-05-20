import rulesRaw from '../canon/v110-route-location-state-rules.json';
import type {
  LivingActionConsequenceEntry,
  LivingPlayerGoalEntry,
  LivingWorldState,
  PlayerKnownFact,
  RouteLocationAuthority,
  RouteLocationScopeId,
  RouteLocationState,
  RouteLocationStatus,
  RouteRegionScopeId,
} from '../types';

const ACTION_ID = 'v110_route_location_state_sync';
const PRIMARY_ROUTE_ID = 'southern_border_low_rank_route';

interface V110StatusCard {
  id: RouteLocationStatus;
  label: string;
  publicSummary: string;
  nextStep: string;
  blockedUpgrades: string[];
}

interface V110ScopeCard {
  id: RouteLocationScopeId | RouteRegionScopeId;
  kind: 'location' | 'region';
  label: string;
  publicSummary: string;
}

interface V110RouteLocationRulesFile {
  sourceReview: {
    intakeReviews: string[];
    sourcePackages: string[];
    sourcePolicy: string;
  };
  allowlist: {
    statuses: RouteLocationStatus[];
    routeIds: string[];
    locationScopeIds: RouteLocationScopeId[];
    regionScopeIds: RouteRegionScopeId[];
    authorities: RouteLocationAuthority[];
  };
  statusCards: V110StatusCard[];
  scopeCards: V110ScopeCard[];
  evidenceRules: {
    escapeGoalRefs: string[];
    routePreparationFacts: string[];
    routeInProgressFacts: string[];
    outerEdgeProjectionFacts: string[];
    preparationActionIds: string[];
  };
  boundaries: {
    forbiddenWrites: string[];
    visibleBoundaryLines: string[];
    hiddenRefPolicies: string[];
  };
}

export interface V110RouteLocationOverview {
  routeLocationState: RouteLocationState;
  statusLabel: string;
  locationLabel: string;
  regionLabel: string;
  publicSummary: string;
  nextStep: string;
  evidenceLedgerEntryIds: string[];
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  boundaryLines: string[];
  driftCheckpoints: string[];
  statePatchApplied: false;
}

export interface V110RouteLocationActionResolution {
  success: boolean;
  blocked: boolean;
  actionId: typeof ACTION_ID;
  message: string;
  publicSummary: string;
  routeLocationState: RouteLocationState;
  overview: V110RouteLocationOverview;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
}

export interface V110DeterministicSoakSample {
  id: string;
  title: string;
  state?: Partial<LivingWorldState> | null;
  rawRouteLocationState?: Partial<RouteLocationState> | null;
  expectedStatus: RouteLocationStatus;
  expectedLocationScopeId: RouteLocationScopeId;
  expectedRegionScopeId: RouteRegionScopeId;
}

export interface V110DeterministicSoakResult {
  id: string;
  title: string;
  pass: boolean;
  expected: {
    status: RouteLocationStatus;
    locationScopeId: RouteLocationScopeId;
    regionScopeId: RouteRegionScopeId;
  };
  actual: RouteLocationState;
  forbiddenWriteLeak: boolean;
}

const rulesFile = rulesRaw as V110RouteLocationRulesFile;
const STATUS_SET = new Set<RouteLocationStatus>(rulesFile.allowlist.statuses);
const ROUTE_ID_SET = new Set<string>(rulesFile.allowlist.routeIds);
const LOCATION_SCOPE_SET = new Set<RouteLocationScopeId>(rulesFile.allowlist.locationScopeIds);
const REGION_SCOPE_SET = new Set<RouteRegionScopeId>(rulesFile.allowlist.regionScopeIds);
const AUTHORITY_SET = new Set<RouteLocationAuthority>(rulesFile.allowlist.authorities);

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
}

function finiteTurn(value: unknown, fallback = 0): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.floor(numberValue)) : fallback;
}

function objectRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? unique(value.filter((item): item is string => typeof item === 'string')) : [];
}

function hasKnownFact(state: Partial<LivingWorldState> | null | undefined, id: string): boolean {
  return Boolean(state?.knownFacts?.[id]);
}

function knownFactEvidence(state: Partial<LivingWorldState> | null | undefined, ids: string[]): string[] {
  return ids.filter(id => hasKnownFact(state, id));
}

function consequenceEvidence(
  state: Partial<LivingWorldState> | null | undefined,
  ids: string[],
): string[] {
  const consequences = state?.actionConsequences || [];
  return consequences
    .filter(entry => ids.some(id => (
      entry.id === id
      || entry.actionId === id
      || entry.effectRefs.includes(id)
      || entry.followUpRefs.includes(id)
    )))
    .map(entry => entry.id);
}

function findEscapeGoal(state?: Partial<LivingWorldState> | null): LivingPlayerGoalEntry | null {
  return (state?.playerGoals || []).find(goal => (
    goal.status !== 'failed'
    && (
      rulesFile.evidenceRules.escapeGoalRefs.includes(goal.targetRef)
      || goal.rationale.includes('逃离青茅山')
      || goal.rationale.includes('离开青茅')
      || goal.rationale.includes('去南疆')
    )
  )) || null;
}

function sourceRefsForStatus(status: RouteLocationStatus): string[] {
  const packageRefs: Record<RouteLocationStatus, string[]> = {
    not_started: ['v110:a2:default_start_profile'],
    preparing_departure: ['v110:a2:route_preparation', 'v110_package:route_location_boundary'],
    route_in_progress: ['v110:a2:route_in_progress', 'v110_package:travel_supply_pursuit_identity_pressure'],
    outer_edge_projection: ['v110:a2:southern_border_outer_edge', 'v110_package:southern_border_outer_edge_public_fact'],
    blocked: ['v110:a2:unknown_conservative'],
  };
  return packageRefs[status];
}

function sanitizeVisibleSourceRefs(values: string[]): string[] {
  const hiddenTokens = ['hidden', 'private', 'human_review', 'hidden_ref_only', 'source_text'];
  return unique(values).filter(value => !hiddenTokens.some(token => value.toLowerCase().includes(token)));
}

function statusCard(status: RouteLocationStatus): V110StatusCard {
  return rulesFile.statusCards.find(card => card.id === status) || rulesFile.statusCards[0];
}

function scopeLabel(id: RouteLocationScopeId | RouteRegionScopeId, kind: 'location' | 'region'): string {
  const card = rulesFile.scopeCards.find(item => item.id === id && item.kind === kind)
    || rulesFile.scopeCards.find(item => item.id === id);
  return card?.label || id;
}

function hasMeaningfulRawRouteLocationState(input: unknown): boolean {
  const raw = objectRecord(input);
  return ['status', 'routeId', 'locationScopeId', 'regionScopeId', 'authority'].some(key => key in raw);
}

function buildState(input: {
  status: RouteLocationStatus;
  routeId?: string | null;
  locationScopeId: RouteLocationScopeId;
  regionScopeId: RouteRegionScopeId;
  authority: RouteLocationAuthority;
  evidenceLedgerEntryIds?: string[];
  sourceRefs?: string[];
  lastUpdatedAtTurn?: number | null;
  migrationNote?: string;
}): RouteLocationState {
  const state: RouteLocationState = {
    status: input.status,
    routeId: input.routeId ?? null,
    locationScopeId: input.locationScopeId,
    regionScopeId: input.regionScopeId,
    authority: input.authority,
    evidenceLedgerEntryIds: unique(input.evidenceLedgerEntryIds || []),
    sourceRefs: sanitizeVisibleSourceRefs(input.sourceRefs || sourceRefsForStatus(input.status)),
    lastUpdatedAtTurn: input.lastUpdatedAtTurn ?? null,
  };
  if (input.migrationNote) state.migrationNote = input.migrationNote;
  return state;
}

export function deriveRouteLocationStateFromLivingWorld(
  livingWorldState?: Partial<LivingWorldState> | null,
  turnFallback = 0,
): RouteLocationState {
  const turn = finiteTurn(livingWorldState?.worldClock?.turn, turnFallback);
  const outerEdgeEvidence = unique([
    ...knownFactEvidence(livingWorldState, rulesFile.evidenceRules.outerEdgeProjectionFacts),
    ...consequenceEvidence(livingWorldState, rulesFile.evidenceRules.outerEdgeProjectionFacts),
  ]);
  if (outerEdgeEvidence.length > 0) {
    return buildState({
      status: 'outer_edge_projection',
      routeId: PRIMARY_ROUTE_ID,
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
      authority: 'living_world_engine',
      evidenceLedgerEntryIds: outerEdgeEvidence,
      sourceRefs: [...sourceRefsForStatus('outer_edge_projection'), ...outerEdgeEvidence],
      lastUpdatedAtTurn: turn,
    });
  }

  const progressEvidence = unique([
    ...knownFactEvidence(livingWorldState, rulesFile.evidenceRules.routeInProgressFacts),
    ...consequenceEvidence(livingWorldState, rulesFile.evidenceRules.routeInProgressFacts),
  ]);
  if (progressEvidence.length > 0) {
    return buildState({
      status: 'route_in_progress',
      routeId: PRIMARY_ROUTE_ID,
      locationScopeId: 'qingmao_exit_path',
      regionScopeId: 'qingmao',
      authority: 'living_world_engine',
      evidenceLedgerEntryIds: progressEvidence,
      sourceRefs: [...sourceRefsForStatus('route_in_progress'), ...progressEvidence],
      lastUpdatedAtTurn: turn,
    });
  }

  const preparationEvidence = unique([
    ...knownFactEvidence(livingWorldState, rulesFile.evidenceRules.routePreparationFacts),
    ...consequenceEvidence(livingWorldState, [
      ...rulesFile.evidenceRules.routePreparationFacts,
      ...rulesFile.evidenceRules.preparationActionIds,
    ]),
  ]);
  const escapeGoal = findEscapeGoal(livingWorldState);
  if (preparationEvidence.length > 0 || escapeGoal) {
    return buildState({
      status: 'preparing_departure',
      routeId: preparationEvidence.length > 0 ? PRIMARY_ROUTE_ID : null,
      locationScopeId: 'qingmao_mountain',
      regionScopeId: 'qingmao',
      authority: 'living_world_engine',
      evidenceLedgerEntryIds: unique([escapeGoal?.id, ...preparationEvidence]),
      sourceRefs: [...sourceRefsForStatus('preparing_departure'), ...preparationEvidence],
      lastUpdatedAtTurn: turn,
    });
  }

  return buildState({
    status: 'not_started',
    routeId: null,
    locationScopeId: 'qingmao_mountain',
    regionScopeId: 'qingmao',
    authority: 'start_profile',
    sourceRefs: sourceRefsForStatus('not_started'),
    lastUpdatedAtTurn: null,
  });
}

function repairConsistentState(raw: RouteLocationState, turn: number): RouteLocationState {
  switch (raw.status) {
    case 'not_started':
      return buildState({
        ...raw,
        routeId: null,
        locationScopeId: 'qingmao_mountain',
        regionScopeId: 'qingmao',
        lastUpdatedAtTurn: raw.lastUpdatedAtTurn,
      });
    case 'preparing_departure':
      return buildState({
        ...raw,
        locationScopeId: 'qingmao_mountain',
        regionScopeId: 'qingmao',
        lastUpdatedAtTurn: raw.lastUpdatedAtTurn ?? turn,
      });
    case 'route_in_progress':
      return buildState({
        ...raw,
        routeId: raw.routeId || PRIMARY_ROUTE_ID,
        locationScopeId: 'qingmao_exit_path',
        regionScopeId: 'qingmao',
        lastUpdatedAtTurn: raw.lastUpdatedAtTurn ?? turn,
      });
    case 'outer_edge_projection':
      return buildState({
        ...raw,
        routeId: raw.routeId || PRIMARY_ROUTE_ID,
        locationScopeId: 'southern_border_outer_edge',
        regionScopeId: 'southern_border_outer_edge',
        lastUpdatedAtTurn: raw.lastUpdatedAtTurn ?? turn,
      });
    case 'blocked':
    default:
      return buildState({
        ...raw,
        routeId: null,
        locationScopeId: 'unknown_conservative',
        regionScopeId: 'unknown_conservative',
        lastUpdatedAtTurn: raw.lastUpdatedAtTurn ?? turn,
      });
  }
}

export function normalizeRouteLocationState(
  input?: Partial<RouteLocationState> | null,
  turnFallback = 0,
  livingWorldState?: Partial<LivingWorldState> | null,
): RouteLocationState {
  if (!hasMeaningfulRawRouteLocationState(input)) {
    return deriveRouteLocationStateFromLivingWorld(livingWorldState, turnFallback);
  }

  const raw = objectRecord(input);
  const status = STATUS_SET.has(raw.status) ? raw.status as RouteLocationStatus : null;
  const routeId = raw.routeId === null || raw.routeId === undefined || raw.routeId === ''
    ? null
    : (typeof raw.routeId === 'string' && ROUTE_ID_SET.has(raw.routeId) ? raw.routeId : undefined);
  const locationScopeId = LOCATION_SCOPE_SET.has(raw.locationScopeId) ? raw.locationScopeId as RouteLocationScopeId : null;
  const regionScopeId = REGION_SCOPE_SET.has(raw.regionScopeId) ? raw.regionScopeId as RouteRegionScopeId : null;
  const authority = AUTHORITY_SET.has(raw.authority) ? raw.authority as RouteLocationAuthority : null;
  const turn = finiteTurn(raw.lastUpdatedAtTurn, turnFallback);

  if (!status || routeId === undefined || !locationScopeId || !regionScopeId || !authority) {
    return buildState({
      status: 'blocked',
      routeId: null,
      locationScopeId: 'unknown_conservative',
      regionScopeId: 'unknown_conservative',
      authority: 'route_location_engine',
      evidenceLedgerEntryIds: stringArray(raw.evidenceLedgerEntryIds),
      sourceRefs: ['v110:a2:normalize_blocked'],
      lastUpdatedAtTurn: turn,
      migrationNote: 'routeLocationState contained invalid status, route, scope, or authority; normalized conservatively.',
    });
  }

  const normalized = buildState({
    status,
    routeId,
    locationScopeId,
    regionScopeId,
    authority,
    evidenceLedgerEntryIds: stringArray(raw.evidenceLedgerEntryIds),
    sourceRefs: stringArray(raw.sourceRefs).length > 0 ? stringArray(raw.sourceRefs) : sourceRefsForStatus(status),
    lastUpdatedAtTurn: raw.lastUpdatedAtTurn === null ? null : turn,
    migrationNote: typeof raw.migrationNote === 'string' && raw.migrationNote.trim()
      ? raw.migrationNote
      : undefined,
  });
  return repairConsistentState(normalized, turn);
}

export function createInitialRouteLocationState(
  input: Partial<RouteLocationState> = {},
): RouteLocationState {
  return normalizeRouteLocationState(input);
}

export function buildV110RouteLocationOverview(input: {
  routeLocationState?: Partial<RouteLocationState> | null;
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
} = {}): V110RouteLocationOverview {
  const state = normalizeRouteLocationState(
    input.routeLocationState,
    finiteTurn(input.turn ?? input.livingWorldState?.worldClock?.turn, 0),
    input.livingWorldState,
  );
  const card = statusCard(state.status);
  const locationLabel = scopeLabel(state.locationScopeId, 'location');
  const regionLabel = scopeLabel(state.regionScopeId, 'region');
  const visibleSourceRefs = sanitizeVisibleSourceRefs(state.sourceRefs);
  return {
    routeLocationState: state,
    statusLabel: card.label,
    locationLabel,
    regionLabel,
    publicSummary: `${card.publicSummary} 当前范围：${locationLabel} / ${regionLabel}。`,
    nextStep: card.nextStep,
    evidenceLedgerEntryIds: [...state.evidenceLedgerEntryIds],
    visibleSourceRefs,
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    boundaryLines: [...rulesFile.boundaries.visibleBoundaryLines],
    driftCheckpoints: [
      `status:${state.status}`,
      `route:${state.routeId || 'none'}`,
      `location:${state.locationScopeId}`,
      `region:${state.regionScopeId}`,
      `authority:${state.authority}`,
    ],
    statePatchApplied: false,
  };
}

export function resolveV110RouteLocationStateAction(input: {
  livingWorldState?: Partial<LivingWorldState> | null;
  routeLocationState?: Partial<RouteLocationState> | null;
  turn?: number;
} = {}): V110RouteLocationActionResolution {
  const turn = finiteTurn(input.turn ?? input.livingWorldState?.worldClock?.turn, 0);
  const derived = deriveRouteLocationStateFromLivingWorld(input.livingWorldState, turn);
  const nextState = normalizeRouteLocationState({
    ...derived,
    authority: 'route_location_engine',
    lastUpdatedAtTurn: turn,
  }, turn, input.livingWorldState);
  const overview = buildV110RouteLocationOverview({
    routeLocationState: nextState,
    livingWorldState: input.livingWorldState,
    turn,
  });
  const blocked = nextState.status === 'blocked';
  return {
    success: !blocked,
    blocked,
    actionId: ACTION_ID,
    message: blocked
      ? '路线/地点范围存在冲突，已保守阻断。'
      : '已同步路线/地点范围状态。',
    publicSummary: overview.publicSummary,
    routeLocationState: nextState,
    overview,
    visibleSourceRefs: overview.visibleSourceRefs,
    rejectedReasons: blocked ? ['route_location_state_blocked'] : [],
    forbiddenUpgrades: [...rulesFile.boundaries.forbiddenWrites],
  };
}

function fact(id: string, turn: number): PlayerKnownFact {
  return {
    id,
    scope: 'region',
    source: 'engine_result',
    summary: `${id} 已记录。`,
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v1.1.0-soak'],
  };
}

function goal(turn: number): LivingPlayerGoalEntry {
  return {
    id: 'goal_escape_qingmao',
    intentType: 'travel',
    targetRef: 'region:outside_qingmao',
    status: 'active',
    createdTurn: turn,
    lastUpdatedTurn: turn,
    rationale: '我要逃离青茅山，去南疆外缘找临时落脚点。',
    nextStepHints: ['route:southern_border_low_rank_route'],
    blockedByRefIds: [],
  };
}

function consequence(id: string, actionId: string, turn: number): LivingActionConsequenceEntry {
  return {
    id,
    actionId,
    turn,
    scope: 'region',
    publicSummary: `${actionId} 进入路线行动账本。`,
    effectRefs: [actionId],
    followUpRefs: ['gate:no_route_entered'],
  };
}

function soakState(input: {
  turn: number;
  facts?: string[];
  goal?: boolean;
  consequences?: Array<[string, string]>;
}): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn: input.turn,
      day: 1,
      phase: 'morning',
      lastActionId: input.consequences?.at(-1)?.[1] || null,
    },
    knownFacts: Object.fromEntries((input.facts || []).map(id => [id, fact(id, input.turn)])),
    hiddenFactRefs: {},
    regions: {},
    npcMemories: [],
    factionPressure: [],
    playerGoals: input.goal ? [goal(input.turn)] : [],
    actionConsequences: (input.consequences || []).map(([id, actionId]) => consequence(id, actionId, input.turn)),
    ifDeviations: [],
  };
}

export const V110_DETERMINISTIC_SOAK_SAMPLES: V110DeterministicSoakSample[] = [
  {
    id: 'T0-001',
    title: 'empty new save',
    state: soakState({ turn: 1 }),
    expectedStatus: 'not_started',
    expectedLocationScopeId: 'qingmao_mountain',
    expectedRegionScopeId: 'qingmao',
  },
  {
    id: 'T0-002',
    title: 'escape goal only',
    state: soakState({ turn: 6, goal: true }),
    expectedStatus: 'preparing_departure',
    expectedLocationScopeId: 'qingmao_mountain',
    expectedRegionScopeId: 'qingmao',
  },
  {
    id: 'T0-003',
    title: 'route preparation fact',
    state: soakState({ turn: 12, goal: true, facts: ['qingmao_escape_route_preparation_baseline'] }),
    expectedStatus: 'preparing_departure',
    expectedLocationScopeId: 'qingmao_mountain',
    expectedRegionScopeId: 'qingmao',
  },
  {
    id: 'T0-004',
    title: 'v018 route threshold',
    state: soakState({ turn: 18, goal: true, facts: ['v018_qingmao_route_entry_threshold_commitment'] }),
    expectedStatus: 'route_in_progress',
    expectedLocationScopeId: 'qingmao_exit_path',
    expectedRegionScopeId: 'qingmao',
  },
  {
    id: 'T0-005',
    title: 'v018 candidate continuation',
    state: soakState({ turn: 19, goal: true, facts: ['v018_qingmao_route_candidate_continuation_view'] }),
    expectedStatus: 'outer_edge_projection',
    expectedLocationScopeId: 'southern_border_outer_edge',
    expectedRegionScopeId: 'southern_border_outer_edge',
  },
  {
    id: 'T0-006',
    title: 'v100 continuity acceptance',
    state: soakState({ turn: 20, goal: true, facts: ['v100_qingmao_southern_border_continuity_acceptance'] }),
    expectedStatus: 'outer_edge_projection',
    expectedLocationScopeId: 'southern_border_outer_edge',
    expectedRegionScopeId: 'southern_border_outer_edge',
  },
  {
    id: 'T0-007',
    title: 'edited bad routeLocationState',
    rawRouteLocationState: {
      status: 'outer_edge_projection',
      routeId: 'shang_city_direct_route',
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
      authority: 'route_location_engine',
      evidenceLedgerEntryIds: ['manual_edit'],
      sourceRefs: ['manual_edit'],
      lastUpdatedAtTurn: 21,
    } as Partial<RouteLocationState>,
    expectedStatus: 'blocked',
    expectedLocationScopeId: 'unknown_conservative',
    expectedRegionScopeId: 'unknown_conservative',
  },
  {
    id: 'T0-008',
    title: 'hidden source refs are filtered',
    rawRouteLocationState: {
      status: 'route_in_progress',
      routeId: PRIMARY_ROUTE_ID,
      locationScopeId: 'qingmao_exit_path',
      regionScopeId: 'qingmao',
      authority: 'route_location_engine',
      evidenceLedgerEntryIds: ['v018_qingmao_route_entry_threshold_commitment'],
      sourceRefs: ['v110:a2:route_in_progress', 'hidden_ref_only:source_pointer'],
      lastUpdatedAtTurn: 22,
    },
    expectedStatus: 'route_in_progress',
    expectedLocationScopeId: 'qingmao_exit_path',
    expectedRegionScopeId: 'qingmao',
  },
];

export function buildV110DeterministicSoakReport(
  samples: V110DeterministicSoakSample[] = V110_DETERMINISTIC_SOAK_SAMPLES,
): V110DeterministicSoakResult[] {
  return samples.map(sample => {
    const actual = normalizeRouteLocationState(
      sample.rawRouteLocationState,
      sample.state?.worldClock?.turn ?? 0,
      sample.state,
    );
    const serialized = JSON.stringify(actual);
    const forbiddenWriteLeak = rulesFile.boundaries.forbiddenWrites.some(key => serialized.includes(`"${key}"`));
    const pass = (
      actual.status === sample.expectedStatus
      && actual.locationScopeId === sample.expectedLocationScopeId
      && actual.regionScopeId === sample.expectedRegionScopeId
      && !forbiddenWriteLeak
    );
    return {
      id: sample.id,
      title: sample.title,
      pass,
      expected: {
        status: sample.expectedStatus,
        locationScopeId: sample.expectedLocationScopeId,
        regionScopeId: sample.expectedRegionScopeId,
      },
      actual,
      forbiddenWriteLeak,
    };
  });
}
