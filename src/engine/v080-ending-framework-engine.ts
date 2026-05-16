import endingRulesRaw from '../canon/v080-ending-framework-rules.json';
import endingOutcomesRaw from '../canon/ending-outcomes.json';
import type {
  DeathRecord,
  EndingCommitRecord,
  EndingEntryValidation,
  EndingEvidenceSummary,
  EndingFrameworkState,
  EndingOutcome,
  EndingResolutionInput,
  EndingResolutionStep,
  EndingRouteCandidate,
  IfBranchAxis,
  StoryAnchorState,
} from '../types';
import { buildEndingResolverInput, normalizeStoryAnchorState } from './v080-midgame-anchor-engine';
import { resolveEnding, validateEndingText } from './v080-narrative-engine';
import { normalizeCultivationState } from './v080-cultivation-calamity-engine';
import { buildLifeboundEndingEvidence, buildOriginEndingEvidence } from './v080-origin-lifebound-closure';

type EndingRules = typeof endingRulesRaw;
type EndingFamilyConfig = EndingRules['familyWeights'][keyof EndingRules['familyWeights']];

const rules = endingRulesRaw as EndingRules;
const endingOutcomes = endingOutcomesRaw as any;
const COMMIT_SCREEN = 'game_over' as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function getFamily(familyId: string): any {
  return endingOutcomes.families?.find((family: any) => family.id === familyId) || endingOutcomes.families?.[0];
}

function allFamilyIds(): string[] {
  return ensureArray<any>(endingOutcomes.families).map(family => family.id).filter(Boolean);
}

function makeStep(
  kind: EndingResolutionStep['kind'],
  message: string,
  input: {
    turn?: number;
    familyId?: string;
    severity?: EndingResolutionStep['severity'];
    metadata?: Record<string, unknown>;
    index?: number;
  } = {},
): EndingResolutionStep {
  const turn = Number(input.turn || 0);
  return {
    id: `ending_step_${turn}_${kind}_${input.familyId || 'global'}_${input.index ?? 0}`,
    kind,
    turn,
    familyId: input.familyId,
    message,
    severity: input.severity || 'info',
    metadata: input.metadata,
  };
}

function riskFromInput(input: EndingResolutionInput, readiness: number): EndingRouteCandidate['risk'] {
  const heaven = Number(input.heavenWillLedger.attention || 0) + Number(input.heavenWillLedger.rejection || 0);
  const karmic = Number(input.karmicDebtLedger.totalDebt || 0);
  if (heaven >= rules.readinessThresholds.highRisk || karmic >= 80 || readiness < 45) return 'high';
  if (heaven >= 35 || karmic >= 30 || readiness < 65) return 'medium';
  return 'low';
}

function textForbiddenHits(text: string): string[] {
  const configured = ensureArray(rules.forbiddenRuntimeAssertions as string[]);
  const lower = String(text || '').toLowerCase();
  const directMutationKeys = ensureArray((rules.commitPolicy as any)?.deepSeekForbidden as string[])
    .filter(key => lower.includes(String(key).toLowerCase()));
  const englishBoundaryHits = [
    ['rank ten', 'rankTen'],
    ['true immortality', 'immortalityConclusion'],
    ['eternal life gu', 'immortalityConclusion'],
    ['fate gu', 'endingOutcome'],
    ['venerable kill', 'venerableKill'],
    ['kill venerable', 'venerableKill'],
  ]
    .filter(([phrase]) => lower.includes(phrase))
    .map(([, label]) => label);
  return [...new Set([
    ...configured.filter(phrase => text.includes(phrase)),
    ...validateEndingText(text),
    ...directMutationKeys,
    ...englishBoundaryHits,
  ])];
}

function axisMagnitude(input: EndingResolutionInput, axes?: string[]): number {
  if (!axes || axes.length === 0) return 0;
  return input.ifBranchVectors
    .filter(vector => axes.includes(vector.axis))
    .reduce((sum, vector) => sum + Math.abs(Number(vector.delta || 0)), 0);
}

