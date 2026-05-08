import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { createPlayerSlice } from './slices/playerSlice';
import { createGuSlice } from './slices/guSlice';
import { createKillMoveSlice } from './slices/killMoveSlice';
import { createPathSlice } from './slices/pathSlice';
import { createTalentSlice } from './slices/talentSlice';
import { createFactionSlice } from './slices/factionSlice';
import { createSquadSlice } from './slices/squadSlice';
import { createApertureSlice } from './slices/immortalSlice';
import { createCausalitySlice } from './slices/causalitySlice';
import { createEventSlice } from './slices/eventSlice';
import { createNarrativeSlice } from './slices/narrativeSlice';
import { createMapSlice } from './slices/mapSlice';
import { createUiSlice } from './slices/uiSlice';
import { createYuanStoneSlice } from './slices/yuanStoneSlice';
import { createAchievementSlice } from './slices/achievementSlice';
import { createTutorialSlice } from './slices/tutorialSlice';
import { createChapterSlice } from './slices/chapterSlice';
import { createCombatSlice } from './slices/combatSlice';
import { createDialogueSlice } from './slices/dialogueSlice';
import { createDebtSlice } from './slices/debtSlice';
import { createEncounterSlice } from './slices/encounterSlice';
import { createOriginUnlockSlice } from './slices/originUnlockSlice';
import { createSoundSlice } from './slices/soundSlice';
import { createGameLogSlice } from './slices/gameLogSlice';
import { createMerchantSlice } from './slices/merchantSlice';
import { createAuctionSlice } from './slices/auctionSlice';
import { createTimelineSlice } from './slices/timelineSlice';
import { createDynamicNPCStore } from './slices/dynamicNPCStore';
import {
  INITIAL_STATE,
  EXCLUDE_FROM_SAVE,
  SAVE_FORMAT_VERSION,
} from './initialState';
import npcsData from '../canon/npcs.json';

// ─── 存档元数据类型 ───
export interface SaveFileFormat {
  formatVersion: number;
  timestamp: string;
  meta: {
    playerName: string;
    realm: string;
    turn: number;
    gameMode: string;
  };
  state: Record<string, any>;
}

const SQUAD_FORMATIONS = new Set(['合击', '牵制', '掠阵', '斩首']);

export function normalizePartyState(party: any, turn = 0): any {
  const formation = SQUAD_FORMATIONS.has(party?.formation) ? party.formation : null;
  return {
    members: Array.isArray(party?.members) ? party.members : [],
    maxSize: Number.isFinite(party?.maxSize) ? party.maxSize : 4,
    formation,
    morale: Number.isFinite(party?.morale) ? Math.max(0, Math.min(100, party.morale)) : 50,
    coordination: Number.isFinite(party?.coordination) ? Math.max(0, Math.min(100, party.coordination)) : 50,
    lastUpdatedTurn: Number.isFinite(party?.lastUpdatedTurn) ? party.lastUpdatedTurn : turn,
    memberCooldowns: party?.memberCooldowns && typeof party.memberCooldowns === 'object' ? party.memberCooldowns : {},
    memberRolePausedUntil: party?.memberRolePausedUntil && typeof party.memberRolePausedUntil === 'object'
      ? party.memberRolePausedUntil
      : {},
  };
}

export function normalizeSquadDispatchState(dispatchState: any, turn = 0): any {
  const activeAssignments = Array.isArray(dispatchState?.activeAssignments)
    ? dispatchState.activeAssignments.filter((assignment: any) => assignment?.id && assignment?.memberId && assignment?.taskId)
    : [];
  const recentResults = Array.isArray(dispatchState?.recentResults)
    ? dispatchState.recentResults.slice(-20)
    : [];
  return {
    activeAssignments,
    recentResults,
    lastUpdatedTurn: Number.isFinite(dispatchState?.lastUpdatedTurn) ? dispatchState.lastUpdatedTurn : turn,
  };
}

