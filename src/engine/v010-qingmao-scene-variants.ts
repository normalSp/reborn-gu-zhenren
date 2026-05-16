import sceneVariantsRaw from '../canon/qingmao-scene-variants.json';
import qingmaoVisualAssetsRaw from '../canon/qingmao-visual-assets.json';
import type { QingmaoCombatTemplateReadiness } from './v010-qingmao-combat-pack';
import type { QingmaoRegionActionEntry } from './v010-qingmao-region-engine';
import type { QingmaoResourceLoopEntry } from './v010-qingmao-resource-loop';
import type { BattlefieldVisualAsset } from './v080-battlefield-ui-model';

export type QingmaoSceneVariantStatus = 'playable' | 'readiness' | 'blocked' | 'reference';

export interface QingmaoSceneVariantSpec {
  id: string;
  displayName: string;
  subtitle: string;
  assetId: string;
  linkedActionSlots: string[];
  linkedResourceActions: string[];
  linkedCombatTemplates: string[];
  primaryPlayerQuestion: string;
  visualIntent: string;
  readabilityCues: string[];
  screenshotComposition: string[];
  shortRecordingBeats: string[];
  reducedMotionSummary: string;
  loreBoundary: string;
  forbiddenImplications: string[];
}

export interface QingmaoSceneVariantManifest {
  _meta: {
    version: string;
    status: 'runtime_readability';
    saveFormatImpact: 'none';
    scope: string;
    boundary: string;
  };
  variants: QingmaoSceneVariantSpec[];
}

export interface QingmaoSceneVariantBuildInput {
  regionEntries?: QingmaoRegionActionEntry[];
  resourceEntries?: QingmaoResourceLoopEntry[];
  combatReadiness?: QingmaoCombatTemplateReadiness[];
}

export interface QingmaoSceneVariantView {
  id: string;
  displayName: string;
  subtitle: string;
  status: QingmaoSceneVariantStatus;
  statusLabel: string;
  asset: BattlefieldVisualAsset | null;
  primaryPlayerQuestion: string;
  visualIntent: string;
  readout: string;
  compositionLine: string;
  recordingLine: string;
  reducedMotionSummary: string;
  loreBoundary: string;
  forbiddenSummary: string;
  linkedRuntimeLabels: string[];
  blockers: string[];
  warnings: string[];
}

const manifest = sceneVariantsRaw as QingmaoSceneVariantManifest;
const visualAssets = qingmaoVisualAssetsRaw as { entries: BattlefieldVisualAsset[] };

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function statusLabel(status: QingmaoSceneVariantStatus): string {
  if (status === 'playable') return '可演示';
  if (status === 'readiness') return '候选可读';
  if (status === 'blocked') return '当前阻断';
  return '构图参考';
}

function assetById(assetId: string): BattlefieldVisualAsset | null {
  return visualAssets.entries.find(asset => asset.id === assetId) ?? null;
}

function statusFromMatches(input: {
  playableCount: number;
  readinessCount: number;
  blockerCount: number;
  linkedCount: number;
}): QingmaoSceneVariantStatus {
  if (input.playableCount > 0) return 'playable';
  if (input.readinessCount > 0) return 'readiness';
  if (input.blockerCount > 0 && input.linkedCount > 0) return 'blocked';
  return 'reference';
}

export function getQingmaoSceneVariantManifest(): QingmaoSceneVariantManifest {
  return manifest;
}

export function listQingmaoSceneVariantSpecs(): QingmaoSceneVariantSpec[] {
  return manifest.variants.map(variant => ({ ...variant }));
}

export function buildQingmaoSceneVariantViews(input: QingmaoSceneVariantBuildInput = {}): QingmaoSceneVariantView[] {
  const regionEntries = input.regionEntries ?? [];
  const resourceEntries = input.resourceEntries ?? [];
  const combatReadiness = input.combatReadiness ?? [];

  return manifest.variants.map(variant => {
    const regionMatches = regionEntries.filter(entry => variant.linkedActionSlots.includes(entry.actionSlot.id));
    const resourceMatches = resourceEntries.filter(entry => variant.linkedResourceActions.includes(entry.action.id));
    const combatMatches = combatReadiness.filter(item => variant.linkedCombatTemplates.includes(item.template.id));
    const linkedCount = regionMatches.length + resourceMatches.length + combatMatches.length;
    const playableCount = regionMatches.filter(entry => entry.canDepart).length
      + resourceMatches.filter(entry => entry.canResolve).length
      + combatMatches.filter(item => item.status === 'ready_for_local_validation').length;
    const readinessCount = combatMatches.filter(item => item.status === 'candidate_only').length;
    const blockers = uniqueStrings([
      ...regionMatches.flatMap(entry => entry.blockers),
      ...resourceMatches.flatMap(entry => entry.blockers),
      ...combatMatches.flatMap(item => item.blockers),
    ]);
    const warnings = uniqueStrings([
      ...regionMatches.flatMap(entry => entry.warnings),
      ...resourceMatches.flatMap(entry => entry.warnings),
      ...combatMatches.flatMap(item => item.warnings),
    ]);
    const status = statusFromMatches({
      playableCount,
      readinessCount,
      blockerCount: blockers.length,
      linkedCount,
    });
    const linkedRuntimeLabels = uniqueStrings([
      ...regionMatches.map(entry => entry.actionSlot.displayName),
      ...resourceMatches.map(entry => entry.action.displayName),
      ...combatMatches.map(item => item.template.displayName),
    ]);

    return {
      id: variant.id,
      displayName: variant.displayName,
      subtitle: variant.subtitle,
      status,
      statusLabel: statusLabel(status),
      asset: assetById(variant.assetId),
      primaryPlayerQuestion: variant.primaryPlayerQuestion,
      visualIntent: variant.visualIntent,
      readout: variant.readabilityCues.slice(0, 2).join(' / '),
      compositionLine: variant.screenshotComposition[0] || variant.visualIntent,
      recordingLine: variant.shortRecordingBeats[0] || variant.primaryPlayerQuestion,
      reducedMotionSummary: variant.reducedMotionSummary,
      loreBoundary: variant.loreBoundary,
      forbiddenSummary: variant.forbiddenImplications.slice(0, 3).join(' / '),
      linkedRuntimeLabels,
      blockers,
      warnings,
    };
  });
}
