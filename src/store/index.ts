import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { createPlayerSlice } from './slices/playerSlice';
import { createGuSlice } from './slices/guSlice';
import { createKillMoveSlice } from './slices/killMoveSlice';
import { createPathSlice } from './slices/pathSlice';
import { createTalentSlice } from './slices/talentSlice';
import { createFactionSlice } from './slices/factionSlice';
import { createImmortalSlice } from './slices/immortalSlice';
import { createCausalitySlice } from './slices/causalitySlice';
import { createEventSlice } from './slices/eventSlice';
import { createNarrativeSlice } from './slices/narrativeSlice';
import { createMapSlice } from './slices/mapSlice';
import { createUiSlice } from './slices/uiSlice';
import {
  INITIAL_STATE,
  EXCLUDE_FROM_SAVE,
  SAVE_FORMAT_VERSION,
} from './initialState';

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
  ReturnType<typeof createImmortalSlice> &
  ReturnType<typeof createCausalitySlice> &
  ReturnType<typeof createEventSlice> &
  ReturnType<typeof createNarrativeSlice> &
  ReturnType<typeof createMapSlice> &
  ReturnType<typeof createUiSlice> &
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
        ...createImmortalSlice(...a),
        ...createCausalitySlice(...a),
        ...createEventSlice(...a),
        ...createNarrativeSlice(...a),
        ...createMapSlice(...a),
        ...createUiSlice(...a),

        // ═══════════════════════════════════════
        // 存档系统方法
        // ═══════════════════════════════════════

        resetStore: () => {
          const set = a[0];
          const current = a[0]() as any;
          set({
            ...INITIAL_STATE,
            triggeredEvents: new Set<string>(),
            // 保留当前屏幕状态（由 App.tsx 管理，不应被重置）
            screenState: current.screenState ?? 'title',
            gameMode: current.gameMode ?? 'canon',
          });
        },

        saveToFile: () => {
          try {
            const state = a[0]() as any;
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

            const rawState = parsed.state || parsed; // 兼容只有 state 的旧格式

            if (!rawState || typeof rawState !== 'object') {
              return { success: false, error: '存档数据无效或已损坏。' };
            }

            const stateData = deserializeState(rawState);
            const currentStore = a[0]() as any;

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
            return { success: true };
          } catch (e) {
            const msg = e instanceof Error ? e.message : '未知错误';
            console.error('[SaveSystem] 读档失败:', e);
            return { success: false, error: `读档失败：${msg}` };
          }
        },

        getSerializedState: () => {
          const state = a[0]() as any;
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
        migrate: (persistedState: any, version: number) => {
          // v1 → v2 迁移：兼容旧存档无新增字段的情况
          if ((version === 0 || version === 1) && persistedState) {
            // 确保新增字段有默认值（后续迭代按需追加）
            return persistedState as any;
          }
          return persistedState as any;
        },
        partialize: (state) => {
          const s = state as any;
          const {
            // 排除 UI 状态
            activeTab, isSettingsOpen, isSaveDialogOpen, isEventLogExpanded,
            typewriterSpeed, screenState, gameMode,
            pipelinePhase, pipelineError, l3Warnings,
            setActiveTab, toggleSettings, toggleSaveDialog, toggleEventLog,
            setTypewriterSpeed, setScreenState, setGameMode,
            setPipelinePhase, setPipelineError, setL3Warnings,
            // 排除存档系统方法（仅运行时功能）
            resetStore, saveToFile, loadFromFile, getSerializedState,
            // 排除 Set 类型
            triggeredEvents,
            // 排除临时状态
            isLoading, error,
            currentNarrative,
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
