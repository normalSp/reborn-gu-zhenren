import { describe, expect, it } from 'vitest';
import achievementsRaw from '../../canon/achievements.json';
import { evaluateConditionString } from './achievementSlice';
import type { AchievementCheckState } from '../../types/achievement';

function makeState(overrides: Partial<AchievementCheckState> = {}): AchievementCheckState {
  return {
    turn: 1,
    realm: '一转初阶',
    realmNum: 1,
    currency: 0,
    guCount: 0,
    refinedGuCount: 0,
    knownNpcCount: 0,
    knownLocations: 0,
    factionStandings: {},
    daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
    flags: {},
    deaths: 0,
    combatWins: 0,
    crossDomainCount: 0,
    renZuLegendsHeard: 0,
    achievementsUnlocked: [],
    chapterId: null,
    domain: '南疆',
    totalBattlesFought: 10,
    factionLevel: 3,
    membersCount: 4,
    immortalGuCount: 2,
    ascensionSuccessCount: 1,
    trainingGroundVisits: 5,
    huntSuccessCount: 2,
    singlePathDaoMarks: (path: string) => path === '力道' ? 120 : 0,
    ...overrides,
  };
}

describe('v0.7.0 achievement conditions', () => {
  it.each([
    'totalBattlesFought >= 10',
    'factionLevel >= 3',
    'membersCount >= 4',
    'immortalGuCount >= 2',
    'ascensionSuccessCount >= 1',
    'trainingGroundVisits >= 5',
    'huntSuccessCount >= 2',
    'singlePathDaoMarks(力道) >= 100',
  ])('supports %s', (condition) => {
    expect(evaluateConditionString(condition, makeState())).toBe(true);
  });

  it('keeps singlePathDaoMarks path-sensitive', () => {
    expect(evaluateConditionString('singlePathDaoMarks(炎道) >= 100', makeState())).toBe(false);
  });
});

describe('v0.7.0 achievement canon data', () => {
  it('defines reward and progressMax for every existing achievement', () => {
    const achievements = (achievementsRaw as any).achievements as any[];

    expect(achievements).toHaveLength(26);
    for (const achievement of achievements) {
      expect(achievement.reward, achievement.id).toBeTruthy();
      expect(achievement.progressMax, achievement.id).toBeGreaterThan(0);
    }
  });
});
