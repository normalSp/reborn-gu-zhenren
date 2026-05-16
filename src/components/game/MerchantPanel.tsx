/**
 * ═══ 商会面板 — P3 M2.5 分组随机刷新版 ═══
 * 1-5转分组tab + 独立刷新 + 元石付费 + 保底机制
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { useShallow } from 'zustand/shallow';
import { TIER_GROUPS, type GuShopEntry, type TierGroupId, type MaterialFoodShortageInput, type MaterialShopEntry, generateFragmentShopGroup, getFragmentRefreshCost, type FragmentShopEntry, quoteMaterialSellBasePrice } from '../../engine/shop-engine';
import { getMaterialTotalQuantity } from '../../engine/economy-service';
import { getGuFeedingClosureRow } from '../../engine/material-source-audit';
import { applyMerchantPrice, formatModifierBreakdown } from '../../engine/modifier-engine';
import { GU_IMAGE_MAP } from '../../data/image-maps';

const GROUP_IDS: TierGroupId[] = [1, 2, 3, 4, 5];
const EMPTY_RECIPES: Record<string, boolean> = {};
const EMPTY_TALENTS: any[] = [];

export function MerchantPanel() {
  const profile = useStore(s => s.profile);
  const currency = useStore(s => s.currency);
  const immortalCurrency = useStore(s => s.immortalCurrency);
  const inventory = useStore(s => s.inventory);
  const turn = useStore(s => s.turn);
  const currentChapter = useStore((s: any) => s.flags?.current_chapter);
  const selectedTalents = useStore((s: any) => s.selectedTalents ?? EMPTY_TALENTS);
  const factionFlag = useStore((s: any) => s.flags?._faction);
  const getApertureCapacity = useStore(s => s.getApertureCapacity);

  // merchantSlice — useShallow防止对象/数组引用变化导致无限重渲染
  const { shopGroups, refreshShopGroup, getShopRefreshCost, buyGuFromShop, materialShelf, refreshMaterialShelf, getMaterialShelfRefreshCost } = useStore(useShallow((s: any) => ({
    shopGroups: s.shopGroups,
    refreshShopGroup: s.refreshShopGroup,
    getShopRefreshCost: s.getShopRefreshCost,
    buyGuFromShop: s.buyGuFromShop,
    materialShelf: s.materialShelf,
    refreshMaterialShelf: s.refreshMaterialShelf,
    getMaterialShelfRefreshCost: s.getMaterialShelfRefreshCost,
  })));

  const [activeGroup, setActiveGroup] = useState<TierGroupId>(1);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'buy' | 'sell' | 'materials' | 'fragments'>('buy');

  const isImmortal = profile.realm.grand >= 6;
  const playerTier = profile.realm.grand;
  const capacity = getApertureCapacity();
  const currentItems = (shopGroups?.[activeGroup]?.items || []) as GuShopEntry[];
  const modifierTick = `${factionFlag || ''}:${selectedTalents.map((talent: any) => typeof talent === 'string' ? talent : talent?.id).join('|')}`;
  const quoteBuyPrice = (price: number, itemType: string, itemName: string) => {
    void modifierTick;
    return applyMerchantPrice(price, {
      store: useStore.getState(),
      operation: 'merchant_buy',
      itemType,
      itemName,
    });
  };
  const quoteSellPrice = (price: number, itemType: string, itemName: string) => {
    void modifierTick;
    return applyMerchantPrice(price, {
      store: useStore.getState(),
      operation: 'merchant_sell',
      itemType,
      itemName,
    });
  };
  const renderModifierNote = (breakdown: any[]) => {
    const labels = formatModifierBreakdown(breakdown);
    if (!labels.length) return null;
    return <span className="text-[9px] text-rg-jade-400/70 truncate">已生效：{labels.join('、')}</span>;
  };

  // P4: 蛊材商店
  const addMaterial = useStore((s: any) => s.addMaterial) as ((name: string, qty: number) => void) | undefined;
  const removeMaterial = useStore((s: any) => s.removeMaterial) as ((name: string, qty: number) => boolean) | undefined;
  const materialBag = useStore((s: any) => s.materialBag);
  const apertureInventory = useStore((s: any) => s.apertureInventory);
  const apertureInventoryGu = useStore((s: any) => s.apertureInventory?.gu as typeof inventory | undefined);
  const materialState = useMemo(() => ({
    materialBag,
    apertureInventory,
    profile: { realm: { grand: playerTier } },
  }), [materialBag, apertureInventory, playerTier]);
  const materialShortages = useMemo<MaterialFoodShortageInput[]>(() => {
    const ownedGu = isImmortal && apertureInventoryGu ? [...inventory, ...apertureInventoryGu] : inventory;
    return ownedGu
      .map((gu: any) => {
        const row = getGuFeedingClosureRow(gu.name, gu.hungerCounter || 0);
        if (!row || row.acceptedFoods.length === 0) return null;
        const stock = row.acceptedFoods.reduce((sum, food) => sum + getMaterialTotalQuantity(materialState, food), 0);
        if (stock > 0) return null;
        return {
          guName: gu.name,
          tier: gu.tier || row.rank || 1,
          hungerCounter: gu.hungerCounter || 0,
          feedRequirement: row.feedRequirement,
          stock,
        };
      })
      .filter(Boolean) as MaterialFoodShortageInput[];
  }, [apertureInventoryGu, inventory, isImmortal, materialState]);
  const materialItems = (materialShelf?.items || []) as MaterialShopEntry[];
  const sellableMaterialEntries = useMemo(
    () => (Object.entries(materialBag || {}) as [string, number][])
      .filter(([, qty]) => Number(qty || 0) > 0),
    [materialBag],
  );
  const handleBuyMaterial = (item: MaterialShopEntry) => {
    const quote = quoteBuyPrice(item.price, 'material', item.name);
    if (!payWithDualCurrency(quote.price, item.name)) return;
    addMaterial?.(item.name, 1);
    setMessage(`购买「${item.name}」`);
    setTimeout(() => setMessage(''), 2000);
  };
  const handleSellMaterial = (materialName: string) => {
    const baseQuote = quoteMaterialSellBasePrice(materialName, isImmortal);
    if (!baseQuote.canSell) {
      setMessage(baseQuote.reason || '该蛊材当前不可出售');
      setTimeout(() => setMessage(''), 2200);
      return;
    }
    const quote = quoteSellPrice(baseQuote.price, 'material', materialName);
    const removed = removeMaterial?.(materialName, 1);
    if (!removed) {
      setMessage('蛊材库存不足');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    useStore.setState({ currency: (useStore.getState().currency || 0) + quote.price });
    setMessage(`出售「${materialName}」+${quote.price}元石`);
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRefreshMaterials = () => {
    const cost = getMaterialShelfRefreshCost?.(playerTier, isImmortal, turn) ?? 0;
    if (cost > 0 && !payWithDualCurrency(cost, '蛊材货架刷新')) return;
    refreshMaterialShelf?.(playerTier, turn, currentChapter || '青茅山期', materialShortages);
    setMessage(cost > 0 ? `蛊材货架已刷新，消耗${cost}${isImmortal ? '仙元/折价' : '元石'}` : '蛊材货架已刷新');
    setTimeout(() => setMessage(''), 2000);
  };

  // P4: 残方商店
  const completedRecipes = useStore((s: any) => s.flags?.completedRecipes ?? EMPTY_RECIPES) as Record<string, boolean>;
  const [fragmentActiveGroup, setFragmentActiveGroup] = useState<number>(1);
  const [fragmentItems, setFragmentItems] = useState<FragmentShopEntry[]>([]);
  const handleRefreshFragments = (tier: number) => {
    const cost = getFragmentRefreshCost(tier);
    if (!payWithDualCurrency(cost, `${tier}转残方刷新`)) return;
    const items = generateFragmentShopGroup(tier, playerTier);
    setFragmentItems(items);
    setFragmentActiveGroup(tier);
    setMessage(`已刷新${tier}转残方`);
    setTimeout(() => setMessage(''), 2000);
  };
  const handleBuyFragment = (item: FragmentShopEntry) => {
    const quote = quoteBuyPrice(item.price, 'fragment', item.name);
    if (!payWithDualCurrency(quote.price, item.name)) return;
    if (item.isComplete) {
      const store = useStore.getState() as any;
      if (typeof store.unlockRecipe === 'function') {
        store.unlockRecipe(item.targetGu, `merchant:${item.id}`);
      } else {
        useStore.setState((s: any) => ({ flags: { ...s.flags, completedRecipes: { ...completedRecipes, [item.targetGu]: true } } }));
      }
      setMessage(`获得完整蛊方：「${item.targetGu}」炼制方！`);
    } else {
      // 残方 → 写入 discoveredFragments + materialBag
      const existing = (useStore.getState() as any).flags?.discoveredFragments || [] as string[];
      useStore.setState((s: any) => ({ flags: { ...s.flags, discoveredFragments: [...existing, item.id] } }));
      setMessage(`获得残方：「${item.name}」`);
    }
    setTimeout(() => setMessage(''), 2500);
  };

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!shopGroups || initializedRef.current) return;
    let didInit = false;
    for (const g of GROUP_IDS) {
      if (shopGroups[g] && shopGroups[g].items.length === 0 && playerTier >= g - 1) {
        refreshShopGroup?.(g, playerTier, turn, currentChapter);
        didInit = true;
      }
    }
    if (didInit) initializedRef.current = true;
  }, [shopGroups, playerTier, turn]);

  useEffect(() => {
    if (tab !== 'materials') return;
    if ((materialShelf?.items?.length || 0) > 0 && materialShelf?.lastRefreshed === turn) return;
    refreshMaterialShelf?.(playerTier, turn, currentChapter || '青茅山期', materialShortages);
  }, [tab, materialShelf?.lastRefreshed, materialShelf?.items?.length, turn, playerTier, currentChapter, refreshMaterialShelf, materialShortages]);

  const handleRefresh = (groupId: TierGroupId) => {
    const cost = getShopRefreshCost?.(groupId, isImmortal) || 0;
    if (isImmortal) {
      if (immortalCurrency < cost) { setMessage('仙元不足'); setTimeout(() => setMessage(''), 2000); return; }
      useStore.setState({ immortalCurrency: immortalCurrency - cost });
    } else {
      if (currency < cost) { setMessage('元石不足'); setTimeout(() => setMessage(''), 2000); return; }
      useStore.setState({ currency: currency - cost });
    }
    refreshShopGroup?.(groupId, playerTier, turn, currentChapter);
    setMessage(`已刷新${groupId}转组`);
    setTimeout(() => setMessage(''), 2000);
  };

  /** P4: 辅助函数 — 支付并返回成功/失败 */
  const payWithDualCurrency = (priceInYuanStone: number, itemName: string): boolean => {
    if (isImmortal) {
      const xianPrice = Math.max(1, Math.round(priceInYuanStone / 10000));
      // 优先仙元石, 不够用元石补
      if (immortalCurrency >= xianPrice) {
        useStore.setState({ immortalCurrency: immortalCurrency - xianPrice });
        return true;
      }
      if (currency >= priceInYuanStone) {
        useStore.setState({ currency: currency - priceInYuanStone });
        return true;
      }
      setMessage(`仙元不足（需${xianPrice}仙元或${priceInYuanStone}元石）`);
      setTimeout(() => setMessage(''), 2000);
      return false;
    }
    if (currency < priceInYuanStone) {
      setMessage('元石不足');
      setTimeout(() => setMessage(''), 2000);
      return false;
    }
    useStore.setState({ currency: currency - priceInYuanStone });
    return true;
  };

  const handleBuy = (item: GuShopEntry) => {
    const full = useStore.getState() as any;
    const inventoryLength = isImmortal ? (full.apertureInventory?.gu?.length || 0) : inventory.length;
    const cap = isImmortal ? Infinity : capacity;
    if (inventoryLength >= cap) { setMessage(isImmortal ? '仙窍存储异常' : '空窍已满'); setTimeout(() => setMessage(''), 2000); return; }
    if (isImmortal) {
      const quote = quoteBuyPrice(item.price, 'gu', item.name);
      if (!payWithDualCurrency(quote.price, item.name)) return;
      // 蛊仙购买→直接写入仙窍存储，参照addGu的safeGu模式补全所有GuInstance必要字段
      const guList = full.apertureInventory?.gu || [];
      const currentTurn = full.turn || 1;
      const newGu = {
        ...item,
        id: `gu_shop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        specId: item.name.toLowerCase().replace(/\s+/g, '_'),
        currentState: 'optimal' as const,
        hungerCounter: 0,
        proficiency: 0,
        bonded: false,
        active: true,
        acquiredAt: { turn: currentTurn, narrative: `购买: ${item.name}` },
      };
      useStore.setState({ apertureInventory: { ...full.apertureInventory, gu: [...guList, newGu] } });
    } else {
      const success = buyGuFromShop?.(activeGroup, item.name);
      if (!success) { setMessage('购买失败'); setTimeout(() => setMessage(''), 2000); }
    }
    setMessage(`获得「${item.name}」`);
    setTimeout(() => setMessage(''), 2000);
  };

  // 宝黄天 (成仙后) — 不再占位，与凡间共用主面板，仅支付逻辑不同
  // isImmortal 决定: 双货币显示 / 仙元石支付 / 销毁替代出售 / immortalRefreshCost

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 bg-rg-ink-700/95 border-b border-rg-ink-300/10 px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <button onClick={() => setTab('buy')}
            className={`text-xs font-button px-2 py-0.5 rounded-sm transition-micro ${tab === 'buy' ? 'bg-rg-gold/15 text-rg-gold' : 'text-rg-paper-200/40'}`}>购买蛊虫</button>
          <button onClick={() => setTab('materials')}
            className={`text-xs font-button px-2 py-0.5 rounded-sm transition-micro ${tab === 'materials' ? 'bg-rg-gold/15 text-rg-gold' : 'text-rg-paper-200/40'}`}>蛊材</button>
          <button onClick={() => setTab('fragments')}
            className={`text-xs font-button px-2 py-0.5 rounded-sm transition-micro ${tab === 'fragments' ? 'bg-rg-gold/15 text-rg-gold' : 'text-rg-paper-200/40'}`}>残方</button>
          <button onClick={() => setTab('sell')}
            className={`text-xs font-button px-2 py-0.5 rounded-sm transition-micro ${tab === 'sell' ? 'bg-rg-gold/15 text-rg-gold' : 'text-rg-paper-200/40'}`}>{isImmortal ? '销毁' : '出售'}</button>
        </div>
        {isImmortal ? (
          <div className="flex items-center gap-3">
            <span className="text-rg-gold text-xs font-panel">仙元 {immortalCurrency}</span>
            <span className="text-rg-paper-200/30 text-[9px]">|</span>
            <span className="text-rg-paper-200/50 text-[9px] font-panel">元石 {currency}</span>
          </div>
        ) : (
          <span className="text-rg-gold text-xs font-panel">元石 {currency}</span>
        )}
      </div>

      {message && (
        <div className="px-4 py-2 bg-rg-jade-500/10 border-b border-rg-jade-500/20 text-rg-jade-400 text-xs font-panel text-center">
          {message}
        </div>
      )}

      {/* 购买模式 */}
      {tab === 'buy' && (
        <>
          {/* 分组标签 */}
          <div className="px-3 pt-2 flex gap-1.5 flex-wrap">
            {GROUP_IDS.map(g => {
              const config = TIER_GROUPS[g];
              const canAccess = playerTier >= g - 1;
              const count = shopGroups?.[g]?.items?.length || 0;
              return (
                <button key={g} onClick={() => canAccess && setActiveGroup(g)} disabled={!canAccess}
                  className={`text-[10px] font-button px-2 py-1 rounded-sm border transition-micro ${
                    activeGroup === g ? 'border-rg-gold/50 bg-rg-gold/10 text-rg-gold' :
                    canAccess ? 'border-rg-ink-400/20 text-rg-paper-200/60 hover:border-rg-gold/30' :
                    'border-rg-ink-400/10 text-rg-paper-200/20 cursor-not-allowed'
                  }`}>
                  {config.label} ({count})
                </button>
              );
            })}
          </div>

          {/* 刷新按钮 */}
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-rg-paper-200/40">
              {currentItems.length === 0 ? '点击刷新获取蛊虫' : `展示${currentItems.length}只蛊虫`}
            </span>
            <button onClick={() => handleRefresh(activeGroup)}
              className="text-[10px] font-button px-2 py-1 rounded-sm border border-rg-gold/25 text-rg-gold hover:bg-rg-gold/10 transition-micro">
              刷新 ({getShopRefreshCost?.(activeGroup, isImmortal) || '?'}{isImmortal ? '仙元' : '元石'})
            </button>
          </div>

          {/* 蛊虫列表 */}
          {inventory.length >= capacity && (
            <div className="px-3 py-1.5 bg-rg-blood-400/10 border-y border-rg-blood-400/20 text-rg-blood-400 text-[10px] font-panel text-center">
              空窍已满 ({inventory.length}/{capacity})
            </div>
          )}
          {currentItems.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-rg-ink-300 text-sm font-panel">点击刷新获取蛊虫</p>
            </div>
          ) : (
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentItems.map(item => {
                const ownCount = inventory.filter(g => g.name === item.name).length;
                const priceQuote = quoteBuyPrice(item.price, 'gu', item.name);
                const canBuy = (isImmortal ? (immortalCurrency >= Math.max(1, Math.round(priceQuote.price / 10000)) || currency >= priceQuote.price) : currency >= priceQuote.price)
                  && (isImmortal ? true : inventory.length < capacity);
                return (
                  <div key={item.name} className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-md p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-rg-paper-200 font-narrative text-sm truncate">{item.name}</span>
                      <span className={`text-[9px] font-button px-1 py-0.5 rounded-sm ${
                        item.rank === 'epic' ? 'bg-rg-gold/20 text-rg-gold' :
                        item.rank === 'rare' ? 'bg-rg-jade-500/15 text-rg-jade-400' :
                        'bg-rg-ink-800/50 text-rg-paper-200/60'
                      }`}>{item.tier}转</span>
                    </div>
                    {item.effect && <p className="text-rg-paper-200/30 text-[9px] leading-relaxed line-clamp-1">{item.effect}</p>}
                    <span className="text-[10px] text-rg-gold/70">
                      {isImmortal ? `${Math.max(1, Math.round(priceQuote.price / 10000))}仙元 / ${priceQuote.price}元石` : `${priceQuote.price}元石`}
                    </span>
                    {renderModifierNote(priceQuote.breakdown)}
                    <button onClick={() => handleBuy(item)} disabled={!canBuy}
                      className={`text-[10px] font-button px-2 py-1 rounded-sm border transition-micro text-center ${
                        canBuy ? 'border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10' : 'opacity-30 cursor-not-allowed'
                      }`}>
                      {ownCount > 0 ? `购买 (已有${ownCount})` : '购买'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 蛊材购买模式 — P4新增 */}
      {tab === 'materials' && (
        <>
        <div className="px-3 pt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-rg-paper-200/40 font-panel">
            {materialShelf?.emergencyActive ? '食料保底已介入' : `本回合刷新 ${materialShelf?.freeRefreshTurn === turn ? materialShelf?.freeRefreshCount || 0 : 0}/1`}
          </span>
          <button onClick={handleRefreshMaterials}
            className="text-[10px] font-button px-2 py-1 rounded-sm border border-rg-gold/25 text-rg-gold hover:bg-rg-gold/10 transition-micro">
            刷新 ({getMaterialShelfRefreshCost?.(playerTier, isImmortal, turn) ?? 0}{isImmortal ? '仙元' : '元石'})
          </button>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {materialItems.length === 0 ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <p className="text-rg-ink-300 text-sm font-panel">当前商路暂无可购买蛊材</p>
            </div>
          ) : (
            materialItems.map(item => {
              const priceQuote = quoteBuyPrice(item.price, 'material', item.name);
              const canBuy = isImmortal ? (immortalCurrency >= Math.max(1, Math.round(priceQuote.price / 10000)) || currency >= priceQuote.price) : currency >= priceQuote.price;
              return (
                <div key={item.id} className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-md p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-rg-paper-200 font-narrative text-sm truncate">{item.name}</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded-sm bg-rg-ink-800/50 ${item.source === 'shortage_food' ? 'text-rg-gold' : 'text-rg-paper-200/40'}`}>{item.tier}级</span>
                  </div>
                  {item.description && <p className="text-rg-paper-200/30 text-[9px] leading-relaxed line-clamp-1">{item.description}</p>}
                  <span className="text-[10px] text-rg-gold/70">
                    {isImmortal ? `${Math.max(1, Math.round(priceQuote.price / 10000))}仙元 / ${priceQuote.price}元石` : `${priceQuote.price}元石`}
                  </span>
                  {renderModifierNote(priceQuote.breakdown)}
                  <button onClick={() => handleBuyMaterial(item)} disabled={!canBuy}
                    className={`text-[10px] font-button px-2 py-1 rounded-sm border transition-micro text-center ${canBuy ? 'border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10' : 'opacity-30 cursor-not-allowed'}`}>
                    购买
                  </button>
                </div>
              );
            })
          )}
        </div>
        </>
      )}

      {/* 残方购买模式 — P4新增 */}
      {tab === 'fragments' && (
        <>
          <div className="px-3 pt-2 flex gap-1.5 flex-wrap">
            {[1,2,3,4,5].map(t => {
              const canAccess = playerTier >= t - 1;
              return (
                <button key={t} onClick={() => { canAccess && setFragmentActiveGroup(t); }} disabled={!canAccess}
                  className={`text-[10px] font-button px-2 py-1 rounded-sm border transition-micro ${
                    fragmentActiveGroup === t ? 'border-rg-gold/50 bg-rg-gold/10 text-rg-gold' :
                    canAccess ? 'border-rg-ink-400/20 text-rg-paper-200/60 hover:border-rg-gold/30' :
                    'border-rg-ink-400/10 text-rg-paper-200/20 cursor-not-allowed'
                  }`}>
                  {t}转残方
                </button>
              );
            })}
          </div>
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-rg-paper-200/40">残方可在探索/NPC传授/传承中获得，收集多份可合成完整蛊方</span>
            <button onClick={() => handleRefreshFragments(fragmentActiveGroup)}
              className="text-[10px] font-button px-2 py-1 rounded-sm border border-rg-gold/25 text-rg-gold hover:bg-rg-gold/10 transition-micro">
              刷新 ({getFragmentRefreshCost(fragmentActiveGroup)}元石)
            </button>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fragmentItems.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center py-12">
                <p className="text-rg-ink-300 text-sm font-panel">点击刷新获取残方</p>
              </div>
            ) : (
              fragmentItems.map(item => {
                const priceQuote = quoteBuyPrice(item.price, 'fragment', item.name);
                const canBuy = isImmortal ? (immortalCurrency >= Math.max(1, Math.round(priceQuote.price / 10000)) || currency >= priceQuote.price) : currency >= priceQuote.price;
                return (
                  <div key={item.id} className={`bg-rg-ink-700/90 border rounded-md p-3 flex flex-col gap-1.5 ${
                    item.isComplete ? 'border-rg-gold/30 bg-rg-gold/5' : 'border-rg-ink-300/12'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-narrative text-sm truncate ${item.isComplete ? 'text-rg-gold' : 'text-rg-paper-200'}`}>{item.name}</span>
                      <span className={`text-[8px] px-1 py-0.5 rounded-sm ${
                        item.type === 'complete_recipe' ? 'bg-rg-gold/20 text-rg-gold' :
                        item.type === 'ascend_fragment' ? 'bg-rg-jade-500/15 text-rg-jade-400' :
                        'bg-rg-ink-800/50 text-rg-paper-200/40'
                      }`}>
                        {item.type === 'complete_recipe' ? '完整' : item.type === 'ascend_fragment' ? '升炼' : '炼制'}
                      </span>
                    </div>
                    <p className="text-rg-paper-200/30 text-[9px] leading-relaxed line-clamp-2">{item.description}</p>
                    <span className="text-[10px] text-rg-gold/70">
                      {isImmortal ? `${Math.max(1, Math.round(priceQuote.price / 10000))}仙元 / ${priceQuote.price}元石` : `${priceQuote.price}元石`}
                    </span>
                    {renderModifierNote(priceQuote.breakdown)}
                    <button onClick={() => handleBuyFragment(item)} disabled={!canBuy}
                      className={`text-[10px] font-button px-2 py-1 rounded-sm border transition-micro text-center ${
                        canBuy ? 'border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10' : 'opacity-30 cursor-not-allowed'
                      }`}>
                      购买
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* 出售/销毁模式 */}
      {tab === 'sell' && (
        <div className="p-3 flex flex-col gap-3">
          <div className="rounded-md border border-rg-ink-300/12 bg-rg-ink-700/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-rg-gold">出售蛊材</span>
              <span className="text-[10px] text-rg-paper-200/35">商会按保守价回收，仙材需蛊仙渠道</span>
            </div>
            {sellableMaterialEntries.length === 0 ? (
              <p className="text-[11px] text-rg-paper-200/25">物资袋暂无可出售蛊材。</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sellableMaterialEntries.map(([materialName, qty]) => {
                  const baseQuote = quoteMaterialSellBasePrice(materialName, isImmortal);
                  const quote = baseQuote.canSell ? quoteSellPrice(baseQuote.price, 'material', materialName) : null;
                  return (
                    <div key={materialName} className="rounded-sm border border-rg-ink-300/10 bg-rg-ink-800/55 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-rg-paper-200">{materialName}</span>
                        <span className="shrink-0 text-[10px] text-rg-paper-200/40">×{qty}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className={baseQuote.canSell ? 'text-[10px] text-rg-gold/75' : 'text-[10px] text-rg-blood-400/75'}>
                          {baseQuote.canSell ? `${quote?.price || 0}元石/份` : baseQuote.reason}
                        </span>
                        <button
                          onClick={() => handleSellMaterial(materialName)}
                          disabled={!baseQuote.canSell}
                          className={`rounded-sm border px-2 py-1 text-[9px] font-button transition-micro ${
                            baseQuote.canSell
                              ? 'border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10'
                              : 'border-rg-ink-300/10 text-rg-paper-200/20 cursor-not-allowed'
                          }`}
                        >
                          出售1份
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {(() => {
            const sellGuList = isImmortal
              ? ((useStore.getState() as any).apertureInventory?.gu || []) as any[]
              : inventory;
            if (sellGuList.length === 0) {
              return (
                <div className="flex items-center justify-center py-16">
                  <p className="text-rg-ink-300 text-sm font-panel">{isImmortal ? '仙窍中尚无蛊虫可销毁' : '空窍中尚无蛊虫可出售'}</p>
                </div>
              );
            }
            return sellGuList.map((gu: any) => (
              <div key={gu.id} className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-md p-3 flex items-center justify-between">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-rg-paper-200 font-narrative text-sm truncate">{gu.customName || gu.name}</span>
                  <span className="text-rg-paper-200/40 text-[10px]">{gu.tier}转 · {gu.path}</span>
                </div>
                <button onClick={() => {
                  if (isImmortal) {
                    // 销毁：从仙窍移除，不换任何货币
                    const full = useStore.getState() as any;
                    const storage = full.apertureInventory;
                    const newGuList = storage.gu.filter((g: any) => g.id !== gu.id);
                    useStore.setState({ apertureInventory: { ...storage, gu: newGuList } });
                    setMessage(`已销毁「${gu.name}」`);
                  } else {
                    const basePrice = Math.round((TIER_GROUPS[gu.tier as TierGroupId]?.basePrice || gu.tier * 150) / 2);
                    const price = quoteSellPrice(basePrice, 'gu', gu.name).price;
                    useStore.getState().removeGu?.(gu.id);
                    useStore.setState({ currency: (useStore.getState().currency || 0) + price });
                    setMessage(`出售「${gu.name}」+${price}元石`);
                  }
                  setTimeout(() => setMessage(''), 2000);
                }}
                  disabled={!isImmortal && gu.bonded}
                  className={`text-[9px] font-button px-2 py-1 rounded-sm border transition-micro ${
                    (!isImmortal && gu.bonded) ? 'border-rg-gold/30 text-rg-gold bg-rg-gold/10 cursor-not-allowed' : isImmortal ? 'border-rg-blood-400/30 text-rg-blood-400 hover:bg-rg-blood-400/10' : 'border-rg-blood-400/20 text-rg-blood-400/60 hover:bg-rg-blood-400/10'
                  }`}>
                  {!isImmortal && gu.bonded ? '本命' : isImmortal ? '销毁' : '出售'}
                </button>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  );
}
