import { describe, expect, it } from 'vitest';
import {
  evaluateTrainingGroundEntry,
  summarizeTrainingGroundEntries,
} from './training-ground-entry-policy';
import type { TrainingGroundContext, TrainingGroundSpec } from './training-ground-engine';

const baseGround: TrainingGroundSpec = {
  id: 'qingmao_moon_duel',
  name: '月下对决场',
  domain: '青茅山',
  chapterRequired: 'qingmaoshan',
  pathType: '月道',
  type: '对决',
  tier: 1,
  baseYield: 4,
  costCurrency: 100,
  costImmortalCurrency: 0,
  cooldownTurns: 3,
  immortalOnly: false,
  failureChance: 0,
  failureEffect: 'hpDamage:5',
  description: '旧道场样板。',
};

function ctx(overrides: Partial<TrainingGroundContext> = {}): TrainingGroundContext {
  return {
    realmGrand: 3,
    isImmortal: false,
    currentChapterId: 'qingmaoshan',
    primaryPath: '月道',
    secondaryPaths: [],
    cooldowns: {},
    turn: 20,
    aptitude: 5,
    currency: 500,
    immortalCurrency: 0,
    ...overrides,
  };
}

describe('v0.9.0-a1 training ground entry policy', () => {
  it('returns a readable blocker instead of a blank list when chapter does not match', () => {
    const policy = evaluateTrainingGroundEntry(baseGround, ctx({ currentChapterId: 'fate_war' }));

    expect(policy.canEnter).toBe(false);
    expect(policy.status).toBe('location_mismatch');
    expect(policy.blockers.join('')).toContain('地点/章节不匹配');
    expect(policy.recommendedActions.join('')).toContain('推进剧情');
  });

  it('blocks realm and immortal-only grounds with explicit reasons', () => {
    const immortalGround = { ...baseGround, id: 'black_heaven_hunt', type: 'hunt', immortalOnly: true, minRealm: 7 };
    const policy = evaluateTrainingGroundEntry(immortalGround, ctx({ realmGrand: 5, isImmortal: false }));

    expect(policy.canEnter).toBe(false);
    expect(policy.status).toBe('realm_blocked');
    expect(policy.blockers.join('')).toContain('需要蛊仙境界');
    expect(policy.routeHint).toBe('group_7x5');
  });

  it('reports cooldown and keeps the reason available to UI', () => {
    const policy = evaluateTrainingGroundEntry(baseGround, ctx({ cooldowns: { qingmao_moon_duel: 30 } }));

    expect(policy.canEnter).toBe(false);
    expect(policy.status).toBe('cooldown');
    expect(policy.blockers.join('')).toContain('仍在冷却');
  });

  it('keeps old entry as debug-only when clue is missing, or blocks it when strict', () => {
    const debugPolicy = evaluateTrainingGroundEntry(baseGround, ctx());
    expect(debugPolicy.canEnter).toBe(true);
    expect(debugPolicy.debugOnly).toBe(true);
    expect(debugPolicy.warnings.join('')).toContain('缺少剧情线索');

    const strictPolicy = evaluateTrainingGroundEntry(baseGround, ctx(), { allowLegacyDebugAccess: false });
    expect(strictPolicy.canEnter).toBe(false);
    expect(strictPolicy.status).toBe('missing_clue');
    expect(strictPolicy.blockers.join('')).toContain('缺少剧情线索');
  });

  it('marks unlocked entries as available and summarizes empty windows with actions', () => {
    const available = evaluateTrainingGroundEntry(baseGround, ctx(), { narrativeClueIds: [baseGround.id] });
    expect(available.canEnter).toBe(true);
    expect(available.status).toBe('available');
    expect(available.routeHint).toBe('duel');

    const summary = summarizeTrainingGroundEntries([baseGround], ctx({ currentChapterId: 'fate_war' }));
    expect(summary.hasAnyDisplayable).toBe(false);
    expect(summary.blockers.join('')).toContain('地点/章节不匹配');
    expect(summary.recommendedActions.join('')).toContain('等待文本给出道场');
  });
});
