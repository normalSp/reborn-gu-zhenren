import type {
  CombatEncounterState,
  EndingFrameworkState,
  InheritanceLandState,
  SceneSessionState,
  StoryAnchorState,
  TrainingGroundState,
} from '../types';

const STARTUP_ANCHORS = [
  { id: 'qingmao_mountain', displayName: '青茅山' },
  { id: 'shang_clan_city', displayName: '商家城' },
  { id: 'san_wang_mountain', displayName: '三王山' },
  { id: 'northern_plains_wangting', displayName: '王庭' },
  { id: 'yi_tian_mountain', displayName: '义天山' },
  { id: 'reverse_flow_river', displayName: '逆流河' },
  { id: 'dream_shadow_sect', displayName: '梦境与影宗' },
  { id: 'fate_war', displayName: '宿命战' },
  { id: 'venerable_chessboard', displayName: '尊者博弈' },
  { id: 'heavenly_court_late_chapter', displayName: '天庭末章' },
] as const;

export function createInitialStoryAnchorState(
  overrides: Partial<StoryAnchorState> = {},
): StoryAnchorState {
  const anchorResults: StoryAnchorState['anchorResults'] = Object.fromEntries(STARTUP_ANCHORS.map(anchor => [anchor.id, {
    anchorId: anchor.id,
    status: 'unseen' as const,
    canonDeviation: 0,
  }]));
  const anchorRecords: StoryAnchorState['anchorRecords'] = Object.fromEntries(STARTUP_ANCHORS.map(anchor => [anchor.id, {
    anchorId: anchor.id,
    status: 'locked' as const,
    canonDeviation: 0,
    summary: anchor.displayName,
  }]));

  return {
    version: 'v0.8.0-b3',
    fateState: 'intact',
    currentAnchorId: null,
    anchorResults,
    anchorRecords,
    ifBranchVectors: [],
    heavenWillLedger: {
      attention: 0,
      correction: 0,
      rejection: 0,
      ambiguity: 20,
      lastTriggers: [],
    },
    karmicDebtLedger: {
      totalDebt: 0,
      byKind: {},
      pendingReturns: [],
    },
    storyEventCandidates: [],
    ifBranchCandidates: [],
    canonAnchorPressureLog: [],
    lastResolutionSteps: [],
    ...overrides,
  };
}

export function createInitialEndingFrameworkState(
  overrides: Partial<EndingFrameworkState> = {},
): EndingFrameworkState {
  return {
    version: 'v0.8.0-c1',
    status: 'idle',
    lastInput: null,
    candidates: [],
    pressureLog: [],
    lastResolutionSteps: [],
    commitRecord: null,
    ...overrides,
  };
}

export function createInitialSceneSessionState(
  input: Partial<SceneSessionState> = {},
): SceneSessionState {
  const maxAp = Math.max(1, Math.min(8, Number(input.actionBudget?.maxAp ?? 3)));
  const remainingAp = Math.max(0, Math.min(maxAp, Number(input.actionBudget?.remainingAp ?? maxAp)));
  return {
    version: 'v0.8.0-c2.2',
    sceneId: input.sceneId || 'scene_bootstrap',
    narrativeTurn: Number(input.narrativeTurn ?? 1),
    locationId: input.locationId || 'unknown',
    period: input.period || 'morning',
    safety: input.safety || 'safe',
    actionBudget: {
      maxAp,
      remainingAp,
      grantedBy: input.actionBudget?.grantedBy || 'narrative_scene',
      exhaustedPolicy: input.actionBudget?.exhaustedPolicy || 'advance_narrative',
    },
    localActionLedger: Array.isArray(input.localActionLedger) ? input.localActionLedger.slice(-30) : [],
    pendingAdvanceIntent: input.pendingAdvanceIntent || null,
    lastNarrativeSummary: input.lastNarrativeSummary || '',
  };
}

export function createInitialInheritanceLandState(): InheritanceLandState {
  return {
    version: 'v0.8.0-c2.5',
    candidates: [],
    claimAttempts: [],
    completedSiteIds: [],
    claimedLandIds: [],
    activeTrial: null,
    blockedRecords: [],
    lastResolutionSteps: [],
  };
}

export function createInitialTrainingGroundState(): TrainingGroundState {
  return {
    version: 'v0.9.0-a3',
    clues: [],
    unlockedGroundIds: [],
    activeGroundId: null,
    cooldowns: {},
    blockedRecords: [],
    lastResolutionSteps: [],
  };
}

export function createInitialCombatEncounterState(): CombatEncounterState {
  return {
    status: 'idle',
    spec: null,
    validation: null,
    startedTurn: 0,
    outcomeSummary: null,
  };
}
