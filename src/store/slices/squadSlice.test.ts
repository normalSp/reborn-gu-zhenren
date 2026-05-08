import { describe, expect, it } from 'vitest';
import type { SquadMember } from '../../types';
import { createSquadSlice } from './squadSlice';

function makeMember(overrides: Partial<SquadMember> = {}): SquadMember {
  return {
    id: overrides.id ?? 'npc-1',
    name: overrides.name ?? '测试队友',
    path: overrides.path ?? '力道',
    realm: overrides.realm ?? 3,
    loyalty: overrides.loyalty ?? 55,
    personality: overrides.personality ?? 'loyal',
    alive: overrides.alive ?? true,
    hp: overrides.hp ?? 100,
    maxHp: overrides.maxHp ?? 100,
    atk: overrides.atk ?? 35,
    def: overrides.def ?? 12,
    adventureTrust: overrides.adventureTrust ?? 72,
    interestDrive: overrides.interestDrive ?? 35,
    ...overrides,
  };
}

function createHarness(members: SquadMember[]) {
  let state: any = {
    turn: 20,
    gameTime: { ap: 3, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' },
    currency: 1000,
    materialBag: {},
    playerFaction: { members },
    spendYuanStone(amount: number) {
      if (state.currency < amount) return false;
      state.currency -= amount;
      return true;
    },
    addYuanStone(amount: number) {
      state.currency += amount;
    },
    addMaterial(materialName: string, quantity: number) {
      state.materialBag = {
        ...state.materialBag,
        [materialName]: (state.materialBag[materialName] || 0) + quantity,
      };
    },
    addGameLog: () => undefined,
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state = { ...state, ...createSquadSlice(set, get) };
  return {
    get: () => state,
    setTurn: (turn: number) => { state.turn = turn; },
  };
}

describe('squadSlice recruitment and party composition', () => {
  it('adds trusted members to party, consumes AP and pauses faction role output', () => {
    const member = makeMember({ id: 'trusted', adventureTrust: 80 });
    const harness = createHarness([member]);

    const result = harness.get().addMemberToParty('trusted');

    expect(result.success).toBe(true);
    expect(harness.get().partyState.members.map((m: SquadMember) => m.id)).toEqual(['trusted']);
    expect(harness.get().gameTime.ap).toBe(2);
    expect(harness.get().partyState.memberRolePausedUntil.trusted).toBe(23);
  });

  it('charges mercenary members through the economy service', () => {
    const member = makeMember({ id: 'merc', adventureTrust: 25, interestDrive: 80, realm: 4 });
    const harness = createHarness([member]);

    const result = harness.get().addMemberToParty('merc');

    expect(result.success).toBe(true);
    expect(result.evaluation?.disposition).toBe('mercenary');
    expect(harness.get().currency).toBe(520);
  });

  it('blocks unavailable or unwilling members', () => {
    const member = makeMember({ id: 'refuse', adventureTrust: 20, interestDrive: 20 });
    const harness = createHarness([member]);

    const result = harness.get().addMemberToParty('refuse');

    expect(result.success).toBe(false);
    expect(result.evaluation?.disposition).toBe('unwilling');
    expect(harness.get().partyState.members).toHaveLength(0);
  });

  it('starts and resolves squad dispatch through gated rewards', () => {
    const member = makeMember({ id: 'dispatcher', path: '智道', adventureTrust: 95, interestDrive: 80 });
    const harness = createHarness([member]);

    const start = harness.get().startSquadDispatch('dispatcher', 'trade');

    expect(start.success).toBe(true);
    expect(harness.get().gameTime.ap).toBe(2);
    expect(harness.get().squadDispatchState.activeAssignments).toHaveLength(1);
    expect(harness.get().playerFaction.members[0].status).toBe('expedition');

    harness.setTurn(start.assignment!.endsTurn);
    const resolved = harness.get().resolveSquadDispatch(start.assignment!.id);

    expect(resolved.success).toBe(true);
    expect(resolved.result?.success).toBe(true);
    expect(harness.get().squadDispatchState.activeAssignments).toHaveLength(0);
    expect(harness.get().squadDispatchState.recentResults).toHaveLength(1);
    expect(harness.get().currency).toBeGreaterThan(1000);
    expect(harness.get().playerFaction.members[0].status).toBe('available');
  });
});
