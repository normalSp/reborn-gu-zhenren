import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useStore } from '../../store';
import {
  buildActivityPanelState,
  type ActivityActionCard,
  type ActivityActionKind,
} from '../../engine/activity-panel';
import { deriveActivityAvailabilityContext } from '../../engine/activity-availability';
import type { FieldActionKind } from '../../engine/field-action';
import type { MeditationContext } from '../../engine/primeval-meditation';

const PERIOD_LABEL: Record<string, string> = {
  morning: '早晨',
  noon: '午时',
  evening: '黄昏',
  night: '夜晚',
};

function cardTone(card: ActivityActionCard, forcedBlocked = false): string {
  if (forcedBlocked || card.status === 'blocked') return 'border-rg-ink-300/12 text-rg-paper-200/38 bg-rg-ink-900/25';
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

function toMeditationContext(kind: string): MeditationContext {
  if (kind === 'aperture') return 'aperture';
  if (kind === 'caravan') return 'caravan';
  if (kind === 'safe') return 'safe';
  return 'field';
}

export function ActionPanel() {
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
    currentChapterId: s.currentChapterId,
    currentNarrative: s.currentNarrative,
    activeDialogue: s.activeDialogue,
    duelState: s.duelState,
    squadCombatState: s.squadCombatState,
  })));
  const meditateWithPrimevalStone = useStore((s: any) => s.meditateWithPrimevalStone);
  const meditateWithImmortalStone = useStore((s: any) => s.meditateWithImmortalStone);
  const practiceCultivation = useStore((s: any) => s.practiceCultivation);
  const attemptBreakthrough = useStore((s: any) => s.attemptBreakthrough);
  const performFieldAction = useStore((s: any) => s.performFieldAction);

  const availability = useMemo(
    () => deriveActivityAvailabilityContext(storeSnapshot),
    [storeSnapshot],
  );
  const panelState = useMemo(
    () => buildActivityPanelState(storeSnapshot, availability.locationContext),
    [storeSnapshot, availability.locationContext],
  );
  const grouped = groupCards(panelState.cards);
  const essencePct = Math.max(0, Math.min(100, (panelState.essenceCurrent / panelState.essenceMax) * 100));
  const progressPct = Math.max(0, Math.min(100, panelState.cultivationProgress));

  const execute = (kind: ActivityActionKind) => {
    if (availability.sceneLocked) {
      setLastResult({ success: false, message: availability.lockReason || '当前场景锁定，不能推进行动。' });
      return;
    }
    if (['scout', 'gather', 'trap_check', 'escape_support'].includes(kind) && !availability.fieldActionsAllowed) {
      setLastResult({ success: false, message: availability.fieldActionReason || '当前地点不能执行野外行动。' });
      return;
    }

    let result: any;
    if (kind === 'meditate') {
      const meditationContext = toMeditationContext(availability.locationContext);
      result = panelState.isImmortal
        ? meditateWithImmortalStone?.(1, meditationContext)
        : meditateWithPrimevalStone?.(1, meditationContext);
    } else if (kind === 'cultivate') {
      result = practiceCultivation?.();
    } else if (kind === 'breakthrough') {
      result = attemptBreakthrough?.();
    } else {
      result = performFieldAction?.(kind as FieldActionKind, availability.locationContext);
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
              {PERIOD_LABEL[panelState.period] || panelState.period} · 推进一时段后 AP 回满
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
        <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/42">{availability.apPolicyNote}</p>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-rg-paper-100">当前场景</h3>
          <span className="text-[10px] text-rg-paper-200/38">由剧情、地点与境界自动判定</span>
        </div>
        <div className="rounded-md border border-rg-ink-300/14 bg-rg-ink-900/28 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-rg-gold">{availability.locationLabel}</span>
            <span className="rounded-sm border border-rg-gold/25 px-2 py-0.5 text-[10px] text-rg-gold/80">
              {availability.sceneLocked ? '场景锁定' : '可行动'}
            </span>
          </div>
          {availability.lockReason && (
            <p className="mt-2 text-[11px] leading-relaxed text-rg-blood-400/85">{availability.lockReason}</p>
          )}
          {!availability.fieldActionsAllowed && availability.fieldActionReason && (
            <p className="mt-2 text-[11px] leading-relaxed text-rg-paper-200/50">{availability.fieldActionReason}</p>
          )}
        </div>
      </section>

      <ActionSection
        title="调息与修行"
        note="修行/突破的详细状态建议在空窍页查看；本面板保留快捷入口。"
        cards={[grouped.meditate, grouped.cultivate].filter(Boolean) as ActivityActionCard[]}
        onExecute={execute}
        forceBlocked={availability.sceneLocked}
        blockedReason={availability.lockReason}
      />

      <section className="rounded-md border border-rg-ink-300/12 bg-rg-ink-900/25 p-3">
        <div className="flex items-center justify-between text-[11px] text-rg-paper-200/55">
          <span>修行进度</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-rg-ink-800">
          <div className="h-full rounded-full bg-rg-gold/80" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-2 text-[10px] text-rg-paper-200/42">
          当前只显示小境界推进准备；昼夜修行差异、升仙失败与复杂灾劫已并入 v0.8 深系统。
        </p>
      </section>

      <ActionSection
        title="突破"
        cards={grouped.breakthrough ? [grouped.breakthrough] : []}
        onExecute={execute}
        forceBlocked={availability.sceneLocked}
        blockedReason={availability.lockReason}
      />
      <ActionSection
        title="野外行动"
        note="普通狩猎、采集、侦察先走野外行动；敌对蛊师、蛊兽、伏击或剧情白名单才进入战斗。"
        cards={grouped.field}
        onExecute={execute}
        forceBlocked={availability.sceneLocked || !availability.fieldActionsAllowed}
        blockedReason={availability.lockReason || availability.fieldActionReason}
      />

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
  note,
  cards,
  onExecute,
  forceBlocked = false,
  blockedReason,
}: {
  title: string;
  note?: string;
  cards: ActivityActionCard[];
  onExecute: (kind: ActivityActionKind) => void;
  forceBlocked?: boolean;
  blockedReason?: string;
}) {
  if (!cards.length) return null;
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-xs font-semibold text-rg-paper-100">{title}</h3>
        {note && <p className="mt-1 text-[10px] text-rg-paper-200/42">{note}</p>}
      </div>
      {cards.map(card => {
        const blocked = forceBlocked || card.status === 'blocked';
        return (
          <button
            key={card.id}
            disabled={blocked}
            onClick={() => onExecute(card.id)}
            className={`w-full rounded-md border p-3 text-left transition-micro ${cardTone(card, forceBlocked)} ${
              blocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-rg-gold/45 hover:bg-rg-gold/10'
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
            {(blockedReason || card.disabledReason) && (
              <div className="mt-2 text-[10px] text-rg-blood-400/80">{blockedReason || card.disabledReason}</div>
            )}
          </button>
        );
      })}
    </section>
  );
}
