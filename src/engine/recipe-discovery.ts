/**
 * ═══ 残方发现引擎 + 蛊方解锁系统 — B1.7 / P4 ═══
 * 古遗迹探索→获得残方→实验材料补全→解锁新蛊虫配方
 *
 * 三档配方模型（设计大纲§5.3）：
 *   INNATE_RECIPES — 基础配方（1-2转，每流派1-2个代表蛊虫），开局即知
 *   进阶配方（1-5转其余蛊虫） — 需残方补全或确定性合成
 *   古方（6转+/仙蛊/传说级） — 仅古遗迹/NPC传授，面板完全隐藏
 */
import fragmentsRaw from '../canon/fragment-recipes.json';
import guDatabaseRaw from '../canon/gu-database.json';
import type { RefineInput } from './refine-engine';
import { canSpendMaterials } from './economy-service';
import { expandMaterialCost, getRegisteredRecipeForFragment } from './recipe-registry';
import { applyRefineSuccessModifiers } from './modifier-engine';
import { useStore } from '../store';

const guDatabase = guDatabaseRaw as Record<string, any>;

// ═══ 基础配方白名单（约24条，覆盖全部20个流派，1-2转每流派1-2个代表蛊虫） ═══
export const INNATE_RECIPES = new Set<string>([
  // 1转 光道/食道/智道/土道/木道
  '月光蛊', '酒虫', '书虫', '石皮蛊', '青丝蛊',
  // 1转 智道/金道/力道/骨道
  '侦察蛊', '铜皮蛊', '熊力蛊', '骨枪蛊',
  // 1-2转 水道/木道/风道/奴道/炎道
  '净水蛊', '种蛊', '扬声蛊', '驭虫蛊', '星火蛊',
  // 2转 力道/暗道/雷道/金道/变化道
  '力气蛊', '幽影随行蛊', '春雷蛊', '吞金蛊', '画皮蛊',
  // 2转 毒道/宇道/天道/人道/侦察 — 覆盖率补齐
  '爱生离', '纸鹤蛊', '希望蛊', '积德蛊', '蛇信蛊',
]);

export interface FragmentRecipe {
  id: string;
  name: string;
  /** CR5修复: type 与 fragment-recipes.json 字段一致。值: 'refine'(炼制残方) | 'ascend'(升炼残方) */
  type: 'refine' | 'ascend';
  targetGu: string;
  targetTier: number;
  fragmentsRequired?: number;
  requiredMaterials: string[];
  completionDifficulty: number;
  sourceType: 'exploration' | 'combat' | 'ruins';
  sourceChapter: string;
  description: string;
}

export interface FragmentState {
  fragmentId: string;
  discovered: boolean;
  completed: boolean;
  attempts: number;         // 补全尝试次数
  successBonus: number;     // 每次失败+5%成功率
}

/**
 * 加载所有残方
 */
export function loadAllFragments(): FragmentRecipe[] {
  return ((fragmentsRaw as any).fragments || []) as FragmentRecipe[];
}

/**
 * 根据章节获取可发现的残方
 */
export function getFragmentsForChapter(chapterName: string): FragmentRecipe[] {
  const all = loadAllFragments();
  return all.filter(f => f.sourceChapter === chapterName);
}

/**
 * 尝试补全残方
 * @returns {success, message, refineInput?}
 */
