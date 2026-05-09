import { describe, expect, it } from 'vitest';
import { getMaterialShopItems, quoteMaterialSellBasePrice } from './shop-engine';

describe('merchant material selling', () => {
  it('quotes mortal material sell prices below buy-like shop prices', () => {
    const shelfItem = getMaterialShopItems('青茅山期', 2)[0];
    expect(shelfItem).toBeTruthy();

    const quote = quoteMaterialSellBasePrice(shelfItem.name, false);

    expect(quote.canSell).toBe(true);
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.price).toBeLessThan(shelfItem.price);
  });

  it('rejects unknown material names instead of creating a money sink/source', () => {
    const quote = quoteMaterialSellBasePrice('不存在的蛊材', false);

    expect(quote.canSell).toBe(false);
    expect(quote.price).toBe(0);
  });
});
