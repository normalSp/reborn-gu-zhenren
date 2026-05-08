import terrainConfigRaw from '../canon/terrain-combat-config.json';
import { isRuntimePathAllowed } from './path-registry';

type NumericRange = [number, number];

interface TerrainEntry {
  name: string;
  description: string;
  pathDamageBonus?: Record<string, number>;
  hitBonus?: Record<string, number>;
  escapeModifier?: number;
  eventRiskModifier?: number;
}

interface FormationEntry {
  name: string;
  description: string;
  damageBonus?: number;
  hitBonus?: number;
  escapeModifier?: number;
  eventRiskModifier?: number;
}

interface TerrainConfig {
  clamps: {
    damageMultiplier: NumericRange;
    hitBonus: NumericRange;
    escapeModifier: NumericRange;
    eventRiskModifier: NumericRange;
  };
  terrains: Record<string, TerrainEntry>;
  formations: Record<string, FormationEntry>;
}

export interface TerrainCombatInput {
  terrainId?: string | null;
  formationId?: string | null;
  actorPath?: string | null;
}

export interface TerrainCombatModifier {
  terrainId: string | null;
  terrainName: string | null;
  formationId: string | null;
  formationName: string | null;
  damageMultiplier: number;
  hitBonus: number;
  escapeModifier: number;
  eventRiskModifier: number;
  notes: string[];
}

const TERRAIN_CONFIG = terrainConfigRaw as TerrainConfig;

function clamp(value: number, [min, max]: NumericRange): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getPathValue(record: Record<string, number> | undefined, path: string | null | undefined): number {
  if (!path || !isRuntimePathAllowed(path)) return 0;
  return record?.[path] ?? 0;
}

export function getTerrainCombatConfig(): TerrainConfig {
  return TERRAIN_CONFIG;
}

export function resolveTerrainCombatModifier(input: TerrainCombatInput): TerrainCombatModifier {
  const terrain = input.terrainId ? TERRAIN_CONFIG.terrains[input.terrainId] : undefined;
  const formation = input.formationId ? TERRAIN_CONFIG.formations[input.formationId] : undefined;
  const notes: string[] = [];

  if (input.terrainId && !terrain) notes.push(`未知地形 ${input.terrainId} 不参与战斗修正`);
  if (input.formationId && !formation) notes.push(`未知阵法 ${input.formationId} 不参与战斗修正`);
  if (input.actorPath && !isRuntimePathAllowed(input.actorPath)) {
    notes.push(`${input.actorPath} 不是运行时确认流派，地形不提供流派加成`);
  }

  const rawDamage =
    1 +
    getPathValue(terrain?.pathDamageBonus, input.actorPath) +
    (formation?.damageBonus ?? 0);
  const rawHit =
    getPathValue(terrain?.hitBonus, input.actorPath) +
    (formation?.hitBonus ?? 0);
  const rawEscape =
    (terrain?.escapeModifier ?? 0) +
    (formation?.escapeModifier ?? 0);
  const rawEventRisk =
    (terrain?.eventRiskModifier ?? 0) +
    (formation?.eventRiskModifier ?? 0);

  return {
    terrainId: terrain ? input.terrainId ?? null : null,
    terrainName: terrain?.name ?? null,
    formationId: formation ? input.formationId ?? null : null,
    formationName: formation?.name ?? null,
    damageMultiplier: round2(clamp(rawDamage, TERRAIN_CONFIG.clamps.damageMultiplier)),
    hitBonus: Math.round(clamp(rawHit, TERRAIN_CONFIG.clamps.hitBonus)),
    escapeModifier: round2(clamp(rawEscape, TERRAIN_CONFIG.clamps.escapeModifier)),
    eventRiskModifier: round2(clamp(rawEventRisk, TERRAIN_CONFIG.clamps.eventRiskModifier)),
    notes,
  };
}

export function listTerrainCombatOptions() {
  return {
    terrains: Object.entries(TERRAIN_CONFIG.terrains).map(([id, item]) => ({ id, ...item })),
    formations: Object.entries(TERRAIN_CONFIG.formations).map(([id, item]) => ({ id, ...item })),
  };
}
