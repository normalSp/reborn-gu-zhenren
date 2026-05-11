import modifierRegistry from '../canon/modifier-registry.json';
import { INITIAL_TALENTS } from '../data/talents';
import { P4_TALENTS } from '../data/talents-p4';
import { classifyPromiseEffectClaim } from './v080-promise-effect-coverage';

export type ModifierSourceType = 'faction' | 'talent' | 'item' | 'secret_realm' | 'runtime';

export type ModifierOperation =
  | 'refine'
  | 'ascend'
  | 'immortal_ascend'
  | 'fragment_complete'
  | 'merchant_buy'
  | 'merchant_sell'
  | 'feeding'
  | 'combat'
  | 'encounter'
  | 'natural_recovery'
  | 'immortal_recovery'
  | 'meditation'
  | 'cultivation'
  | 'breakthrough'
  | 'field_action'
  | 'scout'
  | 'gather'
  | 'trap_check'
  | 'escape_support'
  | 'reputation'
  | 'npc_policy'
  | 'killer_move_mastery'
  | 'aperture'
  | 'calamity';

export type ModifierEffectKind =
  | 'refine_success_add'
  | 'refine_success_mult'
  | 'refine_time_mult'
  | 'refine_backlash_mult'
  | 'refine_material_cost_mult'
  | 'merchant_buy_price_mult'
  | 'merchant_sell_price_mult'
  | 'gu_feed_cost_mult'
  | 'encounter_risk_mult'
  | 'combat_stat_mult'
  | 'attribute_add'
  | 'natural_recovery_mult'
  | 'immortal_recovery_mult'
  | 'meditation_risk_mult'
  | 'cultivation_progress_mult'
  | 'breakthrough_success_add'
  | 'breakthrough_failure_penalty_mult'
  | 'field_action_success_add'
  | 'field_action_risk_mult'
  | 'field_action_yield_mult'
  | 'trap_detection_add'
  | 'escape_success_add'
  | 'reputation_gain_mult'
  | 'npc_trust_mult'
  | 'killer_move_mastery_gain_mult'
  | 'aperture_resource_output_mult'
  | 'calamity_pressure_mult';

export type ModifierCoverageStatus =
  | 'runtime_active'
  | 'creation_only'
  | 'registered_unconsumed'
  | 'planned_needs_system'
  | 'narrative_only'
  | 'needs_downgrade';

export interface ModifierEffect {
  kind: ModifierEffectKind;
  value: number;
  operations?: ModifierOperation[];
  paths?: string[];
  minTier?: number;
  maxTier?: number;
  label?: string;
}

export interface ModifierContext {
  store?: any;
  operation?: ModifierOperation;
  path?: string;
  tier?: number;
  guName?: string;
  itemType?: string;
  itemName?: string;
  period?: string;
  locationType?: string;
}

export interface ResolvedModifier {
  id: string;
  sourceType: ModifierSourceType;
  sourceId: string;
  sourceName: string;
  effect: ModifierEffect;
  label: string;
}

export interface ModifierQuote {
  breakdown: ResolvedModifier[];
}

export interface ModifierCoverageRow {
  claim: string;
  status: ModifierCoverageStatus;
  evidence: string;
  ownerPhase?: string;
  reason?: string;
  nextStep?: string;
}

type ModifierRecord = {
  displayName?: string;
  description?: string;
  matchNames?: string[];
  effects?: ModifierEffect[];
};

type ModifierRegistry = {
  factions?: Record<string, ModifierRecord>;
  talents?: Record<string, ModifierRecord>;
  items?: Record<string, ModifierRecord>;
};

const REGISTRY = modifierRegistry as ModifierRegistry;
const ALL_TALENTS = [...P4_TALENTS, ...INITIAL_TALENTS] as Array<Record<string, any>>;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function normalizeTalentId(talent: any): string {
  if (!talent) return '';
  if (typeof talent === 'string') return talent;
  if (typeof talent === 'object') return String(talent.id ?? talent.key ?? talent.name ?? '');
  return String(talent);
}

export function getSelectedTalentIds(store: any): string[] {
  const raw = Array.isArray(store?.selectedTalents) ? store.selectedTalents : [];
  return raw.map(normalizeTalentId).filter(Boolean);
}

export function getTalentDefinition(idOrTalent: any): Record<string, any> | undefined {
  const id = normalizeTalentId(idOrTalent);
  if (!id) return undefined;
  return ALL_TALENTS.find((talent) => talent.id === id || talent.name === id);
}

