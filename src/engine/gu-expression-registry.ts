import guExpressionSpecsRaw from '../canon/gu-expression-specs.json';
import killerMoveExpressionSpecsRaw from '../canon/killer-move-expression-specs.json';
import type { GuExpressionSpec, KillerMoveExpressionSpec } from '../types';

interface GuExpressionSpecFile {
  _meta: Record<string, unknown>;
  entries: GuExpressionSpec[];
}

interface KillerMoveExpressionSpecFile {
  _meta: Record<string, unknown>;
  entries: KillerMoveExpressionSpec[];
}

const guSpecFile = guExpressionSpecsRaw as GuExpressionSpecFile;
const killerMoveSpecFile = killerMoveExpressionSpecsRaw as KillerMoveExpressionSpecFile;

const guByName = new Map<string, GuExpressionSpec>(
  guSpecFile.entries.map(entry => [entry.guName, entry]),
);

const killerMoveByName = new Map<string, KillerMoveExpressionSpec>(
  killerMoveSpecFile.entries.map(entry => [entry.moveName, entry]),
);

export function listGuExpressionSpecs(): GuExpressionSpec[] {
  return guSpecFile.entries;
}

export function getGuExpressionSpec(guName: string): GuExpressionSpec | undefined {
  return guByName.get(guName);
}

function resolveGuSpec(specOrName: GuExpressionSpec | string | undefined): GuExpressionSpec | undefined {
  if (!specOrName) return undefined;
  return typeof specOrName === 'string' ? getGuExpressionSpec(specOrName) : specOrName;
}

export function isGuPassive(specOrName: GuExpressionSpec | string | undefined): boolean {
  return resolveGuSpec(specOrName)?.availability === 'passive';
}

export function isGuSceneGated(specOrName: GuExpressionSpec | string | undefined): boolean {
  return resolveGuSpec(specOrName)?.availability === 'scene_gated';
}

export function isGuForbidden(specOrName: GuExpressionSpec | string | undefined): boolean {
  return resolveGuSpec(specOrName)?.realmScope === 'mortal_forbidden';
}

export function isGuNormalCombatUsable(specOrName: GuExpressionSpec | string | undefined): boolean {
  const spec = resolveGuSpec(specOrName);
  return !!spec && spec.availability === 'direct' && spec.realmScope === 'mortal';
}

export function listNormalCombatGuExpressionSpecs(): GuExpressionSpec[] {
  return guSpecFile.entries.filter(isGuNormalCombatUsable);
}

export function listKillerMoveExpressionSpecs(): KillerMoveExpressionSpec[] {
  return killerMoveSpecFile.entries;
}

export function getKillerMoveExpressionSpec(moveName: string): KillerMoveExpressionSpec | undefined {
  return killerMoveByName.get(moveName);
}

export function listSceneUtilitiesForGu(guNames: string[]): string[] {
  const utilities = new Set<string>();
  for (const guName of guNames) {
    const spec = getGuExpressionSpec(guName);
    if (!spec) continue;
    for (const utility of spec.sceneUtilities) utilities.add(utility);
  }
  return [...utilities].sort();
}

export function buildGuResolutionStepDraft(
  guName: string,
  options: {
    round: number;
    actorId?: string;
    targetIds?: string[];
    affectedCellIds?: string[];
    blockedReason?: string;
  },
) {
  const spec = getGuExpressionSpec(guName);
  if (!spec) return null;
  return {
    id: `gu_expr_${guName}_${options.round}`,
    round: options.round,
    kind: options.blockedReason ? 'failure' as const : 'gu_use' as const,
    actorId: options.actorId,
    targetIds: options.targetIds,
    affectedCellIds: options.affectedCellIds,
    sourceName: guName,
    resourceCost: spec.cost,
    message: options.blockedReason
      ? `${guName}未能生效：${options.blockedReason}`
      : `${guName}发动：${spec.uniqueness}`,
    visual: {
      motif: spec.visualMotif.motif,
      primaryTint: spec.visualMotif.primaryTint,
      motion: spec.visualMotif.motion,
      intensity: spec.realmScope === 'mortal_forbidden' ? 'high' as const : 'normal' as const,
    },
    blockedReason: options.blockedReason,
    tags: [...spec.verbs, spec.path, spec.availability],
  };
}
