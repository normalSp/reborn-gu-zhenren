/**
 * ═══ 宝黄天拍卖会面板 — P1.1 + v0.7.0-pre Tab化改造 ═══
 * 仙蛊拍卖 UI + 仙材/仙蛊方/杀招传承 四类Tab（后三类为占位Tab）
 */
import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type {
  ImmortalAuctionItem,
  KillerMoveAuctionItem,
  MaterialAuctionItem,
  RecipeAuctionItem,
} from '../../engine/auction-engine';
import { TIER_COLORS, TIER_LABELS } from '../../data/talents';

type AuctionTab = 'immortal_gu' | 'materials' | 'recipes' | 'killer_moves';

const TAB_ITEMS: { id: AuctionTab; label: string }[] = [
  { id: 'immortal_gu', label: '仙蛊' },
  { id: 'materials', label: '仙材' },
  { id: 'recipes', label: '仙蛊方' },
  { id: 'killer_moves', label: '杀招传承' },
];

const PATH_COLORS: Record<string, string> = {
  '金道': '#c9a84a', '木道': '#4a8c5c', '水道': '#4a7a9a', '火道': '#c94a4a',
  '土道': '#8c7a4a', '风道': '#7a9a4a', '雷道': '#9a4ac9', '冰道': '#4a9ac9',
  '力道': '#c96a4a', '魂道': '#7a4a9a', '血道': '#c94a6a', '智道': '#4a6ac9',
  '光道': '#c9c94a', '暗道': '#4a4a6a', '毒道': '#6ac94a', '骨道': '#9a9a9a',
  '奴道': '#8c4a6a', '食道': '#c98c4a', '偷道': '#4a6a8c', '变化道': '#9a8c4a',
  '炼道': '#4a8c8c',
};