function effectMatchesContext(effect: ModifierEffect, context: ModifierContext): boolean {
  if (effect.operations?.length && (!context.operation || !effect.operations.includes(context.operation))) {
    return false;
  }
  if (effect.paths?.length && (!context.path || !effect.paths.includes(context.path))) {
    return false;
  }
  if (typeof effect.minTier === 'number' && typeof context.tier === 'number' && context.tier < effect.minTier) {
    return false;
  }
  if (typeof effect.maxTier === 'number' && typeof context.tier === 'number' && context.tier > effect.maxTier) {
    return false;
  }
  return true;
}

function resolveRecordModifiers(
  sourceType: ModifierSourceType,
  sourceId: string,
  record: ModifierRecord | undefined,
  context: ModifierContext,
): ResolvedModifier[] {
  if (!record?.effects?.length) return [];
  return record.effects
    .filter((effect) => effectMatchesContext(effect, context))
    .map((effect, index) => ({
      id: `${sourceType}:${sourceId}:${effect.kind}:${index}`,
      sourceType,
      sourceId,
      sourceName: record.displayName ?? sourceId,
      effect,
      label: effect.label ?? record.description ?? record.displayName ?? sourceId,
    }));
}

function hasItemLike(store: any, recordId: string, record: ModifierRecord): boolean {
  const names = new Set([recordId, record.displayName, ...(record.matchNames ?? [])].filter(Boolean));
  const materialBag = store?.materialBag ?? {};
  const apertureMaterials = store?.apertureInventory?.materials ?? {};
  const apertureImmortalMaterials = store?.apertureInventory?.immortalMaterials ?? {};
  const candidateBags = [materialBag, apertureMaterials, apertureImmortalMaterials];
  for (const bag of candidateBags) {
    for (const name of names) {
      if (Number(bag?.[String(name)] ?? 0) > 0) return true;
    }
  }
  return false;
}

export function resolveActiveModifiers(context: ModifierContext): ResolvedModifier[] {
  const store = context.store ?? {};
  const modifiers: ResolvedModifier[] = [];

  const factionId = String(store?.flags?._faction ?? store?.factionId ?? '');
  if (factionId) {
    modifiers.push(...resolveRecordModifiers('faction', factionId, REGISTRY.factions?.[factionId], context));
  }

  for (const talentId of getSelectedTalentIds(store)) {
    modifiers.push(...resolveRecordModifiers('talent', talentId, REGISTRY.talents?.[talentId], context));
  }

  for (const [itemId, record] of Object.entries(REGISTRY.items ?? {})) {
    if (hasItemLike(store, itemId, record)) {
      modifiers.push(...resolveRecordModifiers('item', itemId, record, context));
    }
  }

  return modifiers;
}

export function getModifierLabelsForSource(sourceType: 'faction' | 'talent' | 'item', sourceId: string): string[] {
  const table = sourceType === 'faction'
    ? REGISTRY.factions
    : sourceType === 'talent'
      ? REGISTRY.talents
      : REGISTRY.items;
  const record = table?.[sourceId];
  if (!record?.effects?.length) return [];
  return record.effects.map((effect) => effect.label ?? record.description ?? record.displayName ?? sourceId);
}

export function getModifierCoverageRowsForSource(
  sourceType: 'faction' | 'talent' | 'item',
  sourceId: string,
  displayClaims: string[] = [],
): ModifierCoverageRow[] {
  const table = sourceType === 'faction'
    ? REGISTRY.factions
    : sourceType === 'talent'
      ? REGISTRY.talents
      : REGISTRY.items;
  const record = table?.[sourceId];
  const rows: ModifierCoverageRow[] = [];
  const runtimeLabels = new Set<string>();

  for (const effect of record?.effects ?? []) {
    const label = effect.label ?? record?.description ?? record?.displayName ?? sourceId;
    runtimeLabels.add(label);
    rows.push({
      claim: label,
      status: 'runtime_active',
      evidence: `modifier-registry:${sourceType}:${sourceId}:${effect.kind}`,
    });
  }

  for (const rawClaim of displayClaims) {
    const claim = String(rawClaim || '').trim();
    if (!claim) continue;
    if ([...runtimeLabels].some(label => label.includes(claim) || claim.includes(label))) continue;
    rows.push(classifyDisplayClaim(claim, sourceType, sourceId));
  }

  return rows;
}

