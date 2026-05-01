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
    background: '南疆',
  },
  attributes: { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
  vitals: {
    health: { current: 100, max: 100 },
    essence: { current: 100, max: 100 },
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
  materialBag: {} as Record<string, number>,

  // ─── killMoveSlice ───
  killMoves: [],
  cooldowns: {} as Record<string, number>,

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

  // ─── immortalSlice ───
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
  rollingSummary: '',
  currentNarrative: null,
  isLoading: false,
  error: null,

  // ─── mapSlice ───
  knownLocations: [],
  playerPosition: { x: 0, y: 0, region: '南疆' },
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
]);

/**
 * 存档文件版本号
 * 每次状态结构变更时递增，用于 migrate 兼容旧存档
 */
export const SAVE_FORMAT_VERSION = 2;
