import { describe, expect, it, vi } from 'vitest';
import type { BattlefieldUnit } from '../types';
import {
  advanceBattlefieldRound,
  createBattlefieldCombatState,
  executeBattlefieldAction,
  interruptPendingBattlefieldAction,
  listBattlefieldActionTargets,
  validateBattlefieldAction,
} from './v080-battlefield-combat-engine';

function unit(overrides: Partial<BattlefieldUnit>): BattlefieldUnit {
  return {
    id: 'player',
    name: 'player',
    side: 'player',
    cellId: 'c0_1',
    realmNum: 3,
    path: '光道',
    hp: 120,
    maxHp: 120,
    essence: { current: 100, max: 100, type: 'primeval' },
    guNames: [],
    killerMoveNames: [],
    statusEffects: [],
    attack: 80,
    defense: 12,
    accuracy: 999,
    evasion: 5,
    daoMarks: { 光道: 10, 木道: 10, 土道: 10, 力道: 10, 雷道: 10, 暗道: 10 },
    ...overrides,
  };
}

function basicState(options: {
  seed?: string;
  player?: Partial<BattlefieldUnit>;
  enemy?: Partial<BattlefieldUnit>;
  cells?: Parameters<typeof createBattlefieldCombatState>[0]['cells'];
  activeTerrainId?: string;
} = {}) {
  return createBattlefieldCombatState({
    battleId: 'a1-test',
    seed: options.seed ?? 'a1-seed',
    activeTerrainId: options.activeTerrainId,
    cells: options.cells,
    units: [
      unit({
        id: 'player',
        name: '测试蛊师',
        side: 'player',
        cellId: 'c0_1',
        guNames: ['月光蛊', '小光蛊', '力气蛊', '石皮蛊', '雷翼蛊', '幽影随行蛊', '岩枪蛊', '青丝蛊', '种蛊', '月芒蛊', '金钟蛊', '金罡蛊'],
        killerMoveNames: ['月刃连斩', '木灵缠绕', '金钟不破'],
        ...options.player,
      }),
      unit({
        id: 'enemy',
        name: '敌方蛊师',
        side: 'enemy',
        cellId: 'c2_1',
        path: '土道',
        hp: 100,
        maxHp: 100,
        guNames: [],
        killerMoveNames: [],
        accuracy: 30,
        evasion: 1,
        defense: 4,
        daoMarks: { 土道: 3 },
        ...options.enemy,
      }),
    ],
  });
}

function stepKinds(result: ReturnType<typeof executeBattlefieldAction>) {
  return result.steps.map(step => step.kind);
}

