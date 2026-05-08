import chaptersRaw from '../canon/chapters.json';
import economyRaw from '../canon/economy.json';
import encountersRaw from '../canon/encounters.json';
import factionDataRaw from '../canon/faction-data.json';
import shopItemsRaw from '../canon/shop-items.json';
import trainingGroundsRaw from '../canon/training-grounds.json';
import guDatabaseRaw from '../canon/gu-database.json';
import {
  getMaterialEntry,
  getMaterialRegistryEntries,
  resolveMaterialAlias,
  type MaterialRegistryEntry,
} from './material-registry';
import { getRecipeRegistryEntries, type RecipeRegistryEntry } from './recipe-registry';
import {
  estimateSafeTurnsUntilDead,
  getFeedingCreditRequirement,
  getFeedingFallbackPolicy,
  getNonMaterialFeedingRule,
  normalizeFeedCandidates,
  type FeedingFallbackPolicy,
} from './feeding-rules';

export type MaterialSourceTag =
  | 'shop'
  | 'encounter'
  | 'training_ground'
  | 'faction'
  | 'aperture_resource'
  | 'treasure_yellow_heaven'
  | 'event_whitelist'
  | 'regional_generation'
  | 'special_rule';

export interface MaterialSourceEvidence {
  tag: MaterialSourceTag;
  ref: string;
}

export interface RecipeMaterialSourceRow {
  recipeId: string;
  targetGu: string;
  operation: RecipeRegistryEntry['operation'];
  materialName: string;
  amount: number;
  isImmortalMaterial: boolean;
  sources: MaterialSourceEvidence[];
  blocking: boolean;
}

export interface GuFeedingClosureRow {
  guName: string;
  rank: number;
  feedRequirement: string;
  acceptedFoods: string[];
  safeTurns: number;
  sources: MaterialSourceEvidence[];
  blocking: boolean;
  fallbackPolicy: FeedingFallbackPolicy;
  sourceReliability: 'stable' | 'weighted' | 'event_gated' | 'special' | 'blocked';
  turnsToAcquireEstimate: number | null;
  recommendedAction: string;
  notes: string[];
}

const canonTexts: Array<[MaterialSourceTag, string, string]> = [
  ['shop', 'shop-items.json', JSON.stringify(shopItemsRaw)],
  ['encounter', 'encounters.json', JSON.stringify(encountersRaw)],
  ['training_ground', 'training-grounds.json', JSON.stringify(trainingGroundsRaw)],
  ['faction', 'faction-data.json', JSON.stringify(factionDataRaw)],
  ['event_whitelist', 'chapters.json', JSON.stringify(chaptersRaw)],
];

const guDatabase = guDatabaseRaw as Record<string, any>;

