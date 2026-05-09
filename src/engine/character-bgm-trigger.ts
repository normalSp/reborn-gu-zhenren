import {
  characterBgmManifest,
  type CharacterBgmEntry,
  type CharacterBgmManifest,
} from './audio-resource-policy';

export interface CharacterBgmTriggerInput {
  actors?: string[];
  tags?: string[];
  eventImportance?: number;
  currentTurn?: number;
  seed?: string;
  lastPlayedTurnByTrackId?: Record<string, number>;
  allowDisabledForPreview?: boolean;
}

export interface CharacterBgmCue {
  id: string;
  trackId: string;
  characterName: string;
  title: string;
  filePath: string;
  playSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  duckDomainBgmDb: number;
  score: number;
  reasonTags: string[];
  runtimeEnabled: boolean;
}

function scoreEntry(entry: CharacterBgmEntry, input: CharacterBgmTriggerInput): { score: number; reasonTags: string[] } {
  const tags = new Set(input.tags ?? []);
  const actors = input.actors ?? [];
  let score = Math.max(0, input.eventImportance ?? 0);
  const reasonTags: string[] = [];

  if (actors.some(actor => isActorMatch(entry, actor))) {
    score += 30;
    reasonTags.push('actor_match');
  }

  for (const tag of entry.triggerTags) {
    if (tags.has(tag)) {
      score += 20;
      reasonTags.push(tag);
    }
  }

  for (const [tag, weight] of Object.entries(entry.triggerWeights)) {
    if (tags.has(tag)) {
      score += weight;
      reasonTags.push(tag);
    }
  }

  return { score, reasonTags: [...new Set(reasonTags)] };
}

function isActorMatch(entry: CharacterBgmEntry, actorName: string): boolean {
  const normalized = actorName.trim();
  return entry.characterName === normalized
    || entry.characterId === normalized
    || entry.aliases.some(alias => alias === normalized);
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickStableCandidate(candidates: CharacterBgmCue[], input: CharacterBgmTriggerInput): CharacterBgmCue {
  if (candidates.length === 1) return candidates[0];
  const seed = [
    input.seed ?? '',
    input.currentTurn ?? 0,
    input.actors?.join('|') ?? '',
    input.tags?.join('|') ?? '',
    candidates.map(candidate => candidate.id).join('|'),
  ].join('::');
  return candidates[stableHash(seed) % candidates.length];
}

export function selectCharacterBgmCue(
  input: CharacterBgmTriggerInput,
  manifest: CharacterBgmManifest = characterBgmManifest,
): CharacterBgmCue | null {
  const currentTurn = input.currentTurn ?? 0;
  let bestScore = -Infinity;
  const bestCandidates: CharacterBgmCue[] = [];

  for (const entry of manifest.entries) {
    if (!entry.runtimeEnabled && !input.allowDisabledForPreview) continue;
    const lastPlayed = input.lastPlayedTurnByTrackId?.[entry.trackId];
    if (lastPlayed !== undefined && currentTurn - lastPlayed < entry.cooldownTurns) continue;

    const scored = scoreEntry(entry, input);
    if (scored.score < 35) continue;

    const cue: CharacterBgmCue = {
      id: entry.id,
      trackId: entry.trackId,
      characterName: entry.characterName,
      title: entry.title,
      filePath: entry.filePath,
      playSeconds: entry.playSeconds,
      fadeInSeconds: entry.fadeInSeconds,
      fadeOutSeconds: entry.fadeOutSeconds,
      duckDomainBgmDb: entry.duckDomainBgmDb,
      score: scored.score,
      reasonTags: scored.reasonTags,
      runtimeEnabled: entry.runtimeEnabled,
    };
    if (cue.score > bestScore) {
      bestScore = cue.score;
      bestCandidates.length = 0;
      bestCandidates.push(cue);
    } else if (cue.score === bestScore) {
      bestCandidates.push(cue);
    }
  }

  if (bestCandidates.length === 0) return null;
  return pickStableCandidate(bestCandidates, input);
}
