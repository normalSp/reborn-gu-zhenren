import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import {
  buildV120LowRankSurvivalEconomyProjection,
  type V120SurvivalPressureItemStatus,
} from '../../engine/v120-low-rank-survival-economy-projection';

const itemClass: Record<V120SurvivalPressureItemStatus, string> = {
  visible: 'border-rg-jade-400/35 bg-rg-jade-500/10 text-rg-jade-100',
  needs_context: 'border-rg-gold-400/35 bg-rg-gold-500/10 text-rg-gold-100',
  deferred: 'border-rg-ink-300/20 bg-rg-ink-700/35 text-rg-paper-100',
};

function statusLabel(status: V120SurvivalPressureItemStatus): string {
  if (status === 'visible') return '可读';
  if (status === 'needs_context') return '缺前置';
  return '延期';
}

export function LowRankSurvivalEconomyPanel() {
  const [actionMessage, setActionMessage] = useState('');
  const livingWorldState = useStore((s: any) => s.livingWorldState);
  const routeLocationState = useStore((s: any) => s.routeLocationState);
  const survivalEconomyState = useStore((s: any) => s.survivalEconomyState);
  const syncSurvivalEconomyLedgerAction = useStore((s: any) => s.syncSurvivalEconomyLedgerAction);
  const resolveQingmaoRefinementBoundaryAction = useStore((s: any) => s.resolveQingmaoRefinementBoundaryAction);
  const resolveQingmaoMarketWindowAction = useStore((s: any) => s.resolveQingmaoMarketWindowAction);
  const materialBag = useStore((s: any) => s.materialBag);
  const turn = useStore((s: any) => s.turn);

  const projection = useMemo(() => buildV120LowRankSurvivalEconomyProjection({
    livingWorldState,
    routeLocationState,
    materialBag,
    turn,
  }), [livingWorldState, routeLocationState, materialBag, turn]);
  const ledgerEntries = Array.isArray(survivalEconomyState?.ledger) ? survivalEconomyState.ledger : [];
  const canSyncLedger = projection.status === 'pressure_visible';
  const knownFacts = livingWorldState?.knownFacts || {};
  const actionConsequences = Array.isArray(livingWorldState?.actionConsequences)
    ? livingWorldState.actionConsequences
    : [];
  const hasSupplyContext = Boolean(
    knownFacts.qingmao_supply_feeding_preparation_baseline
    || actionConsequences.some((entry: any) => entry.actionId === 'qingmao_supply_feeding_preparation_probe')
  );
  const hasRefinementContext = Boolean(knownFacts.qingmao_refinement_fragment_boundary_baseline);
  const refinementItem = projection.pressureItems.find(item => item.id === 'refinement_preparation');
  const tradeItem = projection.pressureItems.find(item => item.id === 'trade_window');
  const canRunRefinement = Boolean(resolveQingmaoRefinementBoundaryAction && hasSupplyContext && refinementItem?.status !== 'deferred');
  const canRunMarket = Boolean(resolveQingmaoMarketWindowAction && hasRefinementContext && tradeItem?.status !== 'deferred');

  const runRefinementBoundary = () => {
    const result = resolveQingmaoRefinementBoundaryAction?.();
    setActionMessage(result?.message || '炼养用准备动作未返回结果。');
  };

  const runMarketWindow = () => {
    const result = resolveQingmaoMarketWindowAction?.();
    setActionMessage(result?.message || '交易窗口动作未返回结果。');
  };

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="low-rank-survival-economy-panel">
      <div className="space-y-3">
        <div className="rounded-sm border border-rg-gold-400/30 bg-rg-gold-500/10 p-3" data-testid="v120-survival-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-rg-gold-100">低阶生存经济</p>
            <span className="text-[10px] text-rg-paper-200/55">{projection.statusLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rg-paper-100/78">{projection.publicSummary}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">{projection.nextStep}</p>
        </div>

        <div className="rounded-sm border border-rg-jade-400/25 bg-rg-jade-500/10 p-3" data-testid="v120-survival-ledger-state">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-rg-jade-100">压力账本</p>
              <p className="mt-1 text-[10px] text-rg-paper-200/55">
                {survivalEconomyState?.status === 'pressure_tracked'
                  ? `已登记 ${ledgerEntries.length} 条，压力 ${survivalEconomyState.pressureScore}`
                  : '尚未登记'}
              </p>
            </div>
            <button
              type="button"
              className="rounded-sm border border-rg-jade-300/35 px-3 py-1.5 text-[11px] font-semibold text-rg-jade-100 transition hover:bg-rg-jade-400/10 disabled:cursor-not-allowed disabled:opacity-45"
              data-testid="v120-survival-ledger-sync"
              disabled={!canSyncLedger}
              onClick={() => syncSurvivalEconomyLedgerAction?.()}
            >
              登记
            </button>
          </div>
          {ledgerEntries.length > 0 && (
            <div className="mt-2 grid gap-1.5">
              {ledgerEntries.slice(-4).map((entry: any) => (
                <p key={entry.id} className="text-[10px] leading-relaxed text-rg-paper-200/62">
                  {entry.category} / {entry.pressure}：{entry.publicSummary}
                </p>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/55">
            账本只记录压力、来源、证据和禁止项，不结算库存、价格、交易、消耗或奖励。
          </p>
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          <div
            className="rounded-sm border border-rg-gold-400/25 bg-rg-gold-500/10 p-3"
            data-testid="v120-survival-b3-panel"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-rg-gold-100">b3 炼养用准备</p>
                <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/58">
                  只整理残方不完整、材料验证、维护周期和失败风险；不消耗材料、不解锁蛊方、不判成败。
                </p>
              </div>
              <span className="shrink-0 rounded-sm border border-rg-gold-300/25 px-2 py-1 text-[10px] text-rg-gold-100/75">
                D-123
              </span>
            </div>
            <button
              type="button"
              className="mt-3 rounded-sm border border-rg-gold-300/35 px-3 py-1.5 text-[11px] font-semibold text-rg-gold-100 transition hover:bg-rg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-45"
              data-testid="v120-survival-b3-refinement-action"
              disabled={!canRunRefinement}
              onClick={runRefinementBoundary}
            >
              试读边界
            </button>
            <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/50">
              {canRunRefinement ? '可根据补给/喂养前置进入试读。' : '需先完成补给/喂养缺口前置。'}
            </p>
          </div>

          <div
            className="rounded-sm border border-rg-gold-400/25 bg-rg-gold-500/10 p-3"
            data-testid="v120-survival-b4-panel"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-rg-gold-100">b4 交易窗口边界</p>
                <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/58">
                  只做询价、担保、公开理由和风险窗口；不成交、不写价格、不开放库存、不加入商队。
                </p>
              </div>
              <span className="shrink-0 rounded-sm border border-rg-gold-300/25 px-2 py-1 text-[10px] text-rg-gold-100/75">
                D-126
              </span>
            </div>
            <button
              type="button"
              className="mt-3 rounded-sm border border-rg-gold-300/35 px-3 py-1.5 text-[11px] font-semibold text-rg-gold-100 transition hover:bg-rg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-45"
              data-testid="v120-survival-b4-market-action"
              disabled={!canRunMarket}
              onClick={runMarketWindow}
            >
              试探窗口
            </button>
            <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/50">
              {canRunMarket ? '可在残方边界后试探窗口。' : '需先完成炼养用边界试读。'}
            </p>
          </div>
        </div>

        {actionMessage && (
          <div
            className="rounded-sm border border-rg-jade-400/20 bg-rg-jade-500/10 p-3 text-[11px] leading-relaxed text-rg-jade-100/78"
            data-testid="v120-survival-action-result"
          >
            {actionMessage}
          </div>
        )}

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v120-survival-route-context">
          <p className="text-xs font-semibold text-rg-paper-100">路线承接</p>
          <p className="mt-1 text-[10px] text-rg-paper-200/55">{projection.routeStatusLabel}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-rg-paper-200/65">{projection.routeSummary}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {projection.pressureItems.map(item => (
            <div
              key={item.id}
              className={`rounded-sm border p-3 ${itemClass[item.status]}`}
              data-testid={`v120-survival-pressure-${item.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold">{item.title}</p>
                <span className="shrink-0 text-[10px] opacity-70">{statusLabel(item.status)}</span>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed opacity-80">{item.summary}</p>
              <p className="mt-2 text-[10px] leading-relaxed opacity-70">{item.nextStep}</p>
              {item.evidenceRefs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.evidenceRefs.slice(0, 4).map(ref => (
                    <span key={ref} className="rounded-sm border border-rg-ink-100/10 px-1.5 py-0.5 text-[9px] opacity-65">{ref}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v120-survival-boundaries">
          <p className="text-xs font-semibold text-rg-paper-100">边界</p>
          <div className="mt-2 grid gap-1.5">
            {projection.boundaryLines.map(line => (
              <p key={line} className="text-[10px] leading-relaxed text-rg-paper-200/58">{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3" data-testid="v120-survival-source-refs">
          <p className="text-xs font-semibold text-rg-paper-100">来源</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {projection.visibleSourceRefs.slice(0, 10).map(ref => (
              <span key={ref} className="rounded-sm border border-rg-ink-300/15 px-2 py-1 text-[10px] text-rg-paper-200/55">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
