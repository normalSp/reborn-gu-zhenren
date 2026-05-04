/**
 * ═══ 商会面板 — P3 M2.5 分组随机刷新版 ═══
 * 1-5转分组tab + 独立刷新 + 元石付费 + 保底机制
 */
import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { TIER_GROUPS, type GuShopEntry, type TierGroupId } from '../../engine/shop-engine';
import { GU_IMAGE_MAP } from '../../data/image-maps';

const GROUP_IDS: TierGroupId[] = [1, 2, 3, 4, 5];

export function MerchantPanel() {
  const profile = useStore(s => s.profile);
  const currency = useStore(s => s.currency);
  const immortalCurrency = useStore(s => s.immortalCurrency);
  const inventory = useStore(s => s.inventory);
  const turn = useStore(s => s.turn);
  const currentChapter = useStore((s: any) => s.flags?.current_chapter);
  const getApertureCapacity = useStore(s => s.getApertureCapacity);

  // merchantSlice
  const shopGroups = useStore(s => (s as any).shopGroups);
  const refreshShopGroup = useStore(s => (s as any).refreshShopGroup);
  const getShopRefreshCost = useStore(s => (s as any).getShopRefreshCost);
  const buyGuFromShop = useStore(s => (s as any).buyGuFromShop);

  const [activeGroup, setActiveGroup] = useState<TierGroupId>(1);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const isImmortal = profile.realm.grand >= 6;
  const playerTier = profile.realm.grand;
  const capacity = getApertureCapacity();
  const currentItems = (shopGroups?.[activeGroup]?.items || []) as GuShopEntry[];

  // 初始化：首次进入时自动加载各组
  useMemo(() => {
    if (!shopGroups) return;
    for (const g of GROUP_IDS) {
      if (shopGroups[g] && shopGroups[g].items.length === 0 && playerTier >= g - 1) {
        refreshShopGroup?.(g, playerTier, turn, currentChapter);
      }
    }
  }, [shopGroups, playerTier, turn]);

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

  const handleBuy = (item: GuShopEntry) => {
    if (inventory.length >= capacity) { setMessage('空窍已满'); setTimeout(() => setMessage(''), 2000); return; }
    const success = buyGuFromShop?.(activeGroup, item.name);
    if (success) {
      setMessage(`获得「${item.name}」`);
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('元石不足');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  // 宝黄天 (成仙后)
  if (isImmortal) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-rg-ink-700/95 border-b border-rg-ink-300/10 px-4 py-2 flex items-center justify-between backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold">宝黄天 · 仙蛊拍卖</h3>
          <span className="text-rg-gold text-sm font-panel">仙元 {immortalCurrency}</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <p className="text-rg-ink-300 text-sm font-panel">宝黄天拍卖行正在筹备中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 bg-rg-ink-700/95 border-b border-rg-ink-300/10 px-4 py-2 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setTab('buy')}
            className={`text-xs font-button px-2 py-0.5 rounded-sm transition-micro ${tab === 'buy' ? 'bg-rg-gold/15 text-rg-gold' : 'text-rg-paper-200/40'}`}>购买</button>
          <button onClick={() => setTab('sell')}
            className={`text-xs font-button px-2 py-0.5 rounded-sm transition-micro ${tab === 'sell' ? 'bg-rg-gold/15 text-rg-gold' : 'text-rg-paper-200/40'}`}>出售</button>
        </div>
        <span className="text-rg-gold text-xs font-panel">元石 {currency}</span>
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
            <div className="p-3 grid grid-cols-2 gap-2">
              {currentItems.map(item => {
                const ownCount = inventory.filter(g => g.name === item.name).length;
                const canBuy = currency >= item.price && inventory.length < capacity;
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
                    <span className="text-[10px] text-rg-gold/70">{item.price}元石</span>
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

      {/* 出售模式 (保持原有逻辑) */}
      {tab === 'sell' && (
        <div className="p-3 flex flex-col gap-3">
          {inventory.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-rg-ink-300 text-sm font-panel">空窍中尚无蛊虫可出售</p>
            </div>
          ) : (
            inventory.map((gu: any) => (
              <div key={gu.id} className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-md p-3 flex items-center justify-between">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-rg-paper-200 font-narrative text-sm truncate">{gu.customName || gu.name}</span>
                  <span className="text-rg-paper-200/40 text-[10px]">{gu.tier}转 · {gu.path}</span>
                </div>
                <button onClick={() => {
                  const price = Math.round((TIER_GROUPS[gu.tier as TierGroupId]?.basePrice || gu.tier * 150) / 2);
                  useStore.getState().removeGu?.(gu.id);
                  useStore.setState({ currency: (useStore.getState().currency || 0) + price });
                  setMessage(`出售「${gu.name}」+${price}元石`);
                  setTimeout(() => setMessage(''), 2000);
                }}
                  disabled={gu.bonded}
                  className={`text-[9px] font-button px-2 py-1 rounded-sm border transition-micro ${
                    gu.bonded ? 'border-rg-gold/30 text-rg-gold bg-rg-gold/10 cursor-not-allowed' : 'border-rg-blood-400/20 text-rg-blood-400/60 hover:bg-rg-blood-400/10'
                  }`}>
                  {gu.bonded ? '本命' : '出售'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
