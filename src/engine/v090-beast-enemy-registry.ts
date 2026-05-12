import wildBeastsRaw from '../canon/wild-beasts.json';
import type {
  BattleOutcomeResult,
  BattlefieldCombatState,
  BattlefieldUnit,
  BeastEncounterKind,
  BeastEncounterRuntimeSpec,
  BeastEnemySpec,
  BeastLootResolution,
  CombatEncounterSpec,
  CombatEventCandidate,
} from '../types';
import { createSeededRng } from './combat-formulas';
import { getRuntimePathNames, isRuntimePathAllowed } from './path-registry';
import { getMaterialEntry, resolveMaterialAlias } from './material-registry';
import { createBattlefieldGroupCombatState } from './v080-battlefield-combat-engine';
import {
  extractKillerMoveNames,
  extractNormalCombatGuNames,
  type BattlefieldDemoSource,
} from './v080-battlefield-ui-model';
import type { TrainingGroundSpec } from './training-ground-engine';

type HuntBinding = {
  encounterKind: BeastEncounterKind;
  gridPresetId: 'ambush_7x5' | 'skirmish_5x3';
  dropPolicyId: string;
  enemyPool: string[];
  minEnemies: number;
  maxEnemies: number;
  risk: 'low' | 'medium' | 'high';
  notes?: string;
};

const raw = wildBeastsRaw as any;
const runtimePaths = new Set(getRuntimePathNames());

function cloneSpec(spec: BeastEnemySpec): BeastEnemySpec {
  return {
    ...spec,
    daoMarkBias: { ...(spec.daoMarkBias || {}) },
    battlefield: {
      ...spec.battlefield,
      preferredTerrain: [...(spec.battlefield?.preferredTerrain || [])],
    },
    instinctMoves: (spec.instinctMoves || []).map(move => ({
      ...move,
      statusEffects: [...(move.statusEffects || [])],
      terrainEffects: [...(move.terrainEffects || [])],
      tags: [...(move.tags || [])],
      visualMotif: { ...move.visualMotif },
    })),
    dropRule: {
      ...spec.dropRule,
      materialIds: [...(spec.dropRule?.materialIds || [])],
      clueIds: [...(spec.dropRule?.clueIds || [])],
    },
  };
}

function listRawEnemySpecs(): BeastEnemySpec[] {
  return ((raw.enemyRegistry || []) as BeastEnemySpec[]).filter(Boolean);
}

export function listBeastEnemySpecs(): BeastEnemySpec[] {
  return listRawEnemySpecs().map(cloneSpec);
}

export function getBeastEnemySpec(idOrName: string | undefined | null): BeastEnemySpec | null {
  if (!idOrName) return null;
  const text = String(idOrName);
  const found = listRawEnemySpecs().find(spec => spec.id === text || spec.name === text);
  return found ? cloneSpec(found) : null;
}

export function getHuntBindingForGround(groundId: string | undefined | null): HuntBinding | null {
  if (!groundId) return null;
  const binding = raw.huntBindings?.[String(groundId)];
  return binding ? {
    encounterKind: binding.encounterKind,
    gridPresetId: binding.gridPresetId || 'ambush_7x5',
    dropPolicyId: binding.dropPolicyId || 'desolate_material_clue',
    enemyPool: Array.isArray(binding.enemyPool) ? binding.enemyPool.map(String) : [],
    minEnemies: Math.max(1, Number(binding.minEnemies || 1)),
    maxEnemies: Math.max(1, Number(binding.maxEnemies || binding.minEnemies || 1)),
    risk: binding.risk || 'high',
    notes: binding.notes,
  } : null;
}

function isKnownMaterialId(materialId: string): boolean {
  if (getMaterialEntry(materialId) || resolveMaterialAlias(materialId)) return true;
  if (materialId === '通用蛊材' || materialId === '通用仙材') return true;
  for (const path of runtimePaths) {
    if (materialId === `${path}蛊材` || materialId === `${path}仙材`) return true;
  }
  return false;
}

