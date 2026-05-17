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

test.describe('v0.14.0-b4 free-goal summary priority', () => {
  test('summarizes route, faction prerequisites, and social impact before detailed panels on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-free_goal').click();
    await expect(page.locator('[data-testid="mobile-side-sheet"]:visible')).toBeVisible();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');

    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();
    await panel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await panel.locator('[data-testid="free-goal-cover-tracks-run"]').click();

    const summary = panel.locator('[data-testid="free-goal-next-step-summary"]');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('优先摘要');
    await expect(summary.locator('[data-testid="free-goal-summary-route"]')).toContainText('山路逃离路线');
    await expect(summary.locator('[data-testid="free-goal-summary-social"]')).toContainText('公开信号');
    await expect(summary).toContainText('摘要只排序信息');
    await expect(summary).toContainText('不转阵营');
    await expect(summary).toContainText('不发奖励');
    await expect(summary).toContainText('不进地点');
    await expect(summary).not.toContainText('春秋蝉');
    await expect(summary).not.toContainText('重生');
    await expect(summary).not.toContainText('奖励已发放');

    await expect(panel.locator('[data-testid="free-goal-social-impact"]')).toBeVisible();
    await expect(panel.locator('[data-testid="free-goal-route-continuation"]')).toBeVisible();

    await panel.locator('[data-testid="free-goal-input"]').fill('我要投靠白家');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await expect(summary.locator('[data-testid="free-goal-summary-faction"]')).toContainText('白家接触前置');
    await expect(summary.locator('[data-testid="free-goal-summary-faction"]')).toContainText('跨阵营前置');
    await expect(panel.locator('[data-testid="free-goal-faction-prerequisites"]')).toContainText('只显示前置，不转阵营');
    await expect(summary).not.toContainText('投靠成功');

    const stateSummary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((stateSummary.livingWorld as any).playerGoalCount).toBe(1);
    expect((stateSummary.materialBag as any).route_entered).toBeUndefined();
    expect((stateSummary.materialBag as any).faction_transfer_granted).toBeUndefined();
    expect((stateSummary as any).currentDomain).toBe('南疆');
    expect(consoleErrors).toEqual([]);
  });
});
