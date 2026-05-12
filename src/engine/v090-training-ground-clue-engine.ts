import trainingGroundsRaw from '../canon/training-grounds.json';
import type {
  CombatEventCandidate,
  CombatEncounterScale,
  TrainingGroundCandidateInput,
  TrainingGroundCandidateSource,
  TrainingGroundClueRecord,
  TrainingGroundClueStatus,
  TrainingGroundResolutionStep,
  TrainingGroundState,
} from '../types';
import {
  resolveTrainingGroundSession,
  type TrainingGroundContext,
  type TrainingGroundSessionResolution,
  type TrainingGroundSpec,
} from './training-ground-engine';

const VERSION: TrainingGroundState['version'] = 'v0.9.0-a2';
const CLUE_LIMIT = 40;
const STEP_LIMIT = 40;
const DEFAULT_RISK: TrainingGroundClueRecord['risk'] = 'medium';
const DEFAULT_SOURCE: TrainingGroundCandidateSource = 'ai-rumor';

const FORBIDDEN_RUNTIME_TERMS = [
  '十转',
  '永生蛊',
  '真正永生',
  '宿命蛊归属',
  '玩家获得宿命蛊',
  '普通战斗击杀尊者',
  '仙蛊掉落',
  '稳定获得仙蛊',
  'Immortal Gu',
  'Eternal Life Gu',
  'rank ten',
  'true immortality',
  'Fate Gu ownership',
];

export interface TrainingGroundCandidateValidation {
  valid: boolean;
  ground: TrainingGroundSpec | null;
  clue: TrainingGroundClueRecord | null;
  blockers: string[];
  warnings: string[];
  downgradedTo?: 'clue' | 'rumor' | 'blocked';
}

export interface TrainingGroundStageResolution {
  state: TrainingGroundState;
  validation: TrainingGroundCandidateValidation;
  steps: TrainingGroundResolutionStep[];
}

export interface TrainingGroundEntryView {
  ground: TrainingGroundSpec;
  clue: TrainingGroundClueRecord | null;
  status: 'available' | 'blocked' | 'missing_clue' | 'cooldown' | 'realm_blocked' | 'location_mismatch' | 'beast_library_pending';
  canDisplay: boolean;
  canEnter: boolean;
  actionKind: 'train' | 'duel' | 'trial' | 'hunt';
  blockers: string[];
  warnings: string[];
  recommendedActions: string[];
  routeHint?: CombatEncounterScale;
  apCost: number;
  debugOnly: boolean;
}

export interface TrainingGroundActionResolution {
  success: boolean;
  message: string;
  state: TrainingGroundState;
  entry: TrainingGroundEntryView | null;
  steps: TrainingGroundResolutionStep[];
  session?: TrainingGroundSessionResolution;
  combatCandidate?: CombatEventCandidate;
}

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function currentTurn(store: any): number {
  return Number(store?.turn || 1);
}

function currentSceneId(store: any): string {
  return String(
    store?.sceneSessionState?.sceneId
      || store?.currentChapterId
      || store?.flags?.currentSceneId
      || 'current_scene',
  );
}

function remainingSceneAp(store: any): number {
  const budget = store?.sceneSessionState?.actionBudget;
  if (Number.isFinite(budget?.remainingAp)) return Number(budget.remainingAp);
  if (Number.isFinite(budget?.remaining)) return Number(budget.remaining);
  if (Number.isFinite(store?.gameTime?.ap)) return Number(store.gameTime.ap);
  return 0;
}

function normalizeRisk(value: unknown): TrainingGroundClueRecord['risk'] {
  return value === 'low' || value === 'medium' || value === 'high' ? value : DEFAULT_RISK;
}

function normalizeSource(value: unknown): TrainingGroundCandidateSource {
  return value === 'engine'
    || value === 'player_choice'
    || value === 'location'
    || value === 'faction'
    || value === 'inheritance'
    || value === 'blessed_land'
    || value === 'ai-rumor'
    ? value
    : DEFAULT_SOURCE;
}

