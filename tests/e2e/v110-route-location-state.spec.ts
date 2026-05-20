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

test.describe('v1.1 route/location state', () => {
  test('syncs routeLocationState after v018/v100 route evidence without old route fields', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，找商队或散修路线去南疆外面落脚');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();

    await panel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await panel.locator('[data-testid="free-goal-cover-tracks-run"]').click();
    await panel.locator('[data-testid="free-goal-mountain-pass-route-run"]').click();
    await panel.locator('[data-testid="free-goal-supply-feeding-prep"]').click();
    await panel.locator('[data-testid="free-goal-refinement-boundary"]').click();
    await panel.locator('[data-testid="free-goal-market-window"]').click();
    await panel.locator('[data-testid="free-goal-v018-route-threshold"]').click();
    await panel.locator('[data-testid="free-goal-v018-candidate-continuation"]').click();
    await panel.locator('[data-testid="free-goal-v018-pressure-backflow"]').click();
    await panel.locator('[data-testid="free-goal-v100-continuity-run"]').click();

    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-route_location]:visible').click();
    const routePanel = page.locator('[data-testid="route-location-panel"]:visible');
    await expect(routePanel).toContainText('路线');
    await routePanel.locator('[data-testid="route-location-sync"]').click();

    await expect(routePanel.locator('[data-testid="route-location-status"]')).toContainText('南疆外缘投影');
    await expect(routePanel.locator('[data-testid="route-location-scope"]')).toContainText('南疆早期外缘');
    await expect(routePanel.locator('[data-testid="route-location-boundaries"]')).toContainText('禁止：完整南疆');
    await expect(routePanel).not.toContainText('商家城核心已开放');
    await expect(routePanel).not.toContainText('奖励已发放');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.routeLocation as any)).toMatchObject({
      status: 'outer_edge_projection',
      routeId: 'southern_border_low_rank_route',
      locationScopeId: 'southern_border_outer_edge',
      regionScopeId: 'southern_border_outer_edge',
      authority: 'route_location_engine',
    });
    expect((summary.materialBag as any).route_entered).toBeUndefined();
    expect((summary.materialBag as any).currentRoute).toBeUndefined();
    expect((summary.materialBag as any).currentRegion).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
