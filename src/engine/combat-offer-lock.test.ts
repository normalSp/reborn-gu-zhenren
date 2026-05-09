import { describe, expect, it } from 'vitest';
import { buildCombatOfferKey, hasRecentCombatOffer, rememberCombatOffer } from './combat-offer-lock';
import type { CombatConstraint } from '../types';

const constraint: CombatConstraint = {
  scale: 'skirmish',
  sceneId: 'qingmao-wolf-tide',
  recommendedRealm: 2,
  baseChance: 0.4,
  narrativeStyle: '狼潮压近，寨外草木皆动。',
  strategicChoiceCount: 3,
};

describe('combat offer lock', () => {
  it('prevents the same narrative combat offer from looping on later resolves', () => {
    const offer = buildCombatOfferKey(constraint, '狼潮压近，玩家仍在同一段叙事里。', 'qingmaoshan');
    const locks = rememberCombatOffer([], offer, 12);

    expect(hasRecentCombatOffer(locks, offer, 12)).toBe(true);
    expect(hasRecentCombatOffer(locks, offer, 14)).toBe(true);
  });

  it('allows a different scene after cooldown context changes', () => {
    const first = buildCombatOfferKey(constraint, '狼潮压近。', 'qingmaoshan');
    const second = buildCombatOfferKey({ ...constraint, sceneId: 'tie-family-ambush' }, '铁家伏击已至。', 'qingmaoshan');
    const locks = rememberCombatOffer([], first, 5);

    expect(hasRecentCombatOffer(locks, second, 9)).toBe(false);
  });
});
