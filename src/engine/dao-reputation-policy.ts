import type { FactionStanding } from '../types';

export type DaoHeartAxis = 'kill' | 'mercy' | 'scheme' | 'ambition';

export type NarrativeEventKind =
  | 'kill'
  | 'rescue'
  | 'betray'
  | 'trade'
  | 'deceive'
  | 'keep_promise'
  | 'sacrifice'
  | 'loot'
  | 'protect'
  | 'extort';

export interface DaoHeartEventPolicy {
  kind: NarrativeEventKind;
  daoHeartDelta: Partial<Record<DaoHeartAxis, number>>;
  defaultReason: string;
  narrativeBias: string;
}

export interface ReputationEventPolicy {
  kind: NarrativeEventKind;
  righteousDelta: number;
  demonicDelta: number;
  merchantDelta: number;
  defaultReason: string;
}

const daoPolicies: Record<NarrativeEventKind, DaoHeartEventPolicy> = {
  kill: {
    kind: 'kill',
    daoHeartDelta: { kill: 2, ambition: 1 },
    defaultReason: '杀戮立威',
    narrativeBias: '更容易出现直接冲突、追杀和威慑选项。',
  },
  rescue: {
    kind: 'rescue',
    daoHeartDelta: { mercy: 2 },
    defaultReason: '救人结善缘',
    narrativeBias: '更容易出现救援、保护和以德换利的选项。',
  },
  betray: {
    kind: 'betray',
    daoHeartDelta: { scheme: 2, ambition: 1 },
    defaultReason: '背约夺利',
    narrativeBias: '更容易出现反制、猜忌和连锁报复。',
  },
  trade: {
    kind: 'trade',
    daoHeartDelta: { scheme: 1 },
    defaultReason: '交易往来',
    narrativeBias: '更容易出现情报、议价和资源交换。',
  },
  deceive: {
    kind: 'deceive',
    daoHeartDelta: { scheme: 2 },
    defaultReason: '欺瞒设局',
    narrativeBias: '更容易出现伪装、反侦察和信任崩塌。',
  },
  keep_promise: {
    kind: 'keep_promise',
    daoHeartDelta: { mercy: 1, scheme: 1 },
    defaultReason: '守诺取信',
    narrativeBias: '更容易出现合作、担保和长期关系。',
  },
  sacrifice: {
    kind: 'sacrifice',
    daoHeartDelta: { mercy: 2, ambition: 1 },
    defaultReason: '舍身担险',
    narrativeBias: '更容易出现牺牲代价和声望回响。',
  },
  loot: {
    kind: 'loot',
    daoHeartDelta: { kill: 1, ambition: 2 },
    defaultReason: '夺宝取利',
    narrativeBias: '更容易出现追索、埋伏和资源争夺。',
  },
  protect: {
    kind: 'protect',
    daoHeartDelta: { mercy: 1, ambition: 1 },
    defaultReason: '护持一方',
    narrativeBias: '更容易出现庇护、托付和势力关注。',
  },
  extort: {
    kind: 'extort',
    daoHeartDelta: { kill: 1, scheme: 1, ambition: 1 },
    defaultReason: '勒索压迫',
    narrativeBias: '更容易出现仇怨、黑市和正道追责。',
  },
};

