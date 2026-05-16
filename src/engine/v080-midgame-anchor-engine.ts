import midgameAnchorRulesRaw from '../canon/v080-midgame-anchor-rules.json';
import {
  applyHeavenWillTrigger as applyNarrativeHeavenWillTrigger,
  getCanonAnchor,
  getCanonAnchors,
  getInitialHeavenWillLedger,
  validateAnchorMutation,
  validateEndingText,
  validateIfBranchCandidate as validateNarrativeIfBranchCandidate,
} from './v080-narrative-engine';
import type {
  CanonAnchor,
  CanonAnchorPressure,
  CanonAnchorResult,
  EndingResolverInput,
  FateState,
  HeavenWillLedger,
  HeavenWillTrigger,
  IfBranchAxis,
  IfBranchCandidate,
  IfBranchVector,
  KarmicReturn,
  KarmicDebtLedger,
  StoryAnchorCandidateRecord,
  StoryAnchorEntryValidation,
  StoryAnchorIfCandidateRecord,
  StoryAnchorRecord,
  StoryAnchorResolutionStep,
  StoryAnchorState,
  StoryEventCandidate,
  TimelineMode,
} from '../types';

type MidgameAnchorRules = typeof midgameAnchorRulesRaw & {
  anchorRules: Record<string, any>;
  candidateLimits: {
    maxStoryCandidates: number;
    maxIfCandidates: number;
    maxPressureLog: number;
    maxResolutionSteps: number;
  };
};

const rules = midgameAnchorRulesRaw as MidgameAnchorRules;

export const B3_MIDGAME_ANCHOR_IDS = [
  'yi_tian_mountain',
  'reverse_flow_river',
  'dream_shadow_sect',
  'fate_war',
] as const;

const FATE_STATES = new Set<FateState>(['intact', 'fractured', 'destroyed']);
const DIRECT_REWARD_KEYS = ['奖励', '掉落', '资源到账', '获得仙蛊', '获得宿命蛊'];
const KEY_NPC_DEATH_KEYS = ['方源死亡', '龙公死亡', '星宿死亡', '幽魂死亡', '凤九歌死亡', '关键NPC死亡', '关键 NPC 死亡'];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function readRealmGrand(store: any): number {
  return Number(store?.profile?.realm?.grand || store?.realm?.grand || 1);
}

function readMode(store: any, mode?: TimelineMode): TimelineMode {
  if (mode === 'if') return 'if';
  if (mode === 'canon') return 'canon';
  return store?.gameMode === 'if' ? 'if' : 'canon';
}

function makeStep(
  kind: StoryAnchorResolutionStep['kind'],
  message: string,
  input: {
    anchorId?: string;
    turn?: number;
    severity?: StoryAnchorResolutionStep['severity'];
    metadata?: Record<string, unknown>;
    index?: number;
  } = {},
): StoryAnchorResolutionStep {
  const turn = Number(input.turn || 0);
  const suffix = input.index ?? 0;
  return {
    id: `anchor_step_${turn}_${kind}_${input.anchorId || 'global'}_${suffix}`,
    kind,
    anchorId: input.anchorId,
    turn,
    message,
    severity: input.severity || 'info',
    metadata: input.metadata,
  };
}

function defaultAnchorResult(anchor: CanonAnchor): CanonAnchorResult {
  return {
    anchorId: anchor.id,
    status: 'unseen',
    canonDeviation: 0,
  };
}

function defaultAnchorRecord(anchor: CanonAnchor): StoryAnchorRecord {
  return {
    anchorId: anchor.id,
    status: 'locked',
    canonDeviation: 0,
    summary: anchor.displayName,
  };
}

function createDefaultKarmicDebtLedger(): KarmicDebtLedger {
  return {
    totalDebt: 0,
    byKind: {},
    pendingReturns: [],
  };
}

function normalizeFateState(value: unknown): FateState {
  return FATE_STATES.has(value as FateState) ? value as FateState : 'intact';
}

function mergeAnchorResults(input: any): Record<string, CanonAnchorResult> {
  const source = input && typeof input === 'object' ? input : {};
  return Object.fromEntries(getCanonAnchors().map(anchor => {
    const raw = source[anchor.id] || {};
    const status = ['unseen', 'active', 'resolved', 'missed', 'blocked'].includes(raw.status)
      ? raw.status
      : 'unseen';
    return [anchor.id, {
      ...defaultAnchorResult(anchor),
      ...raw,
      status,
      canonDeviation: clamp(Number(raw.canonDeviation || 0), 0, 100),
    }];
  }));
}

