/**
 * 起源解锁 Slice — P2-10
 * 独立Store + localStorage持久化（死亡不重置）
 *
 * 设计原则：
 * - 使用独立 localStorage 键名，避免与主存档混淆
 * - 所有条件评估委托 unlock-condition-checker 纯函数
 * - 集成点：response-pipeline.ts GameOver时调用checkAndUnlock
 */

import type { UnlockCondition, ConditionEvalResult } from '../../engine/unlock-condition-checker';
import { evaluateAllConditions, areAllConditionsSatisfied, formatUnmetConditions } from '../../engine/unlock-condition-checker';
import { STORAGE_KEYS } from '../storageKeys';

/** 起源定义 */
export interface OriginDefinition {
  id: string;
  name: string;
  description: string;
  initialBonus: Record<string, any>;
  unlockConditions: UnlockCondition[];
  narrativeFlavor: string;
}

/** 起源解锁状态 */
export interface OriginUnlockState {
  /** 已解锁的起源ID列表 */
  unlockedOrigins: string[];
  /** 起源定义缓存 */
  originDefinitions: OriginDefinition[];
  /** 最近一次解锁详情 */
  lastUnlockAttempt: {
    originId: string;
    success: boolean;
    unmetDescriptions: string[];
  } | null;
}

export interface OriginUnlockSlice {
  originUnlocks: string[];
  originUnlockState: OriginUnlockState;

  /** 加载起源定义 */
  loadOriginDefinitions: (definitions: OriginDefinition[]) => void;
  /** 检测所有起源的解锁条件（GameOver时调用） */
  checkAndUnlock: (gameState: Record<string, any>) => string[];
  /** 获取所有已解锁的起源ID */
  getUnlockedOrigins: () => string[];
  /** 获取所有可用起源（含默认起源） */
  getAvailableOrigins: () => OriginDefinition[];
  /** 检查指定起源是否已解锁 */
  isOriginUnlocked: (originId: string) => boolean;
  /** 强制解锁（调试用） */
  forceUnlock: (originId: string) => void;
  /** 获取起源的未满足条件 */
  getUnmetConditions: (originId: string) => string[];
}

const STORAGE_KEY = STORAGE_KEYS.UNLOCKED_ORIGINS;

function loadUnlockedFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUnlockedToStorage(unlocked: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  } catch {
    console.warn('[OriginUnlock] 无法保存到localStorage');
  }
}

// 持久化状态（跨存档累计值）
function getPersistenceState(unlocked: string[]): Record<string, any> {
  return {
    achievementCount: (unlocked || []).length, // 已解锁起源数量作为累计成就计数
    allUnlockedOrigins: unlocked || [],
  };
}

export const createOriginUnlockSlice = (set: any, get: any): OriginUnlockSlice => {
  const initialUnlocked = loadUnlockedFromStorage();

  return {
    originUnlocks: initialUnlocked,
    originUnlockState: {
      unlockedOrigins: initialUnlocked,
      originDefinitions: [],
      lastUnlockAttempt: null,
    },

    loadOriginDefinitions: (definitions) => {
      set((s: any) => ({
        originUnlocks: s.originUnlocks || [],
        originUnlockState: {
          ...s.originUnlockState,
          unlockedOrigins: s.originUnlocks || [],
          originDefinitions: definitions,
        },
      }));
    },

    checkAndUnlock: (gameState) => {
      const state = get().originUnlockState as OriginUnlockState;
      const definitions = state.originDefinitions;
      if (!definitions || definitions.length === 0) return [];

      const currentUnlocked = get().originUnlocks as string[];
      const persistenceState = getPersistenceState(currentUnlocked);
      const newlyUnlocked: string[] = [];

      for (const origin of definitions) {
        // 已解锁跳过
        if (currentUnlocked.includes(origin.id)) continue;
        if (!origin.unlockConditions || origin.unlockConditions.length === 0) continue;

        const results = evaluateAllConditions(origin.unlockConditions, gameState, persistenceState);

        if (areAllConditionsSatisfied(results)) {
          newlyUnlocked.push(origin.id);
          console.log(`[OriginUnlock] 解锁新起源: ${origin.name} (${origin.id})`);
        } else {
          const unmet = formatUnmetConditions(results);
          set((s: any) => ({
            originUnlockState: {
              ...s.originUnlockState,
              lastUnlockAttempt: {
                originId: origin.id,
                success: false,
                unmetDescriptions: unmet,
              },
            },
          }));
        }
      }

      if (newlyUnlocked.length > 0) {
        const updated = [...currentUnlocked, ...newlyUnlocked];
        saveUnlockedToStorage(updated);
        set({
          originUnlocks: updated,
          originUnlockState: {
            ...state,
            unlockedOrigins: updated,
            lastUnlockAttempt: {
              originId: newlyUnlocked[newlyUnlocked.length - 1],
              success: true,
              unmetDescriptions: [],
            },
          },
        });
        // ═══ 日志埋点: 起源解锁（已由 response-pipeline 写入，此处仅 console）
        console.log(`[OriginUnlock] 新解锁起源: ${newlyUnlocked.join(', ')}`);
      }

      return newlyUnlocked;
    },

    getUnlockedOrigins: () => {
      return get().originUnlocks as string[];
    },

    getAvailableOrigins: () => {
      const state = get().originUnlockState as OriginUnlockState;
      return state.originDefinitions || [];
    },

    isOriginUnlocked: (originId) => {
      const unlocked = get().originUnlocks as string[];
      return unlocked.includes(originId);
    },

    forceUnlock: (originId) => {
      const current = get().originUnlocks as string[];
      if (current.includes(originId)) return;
      const updated = [...current, originId];
      saveUnlockedToStorage(updated);
      set({ originUnlocks: updated });
    },

    getUnmetConditions: (originId) => {
      const state = get().originUnlockState as OriginUnlockState;
      const definitions = state.originDefinitions;
      const origin = definitions.find(d => d.id === originId);
      if (!origin || !origin.unlockConditions) return [];

      const gameState = get() as any;
      const persistenceState = getPersistenceState(get().originUnlocks || []);
      const results = evaluateAllConditions(origin.unlockConditions, gameState, persistenceState);
      return formatUnmetConditions(results);
    },
  };
};
