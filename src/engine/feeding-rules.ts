import type { GuHungerConfig } from '../types';

export type FeedingFallbackPolicy =
  | 'no_feeding_needed'
  | 'low_mid_generic_allowed'
  | 'rank4_5_specific_with_emergency_generic'
  | 'immortal_specific_required'
  | 'non_material_rule'
  | 'unresolved';

export interface NonMaterialFeedingRule {
  id: string;
  requirement: string;
  sourceTags: Array<'event_whitelist' | 'training_ground' | 'aperture_resource' | 'faction' | 'special_rule'>;
  description: string;
}

export interface FeedingCreditRequirement {
  key: string;
  amount: number;
  ruleId: string;
  description: string;
}

export const GU_HUNGER_CONFIG: GuHungerConfig = {
  hungerPerTurn: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
  thresholds: {
    optimalToHungry: 5,
    hungryToInjured: 12,
    injuredToDead: 25,
  },
  feedRecovery: 10,
};

export const FEED_MATERIAL_MAP: Record<string, string | string[]> = {
  '月光': '月华草',
  '美酒': '美酒',
  '九种不同的美酒': '美酒',
  '茶水': '山泉水',
  '五谷': '普通蛊材',
  '石粉': '石粉',
  '古老岩石粉末': '石粉',
  '岩石碎片': '石粉',
  '骨粉': '兽骨',
  '骨骼粉末': '兽骨',
  '骨骼碎片': '兽骨',
  '活体骨骼': '兽骨',
  '蚕丝': '蚕丝卷',
  '生肉': '新鲜兽肉',
  '鲜肉': '新鲜兽肉',
  '肉食': '新鲜兽肉',
  '熊类兽肉': '新鲜兽肉',
  '鲜血': '新鲜血液瓶',
  '血液': '新鲜血液瓶',
  '兽血': '新鲜血液瓶',
  '狼血': '新鲜血液瓶',
  '血食': '新鲜血液瓶',
  '草木': '草木精华液',
  '草木精华': '草木精华液',
  '药材': '愈合草药包',
  '解毒草药': '愈合草药包',
  '文字': ['空白书页', '古籍残页'],
  '新知识': ['空白书页', '古籍残页'],
  '晨露': '晨露收集瓶',
  '纯水': '山泉水',
  '纯净水源': '山泉水',
  '干净水源': '山泉水',
  '灵泉之水': '山泉水',
  '火焰': ['火石粉', '灯油', '特制木炭'],
  '火药': '火石粉',
  '松木灰烬': '特制木炭',
  '岩浆': '火石粉',
  '寒冰': '冰晶核心',
  '冰晶': '冰晶核心',
  '雷电精华': '雷击石',
  '雷电余威': '雷击石',
  '雷击木碎片': '雷击石',
  '春雷余威': '雷击石',
  '风': '风之精华',
  '狂风': '风之精华',
  '秋风之气': '风之精华',
  '阴影': '暗影精华',
  '毒物': '毒物样本',
  '毒素样本': '毒物样本',
  '金粉': '金粉',
  '金属': ['铁屑', '金属块'],
  '废旧金属': ['铁屑', '金属块'],
  '金属矿石': ['铁屑', '金属块'],
  '铜矿石': ['铁屑', '金属块'],
  '铁屑': '铁屑',
  '玉石': '碎玉片',
  '金丝线': '金丝线',
  '游魂碎片': '魂魄碎片容器',
  '灵魂碎片': '魂魄碎片容器',
  '魂魄碎片': '魂魄碎片容器',
  '声波': '嘈杂晶',
  '细微声音': '嘈杂晶',
  '宏大声响': '嘈杂晶',
  '新鲜昆虫尸体': ['小型蛊虫尸体', '残破蛊虫'],
  '小型蛊虫尸体': ['小型蛊虫尸体', '残破蛊虫'],
  '动物油脂': '灯油',
  '剑意残片': '剑道蛊材',
  '天牛甲壳': '力道蛊材',
  '人皮': '变化道蛊材',
  '腐殖土': '沃土',
};

