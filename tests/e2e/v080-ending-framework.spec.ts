import { expect, test, type Locator, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startEndingFrameworkDemo: () => Record<string, unknown>;
    getStateSummary: () => Record<string, unknown>;
    clearRuntime: () => void;
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

async function openEndingDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startEndingFrameworkDemo());
  await page.getByTestId('side-panel-ending').click();
  await expect(visibleEndingPanel(page)).toBeVisible();
  return consoleErrors;
}

function visibleEndingPanel(page: Page): Locator {
  return page.locator('[data-testid="ending-panel"]:visible');
}

test.describe('v0.8.0-c1 ending framework UI', () => {
  test('desktop previews candidates, evidence, pressure, and commits to the game-over summary', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openEndingDemo(page);
    const panel = visibleEndingPanel(page);

    await expect(panel.getByTestId('ending-state-status')).toBeVisible();
    await expect(panel.getByTestId('ending-evidence')).toBeVisible();
    await expect(panel.getByTestId('ending-candidate-list')).toBeVisible();
    await expect(panel.getByTestId('ending-pressure-log')).toBeVisible();
    await expect(panel.getByTestId('ending-resolution-steps')).toBeVisible();

    const summaryBefore = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const endingBefore = summaryBefore.ending as Record<string, unknown>;
    expect(Number(endingBefore.candidateCount)).toBeGreaterThan(0);
    expect(Number(endingBefore.canCommitCount)).toBeGreaterThan(0);

    await panel.locator('[data-testid^="ending-commit-button-"]:not([disabled])').first().evaluate((button: Element) => {
      (button as HTMLButtonElement).click();
    });
    await expect(panel).toBeHidden();
    await expect(page.locator('h1').first()).toBeVisible();

    const summaryAfter = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const endingAfter = summaryAfter.ending as Record<string, unknown>;
    expect(Number(endingAfter.lastStepCount)).toBeGreaterThanOrEqual(3);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps the resolver readable and operable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openEndingDemo(page);
    const panel = visibleEndingPanel(page);

    await expect(panel).toBeVisible();
    await expect(panel.getByTestId('ending-state-status')).toBeVisible();
    await expect(panel.getByTestId('ending-candidate-list')).toBeVisible();
    await expect(panel.locator('[data-testid^="ending-commit-button-"]').first()).toBeVisible();

    const panelBox = await panel.boundingBox();
    const candidateBox = await panel.getByTestId('ending-candidate-list').boundingBox();
    expect(panelBox?.width).toBeGreaterThan(300);
    expect(candidateBox?.height).toBeGreaterThan(120);
    expect(consoleErrors).toEqual([]);
  });
});
