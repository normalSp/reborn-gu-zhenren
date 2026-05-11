import { describe, expect, it } from 'vitest';
import { normalizePathDaoMarkState } from './path-dao-mark-normalizer';

describe('path dao mark normalizer', () => {
  it('merges pathBuild, legacy daoMarks and immortal aperture density for display', () => {
    const state = normalizePathDaoMarkState({
      pathBuild: {
        primary: '',
        secondary: ['炎道'],
        path_levels: { 炎道: '大师' },
        dao_marks: {},
      },
      primaryPath: '风道',
      daoMarks: { 风道: 17 },
      aperture: { dao_mark_density: { 风道: 31, 金道: 8 } },
      inventory: [{ path: '雷道' }],
      killMoves: [{ path: '雷道', baseCost: 2 }],
    });

    expect(state.primary).toBe('风道');
    expect(state.secondary).toEqual(['炎道']);
    expect(state.daoMarks).toMatchObject({ 风道: 31, 金道: 8 });
    expect(state.totalMarks).toBe(39);
    expect(state.topDaoMarks[0]).toEqual(['风道', 31]);
    expect(state.softTendency[0]).toEqual(['雷道', 5]);
  });
});