function countAnchorStatuses(state: StoryAnchorState): EndingEvidenceSummary['anchors'] {
  const results = Object.values(state.anchorResults || {});
  return {
    resolvedCount: results.filter(result => result.status === 'resolved').length,
    blockedCount: results.filter(result => result.status === 'blocked').length,
    activeCount: results.filter(result => result.status === 'active').length,
    currentAnchorId: state.currentAnchorId,
  };
}

function buildBattleEvidence(store: any): EndingEvidenceSummary['battle'] {
  return {
    totalBattles: Number(store?.totalBattlesFought || store?.battleHistory?.length || 0),
    combatWins: Number(store?.combatWins || 0),
    squadWins: Number(store?.squadCombatWins || 0),
    squadDeaths: Number(store?.squadMemberDeaths || 0),
    woundedRescues: Number(store?.squadMemberWoundedRescues || 0),
    comboSuccesses: Number(store?.squadComboSuccesses || 0),
    overlevelEscapes: Number(store?.squadOverlevelEscapes || 0),
    currentBattlefieldSteps: Array.isArray(store?.battlefieldPlaybackSteps) ? store.battlefieldPlaybackSteps.length : 0,
  };
}

function buildCultivationEvidence(store: any): EndingEvidenceSummary['cultivation'] {
  const cultivation = normalizeCultivationState(store?.cultivationState);
  const breakthroughs = ensureArray(cultivation.breakthroughHistory);
  const calamities = ensureArray(cultivation.calamityLedger);
  return {
    breakthroughFailures: breakthroughs.filter(record => record.outcome === 'failure').length,
    breakthroughSuccesses: breakthroughs.filter(record => record.outcome === 'success').length,
    ascensionOutcome: cultivation.ascension.lastAttempt?.outcome,
    calamityCount: calamities.length,
    calamityScars: calamities.reduce((sum, record) => sum + Math.max(0, Number(record.areaLoss || 0)), 0),
    heavenWillPressure: Number(cultivation.ascension.heavenWillPressure || 0),
    karmicDebt: Number(cultivation.ascension.karmicDebt || 0),
  };
}

function buildEvidence(input: { storyAnchorState: StoryAnchorState; store: any }): EndingEvidenceSummary {
  const store = input.store || {};
  const factionEvents = Array.isArray(store.factionEvents) ? store.factionEvents : [];
  const relations = Array.isArray(store.characterRelations) ? store.characterRelations : [];
  const originEvidence = buildOriginEndingEvidence(store);
  const lifeboundEvidence = buildLifeboundEndingEvidence(store);
  return {
    battle: buildBattleEvidence(store),
    cultivation: buildCultivationEvidence(store),
    origin: originEvidence,
    faction: {
      score: Number(store.playerFaction?.reputation || store.flags?.playerFactionScore || 0),
      relationCount: relations.length,
      factionEventCount: factionEvents.length,
    },
    lifebound: lifeboundEvidence,
    anchors: countAnchorStatuses(input.storyAnchorState),
  };
}

function baseReadiness(input: EndingResolutionInput): number {
  const weights = rules.evidenceWeights;
  const evidence = input.evidence;
  const resolvedAnchorScore = evidence.anchors.resolvedCount * Number(weights.resolvedMidgameAnchor || 0);
  const ifScore = input.ifBranchVectors.reduce((sum, vector) => sum + Math.abs(Number(vector.delta || 0)) * Number(weights.ifVectorMagnitude || 0), 0);
  const battleScore = evidence.battle.combatWins * Number(weights.battleWins || 0);
  const factionScore = input.playerFactionScore * Number(weights.playerFactionScore || 0);
  const penalties =
    evidence.battle.squadDeaths * Math.abs(Number(weights.squadDeathsPenalty || 0)) +
    evidence.cultivation.breakthroughFailures * Math.abs(Number(weights.breakthroughFailurePenalty || 0)) +
    evidence.cultivation.calamityCount * Math.abs(Number(weights.calamityScarPenalty || 0)) +
    (evidence.lifebound.hasPenalty ? Math.abs(Number(weights.lifeboundPenalty || 0)) : 0);
  return clamp(35 + resolvedAnchorScore + ifScore + battleScore + factionScore - penalties, 0, 100);
}

