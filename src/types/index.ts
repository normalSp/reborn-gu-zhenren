/**
 * 蛊真人模拟器 — 核心类型定义
 * 基于 GDD §5 和 TDD 第一部分
 */

// ─── 境界系统 ───
export type GrandRealm = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SubRealm = '初阶' | '中阶' | '高阶' | '巅峰';

export interface RealmInfo {
  grand: GrandRealm;
  sub: SubRealm;
  label: string; // '三转中阶'
}

// ─── 流派 ───
export type PathType = string; // '炎道' | '水道' | ... 48流派

export type PathLevel = '普通' | '大师' | '宗师' | '大宗师' | '准无上' | '无上' | '道主';

// ─── 时间模型 ───
export interface GameTime {
  ap: number;
  max_ap: number;
  period: 'morning' | 'noon' | 'evening' | 'night';
  day: number;
  month: number;
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface ImmortalTime {
  inner_year: number;
  inner_month: number;
  inner_day: number;
  time_flow_ratio: number;
}

// ─── 玩家状态 ───
export interface PlayerState {
  profile: {
    name: string;
    realm: RealmInfo;
    background: string;
  };
  attributes: {
    资质: number;
    体魄: number;
    心智: number;
    气运: number;
  };
  vitals: {
    health: { current: number; max: number };
    essence: { current: number; max: number };
  };
  pathBuild: {
    primary: PathType;
    secondary: PathType[];
    path_levels: Record<PathType, PathLevel>;
    dao_marks: Record<PathType, number>;
  };
  daoHeart: {
    kill: number;
    mercy: number;
    scheme: number;
    ambition: number;
  };
  currency: number;
  immortalCurrency: number;
  flags: Record<string, any>;
}

// ─── 蛊虫 ───
export interface GuSpec {
  id: string;
  name: string;
  tier: number;
  path: PathType;
  rank: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'divine';
  isImmortalGu: boolean;
  unique: boolean;
  effects: GuEffect[];
  feedRequirement: GuFeedReq;
  baseRefineDifficulty: number;
}

export interface GuEffect {
  type: string;
  value: number;
  description: string;
}

export interface GuFeedReq {
  essence: number;
  special?: string;
}

export interface GuInstance {
  id: string;
  specId: string;
  name: string;
  customName?: string;
  tier: number;
  path: PathType;
  currentState: 'optimal' | 'fed' | 'hungry' | 'starving' | 'dying';
  proficiency: number;
  bonded: boolean;
  active: boolean;
  acquiredAt: { turn: number; narrative: string };
}

// ─── 杀招 ───
export interface KillMove {
  id: string;
  name: string;
  path: PathType;
  level: number;
  baseCost: number;
  multiplier: number;
  cooldown: number;
  description: string;
}

// ─── 势力与社交 ───
export interface FactionStanding {
  faction_id: string;
  standing: number;
  reputation_tier: '死敌' | '敌对' | '冷淡' | '中立' | '友善' | '尊敬' | '崇拜';
}

export interface CharacterRelation {
  character_id: string;
  name: string;
  relation_type: 'friend' | 'rival' | 'romance' | 'family' | 'mentor' | 'ally' | 'enemy' | 'stranger';
  affinity: number;
  trust: number;
  known_secrets: string[];
  revealed_to_them: string[];
}

// ─── 仙窍 ───
export interface ImmortalAperture {
  type: '福地' | '洞天';
  area_mu: number;
  time_flow_ratio: number;
  resource_nodes: ResourceNode[];
  dao_mark_density: Record<string, number>;
  next_disaster_type: string;
  disaster_countdown: number;
}

export interface ResourceNode {
  id: string;
  type: string;
  output_rate: number;
  quality: number;
}

// ─── 因果 ───
export interface ButterflyEffect {
  id: string;
  cause: string;
  consequence: string;
  affected_npcs: string[];
  severity: 1 | 2 | 3;
  timestamp: number;
}

// ─── 关键事件 ───
export interface KeyEvent {
  id: string;
  type: 'birth' | 'breakthrough' | 'battle' | 'treasure' | 'contact' | 'death' | 'betrayal' | 'discovery';
  turn: number;
  summary: string;
  importance: 1 | 2 | 3;
  timestamp: number;
  relatedNPCs: string[];
}

// ─── AI 相关 ───
export interface Choice {
  id: string;
  text: string;
  risk: 'high' | 'medium' | 'low';
  risk_note: string;
}

export interface NarrativeJSON {
  narrative: {
    text: string;
    choices: Choice[];
  };
  state_update: StateUpdate;
}

export interface StateUpdate {
  player?: {
    realm?: { action: 'set'; value: string };
    attributes?: {
      资质?: { action: 'add'; value: number };
      体魄?: { action: 'add'; value: number };
      心智?: { action: 'add'; value: number };
      气运?: { action: 'add'; value: number };
    };
    health?: { current: number; max: number };
    essence?: { current: number; max: number };
    dao_heart?: { kill?: number; mercy?: number; scheme?: number; ambition?: number };
  };
  gu_inventory?: {
    add?: { name: string; tier: number; path: string; rarity: string; description: string }[];
    remove?: string[];
  };
  flags?: {
    set?: Record<string, any>;
    remove?: string[];
  };
  faction?: Record<string, { standing: number }>;
  wealth?: { delta: number };
  causality?: {
    track?: string;
    butterfly_effects?: string[];
  };
}

// ─── 战斗系统 ───
export interface CombatState {
  combatType: 'duel' | 'narrative' | 'group' | null;
  enemy: EnemyState | null;
}

export interface EnemyState {
  name: string;
  realm: string;
  hp: number;
  maxHp: number;
  attack: number;
}

export interface CombatConstraint {
  sceneId: string;
  combatType: 'narrative';
  scale: 'skirmish' | 'battle' | 'war';
  mustHappen: string[];
  mustNotHappen: string[];
  keyFactions: string[];
  keyNPCs: string[];
  strategicChoiceCount: number;
  narrativeStyle: string;
  statBridge: {
    enabled: boolean;
    realmWeight: number;
    guTagInfluence: { tag: string; bonus: number }[];
  };
}

export interface GroupCombatState {
  combatType: 'group';
  allies: { npcId: string; hp: number; role: 'tank' | 'dps' | 'support' }[];
  enemies: { id: string; hp: number }[];
  formation: 'frontline' | 'flanking' | 'defensive';
}

export interface EscapeCondition {
  canEscape: boolean;
  escapePenalty: { type: string; value: number };
  realmGate: number;
}

// ─── 死亡记录 ───
export interface DeathRecord {
  cause: string;
  turn: number;
  chapter: string;
  realm: string;
  achievementCount: number;
}

export interface AIContext {
  systemPrompt: string;
  playerStateJSON: string;
  keyEvents: KeyEvent[];
  recentMessages: Message[];
  rollingSummary: string;
  mode: 'canon' | 'if';
  turnNumber: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokens?: number;
  elapsed_ms?: number;
}

// ─── 存档 ───
export interface SaveMeta {
  slot: number;
  version: string;
  timestamp: number;
  playerName: string;
  realm: string;
  turn: number;
  mode: 'canon' | 'if';
}

// ─── 地图 ───
export interface MapLocation {
  id: string;
  name: string;
  region: string;
  x: number;
  y: number;
  discovered: boolean;
}

// ─── 天赋 ───
export interface Talent {
  id: string;
  name: string;
  tier: 'gold' | 'red' | 'orange' | 'purple' | 'blue' | 'white';
  description: string;
  benefits: string[];
  costs: string[];
}

// ─── 章节弧光系统 ───
export interface ChapterDefinition {
  id: string;
  name: string;
  displayName: string;
  domain: string;
  domainOpeningChapter: boolean;
  position: {
    region: string;
    area: string;
    accessibleLocations: string[];
  };
  triggerConditions: string;
  keyNPCs: string[];
  keyFactions: string[];
  sceneConstraints: {
    mustHappen: string[];
    mustNotHappen: string[];
    narrativeTheme: string;
  };
  goals: ChapterGoal[];
  globalEventId?: string;
  exitTriggers?: string;
  economyTier: number;
  chapterPriceMultiplier: number;
  rippleLayers: string[];
}

export interface ChapterGoal {
  id: string;
  description: string;
  type: 'milestone' | 'realm_gate' | 'exploration' | 'economy' | 'decision';
}

export interface ChapterRecord {
  chapterId: string;
  domain: string;
  startedAt: { turn: number; timestamp: number };
  completedAt?: { turn: number; timestamp: number };
  goalsCompleted: string[];
  goalsFailed: string[];
}

export type EventStatus = 'pending' | 'active' | 'resolved' | 'skipped';

export type GoalStatus = 'locked' | 'active' | 'completed' | 'failed';

export interface ChapterProgressionResult {
  shouldTransition: boolean;
  nextChapterId?: string;
  nextDomain?: string;
  reason: string;
}

export type ChapterTransitionState = 'idle' | 'transitioning' | 'confirmed';
