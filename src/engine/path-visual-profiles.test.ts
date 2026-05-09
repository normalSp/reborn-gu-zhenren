import { describe, expect, it } from 'vitest';
import { buildBattleVisualEffectFromDuelMove } from './battle-visual-effects';
import { pathVisualProfiles, resolvePathVisualProfile, validatePathVisualProfiles } from './path-visual-profiles';

describe('path visual profiles', () => {
  it('keeps every runtime visual profile backed by path-registry', () => {
    expect(pathVisualProfiles.length).toBeGreaterThanOrEqual(10);
    expect(validatePathVisualProfiles()).toEqual([]);
  });

  it('resolves core path motifs for battle flash fallback', () => {
    expect(resolvePathVisualProfile('力道').motif).toBe('impact');
    expect(resolvePathVisualProfile(['killer_move', 'blood_path']).pathId).toBe('血道');
    expect(resolvePathVisualProfile(['unknown_runtime_tag']).motif).toBe('generic');
  });

  it('uses DuelMove path when building fallback battle visual effects', () => {
    const visual = buildBattleVisualEffectFromDuelMove({
      name: '血刃试招',
      path: '血道',
      damageMultiplier: 1.2,
      pathBonus: 0,
      description: '测试用杀招',
      killerMoveId: 'test_blood_move',
    }, 123);

    expect(visual?.pathId).toBe('血道');
    expect(visual?.motif).toBe('blood');
    expect(visual?.fallbackTint).toBe('#c43f4b');
  });
});
