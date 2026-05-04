/**
 * ═══ 宝皇天仙蛊拍卖引擎 — P3 ═══
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

const TIER_BASE_PRICE: Record<number, number> = { 6:4, 7:12, 8:35, 9:100 };

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
