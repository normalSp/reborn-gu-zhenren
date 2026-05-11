/**
 * 蛊真人模拟器 — 核心类型定义
 * 基于 GDD §5 和 TDD 第一部分
 */

// ─── 境界系统 ───
export type GrandRealm = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SubRealm = '初阶' | '中阶' | '高阶' | '巅峰';

export interface RealmInfo {
  grand: GrandRealm;
  sub: SubRealm;
  label: string; // '三转中阶'
}

// ─── 流派 ───
export type PathType = string; // '炎道' | '水道' | ... 48流派

export type PathLevel = '普通' | '大师' | '宗师' | '大宗师' | '准无上' | '无上' | '道主';

// ─── 时间模型 ───
export interface GameTime {
  ap: number;
  max_ap: number;
  period: 'morning' | 'noon' | 'evening' | 'night';
  day: number;
  month: number;
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export type ActionTimePolicy =
  | 'dialogue'
  | 'trade'
  | 'merchant'
  | 'cultivation'
  | 'scout'
  | 'wild_gather'
  | 'hostile_combat'
  | 'ambush'
  | 'aperture_management'
  | 'calamity'
  | 'treasure_yellow_heaven'
  | 'immortal_resource_gather'
  | 'ordinary_trade'
  | 'safe_cultivation';

export type SceneLockState = 'open' | 'dialogue_locked' | 'trade_locked' | 'combat_locked';
export type CombatIntent = 'none' | 'duel' | 'squad' | 'battlefield' | 'ambush' | 'hostile_challenge';
export type SceneLocationContext = 'safe' | 'caravan' | 'field' | 'wild' | 'aperture';

export interface SceneTimeContext {
  version: 'v0.8.0-c1.1';
  currentChapterId: string | null;
  currentCanonAnchorId: string | null;
  domain: string;
  period: string;
  locationContext: SceneLocationContext;
  locationLabel: string;
  sceneLockState: SceneLockState;
  lockReasons: string[];
  combatIntent: CombatIntent;
  allowedActions: ActionTimePolicy[];
  blockedActions: ActionTimePolicy[];
  resourceWarnings: string[];
  pendingNarrativeSettlement: string[];
}

export interface SceneActionBudget {
  maxAp: number;
  remainingAp: number;
  grantedBy: 'narrative_scene' | 'calamity_scene' | 'combat_aftermath' | 'manual_recovery';
  exhaustedPolicy: 'advance_narrative' | 'wait_or_rest';
}

export interface LocalActionLedgerEntry {
  id: string;
  turn: number;
  sceneId: string;
  actionType: 'meditate' | 'cultivate' | 'breakthrough' | 'field_action' | 'training_ground' | 'dojo' | 'resource' | 'combat' | 'calamity' | 'inheritance' | 'other';
  source: string;
  cost: number;
  summary: string;
  systemResult: Record<string, unknown>;
  risks: string[];
}

export interface NarrativeAdvanceIntent {
  id: string;
  sceneId: string;
  reason: string;
  spentAp: number;
  ledgerEntryIds: string[];
  summary: string;
}

export interface SceneSessionState {
  version: 'v0.8.0-c2.2';
  sceneId: string;
  narrativeTurn: number;
  locationId: string;
  period: string;
  safety: 'safe' | 'guarded' | 'dangerous' | 'locked';
  actionBudget: SceneActionBudget;
  localActionLedger: LocalActionLedgerEntry[];
  pendingAdvanceIntent: NarrativeAdvanceIntent | null;
  lastNarrativeSummary: string;
}

export type CombatEncounterScale = 'duel' | 'battlefield_5x3' | 'group_5x3' | 'group_7x5';
export type CombatEncounterStatus = 'idle' | 'candidate' | 'active' | 'resolved' | 'abandoned';
export type BattleOutcomeResult = 'victory' | 'defeat' | 'retreat' | 'abandoned' | 'unresolved';

export interface CombatEncounterSpec {
  id: string;
  title: string;
  summary: string;
  scale: CombatEncounterScale;
  risk: 'low' | 'medium' | 'high';
  source: 'ai-rumor' | 'engine';
  sceneId: string;
  createdTurn: number;
  enemyHint: string;
  requiredRealmGrand?: number;
  availableGu: string[];
  availableKillerMoves: string[];
  blockers: string[];
  warnings: string[];
}

export interface CombatEncounterEntryValidation {
  valid: boolean;
  spec: CombatEncounterSpec | null;
  blockers: string[];
  warnings: string[];
  downgradedTo?: 'rumor' | 'danger_hint';
}

export interface BattleOutcomeSummary {
  id: string;
  encounterId: string;
  scale: CombatEncounterScale;
  result: BattleOutcomeResult;
  summary: string;
  winner?: 'player' | 'enemy' | 'neutral' | 'escaped' | null;
  roundsTaken: number;
  hpDelta: number;
  essenceDelta: number;
  consumedGu: string[];
  daoMarkDelta: Record<string, number>;
  createdTurn: number;
  steps: string[];
}

export interface CombatEncounterState {
  status: CombatEncounterStatus;
  spec: CombatEncounterSpec | null;
  validation: CombatEncounterEntryValidation | null;
  startedTurn: number;
  outcomeSummary: BattleOutcomeSummary | null;
}

export type InheritanceSiteKind = 'minor_cave' | 'canon_side_branch' | 'blessed_land_claim' | 'grotto_heaven_rumor';
export type InheritanceCandidateStatus = 'candidate' | 'active' | 'resolved' | 'failed' | 'rumor' | 'blocked' | 'expired';
export type InheritanceResolutionStepKind =
  | 'candidate'
  | 'entry_validation'
  | 'trial'
  | 'reward_preview'
  | 'land_claim'
  | 'combat_hook'
  | 'calamity_hook'
  | 'anchor_pressure'
  | 'rumor'
  | 'failure'
  | 'settlement';

export interface InheritanceRewardPreview {
  kind: 'gu' | 'material' | 'recipe_fragment' | 'killer_move_fragment' | 'resource_node' | 'rumor';
  id: string;
  name: string;
  quantity?: number;
  registered: boolean;
  note: string;
}

export interface LandClaimTerm {
  id: string;
  label: string;
  description: string;
  required: boolean;
  status: 'pending' | 'satisfied' | 'failed' | 'blocked';
}

export interface InheritanceSiteSpec {
  siteId: string;
  title: string;
  kind: InheritanceSiteKind;
  anchorId?: string;
  minRealmGrand: number;
  maxRealmGrand?: number;
  entryCostAp: number;
  pathTags: PathType[];
  provenance: 'canon-side' | 'if-derived' | 'original-if';
  summary: string;
  trialLabels: string[];
  rewardPreview: InheritanceRewardPreview[];
  landClaimTerms?: LandClaimTerm[];
  combatScale?: CombatEncounterScale;
  calamityKinds?: string[];
  blockedRuntimeClaims: string[];
}

export interface InheritanceCandidateInput {
  id?: string;
  siteId: string;
  title?: string;
  summary?: string;
  anchorId?: string;
  source?: 'ai-rumor' | 'engine';
  risk?: 'low' | 'medium' | 'high';
  entryPoint?: string;
  claimIntent?: boolean;
  sceneId?: string;
}

export interface InheritanceCandidateRecord {
  id: string;
  siteId: string;
  title: string;
  summary: string;
  kind: InheritanceSiteKind;
  status: InheritanceCandidateStatus;
  source: 'ai-rumor' | 'engine';
  risk: 'low' | 'medium' | 'high';
  anchorId?: string;
  sceneId: string;
  entryPoint: string;
  claimIntent: boolean;
  validationIssues: string[];
  warnings: string[];
  rewardPreview: InheritanceRewardPreview[];
  landClaimTerms: LandClaimTerm[];
  createdTurn: number;
  updatedTurn: number;
}

export interface InheritanceResolutionStep {
  id: string;
  turn: number;
  kind: InheritanceResolutionStepKind;
  siteId?: string;
  candidateId?: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  metadata?: Record<string, unknown>;
}

export interface InheritanceEntryValidation {
  valid: boolean;
  site: InheritanceSiteSpec | null;
  candidate: InheritanceCandidateRecord | null;
  blockers: string[];
  warnings: string[];
  downgradedTo?: 'rumor' | 'boundary_rumor' | 'blocked';
}

export interface LandClaimAttemptRecord {
  id: string;
  candidateId: string;
  siteId: string;
  turn: number;
  outcome: 'success' | 'failure' | 'blocked';
  approvalDelta: number;
  roll?: number;
  terms: LandClaimTerm[];
  heavenlyLandId?: string;
  steps: InheritanceResolutionStep[];
}

export interface InheritanceLandState {
  version: 'v0.8.0-c2.5';
  candidates: InheritanceCandidateRecord[];
  claimAttempts: LandClaimAttemptRecord[];
  completedSiteIds: string[];
  claimedLandIds: string[];
  activeTrial: { candidateId: string; trialIndex: number; startedTurn: number } | null;
  blockedRecords: InheritanceResolutionStep[];
  lastResolutionSteps: InheritanceResolutionStep[];
}

export interface InheritanceChoiceTag {
  kind: 'inheritance_hint' | 'blessed_land_claim' | 'grotto_heaven_rumor' | 'forbidden_block';
  label: string;
  status: 'available' | 'blocked' | 'rumor' | 'resolved';
  siteId?: string;
  reason: string;
  riskHint?: string;
}

export interface ImmortalTime {
  inner_year: number;
  inner_month: number;
  inner_day: number;
  time_flow_ratio: number;
}

// ─── 玩家状态 ───
export interface PlayerState {
  profile: {
    name: string;
    realm: RealmInfo;
    background: string;
  };
  attributes: {
    资质: number;
    体魄: number;
    心智: number;
    气运: number;
  };
  vitals: {
    health: { current: number; max: number };
    essence: { current: number; max: number };
    /** v0.8.0-immortal: 能量类型 — mortal=真元(1-5转蛊师), immortal=仙元(6-9转蛊仙) */
    essenceType: 'mortal' | 'immortal';
  };
  pathBuild: {
    primary: PathType;
    secondary: PathType[];
    path_levels: Record<PathType, PathLevel>;
    dao_marks: Record<PathType, number>;
  };
  daoHeart: {
    kill: number;
    mercy: number;
    scheme: number;
    ambition: number;
  };
  currency: number;
  immortalCurrency: number;
  flags: Record<string, any>;
}

// ─── 玩家身份协议 ───
export type PlayerRole = 'original_participant';

export interface PlayerIdentityContext {
  playerName: string;
  playerRole: PlayerRole;
  canonIdentityGuard: string;
}

// ─── v0.8.0 剧情锚点 / 宿命 / 天意协议 ───
export type TimelineMode = 'canon' | 'if';
export type FateState = 'intact' | 'fractured' | 'destroyed';
export type CanonAnchorStatus = 'fixed' | 'flexible' | 'if_only';
export type IfBranchAxis =
  | 'protect_fate'
  | 'break_fate'
  | 'faction_shift'
  | 'npc_survival'
  | 'resource_control'
  | 'venerable_balance'
  | 'heaven_will_debt';
export type EndingProvenance = 'canon-near' | 'if-derived' | 'original-if';

export interface CanonAnchor {
  id: string;
  displayName: string;
  sourceEra: string;
  canonStatus: CanonAnchorStatus;
  playerRoleCanon: string;
  playerRoleIf: string;
  keyNpcs: string[];
  keyFactions: string[];
  requiredState: Record<string, unknown>;
  forbiddenMutationsCanon: string[];
  allowedVariationsCanon: string[];
  ifDeviationAxes: IfBranchAxis[];
  downstreamImpacts: string[];
  evidenceRef: string;
}

export interface CanonAnchorPressure {
  anchorId: string;
  pressure: number;
  reason: string;
  attemptedMutation: string;
  engineDecision: 'allow_local_variation' | 'redirect' | 'block';
  fallbackNarrativeHint: string;
}

export interface IfBranchVector {
  id: string;
  anchorId: string;
  axis: IfBranchAxis;
  delta: number;
  cause: string;
  cost: string;
  downstreamImpact: string[];
  provenance: 'if-derived' | 'original-if';
  createdTurn: number;
}

export interface HeavenWillTrigger {
  kind:
    | 'fate_mutation'
    | 'venerable_contact'
    | 'forbidden_gu'
    | 'massacre'
    | 'rescue'
    | 'oath_break'
    | 'inheritance_seized'
    | 'chaos_contact';
  delta: number;
  reason: string;
  anchorId?: string;
  turn: number;
}

export interface HeavenWillLedger {
  attention: number;
  correction: number;
  rejection: number;
  ambiguity: number;
  lastTriggers: HeavenWillTrigger[];
}

export interface KarmicReturn {
  id: string;
  sourceEventId: string;
  expectedWindow: [number, number];
  severity: 'low' | 'medium' | 'high' | 'catastrophic';
  narrativeHint: string;
  resolved: boolean;
}

export interface KarmicDebtLedger {
  totalDebt: number;
  byKind: Record<string, number>;
  pendingReturns: KarmicReturn[];
}

export interface StoryEventCandidate {
  id?: string;
  anchorId?: string;
  type: 'side_event' | 'npc_contact' | 'rumor' | 'faction_move' | 'inheritance_hint' | 'danger' | 'other';
  title: string;
  summary: string;
  risk: 'low' | 'medium' | 'high';
  source?: 'ai-rumor' | 'engine';
  engineValidation?: 'pending' | 'accepted' | 'blocked';
  validationIssues?: string[];
}

export interface IfBranchCandidate {
  id?: string;
  anchorId: string;
  axis: IfBranchAxis;
  proposedDelta: number;
  summary: string;
  costHint: string;
  downstreamHint: string[];
  source?: 'ai-rumor' | 'engine';
  engineValidation?: 'pending' | 'accepted' | 'blocked';
}

export interface CanonAnchorResult {
  anchorId: string;
  status: 'unseen' | 'active' | 'resolved' | 'missed' | 'blocked';
  canonDeviation: number;
  summary?: string;
}

export type StoryAnchorResolutionStepKind =
  | 'entry'
  | 'candidate'
  | 'if_vector'
  | 'pressure'
  | 'heaven_will'
  | 'karmic_debt'
  | 'fate_state'
  | 'block'
  | 'redirect'
  | 'settlement';

export interface StoryAnchorResolutionStep {
  id: string;
  kind: StoryAnchorResolutionStepKind;
  anchorId?: string;
  turn: number;
  message: string;
  severity?: 'info' | 'warning' | 'danger' | 'success';
  metadata?: Record<string, unknown>;
}

export interface StoryAnchorRecord {
  anchorId: string;
  status: 'locked' | 'available' | 'active' | 'resolved' | 'blocked';
  firstSeenTurn?: number;
  lastUpdatedTurn?: number;
  entryIssues?: string[];
  canonDeviation: number;
  summary?: string;
}

export interface StoryAnchorCandidateRecord extends StoryEventCandidate {
  id: string;
  source: 'ai-rumor' | 'engine';
  engineValidation: 'pending' | 'accepted' | 'blocked';
  validationIssues: string[];
  createdTurn: number;
  chapterId?: string;
  domain?: string;
  resolutionHint?: string;
}

export interface StoryAnchorIfCandidateRecord extends IfBranchCandidate {
  id: string;
  source: 'ai-rumor' | 'engine';
  engineValidation: 'pending' | 'accepted' | 'blocked';
  validationIssues: string[];
  createdTurn: number;
  chapterId?: string;
  domain?: string;
}

export interface StoryAnchorEntryValidation {
  anchorId: string;
  allowed: boolean;
  status: 'locked' | 'available' | 'active' | 'resolved' | 'blocked';
  issues: string[];
  warnings: string[];
  requiredRealm?: number;
  mode: TimelineMode;
  recommendedRole: string;
}

export interface StoryAnchorState {
  version: 'v0.8.0-b3';
  fateState: FateState;
  currentAnchorId: string | null;
  anchorResults: Record<string, CanonAnchorResult>;
  anchorRecords: Record<string, StoryAnchorRecord>;
  ifBranchVectors: IfBranchVector[];
  heavenWillLedger: HeavenWillLedger;
  karmicDebtLedger: KarmicDebtLedger;
  storyEventCandidates: StoryAnchorCandidateRecord[];
  ifBranchCandidates: StoryAnchorIfCandidateRecord[];
  canonAnchorPressureLog: Array<CanonAnchorPressure & {
    id?: string;
    createdTurn?: number;
    chapterId?: string;
    domain?: string;
  }>;
  lastResolutionSteps: StoryAnchorResolutionStep[];
}

export interface EndingResolverInput {
  gameMode: TimelineMode;
  fateState: FateState;
  anchorResults: Record<string, CanonAnchorResult>;
  ifBranchVectors: IfBranchVector[];
  heavenWillLedger: HeavenWillLedger;
  karmicDebtLedger: KarmicDebtLedger;
  playerFactionScore: number;
  fangYuanRelation: 'unknown' | 'observed' | 'ally' | 'rival' | 'enemy' | 'exploited_each_other';
  venerableBalance: Record<string, number>;
  daoHeart: { kill: number; mercy: number; scheme: number; ambition: number };
  playerSurvived: boolean;
}

export interface EndingOutcome {
  familyId: string;
  displayName: string;
  provenance: EndingProvenance;
  summary: string;
  reasons: string[];
  unresolvedWarnings: string[];
}

export type EndingFrameworkStatus = 'idle' | 'ready' | 'committed' | 'blocked';

export interface OriginAnchorAccess {
  anchorId: string;
  role: string;
  cost: string;
}

export interface OriginDeepLineProfile {
  id: string;
  displayName: string;
  provenance: 'canon-near' | 'derived' | 'original';
  startProfileIds: string[];
  identityBoundary: string;
  replacementIdentity: string;
  forbiddenIdentityClaims: string[];
  initialPressure: string[];
  longTermPressure: string[];
  keyNpcs: string[];
  friendlyFactions: string[];
  hostileFactions: string[];
  resourceEntrances: string[];
  canonAnchorAccess: OriginAnchorAccess[];
  ifDeviationCosts: string[];
  endingDebtLabels: string[];
}

export interface FrontMidgameAnchorMapping {
  id: string;
  canonAnchorId: string;
  displayName: string;
  chapterIds: string[];
  startProfileIds: string[];
  modeBoundaries: {
    canon: string;
    if: string;
  };
  allowedRoles: string[];
  forbiddenRewrites: string[];
  handoffSystems: string[];
}

export interface LifeboundGuGrowthStage {
  id: string;
  label: string;
  hint: string;
}

export interface LifeboundGuGrowthProfile {
  id: string;
  displayName: string;
  matchPaths: string[];
  matchGuNames: string[];
  selectionConditions: string[];
  growthStages: LifeboundGuGrowthStage[];
  benefits: string[];
  costs: string[];
  backlash: string[];
  ascensionWeights: Record<string, number>;
  calamityWeights: Record<string, number>;
  endingWeights: Record<string, number>;
  riskTags: string[];
}

export type LifeboundGuOperation = 'remove' | 'sell' | 'refine' | 'disassemble' | 'ascend' | 'feed' | 'use';

export interface LifeboundGuOperationValidation {
  allowed: boolean;
  operation: LifeboundGuOperation;
  reason: string;
  profile?: LifeboundGuGrowthProfile | null;
}

export interface EndingEvidenceSummary {
  battle: {
    totalBattles: number;
    combatWins: number;
    squadWins: number;
    squadDeaths: number;
    woundedRescues: number;
    comboSuccesses: number;
    overlevelEscapes: number;
    currentBattlefieldSteps: number;
  };
  cultivation: {
    breakthroughFailures: number;
    breakthroughSuccesses: number;
    ascensionOutcome?: CultivationOutcome;
    calamityCount: number;
    calamityScars: number;
    heavenWillPressure: number;
    karmicDebt: number;
  };
  origin: {
    background: string;
    debtLabels: string[];
    profileId?: string;
    profileName?: string;
    provenance?: OriginDeepLineProfile['provenance'];
    identityBoundary?: string;
    initialPressure?: string[];
    longTermPressure?: string[];
    anchorAccess?: OriginAnchorAccess[];
    ifDeviationCosts?: string[];
  };
  faction: {
    score: number;
    relationCount: number;
    factionEventCount: number;
  };
  lifebound: {
    guName?: string;
    hasPenalty: boolean;
    profileId?: string;
    profileName?: string;
    growthStage?: string;
    riskTags?: string[];
    endingWeights?: Record<string, number>;
  };
  anchors: {
    resolvedCount: number;
    blockedCount: number;
    activeCount: number;
    currentAnchorId?: string | null;
  };
}

export interface EndingResolutionInput extends EndingResolverInput {
  turn: number;
  realmGrand: number;
  realmLabel: string;
  playerName: string;
  currentChapterId?: string | null;
  currentDomain?: string;
  evidence: EndingEvidenceSummary;
}

export interface EndingEntryValidation {
  canCommit: boolean;
  readiness: number;
  issues: string[];
  warnings: string[];
  recommendedFamilyId?: string;
}

export interface EndingRouteCandidate {
  id: string;
  familyId: string;
  displayName: string;
  provenance: EndingProvenance;
  summary: string;
  readiness: number;
  risk: 'low' | 'medium' | 'high';
  canCommit: boolean;
  reasons: string[];
  blockers: string[];
  warnings: string[];
  evidenceTags: string[];
  forbiddenHits: string[];
}

export type EndingResolutionStepKind =
  | 'input'
  | 'candidate'
  | 'readiness'
  | 'venerable_pressure'
  | 'forbidden_block'
  | 'commit'
  | 'summary';

export interface EndingResolutionStep {
  id: string;
  kind: EndingResolutionStepKind;
  turn: number;
  message: string;
  severity?: 'info' | 'warning' | 'danger' | 'success';
  familyId?: string;
  metadata?: Record<string, unknown>;
}

export interface EndingCommitRecord {
  id: string;
  turn: number;
  committedAt: string;
  candidateId: string;
  outcome: EndingOutcome;
  evidence: EndingEvidenceSummary;
  lifeSummary: string;
  closingPoem: string;
  poemTitle: string;
  screenStateAfterCommit: 'game_over';
}

export interface EndingFrameworkState {
  version: 'v0.8.0-c1';
  status: EndingFrameworkStatus;
  lastInput: EndingResolutionInput | null;
  candidates: EndingRouteCandidate[];
  pressureLog: Array<{
    id: string;
    turn: number;
    reason: string;
    attemptedOutcome: string;
    engineDecision: 'allow_preview' | 'redirect' | 'block';
    severity: 'medium' | 'high';
    forbiddenHits: string[];
  }>;
  lastResolutionSteps: EndingResolutionStep[];
  commitRecord: EndingCommitRecord | null;
}

// ─── 蛊虫 ───
export interface GuSpec {
  id: string;
  name: string;
  tier: number;
  path: PathType;
  rank: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'divine';
  isImmortalGu: boolean;
  unique: boolean;
  effects: GuEffect[];
  feedRequirement: GuFeedReq;
  baseRefineDifficulty: number;
  /** v0.7.0-a: 单人战斗纵切使用的运行时战斗状态 */
  combatStatus?: GuCombatStatus;
}

export interface GuEffect {
  type: string;
  value: number;
  description: string;
}

export interface GuFeedReq {
  essence: number;
  special?: string;
}

export type GuCombatRole = 'attack' | 'defense' | 'support' | 'control' | 'info' | 'passive' | 'strategic';
export type GuCombatRiskTier = 'low' | 'medium' | 'high' | 'immortal_high_cost';

export interface GuCombatStatus {
  role: GuCombatRole;
  runtimeCombatAllowed: boolean;
  useMode: 'passive' | 'toggle' | 'direct' | 'targeted' | 'scene_gated' | 'consumable' | 'lore_only';
  targetRule: string;
  cooldown: number;
  resourceCost: {
    essencePct?: number;
    primevalStones?: number;
    immortalEssence?: number;
  };
  riskTier: GuCombatRiskTier;
  guUseRegistry: boolean;
  notes?: string;
}

// ═══ P2-13: 蛊虫饥饿状态机（四态模型） ═══
/** 
 * 蛊虫饥饿状态机 — P2-13 四态模型
 * optimal = 最佳状态（满饱食），成功率+10%
 * hungry = 饥饿状态（开始降效），成功率-15%
 * injured = 受伤状态（反噬风险），成功率-30%，每轮5%概率反噬（扣除主人10-20生命）
 * dead = 死亡状态（蛊虫已死），不可用且不可恢复
 * 
 * 向后兼容映射（v6→v7存档迁移）:
 *   fed → optimal, starving → injured, dying → dead
 */
export type GuHungerState = 'optimal' | 'hungry' | 'injured' | 'dead';

/** 蛊虫饥饿参数 */
export interface GuHungerConfig {
  /** 每轮饥饿计数累加值（按tier: 1转+1/2转+2/3转+3/4转+4/5转+5） */
  hungerPerTurn: Record<number, number>;
  /** 状态迁移阈值：hungerCounter >= threshold 触发状态降级 */
  thresholds: {
    optimalToHungry: number;   // 默认 5
    hungryToInjured: number;   // 默认 12
    injuredToDead: number;     // 默认 25
  };
  /** 喂养恢复：-10计数/次 */
  feedRecovery: number;
}

export interface GuInstance {
  id: string;
  specId: string;
  name: string;
  customName?: string;
  tier: number;
  path: PathType;
  /** P2-13: 四态饥饿模型（optimal|hungry|injured|dead）。旧存档的fed→optimal, starving→injured, dying→dead映射发生在存档迁移阶段 */
  currentState: GuHungerState;
  /** P2-13: 饥饿累积计数器（确定性模型，替代旧概率模型） */
  hungerCounter: number;
  proficiency: number;
  bonded: boolean;
  active: boolean;
  acquiredAt: { turn: number; narrative: string };
}

// ─── 杀招 ───
/** 杀招熟练度等级 */
export type KillMoveProficiency = 0 | 1 | 2 | 3 | 4;
// 0=入门(-10%倍率) 1=熟练(标准) 2=精通(+10%/-1冷却) 3=大师(+20%/特效解锁) 4=宗师(+30%/可传授)

/** 杀招效果标签（用于联动系统识别） */
export type KillMoveEffectTag = 'refine_speed' | 'refine_success' | 'refine_double' | 'refine_legendary';

export interface KillMove {
  // ─── 现有字段（保持不变） ───
  id: string;
  name: string;
  path: PathType;
  level: number;
  baseCost: number;
  multiplier: number;
  cooldown: number;
  description: string;

