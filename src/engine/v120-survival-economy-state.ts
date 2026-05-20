import type {
  SurvivalEconomyAuthority,
  SurvivalEconomyLedgerCategory,
  SurvivalEconomyLedgerEntry,
  SurvivalEconomyPressureLevel,
  SurvivalEconomyState,
  SurvivalEconomyStatus,
} from '../types';
import type {
  V120LowRankSurvivalEconomyProjection,
  V120SurvivalPressureItem,
  V120SurvivalPressureItemStatus,
} from './v120-low-rank-survival-economy-projection';

export const V120_SURVIVAL_ECONOMY_LEDGER_ACTION_ID = 'v120_survival_economy_ledger_sync' as const;

const SURVIVAL_ECONOMY_SCHEMA_VERSION = 1 as const;
const MAX_LEDGER_ENTRIES = 24;

const STATUSES = new Set<SurvivalEconomyStatus>(['not_started', 'pressure_tracked', 'blocked']);
const AUTHORITIES = new Set<SurvivalEconomyAuthority>(['migration_default', 'survival_economy_engine']);
const CATEGORIES = new Set<SurvivalEconomyLedgerCategory>([
  'route_supply',
  'gu_upkeep',
  'refinement_preparation',
  'trade_window',
  'gray_trade_boundary',
  'anti_farm',
]);
const PRESSURE_LEVELS = new Set<SurvivalEconomyPressureLevel>(['low', 'medium', 'high']);

const STATUS_PRESSURE: Record<V120SurvivalPressureItemStatus, SurvivalEconomyPressureLevel> = {
  needs_context: 'low',
  visible: 'medium',
  deferred: 'medium',
};

export interface V120SurvivalEconomyLedgerResolution {
  success: boolean;
  actionId: typeof V120_SURVIVAL_ECONOMY_LEDGER_ACTION_ID;
  message: string;
  survivalEconomyState: SurvivalEconomyState;
  projection: V120LowRankSurvivalEconomyProjection;
  applied: string[];
  rejected: string[];
  forbiddenUpgrades: string[];
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
}

function finiteNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function finiteTurn(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(finiteNumber(value, fallback)));
}

