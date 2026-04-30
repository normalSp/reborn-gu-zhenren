import { useState } from 'react';
import { useStore } from '../../store';
import guDatabaseRaw from '../../canon/gu-database.json';
import immortalGuRaw from '../../canon/immortal-gu.json';

type GuEntry = {
  name: string; tier: number; path: string; rank: string;
  effect: string; feed: string; refineMaterials: string; refineDifficulty: number;
  isImmortalGu?: boolean;
};

type GuShopItem = GuEntry & { price: number; sellPrice: number };

// 境界分段价格基数（4D.10：参照原著价格区间）
const TIER_PRICE_BASE: Record<number, number> = { 1: 150, 2: 200, 3: 800, 4: 5000, 5: 20000 };
const RANK_MULT: Record<string, number> = {
  common: 1, uncommon: 1.5, rare: 2.5, epic: 5,
};

function calcPrice(tier: number, rank: string): number {
  const base = TIER_PRICE_BASE[tier] || tier * 100;
  const mult = RANK_MULT[rank] || 1;
  if (rank === 'legendary') return -1;
  return Math.round(base * mult);
}

function buildShopList(playerTier: number): GuShopItem[] {
  const db = guDatabaseRaw as Record<string, GuEntry>;
  return Object.entries(db)
    .filter(([_, g]) => !g.isImmortalGu && g.tier <= playerTier && g.rank !== 'legendary')
    .map(([_, g]) => {
      const price = calcPrice(g.tier, g.rank);
      return { ...g, price, sellPrice: Math.round(price / 2) };
    })
    .sort((a, b) => a.tier - b.tier || a.price - b.price);
}

// 仙蛊标价
const IMMORTAL_PRICES: Record<number, number> = { 6: 4, 7: 10, 8: 30, 9: 80 };

