/**
 * ═══ 洞天福地引擎 — P2-14 纯函数模块 ═══
 *
 * 职责：每回合推进洞天/福地状态——资源产出、灾劫倒计时、地灵审批。
 * 全部为纯函数，不直接操作 Zustand store。
 *
 * 调用方：playerSlice.advanceTurn() 通过 tickHeavenlyLand() 调用
 */

import type { HeavenlyLand } from '../types';

// ─── 常量 ───

/** 每回合资源产出倍率基准 */
const BASE_RESOURCE_MULTIPLIER = 1.0;

/** 地灵审批基础概率（百分制），洞天高于福地 */
const EARTH_SPIRIT_BASE_APPROVAL_CHANCE: Record<'洞天' | '福地', number> = {
  '洞天': 25,
  '福地': 15,
};

/** 道痕密度对地灵审批的加成系数（每100道痕+8%概率） */
const DAO_DENSITY_APPROVAL_BONUS = 0.08;

/** 地灵审批上限概率 */
const MAX_APPROVAL_CHANCE = 80;

/** 灾劫基础伤害倍率 */
const DISASTER_DAMAGE_MULTIPLIER: Record<string, number> = {
  '地火': 0.15,
  '天水': 0.12,
  '风灾': 0.18,
  '雷劫': 0.22,
};

/** 新灾劫冷却回合范围 */
const DISASTER_COOLDOWN_RANGE: [number, number] = [40, 80];

/** 灾劫类型池 */
const DISASTER_TYPES = ['地火', '天水', '风灾', '雷劫'] as const;

// ─── 接口定义 ───

export interface HeavenlyLandTickResult {
  /** 本回合产出资源（元石值） */
  resourceYield: number;
  /** 灾劫是否触发 */
  disasterTriggered: boolean;
  /** 灾劫详情（触发时有值） */
  disasterDetail: string | null;
  /** 灾劫面积损失（亩） */
  areaLoss: number;
  /** 地灵是否在本回合审批完成 */
  earthSpiritApproved: boolean;
  /** 地灵名称（审批后填充） */
  earthSpiritName: string | null;
  /** 叙事注入文本（灾劫触发时） */
  narrativeInjection: string | null;
}

/** 地灵审批输入上下文 */
export interface EarthSpiritApprovalContext {
  /** 道痕密度总和 */
  totalDaoDensity: number;
  /** 玩家境界 */
  realmGrand: number;
  /** 当前回合 */
  turn: number;
}

// ─── 核心函数 ───

/**
 * 推进洞天/福地一个回合
 * @param land 当前洞天/福地状态（会被就地修改，调用方需自行做不可变处理）
 * @param daoDensity 道痕密度上下文
 * @param realmGrand 玩家境界
 * @param turn 当前回合
 * @returns 推进结果摘要
 */
