import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  const reducedMotion = useReducedMotion();
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
    cultivationState: s.cultivationState,
    heavenlyLand: s.heavenlyLand,
    sceneSessionState: s.sceneSessionState,
  })));
  const meditateWithPrimevalStone = useStore((s: any) => s.meditateWithPrimevalStone);
  const meditateWithImmortalStone = useStore((s: any) => s.meditateWithImmortalStone);
  const practiceCultivation = useStore((s: any) => s.practiceCultivation);
  const attemptBreakthrough = useStore((s: any) => s.attemptBreakthrough);
  const previewCultivationDeepening = useStore((s: any) => s.previewCultivationDeepening);
  const attemptAscension = useStore((s: any) => s.attemptAscension);
  const stageCalamityScene = useStore((s: any) => s.stageCalamityScene);
  const resolveApertureCalamity = useStore((s: any) => s.resolveApertureCalamity);
  const performFieldAction = useStore((s: any) => s.performFieldAction);
  const prepareNarrativeAdvanceIntent = useStore((s: any) => s.prepareNarrativeAdvanceIntent);
  const resetSceneActionBudget = useStore((s: any) => s.resetSceneActionBudget);

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
  const cultivationPreview = useMemo(
    () => previewCultivationDeepening?.(availability.locationContext) || null,
    [previewCultivationDeepening, availability.locationContext, storeSnapshot],
  );
  const cultivationState = storeSnapshot.cultivationState;
  const lastTrace = Array.isArray(cultivationState?.lastResolution) ? cultivationState.lastResolution : [];
  const sceneSession = storeSnapshot.sceneSessionState;
  const localLedger = Array.isArray(sceneSession?.localActionLedger) ? sceneSession.localActionLedger.slice(-4) : [];
  const realmGrand = Number(storeSnapshot.profile?.realm?.grand || 1);
  const isMortalCultivator = realmGrand < 5;
  const isAscensionStage = realmGrand === 5;
  const isImmortalCultivator = realmGrand >= 6;
  const cultivationModeLabel = isImmortalCultivator ? '仙窍修持' : isAscensionStage ? '升仙准备' : '凡窍修行';

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

  const runAscension = () => {
    const result = attemptAscension?.();
    setLastResult({
      success: Boolean(result?.success),
      message: result?.message || '升仙尝试已提交。',
    });
  };

  const runCalamity = () => {
    const result = stageCalamityScene?.() || resolveApertureCalamity?.();
    setLastResult({
      success: Boolean(result?.success),
      message: result?.message || '灾劫预兆已提交。',
    });
  };

  const advanceScene = () => {
    const intent = prepareNarrativeAdvanceIntent?.('player_advance');
    setLastResult({
      success: true,
      message: intent?.summary || '已整理本轮行动账本，下一轮剧情会承接这些本地结算事实。',
    });
  };

  const resetScene = () => {
    resetSceneActionBudget?.('narrative_scene');
    setLastResult({ success: true, message: '当前场景行动预算已按剧情时段重置。' });
  };

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-3 space-y-4 font-panel sm:p-4" data-testid="action-panel">
      <section className="rg-explain-card p-3">
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
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={advanceScene}
            className="rg-toolbar-btn rg-focus-ring px-3 py-1.5 text-xs"
            data-testid="prepare-narrative-advance"
            data-audio-confirm="true"
          >
            推进剧情 / 结束时段
          </button>
          <button
            type="button"
            onClick={resetScene}
            className="rg-toolbar-btn rg-focus-ring px-3 py-1.5 text-xs text-rg-paper-200/60"
            data-testid="reset-scene-budget"
          >
            重置场景 AP
          </button>
        </div>
        {localLedger.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-rg-ink-300/10 pt-2">
            <div className="text-[10px] tracking-[0.12em] text-rg-paper-200/42">本轮行动账本</div>
            {localLedger.map((entry: any) => (
              <div key={entry.id} className="text-[10px] leading-relaxed text-rg-paper-200/55">
                <span className="text-rg-gold">{entry.actionType}</span> · {entry.summary}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-rg-paper-100">当前场景</h3>
          <span className="text-[10px] text-rg-paper-200/38">由剧情、地点与境界自动判定</span>
        </div>
        <div className="rg-explain-card p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-rg-gold">{availability.locationLabel}</span>
            <span className={`rg-chip ${availability.sceneLocked ? 'rg-chip--blood' : 'rg-chip--jade'}`}>
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

      <section className="rg-explain-card p-3" data-testid="cultivation-moved-to-aperture-note">
        <div className="text-xs font-semibold text-rg-gold">调息与修行已移入空窍/仙窍</div>
        <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/52">
          本面板只处理当前剧情场景允许的行动；修行、突破、升仙和灾劫请在空窍/仙窍面板中执行，结果会写入场景账本并在推进剧情时承接。
        </p>
      </section>
      <ActionSection
        title="野外行动"
        note="普通狩猎、采集、侦察先走野外行动；敌对蛊师、蛊兽、伏击或剧情白名单才进入战斗。"
        cards={availability.fieldActionsAllowed && !availability.sceneLocked ? grouped.field : []}
        onExecute={execute}
      />
      {(!availability.fieldActionsAllowed || availability.sceneLocked) && (
        <section className="rg-explain-card p-3" data-testid="field-actions-hidden-reason">
          <div className="text-xs font-semibold text-rg-paper-100">当前不显示野外行动</div>
          <p className="mt-1 text-[11px] leading-relaxed text-rg-paper-200/50">
            {availability.lockReason || availability.fieldActionReason || '当前剧情场景没有开放野外行动；等文本推进到山林、荒野、商路或伏击场景后再出现。'}
          </p>
        </section>
      )}

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
            className={`rg-action-card rg-focus-ring w-full p-3 text-left ${cardTone(card, forceBlocked)} ${
              blocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-rg-gold/45 hover:bg-rg-gold/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{card.title}</div>
                <div className="mt-0.5 text-[11px] text-rg-paper-200/48">{card.subtitle}</div>
              </div>
              <span className="rg-chip rg-chip--muted shrink-0">
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
