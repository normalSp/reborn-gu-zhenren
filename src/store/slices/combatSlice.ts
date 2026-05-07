/**
 * 战斗 Slice — P2-4a决斗引擎状态管理 + v0.7.0小队战斗
 * 薄切片设计：仅做状态读写，计算逻辑全部委托combat-engine / squad-combat-engine
 */
import type { DuelAction, DuelEnemy, DuelMove, DuelState, SquadCombatState, SquadMemberCombat, SquadEnemy, SquadAction } from '../../types';
import { initDuel, executePlayerTurn, executeEnemyTurn } from '../../engine/combat-engine';
import { initSquadDuel as engineInitSquadDuel, executeSquadTurn as engineExecuteSquadTurn } from '../../engine/squad-combat-engine';
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

  initDuel: (player, enemy) => {
    const state = initDuel(player, enemy);
    // 初始阶段直接进入玩家回合
    state.phase = 'player_turn';
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
        const enemyPath = state.enemy.path || '通用';
        const enemyTier = parseInt(state.enemy.realm) || 1;
        const lootCount = Math.max(1, Math.floor(enemyTier * (1 + Math.random() * 2)));
        const matName = `${enemyPath}蛊材`;
        if (typeof fullStore.addMaterial === 'function') {
          fullStore.addMaterial(matName, lootCount);
        }
        if (typeof fullStore.addGameLog === 'function') {
          fullStore.addGameLog('combat', `战斗胜利！获得 ${matName}×${lootCount}`, {
            material: matName, count: lootCount, enemyName: state.enemy.name,
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
      set({ duelState: s.state });
      if (s.enemyTurn && s.state.phase === 'enemy_turn') {
        const afterEnemy = executeEnemyTurn(s.state);
        set({ duelState: afterEnemy });
      }
      return;
    }
    if (current.phase !== 'player_turn') return;

    const { state: newState, enemyTurn } = executePlayerTurn(current, action, moveIndex);
    set({ duelState: newState });

    // 如果触发敌人回合，自动执行
    if (enemyTurn && newState.phase === 'enemy_turn') {
      const afterEnemy = executeEnemyTurn(newState);
      set({ duelState: afterEnemy });
    }
  },

  executeEnemyTurnAction: () => {
    const current = get().duelState as DuelState | null;
    if (!current || current.phase !== 'enemy_turn') return;

    const newState = executeEnemyTurn(current);
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
    set({ squadCombatState: resolved });
  },

  endSquadDuel: () => {
    set({ squadCombatState: null });
  },
});
