import { describe, expect, it, vi } from 'vitest';
import {
  buildHuntCombatCandidate,
  createBattlefieldBeastEncounterState,
  getBeastEnemySpec,
  resolveBeastLootForOutcome,
  validateBeastEnemyRegistry,
} from './v090-beast-enemy-registry';
import { getTrainingGroundSpec } from './v090-training-ground-clue-engine';
import { resolveBattlefieldEnemyTurn } from './v080-battlefield-combat-engine';

function immortalStore(overrides: Record<string, any> = {}) {
  return {
    turn: 21,
    currentChapterId: 'nilu_ascent',
    profile: { name: '狩猎测试蛊仙', realm: { grand: 7, label: '七转' } },
    vitals: {
      health: { current: 900, max: 900 },
      essence: { current: 300, max: 300 },
    },
    pathBuild: { primary: '风道', dao_marks: { 风道: 260, 力道: 80 } },
    inventory: [{ name: '月光蛊' }, { name: '石皮蛊' }, { name: '水龙蛊' }],
    apertureInventory: { gu: [{ name: '金钟蛊' }] },
    killMoves: [],
    sceneSessionState: {
      sceneId: 'beast_hunt_test',
      actionBudget: { remaining: 5, remainingAp: 5 },
    },
    ...overrides,
  };
}

describe('v0.9.0-a3 beast enemy registry', () => {
  it('keeps the runtime enemy library legal and traceable', () => {
    const validation = validateBeastEnemyRegistry();
    expect(validation.ok).toBe(true);
    expect(getBeastEnemySpec('light_wing_beast')?.realmNum).toBe(6);
    expect(getBeastEnemySpec('black_prison_dragon')?.tier).toBe('ancient_desolate_beast');
  });

  it('builds white-heaven and black-heaven hunt candidates as 7x5 encounters', () => {
    const white = getTrainingGroundSpec('tg_white_heaven');
    const black = getTrainingGroundSpec('tg_black_heaven');
    expect(white).toBeTruthy();
    expect(black).toBeTruthy();

    const whiteCandidate = buildHuntCombatCandidate(white!, immortalStore(), 'white-seed')!;
    const blackCandidate = buildHuntCombatCandidate(black!, immortalStore(), 'black-seed')!;

    expect(whiteCandidate.scale).toBe('group_7x5');
    expect(whiteCandidate.enemySpecIds?.length).toBeGreaterThan(0);
    expect(blackCandidate.enemySpecIds?.some(id => ['shadow_python', 'poison_mist_toad', 'soul_devouring_bat', 'black_prison_dragon'].includes(id))).toBe(true);
    expect(whiteCandidate.dropPolicyId).toBe('desolate_material_clue');
  });

  it('creates a real battlefield with beast instinct enemies and deterministic enemy turns', () => {
    const ground = getTrainingGroundSpec('tg_white_heaven')!;
    const candidate = buildHuntCombatCandidate(ground, immortalStore(), 'battle-seed')!;
    const state = createBattlefieldBeastEncounterState(immortalStore(), {
      ...candidate,
      availableGu: ['月光蛊', '石皮蛊'],
      availableKillerMoves: [],
      blockers: [],
      warnings: [],
      sceneId: 'beast_hunt_test',
    });

    expect(state.gridPresetId).toBe('ambush_7x5');
    expect(state.grid.cells).toHaveLength(35);
    expect(state.units.some(unit => unit.beastSpecId && unit.instinctMoves?.length)).toBe(true);

    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('beast battlefield must not call Math.random');
    });
    const first = resolveBattlefieldEnemyTurn({ ...state, phase: 'enemy_turn' });
    const second = resolveBattlefieldEnemyTurn({ ...state, phase: 'enemy_turn' });
    spy.mockRestore();

    expect(first.steps.some(step => step.tags.includes('beast_instinct'))).toBe(true);
    expect(first.steps.map(step => step.kind)).toEqual(second.steps.map(step => step.kind));
  });

  it('resolves loot without stable Gu or Immortal Gu drops', () => {
    const ground = getTrainingGroundSpec('tg_white_heaven')!;
    const candidate = buildHuntCombatCandidate(ground, immortalStore(), 'loot-seed')!;
    const loot = resolveBeastLootForOutcome({
      ...candidate,
      availableGu: [],
      availableKillerMoves: [],
      blockers: [],
      warnings: [],
      sceneId: 'beast_hunt_test',
    }, 'victory', 'loot-seed');

    expect(Object.keys(loot.materialDrops).every(name => !name.includes('仙蛊'))).toBe(true);
    expect(loot.blockedRewards).toContain('immortal_gu_drop_blocked');
    expect(['destroyed', 'escaped', 'rumor_only', 'none']).toContain(loot.parasiteGuOutcome);
  });
});
