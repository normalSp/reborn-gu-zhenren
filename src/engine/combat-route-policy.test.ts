import { describe, expect, it } from 'vitest';
import {
  normalizeCombatRouteScale,
  resolveCombatRoutePolicy,
} from './combat-route-policy';

describe('v0.9.0-a1 combat route policy', () => {
  it('routes single enemy, sparring and explicit duel to 1v1 battlefield', () => {
    expect(resolveCombatRoutePolicy({ type: 'spar', enemyCount: 1 }).scale).toBe('duel');
    expect(resolveCombatRoutePolicy({ title: '擂台复仇', enemyCount: 1 }).scale).toBe('duel');

    const explicit = resolveCombatRoutePolicy({ scale: '1v1' });
    expect(explicit.scale).toBe('duel');
    expect(explicit.warnings.join('')).toContain('不进入旧 duelState');
  });

  it('routes ordinary few-enemy conflicts to 5x3 battlefield when no group signal exists', () => {
    const route = resolveCombatRoutePolicy({ enemyCount: 2, summary: '两名敌人沿山路逼近' });

    expect(route.scale).toBe('battlefield_5x3');
    expect(route.source).toBe('default');
  });

  it('routes squad protection and morale objectives to 5x3 group battlefield', () => {
    expect(resolveCombatRoutePolicy({ type: 'protect', allyCount: 3 }).scale).toBe('group_5x3');
    expect(resolveCombatRoutePolicy({ tags: ['士气', '援护'] }).scale).toBe('group_5x3');
  });

  it('routes ambush, hunt, calamity and inheritance guardians to 7x5 group battlefield', () => {
    const signals = ['伏击', 'hunt', '灾劫', '传承守护', '荒兽狩猎', 'third_party'];

    for (const signal of signals) {
      expect(resolveCombatRoutePolicy({ type: signal }).scale).toBe('group_7x5');
    }
  });

  it('falls back safely for unknown explicit scales and records a warning', () => {
    const route = resolveCombatRoutePolicy({ scale: 'arena_plus', enemyCount: 0 });

    expect(route.scale).toBe('battlefield_5x3');
    expect(route.warnings.join('')).toContain('未知战斗规模 arena_plus');
    expect(normalizeCombatRouteScale('skirmish')).toBe('battlefield_5x3');
  });
});
