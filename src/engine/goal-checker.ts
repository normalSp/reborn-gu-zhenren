/**
 * ═══ 章节目标检查引擎 — P2补完 ═══
 * 在AI叙事完成、战斗结束、回合推进三个关键节点判定章节目标是否完成
 * 调用 chapterStore.completeGoal() / failGoal() 打通目标→路由推进链路
 */

import chaptersData from '../canon/chapters.json';

export interface GoalCheckContext {
  chapterId: string | null;
  currentDomain: string;
  realmGrand: number;
  turn: number;
  currency: number;
  flags: Record<string, any>;
  /** 最近一场战斗的敌人信息（来自 combatSlice） */
  lastCombat?: { enemyName?: string; victory: boolean };
  /** 最近一次NPC交互（来自 factionSlice） */
  lastNpcInteraction?: { npcId: string; topic: string };
}

/**
 * 判定当前章节的所有目标，将已完成的目标调用 completeGoal
 * @param store Zustand store 引用
 * @param ctx 目标判定上下文
 */
export function checkChapterGoals(
  store: any,
  ctx: GoalCheckContext,
): { completed: string[]; failed: string[] } {
  if (!ctx.chapterId) return { completed: [], failed: [] };

  const domainChapters = (chaptersData as any).domains?.[ctx.currentDomain] || [];
  const chapter = domainChapters.find((c: any) => c.id === ctx.chapterId);
  if (!chapter || !Array.isArray(chapter.goals)) return { completed: [], failed: [] };

  const currentGoals = (store.goals || {}) as Record<string, string>;
  const completed: string[] = [];
  const failed: string[] = [];

  for (const goal of chapter.goals) {
    const goalId = goal.id;
    // 已完成或已失败 → 跳过
    if (currentGoals[goalId] === 'completed' || currentGoals[goalId] === 'failed') continue;

    let isCompleted = false;
    const type = goal.type || 'milestone';

    switch (type) {
      case 'realm_gate':
        // 境界门槛：当前转数 >= 目标转数
        isCompleted = ctx.realmGrand >= (goal.targetGrand || 2);
        break;
      case 'economy':
        // 经济目标：当前元石 >= 目标金额
        isCompleted = ctx.currency >= (goal.targetAmount || 100);
        break;
      case 'milestone':
        // 里程碑：依赖 flag 标记（如 flag: 'first_refine_done'）
        if (goal.flag) {
          isCompleted = !!ctx.flags[goal.flag];
        }
        break;
      case 'exploration':
        // 探索目标：依赖 flag 标记（如 flag: 'visited_3_villages'）
        if (goal.flag) {
          isCompleted = !!ctx.flags[goal.flag];
        }
        break;
      case 'combat':
        // 战斗目标：最近一场战斗胜利
        isCompleted = !!ctx.lastCombat?.victory;
        break;
      case 'decision':
        // 决策目标：依赖 flag 标记（如 flag: 'joined_faction'）
        if (goal.flag) {
          isCompleted = !!ctx.flags[goal.flag];
        }
        break;
      case 'social':
        // 社交目标：依赖 flag 标记（如 flag: 'met_heaven_emissary'）
        if (goal.flag) {
          isCompleted = !!ctx.flags[goal.flag];
        }
        break;
      case 'survival':
        // 存活目标：默认通过（死的话不会进这里），也可依赖 flag
        if (goal.flag) {
          isCompleted = !!ctx.flags[goal.flag];
        } else {
          isCompleted = true; // 只要还活着默认完成
        }
        break;
      case 'observation':
        // 观察目标：依赖 flag 标记（如 flag: 'witnessed_cicada_loss'）
        if (goal.flag) {
          isCompleted = !!ctx.flags[goal.flag];
        }
        break;
      case 'challenge':
        // 挑战目标：依赖 flag 标记（如 flag: 'nilu_first_ascent_done'）
        if (goal.flag) {
          isCompleted = !!ctx.flags[goal.flag];
        }
        break;
      default:
        // 未知类型 → 检查 flag
        if (goal.flag) {
          isCompleted = !!ctx.flags[goal.flag];
        }
        break;
    }

    if (isCompleted) {
      store.completeGoal?.(goalId);
      completed.push(goalId);
    }
  }

  return { completed, failed };
}
