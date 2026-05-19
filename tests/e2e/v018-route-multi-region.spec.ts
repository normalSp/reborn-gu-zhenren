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

test.describe('v0.18.0 route multi-region bridge', () => {
  test('bridges Qingmao exit threshold, region facts, pressure and outer entries without route/location authority', async ({ page }) => {
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

    const v018Panel = panel.locator('[data-testid="free-goal-v018-route-panel"]');
    await expect(v018Panel).toContainText('v0.18 南疆路线承接');
    await expect(v018Panel).toContainText('门槛可确认');
    await expect(v018Panel.locator('[data-testid="free-goal-v018-milestones"]')).toContainText('补给/喂养');
    await v018Panel.locator('[data-testid="free-goal-v018-route-threshold"]').click();

    await expect(panel).toContainText('已确认 v0.18 离山门槛');
    await v018Panel.locator('[data-testid="free-goal-v018-candidate-continuation"]').click();
    await expect(panel).toContainText('已承接南疆低阶路线候选视图');
    await expect(v018Panel.locator('[data-testid="free-goal-v018-region-facts"]')).toContainText('南疆低阶公开路线语义');
    await expect(v018Panel.locator('[data-testid="free-goal-v018-region-facts"]')).toContainText('商家城外缘');
    await v018Panel.locator('[data-testid="free-goal-v018-pressure-backflow"]').click();

    await expect(panel).toContainText('已回流路线压力');
    await expect(v018Panel.locator('[data-testid="free-goal-v018-route-pressure"]')).toContainText('补给');
    await expect(v018Panel.locator('[data-testid="free-goal-v018-route-pressure"]')).toContainText('追索');
    await expect(v018Panel.locator('[data-testid="free-goal-v018-entry-boundaries"]')).toContainText('商队同行/递话外缘');
    await expect(v018Panel.locator('[data-testid="free-goal-v018-entry-boundaries"]')).toContainText('散修/独行落脚外缘');
    await expect(v018Panel.locator('[data-testid="free-goal-v018-entry-boundaries"]')).toContainText('商家城外缘公共入口');
    await expect(v018Panel).toContainText('不写 route_entered');
    await expect(v018Panel).not.toContainText('v018_hidden_982eba1c3730');
    await expect(v018Panel).not.toContainText('route_entered 已写入');
    await expect(v018Panel).not.toContainText('进入商家城');
    await expect(v018Panel).not.toContainText('加入商队成功');
    await expect(v018Panel).not.toContainText('奖励已发放');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'v018_qingmao_route_entry_threshold_commitment',
      'v018_qingmao_route_candidate_continuation_view',
      'v018_qingmao_route_pressure_backflow_baseline',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_v018_route_threshold_window',
      'faction_pressure_v018_pressure_supply_gap',
      'faction_pressure_v018_pressure_pursuit',
    ]));
    expect((summary.materialBag as any).route_entered).toBeUndefined();
    expect((summary.materialBag as any).v018_qingmao_route_entry_threshold_commitment).toBeUndefined();
    expect((summary as any).currentDomain).toBe('南疆');
    expect(consoleErrors).toEqual([]);
  });
});