describe('v0.8.0-a1 battlefield combat engine', () => {
  it('creates a 5x3 board and rejects invalid occupancy', () => {
    const state = basicState();
    expect(state.grid.width).toBe(5);
    expect(state.grid.height).toBe(3);
    expect(state.grid.cells).toHaveLength(15);
    expect(state.grid.cells.find(cell => cell.id === 'c0_1')?.occupantId).toBe('player');

    expect(() => createBattlefieldCombatState({
      battleId: 'bad-out-of-bounds',
      units: [unit({ cellId: 'c9_9' })],
    })).toThrow(/unit_out_of_bounds/);

    expect(() => createBattlefieldCombatState({
      battleId: 'bad-duplicate',
      units: [
        unit({ id: 'a', cellId: 'c1_1' }),
        unit({ id: 'b', cellId: 'c1_1' }),
      ],
    })).toThrow(/duplicate_occupant/);
  });

  it('rejects moving into an occupied cell', () => {
    const state = basicState({ enemy: { cellId: 'c1_1' } });
    const validation = validateBattlefieldAction(state, {
      type: 'move',
      actorId: 'player',
      targetCellId: 'c1_1',
    });
    expect(validation.ok).toBe(false);
    expect(validation.reason).toBe('target_cell_occupied');
  });

  it('resolves line Gu range, cover blocking, essence spending, cooldown, and status output', () => {
    const state = basicState();
    const result = executeBattlefieldAction(state, {
      type: 'gu',
      actorId: 'player',
      guName: '月光蛊',
      targetCellId: 'c2_1',
    });

    expect(result.validation.ok).toBe(true);
    expect(stepKinds(result)).toEqual(expect.arrayContaining(['gu_use', 'resource_spend', 'hit', 'status_apply']));
    expect(result.state.units.find(item => item.id === 'player')?.essence?.current).toBe(92);
    expect(result.state.units.find(item => item.id === 'player')?.cooldowns?.['月光蛊']).toBe(1);
    expect(result.state.units.find(item => item.id === 'enemy')?.statusEffects).toContain('light_cut');

    const tooFar = validateBattlefieldAction(basicState({ enemy: { cellId: 'c4_1' } }), {
      type: 'gu',
      actorId: 'player',
      guName: '月光蛊',
      targetCellId: 'c4_1',
    });
    expect(tooFar.ok).toBe(false);
    expect(tooFar.reason).toBe('target_out_of_range');

    const covered = validateBattlefieldAction(basicState({
      cells: [{ id: 'c1_1', flags: ['cover'] }],
    }), {
      type: 'gu',
      actorId: 'player',
      guName: '月光蛊',
      targetCellId: 'c2_1',
    });
    expect(covered.ok).toBe(false);
    expect(covered.reason).toBe('line_of_sight_blocked');
  });

  it('handles adjacent, self, zone, dash, and short teleport shapes', () => {
    const adjacent = executeBattlefieldAction(basicState({ enemy: { cellId: 'c1_1' } }), {
      type: 'gu',
      actorId: 'player',
      guName: '力气蛊',
      targetCellId: 'c1_1',
    });
    expect(adjacent.validation.ok).toBe(true);
    expect(stepKinds(adjacent)).toContain('hit');

    const self = executeBattlefieldAction(basicState(), {
      type: 'gu',
      actorId: 'player',
      guName: '小光蛊',
      targetCellId: 'c0_1',
    });
    expect(self.validation.ok).toBe(true);
    expect(self.state.units.find(item => item.id === 'player')?.statusEffects).toContain('light_amplified');

    const zoneTargets = listBattlefieldActionTargets(basicState(), {
      type: 'gu',
      actorId: 'player',
      guName: '驭虫蛊',
      sceneGate: true,
    });
    expect(zoneTargets.validTargetCellIds.length).toBeGreaterThan(0);

    const dash = executeBattlefieldAction(basicState(), {
      type: 'gu',
      actorId: 'player',
      guName: '雷翼蛊',
      targetCellId: 'c0_2',
    });
    expect(dash.validation.ok).toBe(true);
    expect(dash.state.units.find(item => item.id === 'player')?.cellId).toBe('c0_2');

    const teleport = executeBattlefieldAction(basicState({ enemy: { cellId: 'c4_1' } }), {
      type: 'gu',
      actorId: 'player',
      guName: '幽影随行蛊',
      targetCellId: 'c1_0',
    });
    expect(teleport.validation.ok).toBe(true);
    expect(teleport.state.units.find(item => item.id === 'player')?.cellId).toBe('c1_0');
  });

  it('applies terrain affinity as favored boost or hindered counter/failure fact', () => {
    const favored = executeBattlefieldAction(basicState({ activeTerrainId: 'moonlit_courtyard' }), {
      type: 'gu',
      actorId: 'player',
      guName: '月光蛊',
      targetCellId: 'c2_1',
    });
    const hindered = executeBattlefieldAction(basicState({ activeTerrainId: 'dense_forest' }), {
      type: 'gu',
      actorId: 'player',
      guName: '月光蛊',
      targetCellId: 'c2_1',
    });
    const favoredDamage = favored.steps.find(step => step.kind === 'hit')?.damage ?? 0;
    const hinderedDamage = hindered.steps.find(step => step.kind === 'hit')?.damage ?? 0;
    expect(favoredDamage).toBeGreaterThan(hinderedDamage);
    expect(stepKinds(hindered)).toContain('counter');
  });

  it('stacks different statuses but does not duplicate the same status forever', () => {
    const durableState = basicState({ enemy: { hp: 500, maxHp: 500, defense: 60 } });
    const first = executeBattlefieldAction(durableState, {
      type: 'gu',
      actorId: 'player',
      guName: '月光蛊',
      targetCellId: 'c2_1',
    }).state;
    const cooled = advanceBattlefieldRound(first).state;
    const second = executeBattlefieldAction(cooled, {
      type: 'gu',
      actorId: 'player',
      guName: '月光蛊',
      targetCellId: 'c2_1',
    }).state;
    const third = executeBattlefieldAction(second, {
      type: 'gu',
      actorId: 'player',
      guName: '岩枪蛊',
      targetCellId: 'c2_1',
    }).state;
    const statuses = third.units.find(item => item.id === 'enemy')?.statusEffects ?? [];
    expect(statuses.filter(status => status === 'light_cut')).toHaveLength(1);
    expect(statuses).toContain('rooted_light');
  });

  it('validates killer move ownership, Gu components, charging, interrupt, release, and backlash', () => {
    const base = basicState();

    expect(validateBattlefieldAction(basicState({ player: { killerMoveNames: [] } }), {
      type: 'killer_move',
      actorId: 'player',
      killerMoveName: '木灵缠绕',
      targetCellId: 'c2_1',
    }).reason).toBe('killer_move_not_learned');

    expect(validateBattlefieldAction(basicState({ player: { guNames: ['种蛊'], killerMoveNames: ['木灵缠绕'] } }), {
      type: 'killer_move',
      actorId: 'player',
      killerMoveName: '木灵缠绕',
      targetCellId: 'c2_1',
    }).reason).toMatch(/^missing_core_gu/);

    expect(validateBattlefieldAction(basicState({ player: { guNames: ['青丝蛊'], killerMoveNames: ['木灵缠绕'] } }), {
      type: 'killer_move',
      actorId: 'player',
      killerMoveName: '木灵缠绕',
      targetCellId: 'c2_1',
    }).reason).toMatch(/^missing_auxiliary_gu/);

    const pending = executeBattlefieldAction(base, {
      type: 'killer_move',
      actorId: 'player',
      killerMoveName: '木灵缠绕',
      targetCellId: 'c2_1',
    });
    expect(pending.validation.ok).toBe(true);
    expect(pending.state.pendingActions).toHaveLength(1);
    expect(stepKinds(pending)).toEqual(expect.arrayContaining(['resource_spend', 'killer_move']));

    const interrupted = interruptPendingBattlefieldAction(
      pending.state,
      pending.state.pendingActions![0].id,
      'enemy_cut_vines',
    );
    expect(interrupted.state.pendingActions).toHaveLength(0);
    expect(interrupted.steps[0].kind).toBe('counter');

    const released = advanceBattlefieldRound(pending.state);
    expect(released.state.pendingActions).toHaveLength(0);
    expect(released.steps.map(step => step.kind)).toEqual(expect.arrayContaining(['killer_move', 'hit', 'counter']));
  });

  it('settles retreat success and failure locally', () => {
    const findRetreat = (wantSuccess: boolean) => {
      for (let i = 0; i < 200; i += 1) {
        const state = basicState({
          seed: `retreat-${wantSuccess ? 'success' : 'failure'}-${i}`,
          enemy: wantSuccess ? { cellId: 'c4_1' } : { cellId: 'c1_1' },
          player: wantSuccess ? { cellId: 'c0_0' } : { cellId: 'c0_1', statusEffects: ['bound'] },
        });
        const result = executeBattlefieldAction(state, { type: 'retreat', actorId: 'player' });
        if (wantSuccess && result.state.result?.winner === 'escaped') return result;
        if (!wantSuccess && result.steps[0].kind === 'failure') return result;
      }
      throw new Error(`retreat_${wantSuccess ? 'success' : 'failure'}_seed_not_found`);
    };

    expect(findRetreat(true).state.result?.winner).toBe('escaped');
    expect(findRetreat(false).steps[0].blockedReason).toBe('retreat_failed');
  });

  it('never calls Math.random and returns deterministic steps for the same seed', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used by v080 battlefield engine');
    });
    try {
      const action = {
        type: 'gu' as const,
        actorId: 'player',
        guName: '月光蛊',
        targetCellId: 'c2_1',
      };
      const first = executeBattlefieldAction(basicState({ seed: 'deterministic' }), action);
      const second = executeBattlefieldAction(basicState({ seed: 'deterministic' }), action);
      expect(first.steps).toEqual(second.steps);
    } finally {
      spy.mockRestore();
    }
  });
});
