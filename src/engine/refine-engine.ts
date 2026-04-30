/**
 * 炼蛊合成引擎 (Refine Engine)
 * 4D.9 — 消耗蛊材+元石，按成功率炼制蛊虫
 */
import { useStore } from '../store';

export interface RefineInput {
  specId: string;
  name: string;
  tier: number;
  path: string;
  refineMaterials: string;
  refineDifficulty: number;
}

export interface RefineResult {
  success: boolean;
  message: string;
  costMaterials: string[];
  costCurrency: number;
}

/**
 * 解析蛊材字符串为材料列表
 * "月光石 + 光道蛊材" → ["月光石", "光道蛊材"]
 */
function parseMaterials(materialsStr: string): string[] {
  return materialsStr
    .split(/[\+\、,，]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('不可') && !s.startsWith('不需') && !s.includes('不可凡蛊'));
}

/**
 * 检查蛊材是否满足
 */
function checkMaterials(required: string[], materialBag: Record<string, number>): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  for (const mat of required) {
    if (!materialBag[mat] || materialBag[mat] < 1) {
      missing.push(mat);
    }
  }
  return { ok: missing.length === 0, missing };
}

/**
 * 计算炼制成功率
 * baseRate = max(0.1, 1 - difficulty * 0.1)
 * + 炼道道痕加成（每个道痕+2%）
 * + 百炼蛊师天赋（+15%）
 */
function calcSuccessRate(input: RefineInput, daoMarks: Record<string, number>, hasTalent: boolean): number {
  let rate = Math.max(0.1, 1 - input.refineDifficulty * 0.1);
  
  // 炼道道痕加成
  const lianDao = daoMarks['炼道'] || 0;
  rate += lianDao * 0.02;
  
  // 天赋加成
  if (hasTalent) rate += 0.15;
  
  return Math.min(0.95, rate);
}

/**
 * 执行炼蛊
 */
export function refineGu(input: RefineInput): RefineResult {
  const store = useStore.getState();
  const required = parseMaterials(input.refineMaterials);
  
  // 若材料列表为空（不需蛊材的蛊虫），默认消耗通用蛊材
  const materials = required.length > 0 ? required : [`${input.tier}转通用蛊材`];

  // 检查空窍容量
  const capacity = (store as any).getApertureCapacity?.() || 20;
  const inventory = (store as any).inventory || [];
  if (inventory.length >= capacity) {
    return { success: false, message: '空窍已满，无法再携带更多蛊虫', costMaterials: [], costCurrency: 0 };
  }

  // 检查蛊材
  const materialCheck = checkMaterials(materials, (store as any).materialBag || {});
  if (!materialCheck.ok) {
    return {
      success: false,
      message: `蛊材不足，缺少：${materialCheck.missing.join('、')}`,
      costMaterials: [],
      costCurrency: 0,
    };
  }

  // 炼制成本（元石）
  const currencyCost = input.tier * 5;
  if (!(store as any).spendCurrency?.(currencyCost)) {
    return {
      success: false,
      message: `元石不足，需要 ${currencyCost} 元石`,
      costMaterials: [],
      costCurrency: 0,
    };
  }

  // 消耗蛊材
  for (const mat of materials) {
    (store as any).removeMaterial?.(mat, 1);
  }

  // 成功率计算
  const daoMarks = store.pathBuild?.dao_marks || {};
  const talents = (store as any).selectedTalents || [];
  const hasLianDaoTalent = talents.some((t: any) => t.id === 'talent_hundred_refinements');
  const successRate = calcSuccessRate(input, daoMarks, hasLianDaoTalent);

  const roll = Math.random();
  const success = roll < successRate;

  if (success) {
    (store as any).addGu?.({
      id: `refined_${input.specId}_${Date.now()}`,
      specId: input.specId,
      name: input.name,
      tier: input.tier,
      path: input.path,
      currentState: 'optimal',
      proficiency: 0,
      bonded: false,
      active: true,
      acquiredAt: {
        turn: (store as any).turn || 1,
        narrative: `炼蛊成功——获得${input.name}（成功率${Math.round(successRate * 100)}%）`,
      },
    });
    return {
      success: true,
      message: `炼蛊成功！获得「${input.name}」（成功率${Math.round(successRate * 100)}%）`,
      costMaterials: materials,
      costCurrency: currencyCost,
    };
  }

  // 失败
  return {
    success: false,
    message: `炼蛊失败……蛊材与元石损耗殆尽（成功率${Math.round(successRate * 100)}%）`,
    costMaterials: materials,
    costCurrency: currencyCost,
  };
}
