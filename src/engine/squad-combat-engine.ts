import combatConfigRaw from '../canon/combat-config.json';
import type {
  BattleTraceEntry,
  CombatLogEntry,
  DuelMove,
  SquadAction,
  SquadCombatState,
  SquadEnemy,
  SquadMemberCombat,
} from '../types';
import {
  calcDamage,
  calcHitRate,
  calcStatusDamage,
  createSeededRng,
  getRealmCoefficients,
  rollCrit,
  rollHit,
  tickStatuses,
  type CombatRng,
} from './combat-formulas';

const config = combatConfigRaw as any;
const squadConfig = config.squad ?? {};
const resourceCost = config.resourceCost ?? {};
const traceConfig = squadConfig.trace ?? {};

type Formation = SquadCombatState['formation'];
type ActorUnit = SquadMemberCombat | SquadEnemy;

export const FORMATION_BONUS: Record<Formation, {
  damageBonus: number;
  defenseBonus: number;
  speedBonus: number;
  special: string;
}> = {
  合击: {
    damageBonus: squadConfig.formations?.合击?.damageBonus ?? 0.15,
    defenseBonus: squadConfig.formations?.合击?.defenseBonus ?? 0,
    speedBonus: squadConfig.formations?.合击?.speedBonus ?? 0,
    special: squadConfig.formations?.合击?.special ?? '集火同一目标提升伤害',
  },
  牵制: {
    damageBonus: squadConfig.formations?.牵制?.damageBonus ?? 0,
    defenseBonus: squadConfig.formations?.牵制?.defenseBonus ?? 0.1,
    speedBonus: squadConfig.formations?.牵制?.speedBonus ?? 0,
    special: squadConfig.formations?.牵制?.special ?? '压低强敌闪避',
  },
  掠阵: {
    damageBonus: squadConfig.formations?.掠阵?.damageBonus ?? 0,
    defenseBonus: squadConfig.formations?.掠阵?.defenseBonus ?? 0.05,
    speedBonus: squadConfig.formations?.掠阵?.speedBonus ?? 0,
    special: squadConfig.formations?.掠阵?.special ?? '照应低血量队友',
  },
  斩首: {
    damageBonus: squadConfig.formations?.斩首?.damageBonus ?? 0.1,
    defenseBonus: squadConfig.formations?.斩首?.defenseBonus ?? 0,
    speedBonus: squadConfig.formations?.斩首?.speedBonus ?? 0.05,
    special: squadConfig.formations?.斩首?.special ?? '优先击破关键目标',
  },
};

const DEFAULT_MORALE = squadConfig.morale?.default ?? 50;
const DEFAULT_COORDINATION = squadConfig.coordination?.default ?? 50;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function nextInt(rng: CombatRng, max: number): number {
  return Math.floor(rng.next() * Math.max(1, max));
}

function makeTrace(
  round: number,
  phase: BattleTraceEntry['phase'],
  actor: BattleTraceEntry['actor'],
  action: string,
  message: string,
  extra: Partial<BattleTraceEntry> = {},
): BattleTraceEntry {
  return { round, phase, actor, action, message, ...extra };
}

function pushTrace(state: SquadCombatState, entries: BattleTraceEntry[]): BattleTraceEntry[] {
  const maxEntries = traceConfig.maxEntries ?? 80;
  return [...(state.trace ?? []), ...entries].slice(-maxEntries);
}

function isMember(unit: ActorUnit): unit is SquadMemberCombat {
  return 'memberId' in unit;
}

function getSpeed(unit: { atk: number; def: number; realm: number }, formationBonus: number): number {
  return unit.atk * 0.6 + unit.def * 0.3 + unit.realm * 3 + formationBonus * 30;
}

export function calcFormationBonus(formation: Formation): number {
  return FORMATION_BONUS[formation]?.damageBonus ?? 0;
}

export function calcFormationSpeedBonus(formation: Formation): number {
  return FORMATION_BONUS[formation]?.speedBonus ?? 0;
}

