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
import type { QingmaoRegionActionEntry } from '../../engine/v010-qingmao-region-engine';
import type { QingmaoResourceLoopEntry } from '../../engine/v010-qingmao-resource-loop';
import {
  buildQingmaoCombatEventCandidate,
  listQingmaoCombatTemplateReadiness,
  type QingmaoCombatTemplateReadiness,
} from '../../engine/v010-qingmao-combat-pack';
import {
  buildQingmaoSceneVariantViews,
  type QingmaoSceneVariantView,
} from '../../engine/v010-qingmao-scene-variants';
import {
  listV017CombatPreparationViews,
  type V017CombatPreparationView,
} from '../../engine/v017-combat-deepening';
import { V017CombatBoundaryPanel } from './V017CombatBoundaryPanel';

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

const QINGMAO_STATUS_LABEL: Record<QingmaoRegionActionEntry['status'], string> = {
  available: '可出发',
  blocked: '阻断',
  identity_blocked: '身份不符',
  ap_blocked: 'AP不足',
  persistent_state_blocked: '需区域状态',
  rumor_only: '传闻',
};

const QINGMAO_RESOURCE_STATUS_LABEL: Record<QingmaoResourceLoopEntry['status'], string> = {
  available: '可结算',
  ap_blocked: 'AP不足',
  scene_used: '本场景已结算',
  gap_only: '缺口展示',
  blocked: '阻断',
};

function qingmaoEntryTone(entry: QingmaoRegionActionEntry, forcedBlocked = false): string {
  if (forcedBlocked || !entry.canDepart) return 'border-rg-ink-300/12 bg-rg-ink-900/25 text-rg-paper-200/45';
  if (entry.risk === 'high') return 'border-rg-blood-400/28 bg-rg-blood-400/5 text-rg-blood-400';
  if (entry.risk === 'medium') return 'border-rg-gold/24 bg-rg-gold/8 text-rg-paper-200/78';
  return 'border-rg-jade-400/22 bg-rg-jade-400/6 text-rg-paper-200/78';
}

function qingmaoResourceTone(entry: QingmaoResourceLoopEntry, forcedBlocked = false): string {
  if (forcedBlocked || !entry.canResolve) return 'border-rg-ink-300/12 bg-rg-ink-900/25 text-rg-paper-200/45';
  if (entry.risk === 'high') return 'border-rg-blood-400/28 bg-rg-blood-400/5 text-rg-blood-400';
  if (entry.risk === 'medium') return 'border-rg-gold/24 bg-rg-gold/8 text-rg-paper-200/78';
  return 'border-rg-jade-400/22 bg-rg-jade-400/6 text-rg-paper-200/78';
}

function qingmaoSceneVariantTone(view: QingmaoSceneVariantView): string {
  if (view.status === 'playable') return 'border-rg-jade-400/24 bg-rg-jade-400/6 text-rg-paper-200/78';
  if (view.status === 'readiness') return 'border-rg-gold/24 bg-rg-gold/8 text-rg-paper-200/74';
  if (view.status === 'blocked') return 'border-rg-blood-400/22 bg-rg-blood-400/5 text-rg-blood-400';
  return 'border-rg-ink-300/14 bg-rg-ink-900/28 text-rg-paper-200/58';
}

function riskLabel(risk: QingmaoRegionActionEntry['risk']): string {
  if (risk === 'high') return '高风险';
  if (risk === 'medium') return '中风险';
  return '低风险';
}

