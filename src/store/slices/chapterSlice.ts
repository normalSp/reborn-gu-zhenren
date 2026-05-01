/**
 * 章节弧光 Slice — P1基础架构，P2扩展五域章节+名场面涟漪
 * 参照大纲第二部分：章节弧光系统
 */
import type {
  ChapterDefinition,
  ChapterRecord,
  ChapterProgressionResult,
  ChapterTransitionState,
  EventStatus,
  GoalStatus,
} from '../../types';
import chaptersRaw from '../../canon/chapters.json';

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
  currentDomain: '南疆',
  chapterHistory: [],
  activeEvents: {},
  goals: {},
  transitionState: 'idle',

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

    set({
      currentChapterId: chapterId,
      activeEvents: {},
      goals: newGoals,
      transitionState: 'idle',
      chapterHistory: [...state.chapterHistory, record],
    });

    if (typeof store.setFlag === 'function') {
      store.setFlag('current_chapter', def.name);
      store.setFlag('current_domain', domain);
      store.setFlag('current_chapter_id', chapterId);
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
    if (!chapter) {
      return { shouldTransition: false, reason: '无当前章节' };
    }

    // 检查所有目标是否完成
    const allGoalsCompleted = chapter.goals.every(g => state.goals[g.id] === 'completed');
    if (!allGoalsCompleted) {
      return { shouldTransition: false, reason: '章节目标未全部完成' };
    }

    // 查找域内下一章节
    const domainChapters = chaptersData.domains[state.currentDomain] || [];
    const currentIdx = domainChapters.findIndex(c => c.id === chapter.id);
    if (currentIdx >= 0 && currentIdx < domainChapters.length - 1) {
      const next = domainChapters[currentIdx + 1];
      return {
        shouldTransition: true,
        nextChapterId: next.id,
        reason: `所有目标已完成，可推进至「${next.displayName}」`,
      };
    }

    // 已经是域内最后一章 — 需要跨域切换（P2实现）
    if (chapter.exitTriggers) {
      return {
        shouldTransition: true,
        nextDomain: chapter.exitTriggers.split('→')[1]?.trim(),
        reason: `域内章节全部完成，${chapter.exitTriggers}`,
      };
    }

    return { shouldTransition: false, reason: '已是域内最后一章，跨域切换在P2实现' };
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
  },

  skipEvent: (eventId) => {
    set((s: ChapterSlice) => ({
      activeEvents: { ...s.activeEvents, [eventId]: 'skipped' as EventStatus },
    }));
  },

  setTransitionState: (newState) => {
    set({ transitionState: newState });
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
      set({ chapterHistory: history, transitionState: 'confirmed' });
    }
  },
});
