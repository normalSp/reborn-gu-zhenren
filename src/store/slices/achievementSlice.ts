/**
 * 成就 Slice — P1预留，P2填充完整检测逻辑
 * 参照大纲第九部分：成就系统
 */

export interface AchievementSlice {
  /** 已解锁成就 ID 列表 */
  unlockedAchievements: string[];
  /** 累进型成就进度（achievementId → 当前进度数值） */
  achievementProgress: Record<string, number>;

  /** P1空执行：P2填充检测所有成就条件的完整逻辑 */
  checkAchievements: () => void;
  /** 解锁成就（避免重复解锁） */
  unlockAchievement: (id: string) => void;
  /** 更新累进型成就进度 */
  updateAchievementProgress: (id: string, progress: number) => void;
  /** 检查是否已解锁 */
  isAchievementUnlocked: (id: string) => boolean;
}

export const createAchievementSlice = (set: any, get: any): AchievementSlice => ({
  unlockedAchievements: [],
  achievementProgress: {},

  checkAchievements: () => {
    // P1空执行：P2填充完整检测逻辑
    // P2将在每轮RESOLVED后自动检测所有成就触发条件
    // 检测维度包括：回合数/境界/元石/蛊虫数量/势力声望/NPC好感/道心四维等
    console.log('[Achievement] P1 stub — checkAchievements() 空执行');
  },

  unlockAchievement: (id) => {
    const state = get() as AchievementSlice;
    if (state.unlockedAchievements.includes(id)) return; // 避免重复
    set({ unlockedAchievements: [...state.unlockedAchievements, id] });
    console.log(`[Achievement] 解锁成就: ${id}`);
  },

  updateAchievementProgress: (id, progress) => {
    set((s: AchievementSlice) => ({
      achievementProgress: { ...s.achievementProgress, [id]: progress },
    }));
  },

  isAchievementUnlocked: (id) => {
    return (get() as AchievementSlice).unlockedAchievements.includes(id);
  },
});