  // ─── B2.0: 新增字段（全部可选，向后兼容38条已有数据） ───
  /** 熟练度等级 (0=入门 ~ 4=宗师)，undefined=无熟练度追踪 */
  proficiency?: KillMoveProficiency;
  /** 累计使用次数，用于熟练度升级判定 */
  usageCount?: number;
  /** 核心蛊虫ID列表（自创杀招必需） */
  coreGu?: string[];
  /** 辅助蛊虫ID列表（自创杀招必需） */
  supportGu?: string[];
  /** 进化阶段 (0=原始, 1~N=进化次数) */
  evolutionStage?: number;
  /** 获取来源 */
  source?: 'innate' | 'taught' | 'discovered' | 'created' | 'event';
  /** 原创者名称 */
  creator?: string;
  /** 是否可传授他人（宗师级解锁） */
  canTeach?: boolean;
  /** 额外效果标签（炼蛊加速/成功率等联动） */
  effectTags?: KillMoveEffectTag[];
  /** v0.7.0: 是否为仙级杀招（level≥6），影响创建成功率/道痕门槛 */
  isImmortal?: boolean;
}

// ─── 势力与社交 ───
export interface FactionStanding {
  faction_id: string;
  standing: number;
  reputation_tier: '死敌' | '敌对' | '冷淡' | '中立' | '友善' | '尊敬' | '崇拜';
  lastReason?: string;
  lastDelta?: number;
  lastUpdatedTurn?: number;
  benefits?: string[];
  risks?: string[];
}

export interface CharacterRelation {
  character_id: string;
  name: string;
  relation_type: 'friend' | 'rival' | 'romance' | 'family' | 'mentor' | 'ally' | 'enemy' | 'stranger';
  affinity: number;
  trust: number;
  known_secrets: string[];
  revealed_to_them: string[];
}

export type NpcContactStatus = 'heard' | 'seen' | 'interacted';

export interface NpcContact {
  npcId: string;
  name: string;
  source: 'canon' | 'dynamic' | 'ai_rumor' | 'manual';
  status: NpcContactStatus;
  firstSeenTurn: number;
  lastSeenTurn?: number;
  location?: string;
  summary: string;
  relatedChapterId?: string;
}

export type GuUseTargetType =
  | 'self'
  | 'known_npc'
  | 'dynamic_npc'
  | 'squad_member'
  | 'scene_target'
  | 'aperture_or_location';

export interface TargetedGuEffectTarget {
  type: GuUseTargetType;
  id?: string;
  name?: string;
}

export interface TargetedGuEffect {
  id: string;
  sourceGu: string;
  sourceGuId?: string;
  target: TargetedGuEffectTarget;
  effects: {
    type: string;
    attribute?: '资质' | '体魄' | '心智' | '气运';
    path?: string;
    key?: string;
    value?: number;
    durationTurns?: number;
    description: string;
  }[];
  sideEffects?: {
    type: string;
    kill?: number;
    mercy?: number;
    scheme?: number;
    ambition?: number;
    factionType?: string;
    delta?: number;
    key?: string;
    healthPct?: number;
    description?: string;
  }[];
  durationTurns?: number;
  appliedAtTurn: number;
  provenance: 'canon' | 'derived' | 'original' | 'unknown';
  balanceTier: string;
  loreRef: string;
  consumesGu?: boolean;
}

// ─── 空窍（1-5转蛊师） ───
export interface MortalAperture {
  type: 'mortal';
  /** 当前转数 1-5 */
  rank: number;
  /** 小境界 */
  subRank: '初阶' | '中阶' | '高阶' | '巅峰';
  /** 元海（真元之源） */
  primevalSea: {
    /** CSS 色值 */
    color: string;
    /** 元海颜色名：青铜→赤铁→白银→黄金→紫晶 */
    colorName: '青铜' | '赤铁' | '白银' | '黄金' | '紫晶';
    /** 饱满度 0-100。100=十绝体无空腔 */
    fillPercent: number;
  };
  /** 窍壁状态 */
  apertureWall: {
    /** 窍壁阶段 */
    state: '坚实' | '潮汐初现' | '潮汐涌动' | '壁薄如纸';
    /** 不透明度 0-1 */
    opacity: number;
    /** 状态描述 */
    description: string;
  };
  /** 可携带蛊虫数量上限（一转3/二转5/三转8/四转12/五转15） */
  capacity: number;
  /** 当前已携带蛊虫数 */
  carriedGu: number;
  /** v0.6.0终局补全: 十绝体类型（仅资质=10时有值） */
  extremePhysiqueType?: import('./index').ExtremePhysiqueType;
  /** v0.7.0: 十绝体capacity锁定=3，禁止扩容 */
  capacityLocked: boolean;
}

// ─── 仙窍（6转+蛊仙） ───
/** 福地等级 — 由升仙积累评定确定 */
export type ImmortalApertureGrade = '小福地' | '中等福地' | '上等福地';

export interface ImmortalAperture {
  type: '福地' | '洞天';
  /** 福地等级 — P4新增，决定面积和流速的基础区间 */
  grade: ImmortalApertureGrade;
  area_mu: number;
  time_flow_ratio: number;
  resource_nodes: ResourceNode[];
  dao_mark_density: Record<string, number>;
  next_disaster_type: string;
  disaster_countdown: number;
}

export interface ResourceNode {
  id: string;
  /** 产出类型 — 蛊材名或资源类别 */
  type: string;
  /** 资源名称（显示用） */
  name: string;
  /** 每回合基础产出量 */
  output_rate: number;
  /** 质量等级 0-100 */
  quality: number;
  /** 产出材料等级 */
  grade: '普通' | '精品' | '稀有' | '仙材';
  /** 节点是否启用 */
  active: boolean;
}

/** 资源点建造消耗配置 — v0.7.0 资源点建设系统 */
export interface ResourceNodeBuildCost {
  /** 资源节点类型标识 */
  type: string;
  /** 显示名称 */
  name: string;
  /** 基础建造消耗（元石） */
  baseCost: number;
  /** 基础成功率 % */
  successRate: number;
  /** 所需仙窍等级（资源节点按仙窍等级解锁） */
  requiredApertureLevel: number;
  /** 建造描述 */
  description: string;
}

/** P4: 仙窍独立存储 — 无限容量，升仙后所有蛊虫/蛊材从空窍迁移至此 */
export interface ApertureStorage {
  /** 仙窍中存放的蛊虫（无限容量） */
  gu: GuInstance[];
  /** 仙窍中存放的蛊材（无限容量） */
  materials: Record<string, number>;
  /** 仙窍中存放的仙材（无限容量） */
  immortalMaterials: Record<string, number>;
}

// ─── 因果 ───
export interface ButterflyEffect {
  id: string;
  cause: string;
  consequence: string;
  affected_npcs: string[];
  severity: 1 | 2 | 3;
  timestamp: number;
}

// ─── 关键事件 ───
export interface KeyEvent {
  id: string;
  type: 'birth' | 'breakthrough' | 'battle' | 'treasure' | 'contact' | 'death' | 'betrayal' | 'discovery';
  turn: number;
  summary: string;
  importance: 1 | 2 | 3;
  timestamp: number;
  relatedNPCs: string[];
}

// ─── AI 相关 ───
export interface Choice {
  id: string;
  text: string;
  risk: 'high' | 'medium' | 'low';
  risk_note: string;
  guAffordances?: NarrativeGuChoiceAffordance[];
  gu_affordance?: NarrativeGuChoiceAffordance | NarrativeGuChoiceAffordance[];
  anchorTags?: NarrativeAnchorChoiceTag[];
  anchor_tags?: NarrativeAnchorChoiceTag[];
  combatEncounter?: Record<string, unknown> | Record<string, unknown>[];
  combat_encounter?: Record<string, unknown> | Record<string, unknown>[];
  combatTags?: Record<string, unknown>[];
  combat_tags?: Record<string, unknown>[];
  inheritanceTags?: InheritanceChoiceTag[];
  inheritance_tags?: InheritanceChoiceTag[];
}

export interface NarrativeJSON {
  narrative: {
    text: string;
    choices: Choice[];
  };
  state_update: StateUpdate;
}

export type NarrativeGuUtilityCategory =
  | 'reconnaissance'
  | 'tracking'
  | 'healing'
  | 'detox'
  | 'obstacle_breaking'
  | 'concealment'
  | 'intimidation'
  | 'forbidden_ritual'
  | 'mobility'
  | 'protection'
  | 'control'
  | 'signal'
  | 'survival'
  | 'refinement';

export interface NarrativeGuChoiceAffordance {
  sourceType: 'gu' | 'killer_move';
  sourceName: string;
  utilityId: string;
  category: NarrativeGuUtilityCategory;
  categoryLabel: string;
  label: string;
  status: 'available' | 'missing' | 'blocked' | 'forbidden';
  reason: string;
  risk: 'low' | 'medium' | 'high';
  riskHint: string;
  owned: boolean;
  sceneGated: boolean;
  forbidden: boolean;
  promptHint?: string;
}

export interface NarrativeAnchorChoiceTag {
  kind: 'canon_side' | 'if_deviation' | 'heaven_pressure' | 'forbidden_block';
  label: string;
  anchorId?: string;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

// ═══ v0.7.0 P2: 动态NPC系统 — AI叙事中生成的"路人甲"NPC ═══
/** AI叙事中动态生成的NPC（路人甲），可通过剧情培养变为队友 */
export interface DynamicNPC {
  /** 唯一ID，生成规则: npc_dynamic_${turn}_${counter} */
  id: string;
  /** NPC名称 */
  name: string;
  /** 流派 */
  path: PathType;
  /** 境界转数 1-5（默认1-2，避免战力通胀） */
  realm: number;
  /** 境界标签，如"一转初阶" */
  realm_label: string;
  /** 性格描述 */
  personality: string;
  /** 所在域 */
  domain: string;
  /** AI生成的背景描述 */
  description: string;
  /** 与玩家的好感度 -100~100 */
  affinity: number;
  /** 与玩家互动次数 */
  interaction_count: number;
  /** 与玩家共同战斗次数 */
  battle_count: number;
  /** 剧情参与度 0-100 */
  plot_participation: number;
  /** 是否可招募为队友（affinity>=60） */
  recruit_eligible: boolean;
  /** 创建回合 */
  created_at: number;
  /** 最后更新回合 */
  updated_at: number;
  /** HP */
  hp: number;
  /** 最大HP */
  maxHp: number;
  /** 攻击力 */
  atk: number;
  /** 防御力 */
  def: number;
}

/** AI在 state_update 中输出的动态NPC新增载荷 */
export interface DynamicNPCAddPayload {
  /** NPC名称 */
  name: string;
  /** 流派 */
  path: PathType;
  /** 境界 1-5 */
  realm: number;
  /** 性格描述 */
  personality: string;
  /** 与玩家的羁绊提示（AI叙事中铺垫的好感基础） */
  bonding_hint: string;
}

/** 动态NPC注册表状态 */
export interface DynamicNPCState {
  /** 所有动态NPC，key=id */
  dynamicNPCs: Record<string, DynamicNPC>;
  /** 注册表最大容量（默认500，超出后LRU淘汰） */
  maxDynamicNPCs: number;
  /** 添加/更新动态NPC */
  upsertDynamicNPC: (npc: DynamicNPC) => void;
  /** 更新好感度 */
  updateDynamicNPCAffinity: (npcId: string, delta: number) => void;
  /** 增加互动计数 */
  incrementDynamicNPCInteraction: (npcId: string) => void;
  /** 增加共同战斗计数 */
  incrementDynamicNPCBattle: (npcId: string) => void;
  /** LRU淘汰最老的NPC */
  evictLRU: () => void;
  /** 获取可招募列表 (affinity>=60) */
  getRecruitableNPCs: () => DynamicNPC[];
}

export interface StateUpdate {
  player?: {
    realm?: string | { action?: 'set'; value: string };
    attributes?: {
      资质?: { action: 'add'; value: number };
      体魄?: { action: 'add'; value: number };
      心智?: { action: 'add'; value: number };
      气运?: { action: 'add'; value: number };
    };
    health?: { current: number; max: number };
    essence?: { current: number; max: number };
    /** v0.8.0-immortal: 升仙时切换能量类型 */
    essenceType?: 'mortal' | 'immortal';
    dao_heart?: { kill?: number; mercy?: number; scheme?: number; ambition?: number };
    /** 道痕增量，如 {"力道": 500, "炎道": 300}。正数为获得，负数为损失（罕见） */
    dao_marks?: Record<string, number>;
    /** 流派境界等级更新，如 {"力道": "大师", "炎道": "入门"} */
    path_levels?: Record<string, string>;
  };
  /** 顶层道痕（passthrough兜底，推荐放在player.dao_marks中） */
  dao_marks?: Record<string, number>;
  path_levels?: Record<string, string>;
  gu_inventory?: {
    add?: { name: string; tier: number; path: string; rarity: string; description: string }[];
    remove?: string[];
  };
  /** 🆕 蛊材/材料获得。键=材料名，值=获得数量。如 {"毒虫毒囊":2,"沼泽毒泥":1} */
  materials?: { add?: Record<string, number> };
  /** AI只允许返回已登记残方ID；完整蛊方解锁由引擎私有动作完成 */
  recipe_fragments?: { add?: string[] };
  /** AI提到但未通过真相源验证的物品/蛊方/流派线索，无数值效果 */
  discoveries?: {
    add?: {
      type: 'material' | 'recipe' | 'path' | 'location' | 'npc_request' | 'trade' | 'unknown';
      name: string;
      note: string;
      source: 'ai-rumor';
    }[];
  };
  /** NPC对话内产生的委托/交易/情报候选，只进待审线索，不直接创建正式任务 */
  dialogue_requests?: {
    add?: {
      id?: string;
      npcName: string;
      title: string;
      summary: string;
      category?: 'request' | 'trade' | 'rumor' | 'hunt' | 'escort' | 'information' | 'other';
      risk?: 'high' | 'medium' | 'low';
      rewardHint?: string;
      source?: 'ai-rumor';
    }[];
  };
  flags?: {
    set?: Record<string, any>;
    remove?: string[];
  };
  faction?: Record<string, { standing: number }>;
  wealth?: { delta: number };
  causality?: {
    track?: string;
    butterfly_effects?: string[];
  };
  /** 🆕 v0.7.0: 动态NPC — AI叙事中遇到的新NPC通过此字段回写结构化数据 */
  dynamic_npcs?: {
    add?: DynamicNPCAddPayload[];
    affinity_delta?: { name: string; delta: number }[];
  };
  /** v0.7.0-pre: 原著/动态NPC contact，允许“已闻/已见/已交互”进入人物图鉴 */
  npc_contacts?: {
    add?: {
      npcId?: string;
      name: string;
      source?: NpcContact['source'];
      status?: NpcContactStatus;
      location?: string;
      summary?: string;
    }[];
  };
  /** v0.7.0-pre: AI 只能提出场景蛊使用候选，是否生效必须由引擎校验 */
  gu_use_suggestions?: {
    add?: {
      guName: string;
      target?: TargetedGuEffectTarget;
      utilityId?: string;
      category?: NarrativeGuUtilityCategory;
      riskHint?: string;
      sceneValidated?: boolean;
      sceneTags?: string[];
      reason?: string;
    }[];
  };
  combat_event_candidates?: {
    add?: CombatEventCandidate[];
  };
  inheritance_land_candidates?: {
    add?: InheritanceCandidateInput[];
  };
  story_event_candidates?: {
    add?: StoryEventCandidate[];
  };
  if_branch_candidates?: {
    add?: IfBranchCandidate[];
  };
  canon_anchor_pressure?: {
    add?: CanonAnchorPressure[];
  };
}

// ─── 战斗系统 ───
export interface CombatState {
  combatType: 'duel' | 'narrative' | 'group' | 'squad' | null;
  enemy: EnemyState | null;
}

export interface EnemyState {
  name: string;
  realm: string;
  hp: number;
  maxHp: number;
  attack: number;
}

export interface CombatConstraint {
  sceneId: string;
  combatType: 'narrative';
  scale: 'skirmish' | 'battle' | 'war';
  mustHappen: string[];
  mustNotHappen: string[];
  keyFactions: string[];
  keyNPCs: string[];
  strategicChoiceCount: number;
  narrativeStyle: string;
  triggerKeywords?: string[];     // P2-4b: 触发关键词
  recommendedRealm?: number;      // P2-4b: 推荐境界
  baseChance?: number;            // P2-4b: 基础成功概率
  statBridge: {
    enabled?: boolean;
    realmWeight: number;
    guTagInfluence: { tag: string; bonus: number; note?: string }[];
  };
}

export interface GroupCombatState {
  combatType: 'group';
  allies: { npcId: string; hp: number; role: 'tank' | 'dps' | 'support' }[];
  enemies: { id: string; hp: number }[];
  formation: 'frontline' | 'flanking' | 'defensive';
}

// ─── v0.7.0: 小队战斗系统类型 ───

/** 小队战斗状态 — v0.7.0 squad-combat-engine 核心状态 */
export interface SquadCombatState {
  squadId: string;
  phase: 'deploy' | 'player_turn' | 'enemy_turn' | 'resolution' | 'ended';
  round: number;
  /** 战术姿态 — 设计大纲§1.4.1: 替代阵型（原著为"杀招流"非"阵型流"） */
  formation: '合击' | '牵制' | '掠阵' | '斩首';
  /** 士气 0-100，影响全员伤害±20% */
  morale: number;
  /** 配合度 0-100，影响连携概率 */
  coordination: number;
  members: SquadMemberCombat[];
  enemies: SquadEnemy[];
  log: CombatLogEntry[];
  trace?: BattleTraceEntry[];
  eventCandidates?: CombatEventCandidate[];
  seed?: number;
  mode?: DuelMode;
  rewardPreview?: {
    yuanStone?: number;
    immortalStone?: number;
    materials?: Record<string, number>;
    rumors?: string[];
  };
  result?: {
    winner: 'player' | 'enemy' | 'escaped' | null;
    roundsTaken: number;
    casualties: string[];
    wounded: string[];
    moraleDelta: number;
    trustDeltas: Record<string, number>;
    rewards?: {
      yuanStone?: number;
      immortalStone?: number;
      materials?: Record<string, number>;
      rumors?: string[];
    };
  } | null;
}

/** 队伍成员战斗状态 */
export interface SquadMemberCombat {
  memberId: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  path: string;
  realm: number;
  /** 性格驱动战斗行为（忠→保护/狡→偷袭/莽→强攻/慎→防御/无私→治疗） */
  personality: 'loyal' | 'cunning' | 'reckless' | 'cautious' | 'selfless';
  statuses: import('../engine/combat-formulas').CombatStatus[];
  action: SquadAction | null;
  moves?: DuelMove[];
  essence?: { current: number; max: number; type: 'primeval' | 'immortal' };
  daoMarks?: number;
  cooldowns?: Record<string, number>;
  fatigue?: number;
  adventureTrust?: number;
  loyalty?: number;
  interestDrive?: number;
  rolePausedUntil?: number;
}

/** 小队战斗敌方单位 */
export interface SquadEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  path: string;
  realm: number;
  statuses: import('../engine/combat-formulas').CombatStatus[];
  aiMode: EnemyAIMode;
  moves?: DuelMove[];
  daoMarks?: number;
  morale?: number;
}

/** 小队战斗可选行动 */
export type SquadAction =
  | { type: 'attack'; targetIndex: number; moveId?: string }
  | { type: 'defend' }
  | { type: 'gu_skill'; moveId: string; targetIndex: number }
  | { type: 'escape' };

export interface EscapeCondition {
  canEscape: boolean;
  escapePenalty: { type: string; value: number };
  realmGate: number;
}

// ─── P2-4a: 决斗引擎类型 ───

/** 决斗阶段状态机 */
export type DuelPhase = 'init' | 'player_turn' | 'enemy_turn' | 'resolution' | 'ended';

/** 玩家可选行动 */
export type DuelAction = 'attack' | 'defend' | 'gu_skill' | 'escape' | 'surrender';

export interface BattlePressureSummary {
  rankDiff: number;
  rankLabel: string;
  playerDamageMult: number;
  enemyDamageMult: number;
  playerHitBonus: number;
  enemyHitBonus: number;
  pathMultiplier: number;
  pathLabel: string;
  daoResonance: number;
  daoLabel: string;
  crossRealm: boolean;
}

export interface BattleActionPreview {
  action: DuelAction | 'killer_move';
  label: string;
  essenceLabel: '真元' | '仙元';
  essenceCost: number;
  hitRate?: number;
  expectedDamageMin?: number;
  expectedDamageMax?: number;
  available: boolean;
  reason?: string;
  note?: string;
}

export interface EscapePreview {
  chance: number;
  label: string;
  essenceLabel: '真元' | '仙元';
  essenceCost: number;
  blocked: boolean;
  reason?: string;
}

export interface BattlePreview {
  pressure: BattlePressureSummary;
  actions: BattleActionPreview[];
  escape: EscapePreview;
  warnings: string[];
}

export type BattleTracePhase =
  | 'scout'
  | 'initiative'
  | 'action'
  | 'counter'
  | 'resource'
  | 'pressure'
  | 'event'
  | 'morale_escape';

export interface BattleTraceEntry {
  round: number;
  phase: BattleTracePhase;
  actor: 'player' | 'enemy' | 'system';
  action: string;
  message: string;
  damage?: number;
  hitRate?: number;
  resourceCost?: number;
  tags?: string[];
}

export interface BattleVisualEffectEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  kind: 'killer_move' | 'immortal_gu' | 'scene' | 'ui_feedback';
  assetPath?: string;
  fallbackTint: string;
  secondaryTint?: string;
  pathId?: string;
  motif?: string;
  intensity?: 'subtle' | 'normal' | 'high';
  durationMs: number;
  fadeInMs: number;
  fadeOutMs: number;
  shakeIntensity: number;
  shakeDurationMs: number;
  sfxCue?: string;
  triggerTags: string[];
  createdAt: number;
}