function scoreFamily(familyId: string, config: EndingFamilyConfig, input: EndingResolutionInput): { score: number; blockers: string[]; reasons: string[]; tags: string[] } {
  const blockers: string[] = [];
  const reasons: string[] = [];
  const tags = ensureArray<string>((config as any).tags);
  let score = Number((config as any).base || 0);

  if ((config as any).requiresPlayerDead && input.playerSurvived) {
    blockers.push('玩家尚未身死，不能结算身死道消线。');
  }
  if (!(config as any).requiresPlayerDead && !input.playerSurvived && familyId !== 'death_and_dust') {
    blockers.push('玩家已死亡，不能结算生还终局。');
  }

  const states = ensureArray<string>((config as any).requiresFateState);
  if (states.length > 0 && !states.includes(input.fateState)) {
    blockers.push(`宿命状态不匹配：需要 ${states.join('/')}，当前为 ${input.fateState}。`);
    score -= 35;
  }

  const requiredFaction = Number((config as any).requiresFactionScore || 0);
  if (requiredFaction > 0 && input.playerFactionScore < requiredFaction) {
    blockers.push(`玩家势力不足：需要 ${requiredFaction}，当前 ${input.playerFactionScore}。`);
  }

  const chaosPressure = input.heavenWillLedger.attention +
    Number(input.karmicDebtLedger.byKind?.chaos_contact || 0) +
    axisMagnitude(input, ['venerable_balance', 'heaven_will_debt']);
  const requiredChaos = Number((config as any).requiresChaosPressure || 0);
  if (requiredChaos > 0 && chaosPressure < requiredChaos) {
    blockers.push(`疯魔/混沌求证压力不足：需要 ${requiredChaos}，当前 ${Math.round(chaosPressure)}。`);
  }

  const preferredAxes = ensureArray<IfBranchAxis>((config as any).preferredAxes);
  const preferredAxisScore = axisMagnitude(input, preferredAxes) * 0.35;
  score += preferredAxisScore;
  score += input.evidence.anchors.resolvedCount * rules.evidenceWeights.resolvedMidgameAnchor;
  score += input.evidence.battle.combatWins * rules.evidenceWeights.battleWins;
  score += input.playerFactionScore * (familyId === 'player_faction_foothold' ? 0.45 : 0.08);
  score -= input.evidence.battle.squadDeaths * Math.abs(rules.evidenceWeights.squadDeathsPenalty);
  score -= input.evidence.cultivation.breakthroughFailures * Math.abs(rules.evidenceWeights.breakthroughFailurePenalty);
  score -= input.evidence.cultivation.calamityCount * Math.abs(rules.evidenceWeights.calamityScarPenalty);
  if (input.evidence.lifebound.hasPenalty) score -= Math.abs(rules.evidenceWeights.lifeboundPenalty);

  if (preferredAxes.length > 0 && preferredAxisScore > 0) reasons.push(`IF 轴 ${preferredAxes.join('/')} 已留下可追踪偏移。`);
  if (input.evidence.anchors.resolvedCount > 0) reasons.push(`${input.evidence.anchors.resolvedCount} 个锚点已有结算证据。`);
  if (input.playerFactionScore >= 60) reasons.push('玩家势力已有终局立足资本。');
  if (chaosPressure >= 85) reasons.push('疯魔/混沌/尊者求证压力达到终局阈值，但仍只能给未证悬念。');
  if (input.evidence.battle.squadDeaths > 0) reasons.push('群战伤亡进入终局代价。');
  if (input.evidence.cultivation.calamityCount > 0) reasons.push('灾劫伤痕进入终局代价。');
  if ((input.evidence.origin.debtLabels || []).length > 0) reasons.push(`出身深线证据进入终局：${input.evidence.origin.debtLabels.join(' / ')}。`);
  if (input.evidence.lifebound.profileId) reasons.push(`本命蛊成长协议进入终局：${input.evidence.lifebound.profileName || input.evidence.lifebound.profileId}。`);
  if (input.evidence.lifebound.hasPenalty) reasons.push('本命蛊反噬压低终局稳定性。');

  return { score: clamp(score, 0, 100), blockers, reasons, tags };
}

