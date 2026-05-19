import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startMidgameAnchorDemo: () => Record<string, unknown>;
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

async function openMidgameDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startMidgameAnchorDemo());
  return consoleErrors;
}

test.describe('v0.9 product route closure remains compatible after a2', () => {
  test('desktop shows training-ground clue policy, debug demo grouping, and current version stamp', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openMidgameDemo(page);

    await expect(page.getByTestId('game-screen-shell')).toBeVisible();
    await expect(page.getByTestId('app-version-label')).toContainText('v1.0.0');
    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-dev_demo]:visible').click();
    await expect(page.locator('[data-testid=debug-battlefield-demo-group]:visible')).toBeVisible();
    await page.locator('[data-testid=open-battlefield-demo]:visible').click();
    await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
    await expect(page.getByTestId('battlefield-board')).toHaveAttribute('data-grid-size', '5x3');
    await page.getByLabel('关闭凡战棋盘').click();

    await page.locator('[data-testid=world-hub-tab-training_ground]:visible').click();
    await expect(page.locator('[data-testid="training-ground-panel"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="training-ground-clue-policy"]:visible')).toContainText('v0.9.0-a3');
    await expect(page.locator('[data-testid="training-ground-empty-policy"]:visible')).toContainText('当前没有可出发道场线索');
    await expect(page.locator('[data-testid="training-ground-empty-policy"]:visible')).toContainText(/剧情|线索|势力/);

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect(summary).toBeTruthy();
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps route explanations readable without overlap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openMidgameDemo(page);

    await expect(page.getByTestId('app-version-label')).toContainText('v1.0.0');
    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-dev_demo]:visible').click();
    await expect(page.locator('[data-testid=debug-battlefield-demo-group]:visible')).toBeVisible();

    await page.locator('[data-testid=world-hub-tab-training_ground]:visible').click();
    const panel = page.locator('[data-testid="training-ground-panel"]:visible');
    await expect(panel).toBeVisible();
    await expect(page.locator('[data-testid="training-ground-empty-policy"]:visible')).toBeVisible();
    const box = await page.locator('[data-testid="training-ground-empty-policy"]:visible').boundingBox();
    expect(box?.width).toBeGreaterThan(300);

    expect(consoleErrors).toEqual([]);
  });
});
