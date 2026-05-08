import economyRaw from '../canon/economy.json';
import shopItemsRaw from '../canon/shop-items.json';
import guDatabaseRaw from '../canon/gu-database.json';
import { getRuntimePathNames } from './path-registry';
import { MATERIAL_GRADE_MAP } from './material-region';

export type RegisteredMaterialGrade = '普通' | '精品' | '稀有' | '仙材';
export type RegisteredMaterialKind = 'gu_material' | 'immortal_material';
export type RegisteredMaterialRealmGate = 'mortal' | 'immortal' | 'both';
export type RegisteredMaterialUsage = 'refinement' | 'feeding' | 'trade';

export interface MaterialRegistryEntry {
  id: string;
  displayName: string;
  kind: RegisteredMaterialKind;
  grade: RegisteredMaterialGrade;
  path?: string;
  realmGate: RegisteredMaterialRealmGate;
  sourceTags: string[];
  runtimeAllowed: boolean;
  isImmortalMaterial: boolean;
  source: 'material-region' | 'economy-resource-node' | 'shop-item' | 'gu-database-recipe' | 'derived-runtime';
  aliases: string[];
  usageTags: RegisteredMaterialUsage[];
}

const economyData = economyRaw as any;
const nodeDefs = economyData.RESOURCE_NODE_BUILD_COST?.availableNodeTypes || [];
const shopItems = ((shopItemsRaw as any).items || []) as Array<Record<string, any>>;
const guDatabase = guDatabaseRaw as Record<string, any>;

const entries = new Map<string, MaterialRegistryEntry>();

function normalizeUsageTags(tags: RegisteredMaterialUsage[] | undefined, fallback: RegisteredMaterialUsage[]): RegisteredMaterialUsage[] {
  return Array.from(new Set([...(tags || []), ...fallback]));
}

function addEntry(
  id: string,
  grade: RegisteredMaterialGrade,
  source: MaterialRegistryEntry['source'],
  aliases: string[] = [],
  extra: Partial<MaterialRegistryEntry> = {},
): void {
  const existing = entries.get(id);
  const isImmortalMaterial = extra.isImmortalMaterial ?? grade === '仙材';
  entries.set(id, {
    id,
    displayName: extra.displayName || existing?.displayName || id,
    kind: extra.kind || existing?.kind || (isImmortalMaterial ? 'immortal_material' : 'gu_material'),
    grade,
    path: extra.path || existing?.path,
    realmGate: extra.realmGate || existing?.realmGate || (isImmortalMaterial ? 'immortal' : 'both'),
    sourceTags: Array.from(new Set([...(existing?.sourceTags || []), ...(extra.sourceTags || [source])])),
    runtimeAllowed: extra.runtimeAllowed ?? existing?.runtimeAllowed ?? true,
    isImmortalMaterial,
    source: existing?.source || source,
    aliases: Array.from(new Set([...(existing?.aliases || []), ...aliases])),
    usageTags: normalizeUsageTags(extra.usageTags, existing?.usageTags || ['refinement', 'trade']),
  });
}

for (const [id, grade] of Object.entries(MATERIAL_GRADE_MAP)) {
  addEntry(id, grade as RegisteredMaterialGrade, 'material-region');
}

function addRecipeCostMaterials(cost: any): void {
  if (!cost || typeof cost !== 'object') return;
  for (const [materialName, amount] of Object.entries({ ...(cost.generic || {}), ...(cost.specific || {}) })) {
    if (!materialName || Number(amount) <= 0) continue;
    const grade = (MATERIAL_GRADE_MAP[materialName] as RegisteredMaterialGrade | undefined)
      || (materialName.includes('仙材') ? '仙材' : materialName.includes('稀有') ? '稀有' : materialName.includes('精品') ? '精品' : '普通');
    addEntry(materialName, grade, 'gu-database-recipe', [], {
      displayName: materialName,
      kind: grade === '仙材' ? 'immortal_material' : 'gu_material',
      realmGate: grade === '仙材' ? 'immortal' : 'both',
      sourceTags: ['gu-database-recipe'],
      usageTags: ['refinement', 'trade'],
    });
  }
}

