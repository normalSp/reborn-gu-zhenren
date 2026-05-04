/**
 * 章节弧光 Slice — P1基础架构，P2扩展五域章节+名场面涟漪
 * 参照大纲第二部分：章节弧光系统
 */
import type {
  ChapterDefinition,
  ChapterRecord,
  ChapterProgressionResult,
  ChapterRoute,
  ChapterTransitionState,
  CombatConstraint,
  EventStatus,
  GlobalEventStatus,
  GoalStatus,
} from '../../types';
import chaptersRaw from '../../canon/chapters.json';
import { routeReachableChapters } from '../../engine/chapter-router';

const chaptersData = chaptersRaw as {
  domains: Record<string, ChapterDefinition[]>;
  global: Array<{ eventId: string; name: string; description: string; triggerChapter: string; rippleStrength: string; affectedDomains: string[] }>;
};

export interface ChapterSlice {
  /** 当前章节ID */
  currentChapterId: string | null;
  /** 当前所处的域（P1固定"南疆"，所有域相关逻辑通过此字段获取） */
  currentDomain: string;
  /** 已完成/进行中的章节记录 */
  chapterHistory: ChapterRecord[];
  /** 当前章节激活的名场面状态 */
  activeEvents: Record<string, EventStatus>;
  /** 当前章节目标完成状态 */
  goals: Record<string, GoalStatus>;
  /** 转章过渡状态 */
  transitionState: ChapterTransitionState;
  /** P2-2a: 全局事件状态（eventId → 触发/完成） */
  globalEventStatus: Record<string, GlobalEventStatus>;
  /** P2-4b: 待注入的战斗约束（消费后自动清除） */
  transientCombatConstraint: CombatConstraint | null;
  setTransientCombatConstraint: (c: CombatConstraint | null) => void;

  /** 初始化章节（角色创建后调用） */
  initChapter: (chapterId: string, domain: string) => void;
  /** 激活指定章节 */
  activateChapter: (chapterId: string) => void;
  /** 检测是否满足章节推进条件 */
  checkProgression: () => ChapterProgressionResult;
  /** 获取当前章节定义 */
  getCurrentChapter: () => ChapterDefinition | null;
  /** 完成一个章节目标 */
  completeGoal: (goalId: string) => void;
  /** 标记目标失败 */
  failGoal: (goalId: string) => void;
  /** 触发名场面事件 */
  triggerEvent: (eventId: string) => void;
  /** 跳过名场面事件 */
  skipEvent: (eventId: string) => void;
  /** 设置转章过渡状态 */
  setTransitionState: (state: ChapterTransitionState) => void;
  /** 完成后处理——记录章节历史 */
  finalizeChapter: () => void;
}