export function applyMoraleEffect(baseDamage: number, morale: number): number {
  const minMult = squadConfig.morale?.minDamageMult ?? 0.8;
  const maxMult = squadConfig.morale?.maxDamageMult ?? 1.2;
  const multiplier = minMult + (clamp(morale, 0, 100) / 100) * (maxMult - minMult);
  return Math.max(1, Math.round(baseDamage * multiplier));
}

export function applyMoraleHitPenalty(morale: number): number {
  const start = squadConfig.morale?.lowHitPenaltyStart ?? 60;
  if (morale >= start) return 0;
  return (start - morale) * (squadConfig.morale?.lowHitPenaltyPerPoint ?? 0.003);
}

function calcCoordinationChance(coordination: number): number {
  const divisor = squadConfig.coordination?.chanceDivisor ?? 200;
  const maxChance = squadConfig.coordination?.maxComboChance ?? 0.5;
  return Math.min(maxChance, clamp(coordination, 0, 100) / divisor);
}

function normalizeMember(member: SquadMemberCombat): SquadMemberCombat {
  const maxEssence = member.essence?.max ?? 100;
  return {
    ...member,
    hp: Math.min(member.maxHp, member.hp > 0 ? member.hp : member.maxHp),
    statuses: member.statuses ?? [],
    action: null,
    moves: member.moves ?? [],
    essence: member.essence ?? {
      current: maxEssence,
      max: maxEssence,
      type: member.realm >= 6 ? 'immortal' : 'primeval',
    },
    daoMarks: member.daoMarks ?? Math.max(0, member.realm * 30),
    cooldowns: member.cooldowns ?? {},
    fatigue: member.fatigue ?? 0,
  };
}

function normalizeEnemy(enemy: SquadEnemy): SquadEnemy {
  return {
    ...enemy,
    hp: Math.min(enemy.maxHp, enemy.hp > 0 ? enemy.hp : enemy.maxHp),
    statuses: enemy.statuses ?? [],
    aiMode: enemy.aiMode ?? 'balanced',
    moves: enemy.moves ?? [],
    daoMarks: enemy.daoMarks ?? Math.max(0, enemy.realm * 30),
  };
}

function findMove(member: SquadMemberCombat, action: SquadAction): DuelMove | null {
  if (action.type !== 'gu_skill' || action.moveId === 'heal') return null;
  const moves = member.moves ?? [];
  return moves.find(move =>
    move.killerMoveId === action.moveId
    || move.name === action.moveId
    || String(moves.indexOf(move)) === action.moveId,
  ) ?? null;
}

function spendEssence(member: SquadMemberCombat, cost: number): { member: SquadMemberCombat; paid: boolean } {
  const essence = member.essence ?? { current: 100, max: 100, type: member.realm >= 6 ? 'immortal' as const : 'primeval' as const };
  if (essence.current < cost) return { member, paid: false };
  return {
    member: { ...member, essence: { ...essence, current: Math.max(0, essence.current - cost) } },
    paid: true,
  };
}

function decrementCooldowns(member: SquadMemberCombat): SquadMemberCombat {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(member.cooldowns ?? {})) {
    if (value > 1) next[key] = value - 1;
  }
  return { ...member, cooldowns: next };
}

function selectEnemyTarget(enemy: SquadEnemy, members: SquadMemberCombat[], rng: CombatRng): number {
  const alive = members.map((member, index) => ({ member, index })).filter(row => row.member.hp > 0);
  if (!alive.length) return 0;
  if (enemy.aiMode === 'aggressive') {
    return alive.reduce((min, row) => row.member.hp < min.member.hp ? row : min, alive[0]).index;
  }
  if (enemy.aiMode === 'defensive') {
    return alive.reduce((max, row) => row.member.atk > max.member.atk ? row : max, alive[0]).index;
  }
  if (enemy.aiMode === 'coward') {
    return alive.reduce((min, row) =>
      (row.member.hp / row.member.maxHp) < (min.member.hp / min.member.maxHp) ? row : min, alive[0]).index;
  }
  return alive[nextInt(rng, alive.length)].index;
}

