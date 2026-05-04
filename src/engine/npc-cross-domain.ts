/**
 * NPC 跨域管理系统 — P2-3b
 *
 * 三大功能：
 * 1. 域内NPC过滤 (filterNpcByDomain) — 按 currentDomain 过滤NPC池至 40-60 人
 * 2. 跨域亲和衰减 (crossDomainAffinityDecay) — 离开某域后该域 NPC affinity 每10轮-1
 * 3. 跨域通信 (crossDomainCommunication) — 花费 AP 和元石寄信给其他域 NPC
 * 4. NPC 跨域迁移 (getMigrationNpcs) — 重要 NPC 随原著事件跨域移动
 */

import type { CharacterRelation } from '../types';

// ─── NPC 记录（简化为轻量结构） ───

export interface NpcRecord {
  id: string;
  name: string;
  faction: string;
  domain: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  /** 人物性格 */
  personality: string;
  /** 与玩家的关系 */
  relationship: string;
  /** 动态头衔映射 (chapterId → title) */
  dynamicTitles?: Record<string, string>;
}

// ─── 域信息 ───

export const DOMAINS = ['南疆', '北原', '东海', '西漠', '中洲'] as const;
export type Domain = typeof DOMAINS[number];

/** 域对应势力关键词映射 */
const DOMAIN_FACTION_KEYWORDS: Record<string, string[]> = {
  '南疆': ['古月', '南疆', '青茅', '商路', '山'],
  '北原': ['北原', '雪', '荒', '草原'],
  '东海': ['东海', '海', '水'],
  '西漠': ['西漠', '沙', '漠'],
  '中洲': ['中洲', '中', '天', '庭'],
};

// ─── 1. 域内NPC过滤 ───

/**
 * 按 currentDomain 过滤 NPC 池至 40-60 人
 * 优先级：同域 → 同势力 → 角色重要性
 *
 * @param npcs 全部NPC记录
 * @param currentDomain 当前所在域
 * @param currentFaction 当前势力
 * @param maxCount 最大返回数量（默认60）
 * @param minCount 最小返回数量（默认40，不足则补充跨域NPC）
 */
export function filterNpcByDomain(
  npcs: NpcRecord[],
  currentDomain: string,
  currentFaction: string,
  maxCount: number = 60,
  minCount: number = 40,
): { filtered: NpcRecord[]; excluded: NpcRecord[] } {
  // 第一层：同域NPC
  const sameDomain = npcs.filter(n => n.domain === currentDomain);
  const otherDomain = npcs.filter(n => n.domain !== currentDomain);

  // 同域内排序：角色重要性 + 势力相关性
  const roleWeight: Record<string, number> = { protagonist: 4, antagonist: 3, supporting: 2, minor: 0 };
  sameDomain.sort((a, b) => {
    const aScore = (roleWeight[a.role] || 0) + (a.faction === currentFaction ? 2 : 0);
    const bScore = (roleWeight[b.role] || 0) + (b.faction === currentFaction ? 2 : 0);
    return bScore - aScore;
  });

  if (sameDomain.length >= minCount) {
    // 同域足够 → 截取最多 maxCount
    const taken = sameDomain.slice(0, maxCount);
    return { filtered: taken, excluded: sameDomain.slice(maxCount).concat(otherDomain) };
  }

  // 同域不足 → 补充跨域重要NPC
  const shortage = minCount - sameDomain.length;
  const crossDomain = otherDomain
    .filter(n => n.role !== 'minor')
    .sort((a, b) => (roleWeight[b.role] || 0) - (roleWeight[a.role] || 0))
    .slice(0, Math.min(shortage, 20));

  return {
    filtered: [...sameDomain, ...crossDomain],
    excluded: npcs.filter(n => !sameDomain.includes(n) && !crossDomain.includes(n)),
  };
}

// ─── 2. 跨域亲和衰减 ───

export interface AffinityRecord {
  npcId: string;
  npcName: string;
  domain: string;
  affinity: number;
  turnsSinceDeparted: number; // 离开该域后的轮数
}

/**
 * 跨域亲和衰减
 * 离开某域后，该域内的 NPC 亲和每 10 轮 -1
 *
 * @param affinities 当前所有NPC亲和记录
 * @param currentDomain 当前所在域
 * @returns 更新后的亲和记录和变化说明
 */