export function createDefaultEndingFrameworkState(overrides: Partial<EndingFrameworkState> = {}): EndingFrameworkState {
  return normalizeEndingFrameworkState({
    version: 'v0.8.0-c1',
    status: 'idle',
    lastInput: null,
    candidates: [],
    pressureLog: [],
    lastResolutionSteps: [],
    commitRecord: null,
    ...overrides,
  });
}

export function normalizeEndingFrameworkState(input?: Partial<EndingFrameworkState> | null): EndingFrameworkState {
  const raw = input && typeof input === 'object' ? input as any : {};
  const status = ['idle', 'ready', 'committed', 'blocked'].includes(raw.status) ? raw.status : 'idle';
  return {
    version: 'v0.8.0-c1',
    status,
    lastInput: raw.lastInput || null,
    candidates: ensureArray<EndingRouteCandidate>(raw.candidates).slice(-rules.candidateLimits.maxCandidates),
    pressureLog: ensureArray<EndingFrameworkState['pressureLog'][number]>(raw.pressureLog).slice(-rules.candidateLimits.maxPressureLog),
    lastResolutionSteps: ensureArray<EndingResolutionStep>(raw.lastResolutionSteps).slice(-rules.candidateLimits.maxResolutionSteps),
    commitRecord: raw.commitRecord || null,
  };
}

export function buildEndingResolutionInput(input: {
  state?: Partial<EndingFrameworkState> | null;
  storyAnchorState?: Partial<StoryAnchorState> | null;
  store?: any;
}): EndingResolutionInput {
  const store = input.store || {};
  const storyAnchorState = normalizeStoryAnchorState(input.storyAnchorState || store.storyAnchorState, store.flags || {});
  const base = buildEndingResolverInput({ state: storyAnchorState, store });
  return {
    ...base,
    turn: Number(store.turn || 1),
    realmGrand: Number(store.profile?.realm?.grand || store.realm?.grand || 1),
    realmLabel: store.profile?.realm?.label || store.realm?.label || '一转初阶',
    playerName: store.profile?.name || '无名蛊师',
    currentChapterId: store.currentChapterId || null,
    currentDomain: store.currentDomain || store.playerPosition?.region || '',
    evidence: buildEvidence({ storyAnchorState, store }),
  };
}

export function evaluateEndingReadiness(input: EndingResolutionInput): EndingEntryValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  let readiness = baseReadiness(input);

  if (input.playerSurvived) {
    if (input.realmGrand < rules.requiredEvidence.minimumRealmGrandForLivingEndings) {
      issues.push(`境界不足：生还终局至少需要 ${rules.requiredEvidence.minimumRealmGrandForLivingEndings} 转。`);
      readiness -= 25;
    }
    if (input.turn < rules.requiredEvidence.minimumTurnForCommit) {
      issues.push(`回合不足：终局结算至少需要第 ${rules.requiredEvidence.minimumTurnForCommit} 回。`);
      readiness -= 15;
    }
  } else {
    readiness = Math.max(readiness, 80);
    warnings.push('玩家已死亡，将优先结算身死道消线。');
  }

  if (input.evidence.anchors.activeCount === 0 && input.evidence.anchors.resolvedCount === 0) {
    warnings.push('缺少已解决锚点，结局会偏向侧线总结。');
  }
  if (input.heavenWillLedger.attention >= 80) {
    warnings.push('天意关注过高，终局会带有强烈修正或排斥。');
  }
  if (input.karmicDebtLedger.totalDebt >= 80) {
    warnings.push('因果债过高，结局稳定性下降。');
  }

  const recommended = resolveEnding(input).familyId;
  return {
    canCommit: issues.length === 0 && clamp(readiness, 0, 100) >= rules.readinessThresholds.canCommit,
    readiness: clamp(readiness, 0, 100),
    issues,
    warnings,
    recommendedFamilyId: recommended,
  };
}