export function attemptCompleteFragment(
  fragment: FragmentRecipe,
  attempts: number = 0,
): { success: boolean; message: string; refineInput?: RefineInput } {
  const store = useStore.getState() as any;
  const daoMarks = store.pathBuild?.dao_marks || {};
  const lianDao = daoMarks['炼道'] || 0;

  // 补全成功率 = 1 - 难度 + 炼道加成 + 失败经验
  let rate = 1 - fragment.completionDifficulty + lianDao * 0.03 + attempts * 0.05;
  rate = applyRefineSuccessModifiers(rate, {
    store,
    operation: 'fragment_complete',
    path: guDatabase[fragment.targetGu]?.path || '',
    tier: fragment.targetTier,
    guName: fragment.targetGu,
  }).value;
  rate = Math.min(0.90, Math.max(0.05, rate));

  // 消耗蛊材（每次尝试消耗1份最难获取的蛊材/仙材）
  const materialCost = fragment.requiredMaterials[fragment.requiredMaterials.length - 1];
  if (!canSpendMaterials(store, [materialCost]).ok) {
    return { success: false, message: `实验蛊材不足，需要「${materialCost}」×1` };
  }
  (store as any).removeMaterial?.(materialCost, 1);

  if (Math.random() < rate) {
    const registryRecipe = getRegisteredRecipeForFragment(fragment.id);
    const registeredMaterials = registryRecipe ? expandMaterialCost(registryRecipe) : fragment.requiredMaterials;
    // 成功 — 返回炼蛊输入（蛊方解锁）
    return {
      success: true,
      message: `残方补全成功！解锁「${fragment.targetGu}」炼制配方`,
      refineInput: {
        specId: fragment.targetGu,
        name: fragment.targetGu,
        tier: fragment.targetTier,
        path: guDatabase[fragment.targetGu]?.path || '',
        refineMaterials: registeredMaterials.join('+'),
        refineDifficulty: fragment.completionDifficulty * 0.7, // 补全后炼制更容易
      },
    };
  }

  return {
    success: false,
    message: `补全失败……实验蛊材损耗殆尽（成功率${Math.round(rate * 100)}%）`,
  };
}

/**
 * 检查玩家是否拥有指定残方所需的全部材料
 */
export function canAttemptFragment(fragment: FragmentRecipe): boolean {
  const store = useStore.getState() as any;
  const lastMat = fragment.requiredMaterials[fragment.requiredMaterials.length - 1];
  return canSpendMaterials(store, [lastMat]).ok;
}

/**
 * 判断蛊方是否已解锁（三档模型）
 *   基础配方(INNATE_RECIPES) + 已补全(completedRecipes) → 解锁
 *   仙蛊/6转+ → 仅古方，不显示
 *   其余 → 未解锁（需收集残方）
 */
export function isRecipeUnlocked(guName: string, guSpec: any): boolean {
  const store = useStore.getState() as any;
  const completed = (store.flags?.completedRecipes || {}) as Record<string, boolean>;
  if (completed[guName]) return true;           // 残方补全/合成已解锁
  if (INNATE_RECIPES.has(guName)) return true;  // 基础配方
  if (guSpec.isImmortalGu) return false;         // 仙蛊: 仅古方获取
  if ((guSpec.tier || 1) >= 6) return false;     // 6转+: 仅古方获取
  return false;                                   // 进阶配方: 需解锁
}

/**
 * 确定性残方合成 — 集齐 fragmentsRequired 份同名残方→自动解锁蛊方
 */
export function synthesizeRecipe(fragmentId: string): { success: boolean; message: string } {
  const store = useStore.getState() as any;
  const discovered = (store.flags?.discoveredFragments || []) as string[];
  const fragments = loadAllFragments();
  const fragment = fragments.find(f => f.id === fragmentId);
  if (!fragment) return { success: false, message: '残方数据异常，请联系开发者' };

  const count = discovered.filter((id: string) => id === fragmentId).length;
  const requiredCount = Number(fragment.fragmentsRequired || 1);
  if (count < requiredCount) {
    return { success: false, message: `残方不足（需${requiredCount}份，当前${count}份）` };
  }

  // 消耗残方
  const newDiscovered = [...discovered];
  for (let i = 0; i < requiredCount; i++) {
    const idx = newDiscovered.indexOf(fragmentId);
    if (idx !== -1) newDiscovered.splice(idx, 1);
  }

  // 解锁蛊方
  useStore.setState((s: any) => ({
    ...s,
    flags: {
      ...s.flags,
      discoveredFragments: newDiscovered,
    },
  }));
  (useStore.getState() as any).unlockRecipe?.(fragment.targetGu, `fragment:${fragment.id}`);

  return { success: true, message: `残方合成成功！解锁「${fragment.targetGu}」炼制配方` };
}