export function tickHeavenlyLand(
  land: HeavenlyLand,
  daoDensity: EarthSpiritApprovalContext,
  realmGrand: number,
  turn: number,
): HeavenlyLandTickResult {
  if (!land.accessible) {
    return {
      resourceYield: 0,
      disasterTriggered: false,
      disasterDetail: null,
      areaLoss: 0,
      earthSpiritApproved: false,
      earthSpiritName: null,
      narrativeInjection: null,
    };
  }

  // ─── 1. 资源产出 ───
  const timeBonus = land.timeFlowRatio * BASE_RESOURCE_MULTIPLIER;
  const landTypeBonus = land.type === '洞天' ? 1.3 : 1.0;
  const realmBonus = 1 + realmGrand * 0.15;
  const resourceYield = Math.floor(land.resourceOutputRate * timeBonus * landTypeBonus * realmBonus);

  // ─── 2. 灾劫倒计时与触发 ───
  let disasterTriggered = false;
  let disasterDetail: string | null = null;
  let areaLoss = 0;
  let narrativeInjection: string | null = null;

  land.disasterCountdown = Math.max(0, land.disasterCountdown - 1);

  if (land.disasterCountdown <= 0) {
    disasterTriggered = true;
    const disasterType = land.nextDisasterType || '地火';
    const damageMultiplier = DISASTER_DAMAGE_MULTIPLIER[disasterType] || 0.15;
    // 灾劫伤害：面积损失，福地更脆弱
    const fragility = land.type === '福地' ? 1.4 : 1.0;
    areaLoss = Math.max(1, Math.floor(land.areaMu * damageMultiplier * fragility * (0.8 + Math.random() * 0.4)));

    land.areaMu = Math.max(10, land.areaMu - areaLoss);
    land.resourceOutputRate = Math.max(1, Math.floor(land.resourceOutputRate * 0.85));

    disasterDetail = `${disasterType}来袭，${land.name}损失${areaLoss}亩，资源产出下降15%`;

    // 生成叙事注入文本
    narrativeInjection = generateDisasterNarrative(land.name, disasterType, areaLoss, land.domain);

    // 重置灾劫
    const [minCd, maxCd] = DISASTER_COOLDOWN_RANGE;
    land.disasterCountdown = minCd + Math.floor(Math.random() * (maxCd - minCd));
    land.nextDisasterType = DISASTER_TYPES[Math.floor(Math.random() * DISASTER_TYPES.length)];
  }

  // ─── 3. 地灵审批 ───
  const approvalResult = tryEarthSpiritApproval(land, daoDensity, turn);

  return {
    resourceYield,
    disasterTriggered,
    disasterDetail,
    areaLoss,
    earthSpiritApproved: approvalResult.approved,
    earthSpiritName: approvalResult.name,
    narrativeInjection,
  };
}

/**
 * 尝试地灵审批
 * 基于道痕密度的概率判定，审批通过后地灵命名并记录
 */
function tryEarthSpiritApproval(
  land: HeavenlyLand,
  ctx: EarthSpiritApprovalContext,
  turn: number,
): { approved: boolean; name: string | null } {
  if (land.earthSpirit.formed) {
    return { approved: false, name: land.earthSpirit.name || null };
  }

  const baseChance = EARTH_SPIRIT_BASE_APPROVAL_CHANCE[land.type];
  const daoBonus = ctx.totalDaoDensity * DAO_DENSITY_APPROVAL_BONUS;
  const realmPenalty = Math.max(0, (ctx.realmGrand - 6) * 3); // 高境界反而不利地灵生成
  const chance = Math.min(MAX_APPROVAL_CHANCE, baseChance + daoBonus - realmPenalty);

  const roll = Math.random() * 100;
  if (roll >= chance) {
    return { approved: false, name: null };
  }

  // 地灵诞生
  const spiritName = generateEarthSpiritName(land.domain, land.type);
  land.earthSpirit = {
    formed: true,
    name: spiritName,
    personality: getRandomPersonality(),
    approval: 30 + Math.floor(Math.random() * 30),
  };

  return { approved: true, name: spiritName };
}

// ─── 辅助函数 ───

/** 地灵人名池 */
const SPIRIT_NAME_POOL: Record<string, string[]> = {
  '南疆': ['青竹', '碧落', '幽兰', '墨韵', '琴心', '云岫', '灵犀'],
  '北原': ['寒霜', '朔风', '冰魄', '雪舞', '银月', '凌虚', '玄英'],
  '东海': ['潮汐', '碧波', '沧溟', '明珠', '珊瑚', '龙吟', '汐音'],
  '西漠': ['金沙', '赤焰', '流萤', '暮云', '灼华', '荧惑', '烈阳'],
  '中洲': ['天枢', '玉衡', '璇玑', '紫微', '太一', '玄冥', '昆仑'],
};