function requirementSummary(lines: QingmaoResourceLoopEntry['feedingRequirements'], empty = '暂无缺口'): string {
  const missing = lines.filter(line => line.missing > 0);
  if (missing.length > 0) {
    return missing.slice(0, 3).map(line => `${line.materialName}缺${line.missing}`).join(' / ');
  }
  const owned = lines.filter(line => line.owned > 0);
  if (owned.length > 0) {
    return owned.slice(0, 3).map(line => `${line.materialName}${line.owned}`).join(' / ');
  }
  return empty;
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
    inventory: s.inventory,
    materialBag: s.materialBag,
    feedingCredits: s.feedingCredits,
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
  const listQingmaoRegionActionEntriesAction = useStore((s: any) => s.listQingmaoRegionActionEntriesAction);
  const resolveQingmaoRegionActionAction = useStore((s: any) => s.resolveQingmaoRegionActionAction);
  const listQingmaoResourceLoopEntriesAction = useStore((s: any) => s.listQingmaoResourceLoopEntriesAction);
  const resolveQingmaoResourceLoopActionAction = useStore((s: any) => s.resolveQingmaoResourceLoopActionAction);
  const registerQingmaoCombatCandidateAction = useStore((s: any) => s.registerQingmaoCombatCandidateAction);
  const registerV017CombatCandidateAction = useStore((s: any) => s.registerV017CombatCandidateAction);

  const availability = useMemo(
    () => deriveActivityAvailabilityContext(storeSnapshot),
    [storeSnapshot],
  );
  const panelState = useMemo(
    () => buildActivityPanelState(storeSnapshot, availability.locationContext),
    [storeSnapshot, availability.locationContext],
  );
  const qingmaoRegionEntries: QingmaoRegionActionEntry[] = useMemo(
    () => listQingmaoRegionActionEntriesAction?.() || [],
    [listQingmaoRegionActionEntriesAction, storeSnapshot],
  );
  const qingmaoResourceEntries: QingmaoResourceLoopEntry[] = useMemo(
    () => listQingmaoResourceLoopEntriesAction?.() || [],
    [listQingmaoResourceLoopEntriesAction, storeSnapshot],
  );
  const qingmaoCombatReadiness: Array<QingmaoCombatTemplateReadiness & { validationLabel: string }> = useMemo(
    () => listQingmaoCombatTemplateReadiness().map(item => {
      const built = buildQingmaoCombatEventCandidate(item.template.id, storeSnapshot);
      const blockers = built.blockers.length;
      const warnings = built.warnings.length;
      return {
        ...item,
        validationLabel: blockers > 0 ? `${blockers} 阻断` : warnings > 0 ? `${warnings} 提醒` : '可校验',
      };
    }),
    [storeSnapshot],
  );
  const v017CombatPreparation = useMemo(
    () => listV017CombatPreparationViews(storeSnapshot),
    [storeSnapshot],
  );
  const qingmaoSceneVariants = useMemo(
    () => buildQingmaoSceneVariantViews({
      regionEntries: qingmaoRegionEntries,
      resourceEntries: qingmaoResourceEntries,
      combatReadiness: qingmaoCombatReadiness,
    }),
    [qingmaoRegionEntries, qingmaoResourceEntries, qingmaoCombatReadiness],
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

  const runQingmaoRegionAction = (entry: QingmaoRegionActionEntry) => {
    if (availability.sceneLocked) {
      setLastResult({ success: false, message: availability.lockReason || '当前场景锁定，不能推进行动。' });
      return;
    }
    const result = resolveQingmaoRegionActionAction?.({
      sourceId: entry.source.id,
      actionSlotId: entry.actionSlot.id,
      title: entry.candidate.title,
      summary: entry.candidate.summary,
      risk: entry.risk,
      apCost: entry.apCost,
      tags: entry.candidate.tags,
      metadata: entry.candidate.metadata,
    });
    setLastResult({
      success: Boolean(result?.success),
      message: result?.message || '青茅区域行动已提交。',
    });
  };

  const registerQingmaoCombatCandidate = (templateId: string) => {
    const result = registerQingmaoCombatCandidateAction?.(templateId);
    setLastResult({
      success: Boolean(result?.success),
      message: result?.message || '青茅凡战候选登记失败。',
    });
  };

  const registerV017CombatCandidate = (ruleId: string) => {
    const result = registerV017CombatCandidateAction?.(ruleId);
    setLastResult({
      success: Boolean(result?.success),
      message: result?.message || 'v0.17 战斗候选登记失败。',
    });
  };

  const runQingmaoResourceLoopAction = (entry: QingmaoResourceLoopEntry) => {
    if (availability.sceneLocked) {
      setLastResult({ success: false, message: availability.lockReason || '当前场景锁定，不能推进行动。' });
      return;
    }
    const result = resolveQingmaoResourceLoopActionAction?.(entry.action.id);
    setLastResult({
      success: Boolean(result?.success),
      message: result?.message || '青茅炼养用资源行动已提交。',
    });
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
      <QingmaoSceneVariantSection variants={qingmaoSceneVariants} />
      <QingmaoRegionSection
        entries={qingmaoRegionEntries}
        sceneLocked={availability.sceneLocked}
        lockReason={availability.lockReason}
        onDepart={runQingmaoRegionAction}
      />
      <QingmaoResourceLoopSection
        entries={qingmaoResourceEntries}
        sceneLocked={availability.sceneLocked}
        lockReason={availability.lockReason}
        onResolve={runQingmaoResourceLoopAction}
      />
      <QingmaoCombatReadinessSection
        readiness={qingmaoCombatReadiness}
        onRegister={registerQingmaoCombatCandidate}
      />
      <V017CombatPreparationSection
        views={v017CombatPreparation}
        onRegister={registerV017CombatCandidate}
      />
      <V017CombatBoundaryPanel compact />
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

function QingmaoSceneVariantSection({ variants }: { variants: QingmaoSceneVariantView[] }) {
  if (!variants.length) return null;
  return (
    <section className="space-y-2" data-testid="qingmao-scene-variant-section">
      <div>
        <h3 className="text-xs font-semibold text-rg-paper-100">青茅场景变体</h3>
        <p className="mt-1 text-[10px] text-rg-paper-200/42">b4 只做可读性、构图和短录屏规划；不新增存档字段或奖励。</p>
      </div>
      <div className="grid gap-2">
        {variants.slice(0, 3).map(view => (
          <div
            key={view.id}
            className={`grid grid-cols-[64px_1fr] gap-3 rounded-md border p-2 ${qingmaoSceneVariantTone(view)}`}
            data-testid={`qingmao-scene-variant-${view.id}`}
          >
            <div className="relative h-16 overflow-hidden rounded-[6px] border border-rg-ink-300/14 bg-rg-ink-900/40">
              {view.asset?.src ? (
                <img
                  src={view.asset.src}
                  alt={view.asset.label}
                  className="h-full w-full object-cover opacity-90"
                  data-testid={`qingmao-scene-variant-asset-${view.id}`}
                  onError={(event) => {
                    event.currentTarget.dataset.missing = 'true';
                    event.currentTarget.alt = view.asset?.fallbackText || `${view.displayName}候选图缺失`;
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-rg-paper-200/38">无图</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{view.displayName}</div>
                  <div className="mt-0.5 truncate text-[10px] text-rg-paper-200/45">{view.subtitle}</div>
                </div>
                <span className={`rg-chip shrink-0 ${view.status === 'playable' ? 'rg-chip--jade' : view.status === 'readiness' ? 'rg-chip--gold' : 'rg-chip--muted'}`}>
                  {view.statusLabel}
                </span>
              </div>
              <div className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-rg-paper-200/56">{view.primaryPlayerQuestion}</div>
              <div className="mt-1 line-clamp-1 text-[10px] text-rg-gold/55">构图：{view.compositionLine}</div>
              <div className="mt-1 line-clamp-1 text-[10px] text-rg-paper-200/42">录屏：{view.recordingLine}</div>
              {view.linkedRuntimeLabels.length > 0 && (
                <div className="mt-1 line-clamp-1 text-[10px] text-rg-jade-300/55">
                  关联：{view.linkedRuntimeLabels.slice(0, 3).join(' / ')}
                </div>
              )}
              <div className="mt-1 line-clamp-1 text-[10px] text-rg-blood-400/55">
                禁止暗示：{view.forbiddenSummary}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QingmaoResourceLoopSection({
  entries,
  sceneLocked,
  lockReason,
  onResolve,
}: {
  entries: QingmaoResourceLoopEntry[];
  sceneLocked: boolean;
  lockReason?: string;
  onResolve: (entry: QingmaoResourceLoopEntry) => void;
}) {
  if (!entries.length) return null;
  return (
    <section className="space-y-2" data-testid="qingmao-resource-loop-section">
      <div>
        <h3 className="text-xs font-semibold text-rg-paper-100">青茅炼养用资源</h3>
        <p className="mt-1 text-[10px] text-rg-paper-200/42">低阶食料与蛊材只走本地结算；白玉蛊先显示缺口。</p>
      </div>
      <div className="grid gap-2">
        {entries.slice(0, 4).map(entry => {
          const blocked = sceneLocked || !entry.canResolve;
          const blockers = sceneLocked && lockReason ? [lockReason, ...entry.blockers] : entry.blockers;
          const rewards = entry.rewardPreview.length > 0
            ? entry.rewardPreview.map(item => `${item.materialName} x${item.quantity}`).join(' / ')
            : '无材料发放';
          const missing = requirementSummary([
            ...entry.feedingRequirements,
            ...entry.fragmentRequirements,
            ...entry.gapRequirements,
          ], '只核对缺口');
          return (
            <button
              type="button"
              key={entry.id}
              disabled={blocked}
              onClick={() => onResolve(entry)}
              className={`rg-action-card rg-focus-ring w-full p-3 text-left ${qingmaoResourceTone(entry, sceneLocked)} ${
                blocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-rg-gold/45 hover:bg-rg-gold/10'
              }`}
              data-testid={`qingmao-resource-loop-${entry.action.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{entry.action.displayName}</div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/48">
                    {entry.action.sourceLabel} · {entry.action.targetGu}
                  </div>
                </div>
                <span className={`rg-chip shrink-0 ${entry.canResolve ? 'rg-chip--jade' : 'rg-chip--muted'}`}>
                  {QINGMAO_RESOURCE_STATUS_LABEL[entry.status]}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-rg-paper-200/48">
                <span>AP {entry.apCost}</span>
                <span>{riskLabel(entry.risk)}</span>
                <span>{rewards}</span>
                <span>{missing}</span>
              </div>
              {entry.action.notes.length > 0 && (
                <div className="mt-2 line-clamp-2 text-[10px] text-rg-gold/55">
                  {entry.action.notes.slice(0, 2).join(' / ')}
                </div>
              )}
              {blockers.length > 0 && (
                <div className="mt-2 line-clamp-2 text-[10px] text-rg-blood-400/80">
                  {blockers.slice(0, 2).join('；')}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function QingmaoCombatReadinessSection({
  readiness,
  onRegister,
}: {
  readiness: Array<QingmaoCombatTemplateReadiness & { validationLabel: string }>;
  onRegister: (templateId: string) => void;
}) {
  if (!readiness.length) return null;
  return (
    <section className="space-y-2" data-testid="qingmao-combat-readiness-section">
      <div>
        <h3 className="text-xs font-semibold text-rg-paper-100">青茅凡战候选</h3>
        <p className="mt-1 text-[10px] text-rg-paper-200/42">只读 readiness；奖励与胜负仍等待本地战斗入口。</p>
      </div>
      <div className="grid gap-2">
        {readiness.slice(0, 4).map(item => {
          const ready = item.status === 'ready_for_local_validation';
          return (
            <div
              key={item.template.id}
              className={`rounded-md border p-3 ${
                ready
                  ? 'border-rg-gold/18 bg-rg-ink-900/30 text-rg-paper-200/72'
                  : 'border-rg-ink-300/12 bg-rg-ink-900/20 text-rg-paper-200/45'
              }`}
              data-testid={`qingmao-combat-readiness-${item.template.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{item.template.displayName}</div>
                  <div className="mt-0.5 text-[11px] text-rg-paper-200/48">{item.template.notes}</div>
                </div>
                <span className={`rg-chip shrink-0 ${ready ? 'rg-chip--gold' : 'rg-chip--muted'}`}>
                  {ready ? '待验证' : '候选'}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-rg-paper-200/48">
                <span>{item.template.combatScale}</span>
                <span>{item.template.risk === 'high' ? '高风险' : item.template.risk === 'medium' ? '中风险' : '低风险'}</span>
                <span>{item.template.rewardPolicy}</span>
                <span>{item.validationLabel}</span>
              </div>
              <div className="mt-2 line-clamp-2 text-[10px] text-rg-gold/55">
                {item.recommendedGuNames.slice(0, 4).join(' / ')}
              </div>
              {(item.blockers.length > 0 || item.warnings.length > 0) && (
                <div className="mt-2 line-clamp-2 text-[10px] text-rg-blood-400/75">
                  {[...item.blockers, ...item.warnings].slice(0, 2).join('；')}
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => onRegister(item.template.id)}
                  className="rg-toolbar-btn rg-focus-ring px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                  data-testid={`qingmao-combat-register-${item.template.id}`}
                >
                  登记候选
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const V017_STATUS_LABEL: Record<V017CombatPreparationView['status'], string> = {
  ready_for_local_validation: '可登记',
  candidate_only: '候选',
  blocked: '阻断',
};

function v017CombatTone(view: V017CombatPreparationView): string {
  if (view.status === 'blocked') return 'border-rg-blood-400/20 bg-rg-blood-400/5 text-rg-blood-300';
  if (view.status === 'ready_for_local_validation') return 'border-rg-gold/22 bg-rg-ink-900/30 text-rg-paper-200/75';
  return 'border-rg-ink-300/12 bg-rg-ink-900/22 text-rg-paper-200/48';
}

function V017CombatPreparationSection({
  views,
  onRegister,
}: {
  views: V017CombatPreparationView[];
  onRegister: (ruleId: string) => void;
}) {
  if (!views.length) return null;
  const labelBlockedOutcome = (value: string): string => {
    const labels: Record<string, string> = {
      reward_grant: '奖励',
      gu_grant: '蛊虫发放',
      formal_currency_reward: '正式元石奖励',
      formal_extortion_profit: '正式勒索收益',
      formal_material_drop: '正式材料掉落',
      beast_loot: '兽材掉落',
      location_unlock: '地点解锁',
      faction_transfer: '阵营转移',
      npc_death: 'NPC 生死',
      hidden_fact_reveal: '隐藏事实',
      canon_rewrite: '改写正史',
      route_success: '路线成功',
      inheritance_unlock: '传承开放',
      treasure_grant: '宝物发放',
    };
    return labels[value] || value;
  };
  return (
    <section className="space-y-2" data-testid="v017-combat-preparation-section">
      <div>
        <h3 className="text-xs font-semibold text-rg-paper-100">v0.17 战斗准备</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/42">
          MiroFish 只提供候选材料；本地引擎只登记安全低阶战斗入口，胜负与回流仍由战斗棋盘结算。
        </p>
      </div>
      <div className="grid gap-2">
        {views.slice(0, 4).map(view => (
          <div
            key={view.id}
            className={`rounded-md border p-3 ${v017CombatTone(view)}`}
            data-testid={`v017-combat-preparation-${view.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{view.title}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/50">{view.summary}</div>
              </div>
              <span className={`rg-chip shrink-0 ${view.canRegister ? 'rg-chip--gold' : view.status === 'blocked' ? 'rg-chip--blood' : 'rg-chip--muted'}`}>
                {V017_STATUS_LABEL[view.status]}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-rg-paper-200/48">
              <span>{view.scale}</span>
              <span>{view.risk === 'high' ? '高风险' : view.risk === 'medium' ? '中风险' : '低风险'}</span>
              <span>{view.terrainLine}</span>
              <span>{view.validationLabel}</span>
            </div>
            <div className="mt-2 line-clamp-1 text-[10px] text-rg-gold/55">
              蛊虫：{view.recommendedGuLine}
            </div>
            <div className="mt-1 line-clamp-2 text-[10px] text-rg-jade-300/58">
              反制：{view.counterHints.slice(0, 2).join(' / ') || '等待反制样本'}
            </div>
            <div className="mt-1 line-clamp-2 text-[10px] text-rg-paper-200/42">
              小队：{view.tacticHints.slice(0, 2).join(' / ') || '等待小队样本'}
            </div>
            <div className="mt-1 line-clamp-1 text-[10px] text-rg-blood-400/58">
              禁止：{view.blockedOutcomes.slice(0, 5).map(labelBlockedOutcome).join(' / ')}
            </div>
            {(view.blockers.length > 0 || view.warnings.length > 0) && (
              <div className="mt-2 line-clamp-2 text-[10px] text-rg-blood-400/75">
                {[...view.blockers, ...view.warnings].slice(0, 2).join('；')}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={!view.canRegister}
                onClick={() => onRegister(view.id)}
                className="rg-toolbar-btn rg-focus-ring px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                data-testid={`v017-combat-register-${view.id}`}
              >
                登记候选
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QingmaoRegionSection({
  entries,
  sceneLocked,
  lockReason,
  onDepart,
}: {
  entries: QingmaoRegionActionEntry[];
  sceneLocked: boolean;
  lockReason?: string;
  onDepart: (entry: QingmaoRegionActionEntry) => void;
}) {
  if (!entries.length) return null;
  return (
    <section className="space-y-2" data-testid="qingmao-region-action-section">
      <div>
        <h3 className="text-xs font-semibold text-rg-paper-100">青茅山区域行动</h3>
        <p className="mt-1 text-[10px] text-rg-paper-200/42">三寨身份、线索来源和行动账本由本地引擎校验。</p>
      </div>
      {entries.slice(0, 4).map(entry => {
        const blocked = sceneLocked || !entry.canDepart;
        const blockers = sceneLocked && lockReason ? [lockReason, ...entry.blockers] : entry.blockers;
        return (
          <button
            type="button"
            key={entry.id}
            disabled={blocked}
            onClick={() => onDepart(entry)}
            className={`rg-action-card rg-focus-ring w-full p-3 text-left ${qingmaoEntryTone(entry, sceneLocked)} ${
              blocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-rg-gold/45 hover:bg-rg-gold/10'
            }`}
            data-testid={`qingmao-region-action-${entry.source.id}-${entry.actionSlot.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{entry.candidate.title}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-rg-paper-200/48">{entry.candidate.summary}</div>
              </div>
              <span className={`rg-chip shrink-0 ${entry.canDepart ? 'rg-chip--jade' : 'rg-chip--muted'}`}>
                {QINGMAO_STATUS_LABEL[entry.status]}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-rg-paper-200/48">
              <span>{entry.source.displayName}</span>
              <span>AP {entry.apCost}</span>
              <span>{riskLabel(entry.risk)}</span>
              <span>{entry.identity.role}</span>
            </div>
            {entry.warnings.length > 0 && (
              <div className="mt-2 line-clamp-2 text-[10px] text-rg-gold/55">
                {entry.warnings.slice(0, 2).join(' / ')}
              </div>
            )}
            {blockers.length > 0 && (
              <div className="mt-2 line-clamp-2 text-[10px] text-rg-blood-400/80">
                {blockers.slice(0, 2).join('；')}
              </div>
            )}
          </button>
        );
      })}
    </section>
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