export const NON_MATERIAL_FEEDING_RULES: Record<string, NonMaterialFeedingRule> = {
  '不需喂养': {
    id: 'none',
    requirement: '不需喂养',
    sourceTags: ['special_rule'],
    description: '该蛊不走食料库存。',
  },
  '仙元': {
    id: 'immortal_essence_use',
    requirement: '仙元',
    sourceTags: ['aperture_resource', 'special_rule'],
    description: '由仙窍仙元与实际使用行为承担，不是仙元石货币。',
  },
  '元石': {
    id: 'primeval_stone_use',
    requirement: '元石',
    sourceTags: ['event_whitelist', 'special_rule'],
    description: '仅限明确设计为元石消耗的低阶蛊，不作为默认喂养兜底。',
  },
  '善行': { id: 'virtue_event', requirement: '善行', sourceTags: ['event_whitelist'], description: '由剧情/事件行为满足。' },
  '真诚': { id: 'sincerity_event', requirement: '真诚', sourceTags: ['event_whitelist'], description: '由剧情/社交行为满足。' },
  '虚情假意': { id: 'deception_event', requirement: '虚情假意', sourceTags: ['event_whitelist'], description: '由剧情/欺瞒行为满足。' },
  '战斗': { id: 'combat_event', requirement: '战斗', sourceTags: ['training_ground', 'event_whitelist'], description: '由战斗或训练场行为满足。' },
  '战意': { id: 'battle_will_event', requirement: '战意', sourceTags: ['training_ground', 'event_whitelist'], description: '由战斗、训练与战意事件满足。' },
  '成就': { id: 'achievement_event', requirement: '成就', sourceTags: ['event_whitelist'], description: '由成就或阶段目标满足。' },
  '恐惧': { id: 'fear_event', requirement: '恐惧', sourceTags: ['event_whitelist'], description: '由高压剧情或遭遇满足。' },
  '苦痛': { id: 'pain_event', requirement: '苦痛', sourceTags: ['event_whitelist'], description: '由受伤、灾厄或试炼满足。' },
  '情感碎片': { id: 'emotion_event', requirement: '情感碎片', sourceTags: ['event_whitelist'], description: '由情绪类剧情满足。' },
  '情绪碎片': { id: 'emotion_event', requirement: '情绪碎片', sourceTags: ['event_whitelist'], description: '由情绪类剧情满足。' },
  '意志力': { id: 'willpower_event', requirement: '意志力', sourceTags: ['event_whitelist', 'training_ground'], description: '由坚持、逆境或训练满足。' },
  '认主意志碎片': { id: 'ownership_will_event', requirement: '认主意志碎片', sourceTags: ['event_whitelist'], description: '由认主、炼化或驯服事件满足。' },
  '新环境信息': { id: 'new_environment_event', requirement: '新环境信息', sourceTags: ['event_whitelist'], description: '由探索新区域满足。' },
  '时间': { id: 'time_passage', requirement: '时间', sourceTags: ['special_rule'], description: '随回合推进满足，不入材料库存。' },
  '时间流逝': { id: 'time_passage', requirement: '时间流逝', sourceTags: ['special_rule'], description: '随回合推进满足，不入材料库存。' },
  '灾劫': { id: 'calamity_event', requirement: '灾劫', sourceTags: ['event_whitelist', 'aperture_resource'], description: '由灾劫或仙窍高压事件满足。' },
  '濒死体验': { id: 'near_death_event', requirement: '濒死体验', sourceTags: ['event_whitelist'], description: '由濒死或重伤事件满足。' },
  '气势': { id: 'momentum_event', requirement: '气势', sourceTags: ['training_ground', 'event_whitelist'], description: '由战斗或威压事件满足。' },
  '气运': { id: 'luck_event', requirement: '气运', sourceTags: ['event_whitelist', 'special_rule'], description: '由气运操作或观运事件满足。' },
  '气运碎片': { id: 'luck_event', requirement: '气运碎片', sourceTags: ['event_whitelist', 'special_rule'], description: '由气运操作余波满足。' },
  '天道': { id: 'heaven_path_event', requirement: '天道', sourceTags: ['event_whitelist'], description: '由天意/天道事件满足。' },
  '天机碎片': { id: 'heaven_secret_event', requirement: '天机碎片', sourceTags: ['event_whitelist'], description: '由天机感知事件满足。' },
  '奴道': { id: 'enslavement_event', requirement: '奴道', sourceTags: ['event_whitelist', 'faction'], description: '由奴道操控或势力事件满足。' },
  '毒道': { id: 'poison_event', requirement: '毒道', sourceTags: ['training_ground', 'event_whitelist'], description: '由毒道试炼或事件满足。' },
  '血道': { id: 'blood_event', requirement: '血道', sourceTags: ['event_whitelist'], description: '由血道剧情或战斗事件满足。' },
  '水利': { id: 'water_system_event', requirement: '水利', sourceTags: ['event_whitelist', 'aperture_resource'], description: '由水源/水利资源点满足。' },
  '魂力碎片': { id: 'soul_power_event', requirement: '魂力碎片', sourceTags: ['event_whitelist', 'training_ground'], description: '由魂道净化或搜魂事件满足。' },
  '因果碎片': { id: 'karma_event', requirement: '因果碎片', sourceTags: ['event_whitelist'], description: '由因果类剧情事件满足。' },
  '逆流之水': { id: 'reverse_flow_water', requirement: '逆流之水', sourceTags: ['event_whitelist', 'special_rule'], description: '属于强剧情资源，未登记为普通材料。' },
  '地脉之气': { id: 'earth_vein_event', requirement: '地脉之气', sourceTags: ['event_whitelist', 'aperture_resource'], description: '由地脉节点、大地震或土道资源事件满足。' },
};

