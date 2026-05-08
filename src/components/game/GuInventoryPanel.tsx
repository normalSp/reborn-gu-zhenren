import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { GU_IMAGE_MAP } from '../../data/image-maps';
import type { PathType } from '../../types';
import { getMaterialTotalQuantity } from '../../engine/economy-service';
import { getGuFeedingClosureRow, type MaterialSourceTag } from '../../engine/material-source-audit';
import { getGuUseEntry, shouldShowUseButton, canUseFromNormalButton } from '../../engine/gu-use-registry';

const STATE_LABELS: Record<string, string> = {
  optimal: '鼎盛',
  fed: '饱足',
  hungry: '饥饿',
  injured: '受伤',
  starving: '濒饿',
  dying: '垂死',
  dead: '死亡',
};

const STATE_COLORS: Record<string, string> = {
  optimal: 'bg-rg-jade-500/20 text-rg-jade-400 border-rg-jade-500/30',
  fed: 'bg-rg-paper-200/10 text-rg-paper-200/70 border-rg-paper-200/20',
  hungry: 'bg-rg-gold/15 text-rg-gold border-rg-gold/30',
  injured: 'bg-rg-blood-400/10 text-rg-blood-400/80 border-rg-blood-400/30',
  starving: 'bg-rg-blood-400/10 text-rg-blood-400/80 border-rg-blood-400/30',
  dying: 'bg-rg-blood-600/20 text-rg-blood-400 border-rg-blood-600/40',
  dead: 'bg-rg-ink-900/50 text-rg-ink-400 border-rg-ink-500/20',
};

const STATE_DOT: Record<string, string> = {
  optimal: 'bg-rg-jade-400',
  fed: 'bg-rg-paper-200/60',
  hungry: 'bg-rg-gold',
  injured: 'bg-rg-blood-400/80',
  starving: 'bg-rg-blood-400/80',
  dying: 'bg-rg-blood-500',
  dead: 'bg-rg-ink-600',
};

const SOURCE_LABELS: Record<MaterialSourceTag, string> = {
  shop: '商会',
  encounter: '遭遇',
  training_ground: '道场',
  faction: '势力',
  aperture_resource: '仙窍',
  treasure_yellow_heaven: '宝黄天',
  event_whitelist: '剧情',
  regional_generation: '野外/地域掉落',
  special_rule: '规则',
};