function uniqueEvidence(evidence: MaterialSourceEvidence[]): MaterialSourceEvidence[] {
  const seen = new Set<string>();
  return evidence.filter(item => {
    const key = `${item.tag}:${item.ref}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evidenceFromSourceTags(entry: MaterialRegistryEntry): MaterialSourceEvidence[] {
  const evidence: MaterialSourceEvidence[] = [];

  if (entry.sourceTags.includes('shop-item')) {
    evidence.push({ tag: 'shop', ref: `shop-items.json:${entry.id}` });
  }
  if (entry.sourceTags.includes('material-region') || entry.sourceTags.includes('derived-runtime')) {
    evidence.push({ tag: 'regional_generation', ref: `material-region.ts:${entry.id}` });
  }
  if (entry.sourceTags.includes('economy-resource-node')) {
    evidence.push({ tag: 'aperture_resource', ref: `economy.json:RESOURCE_NODE_BUILD_COST.${entry.id}` });
    if (entry.isImmortalMaterial) {
      evidence.push({ tag: 'treasure_yellow_heaven', ref: `auction-engine.generateMaterialPool:${entry.id}` });
    }
  }

  return evidence;
}

function evidenceFromCanonText(name: string): MaterialSourceEvidence[] {
  return canonTexts
    .filter(([, , text]) => text.includes(name))
    .map(([tag, ref]) => ({ tag, ref }));
}

function evidenceFromGenericMaterialName(name: string): MaterialSourceEvidence[] {
  if (name.endsWith('蛊材') || ['普通蛊材', '精品蛊材', '稀有蛊材'].includes(name)) {
    return [{ tag: 'regional_generation', ref: `material-region.ts:generic:${name}` }];
  }
  if (name.includes('仙材') || name === '通用仙材') {
    return [
      { tag: 'aperture_resource', ref: `economy.json:immortal-generic:${name}` },
      { tag: 'treasure_yellow_heaven', ref: `auction-engine.generateMaterialPool:immortal-generic:${name}` },
    ];
  }
  return [];
}

export function findMaterialSources(materialName: string): MaterialSourceEvidence[] {
  const entry = getMaterialEntry(materialName) || resolveMaterialAlias(materialName);
  const names = new Set([materialName, entry?.id, ...(entry?.aliases || [])].filter(Boolean) as string[]);
  const evidence: MaterialSourceEvidence[] = [];

  if (entry) evidence.push(...evidenceFromSourceTags(entry));
  evidence.push(...evidenceFromGenericMaterialName(materialName));
  for (const name of names) evidence.push(...evidenceFromCanonText(name));

  return uniqueEvidence(evidence);
}

function sourceRowsForCostBucket(
  recipe: RecipeRegistryEntry,
  bucket: Record<string, number>,
  isImmortalMaterial: boolean,
): RecipeMaterialSourceRow[] {
  return Object.entries(bucket).map(([materialName, amount]) => {
    const sources = findMaterialSources(materialName);
    return {
      recipeId: recipe.id,
      targetGu: recipe.targetGu,
      operation: recipe.operation,
      materialName,
      amount,
      isImmortalMaterial,
      sources,
      blocking: sources.length === 0,
    };
  });
}

export function generateRecipeMaterialSourceMatrix(): RecipeMaterialSourceRow[] {
  return getRecipeRegistryEntries().flatMap(recipe => [
    ...sourceRowsForCostBucket(recipe, recipe.materials, false),
    ...sourceRowsForCostBucket(recipe, recipe.immortalMaterials, true),
  ]);
}

export function auditRecipeSourceClosure(): RecipeMaterialSourceRow[] {
  return generateRecipeMaterialSourceMatrix().filter(row => row.blocking);
}

export function getFeedingMaterialEntries(): MaterialRegistryEntry[] {
  return getMaterialRegistryEntries()
    .filter(entry => entry.runtimeAllowed && entry.usageTags.includes('feeding'))
    .sort((a, b) => a.id.localeCompare(b.id, 'zh-Hans-CN'));
}

function evidenceFromNonMaterialRule(requirement: string): MaterialSourceEvidence[] {
  const rule = getNonMaterialFeedingRule(requirement);
  if (!rule) return [];
  return rule.sourceTags.map(tag => ({
    tag,
    ref: `feeding-rules:${rule.id}`,
  }));
}

function isImmortalSpecificFoodResolved(rank: number, requirement: string, foods: string[]): boolean {
  if (rank < 6) return true;
  if (getNonMaterialFeedingRule(requirement)) return true;
  if (foods.length === 0) return false;
  return foods.every(food =>
    !food.includes('通用仙材') &&
    !food.includes('通用蛊材') &&
    food !== '普通蛊材' &&
    !food.endsWith('普通蛊材')
  );
}

function assessFeedingReachability(
  rank: number,
  feedRequirement: string,
  sources: MaterialSourceEvidence[],
  noFeedingNeeded: boolean,
): Pick<GuFeedingClosureRow, 'sourceReliability' | 'turnsToAcquireEstimate' | 'recommendedAction'> {
  if (noFeedingNeeded) {
    return { sourceReliability: 'special', turnsToAcquireEstimate: 0, recommendedAction: '无需喂养' };
  }
  const credit = getFeedingCreditRequirement(feedRequirement);
  if (credit) {
    return {
      sourceReliability: 'event_gated',
      turnsToAcquireEstimate: null,
      recommendedAction: `通过剧情行为积累「${credit.key}」信用后喂养`,
    };
  }
  if (sources.length === 0) {
    return { sourceReliability: 'blocked', turnsToAcquireEstimate: null, recommendedAction: '补登记食料来源' };
  }
  const tags = new Set(sources.map(source => source.tag));
  if (tags.has('shop')) {
    return { sourceReliability: 'stable', turnsToAcquireEstimate: 1, recommendedAction: '商会购买' };
  }
  if (tags.has('aperture_resource') || tags.has('treasure_yellow_heaven')) {
    return { sourceReliability: 'stable', turnsToAcquireEstimate: rank >= 6 ? 3 : 2, recommendedAction: tags.has('treasure_yellow_heaven') ? '宝黄天或仙窍资源点' : '仙窍资源点产出' };
  }
  if (tags.has('regional_generation')) {
    return { sourceReliability: 'weighted', turnsToAcquireEstimate: 3, recommendedAction: '野外/地域掉落或刷新商会保底' };
  }
  if (tags.has('event_whitelist')) {
    return { sourceReliability: 'event_gated', turnsToAcquireEstimate: null, recommendedAction: '等待或触发白名单剧情' };
  }
  if (tags.has('training_ground') || tags.has('faction')) {
    return { sourceReliability: 'weighted', turnsToAcquireEstimate: 2, recommendedAction: tags.has('faction') ? '势力产出' : '道场训练掉落' };
  }
  return { sourceReliability: 'special', turnsToAcquireEstimate: null, recommendedAction: '特殊规则' };
}

export function getGuFeedingClosureRow(
  guName: string,
  currentCounter = 0,
): GuFeedingClosureRow | undefined {
  const spec = guDatabase[guName];
  if (!spec || guName.startsWith('_')) return undefined;

  const rank = Number(spec.tier || spec.rank || 1);
  const feedRequirement = String(spec.feedRequirement?.type || spec.feed || '');
  const acceptedFoods = normalizeFeedCandidates(feedRequirement);
  const materialSources = acceptedFoods.flatMap(food => findMaterialSources(food));
  const ruleSources = materialSources.length === 0 ? evidenceFromNonMaterialRule(feedRequirement) : [];
  const sources = uniqueEvidence([...materialSources, ...ruleSources]);
  const fallbackPolicy = getFeedingFallbackPolicy(rank, feedRequirement);
  const notes: string[] = [];
  const noFeedingNeeded = !feedRequirement || feedRequirement === '不需喂养';
  const hasRule = !!getNonMaterialFeedingRule(feedRequirement);
  const specificEnough = isImmortalSpecificFoodResolved(rank, feedRequirement, acceptedFoods);
  const reachability = assessFeedingReachability(rank, feedRequirement, sources, noFeedingNeeded);

  if (hasRule && feedRequirement !== '不需喂养') {
    notes.push(getNonMaterialFeedingRule(feedRequirement)!.description);
  }
  if (rank <= 3 && acceptedFoods.some(food => food.includes('蛊材'))) {
    notes.push('1-3转允许泛型蛊材作为低中转兜底。');
  }
  if (rank >= 4 && rank <= 5) {
    notes.push('4-5转应逐步具体化，泛型蛊材只作为紧急替代。');
  }
  if (rank >= 6 && !specificEnough) {
    notes.push('仙蛊食料必须具体化或走特殊规则，不能依赖通用仙材长期兜底。');
  }

  return {
    guName,
    rank,
    feedRequirement,
    acceptedFoods,
    safeTurns: noFeedingNeeded ? Infinity : estimateSafeTurnsUntilDead(rank, currentCounter),
    sources,
    blocking: !noFeedingNeeded && (!specificEnough || sources.length === 0),
    fallbackPolicy,
    ...reachability,
    notes,
  };
}

export function generateGuFeedingClosureMatrix(): GuFeedingClosureRow[] {
  return Object.keys(guDatabase)
    .filter(name => !name.startsWith('_'))
    .map(name => getGuFeedingClosureRow(name))
    .filter(Boolean) as GuFeedingClosureRow[];
}

export function auditGuFeedingClosure(): GuFeedingClosureRow[] {
  return generateGuFeedingClosureMatrix().filter(row => row.blocking);
}
