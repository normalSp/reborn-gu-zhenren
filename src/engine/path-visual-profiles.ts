import profilesRaw from '../canon/path-visual-profiles.json';
import pathRegistryRaw from '../canon/path-registry.json';
import type { PathVisualProfile } from '../types';

interface PathVisualProfileFile {
  version: string;
  profiles: PathVisualProfile[];
}

interface PathRegistryFile {
  paths: Array<{ id: string; runtimeAllowed?: boolean; canonicalStatus?: string }>;
}

export const pathVisualProfileFile = profilesRaw as PathVisualProfileFile;
export const pathVisualProfiles = pathVisualProfileFile.profiles;

const pathRegistry = pathRegistryRaw as PathRegistryFile;
const runtimeAllowedPaths = new Set(
  (pathRegistry.paths || [])
    .filter(path => path.runtimeAllowed)
    .map(path => normalize(path.id)),
);

const DEFAULT_PROFILE: PathVisualProfile = {
  pathId: 'generic',
  displayName: '通用',
  runtimeAllowed: true,
  motif: 'generic',
  fallbackTint: '#c49a3a',
  secondaryTint: '#2b243a',
  intensity: 'normal',
  shakeIntensity: 4,
  aliases: ['killer_move', 'important', 'generic'],
  notes: 'Visual fallback only. Not a runtime path.',
};

function normalize(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function profileTokens(profile: PathVisualProfile): string[] {
  return [
    profile.pathId,
    profile.displayName,
    ...(profile.aliases || []),
  ].map(normalize).filter(Boolean);
}

export function isRuntimeAllowedVisualPath(pathId: string): boolean {
  return runtimeAllowedPaths.has(normalize(pathId));
}

export function validatePathVisualProfiles(): string[] {
  const issues: string[] = [];
  for (const profile of pathVisualProfiles) {
    if (!profile.runtimeAllowed) {
      issues.push(`${profile.pathId}: visual profile must not use blocked/category runtime path`);
      continue;
    }
    if (!isRuntimeAllowedVisualPath(profile.pathId)) {
      issues.push(`${profile.pathId}: not found as runtimeAllowed path in path-registry`);
    }
  }
  return issues;
}

export function resolvePathVisualProfile(input?: string | string[]): PathVisualProfile {
  const candidates = Array.isArray(input) ? input : [input || ''];
  const normalizedCandidates = new Set(candidates.map(normalize).filter(Boolean));
  if (!normalizedCandidates.size) return DEFAULT_PROFILE;

  const byPath = pathVisualProfiles.find(profile => normalizedCandidates.has(normalize(profile.pathId)));
  if (byPath) return byPath;

  const byAlias = pathVisualProfiles.find(profile =>
    profileTokens(profile).some(token => normalizedCandidates.has(token)),
  );
  return byAlias || DEFAULT_PROFILE;
}