function selectEnemyAction(enemy: SquadEnemy, members: SquadMemberCombat[], rng: CombatRng): SquadAction {
  if (enemy.aiMode !== 'aggressive' && rng.next() < 0.05) return { type: 'defend' };
  return { type: 'attack', targetIndex: selectEnemyTarget(enemy, members, rng) };
}

function selectMemberDefaultAction(
  member: SquadMemberCombat,
  allies: SquadMemberCombat[],
  enemies: SquadEnemy[],
): SquadAction {
  const aliveEnemies = enemies.map((enemy, index) => ({ enemy, index })).filter(row => row.enemy.hp > 0);
  if (!aliveEnemies.length) return { type: 'defend' };
  if (member.personality === 'selfless') {
    const injured = allies
      .map((ally, index) => ({ ally, index }))
      .filter(row => row.ally.hp > 0 && row.ally.hp < row.ally.maxHp && row.ally.memberId !== member.memberId)
      .sort((a, b) => (a.ally.hp / a.ally.maxHp) - (b.ally.hp / b.ally.maxHp));
    if (injured.length) return { type: 'gu_skill', moveId: 'heal', targetIndex: injured[0].index };
  }
  if (member.personality === 'reckless') {
    return { type: 'attack', targetIndex: aliveEnemies.reduce((max, row) => row.enemy.atk > max.enemy.atk ? row : max, aliveEnemies[0]).index };
  }
  if (member.personality === 'cautious' && member.hp / member.maxHp < 0.35) return { type: 'defend' };
  return { type: 'attack', targetIndex: aliveEnemies[0].index };
}

interface AttackResult {
  damage: number;
  hit: boolean;
  crit: boolean;
  hitRate: number;
  message: string;
}

function computeAttack(
  attacker: ActorUnit,
  defender: ActorUnit,
  options: {
    formation: Formation;
    morale: number;
    isCombo: boolean;
    move?: DuelMove | null;
    rng: CombatRng;
  },
): AttackResult {
  const coeff = getRealmCoefficients(attacker.realm, defender.realm);
  const attackerIsMember = isMember(attacker);
  const realmMult = attackerIsMember ? coeff.playerDamageMult : coeff.enemyDamageMult;
  const hitBonus = attackerIsMember ? coeff.playerHitBonus : coeff.enemyHitPenalty;
  const moveMult = options.move?.damageMultiplier ?? 1;
  const pathBonus = options.move?.pathBonus ?? 0;
  const formationDamage = attackerIsMember ? calcFormationBonus(options.formation) : 0;
  const comboBonus = options.isCombo ? (squadConfig.formations?.合击?.comboChanceBonus ?? 0.1) : 0;
  const baseHitRate = calcHitRate(attacker.atk + pathBonus, defender.def, hitBonus);
  const hitRate = clamp(baseHitRate - (attackerIsMember ? applyMoraleHitPenalty(options.morale) : 0), 0.08, 0.96);
  const hit = rollHit(hitRate, options.rng);
  if (!hit) return { damage: 0, hit, crit: false, hitRate, message: '未命中' };

  const critBonus = options.formation === '斩首' && attackerIsMember ? (squadConfig.formations?.斩首?.critBonus ?? 0.1) : 0;
  const crit = rollCrit(options.rng) || options.rng.next() < critBonus;
  const rawDamage = calcDamage(
    attacker.atk + pathBonus,
    defender.def,
    attacker.path,
    defender.path,
    realmMult,
    moveMult * (1 + formationDamage + comboBonus),
    crit,
    attacker.daoMarks ?? 0,
    defender.daoMarks ?? 0,
    options.rng,
  );
  const damage = attackerIsMember ? applyMoraleEffect(rawDamage, options.morale) : rawDamage;
  return {
    damage,
    hit,
    crit,
    hitRate,
    message: `${crit ? '暴击，' : ''}造成${damage}点伤害`,
  };
}

function computeHeal(healer: SquadMemberCombat, target: SquadMemberCombat): number {
  return Math.min(target.maxHp - target.hp, Math.max(Math.floor(healer.atk * 0.3), Math.floor(target.maxHp * 0.15)));
}

