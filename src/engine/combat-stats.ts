/**
 * ═══ 战斗属性推导引擎 — P4 数值审计修复 ═══
 * 将角色属性(体魄/资质/境界)映射为战斗数值(HP/ATK/DEF/命中/闪避)
 * 
 * 原著参考:
 * - 体魄强→气血旺盛(HP高)+防御厚(DEF高)
 * - 资质高→真元充足(ATK高)+修行快
 * - 境界提升→全方位增幅
 * - 天赋修饰符(talentModifiers)由 selectedTalents 中的 benefits 解析得出
 */

export interface CombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  accuracy: number;
  evasion: number;
}

export interface CombatStatsInput {
  /** 角色体魄 (1-10) */
  physique: number;
  /** 角色资质 (1-10) */
  aptitude: number;
  /** 角色心智 (1-10) */
  mind: number;
  /** 境界转数 (1-9) */
  realmGrand: number;
  /** 天赋修正集合: 如 ['hp+10%', 'atk+20%', 'def-10%'] */
  talentModifiers: string[];
}

/**
 * 解析天赋字符串中的数值修饰符
 * 例如: "生命上限+10%" → { stat:'hp', mult:0.10 }
 *       "体魄+2" → { stat:'physique', add:2 } (在外部处理)
 *       "防御-10%" → { stat:'def', mult:-0.10 }
 */
function parseModifier(mod: string): { stat: string; mult: number } | null {
  const hpMatch = mod.match(/生命上限?[+＋](\\d+)%/);
  if (hpMatch) return { stat: 'hp', mult: parseInt(hpMatch[1]) / 100 };

  const atkMatch = mod.match(/攻击力?[+＋](\\d+)%/);
  if (atkMatch) return { stat: 'atk', mult: parseInt(atkMatch[1]) / 100 };

  const defMatch = mod.match(/防御[+＋](\\d+)%/);
  if (defMatch) return { stat: 'def', mult: parseInt(defMatch[1]) / 100 };

  const defNegMatch = mod.match(/防御-(\\d+)%/);
  if (defNegMatch) return { stat: 'def', mult: -parseInt(defNegMatch[1]) / 100 };

  const spdMatch = mod.match(/速度[+＋](\\d+)%/);
  if (spdMatch) return { stat: 'evasion', mult: parseInt(spdMatch[1]) / 100 };

  const hitMatch = mod.match(/命中[+＋](\\d+)%/);
  if (hitMatch) return { stat: 'accuracy', mult: parseInt(hitMatch[1]) / 100 };

  return null;
}