export const createChapterSlice = (set: any, get: any): ChapterSlice => ({
  currentChapterId: null,
  currentDomain: '',
  chapterHistory: [],
  activeEvents: {},
  goals: {},
  transitionState: 'idle',
  globalEventStatus: {},
  transientCombatConstraint: null,

  initChapter: (chapterId, domain) => {
    const domainChapters = chaptersData.domains[domain];
    if (!domainChapters) {
      console.warn(`[ChapterSlice] 域 "${domain}" 不存在于 chapters.json 中`);
      return;
    }
    const def = domainChapters.find(c => c.id === chapterId);
    if (!def) {
      console.warn(`[ChapterSlice] 章节 "${chapterId}" 在域 "${domain}" 中不存在`);
      return;
    }

    const now = Date.now();
    const store = get() as any;
    const turn = store.turn || 1;

    const record: ChapterRecord = {
      chapterId,
      domain,
      startedAt: { turn, timestamp: now },
      goalsCompleted: [],
      goalsFailed: [],
    };

    const initialGoals: Record<string, GoalStatus> = {};
    for (const g of def.goals) {
      initialGoals[g.id] = 'active';
    }

    set({
      currentChapterId: chapterId,
      currentDomain: domain,
      activeEvents: {},
      goals: initialGoals,
      transitionState: 'idle',
      chapterHistory: [...get().chapterHistory, record],
    });

    // 同步到 playerSlice.flags（向后兼容现有读取逻辑）
    if (typeof store.setFlag === 'function') {
      store.setFlag('current_chapter', def.name);
      store.setFlag('current_domain', domain);
      store.setFlag('current_chapter_id', chapterId);
    }
    // ═══ 日志埋点: 章节初始化
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('narrative', `章节开始: ${def.displayName} (${domain})`, {
        chapterId, domain, displayName: def.displayName,
      });
    }
  },

  activateChapter: (chapterId) => {
    const state = get() as ChapterSlice;
    const domain = state.currentDomain;
    const domainChapters = chaptersData.domains[domain];
    if (!domainChapters) return;

    const def = domainChapters.find(c => c.id === chapterId);
    if (!def) {
      console.warn(`[ChapterSlice] 无法激活章节 "${chapterId}"：不在当前域 "${domain}" 中`);
      return;
    }

    const now = Date.now();
    const store = get() as any;
    const turn = store.turn || 1;

    const record: ChapterRecord = {
      chapterId,
      domain,
      startedAt: { turn, timestamp: now },
      goalsCompleted: [],
      goalsFailed: [],
    };

    const newGoals: Record<string, GoalStatus> = {};
    for (const g of def.goals) {
      newGoals[g.id] = 'active';
    }

    // P2-2a: 章节关联全局事件→标记triggered
    const updatedEventStatus = { ...state.globalEventStatus };
    if (def.globalEventId) {
      updatedEventStatus[def.globalEventId] = {
        triggered: true,
        completed: false,
        triggeredAtChapter: chapterId,
      };
    }

    set({
      currentChapterId: chapterId,
      activeEvents: {},
      goals: newGoals,
      transitionState: 'idle',
      globalEventStatus: updatedEventStatus,
      chapterHistory: [...state.chapterHistory, record],
    });

    if (typeof store.setFlag === 'function') {
      store.setFlag('current_chapter', def.name);
      store.setFlag('current_domain', domain);
      store.setFlag('current_chapter_id', chapterId);
    }
    // ═══ 日志埋点: 章节激活
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('narrative', `章节激活: ${def.displayName}`, {
        chapterId, domain, displayName: def.displayName,
      });
    }
  },

  getCurrentChapter: () => {
    const state = get() as ChapterSlice;
    if (!state.currentChapterId) return null;
    const domainChapters = chaptersData.domains[state.currentDomain];
    if (!domainChapters) return null;
    return domainChapters.find(c => c.id === state.currentChapterId) || null;
  },

  checkProgression: () => {
    const state = get() as ChapterSlice;
    const chapter = get().getCurrentChapter?.() as ChapterDefinition | null;

    // 无当前章节 → 使用路由引擎判断起点
    if (!chapter) {
      // 查找当前域的入口章
      const domainChapters = chaptersData.domains[state.currentDomain] || [];
      const openingChapter = domainChapters.find(c => c.domainOpeningChapter);
      if (openingChapter) {
        return {
          shouldTransition: true,
          nextChapterId: openingChapter.id,
          reason: `进入${state.currentDomain}起始章节「${openingChapter.displayName}」`,
        };
      }
      return { shouldTransition: false, reason: '无当前章节' };
    }

    // ─── 步骤1: 检查所有目标是否完成 ───
    const allGoalsCompleted = chapter.goals.every(g => state.goals[g.id] === 'completed');
    if (!allGoalsCompleted) {
      return { shouldTransition: false, reason: '章节目标未全部完成' };
    }

    // ─── 步骤2: 通过路由引擎计算可达章节（P2核心升级） ───
    const store = get() as any;
    const routerResult = routeReachableChapters({
      currentDomain: state.currentDomain,
      currentChapterId: state.currentChapterId,
      chapterHistory: state.chapterHistory,
      flags: store.flags || {},
      realm: store.profile?.realm?.grand || 1,
      turn: store.turn || 1,
      chaptersData: chaptersData as any,
    });

    const { reachable, recommended, upcomingEvents } = routerResult;

    // ─── 步骤3: 路由退化检测——当路由引擎输出的可达章节为空且非当前域末章时 ───
    if (reachable.length === 0) {
      // 检查是否已是域内最后一章
      const domainChapters = chaptersData.domains[state.currentDomain] || [];
      const currentIdx = domainChapters.findIndex(c => c.id === chapter.id);
      const isLastInDomain = currentIdx >= 0 && currentIdx === domainChapters.length - 1;

      // 域末章且有 exitTriggers → 跨域切换
      if (isLastInDomain && chapter.exitTriggers) {
        const exitDomain = chapter.exitTriggers.split('→')[1]?.trim();
        return {
          shouldTransition: true,
          nextDomain: exitDomain,
          reason: `域内章节全部完成，${chapter.exitTriggers}`,
        };
      }

      // 域末章但无 exitTriggers → 自由漫游（P2+会补充跨域路由）
      if (isLastInDomain) {
        return { shouldTransition: false, reason: `已是${state.currentDomain}域最后一章，跨域切换待定` };
      }

      // 非域末章但无路由 → 退化到线性查找（兼容南疆P1三章）
      if (currentIdx >= 0 && currentIdx < domainChapters.length - 1) {
        const next = domainChapters[currentIdx + 1];
        return {
          shouldTransition: true,
          nextChapterId: next.id,
          reason: `所有目标已完成，可推进至「${next.displayName}」`,
        };
      }

      return { shouldTransition: false, reason: '无可达章节' };
    }

    // ─── 步骤4: 多路由选项 → 返回选项列表供UI展示 ───
    if (reachable.length > 1) {
      const nextChapterOptions = reachable;
      return {
        shouldTransition: true,
        nextChapterOptions,
        proximityEvents: upcomingEvents,
        reason: `发现 ${reachable.length} 条可推进路线，请选择`,
      };
    }

    // ─── 步骤5: 单一路由 → 直接推荐 ───
    const onlyRoute = reachable[0];
    return {
      shouldTransition: true,
      nextChapterId: onlyRoute.chapterId || recommended?.chapterId,
      nextChapterOptions: reachable,
      nextDomain: onlyRoute.domain !== state.currentDomain ? onlyRoute.domain : undefined,
      proximityEvents: upcomingEvents,
      reason: `可推进至「${onlyRoute.displayName}」`,
    };
  },

  completeGoal: (goalId) => {
    set((s: ChapterSlice) => ({
      goals: { ...s.goals, [goalId]: 'completed' as GoalStatus },
    }));
  },

  failGoal: (goalId) => {
    set((s: ChapterSlice) => ({
      goals: { ...s.goals, [goalId]: 'failed' as GoalStatus },
    }));
  },

  triggerEvent: (eventId) => {
    set((s: ChapterSlice) => ({
      activeEvents: { ...s.activeEvents, [eventId]: 'active' as EventStatus },
    }));
    // ═══ P0.2: 人祖传说事件检测 — 事件ID含renzu时自动递增 ═══
    if (/renzu/i.test(eventId)) {
      const fullStore = get() as any;
      const current = fullStore.renZuLegendsHeard || 0;
      set({ renZuLegendsHeard: current + 1 });
    }
  },

  skipEvent: (eventId) => {
    set((s: ChapterSlice) => ({
      activeEvents: { ...s.activeEvents, [eventId]: 'skipped' as EventStatus },
    }));
  },

  setTransitionState: (newState) => {
    set({ transitionState: newState });
  },

  setTransientCombatConstraint: (c) => {
    set({ transientCombatConstraint: c });
  },

  finalizeChapter: () => {
    const state = get() as ChapterSlice;
    const history = [...state.chapterHistory];
    if (history.length > 0) {
      const last = { ...history[history.length - 1] };
      const store = get() as any;
      last.completedAt = {
        turn: store.turn || 1,
        timestamp: Date.now(),
      };
      last.goalsCompleted = Object.entries(state.goals)
        .filter(([, status]) => status === 'completed')
        .map(([id]) => id);
      last.goalsFailed = Object.entries(state.goals)
        .filter(([, status]) => status === 'failed')
        .map(([id]) => id);
      history[history.length - 1] = last;

      // P2-2a: 查找当前章节关联的全局事件并标记completed
      const domainChapters = chaptersData.domains[state.currentDomain];
      const def = domainChapters?.find(c => c.id === last.chapterId);
      const updatedEventStatus = { ...state.globalEventStatus };
      if (def?.globalEventId && updatedEventStatus[def.globalEventId]) {
        updatedEventStatus[def.globalEventId] = {
          ...updatedEventStatus[def.globalEventId],
          completed: true,
        };
      }

      set({
        chapterHistory: history,
        globalEventStatus: updatedEventStatus,
        transitionState: 'confirmed',
      });
      // ═══ 日志埋点: 章节完成
      const logStore = get() as any;
      if (typeof logStore.addGameLog === 'function') {
        const chapterDef = domainChapters?.find(c => c.id === last.chapterId);
        logStore.addGameLog('narrative', `章节完成: ${chapterDef?.displayName || last.chapterId}`, {
          chapterId: last.chapterId,
          goalsCompleted: last.goalsCompleted,
          goalsFailed: last.goalsFailed,
          turn: last.completedAt?.turn,
        });
      }
    }
  },
});