function mergeAnchorRecords(input: any): Record<string, StoryAnchorRecord> {
  const source = input && typeof input === 'object' ? input : {};
  return Object.fromEntries(getCanonAnchors().map(anchor => {
    const raw = source[anchor.id] || {};
    const status = ['locked', 'available', 'active', 'resolved', 'blocked'].includes(raw.status)
      ? raw.status
      : 'locked';
    return [anchor.id, {
      ...defaultAnchorRecord(anchor),
      ...raw,
      status,
      entryIssues: ensureArray(raw.entryIssues),
      canonDeviation: clamp(Number(raw.canonDeviation || 0), 0, 100),
    }];
  }));
}

function normalizeHeavenLedger(input: any): HeavenWillLedger {
  const initial = getInitialHeavenWillLedger();
  return {
    attention: clamp(Number(input?.attention ?? initial.attention), 0, 100),
    correction: clamp(Number(input?.correction ?? initial.correction), 0, 100),
    rejection: clamp(Number(input?.rejection ?? initial.rejection), 0, 100),
    ambiguity: clamp(Number(input?.ambiguity ?? initial.ambiguity), 0, 100),
    lastTriggers: ensureArray<HeavenWillTrigger>(input?.lastTriggers).slice(0, 8),
  };
}

function normalizeKarmicLedger(input: any): KarmicDebtLedger {
  const byKind = input?.byKind && typeof input.byKind === 'object' ? input.byKind : {};
  const normalizedByKind = Object.fromEntries(
    Object.entries(byKind).map(([key, value]) => [key, clamp(Number(value || 0), 0, 999)]),
  );
  return {
    totalDebt: clamp(Number(input?.totalDebt ?? Object.values(normalizedByKind).reduce((sum: number, value: any) => sum + Number(value || 0), 0)), 0, 9999),
    byKind: normalizedByKind,
    pendingReturns: ensureArray<KarmicReturn>(input?.pendingReturns).slice(0, 20),
  };
}

function hasForbiddenAssertion(text: string): string[] {
  const configured = ensureArray(rules.forbiddenRuntimeAssertions as string[]);
  const fromEndingRules = validateEndingText(text);
  return [...new Set([...configured.filter(phrase => text.includes(phrase)), ...fromEndingRules])];
}

function hasKeyNpcDeathAttempt(text: string): string[] {
  return KEY_NPC_DEATH_KEYS.filter(phrase => text.includes(phrase));
}

function hasDirectRewardAttempt(text: string): string[] {
  return DIRECT_REWARD_KEYS.filter(phrase => text.includes(phrase));
}

function getRule(anchorId: string): any {
  return rules.anchorRules?.[anchorId] || {};
}

function getAnchorRequiredRealm(anchor: CanonAnchor, rule: any): number {
  return Number(rule?.entry?.minRealm ?? anchor.requiredState?.minRealm ?? 1);
}

function anchorAllowsMode(anchor: CanonAnchor, rule: any, mode: TimelineMode): boolean {
  const allowed = ensureArray(rule?.entry?.allowedModes || anchor.requiredState?.modeAvailable);
  return allowed.length === 0 || allowed.includes(mode);
}

function evaluateEntryStatus(anchor: CanonAnchor, rule: any, store: any, mode: TimelineMode): StoryAnchorEntryValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  const requiredRealm = getAnchorRequiredRealm(anchor, rule);
  const realmGrand = readRealmGrand(store);

  if (!B3_MIDGAME_ANCHOR_IDS.includes(anchor.id as any)) {
    warnings.push('该锚点只保留后续入口，b3 不做完整运行时结算。');
  }
  if (realmGrand < requiredRealm) {
    issues.push(`境界不足：需要至少 ${requiredRealm} 转。`);
  }
  if (!anchorAllowsMode(anchor, rule, mode)) {
    issues.push(`${mode} 模式不可进入该锚点。`);
  }
  if (mode === 'canon' && anchor.canonStatus === 'if_only') {
    issues.push('正史模式不能直接进入 IF-only 锚点。');
  }

  return {
    anchorId: anchor.id,
    allowed: issues.length === 0,
    status: issues.length > 0 ? 'locked' : 'available',
    issues,
    warnings,
    requiredRealm,
    mode,
    recommendedRole: mode === 'if'
      ? rule?.entry?.recommendedIfRole || anchor.playerRoleIf
      : rule?.entry?.recommendedCanonRole || anchor.playerRoleCanon,
  };
}

