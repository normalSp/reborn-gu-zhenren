import socialFollowupRulesRaw from '../canon/qingmao-social-followup-rules.json';
import type { QingmaoFactionStanceProjectionResult } from './v013-qingmao-faction-stance';
import type { QingmaoNpcMemoryProjectionResult } from './v013-qingmao-npc-memory';
import type { QingmaoPublicEventChronicleResult } from './v013-qingmao-public-event-chronicle';

export type QingmaoSocialFollowupKind =
  | 'explain'
  | 'message'
  | 'cover'
  | 'avoid'
  | 'investigate';

export type QingmaoSocialFollowupRisk = 'low' | 'medium' | 'high' | 'blocked';

export interface QingmaoSocialFollowupRule {
  id: string;
  triggerRefs: string[];
  kind: QingmaoSocialFollowupKind;
  title: string;
  publicReason: string;
  riskLevel: QingmaoSocialFollowupRisk;
  blockedUpgrades: string[];
}

export interface QingmaoSocialFollowupCandidate {
  id: string;
  ruleId: string;
  kind: QingmaoSocialFollowupKind;
  title: string;
  publicReason: string;
  riskLevel: QingmaoSocialFollowupRisk;
  visibleSourceRefs: string[];
  blockedUpgrades: string[];
  createsFormalTask: false;
  grantsReward: false;
  canPatch: false;
}

export interface QingmaoSocialFollowupInput {
  npcMemory?: QingmaoNpcMemoryProjectionResult | null;
  factionStance?: QingmaoFactionStanceProjectionResult | null;
  publicChronicle?: QingmaoPublicEventChronicleResult | null;
  maxFollowups?: number;
}

export interface QingmaoSocialFollowupResult {
  blocked: boolean;
  message: string;
  publicSummary: string;
  candidates: QingmaoSocialFollowupCandidate[];
  matchedRuleIds: string[];
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenWrites: string[];
  statePatchApplied: false;
}

interface QingmaoSocialFollowupRulesFile {
  boundaries: {
    maxFollowups: number;
    forbiddenWrites: string[];
  };
  followupRules: QingmaoSocialFollowupRule[];
}

const rulesFile = socialFollowupRulesRaw as QingmaoSocialFollowupRulesFile;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function cloneRule(rule: QingmaoSocialFollowupRule): QingmaoSocialFollowupRule {
  return {
    ...rule,
    triggerRefs: [...rule.triggerRefs],
    blockedUpgrades: [...rule.blockedUpgrades],
  };
}

function collectFollowupRefs(input: QingmaoSocialFollowupInput): string[] {
  return unique([
    ...(input.npcMemory?.projections || []).flatMap(projection => [
      ...projection.recommendedFollowUps,
      `npc_projection:${projection.ruleId}`,
      ...projection.visibleSourceRefs,
    ]),
    ...(input.factionStance?.projections || []).flatMap(projection => [
      ...projection.recommendedFollowUps,
      `faction_projection:${projection.ruleId}`,
      ...projection.visibleSourceRefs,
    ]),
    ...(input.publicChronicle?.events || []).flatMap(event => [
      ...event.recommendedFollowUps,
      `public_event:${event.ruleId}`,
      ...event.visibleSourceRefs,
    ]),
  ]);
}

function refMatches(triggerRef: string, sourceRefs: string[]): boolean {
  return sourceRefs.some(ref => ref === triggerRef || ref.startsWith(`${triggerRef}:`));
}

function riskScore(risk: QingmaoSocialFollowupRisk): number {
  return {
    blocked: 4,
    high: 3,
    medium: 2,
    low: 1,
  }[risk];
}

export function listQingmaoSocialFollowupRules(): QingmaoSocialFollowupRule[] {
  return rulesFile.followupRules.map(cloneRule);
}

export function buildQingmaoSocialFollowups(
  input: QingmaoSocialFollowupInput = {},
): QingmaoSocialFollowupResult {
  const sourceRefs = collectFollowupRefs(input);
  const maxFollowups = Math.max(
    1,
    Math.floor(Number(input.maxFollowups ?? rulesFile.boundaries.maxFollowups)),
  );
  const candidates = rulesFile.followupRules
    .map((rule): QingmaoSocialFollowupCandidate | null => {
      const visibleSourceRefs = unique(rule.triggerRefs.filter(ref => refMatches(ref, sourceRefs)));
      if (visibleSourceRefs.length === 0) return null;
      return {
        id: rule.id,
        ruleId: rule.id,
        kind: rule.kind,
        title: rule.title,
        publicReason: rule.publicReason,
        riskLevel: rule.riskLevel,
        visibleSourceRefs,
        blockedUpgrades: [...rule.blockedUpgrades, ...rulesFile.boundaries.forbiddenWrites],
        createsFormalTask: false,
        grantsReward: false,
        canPatch: false,
      };
    })
    .filter((candidate): candidate is QingmaoSocialFollowupCandidate => Boolean(candidate))
    .sort((a, b) => riskScore(b.riskLevel) - riskScore(a.riskLevel) || b.visibleSourceRefs.length - a.visibleSourceRefs.length)
    .slice(0, maxFollowups);

  const blocked = candidates.length === 0;
  return {
    blocked,
    message: blocked
      ? '缺少可升级为后续候选的社会记忆输入。'
      : `已生成 ${candidates.length} 条社会后续行动候选；第一刀只读，不创建正式任务。`,
    publicSummary: blocked
      ? '当前没有可执行的社会后续候选。'
      : `当前可提供 ${candidates.length} 个解释、递话、遮掩或避险候选。`,
    candidates,
    matchedRuleIds: candidates.map(candidate => candidate.ruleId),
    visibleSourceRefs: unique(candidates.flatMap(candidate => candidate.visibleSourceRefs)),
    rejectedReasons: blocked ? ['missing_social_followup_evidence'] : [],
    forbiddenWrites: [...rulesFile.boundaries.forbiddenWrites],
    statePatchApplied: false,
  };
}
