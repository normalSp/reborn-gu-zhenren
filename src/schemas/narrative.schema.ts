import { z } from 'zod';

const StringAnyRecord = z.record(z.string(), z.any());
const StringNumberRecord = z.record(z.string(), z.number());
const StringStringRecord = z.record(z.string(), z.string());

// ─── Choice Schema ───
export const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(100), // 5B: 放宽文本长度限制
  risk: z.enum(['high', 'medium', 'low']).optional().default('medium'), // 5B: 可选
  risk_note: z.string().min(0).max(200).optional().default('未知风险'), // 5B: 可选
}).passthrough(); // 5B: 容忍AI的outcome/reward等额外字段

// ─── StateUpdate Sub-Schemas ───
const StateAttributeAction = z.object({
  action: z.enum(['add', 'set']),
  value: z.number(),
});

const RealmUpdate = z.object({
  action: z.literal('set'),
  value: z.string(),
});

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
  npc_contacts: NpcContactsUpdate,
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