// ─── v0.6.0终局修复: 存档迁移函数 ───
/** 将旧版本存档迁移到当前格式版本, 填充新增字段的默认值 */
export function migrateSave(parsed: SaveFileFormat): SaveFileFormat {
  if (!parsed.state) return parsed;
  const s = parsed.state;
  const v = parsed.formatVersion || 0;

  // v8→v9: v0.7.0 势力/小队/成就/资源点系统
  if (v < 9 && v >= 8) {
    // MortalAperture补全
    if (s.aperture?.type === 'mortal' && !s.aperture.extremePhysiqueType) {
      s.aperture.extremePhysiqueType = undefined;
      s.aperture.capacityLocked = s.aperture.rank >= 2 ? false : true;
    }
    // SquadMember战斗属性
    if (Array.isArray(s.faction?.members)) {
      s.faction.members = s.faction.members.map((m: any) => ({
        ...m, hp: m.hp ?? 100, maxHp: m.maxHp ?? 100,
        atk: m.atk ?? 20, def: m.def ?? 5,
        adventureTrust: m.adventureTrust ?? 50,
        interestDrive: m.interestDrive ?? 30,
      }));
    }
    // DuelState essence
    if (s.duelState?.player && !s.duelState.player.essence) {
      s.duelState.player.essence = { current: 100, max: 100 };
    }
    // v0.7.0 势力系统新字段
    if (s.playerFaction === undefined) s.playerFaction = null;
    if (s.factionEvents === undefined) s.factionEvents = [];
    // v0.7.0 小队编队状态
    if (s.partyState === undefined) s.partyState = { members: [], maxSize: 4, formation: null };
    // v0.7.0 仙窍存储兜底
    if (s.apertureInventory === undefined) s.apertureInventory = { gu: [], materials: {}, immortalMaterials: {} };
    // v0.7.0 任务/成就进度
    if (s.immortalApertureBuildLog === undefined) s.immortalApertureBuildLog = [];
    // 天赋点加成
    if (s.flags?._faction && s.flags?._factionTalentBonus === undefined) {
      s.flags._factionTalentBonus = 0;
    }
  }

  // v9→v10: v0.8.0-immortal 仙元/真元双轨系统
  if (v < 10 && v >= 9) {
    // essenceType 默认值填充
    if (s.vitals) {
      if (!s.vitals.essenceType) {
        // 根据当前境界推断能量类型
        const realmGrand = s.profile?.realm?.grand || 1;
        s.vitals.essenceType = realmGrand >= 6 ? 'immortal' : 'mortal';
      }
      // 若为蛊仙但仙元池过小(<500)，填充到2000
      if (s.vitals.essenceType === 'immortal' && s.vitals.essence) {
        if (s.vitals.essence.max < 500) {
          s.vitals.essence = { current: 2000, max: 2000 };
        }
      }
    }
  }

  // v10→v11: v0.7.0 P2 动态NPC系统 + 经济注入动态读取
  if (v < 11) {
    if (s.dynamicNPCs === undefined) s.dynamicNPCs = {};
    if (s.maxDynamicNPCs === undefined) s.maxDynamicNPCs = 500;
  }

  if (s.feedingCredits === undefined) s.feedingCredits = {};
  if (s.targetedGuEffects === undefined) s.targetedGuEffects = [];
  if (s.rumorLocations === undefined) s.rumorLocations = [];
  if (s.materialShelf === undefined) {
    s.materialShelf = {
      items: [],
      lastRefreshed: 0,
      freeRefreshTurn: 0,
      freeRefreshCount: 0,
      emergencyRefreshUsedTurn: 0,
      emergencyActive: false,
    };
  }
  if (s.lastFactionEconomyLedger === undefined) s.lastFactionEconomyLedger = null;
  if (s.lastFactionEconomyTurn === undefined) s.lastFactionEconomyTurn = 0;
  s.partyState = normalizePartyState(s.partyState, s.turn ?? 0);
  s.squadDispatchState = normalizeSquadDispatchState(s.squadDispatchState, s.turn ?? 0);
  if (s.squadCombatWins === undefined) s.squadCombatWins = 0;
  if (s.squadMembersRecruited === undefined) s.squadMembersRecruited = 0;
  if (s.squadMemberWoundedRescues === undefined) s.squadMemberWoundedRescues = 0;
  if (s.squadMemberDeaths === undefined) s.squadMemberDeaths = 0;
  if (s.squadComboSuccesses === undefined) s.squadComboSuccesses = 0;
  if (s.squadOverlevelEscapes === undefined) s.squadOverlevelEscapes = 0;

  parsed.formatVersion = SAVE_FORMAT_VERSION;
  return parsed;
}

