// ─── Layer 3 语义规则引擎 ───
// 对AI生成的 narrative.text 进行宽词簇语义评分
// 纯CPU计算，约5ms，不阻断游戏流程

export interface SemanticRule {
  id: string;
  name: string;
  description: string;
  positiveWords: string[];
  negativeWords: string[];
  minPositiveHits: number;
  maxNegativeHits: number;
  weight: number;
  level: 'critical' | 'warning' | 'notice';
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  score: number;
  weight: number;
  positiveHits: number;
  negativeHits: number;
  level: 'critical' | 'warning' | 'notice';
  details: string;
}

export interface SemanticValidationResult {
  passed: boolean;
  overallScore: number; // 0-100
  results: RuleResult[];
  failedRules: RuleResult[];
  warningRules: RuleResult[];
  recommendation: 'accept' | 'warn_only' | 'reject';
}

// ─── R01-R07 七条语义规则 ───
const SEMANTIC_RULES: SemanticRule[] = [
  // R01: 越级反杀检测
  {
    id: 'R01',
    name: '境界压制检测',
    description: '检测是否存在低境界战胜高境界的描写',
    positiveWords: [], // 无正向词
    negativeWords: [
      '越级', '反杀', '击败了高', '碾压', '同级无敌',
      '轻松战胜', '打倒了', '秒杀', '摧毁了防御', '突破境界压制',
      '无视境界', '跨越境界', '逆天', '以弱胜强',
    ],
    minPositiveHits: 0,
    maxNegativeHits: 1, // 4D.11: 允许1个模糊词，L4金丝雀做精准兜底
    weight: 2.0,
    level: 'critical',
  },

  // R02: NPC人设崩坏检测
  {
    id: 'R02',
    name: 'NPC人设检测',
    description: '检测NPC是否被描写为无条件友善或降智',
    positiveWords: [], // 无正向词
    negativeWords: [
      '露出了微笑', '拍了拍你的肩膀', '欣赏你的', '信任你',
      '送你', '免费赠送', '无条件', '全力栽培', '资源管够',
      '帮助了你', '看好你', '交个朋友', '全力支持',
    ],
    minPositiveHits: 0,
    maxNegativeHits: 1, // 最多允许1个模糊描述
    weight: 1.8,
    level: 'critical',
  },

  // R03: 免费午餐检测
  {
    id: 'R03',
    name: '机缘代价检测',
    description: '检测机缘是否附带了对等代价和风险',
    positiveWords: [
      '代价', '风险', '但是', '然而', '换取', '条件',
      '如果失败', '可能', '反噬', '付出', '承担',
    ],
    negativeWords: [
      '轻松获得', '意外发现', '从天而降', '天大的机缘',
      '满地都是', '随意拾取', '免费', '白捡',
    ],
    minPositiveHits: 0, // 4D.11: 不强求每段有代价词
    maxNegativeHits: 0,
    weight: 1.0, // 4D.11: 降权减少误报
    level: 'warning',
  },

  // R04: 叙事基调检测
  {
    id: 'R04',
    name: '叙事基调检测',
    description: '检测叙事基调是否为黑暗现实（非爽文/热血）',
    positiveWords: [
      '残酷', '黑暗', '犹豫', '恐惧', '绝望', '无力',
      '挣扎', '小心', '谨慎', '难', '冰冷', '压抑',
      '威胁', '危险', '阴影', '窘迫',
    ],
    negativeWords: [
      '热血沸腾', '充满希望', '前途无量', '光明大道',
      '庆幸', '欢呼', '欣喜', '美好未来', '轻松愉快',
      '一帆风顺', '大好前途', '大喜过望',
    ],
    minPositiveHits: 2, // 至少2个黑暗基调词
    maxNegativeHits: 1, // 4D.11: 允许1个边缘爽文词
    weight: 1.2,
    level: 'warning',
  },

  // R05: 境界差距描写检测
  {
    id: 'R05',
    name: '境界差距描写检测',
    description: '检测低阶遇到高阶时是否体现了绝望感',
    positiveWords: [
      '压', '不可力敌', '山岳', '不可逾越', '绝望',
      '天壤之别', '蝼蚁', '顺从', '威压', '仰望',
      '深不可测', '窒息',
    ],
    negativeWords: [
      '周旋', '反击', '造成伤害', '打平', '不分胜负',
      '有来有往', '对峙', '平等对话',
    ],
    minPositiveHits: 1, // 如果有境界差距描写，至少1个压迫词汇
    maxNegativeHits: 0,
    weight: 1.0,
    level: 'notice',
  },

  // R06: 方源/核心NPC威慑力检测
  {
    id: 'R06',
    name: '核心NPC威慑力检测',
    description: '检测方源等核心NPC是否保持了原著威慑力',
    positiveWords: ['算', '算计', '眼线', '手段', '灭口', '不信任'],
    negativeWords: ['信任', '友善', '尊重', '欣赏', '帮助'],
    minPositiveHits: 0,
    maxNegativeHits: 0,
    weight: 1.5,
    level: 'warning',
  },

  // R07: 选项风险提示完整性检测
  {
    id: 'R07',
    name: '选项风险提示检测',
    description: '检测narrative.text中是否对所有选项都暗示了风险',
    positiveWords: ['风险', '小心', '谨慎', '代价', '危险', '注意'],
    negativeWords: [],
    minPositiveHits: 1, // 叙事中至少提及1次风险相关词
    maxNegativeHits: 100,
    weight: 0.8,
    level: 'notice',
  },
];

