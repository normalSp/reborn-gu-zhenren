import startProfilesRaw from '../canon/start-profiles.json';
import factionDataRaw from '../canon/faction-data.json';

export type StartProfileProvenance = 'canon-near' | 'derived' | 'original' | 'unknown';
export type StartProfileRealmBand = 'mortal_low' | 'mortal_mid' | 'mortal_high' | 'immortal' | 'any';
export type ChapterConstraintMode =
  | 'local_anchor'
  | 'local_anchor_variant'
  | 'outer_branch'
  | 'domain_default';

export interface StartLocation {
  region: string;
  area: string;
  accessibleLocations: string[];
}

export interface InitialStandingPolicy {
  self: number;
  reason: string;
}

export interface StarterAssetPolicy {
  mode: 'inherit' | 'none' | 'downgrade_if_over_tier';
  assetHint?: string;
}

export interface StartProfile {
  id: string;
  timelineNodeId: string;
  factionId: string;
  factionName: string;
  domain: string;
  realmBand: StartProfileRealmBand;
  provenance: StartProfileProvenance;
  startChapterId: string | null;
  startLocation: StartLocation;
  playerFactionRole: string;
  chapterConstraintMode: ChapterConstraintMode;
  openingPremise: string;
  initialStandingPolicy: InitialStandingPolicy;
  starterAssetPolicy: StarterAssetPolicy;
  promptLocks: string[];
}

export interface StartProfileResolutionInput {
  timelineNodeId?: string | null;
  factionId?: string | null;
  domain?: string | null;
  realmGrand?: number;
  guTierMax?: number;
}

export interface StartProfileResolution {
  profile: StartProfile | null;
  issues: string[];
}

export interface StarterGuLike {
  name: string;
  tier: number;
  path: string;
  rank: string;
}

const PROFILES = (startProfilesRaw as any).profiles as StartProfile[];
const FACTIONS = (factionDataRaw as any).factions as Record<string, Array<{ id: string }>>;

export function getAllStartProfiles(): StartProfile[] {
  return PROFILES;
}

export function realmBandForRealm(realmGrand: number): StartProfileRealmBand {
  if (realmGrand >= 6) return 'immortal';
  if (realmGrand >= 4) return 'mortal_high';
  if (realmGrand >= 2) return 'mortal_mid';
  return 'mortal_low';
}

function domainMatches(profile: StartProfile, domain?: string | null): boolean {
  if (!domain || profile.domain === '全域') return true;
  return profile.domain === domain;
}

function bandMatches(profile: StartProfile, realmGrand?: number): boolean {
  if (!realmGrand || profile.realmBand === 'any') return true;
  return profile.realmBand === realmBandForRealm(realmGrand);
}

function scoreProfile(profile: StartProfile, input: StartProfileResolutionInput): number {
  let score = 0;
  if (profile.factionId === input.factionId) score += 1000;
  if (profile.timelineNodeId === input.timelineNodeId) score += 500;
  if (profile.timelineNodeId === '*') score += 80;
  if (domainMatches(profile, input.domain)) score += 40;
  if (bandMatches(profile, input.realmGrand)) score += 20;
  if (profile.realmBand === 'any') score += 5;
  return score;
}

export function resolveStartProfile(input: StartProfileResolutionInput): StartProfileResolution {
  const factionId = input.factionId || 'sanxiu';
  const issues: string[] = [];
  const candidates = PROFILES
    .filter(profile => profile.factionId === factionId)
    .filter(profile => profile.timelineNodeId === input.timelineNodeId || profile.timelineNodeId === '*')
    .filter(profile => domainMatches(profile, input.domain))
    .filter(profile => bandMatches(profile, input.realmGrand) || profile.realmBand === 'any')
    .sort((a, b) => scoreProfile(b, input) - scoreProfile(a, input));

  if (candidates[0]) return { profile: candidates[0], issues };

  const fallback = PROFILES.find(profile => profile.factionId === 'sanxiu' && profile.timelineNodeId === '*') || null;
  issues.push(`未找到开局身份路由：timeline=${input.timelineNodeId || 'unknown'} faction=${factionId}`);
  return { profile: fallback, issues };
}

export function resolveStarterGuForStartProfile(
  starterGu: StarterGuLike | null | undefined,
  profile: StartProfile | null,
  guTierMax?: number,
): StarterGuLike | null {
  if (!profile || !starterGu) return starterGu || null;
  const mode = profile.starterAssetPolicy.mode;
  if (mode === 'none') return null;
  if (mode === 'downgrade_if_over_tier' && guTierMax && starterGu.tier > guTierMax) return null;
  return starterGu;
}

export function buildStartProfileFlagPayload(profile: StartProfile | null): Record<string, any> {
  if (!profile) return {};
  return {
    _start_profile: profile.id,
    _start_profile_provenance: profile.provenance,
    _start_chapter_id: profile.startChapterId || undefined,
    _start_location: `${profile.startLocation.region} · ${profile.startLocation.area}`,
    _start_region: profile.startLocation.region,
    _start_area: profile.startLocation.area,
    _start_accessible_locations: profile.startLocation.accessibleLocations,
    _start_role: profile.playerFactionRole,
    _start_opening_premise: profile.openingPremise,
    _start_prompt_locks: profile.promptLocks,
    _start_constraint_mode: profile.chapterConstraintMode,
    _start_asset_hint: profile.starterAssetPolicy.assetHint || '',
  };
}

export function getAllSelectableFactionIds(): string[] {
  const ids = new Set<string>();
  for (const entries of Object.values(FACTIONS)) {
    for (const faction of entries) ids.add(faction.id);
  }
  return [...ids];
}

export function validateStartProfileCoverage(): string[] {
  const issues: string[] = [];
  const profileFactionIds = new Set(PROFILES.map(profile => profile.factionId));
  for (const factionId of getAllSelectableFactionIds()) {
    if (!profileFactionIds.has(factionId)) {
      issues.push(`势力 ${factionId} 缺少 start profile`);
    }
  }

  const southernOneTurn = ['guyue_shanzhai', 'xiongjia_zhai', 'baijia_zhai', 'shangjia', 'wujia', 'tiejia', 'sanxiu'];
  for (const factionId of southernOneTurn) {
    const resolution = resolveStartProfile({
      timelineNodeId: 'qingmaoshan',
      factionId,
      domain: '南疆',
      realmGrand: 1,
      guTierMax: 1,
    });
    if (!resolution.profile || resolution.profile.factionId !== factionId || resolution.profile.timelineNodeId !== 'qingmaoshan') {
      issues.push(`南疆一转 ${factionId} 未解析到 qingmaoshan 专属 start profile`);
    }
  }
  return issues;
}
