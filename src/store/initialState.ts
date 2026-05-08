/**
 * 蛊真人模拟器 — 统一初始状态
 *
 * 用途：
 * 1. resetStore() 全量重置时使用（新游戏 / 重入轮回）
 * 2. 每个 slice 的初始值集中管理，新增 slice 时同步更新
 *
 * 约定：
 * - 只包含可序列化数据，不包含函数
 * - 与各 slice 的 createXxxSlice 初始值严格一致
 * - 新增 slice 后必须在 INITIAL_STATE 中追加对应初始值
 */

import type { ScreenState, GameMode, PipelinePhase } from './slices/uiSlice';

export const INITIAL_STATE = {
  // ─── playerSlice ───
  profile: {
    name: '',
    realm: { grand: 1 as const, sub: '初阶' as const, label: '一转初阶' },
    background: '',
  },
  attributes: { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
  vitals: {
    health: { current: 100, max: 100 },
    essence: { current: 100, max: 100 },
    essenceType: 'mortal' as const,
  },
  pathBuild: {
    primary: '' as any,
    secondary: [],
    path_levels: {} as Record<string, any>,
    dao_marks: {} as Record<string, number>,
  },
  daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
  flags: {} as Record<string, any>,
  turn: 1,
  isDead: false,
  deathCause: '',
  deathTurn: 0,
  currency: 200,
  immortalCurrency: 0,
  battleState: null as any,
  deathRecord: null as any,
  gameTime: {
    ap: 3,
    max_ap: 3,
    period: 'morning' as const,
    day: 1,
    month: 1,
    year: 1,
    season: 'spring' as const,
  },

  // ─── guSlice ───
  inventory: [],
  targetedGuEffects: [],
  materialBag: {} as Record<string, number>,
  feedingCredits: {} as Record<string, number>,

  // ─── killMoveSlice ───
  killMoves: [],
  cooldowns: {} as Record<string, number>,

  // ═══ v1.7: 炼蛊计数 (幽灵字段修复) ═══
  refinedGuCount: 0 as number,

  // ═══ P0.2: 幽灵计数器修复 — 5个起源+6个成就解除永久锁定 ═══
  /** 跨域访问计数（每首次访问一个新五域+1） */
  domainsVisited: 0 as number,
  /** 达到过的最高境界转数 */
  maxRealmReached: 1 as number,
  /** 累计获得元石总额（不含初始200） */
  totalCurrencyEarned: 0 as number,
  /** 人祖传说听闻次数 */
  renZuLegendsHeard: 0 as number,
  /** 总战斗次数（含胜负） */
  totalBattlesFought: 0 as number,
  /** 战斗胜利次数 */
  combatWins: 0 as number,
  /** v0.7.0-b: 小队战胜利次数 */
  squadCombatWins: 0 as number,
  /** v0.7.0-b: 调入/招募小队成员次数 */
  squadMembersRecruited: 0 as number,
  /** v0.7.0-b: 小队重伤救回次数 */
  squadMemberWoundedRescues: 0 as number,
  /** v0.7.0-b: 小队成员阵亡次数 */
  squadMemberDeaths: 0 as number,
  /** v0.7.0-b: 合击成功次数 */
  squadComboSuccesses: 0 as number,
  /** v0.7.0-b: 越级撤退成功次数 */
  squadOverlevelEscapes: 0 as number,

  // ─── pathSlice ───
  primaryPath: null as string | null,
  secondaryPaths: [] as string[],
  pathLevels: {} as Record<string, any>,
  daoMarks: {} as Record<string, number>,

  // ─── talentSlice ───
  selectedTalents: [],
  activeModifiers: [],

  // ─── factionSlice ───
  standings: {} as Record<string, any>,
  characterRelations: [],
  npcContacts: [],

  // ─── apertureSlice（空窍/仙窍） ───
  aperture: null,

  // ─── causalitySlice ───
  butterflyEffects: [],
  timelineDeviation: 0,

  // ─── eventSlice ───
  eventQueue: [],
  triggeredEvents: new Set<string>() as Set<string>,
  eventHistory: [],

  // ─── narrativeSlice ───
  messages: [],
  keyEvents: [],
  gameLog: [],
  gameLogArchive: [],
  rollingSummary: '',
  currentNarrative: null,
  isLoading: false,
  error: null,

  // ─── mapSlice ───
  knownLocations: [],
  rumorLocations: [],
  playerPosition: { x: 0, y: 0, region: '' },
  exploredRegions: [] as string[],
  fogOfWar: true,

  // ─── uiSlice ───
  activeTab: 'attributes',
  isSettingsOpen: false,
  isSaveDialogOpen: false,
  isEventLogExpanded: false,
  typewriterSpeed: 20,
  screenState: 'title' as ScreenState,
  gameMode: 'canon' as GameMode,
  pipelinePhase: 'IDLE' as PipelinePhase,
  pipelineError: null as string | null,
  l3Warnings: [] as { ruleName: string; details: string }[],
  gameLoadVersion: 0,

  // ─── yuanStoneSlice ───
  currencyLog: [] as any[],
  yuanStoneDelta: 0,

  // ─── achievementSlice ───
  unlockedAchievements: [] as string[],
  achievementProgress: {} as Record<string, number>,

  // ─── tutorialSlice ───
  tutorialState: 'inactive' as any,
  currentStep: 0,
  tutorialSkippable: true,

  // ─── chapterSlice ───
  currentChapterId: null as string | null,
  currentDomain: '',
  chapterHistory: [] as any[],
  activeEvents: {} as Record<string, any>,
  goals: {} as Record<string, any>,
  transitionState: 'idle' as any,
  // P2新增: 路由选项 + 临近事件 + 全局事件状态
  nextChapterOptions: [] as any[],
  proximityEvents: [] as any[],
  globalEventStatus: {} as Record<string, any>,
  // P2-4a: 决斗引擎
  duelState: null as any,
  // v0.7.0: 小队战斗状态
  squadCombatState: null as any,
  debt: 0 as number,
  debtInterestRate: 0.05 as number,
  // P2新增: 子系统默认值（各子系统实现时覆盖）
  combatState: null as any,
  dialogueState: {} as Record<string, any>,
  shopState: { visitedShops: [] as string[], shopInventory: {} as Record<string, any> },
  materialShelf: {
    items: [] as any[],
    lastRefreshed: 0,
    freeRefreshTurn: 0,
    freeRefreshCount: 0,
    emergencyRefreshUsedTurn: 0,
    emergencyActive: false,
  },
  encounterState: { recentEncounters: [] as string[], cooldownTimer: 0 },
  audioState: {
    masterVolume: 0.7,
    bgmVolume: 0.5,
    sfxVolume: 0.7,
    voiceVolume: 0.8,
    uiVolume: 0.7,
    voiceActive: false,
    currentBgm: null as string | null,
  },
  lifeboundGu: null as { id: string; name: string } | null,
  originUnlocks: [] as string[],
  // ═══ P2-13: 动态系统补完 ═══
  /** 蛊虫饥饿计数器: guId → hungerCounter */
  guHungerCounters: {} as Record<string, number>,
  /** NPC关系网络 — 双向好感矩阵 */
  npcRelations: { matrix: {} as Record<string, Record<string, number>>, lastUpdatedTurn: 0 },
  /** 洞天/福地动态模型 */
  heavenlyLand: null as import('../types').HeavenlyLand | null,
  // ═══ P2-流派: 本命蛊系统 ═══
  /** 本命蛊绑定信息 */
  lifeboundGuInfo: null as import('../types').LifeboundGu | null,
  /** 本命蛊死亡惩罚状态 */
  lifeboundDeathPenalty: null as import('../types').LifeboundDeathPenalty | null,

  // ═══ gameLogSlice: 游戏事件日志 ═══
  gameLog: [] as import('./slices/gameLogSlice').GameLogEntry[],

  // ═══ P1.1: 拍卖系统 ═══
  auctionItems: [] as any[],
  materialAuctionItems: [] as any[],
  recipeAuctionItems: [] as any[],
  killerMoveAuctionItems: [] as any[],
  isAuctionActive: false,
  auctionLastTurn: 0,

  // ═══ v0.7.0: 势力系统 ═══
  /** 玩家自创势力 */
  playerFaction: null as import('../types').PlayerFaction | null,
  /** 势力事件日志 */
  factionEvents: [] as import('../types').FactionEvent[],
  lastFactionEconomyLedger: null as any,
  lastFactionEconomyTurn: 0,

  // ═══ v0.7.0: 小队编队状态 ═══
  partyState: {
    members: [],
    maxSize: 4,
    formation: null,
    morale: 50,
    coordination: 50,
    lastUpdatedTurn: 0,
    memberCooldowns: {},
    memberRolePausedUntil: {},
  },

  // ═══ v0.7.0: 仙窍存储兜底 ═══
  apertureInventory: { gu: [], materials: {}, immortalMaterials: {} },

  // ═══ v0.7.0 P2: 动态NPC注册表 ═══
  dynamicNPCs: {} as Record<string, import('../types').DynamicNPC>,
  maxDynamicNPCs: 500 as number,
};

/**
 * 存档 partialize 排除键集合
 * 这些键不会被写入存档文件，也不会被 persist 持久化
 */
export const EXCLUDE_FROM_SAVE = new Set([
  // UI 临时状态
  'activeTab',
  'isSettingsOpen',
  'isSaveDialogOpen',
  'isEventLogExpanded',
  'typewriterSpeed',
  'screenState',
  'gameMode',
  // 管道临时状态
  'pipelinePhase',
  'pipelineError',
  'l3Warnings',
  // UI setter 函数（运行时方法，不持久化）
  'setActiveTab',
  'toggleSettings',
  'toggleSaveDialog',
  'toggleEventLog',
  'setTypewriterSpeed',
  'setScreenState',
  'setGameMode',
  'setPipelinePhase',
  'setPipelineError',
  'setL3Warnings',
  // Set 类型不可序列化
  'triggeredEvents',
  // 加载/错误状态（每次都重新生成）
  'isLoading',
  'error',
  'currentNarrative',
  // 读档版本计数器（纯UI信号，不持久化）
  'gameLoadVersion',
  // v0.7.0: 小队战斗运行时状态（不持久化，战斗结束后清理）
  'squadCombatState',
  // ═══ v1.7: timelineSlice临时选择状态（仅角色创建阶段使用，排除存档污染） ═══
  'selectedNodeId', 'selectedNode', 'selectedDomain',
  'timelineTalents', 'apertureConfig', 'apertureRemainingPoints',
  'startingYuanStone', 'startingGuList', 'configStep',
  'factionId', 'factionBonus', 'guaranteedGu', 'randomGuPool',
  'selectedGuList', 'guPoolSeed', 'guRerollsRemaining',
  'selectedKillerMoves', 'killerMovePool',
  'selectNode', 'setConfigStep', 'setSelectedDomain', 'selectTimelineTalent',
  'deselectTalent', 'selectLifeboundGu', 'allocateAperturePoints',
  'setStartingResources', 'selectFaction', 'selectStartingGu',
  'deselectStartingGu', 'rerollGuPool', 'selectKillerMove',
  'getTimelineConfig', 'resetTimelineConfig',
]);

/**
 * 存档文件版本号
 * 每次状态结构变更时递增，用于 migrate 兼容旧存档
 * v6→v7: P2-13 动态系统补完 + P2-流派 本命蛊/道痕互斥 + P2-审计D 数据扩充
 * v8→v9: v0.7.0 势力/小队/成就/资源点/十绝体系统
 */
export const SAVE_FORMAT_VERSION = 13;