function classifyDisplayClaim(claim: string, sourceType: ModifierSourceType | 'faction' | 'talent' | 'item', sourceId: string): ModifierCoverageRow {
  return classifyPromiseEffectClaim(claim, sourceType, sourceId) as ModifierCoverageRow;
  const creationOnly = /初始|天赋点|资质|体魄|心智|气运|寿命上限|资源×|资源x|资源X|保底/.test(claim);
  if (creationOnly) {
    return {
      claim,
      status: 'creation_only',
      evidence: `${sourceType}:${sourceId}:character_creation`,
    };
  }

  const narrativeOnly = /身份|名声|性格|倾向|关系|叙事|风格|来历|道心倾向/.test(claim);
  if (narrativeOnly && !/[+\-]\d|成功率|概率|折扣|消耗|恢复|产出|风险|收益|速度|伤害|防御|命中|逃跑/.test(claim)) {
    return {
      claim,
      status: 'narrative_only',
      evidence: `${sourceType}:${sourceId}:lore_or_narrative`,
    };
  }

  const plannedNeedsSystem = /修行|突破|仙窍|资源节点|产出|灾劫|陷阱|伏击|侦察|采集|鉴定|夜间|白天|逃跑|先手|杀招|战斗|道痕|洞天|阵法|恢复|反噬|伤势|毒|警戒|机会/.test(claim);
  if (plannedNeedsSystem) {
    return {
      claim,
      status: 'planned_needs_system',
      evidence: `${sourceType}:${sourceId}:planned-needs-system`,
    };
  }

  const numericButUnknown = /[+\-]\d|×\d|x\d|X\d|%|概率|成功率|折扣|消耗|恢复|风险|收益|速度|伤害|防御|命中|逃跑/.test(claim);
  return {
    claim,
    status: numericButUnknown ? 'needs_downgrade' : 'narrative_only',
    evidence: `${sourceType}:${sourceId}:coverage-audit`,
  };
}

function filterModifiers(modifiers: ResolvedModifier[], kind: ModifierEffectKind): ResolvedModifier[] {
  return modifiers.filter((modifier) => modifier.effect.kind === kind);
}

export function applyRefineSuccessModifiers(baseRate: number, context: ModifierContext): { value: number; breakdown: ResolvedModifier[] } {
  const modifiers = resolveActiveModifiers(context);
  const additive = filterModifiers(modifiers, 'refine_success_add');
  const multiplicative = filterModifiers(modifiers, 'refine_success_mult');
  let value = baseRate;
  for (const modifier of additive) value += modifier.effect.value;
  for (const modifier of multiplicative) value *= modifier.effect.value;
  return {
    value: clamp(value, 0.01, 0.95),
    breakdown: [...additive, ...multiplicative],
  };
}

export function applyRefineTimeModifiers(baseTurns: number, context: ModifierContext): { value: number; breakdown: ResolvedModifier[] } {
  const breakdown = filterModifiers(resolveActiveModifiers(context), 'refine_time_mult');
  const multiplier = breakdown.reduce((acc, modifier) => acc * modifier.effect.value, 1);
  return {
    value: Math.max(1, Math.round(baseTurns * multiplier)),
    breakdown,
  };
}

export function applyRefineBacklashModifiers(baseProbability: number, context: ModifierContext): { value: number; breakdown: ResolvedModifier[] } {
  const breakdown = filterModifiers(resolveActiveModifiers(context), 'refine_backlash_mult');
  const multiplier = breakdown.reduce((acc, modifier) => acc * modifier.effect.value, 1);
  return {
    value: clamp(baseProbability * multiplier, 0, 1),
    breakdown,
  };
}

export function applyRefineMaterialCostModifiers(
  costs: Record<string, number>,
  context: ModifierContext,
): { costs: Record<string, number>; breakdown: ResolvedModifier[] } {
  const breakdown = filterModifiers(resolveActiveModifiers(context), 'refine_material_cost_mult');
  const multiplier = breakdown.reduce((acc, modifier) => acc * modifier.effect.value, 1);
  if (!breakdown.length) return { costs: { ...costs }, breakdown };
  const adjusted: Record<string, number> = {};
  for (const [material, amount] of Object.entries(costs)) {
    if (amount <= 0) continue;
    adjusted[material] = Math.max(1, Math.floor(amount * multiplier));
  }
  return { costs: adjusted, breakdown };
}

export function applyMaterialArrayCostModifiers(
  materials: string[],
  context: ModifierContext,
): { materials: string[]; costs: Record<string, number>; breakdown: ResolvedModifier[] } {
  const costs = materials.reduce<Record<string, number>>((acc, material) => {
    acc[material] = (acc[material] ?? 0) + 1;
    return acc;
  }, {});
  const adjusted = applyRefineMaterialCostModifiers(costs, context);
  const expanded = Object.entries(adjusted.costs).flatMap(([material, amount]) => Array(Math.max(0, amount)).fill(material));
  return { materials: expanded, costs: adjusted.costs, breakdown: adjusted.breakdown };
}

