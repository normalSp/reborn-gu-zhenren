import battlefieldRulesRaw from '../canon/battlefield-combat-rules.json';
import type {
  BattleResolutionStep,
  BattlefieldAction,
  BattlefieldActionResolution,
  BattlefieldActionValidation,
  BattlefieldActiveEffect,
  BattlefieldCell,
  BattlefieldCellFlag,
  BattlefieldCombatResult,
  BattlefieldCombatState,
  BattlefieldPendingAction,
  BattlefieldUnit,
  GuExpressionCost,
  GuExpressionSpec,
  KillerMoveExpressionSpec,
} from '../types';
import {
  calcDamage,
  calcHitRate,
  createSeededRng,
  getRealmCoefficients,
  rollCrit,
  rollHit,
} from './combat-formulas';
import {
  getGuExpressionSpec,
  getKillerMoveExpressionSpec,
  isGuForbidden,
  isGuNormalCombatUsable,
  isGuPassive,
  isGuSceneGated,
} from './gu-expression-registry';

type ShapeRule = {
  targetPolicy: string;
  blockedByCover: boolean;
  allowsMove?: boolean;
};

type BattlefieldRules = {
  grid: { width: number; height: number };
  defaults: {
    terrainId: string;
    movementRange: number;
    attack: number;
    defense: number;
    accuracy: number;
    evasion: number;
    daoMarks: number;
    baseGuDamageMultiplier: number;
    baseKillerMoveDamageMultiplier: number;
    statusDuration: number;
    hitCoverPenalty: number;
    coverDamageMultiplier: number;
    arrayNodeDamageMultiplier: number;
    hazardDamageOnEnter: number;
    hinderedHitPenalty: number;
    favoredHitBonus: number;
    favoredDamageMultiplier: number;
    hinderedDamageMultiplier: number;
  };
  escape: {
    baseChance: number;
    edgeBonus: number;
    allySideBonus: number;
    enemyAdjacentPenalty: number;
    boundPenalty: number;
    minChance: number;
    maxChance: number;
  };
  terrainTags: Record<string, string[]>;
  cellFlagTags: Record<BattlefieldCellFlag, string[]>;
  cooldown: { tick: string; minimumActiveCooldown: number };
  pending: {
    defaultInterruptBacklashDamage: number;
    interruptionCooldownPenalty: number;
  };
  group: {
    morale: {
      min: number;
      max: number;
      defaultPlayer: number;
      defaultEnemy: number;
      lowThreshold: number;
      highThreshold: number;
      lowHitPenalty: number;
      highDamageMultiplier: number;
      rallyGain: number;
      ambushLoss: number;
      allyDownLoss: number;
      enemyDownGain: number;
      protectedDownLoss: number;
    };
    assist: { duration: number; range: number; hitBonus: number; damageMultiplier: number; maxStacks: number };
    guard: { duration: number; damageReduction: number; adjacentRequired: boolean };
    ambush: { firstStrikeDamageMultiplier: number; observeRevealCount: number; hiddenEvasionBonus: number };
    formation: { controlDuration: number; controlRange: number; rallyMoraleBonus: number; arrayNodeDamageMultiplier: number; breakMoraleDelta: number };
    thirdParty: { entryRound: number; threatTargetThreshold: number; damageMultiplier: number };
    objectives: { escortEdgeRequired: boolean; protectHpThreshold: number; keyEnemyMoraleGain: number };
    retreat: { objectivePenalty: number; allyCoverBonus: number };
  };
  guShapes: Record<string, ShapeRule>;
  killerMoveShapes: Record<string, ShapeRule>;
};

export interface CreateBattlefieldCombatInput {
  battleId: string;
  seed?: string | number;
  round?: number;
  phase?: BattlefieldCombatState['phase'];
  cells?: Array<Partial<BattlefieldCell> & Pick<BattlefieldCell, 'id'>>;
  units: BattlefieldUnit[];
  mode?: BattlefieldCombatState['mode'];
  activeUnitId?: string;
  actedUnitIdsThisRound?: string[];
  morale?: BattlefieldCombatState['morale'];
  objectives?: BattlefieldCombatState['objectives'];
  ambush?: BattlefieldCombatState['ambush'];
  thirdParties?: BattlefieldCombatState['thirdParties'];
  activeTerrainId?: string;
  activeFormationId?: string;
  eventWindows?: BattlefieldCombatState['eventWindows'];
}

const rules = battlefieldRulesRaw as BattlefieldRules;

function cellId(x: number, y: number): string {
  return `c${x}_${y}`;
}

function defaultValidation(action: BattlefieldAction, overrides: Partial<BattlefieldActionValidation> = {}): BattlefieldActionValidation {
  return {
    ok: false,
    actorId: action.actorId,
    actionType: action.type,
    validTargetCellIds: [],
    affectedCellIds: [],
    targetUnitIds: [],
    tags: [],
    ...overrides,
  };
}

function cloneCell(cell: BattlefieldCell): BattlefieldCell {
  return {
    ...cell,
    flags: [...cell.flags],
    dangerTags: cell.dangerTags ? [...cell.dangerTags] : undefined,
  };
}

function cloneUnit(unit: BattlefieldUnit): BattlefieldUnit {
  return {
    ...unit,
    essence: unit.essence ? { ...unit.essence } : undefined,
    guNames: [...unit.guNames],
    statusEffects: [...unit.statusEffects],
    objectiveTags: unit.objectiveTags ? [...unit.objectiveTags] : undefined,
    cooldowns: { ...(unit.cooldowns ?? {}) },
    killerMoveNames: unit.killerMoveNames ? [...unit.killerMoveNames] : undefined,
    daoMarks: typeof unit.daoMarks === 'object' && unit.daoMarks ? { ...unit.daoMarks } : unit.daoMarks,
  };
}

function cloneState(state: BattlefieldCombatState): BattlefieldCombatState {
  return {
    ...state,
    grid: {
      ...state.grid,
      cells: state.grid.cells.map(cloneCell),
    },
    units: state.units.map(cloneUnit),
    eventWindows: [...state.eventWindows],
    pendingResolution: state.pendingResolution.map(step => ({
      ...step,
      targetIds: step.targetIds ? [...step.targetIds] : undefined,
      affectedCellIds: step.affectedCellIds ? [...step.affectedCellIds] : undefined,
      statusEffects: step.statusEffects ? [...step.statusEffects] : undefined,
      tags: [...step.tags],
      visual: { ...step.visual },
      resourceCost: step.resourceCost ? { ...step.resourceCost } : undefined,
    })),
    activeEffects: state.activeEffects?.map(effect => ({
      ...effect,
      targetIds: effect.targetIds ? [...effect.targetIds] : undefined,
      affectedCellIds: [...effect.affectedCellIds],
      statusEffects: [...effect.statusEffects],
      tags: [...effect.tags],
    })),
    actedUnitIdsThisRound: state.actedUnitIdsThisRound ? [...state.actedUnitIdsThisRound] : undefined,
    morale: state.morale ? { ...state.morale } : undefined,
    objectives: state.objectives?.map(objective => ({ ...objective })),
    ambush: state.ambush ? { ...state.ambush, hiddenUnitIds: [...state.ambush.hiddenUnitIds] } : undefined,
    thirdParties: state.thirdParties?.map(party => ({ ...party, unitIds: [...party.unitIds] })),
    pendingActions: state.pendingActions?.map(action => ({
      ...action,
      targetUnitIds: [...action.targetUnitIds],
      affectedCellIds: [...action.affectedCellIds],
      resourceCost: action.resourceCost ? { ...action.resourceCost } : undefined,
    })),
    result: state.result ? { ...state.result } : state.result,
  };
}

function makeStep(
  state: BattlefieldCombatState,
  kind: BattleResolutionStep['kind'],
  data: Omit<BattleResolutionStep, 'id' | 'round' | 'kind'>,
): BattleResolutionStep {
  const index = (state.pendingResolution?.length ?? 0) + 1;
  return {
    id: `${state.battleId}_${state.round}_${kind}_${index}`,
    round: state.round,
    kind,
    ...data,
  };
}

function appendSteps(state: BattlefieldCombatState, steps: BattleResolutionStep[]): BattlefieldCombatState {
  return {
    ...state,
    pendingResolution: [...state.pendingResolution, ...steps],
  };
}

function failureResolution(
  state: BattlefieldCombatState,
  action: BattlefieldAction,
  reason: string,
  sourceName?: string,
  tags: string[] = [],
): BattlefieldActionResolution {
  const validation = defaultValidation(action, { reason, sourceName, tags });
  const step = makeStep(state, 'failure', {
    actorId: action.actorId,
    sourceName,
    message: reason,
    blockedReason: reason,
    visual: {
      motif: 'action_blocked',
      primaryTint: '#8B3A3A',
      motion: 'shake',
      intensity: 'subtle',
    },
    tags: ['failure', ...tags],
  });
  const nextState = appendSteps(state, [step]);
  return { state: nextState, steps: [step], validation };
}

function getCell(state: BattlefieldCombatState, id?: string): BattlefieldCell | undefined {
  if (!id) return undefined;
  return state.grid.cells.find(cell => cell.id === id);
}

function getUnit(state: BattlefieldCombatState, id?: string): BattlefieldUnit | undefined {
  if (!id) return undefined;
  return state.units.find(unit => unit.id === id);
}

function getActor(state: BattlefieldCombatState, action: BattlefieldAction): BattlefieldUnit | undefined {
  const actor = getUnit(state, action.actorId);
  return actor && actor.hp > 0 ? actor : undefined;
}

function isHostile(a: BattlefieldUnit, b: BattlefieldUnit): boolean {
  if (a.side === 'neutral' || b.side === 'neutral') return false;
  if (a.side === 'enemy') return b.side === 'player' || b.side === 'ally';
  return b.side === 'enemy';
}

function isPlayerSide(unit: BattlefieldUnit): boolean {
  return unit.side === 'player' || unit.side === 'ally';
}

function moraleKey(unit: BattlefieldUnit): 'player' | 'enemy' | 'neutral' {
  if (unit.side === 'enemy') return 'enemy';
  if (unit.side === 'neutral') return 'neutral';
  return 'player';
}

function clampMorale(value: number): number {
  return Math.max(rules.group.morale.min, Math.min(rules.group.morale.max, Math.round(value)));
}

function moraleFor(state: BattlefieldCombatState, unit: BattlefieldUnit): number {
  const key = moraleKey(unit);
  if (key === 'neutral') return state.morale?.neutral ?? 50;
  return state.morale?.[key] ?? (key === 'player' ? rules.group.morale.defaultPlayer : rules.group.morale.defaultEnemy);
}

