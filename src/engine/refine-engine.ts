/**
 * 炼蛊合成引擎 (Refine Engine) — v2.0
 * B1.1: 成本公式统一 + 蛊材分级 + 耗时 + 全部加成源
 */
import { useStore } from '../store';
import { hasEffectTag } from './killmove-bridge';
import { hasRealmRefineBonus } from './secret-realm-detector';
import type { KillMove } from '../types';

// ═══ B1.1: 类型定义 ═══

/** 蛊材等级 */
export type MaterialGrade = '普通' | '精品' | '稀有' | '仙材';

/** 炼蛊输入（扩展） */
export interface RefineInput {
  specId: string;
  name: string;
  tier: number;
  path: string;
  refineMaterials: string;
  refineDifficulty: number;
  /** B1.1: 所需蛊材等级（自动解析） */
  materialGrade?: MaterialGrade;
  /** B1.1: 是否使用加速蛊虫 */
  useSpeedGu?: boolean;
  /** B1.1: 炼制环境（炼蛊房/天地秘境） */
  refineEnvironment?: 'normal' | 'refine_room' | 'secret_realm';
}

/** 炼蛊结果（扩展） */
export interface RefineResult {
  success: boolean;
  message: string;
  costMaterials: string[];
  costCurrency: number;
  /** B1.1: 炼制耗时（回合数） */
  refineTurns?: number;
  /** B1.3: 反噬信息（失败时填充） */
  backlash?: BacklashInfo | null;
}

/** B1.3: 反噬信息 */
export interface BacklashInfo {
  severity: '轻微' | '中等' | '严重' | '致命';
  hpDamage: number;
  apertureShock: boolean;   // 空窍震荡（容量-20%）
  guDyingRisk: boolean;     // 蛊虫死亡风险
  daoMarkDamage: boolean;   // 道痕永久受损
}

// ═══ B1.1: economy.json 对齐的成本表 ═══
const TIER_COST_TABLE: Record<number, { currency: number; materials: number; grade: MaterialGrade }> = {
  1: { currency: 8,  materials: 2, grade: '普通' },
  2: { currency: 20, materials: 3, grade: '普通' },
  3: { currency: 60, materials: 3, grade: '精品' },
  4: { currency: 150, materials: 4, grade: '精品' },
  5: { currency: 400, materials: 5, grade: '稀有' },
  6: { currency: 2000, materials: 5, grade: '仙材' },  // 仙蛊升炼
};

/** B1.1: 炼制耗时（回合数，1回合=游戏中1个时段） */
const TIER_TIME_TABLE: Record<number, number> = {
  1: 1, 2: 1, 3: 2, 4: 3, 5: 5, 6: 10,
};

// ═══ 蛊材解析 ═══

/**
 * 解析蛊材字符串为材料列表
 */
function parseMaterials(materialsStr: string): string[] {
  return materialsStr
    .split(/[\+\、,，]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('不可') && !s.startsWith('不需') && !s.includes('不可凡蛊'));
}

/**
 * B1.1: 根据转数自动判定蛊材等级
 */
export function resolveMaterialGrade(tier: number): MaterialGrade {
  if (tier >= 6) return '仙材';
  if (tier >= 5) return '稀有';
  if (tier >= 3) return '精品';
  return '普通';
}

/**
 * B1.1: 计算统一元石成本（对齐 economy.json）
 */
export function calculateMaterialCost(tier: number): number {
  return TIER_COST_TABLE[tier]?.currency ?? tier * 5;
}

/**
 * B1.1: 计算炼制所需蛊材数量
 */
export function calculateMaterialCount(tier: number): number {
  return TIER_COST_TABLE[tier]?.materials ?? 2;
}

/**
 * B1.1: 计算炼制耗时（含加速修正）
 */
