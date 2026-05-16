import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import type {
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingWorldState,
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
} from '../types';

const ACTION_ID = 'qingmao_baijia_contact_window_probe';
const REGION_ID = 'qingmao_three_clans';
const BAI_FACTION_ID = 'baijia_zhai';

const START_PROFILE_FACTIONS: Record<string, string> = {
  start_qingmaoshan_guyue: 'guyue_shanzhai',
  start_qingmaoshan_xiongjia: 'xiongjia_zhai',
  start_qingmaoshan_baijia: 'baijia_zhai',
  start_qingmaoshan_shangjia_caravan: 'shangjia',
  start_qingmaoshan_wujia_branch: 'wujia',
  start_qingmaoshan_tiejia_patrol: 'tiejia',
  start_qingmaoshan_sanxiu: 'sanxiu',
};

export interface QingmaoBaiContactWindowInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
}

export interface QingmaoBaiContactWindowResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  factionPressure: LivingFactionPressureEntry[];
  actionConsequences: LivingActionConsequenceEntry[];
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
  statePatchApplied: false;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: QingmaoBaiContactWindowInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoBaiContactWindowInput): string {
  return input.sceneId || 'v011_qingmao_bai_contact_window';
}

function currentLocationId(input: QingmaoBaiContactWindowInput): string {
  return input.locationId || 'qingmaoshan_public_contact';
}

function currentFactionId(input: QingmaoBaiContactWindowInput): string | null {
  if (input.playerFactionId) return input.playerFactionId;
  const startProfileId = input.selectedStartProfileId || '';
  return START_PROFILE_FACTIONS[startProfileId] || null;
}

function visibleSourceRefs(state?: Partial<LivingWorldState> | null): string[] {
  const known = new Set(Object.keys(state?.knownFacts || {}));
  const hasBaiOpportunity = Boolean(state?.factionPressure?.some(entry => (
    entry.factionId === BAI_FACTION_ID
    && entry.pressureType === 'opportunity'
    && entry.visibility === 'player_visible'
  )));
  return uniqueStrings([
    known.has('qingmao_three_clans_layout') ? 'fact:qingmao_three_clans_layout' : '',
    known.has('baijia_bai_ning_bing_public_talent') ? 'fact:baijia_bai_ning_bing_public_talent' : '',
    hasBaiOpportunity ? 'pressure:baijia_zhai:opportunity' : '',
  ]);
}

function buildCandidate(input: QingmaoBaiContactWindowInput, blockers: string[]): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'other',
    source: 'player_choice',
    sourceId: 'followup_baijia_visible_contact_probe',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '白家接触窗口试探',
    summary: '通过公开渠道核对白家接触窗口，只形成递话痕迹和风险记录，不改变势力归属。',
    risk: 'medium',
    apCost: 0,
    blockers,
    warnings: [
      '不是入族、归附或身份变更结果。',
      '不改变阵营、声望、地点或奖励。',
      '不得触发白凝冰重大 IF 或原著锚点变化。',
    ],
    tags: ['v0.11.0-b2', 'qingmao_living_world', 'baijia_contact_window'],
    metadata: {
      regionId: REGION_ID,
      saveFormatImpact: 'none',
      forbiddenUpgrades: [
        'faction_transfer',
        'standing_delta',
        'reward',
        'location_unlock',
        'npc_state_change',
        'canon_anchor_change',
      ],
    },
  });
}

