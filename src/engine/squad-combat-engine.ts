/**
 * ═══ v0.7.0 小队战斗引擎 — squad-combat-engine.ts ═══
 * 设计大纲§1.4.2: 回合制速度排序 + 目标选择AI + 战术姿态加成 + 友方治疗 + 连携攻击
 * 所有函数为纯函数——无副作用、无store依赖，复用combat-formulas.ts共享公式层。
 */
import type {
  SquadCombatState, SquadMemberCombat, SquadEnemy,
  SquadAction, CombatLogEntry,
} from '../types';
import {
  calcDamage, calcHitRate, rollHit, rollCrit,
  getPathMultiplier, getRealmCoefficients, getBlindPenalty,
  getWeakenDefPenalty, isStatusDisabled, isConfused,
  calcStatusDamage, tickStatuses,
  REALM_NUM, toRealmNum,
} from './combat-formulas';
import type { CombatStatus } from './combat-formulas';

// ─── 常量 ───

/** 战术姿态加成系数 — 设计大纲§1.4.1 */
export const FORMATION_BONUS: Record<string, {
  damageBonus: number;
  defenseBonus: number;
  speedBonus: number;
  special: string;
}> = {
  '合击': { damageBonus: 0.15, defenseBonus: 0, speedBonus: 0, special: '两人攻击同一目标+15%伤害' },
  '牵制': { damageBonus: 0, defenseBonus: 0.10, speedBonus: 0, special: '牵制最强敌人使其闪避-20%' },
  '掠阵': { damageBonus: 0, defenseBonus: 0.05, speedBonus: 0, special: '每回合自动恢复最低HP队友5%HP' },
  '斩首': { damageBonus: 0.10, defenseBonus: 0, speedBonus: 0.05, special: '首击暴击率+10%,优先集火最弱敌人' },
};

/** 阵型默认士气/配合度 */
const DEFAULT_MORALE = 50;
const DEFAULT_COORDINATION = 50;
const MIN_DAMAGE = 1;

// ─── 速度排序 ───

/** 计算单位行动速度（用于回合排序） */
function getSpeed(unit: { atk: number; def: number; realm: number }, formationBonus: number): number {
  return unit.atk * 0.6 + unit.def * 0.3 + unit.realm * 0.1 + formationBonus * 10;
}

// ─── 战术姿态加成 ───

/** 计算战术姿态对伤害的加成系数 */
export function calcFormationBonus(formation: SquadCombatState['formation']): number {
  return FORMATION_BONUS[formation]?.damageBonus ?? 0;
}

/** 計算戰术姿态对速度的加成 */
export function calcFormationSpeedBonus(formation: SquadCombatState['formation']): number {
  return FORMATION_BONUS[formation]?.speedBonus ?? 0;
}

// ─── 士气系统 ───

/** 士气对伤害的修正：士气0-100映射到-20% ~ +20% */
export function applyMoraleEffect(baseDamage: number, morale: number): number {
  const modifier = ((morale - 50) / 50) * 0.20; // -0.20 ~ +0.20
  return Math.round(baseDamage * (1 + modifier));
}

/** 士气对命中率的影响：低士气降低命中 */
export function applyMoraleHitPenalty(morale: number): number {
  if (morale >= 60) return 0;
  return (60 - morale) * 0.003; // 最高-0.12
}

// ─── 配合度/连携 ───

/** 配合度对连携概率的影响 */
function calcCoordinationChance(coordination: number): number {
  return Math.min(0.50, coordination / 200); // 配合度100→50%连携概率
}

// ─── AI 目标选择 ───

