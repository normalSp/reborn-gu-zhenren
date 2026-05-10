import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startCultivationDeepeningDemo: () => Record<string, unknown>;
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

async function openCultivationDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startCultivationDeepeningDemo());
  await page.getByTestId('side-panel-actions').click();
  await expect(page.locator('[data-testid="cultivation-deepening-panel"]:visible')).toBeVisible();
  return consoleErrors;
}

test.describe('v0.8.0-b2 cultivation and calamity UI', () => {
  test('desktop can preview cultivation, attempt ascension, and settle a blessed-land calamity', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openCultivationDemo(page);

    const ascensionAction = page.locator('[data-testid="cultivation-ascension-action"]:visible');
    await expect(ascensionAction).toBeEnabled();
    await ascensionAction.click();
    await expect(page.locator('[data-testid="cultivation-resolution-trace"]:visible')).toBeVisible();

    const ascensionSummary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const ascension = ascensionSummary.cultivation as Record<string, unknown>;
    expect(Number(ascension.lastStepCount)).toBeGreaterThan(0);

    const calamityAction = page.locator('[data-testid="cultivation-calamity-action"]:visible');
    await expect(calamityAction).toBeEnabled();
    await calamityAction.click();
    await expect(page.locator('[data-testid="cultivation-resolution-trace"]:visible')).toBeVisible();

    const calamitySummary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const cultivation = calamitySummary.cultivation as Record<string, unknown>;
    expect(Number(cultivation.calamityCount)).toBeGreaterThanOrEqual(1);
    expect(Number(cultivation.lastStepCount)).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps cultivation panel and local trace readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openCultivationDemo(page);

    await expect(page.locator('[data-testid="cultivation-deepening-panel"]:visible')).toBeVisible();
    const ascensionAction = page.locator('[data-testid="cultivation-ascension-action"]:visible');
    await expect(ascensionAction).toBeEnabled();
    const panelBox = await page.locator('[data-testid="cultivation-deepening-panel"]:visible').boundingBox();
    const buttonBox = await ascensionAction.boundingBox();
    expect(panelBox?.width).toBeGreaterThan(300);
    expect(buttonBox?.height).toBeGreaterThan(24);

    await ascensionAction.click();
    await expect(page.locator('[data-testid="cultivation-resolution-trace"]:visible')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