function applyStatusTicks(
  members: SquadMemberCombat[],
  enemies: SquadEnemy[],
  round: number,
): { members: SquadMemberCombat[]; enemies: SquadEnemy[]; logs: CombatLogEntry[]; traces: BattleTraceEntry[] } {
  const logs: CombatLogEntry[] = [];
  const traces: BattleTraceEntry[] = [];
  const nextMembers = members.map(member => {
    let hp = member.hp;
    for (const status of member.statuses ?? []) {
      const damage = calcStatusDamage(status, member.maxHp);
      if (damage > 0) {
        hp = Math.max(0, hp - damage);
        logs.push({ round, actor: 'player', action: status.type, damage, hit: true, crit: false, message: `${member.name} 受到${status.type}持续伤害 ${damage}` });
        traces.push(makeTrace(round, 'resource', 'player', status.type, `${member.name} 受到${status.type}持续伤害`, { damage, tags: ['status'] }));
      }
    }
    return decrementCooldowns({ ...member, hp, statuses: tickStatuses(member.statuses ?? []) });
  });
  const nextEnemies = enemies.map(enemy => {
    let hp = enemy.hp;
    for (const status of enemy.statuses ?? []) {
      const damage = calcStatusDamage(status, enemy.maxHp);
      if (damage > 0) {
        hp = Math.max(0, hp - damage);
        logs.push({ round, actor: 'enemy', action: status.type, damage, hit: true, crit: false, message: `${enemy.name} 受到${status.type}持续伤害 ${damage}` });
        traces.push(makeTrace(round, 'resource', 'enemy', status.type, `${enemy.name} 受到${status.type}持续伤害`, { damage, tags: ['status'] }));
      }
    }
    return { ...enemy, hp, statuses: tickStatuses(enemy.statuses ?? []) };
  });
  return { members: nextMembers, enemies: nextEnemies, logs, traces };
}

function buildRewardPreview(state: SquadCombatState): NonNullable<SquadCombatState['rewardPreview']> {
  const enemyRealmSum = state.enemies.reduce((sum, enemy) => sum + enemy.realm, 0);
  const yuanStone = Math.min(
    squadConfig.rewardArbitrage?.maxExpectedYuanStonePerTurnMortal ?? 80,
    Math.max(10, enemyRealmSum * 18),
  );
  return {
    yuanStone,
    materials: {},
    rumors: ['敌方蛊虫默认死亡或自毁；只有剧情白名单允许掉蛊。'],
  };
}

function checkResult(state: SquadCombatState): SquadCombatState['result'] | null {
  const allMembersDown = state.members.every(member => member.hp <= 0);
  const allEnemiesDown = state.enemies.every(enemy => enemy.hp <= 0);
  if (!allMembersDown && !allEnemiesDown) return null;
  const winner = allEnemiesDown ? 'player' : 'enemy';
  return {
    winner,
    roundsTaken: state.round,
    casualties: [],
    wounded: state.members.filter(member => member.hp <= 0).map(member => member.name),
    moraleDelta: winner === 'player' ? 8 : -12,
    trustDeltas: Object.fromEntries(state.members.map(member => [member.memberId, winner === 'player' ? 2 : -4])),
    rewards: winner === 'player' ? buildRewardPreview(state) : undefined,
  };
}

export function initSquadDuel(
  squadId: string,
  members: SquadMemberCombat[],
  enemies: SquadEnemy[],
  formation: Formation = '牵制',
  morale: number = DEFAULT_MORALE,
  coordination: number = DEFAULT_COORDINATION,
  seed: number | string = `${squadId}:${Date.now()}`,
): SquadCombatState {
  const safeFormation = FORMATION_BONUS[formation] ? formation : '牵制';
  return {
    squadId,
    phase: 'deploy',
    round: 1,
    formation: safeFormation,
    morale: clamp(morale, 0, 100),
    coordination: clamp(coordination, 0, 100),
    members: members.map(normalizeMember),
    enemies: enemies.map(normalizeEnemy),
    log: [],
    trace: [makeTrace(0, 'scout', 'system', 'init', `小队战初始化：${members.length}v${enemies.length}`, { tags: ['squad_start'] })],
    eventCandidates: [],
    seed: typeof seed === 'number' ? seed : String(seed).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0),
    mode: 'lethal',
    rewardPreview: buildRewardPreview({ enemies } as SquadCombatState),
    result: null,
  };
}