export function AuctionPanel() {
  const auctionItems = useStore(useShallow((s: any) => s.auctionItems as ImmortalAuctionItem[]));
  const materialAuctionItems = useStore(useShallow((s: any) => s.materialAuctionItems as MaterialAuctionItem[]));
  const recipeAuctionItems = useStore(useShallow((s: any) => s.recipeAuctionItems as RecipeAuctionItem[]));
  const killerMoveAuctionItems = useStore(useShallow((s: any) => s.killerMoveAuctionItems as KillerMoveAuctionItem[]));
  const isActive = useStore(s => (s as any).isAuctionActive as boolean);
  const immortalCurrency = useStore(s => s.immortalCurrency);
  const realmGrand = useStore(s => s.profile.realm.grand);
  const closeAuction = useStore(s => (s as any).closeAuction as () => void);
  const placeAuctionBid = useStore(s => (s as any).placeAuctionBid as (id: string, amount: number) => { success: boolean; message: string });
  const purchaseTreasureItem = useStore(s => (s as any).purchaseTreasureItem as (
    category: 'materials' | 'recipes' | 'killer_moves',
    itemId: string
  ) => { success: boolean; message: string });

  const [bidAmounts, setBidAmounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<AuctionTab>('immortal_gu');

  const hasAnyItems =
    auctionItems.length > 0 ||
    materialAuctionItems.length > 0 ||
    recipeAuctionItems.length > 0 ||
    killerMoveAuctionItems.length > 0;
  if (realmGrand < 6 || !isActive || !hasAnyItems) return null;

  const treasureItems =
    currentTab === 'materials' ? materialAuctionItems :
      currentTab === 'recipes' ? recipeAuctionItems :
        currentTab === 'killer_moves' ? killerMoveAuctionItems : [];

  const handleBid = (item: ImmortalAuctionItem) => {
    const amount = bidAmounts[item.id] || item.currentBid + 1;
    const result = placeAuctionBid(item.id, amount);
    setMessage(result.message);
    if (!result.success) {
      setTimeout(() => setMessage(''), 3000);
    } else if (result.message.includes('竞拍成功')) {
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleTreasurePurchase = (item: MaterialAuctionItem | RecipeAuctionItem | KillerMoveAuctionItem) => {
    if (currentTab === 'immortal_gu') return;
    const result = purchaseTreasureItem(currentTab, item.id);
    setMessage(result.message);
    setTimeout(() => setMessage(''), result.success ? 4000 : 3000);
  };

  const handleClose = () => {
    closeAuction();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rg-ink-900/85 backdrop-blur-sm">
      <div className="bg-rg-ink-700/95 border border-rg-gold/30 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 overflow-hidden shadow-2xl shadow-rg-gold/5">
        {/* ─── 标题栏 ─── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rg-gold/20 bg-rg-ink-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rg-gold/20 border border-rg-gold/40 flex items-center justify-center">
              <span className="text-base">🏛</span>
            </div>
            <div>
              <h2 className="text-rg-gold font-narrative text-lg">宝黄天拍卖会</h2>
              <p className="text-rg-paper-200/40 text-[10px] font-panel">
                仙元石余额: <span className="text-rg-gold font-semibold">{immortalCurrency}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-rg-paper-200/40 hover:text-rg-paper-200/80 text-xs font-button px-3 py-1.5 border border-rg-ink-300/15 rounded-sm hover:bg-rg-ink-600/30 transition-micro"
          >
            离开
          </button>
        </div>

        {/* ─── Tab栏 v0.7.0-pre — 四类交易物切换 ─── */}
        <div className="flex items-center border-b border-rg-gold/10 bg-rg-ink-800/30">
          {TAB_ITEMS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`text-xs font-button px-4 py-2 transition-micro border-b-2 ${
                currentTab === tab.id
                  ? 'text-rg-gold border-rg-gold bg-rg-gold/5'
                  : 'text-rg-paper-200/40 border-transparent hover:text-rg-paper-200/70 hover:border-rg-gold/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── 反馈消息 ─── */}
        {message && (
          <div className={`px-5 py-2 text-xs font-panel text-center border-b ${
            message.includes('成功') || message.includes('获得')
              ? 'bg-rg-jade-500/10 text-rg-jade-400 border-rg-jade-500/20'
              : 'bg-rg-blood-400/10 text-rg-blood-400/80 border-rg-blood-400/20'
          }`}>
            {message}
          </div>
        )}

        {/* ─── 仙蛊拍卖品列表（当前Tab） ─── */}
        {currentTab === 'immortal_gu' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {auctionItems.map(item => (
              <div
                key={item.id}
                className={`bg-rg-ink-800/60 rounded-md border transition-all ${
                  expandedItem === item.id ? 'border-rg-gold/40' : 'border-rg-ink-300/10 hover:border-rg-gold/20'
                }`}
              >
                {/* 物品概要 */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-rg-gold font-narrative text-base">{item.name}</span>
                      <span className="text-[10px] font-button px-1.5 py-0.5 rounded-sm bg-rg-ink-700 text-rg-paper-200/60">
                        {item.tier}转
                      </span>
                    </div>
                    <span className="text-[10px] font-panel" style={{ color: PATH_COLORS[item.path] || '#9a9a9a' }}>
                      {item.path}
                    </span>
                  </div>

                  {/* 竞价信息 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[9px] font-panel text-rg-paper-200/40">起拍价</span>
                        <p className="text-rg-paper-200/70 font-semibold text-sm">{item.startingBid} 仙元</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-panel text-rg-paper-200/40">当前竞价</span>
                        <p className="text-rg-gold font-bold text-sm">{item.currentBid} 仙元</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-panel text-rg-paper-200/40">
                        {item.bidderCount > 0
                          ? `${item.bidderCount} 位竞争`
                          : '即将成交'}
                      </span>
                      <p className="text-[10px] font-panel text-rg-ink-300">
                        {item.expiresTurn - (useStore.getState() as any).turn} 回合后撤拍
                      </p>
                    </div>
                  </div>
                </div>

                {/* 展开详情 + 出价区 */}
                {expandedItem === item.id && (
                  <div className="px-4 pb-4 border-t border-rg-ink-300/8 pt-3">
                    {/* 仙蛊效果 */}
                    {item.effect && (
                      <p className="text-rg-paper-200/50 text-xs font-panel mb-3 leading-relaxed">
                        {item.effect}
                      </p>
                    )}

                    {/* 出价操作 */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="number"
                          placeholder={`${item.currentBid + 1}`}
                          min={item.currentBid + 1}
                          value={bidAmounts[item.id] || ''}
                          onChange={e => setBidAmounts(prev => ({
                            ...prev, [item.id]: parseInt(e.target.value) || 0,
                          }))}
                          className="flex-1 bg-rg-ink-900/80 border border-rg-ink-300/20 rounded-sm px-3 py-1.5 text-rg-paper-200 text-sm font-panel outline-none focus:border-rg-gold/40 transition-micro"
                        />
                        <span className="text-rg-paper-200/30 text-xs font-panel shrink-0">仙元</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleBid(item); }}
                        disabled={immortalCurrency < (bidAmounts[item.id] || item.currentBid + 1)}
                        className={`text-xs font-button px-4 py-1.5 rounded-sm border transition-micro ${
                          immortalCurrency >= (bidAmounts[item.id] || item.currentBid + 1)
                            ? 'bg-rg-gold/20 border-rg-gold/40 text-rg-gold hover:bg-rg-gold/30'
                            : 'border-rg-ink-300/10 text-rg-paper-200/20 cursor-not-allowed'
                        }`}
                      >
                        出价
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {treasureItems.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-rg-paper-200/45 font-narrative text-sm">
                  本轮暂无{currentTab === 'materials' ? '仙材' : currentTab === 'recipes' ? '仙蛊方' : '杀招传承'}挂售
                </p>
                <p className="text-rg-ink-400 text-xs font-panel mt-1">
                  下一轮宝黄天交易会刷新
                </p>
              </div>
            )}
            {treasureItems.map(item => {
              const recipe = item as Partial<RecipeAuctionItem>;
              const move = item as Partial<KillerMoveAuctionItem>;
              const titleMeta = currentTab === 'materials'
                ? `${(item as MaterialAuctionItem).grade} · ${item.path}`
                : currentTab === 'recipes'
                  ? `${recipe.targetTier}转目标 · ${item.path}`
                  : `${move.tier}转 · ${move.form} · ${item.path}`;
              return (
                <div key={item.id} className="bg-rg-ink-800/60 rounded-md border border-rg-ink-300/10 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-rg-gold font-narrative text-base">{item.name}</h3>
                      <p className="text-[10px] font-panel text-rg-paper-200/40 mt-1">{titleMeta}</p>
                    </div>
                    <span className="text-[10px] font-panel" style={{ color: PATH_COLORS[item.path] || '#9a9a9a' }}>
                      {item.path}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-5">
                      <div>
                        <span className="text-[9px] font-panel text-rg-paper-200/40">底价</span>
                        <p className="text-rg-paper-200/70 font-semibold text-sm">{item.basePrice} 仙元</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-panel text-rg-paper-200/40">一口价</span>
                        <p className="text-rg-gold font-bold text-sm">{item.currentBid} 仙元</p>
                      </div>
                      {'fragmentsRequired' in item && (
                        <div>
                          <span className="text-[9px] font-panel text-rg-paper-200/40">残方份数</span>
                          <p className="text-rg-paper-200/70 font-semibold text-sm">{item.fragmentsRequired}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleTreasurePurchase(item)}
                      disabled={immortalCurrency < item.currentBid}
                      className={`text-xs font-button px-4 py-1.5 rounded-sm border transition-micro ${
                        immortalCurrency >= item.currentBid
                          ? 'bg-rg-gold/20 border-rg-gold/40 text-rg-gold hover:bg-rg-gold/30'
                          : 'border-rg-ink-300/10 text-rg-paper-200/20 cursor-not-allowed'
                      }`}
                    >
                      购买
                    </button>
                  </div>
                  <p className="text-[10px] font-panel text-rg-ink-300 mt-3">
                    {item.bidderCount > 0 ? `${item.bidderCount} 位竞争者关注` : '暂无竞争者'} · {item.expiresTurn - (useStore.getState() as any).turn} 回合后撤拍
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── 底部提示 ─── */}
        <div className="px-5 py-2 border-t border-rg-ink-300/8 bg-rg-ink-800/30">
          <p className="text-[9px] font-panel text-rg-paper-200/25 text-center">
            每 10 回合开启一次宝黄天拍卖会 &middot; 仙蛊天地间独一无二 &middot; 成交后扣除仙元石
          </p>
        </div>
      </div>
    </div>
  );
}
