import { z } from 'zod';

const StringAnyRecord = z.record(z.string(), z.any());
const StringNumberRecord = z.record(z.string(), z.number());
const StringStringRecord = z.record(z.string(), z.string());

const NarrativeGuUtilityCategorySchema = z.enum([
  'reconnaissance',
  'tracking',
  'healing',
  'detox',
  'obstacle_breaking',
  'concealment',
  'intimidation',
  'forbidden_ritual',
  'mobility',
  'protection',
  'control',
  'signal',
  'survival',
  'refinement',
]);

const ChoiceGuAffordanceSchema = z.object({
  sourceType: z.enum(['gu', 'killer_move']).optional(),
  sourceName: z.string().min(1),
  utilityId: z.string().min(1).optional(),
  category: NarrativeGuUtilityCategorySchema.optional(),
  categoryLabel: z.string().optional(),
  label: z.string().optional(),
  status: z.enum(['available', 'missing', 'blocked', 'forbidden']).optional(),
  reason: z.string().optional(),
  risk: z.enum(['low', 'medium', 'high']).optional(),
  riskHint: z.string().optional(),
  owned: z.boolean().optional(),
  sceneGated: z.boolean().optional(),
  forbidden: z.boolean().optional(),
  promptHint: z.string().optional(),
}).passthrough();

// ─── Choice Schema ───
export const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(100), // 5B: 放宽文本长度限制
  risk: z.enum(['high', 'medium', 'low']).optional().default('medium'), // 5B: 可选
  risk_note: z.string().min(0).max(200).optional().default('未知风险'), // 5B: 可选
  gu_affordance: z.union([
    ChoiceGuAffordanceSchema,
    z.array(ChoiceGuAffordanceSchema),
  ]).optional(),
  guAffordances: z.array(ChoiceGuAffordanceSchema).optional(),
}).passthrough(); // 5B: 容忍AI的outcome/reward等额外字段

// ─── StateUpdate Sub-Schemas ───
const StateAttributeAction = z.object({
  action: z.enum(['add', 'set']),
  value: z.number(),
});

const RealmUpdate = z.preprocess((value) => {
  if (typeof value === 'string') {
    return { action: 'set', value };
  }
  if (value && typeof value === 'object' && 'value' in value && !('action' in value)) {
    return { ...(value as Record<string, unknown>), action: 'set' };
  }
  return value;
}, z.object({
  action: z.literal('set').optional().default('set'),
  value: z.string(),
}));

const AttributesUpdate = z.object({
  资质: StateAttributeAction.optional(),
  体魄: StateAttributeAction.optional(),
  心智: StateAttributeAction.optional(),
  气运: StateAttributeAction.optional(),
}).optional();

const HealthUpdate = z.object({
  current: z.number().min(0),
  max: z.number().min(1),
}).optional();

const GuAdd = z.object({
  name: z.string(),
  tier: z.number().min(1).max(9),
  path: z.string(),
  rarity: z.string(),
  description: z.string(),
});

const GuInventoryUpdate = z.object({
  add: z.array(GuAdd).optional(),
  remove: z.array(z.string()).optional(),
}).optional();

const FlagsUpdate = z.object({
  set: StringAnyRecord.optional(),
  remove: z.array(z.string()).optional(),
}).optional();

const FactionUpdate = z.record(z.string(), z.object({
  standing: z.number(),
}).passthrough()).optional();  // v0.6.0修复: passthrough容忍AI返回额外字段(reputation/status等)

const WealthUpdate = z.object({
  delta: z.number(),
}).optional();

const CausalityUpdate = z.object({
  track: z.string().optional(),
  butterfly_effects: z.array(z.string()).optional(),
}).optional();

const DaoHeartUpdate = z.object({
  kill: z.number().optional(),
  mercy: z.number().optional(),
  scheme: z.number().optional(),
  ambition: z.number().optional(),
}).optional();

const PlayerUpdate = z.object({
  realm: RealmUpdate.optional(),
  attributes: AttributesUpdate,
  health: HealthUpdate,
  essence: HealthUpdate,
  dao_heart: DaoHeartUpdate,
  dao_marks: StringNumberRecord.optional(),
  path_levels: StringStringRecord.optional(),
}).optional();

const MaterialsUpdate = z.object({
  add: StringNumberRecord.optional(),
}).optional();

const RecipeFragmentsUpdate = z.object({
  add: z.array(z.string()).optional(),
}).optional();

const DiscoveriesUpdate = z.object({
  add: z.array(z.object({
    type: z.enum(['material', 'recipe', 'path', 'location', 'npc_request', 'trade', 'unknown']).optional().default('unknown'),
    name: z.string().min(1),
    note: z.string().min(1),
    source: z.literal('ai-rumor').optional().default('ai-rumor'),
  }).passthrough()).optional(),
}).optional();

const DialogueRequestsUpdate = z.object({
  add: z.array(z.object({
    id: z.string().optional(),
    npcName: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    category: z.enum(['request', 'trade', 'rumor', 'hunt', 'escort', 'information', 'other']).optional().default('other'),
    risk: z.enum(['high', 'medium', 'low']).optional().default('medium'),
    rewardHint: z.string().optional(),
    source: z.literal('ai-rumor').optional().default('ai-rumor'),
  }).passthrough()).optional(),
}).optional();

const DynamicNpcUpdate = z.object({
  add: z.array(z.any()).optional(),
  affinity_delta: z.array(z.object({
    name: z.string().min(1),
    delta: z.number(),
  }).passthrough()).optional(),
}).optional();

const NpcContactAdd = z.object({
  npcId: z.string().optional(),
  name: z.string().min(1),
  source: z.enum(['canon', 'dynamic', 'ai_rumor', 'manual']).optional(),
  status: z.enum(['heard', 'seen', 'interacted']).optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
}).passthrough();