export function MerchantPanel() {
  const profile = useStore(s => s.profile);
  const currency = useStore(s => s.currency);
  const immortalCurrency = useStore(s => s.immortalCurrency);
  const inventory = useStore(s => s.inventory);
  const materialBag = useStore(s => s.materialBag);
  const spendCurrency = useStore(s => s.spendCurrency);
  const addCurrency = useStore(s => s.addCurrency) as (n: number) => void;
  const addGu = useStore(s => s.addGu);
  const removeGu = useStore(s => s.removeGu);
  const updateGuState = useStore(s => s.updateGuState);
  const getApertureCapacity = useStore(s => s.getApertureCapacity);

  const [confirming, setConfirming] = useState<GuShopItem | null>(null);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const isImmortal = profile.realm.grand >= 6;
  const playerTier = profile.realm.grand;
  const shopList = buildShopList(playerTier);
  const capacity = getApertureCapacity();

  const buyGu = (item: GuShopItem) => {
    if (inventory.length >= capacity) {
      setMessage('空窍已满，无法再携带更多蛊虫');
      setTimeout(() => setMessage(''), 2000);
      setConfirming(null);
      return;
    }
    if (!spendCurrency(item.price)) {
      setMessage('元石不足');
      setTimeout(() => setMessage(''), 2000);
      setConfirming(null);
      return;
    }
    addGu({
      id: `gu_${item.name}_${Date.now()}`,
      specId: item.name.toLowerCase().replace(/\s+/g, '_'),
      name: item.name,
      tier: item.tier,
      path: item.path as any,
      currentState: 'optimal',
      proficiency: 0,
      bonded: false,
      active: true,
      acquiredAt: {
        turn: (useStore.getState() as any).turn || 1,
        narrative: `在商家城购买获得${item.name}`,
      },
    });
    setMessage(`获得蛊虫「${item.name}」！`);
    setTimeout(() => setMessage(''), 2000);
    setConfirming(null);
  };

  const sellGu = (guId: string, name: string, tier: number, rank: string) => {
    const price = calcPrice(tier, rank);
    const sellPrice = Math.round(price / 2);
    removeGu(guId);
    addCurrency(sellPrice);
    setMessage(`出售「${name}」获得${sellPrice}元石`);
    setTimeout(() => setMessage(''), 2000);
  };

  const feedGu = (guId: string, currentState: string) => {
    const costs: Record<string, number> = { fed: 5, hungry: 5, starving: 15, dying: 30 };
    const prev: Record<string, string> = { hungry: 'fed', starving: 'hungry', dying: 'starving' };
    const target = prev[currentState];
    if (!target) return;
    const cost = costs[currentState];
    if (currency < cost) { setMessage('元石不足'); setTimeout(() => setMessage(''), 2000); return; }
    spendCurrency(cost);
    updateGuState(guId, target as any);
    setMessage(`喂养成功`);
    setTimeout(() => setMessage(''), 2000);
  };

  // ─── 宝黄天（4D.10） ───
  if (isImmortal) {
    const imDb = immortalGuRaw as Record<string, any>;
    const imMeta = imDb._meta || imDb;
    const entries = Object.entries(imDb).filter(([k]) => k !== '_meta');
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-rg-ink-700/95 border-b border-rg-ink-300/10 px-4 py-2 flex items-center justify-between backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold">宝黄天</h3>
          <span className="text-rg-gold text-sm font-panel tabular-nums">
            仙元石 {immortalCurrency}
          </span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {entries.map(([key, gu]: [string, any]) => {
            const price = IMMORTAL_PRICES[gu.tier] || gu.tier * 10;
            const canAfford = immortalCurrency >= price;
            const alreadyOwn = inventory.some(g => g.name === (gu.name || key));
            return (
              <div key={key} className="bg-rg-ink-700/90 border border-rg-gold/15 rounded-md p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-rg-paper-200 font-narrative text-sm">{gu.name || key}</span>
                  <span className="text-[10px] text-rg-gold/70">{gu.tier}转</span>
                </div>
                <p className="text-rg-paper-200/40 text-[10px] leading-relaxed line-clamp-2">{gu.effect}</p>
                <span className="text-rg-gold/70 text-[10px]">{price} 仙元石</span>
                <button disabled={!canAfford || alreadyOwn}
                  className={`text-[10px] font-button px-2 py-1 rounded-sm border transition-micro text-center ${
                    canAfford && !alreadyOwn ? 'border-rg-gold/30 text-rg-gold' : 'opacity-30 cursor-not-allowed'
                  }`}>
                  {alreadyOwn ? '已拥有（仙蛊唯一）' : '购买'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── 凡人商会 ───
  return (
    <div className="flex-1 overflow-y-auto">
      {/* 余额栏 + 标签 */}
      <div className="sticky top-0 z-10 bg-rg-ink-700/95 border-b border-rg-ink-300/10 px-4 py-2 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setTab('buy')}
            className={`text-xs font-button px-2 py-0.5 rounded-sm transition-micro ${tab === 'buy' ? 'bg-rg-gold/15 text-rg-gold' : 'text-rg-paper-200/40'}`}>购买</button>
          <button onClick={() => setTab('sell')}
            className={`text-xs font-button px-2 py-0.5 rounded-sm transition-micro ${tab === 'sell' ? 'bg-rg-gold/15 text-rg-gold' : 'text-rg-paper-200/40'}`}>出售</button>
        </div>
        <span className="text-rg-gold text-xs font-panel tabular-nums">
          元石 {currency}
        </span>
      </div>

      {message && (
        <div className="px-4 py-2 bg-rg-jade-500/10 border-b border-rg-jade-500/20 text-rg-jade-400 text-xs font-panel text-center animate-pulse">
          {message}
        </div>
      )}

      {/* 购买模式 */}
      {tab === 'buy' && (
        <>
          {inventory.length >= capacity && (
            <div className="px-4 py-2 bg-rg-blood-400/10 border-b border-rg-blood-400/20 text-rg-blood-400 text-xs font-panel text-center">
              空窍已满 ({inventory.length}/{capacity})，需出售蛊虫腾出空间后再购买
            </div>
          )}
          {shopList.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-rg-ink-300 text-sm font-panel">暂无适合你境界的蛊虫</p>
            </div>
          ) : (
            <div className="p-3 grid grid-cols-2 gap-2">
              {shopList.map(item => {
                const ownCount = inventory.filter(g => g.name === item.name).length;
                const canBuy = currency >= item.price && inventory.length < capacity;
                return (
                  <div key={item.name} className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-md p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-rg-paper-200 font-narrative text-sm truncate">{item.name}</span>
                      <span className="text-[10px] font-button text-rg-paper-200/60 bg-rg-ink-800/50 px-1.5 py-0.5 rounded-sm">{item.tier}转</span>
                    </div>
                    <span className="text-[10px] text-rg-gold/70">{item.price}元石</span>
                    <button onClick={() => setConfirming(item)} disabled={!canBuy}
                      className={`mt-1 text-[10px] font-button px-2 py-1 rounded-sm border transition-micro text-center ${
                        canBuy ? 'border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10' : 'opacity-30 cursor-not-allowed'
                      }`}>{ownCount > 0 ? `购买 (已有${ownCount})` : '购买'}</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 出售+喂养模式 */}
      {tab === 'sell' && (
        <div className="p-3 flex flex-col gap-3">
          {inventory.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-rg-ink-300 text-sm font-panel">空窍中尚无蛊虫可出售</p>
            </div>
          ) : (
            inventory.map(gu => {
              const marketPrice = calcPrice(gu.tier, gu.path.length > 0 ? 'common' : 'common');
              const sellPrice = Math.round(marketPrice / 2);
              const needsFeed = gu.currentState !== 'optimal' && gu.currentState !== 'fed';
              return (
                <div key={gu.id} className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-md p-3 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-rg-paper-200 font-narrative text-sm">{gu.customName || gu.name}</span>
                    <span className="text-rg-paper-200/40 text-[10px]">{gu.tier}转 · {gu.path}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {needsFeed && (
                      <button onClick={() => feedGu(gu.id, gu.currentState)}
                        className="text-[9px] font-button px-2 py-1 rounded-sm border border-rg-gold/20 text-rg-gold/60 hover:bg-rg-gold/10 transition-micro">
                        喂食({gu.currentState === 'starving' ? 15 : gu.currentState === 'dying' ? 30 : 5}石)
                      </button>
                    )}
                    <button onClick={() => sellGu(gu.id, gu.name, gu.tier, 'common')}
                      disabled={gu.bonded}
                      className={`text-[9px] font-button px-2 py-1 rounded-sm border transition-micro ${
                        gu.bonded ? 'border-rg-gold/30 text-rg-gold bg-rg-gold/10 cursor-not-allowed' : 'border-rg-blood-400/20 text-rg-blood-400/60 hover:bg-rg-blood-400/10'
                      }`}>
                      {gu.bonded ? '本命' : `出售(${sellPrice}石)`}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 购买确认弹窗 */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rg-ink-900/80 backdrop-blur-sm">
          <div className="bg-rg-ink-700/95 border border-rg-gold/30 rounded-lg p-6 max-w-sm w-full mx-4">
            <h4 className="text-rg-paper-100 font-narrative text-lg mb-2">确认购买</h4>
            <p className="text-rg-paper-200/70 text-sm font-panel mb-1">{confirming.name}</p>
            <p className="text-rg-paper-200/40 text-xs font-panel mb-1">{confirming.effect}</p>
            <p className="text-rg-gold text-sm font-panel mb-4">
              {confirming.price} 元石（余额: {currency} | 容量: {inventory.length}/{capacity}）
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(null)}
                className="flex-1 text-rg-paper-200/50 hover:text-rg-paper-200 text-xs font-button px-3 py-2 border border-rg-ink-300/15 rounded-sm transition-micro">取消</button>
              <button onClick={() => buyGu(confirming)}
                className="flex-1 bg-rg-gold text-rg-ink-900 font-button font-semibold text-xs px-3 py-2 rounded-sm hover:brightness-115 transition-micro">购买</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