/** 敌方单位选择攻击目标（按性格/AI模式） */
function selectEnemyTarget(
  enemy: SquadEnemy,
  members: SquadMemberCombat[],
): number {
  const alive = members.filter(m => m.hp > 0);
  if (alive.length === 0) return 0;

  switch (enemy.aiMode) {
    case 'aggressive':
      // 优先攻击HP最低的
      return members.indexOf(alive.reduce((min, m) => m.hp < min.hp ? m : min, alive[0]));
    case 'defensive':
      // 优先攻击威胁最大的（ATK最高）
      return members.indexOf(alive.reduce((max, m) => m.atk > max.atk ? m : max, alive[0]));
    case 'coward':
      // 优先攻击已受伤的
      return members.indexOf(alive.reduce((min, m) => (m.hp / m.maxHp) < (min.hp / min.maxHp) ? m : min, alive[0]));
    case 'balanced':
    default:
      // 随机目标
      return members.indexOf(alive[Math.floor(Math.random() * alive.length)]);
  }
}

/** 敌方单位选择行动 */
function selectEnemyAction(enemy: SquadEnemy, members: SquadMemberCombat[]): SquadAction {
  const targetIdx = selectEnemyTarget(enemy, members);
  // 5%概率使用防御
  if (Math.random() < 0.05 && enemy.aiMode !== 'aggressive') {
    return { type: 'defend' };
  }
  return { type: 'attack', targetIndex: targetIdx };
}

// ─── 性格驱动的友方行动 ───

/** 根据队员性格生成默认行动 */
function selectMemberDefaultAction(
  member: SquadMemberCombat,
  allies: SquadMemberCombat[],
  enemies: SquadEnemy[],
): SquadAction {
  const aliveEnemies = enemies.filter(e => e.hp > 0);
  if (aliveEnemies.length === 0) return { type: 'defend' };

  switch (member.personality) {
    case 'loyal': {
      // 忠诚：优先保护玩家（memberId最小的盟友）
      const player = allies.find(a => a.hp > 0);
      if (player && player.hp < player.maxHp * 0.5) {
        return { type: 'defend' }; // 防守姿态保护
      }
      return { type: 'attack', targetIndex: enemies.indexOf(aliveEnemies[0]) };
    }
    case 'cunning':
      // 狡诈：优先攻击最弱的敌人
      return {
        type: 'attack',
        targetIndex: enemies.indexOf(aliveEnemies.reduce((min, e) => e.hp < min.hp ? e : min, aliveEnemies[0])),
      };
    case 'reckless':
      // 莽撞：优先攻击最强的敌人
      return {
        type: 'attack',
        targetIndex: enemies.indexOf(aliveEnemies.reduce((max, e) => e.atk > max.atk ? e : max, aliveEnemies[0])),
      };
    case 'cautious':
      // 谨慎：自身HP<50%时防守
      if (member.hp < member.maxHp * 0.5) return { type: 'defend' };
      return { type: 'attack', targetIndex: enemies.indexOf(aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]) };
    case 'selfless': {
      // 无私：优先治疗受伤最重的队友
      const injured = allies.filter(a => a.hp > 0 && a.hp < a.maxHp).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
      if (injured.length > 0 && injured[0].memberId !== member.memberId) {
        return { type: 'gu_skill', moveId: 'heal', targetIndex: allies.indexOf(injured[0]) };
      }
      return { type: 'attack', targetIndex: enemies.indexOf(aliveEnemies[0]) };
    }
    default:
      return { type: 'attack', targetIndex: enemies.indexOf(aliveEnemies[0]) };
  }
}

// ─── 伤害计算（squad版） ───

interface AttackResult {
  damage: number;
  hit: boolean;
  crit: boolean;
  message: string;
}