export function generateEndingRouteCandidates(input: EndingResolutionInput): EndingRouteCandidate[] {
  const validation = evaluateEndingReadiness(input);
  const candidateIds = allFamilyIds();
  const candidates = candidateIds.map((familyId): EndingRouteCandidate => {
    const family = getFamily(familyId);
    const config = (rules.familyWeights as any)[familyId] || { base: 20, tags: [] };
    const scored = scoreFamily(familyId, config, input);
    const text = `${family?.displayName || ''} ${family?.summary || ''}`;
    const forbiddenHits = textForbiddenHits(text);
    const blockers = [...scored.blockers, ...validation.issues];
    const readiness = clamp((scored.score + validation.readiness) / 2, 0, 100);
    const canCommit = validation.canCommit && blockers.length === 0 && forbiddenHits.length === 0 && readiness >= rules.readinessThresholds.canCommit;
    const reasons = scored.reasons.length > 0 ? scored.reasons : [family?.summary || '由本地终局矩阵生成。'];
    return {
      id: `ending_${familyId}`,
      familyId,
      displayName: family?.displayName || familyId,
      provenance: family?.provenance || 'if-derived',
      summary: family?.summary || '结局待补充。',
      readiness,
      risk: riskFromInput(input, readiness),
      canCommit,
      reasons,
      blockers,
      warnings: validation.warnings,
      evidenceTags: [...new Set([...scored.tags, input.fateState, input.gameMode])],
      forbiddenHits,
    };
  });

  return candidates
    .sort((a, b) => {
      if (a.canCommit !== b.canCommit) return a.canCommit ? -1 : 1;
      if (a.familyId === validation.recommendedFamilyId) return -1;
      if (b.familyId === validation.recommendedFamilyId) return 1;
      return b.readiness - a.readiness;
    })
    .slice(0, rules.candidateLimits.maxCandidates);
}

export function validateEndingRouteCandidate(input: {
  candidateId?: string;
  familyId?: string;
  resolutionInput: EndingResolutionInput;
}): { valid: boolean; candidate?: EndingRouteCandidate; issues: string[]; warnings: string[] } {
  const candidates = generateEndingRouteCandidates(input.resolutionInput);
  const candidate = candidates.find(item => item.id === input.candidateId || item.familyId === input.familyId);
  if (!candidate) {
    return { valid: false, issues: ['未知终局候选。'], warnings: [] };
  }
  const issues = [...candidate.blockers];
  if (candidate.forbiddenHits.length > 0) {
    issues.push(`结局文本包含禁区断言：${candidate.forbiddenHits.join('、')}`);
  }
  if (!candidate.canCommit) {
    issues.push('终局候选尚未达到正式结算门槛。');
  }
  return {
    valid: issues.length === 0,
    candidate,
    issues,
    warnings: candidate.warnings,
  };
}

