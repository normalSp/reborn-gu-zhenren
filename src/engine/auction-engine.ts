/**
 * ═══ 宝黄天仙蛊拍卖引擎 — P3 ═══
 * 全局面唯一性检查 + 原著主线仙蛊排除 + NPC竞价模拟
 */
import immortalGuRaw from '../canon/immortal-gu.json';
import economyRaw from '../canon/economy.json';
import economyBalanceRaw from '../canon/economy-balance.json';
import fragmentRecipesRaw from '../canon/fragment-recipes.json';
import killerMovesRaw from '../canon/killer-moves.json';
import { isRuntimePathAllowed } from './path-registry';

// 原著主线仙蛊——不出现在拍卖行
const MAINLINE_EXCLUDED = [
  '春秋蝉','定仙游','坚持仙蛊','宿命蛊','梦蝶蛊','智慧蛊',
  '至尊仙胎蛊','力量蛊','天元宝皇莲','升炼','天机','鸿运齐天蛊',
  '态度蛊','悔蛊','慧剑','万我','净魂仙蛊','剑遁仙蛊','江山如故',
  '换魂','招灾蛊','鼎力','吃力','龙力',
];

export interface ImmortalAuctionItem {
  id: string;
  name: string;
  tier: number;
  path: string;
  effect: string;
  startingBid: number;   // 仙元起拍价
  currentBid: number;
  bidderCount: number;   // NPC竞争者数
  expiresTurn: number;   // 过期回合
}

// v0.7.0-pre审查修正：TIER_BASE_PRICE重新锚定
// 参考 economy.json 福地等级表仙元石月产（小福地5-10/月，上等25-40/月）
// 六转仙蛊≈小型福地半年产出(~30-60仙元石)，九转仙蛊≈顶级蛊仙数年积累
// 原值(6:2800/7:8500/8:25000/9:80000)严重偏高，8年产出才能买6转仙蛊不合理
const AUCTION_PRICING = (economyBalanceRaw as any).auctionPricing || {};

export const RUNTIME_IMMORTAL_GU_TIER_BASE_PRICE: Record<number, number> = {
  6: AUCTION_PRICING.immortalGuBasePriceByTier?.['6'] ?? 3600,
  7: AUCTION_PRICING.immortalGuBasePriceByTier?.['7'] ?? 12000,
  8: AUCTION_PRICING.immortalGuBasePriceByTier?.['8'] ?? 40000,
  9: AUCTION_PRICING.immortalGuBasePriceByTier?.['9'] ?? 120000,
};
export const RUNTIME_IMMORTAL_MATERIAL_BASE_PRICE: Record<string, number> = {
  '空间晶石': AUCTION_PRICING.lowImmortalMaterialRange?.min ?? 24,
  '光阴砂': Math.round(((AUCTION_PRICING.lowImmortalMaterialRange?.min ?? 24) + (AUCTION_PRICING.lowImmortalMaterialRange?.max ?? 120)) / 2),
  '道痕结晶': AUCTION_PRICING.lowImmortalMaterialRange?.max ?? 120,
};

const TIER_BASE_PRICE = RUNTIME_IMMORTAL_GU_TIER_BASE_PRICE;
const IMMORTAL_MATERIAL_BASE_PRICE = RUNTIME_IMMORTAL_MATERIAL_BASE_PRICE;

export function getRuntimeAuctionPricingSnapshot() {
  return {
    immortalGuTierBasePrice: { ...RUNTIME_IMMORTAL_GU_TIER_BASE_PRICE },
    immortalMaterialBasePrice: { ...RUNTIME_IMMORTAL_MATERIAL_BASE_PRICE },
    recipeBaseFormula: 'targetTier * targetTier * 300 + fragmentsRequired * 120',
    killerMoveFragmentFormula: 'moveTier * 300',
    killerMoveCompleteFormula: 'moveTier * moveTier * 300',
  };
}

/** 判断某仙蛊是否应该出现在拍卖行 */
export function isAuctionable(name: string, tier: number, path?: string): boolean {
  if (MAINLINE_EXCLUDED.includes(name)) return false;
  if (tier < 6 || tier > 9) return false;
  if (path && !isRuntimePathAllowed(path)) return false;
  return true;
}