export interface PathVisualProfile {
  pathId: string;
  displayName: string;
  runtimeAllowed: boolean;
  motif: string;
  fallbackTint: string;
  secondaryTint: string;
  intensity: 'subtle' | 'normal' | 'high';
  shakeIntensity: number;
  aliases?: string[];
  notes?: string;
}

export type CombatEventCandidateType =
  | 'ambush'
  | 'third_party'
  | 'environment'
  | 'pursuit'
  | 'negotiation'
  | 'reinforcement'
  | 'escape_window'
  | 'other';

export interface CombatEventCandidate {
  id?: string;
  type: CombatEventCandidateType;
  title: string;
  summary: string;
  risk?: 'low' | 'medium' | 'high';
  source?: 'ai-rumor' | 'engine';
  engineValidation?: 'pending' | 'accepted' | 'blocked' | 'downgraded';
  validationIssues?: string[];
  createdTurn?: number;
  scale?: CombatEncounterScale | 'skirmish' | 'battle' | 'war' | 'large' | 'group' | 'squad' | '1v1';
  enemyHint?: string;
  requiredRealmGrand?: number;
  entryValidation?: CombatEncounterEntryValidation;
}

export type GuExpressionAvailability = 'direct' | 'passive' | 'scene_gated';
export type GuExpressionRealmScope = 'mortal' | 'mortal_forbidden' | 'immortal_scene';
export type GuExpressionProvenance = 'canon' | 'canon-near' | 'project-canon' | 'derived' | 'derived-runtime' | 'original';

