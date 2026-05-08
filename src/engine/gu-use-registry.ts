import guUseRegistryRaw from '../canon/gu-use-registry.json';

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
  | 'scene_or_combat_target'
  | 'corpse_or_scene_target'
  | 'kin_sacrifice_scene'
  | 'refinement_or_aperture_scene';

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
  type: 'self' | 'known_npc' | 'squad_member' | 'scene_target';
  id?: string;
  name?: string;
}

export interface GuUseResult {
  success: boolean;
  message: string;
  entry: GuUseRegistryEntry;
  consumesGu: boolean;
  attributeDeltas: Partial<Record<'资质' | '体魄' | '心智' | '气运', number>>;
  flags: Record<string, any>;
}

interface RegistryFile {
  entries: GuUseRegistryEntry[];
}

const registry = guUseRegistryRaw as RegistryFile;

const byName = new Map<string, GuUseRegistryEntry>(
  registry.entries.map(entry => [entry.guName, entry]),
);

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
    if (entry.useMode === 'scene_gated' && entry.targetRule === 'self') {
      issues.push(`${entry.guName}: scene_gated Gu should not use self-only targetRule`);
    }
  }

  return issues;
}

function targetMatches(entry: GuUseRegistryEntry, target?: GuUseTarget): boolean {
  if (entry.targetRule === 'none') return true;
  if (entry.targetRule === 'self') return target?.type === 'self';
  if (entry.targetRule === 'self_or_known_ally') {
    return target?.type === 'self' || target?.type === 'known_npc' || target?.type === 'squad_member';
  }
  if (entry.targetRule === 'known_npc') return target?.type === 'known_npc';
  if (entry.targetRule === 'scene_or_combat_target') {
    return target?.type === 'scene_target' || target?.type === 'known_npc';
  }
  return target?.type === 'scene_target';
}

export function resolveGuUse(entry: GuUseRegistryEntry, target?: GuUseTarget): GuUseResult {
  const attributeDeltas: GuUseResult['attributeDeltas'] = {};
  const flags: Record<string, any> = {};

  if (entry.useMode === 'scene_gated' || entry.useMode === 'lore_only') {
    return {
      success: false,
      message: `${entry.guName} 需要剧情场景触发，不能直接点击使用。`,
      entry,
      consumesGu: false,
      attributeDeltas,
      flags,
    };
  }

  if (!targetMatches(entry, target)) {
    return {
      success: false,
      message: `${entry.guName} 需要符合规则的目标。`,
      entry,
      consumesGu: false,
      attributeDeltas,
      flags,
    };
  }

  for (const effect of entry.effects) {
    if (effect.type === 'attribute' && effect.attribute && typeof effect.value === 'number') {
      attributeDeltas[effect.attribute] = (attributeDeltas[effect.attribute] || 0) + effect.value;
    }
    if (effect.type === 'visibility' && effect.key) {
      flags[`guUse.${effect.key}`] = effect.value ?? true;
    }
  }

  for (const sideEffect of entry.sideEffects) {
    if (sideEffect.type === 'flag' && sideEffect.key) {
      flags[`guUse.${sideEffect.key}`] = true;
    }
  }

  return {
    success: true,
    message: `${entry.guName} 使用成功。`,
    entry,
    consumesGu: entry.consumesGu,
    attributeDeltas,
    flags,
  };
}
