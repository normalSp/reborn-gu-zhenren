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

/** 成就奖励定义 — v0.7.0 */
export interface AchievementReward {
  /** 元石奖励 */
  currency?: number;
  /** 仙元石奖励 */
  immortalCurrency?: number;
  /** 蛊材奖励 {材料名: 数量} */
  materials?: Record<string, number>;
  /** 解锁的杀招名称 */
  unlockKillMove?: string;
  /** 道痕奖励 {流派: 数值} */
  daoMarks?: Record<string, number>;
}

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
  conditionCheck?: (state: AchievementCheckState) => boolean;
  /** v0.7.0: 成就奖励 */
  reward?: AchievementReward;
  /** v0.7.0: 累进型成就最大进度值（progressMax） */
  progressMax?: number;
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
  /** v0.7.0: 总战斗次数（含胜负） */
  totalBattlesFought: number;
  /** v0.7.0: 玩家自建势力等级 */
  factionLevel: number;
  /** v0.7.0: 自建势力/小队成员数量 */
  membersCount: number;
  /** v0.7.0: 已拥有仙蛊数量 */
  immortalGuCount: number;
  /** v0.7.0: 成功升仙次数 */
  ascensionSuccessCount: number;
  /** v0.7.0: 演武/训练场访问次数 */
  trainingGroundVisits: number;
  /** v0.7.0: 狩猎成功次数 */
  huntSuccessCount: number;
  /** v0.7.0-b: 小队战胜利次数 */
  squadCombatWins: number;
  /** v0.7.0-b: 已招募入队成员次数 */
  squadMembersRecruited: number;
  /** v0.7.0-b: 当前小队成员数（不含玩家） */
  partyMembersCount: number;
  /** v0.7.0-b: 小队重伤救回次数 */
  squadMemberWoundedRescues: number;
  /** v0.7.0-b: 小队成员阵亡次数 */
  squadMemberDeaths: number;
  /** v0.7.0-b: 合击成功次数 */
  squadComboSuccesses: number;
  /** v0.7.0-b: 越级撤退成功次数 */
  squadOverlevelEscapes: number;
  /** v0.7.0-b: 是否为十绝体/纯梦求真体开局或觉醒 */
  hasExtremePhysique: boolean;
  /** v0.7.0: 单流派道痕读取器，用于 singlePathDaoMarks(path) 条件 */
  singlePathDaoMarks: (path: string) => number;
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
