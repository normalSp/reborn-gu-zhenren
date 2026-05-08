export type AttributeKey = '资质' | '体魄' | '心智' | '气运';

export type AttributeMutationSource =
  | 'blood_skull_gu'
  | 'strength_path_gu'
  | 'wisdom_path_gu'
  | 'luck_path_gu'
  | 'dream_realm'
  | 'calamity'
  | 'inheritance'
  | 'engine_whitelist';

export interface AttributeMutationPolicy {
  source: AttributeMutationSource;
  attribute: AttributeKey;
  maxDelta: number;
  minRealm: number;
  targetScope: 'self' | 'known_npc' | 'squad_member' | 'boss' | 'any_known_character';
  rarity: 'common' | 'rare' | 'very_rare' | 'forbidden';
  costTags: string[];
  requiresSceneValidation: boolean;
  visibleWithoutDetection: boolean;
  notes: string;
}

const policies: Record<AttributeMutationSource, AttributeMutationPolicy> = {
  blood_skull_gu: {
    source: 'blood_skull_gu',
    attribute: '资质',
    maxDelta: 2,
    minRealm: 1,
    targetScope: 'self',
    rarity: 'forbidden',
    costTags: ['kin_sacrifice', 'righteous_reputation_crash', 'dao_heart_kill'],
    requiresSceneValidation: true,
    visibleWithoutDetection: true,
    notes: '血颅蛊类资质提升必须绑定同族杀戮和重大后果，不能作为普通成长按钮。',
  },
  strength_path_gu: {
    source: 'strength_path_gu',
    attribute: '体魄',
    maxDelta: 1,
    minRealm: 1,
    targetScope: 'self',
    rarity: 'rare',
    costTags: ['essence', 'health_backlash', 'temporary_first'],
    requiresSceneValidation: false,
    visibleWithoutDetection: true,
    notes: '力道蛊优先做临时体魄增幅，永久增长必须稀有且有反噬。',
  },
  wisdom_path_gu: {
    source: 'wisdom_path_gu',
    attribute: '心智',
    maxDelta: 1,
    minRealm: 2,
    targetScope: 'self',
    rarity: 'very_rare',
    costTags: ['mental_backlash', 'information_cost'],
    requiresSceneValidation: true,
    visibleWithoutDetection: true,
    notes: '智道增益影响识破、推演和 DeepSeek 分支，不能频繁叠加。',
  },
  luck_path_gu: {
    source: 'luck_path_gu',
    attribute: '气运',
    maxDelta: 3,
    minRealm: 1,
    targetScope: 'any_known_character',
    rarity: 'very_rare',
    costTags: ['luck_counterweight', 'hidden_without_observation'],
    requiresSceneValidation: true,
    visibleWithoutDetection: false,
    notes: '运道可影响自己、队友、NPC、boss；无察运类手段时只给模糊反馈。',
  },
  dream_realm: {
    source: 'dream_realm',
    attribute: '心智',
    maxDelta: 1,
    minRealm: 3,
    targetScope: 'self',
    rarity: 'very_rare',
    costTags: ['dream_risk', 'soul_damage'],
    requiresSceneValidation: true,
    visibleWithoutDetection: true,
    notes: '梦境提升伴随失败损伤，适合中后期稀有成长。',
  },
  calamity: {
    source: 'calamity',
    attribute: '体魄',
    maxDelta: 1,
    minRealm: 6,
    targetScope: 'self',
    rarity: 'rare',
    costTags: ['calamity_survival', 'resource_loss'],
    requiresSceneValidation: true,
    visibleWithoutDetection: true,
    notes: '灾劫后的体魄/道痕变化只在蛊仙期稳定出现。',
  },
  inheritance: {
    source: 'inheritance',
    attribute: '心智',
    maxDelta: 1,
    minRealm: 1,
    targetScope: 'self',
    rarity: 'rare',
    costTags: ['quest_lock', 'choice_cost'],
    requiresSceneValidation: true,
    visibleWithoutDetection: true,
    notes: '传承可作为四维变化白名单，但必须有剧情锁和选择代价。',
  },
  engine_whitelist: {
    source: 'engine_whitelist',
    attribute: '资质',
    maxDelta: 1,
    minRealm: 1,
    targetScope: 'any_known_character',
    rarity: 'very_rare',
    costTags: ['manual_review'],
    requiresSceneValidation: true,
    visibleWithoutDetection: true,
    notes: '仅用于已审核的特殊剧情、二创蛊或后续小队系统。',
  },
};

export interface AttributeMutationContext {
  realmGrand: number;
  targetScope: AttributeMutationPolicy['targetScope'];
  sceneValidated?: boolean;
}

export function getAttributeMutationPolicy(source: AttributeMutationSource): AttributeMutationPolicy {
  return policies[source];
}

export function getAttributeMutationPolicies(): AttributeMutationPolicy[] {
  return Object.values(policies);
}

export function canApplyAttributeMutation(
  policy: AttributeMutationPolicy,
  context: AttributeMutationContext,
): { ok: boolean; reason?: string } {
  if (context.realmGrand < policy.minRealm) {
    return { ok: false, reason: `境界不足，至少需要 ${policy.minRealm} 转。` };
  }
  if (policy.requiresSceneValidation && !context.sceneValidated) {
    return { ok: false, reason: '需要剧情或引擎白名单场景校验。' };
  }
  if (policy.targetScope !== 'any_known_character' && policy.targetScope !== context.targetScope) {
    return { ok: false, reason: '目标类型不符合该四维变更规则。' };
  }
  return { ok: true };
}
