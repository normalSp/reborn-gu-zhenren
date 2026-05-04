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

// ═══ P2-13: 蛊虫饥饿状态机（四态模型） ═══
/** 
 * 蛊虫饥饿状态机 — P2-13 四态模型
 * optimal = 最佳状态（满饱食），成功率+10%
 * hungry = 饥饿状态（开始降效），成功率-15%
 * injured = 受伤状态（反噬风险），成功率-30%，每轮5%概率反噬（扣除主人10-20生命）
 * dead = 死亡状态（蛊虫已死），不可用且不可恢复
 * 
 * 向后兼容映射（v6→v7存档迁移）:
 *   fed → optimal, starving → injured, dying → dead
 */
export type GuHungerState = 'optimal' | 'hungry' | 'injured' | 'dead';

/** 蛊虫饥饿参数 */
export interface GuHungerConfig {
  /** 每轮饥饿计数累加值（按tier: 1转+1/2转+2/3转+3/4转+4/5转+5） */
  hungerPerTurn: Record<number, number>;
  /** 状态迁移阈值：hungerCounter >= threshold 触发状态降级 */
  thresholds: {
    optimalToHungry: number;   // 默认 5
    hungryToInjured: number;   // 默认 12
    injuredToDead: number;     // 默认 25
  };
  /** 喂养恢复：-10计数/次 */
  feedRecovery: number;
}

export interface GuInstance {
  id: string;
  specId: string;
  name: string;
  customName?: string;
  tier: number;
  path: PathType;
  /** P2-13: 四态饥饿模型（optimal|hungry|injured|dead）。旧存档的fed→optimal, starving→injured, dying→dead映射发生在存档迁移阶段 */
  currentState: GuHungerState;
  /** P2-13: 饥饿累积计数器（确定性模型，替代旧概率模型） */
  hungerCounter: number;
  proficiency: number;
  bonded: boolean;
  active: boolean;
  acquiredAt: { turn: number; narrative: string };
}

// ─── 杀招 ───
/** 杀招熟练度等级 */
export type KillMoveProficiency = 0 | 1 | 2 | 3 | 4;
// 0=入门(-10%倍率) 1=熟练(标准) 2=精通(+10%/-1冷却) 3=大师(+20%/特效解锁) 4=宗师(+30%/可传授)

/** 杀招效果标签（用于联动系统识别） */
export type KillMoveEffectTag = 'refine_speed' | 'refine_success' | 'refine_double' | 'refine_legendary';

export interface KillMove {
  // ─── 现有字段（保持不变） ───
  id: string;
  name: string;
  path: PathType;
  level: number;
  baseCost: number;
  multiplier: number;
  cooldown: number;
  description: string;

