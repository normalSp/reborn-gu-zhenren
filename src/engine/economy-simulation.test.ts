import { describe, expect, it } from 'vitest';
import {
  auditRecipeEconomicClosure,
  getDefaultSimulationScenario,
  runIntegratedEconomySimulation,
  runSteadyPacingSimulation,
  simulateEconomy,
} from './economy-simulation';

describe('v0.7.0-pre economy pacing simulation', () => {
  it('keeps the agreed steady pacing across 20/100/300 turns', () => {
    const [turn20, turn100, turn300] = runSteadyPacingSimulation();

    expect(turn20.canBuyLowImmortalMaterial).toBe(true);
    expect(turn20.canReliablyBuyRank6ImmortalGu).toBe(false);

    expect(turn100.canCompleteOneRank6MajorGoal).toBe(true);
    expect(turn100.canRepeatRank6MajorGoal).toBe(false);

    expect(turn300.canHoldMultipleRank6Assets).toBe(true);
    expect(turn300.rank7PlusRemainsStrategic).toBe(true);
  });

  it('keeps mortal early-game economy out of immortal materials', () => {
    const result = simulateEconomy(getDefaultSimulationScenario('mortalEarly', 20));

    expect(result.immortalCurrency).toBe(0);
    expect(result.immortalMaterials).toBe(0);
    expect(result.canBuyLowImmortalMaterial).toBe(false);
  });

  it('finds no missing material or gu input references in recipe closure', () => {
    expect(auditRecipeEconomicClosure()).toEqual([]);
  });

  it('models six-turn income as aperture, faction, event, feeding and refinement ledgers', () => {
    const [turn20, turn100, turn300] = runIntegratedEconomySimulation();

    expect(turn20.netImmortalCurrency).toBeLessThan(3600);
    expect(turn20.canReliablyBuyRank6ImmortalGu).toBe(false);
    expect(turn20.feedingExpense).toBeGreaterThan(0);
    expect(turn20.factionNet).toBeLessThan(turn20.factionGross);

    expect(turn100.canCompleteOneRank6MajorGoal).toBe(true);
    expect(turn100.rank6MajorGoalCount).toBe(1);

    expect(turn300.rank6MajorGoalCount).toBeGreaterThanOrEqual(3);
    expect(turn300.rank7PlusRemainsStrategic).toBe(true);
    expect(turn300.feedingClosureBlockingCount).toBe(0);
  });
});
