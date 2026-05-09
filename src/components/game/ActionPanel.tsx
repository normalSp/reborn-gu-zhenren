import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useStore } from '../../store';
import {
  buildActivityPanelState,
  type ActivityActionCard,
  type ActivityActionKind,
  type ActivityLocationContext,
} from '../../engine/activity-panel';
import type { FieldActionKind } from '../../engine/field-action';

const LOCATION_OPTIONS: Array<{ id: ActivityLocationContext; label: string; note: string }> = [
  { id: 'safe', label: '安全地', note: '城镇/洞府' },
  { id: 'caravan', label: '商路', note: '有干扰' },
  { id: 'field', label: '野外', note: '常规风险' },
  { id: 'wild', label: '险地', note: '高风险' },
  { id: 'aperture', label: '仙窍', note: '蛊仙内景' },
];

const PERIOD_LABEL: Record<string, string> = {
  morning: '晨',
  noon: '午',
  evening: '暮',
  night: '夜',
};

function cardTone(card: ActivityActionCard): string {
  if (card.status === 'blocked') return 'border-rg-ink-300/12 text-rg-paper-200/38 bg-rg-ink-900/25';
  if (card.status === 'risky') return 'border-rg-blood-400/28 text-rg-blood-400 bg-rg-blood-400/5';
  return 'border-rg-gold/24 text-rg-paper-200/78 bg-rg-ink-900/30';
}

