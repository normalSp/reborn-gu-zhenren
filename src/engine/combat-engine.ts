/**
 * 决斗引擎核心 — P2-4a纯函数模块
 *
 * 所有函数均无副作用，不依赖Zustand Store，不接触文件系统。
 * 输入(DuelState/玩家行动/config) → 输出(新DuelState/DuelResult)。
 * 可独立单元测试。
 */
import type {
  DuelAction,
  DuelEnemy,
  DuelMove,
  DuelPhase,
  DuelResult,
  DuelState,
  CombatLogEntry,
} from '../types';
import {
  REALM_NUM, toRealmNum, getEffectiveDaoMarks, getRealmCoefficients, getPathMultiplier,
  calcHitRate, calcDamage, rollCrit, rollHit,
  PATH_STATUS_MAP, calcStatusDamage, isStatusDisabled, isConfused, getBlindPenalty, getWeakenDefPenalty, tickStatuses,
  type CombatStatus,
} from './combat-formulas';

/** 生成唯一决斗ID */
function duelId(): string {
  return `duel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── 公开 API ───

/**
 * 初始化决斗状态
 */
export function initDuel(
  player: {
    name: string; realm: string; path: string;
    daoMarks: number | Record<string, number>;
    hp: number; maxHp: number; attack: number; defense: number;
    accuracy?: number; evasion?: number;
    gu: { name: string; path: string; tier: number }[];
    moves: DuelMove[];
  },
  enemy: DuelEnemy,
  /** v0.6.0: 决斗模式 */
  mode: 'lethal' | 'training' = 'lethal',
): DuelState {
  const effectiveDaoMarks = typeof player.daoMarks === 'object'
    ? getEffectiveDaoMarks(player.daoMarks as Record<string, number>, player.path)
    : (player.daoMarks ?? 0);
  // AI模式：优先使用敌人配置的aiMode，默认aggressive
  const aiMode = (enemy as any).aiMode || 'aggressive';
  return {
    duelId: duelId(),
    phase: 'init',
    round: 0,
    mode,
    player: {
      ...player,
      daoMarks: effectiveDaoMarks,
      realmNum: toRealmNum(player.realm),
      accuracy: player.accuracy ?? 70,
      evasion: player.evasion ?? 30,
      statuses: [],
    },
    enemy: {
      ...enemy,
      accuracy: enemy.accuracy ?? 70,
      evasion: enemy.evasion ?? 30,
      statuses: [] as CombatStatus[],
      aiMode: aiMode as any,
    },
    result: null,
    log: [],
    startedAt: Date.now(),
  };
}

/**
 * 执行玩家回合 — 根据行动类型处理，返回新DuelState + 是否触发敌人回合
 */
export function executePlayerTurn(
  state: DuelState,
  action: DuelAction,
  moveIndex?: number,
): { state: DuelState; enemyTurn: boolean } {
  const coeff = getRealmCoefficients(state.player.realmNum, state.enemy.realmNum);
  const newLog = [...state.log];
  const round = state.round + 1;

  // v1.2: 境界碾压不再秒杀——改为大伤害倍率（已在realmCoefficients.table中体现）
  // 高境界方极难被击败但不再是自动获胜，鼓励玩家使用计谋/道具/流派克制

  switch (action) {
    case 'attack': {
      const move = (moveIndex !== undefined && state.player.moves[moveIndex]) ? state.player.moves[moveIndex] : null;
      const moveMult = move ? move.damageMultiplier : 1.0;
      const isCrit = rollCrit();
      const hitRate = calcHitRate(state.player.accuracy, state.enemy.evasion, coeff.playerHitBonus);
      const hit = rollHit(hitRate);

      if (hit) {
        const dmg = calcDamage(
          state.player.attack, state.enemy.defense,
          state.player.path, state.enemy.path,
          coeff.playerDamageMult, moveMult, isCrit,
          state.player.daoMarks, state.enemy.daoMarks,
        );
        // v0.6.0: 应用状态效果
        const newEnemyStatuses = applyStatusOnHit(state.player.path, state.enemy.statuses, state.player.daoMarks);
        const newEnemy = { ...state.enemy, hp: Math.max(0, state.enemy.hp - dmg), statuses: newEnemyStatuses };
        const statusNote = newEnemyStatuses.length > state.enemy.statuses.length ? ` [${PATH_STATUS_MAP[state.player.path]?.type || ''}]` : '';
        newLog.push({
          round, actor: 'player', action: move ? move.name : '普通攻击',
          damage: dmg, hit: true, crit: isCrit,
          message: (isCrit ? `暴击！造成 ${dmg} 点伤害` : `造成 ${dmg} 点伤害`) + statusNote,
        });

        if (newEnemy.hp <= 0) {
          // v0.6.0: 训练模式→KO非致命
          const koHp = state.mode === 'training' ? 1 : 0;
          const finalEnemy = { ...newEnemy, hp: koHp };
          return {
            state: {
              ...state, round, enemy: finalEnemy, log: newLog,
              phase: 'ended',
              result: { winner: 'player', playerFinalHp: state.player.hp, enemyFinalHp: koHp, roundsTaken: round, escaped: false },
            },
            enemyTurn: false,
          };
        }
        return { state: { ...state, round, enemy: newEnemy, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
      } else {
        newLog.push({ round, actor: 'player', action: '攻击', hit: false, message: '攻击未命中' });
        return { state: { ...state, round, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
      }
    }

    case 'defend': {
      const newPlayer = { ...state.player, defense: Math.round(state.player.defense * 1.5) };
      newLog.push({ round, actor: 'player', action: '防御', message: '进入防御姿态，本回合防御力提升50%' });
      return { state: { ...state, round, player: newPlayer, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
    }

    case 'gu_skill': {
      if (moveIndex === undefined || !state.player.moves[moveIndex]) {
        newLog.push({ round, actor: 'player', action: '蛊虫技能', message: '无法使用此技能' });
        return { state: { ...state, round, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
      }
      // v0.6.0: coreGu强制检查
      if (move.requiredCoreGu && move.requiredCoreGu.length > 0) {
        const playerGuNames = state.player.gu.map(g => g.name);
        const missing = move.requiredCoreGu.filter(cg => !playerGuNames.includes(cg));
        if (missing.length > 0) {
          newLog.push({ round, actor: 'player', action: move.name, message: `缺少核心蛊虫: ${missing.join('、')}，无法使用${move.name}` });
          return { state: { ...state, round, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
        }
      }
      // 技能攻击 = attack with move multiplier + path bonus
      const isCrit = rollCrit();
      const hitRate = calcHitRate(state.player.accuracy, state.enemy.evasion, coeff.playerHitBonus + move.pathBonus);
      const hit = rollHit(hitRate);
      if (hit) {
        const dmg = calcDamage(
          state.player.attack, state.enemy.defense,
          state.player.path, state.enemy.path,
          coeff.playerDamageMult, move.damageMultiplier, isCrit,
          state.player.daoMarks, state.enemy.daoMarks,
        );
        const newEnemyStatuses2 = applyStatusOnHit(state.player.path, state.enemy.statuses, state.player.daoMarks);
        const newEnemy2 = { ...state.enemy, hp: Math.max(0, state.enemy.hp - dmg), statuses: newEnemyStatuses2 };
        const statusNote2 = newEnemyStatuses2.length > state.enemy.statuses.length ? ` [${PATH_STATUS_MAP[state.player.path]?.type || ''}]` : '';
        newLog.push({ round, actor: 'player', action: move.name, damage: dmg, hit: true, crit: isCrit, message: (isCrit ? `暴击！${move.name}造成 ${dmg} 点伤害` : `${move.name}造成 ${dmg} 点伤害`) + statusNote2 });
        if (newEnemy2.hp <= 0) {
          const koHp2 = state.mode === 'training' ? 1 : 0;
          const finalEnemy2 = { ...newEnemy2, hp: koHp2 };
          return {
            state: { ...state, round, enemy: finalEnemy2, log: newLog, phase: 'ended', result: { winner: 'player', playerFinalHp: state.player.hp, enemyFinalHp: koHp2, roundsTaken: round, escaped: false } },
            enemyTurn: false,
          };
        }
        return { state: { ...state, round, enemy: newEnemy2, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
      } else {
        newLog.push({ round, actor: 'player', action: move.name, hit: false, message: `${move.name}未命中` });
        return { state: { ...state, round, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
      }
    }

    case 'escape': {
      return tryEscape(state, coeff, newLog, round);
    }

    case 'surrender': {
      newLog.push({ round, actor: 'player', action: '投降', message: '你选择投降，退出战斗' });
      return {
        state: {
          ...state, round, log: newLog, phase: 'ended',
          result: { winner: 'enemy', playerFinalHp: state.player.hp, enemyFinalHp: state.enemy.hp, roundsTaken: round, escaped: true },
        },
        enemyTurn: false,
      };
    }

    default:
      return { state: { ...state, round, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
  }
}

/** v0.6.0: 状态效果应用辅助 — 攻击命中时按流派概率触发状态 */
function applyStatusOnHit(
  attackerPath: string,
  targetStatuses: CombatStatus[],
  attackerDaoMarks: number,
): CombatStatus[] {
  const config = PATH_STATUS_MAP[attackerPath];
  if (!config) return targetStatuses;
  const chance = config.baseChance + attackerDaoMarks * 0.0005; // 每200道痕+0.1概率
  if (Math.random() < Math.min(0.5, chance)) {
    const duration = 2 + Math.floor(attackerDaoMarks / 500); // 每500道痕+1回合
    return [...targetStatuses, { type: config.type, remainingTurns: Math.min(6, duration), potency: config.basePotency }];
  }
  return targetStatuses;
}

/** 敌人回合内部逻辑 (v1.2: 移除oneshot参数，统一走正常伤害计算) */
function executeEnemyTurnInternal(
  state: DuelState,
  coeff: ReturnType<typeof getRealmCoefficients>,
  log: CombatLogEntry[],
  round: number,
): DuelState {
  // v0.6.0: AI行为模式
  const aiMode = (state.enemy as any).aiMode || 'aggressive';
  const enemyHpPct = state.enemy.hp / state.enemy.maxHp;
  // coward模式：低血量有逃跑概率
  if (aiMode === 'coward' && enemyHpPct < 0.4 && Math.random() < 0.5) {
    log.push({ round, actor: 'enemy', action: '逃跑', hit: false, message: `${state.enemy.name}仓皇逃窜！` });
    return { ...state, round, log, phase: 'ended', result: { winner: 'player', playerFinalHp: state.player.hp, enemyFinalHp: state.enemy.hp, roundsTaken: round, escaped: true } };
  }
  // defensive模式：HP<70%时优先防御（跳过攻击回合），但每3回合至少攻击1次
  if (aiMode === 'defensive' && enemyHpPct < 0.7 && round % 3 !== 0) {
    log.push({ round, actor: 'enemy', action: '防御', message: `${state.enemy.name}转入防御姿态` });
    return { ...state, round, log, player: state.player, phase: 'player_turn' };
  }
  const enemyMove = state.enemy.moves.length > 0
    ? state.enemy.moves[Math.floor(Math.random() * state.enemy.moves.length)]
    : null;
  const moveMult = enemyMove ? enemyMove.damageMultiplier : 1.0;
  const isCrit = rollCrit();
  // v1.2: 境界碾压下 crit 特殊处理——高境界方对低境界方暴击率翻倍（象征性碾压）
  const realmDiff = state.enemy.realmNum - state.player.realmNum;
  const overwhelmThreshold = config.realmCoefficients?.overwhelmThreshold ?? 2;
  const isOverwhelm = realmDiff >= overwhelmThreshold;
  const effectiveIsCrit = isCrit || (isOverwhelm && rollCrit()); // 境界碾压时双倍暴击判定
  const critMult = effectiveIsCrit ? (C.critRate?.multiplier ?? 1.5) : 1.0;

  const hitRate = calcHitRate(state.enemy.accuracy, state.player.defense > state.player.attack ? state.player.evasion + 10 : state.player.evasion, coeff.enemyHitPenalty);
  const hit = rollHit(hitRate);

  if (hit) {
    const dmg = calcDamage(
      state.enemy.attack, state.player.defense,
      state.enemy.path, state.player.path,
      coeff.enemyDamageMult, moveMult, effectiveIsCrit,
      state.enemy.daoMarks, state.player.daoMarks,
    );
    const overwhelmNote = isOverwhelm ? '【境界碾压】' : '';
    const newPlayer = { ...state.player, hp: Math.max(0, state.player.hp - dmg), defense: state.player.defense };
    log.push({ round, actor: 'enemy', action: enemyMove ? enemyMove.name : '普通攻击', damage: dmg, hit: true, crit: effectiveIsCrit, message: effectiveIsCrit ? `${overwhelmNote}暴击！${state.enemy.name}造成 ${dmg} 点伤害` : `${overwhelmNote}${state.enemy.name}造成 ${dmg} 点伤害` });

    if (newPlayer.hp <= 0) {
      return {
        ...state, round, player: newPlayer, log,
        phase: 'ended',
        result: { winner: 'enemy', playerFinalHp: 0, enemyFinalHp: state.enemy.hp, roundsTaken: round, escaped: false },
      };
    }
    return { ...state, round, player: newPlayer, log, phase: 'player_turn' };
  } else {
    log.push({ round, actor: 'enemy', action: '攻击', hit: false, message: `${state.enemy.name}的攻击未能命中` });
    return { ...state, round, log, phase: 'player_turn' };
  }
}

/** 执行敌人回合 (v1.2: 移除oneshot逻辑) */
export function executeEnemyTurn(state: DuelState): DuelState {
  const coeff = getRealmCoefficients(state.player.realmNum, state.enemy.realmNum);
  return executeEnemyTurnInternal(state, coeff, [...state.log], state.round);
}

/**
 * 逃跑判定
 */
export function tryEscape(
  state: DuelState,
  coeff: ReturnType<typeof getRealmCoefficients>,
  log: CombatLogEntry[],
  round: number,
): { state: DuelState; enemyTurn: boolean } {
  const realmDiff = state.enemy.realmNum - state.player.realmNum;
  const overwhelmThreshold = config.realmCoefficients?.overwhelmThreshold ?? 2;

  // v1.2: 境界碾压时逃跑不再完全禁止，但基础概率降低30%
  const escapePenalty = (realmDiff > 0 && realmDiff >= overwhelmThreshold) ? -0.30 : 0;

  const baseChance = C.escape?.baseChance ?? 0.5;
  const levelBonus = C.escape?.levelBonus ?? 0.1;
  const escapeChance = Math.max(0.05, baseChance + (state.player.realmNum - state.enemy.realmNum) * levelBonus + escapePenalty);
  const escaped = Math.random() < escapeChance;

  if (escaped) {
    log.push({ round, actor: 'player', action: '逃跑', message: '逃跑成功！你脱离了战斗' });
    return {
      state: {
        ...state, round, log,
        phase: 'ended',
        result: { winner: null, special: 'escaped', playerFinalHp: state.player.hp, enemyFinalHp: state.enemy.hp, roundsTaken: round, escaped: true },
      },
      enemyTurn: false,
    };
  } else {
    log.push({ round, actor: 'player', action: '逃跑', message: '逃跑失败！' });
    return { state: { ...state, round, log, phase: 'enemy_turn' }, enemyTurn: true };
  }
}

/**
 * 创建决斗用敌人（从简版EnemyState + 额外字段） 
 */
export function createDuelEnemy(overrides: Partial<DuelEnemy> & { name: string; realm: string; hp: number; attack: number; path: string }): DuelEnemy {
  return {
    name: overrides.name,
    realm: overrides.realm,
    realmNum: toRealmNum(overrides.realm),
    hp: overrides.hp,
    maxHp: overrides.maxHp ?? overrides.hp,
    attack: overrides.attack,
    defense: overrides.defense ?? Math.round(overrides.attack * 0.4),
    accuracy: overrides.accuracy ?? (C.accuracy?.base ?? 70),
    evasion: overrides.evasion ?? (C.evasion?.base ?? 30),
    path: overrides.path,
    daoMarks: overrides.daoMarks ?? 0,
    gu: overrides.gu ?? [],
    moves: overrides.moves ?? [],
  };
}
