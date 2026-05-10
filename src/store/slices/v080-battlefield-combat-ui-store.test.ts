import { describe, expect, it, vi } from 'vitest';
import { EXCLUDE_FROM_SAVE } from '../initialState';
import { createCombatSlice } from './combatSlice';
import { buildBattlefieldActionCards } from '../../engine/v080-battlefield-ui-model';

function createHarness() {
  let state: any = {
    profile: { name: '测试蛊师', realm: { grand: 3, label: '三转中阶' } },
    vitals: {
      health: { current: 160, max: 180 },
      essence: { current: 100, max: 100 },
    },
    pathBuild: {
      primary: '月道',
      dao_marks: { 月道: 90 },
    },
    inventory: [],
    apertureInventory: { gu: [] },
    killMoves: [],
    addGameLog: vi.fn(),
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state = { ...state, ...createCombatSlice(set, get) };
  return { get: () => state };
}

describe('v0.8.0-a2 battlefield combat UI store bridge', () => {
  it('creates a non-persistent 5x3 demo battlefield and normal combat action cards', () => {
    const harness = createHarness();

    harness.get().initBattlefieldDemo();
    const battle = harness.get().battlefieldCombatState;

    expect(battle.grid.cells).toHaveLength(15);
    expect(battle.units.some((unit: any) => unit.side === 'enemy')).toBe(true);
    expect(harness.get().battlefieldPlaybackSteps).toEqual([]);
    expect(EXCLUDE_FROM_SAVE.has('battlefieldCombatState')).toBe(true);
    expect(EXCLUDE_FROM_SAVE.has('battlefieldPlaybackSteps')).toBe(true);

    const cards = buildBattlefieldActionCards(battle, 'player', 'gu');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every(card => card.action?.type === 'gu')).toBe(true);
    expect(cards.some(card => card.label === '月光蛊')).toBe(true);
    expect(cards.some(card => !card.disabledReason)).toBe(true);
    expect(cards.every(card => !['被动蛊不能主动发动', '需要强场景门槛', '非普通凡战行动'].includes(card.disabledReason || ''))).toBe(true);
  });

  it('selects target, executes via local engine, appends trace steps, and can retreat', () => {
    const harness = createHarness();
    harness.get().initBattlefieldDemo();

    harness.get().selectBattlefieldAction({ type: 'gu', actorId: 'player', guName: '月光蛊' });
    expect(harness.get().battlefieldValidation.validTargetCellIds).toContain('c3_1');

    harness.get().selectBattlefieldTarget('c3_1');
    expect(harness.get().battlefieldValidation.ok).toBe(true);

    harness.get().executeSelectedBattlefieldAction();
    const steps = harness.get().battlefieldPlaybackSteps;
    expect(steps.some((step: any) => step.kind === 'gu_use')).toBe(true);
    expect(steps.some((step: any) => step.kind === 'resource_spend')).toBe(true);
    expect(harness.get().battlefieldCombatState.units.find((unit: any) => unit.id === 'player').essence.current).toBeLessThan(100);

    harness.get().selectBattlefieldAction({ type: 'retreat', actorId: 'player' });
    harness.get().executeSelectedBattlefieldAction();
    expect(harness.get().battlefieldPlaybackSteps.some((step: any) => step.tags.includes('retreat'))).toBe(true);
  });
});
