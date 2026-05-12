import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startTrainingGroundClueDemo: () => Record<string, unknown>;
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

async function openTrainingGroundDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startTrainingGroundClueDemo());
  return consoleErrors;
}

test.describe('v0.9.0-a3 training ground clue entry', () => {
  test('desktop shows clue ledger, consumes scene AP, and keeps debug folded', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openTrainingGroundDemo(page);

    await expect(page.getByTestId('app-version-label')).toContainText('v0.9.0-a3');
    await page.getByTestId('side-panel-training_ground').click();
    await expect(page.locator('[data-testid="training-ground-panel"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="training-ground-clue-policy"]:visible')).toContainText('剧情');
    await expect(page.locator('[data-testid="training-ground-clue-card"]:visible')).toContainText('青茅山炼蛊台竹牌');
    await expect(page.locator('[data-testid="training-ground-debug-legacy"]:visible')).toContainText('Debug/兼容入口');

    await page.locator('[data-testid="training-ground-departure-action"]:visible').first().click();
    await expect(page.locator('[data-testid="training-ground-panel"]:visible')).toContainText(/本地结算轨迹|冷却|道痕/);

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.trainingGround as any).clueCount).toBeGreaterThan(0);
    expect((summary.trainingGround as any).lastStepCount).toBeGreaterThan(0);
    expect((summary.trainingGround as any).sceneBudgetRemaining).toBeLessThan(3);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps clue cards and blockers readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openTrainingGroundDemo(page);

    await page.getByTestId('side-panel-training_ground').click();
    const panel = page.locator('[data-testid="training-ground-panel"]:visible');
    await expect(panel).toBeVisible();
    await expect(page.locator('[data-testid="training-ground-clue-card"]:visible')).toBeVisible();
    const box = await page.locator('[data-testid="training-ground-clue-card"]:visible').first().boundingBox();
    expect(box?.width).toBeGreaterThan(300);
    await expect(page.locator('[data-testid="choice-training-ground-tag-training_ground_clue"]:visible')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
