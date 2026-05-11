/**
 * 战斗 Slice — P2-4a决斗引擎状态管理 + v0.7.0小队战斗
 * 薄切片设计：仅做状态读写，计算逻辑全部委托combat-engine / squad-combat-engine
 */
import type {
  BattleResolutionStep,
  BattleTraceEntry,
  BattlefieldAction,
  BattlefieldActionValidation,
  BattlefieldCombatState,
  BattleOutcomeResult,
  BattleOutcomeSummary,
  CombatEncounterEntryValidation,
  CombatEncounterState,
  DuelAction,
  DuelEnemy,
  DuelMove,
  DuelState,
  KillMove,
  SquadCombatState,
  SquadMemberCombat,
  SquadEnemy,
  SquadAction,
} from '../../types';
import { initDuel, executePlayerTurn, executeEnemyTurn } from '../../engine/combat-engine';
import { initSquadDuel as engineInitSquadDuel, executeSquadTurn as engineExecuteSquadTurn } from '../../engine/squad-combat-engine';
import { convertKillMoveToDuelMove } from '../../engine/killmove-bridge';
import { buildBattleVisualEffectFromDuelMove } from '../../engine/battle-visual-effects';
import { toRealmNum } from '../../engine/combat-formulas';
import { getMaterialRegistryEntries } from '../../engine/material-registry';
import {
  advanceBattlefieldRound,
  executeBattlefieldAction,
  interruptPendingBattlefieldAction,
  listBattlefieldActionTargets,
  resolveBattlefieldEnemyTurn,
  validateBattlefieldAction,
} from '../../engine/v080-battlefield-combat-engine';
import {
  createBattlefieldDemoState,
  createBattlefieldGroupDemoState,
  createBattlefieldLargeGroupDemoState,
  createBattlefieldNarrativeDuelState,
  describeBattlefieldReason,
  getBattlefieldActor,
} from '../../engine/v080-battlefield-ui-model';
import {
  buildCombatOutcomeLedgerEntry,
  buildBattleOutcomeSummary,
  createIdleCombatEncounterState,
  evaluateCombatEncounterEntry,
} from '../../engine/v080-narrative-combat-orchestration';
import killerMovesRaw from '../../canon/killer-moves.json';
import { triggerDiceRoll } from '../../components/game/DiceRollAnimation';

/** 战斗历史记录 — P2-P9-3 */
export interface BattleRecord {
  duelId: string;
  enemyName: string;
  enemyRealm: string;
  winner: 'player' | 'enemy' | null;
  special?: string | null;
  roundsTaken: number;
  playerFinalHp: number;
  enemyFinalHp: number;
  timestamp: number;
}

const MAX_BATTLE_HISTORY = 10;

function appendTraceFromLogs(state: DuelState, fromLogIndex: number, phase: BattleTraceEntry['phase']): DuelState {
  const newLogs = state.log.slice(fromLogIndex);
  if (newLogs.length === 0) return state;
  const traceEntries: BattleTraceEntry[] = newLogs.map(entry => ({
    round: entry.round,
    phase,
    actor: entry.actor,
    action: entry.action,
    message: entry.message,
    damage: entry.damage,
    tags: [
      entry.hit === true ? 'hit' : entry.hit === false ? 'miss' : '',
      entry.crit ? 'crit' : '',
    ].filter(Boolean),
  }));
  return { ...state, trace: [...(state.trace || []), ...traceEntries].slice(-120) };
}

function buildDuelMovesFromStore(player: { realm: string; path: string; daoMarks: number; moves: DuelMove[] }, store: any): DuelMove[] {
  const learnedKillMoves = (Array.isArray(store.killMoves) ? store.killMoves : []) as KillMove[];
  const daoMarkRecord = store.daoMarks || store.pathBuild?.dao_marks || { [player.path]: player.daoMarks || 0 };
  const pathLevels = store.pathLevels || store.pathBuild?.path_levels || {};
  const playerRealmNum = toRealmNum(player.realm);
  const converted = learnedKillMoves.map(move => convertKillMoveToDuelMove(move, daoMarkRecord, pathLevels, playerRealmNum));
  const byKey = new Map<string, DuelMove>();
  for (const move of [...(player.moves || []), ...converted]) {
    byKey.set(move.killerMoveId || move.name, move);
  }
  return Array.from(byKey.values());
}

function pickBattleLootMaterial(enemyPath: string | undefined, enemyRealmNum: number): string | null {
  const mortalOnly = enemyRealmNum < 6;
  const entries = getMaterialRegistryEntries()
    .filter(entry => entry.runtimeAllowed && entry.kind === 'gu_material')
    .filter(entry => !mortalOnly || !entry.isImmortalMaterial)
    .filter(entry => entry.usageTags.includes('refinement') || entry.usageTags.includes('trade'));
  const pathMatched = entries.find(entry => entry.path && entry.path === enemyPath);
  if (pathMatched) return pathMatched.id;
  const derivedGeneric = entries.find(entry => entry.source === 'derived-runtime' && !entry.path);
  return derivedGeneric?.id || entries[0]?.id || null;
}