export function validateBeastEnemyRegistry(): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  for (const spec of listRawEnemySpecs()) {
    if (!spec.id) errors.push('enemy_missing_id');
    if (ids.has(spec.id)) errors.push(`duplicate_enemy:${spec.id}`);
    ids.add(spec.id);
    if (!isRuntimePathAllowed(spec.path)) errors.push(`enemy_illegal_path:${spec.id}:${spec.path}`);
    for (const path of Object.keys(spec.daoMarkBias || {})) {
      if (!isRuntimePathAllowed(path)) errors.push(`enemy_illegal_dao_mark_path:${spec.id}:${path}`);
    }
    if (spec.tier === 'immemorial_rumor' && spec.runtimeAllowed) {
      errors.push(`immemorial_runtime_enabled:${spec.id}`);
    }
    if (!spec.instinctMoves?.length) errors.push(`enemy_missing_instinct:${spec.id}`);
    for (const move of spec.instinctMoves || []) {
      if (!move.id || !move.name) errors.push(`enemy_move_missing_identity:${spec.id}`);
      if (!Number.isFinite(move.range) || move.range < 1) errors.push(`enemy_move_bad_range:${spec.id}:${move.id}`);
      if (!move.visualMotif?.motif) errors.push(`enemy_move_missing_visual:${spec.id}:${move.id}`);
    }
    for (const materialId of spec.dropRule?.materialIds || []) {
      if (!isKnownMaterialId(materialId)) errors.push(`enemy_unknown_material:${spec.id}:${materialId}`);
    }
    if (spec.dropRule?.parasiteGuPolicy !== 'none') {
      warnings.push(`parasite_gu_unstable:${spec.id}`);
    }
  }

  for (const [groundId, binding] of Object.entries(raw.huntBindings || {})) {
    const typed = binding as HuntBinding;
    if (!typed.enemyPool?.length) errors.push(`hunt_binding_empty_pool:${groundId}`);
    for (const enemyId of typed.enemyPool || []) {
      if (!ids.has(enemyId)) errors.push(`hunt_binding_unknown_enemy:${groundId}:${enemyId}`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function describeHuntGroundBinding(groundId: string): {
  available: boolean;
  enemyNames: string[];
  risk?: 'low' | 'medium' | 'high';
  gridPresetId?: string;
  dropPolicyId?: string;
  notes?: string;
} {
  const binding = getHuntBindingForGround(groundId);
  if (!binding) return { available: false, enemyNames: [] };
  return {
    available: true,
    enemyNames: binding.enemyPool.map(id => getBeastEnemySpec(id)?.name || id),
    risk: binding.risk,
    gridPresetId: binding.gridPresetId,
    dropPolicyId: binding.dropPolicyId,
    notes: binding.notes,
  };
}

function pickEnemies(binding: HuntBinding, seed: string | number): BeastEnemySpec[] {
  const pool = binding.enemyPool
    .map(id => getBeastEnemySpec(id))
    .filter((spec): spec is BeastEnemySpec => !!spec && spec.runtimeAllowed);
  if (!pool.length) return [];
  const rng = createSeededRng(seed);
  const max = Math.max(binding.minEnemies, Math.min(binding.maxEnemies, pool.length));
  const count = Math.max(binding.minEnemies, Math.min(max, binding.minEnemies + Math.floor(rng.next() * (max - binding.minEnemies + 1))));
  const remaining = [...pool];
  const selected: BeastEnemySpec[] = [];
  while (selected.length < count && remaining.length) {
    const index = Math.min(remaining.length - 1, Math.floor(rng.next() * remaining.length));
    selected.push(remaining.splice(index, 1)[0]);
  }
  return selected;
}

export function buildHuntCombatCandidate(
  ground: TrainingGroundSpec,
  store: any = {},
  seed: string | number = `${store?.turn || 1}:${ground.id}:hunt`,
): CombatEventCandidate | null {
  const binding = getHuntBindingForGround(ground.id);
  if (!binding) return null;
  const enemies = pickEnemies(binding, seed);
  if (!enemies.length) return null;
  const turn = Number(store?.turn || 1);
  return {
    id: `hunt_${ground.id}_${turn}`,
    type: 'environment',
    title: `${ground.name}狩猎`,
    summary: `${ground.name}线索指向 ${enemies.map(enemy => enemy.name).join('、')}。此战走 7x5 群像棋盘；寄生蛊只会成为损毁、逃脱、传闻或后续调查线索。`,
    risk: binding.risk,
    source: 'engine',
    scale: 'group_7x5',
    enemyHint: enemies.map(enemy => enemy.name).join('、'),
    requiredRealmGrand: Math.max(...enemies.map(enemy => Math.min(enemy.realmNum, 7))),
    createdTurn: turn,
    encounterKind: binding.encounterKind,
    enemySpecIds: enemies.map(enemy => enemy.id),
    groundId: ground.id,
    dropPolicyId: binding.dropPolicyId,
    gridPresetId: binding.gridPresetId,
  };
}

function playerUnitFromStore(source: BattlefieldDemoSource, spec: CombatEncounterSpec): BattlefieldUnit {
  const primaryPath = source.pathBuild?.primary || source.primaryPath || '力道';
  const daoMarks = source.pathBuild?.dao_marks || source.daoMarks || { [primaryPath]: 80 };
  const guNames = extractNormalCombatGuNames(source);
  const killerMoveNames = extractKillerMoveNames(source, guNames);
  const realmNum = Math.max(1, Math.min(9, Number(source.profile?.realm?.grand || 6)));
  const healthMax = Number(source.vitals?.health?.max || (realmNum >= 6 ? 620 : 220));
  const healthCurrent = Number(source.vitals?.health?.current || healthMax);
  const essenceMax = Number(source.vitals?.essence?.max || (realmNum >= 6 ? 180 : 100));
  const essenceCurrent = Number(source.vitals?.essence?.current || essenceMax);
  return {
    id: 'player',
    name: source.profile?.name || '狩猎蛊师',
    side: 'player',
    cellId: 'c3_2',
    realmNum,
    path: primaryPath,
    hp: Math.max(1, Math.min(healthCurrent, healthMax)),
    maxHp: healthMax,
    attack: 38 + realmNum * 10,
    defense: 18 + realmNum * 6,
    accuracy: 74,
    evasion: 24,
    daoMarks,
    essence: { current: essenceCurrent, max: essenceMax, type: realmNum >= 6 ? 'immortal' : 'primeval' },
    guNames,
    killerMoveNames,
    cooldowns: {},
    statusEffects: [],
    role: 'leader',
    morale: 66,
    threat: 75,
    intent: `${spec.title}：玩家通过剧情线索出发，战斗胜负由本地 battlefield 引擎结算。`,
  };
}

function beastUnit(spec: BeastEnemySpec, index: number): BattlefieldUnit {
  const spawnCells = ['c5_1', 'c6_2', 'c5_3', 'c6_4', 'c4_1'];
  return {
    id: `beast_${spec.id}_${index}`,
    name: spec.name,
    side: 'enemy',
    cellId: spawnCells[index % spawnCells.length],
    realmNum: spec.realmNum,
    path: spec.path,
    hp: spec.battlefield.hp,
    maxHp: spec.battlefield.hp,
    attack: spec.battlefield.attack,
    defense: spec.battlefield.defense,
    accuracy: spec.battlefield.accuracy,
    evasion: spec.battlefield.evasion,
    daoMarks: spec.daoMarkBias,
    cooldowns: {},
    killerMoveNames: [],
    essence: undefined,
    guNames: [],
    statusEffects: [],
    role: spec.kind.includes('guardian') ? 'guard' : 'vanguard',
    morale: spec.realmNum >= 6 ? 78 : 60,
    threat: 55 + spec.realmNum * 7,
    revealed: index === 0 || spec.battlefield.behavior !== 'ambush',
    objectiveTags: [spec.kind, spec.tier, ...spec.battlefield.preferredTerrain],
    intent: `${spec.name} uses beast instinct, not Gu-master guNames.`,
    beastSpecId: spec.id,
    instinctMoves: spec.instinctMoves,
  };
}

export function createBattlefieldBeastEncounterState(
  store: any,
  spec: CombatEncounterSpec,
): BattlefieldCombatState {
  const enemies = (spec.enemySpecIds || [])
    .map(id => getBeastEnemySpec(id))
    .filter((enemy): enemy is BeastEnemySpec => !!enemy);
  const units: BattlefieldUnit[] = [
    playerUnitFromStore(store, spec),
    ...enemies.map(beastUnit),
  ];
  const hiddenUnitIds = units.filter(unit => unit.side === 'enemy' && unit.revealed === false).map(unit => unit.id);
  return createBattlefieldGroupCombatState({
    battleId: `beast_${spec.id}`,
    seed: `${spec.id}:${spec.createdTurn}`,
    gridPresetId: (spec.gridPresetId as any) || 'ambush_7x5',
    mode: 'group',
    phase: 'player_turn',
    activeTerrainId: 'dense_forest',
    activeFormationId: 'hunt_line',
    eventWindows: ['scout', 'action', 'counter', 'settlement'],
    units,
    morale: { player: 64, enemy: enemies.some(enemy => enemy.realmNum >= 7) ? 76 : 66 },
    objectives: [{
      id: 'hunt_survive_or_drive_off',
      type: 'defeat_key',
      label: '击退狩猎目标',
      status: 'active',
      targetUnitId: units.find(unit => unit.side === 'enemy')?.id,
    }],
    ambush: hiddenUnitIds.length ? {
      side: 'enemy',
      revealed: false,
      openingResolved: false,
      hiddenUnitIds,
      scoutDifficulty: 62,
    } : undefined,
  });
}

function safeMaterial(materialId: string): string | null {
  if (getMaterialEntry(materialId)) return materialId;
  const alias = resolveMaterialAlias(materialId);
  if (alias) return alias.id;
  if (materialId === '通用蛊材' || materialId === '通用仙材') return materialId;
  for (const path of runtimePaths) {
    if (materialId === `${path}蛊材` || materialId === `${path}仙材`) return materialId;
  }
  return null;
}

export function resolveBeastLootForOutcome(
  spec: CombatEncounterSpec,
  result: BattleOutcomeResult,
  seed: string | number = `${spec.id}:loot`,
): BeastLootResolution {
  const enemies = (spec.enemySpecIds || [])
    .map(id => getBeastEnemySpec(id))
    .filter((enemy): enemy is BeastEnemySpec => !!enemy);
  const materialDrops: Record<string, number> = {};
  const clueDrops = new Set<string>();
  const rumors: string[] = [];
  const blockedRewards: string[] = [];
  const steps: string[] = [];
  if (result !== 'victory') {
    return {
      encounterId: spec.id,
      result,
      materialDrops,
      clueDrops: [],
      rumors: ['狩猎未胜利，不发放正收益掉落。'],
      blockedRewards: [],
      parasiteGuOutcome: 'none',
      steps: ['no_positive_loot_without_victory'],
    };
  }

  const rng = createSeededRng(seed);
  let parasiteGuOutcome: BeastLootResolution['parasiteGuOutcome'] = 'none';
  for (const enemy of enemies) {
    const maxCount = Math.max(enemy.dropRule.minCount, enemy.dropRule.maxCount);
    const count = enemy.dropRule.minCount + Math.floor(rng.next() * (maxCount - enemy.dropRule.minCount + 1));
    for (let i = 0; i < count; i += 1) {
      const pool = enemy.dropRule.materialIds.map(safeMaterial).filter(Boolean) as string[];
      const material = pool.length ? pool[Math.min(pool.length - 1, Math.floor(rng.next() * pool.length))] : null;
      if (material) materialDrops[material] = (materialDrops[material] || 0) + 1;
    }
    for (const clueId of enemy.dropRule.clueIds || []) clueDrops.add(clueId);
    if (enemy.dropRule.parasiteGuPolicy === 'damaged_or_escape') {
      parasiteGuOutcome = rng.next() < 0.5 ? 'destroyed' : 'escaped';
      rumors.push(`${enemy.name}体内疑有寄生蛊残痕，但战后${parasiteGuOutcome === 'destroyed' ? '损毁' : '逃脱'}，只留下后续调查线索。`);
    } else if (enemy.dropRule.parasiteGuPolicy === 'rumor_only') {
      parasiteGuOutcome = parasiteGuOutcome === 'none' ? 'rumor_only' : parasiteGuOutcome;
      rumors.push(`${enemy.name}可能曾寄生蛊虫，但本次只能作为传闻记录。`);
    }
  }
  blockedRewards.push('immortal_gu_drop_blocked');
  blockedRewards.push('rank_ten_or_eternal_life_blocked');
  steps.push(`materials:${Object.entries(materialDrops).map(([name, count]) => `${name}x${count}`).join(',') || 'none'}`);
  steps.push(`clues:${[...clueDrops].join(',') || 'none'}`);
  steps.push(`parasite_gu:${parasiteGuOutcome}`);
  return {
    encounterId: spec.id,
    result,
    materialDrops,
    clueDrops: [...clueDrops],
    rumors,
    blockedRewards,
    parasiteGuOutcome,
    steps,
  };
}