function upsertAnchorRecord(
  state: StoryAnchorState,
  anchorId: string,
  patch: Partial<StoryAnchorRecord>,
): Record<string, StoryAnchorRecord> {
  const anchor = getCanonAnchor(anchorId);
  const current = state.anchorRecords[anchorId] || (anchor ? defaultAnchorRecord(anchor) : {
    anchorId,
    status: 'locked',
    canonDeviation: 0,
  });
  return {
    ...state.anchorRecords,
    [anchorId]: {
      ...current,
      ...patch,
      canonDeviation: clamp(Number(patch.canonDeviation ?? current.canonDeviation ?? 0), 0, 100),
    },
  };
}

function upsertAnchorResult(
  state: StoryAnchorState,
  anchorId: string,
  patch: Partial<CanonAnchorResult>,
): Record<string, CanonAnchorResult> {
  const anchor = getCanonAnchor(anchorId);
  const current = state.anchorResults[anchorId] || (anchor ? defaultAnchorResult(anchor) : {
    anchorId,
    status: 'unseen',
    canonDeviation: 0,
  });
  return {
    ...state.anchorResults,
    [anchorId]: {
      ...current,
      ...patch,
      anchorId,
      canonDeviation: clamp(Number(patch.canonDeviation ?? current.canonDeviation ?? 0), 0, 100),
    },
  };
}

function addKarmicDebt(
  ledger: KarmicDebtLedger,
  kind: string,
  amount: number,
  turn: number,
  hint: string,
): KarmicDebtLedger {
  const current = Number(ledger.byKind?.[kind] || 0);
  const nextAmount = Math.max(0, current + amount);
  const byKind = { ...(ledger.byKind || {}), [kind]: nextAmount };
  return {
    totalDebt: Object.values(byKind).reduce((sum, value) => sum + Number(value || 0), 0),
    byKind,
    pendingReturns: [
      {
        id: `karma_${turn}_${kind}_${ensureArray(ledger.pendingReturns).length}`,
        sourceEventId: `story_anchor_${turn}`,
        expectedWindow: [turn + 3, turn + 12] as [number, number],
        severity: (amount >= 20 ? 'high' : amount >= 10 ? 'medium' : 'low') as KarmicReturn['severity'],
        narrativeHint: hint,
        resolved: false,
      },
      ...ensureArray<KarmicReturn>(ledger.pendingReturns),
    ].slice(0, 20),
  };
}

function buildHeavenTriggerForAxis(axis: IfBranchAxis, turn: number, anchorId: string, delta: number): HeavenWillTrigger {
  if (axis === 'venerable_balance') {
    return { kind: 'venerable_contact', delta: Math.abs(delta), reason: 'IF 尊者平衡偏移', anchorId, turn };
  }
  if (axis === 'break_fate' || axis === 'protect_fate') {
    return { kind: 'fate_mutation', delta: Math.abs(delta), reason: 'IF 宿命轴偏移', anchorId, turn };
  }
  if (axis === 'resource_control') {
    return { kind: 'inheritance_seized', delta: Math.max(1, Math.abs(delta) / 2), reason: 'IF 资源控制偏移', anchorId, turn };
  }
  return { kind: 'chaos_contact', delta: Math.max(1, Math.abs(delta) / 3), reason: 'IF 支线偏移', anchorId, turn };
}

