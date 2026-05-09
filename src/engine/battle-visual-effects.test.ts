import { describe, expect, it } from 'vitest';
import { buildBattleVisualEffect, buildBattleVisualEffectFromDuelMove, resolveBattleVisualEntry } from './battle-visual-effects';
import type { DuelMove } from '../types';

describe('v0.7.0-c battle visual effects', () => {
  it('resolves important Immortal Gu flash entries by name', () => {
    const entry = resolveBattleVisualEntry({ name: '春秋蝉', kind: 'immortal_gu', tags: ['time_path'] });
    expect(entry?.id).toBe('spring_autumn_cicada_flash');
  });

  it('falls back for killer moves without art and keeps settlement independent', () => {
    const move: DuelMove = {
      name: '血刃杀招',
      killerMoveId: 'blood_blade',
      damageMultiplier: 1.4,
      pathBonus: 0.2,
      description: '测试杀招',
    };
    const effect = buildBattleVisualEffectFromDuelMove(move, 1000);
    expect(effect?.kind).toBe('killer_move');
    expect(effect?.sourceName).toBe('血刃杀招');
    expect(effect?.durationMs).toBeGreaterThan(0);
  });

  it('uses path-flavored fallback for Immortal Gu when no image is registered', () => {
    const effect = buildBattleVisualEffect({ name: '鸿运齐天蛊', kind: 'immortal_gu', tags: ['immortal_gu', 'luck_path'] }, 2000);
    expect(effect?.id).toContain('immortal_gu_generic');
    expect(effect?.pathId).toBe('运道');
    expect(effect?.fallbackTint).toBe('#ffd76f');
  });
});
