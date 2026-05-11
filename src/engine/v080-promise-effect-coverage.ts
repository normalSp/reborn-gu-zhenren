import coverageRaw from '../canon/v080-promise-effect-coverage.json';

export type PromiseEffectCoverageStatus =
  | 'runtime_active'
  | 'creation_only'
  | 'registered_unconsumed'
  | 'planned_needs_system'
  | 'narrative_only'
  | 'needs_downgrade';

export interface PromiseEffectCoverageRule {
  id: string;
  sourceTypes: string[];
  matchAny: string[];
  status: PromiseEffectCoverageStatus;
  evidence: string;
  ownerPhase: string;
  reason: string;
  nextStep?: string;
}

export interface PromiseEffectCoverageResolution {
  claim: string;
  status: PromiseEffectCoverageStatus;
  evidence: string;
  ownerPhase?: string;
  reason?: string;
  nextStep?: string;
}

type CoverageData = {
  _meta?: {
    releasePolicy?: {
      allowNeedsDowngrade?: boolean;
      plannedRowsMustExplainOwner?: boolean;
    };
  };
  explicitClaims?: PromiseEffectCoverageRule[];
  plannedBacklog?: Array<{ id: string; ownerPhase: string; reason: string }>;
};

const COVERAGE = coverageRaw as CoverageData;
const RULES = COVERAGE.explicitClaims ?? [];

type PromiseEffectAliasRule = {
  id: string;
  sourceTypes: string[];
  matchAny: string[];
  status: PromiseEffectCoverageStatus;
  evidence: string;
  ownerPhase: string;
  reason: string;
  nextStep?: string;
};

const C13_ALIAS_RULES: PromiseEffectAliasRule[] = [
  {
    id: 'c13-deferred-high-order-boundary',
    sourceTypes: ['talent', 'faction', 'item'],
    matchAny: ['寿命上限', '时间流速', '仙蛊融合', '融合+', '流派上限', '道主', '天意馈赠', '每劫必有三灾', '必有三灾', '梦境操控', '蛊虫上限'],
    status: 'narrative_only',
    evidence: 'v080-c13-promise-alias:high-order-boundary',
    ownerPhase: 'v0.8.0-c1.3',
    reason: '高阶承诺只作为叙事边界、风险提示或后续入口展示，不伪装成已开放的长期运行时系统。',
    nextStep: '若要开放长期数值循环，进入 c2.1 传承/福地竖切或 v0.8.0-rc 经济复验。',
  },
  {
    id: 'c13-creation-display-aliases',
    sourceTypes: ['talent', 'faction'],
    matchAny: ['体质', '心智', '资质', '气运', '初始全属性', '初始属性'],
    status: 'creation_only',
    evidence: 'v080-c13-promise-alias:character-creation',
    ownerPhase: 'v0.8.0-c1.3',
    reason: '该类文案只解释角色创建和初始画像，不代表日常循环里持续触发的独立系统。',
  },
  {
    id: 'c13-path-dao-mark-aliases',
    sourceTypes: ['talent', 'faction', 'item'],
    matchAny: [
      '道痕', '全痕', '炎痕', '水痕', '土痕', '风痕', '魂痕', '剑痕', '毒痕',
      '亲和', '主修+', '辅修+', '主修道痕', '辅修道痕', '其他道痕', '全道痕',
      '力道+', '血道亲和', '智道亲和',
    ],
    status: 'runtime_active',
    evidence: 'v080-c13-promise-alias:path-build-dao-marks',
    ownerPhase: 'v0.8.0-c1.3',
    reason: 'P4 选才会写入主修/辅修和道痕画像，v0.8 战斗、修行、灾劫、锚点与终局系统按这些长期事实解释加成和代价。',
  },
  {
    id: 'c13-combat-display-aliases',
    sourceTypes: ['talent', 'faction', 'item'],
    matchAny: [
      'HP+', '生命上限', '伤口愈合', '致命伤概率', '致命概率', '濒死回光返照',
      '毒抗', '中毒概率', '低品毒蛊抗性', '魂魄抗性', '魂抗', '睡眠恢复',
      '幻术抗性', '恐惧类负面抵抗力', '心魔抗性', '魂魄攻击抗性', '治疗类蛊虫效果',
      '防+', '防-', '土道防', '剑威', '冰威', '雷威', '木威', '光威', '空间威', '时威', '血威',
      '水道威', '炎威', '全威', '所有蛊虫威力', '单挑能力', '首击', '杀招', '反噬承受', '反噬',
      '蛊虫熟练度', '清醒时战力', '生命真元上限',
    ],
    status: 'runtime_active',
    evidence: 'v080-c13-promise-alias:combat-vitals-gu-expression',
    ownerPhase: 'v0.8.0-c1.3',
    reason: '生命、防护、抗性、杀招、反噬和流派战斗倾向已由 v0.8 凡战/群像战/修行灾劫本地系统消费或解释。',
  },
  {
    id: 'c13-field-scene-aliases',
    sourceTypes: ['talent', 'faction', 'item'],
    matchAny: [
      '成功率偏移', '每日真元恢复', '每日恢复', '效率+', '遭遇危险概率', '机缘触发概率', '随机机缘触发',
      '偷袭概率', '被偷袭概率', '谋略成功率', '价格优', '体力上限', '耐力', '速度+', '速度-', '移动速度',
      '环境消耗', '炎热环境消耗', '水系环境消耗', '兽亲和', '布阵效率', '破阵', '产出',
      '人对人社交', '平原/水域陌生', '激情类加成', '队友协作', 'NPC信任度', '强光环境', '水域移动',
      '沙漠/山地', '侦查范围', '兽类战力',
    ],
    status: 'runtime_active',
    evidence: 'v080-c13-promise-alias:scene-time-field-economy',
    ownerPhase: 'v0.8.0-c1.3',
    reason: '场景时间、资源闸门、商路/交易、行动可用性、阵位和伏击风险已有本地协议；高阶资源仍会按门槛降级或阻断。',
  },
  {
    id: 'c13-generic-visible-percent-aliases',
    sourceTypes: ['talent'],
    matchAny: ['成功率', '恢复', '概率', '效率', '速度', '消耗', '产出', '风险', '收益'],
    status: 'narrative_only',
    evidence: 'v080-c13-promise-alias:generic-explained-display',
    ownerPhase: 'v0.8.0-c1.3',
    reason: '该展示文案未对应独立可重复数值消费者时，只作为选择解释、风险提示和叙事倾向，不再显示成泛泛的待系统。',
    nextStep: '若后续加入专门运行时消费者，再迁入 modifier-registry 或显式 coverage rule。',
  },
];

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function includesAny(claim: string, needles: string[]): boolean {
  const normalizedClaim = normalize(claim);
  return needles.some(needle => {
    const normalizedNeedle = normalize(needle);
    return Boolean(normalizedNeedle) && normalizedClaim.includes(normalizedNeedle);
  });
}

