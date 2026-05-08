import combatConfigRaw from '../canon/combat-config.json';
import type { BattleActionPreview, BattlePreview, DuelAction, DuelMove, DuelState, EscapePreview } from '../types';
import {
  calcDaoResonance,
  calcHitRate,
  getPathMultiplier,
  getRealmCoefficients,
} from './combat-formulas';

const config = combatConfigRaw as any;
const constants = config.constants || {};
const resourceCost = config.resourceCost || {};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pct(value: number): number {
  return Math.round(value * 100);
}

function essenceLabel(realmNum: number): '真元' | '仙元' {
  return realmNum >= 6 ? '仙元' : '真元';
}

function baseActionCost(action: DuelAction, realmNum: number): number {
  if (realmNum >= 6) return 0;
  if (action === 'attack') return Number(resourceCost.basicAttackEssencePct ?? 5);
  if (action === 'defend') return Number(resourceCost.defendEssencePct ?? 3);
  if (action === 'escape') return Number(resourceCost.escapeEssencePct ?? 2);
  return 0;
}

function getMoveCost(move: DuelMove, playerRealmNum: number): number {
  const moveWithCost = move as DuelMove & { baseCost?: number };
  const overreachPenalty = move.rankPenalty;
  const isOverreaching = overreachPenalty !== undefined && overreachPenalty < 1;
  if (playerRealmNum >= 6) {
    if (!isOverreaching) return Number(resourceCost.immortalGuDefaultEssence ?? 1);
    const steps = 1 / Math.max(0.1, overreachPenalty);
    return Math.round(15 * steps);
  }
  return Number(moveWithCost.baseCost ?? resourceCost.defaultGuSkillEssencePct ?? 8);
}

function expectedDamageRange(state: DuelState, moveMult = 1): { min: number; max: number } {
  const coeff = getRealmCoefficients(state.player.realmNum, state.enemy.realmNum);
  const pathMult = getPathMultiplier(state.player.path, state.enemy.path);
  const daoMult = calcDaoResonance(state.player.daoMarks, state.enemy.daoMarks);
  const defenseFactor = Number(constants.defenseFactor?.value ?? 0.5);
  const raw = Math.max(Number(constants.minDamage?.value ?? 1), state.player.attack - state.enemy.defense * defenseFactor);
  const base = raw * pathMult * coeff.playerDamageMult * moveMult * daoMult;
  const minVariance = Number(constants.baseVariance?.min ?? 0.85);
  const maxVariance = Number(constants.baseVariance?.max ?? 1.15);
  return {
    min: Math.max(1, Math.round(base * minVariance)),
    max: Math.max(1, Math.round(base * maxVariance)),
  };
}

function buildActionPreview(state: DuelState, action: DuelAction, label: string): BattleActionPreview {
  const coeff = getRealmCoefficients(state.player.realmNum, state.enemy.realmNum);
  const cost = baseActionCost(action, state.player.realmNum);
  const available = state.player.essence.current >= cost;
  const hitRate = action === 'defend' || action === 'escape'
    ? undefined
    : calcHitRate(state.player.accuracy, state.enemy.evasion, coeff.playerHitBonus);
  const damage = action === 'attack' ? expectedDamageRange(state) : undefined;
  return {
    action,
    label,
    essenceLabel: essenceLabel(state.player.realmNum),
    essenceCost: cost,
    hitRate,
    expectedDamageMin: damage?.min,
    expectedDamageMax: damage?.max,
    available,
    reason: available ? undefined : `${essenceLabel(state.player.realmNum)}不足`,
  };
}