function computeSquadAttack(
  attacker: SquadMemberCombat | SquadEnemy,
  defender: SquadMemberCombat | SquadEnemy,
  formationBonus: number,
  morale: number,
  coordination: number,
  isCombo: boolean,
): AttackResult {
  const realmMult = getRealmCoefficients(
    REALM_NUM[`${attacker.realm}转`] ?? attacker.realm,
    REALM_NUM[`${defender.realm}转`] ?? defender.realm,
  ).playerDamageMult || 1.0;

  const pathMult = getPathMultiplier(attacker.path, defender.path);
  const moveMult = 1.0; // 基础攻击，非杀招
  const hitBonus = -getBlindPenalty(('statuses' in attacker ? (attacker as any).statuses : []));
  const hitRate = calcHitRate(attacker.atk, defender.def, hitBonus) - applyMoraleHitPenalty(morale);
  const hit = rollHit(hitRate);
  if (!hit) {
    return { damage: 0, hit: false, crit: false, message: 'miss' };
  }

  const crit = rollCrit() || (formationBonus > 0.05 && isCombo && Math.random() < 0.10); // 斩首首击+10%暴击
  const dmg = calcDamage(
    attacker.atk, defender.def,
    attacker.path, defender.path,
    realmMult, moveMult, crit,
    0, 0,
  );

  // 战术姿态加成
  const withFormation = Math.round(dmg * (1 + formationBonus));
  // 士气修正
  const withMorale = applyMoraleEffect(withFormation, morale);

  return {
    damage: Math.max(MIN_DAMAGE, withMorale),
    hit: true,
    crit,
    message: crit ? `暴击! ${withMorale}点伤害` : `${withMorale}点伤害`,
  };
}

// ─── 治疗逻辑 ───

function computeHeal(healer: SquadMemberCombat, target: SquadMemberCombat): { healAmount: number; message: string } {
  const healBase = Math.floor(healer.atk * 0.3); // 治疗量基于ATK的30%
  const healPct = Math.floor(target.maxHp * 0.15); // 至少恢复15%最大HP
  const healAmount = Math.max(healBase, healPct);
  return {
    healAmount: Math.min(healAmount, target.maxHp - target.hp),
    message: `恢复${healAmount}HP`,
  };
}

// ─── 核心回合处理 ───

/** 处理单次攻击行动 */
function processAttackAction(
  action: SquadAction & { type: 'attack' },
  attacker: SquadMemberCombat | SquadEnemy,
  defenders: (SquadMemberCombat | SquadEnemy)[],
  formationBonus: number,
  morale: number,
  coordination: number,
  isCombo: boolean,
  round: number,
): { defender: SquadMemberCombat | SquadEnemy; log: CombatLogEntry } | null {
  if (action.targetIndex < 0 || action.targetIndex >= defenders.length) return null;
  const defender = defenders[action.targetIndex];
  if (defender.hp <= 0) return null;

  const result = computeSquadAttack(attacker, defender, formationBonus, morale, coordination, isCombo);
  const newHp = Math.max(0, defender.hp - result.damage);

  return {
    defender: { ...defender, hp: newHp },
    log: {
      round,
      actor: 'player',
      action: result.hit ? (result.crit ? '暴击' : '攻击') : 'miss',
      damage: result.damage,
      hit: result.hit,
      crit: result.crit,
      message: `${attacker.name} 对 ${defender.name} ${result.message}`,
    },
  };
}

// ─── 公开API ───

/** 初始化小队战斗 */
export function initSquadDuel(
  squadId: string,
  members: SquadMemberCombat[],
  enemies: SquadEnemy[],
  formation: SquadCombatState['formation'] = '牵制',
  morale: number = DEFAULT_MORALE,
  coordination: number = DEFAULT_COORDINATION,
): SquadCombatState {
  return {
    squadId,
    phase: 'deploy',
    round: 1,
    formation,
    morale: Math.max(0, Math.min(100, morale)),
    coordination: Math.max(0, Math.min(100, coordination)),
    members: members.map(m => ({ ...m, hp: m.maxHp, statuses: [], action: null })),
    enemies: enemies.map(e => ({ ...e, hp: e.maxHp, statuses: [], aiMode: e.aiMode || 'balanced' })),
    log: [],
  };
}

/** 检查战斗是否结束 */
export function checkSquadEnd(state: SquadCombatState): 'player_win' | 'enemy_win' | 'ongoing' {
  const allMembersDead = state.members.every(m => m.hp <= 0);
  const allEnemiesDead = state.enemies.every(e => e.hp <= 0);
  if (allMembersDead) return 'enemy_win';
  if (allEnemiesDead) return 'player_win';
  return 'ongoing';
}

