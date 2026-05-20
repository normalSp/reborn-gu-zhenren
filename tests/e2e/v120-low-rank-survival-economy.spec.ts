import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startQingmaoRegionActionDemo: () => Record<string, unknown>;
    getStateSummary: () => Record<string, unknown>;
  };
};

async function installConsoleGuards(page: Page): Promise<string[]> {
  const errors: string[] = [];
  const fatalPatterns = [
    /Maximum update depth exceeded/i,
    /\[PIPE\]\s+ZOD_FAIL/i,
    /Cannot read properties/i,
    /Uncaught/i,
    /ReferenceError/i,
    /TypeError/i,
  ];
  page.on('console', msg => {
    const text = msg.text();
    if (fatalPatterns.some(pattern => pattern.test(text))) errors.push(`[${msg.type()}] ${text}`);
  });
  page.on('pageerror', error => errors.push(`[pageerror] ${error.message}`));
  return errors;
}

async function openQingmaoRegionActionDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startQingmaoRegionActionDemo());
  return consoleErrors;
}

test.describe('v1.2 low-rank survival economy ledger', () => {
  test('writes only the v24 survivalEconomyState pressure ledger without prices, inventory, or trade settlement', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const freeGoalPanel = page.locator('[data-testid="free-goal-panel"]:visible');
    await freeGoalPanel.locator('[data-testid="free-goal-input"]').fill('我要离开青茅山，先整理补给、酒虫食料、残方材料缺口，再试探商队问价');
    await freeGoalPanel.locator('[data-testid="free-goal-adjudicate"]').click();
    await freeGoalPanel.locator('[data-testid="free-goal-confirm"]').click();

    await freeGoalPanel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await freeGoalPanel.locator('[data-testid="free-goal-supply-feeding-prep"]').click();

    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-survival_economy]:visible').click();
    const panel = page.locator('[data-testid="low-rank-survival-economy-panel"]:visible');

    await expect(panel.locator('[data-testid="v120-survival-status"]')).toContainText('低阶生存经济');
    await expect(panel.locator('[data-testid="v120-survival-status"]')).toContainText('压力投影可读');
    await expect(panel.locator('[data-testid="v120-survival-ledger-state"]')).toContainText('尚未登记');
    await expect(panel.locator('[data-testid="v120-survival-b3-panel"]')).toContainText('不判成败');
    await expect(panel.locator('[data-testid="v120-survival-b4-panel"]')).toContainText('不成交');

    await panel.locator('[data-testid="v120-survival-b3-refinement-action"]').click();
    await expect(panel.locator('[data-testid="v120-survival-action-result"]')).toContainText('不消耗材料');
    await panel.locator('[data-testid="v120-survival-b4-market-action"]').click();
    await expect(panel.locator('[data-testid="v120-survival-action-result"]')).toContainText('不买卖');

    await expect(panel.locator('[data-testid="v120-survival-pressure-route_supply"]')).toContainText('路线补给压力');
    await expect(panel.locator('[data-testid="v120-survival-pressure-gu_upkeep"]')).toContainText('蛊虫喂养与维护');
    await expect(panel.locator('[data-testid="v120-survival-pressure-refinement_preparation"]')).toContainText('炼养用准备');
    await expect(panel.locator('[data-testid="v120-survival-pressure-trade_window"]')).toContainText('不写价格');
    await expect(panel.locator('[data-testid="v120-survival-pressure-gray_trade_boundary"]')).toContainText('黑市');
    await expect(panel.locator('[data-testid="v120-survival-boundaries"]')).toContainText('允许写 survivalEconomyState');
    await expect(panel.locator('[data-testid="v120-survival-boundaries"]')).toContainText('不写正式价格');
    await expect(panel.locator('[data-testid="v120-survival-boundaries"]')).toContainText('DeepSeek 只能写压力');
    await expect(panel).not.toContainText('正式成交');
    await expect(panel).not.toContainText('价格表已开放');

    await panel.locator('[data-testid="v120-survival-ledger-sync"]').click();
    await expect(panel.locator('[data-testid="v120-survival-ledger-state"]')).toContainText('已登记');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.materialBag as any).survivalEconomyState).toBeUndefined();
    expect((summary.materialBag as any).formal_price_table).toBeUndefined();
    expect((summary.materialBag as any).formal_market_trade).toBeUndefined();
    expect((summary.survivalEconomy as any).status).toBe('pressure_tracked');
    expect((summary.survivalEconomy as any).ledgerCount).toBeGreaterThanOrEqual(6);
    expect((summary.survivalEconomy as any).ledgerCategories).toEqual(expect.arrayContaining([
      'route_supply',
      'gu_upkeep',
      'refinement_preparation',
      'trade_window',
      'gray_trade_boundary',
      'anti_farm',
    ]));
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'qingmao_refinement_fragment_boundary_baseline',
      'qingmao_market_window_candidate_baseline',
    ]));
    expect(consoleErrors).toEqual([]);
  });
});
