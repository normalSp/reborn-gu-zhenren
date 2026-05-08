/**
 * ═══ 商会 Slice — P3 M2.5 ═══
 * 分组随机刷新状态管理
 * 每组独立刷新、独立记录、互不影响
 */
import {
  generateMaterialShopShelf,
  generateShopGroup,
  getMaterialRefreshCost,
  getRefreshCost,
  canRefreshGroup,
  type GuShopEntry,
  type MaterialFoodShortageInput,
  type MaterialShopEntry,
  type TierGroupId,
} from '../../engine/shop-engine';

export interface MaterialShelfState {
  items: MaterialShopEntry[];
  lastRefreshed: number;
  freeRefreshTurn: number;
  freeRefreshCount: number;
  emergencyRefreshUsedTurn: number;
  emergencyActive: boolean;
}

export interface MerchantSlice {
  // ─── 各组蛊虫池 ───
  shopGroups: Record<TierGroupId, {
    items: GuShopEntry[];
    lastRefreshed: number; // turn
    refreshCount: number;  // 该组累计刷新次数（用于保底）
  }>;
  materialShelf: MaterialShelfState;

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
  refreshMaterialShelf: (
    playerRealmTier: number,
    turn: number,
    chapterName?: string,
    shortages?: MaterialFoodShortageInput[],
  ) => MaterialShelfState;
  getMaterialShelfRefreshCost: (playerRealmTier: number, isImmortal: boolean, turn: number) => number;
}

export const createMerchantSlice = (set: any, get: any): MerchantSlice => {
  const initialGroups = {} as Record<TierGroupId, { items: GuShopEntry[]; lastRefreshed: number; refreshCount: number }>;
  for (let g = 1; g <= 5; g++) {
    initialGroups[g as TierGroupId] = { items: [], lastRefreshed: 0, refreshCount: 0 };
  }

  return {
    shopGroups: initialGroups,
    materialShelf: {
      items: [],
      lastRefreshed: 0,
      freeRefreshTurn: 0,
      freeRefreshCount: 0,
      emergencyRefreshUsedTurn: 0,
      emergencyActive: false,
    },

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

      if (typeof store.spendCurrency === 'function') {
        if (!store.spendCurrency(item.price)) {
          console.warn(`[Merchant] 元石不足: 需要${item.price}, 当前${currency}`);
          return false;
        }
      } else {
        if (currency < item.price) {
          console.warn(`[Merchant] 元石不足: 需要${item.price}, 当前${currency}`);
          return false;
        }
        set({ currency: currency - item.price });
      }

      // 添加蛊虫到库存（通过guSlice）
      // ═══ BugFix: 补全 GuInstance 必需字段，参照 state-update-applier.ts:96-108 ═══
      if (typeof store.addGu === 'function') {
        const now = Date.now();
        const specId = item.name.toLowerCase().replace(/\s+/g, '_');
        store.addGu({
          id: `shop_${specId}_${now}_${Math.random().toString(36).slice(2, 7)}`,
          specId,
          name: item.name,
          tier: item.tier,
          path: item.path,
          currentState: 'optimal' as const,
          proficiency: 0,
          bonded: false,
          active: true,
          hungerCounter: 0,
          acquiredAt: {
            turn: store.turn || 1,
            narrative: `从商会购买: ${item.name} (${item.tier}转 ${item.path})`,
          },
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

    refreshMaterialShelf: (playerRealmTier, turn, chapterName, shortages) => {
      const current = (get() as MerchantSlice).materialShelf;
      const consumingEmergencyRefresh =
        current.freeRefreshTurn === turn &&
        current.freeRefreshCount > 0 &&
        current.emergencyActive &&
        current.emergencyRefreshUsedTurn !== turn;
      const result = generateMaterialShopShelf({
        currentChapterName: chapterName || '青茅山期',
        playerRealmTier,
        turn,
        shortages,
      });
      const sameTurn = current.freeRefreshTurn === turn;
      const freeRefreshCount = sameTurn ? current.freeRefreshCount + 1 : 1;
      const emergencyRefreshUsedTurn = consumingEmergencyRefresh ? turn : current.emergencyRefreshUsedTurn;
      const next: MaterialShelfState = {
        items: result.items,
        lastRefreshed: turn,
        freeRefreshTurn: turn,
        freeRefreshCount,
        emergencyRefreshUsedTurn,
        emergencyActive: result.emergencyActive,
      };
      set({ materialShelf: next } as any);
      return next;
    },

    getMaterialShelfRefreshCost: (playerRealmTier, isImmortal, turn) => {
      const shelf = (get() as MerchantSlice).materialShelf;
      if (shelf.freeRefreshTurn !== turn) return 0;
      if (shelf.freeRefreshCount <= 0) return 0;
      if (shelf.emergencyActive && shelf.emergencyRefreshUsedTurn !== turn) return 0;
      return getMaterialRefreshCost(playerRealmTier, isImmortal);
    },
  };
};