/** 处理掠阵效果：每回合自动恢复HP最低的队友5%HP */
function applyFlankSupport(state: SquadCombatState): SquadCombatState {
  if (state.formation !== '掠阵') return state;

  const aliveMembers = state.members.filter(m => m.hp > 0);
  if (aliveMembers.length === 0) return state;

  const lowestHp = aliveMembers.reduce((min, m) =>
    (m.hp / m.maxHp) < (min.hp / min.maxHp) ? m : min, aliveMembers[0]);
  const healAmount = Math.floor(lowestHp.maxHp * 0.05);

  if (healAmount <= 0) return state;

  const newMembers = state.members.map(m =>
    m.memberId === lowestHp.memberId
      ? { ...m, hp: Math.min(m.maxHp, m.hp + healAmount) }
      : m,
  );

  return {
    ...state,
    members: newMembers,
    log: [...state.log, {
      round: state.round,
      actor: 'player',
      action: '掠阵恢复',
      damage: healAmount,
      hit: true,
      crit: false,
      message: `掠阵: ${lowestHp.name} 恢复 ${healAmount}HP`,
    }],
  };
}

/** 处理牵制效果：敌方最强单位闪避-20% */
function applyPinningEffect(state: SquadCombatState, enemyIndex: number): SquadEnemy {
  const enemy = state.enemies[enemyIndex];
  // 牵制通过降低def来模拟闪避降低（防守能力下降）
  return {
    ...enemy,
    def: Math.floor(enemy.def * 0.80),
    statuses: [...enemy.statuses, { type: 'weaken', remainingTurns: 1, potency: 1 }],
  };
}

/**
 * 执行一个回合
 * @param state 当前战斗状态
 * @param playerActions 玩家为每位队员选择的行动
 * @returns 更新后的战斗状态
 */
