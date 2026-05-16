import { describe, expect, it } from 'vitest';
import startProfilesRaw from '../canon/start-profiles.json';
import {
  buildLifeboundEndingEvidence,
  buildOriginEndingEvidence,
  buildOriginLifeboundContextForPrompt,
  getLifeboundGuGrowthProfile,
  resolveFrontMidgameAnchorMapping,
  sanitizeOriginIdentityText,
  validateFrontMidgameAnchorCoverage,
  validateLifeboundGuOperation,
  validateOriginDeepLineCoverage,
} from './v080-origin-lifebound-closure';
import { buildEndingResolutionInput } from './v080-ending-framework-engine';

const startProfileIds = new Set((startProfilesRaw as any).profiles.map((profile: any) => profile.id));

function store(overrides: Record<string, any> = {}) {
  return {
    turn: 88,
    flags: { _start_profile: 'start_qingmaoshan_shangjia_caravan' },
    profile: { name: '测试蛊师', realm: { grand: 5, label: '五转巅峰' } },
    inventory: [
      {
        id: 'moonlight',
        name: '月光蛊',
        path: '月道',
        tier: 1,
        currentState: 'optimal' as const,
        bonded: true,
      },
    ],
    lifeboundGuInfo: { guId: 'moonlight', guName: '月光蛊', upgradeCount: 1 },
    storyAnchorState: {
      fateState: 'fractured',
      anchorResults: {},
      ifBranchVectors: [],
      heavenWillLedger: { attention: 12, rejection: 0, assistance: 0, byAnchor: {} },
      karmicDebtLedger: { totalDebt: 7, byKind: {}, byAnchor: {} },
      storyEventCandidates: [],
      canonAnchorPressureLog: [],
      currentAnchorId: 'shang_clan_city',
      lastResolutionSteps: [],
    },
    ...overrides,
  };
}

describe('v0.8.0-c1.2 origin deep line and lifebound closure', () => {
  it('covers every StartProfile with exactly one OriginDeepLineProfile', () => {
    expect(validateOriginDeepLineCoverage()).toEqual([]);
    for (const id of startProfileIds) {
      expect(id).toMatch(/^start_/);
    }
  });

  it('keeps front and midgame anchor ids in the canon registry', () => {
    expect(validateFrontMidgameAnchorCoverage()).toEqual([]);
    const mapping = resolveFrontMidgameAnchorMapping({ chapterId: 'san_wang_mountain' });
    expect(mapping?.canonAnchorId).toBe('san_wang_mountain');
  });

  it('downgrades cross-origin identity overreach before narrative display', () => {
    const result = sanitizeOriginIdentityText('你以古月族人的身份进入古月族学弟子的队列。', store());
    expect(result.changed).toBe(true);
    expect(result.text).toContain('商路蛊师');
    expect(result.text).not.toContain('古月族人');
  });

  it('selects lifebound growth profiles and blocks ordinary item operations', () => {
    const current = store();
    const profile = getLifeboundGuGrowthProfile(current.inventory[0]);
    expect(profile?.id).toBe('lifebound_moon_path');

    const remove = validateLifeboundGuOperation(current, 'moonlight', 'remove');
    expect(remove.allowed).toBe(false);
    expect(remove.reason).toContain('本命蛊成长协议');

    const feed = validateLifeboundGuOperation(current, 'moonlight', 'feed');
    expect(feed.allowed).toBe(true);
  });

  it('injects origin, front anchor, and lifebound constraints into narrative context', () => {
    const prompt = buildOriginLifeboundContextForPrompt(store({ currentChapterId: 'shang_clan_city' }));
    expect(prompt).toContain('南疆商家商路线');
    expect(prompt).toContain('商家城与南疆商路');
    expect(prompt).toContain('本命蛊');
    expect(prompt).toContain('不可被普通出售、移除、拆炼、升炼');
  });

  it('feeds origin and lifebound evidence into the ending resolver input', () => {
    const current = store();
    const originEvidence = buildOriginEndingEvidence(current);
    const lifeboundEvidence = buildLifeboundEndingEvidence(current);
    expect(originEvidence.profileId).toBe('origin_southern_shangjia');
    expect(lifeboundEvidence.profileId).toBe('lifebound_moon_path');

    const input = buildEndingResolutionInput({ store: current });
    expect(input.evidence.origin.profileId).toBe('origin_southern_shangjia');
    expect(input.evidence.origin.anchorAccess?.some(access => access.anchorId === 'shang_clan_city')).toBe(true);
    expect(input.evidence.lifebound.profileId).toBe('lifebound_moon_path');
    expect(input.evidence.lifebound.endingWeights?.personalDaoTrace).toBeGreaterThan(0);
  });
});