  // ─── B2.0: 新增字段（全部可选，向后兼容38条已有数据） ───
  /** 熟练度等级 (0=入门 ~ 4=宗师)，undefined=无熟练度追踪 */
  proficiency?: KillMoveProficiency;
  /** 累计使用次数，用于熟练度升级判定 */
  usageCount?: number;
  /** 核心蛊虫ID列表（自创杀招必需） */
  coreGu?: string[];
  /** 辅助蛊虫ID列表（自创杀招必需） */
  supportGu?: string[];
  /** 进化阶段 (0=原始, 1~N=进化次数) */
  evolutionStage?: number;
  /** 获取来源 */
  source?: 'innate' | 'taught' | 'discovered' | 'created' | 'event';
  /** 原创者名称 */
  creator?: string;
  /** 是否可传授他人（宗师级解锁） */
  canTeach?: boolean;
  /** 额外效果标签（炼蛊加速/成功率等联动） */
  effectTags?: KillMoveEffectTag[];
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

// ─── 空窍（1-5转蛊师） ───
export interface MortalAperture {
  type: 'mortal';
  /** 当前转数 1-5 */
  rank: number;
  /** 小境界 */
  subRank: '初阶' | '中阶' | '高阶' | '巅峰';
  /** 元海（真元之源） */
  primevalSea: {
    /** CSS 色值 */
    color: string;
    /** 元海颜色名：青铜→赤铁→白银→黄金→紫晶 */
    colorName: '青铜' | '赤铁' | '白银' | '黄金' | '紫晶';
    /** 饱满度 0-100。100=十绝体无空腔 */
    fillPercent: number;
  };
  /** 窍壁状态 */
  apertureWall: {
    /** 窍壁阶段 */
    state: '坚实' | '潮汐初现' | '潮汐涌动' | '壁薄如纸';
    /** 不透明度 0-1 */
    opacity: number;
    /** 状态描述 */
    description: string;
  };
  /** 可携带蛊虫数量上限（一转3/二转5/三转8/四转12/五转15） */
  capacity: number;
  /** 当前已携带蛊虫数 */
  carriedGu: number;
}

// ─── 仙窍（6转+蛊仙） ───
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
    /** 道痕增量，如 {"力道": 500, "炎道": 300}。正数为获得，负数为损失（罕见） */
    dao_marks?: Record<string, number>;
    /** 流派境界等级更新，如 {"力道": "大师", "炎道": "入门"} */
    path_levels?: Record<string, string>;
  };
  /** 顶层道痕（passthrough兜底，推荐放在player.dao_marks中） */
  dao_marks?: Record<string, number>;
  path_levels?: Record<string, string>;
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
  triggerKeywords?: string[];     // P2-4b: 触发关键词
  recommendedRealm?: number;      // P2-4b: 推荐境界
  baseChance?: number;            // P2-4b: 基础成功概率
  statBridge: {
    enabled?: boolean;
    realmWeight: number;
    guTagInfluence: { tag: string; bonus: number; note?: string }[];
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

// ─── P2-4a: 决斗引擎类型 ───

/** 决斗阶段状态机 */
export type DuelPhase = 'init' | 'player_turn' | 'enemy_turn' | 'resolution' | 'ended';

/** 玩家可选行动 */
export type DuelAction = 'attack' | 'defend' | 'gu_skill' | 'escape';

/** 决斗结果 */
export interface DuelResult {
  winner: 'player' | 'enemy' | null;
  special?: 'oneshot' | 'escaped' | null;
  playerFinalHp: number;
  enemyFinalHp: number;
  roundsTaken: number;
  escaped: boolean;
}

/** 决斗敌人（扩展EnemyState） */
export interface DuelEnemy {
  name: string;
  realm: string;
  realmNum: number;   // 境界数值: 1-7 (一转→七转)
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  accuracy: number;   // 基础命中值
  evasion: number;    // 基础闪避值
  path: string;       // 流派: 金道/木道/水道/火道/土道/风道/雷道/冰道/力道/魂道/血道/智道
  daoMarks: number;   // P2-P7: 当前流派道痕数
  gu: { name: string; path: string; tier: number }[];  // 装备蛊虫
  moves: DuelMove[];  // 可用杀招
}

/** 杀招/蛊虫技能 */
export interface DuelMove {
  name: string;
  damageMultiplier: number;  // 伤害倍数
  pathBonus: number;         // 流派加成
  description: string;
  /** P2-P7: 关联的杀招ID（killer-moves.json中的key），空字符串表示非杀招 */
  killerMoveId?: string;
  /** P2-P7: 所需核心蛊虫名称列表 */
  requiredCoreGu?: string[];
  /** P2-P7: 激活条件描述 */
  activationContext?: string;
  /** P2-P7: 失败模式描述 */
  failureMode?: string;
}

/** 单个战斗日志条目 */
export interface CombatLogEntry {
  round: number;
  actor: 'player' | 'enemy';
  action: string;
  damage?: number;
  hit?: boolean;
  crit?: boolean;
  message: string;
}

/** 决斗核心状态 */
export interface DuelState {
  duelId: string;
  phase: DuelPhase;
  round: number;
  player: {
    name: string;
    realm: string;
    realmNum: number;
    path: string;
    daoMarks: number;  // P2-P7: 当前流派道痕数，影响伤害
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    accuracy: number;
    evasion: number;
    gu: { name: string; path: string; tier: number }[];
    moves: DuelMove[];
  };
  enemy: DuelEnemy;
  result: DuelResult | null;
  log: CombatLogEntry[];
  startedAt: number;
}

// ─── P2-4b: 叙事战斗触发 ───

export interface NarrativeCombatTrigger {
  sceneId: string;
  combatType: 'duel' | 'narrative';
  duelEnemy?: DuelEnemy;
  narrativeConstraint?: CombatConstraint;
}

// ─── P2-5: NPC对话系统 ───

export type DialogueTopic = '闲聊' | '请教' | '请教杀招' | '交易' | '委托' | '挑衅' | '深交';

export interface DialogueMessage {
  role: 'player' | 'npc';
  text: string;
  affinityChange?: number;
  timestamp: number;
}

export interface ActiveDialogue {
  dialogueId: string;
  npcId: string;
  npcName: string;
  npcPersonality: string;
  npcFaction: string;
  affinity: number;
  messages: DialogueMessage[];
  startedAt: number;
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

// ═══ P2新增：章节路由类型 ═══

/** 条件路由图 — 单条路由 */
export interface ChapterRoute {
  chapterId: string;
  domain: string;
  displayName: string;
  prerequisites: {
    requiredFlags: string[];
    requiredRealm?: number;
    requiredDomain?: string;
    requiredChapter?: string;
  };
  alternatives: string[]; // 互斥章节ID
  isExclusive: boolean; // 独占路由（选了就不能选alternatives）
  domainOpeningChapter: boolean; // 是否为某域的入口章
  priority: number; // 路由优先级（越大越优先）
}

/** 名场面距离检测 — 单条事件距离 */
export interface ProximityEvent {
  eventId: string;
  name: string;
  domain: string;
  distance: number; // 0=L0源发域, 15/30=L1相邻域(high/medium强度), 30/60=L2远隔域, 100=L3全域网
  layer: 'L0' | 'L1' | 'L2' | 'L3';
  manifestation?: string; // P2-2a: L1/L2当前域的涟漪叙事文本（200-400字）
}

/** 全局事件状态 */
export interface GlobalEventStatus {
  triggered: boolean;
  completed: boolean;
  triggeredAtChapter?: string;
}

/** L3全局flag — 来自global-flags.json */
export interface GlobalFlag {
  id: string;
  name: string;
  eventId: string;
  priority: number;
  description: string;
  effectOnNarrative: string; // AI注入的叙事影响描述
  dependsOn: string[];
}

/** 路由结果 — 路由引擎输出 */
export interface ChapterRouteResult {
  reachable: ChapterRoute[];
  recommended?: ChapterRoute;
  upcomingEvents: ProximityEvent[];
}

/** 章节推进结果 — P2扩展多路由选项 */
export interface ChapterProgressionResult {
  shouldTransition: boolean;
  nextChapterId?: string;
  nextChapterOptions?: ChapterRoute[]; // P2: 多路由选项
  nextDomain?: string;
  proximityEvents?: ProximityEvent[]; // P2: 临近的名场面
  reason: string;
}

export type ChapterTransitionState = 'idle' | 'transitioning' | 'confirmed';

// ─── P2-9: 随机遭遇系统类型 ───
export type { EncounterType, EncounterCategory, EncounterRisk, EncounterCooldown, EncounterTriggerCondition, EncounterChoice, EncounterReward, EncounterTemplate, EncounterTriggerResult, EncounterInjectionContext, EncounterRecord, EncounterState } from './encounter';

// ═══ P2-13: 洞天/福地动态模型 ═══
export interface HeavenlyLand {
  id: string;
  type: '洞天' | '福地';
  domain: string;
  name: string;
  /** 面积（亩） */
  areaMu: number;
  /** 时间流速比（洞天内部时间 / 外部时间） */
  timeFlowRatio: number;
  /** 资源产出速率（元石/轮） */
  resourceOutputRate: number;
  /** 地灵信息 */
  earthSpirit: {
    formed: boolean;
    name?: string;
    personality?: string;
    /** 地灵对主人的认可度 0-100 */
    approval: number;
  };
  /** 天灾倒计时（轮） */
  disasterCountdown: number;
  /** 下一场天灾类型 */
  nextDisasterType: string;
  /** 创建回合 */
  createdAt: number;
  /** 当前是否可进入 */
  accessible: boolean;
}

/** NPC关系网络 — 双向好感矩阵 */
export interface NpcRelationMatrix {
  /** 
   * 稀疏矩阵: [npcIdA]: { [npcIdB]: affinity }
   * affinity范围 -100~100
   * 正数=好感，负数=恶感
   * 双向不对称（A对B的好感≠B对A的好感）
   */
  matrix: Record<string, Record<string, number>>;
  /** 矩阵最后更新回合 */
  lastUpdatedTurn: number;
}

// ═══ P2-流派: 流派道痕互斥引擎 ═══
/** 流派互斥检查结果 */
export interface DaoMarkConflict {
  /** 主修流派 */
  primary: PathType;
  /** 冲突的辅修流派 */
  conflicting: PathType;
  /** 互斥程度: 0=兼容, 0.3=轻微冲突(可以辅修), 0.7=严重冲突(不建议), 1.0=完全互斥(不可辅修) */
  severity: number;
  /** 原因说明 */
  reason: string;
}

/** 道痕量变质变规则 */
export interface DaoMarkRule {
  /** 规则适用的流派 */
  path: PathType;
  /** 道痕量：100道痕=1成，300=3成=小成，1000=10成=大成 */
  threshold: number;
  /** 质变后名称 */
  grade: string;
  /** 战力倍率 */
  multiplier: number;
}

// ═══ P2-流派: 本命蛊系统 ═══
export interface LifeboundGu {
  /** 绑定的蛊虫ID */
  guId: string;
  /** 蛊虫名称 */
  guName: string;
  /** 绑定时间(回合) */
  boundAt: number;
  /** 绑定后累计回合 */
  turnsSinceBound: number;
  /** 冷却剩余回合（绑定/解绑后30轮冷却） */
  cooldownRemaining: number;
  /** 自动升级次数 */
  upgradeCount: number;
  /** 是否处于冷却中 */
  onCooldown: boolean;
}

/** 本命蛊死亡惩罚 */
export interface LifeboundDeathPenalty {
  /** 扣除生命百分比 */
  hpPercentLoss: number;
  /** 扣除道痕百分比 */
  daoMarkPercentLoss: number;
  /** 持续时间（轮） */
  duration: number;
  /** 是否触发反噬 */
  backlashTriggered: boolean;
}
