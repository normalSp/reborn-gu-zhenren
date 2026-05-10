import { describe, expect, it, vi } from 'vitest';
import type { BattlefieldUnit } from '../types';
import {
  advanceBattlefieldRound,
  createBattlefieldGroupCombatState,
  executeBattlefieldAction,
  getBattlefieldCombatRulesForTests,
  listBattlefieldActionTargets,
  listBattlefieldTurnOrder,
  resolveBattlefieldAmbushOpening,
  resolveBattlefieldEnemyTurn,
  validateBattlefieldAction,
} from './v080-battlefield-combat-engine';

function unit(overrides: Partial<BattlefieldUnit>): BattlefieldUnit {
  return {
    id: 'player',
    name: 'player',
    side: 'player',
    cellId: 'c0_0',
    realmNum: 3,
    path: '力道',
    hp: 120,
    maxHp: 120,
    attack: 60,
    defense: 12,
    accuracy: 999,
    evasion: 8,
    daoMarks: { 力道: 30, 土道: 20, 暗道: 20, 金道: 20 },
    essence: { current: 100, max: 100, type: 'primeval' },
    guNames: [],
    killerMoveNames: [],
    cooldowns: {},
    statusEffects: [],
    revealed: true,
    ...overrides,
  };
}

function groupState() {
  return createBattlefieldGroupCombatState({
    battleId: 'b1-group-test',
    seed: 'b1-seed',
    activeUnitId: 'player',
    morale: { player: 62, enemy: 58, neutral: 50 },
    cells: [
      { id: 'c2_0', flags: ['array_node'] },
      { id: 'c4_1', flags: ['concealment'] },
      { id: 'c4_2', flags: ['concealment'] },
    ],
    ambush: {
      side: 'enemy',
      revealed: false,
      openingResolved: false,
      hiddenUnitIds: ['hidden_enemy'],
    },
    thirdParties: [{
      id: 'tie_patrol',
      unitIds: ['third_party'],
      entryRound: 2,
      entered: false,
      stance: 'attack_high_threat',
    }],
    objectives: [
      { id: 'protect_ally', type: 'protect', label: 'protect ally', status: 'active', unitId: 'ally_guard' },
      { id: 'defeat_leader', type: 'defeat_key', label: 'defeat leader', status: 'active', targetUnitId: 'enemy' },
    ],
    units: [
      unit({
        id: 'player',
        name: 'player',
        side: 'player',
        cellId: 'c0_0',
        role: 'leader',
        guNames: ['力气蛊', '月光蛊'],
        threat: 70,
      }),
      unit({
        id: 'ally_guard',
        name: 'ally',
        side: 'ally',
        cellId: 'c0_1',
        role: 'guard',
        guNames: ['力气蛊'],
        threat: 40,
      }),
      unit({
        id: 'enemy',
        name: 'enemy',
        side: 'enemy',
        cellId: 'c1_1',
        path: '土道',
        role: 'leader',
        hp: 140,
        maxHp: 140,
        guNames: ['力气蛊'],
        threat: 64,
      }),
      unit({
        id: 'hidden_enemy',
        name: 'hidden enemy',
        side: 'enemy',
        cellId: 'c4_1',
        path: '暗道',
        role: 'scout',
        guNames: ['破风蛊'],
        revealed: false,
        threat: 42,
      }),
      unit({
        id: 'third_party',
        name: 'third party',
        side: 'neutral',
        cellId: 'c4_2',
        path: '金道',
        role: 'third_party',
        guNames: ['金钟蛊'],
        revealed: false,
        threat: 55,
      }),
    ],
  });
}