export function crossDomainAffinityDecay(
  affinities: AffinityRecord[],
  currentDomain: string,
): { updated: AffinityRecord[]; changes: { npcId: string; npcName: string; oldAffinity: number; newAffinity: number }[] } {
  const changes: { npcId: string; npcName: string; oldAffinity: number; newAffinity: number }[] = [];
  const updated = affinities.map(a => {
    if (a.domain === currentDomain) {
      // 在当前域 → 重置离开计数
      return { ...a, turnsSinceDeparted: 0 };
    }

    // 不在当前域 → 离开计数+1
    const newTurns = a.turnsSinceDeparted + 1;

    // 每10轮衰减-1，最低至-50
    let newAffinity = a.affinity;
    if (newTurns > 0 && newTurns % 10 === 0 && a.affinity > -50) {
      newAffinity = Math.max(-50, a.affinity - 1);
      changes.push({
        npcId: a.npcId,
        npcName: a.npcName,
        oldAffinity: a.affinity,
        newAffinity,
      });
    }

    return { ...a, turnsSinceDeparted: newTurns, affinity: newAffinity };
  });

  return { updated, changes };
}

// ─── 3. 跨域通信 ───

export interface CrossDomainMessage {
  fromDomain: string;
  toDomain: string;
  senderNpcId: string;
  recipientNpcId: string;
  content: string;    // 信件内容
  costAP: number;     // 消耗行动力
  costCurrency: number; // 消耗元石
  sentAtTurn: number;
}

/**
 * 计算跨域通信消耗
 * 基础消耗 + 域距加成
 */
export function calcCrossDomainCost(fromDomain: string, toDomain: string): { ap: number; currency: number } {
  const domainDistances: Record<string, Record<string, number>> = {
    '南疆': { '南疆': 0, '北原': 2, '东海': 1, '西漠': 1, '中洲': 2 },
    '北原': { '南疆': 2, '北原': 0, '东海': 2, '西漠': 3, '中洲': 1 },
    '东海': { '南疆': 1, '北原': 2, '东海': 0, '西漠': 2, '中洲': 2 },
    '西漠': { '南疆': 1, '北原': 3, '东海': 2, '西漠': 0, '中洲': 2 },
    '中洲': { '南疆': 2, '北原': 1, '东海': 2, '西漠': 2, '中洲': 0 },
  };

  const dist = domainDistances[fromDomain]?.[toDomain] ?? 5;
  return {
    ap: dist <= 1 ? 1 : dist <= 2 ? 2 : 3,
    currency: dist * 20, // 每级距离 20 元石
  };
}

// ─── 4. NPC 跨域迁移 ───

/**
 * NPC 跨域迁移规则
 * 基于原著事件的时间线，重要 NPC 随事件跨域移动
 */
export interface NpcMigration {
  npcId: string;
  npcName: string;
  fromDomain: string;
  toDomain: string;
  triggerEvent: string;    // 触发迁移的原著事件ID
  triggerChapter: string;  // 触发迁移的章节
  narrative: string;       // 迁移叙事描述
}

/** 预定义的 NPC 跨域迁移列表 */
export const NPC_MIGRATIONS: NpcMigration[] = [
  {
    npcId: 'gu_yue_fang_yuan',
    npcName: '古月方源',
    fromDomain: '南疆',
    toDomain: '北原',
    triggerEvent: 'sanwang_yitian',
    triggerChapter: 'sanwang_yitian',
    narrative: '方源离开南疆，北上前往北原寻求更强的蛊虫与机缘。',
  },
  {
    npcId: 'tian_he_shang_ren',
    npcName: '天鹤上人',
    fromDomain: '南疆',
    toDomain: '中洲',
    triggerEvent: 'zhongzhou_contact',
    triggerChapter: 'zhongzhou_chutan',
    narrative: '天鹤上人受中洲天庭征召，离开南疆前往中洲。',
  },
];

/**
 * 检测当前章节是否有NPC需要跨域迁移
 */
export function getMigrationNpcs(chapterId: string): NpcMigration[] {
  return NPC_MIGRATIONS.filter(m => m.triggerChapter === chapterId);
}

/**
 * 判断NPC是否在当前域
 */
export function isNpcInDomain(npc: NpcRecord, currentDomain: string, migrations: NpcMigration[]): boolean {
  // 检查是否有针对此NPC的迁移
  const migration = migrations.find(m => m.npcId === npc.id);
  if (migration) {
    return migration.toDomain === currentDomain;
  }
  return npc.domain === currentDomain;
}
