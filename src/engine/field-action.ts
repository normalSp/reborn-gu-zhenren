import {
  applyEscapeSuccessModifiers,
  applyFieldActionRiskModifiers,
  applyFieldActionSuccessModifiers,
  applyFieldActionYieldModifiers,
  applyTrapDetectionModifiers,
  formatModifierBreakdown,
  type ModifierContext,
} from './modifier-engine';

export type FieldActionKind = 'scout' | 'gather' | 'trap_check' | 'escape_support';

export interface FieldActionInput {
  kind: FieldActionKind;
  realmGrand: number;
  aptitude: number;
  mind: number;
  luck: number;
  turn: number;
  locationType?: 'safe' | 'caravan' | 'field' | 'wild' | 'aperture';
  store?: any;
  seed?: number;
}

export interface FieldActionResult {
  kind: FieldActionKind;
  success: boolean;
  roll: number;
  successRate: number;
  riskChance: number;
  reward?: {
    yuanStoneEquivalent?: number;
    materials?: Record<string, number>;
    flag?: string;
  };
  message: string;
  modifierLabels: string[];
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

const ACTION_BASE = {
  scout: { success: 0.68, risk: 0.08, yield: 0 },
  gather: { success: 0.66, risk: 0.12, yield: 18 },
  trap_check: { success: 0.58, risk: 0.16, yield: 0 },
  escape_support: { success: 0.52, risk: 0.2, yield: 0 },
} satisfies Record<FieldActionKind, { success: number; risk: number; yield: number }>;

export function resolveFieldAction(input: FieldActionInput): FieldActionResult {
  const base = ACTION_BASE[input.kind];
  const realm = Math.max(1, Number(input.realmGrand || 1));
  const aptitude = Math.max(0, Math.min(10, Number(input.aptitude || 5)));
  const mind = Math.max(0, Math.min(10, Number(input.mind || 5)));
  const luck = Math.max(0, Math.min(10, Number(input.luck || 5)));
  const locationRisk = input.locationType === 'safe' || input.locationType === 'aperture' ? 0.5 : input.locationType === 'wild' ? 1.25 : 1;
  const op = input.kind;
  const context: ModifierContext = {
    store: input.store,
    operation: op,
    tier: realm,
    locationType: input.locationType,
  };

  const baseSuccess = base.success + aptitude * 0.008 + mind * 0.01 + luck * 0.004;
  const successQuote = input.kind === 'trap_check'
    ? applyTrapDetectionModifiers(baseSuccess, context)
    : input.kind === 'escape_support'
      ? applyEscapeSuccessModifiers(baseSuccess, context)
      : applyFieldActionSuccessModifiers(baseSuccess, context);
  const riskQuote = applyFieldActionRiskModifiers(Math.max(0, base.risk * locationRisk - luck * 0.004), context);
  const yieldQuote = applyFieldActionYieldModifiers(base.yield, context);
  const rng = seeded(input.seed ?? (input.turn * 131 + realm * 17 + input.kind.length * 41));
  const roll = rng();
  const success = roll <= successQuote.rate;
  const labels = [
    ...formatModifierBreakdown(successQuote.breakdown),
    ...formatModifierBreakdown(riskQuote.breakdown),
    ...formatModifierBreakdown(yieldQuote.breakdown),
  ];

  if (!success) {
    return {
      kind: input.kind,
      success,
      roll,
      successRate: successQuote.rate,
      riskChance: riskQuote.risk,
      message: input.kind === 'gather' ? '采集未有所得，仍消耗了本时段行动余裕。' : '行动未达成预期，已留下风险线索。',
      modifierLabels: Array.from(new Set(labels)),
    };
  }

  if (input.kind === 'gather') {
    const yuanValue = Math.max(10, Math.min(30, yieldQuote.yieldValue));
    const materialAmount = Math.max(1, Math.round(yuanValue / 12));
    return {
      kind: input.kind,
      success,
      roll,
      successRate: successQuote.rate,
      riskChance: riskQuote.risk,
      reward: { yuanStoneEquivalent: yuanValue, materials: { 普通蛊材: materialAmount } },
      message: `采集成功，获得普通蛊材 x${materialAmount}（约 ${yuanValue} 元石等价）。`,
      modifierLabels: Array.from(new Set(labels)),
    };
  }

  const flag = `field_action_${input.kind}_turn_${input.turn}`;
  return {
    kind: input.kind,
    success,
    roll,
    successRate: successQuote.rate,
    riskChance: riskQuote.risk,
    reward: { flag },
    message: input.kind === 'scout'
      ? '侦察成功：下一次野外遭遇会获得更清晰风险提示。'
      : input.kind === 'trap_check'
        ? '陷阱检查成功：已标记本时段可避开的暗手。'
        : '撤离支援准备完成：下一次逃脱判定会获得辅助。',
    modifierLabels: Array.from(new Set(labels)),
  };
}