export function resolveEndingRoute(input: {
  candidateId?: string;
  familyId?: string;
  resolutionInput: EndingResolutionInput;
}): { outcome: EndingOutcome; candidate?: EndingRouteCandidate; valid: boolean; issues: string[]; steps: EndingResolutionStep[] } {
  const verdict = validateEndingRouteCandidate(input);
  const candidate = verdict.candidate;
  const turn = input.resolutionInput.turn;
  if (!candidate) {
    const fallback = resolveEnding(input.resolutionInput);
    return {
      outcome: fallback,
      valid: false,
      issues: verdict.issues,
      steps: [makeStep('forbidden_block', verdict.issues.join('；') || '未知终局候选。', { turn, severity: 'danger' })],
    };
  }

  const outcome: EndingOutcome = {
    familyId: candidate.familyId,
    displayName: candidate.displayName,
    provenance: candidate.provenance,
    summary: candidate.summary,
    reasons: candidate.reasons,
    unresolvedWarnings: [
      'v0.8.0 不开放真正永生、炼成永生蛊或稳定十转结局。',
      ...candidate.warnings,
      ...candidate.forbiddenHits.map(hit => `结局文本包含禁止断言：${hit}`),
    ],
  };

  const steps: EndingResolutionStep[] = [
    makeStep('input', '终局输入已由本地引擎汇总。', { turn, metadata: { evidence: input.resolutionInput.evidence } }),
    makeStep('candidate', `终局候选：${candidate.displayName}`, { turn, familyId: candidate.familyId, severity: candidate.canCommit ? 'success' : 'warning', metadata: { readiness: candidate.readiness } }),
  ];
  if (candidate.evidenceTags.includes('venerable_balance')) {
    steps.push(makeStep('venerable_pressure', '尊者博弈只形成压力与筹码，不允许普通战斗击杀或无代价替代尊者。', {
      turn,
      familyId: candidate.familyId,
      severity: 'warning',
    }));
  }
  if (!verdict.valid) {
    steps.push(makeStep('forbidden_block', verdict.issues.join('；'), {
      turn,
      familyId: candidate.familyId,
      severity: 'danger',
    }));
  } else {
    steps.push(makeStep('readiness', `终局可结算，稳定度 ${candidate.readiness}。`, {
      turn,
      familyId: candidate.familyId,
      severity: 'success',
    }));
  }
  return { outcome, candidate, valid: verdict.valid, issues: verdict.issues, steps };
}

function buildClosingPoem(input: EndingResolutionInput, outcome: EndingOutcome): { title: string; poem: string } {
  const name = input.playerName || '无名蛊师';
  const title = `${name}终局诗`;
  const fateLine = outcome.displayName.length > 12 ? outcome.displayName.slice(0, 12) : outcome.displayName;
  return {
    title,
    poem: [
      `暗墨收天见旧痕，${input.realmLabel}一念叩凡尘。`,
      `宿命${input.fateState === 'destroyed' ? '既碎' : input.fateState === 'fractured' ? '有裂' : '犹存'}仍留价，尊者棋前不许昏。`,
      `${fateLine}非长生，混沌雾里待后人。`,
      '此行到此归卷上，功过皆随道痕存。',
    ].join('\n'),
  };
}

function buildLifeSummary(input: EndingResolutionInput, outcome: EndingOutcome): string {
  const evidence = input.evidence;
  return `${input.playerName || '无名蛊师'}行至第${input.turn}回，以${input.realmLabel}收束于「${outcome.displayName}」。` +
    `此行牵动 ${evidence.anchors.resolvedCount + evidence.anchors.activeCount} 个锚点，战斗 ${evidence.battle.totalBattles} 场，` +
    `灾劫 ${evidence.cultivation.calamityCount} 次，因果债 ${input.karmicDebtLedger.totalDebt}。${outcome.summary}`;
}