function buildMovePreview(state: DuelState, move: DuelMove): BattleActionPreview {
  const coeff = getRealmCoefficients(state.player.realmNum, state.enemy.realmNum);
  const cost = getMoveCost(move, state.player.realmNum);
  const hitRate = calcHitRate(state.player.accuracy, state.enemy.evasion, coeff.playerHitBonus + move.pathBonus);
  const damage = expectedDamageRange(state, move.damageMultiplier * (move.rankPenalty ?? 1));
  const missingCoreGu = (move.requiredCoreGu || []).filter(coreGu => !state.player.gu.some(gu => gu.name === coreGu));
  const available = state.player.essence.current >= cost && missingCoreGu.length === 0;
  return {
    action: 'killer_move',
    label: move.name,
    essenceLabel: essenceLabel(state.player.realmNum),
    essenceCost: cost,
    hitRate,
    expectedDamageMin: damage.min,
    expectedDamageMax: damage.max,
    available,
    reason: !available
      ? (missingCoreGu.length > 0 ? `缺核心蛊：${missingCoreGu.join('、')}` : `${essenceLabel(state.player.realmNum)}不足`)
      : undefined,
    note: move.rankPenalty && move.rankPenalty < 1 ? '越阶施展有反噬' : undefined,
  };
}

export function buildEscapePreview(state: DuelState): EscapePreview {
  const realmDiff = state.enemy.realmNum - state.player.realmNum;
  const overwhelmThreshold = Number(config.realmCoefficients?.overwhelmThreshold ?? 2);
  const escapePenalty = realmDiff >= overwhelmThreshold ? Number(config.escape?.overwhelmPenalty ?? -0.3) : 0;
  const baseChance = Number(constants.escape?.baseChance ?? config.escape?.baseChance ?? 0.5);
  const rankDiffBonus = Number(constants.escape?.levelBonus ?? config.escape?.rankDiffBonus ?? 0.1);
  const chance = clamp(
    baseChance + (state.player.realmNum - state.enemy.realmNum) * rankDiffBonus + escapePenalty,
    Number(config.escape?.minChance ?? 0.05),
    Number(config.escape?.maxChance ?? 0.85),
  );
  const cost = baseActionCost('escape', state.player.realmNum);
  const blocked = state.player.essence.current < cost;
  return {
    chance,
    label: `${pct(chance)}%`,
    essenceLabel: essenceLabel(state.player.realmNum),
    essenceCost: cost,
    blocked,
    reason: blocked ? `${essenceLabel(state.player.realmNum)}不足` : undefined,
  };
}

export function buildBattlePreview(state: DuelState): BattlePreview {
  const coeff = getRealmCoefficients(state.player.realmNum, state.enemy.realmNum);
  const rankDiff = state.enemy.realmNum - state.player.realmNum;
  const pathMultiplier = getPathMultiplier(state.player.path, state.enemy.path);
  const daoResonance = calcDaoResonance(state.player.daoMarks, state.enemy.daoMarks);
  const crossRealm = (state.player.realmNum >= 6) !== (state.enemy.realmNum >= 6);
  const warnings: string[] = [];

  if (crossRealm && state.player.realmNum < 6) warnings.push('凡人撼仙：常规胜利关闭，优先逃脱、拖延或剧情机缘。');
  if (rankDiff >= 2 && !crossRealm) warnings.push('敌方境界显著压制，硬刚风险极高。');
  if (state.player.essence.current <= Math.ceil(state.player.essence.max * 0.15)) warnings.push(`${essenceLabel(state.player.realmNum)}接近枯竭，杀招与逃跑都会受限。`);

  const actions = [
    buildActionPreview(state, 'attack', '攻击'),
    buildActionPreview(state, 'defend', '防御'),
    ...state.player.moves.map(move => buildMovePreview(state, move)),
  ];

  return {
    pressure: {
      rankDiff,
      rankLabel: rankDiff === 0 ? '同转' : (rankDiff > 0 ? `敌高${rankDiff}转` : `你高${Math.abs(rankDiff)}转`),
      playerDamageMult: coeff.playerDamageMult,
      enemyDamageMult: coeff.enemyDamageMult,
      playerHitBonus: coeff.playerHitBonus,
      enemyHitBonus: coeff.enemyHitPenalty,
      pathMultiplier,
      pathLabel: pathMultiplier === 1 ? '无明显克制' : (pathMultiplier > 1 ? '你方流派占优' : '敌方流派占优'),
      daoResonance,
      daoLabel: daoResonance === 1 ? '道痕相当' : (daoResonance > 1 ? '你方道痕共鸣' : '敌方道痕压制'),
      crossRealm,
    },
    actions,
    escape: buildEscapePreview(state),
    warnings,
  };
}
