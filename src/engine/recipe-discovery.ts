/**
 * ═══ 残方发现引擎 — B1.7 ═══
 * 古遗迹探索→获得残方→实验材料补全→解锁新蛊虫配方
 */
import fragmentsRaw from '../canon/fragment-recipes.json';
import type { RefineInput } from './refine-engine';
import { useStore } from '../store';

export interface FragmentRecipe {
  id: string;
  name: string;
  path: string;
  targetGu: string;
  targetTier: number;
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
  const talents = (store as any).selectedTalents || [];
  const hasRefineSavant = talents.some((t: any) => t.id === 'talent_refinement_savant' || t.id === 'ti_refine_genius');

  // 补全成功率 = 1 - 难度 + 炼道加成 + 失败经验
  let rate = 1 - fragment.completionDifficulty + lianDao * 0.03 + attempts * 0.05;
  if (hasRefineSavant) rate += 0.10;
  rate = Math.min(0.90, Math.max(0.05, rate));

  // 消耗材料（每次尝试消耗1份最难获取的材料）
  const materialCost = fragment.requiredMaterials[fragment.requiredMaterials.length - 1];
  const matBag = store.materialBag || {};
  if ((matBag[materialCost] || 0) < 1) {
    return { success: false, message: `实验材料不足，需要「${materialCost}」×1` };
  }
  (store as any).removeMaterial?.(materialCost, 1);

  if (Math.random() < rate) {
    // 成功 — 返回炼蛊输入（配方解锁）
    return {
      success: true,
      message: `残方补全成功！解锁「${fragment.targetGu}」炼制配方`,
      refineInput: {
        specId: fragment.targetGu,
        name: fragment.targetGu,
        tier: fragment.targetTier,
        path: fragment.path,
        refineMaterials: fragment.requiredMaterials.join('+'),
        refineDifficulty: fragment.completionDifficulty * 0.7, // 补全后炼制更容易
      },
    };
  }

  return {
    success: false,
    message: `补全失败……实验材料损耗殆尽（成功率${Math.round(rate * 100)}%）`,
  };
}

/**
 * 检查玩家是否拥有指定残方所需的全部材料
 */
export function canAttemptFragment(fragment: FragmentRecipe): boolean {
  const store = useStore.getState() as any;
  const matBag = store.materialBag || {};
  const lastMat = fragment.requiredMaterials[fragment.requiredMaterials.length - 1];
  return (matBag[lastMat] || 0) >= 1;
}
