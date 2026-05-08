import { describe, expect, it } from 'vitest';
import {
  generateAuctionPricingAudit,
  generatePurchasingPowerTable,
} from './economy-simulation';

describe('v0.7.0-pre treasure yellow heaven economy gate', () => {
  it('reports runtime auction prices against the economy-balance candidate table', () => {
    const audit = generateAuctionPricingAudit();
    const rank6Gu = audit.find(row => row.category === 'immortalGu' && row.target.startsWith('6转'));
    const rank6Recipe = audit.find(row => row.category === 'recipe');
    const killerMoveComplete = audit.find(row => row.category === 'killerMoveComplete');
    const immortalMaterials = audit.filter(row => row.category === 'immortalMaterial');

    expect(rank6Gu?.runtimePrice).toBe(3600);
    expect(rank6Gu?.simulatedPrice).toBe(3600);
    expect(rank6Gu?.severity).toBe('ok');
    expect(rank6Recipe?.severity).toBe('ok');
    expect(killerMoveComplete?.severity).toBe('ok');
    expect(immortalMaterials.length).toBeGreaterThan(0);
    expect(immortalMaterials.every(row => row.severity === 'ok')).toBe(true);
  });

  it('keeps short-term six-turn purchasing power below stable rank-6 immortal-gu buying', () => {
    const table = generatePurchasingPowerTable();
    const turn20 = table.find(row => row.turns === 20);
    const turn100 = table.find(row => row.turns === 100);
    const turn300 = table.find(row => row.turns === 300);

    expect(turn20).toMatchObject({
      immortalCurrency: 720,
      rank6ImmortalGuBaseCount: 0,
      canReliablyBuyRank6ImmortalGu: false,
    });
    expect(turn100?.rank6ImmortalGuBaseCount).toBe(1);
    expect(turn100?.rank6MajorGoalCount).toBe(1);
    expect(turn300?.rank6ImmortalGuBaseCount).toBe(3);
    expect(turn300?.rank7PlusRemainsStrategic).toBe(true);
  });
});