describe('v0.8.0-b1 battlefield group combat engine', () => {
  it('loads complete group rules and creates deterministic group turn order', () => {
    const rules = getBattlefieldCombatRulesForTests();
    expect(rules.group.morale.lowThreshold).toBeGreaterThan(0);
    expect(rules.group.guard.damageReduction).toBeGreaterThan(0);
    expect(rules.group.assist.damageMultiplier).toBeGreaterThan(1);
    expect(rules.group.thirdParty.entryRound).toBe(2);

    const state = groupState();
    expect(state.mode).toBe('group');
    expect(state.grid.cells).toHaveLength(15);
    expect(state.units.filter(item => item.side === 'ally' || item.side === 'player')).toHaveLength(2);
    expect(state.units.filter(item => item.side === 'enemy')).toHaveLength(2);
    expect(state.objectives).toHaveLength(2);
    expect(listBattlefieldTurnOrder(state).map(item => item.id)).toContain('player');
  });

  it('keeps default 5x3 but supports ambush_7x5 preset, occupancy validation, and fixed escort exits', () => {
    const defaultState = groupState();
    expect(defaultState.grid.width).toBe(5);
    expect(defaultState.grid.height).toBe(3);
    expect(defaultState.grid.cells).toHaveLength(15);

    const largeState = createBattlefieldGroupCombatState({
      battleId: 'b11-large-grid-test',
      seed: 'b11-large-seed',
      gridPresetId: 'ambush_7x5',
      activeUnitId: 'player',
      objectives: [
        { id: 'escort', type: 'escort', label: 'escort', status: 'active', unitId: 'merchant', cellId: 'c0_3', requiredEdge: true },
      ],
      units: [
        unit({ id: 'player', side: 'player', cellId: 'c1_2', guNames: ['月光蛊', '力气蛊'] }),
        unit({ id: 'merchant', name: 'merchant', side: 'ally', role: 'objective', cellId: 'c1_3', guNames: [] }),
        unit({ id: 'enemy', side: 'enemy', cellId: 'c5_2', guNames: ['力气蛊'] }),
        unit({ id: 'hidden_enemy', side: 'enemy', cellId: 'c4_1', guNames: ['破风蛊'], revealed: false }),
      ],
    });
    expect(largeState.gridPresetId).toBe('ambush_7x5');
    expect(largeState.grid.width).toBe(7);
    expect(largeState.grid.height).toBe(5);
    expect(largeState.grid.cells).toHaveLength(35);
    expect(largeState.grid.cells.find(cell => cell.id === 'c0_3')?.flags).toContain('escort_exit');

    expect(() => createBattlefieldGroupCombatState({
      battleId: 'b11-out-of-bounds',
      gridPresetId: 'ambush_7x5',
      units: [unit({ id: 'bad', cellId: 'c7_0' })],
    })).toThrow(/unit_out_of_bounds/);
    expect(() => createBattlefieldGroupCombatState({
      battleId: 'b11-duplicate',
      gridPresetId: 'ambush_7x5',
      units: [unit({ id: 'a', cellId: 'c1_1' }), unit({ id: 'b', cellId: 'c1_1' })],
    })).toThrow(/duplicate_occupant/);

    const escortMove = executeBattlefieldAction(largeState, {
      type: 'move',
      actorId: 'merchant',
      targetCellId: 'c0_3',
    });
    expect(escortMove.state.objectives?.find(objective => objective.id === 'escort')?.status).toBe('succeeded');
    expect(escortMove.steps.some(step => step.kind === 'objective' || step.kind === 'settlement')).toBe(true);
  });

  it('enumerates ranges and local intel on a 7x5 board deterministically', () => {
    const largeState = createBattlefieldGroupCombatState({
      battleId: 'b11-range-test',
      seed: 'b11-range-seed',
      gridPresetId: 'ambush_7x5',
      activeUnitId: 'player',
      units: [
        unit({ id: 'player', side: 'player', cellId: 'c1_2', guNames: ['月光蛊', '力气蛊', '侦察蛊', '破风蛊'] }),
        unit({ id: 'ally_scout', side: 'ally', cellId: 'c2_1', guNames: ['侦察蛊'] }),
        unit({ id: 'enemy', side: 'enemy', cellId: 'c5_2', guNames: ['力气蛊'] }),
        unit({ id: 'hidden_enemy', side: 'enemy', cellId: 'c4_1', guNames: ['破风蛊'], revealed: false }),
      ],
    });

    const line = listBattlefieldActionTargets(largeState, { type: 'gu', actorId: 'player', guName: '月光蛊' });
    expect(line.validTargetCellIds.length).toBeGreaterThan(0);
    expect(line.validTargetCellIds.every(cellId => largeState.grid.cells.some(cell => cell.id === cellId))).toBe(true);

    const adjacent = listBattlefieldActionTargets(largeState, { type: 'gu', actorId: 'player', guName: '力气蛊' });
    expect(adjacent.validTargetCellIds.length).toBeGreaterThan(0);
    expect(adjacent.validTargetCellIds).not.toContain('c5_2');

    const observe = executeBattlefieldAction(largeState, { type: 'observe', actorId: 'ally_scout' });
    expect(observe.steps.some(step => step.kind === 'ambush')).toBe(true);
    expect(observe.state.units.find(item => item.id === 'hidden_enemy')?.revealed).toBe(true);

    const first = resolveBattlefieldEnemyTurn(largeState).steps.map(step => ({ kind: step.kind, targetIds: step.targetIds, damage: step.damage }));
    const second = resolveBattlefieldEnemyTurn(largeState).steps.map(step => ({ kind: step.kind, targetIds: step.targetIds, damage: step.damage }));
    expect(second).toEqual(first);
  });

  it('resolves guard, assist, rally, formation, and observe as local steps', () => {
    const guarded = executeBattlefieldAction(groupState(), {
      type: 'guard',
      actorId: 'player',
      targetCellId: 'c0_1',
    });
    expect(guarded.steps.some(step => step.kind === 'guard')).toBe(true);
    expect(guarded.state.activeEffects?.some(effect => effect.tags.includes('guard'))).toBe(true);

    const enemyHit = executeBattlefieldAction(guarded.state, {
      type: 'gu',
      actorId: 'enemy',
      guName: '力气蛊',
      targetCellId: 'c0_1',
      targetUnitIds: ['ally_guard'],
    });
    expect(enemyHit.steps.some(step => step.kind === 'guard')).toBe(true);

    const assisted = executeBattlefieldAction(groupState(), {
      type: 'assist',
      actorId: 'player',
      targetCellId: 'c0_1',
    });
    const allyAttack = executeBattlefieldAction(assisted.state, {
      type: 'gu',
      actorId: 'ally_guard',
      guName: '力气蛊',
      targetCellId: 'c1_1',
      targetUnitIds: ['enemy'],
    });
    expect(allyAttack.steps.some(step => step.kind === 'assist')).toBe(true);

    const rallied = executeBattlefieldAction(groupState(), { type: 'rally', actorId: 'player' });
    expect(rallied.steps.some(step => step.kind === 'morale')).toBe(true);
    expect(rallied.state.morale?.player).toBeGreaterThan(62);

    const formed = executeBattlefieldAction(groupState(), {
      type: 'formation',
      actorId: 'player',
      targetCellId: 'c2_0',
    });
    expect(formed.steps.some(step => step.kind === 'formation')).toBe(true);
    expect(formed.state.activeFormationId).toContain('player');

    const observed = executeBattlefieldAction(groupState(), { type: 'observe', actorId: 'player' });
    expect(observed.steps.some(step => step.kind === 'ambush')).toBe(true);
    expect(observed.state.units.find(item => item.id === 'hidden_enemy')?.revealed).toBe(true);
    expect(observed.state.ambush?.revealed).toBe(true);
  });

  it('resolves ambush opening, third party entry, objectives, retreat, and enemy turn locally', () => {
    const ambush = resolveBattlefieldAmbushOpening(groupState());
    expect(ambush.steps.some(step => step.kind === 'ambush')).toBe(true);
    expect(ambush.state.ambush?.openingResolved).toBe(true);
    expect(ambush.state.morale?.player).toBeLessThan(62);

    const nextRound = advanceBattlefieldRound(groupState());
    expect(nextRound.state.round).toBe(2);
    expect(nextRound.steps.some(step => step.kind === 'third_party')).toBe(true);
    expect(nextRound.state.thirdParties?.[0]?.entered).toBe(true);

    const retreat = executeBattlefieldAction(groupState(), { type: 'retreat', actorId: 'player' });
    expect(retreat.steps.some(step => step.tags.includes('retreat'))).toBe(true);

    const enemyTurn = resolveBattlefieldEnemyTurn(groupState());
    expect(enemyTurn.steps.length).toBeGreaterThan(0);
    expect(enemyTurn.state.activeUnitId).toBe('player');

    const defeated = executeBattlefieldAction(groupState(), {
      type: 'gu',
      actorId: 'player',
      guName: '力气蛊',
      targetCellId: 'c1_1',
      targetUnitIds: ['enemy'],
    });
    expect(defeated.state.objectives?.find(objective => objective.id === 'defeat_leader')?.status).not.toBe('failed');
  });

  it('does not call Math.random and keeps same seed deterministic', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used by b1 battlefield engine');
    });
    try {
      const first = resolveBattlefieldEnemyTurn(groupState()).steps.map(step => ({
        kind: step.kind,
        damage: step.damage,
        targetIds: step.targetIds,
      }));
      const second = resolveBattlefieldEnemyTurn(groupState()).steps.map(step => ({
        kind: step.kind,
        damage: step.damage,
        targetIds: step.targetIds,
      }));
      expect(second).toEqual(first);
    } finally {
      spy.mockRestore();
    }
  });

  it('validates group action targets and rejects missing formation target', () => {
    const state = groupState();
    expect(validateBattlefieldAction(state, { type: 'guard', actorId: 'player', targetCellId: 'c0_1' }).ok).toBe(true);
    expect(validateBattlefieldAction(state, { type: 'assist', actorId: 'player', targetCellId: 'c0_1' }).ok).toBe(true);
    const missingFormation = validateBattlefieldAction(state, { type: 'formation', actorId: 'player' });
    expect(missingFormation.ok).toBe(false);
    expect(missingFormation.reason).toBe('missing_target');
  });
});
