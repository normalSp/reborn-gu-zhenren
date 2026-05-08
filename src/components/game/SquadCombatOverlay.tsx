/**
 * v0.7.0: 小队战斗UI覆盖层 — SquadCombatOverlay.tsx
 * 
 * 5-phase状态机: deploy → player_turn → enemy_turn → resolution → ended
 * 复用CombatOverlay的AnimatePresence + motion.div动画模式
 * 
 * 特性:
 * - 4种战术姿态选择（合击/牵制/掠阵/斩首）带效果说明
 * - 速度排序回合行动顺序预览
 * - 每位队员独立行动选择（攻击/防御/蛊虫技能/撤退）
 * - 敌方AI行动可视化
 * - 队员HP/士气/配合度/状态展示
 * - 战斗日志（颜色区分）
 * - 结算面板（胜/败/逃脱）
 * - 性格影响提示标签
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { useShallow } from 'zustand/shallow';
import type { BattleTraceEntry, SquadCombatState, SquadMemberCombat, SquadEnemy, SquadAction, CombatLogEntry } from '../../types';
import { FORMATION_BONUS } from '../../engine/squad-combat-engine';
import { buildExtremePhysiqueSquadNotice } from '../../engine/extreme-physique-squad-gates';
import { audioManager } from '../../utils/audio';
import { DOMAIN_BGM } from '../../store/slices/soundSlice';

// ═══ Animation Variants (复用CombatOverlay风格) ═══
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

const formationCardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.1 + i * 0.06, type: 'spring', stiffness: 250, damping: 20 },
  }),
};

const memberCardVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.15 + i * 0.08, type: 'spring', stiffness: 200, damping: 18 },
  }),
};

const settlementVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 18 } },
};

// ═══ 稳定常量 — 反模式防护 ═══
const _EMPTY_ARR: readonly never[] = Object.freeze([]);
const _EMPTY_OBJ = Object.freeze({});

// ═══ 阵型数据 — 语义对照引擎 FORMATION_BONUS ═══
const FORMATION_INFO: Record<string, { name: string; icon: string; desc: string; stats: string }> = {
  '合击': { name: '合击', icon: '⚔️', desc: FORMATION_BONUS['合击'].special, stats: '伤害+15%' },
  '牵制': { name: '牵制', icon: '🔗', desc: FORMATION_BONUS['牵制'].special, stats: '防御+10% | 闪避削弱' },
  '掠阵': { name: '掠阵', icon: '🛡️', desc: FORMATION_BONUS['掠阵'].special, stats: '防御+5% | 每回合回复' },
  '斩首': { name: '斩首', icon: '💀', desc: FORMATION_BONUS['斩首'].special, stats: '伤害+10% | 速度+5%' },
};

// ═══ 性格标签 ═══
const PERSONALITY_LABELS: Record<string, { text: string; color: string }> = {
  loyal:    { text: '忠诚·护主', color: 'var(--gu-life-verdant)' },
  cunning:  { text: '狡诈·偷袭', color: 'var(--gu-trace-gold)' },
  reckless: { text: '莽撞·强攻', color: 'var(--gu-life-crimson)' },
  cautious: { text: '谨慎·防守', color: 'var(--gu-trace-gold-dim)' },
  selfless: { text: '无私·治疗', color: 'var(--gu-life-verdant)' },
};

// ═══ Phase 映射 ═══
const PHASE_LABELS: Record<string, { text: string; color: string }> = {
  deploy:       { text: '布阵', color: 'var(--gu-trace-gold)' },
  player_turn:  { text: '我方回合', color: 'var(--gu-life-verdant)' },
  enemy_turn:   { text: '敌方行动', color: 'var(--gu-life-crimson)' },
  resolution:   { text: '结算中', color: 'var(--gu-trace-gold)' },
  ended:        { text: '战斗结束', color: 'var(--gu-trace-gold)' },
};

// ─── 速度排序计算 ───
function getSpeed(unit: { atk: number; def: number; realm: number }, formationBonus: number): number {
  return unit.atk * 0.6 + unit.def * 0.3 + unit.realm * 0.1 + formationBonus * 10;
}

function calcFormationSpeedBonus(formation: SquadCombatState['formation']): number {
  return FORMATION_BONUS[formation]?.speedBonus ?? 0;
}

interface TurnOrderEntry {
  type: 'member' | 'enemy';
  index: number;
  speed: number;
  name: string;
}

// ═══════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════
export function SquadCombatOverlay() {
  const squadCombatState = useStore(useShallow(s => s.squadCombatState));
  const setSquadFormation = useStore(s => s.setSquadFormation);
  const confirmSquadDeploy = useStore(s => s.confirmSquadDeploy);
  const executeSquadTurn = useStore(s => s.executeSquadTurn);
  const endSquadDuel = useStore(s => s.endSquadDuel);
  const aperture = useStore(s => s.aperture);

  const [visible, setVisible] = useState(false);
  // 每位队员的当前行动选择 (memberIndex → SquadAction)
  const [playerActions, setPlayerActions] = useState<Map<number, SquadAction>>(new Map());
  // 选中的攻击目标 (memberIndex → enemyIndex)
  const [selectedTargets, setSelectedTargets] = useState<Map<number, number>>(new Map());

  // ─── visibility & BGM ───
  useEffect(() => {
    if (squadCombatState) {
      setVisible(true);
      audioManager.crossFade('/audio/bgm/combat.mp3', 1.0);
      // 重置行动选择
      setPlayerActions(new Map());
      setSelectedTargets(new Map());
    } else {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [squadCombatState]);

  // ─── 战斗结束恢复BGM ───
  const handleEnd = useCallback(() => {
    endSquadDuel();
    const currentDomain = useStore.getState().currentDomain;
    const bgmUrl = DOMAIN_BGM[currentDomain];
    if (bgmUrl) {
      audioManager.crossFade(`/audio/${bgmUrl}`, 1.5);
    }
  }, [endSquadDuel]);

  // ─── 速度排序预览 ───
  const turnOrder = useMemo<TurnOrderEntry[]>(() => {
    if (!squadCombatState) return [];
    const bonus = calcFormationSpeedBonus(squadCombatState.formation);
    const entries: TurnOrderEntry[] = [
      ...squadCombatState.members.filter(m => m.hp > 0).map((m, i) => ({
        type: 'member' as const, index: i,
        speed: getSpeed(m, bonus), name: m.name,
      })),
      ...squadCombatState.enemies.filter(e => e.hp > 0).map((e, i) => ({
        type: 'enemy' as const, index: i,
        speed: getSpeed(e, 0), name: e.name,
      })),
    ];
    return entries.sort((a, b) => b.speed - a.speed);
  }, [squadCombatState]);

  const extremeNotice = useMemo(() => {
    if (!squadCombatState) return null;
    return buildExtremePhysiqueSquadNotice(aperture, squadCombatState.members.map(member => member.path));
  }, [aperture, squadCombatState]);

  // ─── 部署确认 ───
  const handleDeployConfirm = useCallback(() => {
    confirmSquadDeploy();
  }, [confirmSquadDeploy]);

  // ─── 选择队员行动 ───
  const handleSelectAction = useCallback((memberIndex: number, actionType: SquadAction['type'], moveId?: string) => {
    setPlayerActions(prev => {
      const next = new Map(prev);
      const targetIdx = selectedTargets.get(memberIndex) ?? 0;
      if (actionType === 'defend') {
        next.set(memberIndex, { type: 'defend' });
      } else if (actionType === 'escape') {
        next.set(memberIndex, { type: 'escape' });
      } else if (actionType === 'gu_skill') {
        next.set(memberIndex, { type: 'gu_skill', moveId: moveId ?? 'heal', targetIndex: targetIdx });
      } else {
        next.set(memberIndex, { type: 'attack', targetIndex: targetIdx });
      }
      return next;
    });
  }, [selectedTargets]);

  // ─── 选择目标 ───
  const handleSelectTarget = useCallback((memberIndex: number, enemyIndex: number) => {
    setSelectedTargets(prev => {
      const next = new Map(prev);
      next.set(memberIndex, enemyIndex);
      return next;
    });
    // 如果当前有攻击行动，自动更新目标
    setPlayerActions(prev => {
      const next = new Map(prev);
      const current = next.get(memberIndex);
      if (current && current.type === 'attack') {
        next.set(memberIndex, { ...current, targetIndex: enemyIndex });
      } else if (current && current.type === 'gu_skill') {
        next.set(memberIndex, { ...current, targetIndex: enemyIndex });
      }
      return next;
    });
  }, []);

  // ─── 执行回合 ───
  const handleExecuteTurn = useCallback(() => {
    if (!squadCombatState) return;
    const actions: SquadAction[] = squadCombatState.members.map((m, i) => {
      if (m.hp <= 0) return { type: 'defend' as const };
      return playerActions.get(i) || { type: 'attack' as const, targetIndex: 0 };
    });
    executeSquadTurn(actions);
    // 重置选择
    setPlayerActions(new Map());
    setSelectedTargets(new Map());
  }, [squadCombatState, playerActions, executeSquadTurn]);

  if (!visible) return null;

  const phase = squadCombatState?.phase;
  const isDeploy = phase === 'deploy';
  const isPlayerTurn = phase === 'player_turn';
  const isResolution = phase === 'resolution';
  const isEnded = phase === 'ended';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="battle-screen fixed inset-0 z-45 flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ backgroundColor: 'var(--gu-bg-deep)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            className="w-full max-w-lg mx-4 rounded-xl overflow-hidden max-h-[90vh]"
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
            {squadCombatState && (
              <div className="flex flex-col" style={{ maxHeight: '88vh' }}>
                {/* ─── 顶部栏: 阶段 + 回合 + 士气/配合度 ─── */}
                <div className="px-4 pt-3 pb-2 flex justify-between items-center border-b"
                     style={{ borderColor: 'var(--gu-trace-gold-dim)' }}>
                  <span className="text-xs font-panel" style={{ color: PHASE_LABELS[phase ?? '']?.color }}>
                    {PHASE_LABELS[phase ?? '']?.text ?? phase}
                  </span>
                  <span className="text-rg-paper-200/60 text-xs font-panel">回合 {squadCombatState.round}</span>
                  <div className="flex gap-3 text-[10px] font-mono">
                    <span style={{ color: 'var(--gu-trace-gold)' }}>士气 {squadCombatState.morale}</span>
                    <span style={{ color: 'var(--gu-trace-gold-dim)' }}>配合 {squadCombatState.coordination}</span>
                  </div>
                </div>

                {/* ═══ Deploy: 战术姿态选择 ═══ */}
                {isDeploy && (
                  <DeployPhase
                    state={squadCombatState}
                    extremeNotice={extremeNotice}
                    onSelectFormation={setSquadFormation}
                    onConfirm={handleDeployConfirm}
                  />
                )}

                {/* ═══ Player Turn: 行动选择 ═══ */}
                {isPlayerTurn && (
                  <PlayerTurnPhase
                    state={squadCombatState}
                    playerActions={playerActions}
                    selectedTargets={selectedTargets}
                    turnOrder={turnOrder}
                    onSelectAction={handleSelectAction}
                    onSelectTarget={handleSelectTarget}
                    onExecute={handleExecuteTurn}
                  />
                )}

                {/* ═══ Resolution: 结算展示 ═══ */}
                {isResolution && (
                  <ResolutionPhase state={squadCombatState} />
                )}

                {/* ═══ Ended: 结算面板 ═══ */}
                {isEnded && (
                  <EndedPhase state={squadCombatState} onClose={handleEnd} />
                )}

                {/* ─── 战斗日志（全局可见） ─── */}
                {!isDeploy && (
                  <>
                    <SquadEventCandidates candidates={squadCombatState.eventCandidates ?? []} />
                    <SquadTrace entries={squadCombatState.trace ?? []} />
                    <CombatLog entries={squadCombatState.log} />
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// Deploy Phase: 阵型选择
// ═══════════════════════════════════════════════════════════
function DeployPhase({
  state, extremeNotice, onSelectFormation, onConfirm,
}: {
  state: SquadCombatState;
  extremeNotice: ReturnType<typeof buildExtremePhysiqueSquadNotice>;
  onSelectFormation: (f: SquadCombatState['formation']) => void;
  onConfirm: () => void;
}) {
  const formations: SquadCombatState['formation'][] = ['合击', '牵制', '掠阵', '斩首'];

  return (
    <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '60vh' }}>
      {/* 敌方预览 */}
      <div className="px-4 pt-3 pb-2">
        <div className="text-xs font-panel text-rg-paper-200/60 mb-2">敌方阵容</div>
        <div className="grid grid-cols-2 gap-2">
          {state.enemies.map((e, i) => (
            <EnemyCard key={e.id} enemy={e} index={i} />
          ))}
        </div>
      </div>

      {extremeNotice && (
        <div className="mx-4 my-2 rounded-lg p-3 text-xs" style={{ backgroundColor: 'var(--gu-life-crimson-dim)', border: '1px solid var(--gu-life-crimson)' }}>
          <div className="font-bold mb-1" style={{ color: 'var(--gu-life-crimson)' }}>
            十绝体高压迫：{extremeNotice.physiqueType}
          </div>
          <div className="text-rg-paper-200/65 mb-1">{extremeNotice.slotPressure}</div>
          <div className="text-[10px] text-rg-paper-200/50">
            亲和：{extremeNotice.favoredPaths.join('、') || '无'} · 禁制：{extremeNotice.forbiddenPaths.join('、') || '无'}
          </div>
          {extremeNotice.memberWarnings.slice(0, 2).map((warning, index) => (
            <div key={index} className="text-[10px] mt-1" style={{ color: 'var(--gu-trace-gold)' }}>{warning}</div>
          ))}
        </div>
      )}

      {/* 战术姿态选择 */}
      <div className="px-4 py-2">
        <div className="text-xs font-panel text-rg-paper-200/60 mb-2">选择战术姿态</div>
        <div className="grid grid-cols-2 gap-2">
          {formations.map((f, i) => {
            const info = FORMATION_INFO[f];
            const selected = state.formation === f;
            return (
              <motion.button
                key={f}
                className="rounded-lg p-3 text-left border cursor-pointer transition-colors"
                variants={formationCardVariants}
                custom={i}
                initial="hidden"
                animate="visible"
                onClick={() => onSelectFormation(f)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  backgroundColor: selected ? 'var(--gu-trace-gold-dim)' : 'var(--gu-bg-elevated)',
                  borderColor: selected ? 'var(--gu-trace-gold)' : 'var(--gu-border-dim)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{info.icon}</span>
                  <span className="text-xs font-bold" style={{ color: selected ? 'var(--gu-trace-gold)' : 'var(--gu-text-primary)' }}>
                    {info.name}
                  </span>
                </div>
                <div className="text-[10px] text-rg-paper-200/50 mb-1">{info.desc}</div>
                <div className="text-[9px] font-mono" style={{ color: 'var(--gu-trace-gold-dim)' }}>{info.stats}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 确认按钮 */}
      <div className="px-4 py-3">
        <motion.button
          className="w-full py-3 rounded-lg text-sm font-bold font-panel cursor-pointer"
          style={{
            backgroundColor: 'var(--gu-trace-gold-dim)',
            color: 'var(--gu-trace-gold)',
            border: '1px solid var(--gu-trace-gold)',
          }}
          onClick={onConfirm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          开始战斗
        </motion.button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Player Turn Phase: 行动选择
// ═══════════════════════════════════════════════════════════
function PlayerTurnPhase({
  state, playerActions, selectedTargets, turnOrder,
  onSelectAction, onSelectTarget, onExecute,
}: {
  state: SquadCombatState;
  playerActions: Map<number, SquadAction>;
  selectedTargets: Map<number, number>;
  turnOrder: TurnOrderEntry[];
  onSelectAction: (mi: number, action: SquadAction['type'], moveId?: string) => void;
  onSelectTarget: (mi: number, ei: number) => void;
  onExecute: () => void;
}) {
  const aliveMembers = state.members.filter(m => m.hp > 0);
  const aliveEnemies = state.enemies.filter(e => e.hp > 0);

  // 是否所有队员都已选择行动
  const allSelected = state.members.every((member, i) => member.hp <= 0 || playerActions.has(i));

  return (
    <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '60vh' }}>
      {/* 速度排序预览 */}
      <div className="px-4 pt-3 pb-2">
        <div className="text-xs font-panel text-rg-paper-200/60 mb-1.5">行动顺序（按速度）</div>
        <div className="flex flex-wrap gap-1 items-center">
          {turnOrder.map((entry, i) => (
            <span key={`${entry.type}-${entry.index}`}
              className="text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5"
              style={{
                backgroundColor: entry.type === 'member' ? 'var(--gu-life-verdant-dim)' : 'var(--gu-life-crimson-dim)',
                color: entry.type === 'member' ? 'var(--gu-life-verdant)' : 'var(--gu-life-crimson)',
                opacity: i < 10 ? 1 : 0.4 + (1 / (i - 7)) * 0.3,
              }}
            >
              {entry.name.slice(0, 3)}
              {i < turnOrder.length - 1 && <span className="text-rg-paper-200/30 ml-0.5">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* 队员卡牌 */}
      <div className="px-4 py-2 space-y-2">
        <div className="text-xs font-panel text-rg-paper-200/60 mb-1">选择行动</div>
        {state.members.map((member, mi) => {
          const isAlive = member.hp > 0;
          const currentAction = playerActions.get(mi);
          const personality = PERSONALITY_LABELS[member.personality] || { text: '', color: 'var(--gu-text-disabled)' };

          return (
            <motion.div
              key={member.memberId}
              className="rounded-lg p-3 border"
              variants={memberCardVariants}
              custom={mi}
              initial="hidden"
              animate="visible"
              style={{
                backgroundColor: isAlive ? 'var(--gu-bg-elevated)' : 'var(--gu-bg-deep)',
                borderColor: 'var(--gu-border-dim)',
                opacity: isAlive ? 1 : 0.4,
              }}
            >
              {/* 名字 + HP条 + 性格提示 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--gu-text-primary)' }}>
                    {member.name}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: personality.color }}>
                    {personality.text}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-rg-paper-200/60">
                  {member.hp}/{member.maxHp}
                </span>
              </div>

              {/* HP条 */}
              <div className="w-full h-2 bg-rg-ink-900 rounded-full overflow-hidden border border-rg-ink-700/50 mb-2">
                <motion.div
                  className="h-full rounded-full"
                  layout
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                  style={{
                    width: `${Math.max(0, Math.min(100, (member.hp / member.maxHp) * 100))}%`,
                    backgroundColor: member.hp / member.maxHp > 0.6
                      ? 'var(--gu-life-verdant)'
                      : member.hp / member.maxHp > 0.3
                        ? 'var(--gu-trace-gold)'
                        : 'var(--gu-life-crimson)',
                  }}
                />
              </div>

              {/* 状态效果图标 */}
              {member.statuses.length > 0 && (
                <div className="flex gap-1 mb-2">
                  {member.statuses.map((st, si) => (
                    <span key={si} className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--gu-life-crimson-dim)', color: 'var(--gu-life-crimson)' }}>
                      {st.type}
                    </span>
                  ))}
                </div>
              )}

              {/* 资源/冷却：小队战必须让玩家看见真元与杀招状态 */}
              <div className="flex flex-wrap gap-1 mb-2 text-[9px] font-mono">
                {member.essence && (
                  <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--gu-bg-deep)', color: 'var(--gu-trace-gold-dim)' }}>
                    {member.essence.type === 'immortal' ? '仙元' : '真元'} {member.essence.current}/{member.essence.max}
                  </span>
                )}
                {member.fatigue !== undefined && member.fatigue > 0 && (
                  <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--gu-life-crimson-dim)', color: 'var(--gu-life-crimson)' }}>
                    疲劳 {member.fatigue}
                  </span>
                )}
                {Object.entries(member.cooldowns ?? {}).slice(0, 3).map(([key, value]) => (
                  <span key={key} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--gu-bg-deep)', color: 'var(--gu-text-disabled)' }}>
                    {key} 冷却{value}
                  </span>
                ))}
              </div>

              {/* 行动按钮 + 目标选择 */}
              {isAlive && (
                <div>
                  <div className="flex gap-1.5 mb-1.5">
                    {(['attack', 'defend'] as const).map(type => {
                      const isSelected = currentAction?.type === type;
                      return (
                        <motion.button
                          key={type}
                          className="flex-1 py-1.5 rounded text-[10px] font-panel font-medium border cursor-pointer"
                          onClick={() => onSelectAction(mi, type)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            backgroundColor: isSelected ? 'var(--gu-trace-gold-dim)' : 'var(--gu-bg-deep)',
                            color: isSelected ? 'var(--gu-trace-gold)' : 'var(--gu-text-secondary)',
                            borderColor: isSelected ? 'var(--gu-trace-gold)' : 'var(--gu-border-dim)',
                          }}
                        >
                          {type === 'attack' ? '🗡️攻' : '🛡️防'}
                        </motion.button>
                      );
                    })}
                    <motion.button
                      className="py-1.5 px-2 rounded text-[10px] font-panel font-medium border cursor-pointer"
                      onClick={() => onSelectAction(mi, 'escape')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        backgroundColor: currentAction?.type === 'escape' ? 'var(--gu-life-crimson-dim)' : 'var(--gu-bg-deep)',
                        color: currentAction?.type === 'escape' ? 'var(--gu-life-crimson)' : 'var(--gu-text-disabled)',
                        borderColor: currentAction?.type === 'escape' ? 'var(--gu-life-crimson)' : 'var(--gu-border-dim)',
                      }}
                    >
                      🏃逃
                    </motion.button>
                  </div>

                  {(member.moves?.length ?? 0) > 0 && (
                    <div className="flex gap-1 flex-wrap mb-1.5">
                      {member.moves!.slice(0, 4).map((move, moveIndex) => {
                        const moveId = move.killerMoveId || move.name || String(moveIndex);
                        const cooldown = member.cooldowns?.[moveId] ?? member.cooldowns?.[move.name] ?? 0;
                        const isSelected = currentAction?.type === 'gu_skill' && currentAction.moveId === moveId;
                        return (
                          <motion.button
                            key={moveId}
                            className="text-[9px] py-1 px-2 rounded border cursor-pointer disabled:cursor-not-allowed"
                            disabled={cooldown > 0}
                            onClick={() => onSelectAction(mi, 'gu_skill', moveId)}
                            whileHover={cooldown <= 0 ? { scale: 1.05 } : {}}
                            whileTap={cooldown <= 0 ? { scale: 0.95 } : {}}
                            title={move.description}
                            style={{
                              backgroundColor: isSelected ? 'var(--gu-trace-gold-dim)' : 'var(--gu-bg-deep)',
                              color: cooldown > 0 ? 'var(--gu-text-disabled)' : isSelected ? 'var(--gu-trace-gold)' : 'var(--gu-text-secondary)',
                              borderColor: isSelected ? 'var(--gu-trace-gold)' : 'var(--gu-border-dim)',
                              opacity: cooldown > 0 ? 0.45 : 1,
                            }}
                          >
                            ✨ {move.name.slice(0, 8)}{cooldown > 0 ? `·${cooldown}` : ''}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* 攻击/技能目标选择 */}
                  {(currentAction?.type === 'attack' || currentAction?.type === 'gu_skill') && (
                    <div className="flex gap-1 flex-wrap">
                      {state.enemies.map((e, ei) => (
                        <motion.button
                          key={e.id}
                          className={`text-[9px] py-1 px-2 rounded border cursor-pointer ${e.hp <= 0 ? 'opacity-30' : ''}`}
                          disabled={e.hp <= 0}
                          onClick={() => onSelectTarget(mi, ei)}
                          whileHover={e.hp > 0 ? { scale: 1.05 } : {}}
                          style={{
                            backgroundColor: (selectedTargets.get(mi) ?? -1) === ei ? 'var(--gu-life-crimson-dim)' : 'var(--gu-bg-deep)',
                            color: (selectedTargets.get(mi) ?? -1) === ei ? 'var(--gu-life-crimson)' : 'var(--gu-text-disabled)',
                            borderColor: (selectedTargets.get(mi) ?? -1) === ei ? 'var(--gu-life-crimson)' : 'var(--gu-border-dim)',
                          }}
                        >
                          🎯 {e.name} ({e.hp}/{e.maxHp})
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 敌方状态 */}
      <div className="px-4 py-2">
        <div className="text-xs font-panel text-rg-paper-200/60 mb-1">敌方状态</div>
        <div className="grid grid-cols-2 gap-2">
          {state.enemies.map((e, i) => (
            <EnemyCard key={e.id} enemy={e} index={i} />
          ))}
        </div>
      </div>

      {/* 执行按钮 */}
      <div className="px-4 py-3">
        <motion.button
          className="w-full py-3 rounded-lg text-sm font-bold font-panel cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: allSelected ? 'var(--gu-trace-gold-dim)' : 'var(--gu-bg-deep)',
            color: allSelected ? 'var(--gu-trace-gold)' : 'var(--gu-text-disabled)',
            border: `1px solid ${allSelected ? 'var(--gu-trace-gold)' : 'var(--gu-border-dim)'}`,
          }}
          onClick={onExecute}
          whileHover={allSelected ? { scale: 1.02 } : {}}
          whileTap={allSelected ? { scale: 0.97 } : {}}
        >
          {allSelected ? '⚔️ 执行回合' : '请为所有队员选择行动'}
        </motion.button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Resolution Phase: 回合结算
// ═══════════════════════════════════════════════════════════
function ResolutionPhase({ state }: { state: SquadCombatState }) {
  const aliveMembers = state.members.filter(m => m.hp > 0);
  const aliveEnemies = state.enemies.filter(e => e.hp > 0);

  return (
    <div className="flex flex-col overflow-y-auto px-4 py-3" style={{ maxHeight: '50vh' }}>
      <div className="text-center text-sm font-bold mb-3" style={{ color: 'var(--gu-trace-gold)' }}>
        回合 {state.round} 结算
      </div>

      {/* 快速状态概览 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--gu-bg-elevated)' }}>
          <div className="text-[10px] text-rg-paper-200/40 mb-1">我方</div>
          {state.members.map(m => (
            <div key={m.memberId} className="flex justify-between text-[10px] font-mono mb-0.5"
                 style={{ color: m.hp > 0 ? 'var(--gu-life-verdant)' : 'var(--gu-life-crimson)' }}>
              <span>{m.name}</span>
              <span>{m.hp}/{m.maxHp}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--gu-bg-elevated)' }}>
          <div className="text-[10px] text-rg-paper-200/40 mb-1">敌方</div>
          {state.enemies.map(e => (
            <div key={e.id} className="flex justify-between text-[10px] font-mono mb-0.5"
                 style={{ color: e.hp > 0 ? 'var(--gu-life-crimson)' : 'var(--gu-life-verdant)' }}>
              <span>{e.name}</span>
              <span>{e.hp}/{e.maxHp}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs font-panel text-rg-paper-200/40 animate-pulse">
          下一回合准备中...
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Ended Phase: 结算面板
// ═══════════════════════════════════════════════════════════
function EndedPhase({ state, onClose }: { state: SquadCombatState; onClose: () => void }) {
  const allEnemiesDead = state.enemies.every(e => e.hp <= 0);
  const allMembersDead = state.members.every(m => m.hp <= 0);
  const winner = state.result?.winner;
  const won = winner ? winner === 'player' : allEnemiesDead;
  const lost = winner ? winner === 'enemy' : allMembersDead;
  const escaped = winner ? winner === 'escaped' : !won && !lost;

  const bgColor = won ? 'var(--gu-life-verdant-dim)' : lost ? 'var(--gu-life-crimson-dim)' : 'var(--gu-trace-gold-dim)';
  const borderColor = won ? 'var(--gu-life-verdant)' : lost ? 'var(--gu-life-crimson)' : 'var(--gu-trace-gold)';
  const titleColor = won ? 'var(--gu-life-verdant)' : lost ? 'var(--gu-life-crimson)' : 'var(--gu-trace-gold)';
  const title = won ? '战斗胜利' : lost ? '全军覆没' : escaped ? '脱离战斗' : '战斗结束';

  return (
    <div className="px-4 py-4">
      <motion.div
        className="rounded-lg p-4 text-center"
        variants={settlementVariants}
        initial="hidden"
        animate="visible"
        style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
      >
        <div className="text-lg font-bold mb-2" style={{ color: titleColor }}>{title}</div>
        <div className="text-xs text-rg-paper-200/60 mb-1">
          共 {state.round} 回合
        </div>

        {/* 存活汇总 */}
        <div className="text-[10px] text-rg-paper-200/40 mb-3 font-mono">
          {state.members.filter(m => m.hp > 0).map(m => (
            <span key={m.memberId} className="mr-2">{m.name}: {m.hp}HP</span>
          ))}
        </div>

        {/* 士气/配合度伤损 */}
        <div className="text-[10px] text-rg-paper-200/40 mb-3">
          最终士气: {state.morale} | 配合度: {state.coordination}
        </div>

        {state.result && (
          <div className="text-left rounded-lg p-2 mb-3 space-y-1" style={{ backgroundColor: 'var(--gu-bg-deep)', border: '1px solid var(--gu-border-dim)' }}>
            <div className="text-[10px] font-bold" style={{ color: 'var(--gu-trace-gold)' }}>关系与伤亡回流</div>
            <div className="text-[10px] text-rg-paper-200/50">
              士气变化 {state.result.moraleDelta >= 0 ? '+' : ''}{state.result.moraleDelta}
              {state.result.wounded.length > 0 ? ` · 重伤：${state.result.wounded.join('、')}` : ' · 无重伤'}
            </div>
            {Object.keys(state.result.trustDeltas).length > 0 && (
              <div className="text-[10px] text-rg-paper-200/45">
                信任变化：{Object.entries(state.result.trustDeltas).map(([id, delta]) => `${id}${delta >= 0 ? '+' : ''}${delta}`).join('，')}
              </div>
            )}
          </div>
        )}

        {state.rewardPreview && won && (
          <div className="text-left rounded-lg p-2 mb-3" style={{ backgroundColor: 'var(--gu-bg-deep)', border: '1px solid var(--gu-border-dim)' }}>
            <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--gu-life-verdant)' }}>奖励闸门预览</div>
            <div className="text-[10px] text-rg-paper-200/55">
              元石 +{state.rewardPreview.yuanStone ?? 0}
              {state.rewardPreview.immortalStone ? ` · 仙元石 +${state.rewardPreview.immortalStone}` : ''}
            </div>
            {(state.rewardPreview.rumors ?? []).map((rumor, index) => (
              <div key={index} className="text-[10px] text-rg-paper-200/40">{rumor}</div>
            ))}
          </div>
        )}

        <motion.button
          className="px-6 py-2 rounded-lg text-sm font-panel font-medium cursor-pointer"
          style={{ backgroundColor: 'var(--gu-trace-gold-dim)', color: 'var(--gu-trace-gold)', border: '1px solid var(--gu-trace-gold)' }}
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          关闭
        </motion.button>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 子组件: 敌方卡牌
// ═══════════════════════════════════════════════════════════
function EnemyCard({ enemy, index }: { enemy: SquadEnemy; index: number }) {
  const pct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
  const isDead = enemy.hp <= 0;
  return (
    <div className="rounded p-2 text-left" style={{
      backgroundColor: 'var(--gu-bg-elevated)',
      border: '1px solid var(--gu-border-dim)',
      opacity: isDead ? 0.4 : 1,
    }}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-rg-paper-200/80">{enemy.name}</span>
        <span className="text-[9px] font-mono text-rg-paper-200/40">{enemy.realm}转 · {enemy.path}</span>
      </div>
      <div className="w-full h-1.5 bg-rg-ink-900 rounded-full overflow-hidden border border-rg-ink-700/50 mb-1">
        <div className="h-full rounded-full" style={{
          width: `${pct}%`,
          backgroundColor: pct > 60 ? 'var(--gu-life-crimson)' : pct > 30 ? 'var(--gu-trace-gold)' : 'var(--gu-life-verdant)',
        }} />
      </div>
      <div className="flex justify-between text-[9px] font-mono">
        <span style={{ color: pct > 60 ? 'var(--gu-life-crimson)' : pct > 30 ? 'var(--gu-trace-gold)' : 'var(--gu-life-verdant)' }}>
          {enemy.hp}/{enemy.maxHp}
        </span>
        <span className="text-rg-paper-200/30">{enemy.aiMode}</span>
      </div>
      {enemy.statuses.length > 0 && (
        <div className="flex gap-0.5 mt-1">
          {enemy.statuses.map((st, si) => (
            <span key={si} className="text-[8px] px-1 py-0.5 rounded"
              style={{ backgroundColor: 'var(--gu-life-crimson-dim)', color: 'var(--gu-life-crimson)' }}>
              {st.type}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 子组件: 战斗日志
// ═══════════════════════════════════════════════════════════
function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef) {
      scrollRef.scrollTop = scrollRef.scrollHeight;
    }
  }, [entries.length, scrollRef]);

  if (entries.length === 0) return null;

  // 只渲染最近50条
  const visible = entries.slice(-50);

  return (
    <div
      ref={setScrollRef}
      className="mx-4 mb-3 max-h-36 overflow-y-auto text-xs font-panel space-y-0.5 rounded-lg p-2"
      style={{ backgroundColor: 'var(--gu-bg-deep)', border: '1px solid var(--gu-border-dim)' }}
    >
      {visible.map((e, i) => (
        <div key={i} className="flex gap-1.5"
          style={{ color: i >= visible.length - 3 ? 'var(--gu-text-primary)' : 'var(--gu-text-secondary)' }}>
          <span className="text-rg-paper-200/20 w-7 shrink-0 text-right">R{e.round}</span>
          <span className="shrink-0 w-7 text-center" style={{
            color: e.actor === 'player' ? 'var(--gu-life-verdant)' : 'var(--gu-life-crimson)',
          }}>
            {e.actor === 'player' ? '我' : '敌'}
          </span>
          <span className="flex-1 truncate" style={{ color: e.crit ? 'var(--gu-trace-gold)' : undefined }}>
            {e.message}
          </span>
          {e.damage !== undefined && e.damage > 0 && (
            <span className="shrink-0 font-mono" style={{
              color: e.actor === 'player' ? 'var(--gu-life-verdant)' : 'var(--gu-life-crimson)',
            }}>
              -{e.damage}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function SquadEventCandidates({ candidates }: { candidates: SquadCombatState['eventCandidates'] }) {
  if (!candidates || candidates.length === 0) return null;
  const visible = candidates.slice(-4);
  return (
    <div className="mx-4 mb-2 rounded-lg p-2 text-xs" style={{ backgroundColor: 'var(--gu-bg-deep)', border: '1px solid var(--gu-border-dim)' }}>
      <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--gu-trace-gold)' }}>AI候选事件（待引擎校验）</div>
      {visible.map((candidate, index) => (
        <div key={candidate.id ?? index} className="text-[10px] text-rg-paper-200/55 flex gap-2">
          <span className="shrink-0" style={{ color: candidate.engineValidation === 'blocked' ? 'var(--gu-life-crimson)' : 'var(--gu-trace-gold-dim)' }}>
            {candidate.engineValidation ?? 'pending'}
          </span>
          <span className="truncate">{candidate.title}：{candidate.summary}</span>
        </div>
      ))}
    </div>
  );
}

function SquadTrace({ entries }: { entries: BattleTraceEntry[] }) {
  if (entries.length === 0) return null;
  const visible = entries.slice(-24);
  return (
    <div className="mx-4 mb-2 max-h-32 overflow-y-auto rounded-lg p-2 text-xs font-panel space-y-0.5"
      style={{ backgroundColor: 'var(--gu-bg-deep)', border: '1px solid var(--gu-border-dim)' }}>
      <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--gu-trace-gold)' }}>BattleTrace</div>
      {visible.map((entry, index) => (
        <div key={`${entry.round}-${entry.phase}-${index}`} className="flex gap-1.5 text-[10px]">
          <span className="w-7 shrink-0 text-rg-paper-200/25 text-right">R{entry.round}</span>
          <span className="w-14 shrink-0" style={{ color: entry.actor === 'enemy' ? 'var(--gu-life-crimson)' : entry.actor === 'player' ? 'var(--gu-life-verdant)' : 'var(--gu-trace-gold-dim)' }}>
            {entry.phase}
          </span>
          <span className="flex-1 truncate text-rg-paper-200/55">{entry.message}</span>
          {entry.damage !== undefined && entry.damage > 0 && (
            <span className="shrink-0 font-mono" style={{ color: 'var(--gu-life-crimson)' }}>-{entry.damage}</span>
          )}
        </div>
      ))}
    </div>
  );
}
