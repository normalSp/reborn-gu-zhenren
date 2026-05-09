import { describe, expect, it } from 'vitest';
import {
  resolveStarterGuForStartProfile,
  resolveStartProfile,
  validateStartProfileCoverage,
} from './start-profile';

const tierTwoShangGu = { name: '金银蛊', tier: 2, path: '金道', rank: '普通' };
const tierOneBearGu = { name: '熊力蛊', tier: 1, path: '力道', rank: '普通' };

describe('start-profile routing', () => {
  it('covers every selectable faction and every Southern Border one-turn branch', () => {
    expect(validateStartProfileCoverage()).toEqual([]);
  });

  it('routes one-turn Shang clan start to a caravan branch instead of Guyue identity', () => {
    const { profile } = resolveStartProfile({
      timelineNodeId: 'qingmaoshan',
      factionId: 'shangjia',
      domain: '南疆',
      realmGrand: 1,
      guTierMax: 1,
    });

    expect(profile?.id).toBe('start_qingmaoshan_shangjia_caravan');
    expect(profile?.playerFactionRole).toContain('商家');
    expect(profile?.playerFactionRole).not.toContain('古月');
    expect(resolveStarterGuForStartProfile(tierTwoShangGu, profile, 1)).toBeNull();
  });

  it('keeps Xiong clan as the local strength-path branch', () => {
    const { profile } = resolveStartProfile({
      timelineNodeId: 'qingmaoshan',
      factionId: 'xiongjia_zhai',
      domain: '南疆',
      realmGrand: 1,
      guTierMax: 1,
    });

    expect(profile?.id).toBe('start_qingmaoshan_xiongjia');
    expect(profile?.playerFactionRole).toContain('熊家寨');
    expect(resolveStarterGuForStartProfile(tierOneBearGu, profile, 1)?.name).toBe('熊力蛊');
  });

  it('keeps Wu clan separate from Xiong clan and blocks over-strong starter assets', () => {
    const { profile } = resolveStartProfile({
      timelineNodeId: 'qingmaoshan',
      factionId: 'wujia',
      domain: '南疆',
      realmGrand: 1,
      guTierMax: 1,
    });

    expect(profile?.id).toBe('start_qingmaoshan_wujia_branch');
    expect(profile?.playerFactionRole).toContain('武家');
    expect(profile?.factionName).toBe('武家');
    expect(profile?.startLocation.area).not.toContain('熊家寨');
    expect(resolveStarterGuForStartProfile(tierTwoShangGu, profile, 1)).toBeNull();
  });
});
