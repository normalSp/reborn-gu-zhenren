/**
 * 引导 FSM Slice — P1预留（FSM骨架），P2填充引导步骤内容
 * 参照大纲第四部分：新手引导系统
 */

import { STORAGE_KEYS } from '../storageKeys';

export type TutorialState = 'inactive' | 'active' | 'completed' | 'skipped';

export interface TutorialSlice {
  /** 引导整体状态 */
  tutorialState: TutorialState;
  /** 当前引导步骤（0-based） */
  currentStep: number;
  /** 是否允许跳过引导 */
  tutorialSkippable: boolean;

  /** 启动引导（进入 game_play 前触发） */
  startTutorial: () => void;
  /** 推进到下一步 */
  advanceStep: () => void;
  /** 跳过引导（写入 localStorage 标记） */
  skipTutorial: () => void;
  /** 完成引导 */
  completeTutorial: () => void;
}

const TUTORIAL_COMPLETED_KEY = STORAGE_KEYS.TUTORIAL_COMPLETED;
const TUTORIAL_SKIPPED_KEY = STORAGE_KEYS.TUTORIAL_SKIPPED;

export const createTutorialSlice = (set: any, get: any): TutorialSlice => ({
  tutorialState: 'inactive',
  currentStep: 0,
  tutorialSkippable: true,

  startTutorial: () => {
    // 检查是否已完成或跳过
    const completed = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
    const skipped = localStorage.getItem(TUTORIAL_SKIPPED_KEY);
    if (completed === 'true' || skipped === 'true') {
      set({ tutorialState: 'completed' as TutorialState });
      return;
    }
    set({ tutorialState: 'active', currentStep: 0 });
  },

  advanceStep: () => {
    set((s: TutorialSlice) => ({ currentStep: s.currentStep + 1 }));
  },

  skipTutorial: () => {
    localStorage.setItem(TUTORIAL_SKIPPED_KEY, 'true');
    set({ tutorialState: 'skipped' });
  },

  completeTutorial: () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    set({ tutorialState: 'completed' });
  },
});