export interface GuExpressionRange {
  shape: string;
  min: number;
  max: number;
  area: number;
}

export interface GuExpressionCost {
  essencePct?: number;
  immortalEssence?: number;
  primevalStones?: number;
}

export interface GuVisualMotif {
  motif: string;
  primaryTint: string;
  secondaryTint?: string;
  motion: string;
}

export interface GuExpressionSpec {
  guName: string;
  path: string;
  realmScope: GuExpressionRealmScope;
  provenance: GuExpressionProvenance;
  availability: GuExpressionAvailability;
  verbs: string[];
  targetRule: string;
  range: GuExpressionRange;
  cost: GuExpressionCost;
  cooldown: number;
  statusEffects: string[];
  counters: string[];
  terrainAffinity: {
    favored: string[];
    hindered: string[];
  };
  sceneUtilities: string[];
  visualMotif: GuVisualMotif;
  uniqueness: string;
}

export interface KillerMoveExpressionSpec {
  moveName: string;
  path: string;
  level: number;
  provenance: GuExpressionProvenance;
  coreGu: string[];
  auxiliaryGu: string[];
  boardPattern: {
    shape: string;
    range: number;
    area: number;
  };
  charge: {
    turns: number;
    interruptible: boolean;
    tell: string;
  };
  release: string;
  maintain: {
    essencePctPerTurn: number;
    maxTurns: number;
  };
  opening: string;
  failureMode: string;
  backlash: string;
  visualBeats: string[];
  sceneUtilities: string[];
}

