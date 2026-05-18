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

test.describe('v0.14.0-b3 faction goal prerequisites', () => {
  test('shows Bai and caravan prerequisites without faction transfer or route entry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');

    await panel.locator('[data-testid="free-goal-input"]').fill('我要投靠白家');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    const factionPanel = panel.locator('[data-testid="free-goal-faction-prerequisites"]');
    await expect(factionPanel).toContainText('阵营/身份目标前置');
    await expect(factionPanel).toContainText('白家接触前置');
    await expect(factionPanel).toContainText('只显示前置，不转阵营');
    await expect(factionPanel).toContainText('跨阵营前置');
    await expect(factionPanel).toContainText('禁止 faction_transfer');
    await expect(factionPanel).toContainText('不改变阵营');
    await expect(factionPanel).not.toContainText('投靠成功');

    await panel.locator('[data-testid="free-goal-input"]').fill('我要加入商队去商家城');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await expect(factionPanel).toContainText('商队接触前置');
    await expect(factionPanel).toContainText('商家城公开入口前置');
    await expect(factionPanel).toContainText('不直接加入商队');
    await expect(factionPanel).toContainText('不开放完整城市系统');
    await expect(factionPanel).not.toContainText('进入商家城成功');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).playerGoalCount).toBe(0);
    expect((summary.materialBag as any).faction_transfer_granted).toBeUndefined();
    expect((summary.materialBag as any).route_entered).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