// ─── 存档系统方法接口 ───
export interface SaveSystemActions {
  /** 全量重置到初始状态 — 用于新游戏和重入轮回 */
  resetStore: () => void;
  /** 导出存档为 JSON 文件下载到玩家本地 */
  saveToFile: () => void;
  /** 导入存档文件 JSON 字符串并加载到 store，返回成功/错误 */
  loadFromFile: (jsonString: string) => { success: boolean; error?: string };
  /** 获取当前状态的序列化数据（供组件使用） */
  getSerializedState: () => string;
}

type RootStore = ReturnType<typeof createPlayerSlice> &
  ReturnType<typeof createGuSlice> &
  ReturnType<typeof createKillMoveSlice> &
  ReturnType<typeof createPathSlice> &
  ReturnType<typeof createTalentSlice> &
  ReturnType<typeof createFactionSlice> &
  ReturnType<typeof createSquadSlice> &
  ReturnType<typeof createApertureSlice> &
  ReturnType<typeof createCausalitySlice> &
  ReturnType<typeof createEventSlice> &
  ReturnType<typeof createNarrativeSlice> &
  ReturnType<typeof createMapSlice> &
  ReturnType<typeof createUiSlice> &
  ReturnType<typeof createYuanStoneSlice> &
  ReturnType<typeof createAchievementSlice> &
  ReturnType<typeof createTutorialSlice> &
  ReturnType<typeof createChapterSlice> &
  ReturnType<typeof createCombatSlice> &
  ReturnType<typeof createDialogueSlice> &
  ReturnType<typeof createDebtSlice> &
  ReturnType<typeof createEncounterSlice> &
  ReturnType<typeof createOriginUnlockSlice> &
  ReturnType<typeof createSoundSlice> &
  ReturnType<typeof createGameLogSlice> &
  ReturnType<typeof createMerchantSlice> &
  ReturnType<typeof createAuctionSlice> &
  ReturnType<typeof createTimelineSlice> &
  ReturnType<typeof createDynamicNPCStore> &
  SaveSystemActions;

// ─── 工具：格式化日期为 YYYY-MM-DD ───
function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── 工具：序列化 state，将 Set 转为 Array ───
function serializeState(state: any): Record<string, any> {
  const data: Record<string, any> = {};
  for (const [key, value] of Object.entries(state)) {
    if (EXCLUDE_FROM_SAVE.has(key)) continue;
    if (typeof value === 'function') continue;
    if (value instanceof Set) {
      data[key] = [...value];
    } else {
      data[key] = value;
    }
  }
  return data;
}

// ─── 工具：反序列化 state，将 Array 转回 Set ───
function deserializeState(raw: Record<string, any>): Record<string, any> {
  const data = { ...raw };
  // 将 triggeredEvents 数组转回 Set
  if (Array.isArray(data.triggeredEvents)) {
    data.triggeredEvents = new Set(data.triggeredEvents);
  }
  return data;
}