export type BattlefieldCellFlag =
  | 'cover'
  | 'hazard'
  | 'array_node'
  | 'concealment'
  | 'dao_field'
  | 'frontline'
  | 'midline'
  | 'backline'
  | 'escort_exit'
  | 'entry_point';

export interface BattlefieldCell {
  id: string;
  x: number;
  y: number;
  terrainId: string;
  flags: BattlefieldCellFlag[];
  occupantId?: string | null;
  daoFieldPath?: string;
  dangerTags?: string[];
}

export interface BattlefieldUnit {
  id: string;
  name: string;
  side: 'player' | 'ally' | 'enemy' | 'neutral';
  cellId: string;
  realmNum: number;
  path: string;
  hp: number;
  maxHp: number;
  attack?: number;
  defense?: number;
  accuracy?: number;
  evasion?: number;
  daoMarks?: number | Record<string, number>;
  cooldowns?: Record<string, number>;
  killerMoveNames?: string[];
  essence?: { current: number; max: number; type: 'primeval' | 'immortal' };
  guNames: string[];
  statusEffects: string[];
  role?: 'leader' | 'vanguard' | 'support' | 'scout' | 'guard' | 'objective' | 'third_party';
  morale?: number;
  threat?: number;
  guardTargetId?: string;
  revealed?: boolean;
  objectiveTags?: string[];
  intent?: string;
}