for (const [name, spec] of Object.entries(guDatabase)) {
  if (name.startsWith('_')) continue;
  addRecipeCostMaterials((spec as any).refineCost);
  addRecipeCostMaterials((spec as any).ascendCost);
}

for (const node of nodeDefs) {
  if (node?.type && node?.grade) {
    addEntry(node.type, node.grade as RegisteredMaterialGrade, 'economy-resource-node', [node.name].filter(Boolean), {
      displayName: node.type,
      kind: node.grade === '仙材' ? 'immortal_material' : 'gu_material',
      realmGate: node.grade === '仙材' ? 'immortal' : 'both',
      sourceTags: ['economy-resource-node'],
    });
  }
}

for (const item of shopItems) {
  if (!item?.name) continue;
  const existingEntry = entries.get(item.name);
  if (item.type !== '蛊材' && !existingEntry) continue;
  const existingGrade = MATERIAL_GRADE_MAP[item.name] as RegisteredMaterialGrade | undefined;
  const grade = existingGrade || (item.tier >= 5 ? '稀有' : item.tier >= 3 ? '精品' : '普通');
  const feedingHint = /喂|食|饲料|养蛊|饲/.test(String(item.description || ''));
  addEntry(item.name, grade, 'shop-item', [item.id].filter(Boolean), {
    displayName: item.name,
    kind: grade === '仙材' ? 'immortal_material' : 'gu_material',
    realmGate: 'both',
    sourceTags: ['shop-item'],
    runtimeAllowed: true,
    usageTags: feedingHint ? ['refinement', 'feeding', 'trade'] : ['refinement', 'trade'],
  });
}

for (const grade of ['普通', '精品', '稀有', '仙材'] as RegisteredMaterialGrade[]) {
  const id = grade === '仙材' ? '通用仙材' : `${grade}蛊材`;
  addEntry(id, grade, 'derived-runtime', [], {
    displayName: id,
    kind: grade === '仙材' ? 'immortal_material' : 'gu_material',
    realmGate: grade === '仙材' ? 'immortal' : 'both',
    sourceTags: ['derived-runtime'],
    runtimeAllowed: true,
  });
}

const MATERIAL_PATH_ALIASES: Record<string, string[]> = {
  '炎道': ['火道'],
};

for (const path of getRuntimePathNames()) {
  for (const grade of ['普通', '精品', '稀有'] as RegisteredMaterialGrade[]) {
    const id = `${path}${grade}蛊材`;
    const pathAliases = (MATERIAL_PATH_ALIASES[path] || []).flatMap(aliasPath => [
      `${aliasPath}蛊材`,
      `${aliasPath}${grade}蛊材`,
    ]);
    addEntry(id, grade, 'derived-runtime', [`${path}蛊材`, ...pathAliases], {
      displayName: id,
      kind: 'gu_material',
      path,
      realmGate: 'both',
      sourceTags: ['derived-runtime'],
      runtimeAllowed: true,
    });
  }
}

const aliasToId = new Map<string, string>();
for (const entry of entries.values()) {
  for (const alias of entry.aliases) {
    aliasToId.set(alias, entry.id);
  }
}

export function getMaterialRegistryEntries(): MaterialRegistryEntry[] {
  return Array.from(entries.values());
}

export function getMaterialEntry(materialName: string): MaterialRegistryEntry | undefined {
  return entries.get(materialName);
}

export function isRegisteredMaterial(materialName: string): boolean {
  return entries.has(materialName);
}

export function resolveMaterialAlias(materialName: string): MaterialRegistryEntry | undefined {
  const id = aliasToId.get(materialName);
  return id ? entries.get(id) : undefined;
}

export function isMaterialUsableFor(materialName: string, usage: RegisteredMaterialUsage): boolean {
  const entry = getMaterialEntry(materialName) || resolveMaterialAlias(materialName);
  return !!entry && entry.usageTags.includes(usage);
}

export function getAllowedMaterialNamesForPrompt(realmGrand: number = 1, limit: number = 24): string[] {
  const allowed = getMaterialRegistryEntries()
    .filter(entry => realmGrand >= 6 || !entry.isImmortalMaterial)
    .map(entry => entry.id)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return allowed.slice(0, limit);
}
