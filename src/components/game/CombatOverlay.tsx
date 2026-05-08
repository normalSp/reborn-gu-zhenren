import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { useShallow } from 'zustand/shallow';
import type { BattlePreview, BattleTraceEntry, DuelPhase, CombatLogEntry } from '../../types';
import { audioManager } from '../../utils/audio';
import { DOMAIN_BGM, SPECIAL_BGM } from '../../store/slices/soundSlice';
import { buildBattlePreview } from '../../engine/combat-preview';

// ═══ M7: Combat variants ═══
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22, mass: 1 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const actionBtnVariant = {
  hidden: { opacity: 0, y: 12, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.15 + i * 0.06, type: 'spring', stiffness: 250, damping: 20 },
  }),
};

const settlementVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 18 } },
};

const logItemVariant = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

// ═══ Boilerplate: 稳定空默认值，避免selector返回新引用→无限循环 ═══
const _EMPTY_ARR: readonly never[] = Object.freeze([]);
const _EMPTY_OBJ = Object.freeze({});

export function CombatOverlay() {
  const duelState = useStore(useShallow(s => s.duelState));
  const executePlayerAction = useStore(s => s.executePlayerAction);
  const endDuel = useStore(s => s.endDuel);
  // ═══ v1.7: 杀招面板 ═══
  const killMoves = useStore(useShallow((s: any) => s.killMoves ?? _EMPTY_ARR)) as any[];
  const cooldowns = useStore(useShallow((s: any) => s.cooldowns ?? _EMPTY_OBJ)) as Record<string, number>;
  const [showKillerPanel, setShowKillerPanel] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (duelState) {
      setVisible(true);
      // P2修复: 进入战斗时切换至战斗 BGM
      audioManager.crossFade(`/audio/${SPECIAL_BGM.combat}`, 1.0);
    } else {
      // 退场动画完成后才移除 DOM（AnimatePresence 的 onExitComplete 回调）
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [duelState]);

  // ═══ Hooks must be called BEFORE any early return (React Rules of Hooks) ═══
  const handleAction = useCallback((action: string, isPlayerTurn: boolean, moveIndex?: number) => {
    if (!isPlayerTurn) return;
    executePlayerAction(action as any, moveIndex);
  }, [executePlayerAction]);

  const handleEnd = useCallback(() => {
    endDuel();
    // P2修复: 战斗结束后恢复域 BGM
    const currentDomain = useStore.getState().currentDomain;
    const bgmUrl = DOMAIN_BGM[currentDomain];
    if (bgmUrl) {
      audioManager.crossFade(`/audio/${bgmUrl}`, 1.5);
    }
  }, [endDuel]);

  const battlePreview = useMemo(() => duelState ? buildBattlePreview(duelState) : null, [duelState]);

  if (!visible) return null;

  const phase = duelState?.phase ?? 'init';
  const isPlayerTurn = phase === 'player_turn';
  const isEnded = phase === 'ended';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="battle-screen fixed inset-0 z-40 flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ backgroundColor: 'var(--gu-bg-deep)', backdropFilter: 'blur(4px)' }}
        >
          {/* M7: 战斗光晕叠加层（GSAP killerMove 目标） */}
          <div
            className="battle-overlay-glow"
            style={{
              position: 'fixed',
              inset: 0,
              opacity: 0,
              borderColor: 'transparent',
              borderWidth: '3px',
              borderStyle: 'solid',
              pointerEvents: 'none',
              zIndex: 41,
              transition: 'none',
            }}
          />
          <motion.div
            className="w-full max-w-md mx-4 rounded-xl overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              backgroundColor: 'var(--gu-bg-standard)',
              border: '1px solid var(--gu-trace-gold-dim)',
              boxShadow: 'var(--gu-shadow-lg)',
            }}
          >
            {duelState && (
              <>
                {/* ─── HP区域 ─── */}
                <div className="flex gap-4 p-4 pb-2">
                  <div className="player-side flex-1">
                    <HpBar label={duelState.player.name} realm={duelState.player.realm} hp={duelState.player.hp} maxHp={duelState.player.maxHp} side="player" />
                  </div>
                  <motion.div
                    className="flex flex-col items-center justify-center text-rg-gold-400 font-bold text-sm shrink-0"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.2 }}
                  >
                    VS
                  </motion.div>
                  <div className="enemy-side flex-1 text-right">
                    <HpBar label={duelState.enemy.name} realm={duelState.enemy.realm} hp={duelState.enemy.hp} maxHp={duelState.enemy.maxHp} side="enemy" />
                  </div>
                </div>

                {/* ─── 回合计数 + 阶段指示 ─── */}
                <div className="px-4 pb-2 flex justify-between items-center">
                  <span className="text-rg-paper-200/60 text-xs font-panel">回合 {duelState.round}</span>
                  <PhaseLabel phase={phase} />
                </div>

                <BattlePreviewPanel preview={battlePreview} />

                {/* ─── 行动按钮 ─── */}
                {!isEnded && (
                  <motion.div className="px-4 pb-2 flex gap-2" initial="hidden" animate="visible">
                    <motion.button
                      className="flex-1 py-2 rounded-lg text-xs font-panel font-medium bg-rg-ink-800 text-rg-gold-400 border border-rg-gold-400/30 hover:bg-rg-gold-400/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      variants={actionBtnVariant}
                      custom={0}
                      disabled={!isPlayerTurn}
                      onClick={() => handleAction('attack', isPlayerTurn)}
                      whileHover={isPlayerTurn ? { scale: 1.04 } : {}}
                      whileTap={isPlayerTurn ? { scale: 0.96 } : {}}
                    >攻击</motion.button>
                    <motion.button
                      className="flex-1 py-2 rounded-lg text-xs font-panel font-medium bg-rg-ink-800 text-rg-paper-200/80 border border-rg-ink-600 hover:border-rg-paper-200/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      variants={actionBtnVariant}
                      custom={1}
                      disabled={!isPlayerTurn}
                      onClick={() => handleAction('defend', isPlayerTurn)}
                      whileHover={isPlayerTurn ? { scale: 1.04 } : {}}
                      whileTap={isPlayerTurn ? { scale: 0.96 } : {}}
                    >防御</motion.button>
                    <motion.button
                      className="flex-1 py-2 rounded-lg text-xs font-panel font-medium bg-rg-ink-800 text-rg-paper-200/80 border border-rg-ink-600 hover:border-rg-jade-400/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      variants={actionBtnVariant}
                      custom={2}
                      disabled={!isPlayerTurn}
                      onClick={() => handleAction('gu_skill', isPlayerTurn)}
                      whileHover={isPlayerTurn ? { scale: 1.04 } : {}}
                      whileTap={isPlayerTurn ? { scale: 0.96 } : {}}
                    >技能</motion.button>
                    {/* ═══ v1.7: 杀招按钮 — 混合制基础 ═══ */}
                    {killMoves.length > 0 && (
                      <motion.button
                        className="flex-1 py-2 rounded-lg text-xs font-panel font-medium bg-rg-ink-800 text-rg-gold border border-rg-gold/30 hover:bg-rg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        variants={actionBtnVariant}
                        custom={2.5}
                        disabled={!isPlayerTurn || killMoves.every((km: any) => (cooldowns[km.id] || 0) > 0)}
                        onClick={() => setShowKillerPanel(p => !p)}
                        whileHover={isPlayerTurn ? { scale: 1.04 } : {}}
                        whileTap={isPlayerTurn ? { scale: 0.96 } : {}}
                      >杀招</motion.button>
                    )}
                    <motion.button
                      className="flex-1 py-2 rounded-lg text-xs font-panel font-medium bg-rg-ink-800 text-rg-blood-400 border border-rg-blood-400/20 hover:bg-rg-blood-400/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      variants={actionBtnVariant}
                      custom={3}
                      disabled={!isPlayerTurn}
                      onClick={() => handleAction('escape', isPlayerTurn)}
                      whileHover={isPlayerTurn ? { scale: 1.04 } : {}}
                      whileTap={isPlayerTurn ? { scale: 0.96 } : {}}
                    >逃跑</motion.button>
                  </motion.div>
                )}

                {/* ═══ v1.7: 杀招二级选择面板 ═══ */}
                {showKillerPanel && killMoves.length > 0 && (
                  <motion.div
                    className="px-4 pb-2"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="border-t border-rg-gold/20 pt-2 grid grid-cols-2 gap-2">
                      {killMoves.map((km: any) => {
                        const onCd = (cooldowns[km.id] || 0) > 0;
                        const moveIndex = duelState.player.moves.findIndex((move: any) => move.killerMoveId === km.id);
                        const unavailable = moveIndex < 0;
                        return (
                          <button
                            key={km.id}
                            disabled={!isPlayerTurn || onCd || unavailable}
                            onClick={() => {
                              if (moveIndex < 0) return;
                              handleAction('gu_skill', isPlayerTurn, moveIndex);
                              setShowKillerPanel(false);
                            }}
                            className={`text-left p-2 rounded text-xs font-panel border transition-colors cursor-pointer ${
                              onCd || unavailable
                                ? 'border-rg-ink-600 bg-rg-ink-800/30 text-rg-paper-200/30 opacity-50'
                                : 'border-rg-gold/40 bg-rg-gold/5 text-rg-gold hover:bg-rg-gold/15'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">{km.name}</span>
                              <span className="text-[10px] opacity-60 ml-auto">{km.path}·{km.level}转</span>
                            </div>
                            <p className="text-[10px] opacity-50 mt-0.5 line-clamp-1">{km.description}</p>
                            {onCd && <p className="text-[9px] text-rg-blood-400 mt-0.5">冷却剩余 {cooldowns[km.id]} 回合</p>}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ─── 战斗日志 ─── */}
                <CombatLog entries={duelState.log} />
                <CombatTrace entries={(duelState.trace || _EMPTY_ARR) as BattleTraceEntry[]} />

                {/* ─── 结算面板 ─── */}
                {isEnded && duelState.result && (
                  <SettlementPanel result={duelState.result} roundsTaken={duelState.round} onClose={handleEnd} />
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BattlePreviewPanel({ preview }: { preview: BattlePreview | null }) {
  if (!preview) return null;
  const attack = preview.actions.find(action => action.action === 'attack');
  const bestMove = preview.actions
    .filter(action => action.action === 'killer_move')
    .sort((a, b) => (b.expectedDamageMax || 0) - (a.expectedDamageMax || 0))[0];

  return (
    <div className="px-4 pb-2">
      <div className="rounded-md border border-rg-gold/15 bg-rg-ink-900/35 px-3 py-2">
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-panel">
          <PreviewChip
            label="境界"
            value={preview.pressure.rankLabel}
            tone={preview.pressure.rankDiff > 0 ? 'danger' : preview.pressure.rankDiff < 0 ? 'good' : 'neutral'}
            detail={`伤害×${preview.pressure.playerDamageMult.toFixed(2)} 命中${preview.pressure.playerHitBonus >= 0 ? '+' : ''}${preview.pressure.playerHitBonus}`}
          />
          <PreviewChip
            label="流派"
            value={preview.pressure.pathLabel}
            tone={preview.pressure.pathMultiplier > 1 ? 'good' : preview.pressure.pathMultiplier < 1 ? 'danger' : 'neutral'}
            detail={`倍率×${preview.pressure.pathMultiplier.toFixed(2)}`}
          />
          <PreviewChip
            label="道痕"
            value={preview.pressure.daoLabel}
            tone={preview.pressure.daoResonance > 1 ? 'good' : preview.pressure.daoResonance < 1 ? 'danger' : 'neutral'}
            detail={`共鸣×${preview.pressure.daoResonance.toFixed(2)}`}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-panel text-rg-paper-200/58">
          <span>攻击：命中 {attack?.hitRate !== undefined ? `${Math.round(attack.hitRate * 100)}%` : '--'} · 约 {attack?.expectedDamageMin ?? '--'}-{attack?.expectedDamageMax ?? '--'}</span>
          <span>逃跑：{preview.escape.label} · {preview.escape.essenceCost}{preview.escape.essenceLabel}</span>
          {bestMove && (
            <span className="col-span-2 text-rg-gold/80">
              推荐杀招：{bestMove.label} · 命中 {bestMove.hitRate !== undefined ? `${Math.round(bestMove.hitRate * 100)}%` : '--'} · 约 {bestMove.expectedDamageMin}-{bestMove.expectedDamageMax} · {bestMove.essenceCost}{bestMove.essenceLabel}
            </span>
          )}
        </div>
        {preview.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {preview.warnings.slice(0, 2).map(warning => (
              <div key={warning} className="text-[10px] leading-snug text-rg-blood-400/85 font-panel">
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewChip({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'good' | 'danger' | 'neutral' }) {
  const toneClass = tone === 'good'
    ? 'border-rg-jade-400/25 text-rg-jade-400'
    : tone === 'danger'
      ? 'border-rg-blood-400/25 text-rg-blood-400'
      : 'border-rg-ink-300/15 text-rg-paper-200/70';
  return (
    <div className={`min-w-0 rounded-sm border px-2 py-1 ${toneClass}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-rg-paper-200/35">{label}</span>
        <span className="truncate">{value}</span>
      </div>
      <div className="mt-0.5 truncate text-rg-paper-200/38">{detail}</div>
    </div>
  );
}

// ─── HP条子组件 ───
function HpBar({ label, realm, hp, maxHp, side }: { label: string; realm: string; hp: number; maxHp: number; side: 'player' | 'enemy' }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = pct > 60 ? 'var(--gu-life-verdant)' : pct > 30 ? 'var(--gu-trace-gold)' : 'var(--gu-life-crimson)';

  return (
    <>
      <div className="text-xs font-panel text-rg-paper-200/80 mb-1 truncate">{label}</div>
      <div className="text-[10px] text-rg-paper-200/40 mb-1">{realm}</div>
      <div className="w-full h-3 bg-rg-ink-900 rounded-full overflow-hidden border border-rg-ink-700/50">
        <motion.div className={`h-full rounded-full ${side === 'player' ? 'player-hp-fill' : 'enemy-hp-fill'}`} layout transition={{ type: 'spring', stiffness: 180, damping: 20 }} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-[10px] text-rg-paper-200/60 mt-0.5 font-mono">{hp}/{maxHp}</div>
    </>
  );
}

// ─── 阶段标签 ───
function PhaseLabel({ phase }: { phase: DuelPhase }) {
  const map: Record<string, { text: string; color: string }> = {
    init: { text: '准备', color: 'var(--gu-trace-gold)' },
    player_turn: { text: '你的回合', color: 'var(--gu-life-verdant)' },
    enemy_turn: { text: '敌人回合...', color: 'var(--gu-life-crimson)' },
    resolution: { text: '结算中', color: 'var(--gu-trace-gold)' },
    ended: { text: '战斗结束', color: 'var(--gu-trace-gold)' },
  };
  const info = map[phase] || { text: phase, color: 'var(--gu-text-disabled)' };
  return <span className="text-xs font-panel" style={{ color: info.color }}>{info.text}</span>;
}

// ─── 行动按钮 ───
function ActionBtn({ label, disabled, onClick, variant }: { label: string; disabled: boolean; onClick: () => void; variant?: 'defend' | 'skill' | 'escape' }) {
  const base = 'flex-1 py-2 rounded-lg text-xs font-panel font-medium transition-all duration-150';
  let colorClass = 'bg-rg-ink-800 text-rg-gold-400 border border-rg-gold-400/30 hover:bg-rg-gold-400/10';
  if (variant === 'defend') colorClass = 'bg-rg-ink-800 text-rg-paper-200/80 border border-rg-ink-600 hover:border-rg-paper-200/40';
  if (variant === 'skill') colorClass = 'bg-rg-ink-800 text-rg-paper-200/80 border border-rg-ink-600 hover:border-rg-jade-400/40';
  if (variant === 'escape') colorClass = 'bg-rg-ink-800 text-rg-blood-400 border border-rg-blood-400/20 hover:bg-rg-blood-400/10 hover:border-rg-blood-400/50';
  const disabledClass = disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95';

  return <button className={`${base} ${colorClass} ${disabledClass}`} disabled={disabled} onClick={onClick}>{label}</button>;
}

// ─── 战斗日志 ───
function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const scrollRef = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollRef) {
      const el = document.getElementById('combat-log-scroll');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <div id="combat-log-scroll" className="px-4 pb-2 max-h-32 overflow-y-auto text-xs font-panel space-y-0.5" ref={(r) => { (scrollRef as any)[1]?.(r); }}>
      {entries.map((e, i) => (
        <div key={i} className="flex gap-2" style={{ color: i >= entries.length - 3 ? 'var(--gu-text-primary)' : 'var(--gu-text-secondary)' }}>
          <span className="text-rg-paper-200/30 w-8 shrink-0">R{e.round}</span>
          <span className="text-rg-paper-200/40 w-8 shrink-0">{e.actor === 'player' ? '你' : '敌'}</span>
          <span className="flex-1 truncate">{e.message}</span>
        </div>
      ))}
    </div>
  );
}

function CombatTrace({ entries }: { entries: BattleTraceEntry[] }) {
  if (!entries.length) return null;
  const latest = entries.slice(-5);
  const phaseLabel: Record<string, string> = {
    scout: '侦察',
    initiative: '先手',
    action: '行动',
    counter: '反制',
    resource: '资源',
    pressure: '压制',
    event: '事件',
    morale_escape: '士气/撤退',
  };
  return (
    <div className="px-4 pb-3">
      <div className="max-h-24 overflow-y-auto rounded-md border border-rg-ink-300/10 bg-rg-ink-900/25 p-2 text-[10px] font-panel space-y-1">
        {latest.map((entry, index) => (
          <motion.div
            key={`${entry.round}-${entry.phase}-${index}`}
            className="flex gap-2 text-rg-paper-200/55"
            variants={logItemVariant}
            initial="hidden"
            animate="visible"
          >
            <span className="w-12 shrink-0 text-rg-gold/55">{phaseLabel[entry.phase] || entry.phase}</span>
            <span className="flex-1 truncate">{entry.message}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── 结算面板 ───
function SettlementPanel({ result, roundsTaken, onClose }: { result: { winner: string | null; special?: string | null; escaped?: boolean; playerFinalHp: number; enemyFinalHp: number }; roundsTaken: number; onClose: () => void }) {
  const won = result.winner === 'player';
  const escaped = result.escaped;
  const bgColor = won ? 'var(--gu-life-verdant)' : escaped ? 'var(--gu-trace-gold-dim)' : 'var(--gu-life-crimson-dim)';
  const borderColor = won ? 'var(--gu-life-verdant)' : escaped ? 'var(--gu-trace-gold)' : 'var(--gu-life-crimson)';
  const title = won ? '胜利' : escaped ? '逃脱成功' : '战败';
  const titleColor = won ? 'var(--gu-life-verdant)' : escaped ? 'var(--gu-trace-gold)' : 'var(--gu-life-crimson)';

  return (
    <div className="px-4 pb-4">
      <motion.div className="rounded-lg p-4 text-center" variants={settlementVariants} initial="hidden" animate="visible" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        <div className="text-lg font-bold mb-2" style={{ color: titleColor }}>{title}</div>
        {result.special === 'oneshot' && <div className="text-xs text-rg-blood-400 mb-1">境界差距过大——被瞬间秒杀</div>}
        <div className="text-xs text-rg-paper-200/60 mb-3">共 {roundsTaken} 回合</div>
        <motion.button
          className="px-6 py-2 rounded-lg text-sm font-panel font-medium cursor-pointer"
          style={{ backgroundColor: 'var(--gu-trace-gold-dim)', color: 'var(--gu-trace-gold)', border: '1px solid var(--gu-trace-gold)' }}
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >关闭</motion.button>
      </motion.div>
    </div>
  );
}
