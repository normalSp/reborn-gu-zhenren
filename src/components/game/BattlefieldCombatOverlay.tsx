import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type { BattleResolutionStep, BattlefieldAction, BattlefieldCell, BattlefieldCombatState, BattlefieldUnit } from '../../types';
import {
  buildBattlefieldActionCards,
  buildQingmaoBattlefieldAtmosphereAsset,
  buildQingmaoBattlefieldAssets,
  buildQingmaoBattlefieldCues,
  buildQingmaoBattlefieldStoryboard,
  buildCellClassTags,
  describeBattlefieldReason,
  formatBattlefieldCost,
  getBattlefieldActor,
  isQingmaoMortalBattlefield,
  summarizeBattlefieldStep,
  type BattlefieldActionCard,
  type BattlefieldActionTab,
  type BattlefieldStoryboardBeat,
  type BattlefieldVisualAsset,
  type BattlefieldVisualCue,
} from '../../engine/v080-battlefield-ui-model';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useBattlefieldAnimationBridge, useQingmaoBattlefieldEntranceBridge } from '../../hooks/useBattlefieldAnimationBridge';
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

function cellTacticalLabel(cell: BattlefieldCell): string {
  if (cell.flags.includes('escort_exit')) return '出口';
  if (cell.flags.includes('entry_point')) return '入场';
  if (cell.flags.includes('array_node')) return '阵位';
  if (cell.flags.includes('dao_field')) return '道痕';
  if (cell.flags.includes('hazard')) return '危险';
  if (cell.flags.includes('concealment')) return '伏影';
  if (cell.flags.includes('cover')) return '遮蔽';
  if (cell.flags.includes('frontline')) return '前线';
  if (cell.flags.includes('midline')) return '中线';
  if (cell.flags.includes('backline')) return '后线';
  return '地势';
}

function targetRequired(action: BattlefieldAction | null, actor: BattlefieldUnit | undefined, validation: any): boolean {
  if (!action || !actor) return false;
  if (action.type === 'retreat' || action.type === 'wait' || action.type === 'rally' || action.type === 'observe') return false;
  return !validation?.validTargetCellIds?.includes(actor.cellId);
}

function findEffectCellCenter(root: HTMLElement, cellId?: string | null): { x: number; y: number; cellId: string } | null {
  if (!cellId) return null;
  const cell = document.querySelector<HTMLElement>(`[data-testid="battlefield-cell-${cellId}"]`);
  if (!cell) return null;
  const rootRect = root.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  return {
    x: cellRect.left - rootRect.left + cellRect.width / 2,
    y: cellRect.top - rootRect.top + cellRect.height / 2,
    cellId,
  };
}

function firstTargetCellId(state: BattlefieldCombatState, step: BattleResolutionStep): string | undefined {
  if (step.toCellId) return step.toCellId;
  if (step.affectedCellIds?.length) return step.affectedCellIds[0];
  const targetUnit = step.targetIds
    ?.map(id => state.units.find(unit => unit.id === id))
    .find((unit): unit is BattlefieldUnit => !!unit);
  return targetUnit?.cellId;
}

function syncBattlefieldEffectAnchors(
  root: HTMLDivElement | null,
  state: BattlefieldCombatState | null,
  step: BattleResolutionStep | undefined,
): void {
  if (!root || !state || !step) return;
  const actorCellId = state.units.find(unit => unit.id === step.actorId)?.cellId;
  const fromCellId = step.fromCellId || actorCellId || firstTargetCellId(state, step);
  const targetCellId = firstTargetCellId(state, step) || fromCellId;
  const rootRect = root.getBoundingClientRect();
  const fallback = { x: rootRect.width / 2, y: rootRect.height / 2, cellId: '' };
  const from = findEffectCellCenter(root, fromCellId) ?? fallback;
  const target = findEffectCellCenter(root, targetCellId) ?? from;
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const distance = Math.max(64, Math.hypot(dx, dy));
  const angle = Number.isFinite(dx) && Number.isFinite(dy) ? Math.atan2(dy, dx) * 180 / Math.PI : 0;
  const shellSize = Math.max(82, Math.min(150, Math.min(rootRect.width, rootRect.height) * 0.18));

  root.style.setProperty('--battlefield-effect-from-x', `${from.x}px`);
  root.style.setProperty('--battlefield-effect-from-y', `${from.y}px`);
  root.style.setProperty('--battlefield-effect-target-x', `${target.x}px`);
  root.style.setProperty('--battlefield-effect-target-y', `${target.y}px`);
  root.style.setProperty('--battlefield-effect-distance', `${distance}px`);
  root.style.setProperty('--battlefield-effect-angle', `${angle}`);
  root.style.setProperty('--battlefield-effect-shell-size', `${shellSize}px`);
  root.dataset.effectFromCell = from.cellId || fromCellId || 'unknown';
  root.dataset.effectTargetCell = target.cellId || targetCellId || 'unknown';
}

