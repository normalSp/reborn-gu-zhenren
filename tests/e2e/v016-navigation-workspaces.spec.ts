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

test.describe('v0.16.0 navigation workspaces', () => {
  test('desktop bottom nav exposes six player groups and moves legacy entries into workspaces', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);
    const bottomNav = page.getByTestId('bottom-nav');

    await expect(bottomNav).toBeVisible();
    await expect(page.getByTestId('side-panel-map')).toBeVisible();
    await expect(page.getByTestId('side-panel-actions')).toBeVisible();
    await expect(page.getByTestId('side-panel-role')).toBeVisible();
    await expect(page.getByTestId('side-panel-gu_dao')).toBeVisible();
    await expect(page.getByTestId('side-panel-world')).toBeVisible();
    await expect(page.getByTestId('side-panel-records')).toBeVisible();
    await expect(page.locator('[data-testid^="side-panel-"]')).toHaveCount(6);
    await expect(page.getByTestId('side-panel-free_goal')).toHaveCount(0);
    await expect(page.getByTestId('side-panel-inheritance')).toHaveCount(0);
    await expect(page.getByTestId('side-panel-story_anchor')).toHaveCount(0);
    await expect(page.getByTestId('side-panel-gu_inventory')).toHaveCount(0);
    await expect(bottomNav).not.toContainText('青茅');
    await expect(bottomNav).not.toContainText('凡战');
    await expect(bottomNav).not.toContainText('群像');
    await expect(bottomNav).not.toContainText('大阵');

    await page.getByTestId('side-panel-actions').click();
    await expect(page.locator('[data-testid=action-hub-panel]:visible')).toBeVisible();
    await expect(page.locator('[data-testid=action-panel]:visible')).toBeVisible();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    await expect(page.locator('[data-testid=free-goal-panel]:visible')).toBeVisible();
    await expect(page.locator('[data-testid=action-hub-boundary-note]:visible')).toContainText('DeepSeek 不写奖励');

    await page.getByTestId('side-panel-gu_dao').click();
    await expect(page.locator('[data-testid=gu-dao-panel]:visible')).toBeVisible();
    await expect(page.locator('[data-testid=gu-inventory-panel]:visible')).toBeVisible();
    await page.locator('[data-testid=gu-dao-tab-refine]:visible').click();
    await expect(page.locator('[data-testid="refine-panel"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid=gu-dao-boundary-note]:visible')).toContainText('不私算蛊方成功');

    await page.getByTestId('side-panel-world').click();
    await expect(page.locator('[data-testid=world-hub-panel]:visible')).toBeVisible();
    await expect(page.locator('[data-testid=world-hub-overview]:visible')).toContainText('低阶青茅开局');
    await page.locator('[data-testid=world-hub-tab-dev_demo]:visible').click();
    await expect(page.locator('[data-testid=debug-battlefield-demo-group]:visible')).toBeVisible();
    await expect(page.locator('[data-testid=debug-battlefield-demo-group]:visible')).toContainText('不出现在正式底栏');

    await page.getByTestId('side-panel-records').click();
    await expect(page.locator('[data-testid=records-hub-panel]:visible')).toBeVisible();
    await expect(page.locator('[data-testid=records-hub-boundary-note]:visible')).toContainText('行动账本');

    expect(consoleErrors).toEqual([]);
  });

  test('mobile keeps grouped workspaces operable without reintroducing legacy bottom buttons', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openQingmaoRegionActionDemo(page);
    const bottomNav = page.getByTestId('bottom-nav');

    await expect(page.locator('[data-testid^="side-panel-"]')).toHaveCount(6);
    await expect(bottomNav).not.toContainText('自由目标');
    await expect(bottomNav).not.toContainText('炼蛊');
    await expect(bottomNav).not.toContainText('宿命');

    await page.getByTestId('side-panel-actions').click();
    await expect(page.locator('[data-testid=mobile-side-sheet]:visible')).toBeVisible();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    await expect(page.locator('[data-testid=free-goal-panel]:visible')).toBeVisible();

    await page.getByTestId('side-panel-gu_dao').click();
    await page.locator('[data-testid=gu-dao-tab-material_bag]:visible').click();
    await expect(page.locator('[data-testid="material-bag-panel"]:visible')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
