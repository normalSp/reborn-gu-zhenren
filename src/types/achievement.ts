/**
 * 成就系统类型定义 — P2-8
 * 参照 P2-下一步真实开发计划-20260502.md §阶段二·4
 */

/** 成就等级 */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary';

/** 成就类别 */
export type AchievementCategory = '剧情' | '成长' | '收集' | '经济' | '社交' | '探索' | '战斗' | '系统';

/** 成就领域 */
export type AchievementDomain = '南疆' | '北原' | '东海' | '西漠' | '中洲' | '通用';

/** 成就定义 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  category: AchievementCategory;
  domain: AchievementDomain;
  hidden: boolean;
  /** 解锁条件表达式（人类可读） */
  condition: string;
  /** 程序化检测条件 */
  conditionCheck: (state: AchievementCheckState) => boolean;
}

/** 成就检测所需的游戏状态快照 */
export interface AchievementCheckState {
  turn: number;
  realm: string;
  realmNum: number;
  currency: number;
  guCount: number;
  refinedGuCount: number;
  knownNpcCount: number;
  knownLocations: number;
  factionStandings: Record<string, number>;
  daoHeart: { kill: number; mercy: number; scheme: number; ambition: number };
  flags: Record<string, any>;
  deaths: number;
  combatWins: number;
  crossDomainCount: number;
  renZuLegendsHeard: number;
  achievementsUnlocked: string[];
  chapterId: string | null;
  domain: string;
}

/** 成就统计 */
export interface AchievementStats {
  total: number;
  unlocked: number;
  byTier: Record<AchievementTier, { total: number; unlocked: number }>;
  byCategory: Record<AchievementCategory, { total: number; unlocked: number }>;
  byDomain: Record<AchievementDomain, { total: number; unlocked: number }>;
  hiddenUnlocked: number;
}

/** 成就解锁事件 */
export interface AchievementUnlockEvent {
  achievementId: string;
  name: string;
  description: string;
  tier: AchievementTier;
  unlockedAt: number; // timestamp
}
