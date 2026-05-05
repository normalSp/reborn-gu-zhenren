/**
 * ═══ 商会刷新引擎 — P3 M2.5 ═══
 * 1-5转分组随机刷新 + 加权概率 + 费用系统
 * 
 * 核心逻辑：
 * - 奖池覆盖原著所有凡蛊（从gu-database.json加载）
 * - 5个分组独立刷新，刷一组不影响其他组
 * - 玩家最多购买自身转数+1的蛊虫
 * - 越强越稀有越难刷新（加权随机）
 * - 保底机制：连续N次同组不出稀有→概率递增
 */

import guDatabaseRaw from '../canon/gu-database.json';
import shopItemsRaw from '../canon/shop-items.json';
import economyRaw from '../canon/economy.json';

// ─── 分组定义 ───
export type TierGroupId = 1 | 2 | 3 | 4 | 5;

interface TierGroupConfig {
  id: TierGroupId;
  label: string;           // UI 显示
  tierRange: [number, number]; // [min, max]
  basePrice: number;        // 基础价格（元石）
  refreshCost: number;      // 刷新费用（元石）
  immortalRefreshCost: number; // 仙元刷新费用（成仙后）
  poolSize: number;         // 每组展示 N 只蛊虫
}

// v1.3: 价格统一为 economy.json canon
export const TIER_GROUPS: Record<TierGroupId, TierGroupConfig> = {
  1: { id:1, label:'一转·初识蛊道', tierRange:[1,1], basePrice:150, refreshCost:20, immortalRefreshCost:1, poolSize:4 },
  2: { id:2, label:'二转·小有所成', tierRange:[2,2], basePrice:200, refreshCost:50, immortalRefreshCost:2, poolSize:4 },
  3: { id:3, label:'三转·蛊道精进', tierRange:[3,3], basePrice:800, refreshCost:150, immortalRefreshCost:3, poolSize:3 },
  4: { id:4, label:'四转·名动一方', tierRange:[4,4], basePrice:5000, refreshCost:400, immortalRefreshCost:5, poolSize:3 },
  5: { id:5, label:'五转·半步仙途', tierRange:[5,5], basePrice:20000, refreshCost:1000, immortalRefreshCost:8, poolSize:2 },
};

// ─── 商会黑名单：不可通过商店购买的蛊虫 ───
const SHOP_BLACKLIST = new Set([
  '天元宝莲蛊',   // P4数值审计: 日产50元石→破坏经济, 不应商会出售
  '希望蛊',       // 开窍用蛊虫, 天地生成
]);

// ─── 稀有度权重 ───
const RARITY_WEIGHTS: Record<string, number> = {
  common:    60,   // 60%
  uncommon:  25,   // 25%
  rare:      10,   // 10%
  epic:       4,   // 4%
  legendary:  1,   // 1%
};

// ═══ P1.7: 稀有度价格倍率 — 与 economy.json 严格对齐 ═══
const RARITY_PRICE_MULT: Record<string, number> = {
  common:    1.0,
  uncommon:  1.5,   // was 1.8 → economy.json: 1.5
  rare:      2.5,   // was 3.5 → economy.json: 2.5
  epic:      5.0,   // was 7.0 → economy.json: 5.0
  legendary: 0,     // 传奇不卖
};

// ─── 蛊虫条目类型 ───
export interface GuShopEntry {
  name: string;
  tier: number;
  path: string;
  rank: string;
  effect: string;
  feed: string;
  price: number;
  description?: string;
}

// ─── 构建奖池 ───
interface GuSpec {
  tier: number; path: string; rank: string; effect: string;
  feed: string; feedRequirement?: { type: string; rarity: string; description: string };
}

function loadGuPool(): Record<string, GuSpec> {
  const db = guDatabaseRaw as Record<string, any>;
  const pool: Record<string, GuSpec> = {};
  for (const [key, val] of Object.entries(db)) {
    if (key.startsWith('_')) continue; // 跳过 meta
    if (typeof val !== 'object' || !val) continue;
    const g = val as any;
    if (g.isImmortalGu) continue;       // 跳过仙蛊
    if (SHOP_BLACKLIST.has(key)) continue; // 跳过黑名单蛊虫(v1.3: 天元宝莲蛊等)
    if (g.tier < 1 || g.tier > 5) continue; // 仅凡蛊
    pool[key] = {
      tier: g.tier,
      path: g.path || '未知',
      rank: g.rank || 'common',
      effect: g.effect || '',
      feed: g.feed || '',
      feedRequirement: g.feedRequirement,
    };
  }
  return pool;
}

