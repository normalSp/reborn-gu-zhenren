import npcMemoryRulesRaw from '../canon/qingmao-npc-memory-rules.json';
import type {
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingWorldState,
  LocalActionLedgerEntry,
} from '../types';

export type QingmaoNpcMemoryAxis =
  | 'attention'
  | 'suspicion'
  | 'trust'
  | 'debt'
  | 'avoidance'
  | 'interest'
  | 'record_trace';

export type QingmaoNpcMemoryRisk = 'low' | 'medium' | 'high' | 'blocked';

export interface QingmaoNpcMemorySubject {
  id: string;
  subjectType: string;
  displayName: string;
  runtimeNamedNpc: boolean;
}

export interface QingmaoNpcMemoryRule {
  id: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  category: string;
  subjectId: string;
  memoryAxis: QingmaoNpcMemoryAxis;
  triggerRefs: string[];
  publicTrigger: string;
  localSummary: string;
  riskLevel: QingmaoNpcMemoryRisk;
  recommendedFollowUps: string[];
  blockedUpgrades: string[];
}

export interface QingmaoNpcMemoryProjection {
  id: string;
  ruleId: string;
  subjectRef: string;
  subjectType: string;
  subjectLabel: string;
  memoryAxis: QingmaoNpcMemoryAxis;
  publicReason: string;
  confidence: 'low' | 'medium' | 'high';
  riskLevel: QingmaoNpcMemoryRisk;
  visibleSourceRefs: string[];
  recommendedFollowUps: string[];
  blockedUpgrades: string[];
  canPatch: false;
  hiddenBoundaryProtected: boolean;
}

export interface QingmaoNpcMemoryProjectionResult {
  blocked: boolean;
  message: string;
  publicSummary: string;
  projections: QingmaoNpcMemoryProjection[];
  matchedRuleIds: string[];
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenWrites: string[];
  intakeReviewRef: string;
  statePatchApplied: false;
}

export interface QingmaoNpcMemoryProjectionInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  localActionLedger?: LocalActionLedgerEntry[] | null;
  turn?: number;
  maxProjections?: number;
}

interface QingmaoNpcMemoryRulesFile {
  sourceReview: {
    intakeReview: string;
  };
  boundaries: {
    maxProjectionsPerAction: number;
    forbiddenWrites: string[];
  };
  subjectAllowlist: QingmaoNpcMemorySubject[];
  memoryRules: QingmaoNpcMemoryRule[];
}

const rulesFile = npcMemoryRulesRaw as QingmaoNpcMemoryRulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cloneSubject(subject: QingmaoNpcMemorySubject): QingmaoNpcMemorySubject {
  return { ...subject };
}

function cloneRule(rule: QingmaoNpcMemoryRule): QingmaoNpcMemoryRule {
  return {
    ...rule,
    sourceItemIds: [...rule.sourceItemIds],
    sourcePointerIds: [...rule.sourcePointerIds],
    triggerRefs: [...rule.triggerRefs],
    recommendedFollowUps: [...rule.recommendedFollowUps],
    blockedUpgrades: [...rule.blockedUpgrades],
  };
}

function subjectById(id: string): QingmaoNpcMemorySubject | null {
  return rulesFile.subjectAllowlist.find(subject => subject.id === id) || null;
}

function collectKnownFactRefs(state?: Partial<LivingWorldState> | null): string[] {
  return Object.keys(state?.knownFacts || {}).flatMap(id => [
    `fact:${id}`,
    `knownFact:${id}`,
  ]);
}

function collectPressureRefs(entries: LivingFactionPressureEntry[] = []): string[] {
  return entries.flatMap(entry => [
    `pressure:${entry.id}`,
    `pressure:${entry.factionId}`,
    `pressure:${entry.factionId}:${entry.pressureType}`,
  ]);
}

function collectNpcMemoryRefs(entries: LivingNpcMemoryEntry[] = []): string[] {
  return entries.flatMap(entry => [
    `npc_memory:${entry.id}`,
    `npc_memory:${entry.npcId}`,
    ...entry.tags.map(tag => `npc_memory_tag:${tag}`),
  ]);
}

function collectConsequenceRefs(entries: LivingActionConsequenceEntry[] = []): string[] {
  return entries.flatMap(entry => [
    `consequence:${entry.id}`,
    `action:${entry.actionId}`,
    ...entry.effectRefs,
    ...entry.followUpRefs,
  ]);
}

function collectLedgerRefs(entries: LocalActionLedgerEntry[] = []): string[] {
  return entries.flatMap(entry => [
    `ledger:${entry.id}`,
    `action:${entry.id}`,
    `action_source:${entry.source}`,
    ...entry.risks.map(risk => `risk:${risk}`),
  ]);
}