function avgRealm<T extends { realm: number }>(units: T[]): number {
  if (!units.length) return 0;
  return units.reduce((sum, unit) => sum + (unit.realm || 0), 0) / units.length;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function applySquadResultToMember<T extends {
  id?: string;
  memberId?: string;
  name: string;
  hp?: number;
  maxHp?: number;
  alive?: boolean;
  loyalty?: number;
  adventureTrust?: number;
}>(member: T, result: NonNullable<SquadCombatState['result']>, turn: number): T {
  const memberKey = member.id || member.memberId || member.name;
  const delta = result.trustDeltas?.[memberKey] ?? result.trustDeltas?.[member.name] ?? 0;
  const wounded = result.wounded.includes(member.name) || result.wounded.includes(memberKey);
  const dead = result.casualties.includes(member.name) || result.casualties.includes(memberKey);
  const patch: Record<string, any> = {};

  if (Number.isFinite(member.adventureTrust)) {
    patch.adventureTrust = clampScore((member.adventureTrust ?? 50) + delta);
  }
  if (Number.isFinite(member.loyalty)) {
    patch.loyalty = clampScore((member.loyalty ?? 50) + Math.trunc(delta / 2));
  }
  if (wounded) {
    patch.status = 'wounded';
    patch.woundedUntil = turn + 5;
    patch.hp = Math.max(1, Math.min(member.hp ?? 1, Math.max(1, Math.floor((member.maxHp ?? 100) * 0.2))));
  }
  if (dead) {
    patch.status = 'dead';
    patch.alive = false;
    patch.hp = 0;
  }

  return { ...member, ...patch };
}

function appendBattlefieldSteps(previous: BattleResolutionStep[], steps: BattleResolutionStep[]): BattleResolutionStep[] {
  return [...previous, ...steps].slice(-120);
}

function pickEnemyReply(state: BattlefieldCombatState): BattlefieldAction | null {
  const player = state.units.find(unit => unit.hp > 0 && (unit.side === 'player' || unit.side === 'ally'));
  const enemy = state.units.find(unit => unit.hp > 0 && unit.side === 'enemy');
  if (!player || !enemy) return null;
  for (const guName of enemy.guNames) {
    const action: BattlefieldAction = {
      type: 'gu',
      actorId: enemy.id,
      guName,
      targetCellId: player.cellId,
      targetUnitIds: [player.id],
    };
    if (validateBattlefieldAction(state, action).ok) return action;
  }
  return null;
}

function resolveEnemyReply(state: BattlefieldCombatState): { state: BattlefieldCombatState; steps: BattleResolutionStep[] } {
  if (state.phase === 'ended') return { state, steps: [] };
  if (state.mode === 'group') {
    const resolution = resolveBattlefieldEnemyTurn(state);
    return { state: resolution.state, steps: resolution.steps };
  }
  const reply = pickEnemyReply(state);
  if (!reply) return { state, steps: [] };
  const resolution = executeBattlefieldAction(state, reply);
  return { state: resolution.state, steps: resolution.steps };
}

function startBattlefieldForEncounter(store: any, spec: NonNullable<CombatEncounterEntryValidation['spec']>): BattlefieldCombatState {
  if (spec.scale === 'duel') return createBattlefieldNarrativeDuelState(store, spec);
  if (spec.scale === 'group_7x5') return createBattlefieldLargeGroupDemoState(store);
  if (spec.scale === 'group_5x3') return createBattlefieldGroupDemoState(store);
  return createBattlefieldDemoState(store);
}

function updateCombatCandidateFlags(store: any, candidateId: string, patch: Record<string, unknown>) {
  const candidates = Array.isArray(store.flags?.combatEventCandidates) ? store.flags.combatEventCandidates : [];
  const next = candidates.map((candidate: any) => (
    String(candidate?.id) === String(candidateId) ? { ...candidate, ...patch } : candidate
  ));
  store.setFlag?.('combatEventCandidates', next.slice(-40));
}

function finalizeNarrativeBattlefieldEncounter(
  set: any,
  get: any,
  result?: BattleOutcomeResult,
): BattleOutcomeSummary | null {
  const store = get() as any;
  const encounter = store.combatEncounterState as CombatEncounterState | null;
  if (!encounter?.spec || !['active', 'candidate'].includes(encounter.status)) return null;
  const outcome = buildBattleOutcomeSummary({
    encounter: encounter.spec,
    battlefieldState: store.battlefieldCombatState,
    playbackSteps: store.battlefieldPlaybackSteps,
    result,
    turn: store.turn || encounter.spec.createdTurn,
  });
  const ledger = buildCombatOutcomeLedgerEntry(outcome, store.sceneSessionState?.sceneId || encounter.spec.sceneId);
  store.recordLocalActionLedger?.(ledger);
  set((s: any) => ({
    combatEncounterState: {
      ...encounter,
      status: outcome.result === 'abandoned' ? 'abandoned' : 'resolved',
      outcomeSummary: outcome,
    },
    flags: {
      ...(s.flags || {}),
      lastBattleOutcomeSummary: outcome,
      activeCombatEncounterId: null,
    },
  }));
  store.addGameLog?.('combat', `剧情战斗回流：${outcome.summary}`, {
    encounterId: outcome.encounterId,
    scale: outcome.scale,
    result: outcome.result,
  });
  return outcome;
}

function selectionValidation(
  state: BattlefieldCombatState | null,
  action: BattlefieldAction | null,
  targetCellId?: string | null,
): BattlefieldActionValidation | null {
  if (!state || !action) return null;
  if (targetCellId) return validateBattlefieldAction(state, { ...action, targetCellId });
  return listBattlefieldActionTargets(state, action);
}

export interface CombatSlice {
  duelState: DuelState | null;
  /** v0.7.0: 小队战斗状态 */
  squadCombatState: SquadCombatState | null;
  /** P2-P9-3: 最近N场战斗历史 */
  battleHistory: BattleRecord[];
  /** P0.2: 总战斗次数（含胜负逃） */
  totalBattlesFought: number;
  /** P0.2: 战斗胜利次数 */
  combatWins: number;
  /** v0.7.0-b: 小队战胜利次数 */
  squadCombatWins: number;
  /** v0.7.0-b: 小队重伤救回次数 */
  squadMemberWoundedRescues: number;
  /** v0.7.0-b: 小队成员阵亡次数 */
  squadMemberDeaths: number;
  /** v0.7.0-b: 合击成功次数 */
  squadComboSuccesses: number;
  /** v0.7.0-b: 越级撤退成功次数 */
  squadOverlevelEscapes: number;
  /** v0.7.0-c: 杀招/重要仙蛊闪图视觉队列，纯运行时 */
  battleVisualQueue: import('../../types').BattleVisualEffectEvent[];
  battlefieldCombatState: BattlefieldCombatState | null;
  battlefieldSelectedAction: BattlefieldAction | null;
  battlefieldSelectedTargetCellId: string | null;
  battlefieldValidation: BattlefieldActionValidation | null;
  battlefieldPlaybackSteps: BattleResolutionStep[];
  battlefieldTraceCursor: number;
  combatEncounterState: CombatEncounterState;

  /** 开始决斗 */
  initDuel: (player: {
    name: string; realm: string; path: string;
    daoMarks: number;
    hp: number; maxHp: number; attack: number; defense: number;
    accuracy?: number; evasion?: number;
    essence?: { current: number; max: number };
    gu: { name: string; path: string; tier: number }[];
    moves: DuelMove[];
  }, enemy: DuelEnemy) => void;

  /** 结束决斗（清理状态） */
  endDuel: () => void;

  /** 玩家执行行动 */
  executePlayerAction: (action: DuelAction, moveIndex?: number) => void;

  /** 执行敌人回合（自动） */
  executeEnemyTurnAction: () => void;

  // ═══ v0.7.0: 小队战斗动作 ═══

  /** 初始化小队战斗 */
  initSquadDuel: (members: SquadMemberCombat[], enemies: SquadEnemy[], formation?: SquadCombatState['formation']) => void;

  /** 设置战术姿态（deploy阶段） */
  setSquadFormation: (formation: SquadCombatState['formation']) => void;

  /** 确认布阵进入战斗 */
  confirmSquadDeploy: () => void;

  /** 执行小队战斗回合 */
  executeSquadTurn: (playerActions: SquadAction[]) => void;

  /** 结束小队战斗 */
  endSquadDuel: () => void;

  /** v0.7.0-c: 推入战斗闪图事件 */
  enqueueBattleVisualEffect: (event: import('../../types').BattleVisualEffectEvent) => void;
  /** v0.7.0-c: 弹出当前闪图事件 */
  dequeueBattleVisualEffect: () => void;
  /** v0.7.0-c: 清空闪图队列 */
  clearBattleVisualEffects: () => void;
  initBattlefieldDemo: () => void;
  initBattlefieldGroupDemo: () => void;
  initBattlefieldLargeGroupDemo: () => void;
  acceptCombatEventCandidate: (candidateId: string) => boolean;
  resolveNarrativeCombatOutcome: (result?: BattleOutcomeResult) => BattleOutcomeSummary | null;
  selectBattlefieldActor: (actorId: string) => void;
  selectBattlefieldAction: (action: BattlefieldAction | null) => void;
  selectBattlefieldTarget: (cellId: string | null) => void;
  executeSelectedBattlefieldAction: () => void;
  advanceBattlefieldRoundAction: () => void;
  interruptBattlefieldPendingAction: (pendingActionId: string, reason: string) => void;
  setBattlefieldTraceCursor: (cursor: number) => void;
  advanceBattlefieldTraceCursor: () => void;
  closeBattlefieldCombat: () => void;
}

export const createCombatSlice = (set: any, get: any): CombatSlice => ({
  duelState: null,
  squadCombatState: null,
  battleHistory: [],
  // ═══ P0.2: 战斗计数器初始值 ═══
  totalBattlesFought: 0,
  combatWins: 0,
  squadCombatWins: 0,
  squadMemberWoundedRescues: 0,
  squadMemberDeaths: 0,
  squadComboSuccesses: 0,
  squadOverlevelEscapes: 0,
  battleVisualQueue: [],
  battlefieldCombatState: null,
  battlefieldSelectedAction: null,
  battlefieldSelectedTargetCellId: null,
  battlefieldValidation: null,
  battlefieldPlaybackSteps: [],
  battlefieldTraceCursor: 0,
  combatEncounterState: createIdleCombatEncounterState(),

  initDuel: (player, enemy) => {
    const fullStore = get() as any;
    const state = initDuel({
      ...player,
      moves: buildDuelMovesFromStore(player, fullStore),
    }, enemy);
    // 初始阶段直接进入玩家回合
    state.phase = 'player_turn';
    state.trace = [{
      round: 0,
      phase: 'scout',
      actor: 'system',
      action: 'init',
      message: `战斗开始：${player.name} vs ${enemy.name}`,
      tags: ['battle_start'],
    }];
    set({ duelState: state });
    // ═══ 日志埋点: 战斗开始
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('combat', `战斗开始 vs ${enemy.name} (${enemy.realm})`, {
        duelId: state.duelId,
        enemyName: enemy.name,
        enemyRealm: enemy.realm,
        playerHp: player.hp,
        playerMaxHp: player.maxHp,
        enemyHp: enemy.hp,
        enemyMaxHp: enemy.maxHp,
      });
    }
  },

  endDuel: () => {
    const state = get().duelState as DuelState | null;
    if (state?.result) {
      // ═══ P0.2: 递增战斗计数器 ═══
      const isWin = state.result.winner === 'player';
      set((s: CombatSlice) => ({
        totalBattlesFought: s.totalBattlesFought + 1,
        combatWins: isWin ? s.combatWins + 1 : s.combatWins,
      }));

      // P2-P9-3: 记录战斗历史
      const record: BattleRecord = {
        duelId: state.duelId,
        enemyName: state.enemy.name,
        enemyRealm: state.enemy.realm,
        winner: state.result.winner,
        special: state.result.special,
        roundsTaken: state.result.roundsTaken,
        playerFinalHp: state.result.playerFinalHp,
        enemyFinalHp: state.result.enemyFinalHp,
        timestamp: Date.now(),
      };
      const history = get().battleHistory as BattleRecord[] || [];
      const newHistory = [record, ...history].slice(0, MAX_BATTLE_HISTORY);
      set({ battleHistory: newHistory });

      // ═══ v0.7.0: 敌方蛊虫100%销毁概率（原著：蛊师/蛊仙死亡时空窍破碎，蛊虫震出体外后立即自爆销毁，敌人无法获取） ═══
      if (state.result.winner === 'player') {
        const enemyGuCount = state.enemy.gu?.length || 0;
        const destroyed = enemyGuCount; // 100%销毁
        console.log(`[Combat] 战斗胜利！敌方${enemyGuCount}只蛊虫在空窍破碎时全部自爆销毁（原著设定）。`);

        // ═══ B1.2: 战斗掉落蛊材 ═══
        const fullStore = get() as any;
        const enemyPath = state.enemy.path;
        const enemyTier = state.enemy.realmNum || parseInt(state.enemy.realm) || 1;
        const lootCount = Math.max(1, Math.floor(enemyTier * (1 + Math.random() * 2)));
        const matName = pickBattleLootMaterial(enemyPath, enemyTier);
        if (typeof fullStore.addMaterial === 'function') {
          if (matName) fullStore.addMaterial(matName, lootCount);
        }
        if (matName && typeof fullStore.addGameLog === 'function') {
          fullStore.addGameLog('combat', `战斗胜利！获得 ${matName}×${lootCount}`, {
            material: matName, count: lootCount, enemyName: state.enemy.name,
          });
        } else if (!matName && typeof fullStore.addGameLog === 'function') {
          fullStore.addGameLog('combat', '战斗胜利：未找到可登记掉落，已跳过材料入库', {
            enemyName: state.enemy.name,
            enemyPath,
            enemyTier,
          });
        }

        // ═══ B2.5b: 杀招残卷掉落 — 15%×敌人境界/5（保底5%） ═══
        const lootChance = Math.max(0.05, 0.15 * enemyTier / 5);
        if (Math.random() < lootChance) {
          const entries = Object.entries(killerMovesRaw)
            .filter(([k, v]) => !k.startsWith('_') && (v as any).level <= enemyTier && !(v as any).isExclusive);
          if (entries.length > 0) {
            const [key, data] = entries[Math.floor(Math.random() * entries.length)];
            const km = data as any;
            if (typeof fullStore.learnKillMove === 'function') {
              fullStore.learnKillMove({
                id: `loot_km_${Date.now()}`, name: km.name || key,
                path: km.path || '通用', level: km.level || 1,
                baseCost: (km.level || 1) * 10, multiplier: 1.5 + (km.level || 1) * 0.3,
                cooldown: Math.max(1, 8 - (km.level || 1)),
                description: km.effect || '', source: 'event', proficiency: 0, usageCount: 0,
              });
            }
            if (typeof fullStore.addGameLog === 'function') {
              fullStore.addGameLog('combat', `缴获杀招残卷：「${km.name || key}」`, { killMove: km.name || key });
            }
          }
        }
      }
      // ═══ 日志埋点: 战斗结束
      const logStore = get() as any;
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('combat', `战斗结束: ${state.result.winner === 'player' ? '胜' : state.result.winner === 'enemy' ? '败' : '平'} (${state.result.roundsTaken}回合)`, {
          winner: state.result.winner, roundsTaken: state.result.roundsTaken,
          playerFinalHp: state.result.playerFinalHp, enemyFinalHp: state.result.enemyFinalHp,
          special: state.result.special,
        });
      }
      // P4: 战斗结算时触发掷骰动画
      try { triggerDiceRoll({ label: `战果`, value: state.result.winner === 'player' ? 100 : (state.result.winner === 'enemy' ? 0 : 50), max: 100 }); } catch {}
    }
    // ═══ GSAP: 短暂进入 resolution 阶段触发结算动画 ═══
    const current = get().duelState as DuelState | null;
    if (current) {
      set({ duelState: { ...current, phase: 'resolution' as const } });
      // triggerBattleInfo 触发伤害浮层
      const battleStore = get() as any;
      battleStore.triggerBattleInfo?.({ type: 'duel_end', winner: current.result?.winner });
    }
    // 延迟清理
    setTimeout(() => set({ duelState: null, activeKillerMove: null }), 300);
  },

  executePlayerAction: (action, moveIndex) => {
    const current = get().duelState as DuelState | null;
    if (!current) return;
    // 防御性相位修正：历史存档可能存在无效相位值 → 自动修复
    const VALID_PHASES = ['init', 'player_turn', 'enemy_turn', 'ended', 'resolution'];
    if (!VALID_PHASES.includes(current.phase)) {
      const fixed = { ...current, phase: 'player_turn' as const };
      set({ duelState: fixed });
      // 继续以修正后的相位处理当前行动
      const s = executePlayerTurn(fixed, action, moveIndex);
      const withTrace = appendTraceFromLogs(s.state, fixed.log.length, 'action');
      set({ duelState: withTrace });
      if (s.enemyTurn && withTrace.phase === 'enemy_turn') {
        const afterEnemyRaw = executeEnemyTurn(withTrace);
        const afterEnemy = appendTraceFromLogs(afterEnemyRaw, withTrace.log.length, 'counter');
        set({ duelState: afterEnemy });
      }
      return;
    }
    if (current.phase !== 'player_turn') return;

    const { state: rawState, enemyTurn } = executePlayerTurn(current, action, moveIndex);
    const newState = appendTraceFromLogs(rawState, current.log.length, 'action');
    set({ duelState: newState });

    const move = action === 'gu_skill' && moveIndex !== undefined ? current.player.moves[moveIndex] : undefined;
    const paidCost = newState.player.essence.current < current.player.essence.current || newState.player.hp < current.player.hp;
    if (action === 'gu_skill') {
      const visual = buildBattleVisualEffectFromDuelMove(move, Date.now());
      if (visual) (get() as any).enqueueBattleVisualEffect?.(visual);
    }
    if (move?.killerMoveId && paidCost) {
      (get() as any).useKillMove?.(move.killerMoveId);
    }

    // 如果触发敌人回合，自动执行
    if (enemyTurn && newState.phase === 'enemy_turn') {
      const afterEnemyRaw = executeEnemyTurn(newState);
      const afterEnemy = appendTraceFromLogs(afterEnemyRaw, newState.log.length, 'counter');
      set({ duelState: afterEnemy });
    }
  },

  executeEnemyTurnAction: () => {
    const current = get().duelState as DuelState | null;
    if (!current || current.phase !== 'enemy_turn') return;

    const rawState = executeEnemyTurn(current);
    const newState = appendTraceFromLogs(rawState, current.log.length, 'counter');
    set({ duelState: newState });
  },

  // ═══ v0.7.0: 小队战斗动作 ═══

  initSquadDuel: (members, enemies, formation = '牵制') => {
    const state = engineInitSquadDuel('squad_duel', members, enemies, formation);
    state.phase = 'deploy';
    set({ squadCombatState: state });
  },

  setSquadFormation: (formation) => {
    const current = get().squadCombatState as SquadCombatState | null;
    if (!current || current.phase !== 'deploy') return;
    set({ squadCombatState: { ...current, formation } });
  },

  confirmSquadDeploy: () => {
    const current = get().squadCombatState as SquadCombatState | null;
    if (!current || current.phase !== 'deploy') return;
    set({ squadCombatState: { ...current, phase: 'player_turn' } });
  },

  executeSquadTurn: (playerActions) => {
    const current = get().squadCombatState as SquadCombatState | null;
    if (!current) return;
    // 先短暂显示resolution阶段
    const resolved = engineExecuteSquadTurn(current, playerActions);
    const updates: Record<string, any> = { squadCombatState: resolved };
    if (!current.result && resolved.result) {
      const store = get() as any;
      updates.totalBattlesFought = (store.totalBattlesFought || 0) + 1;
      if (resolved.result.winner === 'player') {
        updates.combatWins = (store.combatWins || 0) + 1;
        updates.squadCombatWins = (store.squadCombatWins || 0) + 1;
        if (resolved.formation === '合击') {
          updates.squadComboSuccesses = (store.squadComboSuccesses || 0) + 1;
        }
      }
      if (resolved.result.wounded.length > 0 && resolved.result.winner === 'player') {
        updates.squadMemberWoundedRescues = (store.squadMemberWoundedRescues || 0) + resolved.result.wounded.length;
      }
      if (resolved.result.casualties.length > 0) {
        updates.squadMemberDeaths = (store.squadMemberDeaths || 0) + resolved.result.casualties.length;
      }
      if (resolved.result.winner === 'escaped') {
        const enemyAdvantage = avgRealm(resolved.enemies) - avgRealm(resolved.members);
        if (enemyAdvantage >= 1) {
          updates.squadOverlevelEscapes = (store.squadOverlevelEscapes || 0) + 1;
        }
      }
      const result = resolved.result;
      const reward = result.rewards ?? resolved.rewardPreview;
      if (result.winner === 'player' && reward) {
        if ((reward.yuanStone || 0) > 0) {
          updates.currency = Math.max(0, (store.currency || 0) + (reward.yuanStone || 0));
          updates.totalCurrencyEarned = (store.totalCurrencyEarned || 0) + (reward.yuanStone || 0);
        }
        if ((reward.immortalStone || 0) > 0) {
          updates.immortalCurrency = Math.max(0, (store.immortalCurrency || 0) + (reward.immortalStone || 0));
        }
        if (reward.materials && typeof store.addMaterial === 'function') {
          for (const [materialName, count] of Object.entries(reward.materials)) {
            if (count > 0) store.addMaterial(materialName, count);
          }
        }
      }

      const turn = store.turn ?? 0;
      if (store.playerFaction?.members) {
        updates.playerFaction = {
          ...store.playerFaction,
          members: store.playerFaction.members.map((member: any) => applySquadResultToMember(member, result, turn)),
        };
      }
      if (store.partyState?.members) {
        updates.partyState = {
          ...store.partyState,
          morale: Math.max(0, Math.min(100, (store.partyState.morale ?? resolved.morale) + (result.moraleDelta || 0))),
          lastUpdatedTurn: turn,
          members: store.partyState.members.map((member: any) => applySquadResultToMember(member, result, turn)),
        };
      }
    }
    set(updates);
    const visualAction = playerActions.find(action => action.type === 'gu_skill');
    if (visualAction?.moveId) {
      const actingMember = current.members.find(member =>
        member.moves?.some(move => (move.killerMoveId || move.name) === visualAction.moveId),
      );
      const move = actingMember?.moves?.find(m => (m.killerMoveId || m.name) === visualAction.moveId);
      const visual = buildBattleVisualEffectFromDuelMove(move, Date.now());
      if (visual) (get() as any).enqueueBattleVisualEffect?.(visual);
    }
    if (!current.result && resolved.result) {
      const store = get() as any;
      const reward = resolved.result.rewards ?? resolved.rewardPreview;
      if (typeof store.addGameLog === 'function') {
        const yuanStone = resolved.result.winner === 'player' ? (reward?.yuanStone || 0) : 0;
        const immortalStone = resolved.result.winner === 'player' ? (reward?.immortalStone || 0) : 0;
        store.addGameLog('combat', `小队战结算：${resolved.result.winner === 'player' ? '胜利' : resolved.result.winner === 'escaped' ? '撤退' : '失败'}，元石+${yuanStone}，仙元石+${immortalStone}`, {
          squadId: resolved.squadId,
          winner: resolved.result.winner,
          roundsTaken: resolved.result.roundsTaken,
          wounded: resolved.result.wounded,
          casualties: resolved.result.casualties,
          trustDeltas: resolved.result.trustDeltas,
        });
      }
    }
  },

  endSquadDuel: () => {
    set({ squadCombatState: null });
  },

  enqueueBattleVisualEffect: (event) => {
    set((s: CombatSlice) => ({
      battleVisualQueue: [...(s.battleVisualQueue || []), event].slice(-6),
    }));
  },

  dequeueBattleVisualEffect: () => {
    set((s: CombatSlice) => ({
      battleVisualQueue: (s.battleVisualQueue || []).slice(1),
    }));
  },

  clearBattleVisualEffects: () => {
    set({ battleVisualQueue: [] });
  },

  initBattlefieldDemo: () => {
    const store = get() as any;
    const state = createBattlefieldDemoState(store);
    const actor = getBattlefieldActor(state);
    set({
      battlefieldCombatState: state,
      battlefieldSelectedAction: null,
      battlefieldSelectedTargetCellId: null,
      battlefieldValidation: actor ? listBattlefieldActionTargets(state, { type: 'wait', actorId: actor.id }) : null,
      battlefieldPlaybackSteps: [],
      battlefieldTraceCursor: 0,
      combatEncounterState: createIdleCombatEncounterState(),
    });
    if (typeof store.addGameLog === 'function') {
      store.addGameLog('combat', 'v0.8.0-a2 凡战棋盘演武开启', {
        battleId: state.battleId,
        terrain: state.activeTerrainId,
        formation: state.activeFormationId,
      });
    }
  },

  initBattlefieldGroupDemo: () => {
    const store = get() as any;
    const state = createBattlefieldGroupDemoState(store);
    const actor = getBattlefieldActor(state);
    set({
      battlefieldCombatState: state,
      battlefieldSelectedAction: null,
      battlefieldSelectedTargetCellId: null,
      battlefieldValidation: actor ? listBattlefieldActionTargets(state, { type: 'wait', actorId: actor.id }) : null,
      battlefieldPlaybackSteps: [],
      battlefieldTraceCursor: 0,
      combatEncounterState: createIdleCombatEncounterState(),
    });
    if (typeof store.addGameLog === 'function') {
      store.addGameLog('combat', 'v0.8.0-b1 群像战演武开启', {
        battleId: state.battleId,
        terrain: state.activeTerrainId,
        formation: state.activeFormationId,
        objectives: state.objectives?.map(objective => objective.id) ?? [],
      });
    }
  },

  initBattlefieldLargeGroupDemo: () => {
    const store = get() as any;
    const state = createBattlefieldLargeGroupDemoState(store);
    const actor = getBattlefieldActor(state);
    set({
      battlefieldCombatState: state,
      battlefieldSelectedAction: null,
      battlefieldSelectedTargetCellId: null,
      battlefieldValidation: actor ? listBattlefieldActionTargets(state, { type: 'wait', actorId: actor.id }) : null,
      battlefieldPlaybackSteps: [],
      battlefieldTraceCursor: 0,
      combatEncounterState: createIdleCombatEncounterState(),
    });
    if (typeof store.addGameLog === 'function') {
      store.addGameLog('combat', 'v0.8.0-b1.1 7x5 群像战大阵演武开启', {
        battleId: state.battleId,
        preset: state.gridPresetId,
        cells: state.grid.cells.length,
        terrain: state.activeTerrainId,
        formation: state.activeFormationId,
        objectives: state.objectives?.map(objective => objective.id) ?? [],
      });
    }
  },

  acceptCombatEventCandidate: (candidateId) => {
    const store = get() as any;
    const candidates = Array.isArray(store.flags?.combatEventCandidates) ? store.flags.combatEventCandidates : [];
    const candidate = candidates.find((item: any) => String(item?.id) === String(candidateId));
    if (!candidate) return false;

    const validation = evaluateCombatEncounterEntry(candidate, store);
    if (!validation.valid || !validation.spec) {
      updateCombatCandidateFlags(store, candidateId, {
        engineValidation: 'downgraded',
        validationIssues: validation.blockers,
        entryValidation: validation,
      });
      set({
        combatEncounterState: {
          status: 'candidate',
          spec: validation.spec,
          validation,
          startedTurn: store.turn || 1,
          outcomeSummary: null,
        },
      });
      store.addGameLog?.('combat', `战斗候选降级：${candidate.title}`, {
        candidateId,
        blockers: validation.blockers,
        downgradedTo: validation.downgradedTo,
      });
      return false;
    }

    const state = startBattlefieldForEncounter(store, validation.spec);
    const actor = getBattlefieldActor(state);
    updateCombatCandidateFlags(store, candidateId, {
      engineValidation: 'accepted',
      validationIssues: [],
      entryValidation: validation,
    });
    set((s: any) => ({
      battlefieldCombatState: state,
      battlefieldSelectedAction: null,
      battlefieldSelectedTargetCellId: null,
      battlefieldValidation: actor ? listBattlefieldActionTargets(state, { type: 'wait', actorId: actor.id }) : null,
      battlefieldPlaybackSteps: [],
      battlefieldTraceCursor: 0,
      combatEncounterState: {
        status: 'active',
        spec: validation.spec,
        validation,
        startedTurn: store.turn || validation.spec.createdTurn,
        outcomeSummary: null,
      },
      flags: {
        ...(s.flags || {}),
        activeCombatEncounterId: validation.spec.id,
      },
    }));
    store.addGameLog?.('combat', `剧情战斗入场：${validation.spec.title}`, {
      encounterId: validation.spec.id,
      scale: validation.spec.scale,
      risk: validation.spec.risk,
      enemyHint: validation.spec.enemyHint,
    });
    return true;
  },

  resolveNarrativeCombatOutcome: (result) => finalizeNarrativeBattlefieldEncounter(set, get, result),

  selectBattlefieldActor: (actorId) => {
    const state = get().battlefieldCombatState as BattlefieldCombatState | null;
    if (!state || state.mode !== 'group') return;
    const actor = state.units.find(unit => unit.id === actorId && unit.hp > 0 && (unit.side === 'player' || unit.side === 'ally'));
    if (!actor) return;
    const nextState = { ...state, activeUnitId: actor.id };
    set({
      battlefieldCombatState: nextState,
      battlefieldSelectedAction: null,
      battlefieldSelectedTargetCellId: null,
      battlefieldValidation: listBattlefieldActionTargets(nextState, { type: 'wait', actorId: actor.id }),
    });
  },

  selectBattlefieldAction: (action) => {
    const state = get().battlefieldCombatState as BattlefieldCombatState | null;
    set({
      battlefieldSelectedAction: action,
      battlefieldSelectedTargetCellId: null,
      battlefieldValidation: selectionValidation(state, action),
    });
  },

  selectBattlefieldTarget: (cellId) => {
    const state = get().battlefieldCombatState as BattlefieldCombatState | null;
    const action = get().battlefieldSelectedAction as BattlefieldAction | null;
    set({
      battlefieldSelectedTargetCellId: cellId,
      battlefieldValidation: selectionValidation(state, action, cellId),
    });
  },

  executeSelectedBattlefieldAction: () => {
    const current = get().battlefieldCombatState as BattlefieldCombatState | null;
    const selected = get().battlefieldSelectedAction as BattlefieldAction | null;
    if (!current || !selected) return;

    const targetCellId = get().battlefieldSelectedTargetCellId as string | null;
    const action = targetCellId ? { ...selected, targetCellId } : selected;
    const validation = validateBattlefieldAction(current, action);
    if (!validation.ok) {
      const failure = executeBattlefieldAction(current, action);
      set((s: CombatSlice) => ({
        battlefieldCombatState: failure.state,
        battlefieldValidation: failure.validation,
        battlefieldPlaybackSteps: appendBattlefieldSteps(s.battlefieldPlaybackSteps, failure.steps),
      }));
      return;
    }

    const playerResolution = executeBattlefieldAction(current, action);
    let nextState = playerResolution.state;
    let steps = [...playerResolution.steps];
    if (nextState.mode === 'group' && nextState.phase !== 'ended' && nextState.activeUnitId) {
      // b1 group demo keeps friendly actors interactive until all have acted.
    } else {
      const enemyResolution = resolveEnemyReply(nextState);
      const roundResolution = enemyResolution.state.phase === 'ended'
        ? { state: enemyResolution.state, steps: [] as BattleResolutionStep[] }
        : advanceBattlefieldRound(enemyResolution.state);
      nextState = roundResolution.state;
      steps = [...steps, ...enemyResolution.steps, ...roundResolution.steps];
    }
    const actor = getBattlefieldActor(nextState);
    set((s: CombatSlice) => ({
      battlefieldCombatState: nextState,
      battlefieldSelectedAction: null,
      battlefieldSelectedTargetCellId: null,
      battlefieldValidation: actor ? listBattlefieldActionTargets(nextState, { type: 'wait', actorId: actor.id }) : null,
      battlefieldPlaybackSteps: appendBattlefieldSteps(s.battlefieldPlaybackSteps, steps),
    }));

    const store = get() as any;
    if (nextState.result && typeof store.addGameLog === 'function') {
      store.addGameLog('combat', `v0.8 凡战结算：${nextState.result.reason}`, {
        battleId: nextState.battleId,
        winner: nextState.result.winner,
        roundsTaken: nextState.result.roundsTaken,
      });
    }
    if (nextState.result && (store.combatEncounterState as CombatEncounterState | undefined)?.status === 'active') {
      finalizeNarrativeBattlefieldEncounter(set, get);
    }
  },

  advanceBattlefieldRoundAction: () => {
    const current = get().battlefieldCombatState as BattlefieldCombatState | null;
    if (!current) return;
    const resolution = advanceBattlefieldRound(current);
    const actor = getBattlefieldActor(resolution.state);
    set((s: CombatSlice) => ({
      battlefieldCombatState: resolution.state,
      battlefieldValidation: actor ? listBattlefieldActionTargets(resolution.state, { type: 'wait', actorId: actor.id }) : null,
      battlefieldPlaybackSteps: appendBattlefieldSteps(s.battlefieldPlaybackSteps, resolution.steps),
    }));
  },

  interruptBattlefieldPendingAction: (pendingActionId, reason) => {
    const current = get().battlefieldCombatState as BattlefieldCombatState | null;
    if (!current) return;
    const resolution = interruptPendingBattlefieldAction(current, pendingActionId, reason || 'pending action interrupted');
    set((s: CombatSlice) => ({
      battlefieldCombatState: resolution.state,
      battlefieldValidation: resolution.validation,
      battlefieldPlaybackSteps: appendBattlefieldSteps(s.battlefieldPlaybackSteps, resolution.steps),
    }));
  },

  setBattlefieldTraceCursor: (cursor) => {
    const total = (get().battlefieldPlaybackSteps as BattleResolutionStep[] | undefined)?.length ?? 0;
    set({ battlefieldTraceCursor: Math.max(0, Math.min(total, cursor)) });
  },

  advanceBattlefieldTraceCursor: () => {
    const total = (get().battlefieldPlaybackSteps as BattleResolutionStep[] | undefined)?.length ?? 0;
    const current = Number(get().battlefieldTraceCursor || 0);
    set({ battlefieldTraceCursor: Math.max(0, Math.min(total, current + 1)) });
  },

  closeBattlefieldCombat: () => {
    const current = get().battlefieldCombatState as BattlefieldCombatState | null;
    const store = get() as any;
    const encounter = store.combatEncounterState as CombatEncounterState | null;
    if (encounter?.status === 'active' && encounter.spec) {
      const result = current?.result ? undefined : 'abandoned';
      finalizeNarrativeBattlefieldEncounter(set, get, result);
    }
    if (current && typeof store.addGameLog === 'function') {
      const reason = current.result?.reason ? `，${describeBattlefieldReason(current.result.reason) || current.result.reason}` : '';
      store.addGameLog('combat', `v0.8.0-a2 凡战棋盘关闭${reason}`, { battleId: current.battleId });
    }
    set({
      battlefieldCombatState: null,
      battlefieldSelectedAction: null,
      battlefieldSelectedTargetCellId: null,
      battlefieldValidation: null,
      battlefieldPlaybackSteps: [],
      battlefieldTraceCursor: 0,
    });
  },
});
