import guUseRegistryRaw from '../canon/gu-use-registry.json';
import type { GuUseTargetType, TargetedGuEffect } from '../types';

export type GuUseMode =
  | 'passive'
  | 'toggle'
  | 'direct'
  | 'targeted'
  | 'scene_gated'
  | 'consumable'
  | 'lore_only';

export type GuUseTargetRule =
  | 'none'
  | 'self'
  | 'self_or_known_ally'
  | 'known_npc'
  | 'known_or_scene_target'
  | 'self_known_or_scene_target'
  | 'scene_or_combat_target'
  | 'corpse_or_scene_target'
  | 'kin_sacrifice_scene'
  | 'refinement_or_aperture_scene'
  | 'aperture_or_location';

export type GuUseProvenance = 'canon' | 'derived' | 'original' | 'unknown';

export interface GuUseCost {
  essencePct?: number;
  primevalStones?: number;
  immortalEssence?: number;
}

export interface GuUseEffect {
  type: string;
  attribute?: '资质' | '体魄' | '心智' | '气运';
  path?: string;
  key?: string;
  value?: number;
  durationTurns?: number;
  description: string;
}

export interface GuUseSideEffect {
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
}

export interface GuUseRegistryEntry {
  guName: string;
  useMode: GuUseMode;
  targetRule: GuUseTargetRule;
  cost: GuUseCost;
  cooldown: number;
  consumesGu: boolean;
  effects: GuUseEffect[];
  sideEffects: GuUseSideEffect[];
  loreRef: string;
  provenance: GuUseProvenance;
  balanceTier: string;
}

export interface GuUseTarget {
  type: GuUseTargetType;
  id?: string;
  name?: string;
}

export type PendingTargetedGuEffect = Omit<TargetedGuEffect, 'id' | 'appliedAtTurn'>;

export interface GuUseResult {
  success: boolean;
  message: string;
  entry: GuUseRegistryEntry;
  consumesGu: boolean;
  attributeDeltas: Partial<Record<'资质' | '体魄' | '心智' | '气运', number>>;
  flags: Record<string, any>;
  target: GuUseTarget;
  targetedEffect?: PendingTargetedGuEffect;
}

export interface SceneGatedGuUseContext {
  sceneValidated: boolean;
  sceneTags?: string[];
}

interface RegistryFile {
  entries: GuUseRegistryEntry[];
}

const registry = guUseRegistryRaw as RegistryFile;

const byName = new Map<string, GuUseRegistryEntry>(
  registry.entries.map(entry => [entry.guName, entry]),
);

const DEFAULT_SELF_TARGET: GuUseTarget = { type: 'self', id: 'player', name: '自己' };

export function getGuUseRegistryEntries(): GuUseRegistryEntry[] {
  return registry.entries;
}

export function getGuUseEntry(guName: string): GuUseRegistryEntry {
  const registered = byName.get(guName);
  if (registered) return registered;

  return {
    guName,
    useMode: 'toggle',
    targetRule: 'self',
    cost: { essencePct: 0, primevalStones: 0 },
    cooldown: 0,
    consumesGu: false,
    effects: [{
      type: 'enable_passive',
      value: 1,
      description: '未逐蛊登记前只允许启用/休眠被动，不开放主动使用。',
    }],
    sideEffects: [],
    loreRef: 'fallback: active use is blocked until this Gu is registered.',
    provenance: 'unknown',
    balanceTier: 'fallback_toggle',
  };
}

export function shouldShowUseButton(entry: GuUseRegistryEntry): boolean {
  return ['direct', 'targeted', 'scene_gated', 'consumable'].includes(entry.useMode);
}

export function canUseFromNormalButton(entry: GuUseRegistryEntry): boolean {
  return ['direct', 'targeted', 'consumable'].includes(entry.useMode);
}

export function getAllowedTargetTypesForRule(rule: GuUseTargetRule): GuUseTargetType[] {
  switch (rule) {
    case 'none':
      return ['self'];
    case 'self':
      return ['self'];
    case 'self_or_known_ally':
      return ['self', 'known_npc', 'dynamic_npc', 'squad_member'];
    case 'known_npc':
      return ['known_npc', 'dynamic_npc'];
    case 'known_or_scene_target':
      return ['known_npc', 'dynamic_npc', 'squad_member', 'scene_target'];
    case 'self_known_or_scene_target':
      return ['self', 'known_npc', 'dynamic_npc', 'squad_member', 'scene_target'];
    case 'scene_or_combat_target':
      return ['known_npc', 'dynamic_npc', 'squad_member', 'scene_target'];
    case 'aperture_or_location':
      return ['aperture_or_location'];
    case 'corpse_or_scene_target':
    case 'kin_sacrifice_scene':
    case 'refinement_or_aperture_scene':
      return ['scene_target', 'aperture_or_location'];
    default:
      return ['scene_target'];
  }
}

export function isGuUseTargetAllowed(entry: GuUseRegistryEntry, target?: GuUseTarget): boolean {
  const resolvedTarget = target || DEFAULT_SELF_TARGET;
  return getAllowedTargetTypesForRule(entry.targetRule).includes(resolvedTarget.type);
}

export function requiresTargetSelection(entry: GuUseRegistryEntry): boolean {
  const allowed = getAllowedTargetTypesForRule(entry.targetRule);
  return allowed.length > 1 || allowed[0] !== 'self';
}

