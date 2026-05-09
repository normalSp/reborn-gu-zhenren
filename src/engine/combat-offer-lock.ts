import type { CombatConstraint } from '../types';

export interface CombatOfferLock {
  key: string;
  turn: number;
  sceneId?: string;
  chapterId?: string;
  narrativeHash: string;
}

const MAX_LOCKS = 20;
const DEFAULT_COOLDOWN_TURNS = 3;

export function hashNarrativeForCombat(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildCombatOfferKey(
  constraint: CombatConstraint,
  narrativeText: string,
  chapterId?: string | null,
): CombatOfferLock {
  const narrativeHash = hashNarrativeForCombat(narrativeText.slice(0, 1200));
  const sceneId = constraint.sceneId || constraint.scale || 'narrative';
  return {
    key: `${chapterId || 'unknown'}:${sceneId}:${narrativeHash}`,
    turn: 0,
    sceneId,
    chapterId: chapterId || undefined,
    narrativeHash,
  };
}

export function hasRecentCombatOffer(
  locks: CombatOfferLock[] | undefined,
  offer: CombatOfferLock,
  currentTurn: number,
  cooldownTurns = DEFAULT_COOLDOWN_TURNS,
): boolean {
  if (!Array.isArray(locks)) return false;
  return locks.some(lock => {
    if (lock.key === offer.key) return true;
    if (lock.sceneId && lock.sceneId === offer.sceneId && currentTurn - lock.turn < cooldownTurns) return true;
    if (lock.narrativeHash === offer.narrativeHash && currentTurn - lock.turn < cooldownTurns) return true;
    return false;
  });
}

export function rememberCombatOffer(
  locks: CombatOfferLock[] | undefined,
  offer: CombatOfferLock,
  currentTurn: number,
): CombatOfferLock[] {
  const next = [
    { ...offer, turn: currentTurn },
    ...(Array.isArray(locks) ? locks.filter(lock => lock.key !== offer.key) : []),
  ];
  return next.slice(0, MAX_LOCKS);
}
