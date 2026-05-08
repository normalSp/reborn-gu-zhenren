import audioManifestRaw from '../../public/audio/audio-source-manifest.json';
import characterBgmManifestRaw from '../canon/character-bgm-manifest.json';

export type AudioLayer = 'domain' | 'character' | 'scene' | 'combat';

export interface AudioSourceTrack {
  id: string;
  layer: AudioLayer;
  title: string;
  characterOrScene: string;
  sourceUrl: string;
  sourceKind: string;
  communityConfirmed: boolean;
  userConfirmed: boolean;
  runtimeEnabled: boolean;
  packageModes: string[];
  filePath: string;
  loop: boolean;
  loopStart: number;
  loopEnd: number | null;
  reviewNotes: string;
}

export interface AudioSourceSfx {
  id: string;
  category: string;
  title: string;
  sourceUrl: string;
  sourceKind: string;
  runtimeEnabled: boolean;
  aiOrSyntheticAllowed: boolean;
  filePath: string;
  reviewNotes: string;
}

export interface AudioSourceManifest {
  version: string;
  policy: {
    runtimeDefaultPackage: string;
    aiOrSyntheticBgmAllowed: boolean;
    aiOrSyntheticCombatSfxAllowed: boolean;
    missingAssetBehavior: string;
    notes: string;
  };
  tracks: AudioSourceTrack[];
  sfx: AudioSourceSfx[];
}

export interface AudioManifestIssue {
  severity: 'error' | 'warning';
  id: string;
  message: string;
}

export interface CharacterBgmEntry {
  id: string;
  trackId: string;
  characterId: string;
  characterName: string;
  aliases: string[];
  title: string;
  filePath: string;
  sourceTier: string;
  runtimeEnabled: boolean;
  triggerTags: string[];
  triggerWeights: Record<string, number>;
  playSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  cooldownTurns: number;
  duckDomainBgmDb: number;
  notes: string;
}

export interface CharacterBgmManifest {
  version: string;
  entries: CharacterBgmEntry[];
}

export const audioSourceManifest = audioManifestRaw as AudioSourceManifest;
export const characterBgmManifest = characterBgmManifestRaw as CharacterBgmManifest;

function looksLikeLegacySyntheticPath(filePath: string): boolean {
  return /\/audio\/bgm\/(nanjiang|beiyuan|zhongzhou|donghai|ximo)\//.test(filePath)
    || /Klaus_Neumaier|Harpsichord|ffmpeg|synthetic/i.test(filePath);
}

export function validateAudioSourceManifest(manifest: AudioSourceManifest = audioSourceManifest): AudioManifestIssue[] {
  const issues: AudioManifestIssue[] = [];
  const seen = new Set<string>();

  if (manifest.policy.aiOrSyntheticBgmAllowed) {
    issues.push({ severity: 'error', id: 'policy.bgm', message: 'AI or synthetic BGM must not be allowed for v0.7.0-c runtime.' });
  }
  if (manifest.policy.aiOrSyntheticCombatSfxAllowed) {
    issues.push({ severity: 'error', id: 'policy.sfx', message: 'AI or synthetic combat SFX must not be allowed for v0.7.0-c runtime.' });
  }

  for (const track of manifest.tracks) {
    if (seen.has(track.id)) {
      issues.push({ severity: 'error', id: track.id, message: 'Duplicate audio track id.' });
    }
    seen.add(track.id);
    if (!track.filePath.startsWith('/audio/')) {
      issues.push({ severity: 'error', id: track.id, message: 'Runtime audio filePath must live under /audio/.' });
    }
    if (track.runtimeEnabled && looksLikeLegacySyntheticPath(track.filePath)) {
      issues.push({ severity: 'error', id: track.id, message: 'Legacy synthetic BGM path cannot be runtime enabled.' });
    }
    if (track.runtimeEnabled && !track.userConfirmed && !track.communityConfirmed && !track.sourceKind.startsWith('free_')) {
      issues.push({ severity: 'warning', id: track.id, message: 'Runtime track should be user/community confirmed or a verified free source.' });
    }
  }

  for (const sfx of manifest.sfx) {
    if (seen.has(sfx.id)) {
      issues.push({ severity: 'error', id: sfx.id, message: 'Duplicate audio SFX id.' });
    }
    seen.add(sfx.id);
    if (sfx.category === 'combat' && sfx.aiOrSyntheticAllowed) {
      issues.push({ severity: 'error', id: sfx.id, message: 'Combat SFX cannot allow AI/synthetic assets.' });
    }
    if (sfx.runtimeEnabled && !sfx.filePath.startsWith('/audio/sfx/')) {
      issues.push({ severity: 'error', id: sfx.id, message: 'Runtime SFX must live under /audio/sfx/.' });
    }
  }

  return issues;
}

export function getRuntimeEnabledTracks(manifest: AudioSourceManifest = audioSourceManifest): AudioSourceTrack[] {
  return manifest.tracks.filter(track => track.runtimeEnabled);
}

export function getCharacterBgmEntryByActor(actorName: string, manifest: CharacterBgmManifest = characterBgmManifest): CharacterBgmEntry | null {
  const normalized = actorName.trim();
  return manifest.entries.find(entry =>
    entry.characterName === normalized
    || entry.aliases.some(alias => alias === normalized)
    || entry.characterId === normalized,
  ) ?? null;
}