function battlefieldPhaseLabel(state: any): string {
  if (state?.phase === 'enemy_turn') return '敌方阶段';
  if (state?.phase === 'resolution') return '结算阶段';
  if (state?.phase === 'ended') return '已结束';
  if (state?.phase === 'scout') return '侦察阶段';
  if (state?.mode === 'group') return '我方阶段';
  return '玩家回合';
}

function cueToneClass(tone: BattlefieldVisualCue['tone']): string {
  if (tone === 'attack') return 'border-[rgba(224,199,138,0.28)] text-[#E0C78A]';
  if (tone === 'defense') return 'border-[rgba(143,208,179,0.28)] text-[#8FD0B3]';
  if (tone === 'support') return 'border-[rgba(201,169,110,0.28)] text-[var(--gu-trace-gold-text)]';
  return 'border-[rgba(196,75,75,0.28)] text-[var(--gu-life-crimson)]';
}

function QingmaoArtBoundary({ cues }: { cues: BattlefieldVisualCue[] }) {
  if (!cues.length) return null;
  return (
    <div
      className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="battlefield-qingmao-art-boundary"
    >
      {cues.map(cue => (
        <div
          key={cue.id}
          className={`min-h-[76px] border bg-[rgba(18,18,24,0.78)] px-3 py-2 ${cueToneClass(cue.tone)}`}
          style={{ borderRadius: 6 }}
        >
          <div className="text-[12px] font-panel font-semibold">{cue.label}</div>
          <div className="mt-1 text-[10px] leading-4 text-[var(--gu-text-secondary)]">{cue.text}</div>
        </div>
      ))}
    </div>
  );
}

function assetRoleClass(role: BattlefieldVisualAsset['role']): string {
  if (role === 'attack') return 'border-[rgba(224,199,138,0.3)]';
  if (role === 'defense') return 'border-[rgba(143,208,179,0.3)]';
  if (role === 'support') return 'border-[rgba(201,169,110,0.28)]';
  return 'border-[rgba(122,142,168,0.28)]';
}

function assetStatusText(status: BattlefieldVisualAsset['status']): string {
  if (status === 'active') return '已接入';
  if (status === 'candidate') return '候选';
  if (status === 'review-only') return '仅审查';
  return '禁用';
}