/** 生成拍卖候选列表 */
export function generateAuctionPool(existingGuNames: string[], turn: number): ImmortalAuctionItem[] {
  const imDb = immortalGuRaw as Record<string, any>;
  const candidates: ImmortalAuctionItem[] = [];

  for (const [key, gu] of Object.entries(imDb)) {
    if (key.startsWith('_')) continue;
    const g = gu as any;
    const name = g.name || key;
    if (!isAuctionable(name, g.tier, g.path)) continue;
    // 全局唯一性检查
    if (existingGuNames.includes(name)) continue;

    const basePrice = TIER_BASE_PRICE[g.tier] || g.tier * 5;
    const startingBid = Math.round(basePrice * (0.8 + Math.random() * 0.4)); // ±20%
    const bidderCount = g.tier === 9 ? 1 : (g.tier === 8 ? 2 : (g.tier === 7 ? 3 : 4));
    const expiresTurn = turn + 5 + Math.floor(Math.random() * 5); // 5-10回合后过期

    candidates.push({
      id: key,
      name,
      tier: g.tier,
      path: g.path || '未知',
      effect: g.effect || '',
      startingBid,
      currentBid: startingBid,
      bidderCount,
      expiresTurn,
    });
  }

  // 随机取出2-4只
  const count = Math.min(candidates.length, 2 + Math.floor(Math.random() * 3));
  return candidates.sort(() => Math.random() - 0.5).slice(0, count);
}

/** NPC模拟竞价：每回合提价5-20% */
export function simulateNPCBids(items: ImmortalAuctionItem[]): ImmortalAuctionItem[] {
  return items.map(item => {
    if (item.bidderCount <= 0) return item;
    const increase = Math.round(item.currentBid * (0.05 + Math.random() * 0.15));
    const newBid = item.currentBid + increase;
    // 随机减少一个竞价者
    const newBidderCount = Math.random() < 0.3 ? item.bidderCount - 1 : item.bidderCount;
    return { ...item, currentBid: newBid, bidderCount: Math.max(0, newBidderCount) };
  });
}

/** 玩家出价 */
export function playerBid(item: ImmortalAuctionItem, bidAmount: number): ImmortalAuctionItem | null {
  if (bidAmount <= item.currentBid) return null;
  // 出价超过当前价→随机决定是否压过NPC
  if (item.bidderCount <= 0) {
    return { ...item, currentBid: bidAmount };
  }
  // 有NPC竞争者时，50%几率NPC继续加价
  if (Math.random() < 0.5) {
    return { ...item, currentBid: Math.round(bidAmount * 1.1), bidderCount: item.bidderCount - 1 };
  }
  return { ...item, currentBid: bidAmount, bidderCount: item.bidderCount - 1 };
}

// ─── v0.6.0: 玩家上架仙蛊拍卖 ───
export interface PlayerListedGu {
  name: string; tier: number; path: string; rank: string;
  listedTurn: number; expiresTurn: number;
  startingBid: number; currentBid: number; bidderCount: number;
  sold: boolean; finalBid: number;
}

export function listPlayerGu(guName: string, tier: number, rank: string, path: string, turn: number): PlayerListedGu {
  const startingBid = Math.round((TIER_BASE_PRICE[tier] || tier * 200) * (rank === 'legendary' ? 1.5 : rank === 'epic' ? 1.2 : 1.0));
  const bidderCount = 3 + tier - 6 + (rank === 'legendary' ? 2 : rank === 'epic' ? 1 : 0);
  return { name: guName, tier, path, rank, listedTurn: turn, expiresTurn: turn + 8, startingBid, currentBid: startingBid, bidderCount, sold: false, finalBid: 0 };
}

export function simulateSellAuction(item: PlayerListedGu): PlayerListedGu {
  if (item.bidderCount <= 0 || item.sold) return { ...item, sold: true, finalBid: item.currentBid };
  const raise = Math.floor(item.currentBid * (0.05 + Math.random() * 0.15));
  const newBid = item.currentBid + raise;
  const dropout = Math.random() < 0.3;
  const newCount = dropout ? item.bidderCount - 1 : item.bidderCount;
  const sold = newCount <= 0;
  const finalBid = sold ? newBid : item.finalBid;
  return { ...item, currentBid: newBid, bidderCount: newCount, sold, finalBid };
}

// ─── v0.7.0-pre: 仙材/仙蛊方/杀招传承 预留接口 ───
// 完整实现在 v0.7.0-b 阶段，此处导出函数签名以支持 AuctionPanel Tab 预留结构

export interface MaterialAuctionItem {
  id: string; name: string; grade: string; path: string;
  basePrice: number; currentBid: number; bidderCount: number;
  expiresTurn: number;
}