function normalizeStatus(value: unknown): TrainingGroundClueStatus {
  return value === 'active' || value === 'resolved' || value === 'blocked' || value === 'expired' || value === 'clue'
    ? value
    : 'clue';
}

function actionKindForGround(ground: TrainingGroundSpec): TrainingGroundEntryView['actionKind'] {
  if (ground.type === '对决') return 'duel';
  if (ground.type === '试炼') return 'trial';
  if (ground.type === 'hunt') return 'hunt';
  return 'train';
}

function routeHintForGround(ground: TrainingGroundSpec): CombatEncounterScale | undefined {
  const kind = actionKindForGround(ground);
  if (kind === 'duel') return 'duel';
  if (kind === 'trial') return 'battlefield_5x3';
  if (kind === 'hunt') return 'group_7x5';
  return undefined;
}

function defaultApCost(ground: TrainingGroundSpec, clue?: TrainingGroundClueRecord | null): number {
  if (Number.isFinite(clue?.apCostHint)) return Math.max(0, Number(clue?.apCostHint));
  if (ground.type === '磨练') return 1;
  if (ground.type === '对决') return 1;
  if (ground.type === '试炼') return 1;
  return 1;
}

function makeStep(
  kind: TrainingGroundResolutionStep['kind'],
  message: string,
  options: Partial<TrainingGroundResolutionStep> = {},
): TrainingGroundResolutionStep {
  const turn = Number(options.turn || 1);
  const groundId = options.groundId;
  const clueId = options.clueId;
  return {
    id: String(options.id || `training_${kind}_${turn}_${groundId || clueId || hashText(message)}`),
    turn,
    kind,
    groundId,
    clueId,
    message,
    severity: options.severity || (kind === 'failure' || kind === 'blocked' ? 'warning' : 'info'),
    metadata: options.metadata,
  };
}

function limitSteps(steps: TrainingGroundResolutionStep[]): TrainingGroundResolutionStep[] {
  return steps.slice(-STEP_LIMIT);
}

function normalizeClue(raw: any): TrainingGroundClueRecord | null {
  if (!raw?.groundId) return null;
  const ground = getTrainingGroundSpec(String(raw.groundId));
  const title = String(raw.title || ground?.name || raw.groundId);
  return {
    id: String(raw.id || `tg_clue_${raw.groundId}_${raw.createdTurn || 0}_${hashText(title)}`),
    groundId: String(raw.groundId),
    title,
    summary: String(raw.summary || ground?.description || '道场线索等待剧情承接。'),
    locationHint: String(raw.locationHint || ground?.domain || ''),
    source: normalizeSource(raw.source),
    risk: normalizeRisk(raw.risk),
    apCostHint: Number.isFinite(raw.apCostHint) ? Math.max(0, Number(raw.apCostHint)) : defaultApCost(ground || ({ type: '磨练' } as TrainingGroundSpec)),
    sceneTags: ensureArray(raw.sceneTags).map(String),
    status: normalizeStatus(raw.status),
    blockers: ensureArray(raw.blockers).map(String),
    warnings: ensureArray(raw.warnings).map(String),
    createdTurn: Number(raw.createdTurn || 1),
    updatedTurn: Number(raw.updatedTurn || raw.createdTurn || 1),
    expiresTurn: Number.isFinite(raw.expiresTurn) ? Number(raw.expiresTurn) : undefined,
  };
}

function forbiddenHits(input: TrainingGroundCandidateInput): string[] {
  const text = `${input.title || ''}\n${input.summary || ''}\n${input.unlockReason || ''}`;
  return FORBIDDEN_RUNTIME_TERMS.filter(term => text.toLowerCase().includes(term.toLowerCase()));
}

export function listTrainingGroundSpecs(): TrainingGroundSpec[] {
  return ensureArray((trainingGroundsRaw as any).grounds).map((ground: any) => ({ ...ground }));
}

export function getTrainingGroundSpec(groundId: string): TrainingGroundSpec | null {
  return listTrainingGroundSpecs().find(ground => ground.id === groundId) || null;
}