export function calculateRefineTime(tier: number, hasSpeedGu: boolean = false, hasRefineSavant: boolean = false): number {
  const base = TIER_TIME_TABLE[tier] || 1;
  let multiplier = 1.0;
  if (hasSpeedGu) multiplier -= 0.30;       // 加速蛊 -30%
  if (hasRefineSavant) multiplier -= 0.15;  // 炼道奇才 -15%
  return Math.max(1, Math.round(base * multiplier));
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

// ═══ B1.1: 扩展成功率计算 ═══

/**
 * 计算炼制成功率
 * baseRate = max(0.1, 1 - difficulty * 0.1)
 * + 炼道道痕（每个+2%）
 * + 百炼蛊师天赋（+15%）
 * + 炼道奇才天赋（+20%）
 * + 炼蛊房环境（+5~15%）
 * + 天地秘境（+20%）
 * + 精炼蛊（+5%）
 * + 炼蛊加速蛊（+10%）
 */
function calcSuccessRate(
  input: RefineInput,
  daoMarks: Record<string, number>,
  hasTalent: boolean,
  hasRefineSavant: boolean = false,
): number {
  let rate = Math.max(0.1, 1 - input.refineDifficulty * 0.1);

  // 炼道道痕加成
  const lianDao = daoMarks['炼道'] || 0;
  rate += lianDao * 0.02;

  // 天赋加成
  if (hasTalent) rate += 0.15;
  if (hasRefineSavant) rate += 0.20;

  // B1.1: 环境加成
  if (input.refineEnvironment === 'refine_room') rate += 0.10;
  // B1.9: 天地秘境自动检测 — 同流派炼蛊+20%
  const inSecretRealm = input.refineEnvironment === 'secret_realm' || hasRealmRefineBonus(input.path);
  if (inSecretRealm) rate += 0.20;

  // B1.1: 精炼蛊加成（通过 store 检测）
  const store = useStore.getState() as any;
  const inventory = store.inventory || [];
  const hasRefineBoostGu = inventory.some((g: any) => g.name === '精炼蛊' && g.active !== false);
  if (hasRefineBoostGu) rate += 0.05;

  // B1.1: 炼蛊加速蛊加成
  const hasRefineSpeedGu = inventory.some((g: any) => g.name === '炼蛊加速蛊' && g.active !== false);
  if (hasRefineSpeedGu) rate += 0.10;

  // B3.3: 杀招炼蛊加速（检测玩家拥有的effectTags杀招）
  const killMoves: KillMove[] = (store as any).killMoves || [];
  const hasRefineSpeedKm = killMoves.some(km => hasEffectTag(km, 'refine_speed'));
  const hasRefineSuccessKm = killMoves.some(km => hasEffectTag(km, 'refine_success'));
  if (hasRefineSpeedKm) rate += 0.05;   // 百炼成钢
  if (hasRefineSuccessKm) rate += 0.08; // 天道酬勤

  // B3.5: 流派专属加成（同流派炼蛊成功率 bonus）
  const pathLevels = store.pathBuild?.path_levels || (store as any).pathLevels || {};
  const currentPathLevel = pathLevels[input.path] || '普通';
  const pathLevelBonus: Record<string, number> = {
    '普通': 0, '大师': 3, '宗师': 5, '大宗师': 8, '准无上': 10, '无上': 15, '道主': 20,
  };
  rate += ((pathLevelBonus[currentPathLevel] || 0) / 100);

  return Math.min(0.95, rate);
}

// ═══ B1.3: 反噬计算 ═══

/**
 * 计算炼蛊反噬
 */
function calculateBacklash(
  input: RefineInput,
  daoMarks: Record<string, number>,
  hasTalent: boolean,
  hasRefineSavant: boolean,
): BacklashInfo | null {
  const failRate = 1 - calcSuccessRate(input, daoMarks, hasTalent, hasRefineSavant);
  const difficultyMult = input.tier * 0.3;

  // 反噬减免
  const lianDao = daoMarks['炼道'] || 0;
  let backlashProb = failRate * difficultyMult * (1 - lianDao * 0.02);
  if (hasTalent) backlashProb *= 0.85;
  if (hasRefineSavant) backlashProb *= 0.75;
  backlashProb = Math.max(0.01, Math.min(0.80, backlashProb));

  // 不触发反噬
  if (Math.random() > backlashProb) return null;

  // 反噬等级判定
  const roll = Math.random();
  if (roll < 0.01) {
    return { severity: '致命', hpDamage: 60, apertureShock: false, guDyingRisk: false, daoMarkDamage: true };
  } else if (roll < 0.06) {
    return { severity: '严重', hpDamage: 60, apertureShock: false, guDyingRisk: true, daoMarkDamage: false };
  } else if (roll < 0.21) {
    return { severity: '中等', hpDamage: 30, apertureShock: true, guDyingRisk: false, daoMarkDamage: false };
  } else {
    return { severity: '轻微', hpDamage: 10, apertureShock: false, guDyingRisk: false, daoMarkDamage: false };
  }
}

// ═══ 主函数: 执行炼蛊 ═══

export function refineGu(input: RefineInput): RefineResult {
  const store = useStore.getState();
  const required = parseMaterials(input.refineMaterials);
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

  // ═══ B1.1: 统一成本公式（对齐 economy.json） ═══
  const currencyCost = calculateMaterialCost(input.tier);
  if (!(store as any).spendCurrency?.(currencyCost)) {
    return {
      success: false,
      message: `元石不足，需要 ${currencyCost} 元石`,
      costMaterials: [],
      costCurrency: 0,
    };
  }

  // ═══ B1.1: 炼制耗时 ═══
  const speedGu = inventory.some((g: any) => g.name === '加速蛊' && g.active !== false);
  const talents = (store as any).selectedTalents || [];
  const hasRefineSavant = talents.some((t: any) => t.id === 'talent_refinement_savant' || t.id === 'ti_refine_genius');
  const refineTurns = calculateRefineTime(input.tier, speedGu, hasRefineSavant);

  // 消耗蛊材
  for (const mat of materials) {
    (store as any).removeMaterial?.(mat, 1);
  }

  // 成功率计算
  const daoMarks = store.pathBuild?.dao_marks || {};
  const hasLianDaoTalent = talents.some((t: any) => t.id === 'talent_hundred_refinements');
  const successRate = calcSuccessRate(input, daoMarks, hasLianDaoTalent, hasRefineSavant);

  const roll = Math.random();
  const success = roll < successRate;

  if (success) {
    if ((input as any).isImmortalGu || (input.refineMaterials && input.refineMaterials.includes('不可凡蛊炼制'))) {
      return {
        success: false,
        message: `「${input.name}」为仙蛊，天地间独一无二，不可通过凡蛊炼制成法获得。`,
        costMaterials: materials,
        costCurrency: 0,
        refineTurns,
      };
    }
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
    const cur = (store as any).refinedGuCount || 0;
    (store as any).refinedGuCount = cur + 1;

    // ═══ B3.1: 蛊虫→杀招组装检测 ═══
    const killMoves: KillMove[] = (store as any).killMoves || [];
    const assemblyHint = killMoves.some(km =>
      km.coreGu?.includes(input.name) &&
      km.source === 'innate' &&
      !km.coreGu.every(cg => inventory.some((gi: any) => gi.name === cg))
    ) ? ' 检测到该蛊虫可参与杀招组装——请在杀招面板中尝试自创。' : '';

    return {
      success: true,
      message: `炼蛊成功！获得「${input.name}」（成功率${Math.round(successRate * 100)}%，耗时${refineTurns}回合）${assemblyHint}`,
      costMaterials: materials,
      costCurrency: currencyCost,
      refineTurns,
    };
  }

  // ═══ B1.3: 失败 + 反噬 ═══
  const backlash = calculateBacklash(input, daoMarks, hasLianDaoTalent, hasRefineSavant);
  if (backlash) {
    if (backlash.hpDamage > 0) {
      (store as any).applyHpDelta?.(-backlash.hpDamage, `炼蛊反噬-${backlash.severity}`);
    }
    // ═══ B3.4: 严重反噬→触发已装备杀招的反噬（冷却重置+HP惩罚） ═══
    if (backlash.severity === '严重' || backlash.severity === '致命') {
      const killMoves: KillMove[] = (store as any).killMoves || [];
      if (killMoves.length > 0) {
        const randomKm = killMoves[Math.floor(Math.random() * killMoves.length)];
        (store as any).useKillMove?.(randomKm.id); // 强制触发冷却
        (store as any).applyHpDelta?.(-5, `杀招反噬-${randomKm.name}`);
      }
    }
    return {
      success: false,
      message: `炼蛊失败……反噬！${backlash.severity}反噬：HP-${backlash.hpDamage}%（成功率${Math.round(successRate * 100)}%）`,
      costMaterials: materials,
      costCurrency: currencyCost,
      refineTurns,
      backlash,
    };
  }

  return {
    success: false,
    message: `炼蛊失败……蛊材与元石损耗殆尽（成功率${Math.round(successRate * 100)}%，耗时${refineTurns}回合）`,
    costMaterials: materials,
    costCurrency: currencyCost,
    refineTurns,
    backlash: null,
  };
}

// ═══ B1.6 预留: 合炼/拆炼/仙蛊升炼（后续阶段实现） ═══
export interface CombineInput {
  guIds: string[];     // 要合炼的蛊虫ID列表（需同流派）
  targetTier: number;  // 目标转数
}

export interface CombineResult {
  success: boolean;
  message: string;
  newGuName?: string;
}

export interface DisassembleInput {
  guId: string;
}

export interface DisassembleResult {
  success: boolean;
  message: string;
  recoveredMaterials?: string[];
}

export interface AscendInput {
  guId: string;        // 要升炼的凡蛊ID
  immortalMaterials: string[];
}

export interface AscendResult {
  success: boolean;
  message: string;
}

/** B1.6: 合炼 — 多只同流派凡蛊合成更高转数 */
export function combineGu(input: CombineInput): CombineResult {
  const store = useStore.getState() as any;
  const inventory: any[] = store.inventory || [];
  const targets = input.guIds.map(id => inventory.find((g: any) => g.id === id)).filter(Boolean);

  if (targets.length < 2) return { success: false, message: '至少需要2只同流派蛊虫进行合炼' };

  // 同流派验证
  const path = targets[0].path;
  if (!targets.every((g: any) => g.path === path)) {
    return { success: false, message: '合炼要求所有蛊虫属于同一流派' };
  }

  // 目标转数验证
  const maxTier = Math.max(...targets.map((g: any) => g.tier));
  if (input.targetTier <= maxTier) {
    return { success: false, message: `目标转数(${input.targetTier}转)必须高于合成材料中转数最高的蛊虫(${maxTier}转)` };
  }
  if (input.targetTier > 5) return { success: false, message: '合炼仅限凡蛊(1-5转)' };

  // 成功率
  const daoMarks = store.pathBuild?.dao_marks || {};
  const lianDao = daoMarks['炼道'] || 0;
  const rate = Math.min(0.85, 0.50 + lianDao * 0.03);

  if (Math.random() < rate) {
    // 成功 — 移除源蛊虫，添加合成蛊虫
    targets.forEach((g: any) => store.removeGu?.(g.id));
    const newName = `合炼·${path}蛊(${input.targetTier}转)`;
    store.addGu?.({
      id: `combined_${Date.now()}`,
      specId: newName, name: newName,
      tier: input.targetTier, path,
      currentState: 'optimal', proficiency: 0, bonded: false, active: true,
      acquiredAt: { turn: store.turn || 1, narrative: `合炼成功——${targets.map((g: any) => g.name).join('+')}合成为${newName}` },
    });
    return { success: true, message: `合炼成功！获得「${newName}」（成功率${Math.round(rate * 100)}%）`, newGuName: newName };
  }

  // 失败 — 随机损失一只蛊虫
  const loser = targets[Math.floor(Math.random() * targets.length)];
  store.removeGu?.(loser.id);
  return { success: false, message: `合炼失败……「${loser.name}」在合炼中损毁（成功率${Math.round(rate * 100)}%）` };
}

/** B1.6: 拆炼 — 高转数蛊虫拆解为蛊材（必定成功，产出80%） */
export function disassembleGu(input: DisassembleInput): DisassembleResult {
  const store = useStore.getState() as any;
  const inventory: any[] = store.inventory || [];
  const gu = inventory.find((g: any) => g.id === input.guId);
  if (!gu) return { success: false, message: '蛊虫不存在' };
  if (gu.bonded) return { success: false, message: '本命蛊不可拆炼' };

  const grade = resolveMaterialGrade(gu.tier);
  const count = calculateMaterialCount(gu.tier);
  const recovered = Math.max(1, Math.floor(count * 0.8));
  const matName = `${grade}蛊材`;

  store.removeGu?.(gu.id);
  store.addMaterial?.(matName, recovered);

  return {
    success: true,
    message: `拆炼成功！回收 ${matName}×${recovered}`,
    recoveredMaterials: [matName],
  };
}

/** B1.8: 仙蛊升炼 — 凡蛊吞噬精粹+仙材进化（≤5%概率） */
export function ascendImmortalGu(input: AscendInput): AscendResult {
  const store = useStore.getState() as any;
  const inventory: any[] = store.inventory || [];
  const gu = inventory.find((g: any) => g.id === input.guId);
  if (!gu) return { success: false, message: '蛊虫不存在' };
  if (gu.tier < 5) return { success: false, message: '仙蛊升炼需要至少5转凡蛊作为基底' };
  if (gu.bonded) return { success: false, message: '本命蛊不可用于升炼' };

  // 检查仙材
  const matBag = store.materialBag || {};
  const hasXiancai = immortalMaterials.some((m: string) => (matBag[m] || 0) >= 1);
  if (!hasXiancai) return { success: false, message: `仙材不足（需：${immortalMaterials.join('或')}×1）` };

  // 检查炼道道痕
  const daoMarks = store.pathBuild?.dao_marks || {};
  const lianDao = daoMarks['炼道'] || 0;
  if (lianDao < 20) return { success: false, message: `炼道道痕不足（${lianDao}/20），无法驾驭仙蛊升炼` };

  // 成功率：3% + 炼道×0.1%，上限5%
  const rate = Math.min(0.05, 0.03 + lianDao * 0.001);
  const talents = (store as any).selectedTalents || [];
  const hasRefineSavant = talents.some((t: any) => t.id === 'talent_refinement_savant');
  const finalRate = hasRefineSavant ? Math.min(0.08, rate + 0.02) : rate;

  // 消耗仙材
  const consumedMat = immortalMaterials.find((m: string) => (matBag[m] || 0) >= 1) || immortalMaterials[0];
  store.removeMaterial?.(consumedMat, 1);

  if (Math.random() < finalRate) {
    // 成功 — 凡蛊升为仙蛊
    store.removeGu?.(gu.id);
    const immortalName = `升炼·${gu.name}(仙)`;
    store.addGu?.({
      id: `ascended_${Date.now()}`,
      specId: immortalName, name: immortalName,
      tier: 6, path: gu.path, rank: 'legendary',
      isImmortalGu: true,
      currentState: 'optimal', proficiency: 0, bonded: false, active: true,
      acquiredAt: { turn: store.turn || 1, narrative: `仙蛊升炼成功！「${gu.name}」吞噬仙材${consumedMat}后进化为仙蛊！` },
    });
    return { success: true, message: `仙蛊升炼成功！「${gu.name}」进化为「${immortalName}」！（成功率${Math.round(finalRate * 100)}%）` };
  }

  // 失败 — 蛊虫受损（饥饿状态 +1 级）
  store.updateGuState?.(gu.id, 'hungry');
  return { success: false, message: `仙蛊升炼失败……「${gu.name}」因反噬进入饥饿状态（成功率${Math.round(finalRate * 100)}%）` };
}