export function checkSquadEnd(state: SquadCombatState): 'player_win' | 'enemy_win' | 'ongoing' {
  const result = checkResult(state);
  if (!result) return 'ongoing';
  return result.winner === 'player' ? 'player_win' : 'enemy_win';
}

function calculateEscape(state: SquadCombatState, rng: CombatRng): boolean {
  const livingMembers = state.members.filter(member => member.hp > 0);
  const livingEnemies = state.enemies.filter(enemy => enemy.hp > 0);
  const avgMemberRealm = livingMembers.reduce((sum, member) => sum + member.realm, 0) / Math.max(1, livingMembers.length);
  const avgEnemyRealm = livingEnemies.reduce((sum, enemy) => sum + enemy.realm, 0) / Math.max(1, livingEnemies.length);
  const chance = clamp(
    (squadConfig.escape?.baseChance ?? 0.35)
      + state.morale * (squadConfig.escape?.moraleWeight ?? 0.002)
      - Math.max(0, avgEnemyRealm - avgMemberRealm) * (squadConfig.escape?.rankPenalty ?? 0.08),
    squadConfig.escape?.minChance ?? 0.05,
    squadConfig.escape?.maxChance ?? 0.8,
  );
  return rng.next() < chance;
}

function applyFormationSupport(state: SquadCombatState): { members: SquadMemberCombat[]; logs: CombatLogEntry[]; traces: BattleTraceEntry[] } {
  if (state.formation !== '掠阵') return { members: state.members, logs: [], traces: [] };
  const candidates = state.members
    .map((member, index) => ({ member, index }))
    .filter(row => row.member.hp > 0 && row.member.hp < row.member.maxHp)
    .sort((a, b) => (a.member.hp / a.member.maxHp) - (b.member.hp / b.member.maxHp));
  if (!candidates.length) return { members: state.members, logs: [], traces: [] };
  const row = candidates[0];
  const heal = Math.max(1, Math.floor(row.member.maxHp * (squadConfig.formations?.掠阵?.healLowestPct ?? 0.05)));
  const members = state.members.map((member, index) => index === row.index ? { ...member, hp: Math.min(member.maxHp, member.hp + heal) } : member);
  const message = `掠阵护持：${row.member.name}恢复${heal}HP`;
  return {
    members,
    logs: [{ round: state.round, actor: 'player', action: '掠阵', damage: heal, hit: true, crit: false, message }],
    traces: [makeTrace(state.round, 'resource', 'player', '掠阵', message, { resourceCost: 0, tags: ['formation'] })],
  };
}

