import fangYuanEvidenceRaw from '../canon/qingmao-fang-yuan-public-evidence.json';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import type { WorldIntentAdjudication } from './v011-world-intent-engine';
import type {
  HiddenFactRefState,
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingWorldState,
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  PlayerKnownFact,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
} from '../types';

const ACTION_ID = 'qingmao_fang_yuan_public_evidence_inquiry';

export interface QingmaoFangYuanEvidenceItem {
  id: string;
  sourceItemId: string;
  category: string;
  scope: PlayerKnownFact['scope'];
  confidence: PlayerKnownFact['confidence'];
  publiclyObservable: boolean;
  publicTrigger: string;
  playerVisibleSummary: string;
  hiddenBoundary: string;
  hiddenBoundaryRefId?: string;
  likelyReactions: string[];
  tags: string[];
  sourcePointerIds: string[];
}

export interface QingmaoFangYuanHiddenBoundaryRef {
  id: string;
  sourceItemId: string;
  scope: HiddenFactRefState['scope'];
  sourcePointerIds: string[];
  revealPolicyId: string;
  publicBlockSummary: string;
  forbiddenReveals: string[];
}

export interface QingmaoFangYuanInquiryProfile {
  id: string;
  matchKeywords: string[];
  evidenceItemIds: string[];
  hiddenBoundaryRefIds: string[];
  pressureType: LivingFactionPressureEntry['pressureType'];
  pressureDelta: number;
  publicSummary: string;
}

export interface QingmaoFangYuanPublicEvidencePlan {
  matchedProfiles: QingmaoFangYuanInquiryProfile[];
  evidenceItems: QingmaoFangYuanEvidenceItem[];
  hiddenBoundaryRefs: QingmaoFangYuanHiddenBoundaryRef[];
  publicSummary: string;
  visibleSourceRefs: string[];
  forbiddenWrites: string[];
  intakeReviewRef: string;
}

export interface QingmaoFangYuanPublicEvidenceInput {
  adjudication?: WorldIntentAdjudication | null;
  rawText?: string | null;
  targetRef?: string | null;
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
}

export interface QingmaoFangYuanPublicEvidenceResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  knownFacts: PlayerKnownFact[];
  hiddenFactRefs: HiddenFactRefState[];
  npcMemories: LivingNpcMemoryEntry[];
  factionPressure: LivingFactionPressureEntry[];
  actionConsequences: LivingActionConsequenceEntry[];
  deepSeekVisibleFactIds: string[];
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
  evidencePlan: QingmaoFangYuanPublicEvidencePlan;
  statePatchApplied: false;
}

interface QingmaoFangYuanPublicEvidenceFile {
  sourceReview: {
    intakeReview: string;
  };
  boundaries: {
    forbiddenWrites: string[];
  };
  evidenceItems: QingmaoFangYuanEvidenceItem[];
  hiddenBoundaryRefs: QingmaoFangYuanHiddenBoundaryRef[];
  inquiryProfiles: QingmaoFangYuanInquiryProfile[];
}

const evidenceFile = fangYuanEvidenceRaw as QingmaoFangYuanPublicEvidenceFile;

function unique<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: QingmaoFangYuanPublicEvidenceInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoFangYuanPublicEvidenceInput): string {
  return input.sceneId || 'v012_fang_yuan_public_evidence';
}

function currentLocationId(input: QingmaoFangYuanPublicEvidenceInput): string {
  return input.locationId || 'qingmao_public_inquiry';
}

function inquiryText(input: QingmaoFangYuanPublicEvidenceInput): string {
  return [
    input.rawText,
    input.adjudication?.candidate.rawText,
    input.targetRef,
    input.adjudication?.candidate.targetRef,
  ].filter(Boolean).join(' ').toLowerCase();
}

function targetRef(input: QingmaoFangYuanPublicEvidenceInput): string {
  return input.targetRef || input.adjudication?.candidate.targetRef || '';
}

function cloneEvidenceItem(item: QingmaoFangYuanEvidenceItem): QingmaoFangYuanEvidenceItem {
  return {
    ...item,
    likelyReactions: [...item.likelyReactions],
    tags: [...item.tags],
    sourcePointerIds: [...item.sourcePointerIds],
  };
}

