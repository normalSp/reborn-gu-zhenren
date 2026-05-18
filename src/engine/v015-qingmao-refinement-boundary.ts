import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';
import {
  buildQingmaoLowRankEconomyPlan,
  type QingmaoLowRankEconomyPlan,
} from './v015-qingmao-low-rank-economy';
import {
  getRegisteredRecipeForFragment,
  type RecipeRegistryEntry,
} from './recipe-registry';
import fragmentsRaw from '../canon/fragment-recipes.json';
import type {
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingPlayerGoalEntry,
  LivingWorldState,
  LocalActionLedgerEntry,
  NarrativeReturnContext,
  PlayerKnownFact,
  WorldActionCandidate,
  WorldActionDeparture,
  WorldActionResolution,
} from '../types';

const ACTION_ID = 'qingmao_refinement_boundary_probe';
const KNOWN_FACT_ID = 'qingmao_refinement_fragment_boundary_baseline';
const CONSEQUENCE_ID = 'consequence_qingmao_refinement_boundary_probe';
const REGION_ID = 'qingmao_three_clans';
const FRAGMENT_ID = 'frag_moonlight_advanced';

interface FragmentRecipe {
  id: string;
  name: string;
  type: 'refine' | 'ascend';
  targetGu: string;
  targetTier: number;
  fragmentsRequired?: number;
  requiredMaterials: string[];
  completionDifficulty: number;
  sourceType: 'exploration' | 'combat' | 'ruins';
  sourceChapter: string;
  description: string;
}

const START_PROFILE_FACTIONS: Record<string, string> = {
  start_qingmaoshan_guyue: 'guyue_shanzhai',
  start_qingmaoshan_xiongjia: 'xiongjia_zhai',
  start_qingmaoshan_baijia: 'baijia_zhai',
  start_qingmaoshan_shangjia_caravan: 'shangjia',
  start_qingmaoshan_wujia_branch: 'wujia',
  start_qingmaoshan_tiejia_patrol: 'tiejia',
  start_qingmaoshan_sanxiu: 'sanxiu',
};

export interface QingmaoRefinementBoundaryInput {
  livingWorldState?: Partial<LivingWorldState> | null;
  materialBag?: Record<string, number> | null;
  turn?: number;
  sceneId?: string | null;
  locationId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
}

export interface QingmaoFragmentBoundaryMaterialRow {
  materialName: string;
  owned: number;
  enough: boolean;
}

export interface QingmaoFragmentBoundaryPreview {
  fragmentId: string;
  name: string;
  targetGu: string;
  targetTier: number;
  requiredFragments: number;
  requiredMaterials: QingmaoFragmentBoundaryMaterialRow[];
  registeredRecipeId: string | null;
  sourceRef: string;
  canAttemptNow: false;
  canUnlockRecipeNow: false;
}

export interface QingmaoRefinementBoundaryResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  visibleSourceRefs: string[];
  rejectedReasons: string[];
  forbiddenUpgrades: string[];
  refinementPlan: QingmaoLowRankEconomyPlan;
  fragmentPreview: QingmaoFragmentBoundaryPreview | null;
  knownFacts: PlayerKnownFact[];
  factionPressure: LivingFactionPressureEntry[];
  npcMemories: LivingNpcMemoryEntry[];
  playerGoals: LivingPlayerGoalEntry[];
  actionConsequences: LivingActionConsequenceEntry[];
  worldActionCandidate: WorldActionCandidate;
  worldActionDeparture: WorldActionDeparture;
  worldActionResolution: WorldActionResolution;
  worldActionLedgerEntry: LocalActionLedgerEntry;
  narrativeReturnContext: NarrativeReturnContext;
  statePatchApplied: false;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: QingmaoRefinementBoundaryInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function currentSceneId(input: QingmaoRefinementBoundaryInput): string {
  return input.sceneId || 'v015_qingmao_refinement_boundary';
}

function currentLocationId(input: QingmaoRefinementBoundaryInput): string {
  return input.locationId || 'qingmaoshan_refinement_room_outer';
}

function currentFactionId(input: QingmaoRefinementBoundaryInput): string {
  if (input.playerFactionId) return input.playerFactionId;
  const startProfileId = input.selectedStartProfileId || '';
  return START_PROFILE_FACTIONS[startProfileId] || 'qingmao_local_watch';
}

