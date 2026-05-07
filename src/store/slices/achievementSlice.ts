/**
 * 成就 Slice — P2-8 完整实现
 *
 * - loadDefinitions: 从 canon/achievements.json 加载成就定义
 * - checkAchievements: 每轮 RESOLVED 后自动检测所有成就条件
 * - unlock / checkCondition / isUnlocked / getStats
 *
 * 持久化：成就进度通过 localStorage 跨存档保留
 */

import type {
  Achievement,
  AchievementCheckState,
  AchievementStats,
  AchievementTier,
  AchievementCategory,
  AchievementDomain,
  AchievementUnlockEvent,
} from '../../types/achievement';

// ─── 持久化 Key ───
const PERSIST_KEY = 'gu-zhenren-achievements';
const PERSIST_PROGRESS_KEY = 'gu-zhenren-achievement-progress';

function loadUnlockedIds(): string[] {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUnlockedIds(ids: string[]): void {
  try { localStorage.setItem(PERSIST_KEY, JSON.stringify(ids)); } catch {}
}

function loadProgress(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PERSIST_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(progress: Record<string, number>): void {
  try { localStorage.setItem(PERSIST_PROGRESS_KEY, JSON.stringify(progress)); } catch {}
}

export interface AchievementSlice {
  /** 已解锁成就 ID 列表（跨存档持久化） */
  unlockedAchievements: string[];
  /** 累进型成就进度（achievementId → 当前进度数值） */
  achievementProgress: Record<string, number>;
  /** 成就定义缓存 */
  _achievementDefs: Achievement[];
  /** 最近解锁事件列表 */
  recentUnlocks: AchievementUnlockEvent[];

  /** 加载成就定义 */
  loadAchievementDefinitions: (defs: Achievement[]) => void;
  /** 检测所有成就条件（每轮 RESOLVED 后调用） */
  checkAchievements: (state: AchievementCheckState) => string[];
  /** 解锁成就 */
  unlockAchievement: (id: string) => void;
  /** 更新累进型成就进度 */
  updateAchievementProgress: (id: string, progress: number) => void;
  /** 检查是否已解锁 */
  isAchievementUnlocked: (id: string) => boolean;
  /** 根据条件检测器检查单个成就 */
  checkCondition: (id: string, state: AchievementCheckState) => boolean;
  /** 获取成就统计 */
  getAchievementStats: () => AchievementStats;
  /** 获取全部成就定义 */
  getAllAchievements: () => Achievement[];
  /** 清除最近解锁事件 */
  clearRecentUnlocks: () => void;
  /** 从localStorage重新加载成就数据（在loadFromFile/resetStore后调用） */
  reloadFromStorage: () => void;
  /** v0.7.0: 发放成就奖励（杀招碎片/道痕/元石/蛊材）*/
  grantReward: (achievementId: string) => void;
}

export const createAchievementSlice = (set: any, get: any): AchievementSlice => {
  const initialUnlocked = loadUnlockedIds();
  const initialProgress = loadProgress();

  return {
    unlockedAchievements: initialUnlocked,
    achievementProgress: initialProgress,
    _achievementDefs: [],
    recentUnlocks: [],

    loadAchievementDefinitions: (defs) => {
      set({ _achievementDefs: defs });
    },

    checkAchievements: (state: AchievementCheckState) => {
      const defs: Achievement[] = get()._achievementDefs || [];
      if (defs.length === 0) return [];

      const currentUnlocked: string[] = get().unlockedAchievements || [];
      const newlyUnlocked: string[] = [];
      const now = Date.now();

      for (const def of defs) {
        if (currentUnlocked.includes(def.id)) continue;

        let satisfied = false;

        // 使用预定义的检测条件或解析 condition 字符串
        if (typeof def.conditionCheck === 'function') {
          satisfied = def.conditionCheck(state);
        } else {
          satisfied = evaluateConditionString(def.condition, state);
        }

        if (satisfied) {
          newlyUnlocked.push(def.id);
          // 添加到已解锁列表
          currentUnlocked.push(def.id);
        }
      }

      if (newlyUnlocked.length > 0) {
        const defsMap = new Map(defs.map(d => [d.id, d]));
        const events: AchievementUnlockEvent[] = newlyUnlocked.map(id => {
          const def = defsMap.get(id);
          return {
            achievementId: id,
            name: def?.name || id,
            description: def?.description || '',
            tier: def?.tier || 'bronze',
            unlockedAt: now,
          };
        });

        set({
          unlockedAchievements: [...currentUnlocked],
          recentUnlocks: events,
        });

        saveUnlockedIds([...currentUnlocked]);

        // console
        for (const evt of events) {
          console.log(`[Achievement] 解锁成就: ${evt.name} (${evt.tier})`);
          const logStore = get();
          if (typeof logStore.addGameLog === 'function') {
            logStore.addGameLog('achievement', `解锁成就: ${evt.name}`, { tier: evt.tier, id: evt.id });
          }
        }
      }

      return newlyUnlocked;
    },

    unlockAchievement: (id) => {
      const state = get() as AchievementSlice;
      if (state.unlockedAchievements.includes(id)) return;
      const updated = [...state.unlockedAchievements, id];
      set({ unlockedAchievements: updated });
      saveUnlockedIds(updated);
      console.log(`[Achievement] 解锁成就: ${id}`);
    },

    updateAchievementProgress: (id, progress) => {
      const current = get().achievementProgress as Record<string, number>;
      const updated = { ...current, [id]: progress };
      set({ achievementProgress: updated });
      saveProgress(updated);
    },

    isAchievementUnlocked: (id) => {
      return (get() as AchievementSlice).unlockedAchievements.includes(id);
    },

    checkCondition: (id, state) => {
      const defs: Achievement[] = get()._achievementDefs || [];
      const def = defs.find(d => d.id === id);
      if (!def) return false;
      if (typeof def.conditionCheck === 'function') {
        return def.conditionCheck(state);
      }
      return evaluateConditionString(def.condition, state);
    },

    getAchievementStats: () => {
      const defs: Achievement[] = get()._achievementDefs || [];
      const unlocked: string[] = get().unlockedAchievements || [];
      const unlockedSet = new Set(unlocked);

      const tiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'legendary'];
      const categories: AchievementCategory[] = ['剧情', '成长', '收集', '经济', '社交', '探索', '战斗', '系统'];
      const domains: AchievementDomain[] = ['南疆', '北原', '东海', '西漠', '中洲', '通用'];

      const byTier = {} as Record<AchievementTier, { total: number; unlocked: number }>;
      const byCategory = {} as Record<AchievementCategory, { total: number; unlocked: number }>;
      const byDomain = {} as Record<AchievementDomain, { total: number; unlocked: number }>;

      for (const t of tiers) byTier[t] = { total: 0, unlocked: 0 };
      for (const c of categories) byCategory[c] = { total: 0, unlocked: 0 };
      for (const d of domains) byDomain[d] = { total: 0, unlocked: 0 };

      let hiddenUnlocked = 0;

      for (const def of defs) {
        const isUnlocked = unlockedSet.has(def.id);
        byTier[def.tier].total++;
        if (isUnlocked) byTier[def.tier].unlocked++;
        byCategory[def.category].total++;
        if (isUnlocked) byCategory[def.category].unlocked++;
        byDomain[def.domain].total++;
        if (isUnlocked) byDomain[def.domain].unlocked++;
        if (def.hidden && isUnlocked) hiddenUnlocked++;
      }

      return {
        total: defs.length,
        unlocked: unlocked.length,
        byTier,
        byCategory,
        byDomain,
        hiddenUnlocked,
      };
    },

    getAllAchievements: () => {
      return get()._achievementDefs || [];
    },

    clearRecentUnlocks: () => {
      set({ recentUnlocks: [] });
    },
    reloadFromStorage: () => {
      const saved = loadUnlockedIds();
      const savedProgress = loadProgress();
      set({
        unlockedAchievements: saved,
        achievementProgress: savedProgress,
        recentUnlocks: [],
      });
    },

    // ═══ v0.7.0: 发放成就奖励 ═══
    grantReward: (achievementId) => {
      const defs: Achievement[] = get()._achievementDefs || [];
      const def = defs.find(d => d.id === achievementId);
      if (!def || !def.reward) return;

      const fullStore = get() as any;
      const reward = def.reward;

      // 元石奖励
      if (reward.currency && reward.currency > 0) {
        if (typeof fullStore.addCurrency === 'function') {
          fullStore.addCurrency(reward.currency);
        }
      }

      // 仙元石奖励
      if (reward.immortalCurrency && reward.immortalCurrency > 0) {
        const current = fullStore.immortalCurrency || 0;
        set({ immortalCurrency: current + reward.immortalCurrency } as any);
      }

      // 蛊材奖励
      if (reward.materials && Object.keys(reward.materials).length > 0) {
        for (const [matName, qty] of Object.entries(reward.materials)) {
          if (typeof fullStore.addMaterial === 'function') {
            fullStore.addMaterial(matName, qty);
          }
        }
      }

      // 杀招碎片奖励 → 解锁对应杀招
      if (reward.unlockKillMove && typeof fullStore.learnKillMove === 'function') {
        fullStore.learnKillMove({
          id: `ach_${achievementId}_${Date.now()}`,
          name: reward.unlockKillMove,
          path: '通用',
          level: 1,
          baseCost: 10,
          multiplier: 1.5,
          cooldown: 4,
          description: `成就解锁杀招: ${reward.unlockKillMove}`,
        });
      }

      // 道痕奖励
      if (reward.daoMarks && Object.keys(reward.daoMarks).length > 0) {
        for (const [path, delta] of Object.entries(reward.daoMarks)) {
          if (typeof fullStore.addDaoMarks === 'function') {
            fullStore.addDaoMarks(path, delta);
          }
        }
      }

      const logStore = get() as any;
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('achievement', `成就奖励发放: ${def.name}`, { achievementId, reward });
      }
    },
  };
};

