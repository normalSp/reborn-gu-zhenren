/**
 * ═══ 拍卖系统 Store Slice — P1.1 ═══
 * 管理仙蛊拍卖状态：物品列表、竞价、NPC 模拟竞价
 */
import type {
  ImmortalAuctionItem,
  KillerMoveAuctionItem,
  MaterialAuctionItem,
  RecipeAuctionItem,
} from '../../engine/auction-engine';
import {
  generateAuctionPool,
  generateKillerMovePool,
  generateMaterialPool,
  generateRecipePool,
  simulateNPCBids,
  playerBid,
} from '../../engine/auction-engine';
import type { GuInstance } from '../../types';

/** 拍卖会间隔（回合数） */
const AUCTION_INTERVAL = 10;

export interface AuctionSlice {
  /** 当前拍卖物品列表 */
  auctionItems: ImmortalAuctionItem[];
  /** v0.7.0: 仙材交易池 */
  materialAuctionItems: MaterialAuctionItem[];
  /** v0.7.0: 仙蛊方/古方交易池 */
  recipeAuctionItems: RecipeAuctionItem[];
  /** v0.7.0: 杀招传承交易池 */
  killerMoveAuctionItems: KillerMoveAuctionItem[];
  /** 拍卖是否活跃 */
  isAuctionActive: boolean;
  /** 上次拍卖触发的回合 */
  auctionLastTurn: number;

  /** 初始化拍卖会 */
  initAuction: () => void;
  /** 玩家出价 */
  placeAuctionBid: (itemId: string, bidAmount: number) => { success: boolean; message: string };
  /** v0.7.0: 直接购买仙材/蛊方/杀招传承 */
  purchaseTreasureItem: (
    category: 'materials' | 'recipes' | 'killer_moves',
    itemId: string
  ) => { success: boolean; message: string };
  /** 每回合 NPC 自动竞价 */
  tickAuction: () => void;
  /** 关闭拍卖面板 */
  closeAuction: () => void;
}

