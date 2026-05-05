/**
 * ═══ 拍卖系统 Store Slice — P1.1 ═══
 * 管理仙蛊拍卖状态：物品列表、竞价、NPC 模拟竞价
 */
import type { ImmortalAuctionItem } from '../../engine/auction-engine';
import {
  generateAuctionPool,
  simulateNPCBids,
  playerBid,
} from '../../engine/auction-engine';
import { useStore } from '..';
import type { GuInstance } from '../../types';

/** 拍卖会间隔（回合数） */
const AUCTION_INTERVAL = 10;

export interface AuctionSlice {
  /** 当前拍卖物品列表 */
  auctionItems: ImmortalAuctionItem[];
  /** 拍卖是否活跃 */
  isAuctionActive: boolean;
  /** 上次拍卖触发的回合 */
  auctionLastTurn: number;

  /** 初始化拍卖会 */
  initAuction: () => void;
  /** 玩家出价 */
  placeAuctionBid: (itemId: string, bidAmount: number) => { success: boolean; message: string };
  /** 每回合 NPC 自动竞价 */
  tickAuction: () => void;
  /** 关闭拍卖面板 */
  closeAuction: () => void;
}

export const createAuctionSlice = (set: any, get: any): AuctionSlice => ({
  auctionItems: [],
  isAuctionActive: false,
  auctionLastTurn: 0,

  initAuction: () => {
    const fullStore = get() as any;
    const turn = fullStore.turn || 1;
    // 获取已有仙蛊名称（全局唯一性检查）
    const inventory = (fullStore.inventory || []) as GuInstance[];
    const existingNames = inventory.map(g => g.name);

    const items = generateAuctionPool(existingNames, turn);
    if (items.length === 0) {
      // 无可拍卖仙蛊，静默跳过
      return;
    }

    set({ auctionItems: items, isAuctionActive: true, auctionLastTurn: turn });

    // 日志埋点
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('economy', `宝黄天拍卖会开启！本次共 ${items.length} 件仙蛊拍卖`, {
        itemCount: items.length, turn,
      });
    }
  },

  placeAuctionBid: (itemId, bidAmount) => {
    const state = get() as AuctionSlice & { immortalCurrency: number };
    const item = state.auctionItems.find(i => i.id === itemId);
    if (!item) return { success: false, message: '拍卖物品不存在' };

    // 检查余额（仙元石）
    if (state.immortalCurrency < bidAmount) {
      return { success: false, message: `仙元石不足（余额: ${state.immortalCurrency}，出价: ${bidAmount}）` };
    }

    const result = playerBid(item, bidAmount);
    if (!result) {
      return { success: false, message: `出价必须高于当前竞价（${item.currentBid} 仙元石）` };
    }

    // 扣除仙元石
    const fullStore = get() as any;
    if (typeof fullStore.setImmortalCurrency === 'function') {
      fullStore.setImmortalCurrency(state.immortalCurrency - bidAmount);
    }

    const won = result.bidderCount <= 0;
    if (won) {
      // 拍卖成功——仙蛊入袋
      const guInstance: GuInstance = {
        id: `auction_${item.name}_${Date.now()}`,
        specId: item.name,
        name: item.name,
        tier: item.tier,
        path: item.path as any,
        rank: 'legendary',
        description: item.effect || '',
        currentState: 'optimal',
        hungerCounter: 0,
        proficiency: 0,
        bonded: false,
        active: true,
        acquiredAt: {
          turn: fullStore.turn || 1,
          narrative: `宝黄天拍卖会——以 ${bidAmount} 仙元石拍得「${item.name}」`,
        },
        isImmortalGu: true,
      } as any;

      if (typeof fullStore.addGu === 'function') {
        fullStore.addGu(guInstance);
      }

      // 从拍卖列表移除
      set((s: AuctionSlice) => ({
        auctionItems: s.auctionItems.filter(i => i.id !== itemId),
      }));

      // 日志
      if (typeof fullStore.addGameLog === 'function') {
        fullStore.addGameLog('economy', `拍卖成功！获得仙蛊「${item.name}」（${item.tier}转）`, {
          itemName: item.name, tier: item.tier, bidAmount,
        });
      }

      return { success: true, message: `竞拍成功！获得「${item.name}」！` };
    }

    // 未竞得——更新竞价
    set((s: AuctionSlice) => ({
      auctionItems: s.auctionItems.map(i =>
        i.id === itemId ? result : i
      ),
    }));

    return {
      success: false,
      message: `NPC 竞争者加价至 ${result.currentBid} 仙元石（剩余 ${result.bidderCount} 位竞争者）`,
    };
  },

  tickAuction: () => {
    const state = get() as AuctionSlice;
    if (!state.isAuctionActive || state.auctionItems.length === 0) return;

    // NPC 竞价模拟
    const updated = simulateNPCBids(state.auctionItems);
    // 移除过期的物品（当前回合 >= expiresTurn）
    const fullStore = get() as any;
    const currentTurn = fullStore.turn || 1;
    const valid = updated.filter(item => item.expiresTurn > currentTurn);

    if (valid.length === 0 && state.auctionItems.length > 0) {
      // 所有物品过期，关闭拍卖
      set({ auctionItems: [], isAuctionActive: false });
      return;
    }

    set({ auctionItems: valid });
  },

  closeAuction: () => {
    set({ isAuctionActive: false, auctionItems: [] });
  },
});

/** 判断是否应该触发拍卖会 */
export function shouldTriggerAuction(turn: number, lastAuctionTurn: number): boolean {
  return turn >= 10 && turn % AUCTION_INTERVAL === 0 && turn > lastAuctionTurn;
}
