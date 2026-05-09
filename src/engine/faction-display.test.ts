import { describe, expect, it } from 'vitest';
import { getInitialFactionStanding, resolveFactionDisplayName } from './faction-display';

describe('faction-display', () => {
  it('resolves runtime faction ids to Chinese names', () => {
    expect(resolveFactionDisplayName('guyue_shanzhai')).toBe('古月山寨');
    expect(resolveFactionDisplayName('shangjia')).toBe('商家');
  });

  it('does not start a one-turn Gu Yue disciple at respected standing', () => {
    const standing = getInitialFactionStanding('guyue_shanzhai', { realmGrand: 1, identity: '蛊师学徒' });
    expect(standing).toBeGreaterThanOrEqual(5);
    expect(standing).toBeLessThan(30);
  });
});
