/**
 * 随机遭遇系统类型定义 — P2-9
 * 基于 P2-下一步真实开发计划-20260502.md §阶段一
 */

/** 遭遇类型 */
export type EncounterType = 'danger' | 'opportunity' | 'social' | 'exploration' | 'rest';

/** 遭遇子类别 */
export type EncounterCategory = 'combat' | 'survival' | 'resource' | 'trade' | 'treasure' | 'skill' | 'npc' | 'moral' | 'travel' | 'loot' | 'recovery';

/** 遭遇风险等级 */
export type EncounterRisk = 'none' | 'low' | 'medium' | 'high';

/** 遭遇冷却配置 */
export interface EncounterCooldown {
  /** 同类型遭遇冷却（轮数） */
  sameType: number;
  /** 同章遭遇冷却（轮数） */
  sameChapter: number;
}

/** 遭遇触发条件 */
export interface EncounterTriggerCondition {
  minRealm: number;
  maxRealm: number;
  region: string;
  locationKeyword: string[];
  minTurn: number;
  /** 遭遇冷却配置 */
  cooldown: EncounterCooldown;
  /** 是否需要拥有至少一只蛊虫 */
  requiresGu?: boolean;
  /** 最低元石要求 */
  minCurrency?: number;
}

/** 遭遇选项 */
export interface EncounterChoice {
  id: string;
  text: string;
  risk: EncounterRisk;
  outcome: string;
}

/** 遭遇奖励-材料 */
export interface EncounterRewardMaterials {
  [materialName: string]: [number, number];
}

/** 遭遇奖励-势力声望 */
export interface EncounterFactionStanding {
  [factionId: string]: [number, number];
}

/** 遭遇奖励-道心 */
export interface EncounterDaoHeartReward {
  mercy?: [number, number];
  kill?: [number, number];
  scheme?: [number, number];
  ambition?: [number, number];
}

/** 遭遇奖励-Flag */
export interface EncounterFlagReward {
  set?: Record<string, any>;
  remove?: string[];
}

/** 遭遇奖励-蛊虫奖励（随机） */
export interface EncounterGuReward {
  /** 随机蛊虫概率 0-1 */
  chance: number;
  /** 额外说明 */
  note?: string;
  /** 随机蛊虫等阶 */
  randomTier?: number;
  /** 随机蛊虫流派 */
  randomPath?: string;
}

/** 遭遇奖励 */
export interface EncounterReward {
  /** 元石奖励 [min, max] */
  currency?: [number, number];
  /** 材料奖励 */
  materials?: EncounterRewardMaterials;
  /** 蛊虫奖励 */
  gu?: EncounterGuReward;
  /** 势力声望变化 */
  factionStanding?: EncounterFactionStanding;
  /** 道心变化 */
  daoHeart?: EncounterDaoHeartReward;
  /** Flag变化 */
  flags?: EncounterFlagReward;
  /** 恢复效果 */
  recovery?: {
    hpRestore?: [number, number];
    essenceRestore?: [number, number];
  };
  /** 永久buff */
  permanentBuff?: Record<string, any>;
  /** 解锁的知识/配方 */
  knowledge?: string;
  /** NPC关系建立信息 */
  npcRelation?: string;
  /** 情报信息 */
  intel?: string;
  /** 商店物品说明 */
  shopItems?: string;
  /** 货币价值说明 */
  currencyValue?: string;
  /** 经验说明 */
  experienceNote?: string;
  /** 后续事件说明 */
  note?: string;
  /** B2.5a: 杀招残卷奖励 — 遭遇探索中获得 */
  killMoveFragment?: {
    /** 掉落概率 0-1 */
    chance: number;
    /** 杀招等阶范围 [min, max] */
    tierRange: [number, number];
    /** 说明文本 */
    description?: string;
  };
}

/** 遭遇模板 — canon/encounters.json 中的单条模板 */
export interface EncounterTemplate {
  id: string;
  type: EncounterType;
  category: EncounterCategory;
  title: string;
  description: string;
  narrativeTemplate: string;
  triggerConditions: EncounterTriggerCondition;
  choices: EncounterChoice[];
  rewards: EncounterReward;
}

/** 遭遇触发结果 */
export interface EncounterTriggerResult {
  triggered: boolean;
  template?: EncounterTemplate;
  reason?: string;
}

/** 遭遇注入上下文（传给 context-builder 注入 AI prompt） */
export interface EncounterInjectionContext {
  encounterId: string;
  type: EncounterType;
  title: string;
  narrativeTemplate: string;
  choices: EncounterChoice[];
  rewards: EncounterReward;
}

/** 遭遇记录 */
export interface EncounterRecord {
  encounterId: string;
  templateId: string;
  type: EncounterType;
  title: string;
  triggeredAtTurn: number;
  chosenOptionId?: string;
  resolvedAtTurn?: number;
}

/** 遭遇Store状态 */
export interface EncounterState {
  /** 最近触发遭遇记录（最近10条） */
  recentEncounters: EncounterRecord[];
  /** 冷却计时器（记录 'type-chapterId' → 上次触发轮数） */
  cooldownTimers: Record<string, number>;
  /** 当前活跃遭遇ID */
  activeEncounterId: string | null;
  /** 当前活跃遭遇模板 */
  activeEncounter: EncounterTemplate | null;
}