export type BattlefieldActionType =
  | 'move'
  | 'gu'
  | 'killer_move'
  | 'wait'
  | 'retreat'
  | 'assist'
  | 'guard'
  | 'rally'
  | 'formation'
  | 'observe';

export interface BattlefieldAction {
  type: BattlefieldActionType;
  actorId: string;
  targetCellId?: string;
  targetUnitIds?: string[];
  guName?: string;
  killerMoveName?: string;
  sceneGate?: boolean;
  pendingActionId?: string;
}

export interface BattlefieldActionValidation {
  ok: boolean;
  reason?: string;
  actorId?: string;
  actionType?: BattlefieldActionType;
  validTargetCellIds: string[];
  affectedCellIds: string[];
  targetUnitIds: string[];
  resourceCost?: GuExpressionCost;
  cooldown?: number;
  sourceName?: string;
  tags: string[];
}

export interface BattlefieldPendingAction {
  id: string;
  actorId: string;
  type: 'killer_move';
  sourceName: string;
  targetCellId?: string;
  targetUnitIds: string[];
  affectedCellIds: string[];
  remainingTurns: number;
  interruptible: boolean;
  resourceCost?: GuExpressionCost;
}

export interface BattlefieldActiveEffect {
  id: string;
  sourceName: string;
  actorId?: string;
  targetIds?: string[];
  affectedCellIds: string[];
  remainingTurns: number;
  statusEffects: string[];
  tags: string[];
}

export interface BattlefieldObjective {
  id: string;
  type: 'protect' | 'escort' | 'defeat_key';
  label: string;
  status: 'active' | 'succeeded' | 'failed';
  unitId?: string;
  targetUnitId?: string;
  cellId?: string;
  requiredEdge?: boolean;
}

export interface BattlefieldAmbushState {
  side: 'player' | 'ally' | 'enemy' | 'neutral';
  revealed: boolean;
  openingResolved: boolean;
  hiddenUnitIds: string[];
  scoutDifficulty?: number;
}

export interface BattlefieldThirdPartyState {
  id: string;
  unitIds: string[];
  entryRound: number;
  entered: boolean;
  stance: 'neutral' | 'attack_high_threat' | 'protect_objective';
}

export interface BattlefieldCombatResult {
  winner: 'player' | 'enemy' | 'escaped' | null;
  reason: string;
  roundsTaken: number;
}

export interface BattlefieldActionResolution {
  state: BattlefieldCombatState;
  steps: BattleResolutionStep[];
  validation: BattlefieldActionValidation;
}

export interface BattlefieldCombatState {
  battleId: string;
  round: number;
  phase: 'scout' | 'deploy' | 'player_turn' | 'enemy_turn' | 'resolution' | 'ended';
  mode?: 'duel' | 'group';
  gridPresetId?: string;
  grid: {
    width: number;
    height: number;
    cells: BattlefieldCell[];
  };
  units: BattlefieldUnit[];
  activeUnitId?: string;
  actedUnitIdsThisRound?: string[];
  morale?: {
    player: number;
    enemy: number;
    neutral?: number;
  };
  objectives?: BattlefieldObjective[];
  ambush?: BattlefieldAmbushState;
  thirdParties?: BattlefieldThirdPartyState[];
  activeTerrainId?: string;
  activeFormationId?: string;
  seed?: string | number;
  activeEffects?: BattlefieldActiveEffect[];
  pendingActions?: BattlefieldPendingAction[];
  result?: BattlefieldCombatResult | null;
  eventWindows: BattleTracePhase[];
  pendingResolution: BattleResolutionStep[];
}

export type BattleResolutionStepKind =
  | 'move'
  | 'gu_use'
  | 'killer_move'
  | 'hit'
  | 'miss'
  | 'status_apply'
  | 'status_tick'
  | 'terrain_change'
  | 'counter'
  | 'resource_spend'
  | 'failure'
  | 'morale'
  | 'assist'
  | 'guard'
  | 'ambush'
  | 'formation'
  | 'objective'
  | 'third_party'
  | 'settlement';

export interface BattleResolutionStep {
  id: string;
  round: number;
  kind: BattleResolutionStepKind;
  actorId?: string;
  targetIds?: string[];
  sourceName?: string;
  fromCellId?: string;
  toCellId?: string;
  affectedCellIds?: string[];
  damage?: number;
  statusEffects?: string[];
  resourceCost?: GuExpressionCost;
  message: string;
  visual: {
    motif: string;
    primaryTint: string;
    motion: string;
    intensity?: 'subtle' | 'normal' | 'high';
  };
  blockedReason?: string;
  tags: string[];
}

/** 决斗结果 */
export interface DuelResult {
  winner: 'player' | 'enemy' | null;
  special?: 'oneshot' | 'escaped' | null;
  playerFinalHp: number;
  enemyFinalHp: number;
  roundsTaken: number;
  escaped: boolean;
}

/** 决斗敌人（扩展EnemyState） */
export interface DuelEnemy {
  name: string;
  realm: string;
  realmNum: number;   // 境界数值: 1-7 (一转→七转)
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  accuracy: number;   // 基础命中值
  evasion: number;    // 基础闪避值
  path: string;       // 流派: 金道/木道/水道/火道/土道/风道/雷道/冰道/力道/魂道/血道/智道
  daoMarks: number;   // P2-P7: 当前流派道痕数
  gu: { name: string; path: string; tier: number }[];  // 装备蛊虫
  moves: DuelMove[];  // 可用杀招
}

/** 杀招/蛊虫技能 */
export interface DuelMove {
  name: string;
  damageMultiplier: number;  // 伤害倍数
  pathBonus: number;         // 流派加成
  description: string;
  /** P2-P7: 关联的杀招ID（killer-moves.json中的key），空字符串表示非杀招 */
  path?: string;
  killerMoveId?: string;
  /** P2-P7: 所需核心蛊虫名称列表 */
  requiredCoreGu?: string[];
  /** P2-P7: 激活条件描述 */
  activationContext?: string;
  /** P2-P7: 失败模式描述 */
  failureMode?: string;
  /** v0.7.0: 越阶使用惩罚因子（0-1，1=无惩罚）。由killmove-bridge计算 */
  rankPenalty?: number;
}

/** 单个战斗日志条目 */
export interface CombatLogEntry {
  round: number;
  actor: 'player' | 'enemy';
  action: string;
  damage?: number;
  hit?: boolean;
  crit?: boolean;
  message: string;
}

/** v0.6.0: 决斗模式 */
export type DuelMode = 'lethal' | 'training';

/** v0.6.0: 敌方AI行为模式 */
export type EnemyAIMode = 'aggressive' | 'balanced' | 'defensive' | 'coward';

/** 决斗核心状态 */
export interface DuelState {
  duelId: string;
  phase: DuelPhase;
  round: number;
  /** v0.6.0: 决斗模式 — lethal=致命, training=训练(KO非致命) */
  mode: DuelMode;
  player: {
    name: string;
    realm: string;
    realmNum: number;
    path: string;
    daoMarks: number;  // P2-P7: 当前流派道痕数，影响伤害
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    accuracy: number;
    evasion: number;
    /** v0.6.0终局修复: 真元池 — 每次行动消耗真元 */
    essence: { current: number; max: number };
    gu: { name: string; path: string; tier: number }[];
    moves: DuelMove[];
    /** v0.6.0: 玩家身上的状态效果 */
    statuses: import('../engine/combat-formulas').CombatStatus[];
  };
  enemy: DuelEnemy & {
    /** v0.6.0: 敌方身上的状态效果 */
    statuses: import('../engine/combat-formulas').CombatStatus[];
    /** v0.6.0: 敌方AI行为模式 */
    aiMode: EnemyAIMode;
  };
  result: DuelResult | null;
  log: CombatLogEntry[];
  trace?: BattleTraceEntry[];
  eventCandidates?: CombatEventCandidate[];
  startedAt: number;
}