function findRelevantGoal(state?: Partial<LivingWorldState> | null): LivingPlayerGoalEntry | null {
  return (state?.playerGoals || []).find(goal => (
    goal.status !== 'failed'
    && (
      goal.targetRef === 'region:outside_qingmao'
      || goal.rationale.includes('逃离青茅山')
      || goal.rationale.includes('炼蛊')
      || goal.rationale.includes('残方')
    )
  )) || null;
}

function hasEconomyPreparationContext(state?: Partial<LivingWorldState> | null): boolean {
  return Boolean(
    state?.knownFacts?.qingmao_supply_feeding_preparation_baseline
    || (state?.actionConsequences || []).some(entry => (
      entry.actionId === 'qingmao_supply_feeding_preparation_probe'
      || entry.followUpRefs.includes('feeding:feeding_liquor_worm_wine_stock_pressure')
      || entry.followUpRefs.includes('gate:no_material_reward')
    )),
  );
}

function targetFragment(): FragmentRecipe | null {
  const fragments = ((fragmentsRaw as any).fragments || []) as FragmentRecipe[];
  return fragments.find(fragment => fragment.id === FRAGMENT_ID) || null;
}

function buildFragmentPreview(
  fragment: FragmentRecipe | null,
  recipe: RecipeRegistryEntry | undefined,
  materialBag?: Record<string, number> | null,
): QingmaoFragmentBoundaryPreview | null {
  if (!fragment) return null;
  const bag = materialBag || {};
  return {
    fragmentId: fragment.id,
    name: fragment.name,
    targetGu: fragment.targetGu,
    targetTier: fragment.targetTier,
    requiredFragments: Number(fragment.fragmentsRequired || 1),
    requiredMaterials: fragment.requiredMaterials.map(materialName => {
      const owned = Number(bag[materialName] || 0);
      return {
        materialName,
        owned,
        enough: owned > 0,
      };
    }),
    registeredRecipeId: recipe?.id || null,
    sourceRef: recipe?.sourceRef || `fragment-recipes.json:${fragment.id}`,
    canAttemptNow: false,
    canUnlockRecipeNow: false,
  };
}

function visibleSourceRefs(
  state: Partial<LivingWorldState> | null | undefined,
  plan: QingmaoLowRankEconomyPlan,
  fragmentPreview: QingmaoFragmentBoundaryPreview | null,
): string[] {
  const goal = findRelevantGoal(state);
  return unique([
    goal ? `goal:${goal.id}` : '',
    hasEconomyPreparationContext(state) ? 'fact:qingmao_supply_feeding_preparation_baseline' : '',
    ...plan.ruleDrafts.map(rule => `${rule.focus}:${rule.id}`),
    fragmentPreview ? `fragment:${fragmentPreview.fragmentId}` : '',
    fragmentPreview?.registeredRecipeId ? `recipe:${fragmentPreview.registeredRecipeId}` : '',
    ...plan.visibleSourceRefs.slice(0, 6),
    'mirofish-pack:v015_low_rank_economy_refinement_feeding_pack',
  ]);
}

function blockedReasons(
  state: Partial<LivingWorldState> | null | undefined,
  plan: QingmaoLowRankEconomyPlan,
  fragmentPreview: QingmaoFragmentBoundaryPreview | null,
): string[] {
  return unique([
    hasEconomyPreparationContext(state) ? '' : 'missing_low_rank_economy_context',
    plan.ruleDrafts.length > 0 ? '' : 'missing_refinement_rules',
    fragmentPreview ? '' : 'missing_fragment_preview',
  ]);
}

function forbiddenUpgrades(plan: QingmaoLowRankEconomyPlan): string[] {
  return unique([
    ...plan.forbiddenWrites,
    'material_consumption',
    'currency_delta',
    'gu_reward',
    'recipe_unlock',
    'complete_recipe_unlock',
    'refinement_success',
    'refinement_failure_cost_settlement',
    'formal_market_trade',
    'standing_delta',
    'warrant',
    'npc_death',
    'npc_capture',
    'hidden_fact_reveal',
    'deepseek_authority_expansion',
    'save_format_bump',
  ]);
}

