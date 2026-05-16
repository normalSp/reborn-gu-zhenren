import publicEventRulesRaw from '../canon/qingmao-public-event-chronicle-rules.json';
import type {
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingWorldState,
  LocalActionLedgerEntry,
} from '../types';

export type QingmaoPublicEventScope =
  | 'player'
  | 'local_group'
  | 'faction_visible'
  | 'region_public'
  | 'merchant_visible'
  | 'npc_public';

export interface QingmaoPublicEventRule {
  id: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  category: string;
  eventScope: QingmaoPublicEventScope;
  triggerRefs: string[];
  publicSummary: string;
  promptSafe: boolean;
  recommendedFollowUps: string[];
  blockedUpgrades: string[];
}

export interface QingmaoPublicEventSummaryCandidate {
  id: string;
  ruleId: string;
  eventScope: QingmaoPublicEventScope;
  publicSummary: string;
  promptSafe: boolean;
  visibleSourceRefs: string[];
  recommendedFollowUps: string[];
  blockedUpgrades: string[];
  hiddenRefsRedacted: true;
  canPatch: false;
}

export interface QingmaoPublicEventChronicleInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  localActionLedger?: LocalActionLedgerEntry[] | null;
  maxEvents?: number;
}

export interface QingmaoPublicEventChronicleResult {
  blocked: boolean;
  message: string;
  publicSummary: string;
  promptSafePublicSummary: string | null;
  events: QingmaoPublicEventSummaryCandidate[];
  matchedRuleIds: string[];
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenWrites: string[];
  intakeReviewRef: string;
  statePatchApplied: false;
}

interface QingmaoPublicEventRulesFile {
  sourceReview: {
    intakeReview: string;
  };
  boundaries: {
    maxEventsPerSummary: number;
    forbiddenWrites: string[];
  };
  eventRules: QingmaoPublicEventRule[];
}

const rulesFile = publicEventRulesRaw as QingmaoPublicEventRulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cloneRule(rule: QingmaoPublicEventRule): QingmaoPublicEventRule {
  return {
    ...rule,
    sourceItemIds: [...rule.sourceItemIds],
    sourcePointerIds: [...rule.sourcePointerIds],
    triggerRefs: [...rule.triggerRefs],
    recommendedFollowUps: [...rule.recommendedFollowUps],
    blockedUpgrades: [...rule.blockedUpgrades],
  };
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

function collectStateRefs(input: QingmaoPublicEventChronicleInput): string[] {
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

function eventId(rule: QingmaoPublicEventRule): string {
  return `public_event_summary_${rule.id.replace(/^public_event_/, '')}`;
}

function eventSortScore(event: QingmaoPublicEventSummaryCandidate): number {
  const scopeScore: Record<QingmaoPublicEventScope, number> = {
    player: 1,
    local_group: 2,
    faction_visible: 3,
    merchant_visible: 3,
    npc_public: 4,
    region_public: 5,
  };
  return scopeScore[event.eventScope] * 10 + event.visibleSourceRefs.length;
}

export function listQingmaoPublicEventRules(): QingmaoPublicEventRule[] {
  return rulesFile.eventRules.map(cloneRule);
}

export function buildQingmaoPublicEventChronicle(
  input: QingmaoPublicEventChronicleInput = {},
): QingmaoPublicEventChronicleResult {
  const stateRefs = collectStateRefs(input);
  const maxEvents = Math.max(
    1,
    Math.floor(Number(input.maxEvents ?? rulesFile.boundaries.maxEventsPerSummary)),
  );
  const events = rulesFile.eventRules
    .map((rule): QingmaoPublicEventSummaryCandidate | null => {
      const visibleSourceRefs = unique(rule.triggerRefs.filter(ref => refMatches(ref, stateRefs)));
      if (visibleSourceRefs.length === 0) return null;
      return {
        id: eventId(rule),
        ruleId: rule.id,
        eventScope: rule.eventScope,
        publicSummary: rule.publicSummary,
        promptSafe: rule.promptSafe,
        visibleSourceRefs,
        recommendedFollowUps: [...rule.recommendedFollowUps],
        blockedUpgrades: [...rule.blockedUpgrades, ...rulesFile.boundaries.forbiddenWrites],
        hiddenRefsRedacted: true,
        canPatch: false,
      };
    })
    .filter((event): event is QingmaoPublicEventSummaryCandidate => Boolean(event))
    .sort((a, b) => eventSortScore(b) - eventSortScore(a))
    .slice(0, maxEvents);

  const blocked = events.length === 0;
  const visibleSourceRefs = unique(events.flatMap(event => event.visibleSourceRefs));
  const promptSafeEvents = events.filter(event => event.promptSafe);
  const promptSafePublicSummary = promptSafeEvents.length > 0
    ? promptSafeEvents.map(event => event.publicSummary).join(' ')
    : null;

  return {
    blocked,
    message: blocked
      ? '缺少可公开编年的行动痕迹，暂不生成公开事件摘要。'
      : `已生成 ${events.length} 条青茅公开事件摘要候选；第一刀只读，不写入存档。`,
    publicSummary: blocked
      ? '当前没有可公开压缩的事件。'
      : `当前可压缩 ${events.length} 条公开行动摘要，供玩家回看或 DeepSeek 公开叙事使用。`,
    promptSafePublicSummary,
    events,
    matchedRuleIds: events.map(event => event.ruleId),
    visibleSourceRefs,
    rejectedReasons: blocked ? ['missing_public_event_evidence'] : [],
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    intakeReviewRef: rulesFile.sourceReview.intakeReview,
    statePatchApplied: false,
  };
}
