/**
 * ═══ 战斗共享公式层 — v0.6.0 ═══
 * 从 combat-engine.ts 提取，供1v1引擎和小队引擎(v0.7.0)共用。
 * 所有函数纯函数——无副作用、无store依赖。
 */
import combatConfigRaw from '../canon/combat-config.json';

const config = combatConfigRaw as any;
const realmTable: Record<string, { playerDamageMult: number; playerHitBonus: number; enemyDamageMult: number; enemyHitPenalty: number }> = config.realmCoefficients?.table || {};
const pathMatrix: Record<string, Record<string, number>> = config.pathMatrix?.matrix || {};
const C = config.constants || {};

/** 境界名称 → 数值映射 */
export const REALM_NUM: Record<string, number> = {
  '凡人': 0, '一转': 1, '二转': 2, '三转': 3, '四转': 4, '五转': 5,
  '六转': 6, '七转': 7, '八转': 8, '九转': 9,
  '一转蛊师': 1, '二转蛊师': 2, '三转蛊师': 3, '四转蛊师': 4, '五转蛊师': 5,
  '蛊仙': 6, '六转蛊仙': 6, '七转蛊仙': 7, '八转蛊仙': 8,
};

export function toRealmNum(realm: string): number { return REALM_NUM[realm] ?? 1; }

/**
 * P2补完: 从流派道痕KV计算出有效战斗道痕数
 */
export function getEffectiveDaoMarks(pathDaoMarks: Record<string, number>, combatPath: string): number {
  let total = 0;
  for (const [path, marks] of Object.entries(pathDaoMarks)) {
    if (typeof marks !== 'number') continue;
    total += path === combatPath ? marks : Math.floor(marks * 0.3);
  }
  return total;
}

/** 境界修正系数 */
export function getRealmCoefficients(playerRealmNum: number, enemyRealmNum: number) {
  const diff = enemyRealmNum - playerRealmNum;
  const key = String(Math.max(-3, Math.min(3, diff)));
  const base = realmTable[key] || realmTable['0'];

  // ═══ v0.8.0-immortal: 仙凡有别 — 跨界战斗增强倍率 ═══
  const immortalConfig = config.immortalVsMortal;
  if (immortalConfig) {
    const immortalGate = immortalConfig.immortalRealmGate ?? 6;
    const playerIsImmortal = playerRealmNum >= immortalGate;
    const enemyIsImmortal = enemyRealmNum >= immortalGate;
    const isCrossRealm = playerIsImmortal !== enemyIsImmortal;

    if (isCrossRealm) {
      // 蛊仙(≥6转)对蛊师(≤5转)：叠加碾压倍率
      if (playerIsImmortal && !enemyIsImmortal) {
        return {
          playerDamageMult: base.playerDamageMult * (immortalConfig.immortalDamageMult ?? 3.0),
          playerHitBonus: base.playerHitBonus + (immortalConfig.immortalHitBonus ?? 50),
          enemyDamageMult: base.enemyDamageMult * (immortalConfig.mortalDamageMult ?? 0.15),
          enemyHitPenalty: base.enemyHitPenalty + (immortalConfig.mortalHitPenalty ?? -30),
        };
      }
      // 蛊师对蛊仙：叠加被碾压倍率
      if (!playerIsImmortal && enemyIsImmortal) {
        return {
          playerDamageMult: base.playerDamageMult * (immortalConfig.mortalDamageMult ?? 0.15),
          playerHitBonus: base.playerHitBonus + (immortalConfig.mortalHitPenalty ?? -30),
          enemyDamageMult: base.enemyDamageMult * (immortalConfig.immortalDamageMult ?? 3.0),
          enemyHitPenalty: base.enemyHitPenalty + (immortalConfig.immortalHitBonus ?? 50),
        };
      }
    }
  }

  return base;
}

/** 流派克制倍率 */
export function getPathMultiplier(attackerPath: string, defenderPath: string): number {
  const row = pathMatrix[attackerPath];
  return row ? (row[defenderPath] ?? 1.0) : 1.0;
}

/** 计算命中率 */
export function calcHitRate(baseAccuracy: number, baseEvasion: number, hitBonus: number): number {
  return Math.max(0.1, Math.min(0.95, (baseAccuracy + hitBonus) / (baseAccuracy + hitBonus + baseEvasion)));
}

/** 判断暴击 */
export function rollCrit(): boolean { return Math.random() < (C.critRate?.base ?? 0.05); }

/** 判断命中 */
export function rollHit(hitRate: number): boolean { return Math.random() < hitRate; }

/**
 * 计算伤害
 * damage = (ATK - DEF×0.5) × pathMult × realmMult × moveMult × daoMarkMult × crit × variance
 */