function collectStateRefs(input: QingmaoNpcMemoryProjectionInput): string[] {
  const state = input.livingWorldState;
  return unique([
    ...collectKnownFactRefs(state),
    ...collectPressureRefs(state?.factionPressure || []),
    ...collectNpcMemoryRefs(state?.npcMemories || []),
    ...collectConsequenceRefs(state?.actionConsequences || []),
    ...collectLedgerRefs(input.localActionLedger || []),
    ...(state?.worldClock?.lastActionId ? [`action:${state.worldClock.lastActionId}`] : []),
    ...(state?.playerGoals || []).flatMap(goal => [
      `goal:${goal.id}`,
      `goal:${goal.targetRef}`,
      ...goal.nextStepHints,
      ...goal.blockedByRefIds,
    ]),
  ]);
}

function refMatches(triggerRef: string, stateRefs: string[]): boolean {
  return stateRefs.some(ref => ref === triggerRef || ref.startsWith(`${triggerRef}:`));
}

function confidenceFor(rule: QingmaoNpcMemoryRule, matchedRefs: string[]): 'low' | 'medium' | 'high' {
  if (rule.riskLevel === 'high' || matchedRefs.length >= 2) return 'high';
  if (rule.riskLevel === 'medium') return 'medium';
  return 'low';
}

function projectionId(rule: QingmaoNpcMemoryRule): string {
  return `npc_memory_projection_${rule.id.replace(/^npc_memory_/, '')}`;
}

function projectionSortScore(projection: QingmaoNpcMemoryProjection): number {
  const riskScore: Record<QingmaoNpcMemoryRisk, number> = {
    blocked: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return riskScore[projection.riskLevel] * 10 + projection.visibleSourceRefs.length;
}

export function listQingmaoNpcMemorySubjects(): QingmaoNpcMemorySubject[] {
  return rulesFile.subjectAllowlist.map(cloneSubject);
}

export function listQingmaoNpcMemoryRules(): QingmaoNpcMemoryRule[] {
  return rulesFile.memoryRules.map(cloneRule);
}

export function buildQingmaoNpcMemoryProjection(
  input: QingmaoNpcMemoryProjectionInput = {},
): QingmaoNpcMemoryProjectionResult {
  const stateRefs = collectStateRefs(input);
  const maxProjections = Math.max(
    1,
    Math.floor(Number(input.maxProjections ?? rulesFile.boundaries.maxProjectionsPerAction)),
  );
  const projections = rulesFile.memoryRules
    .map((rule): QingmaoNpcMemoryProjection | null => {
      const subject = subjectById(rule.subjectId);
      if (!subject || subject.runtimeNamedNpc) return null;
      const visibleSourceRefs = unique(rule.triggerRefs.filter(ref => refMatches(ref, stateRefs)));
      if (visibleSourceRefs.length === 0) return null;
      const hiddenBoundaryProtected = rule.blockedUpgrades.includes('hidden_fact_reveal');
      return {
        id: projectionId(rule),
        ruleId: rule.id,
        subjectRef: subject.id,
        subjectType: subject.subjectType,
        subjectLabel: subject.displayName,
        memoryAxis: rule.memoryAxis,
        publicReason: `${rule.localSummary} 触发依据：${rule.publicTrigger}`,
        confidence: confidenceFor(rule, visibleSourceRefs),
        riskLevel: rule.riskLevel,
        visibleSourceRefs,
        recommendedFollowUps: [...rule.recommendedFollowUps],
        blockedUpgrades: [...rule.blockedUpgrades, ...rulesFile.boundaries.forbiddenWrites],
        canPatch: false,
        hiddenBoundaryProtected,
      };
    })
    .filter((projection): projection is QingmaoNpcMemoryProjection => Boolean(projection))
    .sort((a, b) => projectionSortScore(b) - projectionSortScore(a))
    .slice(0, maxProjections);

  const visibleSourceRefs = unique(projections.flatMap(projection => projection.visibleSourceRefs));
  const blocked = projections.length === 0;

  return {
    blocked,
    message: blocked
      ? '缺少可公开推演的社会记忆输入，暂不生成 NPC 记忆投影。'
      : `已生成 ${projections.length} 条青茅 NPC 记忆候选投影；第一刀只读，不写入存档。`,
    publicSummary: blocked
      ? '当前没有可公开归因的 NPC 记忆候选。'
      : `当前公开行动可被 ${projections.length} 类主体记住或解释；这些只是候选投影。`,
    projections,
    matchedRuleIds: projections.map(projection => projection.ruleId),
    visibleSourceRefs,
    rejectedReasons: blocked ? ['missing_public_social_memory_evidence'] : [],
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    intakeReviewRef: rulesFile.sourceReview.intakeReview,
    statePatchApplied: false,
  };
}
