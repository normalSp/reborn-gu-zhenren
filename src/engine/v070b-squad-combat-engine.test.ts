import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DuelMove, SquadEnemy, SquadMemberCombat } from '../types';
import { executeSquadTurn, initSquadDuel } from './squad-combat-engine';

const MOVE: DuelMove = {
  name: '合击测试杀招',
  damageMultiplier: 1.8,
  pathBonus: 20,
  description: 'v0.7.0-b 小队杀招测试',
  killerMoveId: 'km_squad_test',
};

function member(id: string, overrides: Partial<SquadMemberCombat> = {}): SquadMemberCombat {
  return {
    memberId: id,
    name: `队友${id}`,
    hp: 120,
    maxHp: 120,
    atk: 45,
    def: 14,
    path: '力道',
    realm: 3,
    personality: 'loyal',
    statuses: [],
    action: null,
    moves: [MOVE],
    essence: { current: 100, max: 100, type: 'primeval' },
    daoMarks: 80,
    cooldowns: {},
    fatigue: 0,
    adventureTrust: 70,
    loyalty: 60,
    interestDrive: 30,
    ...overrides,
  };
}

function enemy(id: string, overrides: Partial<SquadEnemy> = {}): SquadEnemy {
  return {
    id,
    name: `敌人${id}`,
    hp: 130,
    maxHp: 130,
    atk: 35,
    def: 12,
    path: '木道',
    realm: 3,
    statuses: [],
    aiMode: 'balanced',
    daoMarks: 60,
    moves: [],
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('v0.7.0-b deterministic squad combat engine', () => {
  it('does not depend on bare Math.random and produces reproducible traces', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('bare Math.random should not be used by squad combat');
    });
    const first = initSquadDuel('seeded', [member('a'), member('b')], [enemy('x')], '合击', 60, 70, 1234);
    const second = initSquadDuel('seeded', [member('a'), member('b')], [enemy('x')], '合击', 60, 70, 1234);
    const actions = [
      { type: 'attack' as const, targetIndex: 0 },
      { type: 'attack' as const, targetIndex: 0 },
    ];

    const firstResult = executeSquadTurn(first, actions);
    const secondResult = executeSquadTurn(second, actions);

    expect(randomSpy).toHaveBeenCalledTimes(0);
    expect(firstResult.enemies[0].hp).toBe(secondResult.enemies[0].hp);
    expect(firstResult.trace).toEqual(secondResult.trace);
  });

  it('resolves DuelMove based squad skills with essence cost and cooldown trace', () => {
    let state = initSquadDuel('move', [member('a')], [enemy('x', { hp: 180, maxHp: 180 })], '斩首', 55, 50, 1);

    let result = state;
    for (let i = 0; i < 3 && result.enemies[0].hp === 180; i += 1) {
      result = executeSquadTurn(result, [{ type: 'gu_skill', moveId: 'km_squad_test', targetIndex: 0 }]);
    }

    expect(result.members[0].essence?.current).toBeLessThan(100);
    expect(result.members[0].cooldowns?.km_squad_test).toBeGreaterThan(0);
    expect(result.enemies[0].hp).toBeLessThan(180);
    expect(result.trace?.some(entry => entry.tags?.includes('duel_move'))).toBe(true);
  });

  it('keeps victory rewards as economy-gated previews', () => {
    const state = initSquadDuel('reward', [member('a', { atk: 120 })], [enemy('x', { hp: 20, maxHp: 20 })], '斩首', 80, 50, 88);

    const result = executeSquadTurn(state, [{ type: 'attack', targetIndex: 0 }]);

    expect(result.phase).toBe('ended');
    expect(result.result?.winner).toBe('player');
    expect(result.result?.rewards?.yuanStone).toBeGreaterThan(0);
    expect(result.result?.rewards?.materials).toEqual({});
    expect(result.result?.rewards?.rumors?.[0]).toContain('敌方蛊虫默认死亡或自毁');
  });
});