const reputationPolicies: Record<NarrativeEventKind, ReputationEventPolicy> = {
  kill: { kind: 'kill', righteousDelta: -12, demonicDelta: 5, merchantDelta: -6, defaultReason: '杀戮传闻扩散' },
  rescue: { kind: 'rescue', righteousDelta: 10, demonicDelta: -2, merchantDelta: 4, defaultReason: '救援提升名望' },
  betray: { kind: 'betray', righteousDelta: -18, demonicDelta: 3, merchantDelta: -15, defaultReason: '背约损害信誉' },
  trade: { kind: 'trade', righteousDelta: 2, demonicDelta: 1, merchantDelta: 8, defaultReason: '稳定交易记录' },
  deceive: { kind: 'deceive', righteousDelta: -8, demonicDelta: 4, merchantDelta: -8, defaultReason: '欺瞒引发戒备' },
  keep_promise: { kind: 'keep_promise', righteousDelta: 8, demonicDelta: 0, merchantDelta: 10, defaultReason: '守诺积累信誉' },
  sacrifice: { kind: 'sacrifice', righteousDelta: 12, demonicDelta: -3, merchantDelta: 5, defaultReason: '舍身赢得敬重' },
  loot: { kind: 'loot', righteousDelta: -10, demonicDelta: 6, merchantDelta: -4, defaultReason: '夺宝引发争议' },
  protect: { kind: 'protect', righteousDelta: 8, demonicDelta: -2, merchantDelta: 5, defaultReason: '护持带来声望' },
  extort: { kind: 'extort', righteousDelta: -14, demonicDelta: 5, merchantDelta: -10, defaultReason: '勒索损害名声' },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getDaoHeartEventPolicy(kind: NarrativeEventKind): DaoHeartEventPolicy {
  return daoPolicies[kind];
}

export function getReputationEventPolicy(kind: NarrativeEventKind): ReputationEventPolicy {
  return reputationPolicies[kind];
}

export function applyDaoHeartEvent<T extends Record<DaoHeartAxis, number>>(
  daoHeart: T,
  policy: DaoHeartEventPolicy,
): T {
  return {
    ...daoHeart,
    kill: clamp((daoHeart.kill || 0) + (policy.daoHeartDelta.kill || 0), 0, 20),
    mercy: clamp((daoHeart.mercy || 0) + (policy.daoHeartDelta.mercy || 0), 0, 20),
    scheme: clamp((daoHeart.scheme || 0) + (policy.daoHeartDelta.scheme || 0), 0, 20),
    ambition: clamp((daoHeart.ambition || 0) + (policy.daoHeartDelta.ambition || 0), 0, 20),
  };
}

export function calculateReputationTier(standing: number): FactionStanding['reputation_tier'] {
  if (standing <= -80) return '死敌';
  if (standing <= -40) return '敌对';
  if (standing <= -10) return '冷淡';
  if (standing < 10) return '中立';
  if (standing < 40) return '友善';
  if (standing < 80) return '尊敬';
  return '崇拜';
}

export function describeReputationEffects(standing: number): { benefits: string[]; risks: string[] } {
  if (standing >= 80) {
    return {
      benefits: ['核心情报', '高阶招募信任', '商会折扣'],
      risks: ['敌对势力重点关注'],
    };
  }
  if (standing >= 40) {
    return {
      benefits: ['情报门槛降低', '交易小幅折扣', '委托奖励提升'],
      risks: ['卷入势力纷争概率提高'],
    };
  }
  if (standing >= 10) {
    return {
      benefits: ['普通交易许可', '低阶委托可接'],
      risks: [],
    };
  }
  if (standing > -10) {
    return {
      benefits: [],
      risks: ['传闻可信度需核验'],
    };
  }
  if (standing > -40) {
    return {
      benefits: ['黑市接触概率微升'],
      risks: ['正道商会加价', '招募信任下降'],
    };
  }
  if (standing > -80) {
    return {
      benefits: ['敌对暗线可能接触'],
      risks: ['拒绝交易', '追踪盘查', '悬赏风险'],
    };
  }
  return {
    benefits: ['魔道敌对网络可能利用你'],
    risks: ['公开追杀', '商会封禁', '重要 NPC 初始敌意'],
  };
}

export function describeDaoHeartNarrativeBias(daoHeart: Record<DaoHeartAxis, number>): string[] {
  const lines: string[] = [];
  if (daoHeart.kill >= 5) lines.push('杀性偏高：剧情应提高威慑、杀戮、追杀和反噬权重。');
  if (daoHeart.mercy >= 5) lines.push('仁心偏高：剧情应提供救援、庇护、牺牲和善缘回报。');
  if (daoHeart.scheme >= 5) lines.push('谋略偏高：剧情应提供布局、伪装、谈判和反制选项。');
  if (daoHeart.ambition >= 5) lines.push('野心偏高：剧情应提供夺权、扩张、结盟和权势代价。');
  return lines;
}
