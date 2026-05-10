import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type { BattleResolutionStep, BattlefieldAction, BattlefieldCell, BattlefieldUnit } from '../../types';
import {
  buildBattlefieldActionCards,
  buildCellClassTags,
  describeBattlefieldReason,
  formatBattlefieldCost,
  getBattlefieldActor,
  summarizeBattlefieldStep,
  type BattlefieldActionCard,
  type BattlefieldActionTab,
} from '../../engine/v080-battlefield-ui-model';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useBattlefieldAnimationBridge } from '../../hooks/useBattlefieldAnimationBridge';
import {
  CrosshairIcon,
  InfoIcon,
  ScrollIcon,
  SearchIcon,
  ShieldIcon,
  SwordIcon,
  TriangleAlertIcon,
  XIcon,
  ZapIcon,
} from '../../icons';

const tabs: Array<{ id: BattlefieldActionTab; label: string; icon: typeof SwordIcon }> = [
  { id: 'gu', label: '蛊虫', icon: ZapIcon },
  { id: 'killer_move', label: '杀招', icon: SwordIcon },
  { id: 'formation', label: '阵法', icon: ShieldIcon },
  { id: 'movement', label: '身法', icon: CrosshairIcon },
  { id: 'observe', label: '观察', icon: SearchIcon },
  { id: 'retreat', label: '撤退', icon: TriangleAlertIcon },
];

function hpPercent(unit: BattlefieldUnit): number {
  return Math.max(0, Math.min(100, Math.round((unit.hp / Math.max(1, unit.maxHp)) * 100)));
}

function essencePercent(unit: BattlefieldUnit): number {
  if (!unit.essence) return 0;
  return Math.max(0, Math.min(100, Math.round((unit.essence.current / Math.max(1, unit.essence.max)) * 100)));
}

function stepTint(step?: BattleResolutionStep): string {
  return step?.visual?.primaryTint || '#C9A96E';
}

function cellLabel(cell: BattlefieldCell): string {
  const flags = cell.flags.length ? cell.flags.join('/') : '平地';
  return `${cell.id} ${cell.terrainId} ${flags}`;
}

function targetRequired(action: BattlefieldAction | null, actor: BattlefieldUnit | undefined, validation: any): boolean {
  if (!action || !actor) return false;
  if (action.type === 'retreat' || action.type === 'wait') return false;
  return !validation?.validTargetCellIds?.includes(actor.cellId);
}