export function executeSquadTurn(
  state: SquadCombatState,
  playerActions: SquadAction[],
): SquadCombatState {
  const rng = createSeededRng(`${state.seed ?? 1}:${state.round}`);
  const round = state.round;
  const logs: CombatLogEntry[] = [...state.log];
  const traces: BattleTraceEntry[] = [];

  if (playerActions.some(action => action.type === 'escape')) {
    const escaped = calculateEscape(state, rng);
    traces.push(makeTrace(round, 'morale_escape', 'player', 'escape', escaped ? '小队找到撤退窗口' : '撤退失败，敌人压上', { tags: ['escape'] }));
    logs.push({ round, actor: 'player', action: '撤退', hit: escaped, crit: false, message: escaped ? '小队撤出战场。' : '撤退失败。' });
    if (escaped) {
      return {
        ...state,
        phase: 'ended',
        log: logs,
        trace: pushTrace(state, traces),
        result: {
          winner: 'escaped',
          roundsTaken: round,
          casualties: [],
          wounded: [],
          moraleDelta: -4,
          trustDeltas: Object.fromEntries(state.members.map(member => [member.memberId, -1])),
        },
      };
    }
  }

  let members = state.members.map(normalizeMember);
  let enemies = state.enemies.map(normalizeEnemy);
  const formationSpeedBonus = calcFormationSpeedBonus(state.formation);
  const turnOrder = [
    ...members.map((member, index) => ({ type: 'member' as const, index, speed: member.hp > 0 ? getSpeed(member, formationSpeedBonus) : -1 })),
    ...enemies.map((enemy, index) => ({ type: 'enemy' as const, index, speed: enemy.hp > 0 ? getSpeed(enemy, 0) : -1 })),
  ].filter(row => row.speed >= 0).sort((a, b) => b.speed - a.speed);

  const targetCounts = new Map<number, number>();
  for (const action of playerActions) {
    if (action.type === 'attack' || action.type === 'gu_skill') {
      targetCounts.set(action.targetIndex, (targetCounts.get(action.targetIndex) ?? 0) + 1);
    }
  }
  const comboTargets = new Set<number>();
  for (const [targetIndex, count] of targetCounts) {
    if (count >= 2 && rng.next() < calcCoordinationChance(state.coordination)) comboTargets.add(targetIndex);
  }

  for (const actor of turnOrder) {
    if (actor.type === 'member') {
      const member = members[actor.index];
      if (!member || member.hp <= 0) continue;
      const action = playerActions[actor.index] ?? selectMemberDefaultAction(member, members, enemies);

      if (action.type === 'defend') {
        const { member: paidMember } = spendEssence(member, resourceCost.defendEssencePct ?? 3);
        members[actor.index] = { ...paidMember, def: Math.round(paidMember.def * (1 + (FORMATION_BONUS[state.formation]?.defenseBonus ?? 0.12))), action };
        logs.push({ round, actor: 'player', action: '防御', hit: true, crit: false, message: `${member.name}采取防御姿态。` });
        traces.push(makeTrace(round, 'action', 'player', 'defend', `${member.name}防御，临时提高防御`, { tags: ['defend'] }));
        continue;
      }

      if (action.type === 'gu_skill' && action.moveId === 'heal') {
        const target = members[action.targetIndex] ?? members[actor.index];
        const heal = computeHeal(member, target);
        const { member: paidMember, paid } = spendEssence(member, resourceCost.defaultGuSkillEssencePct ?? 8);
        members[actor.index] = paidMember;
        if (paid && heal > 0) {
          members[action.targetIndex] = { ...target, hp: Math.min(target.maxHp, target.hp + heal) };
          logs.push({ round, actor: 'player', action: '治疗', damage: heal, hit: true, crit: false, message: `${member.name}救治${target.name}，恢复${heal}HP。` });
          traces.push(makeTrace(round, 'resource', 'player', 'heal', `${member.name}消耗真元治疗${target.name}`, { resourceCost: resourceCost.defaultGuSkillEssencePct ?? 8, tags: ['gu_skill'] }));
        } else {
          logs.push({ round, actor: 'player', action: '治疗失败', hit: false, crit: false, message: `${member.name}真元不足，无法救治。` });
        }
        continue;
      }

      const move = findMove(member, action);
      const targetIndex = (action.type === 'attack' || action.type === 'gu_skill') ? action.targetIndex : 0;
      const defender = enemies[targetIndex];
      if (!defender || defender.hp <= 0) continue;

      let actingMember = member;
      let paid = true;
      let resourceSpent = resourceCost.basicAttackEssencePct ?? 5;
      if (action.type === 'gu_skill' && move) {
        const moveCost = (move as DuelMove & { baseCost?: number }).baseCost ?? (resourceCost.defaultGuSkillEssencePct ?? 8);
        const spent = spendEssence(member, moveCost);
        actingMember = spent.member;
        paid = spent.paid;
        resourceSpent = moveCost;
        if (paid) {
          actingMember = {
            ...actingMember,
            cooldowns: {
              ...(actingMember.cooldowns ?? {}),
              [move.killerMoveId ?? move.name]: (move as DuelMove & { cooldown?: number }).cooldown ?? 3,
            },
          };
        }
      } else {
        actingMember = spendEssence(member, resourceSpent).member;
      }
      members[actor.index] = actingMember;
      if (!paid) {
        logs.push({ round, actor: 'player', action: '真元不足', hit: false, crit: false, message: `${member.name}真元不足，杀招未能发动。` });
        traces.push(makeTrace(round, 'resource', 'player', 'no_essence', `${member.name}真元不足，行动失败`, { tags: ['resource_blocked'] }));
        continue;
      }

      const attack = computeAttack(actingMember, defender, {
        formation: state.formation,
        morale: state.morale,
        isCombo: comboTargets.has(targetIndex) && state.formation === '合击',
        move,
        rng,
      });
      enemies[targetIndex] = { ...defender, hp: Math.max(0, defender.hp - attack.damage) };
      const actionName = move?.name ?? '攻击';
      logs.push({ round, actor: 'player', action: actionName, damage: attack.damage, hit: attack.hit, crit: attack.crit, message: `${actingMember.name}对${defender.name}${attack.message}。` });
      traces.push(makeTrace(round, 'action', 'player', actionName, `${actingMember.name} -> ${defender.name}: ${attack.message}`, {
        damage: attack.damage,
        hitRate: attack.hitRate,
        resourceCost: action.type === 'gu_skill' ? resourceSpent : undefined,
        tags: [move ? 'duel_move' : 'basic_attack', state.formation],
      }));
    } else {
      const enemy = enemies[actor.index];
      if (!enemy || enemy.hp <= 0) continue;
      const action = selectEnemyAction(enemy, members, rng);
      if (action.type === 'defend') {
        enemies[actor.index] = { ...enemy, def: Math.round(enemy.def * 1.15) };
        logs.push({ round, actor: 'enemy', action: '防御', hit: true, crit: false, message: `${enemy.name}转为防守。` });
        continue;
      }
      const defender = members[action.targetIndex];
      if (!defender || defender.hp <= 0) continue;
      const attack = computeAttack(enemy, defender, { formation: state.formation, morale: 50, isCombo: false, rng });
      members[action.targetIndex] = { ...defender, hp: Math.max(0, defender.hp - attack.damage) };
      logs.push({ round, actor: 'enemy', action: '攻击', damage: attack.damage, hit: attack.hit, crit: attack.crit, message: `${enemy.name}对${defender.name}${attack.message}。` });
      traces.push(makeTrace(round, 'counter', 'enemy', 'attack', `${enemy.name} -> ${defender.name}: ${attack.message}`, {
        damage: attack.damage,
        hitRate: attack.hitRate,
        tags: ['enemy_attack'],
      }));
    }
  }

  const status = applyStatusTicks(members, enemies, round);
  members = status.members;
  enemies = status.enemies;
  logs.push(...status.logs);
  traces.push(...status.traces);

  let nextState: SquadCombatState = {
    ...state,
    round: round + 1,
    phase: 'player_turn',
    members,
    enemies,
    log: logs,
    morale: Math.max(0, state.morale - 1),
  };

  const support = applyFormationSupport(nextState);
  logs.push(...support.logs);
  nextState = {
    ...nextState,
    members: support.members,
    log: logs,
  };
  traces.push(...support.traces);

  const result = checkResult(nextState);
  if (result) {
    nextState = {
      ...nextState,
      phase: 'ended',
      result,
      rewardPreview: result.rewards ?? nextState.rewardPreview,
    };
    traces.push(makeTrace(round, 'morale_escape', 'system', 'result', result.winner === 'player' ? '小队战胜利，奖励进入经济闸门预览。' : '小队战失败，等待伤亡回流。', { tags: ['battle_result'] }));
    logs.push({
      round,
      actor: 'player',
      action: result.winner === 'player' ? '胜利' : '失败',
      hit: true,
      crit: false,
      message: result.winner === 'player' ? '敌方全灭，小队战胜利。' : '小队溃败。',
    });
  }

  return {
    ...nextState,
    log: logs,
    trace: pushTrace(state, traces),
  };
}

export function resolveSquadRound(state: SquadCombatState): SquadCombatState {
  const defaultActions = state.members.map(member => member.hp > 0
    ? selectMemberDefaultAction(member, state.members, state.enemies)
    : { type: 'defend' as const });
  return executeSquadTurn(state, defaultActions);
}
