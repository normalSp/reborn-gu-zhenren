import { z } from 'zod';

// ─── Choice Schema ───
export const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(50),
  risk: z.enum(['high', 'medium', 'low']),
  risk_note: z.string().min(1).max(100),
});

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
  set: z.record(z.any()).optional(),
  remove: z.array(z.string()).optional(),
}).optional();

const FactionUpdate = z.record(z.object({
  standing: z.number(),
})).optional();

const WealthUpdate = z.object({
  delta: z.number(),
}).optional();

const CausalityUpdate = z.object({
  track: z.string().optional(),
  butterfly_effects: z.array(z.string()).optional(),
}).optional();

const PlayerUpdate = z.object({
  realm: RealmUpdate.optional(),
  attributes: AttributesUpdate,
  health: HealthUpdate,
  essence: HealthUpdate,
}).optional();

// ─── StateUpdate Schema ───
export const StateUpdateSchema = z.object({
  player: PlayerUpdate,
  wealth: WealthUpdate,
  gu_inventory: GuInventoryUpdate,
  flags: FlagsUpdate,
  faction: FactionUpdate,
  causality: CausalityUpdate,
}).strict();

// ─── NarrativeJSON Schema ───
export const NarrativeJSONSchema = z.object({
  narrative: z.object({
    text: z.string().min(100, '叙事文本过短（<100字）').max(800, '叙事文本过长（>800字）'),
    choices: z.array(ChoiceSchema).min(2, '选项至少2个').max(4, '选项最多4个'),
  }),
  state_update: StateUpdateSchema,
}).strict();

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
