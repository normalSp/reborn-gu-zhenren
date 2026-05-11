import type { CombatEncounterScale } from '../types';

export type CombatRouteSource = 'explicit' | 'signals' | 'counts' | 'default';

export interface CombatRoutePolicyInput {
  scale?: unknown;
  encounterScale?: unknown;
  type?: unknown;
  title?: unknown;
  summary?: unknown;
  tags?: unknown;
  enemyCount?: unknown;
  allyCount?: unknown;
  neutralCount?: unknown;
  objectiveTags?: unknown;
}

export interface CombatRoutePolicyResolution {
  scale: CombatEncounterScale;
  source: CombatRouteSource;
  reason: string;
  matchedSignals: string[];
  warnings: string[];
}

const EXPLICIT_SCALE_ALIASES: Record<string, CombatEncounterScale> = {
  duel: 'duel',
  '1v1': 'duel',
  one_vs_one: 'duel',
  single: 'duel',
  battlefield_5x3: 'battlefield_5x3',
  skirmish: 'battlefield_5x3',
  small_battlefield: 'battlefield_5x3',
  group_5x3: 'group_5x3',
  group: 'group_5x3',
  squad: 'group_5x3',
  battle: 'group_5x3',
  group_7x5: 'group_7x5',
  large: 'group_7x5',
  large_group: 'group_7x5',
  ambush_7x5: 'group_7x5',
  war: 'group_7x5',
};

const SIGNAL_RULES: Array<{
  scale: CombatEncounterScale;
  reason: string;
  signals: string[];
}> = [
  {
    scale: 'group_7x5',
    reason: '伏击、兽群、狩猎、灾劫、传承守护或第三方介入需要 7x5 群像战场。',
    signals: [
      'ambush',
      '伏击',
      'beast_pack',
      '兽群',
      'hunt',
      '狩猎',
      'desolate_beast',
      '荒兽',
      'calamity',
      '灾劫',
      'inheritance_guardian',
      '传承守护',
      'third_party',
      '第三方',
      'escort',
      '护送',
      'large',
    ],
  },
  {
    scale: 'group_5x3',
    reason: '小队、援护、士气或保护目标进入 5x3 群像战。',
    signals: ['squad', '小队', 'group', '群像', 'guard', '援护', 'morale', '士气', 'protect', '保护'],
  },
  {
    scale: 'duel',
    reason: '单名敌人、切磋、复仇、擂台或单体野兽进入 1v1 battlefield。',
    signals: ['duel', '1v1', 'one_vs_one', 'single_enemy', 'single_beast', 'spar', '切磋', 'revenge', '复仇', 'arena', '擂台'],
  },
];

function toToken(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function flattenSignals(input: CombatRoutePolicyInput): string[] {
  const values: unknown[] = [input.type, input.title, input.summary];
  if (Array.isArray(input.tags)) values.push(...input.tags);
  if (Array.isArray(input.objectiveTags)) values.push(...input.objectiveTags);
  return values
    .map(toToken)
    .filter(Boolean);
}

function resolveExplicitScale(input: CombatRoutePolicyInput): CombatEncounterScale | null {
  const explicit = toToken(input.scale || input.encounterScale);
  return EXPLICIT_SCALE_ALIASES[explicit] || null;
}

export function resolveCombatRoutePolicy(input: CombatRoutePolicyInput): CombatRoutePolicyResolution {
  const explicitRaw = toToken(input.scale || input.encounterScale);
  const explicit = resolveExplicitScale(input);
  if (explicit) {
    return {
      scale: explicit,
      source: 'explicit',
      reason: `候选显式声明规模 ${explicitRaw}，本地路由为 ${explicit}。`,
      matchedSignals: [explicitRaw],
      warnings: explicit === 'duel'
        ? ['duel 表示 1v1 battlefield 路由，不进入旧 duelState 默认入口。']
        : [],
    };
  }

  const warnings: string[] = [];
  if (explicitRaw) warnings.push(`未知战斗规模 ${explicitRaw} 已交由本地 route policy 重新判定。`);

  const signals = flattenSignals(input);
  for (const rule of SIGNAL_RULES) {
    const matched = signals.filter(signal => rule.signals.some(ruleSignal => signal.includes(ruleSignal)));
    if (matched.length > 0) {
      return {
        scale: rule.scale,
        source: 'signals',
        reason: rule.reason,
        matchedSignals: matched,
        warnings,
      };
    }
  }

  const enemyCount = toNumber(input.enemyCount);
  const allyCount = toNumber(input.allyCount);
  const neutralCount = toNumber(input.neutralCount);
  if (enemyCount >= 4 || neutralCount > 0) {
    return {
      scale: 'group_7x5',
      source: 'counts',
      reason: '敌人数量较多或存在中立/第三方单位，进入 7x5 群像战。',
      matchedSignals: [`enemyCount=${enemyCount}`, `neutralCount=${neutralCount}`],
      warnings,
    };
  }
  if (allyCount >= 2) {
    return {
      scale: 'group_5x3',
      source: 'counts',
      reason: '我方有多个行动单位，进入 5x3 群像战。',
      matchedSignals: [`allyCount=${allyCount}`],
      warnings,
    };
  }
  if (enemyCount === 1) {
    return {
      scale: 'duel',
      source: 'counts',
      reason: '单名敌人进入 1v1 battlefield。',
      matchedSignals: [`enemyCount=${enemyCount}`],
      warnings: [...warnings, 'duel 表示 1v1 battlefield 路由，不进入旧 duelState 默认入口。'],
    };
  }

  return {
    scale: 'battlefield_5x3',
    source: 'default',
    reason: '缺少更强规模信号，默认进入 5x3 凡战棋盘。',
    matchedSignals: [],
    warnings: warnings.length > 0 ? warnings : ['候选未声明明确规模，本地默认使用 5x3 battlefield。'],
  };
}

export function normalizeCombatRouteScale(input: unknown): CombatEncounterScale {
  return resolveCombatRoutePolicy({ scale: input }).scale;
}
