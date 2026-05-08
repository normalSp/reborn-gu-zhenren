import {
  getMaterialEntry,
  getMaterialRegistryEntries,
  resolveMaterialAlias,
  type MaterialRegistryEntry,
  type RegisteredMaterialGrade,
} from './material-registry';

export type MaterialContainerKey = 'materialBag' | 'apertureMaterials' | 'apertureImmortalMaterials';

export interface EconomyStateLike {
  materialBag?: Record<string, number>;
  apertureInventory?: {
    gu?: unknown[];
    materials?: Record<string, number>;
    immortalMaterials?: Record<string, number>;
  };
  profile?: { realm?: { grand?: number } };
  vitals?: { essenceType?: 'mortal' | 'immortal' };
  flags?: Record<string, any>;
}

export interface MaterialSpendUnit {
  requested: string;
  actual: string;
  container: MaterialContainerKey;
}

export interface MaterialSpendResult {
  ok: boolean;
  consumed: MaterialSpendUnit[];
  missing: string[];
  patch?: Partial<EconomyStateLike>;
}

const EMPTY_APERTURE = { gu: [], materials: {}, immortalMaterials: {} };
const GRADE_ORDER: RegisteredMaterialGrade[] = ['普通', '精品', '稀有', '仙材'];

function cloneRecord(record?: Record<string, number>): Record<string, number> {
  return { ...(record || {}) };
}

function removeZeroes(record: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value > 0) next[key] = value;
  }
  return next;
}

function isImmortalState(state: EconomyStateLike): boolean {
  return (state.profile?.realm?.grand || 1) >= 6 || state.vitals?.essenceType === 'immortal';
}

function resolveEntry(name: string): MaterialRegistryEntry | undefined {
  return getMaterialEntry(name) || resolveMaterialAlias(name);
}

function getRequestedGrade(name: string): RegisteredMaterialGrade | undefined {
  return GRADE_ORDER.find(grade => name.includes(grade));
}

function getRequestedPath(name: string): string | undefined {
  if (!name.includes('蛊材')) return undefined;
  let raw = name.replace('通用蛊材', '').replace('蛊材', '');
  for (const grade of GRADE_ORDER) raw = raw.replace(grade, '');
  raw = raw.replace(/^[一二三四五六七八九十0-9]+转/, '').trim();
  return raw.endsWith('道') ? raw : undefined;
}

function shouldAcceptGenericRequest(requested: string, candidateName: string): boolean {
  const entry = resolveEntry(candidateName);
  const requestedGrade = getRequestedGrade(requested);
  const requestedPath = getRequestedPath(requested);
  const wantsImmortal = requested.includes('仙材');

  if (requestedGrade && entry?.grade !== requestedGrade) return false;
  if (wantsImmortal && !entry?.isImmortalMaterial) return false;
  if (requestedPath && entry?.path !== requestedPath && !candidateName.startsWith(requestedPath)) return false;

  if (requested.includes('通用蛊材') || requested.endsWith('蛊材')) {
    return entry?.kind === 'gu_material' || entry?.kind === 'immortal_material' || candidateName.endsWith('蛊材');
  }
  return false;
}

function containerEntries(state: EconomyStateLike): Array<[MaterialContainerKey, Record<string, number>]> {
  return [
    ['materialBag', cloneRecord(state.materialBag)],
    ['apertureMaterials', cloneRecord(state.apertureInventory?.materials)],
    ['apertureImmortalMaterials', cloneRecord(state.apertureInventory?.immortalMaterials)],
  ];
}

function buildPatch(
  state: EconomyStateLike,
  materialBag: Record<string, number>,
  apertureMaterials: Record<string, number>,
  apertureImmortalMaterials: Record<string, number>,
): Partial<EconomyStateLike> {
  return {
    materialBag: removeZeroes(materialBag),
    apertureInventory: {
      ...(state.apertureInventory || EMPTY_APERTURE),
      materials: removeZeroes(apertureMaterials),
      immortalMaterials: removeZeroes(apertureImmortalMaterials),
    },
  };
}

export function getMaterialInventoryView(state: EconomyStateLike): Record<string, number> {
  const view: Record<string, number> = {};
  for (const [, source] of containerEntries(state)) {
    for (const [key, value] of Object.entries(source)) {
      view[key] = (view[key] || 0) + value;
    }
  }
  return view;
}

export function getMaterialTotalQuantity(state: EconomyStateLike, materialName: string): number {
  const resolved = resolveEntry(materialName);
  const candidateNames = new Set([materialName, resolved?.id, ...(resolved?.aliases || [])].filter(Boolean) as string[]);
  let total = 0;
  for (const [, source] of containerEntries(state)) {
    for (const key of candidateNames) total += source[key] || 0;
  }
  if (total > 0) return total;
  for (const [, source] of containerEntries(state)) {
    for (const [key, value] of Object.entries(source)) {
      if (value > 0 && shouldAcceptGenericRequest(materialName, key)) total += value;
    }
  }
  return total;
}