function cloneHiddenBoundaryRef(item: QingmaoFangYuanHiddenBoundaryRef): QingmaoFangYuanHiddenBoundaryRef {
  return {
    ...item,
    sourcePointerIds: [...item.sourcePointerIds],
    forbiddenReveals: [...item.forbiddenReveals],
  };
}

function cloneInquiryProfile(item: QingmaoFangYuanInquiryProfile): QingmaoFangYuanInquiryProfile {
  return {
    ...item,
    matchKeywords: [...item.matchKeywords],
    evidenceItemIds: [...item.evidenceItemIds],
    hiddenBoundaryRefIds: [...item.hiddenBoundaryRefIds],
  };
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase();
}

function profileMatches(profile: QingmaoFangYuanInquiryProfile, text: string): boolean {
  const normalized = normalizeText(text);
  return profile.matchKeywords.some(keyword => normalized.includes(normalizeText(keyword)));
}

export function listQingmaoFangYuanPublicEvidenceItems(): QingmaoFangYuanEvidenceItem[] {
  return evidenceFile.evidenceItems.map(cloneEvidenceItem);
}

export function listQingmaoFangYuanInquiryProfiles(): QingmaoFangYuanInquiryProfile[] {
  return evidenceFile.inquiryProfiles.map(cloneInquiryProfile);
}

export function buildQingmaoFangYuanPublicEvidencePlan(
  input: QingmaoFangYuanPublicEvidenceInput = {},
): QingmaoFangYuanPublicEvidencePlan {
  const text = inquiryText(input);
  const matchedProfiles = evidenceFile.inquiryProfiles
    .filter(profile => profileMatches(profile, text));
  const profiles = matchedProfiles.length > 0
    ? matchedProfiles
    : evidenceFile.inquiryProfiles.filter(profile => profile.id === 'general_public_evidence');
  const evidenceIds = unique(profiles.flatMap(profile => profile.evidenceItemIds));
  const evidenceItems = evidenceIds
    .map(id => evidenceFile.evidenceItems.find(item => item.id === id))
    .filter((item): item is QingmaoFangYuanEvidenceItem => Boolean(item))
    .map(cloneEvidenceItem);
  const boundaryIds = unique([
    ...profiles.flatMap(profile => profile.hiddenBoundaryRefIds),
    ...evidenceItems.map(item => item.hiddenBoundaryRefId || ''),
  ]);
  const hiddenBoundaryRefs = boundaryIds
    .map(id => evidenceFile.hiddenBoundaryRefs.find(item => item.id === id))
    .filter((item): item is QingmaoFangYuanHiddenBoundaryRef => Boolean(item))
    .map(cloneHiddenBoundaryRef);
  const visibleSourceRefs = unique([
    ...evidenceItems.map(item => `mirofish:${item.sourceItemId}`),
    ...hiddenBoundaryRefs.map(item => `hiddenBoundary:${item.id}`),
    ...evidenceItems.flatMap(item => item.sourcePointerIds.map(id => `sourcePointer:${id}`)),
  ]);

  return {
    matchedProfiles: profiles.map(cloneInquiryProfile),
    evidenceItems,
    hiddenBoundaryRefs,
    publicSummary: profiles.length > 0
      ? `已匹配 ${profiles.length} 个方源公开旁证面，得到 ${evidenceItems.length} 条公开表象和 ${hiddenBoundaryRefs.length} 条隐藏边界。`
      : '缺少方源公开旁证匹配面。',
    visibleSourceRefs,
    forbiddenWrites: [...evidenceFile.boundaries.forbiddenWrites],
    intakeReviewRef: evidenceFile.sourceReview.intakeReview,
  };
}

function knownFactId(item: QingmaoFangYuanEvidenceItem): string {
  return `fang_yuan_public_evidence_${item.id.replace(/^fy_public_/, '')}`;
}

function hiddenRefState(item: QingmaoFangYuanHiddenBoundaryRef, turn: number): HiddenFactRefState {
  return {
    id: item.id,
    scope: item.scope,
    sourcePointer: item.sourcePointerIds.join(';'),
    revealPolicyId: item.revealPolicyId,
    guard: 'hidden',
    lastCheckedTurn: turn,
  };
}

