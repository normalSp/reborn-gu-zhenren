import { normalizeLivingWorldState } from '../store/defaultLivingWorldState';
import type {
  HiddenFactRefState,
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingIfDeviationEntry,
  LivingNpcMemoryEntry,
  LivingPlayerGoalEntry,
  LivingRegionState,
  LivingWorldClock,
  LivingWorldState,
  PlayerKnownFact,
} from '../types';

export type LivingWorldPatchSource =
  | 'action_protocol'
  | 'living_world_engine'
  | 'story_canon_engine'
  | 'faction_engine'
  | 'test_fixture';

export interface LivingWorldPatchDraft {
  source: LivingWorldPatchSource | 'deepseek' | 'ui' | 'narrative_text';
  worldClock?: Partial<LivingWorldClock>;
  regions?: LivingRegionState[];
  knownFacts?: PlayerKnownFact[];
  hiddenFactRefs?: HiddenFactRefState[];
  npcMemories?: LivingNpcMemoryEntry[];
  factionPressure?: LivingFactionPressureEntry[];
  playerGoals?: LivingPlayerGoalEntry[];
  actionConsequences?: LivingActionConsequenceEntry[];
  ifDeviations?: LivingIfDeviationEntry[];
}

export interface LivingWorldPatchResult {
  state: LivingWorldState;
  applied: string[];
  rejected: string[];
}

const BLOCKED_PATCH_SOURCES = new Set(['deepseek', 'ui', 'narrative_text']);

function upsertRecord<T extends { id: string }>(
  current: Record<string, T>,
  entries: Record<string, T>,
  applied: string[],
  label: string,
): Record<string, T> {
  const next = { ...current };
  for (const [id, entry] of Object.entries(entries)) {
    if (!id) continue;
    next[id] = entry;
    applied.push(`${label}:${id}`);
  }
  return next;
}

function upsertRegions(
  current: Record<string, LivingRegionState>,
  entries: Record<string, LivingRegionState>,
  applied: string[],
): Record<string, LivingRegionState> {
  const next = { ...current };
  for (const [regionId, entry] of Object.entries(entries)) {
    if (!regionId) continue;
    next[regionId] = entry;
    applied.push(`region:${regionId}`);
  }
  return next;
}

function upsertArray<T extends { id: string }>(
  current: T[],
  entries: T[],
  applied: string[],
  label: string,
): T[] {
  if (entries.length === 0) return current;
  const byId = new Map(current.map(entry => [entry.id, entry] as const));
  for (const entry of entries) {
    byId.set(entry.id, entry);
    applied.push(`${label}:${entry.id}`);
  }
  return [...byId.values()];
}

function normalizePatchDraft(draft: LivingWorldPatchDraft, turn: number): LivingWorldState {
  const regionRecord = Object.fromEntries((draft.regions || []).map(region => [region.regionId, region]));
  const knownFactRecord = Object.fromEntries((draft.knownFacts || []).map(fact => [fact.id, fact]));
  const hiddenRefRecord = Object.fromEntries((draft.hiddenFactRefs || []).map(ref => [ref.id, ref]));

  return normalizeLivingWorldState({
    worldClock: draft.worldClock as LivingWorldClock | undefined,
    regions: regionRecord,
    knownFacts: knownFactRecord,
    hiddenFactRefs: hiddenRefRecord,
    npcMemories: draft.npcMemories,
    factionPressure: draft.factionPressure,
    playerGoals: draft.playerGoals,
    actionConsequences: draft.actionConsequences,
    ifDeviations: draft.ifDeviations,
  }, turn);
}

export function applyLivingWorldPatch(
  stateInput: Partial<LivingWorldState> | null | undefined,
  draft: LivingWorldPatchDraft,
): LivingWorldPatchResult {
  const state = normalizeLivingWorldState(stateInput);
  const rejected: string[] = [];
  const applied: string[] = [];

  if (BLOCKED_PATCH_SOURCES.has(draft.source)) {
    return {
      state,
      applied,
      rejected: [`source_not_allowed:${draft.source}`],
    };
  }

  const normalizedPatch = normalizePatchDraft(draft, state.worldClock.turn);
  const shouldPatchClock = Boolean(draft.worldClock && Object.keys(draft.worldClock).length > 0);
  const nextState: LivingWorldState = {
    ...state,
    worldClock: shouldPatchClock ? normalizedPatch.worldClock : state.worldClock,
    regions: upsertRegions(state.regions, normalizedPatch.regions, applied),
    knownFacts: upsertRecord(state.knownFacts, normalizedPatch.knownFacts, applied, 'knownFact'),
    hiddenFactRefs: upsertRecord(state.hiddenFactRefs, normalizedPatch.hiddenFactRefs, applied, 'hiddenFactRef'),
    npcMemories: upsertArray(state.npcMemories, normalizedPatch.npcMemories, applied, 'npcMemory'),
    factionPressure: upsertArray(state.factionPressure, normalizedPatch.factionPressure, applied, 'factionPressure'),
    playerGoals: upsertArray(state.playerGoals, normalizedPatch.playerGoals, applied, 'playerGoal'),
    actionConsequences: upsertArray(state.actionConsequences, normalizedPatch.actionConsequences, applied, 'actionConsequence'),
    ifDeviations: upsertArray(state.ifDeviations, normalizedPatch.ifDeviations, applied, 'ifDeviation'),
  };

  if (shouldPatchClock) {
    applied.push('worldClock');
  }

  return {
    state: normalizeLivingWorldState(nextState),
    applied,
    rejected,
  };
}
