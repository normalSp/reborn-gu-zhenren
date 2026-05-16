import rulesRaw from '../canon/v080-cultivation-calamity-rules.json';
import type {
  AscensionAttemptRecord,
  BreakthroughAttemptRecord,
  CalamityPreview,
  CalamityRecord,
  CultivationDeepeningState,
  CultivationEnvironmentProfile,
  CultivationLocationContext,
  CultivationQiKind,
  CultivationResolutionStep,
  GameTime,
  GuInstance,
  HeavenlyLand,
  ImmortalAperture,
  MortalAperture,
  RealmInfo,
  ResourceNode,
} from '../types';
import { evaluateApertureGrade } from '../store/slices/immortalSlice';
import {
  calculateBreakthroughSuccessRate,
  calculateCultivationProgress,
  resolveBreakthroughFailure,
} from './cultivation-breakthrough';
import { buildExtremePhysiqueCalamityProfile } from './extreme-physique-calamity';
import { createSeededRng, type CombatRng } from './combat-formulas';

type CultivationRules = typeof rulesRaw;
type CalamityRule = CultivationRules['calamities'][number];

const rules = rulesRaw as CultivationRules;
const SUB_REALMS: RealmInfo['sub'][] = ['初阶', '中阶', '高阶', '巅峰'];
const REALM_PREFIX: Record<number, string> = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };
const GRADE_OUTPUT: Record<string, number> = rules.ascension.blessedLand.initialResourceOutputByGrade;

export interface CultivationSessionInput {
  state?: CultivationDeepeningState | null;
  store?: any;
  period?: GameTime['period'];
  location?: CultivationLocationContext;
  seed?: string | number;
  turn?: number;
}

export interface CultivationActionResolution {
  success: boolean;
  blockedReason?: string;
  state: CultivationDeepeningState;
  steps: CultivationResolutionStep[];
  environment: CultivationEnvironmentProfile;
  progressGain: number;
  essenceCost: number;
}

export interface BreakthroughValidation {
  valid: boolean;
  reason?: string;
  successRate: number;
  targetRealm?: RealmInfo;
  essenceCost: number;
  requiredProgress: number;
}

export interface BreakthroughResolution {
  success: boolean;
  validation: BreakthroughValidation;
  state: CultivationDeepeningState;
  steps: CultivationResolutionStep[];
  record: BreakthroughAttemptRecord;
  realmAfter?: RealmInfo;
  penalties?: ReturnType<typeof resolveBreakthroughFailure>['penalties'];
}

export interface AscensionValidation {
  valid: boolean;
  reason?: string;
  successRate: number;
  threeQi: Record<CultivationQiKind, number>;
  preparationScore: number;
}

export interface AscensionResolution {
  success: boolean;
  validation: AscensionValidation;
  state: CultivationDeepeningState;
  steps: CultivationResolutionStep[];
  record: AscensionAttemptRecord;
  realmAfter?: RealmInfo;
  aperture?: ImmortalAperture;
  heavenlyLand?: HeavenlyLand;
  penalties?: { healthPct: number; essencePct: number; aperturePressure: number };
}

