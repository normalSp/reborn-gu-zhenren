import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startBattlefieldDemo: () => Record<string, unknown>;
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

async function openBattlefield(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startBattlefieldDemo());
  await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
  return consoleErrors;
}

test.describe('v0.8.0-a2 battlefield UI vertical slice', () => {
  test('desktop board can select gu range, execute, and play trace', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openBattlefield(page);

    await expect(page.getByTestId('battlefield-board')).toBeVisible();
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(15);
    await expect(page.getByTestId('battlefield-tab-gu')).toBeVisible();
    await expect(page.getByTestId('battlefield-tab-killer_move')).toBeVisible();

    await page.getByTestId('battlefield-action-gu:月光蛊').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeDisabled();
    await page.getByTestId('battlefield-cell-c3_1').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();
    await page.getByTestId('battlefield-execute-action').click();

    await expect(page.getByTestId('battlefield-step-gu_use').first()).toBeVisible();
    await expect(page.getByTestId('battlefield-step-resource_spend').first()).toBeVisible();
    await expect(page.getByTestId('battlefield-trace')).toContainText('gu_use');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const battlefield = summary.battlefieldCombat as Record<string, unknown>;
    expect(battlefield.cellCount).toBe(15);
    expect(Number(battlefield.stepCount)).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion layout remains usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openBattlefield(page);

    await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(15);
    await page.getByTestId('battlefield-tab-movement').click();
    await expect(page.getByTestId('battlefield-action-move:footwork')).toBeVisible();
    await page.getByTestId('battlefield-tab-retreat').click();
    await page.getByTestId('battlefield-action-retreat:edge').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();

    const overlayBox = await page.getByTestId('battlefield-overlay').boundingBox();
    const buttonBox = await page.getByTestId('battlefield-execute-action').boundingBox();
    expect(overlayBox?.width).toBeGreaterThan(300);
    expect(buttonBox?.height).toBeGreaterThan(32);
    expect(consoleErrors).toEqual([]);
  });
});