export function GuInventoryPanel() {
  const inventory = useStore(s => s.inventory);
  // ═══ BugFix v0.7.0: 蛊仙模式读取仙窍存储的蛊虫 ═══
  const apertureInventoryGu = useStore(s => (s as any).apertureInventory?.gu as typeof inventory | undefined);
  const realmGrand = useStore(s => s.profile?.realm?.grand ?? 1);
  const materialBag = useStore(s => (s as any).materialBag);
  const apertureInventory = useStore(s => (s as any).apertureInventory);
  const isImmortal = realmGrand >= 6;
  // 双源合并：凡人仅看 inventory，蛊仙合并 apertureInventory.gu
  const allGu = isImmortal && apertureInventoryGu ? [...inventory, ...apertureInventoryGu] : inventory;
  const getApertureCapacity = useStore(s => s.getApertureCapacity);
  const removeGu = useStore(s => s.removeGu);
  const addCurrency = useStore(s => s.addCurrency) as (n: number) => void;
  const feedGuHunger = useStore(s => s.feedGuHunger);
  const [filterPath, setFilterPath] = useState<PathType | 'all'>('all');
  const [sellConfirm, setSellConfirm] = useState<string | null>(null);
  const [feedMsg, setFeedMsg] = useState('');
  const [useMsg, setUseMsg] = useState('');

  const capacity = isImmortal ? Infinity : getApertureCapacity();
  const paths = Array.from(new Set(allGu.map(g => g.path)));
  const filtered = filterPath === 'all' ? allGu : allGu.filter(g => g.path === filterPath);
  const materialState = useMemo(() => ({
    materialBag,
    apertureInventory,
    profile: { realm: { grand: realmGrand } },
  }), [materialBag, apertureInventory, realmGrand]);

  const getFeedingInfo = (gu: typeof allGu[number]) => {
    const row = getGuFeedingClosureRow(gu.name, gu.hungerCounter || 0);
    if (!row) return null;
    const stock = row.acceptedFoods.reduce((sum, food) => sum + getMaterialTotalQuantity(materialState, food), 0);
    const sources = Array.from(new Set(row.sources.map(source => SOURCE_LABELS[source.tag] || source.tag))).slice(0, 4);
    return { row, stock, sources };
  };

  // ─── 喂养（P0.4: 接入 feedGuHunger 引擎） ───
  const feedGu = (guId: string, currentState: string) => {
    if (currentState === 'optimal' || currentState === 'fed' || currentState === 'dead') return;
    const ok = feedGuHunger(guId);
    setFeedMsg(ok ? '喂养成功' : '食料不足或不匹配');
    setTimeout(() => setFeedMsg(''), 1500);
  };

  const doSell = (guId: string) => {
    removeGu(guId);
    addCurrency(50); // 基础回购价（简化）
    setSellConfirm(null);
  };

  const doUseGu = (guId: string) => {
    const res = (useStore.getState() as any).useGu?.(guId, { type: 'self' });
    setUseMsg(res?.message || '这只蛊暂未开放主动使用。');
    setTimeout(() => setUseMsg(''), 2200);
  };

  if (allGu.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-rg-ink-300 text-sm font-panel">{isImmortal ? '仙窍中尚无蛊虫' : '空窍中尚无蛊虫'}</p>
      </div>
    );
  }

  const headerTitle = isImmortal
    ? `仙窍蛊虫（${allGu.length}只）`
    : `蛊虫（${allGu.length}/${capacity}）`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ─── 流派筛选栏 ─── */}
      {paths.length > 1 && (
        <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-rg-ink-300/8">
          <button
            onClick={() => setFilterPath('all')}
            className={`text-[10px] font-button px-2 py-0.5 rounded-sm whitespace-nowrap transition-micro ${
              filterPath === 'all'
                ? 'bg-rg-gold/15 text-rg-gold border border-rg-gold/25'
                : 'text-rg-paper-200/40 border border-rg-ink-300/15 hover:border-rg-gold/25 hover:text-rg-paper-200/70'
            }`}
          >
            全部 ({allGu.length})
          </button>
          {paths.map(p => (
            <button
              key={p}
              onClick={() => setFilterPath(p)}
              className={`text-[10px] font-button px-2 py-0.5 rounded-sm whitespace-nowrap transition-micro ${
                filterPath === p
                  ? 'bg-rg-gold/15 text-rg-gold border border-rg-gold/25'
                  : 'text-rg-paper-200/40 border border-rg-ink-300/15 hover:border-rg-gold/25 hover:text-rg-paper-200/70'
              }`}
            >
              {p} ({allGu.filter(g => g.path === p).length})
            </button>
          ))}
        </div>
      )}

      {/* ─── 喂养反馈提示 ─── */}
      {feedMsg && (
        <div className="px-4 py-1.5 bg-rg-jade-500/10 border-b border-rg-jade-500/20 text-rg-jade-400 text-xs font-panel text-center animate-pulse">
          {feedMsg}
        </div>
      )}
      {useMsg && (
        <div className="px-4 py-1.5 bg-rg-gold/10 border-b border-rg-gold/20 text-rg-gold text-xs font-panel text-center">
          {useMsg}
        </div>
      )}

      {/* ─── 卡片网格 ─── */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {filtered.map(gu => (
          <div
            key={gu.id}
            className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-md p-3 backdrop-blur-md flex flex-col gap-1.5"
          >
            {/* 蛊虫标本图 */}
            {GU_IMAGE_MAP[gu.name] && (
              <div className="w-full h-20 bg-rg-ink-900/80 rounded-sm overflow-hidden border border-rg-ink-300/10">
                <img src={`/rebrng/gu/s0-qingmao/${GU_IMAGE_MAP[gu.name]}`}
                  alt={gu.name} loading="lazy"
                  className="w-full h-full object-cover opacity-75 hover:opacity-100 transition-micro"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </div>
            )}
            {/* 名称行：名字 + 本命标记 + 转数 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-rg-paper-200 font-narrative text-sm truncate">
                  {gu.customName || gu.name}
                </span>
                {gu.bonded && (
                  <span className="text-[9px] font-button text-rg-gold bg-rg-gold/10 px-1 rounded-sm shrink-0">
                    本命
                  </span>
                )}
              </div>
              <span className="text-[10px] font-button text-rg-paper-200/60 bg-rg-ink-800/50 px-1.5 py-0.5 rounded-sm shrink-0">
                {gu.tier}转
              </span>
            </div>

            {/* 流派标签 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-panel text-rg-paper-200/50 bg-rg-ink-800/50 px-1.5 py-0.5 rounded-sm">
                {gu.path}
              </span>
            </div>

            {/* 喂养状态 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${STATE_DOT[gu.currentState]} shrink-0`} />
              <span className={`text-[10px] font-panel px-1.5 py-0.5 rounded-sm border ${STATE_COLORS[gu.currentState]}`}>
                {STATE_LABELS[gu.currentState] || gu.currentState}
              </span>
            </div>

            {(() => {
              const info = getFeedingInfo(gu);
              if (!info) return null;
              const { row, stock, sources } = info;
              const noFeeding = row.fallbackPolicy === 'no_feeding_needed';
              const materialFood = row.acceptedFoods.length > 0;
              const safeTurns = Number.isFinite(row.safeTurns) ? `${row.safeTurns}回合` : '无';
              return (
                <div className={`rounded-sm border px-2 py-1 text-[9px] font-panel leading-4 ${
                  row.blocking || (materialFood && stock <= 0)
                    ? 'border-rg-gold/25 bg-rg-gold/5 text-rg-gold/80'
                    : 'border-rg-ink-300/12 bg-rg-ink-800/35 text-rg-paper-200/55'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {noFeeding ? '食料：不需喂养' : `食料：${materialFood ? row.acceptedFoods.join(' / ') : row.feedRequirement}`}
                    </span>
                    <span className="shrink-0">{noFeeding ? '' : `安全 ${safeTurns}`}</span>
                  </div>
                  {!noFeeding && (
                    <>
                      <div className="flex items-center justify-between gap-2 text-rg-paper-200/40">
                        <span className="truncate">来源：{sources.length > 0 ? sources.join(' / ') : '待登记'}</span>
                        {materialFood && <span className="shrink-0">库存 {stock}</span>}
                      </div>
                      <div className="text-rg-paper-200/35 truncate">
                        {row.recommendedAction}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* 熟练度条 */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-panel text-rg-ink-400 shrink-0">熟练</span>
              <div className="flex-1 h-1 bg-rg-ink-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rg-gold rounded-full transition-micro"
                  style={{ width: `${Math.min(gu.proficiency, 100)}%` }}
                />
              </div>
              <span className="text-[9px] font-panel text-rg-ink-400 shrink-0 tabular-nums">
                {gu.proficiency}%
              </span>
            </div>

            {/* 操作行：喂养 + 激活 + 出售 */}
            <div className="flex items-center justify-between gap-1">
              {/* 喂食按钮 — P2/P3: 消耗登记食料，不扣元石 */}
              {gu.currentState !== 'optimal' && gu.currentState !== 'fed' && gu.currentState !== 'dead' ? (
                <button
                  onClick={() => feedGu(gu.id, gu.currentState)}
                  className={`text-[9px] font-button px-2 py-0.5 rounded-sm border transition-micro ${
                    gu.currentState === 'dying'
                      ? 'border-rg-blood-400/30 text-rg-blood-400 bg-rg-blood-400/5 hover:bg-rg-blood-400/15'
                      : 'border-rg-gold/25 text-rg-gold/70 hover:bg-rg-gold/10'
                  }`}
                >
                  喂食
                </button>
              ) : (
                <span className="w-[52px]" />
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => useStore.getState().toggleActive(gu.id)}
                  disabled={gu.bonded}
                  className={`text-[9px] font-button px-2 py-0.5 rounded-sm border transition-micro ${
                    gu.bonded
                      ? 'border-rg-gold/30 text-rg-gold bg-rg-gold/10 cursor-not-allowed'
                      : (gu as any).active !== false
                        ? 'border-rg-jade-400/30 text-rg-jade-400 bg-rg-jade-400/10'
                        : 'border-rg-ink-300/20 text-rg-paper-200/30'
                  }`}
                >
                  {(gu as any).active !== false ? '启用' : '休眠'}
                </button>
                {(() => {
                  const useEntry = getGuUseEntry(gu.name);
                  if (!shouldShowUseButton(useEntry)) return null;
                  const canClick = canUseFromNormalButton(useEntry);
                  return (
                    <button
                      onClick={() => canClick && doUseGu(gu.id)}
                      disabled={!canClick}
                      title={canClick ? useEntry.effects[0]?.description : '需要剧情场景触发'}
                      className={`text-[9px] font-button px-2 py-0.5 rounded-sm border transition-micro ${
                        canClick
                          ? 'border-rg-gold/25 text-rg-gold/75 hover:bg-rg-gold/10'
                          : 'border-rg-ink-300/15 text-rg-paper-200/25 cursor-not-allowed'
                      }`}
                    >
                      {canClick ? '使用' : '剧情'}
                    </button>
                  );
                })()}
                {!gu.bonded && (
                  <button onClick={() => setSellConfirm(gu.id)}
                    className="text-[9px] font-button px-2 py-0.5 rounded-sm border border-rg-blood-400/15 text-rg-blood-400/50 hover:bg-rg-blood-400/10 transition-micro">
                    出售
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 出售确认弹窗 */}
      {sellConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rg-ink-900/80 backdrop-blur-sm">
          <div className="bg-rg-ink-700/95 border border-rg-blood-400/30 rounded-lg p-6 max-w-sm w-full mx-4">
            <h4 className="text-rg-paper-100 font-narrative text-lg mb-2">出售蛊虫</h4>
            <p className="text-rg-paper-200/50 text-xs font-panel mb-4">确认出售此蛊虫？回购价格为基础价。</p>
            <div className="flex gap-3">
              <button onClick={() => setSellConfirm(null)}
                className="flex-1 text-rg-paper-200/50 hover:text-rg-paper-200 text-xs font-button px-3 py-2 border border-rg-ink-300/15 rounded-sm transition-micro">取消</button>
              <button onClick={() => doSell(sellConfirm)}
                className="flex-1 bg-rg-blood-400/80 text-rg-paper-100 font-button font-semibold text-xs px-3 py-2 rounded-sm hover:brightness-115 transition-micro">出售</button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-rg-ink-300 text-xs font-panel">{isImmortal ? '该流派下仙窍中暂无蛊虫' : '该流派下暂无蛊虫'}</p>
        </div>
      )}
    </div>
  );
}