export const useStore = create<RootStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createPlayerSlice(...a),
        ...createGuSlice(...a),
        ...createKillMoveSlice(...a),
        ...createPathSlice(...a),
        ...createTalentSlice(...a),
        ...createFactionSlice(...a),
        ...createSquadSlice(...a),
        ...createApertureSlice(...a),
        ...createCausalitySlice(...a),
        ...createEventSlice(...a),
        ...createNarrativeSlice(...a),
        ...createMapSlice(...a),
        ...createUiSlice(...a),
        ...createYuanStoneSlice(...a),
        ...createAchievementSlice(...a),
        ...createTutorialSlice(...a),
        ...createChapterSlice(...a),
        ...createCombatSlice(...a),
        ...createDialogueSlice(...a),
        ...createDebtSlice(...a),
        ...createEncounterSlice(...a),
        ...createOriginUnlockSlice(...a),
        ...createSoundSlice(...a),
        ...createGameLogSlice(...a),
        ...createMerchantSlice(...a),
        ...createAuctionSlice(...a),
        ...createTimelineSlice(...a),
        ...createDynamicNPCStore(...a),

        // ═══════════════════════════════════════
        // 存档系统方法
        // ═══════════════════════════════════════

        resetStore: () => {
          const set = a[0];
          const get = a[1];
          const current = get() as any;
          // ═══ 日志埋点: 游戏重置
          try {
            if (typeof current.addGameLog === 'function') {
              current.addGameLog('system', '重置游戏', { turn: current.turn, realm: current.profile?.realm?.label });
            }
          } catch { /* skip */ }
          // ═══ BugFix: 先清除 localStorage 持久化缓存，避免 persist 中间件竞态导致旧数据残留 ═══
          try { localStorage.removeItem('gu-zhenren-save'); } catch {}
          // ═══ BugFix: 从独立 localStorage key 恢复成就数据（跨存档持久化） ═══
          let savedAchievements: string[] = [];
          let savedAchievementProgress: Record<string, number> = {};
          try {
            const aRaw = localStorage.getItem('gu-zhenren-achievements');
            if (aRaw) savedAchievements = JSON.parse(aRaw);
            const pRaw = localStorage.getItem('gu-zhenren-achievement-progress');
            if (pRaw) savedAchievementProgress = JSON.parse(pRaw);
          } catch { /* keep empty */ }
          set({
            ...INITIAL_STATE,
            triggeredEvents: new Set<string>(),
            screenState: current.screenState ?? 'title',
            gameMode: current.gameMode ?? 'canon',
            // 跨存档保留成就和进度
            unlockedAchievements: savedAchievements,
            achievementProgress: savedAchievementProgress,
          });
        },

        saveToFile: () => {
          try {
            const state = a[1]() as any; // BugFix: a[1] 是 get
            const stateData = serializeState(state);

            const meta = {
              playerName: state.profile?.name || '无名蛊师',
              realm: state.profile?.realm?.label || '一转初阶',
              turn: state.turn || 1,
              gameMode: state.gameMode || 'canon',
            };

            const saveData: SaveFileFormat = {
              formatVersion: SAVE_FORMAT_VERSION,
              timestamp: new Date().toISOString(),
              meta,
              state: stateData,
            };

            const json = JSON.stringify(saveData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // 触发浏览器下载
            const link = document.createElement('a');
            const safeName = meta.playerName.replace(/[\\/:*?"<>|]/g, '_') || 'guzhen';
            link.download = `gu-zhenren-save-${safeName}-${fmtDate(Date.now())}.json`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            // ═══ 日志埋点: 导出存档
            try {
              const logStore = a[1]() as any;
              if (typeof logStore.addGameLog === 'function') {
                logStore.addGameLog('system', `导出存档: ${meta.playerName} (T${meta.turn}, ${meta.realm})`, {
                  turn: meta.turn, realm: meta.realm, playerName: meta.playerName,
                });
              }
            } catch { /* skip */ }
          } catch (e) {
            console.error('[SaveSystem] 导出存档失败:', e);
          }
        },

        loadFromFile: (jsonString: string) => {
          try {
            const parsed = JSON.parse(jsonString) as SaveFileFormat;

            // 格式版本检查
            if (!parsed.formatVersion || parsed.formatVersion > SAVE_FORMAT_VERSION) {
              return {
                success: false,
                error: `存档格式版本 ${parsed.formatVersion} 高于当前支持的版本 ${SAVE_FORMAT_VERSION}，请升级游戏后再尝试。`,
              };
            }

            // v0.6.0终局修复: 旧版本存档迁移
            const migrated = migrateSave(parsed);

            const rawState = migrated.state || migrated; // 兼容只有 state 的旧格式

            if (!rawState || typeof rawState !== 'object') {
              return { success: false, error: '存档数据无效或已损坏。' };
            }

            const stateData = deserializeState(rawState);
            const currentStore = a[1]() as any; // BugFix: a[1] 是 get

            // 保留现有的函数引用（slice methods 不能从 JSON 恢复）
            const preservedFns: Record<string, any> = {};
            const resetStoreFn = currentStore.resetStore;
            const saveToFileFn = currentStore.saveToFile;
            const loadFromFileFn = currentStore.loadFromFile;
            const getSerializedStateFn = currentStore.getSerializedState;

            for (const key of Object.keys(currentStore)) {
              if (typeof currentStore[key] === 'function' && key !== 'resetStore' && key !== 'saveToFile' && key !== 'loadFromFile' && key !== 'getSerializedState') {
                preservedFns[key] = currentStore[key];
              }
            }

            // 合并：数据来自存档，函数来自当前 store（全量替换数据字段）
            const merged = {
              ...currentStore,
              ...stateData,
              ...preservedFns,
              resetStore: resetStoreFn,
              saveToFile: saveToFileFn,
              loadFromFile: loadFromFileFn,
              getSerializedState: getSerializedStateFn,
            };

            const set = a[0];
            set(merged);
            // ═══ P1.6: 存档加载后初始化 NPC 关系矩阵 ═══
            try {
              const loaded = a[1]() as any;
              if (typeof loaded.initNpcRelations === 'function') {
                loaded.initNpcRelations(npcsData);
              }
            } catch { /* 关系矩阵初始化失败不影响存档加载 */ }
            // ═══ 日志埋点: 加载存档
            try {
              const logNew = a[1]() as any;
              if (typeof logNew.addGameLog === 'function') {
                logNew.addGameLog('system', `加载存档: ${parsed.meta?.playerName || '?'} (T${parsed.meta?.turn || '?'})`, {
                  turn: parsed.meta?.turn, realm: parsed.meta?.realm,
                });
              }
            } catch { /* skip */ }
            // ═══ BugFix: 读档后递增版本号，触发 GameScreen 拉取 AI 叙事 ═══
            a[0]((s: any) => ({ gameLoadVersion: (s.gameLoadVersion || 0) + 1 }));
            return { success: true };
          } catch (e) {
            const msg = e instanceof Error ? e.message : '未知错误';
            console.error('[SaveSystem] 读档失败:', e);
            return { success: false, error: `读档失败：${msg}` };
          }
        },

        getSerializedState: () => {
          const state = a[1]() as any; // BugFix: a[1] 是 get
          const stateData = serializeState(state);
          const meta = {
            playerName: state.profile?.name || '无名蛊师',
            realm: state.profile?.realm?.label || '一转初阶',
            turn: state.turn || 1,
            gameMode: state.gameMode || 'canon',
          };
          return JSON.stringify({
            formatVersion: SAVE_FORMAT_VERSION,
            timestamp: new Date().toISOString(),
            meta,
            state: stateData,
          } as SaveFileFormat, null, 2);
        },
      }),
      {
        name: 'gu-zhenren-save',
        version: SAVE_FORMAT_VERSION,
        merge: (persistedState: any, currentState: any) => {
          // 从独立localStorage key恢复成就数据（防止被persist水合覆盖）
          let savedAchievements: string[] = [];
          let savedProgress: Record<string, number> = {};
          try {
            const aRaw = localStorage.getItem('gu-zhenren-achievements');
            if (aRaw) savedAchievements = JSON.parse(aRaw);
            const pRaw = localStorage.getItem('gu-zhenren-achievement-progress');
            if (pRaw) savedProgress = JSON.parse(pRaw);
          } catch { /* keep defaults */ }
          // 归一化 duelsState.phase — 修正历史存档中无效相位值（如"round"→"player_turn"）
          const VALID_PHASES = ['init', 'player_turn', 'enemy_turn', 'ended', 'resolution'];
          const merged = {
            ...currentState,
            ...persistedState,
            unlockedAchievements: savedAchievements,
            achievementProgress: savedProgress,
          };
          if (merged.duelState && !VALID_PHASES.includes(merged.duelState.phase)) {
            merged.duelState = { ...merged.duelState, phase: 'player_turn' };
          }
          merged.partyState = normalizePartyState(merged.partyState, merged.turn ?? 0);
          return merged;
        },
        migrate: (persistedState: any, version: number) => {
          if (persistedState) {
            if (persistedState.npcContacts === undefined) persistedState.npcContacts = [];
            if (persistedState.targetedGuEffects === undefined) persistedState.targetedGuEffects = [];
            if (persistedState.gameLog === undefined) persistedState.gameLog = [];
            if (persistedState.gameLogArchive === undefined) persistedState.gameLogArchive = [];
            persistedState.partyState = normalizePartyState(persistedState.partyState, persistedState.turn ?? 0);
            if (persistedState.deathRecord) {
              persistedState.deathRecord = {
                majorChoices: [],
                deathCauseTags: [],
                generatedAt: new Date().toISOString(),
                ...persistedState.deathRecord,
              };
            }
          }
          // v1 → v2 → v3 → v4 → v5 迁移：兼容旧存档无新增字段的情况
          if (version < 5 && persistedState) {
            // v5 新增：P2扩展字段占位（combatState扩展/dialogueState/shopState/encounterState/audioState/lifeboundGu）
            if (persistedState.combatState === undefined) persistedState.combatState = null; // 已存在但兼容旧存
            if (persistedState.dialogueState === undefined) persistedState.dialogueState = {};
            if (persistedState.shopState === undefined) persistedState.shopState = { visitedShops: [], shopInventory: {} };
            if (persistedState.encounterState === undefined) persistedState.encounterState = { recentEncounters: [], cooldownTimer: 0 };
            if (persistedState.audioState === undefined) persistedState.audioState = { masterVolume: 0.7, bgmVolume: 0.5, sfxVolume: 0.7, currentBgm: null };
            if (persistedState.lifeboundGu === undefined) persistedState.lifeboundGu = null;
            if (persistedState.originUnlocks === undefined) persistedState.originUnlocks = [];
            if (persistedState.soundState === undefined) persistedState.soundState = { masterVolume: 0.7, bgmVolume: 0.5, sfxVolume: 0.7, muted: false, currentBgm: null };
            if (persistedState.soundState) {
              if (persistedState.soundState.voiceVolume === undefined) persistedState.soundState.voiceVolume = 0.8;
              if (persistedState.soundState.uiVolume === undefined) persistedState.soundState.uiVolume = 0.7;
              if (persistedState.soundState.voiceActive === undefined) persistedState.soundState.voiceActive = false;
            }
            // P2新增 chapterSlice 路由扩展字段
            if (persistedState.nextChapterOptions === undefined) persistedState.nextChapterOptions = [];
            if (persistedState.proximityEvents === undefined) persistedState.proximityEvents = [];
            if (persistedState.globalEventStatus === undefined) persistedState.globalEventStatus = {};
          }
          if (version < 6 && persistedState) {
            // v6 新增：决斗引擎duelState
            if (persistedState.duelState === undefined) persistedState.duelState = null;
          }
          if (version < 7 && persistedState) {
            // v7 新增 (P2-13 + P2-流派): 蛊虫饥饿状态机/NPC关系网络/洞天福地/本命蛊
            if (persistedState.guHungerCounters === undefined) persistedState.guHungerCounters = {};
            if (persistedState.npcRelations === undefined) persistedState.npcRelations = { matrix: {}, lastUpdatedTurn: 0 };
            if (persistedState.heavenlyLand === undefined) persistedState.heavenlyLand = null;
            if (persistedState.lifeboundGuInfo === undefined) persistedState.lifeboundGuInfo = null;
            if (persistedState.lifeboundDeathPenalty === undefined) persistedState.lifeboundDeathPenalty = null;
            // 旧存档 GuInstance.currentState 五态→四态映射
            if (Array.isArray(persistedState.inventory)) {
              const oldToNew: Record<string, string> = { fed: 'optimal', starving: 'injured', dying: 'dead' };
              persistedState.inventory = persistedState.inventory.map((gu: any) => {
                if (gu && gu.currentState && oldToNew[gu.currentState]) {
                  return { ...gu, currentState: oldToNew[gu.currentState], hungerCounter: gu.hungerCounter ?? 0 };
                }
                return gu ? { ...gu, hungerCounter: gu.hungerCounter ?? 0 } : gu;
              });
            }
          }
          if (version < 8 && persistedState) {
            // v8: 空窍/福地类型分离 —— 旧版 ImmortalAperture 数据迁移
            // 旧版可能在 aperture 中存入了非 ImmortalAperture 的混合数据
            // 迁移策略：检测 aperture 是否包含 ImmortalAperture 特有字段(area_mu/time_flow_ratio)
            // 若不包含 → 旧版空窍数据，替换为 null（将在角色创建时重新初始化）
            // 若包含 → 保留为 ImmortalAperture
            const oldAperture = persistedState.aperture;
            if (oldAperture && typeof oldAperture === 'object') {
              if (oldAperture.area_mu !== undefined || oldAperture.time_flow_ratio !== undefined) {
                // 有效 ImmortalAperture — 保留
              } else {
                // 旧版混合数据 — 清空
                persistedState.aperture = null;
              }
            }
          }
          if (version < 4 && persistedState) {
            // v4 新增 chapterSlice 字段默认值
            if (persistedState.currentChapterId === undefined) persistedState.currentChapterId = null;
            if (persistedState.currentDomain === undefined) persistedState.currentDomain = '';
            if (persistedState.chapterHistory === undefined) persistedState.chapterHistory = [];
            if (persistedState.activeEvents === undefined) persistedState.activeEvents = {};
            if (persistedState.goals === undefined) persistedState.goals = {};
            if (persistedState.transitionState === undefined) persistedState.transitionState = 'idle';
          }
          if (version < 3 && persistedState) {
            // v3 新增字段默认值
            if (persistedState.battleState === undefined) persistedState.battleState = null;
            if (persistedState.deathRecord === undefined) persistedState.deathRecord = null;
            if (persistedState.currencyLog === undefined) persistedState.currencyLog = [];
            if (persistedState.yuanStoneDelta === undefined) persistedState.yuanStoneDelta = 0;
            if (persistedState.unlockedAchievements === undefined) persistedState.unlockedAchievements = [];
            if (persistedState.achievementProgress === undefined) persistedState.achievementProgress = {};
            if (persistedState.tutorialState === undefined) persistedState.tutorialState = 'inactive';
            if (persistedState.currentStep === undefined) persistedState.currentStep = 0;
            if (persistedState.tutorialSkippable === undefined) persistedState.tutorialSkippable = true;
          }
          return persistedState as any;
        },
        partialize: (state) => {
          const s = state as any;
          const {
            // 排除 UI 状态
            activeTab, isSettingsOpen, isSaveDialogOpen, isEventLogExpanded, isAchievementPanelOpen,
            typewriterSpeed, screenState, gameMode,
            pipelinePhase, pipelineError, l3Warnings,
            setActiveTab, toggleSettings, toggleSaveDialog, toggleEventLog,
            setTypewriterSpeed, setScreenState, setGameMode,
            setPipelinePhase, setPipelineError, setL3Warnings,
            incrementLoadVersion,
            // 排除存档系统方法（仅运行时功能）
            resetStore, saveToFile, loadFromFile, getSerializedState,
            // 排除 Set 类型
            triggeredEvents,
            // 排除临时状态
            isLoading, error,
            currentNarrative, squadCombatState,
            // 排除读档版本计数器（纯UI信号，不持久化）
            gameLoadVersion,
            // P3修复：排除成就字段（achievementSlice独立管理localStorage，避免双重真相源覆盖）
            unlockedAchievements, achievementProgress,
            recentUnlocks, _achievementDefs,
            // 排除成就相关方法
            loadAchievementDefinitions, checkAchievements, unlockAchievement,
            updateAchievementProgress, isAchievementUnlocked, checkCondition,
            getAchievementStats, getAllAchievements, clearRecentUnlocks,
            // 保留其余可序列化数据
            ...rest
          } = s;
          return rest;
        },
      }
    ),
    { name: 'GuZhenrenStore' }
  )
);

export type { RootStore };