export interface RecipeAuctionItem {
  id: string; name: string; targetGu: string; targetTier: number; path: string;
  fragmentsRequired: number; basePrice: number; currentBid: number;
  bidderCount: number; expiresTurn: number;
}

export interface KillerMoveAuctionItem {
  id: string; name: string; tier: number; path: string;
  form: '残方' | '完整传承'; basePrice: number; currentBid: number;
  bidderCount: number; expiresTurn: number;
}

export interface RareTradeAuctionItem {
  id: string; name: string; category: '第二空窍线索' | '天地秘境线索' | '特殊传承';
  tier: number; path: string; basePrice: number; currentBid: number;
  bidderCount: number; expiresTurn: number; runtimeEffect: 'rumor_only' | 'engine_whitelist_required';
  notes: string;
}

const RARE_TRADE_TEMPLATES: Array<Omit<RareTradeAuctionItem, 'currentBid' | 'bidderCount' | 'expiresTurn'>> = [
  {
    id: 'rare_second_aperture_formula_clue',
    name: '第二空窍蛊方线索',
    category: '第二空窍线索',
    tier: 6,
    path: '天道',
    basePrice: 1800,
    runtimeEffect: 'engine_whitelist_required',
    notes: '只提供线索或残方候选，不能直接解锁第二空窍蛊炼制。完整解锁必须经过剧情白名单、残方进度和引擎校验。',
  },
  {
    id: 'rare_second_aperture_material_trace',
    name: '第二空窍相关仙材踪迹',
    category: '第二空窍线索',
    tier: 6,
    path: '天道',
    basePrice: 900,
    runtimeEffect: 'rumor_only',
    notes: '指向稀有仙材来源，默认进入传闻/线索，不直接写入背包。',
  },
  {
    id: 'rare_reverse_flow_inheritance_trace',
    name: '逆流河相关传承线索',
    category: '天地秘境线索',
    tier: 8,
    path: '水道',
    basePrice: 4800,
    runtimeEffect: 'rumor_only',
    notes: '天地秘境级线索只影响剧情探索，不进入普通交易资产池。',
  },
];

function stableScore(seed: string, turn: number): number {
  let hash = turn * 131;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }
  return hash / 0xffffffff;
}

function pickDeterministic<T extends { id: string; name: string }>(
  items: T[],
  turn: number,
  minCount: number,
  maxCount: number,
): T[] {
  const count = Math.min(items.length, minCount + (turn % Math.max(1, maxCount - minCount + 1)));
  return [...items]
    .sort((a, b) => stableScore(a.id + a.name, turn) - stableScore(b.id + b.name, turn))
    .slice(0, count);
}

function priceWithMarketHeat(basePrice: number, seed: string, turn: number): number {
  const heat = 0.9 + stableScore(seed, turn) * 0.25;
  return Math.max(1, Math.round(basePrice * heat));
}

function inferPathFromText(text: string): string {
  const pairs: Array<[string, string]> = [
    ['空间', '宇道'], ['宇道', '宇道'],
    ['光阴', '宙道'], ['时间', '宙道'], ['宙道', '宙道'],
    ['月', '光道'], ['光', '光道'],
    ['冰', '冰道'], ['水', '水道'],
    ['火', '炎道'], ['炎', '炎道'],
    ['金', '金道'], ['土', '土道'], ['木', '木道'],
    ['风', '风道'], ['雷', '雷道'], ['毒', '毒道'],
    ['魂', '魂道'], ['血', '血道'], ['兽', '奴道'],
  ];
  const hit = pairs.find(([needle]) => text.includes(needle));
  return hit?.[1] || '炼道';
}

/** 生成仙材拍卖候选列表 */
export function generateMaterialPool(existingMaterialNames: string[], turn: number): MaterialAuctionItem[] {
  const economy = economyRaw as any;
  const nodeDefs = economy.RESOURCE_NODE_BUILD_COST?.availableNodeTypes || [];
  const existing = new Set(existingMaterialNames);
  const candidates: MaterialAuctionItem[] = nodeDefs
    .filter((node: any) => node.grade === '仙材' && !existing.has(node.type))
    .map((node: any) => {
      const basePrice = IMMORTAL_MATERIAL_BASE_PRICE[node.type] || 24;
      const currentBid = priceWithMarketHeat(basePrice, node.type, turn);
      return {
        id: `mat_${node.type}`,
        name: node.type,
        grade: '仙材',
        path: inferPathFromText(`${node.type}${node.name}${node.description || ''}`),
        basePrice,
        currentBid,
        bidderCount: 2 + Math.floor(stableScore(node.type, turn) * 4),
        expiresTurn: turn + 6 + Math.floor(stableScore(`${node.type}_expires`, turn) * 5),
      };
    });

  return pickDeterministic(candidates, turn, 2, 3);
}