function UnitPill({ unit, active }: { unit: BattlefieldUnit; active?: boolean }) {
  const hp = hpPercent(unit);
  const essence = essencePercent(unit);
  return (
    <motion.div
      layout
      className={`border px-3 py-2 bg-[rgba(13,13,18,0.72)] ${
        active ? 'border-[var(--gu-trace-gold)] shadow-[0_0_18px_rgba(201,169,110,0.18)]' : 'border-[rgba(201,169,110,0.14)]'
      }`}
      style={{ borderRadius: 6 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] text-[var(--gu-text-primary)] font-panel font-semibold">{unit.name}</div>
          <div className="text-[10px] text-[var(--gu-text-secondary)]">{unit.realmNum}转 · {unit.path}</div>
        </div>
        <div className={`text-[10px] px-1.5 py-0.5 border ${
          unit.side === 'enemy' ? 'text-[var(--gu-life-crimson)] border-[rgba(196,75,75,0.35)]' : 'text-[var(--gu-life-verdant)] border-[rgba(75,139,110,0.35)]'
        }`} style={{ borderRadius: 4 }}>
          {unit.side === 'enemy' ? '敌' : unit.side === 'ally' ? '友' : '我'}
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <div className="h-1.5 bg-[rgba(92,88,96,0.28)] overflow-hidden" style={{ borderRadius: 999 }}>
          <motion.div layout className="h-full bg-[var(--gu-life-crimson)]" style={{ width: `${hp}%` }} />
        </div>
        <div className="h-1.5 bg-[rgba(92,88,96,0.28)] overflow-hidden" style={{ borderRadius: 999 }}>
          <motion.div layout className="h-full bg-[#4B6E8B]" style={{ width: `${essence}%` }} />
        </div>
      </div>
      {unit.statusEffects.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {unit.statusEffects.map(status => (
            <span key={status} className="text-[9px] text-[var(--gu-trace-gold-text)] border border-[rgba(201,169,110,0.24)] px-1" style={{ borderRadius: 4 }}>
              {status}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ActionCardButton({
  card,
  selected,
  onSelect,
}: {
  card: BattlefieldActionCard;
  selected: boolean;
  onSelect: (card: BattlefieldActionCard) => void;
}) {
  const disabled = !!card.disabledReason || !card.action;
  return (
    <motion.button
      layout
      type="button"
      disabled={disabled && card.tab !== 'observe'}
      onClick={() => onSelect(card)}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`text-left border px-3 py-2 bg-[rgba(13,13,18,0.68)] min-h-[104px] ${
        selected
          ? 'border-[var(--gu-trace-gold)] shadow-[0_0_18px_rgba(201,169,110,0.18)]'
          : disabled
            ? 'border-[rgba(92,88,96,0.26)] opacity-65'
            : 'border-[rgba(201,169,110,0.16)] hover:border-[rgba(201,169,110,0.42)]'
      }`}
      style={{ borderRadius: 6 }}
      data-testid={`battlefield-action-${card.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-panel font-semibold" style={{ color: card.visualTint }}>{card.label}</div>
          <div className="text-[10px] text-[var(--gu-text-secondary)]">{card.path || card.tab} · {card.shape || '战场'}</div>
        </div>
        <span className="text-[10px] text-[var(--gu-trace-gold-text)]">{card.cooldownText}</span>
      </div>
      <div className="mt-2 line-clamp-2 text-[11px] leading-5 text-[var(--gu-text-primary)]/80">{card.uniqueness}</div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[var(--gu-text-secondary)]">
        <span>{card.costText}</span>
        {card.disabledReason && <span className="text-[var(--gu-life-crimson)] truncate">{card.disabledReason}</span>}
      </div>
    </motion.button>
  );
}

function BattlefieldBoard({
  cells,
  units,
  actor,
  validation,
  selectedCellId,
  onCellClick,
}: {
  cells: BattlefieldCell[];
  units: BattlefieldUnit[];
  actor?: BattlefieldUnit;
  validation: any;
  selectedCellId: string | null;
  onCellClick: (cell: BattlefieldCell) => void;
}) {
  const unitByCell = useMemo(() => new Map(units.map(unit => [unit.cellId, unit])), [units]);

  return (
    <div className="battlefield-board-wrap" data-testid="battlefield-board">
      <div className="grid grid-cols-5 gap-2">
        {cells.map(cell => {
          const tags = buildCellClassTags(cell, validation, selectedCellId);
          const unit = unitByCell.get(cell.id);
          const target = tags.includes('valid_target');
          const affected = tags.includes('affected');
          const selected = selectedCellId === cell.id;
          return (
            <motion.button
              layout
              key={cell.id}
              type="button"
              aria-label={cellLabel(cell)}
              onClick={() => onCellClick(cell)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className={`relative aspect-[1.25/1] min-h-[86px] border bg-[rgba(13,13,18,0.82)] overflow-hidden text-left ${
                selected
                  ? 'border-[var(--gu-trace-gold)]'
                  : target
                    ? 'border-[rgba(201,169,110,0.55)]'
                    : affected
                      ? 'border-[rgba(75,139,110,0.48)]'
                      : 'border-[rgba(201,169,110,0.14)]'
              }`}
              style={{ borderRadius: 6 }}
              data-testid={`battlefield-cell-${cell.id}`}
            >
              <div className="absolute inset-0 opacity-35 pointer-events-none"
                style={{
                  background: cell.flags.includes('hazard')
                    ? 'linear-gradient(135deg, rgba(196,75,75,0.18), transparent)'
                    : cell.flags.includes('dao_field')
                      ? 'linear-gradient(135deg, rgba(201,169,110,0.2), transparent)'
                      : cell.flags.includes('array_node')
                        ? 'linear-gradient(135deg, rgba(75,139,110,0.18), transparent)'
                        : 'linear-gradient(135deg, rgba(201,169,110,0.06), transparent)',
                }}
              />
              {(target || affected) && (
                <motion.div
                  layoutId={`battlefield-cell-highlight-${cell.id}`}
                  className="absolute inset-1 border pointer-events-none"
                  style={{
                    borderRadius: 5,
                    borderColor: target ? 'rgba(201,169,110,0.62)' : 'rgba(75,139,110,0.52)',
                    boxShadow: target ? '0 0 18px rgba(201,169,110,0.18)' : '0 0 14px rgba(75,139,110,0.16)',
                  }}
                />
              )}
              <div className="relative z-10 flex h-full flex-col justify-between p-2">
                <div className="flex items-center justify-between text-[9px] text-[var(--gu-text-secondary)]">
                  <span>{cell.id}</span>
                  <span>{cell.flags.includes('cover') ? '遮蔽' : cell.flags.includes('array_node') ? '阵位' : cell.flags.includes('dao_field') ? '道痕' : cell.flags.includes('hazard') ? '危险' : '地势'}</span>
                </div>
                {unit ? (
                  <motion.div
                    layoutId={`battlefield-unit-${unit.id}`}
                    className={`border px-2 py-1 bg-[rgba(26,26,36,0.94)] ${
                      unit.id === actor?.id ? 'border-[var(--gu-trace-gold)]' : unit.side === 'enemy' ? 'border-[rgba(196,75,75,0.42)]' : 'border-[rgba(75,139,110,0.42)]'
                    }`}
                    style={{ borderRadius: 5 }}
                  >
                    <div className="truncate text-[12px] text-[var(--gu-text-primary)]">{unit.name}</div>
                    <div className="mt-1 h-1 bg-[rgba(92,88,96,0.35)] overflow-hidden" style={{ borderRadius: 999 }}>
                      <div className="h-full bg-[var(--gu-life-crimson)]" style={{ width: `${hpPercent(unit)}%` }} />
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-[10px] text-[var(--gu-text-disabled)]">{cell.terrainId}</div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function BattleTrace({
  steps,
  cursor,
  currentStep,
}: {
  steps: BattleResolutionStep[];
  cursor: number;
  currentStep?: BattleResolutionStep;
}) {
  const visible = steps.slice(0, cursor);
  return (
    <div className="min-h-0 flex flex-col border border-[rgba(201,169,110,0.14)] bg-[rgba(13,13,18,0.72)]" style={{ borderRadius: 6 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(201,169,110,0.12)]">
        <div className="flex items-center gap-2 text-[12px] text-[var(--gu-trace-gold-text)]">
          <ScrollIcon size={14} />
          <span>战斗轨迹</span>
        </div>
        <span className="text-[10px] text-[var(--gu-text-secondary)]">{cursor}/{steps.length}</span>
      </div>
      <div className="max-h-[210px] md:max-h-[28vh] overflow-y-auto p-2 space-y-1" data-testid="battlefield-trace">
        {visible.length === 0 && (
          <div className="text-[11px] text-[var(--gu-text-secondary)] px-1 py-2">等待本地引擎输出轨迹</div>
        )}
        <AnimatePresence initial={false}>
          {visible.map(step => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`border px-2 py-1.5 text-[11px] leading-5 ${
                currentStep?.id === step.id ? 'border-[var(--gu-trace-gold)]' : 'border-[rgba(201,169,110,0.1)]'
              }`}
              style={{ borderRadius: 5, color: stepTint(step) }}
              data-testid={`battlefield-step-${step.kind}`}
            >
              {summarizeBattlefieldStep(step)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function BattlefieldCombatOverlay() {
  const {
    state,
    selectedAction,
    selectedTargetCellId,
    validation,
    steps,
    cursor,
    selectAction,
    selectTarget,
    executeSelected,
    close,
    advanceTrace,
    setTraceCursor,
    advanceRound,
  } = useStore(useShallow((s: any) => ({
    state: s.battlefieldCombatState,
    selectedAction: s.battlefieldSelectedAction,
    selectedTargetCellId: s.battlefieldSelectedTargetCellId,
    validation: s.battlefieldValidation,
    steps: s.battlefieldPlaybackSteps || [],
    cursor: s.battlefieldTraceCursor || 0,
    selectAction: s.selectBattlefieldAction,
    selectTarget: s.selectBattlefieldTarget,
    executeSelected: s.executeSelectedBattlefieldAction,
    close: s.closeBattlefieldCombat,
    advanceTrace: s.advanceBattlefieldTraceCursor,
    setTraceCursor: s.setBattlefieldTraceCursor,
    advanceRound: s.advanceBattlefieldRoundAction,
  })));
  const [activeTab, setActiveTab] = useState<BattlefieldActionTab>('gu');
  const reducedMotion = useReducedMotion();
  const effectLayerRef = useRef<HTMLDivElement>(null);
  const actor = state ? getBattlefieldActor(state) : undefined;
  const currentStep = steps.length ? steps[Math.max(0, Math.min(cursor, steps.length) - 1)] : undefined;
  const actionCards = useMemo(
    () => state && actor ? buildBattlefieldActionCards(state, actor.id, activeTab) : [],
    [state, actor?.id, activeTab, state?.round, state?.phase],
  );
  const selectedCard = actionCards.find(card => {
    if (!selectedAction || !card.action) return false;
    return card.action.type === selectedAction.type
      && card.action.guName === selectedAction.guName
      && card.action.killerMoveName === selectedAction.killerMoveName;
  });
  const mustPickTarget = targetRequired(selectedAction, actor, validation);
  const canExecute = !!selectedAction && !!validation && !state?.result && (
    validation.ok
      ? (!mustPickTarget || !!selectedTargetCellId)
      : false
  );

  useBattlefieldAnimationBridge(currentStep, effectLayerRef);

  useEffect(() => {
    if (!state) return;
    if (cursor >= steps.length) return;
    if (reducedMotion) {
      setTraceCursor(steps.length);
      return;
    }
    const timer = window.setTimeout(() => advanceTrace(), 520);
    return () => window.clearTimeout(timer);
  }, [state, steps.length, cursor, reducedMotion, advanceTrace, setTraceCursor]);

  if (!state || !actor) return null;

  const allies = state.units.filter(unit => unit.side === 'player' || unit.side === 'ally');
  const enemies = state.units.filter(unit => unit.side === 'enemy');
  const reason = validation?.reason ? describeBattlefieldReason(validation.reason) : selectedCard?.disabledReason;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-[rgba(13,13,18,0.96)] text-[var(--gu-text-primary)]"
      data-testid="battlefield-overlay"
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,169,110,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.08) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div ref={effectLayerRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        <div className="battlefield-gsap-flare absolute left-1/2 top-1/2 h-[52vmin] w-[52vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0" />
        <div className="battlefield-gsap-ring absolute left-1/2 top-1/2 h-[34vmin] w-[34vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-0" />
        <div className="battlefield-gsap-pulse absolute left-0 right-0 top-1/2 h-[2px] opacity-0" />
      </div>

      <div className="relative z-30 flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[rgba(201,169,110,0.14)] px-3 py-2 md:px-5">
          <div className="min-w-0">
            <div className="text-[13px] md:text-[15px] text-[var(--gu-trace-gold-text)] font-panel font-semibold truncate">
              v0.8 凡战棋盘 · 第{state.round}回合
            </div>
            <div className="text-[10px] text-[var(--gu-text-secondary)] truncate">
              {state.activeTerrainId || 'plain'} · {state.activeFormationId || '无阵'} · {state.phase}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={advanceRound}
              className="hidden sm:inline-flex items-center gap-1 border border-[rgba(201,169,110,0.18)] px-2 py-1 text-[11px] text-[var(--gu-text-secondary)] hover:text-[var(--gu-trace-gold-text)]"
              style={{ borderRadius: 5 }}
            >
              <InfoIcon size={13} />
              推进
            </button>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-8 w-8 items-center justify-center border border-[rgba(201,169,110,0.22)] text-[var(--gu-text-secondary)] hover:text-[var(--gu-text-primary)]"
              style={{ borderRadius: 5 }}
              aria-label="关闭凡战棋盘"
            >
              <XIcon size={16} />
            </button>
          </div>
        </header>

        <main className="battlefield-shell flex-1 min-h-0 p-3 md:p-4">
          <aside className="battlefield-allies min-h-0 overflow-y-auto space-y-2">
            <div className="text-[11px] text-[var(--gu-trace-gold-text)]">我方单位</div>
            {allies.map(unit => <UnitPill key={unit.id} unit={unit} active={unit.id === actor.id} />)}
          </aside>

          <section className="battlefield-center min-h-0 flex flex-col gap-3">
            <BattlefieldBoard
              cells={state.grid.cells}
              units={state.units}
              actor={actor}
              validation={validation}
              selectedCellId={selectedTargetCellId}
              onCellClick={(cell) => {
                if (!selectedAction) return;
                if (validation?.validTargetCellIds?.includes(cell.id)) selectTarget(cell.id);
              }}
            />
            <BattleTrace steps={steps} cursor={cursor} currentStep={currentStep} />
          </section>

          <aside className="battlefield-enemies min-h-0 overflow-y-auto space-y-2">
            <div className="text-[11px] text-[var(--gu-trace-gold-text)]">敌方与战场情报</div>
            {enemies.map(unit => <UnitPill key={unit.id} unit={unit} />)}
            <div className="border border-[rgba(201,169,110,0.14)] bg-[rgba(13,13,18,0.72)] p-3 text-[11px] leading-5 text-[var(--gu-text-secondary)]" style={{ borderRadius: 6 }}>
              <div className="text-[var(--gu-text-primary)]">当前行动</div>
              <div className="mt-1">{selectedCard?.label || '未选择'}</div>
              <div className="mt-2 text-[var(--gu-trace-gold-text)]">{selectedCard?.costText || formatBattlefieldCost()}</div>
              {reason && <div className="mt-2 text-[var(--gu-life-crimson)]" data-testid="battlefield-action-reason">{reason}</div>}
              {selectedCard?.counters?.length ? (
                <div className="mt-2">反制：{selectedCard.counters.slice(0, 2).join(' / ')}</div>
              ) : null}
            </div>
          </aside>
        </main>

        <footer className="border-t border-[rgba(201,169,110,0.14)] bg-[rgba(26,26,36,0.94)] px-3 py-2 md:px-4">
          <div className="flex gap-1 overflow-x-auto pb-2" role="tablist" aria-label="凡战行动栏">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-1 border px-2.5 py-1.5 text-[11px] ${
                    active
                      ? 'border-[var(--gu-trace-gold)] text-[var(--gu-trace-gold-text)] bg-[rgba(201,169,110,0.12)]'
                      : 'border-[rgba(201,169,110,0.14)] text-[var(--gu-text-secondary)]'
                  }`}
                  style={{ borderRadius: 5 }}
                  data-testid={`battlefield-tab-${tab.id}`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[28vh] overflow-y-auto">
              {actionCards.map(card => (
                <ActionCardButton
                  key={card.id}
                  card={card}
                  selected={selectedCard?.id === card.id}
                  onSelect={(next) => {
                    if (next.action) selectAction(next.action);
                  }}
                />
              ))}
            </motion.div>
            <div className="flex md:w-44 flex-row md:flex-col gap-2">
              <button
                type="button"
                disabled={!canExecute}
                onClick={executeSelected}
                className={`flex-1 border px-3 py-2 text-[12px] font-button ${
                  canExecute
                    ? 'border-[var(--gu-trace-gold)] text-[var(--gu-trace-gold-text)] bg-[rgba(201,169,110,0.12)]'
                    : 'border-[rgba(92,88,96,0.32)] text-[var(--gu-text-disabled)]'
                }`}
                style={{ borderRadius: 6 }}
                data-testid="battlefield-execute-action"
              >
                执行
              </button>
              <button
                type="button"
                onClick={() => {
                  setTraceCursor(steps.length);
                }}
                className="flex-1 border border-[rgba(201,169,110,0.14)] px-3 py-2 text-[12px] text-[var(--gu-text-secondary)]"
                style={{ borderRadius: 6 }}
              >
                展开轨迹
              </button>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        .battlefield-shell {
          display: grid;
          grid-template-columns: minmax(180px, 0.72fr) minmax(430px, 1.72fr) minmax(210px, 0.9fr);
          gap: 12px;
        }
        .battlefield-board-wrap {
          border: 1px solid rgba(201,169,110,0.16);
          background: rgba(13,13,18,0.68);
          border-radius: 6px;
          padding: 10px;
        }
        @media (max-width: 860px) {
          .battlefield-shell {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr) auto;
            overflow-y: auto;
          }
          .battlefield-center { order: 1; }
          .battlefield-allies { order: 2; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .battlefield-allies > div:first-child { grid-column: 1 / -1; }
          .battlefield-enemies { order: 3; }
          .battlefield-board-wrap { padding: 8px; }
          [data-testid^="battlefield-cell-"] { min-height: 64px; }
        }
      `}</style>
    </motion.div>
  );
}
