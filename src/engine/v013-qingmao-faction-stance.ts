import factionStanceRulesRaw from '../canon/qingmao-faction-stance-rules.json';
import type {
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingWorldState,
  LocalActionLedgerEntry,
} from '../types';

export type QingmaoFactionStanceAxis =
  | 'watch'
  | 'opportunity'
  | 'blockade_hint'
  | 'recruitment_hint'
  | 'pursuit_risk'
  | 'task_source_hint'
  | 'trade_window'
  | 'suspicion';

export type QingmaoFactionStanceSeverity = 'low' | 'medium' | 'high' | 'blocked';

export interface QingmaoFactionStanceSubject {
  id: string;
  displayName: string;
  runtimeStandingScore: boolean;
}

export interface QingmaoFactionStanceRule {
  id: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  category: string;
  factionId: string;
  stanceAxis: QingmaoFactionStanceAxis;
  triggerRefs: string[];
  publicTrigger: string;
  localSummary: string;
  severity: QingmaoFactionStanceSeverity;
  recommendedFollowUps: string[];
  blockedUpgrades: string[];
}

export interface QingmaoFactionStanceProjection {
  id: string;
  ruleId: string;
  factionRef: string;
  factionLabel: string;
  stanceAxis: QingmaoFactionStanceAxis;
  publicReason: string;
  severity: QingmaoFactionStanceSeverity;
  visibleSourceRefs: string[];
  recommendedFollowUps: string[];
  blockedUpgrades: string[];
  escalationBlocked: boolean;
  canPatch: false;
}

export interface QingmaoFactionStanceProjectionInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  localActionLedger?: LocalActionLedgerEntry[] | null;
  maxProjections?: number;
}

export interface QingmaoFactionStanceProjectionResult {
  blocked: boolean;
  message: string;
  publicSummary: string;
  projections: QingmaoFactionStanceProjection[];
  matchedRuleIds: string[];
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenWrites: string[];
  intakeReviewRef: string;
  statePatchApplied: false;
}

interface QingmaoFactionStanceRulesFile {
  sourceReview: {
    intakeReview: string;
  };
  boundaries: {
    maxProjectionsPerAction: number;
    forbiddenWrites: string[];
  };
  factionAllowlist: QingmaoFactionStanceSubject[];
  stanceRules: QingmaoFactionStanceRule[];
}

const rulesFile = factionStanceRulesRaw as QingmaoFactionStanceRulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cloneFaction(faction: QingmaoFactionStanceSubject): QingmaoFactionStanceSubject {
  return { ...faction };
}

function cloneRule(rule: QingmaoFactionStanceRule): QingmaoFactionStanceRule {
  return {
    ...rule,
    sourceItemIds: [...rule.sourceItemIds],
    sourcePointerIds: [...rule.sourcePointerIds],
    triggerRefs: [...rule.triggerRefs],
    recommendedFollowUps: [...rule.recommendedFollowUps],
    blockedUpgrades: [...rule.blockedUpgrades],
  };
}

function factionById(id: string): QingmaoFactionStanceSubject | null {
  return rulesFile.factionAllowlist.find(faction => faction.id === id) || null;
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

function collectStateRefs(input: QingmaoFactionStanceProjectionInput): string[] {
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

function projectionId(rule: QingmaoFactionStanceRule): string {
  return `faction_stance_projection_${rule.id.replace(/^faction_stance_/, '')}`;
}

function isEscalationBlocked(rule: QingmaoFactionStanceRule): boolean {
  return rule.blockedUpgrades.some(upgrade => [
    'warrant_active',
    'recruitment_success',
    'task_created',
    'task_reward',
    'faction_transfer',
    'standing_delta',
  ].includes(upgrade));
}

function projectionSortScore(projection: QingmaoFactionStanceProjection): number {
  const severityScore: Record<QingmaoFactionStanceSeverity, number> = {
    blocked: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return severityScore[projection.severity] * 10 + projection.visibleSourceRefs.length;
}

export function listQingmaoFactionStanceSubjects(): QingmaoFactionStanceSubject[] {
  return rulesFile.factionAllowlist.map(cloneFaction);
}

export function listQingmaoFactionStanceRules(): QingmaoFactionStanceRule[] {
  return rulesFile.stanceRules.map(cloneRule);
}

export function buildQingmaoFactionStanceProjection(
  input: QingmaoFactionStanceProjectionInput = {},
): QingmaoFactionStanceProjectionResult {
  const stateRefs = collectStateRefs(input);
  const maxProjections = Math.max(
    1,
    Math.floor(Number(input.maxProjections ?? rulesFile.boundaries.maxProjectionsPerAction)),
  );
  const projections = rulesFile.stanceRules
    .map((rule): QingmaoFactionStanceProjection | null => {
      const faction = factionById(rule.factionId);
      if (!faction || faction.runtimeStandingScore) return null;
      const visibleSourceRefs = unique(rule.triggerRefs.filter(ref => refMatches(ref, stateRefs)));
      if (visibleSourceRefs.length === 0) return null;
      return {
        id: projectionId(rule),
        ruleId: rule.id,
        factionRef: faction.id,
        factionLabel: faction.displayName,
        stanceAxis: rule.stanceAxis,
        publicReason: `${rule.localSummary} 触发依据：${rule.publicTrigger}`,
        severity: rule.severity,
        visibleSourceRefs,
        recommendedFollowUps: [...rule.recommendedFollowUps],
        blockedUpgrades: [...rule.blockedUpgrades, ...rulesFile.boundaries.forbiddenWrites],
        escalationBlocked: isEscalationBlocked(rule),
        canPatch: false,
      };
    })
    .filter((projection): projection is QingmaoFactionStanceProjection => Boolean(projection))
    .sort((a, b) => projectionSortScore(b) - projectionSortScore(a))
    .slice(0, maxProjections);

  const blocked = projections.length === 0;
  const visibleSourceRefs = unique(projections.flatMap(projection => projection.visibleSourceRefs));

  return {
    blocked,
    message: blocked
      ? '缺少可公开推演的势力态度输入，暂不生成势力投影。'
      : `已生成 ${projections.length} 条青茅势力态度/压力候选投影；第一刀只读，不写入存档。`,
    publicSummary: blocked
      ? '当前没有可公开归因的势力态度候选。'
      : `当前公开行动可被 ${projections.length} 类势力解释为压力、机会或风险；这些只是候选投影。`,
    projections,
    matchedRuleIds: projections.map(projection => projection.ruleId),
    visibleSourceRefs,
    rejectedReasons: blocked ? ['missing_public_faction_stance_evidence'] : [],
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    intakeReviewRef: rulesFile.sourceReview.intakeReview,
    statePatchApplied: false,
  };
}