function buildCandidate(
  input: QingmaoRefinementBoundaryInput,
  blockers: string[],
  forbidden: string[],
): WorldActionCandidate {
  return createWorldActionCandidate({
    id: ACTION_ID,
    domain: 'field_action',
    source: 'player_choice',
    sourceId: 'low_rank_economy:refinement_boundary',
    sceneId: currentSceneId(input),
    locationId: currentLocationId(input),
    createdTurn: currentTurn(input),
    title: '试读残方与失败代价',
    summary: '把残方不等于完整蛊方、炼蛊失败代价和缺项整理为前置边界；当前不消耗材料、不解锁配方、不判定成功。',
    risk: 'medium',
    apCost: 0,
    blockers,
    warnings: [
      '不消耗材料或元石。',
      '不解锁完整蛊方。',
      '不判定炼成结论或失败结算。',
      '不让 DeepSeek 补全配方、成功率或奖励。',
    ],
    tags: ['v0.15.0-b2', 'low_rank_economy', 'refinement_boundary'],
    metadata: {
      regionId: REGION_ID,
      saveFormatImpact: 'none',
      fragmentId: FRAGMENT_ID,
      forbiddenUpgrades: forbidden,
    },
  });
}

function buildUpdatedGoal(goal: LivingPlayerGoalEntry, turn: number): LivingPlayerGoalEntry {
  return {
    ...goal,
    status: 'deferred',
    lastUpdatedTurn: turn,
    rationale: '低阶行动继续受资源和炼蛊边界约束；当前只试读残方与失败代价，不消耗材料、不解锁完整蛊方、不写成败结论。',
    nextStepHints: unique([
      'refinement:recipe_fragment_incomplete_formula_boundary',
      'refinement:refine_failure_cost_aperture_and_material_loss',
      'fragment:frag_moonlight_advanced',
      ...goal.nextStepHints,
    ]),
    blockedByRefIds: unique([
      'gate:no_complete_recipe_unlock',
      'gate:no_refinement_success',
      'gate:no_material_consumption',
      'gap:fragment_material_verification',
      ...goal.blockedByRefIds,
    ]),
  };
}