const NpcContactsUpdate = z.object({
  add: z.array(NpcContactAdd).optional(),
}).optional();

const GuUseTargetSchema = z.object({
  type: z.enum(['self', 'known_npc', 'dynamic_npc', 'squad_member', 'scene_target', 'aperture_or_location']),
  id: z.string().optional(),
  name: z.string().optional(),
}).passthrough();

const GuUseSuggestionAdd = z.object({
  guName: z.string().min(1),
  target: GuUseTargetSchema.optional(),
  utilityId: z.string().min(1).optional(),
  category: NarrativeGuUtilityCategorySchema.optional(),
  riskHint: z.string().optional(),
  sceneValidated: z.boolean().optional(),
  sceneTags: z.array(z.string()).optional(),
  reason: z.string().optional(),
}).passthrough();

const GuUseSuggestionsUpdate = z.object({
  add: z.array(GuUseSuggestionAdd).optional(),
}).optional();

const CombatEventCandidateAdd = z.object({
  id: z.string().optional(),
  type: z.enum(['ambush', 'third_party', 'environment', 'pursuit', 'negotiation', 'reinforcement', 'escape_window', 'other']),
  title: z.string().min(1),
  summary: z.string().min(1),
  risk: z.enum(['low', 'medium', 'high']).optional(),
  source: z.enum(['ai-rumor', 'engine']).optional(),
  engineValidation: z.enum(['pending', 'accepted', 'blocked']).optional(),
  validationIssues: z.array(z.string()).optional(),
  createdTurn: z.number().optional(),
}).passthrough();

const CombatEventCandidatesUpdate = z.object({
  add: z.array(CombatEventCandidateAdd).optional(),
}).optional();

const StoryEventCandidateAdd = z.object({
  id: z.string().optional(),
  anchorId: z.string().optional(),
  type: z.enum(['side_event', 'npc_contact', 'rumor', 'faction_move', 'inheritance_hint', 'danger', 'other']),
  title: z.string().min(1),
  summary: z.string().min(1),
  risk: z.enum(['low', 'medium', 'high']),
  source: z.enum(['ai-rumor', 'engine']).optional(),
  engineValidation: z.enum(['pending', 'accepted', 'blocked']).optional(),
  validationIssues: z.array(z.string()).optional(),
}).passthrough();

const StoryEventCandidatesUpdate = z.object({
  add: z.array(StoryEventCandidateAdd).optional(),
}).optional();

const IfBranchCandidateAdd = z.object({
  id: z.string().optional(),
  anchorId: z.string().min(1),
  axis: z.enum([
    'protect_fate',
    'break_fate',
    'faction_shift',
    'npc_survival',
    'resource_control',
    'venerable_balance',
    'heaven_will_debt',
  ]),
  proposedDelta: z.number(),
  summary: z.string().min(1),
  costHint: z.string().min(1),
  downstreamHint: z.array(z.string()).optional().default([]),
  source: z.enum(['ai-rumor', 'engine']).optional(),
  engineValidation: z.enum(['pending', 'accepted', 'blocked']).optional(),
}).passthrough();

const IfBranchCandidatesUpdate = z.object({
  add: z.array(IfBranchCandidateAdd).optional(),
}).optional();

const CanonAnchorPressureAdd = z.object({
  anchorId: z.string().min(1),
  pressure: z.number().min(0).max(100),
  reason: z.string().min(1),
  attemptedMutation: z.string().min(1),
  engineDecision: z.enum(['allow_local_variation', 'redirect', 'block']),
  fallbackNarrativeHint: z.string().min(1),
}).passthrough();

const CanonAnchorPressureUpdate = z.object({
  add: z.array(CanonAnchorPressureAdd).optional(),
}).optional();

// ─── StateUpdate Schema ───
export const StateUpdateSchema = z.object({
  player: PlayerUpdate,
  wealth: WealthUpdate,
  gu_inventory: GuInventoryUpdate,
  flags: FlagsUpdate,
  faction: FactionUpdate,
  causality: CausalityUpdate,
  materials: MaterialsUpdate,
  recipe_fragments: RecipeFragmentsUpdate,
  discoveries: DiscoveriesUpdate,
  dialogue_requests: DialogueRequestsUpdate,
  dynamic_npcs: DynamicNpcUpdate,
  npc_contacts: NpcContactsUpdate,
  gu_use_suggestions: GuUseSuggestionsUpdate,
  combat_event_candidates: CombatEventCandidatesUpdate,
  story_event_candidates: StoryEventCandidatesUpdate,
  if_branch_candidates: IfBranchCandidatesUpdate,
  canon_anchor_pressure: CanonAnchorPressureUpdate,
}).passthrough(); // 5B: strict→passthrough 容忍AI额外字段

// ─── NarrativeJSON Schema ───
export const NarrativeJSONSchema = z.object({
  narrative: z.object({
    text: z.string().min(50, '叙事文本过短').max(3000, '叙事文本过长'),
    choices: z.array(ChoiceSchema).min(1, '选项至少1个').max(6, '选项最多6个'),
  }),
  state_update: StateUpdateSchema.optional(),
}).passthrough(); // 5B: strict→passthrough + state_update可选，容忍AI不规则输出

// ─── Validation Result Types ───
export type NarrativeJSON = z.infer<typeof NarrativeJSONSchema>;
export type StateUpdate = z.infer<typeof StateUpdateSchema>;
export type ValidatedChoice = z.infer<typeof ChoiceSchema>;

export interface NarrativeValidationError {
  path: string;
  message: string;
}

export interface NarrativeValidationResult {
  success: boolean;
  data?: NarrativeJSON;
  errors?: NarrativeValidationError[];
}
