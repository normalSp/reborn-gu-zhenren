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

test.describe('v0.15.0-b1 supply and feeding preparation', () => {
  test('records supply and liquor-worm feeding gaps without resources or market unlocks', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();
    await panel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await panel.locator('[data-testid="free-goal-cover-tracks-run"]').click();
    await panel.locator('[data-testid="free-goal-mountain-pass-route-run"]').click();

    const prepPanel = panel.locator('[data-testid="free-goal-supply-feeding-prep-panel"]');
    await expect(prepPanel).toContainText('补给/喂养缺口');
    await expect(prepPanel).toContainText('不发材料');
    await expect(prepPanel).toContainText('不开放市场');
    await prepPanel.locator('[data-testid="free-goal-supply-feeding-prep"]').click();

    await expect(panel).toContainText('已整理补给与喂养缺口');
    await expect(panel).toContainText('supply:supply_qingmao_route_food_water_pack');
    await expect(panel).toContainText('feeding:feeding_liquor_worm_wine_stock_pressure');
    await expect(panel).not.toContainText('材料已入库');
    await expect(panel).not.toContainText('市场已开放');
    await expect(panel).not.toContainText('路线进入成功');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'qingmao_supply_feeding_preparation_baseline',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_qingmao_supply_preparation_guyue_shanzhai_watch',
    ]));
    expect((summary.livingWorld as any).npcMemoryIds).toEqual(expect.arrayContaining([
      'npc_memory_qingmao_supply_feeding_local_watch',
    ]));
    expect((summary.materialBag as any).qingmao_supply_feeding_preparation_baseline).toBeUndefined();
    expect((summary as any).currentDomain).toBe('南疆');
    expect(consoleErrors).toEqual([]);
  });
});