function updateMorale(state: BattlefieldCombatState, key: 'player' | 'enemy' | 'neutral', delta: number): BattlefieldCombatState {
  const morale = {
    player: state.morale?.player ?? rules.group.morale.defaultPlayer,
    enemy: state.morale?.enemy ?? rules.group.morale.defaultEnemy,
    neutral: state.morale?.neutral,
  };
  const current = key === 'neutral' ? morale.neutral ?? 50 : morale[key];
  return { ...state, morale: { ...morale, [key]: clampMorale(current + delta) } };
}

function groupVisible(unit: BattlefieldUnit): boolean {
  return unit.revealed !== false;
}

function sameSide(a: BattlefieldUnit, b: BattlefieldUnit): boolean {
  if (a.side === 'enemy') return b.side === 'enemy';
  if (a.side === 'neutral') return b.side === 'neutral';
  return b.side === 'player' || b.side === 'ally';
}

function manhattan(a: BattlefieldCell, b: BattlefieldCell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isAligned(a: BattlefieldCell, b: BattlefieldCell): boolean {
  return a.x === b.x || a.y === b.y;
}

function isEdgeCell(cell: BattlefieldCell): boolean {
  return cell.x === 0 || cell.y === 0 || cell.x === rules.grid.width - 1 || cell.y === rules.grid.height - 1;
}

function cellsBetween(state: BattlefieldCombatState, from: BattlefieldCell, to: BattlefieldCell): BattlefieldCell[] {
  if (!isAligned(from, to)) return [];
  const cells: BattlefieldCell[] = [];
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let x = from.x + dx;
  let y = from.y + dy;
  while (x !== to.x || y !== to.y) {
    const cell = state.grid.cells.find(item => item.x === x && item.y === y);
    if (cell) cells.push(cell);
    x += dx;
    y += dy;
  }
  return cells;
}

function hasCover(cell: BattlefieldCell): boolean {
  return cell.flags.includes('cover') || cell.flags.includes('concealment');
}

function lineBlockedByCover(state: BattlefieldCombatState, from: BattlefieldCell, to: BattlefieldCell): boolean {
  if (!isAligned(from, to)) return false;
  return cellsBetween(state, from, to).some(hasCover) || hasCover(to);
}

function tagsForCell(state: BattlefieldCombatState, cell: BattlefieldCell): string[] {
  const tags = new Set<string>();
  for (const tag of rules.terrainTags[cell.terrainId] ?? [cell.terrainId]) tags.add(tag);
  for (const tag of rules.terrainTags[state.activeTerrainId ?? ''] ?? []) tags.add(tag);
  for (const flag of cell.flags) {
    for (const tag of rules.cellFlagTags[flag] ?? [flag]) tags.add(tag);
  }
  return [...tags];
}

function terrainAffinity(spec: GuExpressionSpec | KillerMoveExpressionSpec, state: BattlefieldCombatState, targetCells: BattlefieldCell[]) {
  const favored = 'terrainAffinity' in spec ? spec.terrainAffinity.favored : [];
  const hindered = 'terrainAffinity' in spec ? spec.terrainAffinity.hindered : [];
  const targetTags = new Set(targetCells.flatMap(cell => tagsForCell(state, cell)));
  const isFavored = favored.some(tag => targetTags.has(tag));
  const isHindered = hindered.some(tag => targetTags.has(tag));
  return { isFavored, isHindered, tags: [...targetTags] };
}

function daoMarksFor(unit: BattlefieldUnit, path: string): number {
  if (typeof unit.daoMarks === 'number') return unit.daoMarks;
  if (unit.daoMarks && typeof unit.daoMarks[path] === 'number') return unit.daoMarks[path];
  return rules.defaults.daoMarks;
}

function withCellOccupants(cells: BattlefieldCell[], units: BattlefieldUnit[]): BattlefieldCell[] {
  const occupants = new Map<string, string>();
  for (const unit of units) {
    if (unit.hp > 0) occupants.set(unit.cellId, unit.id);
  }
  return cells.map(cell => ({ ...cell, occupantId: occupants.get(cell.id) ?? null }));
}

function normalizeUnit(unit: BattlefieldUnit): BattlefieldUnit {
  return {
    attack: rules.defaults.attack,
    defense: rules.defaults.defense,
    accuracy: rules.defaults.accuracy,
    evasion: rules.defaults.evasion,
    ...unit,
    essence: unit.essence ? { ...unit.essence } : { current: 100, max: 100, type: 'primeval' },
    guNames: [...unit.guNames],
    statusEffects: [...unit.statusEffects],
    killerMoveNames: unit.killerMoveNames ? [...unit.killerMoveNames] : [],
    cooldowns: { ...(unit.cooldowns ?? {}) },
    objectiveTags: unit.objectiveTags ? [...unit.objectiveTags] : undefined,
  };
}

function buildDefaultCells(): BattlefieldCell[] {
  const cells: BattlefieldCell[] = [];
  for (let y = 0; y < rules.grid.height; y += 1) {
    for (let x = 0; x < rules.grid.width; x += 1) {
      cells.push({
        id: cellId(x, y),
        x,
        y,
        terrainId: rules.defaults.terrainId,
        flags: [],
        occupantId: null,
      });
    }
  }
  return cells;
}

function validateOccupancy(cells: BattlefieldCell[], units: BattlefieldUnit[]): void {
  const cellsById = new Map(cells.map(cell => [cell.id, cell]));
  const occupied = new Map<string, string>();
  for (const unit of units) {
    if (!cellsById.has(unit.cellId)) {
      throw new Error(`unit_out_of_bounds:${unit.id}:${unit.cellId}`);
    }
    const occupant = occupied.get(unit.cellId);
    if (occupant) {
      throw new Error(`duplicate_occupant:${unit.cellId}:${occupant}:${unit.id}`);
    }
    if (unit.hp > 0) occupied.set(unit.cellId, unit.id);
  }
}

export function createBattlefieldCombatState(input: CreateBattlefieldCombatInput): BattlefieldCombatState {
  const defaultCells = buildDefaultCells();
  const cellOverrides = new Map(input.cells?.map(cell => [cell.id, cell]) ?? []);
  const cells = defaultCells.map(cell => {
    const override = cellOverrides.get(cell.id);
    return {
      ...cell,
      ...override,
      flags: override?.flags ? [...override.flags] : [...cell.flags],
      occupantId: null,
    };
  });
  const units = input.units.map(normalizeUnit);
  validateOccupancy(cells, units);
  return {
    battleId: input.battleId,
    seed: input.seed ?? input.battleId,
    round: input.round ?? 1,
    phase: input.phase ?? 'player_turn',
    mode: input.mode ?? 'duel',
    grid: {
      width: 5,
      height: 3,
      cells: withCellOccupants(cells, units),
    },
    units,
    activeUnitId: input.activeUnitId,
    actedUnitIdsThisRound: input.actedUnitIdsThisRound ? [...input.actedUnitIdsThisRound] : [],
    morale: input.morale ? { ...input.morale } : undefined,
    objectives: input.objectives?.map(objective => ({ ...objective })),
    ambush: input.ambush ? { ...input.ambush, hiddenUnitIds: [...input.ambush.hiddenUnitIds] } : undefined,
    thirdParties: input.thirdParties?.map(party => ({ ...party, unitIds: [...party.unitIds] })),
    activeTerrainId: input.activeTerrainId,
    activeFormationId: input.activeFormationId,
    activeEffects: [],
    pendingActions: [],
    result: null,
    eventWindows: input.eventWindows ?? [],
    pendingResolution: [],
  };
}

export function createBattlefieldGroupCombatState(input: CreateBattlefieldCombatInput): BattlefieldCombatState {
  const state = createBattlefieldCombatState({
    ...input,
    mode: 'group',
    morale: input.morale ?? {
      player: rules.group.morale.defaultPlayer,
      enemy: rules.group.morale.defaultEnemy,
    },
    actedUnitIdsThisRound: input.actedUnitIdsThisRound ?? [],
  });
  return {
    ...state,
    activeUnitId: input.activeUnitId ?? nextFriendlyActor(state, []),
    eventWindows: input.eventWindows ?? ['scout', 'action', 'counter', 'settlement'],
  };
}

function cellsForPolicy(
  state: BattlefieldCombatState,
  actor: BattlefieldUnit,
  shape: string,
  minRange: number,
  maxRange: number,
): BattlefieldCell[] {
  const actorCell = getCell(state, actor.cellId);
  if (!actorCell) return [];
  if (shape === 'scene' || shape === 'scene_ritual') return [...state.grid.cells];

  return state.grid.cells.filter(cell => {
    const distance = manhattan(actorCell, cell);
    if (shape === 'self' || shape === 'dome' || shape === 'pre_battle') return cell.id === actorCell.id;
    if (shape === 'self_or_adjacent' || shape === 'touch_or_scene') return distance <= maxRange;
    if (shape === 'adjacent') return distance >= Math.max(1, minRange) && distance <= maxRange;
    if (shape === 'line' || shape === 'line_wall' || shape === 'line_pull') {
      return isAligned(actorCell, cell) && distance >= minRange && distance <= maxRange;
    }
    if (shape === 'multi_line' || shape === 'moving_column') {
      return isAligned(actorCell, cell) && distance >= Math.max(1, minRange) && distance <= maxRange;
    }
    if (shape === 'dash') {
      return isAligned(actorCell, cell) && distance >= Math.max(1, minRange) && distance <= maxRange && !cell.occupantId;
    }
    if (shape === 'teleport_short' || shape === 'shadow_path') {
      return distance >= Math.max(1, minRange) && distance <= maxRange && !cell.occupantId;
    }
    if (shape === 'aura' || shape === 'self_aura') return distance <= maxRange;
    if (shape === 'cone') return distance >= minRange && distance <= maxRange && Math.abs(actorCell.y - cell.y) <= Math.max(1, Math.ceil(distance / 2));
    if (shape === 'sight') return distance >= minRange && distance <= maxRange && !lineBlockedByCover(state, actorCell, cell);
    return distance >= minRange && distance <= maxRange;
  });
}

function affectedCellsForTarget(
  state: BattlefieldCombatState,
  actor: BattlefieldUnit,
  targetCellId: string | undefined,
  shape: string,
  area: number,
): string[] {
  const actorCell = getCell(state, actor.cellId);
  const targetCell = getCell(state, targetCellId) ?? actorCell;
  if (!actorCell || !targetCell) return [];
  if (shape === 'self' || shape === 'dome' || shape === 'pre_battle') return [actorCell.id];
  if (shape === 'aura' || shape === 'self_aura') {
    return state.grid.cells
      .filter(cell => manhattan(actorCell, cell) <= Math.max(1, area))
      .map(cell => cell.id);
  }
  if (shape === 'multi_line' || shape === 'moving_column') {
    return state.grid.cells
      .filter(cell => isAligned(actorCell, cell) && manhattan(actorCell, cell) > 0 && manhattan(actorCell, cell) <= Math.max(1, area + 1))
      .map(cell => cell.id);
  }
  if (shape === 'line_wall') {
    return [targetCell.id, ...cellsBetween(state, actorCell, targetCell).map(cell => cell.id)];
  }
  if (shape === 'zone' || shape === 'array_zone' || shape === 'splash') {
    return state.grid.cells
      .filter(cell => manhattan(targetCell, cell) <= 1)
      .slice(0, Math.max(1, area))
      .map(cell => cell.id);
  }
  return [targetCell.id];
}

function targetUnitsForCells(state: BattlefieldCombatState, actor: BattlefieldUnit, cellIds: string[], targetUnitIds?: string[]): string[] {
  if (targetUnitIds?.length) {
    return targetUnitIds.filter(id => {
      const unit = getUnit(state, id);
      return !!unit && unit.hp > 0;
    });
  }
  const cellSet = new Set(cellIds);
  return state.units
    .filter(unit => unit.hp > 0 && unit.id !== actor.id && cellSet.has(unit.cellId))
    .filter(unit => state.mode !== 'group' || groupVisible(unit) || sameSide(actor, unit))
    .map(unit => unit.id);
}

function validateTargetCell(
  state: BattlefieldCombatState,
  actor: BattlefieldUnit,
  shape: string,
  shapeRule: ShapeRule | undefined,
  targetCellId: string | undefined,
  validCells: BattlefieldCell[],
): string | undefined {
  const actorCell = getCell(state, actor.cellId);
  const targetCell = getCell(state, targetCellId);
  if (!targetCellId) return 'missing_target';
  if (!targetCell) return 'target_out_of_bounds';
  if (!validCells.some(cell => cell.id === targetCellId)) return 'target_out_of_range';
  if (shapeRule?.blockedByCover && actorCell && lineBlockedByCover(state, actorCell, targetCell)) return 'line_of_sight_blocked';
  if ((shape === 'dash' || shape === 'teleport_short' || shape === 'shadow_path') && targetCell.occupantId) return 'target_cell_occupied';
  return undefined;
}

function costEnough(unit: BattlefieldUnit, cost?: GuExpressionCost): boolean {
  if (!cost?.essencePct) return true;
  return (unit.essence?.current ?? 0) >= cost.essencePct;
}

function spendEssence(unit: BattlefieldUnit, cost?: GuExpressionCost): void {
  if (!cost?.essencePct || !unit.essence) return;
  unit.essence.current = Math.max(0, unit.essence.current - cost.essencePct);
}

function applyCooldown(unit: BattlefieldUnit, sourceName: string, cooldown: number): void {
  if (cooldown <= 0) return;
  unit.cooldowns = { ...(unit.cooldowns ?? {}), [sourceName]: Math.max(rules.cooldown.minimumActiveCooldown, cooldown) };
}

function tickCooldowns(unit: BattlefieldUnit): BattlefieldUnit {
  const cooldowns: Record<string, number> = {};
  for (const [name, turns] of Object.entries(unit.cooldowns ?? {})) {
    const next = turns - 1;
    if (next > 0) cooldowns[name] = next;
  }
  return { ...unit, cooldowns };
}

function computeKillerMoveCost(move: KillerMoveExpressionSpec): GuExpressionCost {
  return { essencePct: Math.max(12, move.level * 8 + move.maintain.essencePctPerTurn) };
}

function visualForGu(spec: GuExpressionSpec, intensity: BattleResolutionStep['visual']['intensity'] = 'normal') {
  return {
    motif: spec.visualMotif.motif,
    primaryTint: spec.visualMotif.primaryTint,
    motion: spec.visualMotif.motion,
    intensity,
  };
}

function visualForMove(move: KillerMoveExpressionSpec, intensity: BattleResolutionStep['visual']['intensity'] = 'high') {
  return {
    motif: move.visualBeats[0] ?? move.moveName,
    primaryTint: '#C9A24A',
    motion: move.visualBeats.join('>'),
    intensity,
  };
}

function settleIfNeeded(state: BattlefieldCombatState): { state: BattlefieldCombatState; step?: BattleResolutionStep } {
  let objectiveState = state;
  let objectiveReason: string | null = null;
  if (state.mode === 'group' && state.objectives?.length) {
    const nextObjectives = state.objectives.map(objective => {
      if (objective.status !== 'active') return objective;
      if (objective.type === 'protect' && objective.unitId) {
        const unit = getUnit(state, objective.unitId);
        if (!unit || unit.hp < rules.group.objectives.protectHpThreshold) {
          objectiveReason = `objective_failed:${objective.id}`;
          return { ...objective, status: 'failed' as const };
        }
      }
      if (objective.type === 'escort' && objective.unitId) {
        const unit = getUnit(state, objective.unitId);
        const cell = unit ? getCell(state, unit.cellId) : undefined;
        if (unit && unit.hp > 0 && cell && (!objective.requiredEdge || isEdgeCell(cell))) {
          objectiveReason = `objective_succeeded:${objective.id}`;
          return { ...objective, status: 'succeeded' as const };
        }
      }
      if (objective.type === 'defeat_key' && objective.targetUnitId) {
        const target = getUnit(state, objective.targetUnitId);
        if (!target || target.hp <= 0) {
          objectiveReason = `objective_succeeded:${objective.id}`;
          return { ...objective, status: 'succeeded' as const };
        }
      }
      return objective;
    });
    objectiveState = { ...state, objectives: nextObjectives };
  }
  const playerAlive = state.units.some(unit => unit.hp > 0 && (unit.side === 'player' || unit.side === 'ally'));
  const enemyAlive = state.units.some(unit => unit.hp > 0 && unit.side === 'enemy');
  let result: BattlefieldCombatResult | null = null;
  if (objectiveReason?.startsWith('objective_failed')) result = { winner: 'enemy', reason: objectiveReason, roundsTaken: state.round };
  if (objectiveReason?.startsWith('objective_succeeded') && objectiveState.objectives?.every(objective => objective.status !== 'active')) {
    result = { winner: 'player', reason: objectiveReason, roundsTaken: state.round };
  }
  if (!enemyAlive) result = { winner: 'player', reason: 'enemy_eliminated', roundsTaken: state.round };
  if (!playerAlive) result = { winner: 'enemy', reason: 'player_eliminated', roundsTaken: state.round };
  if (!result) return { state: objectiveState };
  const nextState = { ...objectiveState, phase: 'ended' as const, result };
  const step = makeStep(nextState, 'settlement', {
    message: result.reason,
    visual: {
      motif: 'battle_settlement',
      primaryTint: result.winner === 'player' ? '#C9A24A' : '#8B3A3A',
      motion: 'resolve',
      intensity: 'high',
    },
    tags: ['settlement', result.winner ?? 'none'],
  });
  return { state: appendSteps(nextState, [step]), step };
}

function buildActionTargetsForGu(state: BattlefieldCombatState, actor: BattlefieldUnit, spec: GuExpressionSpec): BattlefieldActionValidation {
  const shapeRule = rules.guShapes[spec.range.shape];
  const validCells = cellsForPolicy(state, actor, spec.range.shape, spec.range.min, spec.range.max);
  const affected = spec.range.shape === 'self'
    ? [actor.cellId]
    : validCells.flatMap(cell => affectedCellsForTarget(state, actor, cell.id, spec.range.shape, spec.range.area));
  return defaultValidation({ type: 'gu', actorId: actor.id, guName: spec.guName }, {
    ok: true,
    validTargetCellIds: validCells.map(cell => cell.id),
    affectedCellIds: [...new Set(affected)],
    targetUnitIds: targetUnitsForCells(state, actor, validCells.map(cell => cell.id)),
    resourceCost: spec.cost,
    cooldown: spec.cooldown,
    sourceName: spec.guName,
    tags: [spec.path, spec.availability, spec.range.shape, shapeRule?.targetPolicy ?? 'unknown_shape'],
  });
}

function buildActionTargetsForMove(state: BattlefieldCombatState, actor: BattlefieldUnit): BattlefieldActionValidation {
  const actorCell = getCell(state, actor.cellId);
  const validCells = actorCell
    ? state.grid.cells.filter(cell => manhattan(actorCell, cell) <= rules.defaults.movementRange && cell.id !== actor.cellId && !cell.occupantId)
    : [];
  return defaultValidation({ type: 'move', actorId: actor.id }, {
    ok: true,
    validTargetCellIds: validCells.map(cell => cell.id),
    affectedCellIds: validCells.map(cell => cell.id),
    tags: ['move'],
  });
}

function buildActionTargetsForKillerMove(state: BattlefieldCombatState, actor: BattlefieldUnit, move: KillerMoveExpressionSpec): BattlefieldActionValidation {
  const shapeRule = rules.killerMoveShapes[move.boardPattern.shape];
  const validCells = cellsForPolicy(state, actor, move.boardPattern.shape, 0, move.boardPattern.range);
  const affected = validCells.flatMap(cell => affectedCellsForTarget(state, actor, cell.id, move.boardPattern.shape, move.boardPattern.area));
  return defaultValidation({ type: 'killer_move', actorId: actor.id, killerMoveName: move.moveName }, {
    ok: true,
    validTargetCellIds: validCells.map(cell => cell.id),
    affectedCellIds: [...new Set(affected)],
    targetUnitIds: targetUnitsForCells(state, actor, [...new Set(affected)]),
    resourceCost: computeKillerMoveCost(move),
    cooldown: Math.max(1, move.level),
    sourceName: move.moveName,
    tags: [move.path, move.boardPattern.shape, shapeRule?.targetPolicy ?? 'unknown_shape'],
  });
}

function buildGroupActionTargets(state: BattlefieldCombatState, actor: BattlefieldUnit, type: BattlefieldAction['type']): BattlefieldActionValidation {
  const actorCell = getCell(state, actor.cellId);
  if (!actorCell || state.mode !== 'group') return defaultValidation({ type, actorId: actor.id } as BattlefieldAction, { reason: 'group_mode_required' });
  if (type === 'rally') {
    return defaultValidation({ type, actorId: actor.id } as BattlefieldAction, {
      ok: true,
      validTargetCellIds: [actor.cellId],
      affectedCellIds: [actor.cellId],
      targetUnitIds: [actor.id],
      sourceName: 'rally',
      tags: ['group', 'rally', 'morale'],
    });
  }
  if (type === 'observe') {
    const hiddenCellIds = state.units
      .filter(unit => unit.hp > 0 && unit.revealed === false)
      .map(unit => unit.cellId);
    const intelCellIds = state.grid.cells
      .filter(cell => cell.flags.includes('concealment') || cell.flags.includes('hazard') || cell.flags.includes('array_node') || hiddenCellIds.includes(cell.id))
      .map(cell => cell.id);
    const affectedCellIds = [...new Set(intelCellIds.length ? intelCellIds : state.grid.cells.map(cell => cell.id))];
    return defaultValidation({ type, actorId: actor.id } as BattlefieldAction, {
      ok: true,
      validTargetCellIds: affectedCellIds,
      affectedCellIds,
      targetUnitIds: state.units.filter(unit => unit.revealed === false).map(unit => unit.id),
      sourceName: 'observe',
      tags: ['group', 'observe', 'ambush'],
    });
  }
  if (type === 'formation') {
    const validCells = state.grid.cells.filter(cell => (
      cell.flags.includes('array_node') &&
      manhattan(actorCell, cell) <= rules.group.formation.controlRange
    ));
    return defaultValidation({ type, actorId: actor.id } as BattlefieldAction, {
      ok: validCells.length > 0,
      reason: validCells.length ? undefined : 'no_formation_cell',
      validTargetCellIds: validCells.map(cell => cell.id),
      affectedCellIds: validCells.map(cell => cell.id),
      sourceName: 'formation',
      tags: ['group', 'formation', 'array_node'],
    });
  }

  const candidates = state.units.filter(unit => {
    if (unit.id === actor.id || unit.hp <= 0) return false;
    if (!sameSide(actor, unit)) return false;
    const cell = getCell(state, unit.cellId);
    if (!cell) return false;
    const distance = manhattan(actorCell, cell);
    return type === 'guard'
      ? distance <= 1
      : distance <= rules.group.assist.range;
  });
  return defaultValidation({ type, actorId: actor.id } as BattlefieldAction, {
    ok: candidates.length > 0,
    reason: candidates.length ? undefined : type === 'guard' ? 'no_adjacent_ally_to_guard' : 'no_ally_to_assist',
    validTargetCellIds: candidates.map(unit => unit.cellId),
    affectedCellIds: candidates.map(unit => unit.cellId),
    targetUnitIds: candidates.map(unit => unit.id),
    sourceName: type,
    tags: ['group', type],
  });
}

export function listBattlefieldActionTargets(state: BattlefieldCombatState, action: BattlefieldAction): BattlefieldActionValidation {
  const actor = getActor(state, action);
  if (!actor) return defaultValidation(action, { reason: 'actor_not_found_or_defeated' });
  if (action.type === 'move') return buildActionTargetsForMove(state, actor);
  if (action.type === 'retreat') return defaultValidation(action, { ok: true, tags: ['retreat'] });
  if (action.type === 'wait') return defaultValidation(action, { ok: true, tags: ['wait'] });
  if (action.type === 'assist' || action.type === 'guard' || action.type === 'rally' || action.type === 'formation' || action.type === 'observe') {
    return buildGroupActionTargets(state, actor, action.type);
  }
  if (action.type === 'gu') {
    const spec = getGuExpressionSpec(action.guName ?? '');
    if (!spec) return defaultValidation(action, { reason: 'gu_not_found' });
    return buildActionTargetsForGu(state, actor, spec);
  }
  if (action.type === 'killer_move') {
    const move = getKillerMoveExpressionSpec(action.killerMoveName ?? '');
    if (!move) return defaultValidation(action, { reason: 'killer_move_not_found' });
    return buildActionTargetsForKillerMove(state, actor, move);
  }
  return defaultValidation(action, { reason: 'unsupported_action' });
}

export function validateBattlefieldAction(state: BattlefieldCombatState, action: BattlefieldAction): BattlefieldActionValidation {
  const actor = getActor(state, action);
  if (!actor) return defaultValidation(action, { reason: 'actor_not_found_or_defeated' });
  if (state.phase === 'ended') return defaultValidation(action, { reason: 'battle_already_ended' });

  if (action.type === 'wait') {
    return defaultValidation(action, { ok: true, tags: ['wait'] });
  }

  if (action.type === 'rally' || action.type === 'observe') {
    return buildGroupActionTargets(state, actor, action.type);
  }

  if (action.type === 'assist' || action.type === 'guard' || action.type === 'formation') {
    const targets = buildGroupActionTargets(state, actor, action.type);
    if (!targets.ok) return targets;
    if (!action.targetCellId) return { ...targets, ok: false, reason: 'missing_target' };
    if (!targets.validTargetCellIds.includes(action.targetCellId)) return { ...targets, ok: false, reason: 'target_out_of_range' };
    const targetUnitIds = targets.targetUnitIds.filter(id => getUnit(state, id)?.cellId === action.targetCellId);
    return {
      ...targets,
      ok: true,
      affectedCellIds: [action.targetCellId],
      targetUnitIds: action.type === 'formation' ? [] : targetUnitIds,
    };
  }

  if (action.type === 'move') {
    const targets = buildActionTargetsForMove(state, actor);
    if (!action.targetCellId) return { ...targets, ok: false, reason: 'missing_target' };
    if (!targets.validTargetCellIds.includes(action.targetCellId)) return { ...targets, ok: false, reason: getCell(state, action.targetCellId)?.occupantId ? 'target_cell_occupied' : 'target_out_of_range' };
    return { ...targets, ok: true, affectedCellIds: [action.targetCellId] };
  }

  if (action.type === 'retreat') {
    return defaultValidation(action, { ok: true, tags: ['retreat'] });
  }

  if (action.type === 'gu') {
    const spec = getGuExpressionSpec(action.guName ?? '');
    if (!spec) return defaultValidation(action, { reason: 'gu_not_found' });
    const targets = buildActionTargetsForGu(state, actor, spec);
    if (!actor.guNames.includes(spec.guName)) return { ...targets, ok: false, reason: 'gu_not_owned' };
    if (isGuPassive(spec)) return { ...targets, ok: false, reason: 'passive_gu_not_active_action' };
    if ((isGuSceneGated(spec) || isGuForbidden(spec)) && !action.sceneGate) return { ...targets, ok: false, reason: 'scene_gate_required' };
    if (!action.sceneGate && !isGuNormalCombatUsable(spec)) return { ...targets, ok: false, reason: 'gu_not_normal_combat_usable' };
    if ((actor.cooldowns?.[spec.guName] ?? 0) > 0) return { ...targets, ok: false, reason: 'cooldown_active' };
    if (!costEnough(actor, spec.cost)) return { ...targets, ok: false, reason: 'insufficient_essence' };
    if (!action.targetCellId && spec.range.shape !== 'self') return { ...targets, ok: false, reason: 'missing_target' };
    const shapeRule = rules.guShapes[spec.range.shape];
    const targetIssue = spec.range.shape === 'self'
      ? undefined
      : validateTargetCell(state, actor, spec.range.shape, shapeRule, action.targetCellId, targets.validTargetCellIds.map(id => getCell(state, id)).filter(Boolean) as BattlefieldCell[]);
    if (targetIssue) return { ...targets, ok: false, reason: targetIssue };
    const affectedCellIds = affectedCellsForTarget(state, actor, action.targetCellId ?? actor.cellId, spec.range.shape, spec.range.area);
    let targetUnitIds = targetUnitsForCells(state, actor, affectedCellIds, action.targetUnitIds);
    if (spec.range.shape === 'self' || action.targetCellId === actor.cellId) targetUnitIds = [actor.id];
    if (targetUnitIds.length === 0 && !['self', 'self_or_adjacent', 'aura', 'zone', 'cell', 'dash', 'teleport_short'].includes(spec.range.shape)) {
      return { ...targets, ok: false, reason: 'missing_target_unit' };
    }
    return { ...targets, ok: true, affectedCellIds, targetUnitIds };
  }

  if (action.type === 'killer_move') {
    const move = getKillerMoveExpressionSpec(action.killerMoveName ?? '');
    if (!move) return defaultValidation(action, { reason: 'killer_move_not_found' });
    const targets = buildActionTargetsForKillerMove(state, actor, move);
    if (!actor.killerMoveNames?.includes(move.moveName)) return { ...targets, ok: false, reason: 'killer_move_not_learned' };
    for (const guName of move.coreGu) {
      if (!actor.guNames.includes(guName)) return { ...targets, ok: false, reason: `missing_core_gu:${guName}` };
    }
    for (const guName of move.auxiliaryGu) {
      if (!actor.guNames.includes(guName)) return { ...targets, ok: false, reason: `missing_auxiliary_gu:${guName}` };
    }
    const cost = computeKillerMoveCost(move);
    if (!costEnough(actor, cost)) return { ...targets, ok: false, reason: 'insufficient_essence', resourceCost: cost };
    if ((actor.cooldowns?.[move.moveName] ?? 0) > 0) return { ...targets, ok: false, reason: 'cooldown_active' };
    if (!action.targetCellId && !['self', 'dome', 'self_aura', 'pre_battle'].includes(move.boardPattern.shape)) return { ...targets, ok: false, reason: 'missing_target' };
    const shapeRule = rules.killerMoveShapes[move.boardPattern.shape];
    const targetIssue = ['self', 'dome', 'self_aura', 'pre_battle'].includes(move.boardPattern.shape)
      ? undefined
      : validateTargetCell(state, actor, move.boardPattern.shape, shapeRule, action.targetCellId, targets.validTargetCellIds.map(id => getCell(state, id)).filter(Boolean) as BattlefieldCell[]);
    if (targetIssue) return { ...targets, ok: false, reason: targetIssue };
    const affectedCellIds = affectedCellsForTarget(state, actor, action.targetCellId ?? actor.cellId, move.boardPattern.shape, move.boardPattern.area);
    return {
      ...targets,
      ok: true,
      affectedCellIds,
      targetUnitIds: targetUnitsForCells(state, actor, affectedCellIds, action.targetUnitIds),
      resourceCost: cost,
    };
  }

  return defaultValidation(action, { reason: 'unsupported_action' });
}

function updateUnit(state: BattlefieldCombatState, unit: BattlefieldUnit): BattlefieldCombatState {
  const units = state.units.map(item => item.id === unit.id ? unit : item);
  return {
    ...state,
    units,
    grid: {
      ...state.grid,
      cells: withCellOccupants(state.grid.cells, units),
    },
  };
}

function updateUnits(state: BattlefieldCombatState, units: BattlefieldUnit[]): BattlefieldCombatState {
  const byId = new Map(units.map(unit => [unit.id, unit]));
  const nextUnits = state.units.map(unit => byId.get(unit.id) ?? unit);
  return {
    ...state,
    units: nextUnits,
    grid: {
      ...state.grid,
      cells: withCellOccupants(state.grid.cells, nextUnits),
    },
  };
}

export function listBattlefieldTurnOrder(state: BattlefieldCombatState): BattlefieldUnit[] {
  return state.units
    .filter(unit => unit.hp > 0)
    .filter(unit => unit.side !== 'neutral' || unit.revealed !== false)
    .sort((a, b) => {
      const sideRank = (unit: BattlefieldUnit) => unit.side === 'player' ? 0 : unit.side === 'ally' ? 1 : unit.side === 'enemy' ? 2 : 3;
      const speedA = (a.accuracy ?? rules.defaults.accuracy) + (a.evasion ?? rules.defaults.evasion) + a.realmNum * 3;
      const speedB = (b.accuracy ?? rules.defaults.accuracy) + (b.evasion ?? rules.defaults.evasion) + b.realmNum * 3;
      return sideRank(a) - sideRank(b) || speedB - speedA || a.id.localeCompare(b.id);
    });
}

function nextFriendlyActor(state: BattlefieldCombatState, actedIds: string[]): string | undefined {
  const acted = new Set(actedIds);
  return listBattlefieldTurnOrder(state)
    .find(unit => isPlayerSide(unit) && !acted.has(unit.id))?.id;
}

function markActorActed(state: BattlefieldCombatState, actorId: string): BattlefieldCombatState {
  if (state.mode !== 'group') return state;
  const acted = [...new Set([...(state.actedUnitIdsThisRound ?? []), actorId])];
  return {
    ...state,
    actedUnitIdsThisRound: acted,
    activeUnitId: nextFriendlyActor(state, acted),
  };
}

function effectMatches(effect: BattlefieldActiveEffect, tag: string, targetId: string): boolean {
  return effect.tags.includes(tag) && (effect.targetIds ?? []).includes(targetId) && effect.remainingTurns > 0;
}

function consumeEffects(state: BattlefieldCombatState, consumedIds: string[]): BattlefieldCombatState {
  if (!consumedIds.length) return state;
  const consumed = new Set(consumedIds);
  return {
    ...state,
    activeEffects: (state.activeEffects ?? []).filter(effect => !consumed.has(effect.id)),
  };
}

function rollAttack(
  state: BattlefieldCombatState,
  actor: BattlefieldUnit,
  target: BattlefieldUnit,
  sourceName: string,
  path: string,
  targetCells: BattlefieldCell[],
  moveMultiplier: number,
  affinity: ReturnType<typeof terrainAffinity>,
  groupModifier: { hitBonus?: number; damageMultiplier?: number } = {},
) {
  const coeff = getRealmCoefficients(actor.realmNum, target.realmNum);
  const baseAccuracy = actor.accuracy ?? rules.defaults.accuracy;
  const baseEvasion = (target.evasion ?? rules.defaults.evasion) + (target.revealed === false ? rules.group.ambush.hiddenEvasionBonus : 0);
  let hitRate = calcHitRate(baseAccuracy, baseEvasion, coeff.playerHitBonus);
  if (targetCells.some(hasCover)) hitRate -= rules.defaults.hitCoverPenalty;
  if (affinity.isFavored) hitRate += rules.defaults.favoredHitBonus;
  if (affinity.isHindered) hitRate -= rules.defaults.hinderedHitPenalty;
  if (state.mode === 'group' && moraleFor(state, actor) <= rules.group.morale.lowThreshold) hitRate -= rules.group.morale.lowHitPenalty;
  if (groupModifier.hitBonus) hitRate += groupModifier.hitBonus;
  hitRate = Math.max(0.05, Math.min(0.98, hitRate));
  const rng = createSeededRng(`${state.seed}:${state.round}:${actor.id}:${target.id}:${sourceName}`);
  const hit = rollHit(hitRate, rng);
  const crit = rollCrit(rng);
  const terrainMult = (affinity.isFavored ? rules.defaults.favoredDamageMultiplier : 1)
    * (affinity.isHindered ? rules.defaults.hinderedDamageMultiplier : 1)
    * (targetCells.some(cell => cell.flags.includes('array_node')) ? rules.defaults.arrayNodeDamageMultiplier : 1)
    * (targetCells.some(hasCover) ? rules.defaults.coverDamageMultiplier : 1);
  const moraleMult = state.mode === 'group' && moraleFor(state, actor) >= rules.group.morale.highThreshold
    ? rules.group.morale.highDamageMultiplier
    : 1;
  const damage = hit
    ? calcDamage(
      actor.attack ?? rules.defaults.attack,
      target.defense ?? rules.defaults.defense,
      path,
      target.path,
      coeff.playerDamageMult,
      moveMultiplier * terrainMult * moraleMult * (groupModifier.damageMultiplier ?? 1),
      crit,
      daoMarksFor(actor, path),
      daoMarksFor(target, target.path),
      rng,
    )
    : 0;
  return { hit, crit, damage, hitRate };
}

function addStatuses(unit: BattlefieldUnit, statuses: string[]): { unit: BattlefieldUnit; added: string[] } {
  const existing = new Set(unit.statusEffects);
  const added: string[] = [];
  for (const status of statuses) {
    if (existing.has(status)) continue;
    existing.add(status);
    added.push(status);
  }
  return { unit: { ...unit, statusEffects: [...existing] }, added };
}

function groupAssistFor(state: BattlefieldCombatState, actorId: string): { hitBonus: number; damageMultiplier: number; effectIds: string[] } {
  const effects = (state.activeEffects ?? []).filter(effect => effectMatches(effect, 'assist', actorId));
  if (!effects.length) return { hitBonus: 0, damageMultiplier: 1, effectIds: [] };
  const used = effects.slice(0, rules.group.assist.maxStacks);
  return {
    hitBonus: rules.group.assist.hitBonus * used.length,
    damageMultiplier: Math.pow(rules.group.assist.damageMultiplier, used.length),
    effectIds: used.map(effect => effect.id),
  };
}

function applyGroupGuard(
  state: BattlefieldCombatState,
  target: BattlefieldUnit,
  incomingDamage: number,
): { damage: number; guardStep?: BattleResolutionStep; consumedEffectIds: string[] } {
  if (state.mode !== 'group' || incomingDamage <= 0) return { damage: incomingDamage, consumedEffectIds: [] };
  const effect = (state.activeEffects ?? []).find(item => effectMatches(item, 'guard', target.id));
  if (!effect) return { damage: incomingDamage, consumedEffectIds: [] };
  const guardian = effect.actorId ? getUnit(state, effect.actorId) : undefined;
  if (!guardian || guardian.hp <= 0) return { damage: incomingDamage, consumedEffectIds: [effect.id] };
  const targetCell = getCell(state, target.cellId);
  const guardianCell = getCell(state, guardian.cellId);
  if (rules.group.guard.adjacentRequired && targetCell && guardianCell && manhattan(targetCell, guardianCell) > 1) {
    return { damage: incomingDamage, consumedEffectIds: [effect.id] };
  }
  const reduced = Math.max(0, Math.round(incomingDamage * (1 - rules.group.guard.damageReduction)));
  const step = makeStep(state, 'guard', {
    actorId: guardian.id,
    targetIds: [target.id],
    affectedCellIds: [target.cellId],
    damage: incomingDamage - reduced,
    sourceName: 'guard',
    message: 'guard_damage_reduced',
    visual: {
      motif: 'guard',
      primaryTint: '#5C8B7A',
      motion: 'shield_intercept',
      intensity: 'normal',
    },
    tags: ['group', 'guard', 'damage_reduction'],
  });
  return { damage: reduced, guardStep: step, consumedEffectIds: [effect.id] };
}

function executeGuAction(state: BattlefieldCombatState, action: BattlefieldAction, validation: BattlefieldActionValidation): BattlefieldActionResolution {
  const spec = getGuExpressionSpec(action.guName ?? '')!;
  let nextState = cloneState(state);
  let actor = getUnit(nextState, action.actorId)!;
  const steps: BattleResolutionStep[] = [];
  const targetCells = validation.affectedCellIds.map(id => getCell(nextState, id)).filter(Boolean) as BattlefieldCell[];
  const affinity = terrainAffinity(spec, nextState, targetCells);

  spendEssence(actor, spec.cost);
  applyCooldown(actor, spec.guName, spec.cooldown);

  steps.push(makeStep(nextState, 'gu_use', {
    actorId: actor.id,
    targetIds: validation.targetUnitIds,
    sourceName: spec.guName,
    affectedCellIds: validation.affectedCellIds,
    resourceCost: spec.cost,
    message: `${spec.guName} resolved locally`,
    visual: visualForGu(spec),
    tags: [spec.path, spec.range.shape, ...spec.verbs],
  }));
  steps.push(makeStep(nextState, 'resource_spend', {
    actorId: actor.id,
    sourceName: spec.guName,
    resourceCost: spec.cost,
    message: `${spec.guName} essence spent`,
    visual: visualForGu(spec, 'subtle'),
    tags: ['resource_spend', spec.path],
  }));

  const movedActor = rules.guShapes[spec.range.shape]?.allowsMove && action.targetCellId
    ? { ...actor, cellId: action.targetCellId }
    : actor;
  if (movedActor.cellId !== actor.cellId) {
    steps.push(makeStep(nextState, 'move', {
      actorId: actor.id,
      fromCellId: actor.cellId,
      toCellId: movedActor.cellId,
      sourceName: spec.guName,
      message: `${spec.guName} movement`,
      visual: visualForGu(spec),
      tags: ['move', spec.range.shape],
    }));
  }
  actor = movedActor;

  const changedUnits: BattlefieldUnit[] = [actor];
  for (const targetId of validation.targetUnitIds) {
    const target = getUnit(nextState, targetId);
    if (!target || target.hp <= 0) continue;
    if (target.id === actor.id || !isHostile(actor, target)) {
      const statusResult = addStatuses(target.id === actor.id ? actor : target, spec.statusEffects);
      if (target.id === actor.id) actor = statusResult.unit;
      changedUnits.push(statusResult.unit);
      if (statusResult.added.length) {
        steps.push(makeStep(nextState, 'status_apply', {
          actorId: actor.id,
          targetIds: [target.id],
          sourceName: spec.guName,
          affectedCellIds: [target.cellId],
          statusEffects: statusResult.added,
          message: `${spec.guName} status applied`,
          visual: visualForGu(spec, 'normal'),
          tags: ['status_apply', ...statusResult.added],
        }));
      }
      continue;
    }
    const targetCell = getCell(nextState, target.cellId);
    const cells = targetCell ? [targetCell] : targetCells;
    const assist = groupAssistFor(nextState, actor.id);
    if (assist.effectIds.length) {
      steps.push(makeStep(nextState, 'assist', {
        actorId: actor.id,
        targetIds: [target.id],
        sourceName: spec.guName,
        affectedCellIds: cells.map(cell => cell.id),
        message: 'assist_bonus_applied',
        visual: {
          motif: 'assist',
          primaryTint: '#C9A96E',
          motion: 'linked_strike',
          intensity: 'subtle',
        },
        tags: ['group', 'assist'],
      }));
    }
    const rolled = rollAttack(nextState, actor, target, spec.guName, spec.path, cells, rules.defaults.baseGuDamageMultiplier, affinity, assist);
    if (!rolled.hit) {
      steps.push(makeStep(nextState, 'miss', {
        actorId: actor.id,
        targetIds: [target.id],
        sourceName: spec.guName,
        affectedCellIds: cells.map(cell => cell.id),
        message: `${spec.guName} missed`,
        visual: visualForGu(spec, 'subtle'),
        tags: ['miss', spec.path],
      }));
      nextState = consumeEffects(nextState, assist.effectIds);
      continue;
    }
    const guarded = applyGroupGuard(nextState, target, rolled.damage);
    if (guarded.guardStep) steps.push(guarded.guardStep);
    let nextTarget = { ...target, hp: Math.max(0, target.hp - guarded.damage) };
    nextState = consumeEffects(nextState, [...assist.effectIds, ...guarded.consumedEffectIds]);
    steps.push(makeStep(nextState, 'hit', {
      actorId: actor.id,
      targetIds: [target.id],
      sourceName: spec.guName,
      affectedCellIds: cells.map(cell => cell.id),
      damage: guarded.damage,
      message: `${spec.guName} hit ${target.name}`,
      visual: visualForGu(spec, rolled.crit ? 'high' : 'normal'),
      tags: ['hit', spec.path, rolled.crit ? 'crit' : 'normal'],
    }));
    const statusResult = addStatuses(nextTarget, spec.statusEffects);
    nextTarget = statusResult.unit;
    if (statusResult.added.length) {
      steps.push(makeStep(nextState, 'status_apply', {
        actorId: actor.id,
        targetIds: [target.id],
        sourceName: spec.guName,
        affectedCellIds: cells.map(cell => cell.id),
        statusEffects: statusResult.added,
        message: `${spec.guName} status applied`,
        visual: visualForGu(spec, 'normal'),
        tags: ['status_apply', ...statusResult.added],
      }));
    }
    if (target.hp > 0 && nextTarget.hp <= 0 && state.mode === 'group') {
      const moraleKeyToRaise = isPlayerSide(actor) ? 'player' : actor.side === 'enemy' ? 'enemy' : 'neutral';
      nextState = updateMorale(nextState, moraleKeyToRaise, rules.group.morale.enemyDownGain);
      steps.push(makeStep(nextState, 'morale', {
        actorId: actor.id,
        targetIds: [target.id],
        message: 'unit_down_morale_shift',
        visual: {
          motif: 'morale',
          primaryTint: '#C9A96E',
          motion: 'surge',
          intensity: 'subtle',
        },
        tags: ['group', 'morale', moraleKeyToRaise],
      }));
    }
    changedUnits.push(nextTarget);
  }

  if (affinity.isHindered) {
    steps.push(makeStep(nextState, 'counter', {
      actorId: actor.id,
      sourceName: spec.guName,
      affectedCellIds: validation.affectedCellIds,
      message: `${spec.guName} hindered by terrain`,
      visual: visualForGu(spec, 'subtle'),
      tags: ['terrain_hindered', ...affinity.tags],
    }));
  }

  nextState = markActorActed(updateUnits(nextState, changedUnits), actor.id);
  const settled = settleIfNeeded(appendSteps(nextState, steps));
  const allSteps = settled.step ? [...steps, settled.step] : steps;
  return { state: settled.state, steps: allSteps, validation };
}

function executeMoveAction(state: BattlefieldCombatState, action: BattlefieldAction, validation: BattlefieldActionValidation): BattlefieldActionResolution {
  let nextState = cloneState(state);
  let actor = getUnit(nextState, action.actorId)!;
  const fromCell = actor.cellId;
  const toCell = action.targetCellId!;
  actor = { ...actor, cellId: toCell };
  const steps: BattleResolutionStep[] = [
    makeStep(nextState, 'move', {
      actorId: actor.id,
      fromCellId: fromCell,
      toCellId: toCell,
      message: 'unit moved',
      visual: {
        motif: 'footwork',
        primaryTint: '#7A8EA8',
        motion: 'step',
        intensity: 'subtle',
      },
      tags: ['move'],
    }),
  ];
  const targetCell = getCell(nextState, toCell);
  if (targetCell?.flags.includes('hazard')) {
    actor = { ...actor, hp: Math.max(0, actor.hp - rules.defaults.hazardDamageOnEnter) };
    steps.push(makeStep(nextState, 'terrain_change', {
      actorId: actor.id,
      affectedCellIds: [toCell],
      damage: rules.defaults.hazardDamageOnEnter,
      message: 'hazard cell entered',
      visual: {
        motif: 'hazard',
        primaryTint: '#8B3A3A',
        motion: 'flare',
        intensity: 'normal',
      },
      tags: ['hazard'],
    }));
  }
  nextState = markActorActed(updateUnit(nextState, actor), actor.id);
  return { state: appendSteps(nextState, steps), steps, validation };
}

function releaseKillerMove(
  state: BattlefieldCombatState,
  actor: BattlefieldUnit,
  move: KillerMoveExpressionSpec,
  validation: BattlefieldActionValidation,
): { state: BattlefieldCombatState; steps: BattleResolutionStep[] } {
  let nextState = state;
  const steps: BattleResolutionStep[] = [
    makeStep(nextState, 'killer_move', {
      actorId: actor.id,
      targetIds: validation.targetUnitIds,
      sourceName: move.moveName,
      affectedCellIds: validation.affectedCellIds,
      resourceCost: validation.resourceCost,
      message: `${move.moveName} released locally`,
      visual: visualForMove(move),
      tags: [move.path, move.boardPattern.shape, 'killer_move'],
    }),
  ];
  const targetCells = validation.affectedCellIds.map(id => getCell(nextState, id)).filter(Boolean) as BattlefieldCell[];
  const affinity = terrainAffinity(move, nextState, targetCells);
  const changedUnits: BattlefieldUnit[] = [actor];
  for (const targetId of validation.targetUnitIds) {
    const target = getUnit(nextState, targetId);
    if (!target || target.hp <= 0 || !isHostile(actor, target)) continue;
    const targetCell = getCell(nextState, target.cellId);
    const assist = groupAssistFor(nextState, actor.id);
    if (assist.effectIds.length) {
      steps.push(makeStep(nextState, 'assist', {
        actorId: actor.id,
        targetIds: [target.id],
        sourceName: move.moveName,
        affectedCellIds: targetCell ? [targetCell.id] : validation.affectedCellIds,
        message: 'assist_bonus_applied',
        visual: {
          motif: 'assist',
          primaryTint: '#C9A96E',
          motion: 'linked_strike',
          intensity: 'subtle',
        },
        tags: ['group', 'assist'],
      }));
    }
    const rolled = rollAttack(
      nextState,
      actor,
      target,
      move.moveName,
      move.path,
      targetCell ? [targetCell] : targetCells,
      rules.defaults.baseKillerMoveDamageMultiplier,
      affinity,
      assist,
    );
    if (!rolled.hit) {
      steps.push(makeStep(nextState, 'miss', {
        actorId: actor.id,
        targetIds: [target.id],
        sourceName: move.moveName,
        affectedCellIds: targetCell ? [targetCell.id] : validation.affectedCellIds,
        message: `${move.moveName} missed`,
        visual: visualForMove(move, 'normal'),
        tags: ['miss', move.path],
      }));
      nextState = consumeEffects(nextState, assist.effectIds);
      continue;
    }
    const guarded = applyGroupGuard(nextState, target, rolled.damage);
    if (guarded.guardStep) steps.push(guarded.guardStep);
    const nextTarget = { ...target, hp: Math.max(0, target.hp - guarded.damage) };
    nextState = consumeEffects(nextState, [...assist.effectIds, ...guarded.consumedEffectIds]);
    changedUnits.push(nextTarget);
    steps.push(makeStep(nextState, 'hit', {
      actorId: actor.id,
      targetIds: [target.id],
      sourceName: move.moveName,
      affectedCellIds: targetCell ? [targetCell.id] : validation.affectedCellIds,
      damage: guarded.damage,
      message: `${move.moveName} hit ${target.name}`,
      visual: visualForMove(move, rolled.crit ? 'high' : 'normal'),
      tags: ['hit', move.path, rolled.crit ? 'crit' : 'normal'],
    }));
  }

  if (move.backlash) {
    steps.push(makeStep(nextState, 'counter', {
      actorId: actor.id,
      sourceName: move.moveName,
      message: move.backlash,
      visual: visualForMove(move, 'subtle'),
      tags: ['backlash', move.path],
    }));
  }

  nextState = updateUnits(nextState, changedUnits);
  return { state: nextState, steps };
}

function executeKillerMoveAction(state: BattlefieldCombatState, action: BattlefieldAction, validation: BattlefieldActionValidation): BattlefieldActionResolution {
  const move = getKillerMoveExpressionSpec(action.killerMoveName ?? '')!;
  let nextState = cloneState(state);
  let actor = getUnit(nextState, action.actorId)!;
  spendEssence(actor, validation.resourceCost);
  applyCooldown(actor, move.moveName, Math.max(1, move.level));
  nextState = updateUnit(nextState, actor);

  const steps: BattleResolutionStep[] = [
    makeStep(nextState, 'resource_spend', {
      actorId: actor.id,
      sourceName: move.moveName,
      resourceCost: validation.resourceCost,
      message: `${move.moveName} essence spent`,
      visual: visualForMove(move, 'subtle'),
      tags: ['resource_spend', move.path],
    }),
  ];

  if (move.charge.turns > 0) {
    const pending: BattlefieldPendingAction = {
      id: `${nextState.battleId}_${nextState.round}_${move.moveName}_pending`,
      actorId: actor.id,
      type: 'killer_move',
      sourceName: move.moveName,
      targetCellId: action.targetCellId,
      targetUnitIds: validation.targetUnitIds,
      affectedCellIds: validation.affectedCellIds,
      remainingTurns: move.charge.turns,
      interruptible: move.charge.interruptible,
      resourceCost: validation.resourceCost,
    };
    nextState = {
      ...nextState,
      pendingActions: [...(nextState.pendingActions ?? []), pending],
    };
    steps.push(makeStep(nextState, 'killer_move', {
      actorId: actor.id,
      targetIds: validation.targetUnitIds,
      sourceName: move.moveName,
      affectedCellIds: validation.affectedCellIds,
      resourceCost: validation.resourceCost,
      message: move.charge.tell,
      visual: visualForMove(move, 'normal'),
      tags: ['pending', move.path, move.boardPattern.shape],
    }));
    return { state: appendSteps(markActorActed(nextState, actor.id), steps), steps, validation };
  }

  const released = releaseKillerMove(nextState, actor, move, validation);
  const settled = settleIfNeeded(appendSteps(markActorActed(released.state, actor.id), [...steps, ...released.steps]));
  const allSteps = settled.step ? [...steps, ...released.steps, settled.step] : [...steps, ...released.steps];
  return { state: settled.state, steps: allSteps, validation };
}

function executeGroupSupportAction(state: BattlefieldCombatState, action: BattlefieldAction, validation: BattlefieldActionValidation): BattlefieldActionResolution {
  let nextState = cloneState(state);
  const actor = getUnit(nextState, action.actorId)!;
  const steps: BattleResolutionStep[] = [];

  if (action.type === 'assist' || action.type === 'guard') {
    const targetId = validation.targetUnitIds[0];
    const target = getUnit(nextState, targetId);
    if (!target) return failureResolution(nextState, action, action.type === 'guard' ? 'no_adjacent_ally_to_guard' : 'no_ally_to_assist');
    const effect: BattlefieldActiveEffect = {
      id: `${nextState.battleId}_${nextState.round}_${action.type}_${actor.id}_${target.id}`,
      sourceName: action.type,
      actorId: actor.id,
      targetIds: [target.id],
      affectedCellIds: [target.cellId],
      remainingTurns: action.type === 'guard' ? rules.group.guard.duration : rules.group.assist.duration,
      statusEffects: [action.type === 'guard' ? 'guarded' : 'assisted'],
      tags: ['group', action.type],
    };
    nextState = {
      ...nextState,
      activeEffects: [...(nextState.activeEffects ?? []), effect],
    };
    steps.push(makeStep(nextState, action.type, {
      actorId: actor.id,
      targetIds: [target.id],
      affectedCellIds: [target.cellId],
      sourceName: action.type,
      message: `${action.type}_prepared`,
      visual: {
        motif: action.type,
        primaryTint: action.type === 'guard' ? '#5C8B7A' : '#C9A96E',
        motion: action.type === 'guard' ? 'shield_set' : 'linked_ready',
        intensity: 'normal',
      },
      tags: ['group', action.type],
    }));
    nextState = markActorActed(nextState, actor.id);
    return { state: appendSteps(nextState, steps), steps, validation };
  }

  if (action.type === 'rally') {
    const key = moraleKey(actor);
    nextState = updateMorale(nextState, key, rules.group.morale.rallyGain);
    steps.push(makeStep(nextState, 'morale', {
      actorId: actor.id,
      targetIds: [actor.id],
      affectedCellIds: [actor.cellId],
      sourceName: 'rally',
      message: 'rally_morale_restored',
      visual: {
        motif: 'morale_rally',
        primaryTint: '#C9A96E',
        motion: 'banner_lift',
        intensity: 'normal',
      },
      tags: ['group', 'rally', key],
    }));
    nextState = markActorActed(nextState, actor.id);
    return { state: appendSteps(nextState, steps), steps, validation };
  }

  if (action.type === 'formation') {
    const targetCell = getCell(nextState, action.targetCellId);
    if (!targetCell?.flags.includes('array_node')) return failureResolution(nextState, action, 'no_formation_cell');
    const side = moraleKey(actor);
    const previous = nextState.activeFormationId;
    nextState = {
      ...nextState,
      activeFormationId: `${side}_array_control`,
      activeEffects: [
        ...(nextState.activeEffects ?? []),
        {
          id: `${nextState.battleId}_${nextState.round}_formation_${targetCell.id}`,
          sourceName: 'formation',
          actorId: actor.id,
          affectedCellIds: [targetCell.id],
          remainingTurns: rules.group.formation.controlDuration,
          statusEffects: ['formation_control'],
          tags: ['group', 'formation', side],
        },
      ],
    };
    if (previous && !previous.includes(side)) {
      nextState = updateMorale(nextState, side === 'enemy' ? 'player' : 'enemy', rules.group.formation.breakMoraleDelta);
    }
    steps.push(makeStep(nextState, 'formation', {
      actorId: actor.id,
      affectedCellIds: [targetCell.id],
      sourceName: 'formation',
      message: previous && !previous.includes(side) ? 'formation_broken_and_taken' : 'formation_controlled',
      visual: {
        motif: 'array_node',
        primaryTint: '#C9A96E',
        motion: 'array_expand',
        intensity: 'high',
      },
      tags: ['group', 'formation', side],
    }));
    nextState = markActorActed(nextState, actor.id);
    return { state: appendSteps(nextState, steps), steps, validation };
  }

  if (action.type === 'observe') {
    const revealLimit = rules.group.ambush.observeRevealCount;
    const hiddenIds = nextState.units
      .filter(unit => unit.hp > 0 && unit.revealed === false)
      .slice(0, revealLimit)
      .map(unit => unit.id);
    const units = nextState.units.map(unit => hiddenIds.includes(unit.id) ? { ...unit, revealed: true } : unit);
    nextState = {
      ...nextState,
      units,
      grid: { ...nextState.grid, cells: withCellOccupants(nextState.grid.cells, units) },
      ambush: nextState.ambush ? { ...nextState.ambush, revealed: hiddenIds.length > 0 || nextState.ambush.revealed } : nextState.ambush,
    };
    steps.push(makeStep(nextState, 'ambush', {
      actorId: actor.id,
      targetIds: hiddenIds,
      affectedCellIds: validation.affectedCellIds,
      sourceName: 'observe',
      message: hiddenIds.length ? 'hidden_units_revealed' : 'battlefield_observed',
      visual: {
        motif: 'observe',
        primaryTint: '#4B6E8B',
        motion: 'scan_reveal',
        intensity: 'subtle',
      },
      tags: ['group', 'observe', hiddenIds.length ? 'revealed' : 'intel'],
    }));
    nextState = markActorActed(nextState, actor.id);
    return { state: appendSteps(nextState, steps), steps, validation };
  }

  return failureResolution(nextState, action, 'unsupported_action');
}

function executeRetreatAction(state: BattlefieldCombatState, action: BattlefieldAction, validation: BattlefieldActionValidation): BattlefieldActionResolution {
  let nextState = cloneState(state);
  const actor = getUnit(nextState, action.actorId)!;
  const actorCell = getCell(nextState, actor.cellId)!;
  const adjacentEnemies = nextState.units.filter(unit => unit.hp > 0 && isHostile(actor, unit)).filter(unit => {
    const cell = getCell(nextState, unit.cellId);
    return !!cell && manhattan(actorCell, cell) <= 1;
  }).length;
  let chance = rules.escape.baseChance;
  if (isEdgeCell(actorCell)) chance += rules.escape.edgeBonus;
  if (actor.side === 'ally') chance += rules.escape.allySideBonus;
  if (state.mode === 'group' && (state.objectives ?? []).some(objective => objective.status === 'active')) chance -= rules.group.retreat.objectivePenalty;
  if (state.mode === 'group' && actorCell.flags.includes('cover')) chance += rules.group.retreat.allyCoverBonus;
  chance -= adjacentEnemies * rules.escape.enemyAdjacentPenalty;
  if (actor.statusEffects.includes('bound')) chance -= rules.escape.boundPenalty;
  chance = Math.max(rules.escape.minChance, Math.min(rules.escape.maxChance, chance));
  const rng = createSeededRng(`${nextState.seed}:${nextState.round}:${actor.id}:retreat`);
  const success = rollHit(chance, rng);
  const step = makeStep(nextState, success ? 'settlement' : 'failure', {
    actorId: actor.id,
    message: success ? 'retreat_success' : 'retreat_failed',
    blockedReason: success ? undefined : 'retreat_failed',
    visual: {
      motif: 'retreat',
      primaryTint: success ? '#5C8B7A' : '#8B3A3A',
      motion: success ? 'fade_out' : 'stumble',
      intensity: 'normal',
    },
    tags: ['retreat', success ? 'success' : 'failure'],
  });
  if (success) {
    nextState = {
      ...nextState,
      phase: 'ended',
      result: { winner: 'escaped', reason: 'retreat_success', roundsTaken: nextState.round },
    };
  } else {
    nextState = markActorActed(nextState, actor.id);
  }
  nextState = appendSteps(nextState, [step]);
  return { state: nextState, steps: [step], validation };
}

export function executeBattlefieldAction(state: BattlefieldCombatState, action: BattlefieldAction): BattlefieldActionResolution {
  const validation = validateBattlefieldAction(state, action);
  if (!validation.ok) return failureResolution(state, action, validation.reason ?? 'action_invalid', validation.sourceName, validation.tags);
  if (action.type === 'move') return executeMoveAction(state, action, validation);
  if (action.type === 'gu') return executeGuAction(state, action, validation);
  if (action.type === 'killer_move') return executeKillerMoveAction(state, action, validation);
  if (action.type === 'assist' || action.type === 'guard' || action.type === 'rally' || action.type === 'formation' || action.type === 'observe') {
    return executeGroupSupportAction(state, action, validation);
  }
  if (action.type === 'retreat') return executeRetreatAction(state, action, validation);
  if (action.type === 'wait') {
    const step = makeStep(state, 'settlement', {
      actorId: action.actorId,
      message: 'wait',
      visual: {
        motif: 'wait',
        primaryTint: '#7A8EA8',
        motion: 'hold',
        intensity: 'subtle',
      },
      tags: ['wait'],
    });
    return { state: appendSteps(markActorActed(state, action.actorId), [step]), steps: [step], validation };
  }
  return failureResolution(state, action, 'unsupported_action');
}

function chooseHostileTarget(state: BattlefieldCombatState, actor: BattlefieldUnit): BattlefieldUnit | undefined {
  const visibleHostiles = state.units
    .filter(unit => unit.hp > 0 && groupVisible(unit) && isHostile(actor, unit));
  return visibleHostiles.sort((a, b) => (b.threat ?? 0) - (a.threat ?? 0) || a.hp - b.hp)[0];
}

function firstUsableGuAction(state: BattlefieldCombatState, actor: BattlefieldUnit, target: BattlefieldUnit): BattlefieldAction | null {
  for (const guName of actor.guNames) {
    const action: BattlefieldAction = {
      type: 'gu',
      actorId: actor.id,
      guName,
      targetCellId: target.cellId,
      targetUnitIds: [target.id],
    };
    if (validateBattlefieldAction(state, action).ok) return action;
  }
  return null;
}

function enterDueThirdParties(state: BattlefieldCombatState): { state: BattlefieldCombatState; steps: BattleResolutionStep[] } {
  let nextState = state;
  const steps: BattleResolutionStep[] = [];
  for (const party of nextState.thirdParties ?? []) {
    if (party.entered || nextState.round < party.entryRound) continue;
    const units = nextState.units.map(unit => party.unitIds.includes(unit.id) ? { ...unit, revealed: true } : unit);
    nextState = {
      ...nextState,
      units,
      grid: { ...nextState.grid, cells: withCellOccupants(nextState.grid.cells, units) },
      thirdParties: (nextState.thirdParties ?? []).map(item => item.id === party.id ? { ...item, entered: true } : item),
    };
    steps.push(makeStep(nextState, 'third_party', {
      targetIds: party.unitIds,
      sourceName: party.id,
      message: 'third_party_entered',
      visual: {
        motif: 'third_party_entry',
        primaryTint: '#7A8EA8',
        motion: 'enter_field',
        intensity: 'high',
      },
      tags: ['group', 'third_party', party.stance],
    }));
  }
  return { state: nextState, steps };
}

export function resolveBattlefieldAmbushOpening(state: BattlefieldCombatState): BattlefieldActionResolution {
  let nextState = cloneState(state);
  const ambush = nextState.ambush;
  if (!ambush || ambush.openingResolved) {
    return {
      state: nextState,
      steps: [],
      validation: defaultValidation({ type: 'observe', actorId: 'system' }, { ok: true, tags: ['ambush', 'noop'] }),
    };
  }
  const steps: BattleResolutionStep[] = [];
  const ambushers = ambush.hiddenUnitIds
    .map(id => getUnit(nextState, id))
    .filter((unit): unit is BattlefieldUnit => !!unit && unit.hp > 0);
  if (!ambush.revealed) {
    nextState = updateMorale(nextState, ambush.side === 'enemy' ? 'player' : 'enemy', -rules.group.morale.ambushLoss);
    for (const ambusher of ambushers) {
      const target = chooseHostileTarget(nextState, ambusher);
      if (!target) continue;
      const damage = Math.max(1, Math.round((ambusher.attack ?? rules.defaults.attack) * 0.35 * rules.group.ambush.firstStrikeDamageMultiplier));
      const damagedTarget = { ...target, hp: Math.max(0, target.hp - damage) };
      nextState = updateUnit(nextState, damagedTarget);
      steps.push(makeStep(nextState, 'ambush', {
        actorId: ambusher.id,
        targetIds: [target.id],
        affectedCellIds: [target.cellId],
        damage,
        sourceName: 'ambush_opening',
        message: 'ambush_first_strike',
        visual: {
          motif: 'ambush',
          primaryTint: '#8B3A3A',
          motion: 'burst_from_cover',
          intensity: 'high',
        },
        tags: ['group', 'ambush', 'first_strike'],
      }));
    }
  } else {
    steps.push(makeStep(nextState, 'ambush', {
      targetIds: ambushers.map(unit => unit.id),
      sourceName: 'ambush_opening',
      message: 'ambush_revealed_before_opening',
      visual: {
        motif: 'ambush_revealed',
        primaryTint: '#4B6E8B',
        motion: 'reveal',
        intensity: 'subtle',
      },
      tags: ['group', 'ambush', 'revealed'],
    }));
  }
  nextState = {
    ...nextState,
    ambush: { ...ambush, openingResolved: true, revealed: true },
    units: nextState.units.map(unit => ambush.hiddenUnitIds.includes(unit.id) ? { ...unit, revealed: true } : unit),
  };
  nextState = {
    ...nextState,
    grid: { ...nextState.grid, cells: withCellOccupants(nextState.grid.cells, nextState.units) },
  };
  const settled = settleIfNeeded(appendSteps(nextState, steps));
  const allSteps = settled.step ? [...steps, settled.step] : steps;
  return {
    state: settled.state,
    steps: allSteps,
    validation: defaultValidation({ type: 'observe', actorId: 'system' }, { ok: true, tags: ['ambush'] }),
  };
}

export function resolveBattlefieldEnemyTurn(state: BattlefieldCombatState): BattlefieldActionResolution {
  let nextState = cloneState(state);
  const entry = enterDueThirdParties(nextState);
  nextState = entry.state;
  const steps: BattleResolutionStep[] = [...entry.steps];

  const enemies = listBattlefieldTurnOrder(nextState).filter(unit => unit.side === 'enemy' && unit.hp > 0 && groupVisible(unit));
  for (const enemy of enemies) {
    const targets = nextState.units
      .filter(unit => unit.hp > 0 && groupVisible(unit) && isHostile(enemy, unit))
      .sort((a, b) => (b.threat ?? 0) - (a.threat ?? 0) || a.hp - b.hp);
    const action = targets.map(target => firstUsableGuAction(nextState, enemy, target)).find(Boolean) ?? null;
    if (!action) continue;
    const resolution = executeBattlefieldAction(nextState, action);
    nextState = resolution.state;
    steps.push(...resolution.steps);
    if (nextState.phase === 'ended') break;
  }

  const thirdParties = listBattlefieldTurnOrder(nextState).filter(unit => unit.side === 'neutral' && unit.hp > 0 && unit.revealed !== false);
  for (const third of thirdParties) {
    const target = nextState.units
      .filter(unit => unit.hp > 0 && unit.side !== 'neutral')
      .sort((a, b) => (b.threat ?? 0) - (a.threat ?? 0))[0];
    if (!target) continue;
    const damage = Math.max(1, Math.round((third.attack ?? rules.defaults.attack) * rules.group.thirdParty.damageMultiplier * 0.25));
    const damaged = { ...target, hp: Math.max(0, target.hp - damage) };
    nextState = updateUnit(nextState, damaged);
    const step = makeStep(nextState, 'third_party', {
      actorId: third.id,
      targetIds: [target.id],
      affectedCellIds: [target.cellId],
      damage,
      sourceName: 'third_party',
      message: 'third_party_pressure',
      visual: {
        motif: 'third_party',
        primaryTint: '#7A8EA8',
        motion: 'intervene',
        intensity: 'normal',
      },
      tags: ['group', 'third_party'],
    });
    nextState = appendSteps(nextState, [step]);
    steps.push(step);
  }

  nextState = {
    ...nextState,
    phase: nextState.phase === 'ended' ? nextState.phase : 'player_turn',
    actedUnitIdsThisRound: [],
    activeUnitId: nextFriendlyActor(nextState, []),
  };
  const settled = settleIfNeeded(nextState);
  const allSteps = settled.step ? [...steps, settled.step] : steps;
  return {
    state: settled.state,
    steps: allSteps,
    validation: defaultValidation({ type: 'wait', actorId: 'enemy_turn' }, { ok: true, tags: ['enemy_turn', 'group'] }),
  };
}

export function advanceBattlefieldRound(state: BattlefieldCombatState): BattlefieldActionResolution {
  let nextState = cloneState(state);
  nextState = {
    ...nextState,
    round: nextState.round + 1,
    units: nextState.units.map(tickCooldowns),
    actedUnitIdsThisRound: nextState.mode === 'group' ? [] : nextState.actedUnitIdsThisRound,
    activeEffects: (nextState.activeEffects ?? [])
      .map(effect => ({ ...effect, remainingTurns: effect.remainingTurns - 1 }))
      .filter(effect => effect.remainingTurns > 0),
  };
  if (nextState.mode === 'group') {
    nextState = { ...nextState, activeUnitId: nextFriendlyActor(nextState, []) };
  }

  const steps: BattleResolutionStep[] = [];
  if (nextState.mode === 'group') {
    const entry = enterDueThirdParties(nextState);
    nextState = entry.state;
    steps.push(...entry.steps);
  }
  const remainingPending: BattlefieldPendingAction[] = [];
  for (const pending of nextState.pendingActions ?? []) {
    const actor = getUnit(nextState, pending.actorId);
    const move = getKillerMoveExpressionSpec(pending.sourceName);
    if (!actor || !move || actor.hp <= 0) {
      steps.push(makeStep(nextState, 'failure', {
        actorId: pending.actorId,
        sourceName: pending.sourceName,
        message: 'pending_action_lost_actor',
        blockedReason: 'pending_action_lost_actor',
        visual: {
          motif: 'pending_lost',
          primaryTint: '#8B3A3A',
          motion: 'fade',
          intensity: 'subtle',
        },
        tags: ['pending', 'failure'],
      }));
      continue;
    }
    if (pending.remainingTurns > 1) {
      remainingPending.push({ ...pending, remainingTurns: pending.remainingTurns - 1 });
      steps.push(makeStep(nextState, 'status_tick', {
        actorId: actor.id,
        sourceName: pending.sourceName,
        affectedCellIds: pending.affectedCellIds,
        message: 'pending_action_charging',
        visual: visualForMove(move, 'subtle'),
        tags: ['pending', 'charging'],
      }));
      continue;
    }
    const validation = defaultValidation({ type: 'killer_move', actorId: actor.id, killerMoveName: move.moveName }, {
      ok: true,
      validTargetCellIds: pending.targetCellId ? [pending.targetCellId] : [],
      affectedCellIds: pending.affectedCellIds,
      targetUnitIds: pending.targetUnitIds,
      resourceCost: pending.resourceCost,
      sourceName: pending.sourceName,
      tags: [move.path, move.boardPattern.shape, 'pending_release'],
    });
    const released = releaseKillerMove(nextState, actor, move, validation);
    nextState = released.state;
    steps.push(...released.steps);
  }
  nextState = {
    ...nextState,
    pendingActions: remainingPending,
  };
  const settled = settleIfNeeded(appendSteps(nextState, steps));
  const allSteps = settled.step ? [...steps, settled.step] : steps;
  return {
    state: settled.state,
    steps: allSteps,
    validation: defaultValidation({ type: 'wait', actorId: 'system' }, { ok: true, tags: ['advance_round'] }),
  };
}

export function interruptPendingBattlefieldAction(
  state: BattlefieldCombatState,
  pendingActionId: string,
  reason: string,
): BattlefieldActionResolution {
  let nextState = cloneState(state);
  const pending = (nextState.pendingActions ?? []).find(action => action.id === pendingActionId);
  if (!pending) {
    return failureResolution(nextState, { type: 'wait', actorId: 'system', pendingActionId }, 'pending_action_not_found', pendingActionId);
  }
  if (!pending.interruptible) {
    return failureResolution(nextState, { type: 'wait', actorId: pending.actorId, pendingActionId }, 'pending_action_not_interruptible', pending.sourceName);
  }
  const actor = getUnit(nextState, pending.actorId);
  if (actor) {
    const damagedActor = {
      ...actor,
      hp: Math.max(0, actor.hp - rules.pending.defaultInterruptBacklashDamage),
      cooldowns: {
        ...(actor.cooldowns ?? {}),
        [pending.sourceName]: Math.max(actor.cooldowns?.[pending.sourceName] ?? 0, rules.pending.interruptionCooldownPenalty),
      },
    };
    nextState = updateUnit(nextState, damagedActor);
  }
  nextState = {
    ...nextState,
    pendingActions: (nextState.pendingActions ?? []).filter(action => action.id !== pendingActionId),
  };
  const step = makeStep(nextState, 'counter', {
    actorId: pending.actorId,
    sourceName: pending.sourceName,
    affectedCellIds: pending.affectedCellIds,
    damage: actor ? rules.pending.defaultInterruptBacklashDamage : undefined,
    message: reason,
    blockedReason: reason,
    visual: {
      motif: 'interrupt',
      primaryTint: '#8B3A3A',
      motion: 'snap',
      intensity: 'normal',
    },
    tags: ['interrupt', 'pending', pending.sourceName],
  });
  nextState = appendSteps(nextState, [step]);
  return {
    state: nextState,
    steps: [step],
    validation: defaultValidation({ type: 'wait', actorId: pending.actorId, pendingActionId }, {
      ok: true,
      reason,
      sourceName: pending.sourceName,
      affectedCellIds: pending.affectedCellIds,
      targetUnitIds: pending.targetUnitIds,
      tags: ['interrupt'],
    }),
  };
}

export function getBattlefieldCombatRulesForTests() {
  return rules;
}
