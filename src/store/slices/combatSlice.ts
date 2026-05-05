/**
 * 战斗 Slice — P2-4a决斗引擎状态管理
 * 薄切片设计：仅做状态读写，计算逻辑全部委托combat-engine
 */
import type { DuelAction, DuelEnemy, DuelMove, DuelState } from '../../types';
import { initDuel, executePlayerTurn, executeEnemyTurn } from '../../engine/combat-engine';
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
    gu: { name: string; path: string; tier: number }[];
    moves: DuelMove[];
  }, enemy: DuelEnemy) => void;

  /** 结束决斗（清理状态） */
  endDuel: () => void;

  /** 玩家执行行动 */
  executePlayerAction: (action: DuelAction, moveIndex?: number) => void;

  /** 执行敌人回合（自动） */
  executeEnemyTurnAction: () => void;
}

export const createCombatSlice = (set: any, get: any): CombatSlice => ({
  duelState: null,
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

      // P2-P8-4: 敌方蛊虫90%销毁概率（原著：蛊师临死前常自爆蛊虫防止落入敌手）
      if (state.result.winner === 'player') {
        const enemyGuCount = state.enemy.gu?.length || 0;
        const destroyed = Math.floor(enemyGuCount * 0.9);
        const survived = enemyGuCount - destroyed;
        console.log(`[Combat] 战斗胜利！敌方${enemyGuCount}只蛊虫中，${destroyed}只在临死前自爆销毁，${survived}只可能落入手中`);

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
});