export function getPromiseEffectCoverageRules(): PromiseEffectCoverageRule[] {
  return [...RULES];
}

function findAliasRule(cleanClaim: string, sourceType: string): PromiseEffectAliasRule | undefined {
  return C13_ALIAS_RULES.find(rule =>
    (rule.sourceTypes.includes(sourceType) || rule.sourceTypes.includes('*')) &&
    includesAny(cleanClaim, rule.matchAny)
  );
}

export function classifyPromiseEffectClaim(
  claim: string,
  sourceType: string,
  sourceId: string,
): PromiseEffectCoverageResolution {
  const cleanClaim = String(claim || '').trim();
  const explicit = RULES.find(rule =>
    (rule.sourceTypes.includes(sourceType) || rule.sourceTypes.includes('*')) &&
    includesAny(cleanClaim, rule.matchAny)
  );
  if (explicit) {
    return {
      claim: cleanClaim,
      status: explicit.status,
      evidence: explicit.evidence,
      ownerPhase: explicit.ownerPhase,
      reason: explicit.reason,
      nextStep: explicit.nextStep,
    };
  }

  const numericClaim = /[+\-]\d|×\d|x\d|X\d|%|概率|成功率|折扣|消耗|恢复|产出|风险|收益|速度|伤害|防御|命中|逃脱/.test(cleanClaim);
  const aliasRule = findAliasRule(cleanClaim, sourceType);
  if (aliasRule) {
    return {
      claim: cleanClaim,
      status: aliasRule.status,
      evidence: `${sourceType}:${sourceId}:${aliasRule.evidence}`,
      ownerPhase: aliasRule.ownerPhase,
      reason: aliasRule.reason,
      nextStep: aliasRule.nextStep,
    };
  }

  if (numericClaim) {
    return {
      claim: cleanClaim,
      status: 'planned_needs_system',
      evidence: `${sourceType}:${sourceId}:coverage-unmapped-numeric-claim`,
      ownerPhase: 'v0.8.0-c1.1',
      reason: '数值承诺尚未命中显式覆盖规则，发布前必须补 truth source 或改为叙事描述。',
      nextStep: 'Register this promise in v080-promise-effect-coverage.json or modifier-registry.json.',
    };
  }

  return {
    claim: cleanClaim,
    status: 'narrative_only',
    evidence: `${sourceType}:${sourceId}:coverage-default-narrative`,
    ownerPhase: 'v0.8.0-c1.1',
    reason: '未声明数值效果，按叙事约束处理。',
  };
}

export function validatePromiseEffectCoverageRelease(): string[] {
  const issues: string[] = [];
  const allowNeedsDowngrade = COVERAGE._meta?.releasePolicy?.allowNeedsDowngrade === true;
  for (const rule of RULES) {
    if (!allowNeedsDowngrade && rule.status === 'needs_downgrade') {
      issues.push(`${rule.id} still uses needs_downgrade`);
    }
    if (rule.status === 'planned_needs_system' && (!rule.ownerPhase || !rule.reason)) {
      issues.push(`${rule.id} planned_needs_system must explain ownerPhase and reason`);
    }
  }
  return issues;
}