// ─── 词簇评分算法 ───
function evaluateRule(text: string, rule: SemanticRule): RuleResult {
  const normalizedText = text.toLowerCase();

  let positiveHits = 0;
  let negativeHits = 0;

  for (const word of rule.positiveWords) {
    if (normalizedText.includes(word)) {
      positiveHits++;
    }
  }

  for (const word of rule.negativeWords) {
    if (normalizedText.includes(word)) {
      negativeHits++;
    }
  }

  const passed =
    positiveHits >= rule.minPositiveHits && negativeHits <= rule.maxNegativeHits;

  // 分数计算：满分100，根据命中情况扣分
  let score = 100;
  if (!passed) {
    const positiveDeficit = Math.max(0, rule.minPositiveHits - positiveHits);
    const negativeExcess = Math.max(0, negativeHits - rule.maxNegativeHits);
    score = Math.max(0, 100 - (positiveDeficit + negativeExcess) * 25 * rule.weight);
  }

  let details = '';
  if (!passed) {
    const parts: string[] = [];
    if (negativeHits > rule.maxNegativeHits) {
      const hitWords = rule.negativeWords.filter(w => normalizedText.includes(w));
      parts.push(`发现违规词: ${hitWords.join('、')}`);
    }
    if (positiveHits < rule.minPositiveHits) {
      parts.push(`合规词不足（${positiveHits}/${rule.minPositiveHits}）`);
    }
    details = parts.join('；');
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    passed,
    score,
    weight: rule.weight,
    positiveHits,
    negativeHits,
    level: rule.level,
    details,
  };
}

// ─── 主验证函数 ───
export function validateNarrativeSemantics(text: string): SemanticValidationResult {
  const results = SEMANTIC_RULES.map(rule => evaluateRule(text, rule));

  const failedResults = results.filter(r => !r.passed && r.level === 'critical');
  const warningResults = results.filter(
    r => !r.passed && (r.level === 'warning' || r.level === 'notice')
  );

  // 加权总分
  const weightedSum = results.reduce((sum, r) => sum + r.score * r.weight, 0);
  const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
  const overallScore = Math.round(weightedSum / totalWeight);

  // 判定推荐动作
  let recommendation: SemanticValidationResult['recommendation'] = 'accept';
  if (failedResults.length > 0) {
    recommendation = 'reject'; // critical规则不通过
  } else if (warningResults.length >= 3 || overallScore < 60) {
    recommendation = 'warn_only'; // 太多警告或分数过低
  } else if (warningResults.length > 0) {
    recommendation = 'warn_only'; // 有警告但可接受
  }

  return {
    passed: failedResults.length === 0,
    overallScore,
    results,
    failedRules: failedResults,
    warningRules: warningResults,
    recommendation,
  };
}