// ─── 加权随机抽取 ───
function weightedPick<T>(items: T[], getWeight: (item: T) => number, count: number, randomFn: () => number = Math.random): T[] {
  const result: T[] = [];
  const pool = [...items];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + getWeight(item), 0);
    if (totalWeight <= 0) break;
    let rand = randomFn() * totalWeight;
    let selectedIdx = -1;
    for (let j = 0; j < pool.length; j++) {
      rand -= getWeight(pool[j]);
      if (rand <= 0) { selectedIdx = j; break; }
    }
    if (selectedIdx < 0) selectedIdx = pool.length - 1;
    result.push(pool[selectedIdx]);
    pool.splice(selectedIdx, 1); // 去重：不重复出现同一只蛊虫
  }
  return result;
}

// ─── 计算价格 ───
function calcGuPrice(tier: number, rank: string, chapterName?: string): number {
  const group = TIER_GROUPS[tier as TierGroupId];
  const basePrice = group?.basePrice || tier * 150;
  const rarityMult = RARITY_PRICE_MULT[rank] || 1;
  let price = Math.round(basePrice * rarityMult);
  // 章节通胀（>=2转才应用，v1.3→P2补完: 统一引用 economy.json chapterPriceMultiplier 为单一真相源）
  if (chapterName && tier >= 2) {
    const chapterMultipliers = (economyRaw as any)?.chapterPriceMultiplier;
    const multiplier = chapterMultipliers?.[chapterName] || 1.0;
    price = Math.round(price * Math.min(2.0, multiplier));
  }
  return price;
}

// ─── 主函数：生成一组蛊虫 ───
export function generateShopGroup(
  groupId: TierGroupId,
  playerRealmTier: number, // 玩家当前转数
  chapterName?: string,
  randomFn: () => number = Math.random
): GuShopEntry[] {
  const group = TIER_GROUPS[groupId];
  const pool = loadGuPool();

  // 过滤：仅该转段位的蛊虫 + 玩家转数+1以内
  const candidates = Object.entries(pool)
    .filter(([_, g]) => {
      if (g.tier !== groupId) return false;        // 仅该组转数
      if (g.tier > playerRealmTier + 1) return false; // 最多+1转
      if (g.rank === 'legendary') return false;    // 传奇不卖
      return true;
    })
    .map(([name, g]) => ({ name, ...g }));

  if (candidates.length === 0) return [];

  // 加权抽取
  const selected = weightedPick(
    candidates,
    (item) => RARITY_WEIGHTS[item.rank] || 1,
    group.poolSize,
    randomFn
  );

  // 计算价格
  return selected.map(g => ({
    name: g.name,
    tier: g.tier,
    path: g.path,
    rank: g.rank,
    effect: g.effect,
    feed: g.feed || (g.feedRequirement?.description || ''),
    price: calcGuPrice(g.tier, g.rank, chapterName),
  }));
}

// ─── 计算刷新费用 ───
export function getRefreshCost(groupId: TierGroupId, isImmortal: boolean): number {
  const group = TIER_GROUPS[groupId];
  return isImmortal ? group.immortalRefreshCost : group.refreshCost;
}

// ─── 检查玩家是否可以刷新该组 ───
export function canRefreshGroup(groupId: TierGroupId, playerRealmTier: number): boolean {
  // 玩家必须达到该组转数-1（如三转才能刷二转组）
  return playerRealmTier >= groupId - 1;
}

// ═══ P1.7: 蛊材商店 — 从 shop-items.json 加载材料商品 ═══
export interface MaterialShopEntry {
  id: string;
  name: string;
  type: '蛊材' | '消耗品';
  tier: number;
  price: number;
  description: string;
}

let _materialCache: MaterialShopEntry[] | null = null;

function loadMaterialPool(): MaterialShopEntry[] {
  if (_materialCache) return _materialCache;
  const items = (shopItemsRaw as any).items as any[];
  if (!Array.isArray(items)) { _materialCache = []; return []; }
  _materialCache = items.map((item: any) => ({
    id: item.id,
    name: item.name,
    type: item.type || '蛊材',
    tier: item.tier || 1,
    price: Math.round((item.basePrice || 5) * (item.rarityMultiplier || 1)),
    description: item.description || '',
  }));
  return _materialCache;
}

/** 按当前章节和转数过滤蛊材商品 */
export function getMaterialShopItems(
  currentChapterName: string,
  playerRealmTier: number,
): MaterialShopEntry[] {
  const pool = loadMaterialPool();
  const chapterItems = (shopItemsRaw as any).items as any[];
  return pool.filter((item, i) => {
    if (item.tier > playerRealmTier + 1) return false;
    const raw = chapterItems[i];
    const available = raw?.chapterAvailability;
    if (Array.isArray(available) && !available.includes(currentChapterName)) return false;
    return true;
  });
}

// ═══ P4: 残方商店 ═══
import fragmentRecipesRaw from '../canon/fragment-recipes.json';