// ─── 条件解析器 ───

function evaluateConditionString(condition: string, state: AchievementCheckState): boolean {
  const cond = condition.trim();

  // "turn >= N"
  const turnMatch = cond.match(/^turn\s*>=\s*(\d+)$/);
  if (turnMatch) return state.turn >= parseInt(turnMatch[1], 10);

  // "realmNum >= N"
  const realmNumMatch = cond.match(/^realmNum\s*>=\s*(\d+)$/);
  if (realmNumMatch) return state.realmNum >= parseInt(realmNumMatch[1], 10);

  // "currency >= N"
  const currencyMatch = cond.match(/^currency\s*>=\s*(\d+)$/);
  if (currencyMatch) return state.currency >= parseInt(currencyMatch[1], 10);

  // "guCount >= N"
  const guMatch = cond.match(/^guCount\s*>=\s*(\d+)$/);
  if (guMatch) return state.guCount >= parseInt(guMatch[1], 10);

  // "refinedGuCount >= N"
  const refinedMatch = cond.match(/^refinedGuCount\s*>=\s*(\d+)$/);
  if (refinedMatch) return state.refinedGuCount >= parseInt(refinedMatch[1], 10);

  // "knownNpcCount >= N"
  const npcMatch = cond.match(/^knownNpcCount\s*>=\s*(\d+)$/);
  if (npcMatch) return state.knownNpcCount >= parseInt(npcMatch[1], 10);

  // "knownLocations >= N"
  const locMatch = cond.match(/^knownLocations\s*>=\s*(\d+)$/);
  if (locMatch) return state.knownLocations >= parseInt(locMatch[1], 10);

  // "combatWins >= N"
  const combatMatch = cond.match(/^combatWins\s*>=\s*(\d+)$/);
  if (combatMatch) return state.combatWins >= parseInt(combatMatch[1], 10);

  // "crossDomainCount >= N"
  const crossMatch = cond.match(/^crossDomainCount\s*>=\s*(\d+)$/);
  if (crossMatch) return state.crossDomainCount >= parseInt(crossMatch[1], 10);

  // "hasFlag: flagName"
  const flagMatch = cond.match(/^hasFlag:\s*(\S+)$/);
  if (flagMatch) return !!state.flags[flagMatch[1]];

  // "daoHeart.mercy >= N"
  const mercyMatch = cond.match(/^daoHeart\.mercy\s*>=\s*(\d+)$/);
  if (mercyMatch) return (state.daoHeart?.mercy || 0) >= parseInt(mercyMatch[1], 10);

  // "daoHeart.kill >= N"
  const killMatch = cond.match(/^daoHeart\.kill\s*>=\s*(\d+)$/);
  if (killMatch) return (state.daoHeart?.kill || 0) >= parseInt(killMatch[1], 10);

  // CR8: "deaths >= N" — 累计死亡次数（成就条件）
  const deathsMatch = cond.match(/^deaths\s*>=\s*(\d+)$/);
  if (deathsMatch) return (state.deaths || 0) >= parseInt(deathsMatch[1], 10);

  // CR8: "renZuLegendsHeard >= N" — 人祖传说听闻次数
  const renZuMatch = cond.match(/^renZuLegendsHeard\s*>=\s*(\d+)$/);
  if (renZuMatch) return (state.renZuLegendsHeard || 0) >= parseInt(renZuMatch[1], 10);

  // CR8: "totalBattlesFought >= N" — 总战斗次数（CombatSlice totals）
  const totalBattlesMatch = cond.match(/^totalBattlesFought\s*>=\s*(\d+)$/);
  if (totalBattlesMatch) return (state as any).totalBattlesFought >= parseInt(totalBattlesMatch[1], 10);

  // 兜底
  return false;
}
