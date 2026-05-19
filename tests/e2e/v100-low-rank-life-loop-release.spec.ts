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

test.describe('v1.0 low-rank life loop release', () => {
  test('accepts the release life loop only after continuity and low-rank loop prerequisites', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，靠补给、蛊虫和商队窗口在南疆低阶路线活下去');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();

    const lifeLoopPanel = panel.locator('[data-testid="free-goal-v100-life-loop-panel"]');
    await expect(lifeLoopPanel).toContainText('v1.0 低阶 life loop 验收');
    await expect(lifeLoopPanel).toContainText('需补闭环');
    await expect(lifeLoopPanel.locator('[data-testid="free-goal-v100-life-loop-run"]')).toBeDisabled();

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

    await expect(lifeLoopPanel).toContainText('可验收');
    await expect(lifeLoopPanel.locator('[data-testid="free-goal-v100-life-loop-checks"]')).toContainText('补给/喂养');
    await expect(lifeLoopPanel.locator('[data-testid="free-goal-v100-life-loop-pillars"]')).toContainText('蛊虫维护');
    await expect(lifeLoopPanel.locator('[data-testid="free-goal-v100-life-loop-redlines"]')).toContainText('正式收益');
    await lifeLoopPanel.locator('[data-testid="free-goal-v100-life-loop-run"]').click();
    await expect(panel).toContainText('已验收 v1.0 低阶蛊师 life loop 释出版闭环');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'v100_qingmao_southern_border_continuity_acceptance',
      'v100_low_rank_life_loop_release_acceptance',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_v100_life_loop_supply_cost',
      'faction_pressure_v100_life_loop_market_attention',
    ]));
    expect((summary.materialBag as any).material_reward).toBeUndefined();
    expect((summary.materialBag as any).formal_market_trade).toBeUndefined();
    expect((summary.materialBag as any).price_table).toBeUndefined();
    expect((summary.materialBag as any).commission_profit).toBeUndefined();
    expect((summary.materialBag as any).route_entered).toBeUndefined();
    expect((summary.materialBag as any).currentRoute).toBeUndefined();
    expect((summary.materialBag as any).currentRegion).toBeUndefined();
    await expect(lifeLoopPanel).not.toContainText('正式交易已开放');
    await expect(lifeLoopPanel).not.toContainText('奖励已发放');
    await expect(lifeLoopPanel).not.toContainText('炼蛊成功已写入');
    await expect(lifeLoopPanel).not.toContainText('商家城已开放');
    expect(consoleErrors).toEqual([]);
  });
});