export const createAuctionSlice = (set: any, get: any): AuctionSlice => ({
  auctionItems: [],
  materialAuctionItems: [],
  recipeAuctionItems: [],
  killerMoveAuctionItems: [],
  isAuctionActive: false,
  auctionLastTurn: 0,

  initAuction: () => {
    const fullStore = get() as any;
    const turn = fullStore.turn || 1;
    if ((fullStore.profile?.realm?.grand || 1) < 6) {
      set({
        auctionItems: [],
        materialAuctionItems: [],
        recipeAuctionItems: [],
        killerMoveAuctionItems: [],
        isAuctionActive: false,
        auctionLastTurn: turn,
      });
      return;
    }
    // 获取已有仙蛊名称（全局唯一性检查）
    const inventory = [
      ...(fullStore.inventory || []),
      ...(fullStore.apertureInventory?.gu || []),
    ] as GuInstance[];
    const existingNames = inventory.map(g => g.name);

    const items = generateAuctionPool(existingNames, turn);
    const materialNames = [
      ...Object.keys(fullStore.materialBag || {}),
      ...Object.keys(fullStore.apertureInventory?.immortalMaterials || {}),
    ];
    const flags = fullStore.flags || {};
    const completedRecipeNames = Object.keys(flags.completedRecipes || {});
    const legacyRecipeNames = Object.entries(flags)
      .filter(([key]) => key.startsWith('knownRecipe:'))
      .flatMap(([key, value]) => {
        const data = value as any;
        return [key.replace('knownRecipe:', ''), data?.name, data?.targetGu].filter(Boolean) as string[];
      });
    const recipeNames = [...new Set([...completedRecipeNames, ...legacyRecipeNames])];
    const killMoveNames = (fullStore.killMoves || []).map((move: any) => move.name);
    const materialItems = generateMaterialPool(materialNames, turn);
    const recipeItems = generateRecipePool(recipeNames, turn);
    const killerMoveItems = generateKillerMovePool(killMoveNames, turn);

    if (items.length + materialItems.length + recipeItems.length + killerMoveItems.length === 0) {
      // 无可交易物，静默跳过
      return;
    }

    set({
      auctionItems: items,
      materialAuctionItems: materialItems,
      recipeAuctionItems: recipeItems,
      killerMoveAuctionItems: killerMoveItems,
      isAuctionActive: true,
      auctionLastTurn: turn,
    });

    // 日志埋点
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('economy', `宝黄天交易开启：仙蛊${items.length}、仙材${materialItems.length}、蛊方${recipeItems.length}、杀招${killerMoveItems.length}`, {
        immortalGuCount: items.length,
        materialCount: materialItems.length,
        recipeCount: recipeItems.length,
        killerMoveCount: killerMoveItems.length,
        turn,
      });
    }
  },

  placeAuctionBid: (itemId, bidAmount) => {
    const fullStore = get() as any;
    if ((fullStore.profile?.realm?.grand || 1) < 6) {
      return { success: false, message: '凡人无法进入宝黄天交易，只能听闻传言。' };
    }
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

    const won = result.bidderCount <= 0;
    if (won) {
      // 仅在竞拍成功时扣除仙元石；未成交只更新当前竞价。
      if (typeof fullStore.setImmortalCurrency === 'function') {
        fullStore.setImmortalCurrency(state.immortalCurrency - bidAmount);
      } else {
        set({ immortalCurrency: state.immortalCurrency - bidAmount } as any);
      }

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

      const apertureInventory = fullStore.apertureInventory || { gu: [], materials: {}, immortalMaterials: {} };
      set({
        apertureInventory: {
          ...apertureInventory,
          gu: [...(apertureInventory.gu || []), guInstance],
        },
      } as any);

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

  purchaseTreasureItem: (category, itemId) => {
    const state = get() as AuctionSlice & { immortalCurrency: number };
    const fullStore = get() as any;
    if ((fullStore.profile?.realm?.grand || 1) < 6) {
      return { success: false, message: '凡人无法进入宝黄天交易，只能听闻传言。' };
    }
    const collections = {
      materials: state.materialAuctionItems,
      recipes: state.recipeAuctionItems,
      killer_moves: state.killerMoveAuctionItems,
    };
    const item = collections[category].find(i => i.id === itemId);
    if (!item) return { success: false, message: '交易物不存在或已下架' };
    if ((state.immortalCurrency || 0) < item.currentBid) {
      return { success: false, message: `仙元石不足（余额: ${state.immortalCurrency || 0}，价格: ${item.currentBid}）` };
    }

    const pay = () => {
      if (typeof fullStore.setImmortalCurrency === 'function') {
        fullStore.setImmortalCurrency((state.immortalCurrency || 0) - item.currentBid);
      } else {
        set({ immortalCurrency: Math.max(0, (state.immortalCurrency || 0) - item.currentBid) } as any);
      }
    };

    if (category === 'materials') {
      const mat = item as MaterialAuctionItem;
      pay();
      if (typeof fullStore.addMaterial === 'function') {
        fullStore.addMaterial(mat.name, 1);
      } else {
        const inv = fullStore.apertureInventory || { gu: [], materials: {}, immortalMaterials: {} };
        set({
          apertureInventory: {
            ...inv,
            immortalMaterials: {
              ...(inv.immortalMaterials || {}),
              [mat.name]: ((inv.immortalMaterials || {})[mat.name] || 0) + 1,
            },
          },
        } as any);
      }
      set({
        materialAuctionItems: state.materialAuctionItems.filter(i => i.id !== itemId),
      } as any);
      fullStore.addGameLog?.('economy', `宝黄天购得仙材「${mat.name}」`, { itemId, price: mat.currentBid });
      return { success: true, message: `购得仙材「${mat.name}」` };
    }

    if (category === 'recipes') {
      const recipe = item as RecipeAuctionItem;
      pay();
      if (typeof fullStore.unlockRecipe === 'function') {
        fullStore.unlockRecipe(recipe.targetGu, `auction:${recipe.id}`);
      } else {
        set((s: any) => ({
          flags: {
            ...s.flags,
            completedRecipes: {
              ...(s.flags?.completedRecipes || {}),
              [recipe.targetGu]: true,
            },
          },
        }));
      }
      set({
        recipeAuctionItems: state.recipeAuctionItems.filter(i => i.id !== itemId),
      });
      fullStore.addGameLog?.('economy', `宝黄天购得蛊方「${recipe.name}」`, { itemId, price: recipe.currentBid });
      return { success: true, message: `购得蛊方「${recipe.name}」` };
    }

    const move = item as KillerMoveAuctionItem;
    const knownMoveNames = new Set((fullStore.killMoves || []).map((km: any) => km.name));
    if (knownMoveNames.has(move.name)) {
      return { success: false, message: `已掌握「${move.name}」，无需重复购买` };
    }

    pay();
    if (move.form === '完整传承' && typeof fullStore.learnKillMove === 'function') {
      fullStore.learnKillMove({
        id: `auction_${move.id}_${Date.now()}`,
        name: move.name,
        path: move.path,
        level: move.tier,
        baseCost: move.tier >= 6 ? 100 : 20,
        multiplier: 1 + move.tier * 0.35,
        cooldown: Math.max(2, 10 - Math.min(8, move.tier)),
        description: `宝黄天购得的${move.form}，流派为${move.path}`,
        isImmortal: move.tier >= 6,
        source: 'event',
      });
    } else {
      const current = fullStore.flags?.[`killerMoveFragment:${move.id}`]?.count || 0;
      fullStore.setFlag?.(`killerMoveFragment:${move.id}`, {
        name: move.name,
        path: move.path,
        tier: move.tier,
        count: current + 1,
      });
    }

    set({
      killerMoveAuctionItems: state.killerMoveAuctionItems.filter(i => i.id !== itemId),
    });
    fullStore.addGameLog?.('economy', `宝黄天购得杀招${move.form}「${move.name}」`, { itemId, price: move.currentBid });
    return { success: true, message: `购得杀招${move.form}「${move.name}」` };
  },

  tickAuction: () => {
    const state = get() as AuctionSlice;
    const hasItems =
      state.auctionItems.length > 0 ||
      state.materialAuctionItems.length > 0 ||
      state.recipeAuctionItems.length > 0 ||
      state.killerMoveAuctionItems.length > 0;
    if (!state.isAuctionActive || !hasItems) return;

    const tickTreasureItems = <T extends { currentBid: number; bidderCount: number; expiresTurn: number }>(items: T[]) =>
      items.map(item => {
        if (item.bidderCount <= 0) return item;
        const increase = Math.max(1, Math.round(item.currentBid * 0.08));
        return {
          ...item,
          currentBid: item.currentBid + increase,
          bidderCount: Math.max(0, item.bidderCount - 1),
        };
      });

    const updated = simulateNPCBids(state.auctionItems);
    const updatedMaterials = tickTreasureItems(state.materialAuctionItems);
    const updatedRecipes = tickTreasureItems(state.recipeAuctionItems);
    const updatedKillerMoves = tickTreasureItems(state.killerMoveAuctionItems);
    // 移除过期的物品（当前回合 >= expiresTurn）
    const fullStore = get() as any;
    const currentTurn = fullStore.turn || 1;
    const valid = updated.filter(item => item.expiresTurn > currentTurn);
    const validMaterials = updatedMaterials.filter(item => item.expiresTurn > currentTurn);
    const validRecipes = updatedRecipes.filter(item => item.expiresTurn > currentTurn);
    const validKillerMoves = updatedKillerMoves.filter(item => item.expiresTurn > currentTurn);

    if (valid.length + validMaterials.length + validRecipes.length + validKillerMoves.length === 0) {
      // 所有物品过期，关闭拍卖
      set({
        auctionItems: [],
        materialAuctionItems: [],
        recipeAuctionItems: [],
        killerMoveAuctionItems: [],
        isAuctionActive: false,
      });
      return;
    }

    set({
      auctionItems: valid,
      materialAuctionItems: validMaterials,
      recipeAuctionItems: validRecipes,
      killerMoveAuctionItems: validKillerMoves,
    });
  },

  closeAuction: () => {
    set({
      isAuctionActive: false,
      auctionItems: [],
      materialAuctionItems: [],
      recipeAuctionItems: [],
      killerMoveAuctionItems: [],
    });
  },
});

/** 判断是否应该触发拍卖会 */
export function shouldTriggerAuction(turn: number, lastAuctionTurn: number): boolean {
  return turn >= 10 && turn % AUCTION_INTERVAL === 0 && turn > lastAuctionTurn;
}