export function createDefaultStoryAnchorState(overrides: Partial<StoryAnchorState> = {}): StoryAnchorState {
  const anchors = getCanonAnchors();
  const base: StoryAnchorState = {
    version: 'v0.8.0-b3',
    fateState: 'intact',
    currentAnchorId: null,
    anchorResults: Object.fromEntries(anchors.map(anchor => [anchor.id, defaultAnchorResult(anchor)])),
    anchorRecords: Object.fromEntries(anchors.map(anchor => [anchor.id, defaultAnchorRecord(anchor)])),
    ifBranchVectors: [],
    heavenWillLedger: getInitialHeavenWillLedger(),
    karmicDebtLedger: createDefaultKarmicDebtLedger(),
    storyEventCandidates: [],
    ifBranchCandidates: [],
    canonAnchorPressureLog: [],
    lastResolutionSteps: [],
  };
  return normalizeStoryAnchorState({ ...base, ...overrides });
}

export function normalizeStoryAnchorState(input?: Partial<StoryAnchorState> | null, legacyFlags: Record<string, any> = {}): StoryAnchorState {
  const raw = input && typeof input === 'object' ? input as any : {};
  const currentAnchorId = raw.currentAnchorId ?? legacyFlags.currentCanonAnchorId ?? null;
  return {
    version: 'v0.8.0-b3',
    fateState: normalizeFateState(raw.fateState ?? legacyFlags.fateState),
    currentAnchorId: typeof currentAnchorId === 'string' && currentAnchorId.length > 0 ? currentAnchorId : null,
    anchorResults: mergeAnchorResults(raw.anchorResults),
    anchorRecords: mergeAnchorRecords(raw.anchorRecords),
    ifBranchVectors: ensureArray<IfBranchVector>(raw.ifBranchVectors ?? legacyFlags.ifBranchVectors).slice(-80),
    heavenWillLedger: normalizeHeavenLedger(raw.heavenWillLedger ?? legacyFlags.heavenWillLedger),
    karmicDebtLedger: normalizeKarmicLedger(raw.karmicDebtLedger ?? legacyFlags.karmicDebtLedger),
    storyEventCandidates: ensureArray(raw.storyEventCandidates ?? legacyFlags.storyEventCandidates).slice(-rules.candidateLimits.maxStoryCandidates).map((candidate: any, index) => ({
      ...candidate,
      id: candidate.id || `story_candidate_migrated_${index}`,
      source: candidate.source || 'ai-rumor',
      engineValidation: candidate.engineValidation || 'pending',
      validationIssues: ensureArray(candidate.validationIssues),
      createdTurn: Number(candidate.createdTurn || 0),
    })),
    ifBranchCandidates: ensureArray(raw.ifBranchCandidates ?? legacyFlags.ifBranchCandidates).slice(-rules.candidateLimits.maxIfCandidates).map((candidate: any, index) => ({
      ...candidate,
      id: candidate.id || `if_candidate_migrated_${index}`,
      source: candidate.source || 'ai-rumor',
      engineValidation: candidate.engineValidation || 'pending',
      validationIssues: ensureArray(candidate.validationIssues),
      createdTurn: Number(candidate.createdTurn || 0),
      downstreamHint: ensureArray(candidate.downstreamHint),
    })),
    canonAnchorPressureLog: ensureArray<CanonAnchorPressure & { id?: string; createdTurn?: number; chapterId?: string; domain?: string }>(raw.canonAnchorPressureLog ?? legacyFlags.canonAnchorPressureLog).slice(-rules.candidateLimits.maxPressureLog),
    lastResolutionSteps: ensureArray<StoryAnchorResolutionStep>(raw.lastResolutionSteps).slice(-rules.candidateLimits.maxResolutionSteps),
  };
}

export function evaluateStoryAnchorEntry(input: {
  state?: Partial<StoryAnchorState> | null;
  store?: any;
  anchorId: string;
  mode?: TimelineMode;
}): StoryAnchorEntryValidation {
  const anchor = getCanonAnchor(input.anchorId);
  const mode = readMode(input.store, input.mode);
  if (!anchor) {
    return {
      anchorId: input.anchorId,
      allowed: false,
      status: 'blocked',
      issues: [`未知剧情锚点：${input.anchorId}`],
      warnings: [],
      mode,
      recommendedRole: '降级为传闻或待登记线索。',
    };
  }
  return evaluateEntryStatus(anchor, getRule(anchor.id), input.store, mode);
}