/** 计算基础战斗属性 */
export function deriveCombatStats(input: CombatStatsInput): CombatStats {
  const { physique, aptitude, mind, realmGrand, talentModifiers } = input;
  const r = realmGrand;

  // ═══ v0.8.0-immortal: 升仙质变断崖式增长 ═══
  // 蛊师阶段(1-5转): 线性增长 — 渐进修行
  // 蛊仙阶段(6-9转): 断崖飞跃 — 升仙即质变，凡人不可敌
  const isImmortal = r >= 6;
  const immortalScale = isImmortal ? r - 5 : 0; // 6转=1, 7转=2, 8转=3, 9转=4

  // 以5转巅峰值作为"蛊师基底"（蛊师阶段已计算到r-1=4）
  const mortalBaseHp = 80 + physique * 20 + 4 * 25;
  const mortalBaseAtk = aptitude * 4 + physique * 2 + 4 * 8;
  const mortalBaseDef = physique * 3 + 4 * 4;

  let maxHp: number;
  let attack: number;
  let defense: number;
  let accuracy: number;
  let evasion: number;

  if (isImmortal) {
    // ═══ v0.7.0: 升仙质变·真断崖——5x起步 ═══
    // 原著：蛊仙与蛊师之间有质变断崖，数值极度夸张
    // 6转≈6x基底, 7转≈9x, 8转≈12x, 9转≈15x
    const hpMult = 3.0 + immortalScale * 3.0;
    const atkMult = 2.0 + immortalScale * 1.5;
    const defMult = 1.5 + immortalScale * 1.2;
    maxHp = Math.round(mortalBaseHp * hpMult);
    attack = Math.round(mortalBaseAtk * atkMult);
    defense = Math.round(mortalBaseDef * defMult);
    // 蛊仙命中/闪避也有质变：仙识远超凡人
    accuracy = 75 + mind * 2 + immortalScale * 4;
    evasion = 35 + physique * 2 + immortalScale * 2;
  } else {
    // 1-5转蛊师：线性增长
    maxHp = 80 + physique * 20 + (r - 1) * 25;
    attack = Math.round(aptitude * 4 + physique * 2 + (r - 1) * 8);
    defense = Math.round(physique * 3 + (r - 1) * 4);
    accuracy = 70 + mind * 1 + (r - 1) * 2;
    evasion = 30 + physique * 1;
  }

  // 天赋修正累乘
  for (const mod of talentModifiers) {
    const parsed = parseModifier(mod);
    if (!parsed) continue;
    switch (parsed.stat) {
      case 'hp': maxHp = Math.round(maxHp * (1 + parsed.mult)); break;
      case 'atk': attack = Math.round(attack * (1 + parsed.mult)); break;
      case 'def': defense = Math.round(defense * (1 + parsed.mult)); break;
      case 'accuracy': accuracy = Math.round(accuracy * (1 + parsed.mult)); break;
      case 'evasion': evasion = Math.round(evasion * (1 + parsed.mult)); break;
    }
  }

  return {
    hp: maxHp,
    maxHp,
    attack,
    defense,
    accuracy: Math.max(30, Math.min(95, accuracy)),
    evasion: Math.max(10, Math.min(70, evasion)),
  };
}

/**
 * 从天赋列表中提取 benefit/cost 字符串作为修正集
 * 用于 CharacterCreate 在 handleConfirm 时调用
 */
export function extractTalentModifiers(
  talents: Array<{ benefits?: string[]; costs?: string[] }>,
): string[] {
  const mods: string[] = [];
  for (const t of talents) {
    if (t.benefits) mods.push(...t.benefits);
    if (t.costs) mods.push(...t.costs);
  }
  return mods;
}

/**
 * 境界→推荐敌方数值 (用于 combat-constraints 标准化)
 * 表为 "同境界普通蛊师" 基准值
 */
export function getStandardEnemyStats(realmGrand: number): { hp: number; attack: number; defense: number } {
  const r = realmGrand;
  return {
    hp: 60 + r * 30,          // 一转90, 二转120, 三转150... 八转300
    attack: 12 + r * 8,       // 一转20, 二转28, 三转36... 八转76
    defense: 4 + r * 3,       // 一转7, 二转10, 三转13... 八转28
  };
}

/**
 * 特殊角色倍率 (十绝体/族老等身份修正)
 * v0.7.0-pre审查新增：上古荒兽倍率（七转蛊仙级肉身+荒兽天性狂暴）
 */
export const SPECIAL_ENEMY_MULTIPLIERS: Record<string, { hp: number; atk: number; def: number }> = {
  '普通':     { hp: 1.0, atk: 1.0, def: 1.0 },
  '精英':     { hp: 1.3, atk: 1.2, def: 1.2 },
  '族老':     { hp: 1.5, atk: 1.3, def: 1.4 },
  '十绝体':   { hp: 2.0, atk: 2.0, def: 1.5 },  // 白凝冰级
  '蛊仙':     { hp: 3.0, atk: 2.5, def: 2.0 },
  '上古荒兽': { hp: 3.5, atk: 3.0, def: 2.5 },  // 黑狱龙级——七转蛊仙级体魄+荒兽肉身强化
  '传奇':     { hp: 5.0, atk: 4.0, def: 3.0 },  // 方源级
};