export function executeSquadTurn(
  state: SquadCombatState,
  playerActions: SquadAction[],
): SquadCombatState {
  // 1. 为敌方生成AI行动
  const enemyActions: SquadAction[] = state.enemies
    .filter(e => e.hp > 0)
    .map(e => selectEnemyAction(e, state.members));

  // 2. 速度排序：我方+敌方混排
  const formationSpeedBonus = calcFormationSpeedBonus(state.formation);
  interface TurnOrder {
    type: 'member' | 'enemy';
    index: number;
    speed: number;
  }
  const turnOrder: TurnOrder[] = [
    ...state.members.filter(m => m.hp > 0).map((m, i) => ({
      type: 'member' as const, index: i, speed: getSpeed(m, formationSpeedBonus),
    })),
    ...state.enemies.filter(e => e.hp > 0).map((e, i) => ({
      type: 'enemy' as const, index: i, speed: getSpeed(e, 0),
    })),
  ].sort((a, b) => b.speed - a.speed);

  // 3. 处理连携（合击加成）：检测同目标攻击
  const coordinationChance = calcCoordinationChance(state.coordination);
  const targetCounts = new Map<number, number>();
  for (const [i, a] of playerActions.entries()) {
    if (a.type === 'attack') targetCounts.set(a.targetIndex, (targetCounts.get(a.targetIndex) || 0) + 1);
  }
  const comboTargets = new Set<number>();
  for (const [targetIdx, count] of targetCounts) {
    if (count >= 2 && Math.random() < coordinationChance) comboTargets.add(targetIdx);
  }

  // 4. 按速度顺序执行行动
  let currentMembers = [...state.members];
  let currentEnemies = [...state.enemies];
  const newLog: CombatLogEntry[] = [...state.log];

  for (const actor of turnOrder) {
    if (actor.type === 'member') {
      const member = currentMembers[actor.index];
      if (member.hp <= 0) continue;
      const action = playerActions[actor.index] || selectMemberDefaultAction(member, currentMembers, currentEnemies);

      // 状态检测：混乱可能打自己人
      const confused = isConfused(member.statuses);
      const disabled = isStatusDisabled(member.statuses);

      if (disabled) {
        newLog.push({ round: state.round, actor: 'player', action: '硬直', message: `${member.name} 无法行动` });
        continue;
      }

      if (action.type === 'attack') {
        let targetIdx = action.targetIndex;
        if (confused) {
          // 混乱：随机攻击（包括队友）
          const allTargets = [...currentEnemies.filter(e => e.hp > 0), ...currentMembers.filter(m => m.hp > 0 && m.memberId !== member.memberId)];
          if (allTargets.length > 0) {
            const randomTarget = allTargets[Math.floor(Math.random() * allTargets.length)];
            targetIdx = 'memberId' in randomTarget
              ? currentMembers.indexOf(randomTarget as SquadMemberCombat)
              : currentEnemies.indexOf(randomTarget as SquadEnemy);
          }
        }

        const isCombo = comboTargets.has(targetIdx) && state.formation === '合击';
        const formationDmgBonus = calcFormationBonus(state.formation);

        // 牵制姿态：攻击最强敌人
        if (state.formation === '牵制' && targetIdx < currentEnemies.length && currentEnemies[targetIdx].hp > 0) {
          currentEnemies[targetIdx] = applyPinningEffect(state, targetIdx);
        }

        if (targetIdx >= 0 && targetIdx < currentEnemies.length && currentEnemies[targetIdx].hp > 0) {
          const result = processAttackAction(
            { type: 'attack', targetIndex: targetIdx },
            member, currentEnemies, formationDmgBonus, state.morale, state.coordination, isCombo, state.round,
          );
          if (result) {
            currentEnemies[targetIdx] = result.defender as SquadEnemy;
            newLog.push(result.log);
          }
        } else if (targetIdx >= 0 && targetIdx < currentMembers.length && currentMembers[targetIdx].hp > 0 && confused) {
          // 混乱打队友
          const dmg = Math.floor(member.atk * 0.5);
          currentMembers[targetIdx] = { ...currentMembers[targetIdx], hp: Math.max(0, currentMembers[targetIdx].hp - dmg) };
          newLog.push({ round: state.round, actor: 'player', action: '混乱', damage: dmg, hit: true, crit: false, message: `${member.name} 混乱中误伤 ${currentMembers[targetIdx].name}` });
        }

      } else if (action.type === 'defend') {
        // 防御姿态：临时防御+20%
        currentMembers[actor.index] = { ...member, def: Math.floor(member.def * 1.20), action };
        newLog.push({ round: state.round, actor: 'player', action: '防御', message: `${member.name} 采取防御姿态` });

      } else if (action.type === 'gu_skill' && action.moveId === 'heal') {
        const targetIdx = action.targetIndex;
        if (targetIdx >= 0 && targetIdx < currentMembers.length && currentMembers[targetIdx].hp > 0) {
          const healResult = computeHeal(member, currentMembers[targetIdx]);
          currentMembers[targetIdx] = { ...currentMembers[targetIdx], hp: currentMembers[targetIdx].hp + healResult.healAmount };
          newLog.push({ round: state.round, actor: 'player', action: '治疗', damage: healResult.healAmount, hit: true, crit: false, message: `${member.name} 治疗 ${currentMembers[targetIdx].name}: ${healResult.message}` });
        }

      } else if (action.type === 'escape') {
        newLog.push({ round: state.round, actor: 'player', action: '撤退', message: `${member.name} 试图撤退` });
      }

    } else if (actor.type === 'enemy') {
      const enemy = currentEnemies[actor.index];
      if (enemy.hp <= 0) continue;
      const action = enemyActions[actor.index] || { type: 'attack', targetIndex: 0 };

      const disabled = isStatusDisabled(enemy.statuses);
      if (disabled) {
        newLog.push({ round: state.round, actor: 'enemy', action: '硬直', message: `${enemy.name} 无法行动` });
        continue;
      }

      if (action.type === 'attack' && action.targetIndex < currentMembers.length) {
        const result = computeSquadAttack(enemy, currentMembers[action.targetIndex], 0, 50, 0, false);
        if (result.hit) {
          currentMembers[action.targetIndex] = {
            ...currentMembers[action.targetIndex],
            hp: Math.max(0, currentMembers[action.targetIndex].hp - result.damage),
          };
        }
        newLog.push({
          round: state.round, actor: 'enemy', action: result.hit ? '攻击' : 'miss',
          damage: result.damage, hit: result.hit, crit: result.crit,
          message: `${enemy.name} 对 ${currentMembers[action.targetIndex].name} ${result.message}`,
        });
      } else if (action.type === 'defend') {
        currentEnemies[actor.index] = { ...enemy, def: Math.floor(enemy.def * 1.20) };
        newLog.push({ round: state.round, actor: 'enemy', action: '防御', message: `${enemy.name} 采取防御姿态` });
      }
    }
  }

  // 5. 状态效果递减 + 持续伤害结算
  for (let i = 0; i < currentMembers.length; i++) {
    const m = currentMembers[i];
    if (m.hp <= 0) continue;
    for (const status of m.statuses) {
      const tickDmg = calcStatusDamage(status, m.maxHp);
      if (tickDmg > 0) {
        currentMembers[i] = { ...currentMembers[i], hp: Math.max(0, currentMembers[i].hp - tickDmg) };
        newLog.push({ round: state.round, actor: 'player', action: status.type, damage: tickDmg, hit: true, crit: false, message: `${m.name} 受到${status.type}伤害 ${tickDmg}` });
      }
    }
    currentMembers[i] = { ...currentMembers[i], statuses: tickStatuses(m.statuses) };
  }

  for (let i = 0; i < currentEnemies.length; i++) {
    const e = currentEnemies[i];
    if (e.hp <= 0) continue;
    for (const status of e.statuses) {
      const tickDmg = calcStatusDamage(status, e.maxHp);
      if (tickDmg > 0) {
        currentEnemies[i] = { ...currentEnemies[i], hp: Math.max(0, currentEnemies[i].hp - tickDmg) };
        newLog.push({ round: state.round, actor: 'enemy', action: status.type, damage: tickDmg, hit: true, crit: false, message: `${e.name} 受到${status.type}伤害 ${tickDmg}` });
      }
    }
    currentEnemies[i] = { ...currentEnemies[i], statuses: tickStatuses(e.statuses) };
  }

  // 6. 掠阵被动恢复
  let finalState: SquadCombatState = {
    ...state,
    round: state.round + 1,
    phase: 'resolution',
    members: currentMembers,
    enemies: currentEnemies,
    log: newLog,
  };
  finalState = applyFlankSupport(finalState);

  // 7. 战后士气衰减（每回合-1）
  const newMorale = Math.max(0, finalState.morale - 1);
  finalState = { ...finalState, morale: newMorale };

  // 8. 检查结束条件
  const endResult = checkSquadEnd(finalState);
  if (endResult !== 'ongoing') {
    finalState = {
      ...finalState,
      phase: 'ended',
      log: [...finalState.log, {
        round: finalState.round,
        actor: 'player',
        action: endResult === 'player_win' ? '胜利' : '败北',
        message: endResult === 'player_win' ? '敌方全灭，战斗胜利！' : '小队溃败...',
      }],
    };
  } else {
    finalState = { ...finalState, phase: 'player_turn' };
  }

  return finalState;
}

/**
 * 解决当前回合的自动行动（无玩家输入时，全员默认行动）
 */
export function resolveSquadRound(state: SquadCombatState): SquadCombatState {
  const defaultActions: SquadAction[] = state.members
    .filter(m => m.hp > 0)
    .map(m => selectMemberDefaultAction(m, state.members, state.enemies));
  return executeSquadTurn(state, defaultActions);
}