export interface CalamityResolution {
  success: boolean;
  blockedReason?: string;
  state: CultivationDeepeningState;
  steps: CultivationResolutionStep[];
  record?: CalamityRecord;
  aperture?: ImmortalAperture;
  heavenlyLand?: HeavenlyLand;
  inventory?: GuInstance[];
  preview?: CalamityPreview | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function currentTurn(store: any, explicit?: number): number {
  return Number(explicit ?? store?.turn ?? 1);
}

function step(
  kind: CultivationResolutionStep['kind'],
  message: string,
  turn: number,
  extras: Partial<CultivationResolutionStep> = {},
): CultivationResolutionStep {
  return {
    id: `cult_${turn}_${kind}_${Math.abs(hashText(message + JSON.stringify(extras))).toString(36)}`,
    turn,
    kind,
    message,
    tags: extras.tags ?? [kind],
    ...extras,
  };
}

function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function realmKey(realm: RealmInfo | undefined): string {
  if (!realm) return '一转初阶';
  return `${realm.grand}:${realm.sub}`;
}

function labelRealm(grand: number, sub: RealmInfo['sub']): string {
  return `${REALM_PREFIX[grand] || grand}转${sub}`;
}

function nextRealm(realm: RealmInfo): RealmInfo | null {
  const idx = SUB_REALMS.indexOf(realm.sub);
  if (idx >= 0 && idx < SUB_REALMS.length - 1) {
    const sub = SUB_REALMS[idx + 1];
    return { grand: realm.grand, sub, label: labelRealm(realm.grand, sub) };
  }
  if (realm.grand < 5) {
    return { grand: (realm.grand + 1) as RealmInfo['grand'], sub: '初阶', label: labelRealm(realm.grand + 1, '初阶') };
  }
  return null;
}

function updateProgressByRealm(state: CultivationDeepeningState, realm: RealmInfo | undefined, progress: number): Record<string, number> {
  return {
    ...state.progressByRealm,
    [realmKey(realm)]: Math.max(0, Math.round(progress)),
  };
}

function getRealmGrand(store: any): number {
  return clamp(Number(store?.profile?.realm?.grand || 1), 1, 9);
}

function getRealmInfo(store: any): RealmInfo {
  const realm = store?.profile?.realm;
  return {
    grand: clamp(Number(realm?.grand || 1), 1, 9) as RealmInfo['grand'],
    sub: (SUB_REALMS.includes(realm?.sub) ? realm.sub : '初阶') as RealmInfo['sub'],
    label: realm?.label || labelRealm(clamp(Number(realm?.grand || 1), 1, 9), SUB_REALMS.includes(realm?.sub) ? realm.sub : '初阶'),
  };
}

function getEssence(store: any): { current: number; max: number } {
  return {
    current: Number(store?.vitals?.essence?.current || 0),
    max: Math.max(1, Number(store?.vitals?.essence?.max || 1)),
  };
}

function pickLocation(location?: CultivationLocationContext, store?: any): CultivationLocationContext {
  if (location) return location;
  if (store?.aperture?.type && store.aperture.type !== 'mortal') return 'aperture';
  const chapter = String(store?.currentChapterId || '').toLowerCase();
  if (chapter.includes('caravan') || chapter.includes('商队')) return 'caravan';
  if (chapter.includes('wild') || chapter.includes('伏击')) return 'wild';
  if (chapter.includes('village') || chapter.includes('山寨') || chapter.includes('city')) return 'safe';
  return 'field';
}

function ruleNumber(map: Record<string, number>, realmGrand: number, fallback: number): number {
  return Number(map[String(realmGrand)] ?? fallback);
}

function cloneState(state: CultivationDeepeningState): CultivationDeepeningState {
  return JSON.parse(JSON.stringify(state));
}

export function createDefaultCultivationState(seedState: Partial<CultivationDeepeningState> = {}): CultivationDeepeningState {
  return normalizeCultivationState({
    version: 'v0.8.0-b2',
    progress: 0,
    progressByRealm: {},
    breakthroughHistory: [],
    ascension: {
      threeQi: { human: 0, earth: 0, heaven: 0 },
      preparationScore: 0,
      heavenWillPressure: 0,
      karmicDebt: 0,
    },
    calamityLedger: [],
    nextCalamityPreview: null,
    lastEnvironment: null,
    lastResolution: [],
    ...seedState,
  });
}

export function normalizeCultivationState(value?: Partial<CultivationDeepeningState> | null): CultivationDeepeningState {
  const source = value && typeof value === 'object' ? value : {};
  const ascension = source.ascension && typeof source.ascension === 'object' ? source.ascension as any : {};
  const threeQi = ascension.threeQi && typeof ascension.threeQi === 'object' ? ascension.threeQi as any : {};
  return {
    version: 'v0.8.0-b2',
    progress: clamp(Number(source.progress || 0), 0, rules.cultivation.progressOverflowCap),
    progressByRealm: source.progressByRealm && typeof source.progressByRealm === 'object' ? { ...source.progressByRealm } : {},
    breakthroughHistory: Array.isArray(source.breakthroughHistory) ? source.breakthroughHistory.slice(0, 20) : [],
    ascension: {
      threeQi: {
        human: clamp(Number(threeQi.human || 0), 0, 100),
        earth: clamp(Number(threeQi.earth || 0), 0, 100),
        heaven: clamp(Number(threeQi.heaven || 0), 0, 100),
      },
      preparationScore: clamp(Number(ascension.preparationScore || 0), 0, 100),
      heavenWillPressure: clamp(Number(ascension.heavenWillPressure || 0), 0, 100),
      karmicDebt: clamp(Number(ascension.karmicDebt || 0), 0, 100),
      lastAttempt: ascension.lastAttempt,
    },
    calamityLedger: Array.isArray(source.calamityLedger) ? source.calamityLedger.slice(0, 20) : [],
    nextCalamityPreview: source.nextCalamityPreview || null,
    lastEnvironment: source.lastEnvironment || null,
    lastResolution: Array.isArray(source.lastResolution) ? source.lastResolution.slice(0, 12) : [],
  };
}

export function buildCultivationEnvironmentProfile(input: CultivationSessionInput = {}): CultivationEnvironmentProfile {
  const period = input.period || input.store?.gameTime?.period || 'morning';
  const location = pickLocation(input.location, input.store);
  const periodRule = (rules.environment.periods as any)[period] || rules.environment.periods.morning;
  const locationRule = (rules.environment.locations as any)[location] || rules.environment.locations.field;
  const risk = Number(periodRule.riskMultiplier || 1) * Number(locationRule.riskMultiplier || 1);
  const safety: CultivationEnvironmentProfile['safety'] = risk >= 1.25 ? 'dangerous' : risk >= 0.9 ? 'watchful' : 'secure';
  const warnings: string[] = [];
  if (safety === 'dangerous') warnings.push('此地修行易受外界干扰，突破失败反噬会被放大。');
  if (location === 'aperture' && input.store?.aperture?.type === 'mortal') warnings.push('凡人空窍只能承载真元压力，不可当作福地避劫。');
  return {
    period,
    periodLabel: periodRule.label,
    location,
    locationLabel: locationRule.label,
    safety,
    progressMultiplier: Number((periodRule.progressMultiplier * locationRule.progressMultiplier).toFixed(3)),
    riskMultiplier: Number(risk.toFixed(3)),
    essenceCostMultiplier: Number(locationRule.essenceCostMultiplier || 1),
    qiBias: periodRule.qiBias as CultivationQiKind,
    labels: [periodRule.label, locationRule.label],
    warnings,
  };
}

export function resolveCultivationSession(input: CultivationSessionInput): CultivationActionResolution {
  const state = normalizeCultivationState(input.state || input.store?.cultivationState);
  const next = cloneState(state);
  const store = input.store || {};
  const turn = currentTurn(store, input.turn);
  const realmGrand = getRealmGrand(store);
  const environment = buildCultivationEnvironmentProfile(input);
  const essence = getEssence(store);
  const essenceCost = Math.max(1, Math.round(ruleNumber(rules.cultivation.essenceCostByRealm, realmGrand, 10) * environment.essenceCostMultiplier));
  const steps: CultivationResolutionStep[] = [
    step('environment', `${environment.periodLabel}·${environment.locationLabel}：修行效率 x${environment.progressMultiplier}`, turn, {
      tags: ['environment', environment.safety],
    }),
  ];

  if (essence.current < essenceCost) {
    steps.push(step('failure', `真元不足，至少需要 ${essenceCost} 点。`, turn, { tags: ['failure', 'essence'] }));
    next.lastEnvironment = environment;
    next.lastResolution = steps;
    return { success: false, blockedReason: 'essence_insufficient', state: next, steps, environment, progressGain: 0, essenceCost };
  }

  const currentProgress = Math.max(Number(state.progress || store?.flags?.cultivationProgress || 0), Number(store?.flags?.cultivationProgress || 0));
  const base = calculateCultivationProgress({
    realmGrand,
    aptitude: Number(store?.attributes?.资质 || 5),
    mind: Number(store?.attributes?.心智 || 5),
    currentProgress,
    store,
    period: environment.period,
  });
  const progressGain = Math.max(1, Math.round(base.progressGain * environment.progressMultiplier));
  const newProgress = clamp(currentProgress + progressGain, 0, rules.cultivation.progressOverflowCap);
  next.progress = newProgress;
  next.progressByRealm = updateProgressByRealm(next, store?.profile?.realm, newProgress);
  next.ascension.threeQi[environment.qiBias] = clamp(next.ascension.threeQi[environment.qiBias] + Math.max(3, Math.round(progressGain / 6)), 0, 100);
  next.lastEnvironment = environment;
  steps.push(step('resource_spend', `消耗 ${essenceCost} 点${store?.vitals?.essenceType === 'immortal' ? '仙元' : '真元'}压住气机。`, turn, {
    amount: essenceCost,
    tags: ['resource_spend', store?.vitals?.essenceType === 'immortal' ? 'immortal_essence' : 'primeval_essence'],
  }));
  steps.push(step('progress_gain', `修行进度 +${progressGain}，当前 ${newProgress}/${ruleNumber(rules.cultivation.progressThresholdByRealm, realmGrand, 100)}。`, turn, {
    amount: progressGain,
    tags: ['progress_gain', ...base.labels],
  }));
  next.lastResolution = steps;
  return { success: true, state: next, steps, environment, progressGain, essenceCost };
}

export function validateMajorBreakthroughAttempt(input: CultivationSessionInput): BreakthroughValidation {
  const store = input.store || {};
  const state = normalizeCultivationState(input.state || store.cultivationState);
  const realm = getRealmInfo(store);
  const targetRealm = nextRealm(realm);
  const realmGrand = realm.grand;
  const requiredProgress = ruleNumber(rules.cultivation.progressThresholdByRealm, realmGrand, 100);
  const essence = getEssence(store);
  const essenceCost = Math.max(1, Math.round(essence.max * rules.breakthrough.minimumEssencePercent));
  const progress = Math.max(Number(state.progress || 0), Number(store?.flags?.cultivationProgress || 0));
  const quote = calculateBreakthroughSuccessRate({
    realmGrand,
    aptitude: Number(store?.attributes?.资质 || 5),
    mind: Number(store?.attributes?.心智 || 5),
    progress,
    store,
  });
  const targetIsGrandBreak = targetRealm ? targetRealm.grand > realm.grand : false;
  const successRate = clamp(
    quote.rate + (targetIsGrandBreak ? -rules.breakthrough.grandRealmPenalty : rules.breakthrough.sameRealmSubrankBonus),
    0.05,
    0.96,
  );

  if (!targetRealm) return { valid: false, reason: '五转巅峰之后必须走升仙，不再允许普通突破。', successRate, essenceCost, requiredProgress };
  if (progress < requiredProgress) return { valid: false, reason: `修行进度不足，需要 ${requiredProgress}。`, successRate, targetRealm, essenceCost, requiredProgress };
  if (essence.current < essenceCost) return { valid: false, reason: `真元不足，需要至少 ${essenceCost}。`, successRate, targetRealm, essenceCost, requiredProgress };
  return { valid: true, successRate, targetRealm, essenceCost, requiredProgress };
}

export function resolveMajorBreakthroughAttempt(input: CultivationSessionInput): BreakthroughResolution {
  const store = input.store || {};
  const before = getRealmInfo(store);
  const state = normalizeCultivationState(input.state || store.cultivationState);
  const next = cloneState(state);
  const turn = currentTurn(store, input.turn);
  const validation = validateMajorBreakthroughAttempt(input);
  const rng = createSeededRng(input.seed ?? `breakthrough:${turn}:${before.label}:${state.progress}`);
  const roll = rng.next();
  const steps: CultivationResolutionStep[] = [];

  if (!validation.valid || !validation.targetRealm) {
    steps.push(step('failure', validation.reason || '突破条件不足。', turn, { tags: ['failure', 'breakthrough'] }));
    next.lastResolution = steps;
    const blocked: BreakthroughAttemptRecord = {
      id: `bt_${turn}_${before.grand}_${before.sub}`,
      turn,
      outcome: 'blocked',
      realmBefore: before,
      successRate: validation.successRate,
      steps,
    };
    next.breakthroughHistory = [blocked, ...next.breakthroughHistory].slice(0, 20);
    return { success: false, validation, state: next, steps, record: blocked };
  }

  steps.push(step('resource_spend', `冲关消耗 ${validation.essenceCost} 点真元。`, turn, {
    amount: validation.essenceCost,
    tags: ['resource_spend', 'breakthrough'],
  }));

  if (roll <= validation.successRate) {
    const after = validation.targetRealm;
    const progressAfter = Math.max(0, state.progress - rules.breakthrough.progressSpendOnSuccess);
    next.progress = progressAfter;
    next.progressByRealm = updateProgressByRealm(next, after, progressAfter);
    steps.push(step('realm_change', `突破成功，境界推进至 ${after.label}。`, turn, {
      amount: after.grand,
      tags: ['realm_change', after.grand > before.grand ? 'grand_realm' : 'sub_realm'],
    }));
    steps.push(step('settlement', '窍壁潮汐归稳，突破由本地引擎结算完成。', turn, { tags: ['settlement'] }));
    const record: BreakthroughAttemptRecord = {
      id: `bt_${turn}_${before.grand}_${before.sub}`,
      turn,
      outcome: 'success',
      realmBefore: before,
      realmAfter: after,
      successRate: validation.successRate,
      roll,
      steps,
    };
    next.breakthroughHistory = [record, ...next.breakthroughHistory].slice(0, 20);
    next.lastResolution = steps;
    return { success: true, validation, state: next, steps, record, realmAfter: after };
  }

  const pressureProfile = buildExtremePhysiqueCalamityProfile(store?.aperture as MortalAperture | null, {
    hpPercent: store?.vitals?.health?.max ? (store.vitals.health.current / store.vitals.health.max) * 100 : 100,
    turn,
    store,
  });
  const failure = resolveBreakthroughFailure({
    realmGrand: before.grand,
    aptitude: Number(store?.attributes?.资质 || 5),
    mind: Number(store?.attributes?.心智 || 5),
    progress: state.progress,
    seed: hashText(`fail:${turn}:${before.label}:${roll}`),
    store,
    extremePhysiquePressure: pressureProfile?.aperturePressure || 0,
  });
  const progressLoss = Math.max(rules.breakthrough.progressSpendOnFailureBase, failure.penalties.find(p => p.kind === 'progress_loss')?.amount || 0);
  next.progress = Math.max(0, state.progress - progressLoss);
  next.progressByRealm = updateProgressByRealm(next, before, next.progress);
  for (const penalty of failure.penalties) {
    const kind = penalty.kind === 'hp_loss'
      ? 'injury'
      : penalty.kind === 'essence_shock'
        ? 'essence_shock'
        : penalty.kind === 'gu_hunger' || penalty.kind === 'gu_injury'
          ? 'gu_damage'
          : penalty.kind === 'aperture_pressure'
            ? 'aperture_pressure'
            : 'failure';
    steps.push(step(kind, penalty.description, turn, {
      amount: penalty.amount,
      severity: failure.severity,
      tags: ['failure', penalty.kind],
    }));
  }
  const record: BreakthroughAttemptRecord = {
    id: `bt_${turn}_${before.grand}_${before.sub}`,
    turn,
    outcome: 'failure',
    realmBefore: before,
    successRate: validation.successRate,
    roll,
    severity: failure.severity,
    steps,
  };
  next.breakthroughHistory = [record, ...next.breakthroughHistory].slice(0, 20);
  next.lastResolution = steps;
  return { success: false, validation, state: next, steps, record, penalties: failure.penalties };
}

function deriveThreeQi(store: any, state: CultivationDeepeningState): Record<CultivationQiKind, number> {
  const attrs = store?.attributes || {};
  const daoTotal = Object.values(store?.pathBuild?.dao_marks || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
  const resourceNodes = Array.isArray(store?.aperture?.resource_nodes) ? store.aperture.resource_nodes.length : 0;
  const knownMoves = Array.isArray(store?.killMoves) ? store.killMoves.length : 0;
  return {
    human: clamp(Math.round((attrs.心智 || 5) * 7 + knownMoves * 3 + state.ascension.threeQi.human * 0.35), 0, 100),
    earth: clamp(Math.round((attrs.体魄 || 5) * 6 + resourceNodes * 4 + daoTotal * 0.04 + state.ascension.threeQi.earth * 0.35), 0, 100),
    heaven: clamp(Math.round((attrs.气运 || 5) * 6 + (attrs.资质 || 5) * 3 + state.ascension.threeQi.heaven * 0.35), 0, 100),
  };
}

function threeQiSpread(threeQi: Record<CultivationQiKind, number>): number {
  const values = Object.values(threeQi);
  return Math.max(...values) - Math.min(...values);
}

function preparationScore(store: any, threeQi: Record<CultivationQiKind, number>): number {
  const daoTotal = Object.values(store?.pathBuild?.dao_marks || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
  const guCount = Array.isArray(store?.inventory) ? store.inventory.filter((gu: any) => Number(gu?.tier || 0) >= 4).length : 0;
  const moves = Array.isArray(store?.killMoves) ? store.killMoves.length : 0;
  const qiAverage = (threeQi.human + threeQi.earth + threeQi.heaven) / 3;
  return clamp(Math.round(qiAverage * 0.55 + Math.min(20, daoTotal * 0.03) + Math.min(12, guCount * 3) + Math.min(12, moves * 2)), 0, 100);
}

export function validateAscensionAttempt(input: CultivationSessionInput): AscensionValidation {
  const store = input.store || {};
  const state = normalizeCultivationState(input.state || store.cultivationState);
  const realm = getRealmInfo(store);
  const threeQi = deriveThreeQi(store, state);
  const prep = preparationScore(store, threeQi);
  const spread = threeQiSpread(threeQi);
  const minimumQi = Math.min(threeQi.human, threeQi.earth, threeQi.heaven);
  const pressure = Number(state.ascension.heavenWillPressure || 0);
  const balanceBonus = spread <= rules.ascension.threeQiBalanceTolerance ? rules.ascension.balanceBonus : 0;
  const successRate = clamp(
    rules.ascension.baseSuccessRate +
      prep * rules.ascension.preparationRateScale +
      balanceBonus -
      pressure * rules.ascension.heavenWillPenaltyScale,
    0.06,
    0.92,
  );

  if (realm.grand !== rules.ascension.requiredRealmGrand || realm.sub !== rules.ascension.requiredSubRealm) {
    return { valid: false, reason: '升仙必须处于五转巅峰。', successRate, threeQi, preparationScore: prep };
  }
  if (state.progress < rules.ascension.requiredProgress) {
    return { valid: false, reason: `升仙底蕴不足，需要修行进度 ${rules.ascension.requiredProgress}。`, successRate, threeQi, preparationScore: prep };
  }
  if (minimumQi < rules.ascension.threeQiMinimum) {
    return { valid: false, reason: '人气、地气、天气至少各需 45，三气未成。', successRate, threeQi, preparationScore: prep };
  }
  if (spread > rules.ascension.threeQiBalanceTolerance) {
    return { valid: false, reason: '三气失衡过大，强行升仙会直接反噬。', successRate, threeQi, preparationScore: prep };
  }
  return { valid: true, successRate, threeQi, preparationScore: prep };
}

function makeInitialResourceNodes(rng: CombatRng, count: number, primaryPath: string): ResourceNode[] {
  const nodePool = [
    { type: primaryPath || '气道', name: `${primaryPath || '气道'}道痕凝泉`, grade: '仙材' as ResourceNode['grade'] },
    { type: '土道', name: '息壤灵田', grade: '稀有' as ResourceNode['grade'] },
    { type: '水道', name: '小天河支流', grade: '精品' as ResourceNode['grade'] },
    { type: '木道', name: '青木药圃', grade: '精品' as ResourceNode['grade'] },
    { type: '气道', name: '三气回旋台', grade: '仙材' as ResourceNode['grade'] },
  ];
  return nodePool.slice(0, Math.max(1, count)).map((node, index) => ({
    id: `b2_node_${index}_${Math.floor(rng.next() * 100000)}`,
    type: node.type,
    name: node.name,
    output_rate: 1 + Math.floor(rng.next() * 3),
    quality: 52 + Math.floor(rng.next() * 38),
    grade: node.grade,
    active: true,
  }));
}

export function resolveAscensionAttempt(input: CultivationSessionInput): AscensionResolution {
  const store = input.store || {};
  const state = normalizeCultivationState(input.state || store.cultivationState);
  const next = cloneState(state);
  const turn = currentTurn(store, input.turn);
  const validation = validateAscensionAttempt(input);
  const rng = createSeededRng(input.seed ?? `ascension:${turn}:${state.progress}:${validation.preparationScore}`);
  const roll = rng.next();
  const steps: CultivationResolutionStep[] = [];
  const before = getRealmInfo(store);

  if (!validation.valid) {
    steps.push(step('failure', validation.reason || '升仙条件不足。', turn, { tags: ['failure', 'ascension'] }));
    next.lastResolution = steps;
    const record: AscensionAttemptRecord = {
      id: `asc_${turn}`,
      turn,
      outcome: 'blocked',
      successRate: validation.successRate,
      threeQi: validation.threeQi,
      steps,
    };
    next.ascension.lastAttempt = record;
    return { success: false, validation, state: next, steps, record };
  }

  steps.push(step('resource_spend', `三气合流：人气 ${validation.threeQi.human}，地气 ${validation.threeQi.earth}，天气 ${validation.threeQi.heaven}。`, turn, {
    tags: ['resource_spend', 'three_qi'],
  }));

  if (roll <= validation.successRate) {
    const daoMarksTotal = Object.values(store?.pathBuild?.dao_marks || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
    const guRefinedCount = Array.isArray(store?.inventory) ? store.inventory.length : 0;
    const famousScenesCompleted = Object.values(store?.flags?.completedFamousScenes || {}).filter(Boolean).length;
    const killerMovesKnown = Array.isArray(store?.killMoves) ? store.killMoves.length : 0;
    const talentLevel = Number(store?.attributes?.资质 || 5);
    const gradeQuote = evaluateApertureGrade(daoMarksTotal, guRefinedCount, famousScenesCompleted, killerMovesKnown, talentLevel);
    const areaMu = gradeQuote.areaRange[0] + Math.floor(rng.next() * (gradeQuote.areaRange[1] - gradeQuote.areaRange[0] + 1));
    const flowRatio = gradeQuote.flowRange[0] + Math.floor(rng.next() * (gradeQuote.flowRange[1] - gradeQuote.flowRange[0] + 1));
    const nodeCount = gradeQuote.nodeRange[0] + Math.floor(rng.next() * (gradeQuote.nodeRange[1] - gradeQuote.nodeRange[0] + 1));
    const primaryPath = store?.pathBuild?.primary || store?.primaryPath || '气道';
    const nodes = makeInitialResourceNodes(rng, nodeCount, primaryPath);
    const countdownRange = rules.ascension.blessedLand.disasterCountdownRange;
    const disasterCountdown = countdownRange[0] + Math.floor(rng.next() * (countdownRange[1] - countdownRange[0] + 1));
    const calamity = rules.calamities[Math.floor(rng.next() * rules.calamities.length)];
    const landId = `b2_land_${turn}_${Math.floor(rng.next() * 100000)}`;
    const daoDensity = {
      ...(store?.pathBuild?.dao_marks || {}),
      [primaryPath]: Number(store?.pathBuild?.dao_marks?.[primaryPath] || 0) + Math.round(validation.preparationScore * 0.8),
    };
    const aperture: ImmortalAperture = {
      type: '福地',
      grade: gradeQuote.grade,
      area_mu: areaMu,
      time_flow_ratio: flowRatio,
      resource_nodes: nodes,
      dao_mark_density: daoDensity,
      next_disaster_type: calamity.name,
      disaster_countdown: disasterCountdown,
    };
    const heavenlyLand: HeavenlyLand = {
      id: landId,
      type: '福地',
      domain: store?.currentDomain || '南疆',
      name: `${store?.currentDomain || '南疆'}福地`,
      areaMu,
      timeFlowRatio: flowRatio,
      resourceOutputRate: GRADE_OUTPUT[gradeQuote.grade] || 16,
      earthSpirit: { formed: false, approval: 0 },
      disasterCountdown,
      nextDisasterType: calamity.name,
      createdAt: turn,
      accessible: true,
    };
    next.progress = 0;
    next.ascension.threeQi = validation.threeQi;
    next.ascension.preparationScore = validation.preparationScore;
    next.nextCalamityPreview = buildCalamityPreview({ state: next, store: { ...store, aperture, heavenlyLand }, turn });
    steps.push(step('realm_change', `升仙成功，凡窍化作${gradeQuote.grade}。`, turn, {
      amount: 6,
      tags: ['realm_change', 'ascension', 'blessed_land'],
    }));
    steps.push(step('settlement', `开辟福地 ${areaMu} 亩，时间流速 1:${flowRatio}，下一劫为${calamity.name}。`, turn, {
      tags: ['settlement', 'blessed_land'],
    }));
    const record: AscensionAttemptRecord = {
      id: `asc_${turn}`,
      turn,
      outcome: 'success',
      successRate: validation.successRate,
      roll,
      threeQi: validation.threeQi,
      blessedLandGrade: gradeQuote.grade,
      heavenlyLandId: landId,
      steps,
    };
    next.ascension.lastAttempt = record;
    next.lastResolution = steps;
    return {
      success: true,
      validation,
      state: next,
      steps,
      record,
      realmAfter: { grand: 6, sub: '初阶', label: '六转初阶' },
      aperture,
      heavenlyLand,
    };
  }

  const backlash = rules.ascension.failureBacklash;
  next.progress = Math.max(0, state.progress - 70);
  next.ascension.heavenWillPressure = clamp(next.ascension.heavenWillPressure + backlash.heavenWillPressure, 0, 100);
  next.ascension.karmicDebt = clamp(next.ascension.karmicDebt + backlash.karmicDebt, 0, 100);
  steps.push(step('injury', `升仙失败，肉身与魂魄遭反噬，生命损伤 ${backlash.healthPct}%。`, turn, {
    amount: backlash.healthPct,
    tags: ['failure', 'ascension', 'injury'],
  }));
  steps.push(step('essence_shock', `三气崩散，当前真元损失 ${backlash.essencePct}%。`, turn, {
    amount: backlash.essencePct,
    tags: ['failure', 'essence_shock'],
  }));
  steps.push(step('aperture_pressure', `空窍压力 +${backlash.aperturePressure}，天意压力与业债上升。`, turn, {
    amount: backlash.aperturePressure,
    tags: ['failure', 'aperture_pressure', 'heaven_will'],
  }));
  const record: AscensionAttemptRecord = {
    id: `asc_${turn}`,
    turn,
    outcome: 'failure',
    successRate: validation.successRate,
    roll,
    threeQi: validation.threeQi,
    steps,
  };
  next.ascension.lastAttempt = record;
  next.lastResolution = steps;
  return {
    success: false,
    validation,
    state: next,
    steps,
    record,
    penalties: {
      healthPct: backlash.healthPct,
      essencePct: backlash.essencePct,
      aperturePressure: backlash.aperturePressure,
    },
  };
}

function findCalamityRule(nameOrId?: string | null): CalamityRule {
  return rules.calamities.find(item => item.id === nameOrId || item.name === nameOrId) || rules.calamities[0];
}

export function buildCalamityPreview(input: { state?: CultivationDeepeningState | null; store?: any; turn?: number } = {}): CalamityPreview | null {
  const store = input.store || {};
  const aperture = store.aperture as ImmortalAperture | null;
  const heavenlyLand = store.heavenlyLand as HeavenlyLand | null;
  if (!aperture || (aperture as any).type === 'mortal') return null;
  const rule = findCalamityRule(aperture.next_disaster_type || heavenlyLand?.nextDisasterType);
  const nodes = Array.isArray(aperture.resource_nodes) ? aperture.resource_nodes : [];
  const affected = nodes.filter((node, index) => node.active !== false && (node.type === rule.path || index < 2)).map(node => node.id).slice(0, 3);
  const countdown = Math.min(
    Number(aperture.disaster_countdown ?? 99),
    Number(heavenlyLand?.disasterCountdown ?? aperture.disaster_countdown ?? 99),
  );
  const warnings = [
    countdown <= 10 ? '灾劫迫近，应立刻停产、护住核心资源点。' : '灾劫尚有余裕，可提前调配资源点与道痕防护。',
    rule.category === 'heavenly_tribulation' ? '天劫会留下较多道痕，但损伤也更重。' : '地灾主要损伤面积与资源节点。',
  ];
  return {
    id: rule.id,
    name: rule.name,
    category: rule.category as CalamityPreview['category'],
    path: rule.path,
    severity: rule.severity,
    countdown,
    affectedResourceNodeIds: affected,
    expectedAreaLossPct: rule.areaLossPct,
    warnings,
    tags: rule.tags,
  };
}

export function resolveCalamityConsequence(input: { state?: CultivationDeepeningState | null; store?: any; seed?: string | number; turn?: number } = {}): CalamityResolution {
  const store = input.store || {};
  const state = normalizeCultivationState(input.state || store.cultivationState);
  const next = cloneState(state);
  const turn = currentTurn(store, input.turn);
  const sourceAperture = store.aperture as ImmortalAperture | null;
  const sourceLand = store.heavenlyLand as HeavenlyLand | null;
  if (!sourceAperture || (sourceAperture as any).type === 'mortal') {
    const steps = [step('failure', '尚未开辟福地，不能结算仙窍灾劫。', turn, { tags: ['failure', 'calamity'] })];
    next.lastResolution = steps;
    return { success: false, blockedReason: 'no_immortal_aperture', state: next, steps, preview: null };
  }

  const preview = buildCalamityPreview({ state, store, turn });
  if (!preview) {
    const steps = [step('failure', '灾劫预览缺失，无法结算。', turn, { tags: ['failure', 'calamity'] })];
    next.lastResolution = steps;
    return { success: false, blockedReason: 'missing_preview', state: next, steps, preview: null };
  }

  const rng = createSeededRng(input.seed ?? `calamity:${turn}:${preview.id}:${sourceAperture.disaster_countdown}`);
  const rule = findCalamityRule(preview.id);
  const aperture: ImmortalAperture = JSON.parse(JSON.stringify(sourceAperture));
  const heavenlyLand: HeavenlyLand | undefined = sourceLand ? JSON.parse(JSON.stringify(sourceLand)) : undefined;
  const inventory: GuInstance[] = Array.isArray(store.inventory) ? JSON.parse(JSON.stringify(store.inventory)) : [];
  const steps: CultivationResolutionStep[] = [];
  const areaLoss = Math.max(1, Math.round(aperture.area_mu * rule.areaLossPct * (0.85 + rng.next() * 0.3)));
  aperture.area_mu = Math.max(10, aperture.area_mu - areaLoss);
  const resourceDamage: Record<string, number> = {};
  aperture.resource_nodes = (aperture.resource_nodes || []).map((node) => {
    if (!preview.affectedResourceNodeIds.includes(node.id)) return node;
    const damage = Math.max(4, Math.round(node.quality * rule.resourceDamagePct * (0.8 + rng.next() * 0.4)));
    resourceDamage[node.id] = damage;
    return {
      ...node,
      quality: Math.max(1, node.quality - damage),
      active: node.quality - damage > 10 ? node.active : false,
    };
  });
  const daoDelta: Record<string, number> = {};
  for (const [path, delta] of Object.entries(rule.daoMarkDelta || {})) {
    const scaled = Math.round(Number(delta) * (0.85 + rng.next() * 0.3));
    daoDelta[path] = scaled;
    aperture.dao_mark_density = {
      ...(aperture.dao_mark_density || {}),
      [path]: Math.max(0, Number(aperture.dao_mark_density?.[path] || 0) + scaled),
    };
  }
  const guDamageIds: string[] = [];
  const damagedInventory: GuInstance[] = inventory.map((gu) => {
    if (guDamageIds.length >= 2 || gu.currentState === 'dead' || rng.next() > rule.severity * 0.18) return gu;
    guDamageIds.push(gu.id);
    return {
      ...gu,
      currentState: (gu.currentState === 'optimal' ? 'hungry' : 'injured') as GuInstance['currentState'],
      hungerCounter: Number(gu.hungerCounter || 0) + 2,
    };
  });
  const nextRule = rules.calamities[Math.floor(rng.next() * rules.calamities.length)];
  const nextCountdown = 42 + Math.floor(rng.next() * 35);
  aperture.next_disaster_type = nextRule.name;
  aperture.disaster_countdown = nextCountdown;
  if (heavenlyLand) {
    heavenlyLand.areaMu = aperture.area_mu;
    heavenlyLand.resourceOutputRate = Math.max(1, Math.round(heavenlyLand.resourceOutputRate * (1 - rule.resourceDamagePct * 0.45)));
    heavenlyLand.disasterCountdown = nextCountdown;
    heavenlyLand.nextDisasterType = nextRule.name;
  }

  steps.push(step('calamity_warning', `${preview.name}落下，${preview.tags.join('、')}。`, turn, {
    severity: rule.severity,
    path: rule.path,
    tags: ['calamity_warning', preview.category],
  }));
  steps.push(step('calamity_consequence', `福地面积损失 ${areaLoss} 亩，${Object.keys(resourceDamage).length} 个资源点受损。`, turn, {
    amount: areaLoss,
    tags: ['calamity_consequence', 'resource_node'],
  }));
  for (const [path, delta] of Object.entries(daoDelta)) {
    steps.push(step('dao_mark_shift', `${path}道痕 ${delta >= 0 ? '+' : ''}${delta}。`, turn, {
      amount: delta,
      path,
      tags: ['dao_mark_shift', path],
    }));
  }
  if (guDamageIds.length > 0) {
    steps.push(step('gu_damage', `${guDamageIds.length} 只蛊虫被灾劫波及。`, turn, {
      amount: guDamageIds.length,
      tags: ['gu_damage'],
    }));
  }
  steps.push(step('settlement', `灾劫结算完成，下一劫预兆为${nextRule.name}。`, turn, {
    tags: ['settlement', 'calamity'],
  }));

  next.ascension.heavenWillPressure = clamp(next.ascension.heavenWillPressure + Math.round(rule.severity * 4), 0, 100);
  next.nextCalamityPreview = buildCalamityPreview({ state: next, store: { ...store, aperture, heavenlyLand }, turn });
  const record: CalamityRecord = {
    id: `cal_${turn}_${preview.id}`,
    turn,
    calamityId: preview.id,
    calamityName: preview.name,
    outcome: 'success',
    areaLoss,
    resourceNodeDamage: resourceDamage,
    daoMarkDelta: daoDelta,
    guDamageIds,
    steps,
  };
  next.calamityLedger = [record, ...next.calamityLedger].slice(0, 20);
  next.lastResolution = steps;
  return {
    success: true,
    state: next,
    steps,
    record,
    aperture,
    heavenlyLand,
    inventory: damagedInventory,
    preview: next.nextCalamityPreview,
  };
}