function buildFactionPressure(input: QingmaoBaiContactWindowInput, turn: number): LivingFactionPressureEntry[] {
  const factionId = currentFactionId(input);
  const suspicionFactionId = factionId && factionId !== BAI_FACTION_ID ? factionId : BAI_FACTION_ID;
  return [
    {
      id: 'faction_pressure_qingmao_baijia_contact_window_opportunity',
      factionId: BAI_FACTION_ID,
      pressureType: 'opportunity',
      delta: 3,
      reason: '公开渠道递话形成白家接触窗口；这不是白家身份或声望提升。',
      turn,
      visibility: 'player_visible',
    },
    {
      id: `faction_pressure_qingmao_baijia_contact_window_${suspicionFactionId}_suspicion`,
      factionId: suspicionFactionId,
      pressureType: 'suspicion',
      delta: factionId === BAI_FACTION_ID ? 1 : 3,
      reason: '接触白家的试探会留下身份暴露与被追查风险；当前只记录压力，不结算惩罚。',
      turn,
      visibility: 'player_visible',
    },
  ];
}

export function resolveQingmaoBaiContactWindowAction(
  input: QingmaoBaiContactWindowInput = {},
): QingmaoBaiContactWindowResolution {
  const turn = currentTurn(input);
  const sourceRefs = visibleSourceRefs(input.livingWorldState);
  const rejectedReasons = sourceRefs.length === 0 ? ['missing_visible_baijia_contact_evidence'] : [];
  const candidate = buildCandidate(input, rejectedReasons);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: rejectedReasons.length > 0 ? 'blocked' : 'local_resolution',
    chargeAp: false,
    metadata: {
      regionId: REGION_ID,
      visibleSourceRefs: sourceRefs,
    },
  });
  const forbiddenUpgrades = [
    'faction_transfer',
    'standing_delta',
    'reward',
    'location_unlock',
    'npc_state_change',
    'canon_anchor_change',
    'bai_ning_bing_major_if',
  ];

  if (rejectedReasons.length > 0) {
    const resolution = createWorldActionResolution({
      departure,
      status: 'blocked',
      summary: '白家接触窗口试探被阻断：缺少当前玩家已掌握的白家公开线索。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v011_qingmao_bai_contact_window',
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
      message: '缺少白家公开线索，暂不能执行接触窗口试探。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      visibleSourceRefs: sourceRefs,
      rejectedReasons,
      forbiddenUpgrades,
      factionPressure: [],
      actionConsequences: [],
      worldActionCandidate: candidate,
      worldActionDeparture: departure,
      worldActionResolution: resolution,
      worldActionLedgerEntry: ledger,
      narrativeReturnContext,
      statePatchApplied: false,
    };
  }

  const factionPressure = buildFactionPressure(input, turn);
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '白家接触窗口试探已记录：公开递话形成机会与暴露风险，但没有投靠、声望、地点或奖励结算。',
    localFacts: [
      '白家接触窗口试探只形成公开递话痕迹。',
      '本行动不改变玩家势力归属、不增加声望、不开放地点、不发放奖励。',
    ],
    risks: [
      'identity_exposure',
      'faction_suspicion',
    ],
    rewardPolicy: 'none',
    metadata: {
      visibleSourceRefs: sourceRefs,
      forbiddenUpgrades,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v011_qingmao_bai_contact_window',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: 'consequence_qingmao_baijia_contact_window_probe',
    actionId: ACTION_ID,
    turn,
    scope: 'faction',
    publicSummary: '你通过公开渠道试探白家接触窗口，只留下递话痕迹、机会压力和身份暴露风险。',
    effectRefs: factionPressure.map(entry => entry.id),
    followUpRefs: [
      'followup_baijia_visible_contact_probe',
      'gate:faction_identity_review',
      'risk:identity_exposure',
    ],
  };
  const narrativeReturnContext = buildNarrativeReturnContext({
    sceneId: candidate.sceneId,
    turn,
    ledgerEntries: [ledger],
    resolutions: [resolution],
  });

  return {
    success: true,
    blocked: false,
    message: '已执行白家接触窗口试探：只记录公开递话痕迹与势力压力，不改变阵营。',
    publicSummary: consequence.publicSummary,
    actionId: ACTION_ID,
    visibleSourceRefs: sourceRefs,
    rejectedReasons: [],
    forbiddenUpgrades,
    factionPressure,
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    statePatchApplied: false,
  };
}