// ─── v0.6.0终局修复: 十绝体枚举 + 势力接口 + SquadMember/MortalAperture补全 ───

/** 十绝体类型 — 原著10种自然十绝体(人祖十子命名) + 纯梦求真体(第11隐藏) */
export type ExtremePhysiqueType =
  | '太日阳莽体'   // 宇道, 白昼修行翻倍
  | '古月阴荒体'   // 宙道, 夜晚修行增速
  | '北冥冰魄体'   // 冰雪道, 冰水双亲和, 白凝冰
  | '森海轮回体'   // 木道, 自然愈合翻倍
  | '炎煌雷泽体'   // 炎雷道, 雷电火焰双亲和
  | '万金妙华体'   // 金道, 金属蛊炼化+30%
  | '大力真武体'   // 力道, 狂蛮魔尊
  | '逍遥智心体'   // 智道, 杀招学习速度+50%
  | '厚土元央体'   // 土道, 山地修行+40%
  | '宇宙大衍体'   // 变化道/宇道, 炼蛊变异率+50%
  | '纯梦求真体';  // 梦道, 砚石老人创造(隐藏)

// ─── v0.6.0: 小队/势力预留接口（v0.7.0填充）───
export interface SquadMember {
  id: string; name: string; npcId?: string;
  path: string; realm: number;
  loyalty: number;
  personality: 'loyal' | 'cunning' | 'reckless' | 'cautious' | 'selfless';
  alive: boolean;
  status?: 'available' | 'wounded' | 'closed_door' | 'expedition' | 'faction_task';
  woundedUntil?: number;
  closedDoorUntil?: number;
  externalTaskUntil?: number;
  factionTaskUntil?: number;
  /** v0.6.0终局补全: 战斗属性 */
  hp: number; maxHp: number; atk: number; def: number;
  /** v0.7.0: 组队信任度(0-100)—NPC对玩家带队能力的信赖 */
  adventureTrust: number;
  /** v0.7.0: 利益驱动(0-100)—NPC对当前任务收益的评估 */
  interestDrive: number;
}
export interface PlayerFaction {
  id: string; name: string; domain: string;
  type: '正派' | '魔道' | '散修联盟' | '家族';
  level: number; reputation: number;
  resources: { 元石: number; 仙元石: number; 蛊材: Record<string, number> };
  members: SquadMember[]; maxMembers: number; foundedAt: number;
}

/** 势力事件 — 设计大纲§1.2.1: AI生成势力相关叙事 */
export interface FactionEvent {
  id: string;
  type: 'recruitment' | 'conflict' | 'opportunity' | 'crisis';
  description: string;
  choices: { id: string; text: string; risk: string; outcome: string }[];
  resolved: boolean;
}

export interface PartyState {
  members: SquadMember[];
  maxSize: number;
  formation: SquadCombatState['formation'] | null;
  morale: number;
  coordination: number;
  lastUpdatedTurn: number;
  memberCooldowns: Record<string, number>;
  memberRolePausedUntil: Record<string, number>;
}

export type SquadDispatchAssignmentStatus = 'active' | 'resolved' | 'failed' | 'expired';

export interface SquadDispatchRewardLedger {
  yuanStone?: number;
  materials?: Record<string, number>;
  rumors?: string[];
  reputation?: number;
  relationship?: number;
}

export interface SquadDispatchAssignment {
  id: string;
  taskId: string;
  taskName: string;
  memberId: string;
  memberName: string;
  startedTurn: number;
  endsTurn: number;
  risk: 'low' | 'medium' | 'high';
  successChance: number;
  status: SquadDispatchAssignmentStatus;
  expectedReward: SquadDispatchRewardLedger;
  validationIssues?: string[];
}

export interface SquadDispatchResult {
  assignmentId: string;
  taskId: string;
  taskName: string;
  memberId: string;
  memberName: string;
  turn: number;
  success: boolean;
  roll: number;
  successChance: number;
  rewards: SquadDispatchRewardLedger;
  costs: { morale?: number; trust?: number; reputation?: number; yuanStone?: number };
  message: string;
}

export interface SquadDispatchState {
  activeAssignments: SquadDispatchAssignment[];
  recentResults: SquadDispatchResult[];
  lastUpdatedTurn: number;
}

export type SquadRecruitDisposition =
  | 'willing_eager'
  | 'willing_cautious'
  | 'mercenary'
  | 'unwilling';

export interface SquadRecruitEvaluation {
  memberId: string;
  memberName: string;
  disposition: SquadRecruitDisposition;
  canJoin: boolean;
  trustScore: number;
  interestScore: number;
  requiredPayment?: { yuanStone?: number; immortalStone?: number };
  reasons: string[];
  aiTags: string[];
}

// ─── P2-4b: 叙事战斗触发 ───

export interface NarrativeCombatTrigger {
  sceneId: string;
  combatType: 'duel' | 'narrative';
  duelEnemy?: DuelEnemy;
  narrativeConstraint?: CombatConstraint;
}

// ─── P2-5: NPC对话系统 ───

export type DialogueTopic = '闲聊' | '请教' | '请教杀招' | '交易' | '委托' | '挑衅' | '深交';

export type DialogueActionCardCategory =
  | 'reply'
  | 'ask_more'
  | 'accept_request'
  | 'decline_request'
  | 'negotiate'
  | 'trade_interest'
  | 'hostility'
  | 'rumor';

export type DialogueActionCardStatus = 'pending' | 'selected' | 'resolved' | 'blocked' | 'expired';

export interface DialogueMessage {
  role: 'player' | 'npc';
  text: string;
  affinityChange?: number;
  timestamp: number;
}

export interface DialogueActionCard {
  id: string;
  npcId: string;
  npcName: string;
  topic: DialogueTopic | string;
  text: string;
  risk: 'high' | 'medium' | 'low';
  riskNote: string;
  category: DialogueActionCardCategory;
  status: DialogueActionCardStatus;
  createdTurn: number;
  payload?: Record<string, any>;
  validationIssues?: string[];
}

export interface ActiveDialogue {
  dialogueId: string;
  npcId: string;
  npcName: string;
  npcPersonality: string;
  npcFaction: string;
  affinity: number;
  messages: DialogueMessage[];
  startedAt: number;
  awaitingResponse?: boolean;
  pendingTopic?: DialogueTopic | string | null;
  error?: string | null;
  actionCards?: DialogueActionCard[];
  selectedActionCardId?: string | null;
}

// ─── 死亡记录 ───
export interface DeathRecord {
  cause: string;
  turn: number;
  chapter: string;
  realm: string;
  achievementCount: number;
  lifeSummary?: string;
  closingPoem?: string;
  poemTitle?: string;
  majorChoices?: string[];
  deathCauseTags?: string[];
  endingFamilyId?: string;
  endingProvenance?: EndingProvenance;
  endingReasons?: string[];
  unresolvedWarnings?: string[];
  generatedAt?: string;
}

export interface AIContext {
  systemPrompt: string;
  playerStateJSON: string;
  keyEvents: KeyEvent[];
  recentMessages: Message[];
  rollingSummary: string;
  mode: 'canon' | 'if';
  turnNumber: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokens?: number;
  elapsed_ms?: number;
}

// ─── 存档 ───
export interface SaveMeta {
  slot: number;
  version: string;
  timestamp: number;
  playerName: string;
  realm: string;
  turn: number;
  mode: 'canon' | 'if';
}

// ─── 地图 ───
export interface MapLocation {
  id: string;
  name: string;
  region: string;
  x: number;
  y: number;
  discovered: boolean;
  type?: 'settlement' | 'wild' | 'market' | 'black_market' | 'resource' | 'sect' | 'rumor' | 'secret_realm';
  description?: string;
  dangerLevel?: 'low' | 'medium' | 'high' | 'extreme';
  facilities?: string[];
  relatedFactions?: string[];
  resourceHints?: string[];
  source?: 'canon' | 'chapter' | 'player_visit' | 'ai_rumor' | 'manual_review';
  credibility?: number;
  isRumor?: boolean;
  actions?: string[];
}

// ─── v0.7.0-pre: 战斗/小队设计包接口（pre 只落设计协议，运行时实现进 a/b/c）───
export interface BattleAssetManifestEntry {
  id: string;
  name: string;
  kind: 'killer_move' | 'immortal_gu' | 'scene' | 'ui_feedback';
  match?: {
    ids?: string[];
    names?: string[];
    tags?: string[];
  };
  assetPath?: string;
  fallbackTint?: string;
  durationMs?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  shake?: {
    intensity: number;
    durationMs: number;
  };
  sfxCue?: string;
  triggerTags: string[];
  runtimePhase: 'pre_schema' | 'v0.7.0-a' | 'v0.7.0-b' | 'v0.7.0-c';
  notes?: string;
}

export interface BattleDesignPack {
  version: string;
  engineModel: 'deterministic_with_controlled_llm_events';
  roundStructure: string[];
  resources: string[];
  llmEventWindows: string[];
  pressureRules: string[];
  assetManifest: string;
}

export interface SquadGrowthDesignSpec {
  trustAxes: string[];
  conflictSignals: string[];
  dispatchTaskTypes: string[];
  betrayalThreshold: number;
  narrativeReturnRules: string[];
}

// ─── 天赋 ───
export interface Talent {
  id: string;
  name: string;
  tier: 'gold' | 'red' | 'orange' | 'purple' | 'blue' | 'white';
  description: string;
  benefits: string[];
  costs: string[];
}

// ─── 章节弧光系统 ───
export interface ChapterDefinition {
  id: string;
  name: string;
  displayName: string;
  domain: string;
  domainOpeningChapter: boolean;
  position: {
    region: string;
    area: string;
    accessibleLocations: string[];
  };
  triggerConditions: string;
  keyNPCs: string[];
  keyFactions: string[];
  sceneConstraints: {
    mustHappen: string[];
    mustNotHappen: string[];
    narrativeTheme: string;
  };
  goals: ChapterGoal[];
  globalEventId?: string;
  exitTriggers?: string;
  economyTier: number;
  chapterPriceMultiplier: number;
  rippleLayers: string[];
}

