import { calculateBreakthroughSuccessRate, calculateCultivationProgress } from './cultivation-breakthrough';
import { calculateImmortalStoneMeditation } from './essence-recovery';
import { resolveFieldAction, type FieldActionKind } from './field-action';
import { calculatePrimevalMeditation, type MeditationContext } from './primeval-meditation';

export type ActivityLocationContext = MeditationContext | 'wild';
export type ActivityActionKind = 'meditate' | 'cultivate' | 'breakthrough' | FieldActionKind;
export type ActivityActionStatus = 'ready' | 'blocked' | 'risky';

export interface ActivityActionCard {
  id: ActivityActionKind;
  title: string;
  subtitle: string;
  apCost: number;
  status: ActivityActionStatus;
  disabledReason?: string;
  successRate?: number;
  riskChance?: number;
  expectedGain?: string;
  costSummary?: string;
  modifierLabels: string[];
}

export interface ActivityPanelState {
  ap: number;
  maxAp: number;
  period: string;
  locationContext: ActivityLocationContext;
  isImmortal: boolean;
  essenceLabel: string;
  essenceCurrent: number;
  essenceMax: number;
  cultivationProgress: number;
  cards: ActivityActionCard[];
}

function pct(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function fieldTitle(kind: FieldActionKind): string {
  if (kind === 'scout') return '侦察周边';
  if (kind === 'gather') return '野外采集';
  if (kind === 'trap_check') return '排查陷阱';
  return '撤离准备';
}

function fieldSubtitle(kind: FieldActionKind): string {
  if (kind === 'scout') return '提前看清危险与线索';
  if (kind === 'gather') return '获取低转日常蛊材';
  if (kind === 'trap_check') return '减少暗手、伏击与机关风险';
  return '为下一次逃脱争取窗口';
}

function meditationContext(context: ActivityLocationContext): MeditationContext {
  return context === 'wild' ? 'field' : context;
}

export function buildActivityPanelState(store: any, locationContext: ActivityLocationContext = 'field'): ActivityPanelState {
  const realmGrand = Number(store?.profile?.realm?.grand || 1);
  const isImmortal = realmGrand >= 6 || store?.vitals?.essenceType === 'immortal';
  const vitals = store?.vitals || {};
  const essenceCurrent = Number(vitals.essence?.current || 0);
  const essenceMax = Math.max(1, Number(vitals.essence?.max || 1));
  const ap = Number(store?.gameTime?.ap ?? 0);
  const maxAp = Number(store?.gameTime?.max_ap ?? 3);
  const progress = Number(store?.cultivationState?.progress ?? store?.flags?.cultivationProgress ?? 0);
  const aptitude = Number(store?.attributes?.资质 ?? 5);
  const mind = Number(store?.attributes?.心智 ?? 5);
  const luck = Number(store?.attributes?.气运 ?? 5);
  const cards: ActivityActionCard[] = [];

  const meditation = isImmortal
    ? calculateImmortalStoneMeditation({
      essenceCurrent,
      essenceMax,
      availableStones: Number(store?.immortalCurrency || 0),
      requestedStones: 1,
    })
    : calculatePrimevalMeditation({
      realmGrand,
      essenceCurrent,
      essenceMax,
      availableStones: Number(store?.currency || 0),
      requestedStones: 1,
    });
  cards.push({
    id: 'meditate',
    title: isImmortal ? '仙元石调息' : '元石调息',
    subtitle: locationContext === 'safe' || locationContext === 'aperture' ? '安静吸收，风险较低' : '专注调息，可能被干扰',
    apCost: 1,
    status: ap <= 0 || !meditation.allowed ? 'blocked' : locationContext === 'safe' || locationContext === 'aperture' ? 'ready' : 'risky',
    disabledReason: ap <= 0 ? 'AP不足' : meditation.allowed ? undefined : meditation.reason,
    riskChance: locationContext === 'safe' || locationContext === 'aperture' ? 0 : locationContext === 'caravan' ? 0.12 : 0.2,
    expectedGain: `+${meditation.essenceGain} ${isImmortal ? '仙元' : '真元'}`,
    costSummary: isImmortal ? `${meditation.stonesConsumed} 仙元石` : `${meditation.stonesConsumed} 元石`,
    modifierLabels: [],
  });

  const cultivate = calculateCultivationProgress({
    realmGrand,
    aptitude,
    mind,
    currentProgress: progress,
    store,
    period: store?.gameTime?.period,
  });
  cards.push({
    id: 'cultivate',
    title: '专注修行',
    subtitle: '积累境界推进与突破准备',
    apCost: 1,
    status: ap <= 0 ? 'blocked' : 'ready',
    disabledReason: ap <= 0 ? 'AP不足' : undefined,
    expectedGain: `修行进度 +${cultivate.progressGain}`,
    costSummary: '推进 1 时段',
    modifierLabels: cultivate.labels,
  });

  const breakthrough = calculateBreakthroughSuccessRate({
    realmGrand,
    aptitude,
    mind,
    progress,
    store,
  });
  cards.push({
    id: 'breakthrough',
    title: '尝试突破',
    subtitle: '失败会产生小随机惩罚',
    apCost: 1,
    status: ap <= 0 ? 'blocked' : breakthrough.rate < 0.55 ? 'risky' : 'ready',
    disabledReason: ap <= 0 ? 'AP不足' : undefined,
    successRate: breakthrough.rate,
    expectedGain: `成功率 ${pct(breakthrough.rate)}%`,
    costSummary: '推进 1 时段',
    modifierLabels: breakthrough.labels,
  });

  const fieldKinds: FieldActionKind[] = ['scout', 'gather', 'trap_check', 'escape_support'];
  for (const kind of fieldKinds) {
    const result = resolveFieldAction({
      kind,
      realmGrand,
      aptitude,
      mind,
      luck,
      turn: Number(store?.turn || 0),
      locationType: locationContext,
      store,
      seed: 42 + kind.length,
    });
    cards.push({
      id: kind,
      title: fieldTitle(kind),
      subtitle: fieldSubtitle(kind),
      apCost: 1,
      status: ap <= 0 ? 'blocked' : result.riskChance >= 0.18 ? 'risky' : 'ready',
      disabledReason: ap <= 0 ? 'AP不足' : undefined,
      successRate: result.successRate,
      riskChance: result.riskChance,
      expectedGain: kind === 'gather'
        ? `约 ${result.reward?.yuanStoneEquivalent ?? 10}-${Math.max(30, result.reward?.yuanStoneEquivalent ?? 30)} 元石等价`
        : `成功率 ${pct(result.successRate)}%`,
      costSummary: '推进 1 时段',
      modifierLabels: result.modifierLabels,
    });
  }

  return {
    ap,
    maxAp,
    period: store?.gameTime?.period || 'morning',
    locationContext,
    isImmortal,
    essenceLabel: isImmortal ? '仙元' : '真元',
    essenceCurrent,
    essenceMax,
    cultivationProgress: progress,
    cards,
  };
}