function clampPressureScore(value: unknown, fallback = 0): number {
  return Math.max(0, Math.min(100, Math.round(finiteNumber(value, fallback))));
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

function hasMeaningfulState(input: unknown): boolean {
  const raw = objectRecord(input);
  return ['status', 'authority', 'ledger', 'pressureScore', 'evidenceRefs', 'sourceRefs'].some(key => key in raw);
}

function buildDefaultState(migrationNote?: string): SurvivalEconomyState {
  const state: SurvivalEconomyState = {
    schemaVersion: SURVIVAL_ECONOMY_SCHEMA_VERSION,
    status: 'not_started',
    authority: 'migration_default',
    pressureScore: 0,
    ledger: [],
    evidenceRefs: [],
    sourceRefs: ['v1.2.0-b2:v24-default'],
    lastUpdatedAtTurn: null,
  };
  if (migrationNote) state.migrationNote = migrationNote;
  return state;
}

function normalizeLedgerEntry(value: unknown, turn: number): SurvivalEconomyLedgerEntry | null {
  const raw = objectRecord(value);
  const id = stringValue(raw.id);
  const category = CATEGORIES.has(raw.category) ? raw.category as SurvivalEconomyLedgerCategory : null;
  if (!id || !category) return null;
  const pressure = PRESSURE_LEVELS.has(raw.pressure) ? raw.pressure as SurvivalEconomyPressureLevel : 'low';
  return {
    id,
    turn: finiteTurn(raw.turn, turn),
    category,
    pressure,
    publicSummary: stringValue(raw.publicSummary),
    nextStep: stringValue(raw.nextStep),
    evidenceRefs: stringArray(raw.evidenceRefs),
    sourceRefs: stringArray(raw.sourceRefs),
    blockedWrites: stringArray(raw.blockedWrites),
  };
}

export function createInitialSurvivalEconomyState(
  input: Partial<SurvivalEconomyState> = {},
): SurvivalEconomyState {
  if (!hasMeaningfulState(input)) return buildDefaultState();
  return normalizeSurvivalEconomyState(input);
}

export function normalizeSurvivalEconomyState(
  input?: Partial<SurvivalEconomyState> | null,
  turnFallback = 0,
): SurvivalEconomyState {
  if (!hasMeaningfulState(input)) {
    return buildDefaultState('v24 migration default: survivalEconomyState starts as an empty pressure ledger.');
  }

  const raw = objectRecord(input);
  const turn = raw.lastUpdatedAtTurn === null || raw.lastUpdatedAtTurn === undefined
    ? turnFallback
    : finiteTurn(raw.lastUpdatedAtTurn, turnFallback);
  const ledger = Array.isArray(raw.ledger)
    ? raw.ledger.map(entry => normalizeLedgerEntry(entry, turn)).filter((entry): entry is SurvivalEconomyLedgerEntry => Boolean(entry)).slice(-MAX_LEDGER_ENTRIES)
    : [];
  const status = STATUSES.has(raw.status)
    ? raw.status as SurvivalEconomyStatus
    : (ledger.length > 0 ? 'pressure_tracked' : 'not_started');
  const authority = AUTHORITIES.has(raw.authority)
    ? raw.authority as SurvivalEconomyAuthority
    : null;

  if (!authority) {
    return {
      ...buildDefaultState('survivalEconomyState contained invalid authority; normalized conservatively.'),
      status: 'blocked',
      authority: 'survival_economy_engine',
      lastUpdatedAtTurn: turn,
    };
  }

  const normalizedStatus = status === 'not_started' && ledger.length > 0 ? 'pressure_tracked' : status;
  return {
    schemaVersion: SURVIVAL_ECONOMY_SCHEMA_VERSION,
    status: normalizedStatus,
    authority,
    pressureScore: clampPressureScore(raw.pressureScore, ledger.length > 0 ? Math.min(100, ledger.length * 8) : 0),
    ledger,
    evidenceRefs: stringArray(raw.evidenceRefs),
    sourceRefs: stringArray(raw.sourceRefs).length > 0 ? stringArray(raw.sourceRefs) : ['v1.2.0-b2:normalize'],
    lastUpdatedAtTurn: raw.lastUpdatedAtTurn === null || raw.lastUpdatedAtTurn === undefined ? null : turn,
    ...(typeof raw.migrationNote === 'string' && raw.migrationNote.trim() ? { migrationNote: raw.migrationNote } : {}),
  };
}

function entryPressure(item: V120SurvivalPressureItem): SurvivalEconomyPressureLevel {
  if (item.id === 'anti_farm') return 'high';
  return STATUS_PRESSURE[item.status];
}

function entryFromPressureItem(item: V120SurvivalPressureItem, turn: number): SurvivalEconomyLedgerEntry {
  return {
    id: `v120b2_${item.id}_t${turn}`,
    turn,
    category: item.id,
    pressure: entryPressure(item),
    publicSummary: item.summary,
    nextStep: item.nextStep,
    evidenceRefs: [...item.evidenceRefs],
    sourceRefs: [...item.sourceRefs],
    blockedWrites: [...item.forbiddenWrites],
  };
}

function scoreLedger(ledger: SurvivalEconomyLedgerEntry[]): number {
  const score = ledger.reduce((sum, entry) => {
    if (entry.pressure === 'high') return sum + 20;
    if (entry.pressure === 'medium') return sum + 12;
    return sum + 6;
  }, 0);
  return Math.min(100, score);
}

export function resolveV120SurvivalEconomyLedgerSync(input: {
  projection: V120LowRankSurvivalEconomyProjection;
  previousState?: Partial<SurvivalEconomyState> | null;
  turn?: number;
}): V120SurvivalEconomyLedgerResolution {
  const turn = finiteTurn(input.turn, 0);
  const previous = normalizeSurvivalEconomyState(input.previousState, turn);
  const projection = input.projection;

  if (projection.status !== 'pressure_visible') {
    return {
      success: false,
      actionId: V120_SURVIVAL_ECONOMY_LEDGER_ACTION_ID,
      message: '当前缺少路线或经济压力证据，暂不登记低阶生存经济账本。',
      survivalEconomyState: previous,
      projection,
      applied: [],
      rejected: ['needs_route_or_economy_pressure_context'],
      forbiddenUpgrades: [...projection.forbiddenWrites],
    };
  }

  const nextEntries = projection.pressureItems.map(item => entryFromPressureItem(item, turn));
  const replacedIds = new Set(nextEntries.map(entry => entry.id));
  const mergedLedger = [
    ...previous.ledger.filter(entry => !replacedIds.has(entry.id)),
    ...nextEntries,
  ].slice(-MAX_LEDGER_ENTRIES);

  const survivalEconomyState: SurvivalEconomyState = {
    schemaVersion: SURVIVAL_ECONOMY_SCHEMA_VERSION,
    status: 'pressure_tracked',
    authority: 'survival_economy_engine',
    pressureScore: scoreLedger(nextEntries),
    ledger: mergedLedger,
    evidenceRefs: unique(nextEntries.flatMap(entry => entry.evidenceRefs)),
    sourceRefs: unique([
      'v1.2.0-b2:D-122-001',
      'v1.2.0-b2:D-122-002',
      ...projection.visibleSourceRefs,
      ...nextEntries.flatMap(entry => entry.sourceRefs),
    ]),
    lastUpdatedAtTurn: turn,
  };

  return {
    success: true,
    actionId: V120_SURVIVAL_ECONOMY_LEDGER_ACTION_ID,
    message: '已登记低阶生存经济压力账本；仍不结算库存、价格、交易、消耗或奖励。',
    survivalEconomyState,
    projection,
    applied: ['survivalEconomyState'],
    rejected: [],
    forbiddenUpgrades: [...projection.forbiddenWrites],
  };
}
