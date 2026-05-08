import { describe, expect, it } from 'vitest';
import achievementsRaw from '../canon/achievements.json';
import { buildExtremePhysiqueSquadNotice } from './extreme-physique-squad-gates';
import { evaluateConditionString } from '../store/slices/achievementSlice';
import type { AchievementCheckState } from '../types/achievement';

function makeAchievementState(overrides: Partial<AchievementCheckState> = {}): AchievementCheckState {
  return {
    turn: 10,
    realm: '三转初阶',
    realmNum: 3,
    currency: 1000,
    guCount: 4,
    refinedGuCount: 1,
    knownNpcCount: 3,
    knownLocations: 2,
    factionStandings: {},
    daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
    flags: {},
    deaths: 0,
    combatWins: 1,
    totalBattlesFought: 1,
    factionLevel: 1,
    membersCount: 4,
    immortalGuCount: 0,
    ascensionSuccessCount: 0,
    trainingGroundVisits: 0,
    huntSuccessCount: 0,
    squadCombatWins: 1,
    squadMembersRecruited: 1,
    partyMembersCount: 3,
    squadMemberWoundedRescues: 1,
    squadMemberDeaths: 1,
    squadComboSuccesses: 1,
    squadOverlevelEscapes: 1,
    hasExtremePhysique: true,
    singlePathDaoMarks: () => 0,
    crossDomainCount: 1,
    renZuLegendsHeard: 0,
    achievementsUnlocked: [],
    chapterId: null,
    domain: '南疆',
    ...overrides,
  };
}

describe('v0.7.0-b achievement and extreme physique gates', () => {
  it('registers squad/faction achievements without immortal economy bypass rewards', () => {
    const achievements = (achievementsRaw as any).achievements as any[];
    const ids = new Set(achievements.map(item => item.id));
    for (const id of [
      'faction_founder',
      'squad_first_recruit',
      'squad_four_ready',
      'squad_first_victory',
      'squad_rescue_wounded',
      'squad_fallen_member',
      'squad_combo_success',
      'squad_overlevel_escape',
      'extreme_physique_awakened',
    ]) {
      expect(ids.has(id), id).toBe(true);
      const achievement = achievements.find(item => item.id === id);
      expect(achievement.reward?.immortalCurrency || 0, id).toBe(0);
    }
  });

  it('evaluates squad and extreme physique conditions from the v0.7.0-b state fields', () => {
    const state = makeAchievementState();
    expect(evaluateConditionString('squadCombatWins >= 1', state)).toBe(true);
    expect(evaluateConditionString('partyMembersCount >= 3', state)).toBe(true);
    expect(evaluateConditionString('squadComboSuccesses >= 1', state)).toBe(true);
    expect(evaluateConditionString('hasExtremePhysique', state)).toBe(true);
  });

  it('builds squad warnings for ten extreme physique pressure and forbidden paths', () => {
    const notice = buildExtremePhysiqueSquadNotice(
      { type: 'mortal', extremePhysiqueType: '北冥冰魄体', capacityLocked: true },
      ['冰道', '炎道'],
    );
    expect(notice?.physiqueType).toBe('北冥冰魄体');
    expect(notice?.favoredPaths).toContain('冰道');
    expect(notice?.forbiddenPaths).toContain('炎道');
    expect(notice?.memberWarnings.some(line => line.includes('炎道'))).toBe(true);
  });
});