/** 地灵性格池 */
const SPIRIT_PERSONALITIES = [
  '温婉如水，善解人意',
  '冷傲孤高，不易亲近',
  '活泼调皮，喜欢恶作剧',
  '沉稳厚重，如长辈般关怀',
  '天真烂漫，对一切都充满好奇',
  '神秘莫测，偶尔透露天机',
  '慵懒散漫，只在自己感兴趣时出现',
];

function generateEarthSpiritName(domain: string, landType: string): string {
  const pool = SPIRIT_NAME_POOL[domain] || SPIRIT_NAME_POOL['南疆'];
  const prefix = landType === '洞天' ? '玄' : '灵';
  const name = pool[Math.floor(Math.random() * pool.length)];
  return `${prefix}${name}`;
}

function getRandomPersonality(): string {
  return SPIRIT_PERSONALITIES[Math.floor(Math.random() * SPIRIT_PERSONALITIES.length)];
}

/** 生成灾劫叙事文本 */
function generateDisasterNarrative(
  landName: string,
  disasterType: string,
  areaLoss: number,
  domain: string,
): string {
  const templates: Record<string, string[]> = {
    '地火': [
      `【${landName}】深处裂缝喷涌炽热地火，灼烧${areaLoss}亩灵田，空气中弥漫着硫磺与焦土的气息。`,
      `火脉暴动，${landName}地底传来沉闷轰鸣，赤红岩浆沿裂缝蔓延，焚毁${areaLoss}亩洞天福地。`,
      `地火从九幽之下翻涌而上，${landName}内${areaLoss}亩灵植化为飞灰，道痕被烈焰灼伤。`,
    ],
    '天水': [
      `【${landName}】上空乌云密布，天水倾泻如瀑，淹没${areaLoss}亩灵田，道痕被冲刷得黯淡无光。`,
      `天河决堤，${landName}被滔滔天水灌入，${areaLoss}亩良田化作泽国，灵气四散。`,
      `天降玄水，绵绵不绝，${landName}内${areaLoss}亩药田被浸泡，蛊虫哀鸣不止。`,
    ],
    '风灾': [
      `【${landName}】狂风骤起，凛冽罡风如刀割，卷走${areaLoss}亩表层灵土，道痕被吹散剥离。`,
      `九天罡风破开${landName}结界，${areaLoss}亩福地灵脉被摧毁，灵气外泄如烟。`,
      `黑风自虚无中涌出，${landName}内飞沙走石，${areaLoss}亩洞天内一切化为齑粉。`,
    ],
    '雷劫': [
      `【${landName}】苍穹裂开，紫黑色雷霆接连劈落，击毁${areaLoss}亩灵脉根基，雷痕铭刻大地。`,
      `天劫骤降，万道雷光将${landName}劈得千疮百孔，${areaLoss}亩化为焦土，雷纹密布。`,
      `紫色劫雷锁定${landName}，轰鸣声中${areaLoss}亩福地灵脉寸断，地灵发出痛苦哀嚎。`,
    ],
  };

  const pool = templates[disasterType] || templates['地火'];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 计算洞天/福地当前估值（元石）
 * 用于UI展示和存档迁移
 */
export function calculateHeavenlyLandValue(land: HeavenlyLand): number {
  if (!land.accessible) return 0;
  const typeMultiplier = land.type === '洞天' ? 2.0 : 1.0;
  const areaBonus = land.areaMu * 10;
  const outputBonus = land.resourceOutputRate * 50;
  const timeBonus = land.timeFlowRatio * 100;
  const spiritBonus = land.earthSpirit.formed ? (land.earthSpirit.approval || 0) * 5 : 0;
  return Math.floor((areaBonus + outputBonus + timeBonus + spiritBonus) * typeMultiplier);
}

/**
 * 获取灾劫剩余回合的UI状态等级
 */
export function getDisasterUrgencyLevel(countdown: number): 'safe' | 'warning' | 'critical' {
  if (countdown > 30) return 'safe';
  if (countdown > 10) return 'warning';
  return 'critical';
}
