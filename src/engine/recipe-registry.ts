import fragmentsRaw from '../canon/fragment-recipes.json';
import guDatabaseRaw from '../canon/gu-database.json';
import immortalGuRaw from '../canon/immortal-gu.json';
import { getMaterialEntry, resolveMaterialAlias } from './material-registry';

export type RecipeOperation = 'refine' | 'ascend' | 'immortal_ascend' | 'disassemble';
export type RecipeFailurePolicy = 'consume_all' | 'partial_return' | 'damage_source_gu' | 'rumor_only';
export type RecipeUnlockSource = 'innate' | 'fragment' | 'auction' | 'npc' | 'event' | 'legacy';

export interface RecipeGuInputs {
  sourceGu: Record<string, number>;
  auxiliaryGu: Record<string, number>;
}

export interface RecipeRegistryEntry extends RecipeGuInputs {
  id: string;
  targetGu: string;
  operation: RecipeOperation;
  targetTier: number;
  materials: Record<string, number>;
  immortalMaterials: Record<string, number>;
  essenceCost?: { type: '真元' | '仙元'; amount: number };
  currencyCost?: { type: '元石' | '仙元石'; amount: number };
  timeCost: number;
  difficulty: number;
  failurePolicy: RecipeFailurePolicy;
  unlockSources: RecipeUnlockSource[];
  requiredFragments?: number;
  sourceRef: string;
}

const guDatabase = guDatabaseRaw as Record<string, any>;
const immortalGuDatabase = immortalGuRaw as Record<string, any>;
const fragments = ((fragmentsRaw as any).fragments || []) as Array<Record<string, any>>;

const knownGuNames = new Set([
  ...Object.keys(guDatabase).filter(name => !name.startsWith('_')),
  ...Object.keys(immortalGuDatabase).filter(name => !name.startsWith('_')),
]);

function addCount(target: Record<string, number>, key: string, amount: number): void {
  if (!key || amount <= 0) return;
  target[key] = (target[key] || 0) + amount;
}

function splitCostBucket(record: Record<string, any> | undefined): {
  materials: Record<string, number>;
  immortalMaterials: Record<string, number>;
  auxiliaryGu: Record<string, number>;
} {
  const materials: Record<string, number> = {};
  const immortalMaterials: Record<string, number> = {};
  const auxiliaryGu: Record<string, number> = {};

  for (const [key, rawAmount] of Object.entries(record || {})) {
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (knownGuNames.has(key)) {
      addCount(auxiliaryGu, key, amount);
      continue;
    }
    const material = getMaterialEntry(key) || resolveMaterialAlias(key);
    if (material?.isImmortalMaterial || key.includes('仙材')) {
      addCount(immortalMaterials, material?.id || key, amount);
    } else {
      addCount(materials, material?.id || key, amount);
    }
  }

  return { materials, immortalMaterials, auxiliaryGu };
}

function mergeRecords(...records: Array<Record<string, number>>): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) addCount(merged, key, value);
  }
  return merged;
}

function normalizeLegacyCost(
  cost: any,
  targetGu: string,
  operation: RecipeOperation,
  targetTier: number,
  sourceRef: string,
): RecipeRegistryEntry | null {
  if (!cost || typeof cost !== 'object') return null;
  const generic = splitCostBucket(cost.generic);
  const specific = splitCostBucket(cost.specific);
  const isImmortalOperation = targetTier >= 6 || operation === 'immortal_ascend';
  const currency = Number(cost.currency || 0);

  return {
    id: `${operation}:${targetGu}`,
    targetGu,
    operation,
    targetTier,
    sourceGu: operation === 'ascend' || operation === 'immortal_ascend' ? { [targetGu]: 1 } : {},
    auxiliaryGu: mergeRecords(generic.auxiliaryGu, specific.auxiliaryGu),
    materials: mergeRecords(generic.materials, specific.materials),
    immortalMaterials: mergeRecords(generic.immortalMaterials, specific.immortalMaterials),
    currencyCost: currency > 0 ? { type: isImmortalOperation ? '仙元石' : '元石', amount: currency } : undefined,
    timeCost: Number(cost.turns || (operation === 'refine' ? Math.max(1, targetTier) : Math.max(1, targetTier - 1))),
    difficulty: Number(cost.difficulty || 0.3),
    failurePolicy: operation === 'ascend' ? 'damage_source_gu' : 'consume_all',
    unlockSources: operation === 'refine' && targetTier <= 2 ? ['innate'] : ['fragment', 'auction', 'npc', 'event'],
    sourceRef,
  };
}

function normalizeFragment(fragment: Record<string, any>): RecipeRegistryEntry | null {
  if (!fragment?.id || !fragment?.targetGu) return null;
  const split = splitCostBucket(
    Object.fromEntries((fragment.requiredMaterials || []).map((material: string) => [material, 1])),
  );
  const operation = fragment.type === 'ascend' ? 'ascend' : 'refine';
  const targetTier = Number(fragment.targetTier || 1);

  return {
    id: `fragment:${fragment.id}`,
    targetGu: fragment.targetGu,
    operation,
    targetTier,
    sourceGu: operation === 'ascend' ? { [fragment.targetGu]: 1 } : {},
    auxiliaryGu: split.auxiliaryGu,
    materials: split.materials,
    immortalMaterials: split.immortalMaterials,
    currencyCost: undefined,
    timeCost: 1,
    difficulty: Number(fragment.completionDifficulty || 0.3),
    failurePolicy: 'consume_all',
    unlockSources: ['fragment'],
    requiredFragments: Number(fragment.fragmentsRequired || 1),
    sourceRef: `fragment-recipes.json:${fragment.id}`,
  };
}

const entries: RecipeRegistryEntry[] = [];

for (const [guName, spec] of Object.entries(guDatabase)) {
  if (guName.startsWith('_')) continue;
  const gu = spec as any;
  const targetTier = Number(gu.tier || 1);
  const refine = normalizeLegacyCost(gu.refineCost, guName, 'refine', targetTier, `gu-database.json:${guName}.refineCost`);
  if (refine) entries.push(refine);
  const ascend = normalizeLegacyCost(gu.ascendCost, guName, 'ascend', targetTier + 1, `gu-database.json:${guName}.ascendCost`);
  if (ascend) entries.push(ascend);
}

for (const fragment of fragments) {
  const entry = normalizeFragment(fragment);
  if (entry) entries.push(entry);
}

export function getRecipeRegistryEntries(): RecipeRegistryEntry[] {
  return entries;
}

export function getRecipeRegistryEntry(id: string): RecipeRegistryEntry | undefined {
  return entries.find(entry => entry.id === id);
}

export function getRefineRecipeForGu(guName: string): RecipeRegistryEntry | undefined {
  return entries.find(entry => entry.operation === 'refine' && entry.targetGu === guName && entry.id.startsWith('refine:'));
}

export function getAscendRecipeForGu(guName: string): RecipeRegistryEntry | undefined {
  return entries.find(entry => entry.operation === 'ascend' && entry.targetGu === guName && entry.id.startsWith('ascend:'));
}

export function expandMaterialCost(entry: Pick<RecipeRegistryEntry, 'materials' | 'immortalMaterials'>): string[] {
  const names: string[] = [];
  for (const [name, amount] of Object.entries({ ...entry.materials, ...entry.immortalMaterials })) {
    for (let i = 0; i < amount; i++) names.push(name);
  }
  return names;
}

export function getRegisteredRecipeForFragment(fragmentId: string): RecipeRegistryEntry | undefined {
  return entries.find(entry => entry.id === `fragment:${fragmentId}`);
}