export function calcDamage(
  attackerAtk: number, defenderDef: number,
  attackerPath: string, defenderPath: string,
  realmMult: number, moveMult: number, isCrit: boolean,
  attackerDaoMarks: number = 0, defenderDaoMarks: number = 0,
): number {
  const defFactor = C.defenseFactor?.value ?? 0.5;
  const baseMin = C.baseVariance?.min ?? 0.85;
  const baseMax = C.baseVariance?.max ?? 1.15;
  const critMult = isCrit ? (C.critRate?.multiplier ?? 1.5) : 1.0;
  const minDmg = C.minDamage?.value ?? 1;
  const attackDaoMult = 1.0 + (attackerDaoMarks / 5000);
  const defenseDaoMult = 1.0 - (defenderDaoMarks / 15000);
  const daoMarkMult = Math.max(0.5, Math.min(5.0, attackDaoMult * defenseDaoMult));
  const raw = attackerAtk - defenderDef * defFactor;
  const pathMult = getPathMultiplier(attackerPath, defenderPath);
  const variance = baseMin + Math.random() * (baseMax - baseMin);
  return Math.max(minDmg, Math.round(raw * pathMult * realmMult * moveMult * daoMarkMult * critMult * variance));
}

// ─── v0.6.0 状态效果系统 ───

export type CombatStatusType = 'burn' | 'freeze' | 'poison' | 'stun' | 'bleed' | 'confuse' | 'blind' | 'weaken';

export interface CombatStatus {
  type: CombatStatusType;
  remainingTurns: number;
  potency: number;
}

/** 流派 → 默认状态效果配置 */
export const PATH_STATUS_MAP: Record<string, { type: CombatStatusType; baseChance: number; basePotency: number }> = {
  '炎道': { type: 'burn', baseChance: 0.20, basePotency: 1 },
  '冰道': { type: 'freeze', baseChance: 0.15, basePotency: 1 },
  '毒道': { type: 'poison', baseChance: 0.25, basePotency: 1 },
  '雷道': { type: 'stun', baseChance: 0.15, basePotency: 1 },
  '血道': { type: 'bleed', baseChance: 0.20, basePotency: 1 },
  '智道': { type: 'confuse', baseChance: 0.15, basePotency: 1 },
  '暗道': { type: 'blind', baseChance: 0.15, basePotency: 1 },
  '力道': { type: 'weaken', baseChance: 0.20, basePotency: 1 },
};

/** 计算状态效果每回合造成的伤害（如适用） */
export function calcStatusDamage(status: CombatStatus, maxHp: number): number {
  switch (status.type) {
    case 'burn': return Math.floor(maxHp * 0.03 * status.potency);
    case 'poison': return Math.floor(maxHp * 0.05 * status.potency);
    case 'bleed': return Math.floor(maxHp * 0.08 * status.potency);
    default: return 0;
  }
}

/** 检测状态是否影响回合行动（冻结/麻痹跳过） */
export function isStatusDisabled(statuses: CombatStatus[]): boolean {
  for (const s of statuses) {
    if (s.type === 'freeze') return Math.random() < 0.50;
    if (s.type === 'stun') return Math.random() < 0.30;
  }
  return false;
}

/** 检测混乱状态 */
export function isConfused(statuses: CombatStatus[]): boolean {
  return statuses.some(s => s.type === 'confuse');
}

/** 检测失明对命中率的影响 */
export function getBlindPenalty(statuses: CombatStatus[]): number {
  return statuses.some(s => s.type === 'blind') ? 0.40 : 0;
}

/** 检测虚弱对防御的影响 */
export function getWeakenDefPenalty(statuses: CombatStatus[]): number {
  return statuses.some(s => s.type === 'weaken') ? 0.20 : 0;
}

/** 每回合结束后递减状态效果剩余回合 */
export function tickStatuses(statuses: CombatStatus[]): CombatStatus[] {
  return statuses.map(s => ({ ...s, remainingTurns: s.remainingTurns - 1 })).filter(s => s.remainingTurns > 0);
}

// ─── v0.7.0: 十绝体道痕禁制 — 设计大纲§5.4 ───

/**
 * 检查十绝体道痕亲和/禁制
 * @param guAffinity 蛊虫流派在该体质下的亲和值 (0=完全禁制, 负数=反噬)
 * @param playerAffinity 玩家的流派亲和值
 * @returns blocked=true=禁止使用, selfDamage=使用时反噬扣HP值
 */
export function checkAffinityBlock(
  guAffinity: number,
  playerAffinity: number,
): { blocked: boolean; selfDamage: number } {
  if (playerAffinity === 0) return { blocked: true, selfDamage: 0 };
  if (playerAffinity < 0) return { blocked: false, selfDamage: Math.abs(playerAffinity) * 2 };
  return { blocked: false, selfDamage: 0 };
}
