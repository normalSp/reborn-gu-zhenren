/**
 * 战斗 Slice — P2-4a决斗引擎状态管理 + v0.7.0小队战斗
 * 薄切片设计：仅做状态读写，计算逻辑全部委托combat-engine / squad-combat-engine
 */
import type { BattleTraceEntry, DuelAction, DuelEnemy, DuelMove, DuelState, KillMove, SquadCombatState, SquadMemberCombat, SquadEnemy, SquadAction } from '../../types';
import { initDuel, executePlayerTurn, executeEnemyTurn } from '../../engine/combat-engine';
import { initSquadDuel as engineInitSquadDuel, executeSquadTurn as engineExecuteSquadTurn } from '../../engine/squad-combat-engine';
import { convertKillMoveToDuelMove } from '../../engine/killmove-bridge';
import { toRealmNum } from '../../engine/combat-formulas';
import { getMaterialRegistryEntries } from '../../engine/material-registry';
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
    }
    set(updates);
  },

  endSquadDuel: () => {
    set({ squadCombatState: null });
  },
});
