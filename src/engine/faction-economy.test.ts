import { describe, expect, it } from 'vitest';
import { calculateFactionEconomyLedger } from './faction-economy';
import type { PlayerFaction } from '../types';

function makeFaction(overrides: Partial<PlayerFaction> = {}): PlayerFaction {
  return {
    id: 'faction_test',
    name: '测试山寨',
    domain: '南疆',
    type: '散修联盟',
    level: 1,
    reputation: 100,
    resources: { 元石: 500, 仙元石: 0, 蛊材: {} },
    members: [
      { id: 'm1', name: '甲', path: '力道', realm: 5, loyalty: 60, personality: 'cautious', alive: true },
      { id: 'm2', name: '乙', path: '木道', realm: 5, loyalty: 55, personality: 'loyal', alive: true },
      { id: 'm3', name: '丙', path: '金道', realm: 5, loyalty: 50, personality: 'cunning', alive: true },
    ] as any,
    maxMembers: 3,
    foundedAt: 1,
    ...overrides,
  };
}

describe('v0.7.0-pre faction five-ledger economy', () => {
  it('settles immortal faction income as a five-ledger result instead of raw trade profit', () => {
    const ledger = calculateFactionEconomyLedger(makeFaction(), 6, 10);

    expect(ledger.currencyKind).toBe('仙元石');
    expect(ledger.grossIncome).toBeGreaterThan(ledger.netIncome);
    expect(ledger.maintenanceCost).toBeGreaterThan(0);
    expect(ledger.riskLoss).toBeGreaterThanOrEqual(0);
    expect(ledger.feedingReserved).toBeGreaterThan(0);
    expect(ledger.netIncome).toBeLessThanOrEqual(2);
  });

  it('keeps 100-turn immortal faction net income inside the pre-v0.7.0 pacing threshold', () => {
    const faction = makeFaction();
    const total = Array.from({ length: 100 }, (_, index) =>
      calculateFactionEconomyLedger(faction, 6, index + 1).netIncome
    ).reduce((sum, value) => sum + value, 0);

    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(220);
  });

  it('keeps mortal factions on yuan-stone bookkeeping', () => {
    const ledger = calculateFactionEconomyLedger(makeFaction(), 5, 10);

    expect(ledger.currencyKind).toBe('元石');
    expect(ledger.netIncome).toBeLessThan(ledger.grossIncome);
  });
});