export interface ChapterGoal {
  id: string;
  description: string;
  type: 'milestone' | 'realm_gate' | 'exploration' | 'economy' | 'decision';
}

export interface ChapterRecord {
  chapterId: string;
  domain: string;
  startedAt: { turn: number; timestamp: number };
  completedAt?: { turn: number; timestamp: number };
  goalsCompleted: string[];
  goalsFailed: string[];
}

export type EventStatus = 'pending' | 'active' | 'resolved' | 'skipped';

export type GoalStatus = 'locked' | 'active' | 'completed' | 'failed';

// ═══ P2新增：章节路由类型 ═══

/** 条件路由图 — 单条路由 */
export interface ChapterRoute {
  chapterId: string;
  domain: string;
  displayName: string;
  prerequisites: {
    requiredFlags: string[];
    requiredRealm?: number;
    requiredDomain?: string;
    requiredChapter?: string;
  };
  alternatives: string[]; // 互斥章节ID
  isExclusive: boolean; // 独占路由（选了就不能选alternatives）
  domainOpeningChapter: boolean; // 是否为某域的入口章
  priority: number; // 路由优先级（越大越优先）
}

/** 名场面距离检测 — 单条事件距离 */
export interface ProximityEvent {
  eventId: string;
  name: string;
  domain: string;
  distance: number; // 0=L0源发域, 15/30=L1相邻域(high/medium强度), 30/60=L2远隔域, 100=L3全域网
  layer: 'L0' | 'L1' | 'L2' | 'L3';
  manifestation?: string; // P2-2a: L1/L2当前域的涟漪叙事文本（200-400字）
}

/** 全局事件状态 */
export interface GlobalEventStatus {
  triggered: boolean;
  completed: boolean;
  triggeredAtChapter?: string;
}

/** L3全局flag — 来自global-flags.json */
export interface GlobalFlag {
  id: string;
  name: string;
  eventId: string;
  priority: number;
  description: string;
  effectOnNarrative: string; // AI注入的叙事影响描述
  dependsOn: string[];
}

/** 路由结果 — 路由引擎输出 */
export interface ChapterRouteResult {
  reachable: ChapterRoute[];
  recommended?: ChapterRoute;
  upcomingEvents: ProximityEvent[];
}

/** 章节推进结果 — P2扩展多路由选项 */
export interface ChapterProgressionResult {
  shouldTransition: boolean;
  nextChapterId?: string;
  nextChapterOptions?: ChapterRoute[]; // P2: 多路由选项
  nextDomain?: string;
  proximityEvents?: ProximityEvent[]; // P2: 临近的名场面
  reason: string;
}

export type ChapterTransitionState = 'idle' | 'transitioning' | 'confirmed';

// ─── P2-9: 随机遭遇系统类型 ───
export type { EncounterType, EncounterCategory, EncounterRisk, EncounterCooldown, EncounterTriggerCondition, EncounterChoice, EncounterReward, EncounterTemplate, EncounterTriggerResult, EncounterInjectionContext, EncounterRecord, EncounterState } from './encounter';

// ═══ P2-13: 洞天/福地动态模型 ═══
export interface HeavenlyLand {
  id: string;
  type: '洞天' | '福地';
  domain: string;
  name: string;
  /** 面积（亩） */
  areaMu: number;
  /** 时间流速比（洞天内部时间 / 外部时间） */
  timeFlowRatio: number;
  /** 资源产出速率（元石/轮） */
  resourceOutputRate: number;
  /** 地灵信息 */
  earthSpirit: {
    formed: boolean;
    name?: string;
    personality?: string;
    /** 地灵对主人的认可度 0-100 */
    approval: number;
  };
  /** 天灾倒计时（轮） */
  disasterCountdown: number;
  /** 下一场天灾类型 */
  nextDisasterType: string;
  /** 创建回合 */
  createdAt: number;
  /** 当前是否可进入 */
  accessible: boolean;
}

// ═══ v0.8.0-b2: 修行 / 突破 / 升仙 / 灾劫深化状态 ═══
export type CultivationLocationContext = 'safe' | 'caravan' | 'field' | 'wild' | 'aperture';
export type CultivationQiKind = 'human' | 'earth' | 'heaven';
export type CultivationOutcome = 'success' | 'failure' | 'blocked';
export type CultivationResolutionStepKind =
  | 'environment'
  | 'progress_gain'
  | 'resource_spend'
  | 'realm_change'
  | 'injury'
  | 'essence_shock'
  | 'gu_damage'
  | 'aperture_pressure'
  | 'dao_mark_shift'
  | 'calamity_warning'
  | 'calamity_consequence'
  | 'failure'
  | 'settlement';

export interface CultivationResolutionStep {
  id: string;
  turn: number;
  kind: CultivationResolutionStepKind;
  message: string;
  amount?: number;
  path?: PathType;
  source?: string;
  severity?: number;
  tags: string[];
}

export interface CultivationEnvironmentProfile {
  period: GameTime['period'];
  periodLabel: string;
  location: CultivationLocationContext;
  locationLabel: string;
  safety: 'secure' | 'watchful' | 'dangerous';
  progressMultiplier: number;
  riskMultiplier: number;
  essenceCostMultiplier: number;
  qiBias: CultivationQiKind;
  labels: string[];
  warnings: string[];
}

export interface BreakthroughAttemptRecord {
  id: string;
  turn: number;
  outcome: CultivationOutcome;
  realmBefore: RealmInfo;
  realmAfter?: RealmInfo;
  successRate: number;
  roll?: number;
  severity?: number;
  steps: CultivationResolutionStep[];
}

export interface AscensionAttemptRecord {
  id: string;
  turn: number;
  outcome: CultivationOutcome;
  successRate: number;
  roll?: number;
  threeQi: Record<CultivationQiKind, number>;
  blessedLandGrade?: ImmortalApertureGrade;
  heavenlyLandId?: string;
  steps: CultivationResolutionStep[];
}

export interface CalamityPreview {
  id: string;
  name: string;
  category: 'earth_calamity' | 'heavenly_tribulation';
  path: PathType;
  severity: number;
  countdown: number;
  affectedResourceNodeIds: string[];
  expectedAreaLossPct: number;
  warnings: string[];
  tags: string[];
}

export type CalamitySceneKind =
  | 'natural_disaster'
  | 'desolate_beast_invasion'
  | 'human_calamity'
  | 'dao_mark_manifestation'
  | 'immortal_killer_pressure'
  | 'resource_node_imbalance';

export interface CalamitySceneSpec {
  id: string;
  previewId: string;
  name: string;
  kind: CalamitySceneKind;
  category: CalamityPreview['category'];
  path: PathType;
  severity: number;
  sceneId: string;
  realmGrand: number;
  countdown: number;
  affectedResourceNodeIds: string[];
  omenText: string;
  entryText: string;
  allowedResponses: Array<'observe' | 'formation' | 'resource_protection' | 'combat' | 'sacrifice_gu' | 'repair_aperture' | 'retreat_inside_aperture'>;
  possibleConsequences: string[];
  combatScale?: CombatEncounterScale;
  tags: string[];
}

export interface CalamityRecord {
  id: string;
  turn: number;
  calamityId: string;
  calamityName: string;
  outcome: CultivationOutcome;
  areaLoss: number;
  resourceNodeDamage: Record<string, number>;
  daoMarkDelta: Record<PathType, number>;
  guDamageIds: string[];
  steps: CultivationResolutionStep[];
}

export interface CultivationDeepeningState {
  version: 'v0.8.0-b2';
  progress: number;
  progressByRealm: Record<string, number>;
  breakthroughHistory: BreakthroughAttemptRecord[];
  ascension: {
    threeQi: Record<CultivationQiKind, number>;
    preparationScore: number;
    heavenWillPressure: number;
    karmicDebt: number;
    lastAttempt?: AscensionAttemptRecord;
  };
  calamityLedger: CalamityRecord[];
  nextCalamityPreview: CalamityPreview | null;
  lastEnvironment: CultivationEnvironmentProfile | null;
  lastResolution: CultivationResolutionStep[];
}

/** NPC关系网络 — 双向好感矩阵 */
export interface NpcRelationMatrix {
  /** 
   * 稀疏矩阵: [npcIdA]: { [npcIdB]: affinity }
   * affinity范围 -100~100
   * 正数=好感，负数=恶感
   * 双向不对称（A对B的好感≠B对A的好感）
   */
  matrix: Record<string, Record<string, number>>;
  /** 矩阵最后更新回合 */
  lastUpdatedTurn: number;
}

// ═══ P2-流派: 流派道痕互斥引擎 ═══
/** 流派互斥检查结果 */
export interface DaoMarkConflict {
  /** 主修流派 */
  primary: PathType;
  /** 冲突的辅修流派 */
  conflicting: PathType;
  /** 互斥程度: 0=兼容, 0.3=轻微冲突(可以辅修), 0.7=严重冲突(不建议), 1.0=完全互斥(不可辅修) */
  severity: number;
  /** 原因说明 */
  reason: string;
}

/** 道痕量变质变规则 */
export interface DaoMarkRule {
  /** 规则适用的流派 */
  path: PathType;
  /** 道痕量：100道痕=1成，300=3成=小成，1000=10成=大成 */
  threshold: number;
  /** 质变后名称 */
  grade: string;
  /** 战力倍率 */
  multiplier: number;
}

// ═══ P2-流派: 本命蛊系统 ═══
export interface LifeboundGu {
  /** 绑定的蛊虫ID */
  guId: string;
  /** 蛊虫名称 */
  guName: string;
  /** 绑定时间(回合) */
  boundAt: number;
  /** 绑定后累计回合 */
  turnsSinceBound: number;
  /** 冷却剩余回合（绑定/解绑后30轮冷却） */
  cooldownRemaining: number;
  /** 自动升级次数 */
  upgradeCount: number;
  /** 是否处于冷却中 */
  onCooldown: boolean;
}

/** 本命蛊死亡惩罚 */
export interface LifeboundDeathPenalty {
  /** 扣除生命百分比 */
  hpPercentLoss: number;
  /** 扣除道痕百分比 */
  daoMarkPercentLoss: number;
  /** 持续时间（轮） */
  duration: number;
  /** 是否触发反噬 */
  backlashTriggered: boolean;
}