export function applyMerchantPrice(
  basePrice: number,
  context: ModifierContext,
): { price: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const kind: ModifierEffectKind = context.operation === 'merchant_sell' ? 'merchant_sell_price_mult' : 'merchant_buy_price_mult';
  const breakdown = filterModifiers(resolveActiveModifiers(context), kind);
  const rawMultiplier = breakdown.reduce((acc, modifier) => acc * modifier.effect.value, 1);
  const multiplier = kind === 'merchant_buy_price_mult'
    ? clamp(rawMultiplier, 0.5, 1.5)
    : clamp(rawMultiplier, 0.5, 2.0);
  return {
    price: Math.max(1, Math.round(basePrice * multiplier)),
    multiplier,
    breakdown,
  };
}

export function applyGuFeedCostModifiers(
  baseUnits: number,
  context: ModifierContext,
): { effectiveUnits: number; multiplier: number; savedUnits: number; breakdown: ResolvedModifier[] } {
  const breakdown = filterModifiers(resolveActiveModifiers({ ...context, operation: 'feeding' }), 'gu_feed_cost_mult');
  const rawMultiplier = breakdown.reduce((acc, modifier) => acc * modifier.effect.value, 1);
  const multiplier = clamp(rawMultiplier, 0.5, 1.5);
  const effectiveUnits = Math.max(0, baseUnits * multiplier);
  return {
    effectiveUnits,
    multiplier,
    savedUnits: Math.max(0, baseUnits - effectiveUnits),
    breakdown,
  };
}

export function applyEncounterRiskModifiers(
  baseTriggerChance: number,
  context: ModifierContext,
): { triggerChance: number; riskMultiplier: number; breakdown: ResolvedModifier[] } {
  const breakdown = filterModifiers(resolveActiveModifiers({ ...context, operation: 'encounter' }), 'encounter_risk_mult');
  const rawMultiplier = breakdown.reduce((acc, modifier) => acc * modifier.effect.value, 1);
  const riskMultiplier = clamp(rawMultiplier, 0.5, 1.5);
  return {
    triggerChance: clamp(baseTriggerChance * riskMultiplier, 0, 0.95),
    riskMultiplier,
    breakdown,
  };
}

function applyMultiplier(
  baseValue: number,
  context: ModifierContext,
  kind: ModifierEffectKind,
  operation: ModifierOperation,
  min: number,
  max: number,
): { value: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const breakdown = filterModifiers(resolveActiveModifiers({ ...context, operation }), kind);
  const rawMultiplier = breakdown.reduce((acc, modifier) => acc * modifier.effect.value, 1);
  const multiplier = clamp(rawMultiplier, min, max);
  return {
    value: baseValue * multiplier,
    multiplier,
    breakdown,
  };
}

function applyAdditive(
  baseValue: number,
  context: ModifierContext,
  kind: ModifierEffectKind,
  operation: ModifierOperation,
  min: number,
  max: number,
): { value: number; additive: number; breakdown: ResolvedModifier[] } {
  const breakdown = filterModifiers(resolveActiveModifiers({ ...context, operation }), kind);
  const additive = breakdown.reduce((acc, modifier) => acc + modifier.effect.value, 0);
  return {
    value: clamp(baseValue + additive, min, max),
    additive,
    breakdown,
  };
}

