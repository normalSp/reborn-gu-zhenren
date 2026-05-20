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

test.describe('v1.3 social pressure projection', () => {
  test('shows projection-only social pressure without save-format or formal relation writes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const freeGoalPanel = page.locator('[data-testid="free-goal-panel"]:visible');
    await freeGoalPanel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，试探白家方向，同时遮掩公开痕迹');
    await freeGoalPanel.locator('[data-testid="free-goal-adjudicate"]').click();
    await freeGoalPanel.locator('[data-testid="free-goal-confirm"]').click();
    await freeGoalPanel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await freeGoalPanel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();

    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-social_pressure]:visible').click();
    const panel = page.locator('[data-testid="v130-social-pressure-panel"]:visible');

    await expect(panel.locator('[data-testid="v130-social-status"]')).toContainText('社会压力');
    await expect(panel.locator('[data-testid="v130-social-status"]')).toContainText('社会压力可读');
    await expect(panel.locator('[data-testid="v130-social-counts"]')).toContainText('势力压力');
    await expect(panel.locator('[data-testid="v130-social-counts"]')).toContainText('记忆痕迹');
    await expect(panel.locator('[data-testid="v130-social-projection-audit"]')).toContainText('stay_v24_no_bump');
    await expect(panel.locator('[data-testid="v130-social-projection-audit"]')).toContainText('none_projection_only');
    await expect(panel.locator('[data-testid="v130-social-projection-audit"]')).toContainText('不返回可写 ledger patch');
    await expect(panel.locator('[data-testid="v130-social-signal-faction_pressure"]').first()).toBeVisible();
    await expect(panel.locator('[data-testid="v130-social-signal-npc_memory"]').first()).toBeVisible();
    await expect(panel.locator('[data-testid="v130-social-signal-public_event"]').first()).toBeVisible();
    await expect(panel.locator('[data-testid="v130-social-signal-social_followup"]').first()).toBeVisible();
    await expect(panel.locator('[data-testid="v130-social-boundaries"]')).toContainText('不 bump SAVE_FORMAT_VERSION');
    await expect(panel.locator('[data-testid="v130-social-boundaries"]')).toContainText('不新增 socialRelationState');
    await expect(panel.locator('[data-testid="v130-social-boundaries"]')).toContainText('MiroFish');
    await expect(panel.locator('[data-testid="v130-social-boundaries"]')).toContainText('DeepSeek 只能写叙事');
    await expect(panel).not.toContainText('春秋蝉');
    await expect(panel).not.toContainText('重生');
    await expect(panel).not.toContainText('回溯');
    await expect(panel).not.toContainText('投靠成功');
    await expect(panel).not.toContainText('招揽成功');
    await expect(panel).not.toContainText('奖励已发放');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).factionPressureCount).toBeGreaterThan(0);
    expect((summary.livingWorld as any).npcMemoryCount).toBeGreaterThan(0);
    expect((summary.livingWorld as any).actionConsequenceCount).toBeGreaterThan(0);
    expect((summary as any).socialRelationState).toBeUndefined();
    expect((summary.materialBag as any).socialRelationState).toBeUndefined();
    expect((summary.materialBag as any).reward).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