function pct(value?: number): string {
  if (value === undefined) return '--';
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function groupCards(cards: ActivityActionCard[]) {
  return {
    meditate: cards.find(card => card.id === 'meditate'),
    cultivate: cards.find(card => card.id === 'cultivate'),
    breakthrough: cards.find(card => card.id === 'breakthrough'),
    field: cards.filter(card => ['scout', 'gather', 'trap_check', 'escape_support'].includes(card.id)),
  };
}

export function ActionPanel() {
  const [locationContext, setLocationContext] = useState<ActivityLocationContext>('field');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const storeSnapshot = useStore(useShallow((s: any) => ({
    profile: s.profile,
    attributes: s.attributes,
    vitals: s.vitals,
    currency: s.currency,
    immortalCurrency: s.immortalCurrency,
    gameTime: s.gameTime,
    flags: s.flags,
    turn: s.turn,
    selectedTalents: s.selectedTalents,
    materialBag: s.materialBag,
    aperture: s.aperture,
  })));
  const meditateWithPrimevalStone = useStore((s: any) => s.meditateWithPrimevalStone);
  const meditateWithImmortalStone = useStore((s: any) => s.meditateWithImmortalStone);
  const practiceCultivation = useStore((s: any) => s.practiceCultivation);
  const attemptBreakthrough = useStore((s: any) => s.attemptBreakthrough);
  const performFieldAction = useStore((s: any) => s.performFieldAction);

  const panelState = useMemo(
    () => buildActivityPanelState(storeSnapshot, locationContext),
    [storeSnapshot, locationContext],
  );
  const grouped = groupCards(panelState.cards);
  const essencePct = Math.max(0, Math.min(100, (panelState.essenceCurrent / panelState.essenceMax) * 100));
  const progressPct = Math.max(0, Math.min(100, panelState.cultivationProgress));

  const execute = (kind: ActivityActionKind) => {
    let result: any;
    if (kind === 'meditate') {
      const meditationContext = locationContext === 'wild' ? 'field' : locationContext;
      result = panelState.isImmortal
        ? meditateWithImmortalStone?.(1, meditationContext)
        : meditateWithPrimevalStone?.(1, meditationContext);
    } else if (kind === 'cultivate') {
      result = practiceCultivation?.();
    } else if (kind === 'breakthrough') {
      result = attemptBreakthrough?.();
    } else {
      result = performFieldAction?.(kind as FieldActionKind, locationContext);
    }
    setLastResult({
      success: Boolean(result?.success),
      message: result?.message || '行动已提交。',
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-panel">
      <section className="rounded-md border border-rg-gold/18 bg-rg-ink-900/35 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-rg-gold">行动余裕</div>
            <div className="mt-1 text-[11px] text-rg-paper-200/45">
              {PERIOD_LABEL[panelState.period] || panelState.period}时段 · 每次推进后回满 AP
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-display text-rg-paper-100">{panelState.ap}/{panelState.maxAp}</div>
            <div className="text-[10px] text-rg-paper-200/45">AP</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-rg-paper-200/55">
            <span>{panelState.essenceLabel}</span>
            <span>{panelState.essenceCurrent}/{panelState.essenceMax}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-rg-ink-800">
            <div className="h-full rounded-full bg-rg-jade-400/80" style={{ width: `${essencePct}%` }} />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-rg-paper-100">行动环境</h3>
          <span className="text-[10px] text-rg-paper-200/38">影响调息与野外风险</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {LOCATION_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setLocationContext(option.id)}
              className={`rounded-sm border px-1.5 py-1 text-[10px] transition-micro ${
                locationContext === option.id
                  ? 'border-rg-gold/45 bg-rg-gold/12 text-rg-gold'
                  : 'border-rg-ink-300/15 text-rg-paper-200/45 hover:border-rg-gold/25 hover:text-rg-paper-100'
              }`}
              title={option.note}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <ActionSection title="调息与修行" cards={[grouped.meditate, grouped.cultivate].filter(Boolean) as ActivityActionCard[]} onExecute={execute} />

      <section className="rounded-md border border-rg-ink-300/12 bg-rg-ink-900/25 p-3">
        <div className="flex items-center justify-between text-[11px] text-rg-paper-200/55">
          <span>修行进度</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-rg-ink-800">
          <div className="h-full rounded-full bg-rg-gold/80" style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      <ActionSection title="突破" cards={grouped.breakthrough ? [grouped.breakthrough] : []} onExecute={execute} />
      <ActionSection title="野外行动" cards={grouped.field} onExecute={execute} />

      {lastResult && (
        <div className={`rounded-md border px-3 py-2 text-xs leading-relaxed ${
          lastResult.success
            ? 'border-rg-jade-400/25 bg-rg-jade-400/10 text-rg-jade-400'
            : 'border-rg-blood-400/25 bg-rg-blood-400/10 text-rg-blood-400'
        }`}>
          {lastResult.message}
        </div>
      )}
    </div>
  );
}

function ActionSection({
  title,
  cards,
  onExecute,
}: {
  title: string;
  cards: ActivityActionCard[];
  onExecute: (kind: ActivityActionKind) => void;
}) {
  if (!cards.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold text-rg-paper-100">{title}</h3>
      {cards.map(card => (
        <button
          key={card.id}
          disabled={card.status === 'blocked'}
          onClick={() => onExecute(card.id)}
          className={`w-full rounded-md border p-3 text-left transition-micro ${cardTone(card)} ${
            card.status === 'blocked' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-rg-gold/45 hover:bg-rg-gold/10'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{card.title}</div>
              <div className="mt-0.5 text-[11px] text-rg-paper-200/48">{card.subtitle}</div>
            </div>
            <span className="shrink-0 rounded-sm border border-rg-ink-300/18 px-1.5 py-0.5 text-[10px] text-rg-paper-200/45">
              AP {card.apCost}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-rg-paper-200/48">
            {card.expectedGain && <span>{card.expectedGain}</span>}
            {card.costSummary && <span>{card.costSummary}</span>}
            {card.successRate !== undefined && <span>成功 {pct(card.successRate)}</span>}
            {card.riskChance !== undefined && <span>风险 {pct(card.riskChance)}</span>}
          </div>
          {card.modifierLabels.length > 0 && (
            <div className="mt-2 line-clamp-2 text-[10px] text-rg-gold/55">
              修正：{card.modifierLabels.slice(0, 3).join(' / ')}
            </div>
          )}
          {card.disabledReason && (
            <div className="mt-2 text-[10px] text-rg-blood-400/80">{card.disabledReason}</div>
          )}
        </button>
      ))}
    </section>
  );
}
