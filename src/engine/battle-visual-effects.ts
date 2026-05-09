import manifestRaw from '../canon/battle-asset-manifest.json';
import type { BattleAssetManifestEntry, BattleVisualEffectEvent, DuelMove } from '../types';
import { resolvePathVisualProfile } from './path-visual-profiles';

interface BattleAssetManifest {
  version: string;
  entries: BattleAssetManifestEntry[];
}

export type BattleVisualSourceKind = 'killer_move' | 'immortal_gu' | 'scene' | 'ui_feedback';

export interface BattleVisualSource {
  id?: string;
  name: string;
  kind: BattleVisualSourceKind;
  path?: string;
  tags?: string[];
}

export const battleAssetManifest = manifestRaw as BattleAssetManifest;

function normalize(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function matchesEntry(entry: BattleAssetManifestEntry, source: BattleVisualSource): boolean {
  if (entry.kind !== source.kind) return false;
  const sourceId = normalize(source.id);
  const sourceName = normalize(source.name);
  const tags = new Set((source.tags || []).map(normalize));
  const match = entry.match || {};

  if ((match.ids || []).some(id => normalize(id) === sourceId)) return true;
  if ((match.names || []).some(name => normalize(name) === sourceName)) return true;
  if ((match.tags || []).some(tag => tags.has(normalize(tag)))) return true;
  if ((entry.triggerTags || []).some(tag => tags.has(normalize(tag)))) return true;

  return false;
}

function fallbackEntry(source: BattleVisualSource): BattleAssetManifestEntry | null {
  const fallbackId = source.kind === 'immortal_gu' ? 'immortal_gu_generic' : 'killer_move_generic';
  return battleAssetManifest.entries.find(entry => entry.id === fallbackId) ?? null;
}

export function resolveBattleVisualEntry(source: BattleVisualSource): BattleAssetManifestEntry | null {
  return battleAssetManifest.entries.find(entry => matchesEntry(entry, source)) ?? fallbackEntry(source);
}

export function buildBattleVisualEffect(source: BattleVisualSource, now = Date.now()): BattleVisualEffectEvent | null {
  const entry = resolveBattleVisualEntry(source);
  if (!entry) return null;
  const tags = [...new Set([source.path, ...(entry.triggerTags || []), ...(source.tags || [])].filter(Boolean) as string[])];
  const profile = resolvePathVisualProfile(tags);
  const genericEntry = entry.id === 'killer_move_generic' || entry.id === 'immortal_gu_generic';
  const fallbackTint = genericEntry ? profile.fallbackTint : (entry.fallbackTint || profile.fallbackTint);
  const secondaryTint = profile.secondaryTint;
  const shakeIntensity = Math.max(entry.shake?.intensity ?? 0, genericEntry ? profile.shakeIntensity : 0);
  return {
    id: `${entry.id}_${now}`,
    sourceId: source.id || entry.id,
    sourceName: source.name || entry.name,
    kind: entry.kind,
    assetPath: entry.assetPath || undefined,
    fallbackTint,
    secondaryTint,
    pathId: profile.pathId === 'generic' ? undefined : profile.pathId,
    motif: profile.motif,
    intensity: profile.intensity,
    durationMs: entry.durationMs ?? 1450,
    fadeInMs: entry.fadeInMs ?? 180,
    fadeOutMs: entry.fadeOutMs ?? 420,
    shakeIntensity,
    shakeDurationMs: entry.shake?.durationMs ?? 0,
    sfxCue: entry.sfxCue,
    triggerTags: tags,
    createdAt: now,
  };
}

export function buildBattleVisualEffectFromDuelMove(move: DuelMove | undefined, now = Date.now()): BattleVisualEffectEvent | null {
  if (!move) {
    return buildBattleVisualEffect({ name: '蛊虫技能', kind: 'killer_move', tags: ['killer_move'] }, now);
  }
  return buildBattleVisualEffect({
    id: move.killerMoveId || move.name,
    name: move.name,
    kind: 'killer_move',
    path: move.path,
    tags: ['killer_move', ...(move.killerMoveId ? [move.killerMoveId] : []), ...(move.path ? [move.path] : [])],
  }, now);
}