export function addMaterialToState(
  state: EconomyStateLike,
  materialName: string,
  quantity: number,
): Partial<EconomyStateLike> {
  if (!materialName || quantity <= 0) return {};

  const entry = resolveEntry(materialName);
  const id = entry?.id || materialName;
  const materialBag = cloneRecord(state.materialBag);
  const apertureMaterials = cloneRecord(state.apertureInventory?.materials);
  const apertureImmortalMaterials = cloneRecord(state.apertureInventory?.immortalMaterials);

  if (isImmortalState(state)) {
    const target = entry?.isImmortalMaterial ? apertureImmortalMaterials : apertureMaterials;
    target[id] = (target[id] || 0) + quantity;
  } else {
    materialBag[id] = (materialBag[id] || 0) + quantity;
  }

  return buildPatch(state, materialBag, apertureMaterials, apertureImmortalMaterials);
}

export function removeMaterialFromState(
  state: EconomyStateLike,
  materialName: string,
  quantity: number,
): MaterialSpendResult {
  if (!materialName || quantity <= 0) return { ok: true, consumed: [], missing: [] };

  const materialBag = cloneRecord(state.materialBag);
  const apertureMaterials = cloneRecord(state.apertureInventory?.materials);
  const apertureImmortalMaterials = cloneRecord(state.apertureInventory?.immortalMaterials);
  const draft: Record<MaterialContainerKey, Record<string, number>> = {
    materialBag,
    apertureMaterials,
    apertureImmortalMaterials,
  };
  const consumed: MaterialSpendUnit[] = [];
  const missing: string[] = [];
  const resolved = resolveEntry(materialName);
  const exactCandidates = Array.from(new Set([materialName, resolved?.id, ...(resolved?.aliases || [])].filter(Boolean) as string[]));

  for (let i = 0; i < quantity; i++) {
    let hit: MaterialSpendUnit | null = null;

    for (const container of Object.keys(draft) as MaterialContainerKey[]) {
      for (const candidate of exactCandidates) {
        if ((draft[container][candidate] || 0) > 0) {
          hit = { requested: materialName, actual: candidate, container };
          break;
        }
      }
      if (hit) break;
    }

    if (!hit) {
      for (const container of Object.keys(draft) as MaterialContainerKey[]) {
        const genericKey = Object.keys(draft[container]).find(key =>
          (draft[container][key] || 0) > 0 && shouldAcceptGenericRequest(materialName, key)
        );
        if (genericKey) {
          hit = { requested: materialName, actual: genericKey, container };
          break;
        }
      }
    }

    if (!hit) {
      missing.push(materialName);
      break;
    }

    draft[hit.container][hit.actual] = (draft[hit.container][hit.actual] || 0) - 1;
    consumed.push(hit);
  }

  if (missing.length > 0) return { ok: false, consumed: [], missing };
  return {
    ok: true,
    consumed,
    missing: [],
    patch: buildPatch(state, materialBag, apertureMaterials, apertureImmortalMaterials),
  };
}

export function canSpendMaterials(state: EconomyStateLike, materialNames: string[]): { ok: boolean; missing: string[] } {
  let current: EconomyStateLike = state;
  for (const materialName of materialNames) {
    const result = removeMaterialFromState(current, materialName, 1);
    if (!result.ok) return { ok: false, missing: result.missing };
    current = { ...current, ...result.patch };
  }
  return { ok: true, missing: [] };
}

export function unlockRecipeInFlags(
  flags: Record<string, any> | undefined,
  targetGu: string,
  source: string,
): Record<string, any> {
  const currentFlags = flags || {};
  const completedRecipes = { ...(currentFlags.completedRecipes || {}), [targetGu]: true };
  const recipeUnlockSources = { ...(currentFlags.recipeUnlockSources || {}), [targetGu]: source };
  return { ...currentFlags, completedRecipes, recipeUnlockSources };
}

export interface RecipeCost {
  materials: Record<string, number>;
  immortalMaterials: Record<string, number>;
  sourceGu: Record<string, number>;
  auxiliaryGu: Record<string, number>;
  currency: number;
  immortalCurrency?: number;
  turnCost: number;
  failureReturnPolicy: 'none' | 'partial_gu_materials' | 'rumor_only';
}

export function getRuntimeMaterialNames(): string[] {
  return getMaterialRegistryEntries()
    .filter(entry => entry.runtimeAllowed && (entry.kind === 'gu_material' || entry.kind === 'immortal_material'))
    .map(entry => entry.id)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}