export function resolveQingmaoRefinementBoundaryAction(
  input: QingmaoRefinementBoundaryInput = {},
): QingmaoRefinementBoundaryResolution {
  const turn = currentTurn(input);
  const refinementPlan = buildQingmaoLowRankEconomyPlan({
    focus: 'refinement',
    includeDeferredWarnings: false,
  });
  const fragment = targetFragment();
  const recipe = fragment ? getRegisteredRecipeForFragment(fragment.id) : undefined;
  const fragmentPreview = buildFragmentPreview(fragment, recipe, input.materialBag);
  const rejectedReasons = blockedReasons(input.livingWorldState, refinementPlan, fragmentPreview);
  const forbidden = forbiddenUpgrades(refinementPlan);
  const sourceRefs = visibleSourceRefs(input.livingWorldState, refinementPlan, fragmentPreview);
  const candidate = buildCandidate(input, rejectedReasons, forbidden);
  const departure = createWorldActionDeparture({
    candidate,
    turn,
    mode: rejectedReasons.length > 0 ? 'blocked' : 'local_resolution',
    chargeAp: false,
    metadata: {
      regionId: REGION_ID,
      fragmentId: FRAGMENT_ID,
      visibleSourceRefs: sourceRefs,
    },
  });

  if (rejectedReasons.length > 0) {
    const resolution = createWorldActionResolution({
      departure,
      status: 'blocked',
      summary: '残方与炼蛊失败代价试读被阻断：缺少低阶经济上下文、炼蛊边界规则或残方预览。',
      blockedReasons: rejectedReasons,
      rewardPolicy: 'none',
      metadata: { forbiddenUpgrades: forbidden },
    });
    const ledger = projectWorldActionLedgerEntry({
      departure,
      resolution,
      source: 'v015_qingmao_refinement_boundary',
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
      message: '请先完成低阶经济前置，如补给/喂养缺口整理，再试读残方与失败代价。',
      publicSummary: resolution.summary,
      actionId: ACTION_ID,
      visibleSourceRefs: sourceRefs,
      rejectedReasons,
      forbiddenUpgrades: forbidden,
      refinementPlan,
      fragmentPreview,
      knownFacts: [],
      factionPressure: [],
      npcMemories: [],
      playerGoals: [],
      actionConsequences: [],
      worldActionCandidate: candidate,
      worldActionDeparture: departure,
      worldActionResolution: resolution,
      worldActionLedgerEntry: ledger,
      narrativeReturnContext,
      statePatchApplied: false,
    };
  }

  const goal = findRelevantGoal(input.livingWorldState);
  const factionId = currentFactionId(input);
  const knownFact: PlayerKnownFact = {
    id: KNOWN_FACT_ID,
    scope: 'region',
    source: 'engine_result',
    summary: '残方、炼蛊失败代价和材料验证缺口已整理为试读边界；当前没有消耗材料、解锁完整蛊方、写入炼成或失败结算。',
    learnedTurn: turn,
    confidence: 'confirmed',
    tags: ['v0.15.0-b2', 'low_rank_economy', 'refinement_boundary'],
  };
  const pressure: LivingFactionPressureEntry = {
    id: `faction_pressure_qingmao_refinement_boundary_${factionId}_attention`,
    factionId,
    pressureType: 'suspicion',
    delta: 1,
    reason: '试读残方、打听材料和评估失败代价会暴露你对炼蛊资源的兴趣；本阶段只记录轻微注意，不写声望、通缉或正式任务。',
    turn,
    visibility: 'player_visible',
  };
  const npcMemory: LivingNpcMemoryEntry = {
    id: 'npc_memory_qingmao_refinement_boundary_local_watch',
    npcId: 'qingmao_refinement_room_outer_watch',
    turn,
    regionId: REGION_ID,
    actionId: ACTION_ID,
    publicSummary: '炼蛊房外的耳目只看见你在试读残方和核对缺项，尚不足以证明你已经炼成新蛊。',
    privateRefId: null,
    attitudeDelta: -1,
    weight: 2,
    tags: ['v0.15.0-b2', 'refinement_boundary', 'public_refinement_trace'],
    expiresTurn: null,
  };
  const updatedGoals = goal ? [buildUpdatedGoal(goal, turn)] : [];
  const ruleIds = refinementPlan.ruleDrafts.map(rule => rule.id);
  const materialGapRefs = fragmentPreview?.requiredMaterials.map(row => `material:${row.materialName}`) || [];
  const resolution = createWorldActionResolution({
    departure,
    status: 'resolved',
    summary: '残方与炼蛊失败代价已整理为边界试读；没有材料消耗、配方解锁、炼成结论或失败结算。',
    localFacts: [
      knownFact.summary,
      ...refinementPlan.ruleDrafts.map(rule => rule.publicHint),
      fragmentPreview
        ? `${fragmentPreview.name} 只作为试读目标：需要 ${fragmentPreview.requiredFragments} 份残方与材料验证。`
        : '',
    ].filter(Boolean),
    risks: unique([
      'fragment_incomplete_formula',
      'refinement_failure_cost',
      'material_verification_gap',
      'local_refinement_attention',
    ]),
    rewardPolicy: 'none',
    metadata: {
      refinementRuleIds: ruleIds,
      fragmentId: fragmentPreview?.fragmentId || null,
      fragmentTargetGu: fragmentPreview?.targetGu || null,
      materialGapRefs,
      visibleSourceRefs: sourceRefs,
      forbiddenUpgrades: forbidden,
    },
  });
  const ledger = projectWorldActionLedgerEntry({
    departure,
    resolution,
    source: 'v015_qingmao_refinement_boundary',
  });
  const consequence: LivingActionConsequenceEntry = {
    id: CONSEQUENCE_ID,
    actionId: ACTION_ID,
    turn,
    scope: 'resource',
    publicSummary: '残方、材料验证和失败代价进入行动账本；当前仍只是边界试读，不是炼蛊结算。',
    effectRefs: [
      KNOWN_FACT_ID,
      pressure.id,
      npcMemory.id,
    ],
    followUpRefs: unique([
      ...ruleIds.map(id => `refinement:${id}`),
      fragmentPreview ? `fragment:${fragmentPreview.fragmentId}` : '',
      'gate:no_complete_recipe_unlock',
      'gate:no_refinement_success',
      'gate:no_material_consumption',
      'gate:no_currency_delta',
      ...materialGapRefs,
    ]),
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
    message: '已试读残方与失败代价：形成边界账本，不消耗材料、不解锁蛊方、不写成败结论。',
    publicSummary: resolution.summary,
    actionId: ACTION_ID,
    visibleSourceRefs: sourceRefs,
    rejectedReasons,
    forbiddenUpgrades: forbidden,
    refinementPlan,
    fragmentPreview,
    knownFacts: [knownFact],
    factionPressure: [pressure],
    npcMemories: [npcMemory],
    playerGoals: updatedGoals,
    actionConsequences: [consequence],
    worldActionCandidate: candidate,
    worldActionDeparture: departure,
    worldActionResolution: resolution,
    worldActionLedgerEntry: ledger,
    narrativeReturnContext,
    statePatchApplied: false,
  };
}