export function createDefaultTrainingGroundState(): TrainingGroundState {
  return {
    version: VERSION,
    clues: [],
    unlockedGroundIds: [],
    activeGroundId: null,
    cooldowns: {},
    blockedRecords: [],
    lastResolutionSteps: [],
  };
}

export function normalizeTrainingGroundState(input?: Partial<TrainingGroundState> | null): TrainingGroundState {
  const base = createDefaultTrainingGroundState();
  const clues = ensureArray(input?.clues).map(normalizeClue).filter(Boolean) as TrainingGroundClueRecord[];
  const cooldowns = input?.cooldowns && typeof input.cooldowns === 'object' ? input.cooldowns : {};
  return {
    ...base,
    ...input,
    version: VERSION,
    clues: clues.slice(-CLUE_LIMIT),
    unlockedGroundIds: unique(ensureArray(input?.unlockedGroundIds).map(String)),
    activeGroundId: input?.activeGroundId ? String(input.activeGroundId) : null,
    cooldowns: Object.fromEntries(Object.entries(cooldowns).map(([key, value]) => [key, Number(value) || 0])),
    blockedRecords: limitSteps(ensureArray(input?.blockedRecords)),
    lastResolutionSteps: limitSteps(ensureArray(input?.lastResolutionSteps)),
  };
}

export function buildTrainingGroundContextFromStore(store: any): TrainingGroundContext {
  const state = normalizeTrainingGroundState(store?.trainingGroundState);
  return {
    realmGrand: Number(store?.profile?.realm?.grand || 1),
    isImmortal: Number(store?.profile?.realm?.grand || 1) >= 6,
    currentChapterId: store?.currentChapterId || undefined,
    primaryPath: store?.pathBuild?.primary || store?.primaryPath || undefined,
    secondaryPaths: store?.pathBuild?.secondary || store?.secondaryPaths || [],
    cooldowns: { ...(store?.flags?.trainingCooldowns || {}), ...state.cooldowns },
    turn: currentTurn(store),
    aptitude: Number(store?.attributes?.资质 || store?.attributes?.['资质'] || 5),
    currency: Number(store?.currency || 0),
    immortalCurrency: Number(store?.immortalCurrency || 0),
  };
}

