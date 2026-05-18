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

test.describe('v0.15.0-b3 caravan and market window', () => {
  test('records a candidate market window without trading, price tables, or inventory unlocks', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，并找商队问价');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();
    await panel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await panel.locator('[data-testid="free-goal-cover-tracks-run"]').click();
    await panel.locator('[data-testid="free-goal-mountain-pass-route-run"]').click();
    await panel.locator('[data-testid="free-goal-supply-feeding-prep"]').click();
    await panel.locator('[data-testid="free-goal-refinement-boundary"]').click();

    const marketPanel = panel.locator('[data-testid="free-goal-market-window-panel"]');
    await expect(marketPanel).toContainText('商队/市场窗口');
    await expect(marketPanel).toContainText('不买卖');
    await expect(marketPanel).toContainText('不写价格');
    await expect(marketPanel).toContainText('不开放库存');
    await marketPanel.locator('[data-testid="free-goal-market-window"]').click();

    await expect(panel).toContainText('已试探商队与市场窗口');
    await expect(panel).toContainText('market:market_caravan_contact_window_first_touch');
    await expect(panel).toContainText('market:market_trade_requirement_identity_and_guarantee');
    await expect(panel).toContainText('market:market_public_reason_requirement');
    await expect(panel).not.toContainText('市场已开放');
    await expect(panel).not.toContainText('价格表已生成');
    await expect(panel).not.toContainText('库存已开放');
    await expect(panel).not.toContainText('加入商队成功');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'qingmao_market_window_candidate_baseline',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_qingmao_market_window_caravan_opportunity',
      'faction_pressure_qingmao_market_window_guyue_shanzhai_attention',
    ]));
    expect((summary.livingWorld as any).npcMemoryIds).toEqual(expect.arrayContaining([
      'npc_memory_qingmao_market_window_caravan_runner',
    ]));
    expect((summary.materialBag as any).qingmao_market_window_candidate_baseline).toBeUndefined();
    expect((summary as any).currentDomain).toBe('南疆');
    expect(consoleErrors).toEqual([]);
  });
});