export function applyNaturalRecoveryModifiers(
  baseAmount: number,
  context: ModifierContext,
): { amount: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseAmount, context, 'natural_recovery_mult', 'natural_recovery', 0.5, 2.0);
  return { amount: Math.max(0, Math.round(quote.value)), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyImmortalRecoveryModifiers(
  baseAmount: number,
  context: ModifierContext,
): { amount: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseAmount, context, 'immortal_recovery_mult', 'immortal_recovery', 0.5, 2.0);
  return { amount: Math.max(0, Math.round(quote.value)), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyMeditationRiskModifiers(
  baseRiskChance: number,
  context: ModifierContext,
): { riskChance: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseRiskChance, context, 'meditation_risk_mult', 'meditation', 0.4, 1.8);
  return { riskChance: clamp(quote.value, 0, 0.95), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyCultivationProgressModifiers(
  baseProgress: number,
  context: ModifierContext,
): { progress: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseProgress, context, 'cultivation_progress_mult', 'cultivation', 0.3, 2.5);
  return { progress: Math.max(0, Math.round(quote.value)), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyBreakthroughSuccessModifiers(
  baseRate: number,
  context: ModifierContext,
): { rate: number; additive: number; breakdown: ResolvedModifier[] } {
  const quote = applyAdditive(baseRate, context, 'breakthrough_success_add', 'breakthrough', 0.01, 0.95);
  return { rate: quote.value, additive: quote.additive, breakdown: quote.breakdown };
}

export function applyBreakthroughFailurePenaltyModifiers(
  baseSeverity: number,
  context: ModifierContext,
): { severity: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseSeverity, context, 'breakthrough_failure_penalty_mult', 'breakthrough', 0.35, 1.75);
  return { severity: clamp(quote.value, 0, 2), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyFieldActionSuccessModifiers(
  baseRate: number,
  context: ModifierContext,
): { rate: number; additive: number; breakdown: ResolvedModifier[] } {
  const quote = applyAdditive(baseRate, context, 'field_action_success_add', context.operation || 'field_action', 0.01, 0.98);
  return { rate: quote.value, additive: quote.additive, breakdown: quote.breakdown };
}

export function applyFieldActionRiskModifiers(
  baseRisk: number,
  context: ModifierContext,
): { risk: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseRisk, context, 'field_action_risk_mult', context.operation || 'field_action', 0.35, 1.8);
  return { risk: clamp(quote.value, 0, 0.95), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyFieldActionYieldModifiers(
  baseYield: number,
  context: ModifierContext,
): { yieldValue: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseYield, context, 'field_action_yield_mult', context.operation || 'field_action', 0.5, 2.0);
  return { yieldValue: Math.max(0, Math.round(quote.value)), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyTrapDetectionModifiers(
  baseRate: number,
  context: ModifierContext,
): { rate: number; additive: number; breakdown: ResolvedModifier[] } {
  const trapQuote = applyAdditive(baseRate, context, 'trap_detection_add', 'trap_check', 0.01, 0.98);
  const fieldQuote = applyAdditive(trapQuote.value, context, 'field_action_success_add', 'trap_check', 0.01, 0.98);
  return {
    rate: fieldQuote.value,
    additive: trapQuote.additive + fieldQuote.additive,
    breakdown: [...trapQuote.breakdown, ...fieldQuote.breakdown],
  };
}

export function applyEscapeSuccessModifiers(
  baseRate: number,
  context: ModifierContext,
): { rate: number; additive: number; breakdown: ResolvedModifier[] } {
  const quote = applyAdditive(baseRate, context, 'escape_success_add', 'escape_support', 0.01, 0.98);
  return { rate: quote.value, additive: quote.additive, breakdown: quote.breakdown };
}

export function applyReputationGainModifiers(
  baseDelta: number,
  context: ModifierContext,
): { delta: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(Math.abs(baseDelta), context, 'reputation_gain_mult', 'reputation', 0.3, 2.0);
  return { delta: Math.sign(baseDelta || 1) * Math.round(quote.value), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyNpcTrustModifiers(
  baseDelta: number,
  context: ModifierContext,
): { delta: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(Math.abs(baseDelta), context, 'npc_trust_mult', 'npc_policy', 0.3, 2.0);
  return { delta: Math.sign(baseDelta || 1) * Math.round(quote.value), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyKillerMoveMasteryGainModifiers(
  baseGain: number,
  context: ModifierContext,
): { gain: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseGain, context, 'killer_move_mastery_gain_mult', 'killer_move_mastery', 0.5, 3.0);
  return { gain: Math.max(1, Math.round(quote.value)), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyApertureResourceOutputModifiers(
  baseOutput: number,
  context: ModifierContext,
): { output: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(baseOutput, context, 'aperture_resource_output_mult', 'aperture', 0.3, 2.5);
  return { output: Math.max(0, Math.floor(quote.value)), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function applyCalamityPressureModifiers(
  basePressure: number,
  context: ModifierContext,
): { pressure: number; multiplier: number; breakdown: ResolvedModifier[] } {
  const quote = applyMultiplier(basePressure, context, 'calamity_pressure_mult', 'calamity', 0.35, 1.75);
  return { pressure: clamp(quote.value, 0, 180), multiplier: quote.multiplier, breakdown: quote.breakdown };
}

export function formatModifierBreakdown(breakdown: ResolvedModifier[]): string[] {
  const labels = new Set<string>();
  for (const modifier of breakdown) labels.add(modifier.label);
  return Array.from(labels);
}