/** 生成仙蛊方/古方拍卖候选列表 */
export function generateRecipePool(existingRecipeNames: string[], turn: number): RecipeAuctionItem[] {
  const recipes = ((fragmentRecipesRaw as any).fragments || []) as any[];
  const existing = new Set(existingRecipeNames);
  const candidates: RecipeAuctionItem[] = recipes
    .filter(recipe => !existing.has(recipe.id) && !existing.has(recipe.name) && !existing.has(recipe.targetGu))
    .map(recipe => {
      const path = inferPathFromText([
        recipe.name,
        recipe.targetGu,
        ...(recipe.requiredMaterials || []),
      ].join(''));
      const basePrice = Math.max(300, Math.round(recipe.targetTier * recipe.targetTier * 300 + recipe.fragmentsRequired * 120));
      const currentBid = priceWithMarketHeat(basePrice, recipe.id, turn);
      return {
        id: recipe.id,
        name: recipe.name,
        targetGu: recipe.targetGu,
        targetTier: recipe.targetTier,
        path,
        fragmentsRequired: recipe.fragmentsRequired,
        basePrice,
        currentBid,
        bidderCount: 2 + Math.floor(stableScore(recipe.id, turn) * 3),
        expiresTurn: turn + 7 + Math.floor(stableScore(`${recipe.id}_expires`, turn) * 4),
      };
    });

  return pickDeterministic(candidates, turn, 2, 4);
}

/** 生成杀招传承拍卖候选列表 */
export function generateKillerMovePool(existingKillMoveNames: string[], turn: number): KillerMoveAuctionItem[] {
  const movesDb = killerMovesRaw as Record<string, any>;
  const existing = new Set(existingKillMoveNames);
  const candidates: KillerMoveAuctionItem[] = Object.entries(movesDb)
    .filter(([key, move]) => !key.startsWith('_') && (move as any).level >= 6)
    .filter(([, move]) => isRuntimePathAllowed((move as any).path))
    .filter(([key, move]) => !existing.has(key) && !existing.has((move as any).name || key))
    .map(([key, move]) => {
      const tier = move.level || 6;
      const name = move.name || key;
      const complete = stableScore(`${key}_form`, turn) > 0.72;
      const form: '残方' | '完整传承' = complete ? '完整传承' : '残方';
      const basePrice = complete ? tier * tier * 300 : tier * 300;
      const currentBid = priceWithMarketHeat(basePrice, key, turn);
      return {
        id: `km_${key}`,
        name,
        tier,
        path: move.path || '通用',
        form,
        basePrice,
        currentBid,
        bidderCount: 1 + Math.floor(stableScore(key, turn) * 4),
        expiresTurn: turn + 6 + Math.floor(stableScore(`${key}_expires`, turn) * 6),
      };
    });

  return pickDeterministic(candidates, turn, 2, 3);
}

/** 生成宝黄天稀有线索/特殊传承候选。此池默认只给线索，不能绕过炼蛊和任务闸门。 */
export function generateRareTradePool(existingRareTradeIds: string[], turn: number): RareTradeAuctionItem[] {
  const existing = new Set(existingRareTradeIds);
  const candidates = RARE_TRADE_TEMPLATES
    .filter(item => !existing.has(item.id) && isRuntimePathAllowed(item.path))
    .map(item => ({
      ...item,
      currentBid: priceWithMarketHeat(item.basePrice, item.id, turn),
      bidderCount: 1 + Math.floor(stableScore(item.id, turn) * 3),
      expiresTurn: turn + 8 + Math.floor(stableScore(`${item.id}_expires`, turn) * 5),
    }));

  const count = Math.min(candidates.length, 1 + (turn % 2));
  return candidates
    .sort((a, b) => {
      const priorityA = a.category === '第二空窍线索' ? 0 : 1;
      const priorityB = b.category === '第二空窍线索' ? 0 : 1;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return stableScore(a.id, turn) - stableScore(b.id, turn);
    })
    .slice(0, count);
}