function buildCandidate(
  input: QingmaoFangYuanPublicEvidenceInput,
  plan: QingmaoFangYuanPublicEvidencePlan,
  blockers: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'living_world:fang_yuan_public_evidence',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '方源公开旁证询问',
    summary: plan.publicSummary,
    risk: 'high',
    apCost: 0,
    blockers,
    warnings: [
      '只允许公开旁证。',
      '不判定追踪成功或抓捕结果。',
      '不展示隐藏事实。',
      '不改变方源轨迹或正史锚点。',
    ],
    tags: ['v0.12.0-b3', 'qingmao_living_world', 'fang_yuan_public_evidence'],
    metadata: {
      saveFormatImpact: 'none',
      matchedProfileIds: plan.matchedProfiles.map(profile => profile.id),
      evidenceItemIds: plan.evidenceItems.map(item => item.id),
      hiddenBoundaryRefIds: plan.hiddenBoundaryRefs.map(item => item.id),
      intakeReviewRef: plan.intakeReviewRef,
      forbiddenUpgrades: plan.forbiddenWrites,
    },
  });
}

function buildKnownFacts(plan: QingmaoFangYuanPublicEvidencePlan, turn: number): PlayerKnownFact[] {
  return plan.evidenceItems.map(item => ({
    id: knownFactId(item),
    scope: item.scope,
    source: item.publiclyObservable ? 'player_observation' : 'canon_summary',
    summary: item.playerVisibleSummary,
    learnedTurn: turn,
    confidence: item.confidence,
    tags: unique(['v0.12.0-b3', 'fang_yuan_public_evidence', ...item.tags]),
  }));
}

function buildNpcMemory(
  plan: QingmaoFangYuanPublicEvidencePlan,
  turn: number,
): LivingNpcMemoryEntry {
  return {
    id: 'npc_memory_fang_yuan_public_evidence_inquiry_caution',
    npcId: 'fang_yuan',
    turn,
    regionId: 'qingmao',
    actionId: ACTION_ID,
    publicSummary: '有人从公开渠道打听方源住处、族学、任务或商队相关痕迹；结果只形成旁证和警觉风险。',
    privateRefId: plan.hiddenBoundaryRefs[0]?.id || null,
    attitudeDelta: 0,
    weight: Math.max(1, Math.min(3, plan.hiddenBoundaryRefs.length + 1)),
    tags: ['v0.12.0-b3', 'public_evidence_inquiry', 'hidden_boundary_guard'],
    expiresTurn: null,
  };
}

function buildFactionPressure(
  plan: QingmaoFangYuanPublicEvidencePlan,
  turn: number,
): LivingFactionPressureEntry[] {
  const maxDelta = Math.max(1, Math.min(3, Math.max(...plan.matchedProfiles.map(profile => profile.pressureDelta), 1)));
  return [{
    id: 'faction_pressure_fang_yuan_public_evidence_guyue_shanzhai_suspicion',
    factionId: 'guyue_shanzhai',
    pressureType: 'suspicion',
    delta: maxDelta,
    reason: `围绕方源公开旁证的打听会增加山寨内部警觉；匹配面：${plan.matchedProfiles.map(profile => profile.publicSummary).join('；')}。`,
    turn,
    visibility: 'player_visible',
  }];
}