function QingmaoAssetBridge({ assets }: { assets: BattlefieldVisualAsset[] }) {
  if (!assets.length) return null;
  return (
    <div
      className="grid gap-2 sm:grid-cols-3"
      data-testid="battlefield-qingmao-asset-bridge"
    >
      {assets.map(asset => (
        <div
          key={asset.id}
          className={`grid grid-cols-[42px_1fr] items-center gap-2 border bg-[rgba(18,18,24,0.74)] px-2 py-2 ${assetRoleClass(asset.role)}`}
          style={{ borderRadius: 6 }}
          data-testid={`battlefield-qingmao-asset-card-${asset.id}`}
        >
          <img
            src={asset.src}
            alt={asset.label}
            className="h-10 w-10 object-cover"
            style={{ borderRadius: 5 }}
            data-testid={`battlefield-qingmao-asset-${asset.id}`}
            onError={(event) => {
              event.currentTarget.dataset.missing = 'true';
              event.currentTarget.alt = asset.fallbackText || `${asset.label}资产缺失`;
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[12px] font-panel font-semibold text-[var(--gu-text-primary)]">{asset.label}</span>
              <span className="shrink-0 text-[9px] text-[var(--gu-trace-gold-text)]">{assetStatusText(asset.status)}</span>
            </div>
            <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-[var(--gu-text-secondary)]">{asset.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QingmaoAtmosphereLayer({ asset }: { asset: BattlefieldVisualAsset | null }) {
  if (!asset) return null;
  return (
    <img
      src={asset.src}
      alt={asset.label}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.28]"
      style={{ objectPosition: 'center 56%' }}
      data-testid="battlefield-qingmao-atmosphere-image"
      data-asset-id={asset.id}
      onError={(event) => {
        event.currentTarget.dataset.missing = 'true';
        event.currentTarget.alt = asset.fallbackText || `${asset.label}资产缺失`;
      }}
    />
  );
}

function QingmaoEntranceBanner({
  active,
  atmosphere,
  reducedMotion,
}: {
  active: boolean;
  atmosphere: BattlefieldVisualAsset | null;
  reducedMotion: boolean;
}) {
  const entranceRef = useRef<HTMLDivElement>(null);
  useQingmaoBattlefieldEntranceBridge(active, entranceRef, reducedMotion);
  if (!active) return null;

  return (
    <div
      ref={entranceRef}
      className="battlefield-qingmao-entrance relative overflow-hidden border-b border-[rgba(201,169,110,0.14)] px-3 py-2 md:px-5"
      data-testid="battlefield-qingmao-entrance"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-atmosphere-asset={atmosphere?.id || 'none'}
    >
      <div className="battlefield-entrance-veil absolute inset-0 pointer-events-none" />
      <div className="battlefield-entrance-sweep absolute inset-y-0 left-0 w-1/2 pointer-events-none" />
      <div className="relative z-10 flex min-h-[42px] items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="battlefield-entrance-title truncate font-panel text-[14px] font-semibold text-[var(--gu-trace-gold-text)] md:text-[16px]">
            青茅山凡战
          </div>
          <div className="battlefield-entrance-subtitle mt-0.5 truncate text-[10px] text-[var(--gu-text-secondary)] md:text-[11px]">
            月下演武 · 旧石阵线 · 凡人尺度
          </div>
        </div>
        <div className="battlefield-entrance-aperture relative hidden h-11 w-11 shrink-0 items-center justify-center md:flex" aria-hidden="true">
          <span className="absolute inset-1 rounded-full border border-[rgba(201,169,110,0.32)]" />
          <span className="absolute inset-3 rounded-full border border-[rgba(143,208,179,0.34)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(224,199,138,0.86)] shadow-[0_0_14px_rgba(224,199,138,0.42)]" />
        </div>
      </div>
      <div className="battlefield-entrance-dao-line relative z-10 mt-2 h-px w-full" />
    </div>
  );
}

function QingmaoStoryboard({ beats }: { beats: BattlefieldStoryboardBeat[] }) {
  if (!beats.length) return null;
  return (
    <div
      className="grid gap-2 lg:grid-cols-4"
      data-testid="battlefield-qingmao-storyboard"
    >
      {beats.map(beat => (
        <div
          key={beat.id}
          className={`min-h-[84px] border bg-[rgba(13,13,18,0.74)] px-3 py-2 ${cueToneClass(beat.tone)} ${
            beat.active ? 'shadow-[0_0_20px_rgba(201,169,110,0.14)]' : 'opacity-75'
          }`}
          style={{ borderRadius: 6 }}
          data-testid={`battlefield-qingmao-storyboard-${beat.id}`}
          data-active={beat.active ? 'true' : 'false'}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[12px] font-panel font-semibold">{beat.label}</span>
            {beat.active && <span className="text-[9px] text-[var(--gu-trace-gold-text)]">触发</span>}
          </div>
          <div className="mt-1 text-[10px] leading-4 text-[var(--gu-text-primary)]/80">{beat.beats.join(' · ')}</div>
          <div className="mt-1 line-clamp-1 text-[9px] text-[var(--gu-text-secondary)]">{beat.boundary}</div>
        </div>
      ))}
    </div>
  );
}

function remainingFriendlyActors(state: any): number {
  if (!state || state.mode !== 'group') return 0;
  const acted = new Set(state.actedUnitIdsThisRound || []);
  return state.units.filter((unit: BattlefieldUnit) =>
    unit.hp > 0
    && (unit.side === 'player' || unit.side === 'ally')
    && !acted.has(unit.id)
  ).length;
}

function UnitPill({ unit, active, onSelect }: { unit: BattlefieldUnit; active?: boolean; onSelect?: (unit: BattlefieldUnit) => void }) {
  const hp = hpPercent(unit);
  const essence = essencePercent(unit);
  return (
    <motion.div
      layout
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(unit)}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === 'Enter' || event.key === ' ') onSelect(unit);
      }}
      className={`border px-3 py-2 bg-[rgba(13,13,18,0.72)] ${onSelect ? 'cursor-pointer hover:border-[rgba(201,169,110,0.45)]' : ''} ${
        active ? 'border-[var(--gu-trace-gold)] shadow-[0_0_18px_rgba(201,169,110,0.18)]' : 'border-[rgba(201,169,110,0.14)]'
      } ${unit.revealed === false ? 'opacity-70' : ''}`}
      style={{ borderRadius: 6 }}
      data-testid={`battlefield-unit-${unit.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] text-[var(--gu-text-primary)] font-panel font-semibold">{unit.name}</div>
          <div className="text-[10px] text-[var(--gu-text-secondary)]">{unit.realmNum}转 · {unit.path}</div>
        </div>
        <div className={`text-[10px] px-1.5 py-0.5 border ${
          unit.side === 'enemy' ? 'text-[var(--gu-life-crimson)] border-[rgba(196,75,75,0.35)]' : unit.side === 'neutral' ? 'text-[#7A8EA8] border-[rgba(122,142,168,0.35)]' : 'text-[var(--gu-life-verdant)] border-[rgba(75,139,110,0.35)]'
        }`} style={{ borderRadius: 4 }}>
          {unit.revealed === false ? '伏' : unit.side === 'enemy' ? '敌' : unit.side === 'ally' ? '友' : unit.side === 'neutral' ? '中' : '我'}
        </div>
      </div>
      {(unit.role || typeof unit.morale === 'number' || typeof unit.threat === 'number') && (
        <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-[var(--gu-text-secondary)]">
          {unit.role && <span>{unit.role}</span>}
          {typeof unit.morale === 'number' && <span>morale {unit.morale}</span>}
          {typeof unit.threat === 'number' && <span>threat {unit.threat}</span>}
        </div>
      )}
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
  const metaItems = [
    { label: '消耗', value: card.costText },
    { label: '射程', value: card.rangeText },
    { label: '目标', value: card.targetText },
  ];
  return (
    <motion.button
      layout
      type="button"
      disabled={disabled && card.tab !== 'observe'}
      onClick={() => onSelect(card)}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`battlefield-action-card flex flex-col text-left border px-2.5 py-2 bg-[rgba(13,13,18,0.68)] min-h-[96px] ${
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
          <div className="truncate text-[10px] text-[var(--gu-text-secondary)]">{card.path || card.tab} · {card.shape || '战场'}</div>
        </div>
        <span className="shrink-0 border border-[rgba(201,169,110,0.2)] px-1.5 py-0.5 text-[9px] text-[var(--gu-trace-gold-text)]" style={{ borderRadius: 4 }}>
          {card.cooldownText}
        </span>
      </div>
      <div
        className="mt-2 grid grid-cols-3 gap-1"
        data-testid={`battlefield-action-meta-${card.id}`}
      >
        {metaItems.map(item => (
          <div key={item.label} className="min-w-0 border border-[rgba(201,169,110,0.1)] bg-[rgba(26,26,36,0.58)] px-1.5 py-1" style={{ borderRadius: 4 }}>
            <div className="text-[8px] leading-3 text-[var(--gu-text-disabled)]">{item.label}</div>
            <div className="truncate text-[9px] leading-3 text-[var(--gu-text-secondary)]">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="battlefield-action-summary mt-2 line-clamp-2 text-[10px] leading-4 text-[var(--gu-text-primary)]/78">{card.uniqueness}</div>
      <div className="battlefield-action-counter mt-auto flex items-center justify-between gap-2 pt-1 text-[9px] text-[var(--gu-text-secondary)]">
        <span className="truncate">反制：{card.counterText}</span>
        <span className="truncate text-[var(--gu-trace-gold-text)]">{card.utilityText}</span>
      </div>
      {card.disabledReason && <div className="mt-1 truncate text-[9px] text-[var(--gu-life-crimson)]">{card.disabledReason}</div>}
    </motion.button>
  );
}

function BattlefieldBoard({
  cells,
  gridWidth,
  units,
  actor,
  validation,
  selectedCellId,
  onCellClick,
}: {
  cells: BattlefieldCell[];
  gridWidth: number;
  units: BattlefieldUnit[];
  actor?: BattlefieldUnit;
  validation: any;
  selectedCellId: string | null;
  onCellClick: (cell: BattlefieldCell) => void;
}) {
  const unitByCell = useMemo(() => new Map(units.map(unit => [unit.cellId, unit])), [units]);
  const largeBoard = cells.length > 15;
  const minCellWidth = largeBoard ? 76 : 92;

  return (
    <div className="battlefield-board-wrap" data-testid="battlefield-board" data-grid-size={`${gridWidth}x${Math.ceil(cells.length / Math.max(1, gridWidth))}`}>
      <div
        className="battlefield-board-grid grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, gridWidth)}, minmax(${largeBoard ? 70 : 82}px, 1fr))`,
          minWidth: largeBoard ? `${Math.max(1, gridWidth) * minCellWidth}px` : undefined,
        }}
      >
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
              className={`relative aspect-[1.25/1] ${largeBoard ? 'min-h-[62px] md:min-h-[72px]' : 'min-h-[86px]'} border bg-[rgba(13,13,18,0.82)] overflow-hidden text-left ${
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
                  <span>{cellTacticalLabel(cell)}</span>
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
    <div className="battlefield-trace-panel min-h-0 flex flex-col border border-[rgba(201,169,110,0.14)] bg-[rgba(13,13,18,0.72)]" style={{ borderRadius: 6 }}>
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
    selectActor,
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
    selectActor: s.selectBattlefieldActor,
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
  const qingmaoCues = useMemo(() => buildQingmaoBattlefieldCues(state), [state?.battleId, state?.activeFormationId]);
  const qingmaoAssets = useMemo(() => buildQingmaoBattlefieldAssets(state), [state?.battleId, state?.activeFormationId]);
  const qingmaoAtmosphere = useMemo(() => buildQingmaoBattlefieldAtmosphereAsset(state), [state?.battleId, state?.activeFormationId]);
  const qingmaoStoryboard = useMemo(
    () => buildQingmaoBattlefieldStoryboard(state, currentStep),
    [state?.battleId, state?.activeFormationId, currentStep?.id],
  );
  const unitCellSignature = useMemo(
    () => state?.units.map(unit => `${unit.id}:${unit.cellId}`).join('|') ?? '',
    [state?.units],
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

  useLayoutEffect(() => {
    syncBattlefieldEffectAnchors(effectLayerRef.current, state, currentStep);
  }, [state?.battleId, currentStep?.id, unitCellSignature]);

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
  const neutrals = state.units.filter(unit => unit.side === 'neutral');
  const reason = validation?.reason ? describeBattlefieldReason(validation.reason) : selectedCard?.disabledReason;
  const isGroup = state.mode === 'group';
  const isQingmaoSlice = isQingmaoMortalBattlefield(state);
  const phaseLabel = battlefieldPhaseLabel(state);
  const remainingActors = remainingFriendlyActors(state);
  const actedActors = state.mode === 'group' ? (state.actedUnitIdsThisRound?.length || 0) : 0;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[10000] bg-[rgba(13,13,18,0.96)] text-[var(--gu-text-primary)] ${isQingmaoSlice ? 'is-qingmao-battlefield' : ''}`}
      data-testid="battlefield-overlay"
      data-qingmao-atmosphere-asset={qingmaoAtmosphere?.id}
    >
      <QingmaoAtmosphereLayer asset={qingmaoAtmosphere} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,169,110,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.08) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div
        ref={effectLayerRef}
        className="pointer-events-none absolute inset-0 z-[80] overflow-visible"
        data-testid="battlefield-effect-layer"
      >
        <div className="battlefield-gsap-flare absolute left-1/2 top-1/2 h-[52vmin] w-[52vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-[1px]" />
        <div className="battlefield-gsap-ring absolute left-1/2 top-1/2 h-[34vmin] w-[34vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 opacity-0" />
        <div className="battlefield-gsap-pulse absolute left-0 right-0 top-1/2 h-[3px] opacity-0" />
        <div className="battlefield-gsap-moon-blade absolute h-[4px] origin-left opacity-0" data-testid="battlefield-gsap-moon-blade" />
        <div className="battlefield-gsap-moon-echo absolute h-[2px] origin-left opacity-0" data-testid="battlefield-gsap-moon-echo" />
        <div className="battlefield-gsap-jade-shell absolute rounded-full border opacity-0" data-testid="battlefield-gsap-jade-shell" />
        <div className="battlefield-gsap-jade-crack absolute h-[2px] opacity-0" data-testid="battlefield-gsap-jade-crack" />
        <div className="battlefield-gsap-boundary-thread absolute h-[2px] origin-left opacity-0" data-testid="battlefield-gsap-boundary-thread" />
        <div className="battlefield-gsap-boundary-sigil absolute rounded-full border opacity-0" data-testid="battlefield-gsap-boundary-sigil" />
      </div>

      <div className="relative z-30 flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[rgba(201,169,110,0.14)] px-3 py-2 md:px-5">
          <div className="min-w-0">
            <div className="text-[13px] md:text-[15px] text-[var(--gu-trace-gold-text)] font-panel font-semibold truncate">
              {isQingmaoSlice ? 'v0.9.0-b3 青茅山凡战竖切' : isGroup ? 'v0.8 群像战棋盘' : 'v0.8 凡战棋盘'} · 第{state.round}回合
            </div>
            <div className="text-[10px] text-[var(--gu-text-secondary)] truncate">
              {state.activeTerrainId || 'plain'} · {state.activeFormationId || '无阵'} · {phaseLabel}
              {isGroup ? ` · 已行动 ${actedActors} / 剩余 ${remainingActors}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={advanceRound}
              className="inline-flex items-center gap-1 border border-[rgba(201,169,110,0.22)] px-2 py-1 text-[11px] text-[var(--gu-text-secondary)] hover:text-[var(--gu-trace-gold-text)]"
              style={{ borderRadius: 5 }}
              data-testid="battlefield-end-player-phase"
              title={isGroup ? '结束我方阶段后，敌方与第三方会由本地引擎自动行动。' : '推进到下一回合。'}
            >
              <InfoIcon size={13} />
              {isGroup ? '结束我方阶段' : '推进'}
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

        <QingmaoEntranceBanner active={isQingmaoSlice} atmosphere={qingmaoAtmosphere} reducedMotion={reducedMotion} />

        <main className={`battlefield-shell flex-1 min-h-0 p-3 md:p-4 ${isQingmaoSlice ? 'is-qingmao-mortal' : ''}`}>
          <aside className="battlefield-allies min-h-0 overflow-y-auto space-y-2">
            <div className="text-[11px] text-[var(--gu-trace-gold-text)]">我方单位</div>
            {allies.map(unit => (
              <UnitPill
                key={unit.id}
                unit={unit}
                active={unit.id === actor.id}
                onSelect={isGroup ? next => selectActor?.(next.id) : undefined}
              />
            ))}
            {isGroup && state.morale && (
              <div className="border border-[rgba(201,169,110,0.14)] bg-[rgba(13,13,18,0.72)] p-3" style={{ borderRadius: 6 }} data-testid="battlefield-morale">
                <div className="text-[11px] text-[var(--gu-trace-gold-text)]">士气</div>
                <div className="mt-2 space-y-2 text-[10px] text-[var(--gu-text-secondary)]">
                  {(['player', 'enemy'] as const).map(key => (
                    <div key={key}>
                      <div className="flex justify-between"><span>{key}</span><span>{state.morale?.[key] ?? 0}</span></div>
                      <div className="h-1.5 bg-[rgba(92,88,96,0.28)] overflow-hidden" style={{ borderRadius: 999 }}>
                        <motion.div layout className={key === 'player' ? 'h-full bg-[var(--gu-life-verdant)]' : 'h-full bg-[var(--gu-life-crimson)]'} style={{ width: `${state.morale?.[key] ?? 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section className="battlefield-center min-h-0 flex flex-col gap-3">
            {isQingmaoSlice && (qingmaoCues.length > 0 || qingmaoAssets.length > 0 || qingmaoStoryboard.length > 0) && (
              <div className="qingmao-readout-stack" data-testid="battlefield-qingmao-readout-stack">
                <QingmaoArtBoundary cues={qingmaoCues} />
                <QingmaoAssetBridge assets={qingmaoAssets} />
                <QingmaoStoryboard beats={qingmaoStoryboard} />
              </div>
            )}
            <BattlefieldBoard
              cells={state.grid.cells}
              gridWidth={state.grid.width}
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
            {isGroup && neutrals.length > 0 && (
              <div data-testid="battlefield-third-parties" className="space-y-2">
                <div className="text-[11px] text-[#7A8EA8]">中立/第三方</div>
                {neutrals.map(unit => <UnitPill key={unit.id} unit={unit} />)}
              </div>
            )}
            {isGroup && state.objectives?.length ? (
              <div className="border border-[rgba(201,169,110,0.14)] bg-[rgba(13,13,18,0.72)] p-3 text-[11px] leading-5" style={{ borderRadius: 6 }} data-testid="battlefield-objectives">
                <div className="text-[var(--gu-trace-gold-text)]">目标</div>
                <div className="mt-1 space-y-1">
                  {state.objectives.map(objective => (
                    <div key={objective.id} className="flex items-center justify-between gap-2 text-[var(--gu-text-secondary)]">
                      <span className="truncate">{objective.label}</span>
                      <span className={objective.status === 'active' ? 'text-[var(--gu-trace-gold-text)]' : objective.status === 'succeeded' ? 'text-[var(--gu-life-verdant)]' : 'text-[var(--gu-life-crimson)]'}>
                        {objective.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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

        <footer className="battlefield-action-dock border-t border-[rgba(201,169,110,0.14)] bg-[rgba(26,26,36,0.94)] px-3 py-2 md:px-4" data-testid="battlefield-action-dock">
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
            <motion.div layout className="battlefield-action-list grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[28vh] overflow-y-auto" data-testid="battlefield-action-list">
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
          overflow: hidden;
        }
        .battlefield-board-wrap {
          border: 1px solid rgba(201,169,110,0.16);
          background: rgba(13,13,18,0.68);
          border-radius: 6px;
          padding: 10px;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .qingmao-readout-stack {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
          gap: 8px;
          max-height: 118px;
          min-height: 0;
          overflow-y: auto;
          padding-right: 2px;
        }
        .qingmao-readout-stack > * {
          min-height: 0;
        }
        .qingmao-readout-stack [data-testid="battlefield-qingmao-art-boundary"],
        .qingmao-readout-stack [data-testid="battlefield-qingmao-asset-bridge"],
        .qingmao-readout-stack [data-testid="battlefield-qingmao-storyboard"] {
          grid-template-columns: 1fr;
          align-content: start;
        }
        .battlefield-qingmao-entrance {
          background:
            linear-gradient(90deg, rgba(13,13,18,0.9), rgba(22,30,28,0.84), rgba(13,13,18,0.9)),
            linear-gradient(180deg, rgba(201,169,110,0.08), transparent);
        }
        .battlefield-entrance-veil {
          background:
            linear-gradient(90deg, transparent, rgba(201,169,110,0.16), transparent),
            radial-gradient(circle at 50% 50%, rgba(143,208,179,0.12), transparent 58%);
        }
        .battlefield-entrance-sweep {
          background: linear-gradient(90deg, transparent, rgba(224,199,138,0.18), rgba(143,208,179,0.08), transparent);
          transform: skewX(-12deg);
        }
        .battlefield-entrance-dao-line {
          background: linear-gradient(90deg, transparent, rgba(201,169,110,0.65), rgba(143,208,179,0.38), transparent);
        }
        .is-qingmao-battlefield::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 18% 22%, rgba(143,208,179,0.08), transparent 28%),
            radial-gradient(circle at 72% 18%, rgba(224,199,138,0.07), transparent 30%),
            linear-gradient(180deg, rgba(22,28,30,0.32), transparent 42%);
        }
        .is-qingmao-mortal .battlefield-board-wrap {
          background:
            linear-gradient(135deg, rgba(19,25,26,0.92), rgba(13,13,18,0.76)),
            repeating-linear-gradient(45deg, rgba(201,169,110,0.04) 0, rgba(201,169,110,0.04) 1px, transparent 1px, transparent 12px);
          box-shadow: inset 0 0 0 1px rgba(143,208,179,0.08), 0 14px 34px rgba(0,0,0,0.22);
          flex: 0 0 auto;
        }
        .is-qingmao-mortal [data-testid^="battlefield-cell-"] {
          aspect-ratio: auto;
          background: linear-gradient(145deg, rgba(15,20,22,0.95), rgba(24,24,30,0.9));
          height: clamp(74px, 8.8vh, 98px);
          min-height: clamp(74px, 8.8vh, 98px);
        }
        .is-qingmao-battlefield .battlefield-center {
          gap: 10px;
          overflow-y: auto;
          padding-right: 2px;
        }
        .is-qingmao-battlefield .battlefield-action-dock {
          flex-shrink: 0;
        }
        .is-qingmao-battlefield .battlefield-action-list {
          display: flex;
          gap: 8px;
          max-height: none;
          overflow-x: auto;
          overflow-y: hidden;
          align-items: stretch;
          padding-bottom: 2px;
        }
        .is-qingmao-battlefield .battlefield-action-card {
          flex: 0 0 clamp(300px, 31vw, 390px);
          height: 154px;
          min-height: 154px;
          max-height: 154px;
          overflow: hidden;
        }
        .is-qingmao-battlefield .battlefield-action-card [data-testid^="battlefield-action-meta-"] {
          margin-top: 6px;
        }
        .is-qingmao-battlefield .battlefield-action-summary {
          margin-top: 8px;
        }
        .is-qingmao-battlefield .battlefield-action-counter {
          min-height: 16px;
        }
        .is-qingmao-battlefield .battlefield-trace-panel [data-testid="battlefield-trace"] {
          max-height: min(12vh, 92px);
        }
        @media (max-width: 860px) {
          .battlefield-shell {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr) auto;
            overflow-y: auto;
          }
          .battlefield-center { order: 1; }
          .qingmao-readout-stack {
            grid-template-columns: 1fr;
            max-height: 180px;
          }
          .battlefield-allies { order: 2; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .battlefield-allies > div:first-child { grid-column: 1 / -1; }
          .battlefield-enemies { order: 3; }
          .battlefield-board-wrap { padding: 8px; }
          .battlefield-qingmao-entrance { padding-top: 6px; padding-bottom: 6px; }
          [data-testid^="battlefield-cell-"] { min-height: 64px; }
          .is-qingmao-mortal [data-testid^="battlefield-cell-"] {
            height: 70px;
            min-height: 70px;
          }
          .is-qingmao-battlefield .battlefield-action-list {
            max-height: none;
          }
          .is-qingmao-battlefield .battlefield-action-card {
            flex-basis: min(82vw, 340px);
            height: 154px;
            min-height: 154px;
            max-height: 154px;
          }
        }
      `}</style>
    </motion.div>
  );
}
