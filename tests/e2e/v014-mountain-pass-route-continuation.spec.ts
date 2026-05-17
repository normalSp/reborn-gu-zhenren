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

test.describe('v0.14.0-b2 mountain-pass route continuation', () => {
  test('continues Qingmao mountain-pass escape as a candidate without route entry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-free_goal').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();
    await panel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await panel.locator('[data-testid="free-goal-cover-tracks-run"]').click();

    const routePanel = panel.locator('[data-testid="free-goal-route-continuation"]');
    await expect(routePanel).toContainText('山路逃离路线');
    await expect(routePanel).toContainText('候选，不是地点进入');
    await routePanel.locator('[data-testid="free-goal-mountain-pass-route-run"]').click();

    await expect(panel).toContainText('已承接山路逃离路线');
    await expect(routePanel).toContainText('不改变阵营');
    await expect(routePanel).toContainText('不发奖励');
    await expect(routePanel).not.toContainText('route_entered 已写入');
    await expect(routePanel).not.toContainText('投靠成功');
    await expect(routePanel).not.toContainText('春秋蝉');
    await expect(routePanel).not.toContainText('奖励已发放');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).playerGoalCount).toBe(1);
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'qingmao_escape_route_preparation_baseline',
      'qingmao_escape_tracks_cover_baseline',
      'qingmao_mountain_pass_route_continuation_candidate',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_qingmao_mountain_pass_route_window',
      'faction_pressure_qingmao_mountain_pass_guyue_shanzhai_pursuit_attention',
    ]));
    expect((summary.livingWorld as any).npcMemoryIds).toEqual(expect.arrayContaining([
      'npc_memory_qingmao_mountain_pass_outer_watch',
    ]));
    expect((summary.livingWorld as any).actionConsequenceCount).toBeGreaterThanOrEqual(4);
    expect((summary.materialBag as any).qingmao_mountain_pass_route_continuation_candidate).toBeUndefined();
    expect((summary as any).currentDomain).toBe('南疆');
    expect(consoleErrors).toEqual([]);
  });
});