export interface FragmentShopEntry {
  id: string;
  name: string;
  type: 'refine_fragment' | 'ascend_fragment' | 'complete_recipe';
  targetGu: string;
  targetTier: number;
  path: string;
  price: number;
  description: string;
  isComplete: boolean;
  difficulty: number;
}

/** 残方刷新分组 — 复用 TIER_GROUPS 定价模式 */
const FRAGMENT_GROUPS: Record<number, { label: string; poolSize: number; baseRefreshCost: number; completeRecipeChance: number }> = {
  1: { label: '一转残方', poolSize: 3, baseRefreshCost: 50, completeRecipeChance: 0.05 },
  2: { label: '二转残方', poolSize: 3, baseRefreshCost: 100, completeRecipeChance: 0.04 },
  3: { label: '三转残方', poolSize: 2, baseRefreshCost: 200, completeRecipeChance: 0.03 },
  4: { label: '四转残方', poolSize: 2, baseRefreshCost: 400, completeRecipeChance: 0.02 },
  5: { label: '五转残方', poolSize: 1, baseRefreshCost: 800, completeRecipeChance: 0.01 },
};

/** 残方数据加载 */
function loadFragmentPool(): Array<{ id: string; name: string; type: string; targetGu: string; targetTier: number; requiredMaterials: string[]; difficulty: number; description: string }> {
  const data = fragmentRecipesRaw as any;
  const fragments = data?.fragments || [];
  return fragments.map((f: any) => ({
    id: f.id,
    name: f.name,
    type: f.type || 'refine',
    targetGu: f.targetGu,
    targetTier: f.targetTier,
    requiredMaterials: f.requiredMaterials || [],
    difficulty: f.completionDifficulty || 0.5,
    description: f.description || '',
  }));
}

/** 从 gu-database.json 按转数获取可选蛊虫列表（用于生成完整蛊方） */
function getGuNamesByTier(tier: number): string[] {
  const db = guDatabaseRaw as Record<string, any>;
  return Object.entries(db)
    .filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object' && (v as any).tier === tier && !(v as any).isImmortalGu)
    .map(([k]) => k);
}

/**
 * P4: 生成一组残方商品
 * 规则:
 *  - 从 fragment-recipes.json 已定义的残方池中随机抽取
 *  - 低概率产出完整蛊方（completeRecipeChance 随转数递减）
 *  - 完整蛊方从 gu-database.json 中随机选择同转数蛊虫生成
 */
export function generateFragmentShopGroup(
  tierGroup: number,
  playerRealmTier: number,
  randomFn: () => number = Math.random
): FragmentShopEntry[] {
  const group = FRAGMENT_GROUPS[tierGroup];
  if (!group) return [];
  if (tierGroup > playerRealmTier + 1) return [];

  const allFragments = loadFragmentPool();
  // 按转数过滤残方
  const tierFragments = allFragments.filter(f => f.targetTier === tierGroup);
  const results: FragmentShopEntry[] = [];
  const pool = [...tierFragments];

  // 随机抽取残方
  for (let i = 0; i < group.poolSize && pool.length > 0; i++) {
    const idx = Math.floor(randomFn() * pool.length);
    const f = pool.splice(idx, 1)[0];
    // 完整蛊方定价为残方的 3x
    const basePrice = group.baseRefreshCost * 2;
    results.push({
      id: f.id,
      name: f.name,
      type: (f.type === 'ascend' ? 'ascend_fragment' : 'refine_fragment') as FragmentShopEntry['type'],
      targetGu: f.targetGu,
      targetTier: f.targetTier,
      path: '',
      price: basePrice,
      description: f.description,
      isComplete: false,
      difficulty: f.difficulty,
    });
  }

  // 低概率产出完整蛊方
  if (randomFn() < group.completeRecipeChance) {
    const guNames = getGuNamesByTier(tierGroup);
    if (guNames.length > 0) {
      const guName = guNames[Math.floor(randomFn() * guNames.length)];
      const guSpec = (guDatabaseRaw as Record<string, any>)[guName];
      const completePrice = group.baseRefreshCost * 5; // 完整蛊方 5x残方价
      results.push({
        id: `recipe_complete_${guName}_${tierGroup}`,
        name: `完整·${guName}炼制方`,
        type: 'complete_recipe',
        targetGu: guName,
        targetTier: tierGroup,
        path: guSpec?.path || '',
        price: completePrice,
        description: `完整记录了${guName}的全部炼制法门——可直接用于炼蛊`,
        isComplete: true,
        difficulty: 0,
      });
    }
  }

  return results;
}

/** 获取残方刷新费用 */
export function getFragmentRefreshCost(tierGroup: number): number {
  return FRAGMENT_GROUPS[tierGroup]?.baseRefreshCost || 100;
}
