import type {
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionDomain,
  WorldActionResolution,
  WorldActionResolutionMode,
  WorldActionRisk,
  WorldActionSource,
} from '../types';

const DEFAULT_AI_BOUNDARIES = [
  '不得改写本地行动胜负。',
  '不得改写 AP、资源、奖励、材料、蛊虫、地点或归属。',
  '不得把传闻写成正式奖励或原著硬事实。',
];

function ensureArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function stableHash(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeRisk(value: unknown): WorldActionRisk {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

function normalizeSource(value: unknown): WorldActionSource {
  return value === 'engine'
    || value === 'player_choice'
    || value === 'location'
    || value === 'faction'
    || value === 'inheritance'
    || value === 'blessed_land'
    || value === 'calamity'
    || value === 'ai-rumor'
    ? value
    : 'ai-rumor';
}

function normalizeApCost(value: unknown): number {
  if (!Number.isFinite(Number(value))) return 1;
  return Math.max(0, Math.round(Number(value)));
}

function actionTypeForDomain(domain: WorldActionDomain): LocalActionLedgerEntry['actionType'] {
  if (domain === 'training_ground') return 'training_ground';
  if (domain === 'inheritance' || domain === 'blessed_land') return 'inheritance';
  if (domain === 'calamity') return 'calamity';
  if (domain === 'combat') return 'combat';
  if (domain === 'field_action') return 'field_action';
  return 'other';
}

export function createWorldActionCandidate(input: Partial<WorldActionCandidate> & {
  domain: WorldActionDomain;
  title: string;
  summary: string;
  sceneId: string;
  createdTurn: number;
}): WorldActionCandidate {
  const id = input.id || `world_candidate_${input.domain}_${input.createdTurn}_${stableHash(`${input.title}:${input.summary}`)}`;
  return {
    id,
    domain: input.domain,
    sourceId: input.sourceId,
    title: input.title,
    summary: input.summary,
    source: normalizeSource(input.source),
    sceneId: input.sceneId,
    locationId: input.locationId,
    risk: normalizeRisk(input.risk),
    apCost: normalizeApCost(input.apCost),
    blockers: ensureArray(input.blockers),
    warnings: ensureArray(input.warnings),
    tags: ensureArray(input.tags),
    createdTurn: Number(input.createdTurn || 1),
    metadata: input.metadata,
  };
}

export function createWorldActionDeparture(input: {
  candidate: WorldActionCandidate;
  turn?: number;
  mode?: WorldActionResolutionMode;
  chargeAp?: boolean;
  summary?: string;
  blockers?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}): WorldActionDeparture {
  const candidate = input.candidate;
  const turn = Number(input.turn || candidate.createdTurn || 1);
  const mode = input.mode || (candidate.blockers.length > 0 ? 'blocked' : 'local_resolution');
  return {
    id: `world_departure_${candidate.id}_${turn}`,
    candidateId: candidate.id,
    domain: candidate.domain,
    sceneId: candidate.sceneId,
    turn,
    apCost: candidate.apCost,
    chargeAp: input.chargeAp ?? (candidate.apCost > 0 && mode !== 'blocked'),
    mode,
    summary: input.summary || candidate.summary,
    blockers: [...candidate.blockers, ...ensureArray(input.blockers)],
    warnings: [...candidate.warnings, ...ensureArray(input.warnings)],
    metadata: input.metadata,
  };
}

export function createWorldActionResolution(input: {
  departure: WorldActionDeparture;
  status?: WorldActionResolution['status'];
  summary: string;
  localFacts?: string[];
  risks?: string[];
  blockedReasons?: string[];
  rewardPolicy?: WorldActionResolution['rewardPolicy'];
  metadata?: Record<string, unknown>;
}): WorldActionResolution {
  const departure = input.departure;
  const blockedReasons = [...departure.blockers, ...ensureArray(input.blockedReasons)];
  const status = input.status || (blockedReasons.length > 0 ? 'blocked' : 'resolved');
  return {
    id: `world_resolution_${departure.candidateId}_${departure.turn}`,
    departureId: departure.id,
    candidateId: departure.candidateId,
    domain: departure.domain,
    sceneId: departure.sceneId,
    turn: departure.turn,
    status,
    summary: input.summary,
    localFacts: ensureArray(input.localFacts),
    risks: [...departure.warnings, ...ensureArray(input.risks)],
    blockedReasons,
    rewardPolicy: input.rewardPolicy || 'local_engine_only',
    metadata: input.metadata,
  };
}

export function projectWorldActionLedgerEntry(input: {
  departure: WorldActionDeparture;
  resolution?: WorldActionResolution;
  source?: string;
}): LocalActionLedgerEntry {
  const { departure, resolution } = input;
  const summary = resolution?.summary || departure.summary;
  return {
    id: `world_action_ledger_${departure.candidateId}_${departure.turn}`,
    turn: departure.turn,
    sceneId: departure.sceneId,
    actionType: actionTypeForDomain(departure.domain),
    source: input.source || 'world_action_protocol',
    cost: departure.chargeAp ? departure.apCost : 0,
    summary,
    systemResult: {
      worldAction: {
        candidateId: departure.candidateId,
        departureId: departure.id,
        resolutionId: resolution?.id,
        domain: departure.domain,
        mode: departure.mode,
        status: resolution?.status || 'departed',
        rewardPolicy: resolution?.rewardPolicy,
        localFacts: resolution?.localFacts || [],
      },
    },
    risks: [...departure.warnings, ...(resolution?.risks || [])],
  };
}

export function buildNarrativeReturnContext(input: {
  sceneId: string;
  turn: number;
  ledgerEntries: LocalActionLedgerEntry[];
  resolutions?: WorldActionResolution[];
  extraFacts?: string[];
  extraRisks?: string[];
  extraBlockedReasons?: string[];
}): NarrativeReturnContext {
  const resolutions = input.resolutions || [];
  const facts = [
    ...resolutions.flatMap(item => item.localFacts.length > 0 ? item.localFacts : [item.summary]),
    ...ensureArray(input.extraFacts),
  ].filter(Boolean);
  const risks = [
    ...resolutions.flatMap(item => item.risks),
    ...input.ledgerEntries.flatMap(entry => entry.risks || []),
    ...ensureArray(input.extraRisks),
  ].filter(Boolean);
  const blockedReasons = [
    ...resolutions.flatMap(item => item.blockedReasons),
    ...ensureArray(input.extraBlockedReasons),
  ].filter(Boolean);
  const ledgerEntryIds = input.ledgerEntries.map(entry => entry.id);
  const actionIds = resolutions.length > 0
    ? resolutions.map(item => item.candidateId)
    : input.ledgerEntries.map(entry => String((entry.systemResult as any)?.worldAction?.candidateId || entry.id));
  const promptSummary = facts.length > 0
    ? facts.map(fact => `- ${fact}`).join('\n')
    : '- 本地行动已记录，但没有新增可回流事实。';
  return {
    id: `narrative_return_${input.sceneId}_${input.turn}_${stableHash(ledgerEntryIds.join(':'))}`,
    sceneId: input.sceneId,
    turn: input.turn,
    ledgerEntryIds,
    actionIds,
    facts,
    risks,
    blockedReasons,
    promptSummary,
    aiMutationBoundaries: DEFAULT_AI_BOUNDARIES,
  };
}

export function formatNarrativeReturnContext(context: NarrativeReturnContext): string {
  return [
    '【v0.9 行动回流事实】',
    `场景：${context.sceneId}；回合：${context.turn}。`,
    '本地事实：',
    context.promptSummary,
    context.risks.length > 0 ? `风险：${context.risks.join('；')}` : '风险：暂无新增风险。',
    context.blockedReasons.length > 0 ? `阻断：${context.blockedReasons.join('；')}` : '阻断：暂无。',
    'AI 边界：',
    ...context.aiMutationBoundaries.map(item => `- ${item}`),
  ].join('\n');
}