export function validateStoryEventCandidate(input: {
  candidate: StoryEventCandidate;
  state?: Partial<StoryAnchorState> | null;
  store?: any;
  mode?: TimelineMode;
}): StoryAnchorCandidateRecord {
  const state = normalizeStoryAnchorState(input.state, input.store?.flags || {});
  const mode = readMode(input.store, input.mode);
  const candidate = input.candidate || {} as StoryEventCandidate;
  const anchorId = candidate.anchorId || state.currentAnchorId || '';
  const anchor = anchorId ? getCanonAnchor(anchorId) : undefined;
  const summary = `${candidate.title || ''} ${candidate.summary || ''}`;
  const issues: string[] = [];
  let validation: StoryAnchorCandidateRecord['engineValidation'] = 'accepted';
  let resolutionHint = '可作为本地剧情候选进入后续叙事。';

  if (!candidate.title || !candidate.summary) {
    issues.push('候选缺少 title 或 summary。');
  }
  if (anchorId && !anchor) {
    issues.push(`未知剧情锚点：${anchorId}`);
  }

  const forbidden = hasForbiddenAssertion(summary);
  const keyNpcDeath = hasKeyNpcDeathAttempt(summary);
  const directReward = hasDirectRewardAttempt(summary);
  if (forbidden.length > 0) issues.push(`包含禁区断言：${forbidden.join('、')}`);
  if (keyNpcDeath.length > 0) issues.push(`疑似直接宣告关键 NPC 生死：${keyNpcDeath.join('、')}`);
  if (directReward.length > 0) issues.push(`疑似直接写正式奖励或资源损益：${directReward.join('、')}`);

  if (anchor && mode === 'canon') {
    const pressure = validateAnchorMutation(mode, anchor.id, summary);
    if (pressure.engineDecision === 'block') {
      issues.push(pressure.reason);
      resolutionHint = pressure.fallbackNarrativeHint;
    } else if (pressure.engineDecision === 'redirect') {
      validation = 'accepted';
      resolutionHint = pressure.fallbackNarrativeHint;
    }
  }

  if (issues.length > 0) {
    validation = 'blocked';
    resolutionHint = '降级为传闻、压力或待审线索，不执行正式结果。';
  }

  return {
    ...candidate,
    id: candidate.id || `story_candidate_${Number(input.store?.turn || 0)}_${state.storyEventCandidates.length}`,
    anchorId: anchorId || candidate.anchorId,
    source: candidate.source || 'ai-rumor',
    engineValidation: validation,
    validationIssues: issues,
    createdTurn: Number(input.store?.turn || 0),
    chapterId: input.store?.currentChapterId || '',
    domain: input.store?.currentDomain || '',
    resolutionHint,
  };
}

export function resolveStoryEventCandidate(input: {
  state?: Partial<StoryAnchorState> | null;
  store?: any;
  candidate: StoryEventCandidate;
  mode?: TimelineMode;
}): { state: StoryAnchorState; record: StoryAnchorCandidateRecord; steps: StoryAnchorResolutionStep[] } {
  const state = normalizeStoryAnchorState(input.state, input.store?.flags || {});
  const record = validateStoryEventCandidate({ ...input, state });
  const turn = Number(input.store?.turn || record.createdTurn || 0);
  const nextState: StoryAnchorState = {
    ...state,
    currentAnchorId: record.anchorId || state.currentAnchorId,
    storyEventCandidates: [...state.storyEventCandidates, record].slice(-rules.candidateLimits.maxStoryCandidates),
  };

  if (record.anchorId) {
    nextState.anchorRecords = upsertAnchorRecord(nextState, record.anchorId, {
      status: record.engineValidation === 'blocked' ? 'blocked' : 'active',
      firstSeenTurn: nextState.anchorRecords[record.anchorId]?.firstSeenTurn ?? turn,
      lastUpdatedTurn: turn,
      entryIssues: record.validationIssues,
      summary: record.title,
    });
    nextState.anchorResults = upsertAnchorResult(nextState, record.anchorId, {
      status: record.engineValidation === 'blocked' ? 'blocked' : 'active',
      summary: record.summary,
      canonDeviation: record.engineValidation === 'blocked' ? 100 : nextState.anchorResults[record.anchorId]?.canonDeviation || 0,
    });
  }

  const steps = [
    makeStep(record.engineValidation === 'blocked' ? 'block' : 'candidate', record.engineValidation === 'blocked'
      ? `剧情候选被本地引擎拦截：${record.title}`
      : `剧情候选已登记：${record.title}`, {
      anchorId: record.anchorId,
      turn,
      severity: record.engineValidation === 'blocked' ? 'danger' : 'success',
      metadata: { issues: record.validationIssues, hint: record.resolutionHint },
    }),
  ];
  nextState.lastResolutionSteps = steps;
  return { state: nextState, record, steps };
}