export function evaluateTrainingGroundCandidate(
  input: TrainingGroundCandidateInput,
  store: any = {},
): TrainingGroundCandidateValidation {
  const ground = getTrainingGroundSpec(input.groundId);
  if (!ground) {
    return {
      valid: false,
      ground: null,
      clue: null,
      blockers: [`未知道场 groundId: ${input.groundId}`],
      warnings: [],
      downgradedTo: 'rumor',
    };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  const hits = forbiddenHits(input);
  if (hits.length > 0) blockers.push(`触及运行时禁区: ${hits.slice(0, 4).join('、')}`);
  if (ground.type === 'hunt') {
    blockers.push('hunt 道场等待 v0.9.0-a3 荒兽/兽群敌库，a2 不结算狩猎掉落。');
    warnings.push('荒兽寄生蛊、仙蛊、稳定蛊虫掉落均不得由剧情线索直接写入。');
  }

  const turn = currentTurn(store);
  const status: TrainingGroundClueStatus = blockers.length > 0 ? 'blocked' : 'clue';
  const clue: TrainingGroundClueRecord = {
    id: String(input.id || `tg_clue_${ground.id}_${turn}_${hashText(`${input.title || ground.name}:${input.summary || ''}`)}`),
    groundId: ground.id,
    title: String(input.title || ground.name),
    summary: String(input.summary || ground.description || '道场线索等待剧情承接。'),
    locationHint: String(input.locationHint || ground.domain || ''),
    source: normalizeSource(input.source),
    risk: normalizeRisk(input.risk),
    apCostHint: Number.isFinite(input.apCostHint) ? Math.max(0, Number(input.apCostHint)) : defaultApCost(ground),
    sceneTags: ensureArray(input.sceneTags).map(String),
    status,
    blockers,
    warnings,
    createdTurn: turn,
    updatedTurn: turn,
    expiresTurn: Number.isFinite(input.expiresTurn) ? Number(input.expiresTurn) : undefined,
  };

  return {
    valid: blockers.length === 0,
    ground,
    clue,
    blockers,
    warnings,
    downgradedTo: blockers.length > 0 ? 'blocked' : undefined,
  };
}

export function stageTrainingGroundCandidate(
  stateInput: Partial<TrainingGroundState> | null | undefined,
  input: TrainingGroundCandidateInput,
  store: any = {},
): TrainingGroundStageResolution {
  const state = normalizeTrainingGroundState(stateInput);
  const validation = evaluateTrainingGroundCandidate(input, store);
  const turn = currentTurn(store);
  const steps: TrainingGroundResolutionStep[] = [];

  if (!validation.clue || !validation.ground) {
    steps.push(makeStep('failure', validation.blockers.join('；') || '道场候选无法登记。', {
      turn,
      severity: 'warning',
      metadata: { input },
    }));
    return {
      validation,
      steps,
      state: normalizeTrainingGroundState({
        ...state,
        blockedRecords: limitSteps([...state.blockedRecords, ...steps]),
        lastResolutionSteps: steps,
      }),
    };
  }

  const clue = validation.clue;
  steps.push(makeStep(validation.valid ? 'candidate' : 'blocked', validation.valid
    ? `道场线索已登记: ${clue.title}`
    : `道场线索被本地降级: ${clue.title}`,
  {
    turn,
    groundId: clue.groundId,
    clueId: clue.id,
    severity: validation.valid ? 'success' : 'warning',
    metadata: { blockers: validation.blockers, warnings: validation.warnings },
  }));

  const nextClues = [
    ...state.clues.filter(item => item.id !== clue.id && item.groundId !== clue.groundId),
    clue,
  ].slice(-CLUE_LIMIT);
  return {
    validation,
    steps,
    state: normalizeTrainingGroundState({
      ...state,
      clues: nextClues,
      unlockedGroundIds: validation.valid ? unique([...state.unlockedGroundIds, clue.groundId]) : state.unlockedGroundIds,
      blockedRecords: validation.valid ? state.blockedRecords : limitSteps([...state.blockedRecords, ...steps]),
      lastResolutionSteps: steps,
    }),
  };
}

function findClue(state: TrainingGroundState, groundId: string): TrainingGroundClueRecord | null {
  return state.clues.find(clue => clue.groundId === groundId && clue.status !== 'expired') || null;
}

export function evaluateTrainingGroundEntry(
  stateInput: Partial<TrainingGroundState> | null | undefined,
  groundId: string,
  store: any = {},
): TrainingGroundEntryView {
  const state = normalizeTrainingGroundState(stateInput);
  const ground = getTrainingGroundSpec(groundId);
  if (!ground) {
    const fallback = { id: groundId, name: groundId, type: '磨练', pathType: '', domain: '', baseYield: 0, tier: 0, cooldownTurns: 0 } as TrainingGroundSpec;
    return {
      ground: fallback,
      clue: null,
      status: 'blocked',
      canDisplay: false,
      canEnter: false,
      actionKind: 'train',
      blockers: [`未知道场 groundId: ${groundId}`],
      warnings: [],
      recommendedActions: ['等待剧情给出已登记的道场线索。'],
      apCost: 0,
      debugOnly: false,
    };
  }

  const context = buildTrainingGroundContextFromStore(store);
  const clue = findClue(state, ground.id);
  const hasUnlock = state.unlockedGroundIds.includes(ground.id);
  const blockers: string[] = [];
  const warnings: string[] = clue ? [...clue.warnings] : [];
  const recommendedActions: string[] = [];
  const apCost = defaultApCost(ground, clue);
  const actionKind = actionKindForGround(ground);

  if (!clue && !hasUnlock) {
    blockers.push('缺少剧情线索或系统解锁。');
    recommendedActions.push('通过推进剧情、侦察、对话、势力权限、传承线索或福地资源点获取道场线索。');
  }
  if (ground.immortalOnly && !context.isImmortal) {
    blockers.push('境界不足：此道场只对蛊仙开放。');
    recommendedActions.push('先完成升仙或寻找凡人道场。');
  }
  if (Number.isFinite(ground.minRealm) && context.realmGrand < Number(ground.minRealm)) {
    blockers.push(`境界不足：至少需要 ${ground.minRealm} 转。`);
  }
  if (ground.chapterRequired && context.currentChapterId && ground.chapterRequired !== context.currentChapterId) {
    blockers.push(`地点/章节不匹配：需要 ${ground.chapterRequired}。`);
    recommendedActions.push('先按剧情抵达线索指向的地点。');
  }
  const cooldownUntil = state.cooldowns[ground.id] || context.cooldowns?.[ground.id] || 0;
  if (cooldownUntil > context.turn) {
    blockers.push(`仍在冷却：第 ${cooldownUntil} 回合后可用。`);
  }
  if (remainingSceneAp(store) < apCost) {
    blockers.push(`场景 AP 不足：需要 ${apCost} 点。`);
    recommendedActions.push('推进剧情或结束当前时段后再出发。');
  }
  if (ground.type === 'hunt') {
    blockers.push('待 v0.9.0-a3 荒兽/兽群敌库接入后开放。');
    warnings.push('a2 不结算荒兽掉落，不产出仙蛊或稳定蛊虫。');
  }
  if (clue?.blockers.length) blockers.push(...clue.blockers);

  let status: TrainingGroundEntryView['status'] = 'available';
  if (ground.type === 'hunt') status = 'beast_library_pending';
  else if (blockers.some(item => item.includes('缺少剧情线索'))) status = 'missing_clue';
  else if (blockers.some(item => item.includes('冷却'))) status = 'cooldown';
  else if (blockers.some(item => item.includes('境界不足'))) status = 'realm_blocked';
  else if (blockers.some(item => item.includes('地点/章节'))) status = 'location_mismatch';
  else if (blockers.length > 0) status = 'blocked';

  const canDisplay = Boolean(clue || hasUnlock || blockers.length > 0);
  const canEnter = blockers.length === 0;
  return {
    ground,
    clue,
    status,
    canDisplay,
    canEnter,
    actionKind,
    blockers: unique(blockers),
    warnings: unique(warnings),
    recommendedActions: unique(recommendedActions),
    routeHint: routeHintForGround(ground),
    apCost,
    debugOnly: false,
  };
}

export function listTrainingGroundEntries(
  stateInput: Partial<TrainingGroundState> | null | undefined,
  store: any = {},
): TrainingGroundEntryView[] {
  const state = normalizeTrainingGroundState(stateInput);
  const ids = unique([
    ...state.clues.map(clue => clue.groundId),
    ...state.unlockedGroundIds,
  ]);
  return ids.map(id => evaluateTrainingGroundEntry(state, id, store)).filter(entry => entry.canDisplay);
}

export function resolveTrainingGroundAction(
  stateInput: Partial<TrainingGroundState> | null | undefined,
  groundId: string,
  store: any = {},
  seed: string | number = `${currentTurn(store)}:${groundId}:training-ground`,
): TrainingGroundActionResolution {
  const state = normalizeTrainingGroundState(stateInput);
  const entry = evaluateTrainingGroundEntry(state, groundId, store);
  const turn = currentTurn(store);
  if (!entry.canEnter) {
    const steps = [makeStep('failure', entry.blockers.join('；') || '道场入口不可用。', {
      turn,
      groundId,
      clueId: entry.clue?.id,
      severity: 'warning',
      metadata: { status: entry.status },
    })];
    return {
      success: false,
      message: steps[0].message,
      entry,
      steps,
      state: normalizeTrainingGroundState({
        ...state,
        blockedRecords: limitSteps([...state.blockedRecords, ...steps]),
        lastResolutionSteps: steps,
      }),
    };
  }

  if (entry.actionKind === 'train') {
    const context = buildTrainingGroundContextFromStore(store);
    const session = resolveTrainingGroundSession(context, entry.ground, seed);
    const steps = session.steps.map((step, index) => makeStep(
      session.success ? 'training' : 'failure',
      step.message,
      {
        id: `training_${entry.ground.id}_${turn}_${index}`,
        turn,
        groundId: entry.ground.id,
        clueId: entry.clue?.id,
        severity: session.success ? 'success' : 'warning',
        metadata: step.metadata,
      },
    ));
    return {
      success: session.success,
      message: session.message,
      entry,
      session,
      steps,
      state: normalizeTrainingGroundState({
        ...state,
        activeGroundId: null,
        cooldowns: session.nextCooldowns,
        clues: state.clues.map(clue => clue.groundId === groundId ? { ...clue, status: session.success ? 'resolved' : clue.status, updatedTurn: turn } : clue),
        lastResolutionSteps: steps,
      }),
    };
  }

  if (entry.actionKind === 'duel') {
    const combatCandidate: CombatEventCandidate = {
      id: `training_duel_${entry.ground.id}_${turn}`,
      type: 'other',
      title: `${entry.ground.name}对决`,
      summary: entry.clue?.summary || entry.ground.description,
      risk: entry.clue?.risk || 'medium',
      source: 'engine',
      scale: 'duel',
      enemyHint: `${entry.ground.pathType}道场守关者`,
      createdTurn: turn,
    };
    const steps = [makeStep('combat_candidate', `道场对决已生成战斗候选: ${entry.ground.name}`, {
      turn,
      groundId,
      clueId: entry.clue?.id,
      severity: 'success',
      metadata: { combatCandidateId: combatCandidate.id, scale: combatCandidate.scale },
    })];
    return {
      success: true,
      message: steps[0].message,
      entry,
      combatCandidate,
      steps,
      state: normalizeTrainingGroundState({
        ...state,
        activeGroundId: groundId,
        clues: state.clues.map(clue => clue.groundId === groundId ? { ...clue, status: 'active', updatedTurn: turn } : clue),
        lastResolutionSteps: steps,
      }),
    };
  }

  if (entry.actionKind === 'trial') {
    const steps = [makeStep('trial', `道场试炼已出发: ${entry.ground.name}。结果将由下一轮剧情与本地系统承接。`, {
      turn,
      groundId,
      clueId: entry.clue?.id,
      severity: 'success',
    })];
    return {
      success: true,
      message: steps[0].message,
      entry,
      steps,
      state: normalizeTrainingGroundState({
        ...state,
        activeGroundId: groundId,
        clues: state.clues.map(clue => clue.groundId === groundId ? { ...clue, status: 'active', updatedTurn: turn } : clue),
        lastResolutionSteps: steps,
      }),
    };
  }

  const steps = [makeStep('blocked', 'hunt 道场等待 v0.9.0-a3 荒兽/兽群敌库接入。', {
    turn,
    groundId,
    clueId: entry.clue?.id,
    severity: 'warning',
  })];
  return {
    success: false,
    message: steps[0].message,
    entry,
    steps,
    state: normalizeTrainingGroundState({
      ...state,
      blockedRecords: limitSteps([...state.blockedRecords, ...steps]),
      lastResolutionSteps: steps,
    }),
  };
}

export function formatTrainingGroundContextForPrompt(stateInput?: Partial<TrainingGroundState> | null): string {
  const state = normalizeTrainingGroundState(stateInput);
  const active = state.clues.filter(clue => clue.status === 'clue' || clue.status === 'active').slice(0, 8);
  const lines = [
    '【v0.9 道场线索协议】',
    '道场不再是可刷新菜单。DeepSeek 只能通过 state_update.training_ground_candidates.add 提交线索候选；正式进入、消耗、道痕、战斗和奖励由本地引擎结算。',
    '禁止直接写道场奖励、仙蛊、荒兽掉落、宝黄天资源或高阶资源。',
  ];
  if (active.length === 0) {
    lines.push('当前没有可出发道场线索；可在剧情中给出侦察、对话、势力、传承或福地资源点线索。');
  } else {
    lines.push('当前道场线索：');
    for (const clue of active) {
      lines.push(`- ${clue.title} (${clue.groundId})，来源=${clue.source}，风险=${clue.risk}，AP=${clue.apCostHint}，地点=${clue.locationHint}`);
    }
  }
  return lines.join('\n');
}
