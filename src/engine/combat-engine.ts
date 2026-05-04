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
import combatConfigRaw from '../canon/combat-config.json';

const config = combatConfigRaw as any;
const realmTable: Record<string, { playerDamageMult: number; playerHitBonus: number; enemyDamageMult: number; enemyHitPenalty: number }> = config.realmCoefficients?.table || {};
const pathMatrix: Record<string, Record<string, number>> = config.pathMatrix?.matrix || {};
const C = config.constants || {};

/** 生成唯一决斗ID */
function duelId(): string {
  return `duel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 境界名称 → 数值映射 */
const REALM_NUM: Record<string, number> = {
  '凡人': 0, '一转': 1, '二转': 2, '三转': 3, '四转': 4, '五转': 5, '六转': 6, '七转': 7, '八转': 8, '九转': 9,
  '一转蛊师': 1, '二转蛊师': 2, '三转蛊师': 3, '四转蛊师': 4, '五转蛊师': 5, '蛊仙': 6, '六转蛊仙': 6, '七转蛊仙': 7, '八转蛊仙': 8,
};

function toRealmNum(realm: string): number {
  return REALM_NUM[realm] ?? 1;
}

/**
 * 获取境界修正系数
 * realmDiff = 敌方境界 - 玩家境界
 */
function getRealmCoefficients(playerRealmNum: number, enemyRealmNum: number) {
  const diff = enemyRealmNum - playerRealmNum;
  const key = String(Math.max(-3, Math.min(3, diff)));
  return realmTable[key] || realmTable['0'];
}

/**
 * 流派克制系数
 */
function getPathMultiplier(attackerPath: string, defenderPath: string): number {
  const row = pathMatrix[attackerPath];
  if (!row) return 1.0;
  return row[defenderPath] ?? 1.0;
}

/**
 * 计算命中率
 */
function calcHitRate(baseAccuracy: number, baseEvasion: number, hitBonus: number): number {
  const accuracy = baseAccuracy + hitBonus;
  const evasion = baseEvasion;
  let rate = accuracy / (accuracy + evasion);
  return Math.max(0.1, Math.min(0.95, rate));
}

/**
 * 计算伤害
 * damage = (ATK - DEF×0.5) × pathMult × realmMult × moveMult × daoMarkMult × crit(1.5 or 1.0) × variance(0.85~1.15)
 * daoMarkMult: 道痕战力倍率 — 每100道痕+10%伤害，上限200% (2000道痕)
 * 道痕公式: 1.0 + (daoMarks / 1000)，上限3.0
 */
function calcDamage(
  attackerAtk: number,
  defenderDef: number,
  attackerPath: string,
  defenderPath: string,
  realmMult: number,
  moveMult: number,
  isCrit: boolean,
  /** P2-P7: 攻击方道痕数 — 同一流派道痕越多伤害越高 */
  attackerDaoMarks: number = 0,
  /** P2-P7: 防守方道痕数 — 道痕可提供部分防御加成 */
  defenderDaoMarks: number = 0,
): number {
  const defFactor = C.defenseFactor?.value ?? 0.5;
  const baseMin = C.baseVariance?.min ?? 0.85;
  const baseMax = C.baseVariance?.max ?? 1.15;
  const critMult = isCrit ? (C.critRate?.multiplier ?? 1.5) : 1.0;
  const minDmg = C.minDamage?.value ?? 1;

  // 道痕因子：攻击方道痕增伤，防守方道痕减伤
  // v1.3: 除数从1000→10000，匹配原著标度(八转巅峰=30万道痕≈3.0倍)
  const attackDaoMult = 1.0 + (attackerDaoMarks / 10000);
  const defenseDaoMult = 1.0 - (defenderDaoMarks / 20000);  // 防守道痕减伤减半强度
  const daoMarkMult = Math.max(0.5, Math.min(3.0, attackDaoMult * defenseDaoMult));

  const raw = attackerAtk - defenderDef * defFactor;
  const pathMult = getPathMultiplier(attackerPath, defenderPath);
  const variance = baseMin + Math.random() * (baseMax - baseMin);

  const dmg = raw * pathMult * realmMult * moveMult * daoMarkMult * critMult * variance;
  return Math.max(minDmg, Math.round(dmg));
}

/** 判断是否暴击 */
function rollCrit(): boolean {
  return Math.random() < (C.critRate?.base ?? 0.05);
}

/** 判断是否命中 */
function rollHit(hitRate: number): boolean {
  return Math.random() < hitRate;
}

// ─── 公开 API ───

/**
 * 初始化决斗状态
 */
export function initDuel(
  player: {
    name: string; realm: string; path: string;
    daoMarks: number;
    hp: number; maxHp: number; attack: number; defense: number;
    accuracy?: number; evasion?: number;
    gu: { name: string; path: string; tier: number }[];
    moves: DuelMove[];
  },
  enemy: DuelEnemy,
): DuelState {
  return {
    duelId: duelId(),
    phase: 'init',
    round: 0,
    player: {
      ...player,
      daoMarks: player.daoMarks ?? 0,
      realmNum: toRealmNum(player.realm),
      accuracy: player.accuracy ?? (C.accuracy?.base ?? 70),
      evasion: player.evasion ?? (C.evasion?.base ?? 30),
    },
    enemy: {
      ...enemy,
      accuracy: enemy.accuracy ?? (C.accuracy?.base ?? 70),
      evasion: enemy.evasion ?? (C.evasion?.base ?? 30),
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
        const newEnemy = { ...state.enemy, hp: Math.max(0, state.enemy.hp - dmg) };
        newLog.push({
          round, actor: 'player', action: move ? move.name : '普通攻击',
          damage: dmg, hit: true, crit: isCrit,
          message: isCrit ? `暴击！造成 ${dmg} 点伤害` : `造成 ${dmg} 点伤害`,
        });

        if (newEnemy.hp <= 0) {
          return {
            state: {
              ...state, round, enemy: newEnemy, log: newLog,
              phase: 'ended',
              result: { winner: 'player', playerFinalHp: state.player.hp, enemyFinalHp: 0, roundsTaken: round, escaped: false },
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
      // 技能攻击 = attack with move multiplier + path bonus
      const move = state.player.moves[moveIndex];
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
        const newEnemy = { ...state.enemy, hp: Math.max(0, state.enemy.hp - dmg) };
        newLog.push({ round, actor: 'player', action: move.name, damage: dmg, hit: true, crit: isCrit, message: isCrit ? `暴击！${move.name}造成 ${dmg} 点伤害` : `${move.name}造成 ${dmg} 点伤害` });
        if (newEnemy.hp <= 0) {
          return {
            state: {
              ...state, round, enemy: newEnemy, log: newLog,
              phase: 'ended',
              result: { winner: 'player', playerFinalHp: state.player.hp, enemyFinalHp: 0, roundsTaken: round, escaped: false },
            },
            enemyTurn: false,
          };
        }
        return { state: { ...state, round, enemy: newEnemy, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
      } else {
        newLog.push({ round, actor: 'player', action: move.name, hit: false, message: `${move.name}未命中` });
        return { state: { ...state, round, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
      }
    }

    case 'escape': {
      return tryEscape(state, coeff, newLog, round);
    }

    default:
      return { state: { ...state, round, log: newLog, phase: 'enemy_turn' }, enemyTurn: true };
  }
}

/** 敌人回合内部逻辑 (v1.2: 移除oneshot参数，统一走正常伤害计算) */
function executeEnemyTurnInternal(
  state: DuelState,
  coeff: ReturnType<typeof getRealmCoefficients>,
  log: CombatLogEntry[],
  round: number,
): DuelState {
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