export function resolveIfBranchCandidate(input: {
  state?: Partial<StoryAnchorState> | null;
  store?: any;
  candidate: IfBranchCandidate;
  mode?: TimelineMode;
}): { state: StoryAnchorState; record: StoryAnchorIfCandidateRecord; vector?: IfBranchVector; steps: StoryAnchorResolutionStep[] } {
  const state = normalizeStoryAnchorState(input.state, input.store?.flags || {});
  const mode = readMode(input.store, input.mode);
  const turn = Number(input.store?.turn || 0);
  const verdict = validateNarrativeIfBranchCandidate(input.candidate, mode);
  const record: StoryAnchorIfCandidateRecord = {
    ...input.candidate,
    id: input.candidate.id || `if_candidate_${turn}_${state.ifBranchCandidates.length}`,
    source: input.candidate.source || 'ai-rumor',
    engineValidation: verdict.accepted ? 'accepted' : 'blocked',
    validationIssues: verdict.issues,
    createdTurn: turn,
    chapterId: input.store?.currentChapterId || '',
    domain: input.store?.currentDomain || '',
    downstreamHint: ensureArray(input.candidate.downstreamHint),
  };

  let nextState: StoryAnchorState = {
    ...state,
    currentAnchorId: input.candidate.anchorId || state.currentAnchorId,
    ifBranchCandidates: [...state.ifBranchCandidates, record].slice(-rules.candidateLimits.maxIfCandidates),
  };
  const steps: StoryAnchorResolutionStep[] = [];

  if (verdict.vector) {
    const vector = { ...verdict.vector, id: record.id, createdTurn: turn };
    const trigger = buildHeavenTriggerForAxis(vector.axis, turn, vector.anchorId, vector.delta);
    const heaven = applyNarrativeHeavenWillTrigger(nextState.heavenWillLedger, trigger);
    const debtKind = String((rules.ifAxisCosts as any)?.[vector.axis]?.[0] || vector.axis);
    nextState = {
      ...nextState,
      ifBranchVectors: [...nextState.ifBranchVectors, vector].slice(-80),
      heavenWillLedger: heaven,
      karmicDebtLedger: addKarmicDebt(nextState.karmicDebtLedger, debtKind, Math.max(1, Math.abs(vector.delta)), turn, vector.cost),
      anchorRecords: upsertAnchorRecord(nextState, vector.anchorId, {
        status: 'active',
        lastUpdatedTurn: turn,
        canonDeviation: Math.min(100, Math.abs(vector.delta)),
        summary: input.candidate.summary,
      }),
      anchorResults: upsertAnchorResult(nextState, vector.anchorId, {
        status: 'active',
        canonDeviation: Math.min(100, Math.abs(vector.delta)),
        summary: input.candidate.summary,
      }),
    };
    steps.push(
      makeStep('if_vector', `IF 向量已登记：${vector.anchorId}/${vector.axis} ${vector.delta}`, {
        anchorId: vector.anchorId,
        turn,
        severity: 'warning',
        metadata: { vector },
      }),
      makeStep('heaven_will', '天意账本已因 IF 偏移增加压力。', {
        anchorId: vector.anchorId,
        turn,
        severity: 'warning',
        metadata: { trigger, ledger: heaven },
      }),
      makeStep('karmic_debt', `因果债已登记：${debtKind}`, {
        anchorId: vector.anchorId,
        turn,
        severity: 'warning',
        metadata: { debtKind },
      }),
    );
    nextState.lastResolutionSteps = steps.slice(-rules.candidateLimits.maxResolutionSteps);
    return { state: nextState, record, vector, steps };
  }

  steps.push(makeStep('block', `IF 候选被拦截：${input.candidate.summary || input.candidate.axis}`, {
    anchorId: input.candidate.anchorId,
    turn,
    severity: 'danger',
    metadata: { issues: verdict.issues },
  }));
  nextState.lastResolutionSteps = steps;
  return { state: nextState, record, steps };
}