export function commitEndingOutcome(input: {
  state?: Partial<EndingFrameworkState> | null;
  resolutionInput: EndingResolutionInput;
  candidateId?: string;
  familyId?: string;
  committedAt?: string;
}): { success: boolean; state: EndingFrameworkState; outcome: EndingOutcome; commitRecord?: EndingCommitRecord; deathRecord?: DeathRecord; issues: string[]; steps: EndingResolutionStep[] } {
  const state = normalizeEndingFrameworkState(input.state);
  const resolution = resolveEndingRoute({
    candidateId: input.candidateId,
    familyId: input.familyId,
    resolutionInput: input.resolutionInput,
  });
  if (!resolution.valid || !resolution.candidate) {
    const nextState = normalizeEndingFrameworkState({
      ...state,
      status: 'blocked',
      lastInput: input.resolutionInput,
      candidates: generateEndingRouteCandidates(input.resolutionInput),
      lastResolutionSteps: resolution.steps,
    });
    return { success: false, state: nextState, outcome: resolution.outcome, issues: resolution.issues, steps: resolution.steps };
  }

  const poem = buildClosingPoem(input.resolutionInput, resolution.outcome);
  const lifeSummary = buildLifeSummary(input.resolutionInput, resolution.outcome);
  const commitRecord: EndingCommitRecord = {
    id: `ending_commit_${input.resolutionInput.turn}_${resolution.candidate.familyId}`,
    turn: input.resolutionInput.turn,
    committedAt: input.committedAt || new Date().toISOString(),
    candidateId: resolution.candidate.id,
    outcome: resolution.outcome,
    evidence: input.resolutionInput.evidence,
    lifeSummary,
    closingPoem: poem.poem,
    poemTitle: poem.title,
    screenStateAfterCommit: COMMIT_SCREEN,
  };
  const steps = [
    ...resolution.steps,
    makeStep('commit', `终局已结算：${resolution.outcome.displayName}`, {
      turn: input.resolutionInput.turn,
      familyId: resolution.outcome.familyId,
      severity: 'success',
    }),
    makeStep('summary', lifeSummary, {
      turn: input.resolutionInput.turn,
      familyId: resolution.outcome.familyId,
      severity: 'info',
    }),
  ];
  const nextState = normalizeEndingFrameworkState({
    ...state,
    status: 'committed',
    lastInput: input.resolutionInput,
    candidates: generateEndingRouteCandidates(input.resolutionInput),
    lastResolutionSteps: steps,
    commitRecord,
  });
  const deathRecord: DeathRecord = {
    cause: resolution.outcome.displayName,
    turn: input.resolutionInput.turn,
    chapter: input.resolutionInput.currentChapterId || input.resolutionInput.currentDomain || '终局',
    realm: input.resolutionInput.realmLabel,
    achievementCount: 0,
    lifeSummary,
    closingPoem: poem.poem,
    poemTitle: poem.title,
    majorChoices: resolution.outcome.reasons,
    deathCauseTags: [resolution.outcome.familyId, resolution.outcome.provenance, input.resolutionInput.fateState],
    endingFamilyId: resolution.outcome.familyId,
    endingProvenance: resolution.outcome.provenance,
    endingReasons: resolution.outcome.reasons,
    unresolvedWarnings: resolution.outcome.unresolvedWarnings,
    generatedAt: commitRecord.committedAt,
  };
  return { success: true, state: nextState, outcome: resolution.outcome, commitRecord, deathRecord, issues: [], steps };
}

export function recordEndingPressure(input: {
  state?: Partial<EndingFrameworkState> | null;
  attemptedOutcome: string;
  reason?: string;
  turn?: number;
}): { state: EndingFrameworkState; steps: EndingResolutionStep[] } {
  const state = normalizeEndingFrameworkState(input.state);
  const forbiddenHits = textForbiddenHits(input.attemptedOutcome || '');
  const turn = Number(input.turn || 0);
  const record = {
    id: `ending_pressure_${turn}_${state.pressureLog.length}`,
    turn,
    reason: input.reason || (forbiddenHits.length > 0 ? '终局候选包含禁区断言。' : '终局候选需要本地校验。'),
    attemptedOutcome: input.attemptedOutcome,
    engineDecision: forbiddenHits.length > 0 ? 'block' as const : 'redirect' as const,
    severity: forbiddenHits.length > 0 ? 'high' as const : 'medium' as const,
    forbiddenHits,
  };
  const steps = [makeStep(record.engineDecision === 'block' ? 'forbidden_block' : 'candidate', `终局压力已记录：${record.reason}`, {
    turn,
    severity: record.engineDecision === 'block' ? 'danger' : 'warning',
    metadata: { forbiddenHits },
  })];
  return {
    state: normalizeEndingFrameworkState({
      ...state,
      status: record.engineDecision === 'block' ? 'blocked' : state.status,
      pressureLog: [...state.pressureLog, record].slice(-rules.candidateLimits.maxPressureLog),
      lastResolutionSteps: steps,
    }),
    steps,
  };
}