export function describeTargetRule(entry: GuUseRegistryEntry): string {
  if (entry.useMode === 'scene_gated') return '剧情/场景触发';
  if (entry.targetRule === 'self') return '自身';
  if (entry.targetRule === 'self_or_known_ally') return '自己或友方';
  if (entry.targetRule === 'self_known_or_scene_target') return '自己、友方、已知目标或场景目标';
  if (entry.targetRule === 'known_or_scene_target') return '已知目标或场景目标';
  if (entry.targetRule === 'aperture_or_location') return '仙窍或地点';
  return '符合场景的目标';
}

export function validateGuUseRegistry(): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const entry of registry.entries) {
    if (seen.has(entry.guName)) issues.push(`duplicate guName: ${entry.guName}`);
    seen.add(entry.guName);
    if (!entry.provenance || entry.provenance === 'unknown') {
      issues.push(`${entry.guName}: provenance must be canon/derived/original before runtime use`);
    }
    if (!entry.loreRef) issues.push(`${entry.guName}: missing loreRef`);
    if (!entry.balanceTier) issues.push(`${entry.guName}: missing balanceTier`);
    if (!entry.targetRule) issues.push(`${entry.guName}: missing targetRule`);
    if (entry.useMode === 'scene_gated' && entry.targetRule === 'self') {
      issues.push(`${entry.guName}: scene_gated Gu should not use self-only targetRule`);
    }
  }

  return issues;
}

function buildTargetedEffect(
  entry: GuUseRegistryEntry,
  target: GuUseTarget,
  effects: GuUseEffect[],
): PendingTargetedGuEffect | undefined {
  if (effects.length === 0) return undefined;
  return {
    sourceGu: entry.guName,
    target: {
      type: target.type,
      id: target.id,
      name: target.name,
    },
    effects: effects.map(effect => ({
      type: effect.type,
      attribute: effect.attribute,
      path: effect.path,
      key: effect.key,
      value: effect.value,
      durationTurns: effect.durationTurns,
      description: effect.description,
    })),
    sideEffects: entry.sideEffects,
    durationTurns: Math.max(0, ...effects.map(effect => effect.durationTurns || 0)),
    provenance: entry.provenance,
    balanceTier: entry.balanceTier,
    loreRef: entry.loreRef,
    consumesGu: entry.consumesGu,
  };
}

function resolveGuUseInternal(
  entry: GuUseRegistryEntry,
  target: GuUseTarget | undefined,
  allowSceneGated: boolean,
): GuUseResult {
  const resolvedTarget = target || DEFAULT_SELF_TARGET;
  const attributeDeltas: GuUseResult['attributeDeltas'] = {};
  const flags: Record<string, any> = {};

  if (entry.useMode === 'lore_only') {
    return {
      success: false,
      message: `${entry.guName} 只作设定登记，暂不进入运行时使用。`,
      entry,
      consumesGu: false,
      attributeDeltas,
      flags,
      target: resolvedTarget,
    };
  }

  if (entry.useMode === 'scene_gated' && !allowSceneGated) {
    return {
      success: false,
      message: `${entry.guName} 需要剧情场景触发，不能直接点击使用。`,
      entry,
      consumesGu: false,
      attributeDeltas,
      flags,
      target: resolvedTarget,
    };
  }

  if (!isGuUseTargetAllowed(entry, resolvedTarget)) {
    return {
      success: false,
      message: `${entry.guName} 需要${describeTargetRule(entry)}，当前目标不符合。`,
      entry,
      consumesGu: false,
      attributeDeltas,
      flags,
      target: resolvedTarget,
    };
  }

  const pendingTargetEffects: GuUseEffect[] = [];
  const targetIsSelf = resolvedTarget.type === 'self';

  for (const effect of entry.effects) {
    if (effect.type === 'attribute' && effect.attribute && typeof effect.value === 'number' && targetIsSelf) {
      attributeDeltas[effect.attribute] = (attributeDeltas[effect.attribute] || 0) + effect.value;
      continue;
    }
    if (effect.type === 'visibility' && effect.key && targetIsSelf) {
      flags[`guUse.${effect.key}`] = effect.value ?? true;
      continue;
    }
    pendingTargetEffects.push(effect);
  }

  for (const sideEffect of entry.sideEffects) {
    if (sideEffect.type === 'flag' && sideEffect.key) {
      flags[`guUse.${sideEffect.key}`] = true;
    }
  }

  const targetName = resolvedTarget.name || (
    resolvedTarget.type === 'self'
      ? '自己'
      : resolvedTarget.type === 'aperture_or_location'
        ? '当前仙窍/地点'
        : '目标'
  );

  return {
    success: true,
    message: `${entry.guName} 对${targetName}生效。`,
    entry,
    consumesGu: entry.consumesGu,
    attributeDeltas,
    flags,
    target: resolvedTarget,
    targetedEffect: buildTargetedEffect(entry, resolvedTarget, pendingTargetEffects),
  };
}

export function resolveGuUse(entry: GuUseRegistryEntry, target?: GuUseTarget): GuUseResult {
  return resolveGuUseInternal(entry, target, false);
}

export function resolveSceneGatedGuUseSuggestion(
  entry: GuUseRegistryEntry,
  target: GuUseTarget | undefined,
  context: SceneGatedGuUseContext,
): GuUseResult {
  if (entry.useMode !== 'scene_gated') return resolveGuUse(entry, target);
  if (!context.sceneValidated) {
    const result = resolveGuUseInternal(entry, target, false);
    return {
      ...result,
      message: `${entry.guName} 的剧情候选未通过场景校验，已拒绝执行。`,
    };
  }
  return resolveGuUseInternal(entry, target, true);
}
