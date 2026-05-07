/**
 * ═══ 宝黄天仙蛊拍卖引擎 — P3 ═══
 * 全局面唯一性检查 + 原著主线仙蛊排除 + NPC竞价模拟
 */
import immortalGuRaw from '../canon/immortal-gu.json';

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
const TIER_BASE_PRICE: Record<number, number> = { 6:60, 7:240, 8:960, 9:3800 };

/** 判断某仙蛊是否应该出现在拍卖行 */
export function isAuctionable(name: string, tier: number): boolean {
  if (MAINLINE_EXCLUDED.includes(name)) return false;
  if (tier < 6 || tier > 9) return false;
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
    if (!isAuctionable(name, g.tier)) continue;
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
  id: string; name: string; targetTier: number; path: string;
  fragmentsRequired: number; basePrice: number; currentBid: number;
  bidderCount: number; expiresTurn: number;
}

export interface KillerMoveAuctionItem {
  id: string; name: string; tier: number; path: string;
  form: '残方' | '完整传承'; basePrice: number; currentBid: number;
  bidderCount: number; expiresTurn: number;
}

/** 生成仙材拍卖候选列表（v0.7.0-b实现，当前返回空数组） */
export function generateMaterialPool(existingMaterialNames: string[], turn: number): MaterialAuctionItem[] {
  return [];
}

/** 生成仙蛊方拍卖候选列表（v0.7.0-b实现，当前返回空数组） */
export function generateRecipePool(existingRecipeNames: string[], turn: number): RecipeAuctionItem[] {
  return [];
}

/** 生成杀招传承拍卖候选列表（v0.7.0-b实现，当前返回空数组） */
export function generateKillerMovePool(existingKillMoveNames: string[], turn: number): KillerMoveAuctionItem[] {
  return [];
}
