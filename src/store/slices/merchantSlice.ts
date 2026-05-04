/**
 * ═══ 商会 Slice — P3 M2.5 ═══
 * 分组随机刷新状态管理
 * 每组独立刷新、独立记录、互不影响
 */
import { generateShopGroup, getRefreshCost, canRefreshGroup, type GuShopEntry, type TierGroupId } from '../../engine/shop-engine';

export interface MerchantSlice {
  // ─── 各组蛊虫池 ───
  shopGroups: Record<TierGroupId, {
    items: GuShopEntry[];
    lastRefreshed: number; // turn
    refreshCount: number;  // 该组累计刷新次数（用于保底）
  }>;

  // ─── 操作 ───
  /** 刷新指定分组 */
  refreshShopGroup: (groupId: TierGroupId, playerRealmTier: number, turn: number, chapterName?: string) => GuShopEntry[];
  /** 获取指定分组 */
  getShopGroup: (groupId: TierGroupId) => GuShopEntry[];
  /** 检查是否可以刷新 */
  canShopRefresh: (groupId: TierGroupId, playerRealmTier: number) => boolean;
  /** 获取刷新费用 */
  getShopRefreshCost: (groupId: TierGroupId, isImmortal: boolean) => number;
  /** 购买蛊虫 */
  buyGuFromShop: (groupId: TierGroupId, guName: string) => boolean;
}

export const createMerchantSlice = (set: any, get: any): MerchantSlice => {
  const initialGroups = {} as Record<TierGroupId, { items: GuShopEntry[]; lastRefreshed: number; refreshCount: number }>;
  for (let g = 1; g <= 5; g++) {
    initialGroups[g as TierGroupId] = { items: [], lastRefreshed: 0, refreshCount: 0 };
  }

  return {
    shopGroups: initialGroups,

    refreshShopGroup: (groupId, playerRealmTier, turn, chapterName) => {
      if (!canRefreshGroup(groupId, playerRealmTier)) {
        console.warn(`[Merchant] 无法刷新${groupId}转组: 玩家境界不足`);
        return [];
      }

      // 保底：连续4次同组不出epic→概率提升
      const current = get().shopGroups[groupId];
      const refreshCount = (current?.refreshCount || 0) + 1;
      let randomFn = Math.random;
      if (refreshCount >= 4) {
        // 保底：每次+5%概率到epic档（模拟加权提升）
        const boost = Math.min((refreshCount - 3) * 0.05, 0.3);
        randomFn = () => {
          const r = Math.random();
          // 将boost加到epic档（10%基础→max 40%）
          // 简单实现：随机数偏移
          return r * (1 - boost);
        };
      }

      const items = generateShopGroup(groupId, playerRealmTier, chapterName, randomFn);

      set({
        shopGroups: {
          ...get().shopGroups,
          [groupId]: { items, lastRefreshed: turn, refreshCount },
        },
      });

      return items;
    },

    getShopGroup: (groupId) => {
      return get().shopGroups[groupId]?.items || [];
    },

    canShopRefresh: (groupId, playerRealmTier) => {
      return canRefreshGroup(groupId, playerRealmTier);
    },

    getShopRefreshCost: (groupId, isImmortal) => {
      return getRefreshCost(groupId, isImmortal);
    },

    buyGuFromShop: (groupId, guName) => {
      const group = get().shopGroups[groupId];
      if (!group) return false;

      const item = group.items.find((i: GuShopEntry) => i.name === guName);
      if (!item) return false;

      const store = get();
      const currency = store.currency || 0;

      if (currency < item.price) {
        console.warn(`[Merchant] 元石不足: 需要${item.price}, 当前${currency}`);
        return false;
      }

      // 扣款
      const updatedCurrency = currency - item.price;
      set({ currency: updatedCurrency });

      // 添加蛊虫到库存（通过guSlice）
      if (typeof store.addGu === 'function') {
        store.addGu({
          name: item.name,
          tier: item.tier,
          path: item.path,
          rank: item.rank,
          description: item.effect,
        });
      }

      // 从商店移除
      const updatedItems = group.items.filter((i: GuShopEntry) => i.name !== guName);
      set({
        shopGroups: {
          ...get().shopGroups,
          [groupId]: { ...group, items: updatedItems },
        },
      });

      return true;
    },
  };
};