export function normalizeFeedCandidates(requiredType?: string): string[] {
  if (!requiredType || requiredType === '不需喂养') return [];
  const raw = FEED_MATERIAL_MAP[requiredType];
  const mapped = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  if (mapped.length > 0) return mapped;
  if (requiredType.endsWith('道蛊材')) return [requiredType];
  if (requiredType.endsWith('道')) return [`${requiredType}蛊材`, `${requiredType}普通蛊材`];
  if (requiredType.endsWith('系蛊材')) return [requiredType.replace('系蛊材', '道蛊材')];
  if (requiredType.endsWith('蛊材')) return [requiredType];
  return [];
}

export function getNonMaterialFeedingRule(requiredType?: string): NonMaterialFeedingRule | undefined {
  if (!requiredType) return NON_MATERIAL_FEEDING_RULES['不需喂养'];
  return NON_MATERIAL_FEEDING_RULES[requiredType];
}

export function isNonMaterialFeeding(requiredType?: string): boolean {
  return !!getNonMaterialFeedingRule(requiredType);
}

export function getFeedingCreditRequirement(requiredType?: string): FeedingCreditRequirement | undefined {
  const rule = getNonMaterialFeedingRule(requiredType);
  if (!rule || rule.id === 'none') return undefined;
  if (rule.sourceTags.includes('special_rule')) return undefined;
  if (rule.sourceTags.includes('aperture_resource') || rule.sourceTags.includes('training_ground') || rule.sourceTags.includes('faction')) return undefined;
  if (!rule.sourceTags.includes('event_whitelist')) return undefined;
  return {
    key: rule.requirement,
    amount: 1,
    ruleId: rule.id,
    description: rule.description,
  };
}

export function getFeedingFallbackPolicy(rank: number, requiredType?: string): FeedingFallbackPolicy {
  if (!requiredType || requiredType === '不需喂养') return 'no_feeding_needed';
  if (isNonMaterialFeeding(requiredType)) return 'non_material_rule';
  if (rank >= 6) return 'immortal_specific_required';
  if (rank >= 4) return 'rank4_5_specific_with_emergency_generic';
  return 'low_mid_generic_allowed';
}

export function estimateSafeTurnsUntilDead(rank: number, currentCounter = 0): number {
  const perTurn = GU_HUNGER_CONFIG.hungerPerTurn[rank] || rank || 1;
  const remaining = GU_HUNGER_CONFIG.thresholds.injuredToDead - currentCounter;
  return Math.max(0, Math.ceil(remaining / perTurn));
}

export function isAcceptedFoodForRequirement(requiredType: string | undefined, foodType?: string): boolean {
  if (!foodType) return true;
  const candidates = normalizeFeedCandidates(requiredType);
  return foodType === requiredType || candidates.includes(foodType);
}