export function resolveQingmaoFangYuanPublicEvidenceAction(
  input: QingmaoFangYuanPublicEvidenceInput = {},
): QingmaoFangYuanPublicEvidenceResolution {
  const turn = currentTurn(input);
  const plan = buildQingmaoFangYuanPublicEvidencePlan(input);
  const isFangYuanInquiry = targetRef(input) === 'npc:fang_yuan' || inquiryText(input).includes('方源');
  const rejectedReasons = isFangYuanInquiry ? [] : ['target_not_fang_yuan'];
  const candidate = buildCandidate(input, plan, rejectedReasons);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: rejectedReasons.length > 0 ? 'blocked' : 'local_resolution',
    chargeAp: false,
    metadata: {
      visibleSourceRefs: plan.visibleSourceRefs,
      intakeReviewRef: plan.intakeReviewRef,
    },
  });

  if (rejectedReasons.length > 0) {
    const resolution = createWorldActionResolution({
      departure,
      status: 'blocked',
      summary: '方源公开旁证询问被阻断：当前目标不是方源公开旁证。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades: plan.forbiddenWrites },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v012_qingmao_fang_yuan_public_evidence',
    });
    const narrativeReturnContext = buildNarrativeReturnContext({
      sceneId: candidate.sceneId,
      turn,
      ledgerEntries: [ledger],
      resolutions: [resolution],
    });

    return {
      success: false,
      blocked: true,
      message: '当前目标不是方源公开旁证，无法执行 b3 询问。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      visibleSourceRefs: plan.visibleSourceRefs,
      rejectedReasons,
      forbiddenUpgrades: plan.forbiddenWrites,
      knownFacts: [],
      hiddenFactRefs: [],
      npcMemories: [],
      factionPressure: [],
      actionConsequences: [],
      deepSeekVisibleFactIds: [],
      worldActionCandidate: candidate,
      worldActionDeparture: departure,
      worldActionResolution: resolution,
      worldActionLedgerEntry: ledger,
      narrativeReturnContext,
      evidencePlan: plan,
      statePatchApplied: false,
    };
  }

  const knownFacts = buildKnownFacts(plan, turn);
  const hiddenFactRefs = plan.hiddenBoundaryRefs.map(item => hiddenRefState(item, turn));
  const npcMemory = buildNpcMemory(plan, turn);
  const factionPressure = buildFactionPressure(plan, turn);
  const consequence: LivingActionConsequenceEntry = {
    id: 'consequence_qingmao_fang_yuan_public_evidence_inquiry',
    actionId: ACTION_ID,
    turn,
    scope: 'npc',
    publicSummary: `方源公开旁证询问完成：获得 ${knownFacts.length} 条公开表象，${hiddenFactRefs.length} 条隐藏边界只作本地保护引用。`,
    effectRefs: [
      ...knownFacts.map(fact => fact.id),
      ...hiddenFactRefs.map(ref => ref.id),
      npcMemory.id,
      ...factionPressure.map(entry => entry.id),
    ],
    followUpRefs: [
      'gate:public_evidence_only',
      'gate:no_tracking_success',
      'gate:no_hidden_fact_reveal',
      'gate:no_canon_anchor_change',
    ],
  };
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: consequence.publicSummary,
    localFacts: [
      plan.publicSummary,
      ...knownFacts.slice(0, 5).map(fact => fact.summary),
      '本行动只允许公开旁证，不判定追踪成功、抓捕结果、隐藏事实或正史改变。',
    ],
    risks: unique([
      'counter_observation',
      'relationship_pressure',
      ...plan.matchedProfiles.map(profile => profile.pressureType),
    ]),
    rewardPolicy: 'none',
    metadata: {
      visibleSourceRefs: plan.visibleSourceRefs,
      matchedProfileIds: plan.matchedProfiles.map(profile => profile.id),
      evidenceItemIds: plan.evidenceItems.map(item => item.id),
      hiddenBoundaryRefIds: plan.hiddenBoundaryRefs.map(item => item.id),
      forbiddenUpgrades: plan.forbiddenWrites,
      intakeReviewRef: plan.intakeReviewRef,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v012_qingmao_fang_yuan_public_evidence',
  });
  const narrativeReturnContext = buildNarrativeReturnContext({
    sceneId: candidate.sceneId,
    turn,
    ledgerEntries: [ledger],
    resolutions: [resolution],
  });

  return {
    success: true,
    blocked: false,
    message: `已完成方源公开旁证询问：新增 ${knownFacts.length} 条公开表象，隐藏边界只作本地保护。`,
    publicSummary: consequence.publicSummary,
    actionId: ACTION_ID,
    visibleSourceRefs: plan.visibleSourceRefs,
    rejectedReasons: [],
    forbiddenUpgrades: plan.forbiddenWrites,
    knownFacts,
    hiddenFactRefs,
    npcMemories: [npcMemory],
    factionPressure,
    actionConsequences: [consequence],
    deepSeekVisibleFactIds: knownFacts.map(fact => fact.id),
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    evidencePlan: plan,
    statePatchApplied: false,
  };
}