export function recordCanonAnchorPressure(input: {
  state?: Partial<StoryAnchorState> | null;
  store?: any;
  pressure: CanonAnchorPressure;
  mode?: TimelineMode;
}): { state: StoryAnchorState; record: CanonAnchorPressure & { id: string; createdTurn: number; chapterId?: string; domain?: string }; steps: StoryAnchorResolutionStep[] } {
  const state = normalizeStoryAnchorState(input.state, input.store?.flags || {});
  const mode = readMode(input.store, input.mode);
  const turn = Number(input.store?.turn || 0);
  const raw = input.pressure;
  const validated = raw?.anchorId && raw?.attemptedMutation
    ? validateAnchorMutation(mode, raw.anchorId, raw.attemptedMutation)
    : raw;
  const forbidden = hasForbiddenAssertion(String(raw?.attemptedMutation || ''));
  const engineDecision = forbidden.length > 0 ? 'block' : validated.engineDecision;
  const record = {
    ...validated,
    pressure: Math.max(Number(validated.pressure || 0), forbidden.length > 0 ? 100 : 0),
    engineDecision,
    id: `anchor_pressure_${turn}_${state.canonAnchorPressureLog.length}`,
    createdTurn: turn,
    chapterId: input.store?.currentChapterId || '',
    domain: input.store?.currentDomain || '',
  };
  const steps = [makeStep(engineDecision === 'block' ? 'block' : 'pressure', `正史锚点压力已记录：${record.anchorId}`, {
    anchorId: record.anchorId,
    turn,
    severity: engineDecision === 'block' ? 'danger' : 'warning',
    metadata: { pressure: record.pressure, decision: record.engineDecision, forbidden },
  })];
  const nextState = {
    ...state,
    currentAnchorId: record.anchorId || state.currentAnchorId,
    canonAnchorPressureLog: [...state.canonAnchorPressureLog, record].slice(-rules.candidateLimits.maxPressureLog),
    anchorRecords: upsertAnchorRecord(state, record.anchorId, {
      status: engineDecision === 'block' ? 'blocked' : 'active',
      lastUpdatedTurn: turn,
      entryIssues: [record.reason],
      canonDeviation: record.pressure,
    }),
    anchorResults: upsertAnchorResult(state, record.anchorId, {
      status: engineDecision === 'block' ? 'blocked' : 'active',
      canonDeviation: record.pressure,
      summary: record.attemptedMutation,
    }),
    lastResolutionSteps: steps,
  };
  return { state: nextState, record, steps };
}

export function applyHeavenWillTrigger(input: {
  state?: Partial<StoryAnchorState> | null;
  store?: any;
  trigger: HeavenWillTrigger;
}): { state: StoryAnchorState; steps: StoryAnchorResolutionStep[] } {
  const state = normalizeStoryAnchorState(input.state, input.store?.flags || {});
  const ledger = applyNarrativeHeavenWillTrigger(state.heavenWillLedger, input.trigger);
  const steps = [makeStep('heaven_will', `天意触发：${input.trigger.reason}`, {
    anchorId: input.trigger.anchorId,
    turn: input.trigger.turn,
    severity: 'warning',
    metadata: { trigger: input.trigger, ledger },
  })];
  return {
    state: {
      ...state,
      heavenWillLedger: ledger,
      lastResolutionSteps: steps,
    },
    steps,
  };
}

export function buildEndingResolverInput(input: {
  state?: Partial<StoryAnchorState> | null;
  store?: any;
}): EndingResolverInput {
  const state = normalizeStoryAnchorState(input.state, input.store?.flags || {});
  const store = input.store || {};
  return {
    gameMode: readMode(store),
    fateState: state.fateState,
    anchorResults: state.anchorResults,
    ifBranchVectors: state.ifBranchVectors,
    heavenWillLedger: state.heavenWillLedger,
    karmicDebtLedger: state.karmicDebtLedger,
    playerFactionScore: Number(store.playerFaction?.reputation || store.flags?.playerFactionScore || 0),
    fangYuanRelation: store.flags?.fangYuanRelation || 'unknown',
    venerableBalance: store.flags?.venerableBalance || {},
    daoHeart: store.daoHeart || { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
    playerSurvived: store.isDead !== true,
  };
}
