import { describe, expect, it, vi } from 'vitest';
import type { PartyState, SquadCombatState, SquadEnemy, SquadMember, SquadMemberCombat } from '../../types';
import { initSquadDuel } from '../../engine/squad-combat-engine';
import { createCombatSlice } from './combatSlice';

function partyMember(overrides: Partial<SquadMember> = {}): SquadMember {
  return {
    id: 'ally-1',
    name: '测试队友',
    path: '力道',
    realm: 3,
    loyalty: 50,
    personality: 'loyal',
    alive: true,
    hp: 120,
    maxHp: 120,
    atk: 120,
    def: 20,
    adventureTrust: 60,
    interestDrive: 35,
    ...overrides,
  };
}

function combatMember(overrides: Partial<SquadMemberCombat> = {}): SquadMemberCombat {
  return {
    memberId: 'ally-1',
    name: '测试队友',
    hp: 120,
    maxHp: 120,
    atk: 120,
    def: 20,
    path: '力道',
    realm: 3,
    personality: 'loyal',
    statuses: [],
    action: null,
    moves: [],
    essence: { current: 100, max: 100, type: 'primeval' },
    daoMarks: 80,
    cooldowns: {},
    fatigue: 0,
    adventureTrust: 60,
    loyalty: 50,
    interestDrive: 35,
    ...overrides,
  };
}

function enemy(overrides: Partial<SquadEnemy> = {}): SquadEnemy {
  return {
    id: 'enemy-1',
    name: '测试敌人',
    hp: 20,
    maxHp: 20,
    atk: 10,
    def: 2,
    path: '木道',
    realm: 2,
    statuses: [],
    aiMode: 'balanced',
    moves: [],
    daoMarks: 20,
    ...overrides,
  };
}

function createHarness(squadCombatState: SquadCombatState) {
  const member = partyMember();
  let state: any = {
    turn: 40,
    currency: 100,
    immortalCurrency: 0,
    totalCurrencyEarned: 0,
    totalBattlesFought: 0,
    combatWins: 0,
    squadCombatWins: 0,
    squadMemberWoundedRescues: 0,
    squadMemberDeaths: 0,
    squadComboSuccesses: 0,
    squadOverlevelEscapes: 0,
    playerFaction: { id: 'f', name: '测试势力', members: [member] },
    partyState: {
      members: [member],
      maxSize: 4,
      formation: '合击',
      morale: 50,
      coordination: 60,
      lastUpdatedTurn: 39,
      memberCooldowns: {},
      memberRolePausedUntil: {},
    } satisfies PartyState,
    squadCombatState,
    addMaterial: vi.fn(),
    addGameLog: vi.fn(),
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state = { ...state, ...createCombatSlice(set, get) };
  state.squadCombatState = squadCombatState;
  return { get: () => state };
}

describe('v0.7.0-b squad combat settlement', () => {
  it('returns victory reward and trust deltas to economy and party/faction members', () => {
    const combat = initSquadDuel('settlement', [combatMember()], [enemy()], '合击', 70, 80, 42);
    combat.phase = 'player_turn';
    const harness = createHarness(combat);

    harness.get().executeSquadTurn([{ type: 'attack', targetIndex: 0 }]);

    expect(harness.get().squadCombatState.result?.winner).toBe('player');
    expect(harness.get().currency).toBeGreaterThan(100);
    expect(harness.get().combatWins).toBe(1);
    expect(harness.get().squadCombatWins).toBe(1);
    expect(harness.get().playerFaction.members[0].adventureTrust).toBeGreaterThan(60);
    expect(harness.get().partyState.members[0].adventureTrust).toBeGreaterThan(60);
    expect(harness.get().addGameLog).toHaveBeenCalledWith(
      'combat',
      expect.stringContaining('小队战结算'),
      expect.objectContaining({ winner: 'player' }),
    );
  });
});
