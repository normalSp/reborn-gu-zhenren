import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startCultivationDeepeningDemo: () => Record<string, unknown>;
    startCultivationCalamityNarrativeDemo: () => Record<string, unknown>;
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
  await page.getByTestId('side-panel-role').click();
  await page.locator('[data-testid=role-hub-tab-aperture]:visible').click();
  await expect(page.locator('[data-testid="aperture-cultivation-actions"]:visible')).toBeVisible();
  return consoleErrors;
}

async function openRankSevenCalamityDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startCultivationCalamityNarrativeDemo());
  await page.getByTestId('side-panel-role').click();
  await page.locator('[data-testid=role-hub-tab-aperture]:visible').click();
  await expect(page.locator('[data-testid="aperture-cultivation-actions"]:visible')).toBeVisible();
  return consoleErrors;
}

test.describe('v0.8.0-c2.4 cultivation and calamity narrative UI', () => {
  test('desktop can preview cultivation, attempt ascension, and stage calamity into narrative', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openCultivationDemo(page);

    const ascensionAction = page.locator('[data-testid="aperture-ascension-action"]:visible');
    await expect(ascensionAction).toBeEnabled();
    await ascensionAction.click();
    await expect(page.locator('[data-testid="aperture-cultivation-resolution-trace"]:visible')).toBeVisible();

    const ascensionSummary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const ascension = ascensionSummary.cultivation as Record<string, unknown>;
    expect(Number(ascension.lastStepCount)).toBeGreaterThan(0);

    const calamityAction = page.locator('[data-testid="aperture-calamity-action"]:visible');
    await expect(calamityAction).toBeEnabled();
    await calamityAction.click();
    await expect(page.locator('[data-testid="aperture-cultivation-resolution-trace"]:visible')).toBeVisible();

    const calamitySummary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const cultivation = calamitySummary.cultivation as Record<string, unknown>;
    expect(String(cultivation.pendingCalamitySceneKind || '')).not.toBe('');
    expect(Number(cultivation.calamityCount)).toBe(0);
    expect(Number(cultivation.lastStepCount)).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
  });

  test('rank seven panel hides rank-five ascension and stages calamity through scene AP', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openRankSevenCalamityDemo(page);

    await expect(page.locator('[data-testid="aperture-ascension-action"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-testid="aperture-calamity-action"]:visible')).toBeEnabled();
    await expect(page.locator('[data-testid="aperture-cultivation-actions"]:visible')).toContainText('仙窍');
    await expect(page.locator('[data-testid="aperture-cultivation-actions"]:visible')).not.toContainText('五转阶段');

    await page.locator('[data-testid="aperture-calamity-action"]:visible').click();
    await expect(page.locator('[data-testid="aperture-cultivation-resolution-trace"]:visible')).toContainText('calamity_warning');
    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const cultivation = summary.cultivation as Record<string, unknown>;
    expect(String(cultivation.pendingCalamitySceneKind || '')).not.toBe('');
    expect(Number(cultivation.sceneBudgetRemaining)).toBe(2);
    expect(Number(cultivation.calamityCount)).toBe(0);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps cultivation panel and local trace readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openCultivationDemo(page);

    await expect(page.locator('[data-testid="aperture-cultivation-actions"]:visible')).toBeVisible();
    const ascensionAction = page.locator('[data-testid="aperture-ascension-action"]:visible');
    await expect(ascensionAction).toBeEnabled();
    const panelBox = await page.locator('[data-testid="aperture-cultivation-actions"]:visible').boundingBox();
    const buttonBox = await ascensionAction.boundingBox();
    expect(panelBox?.width).toBeGreaterThan(300);
    expect(buttonBox?.height).toBeGreaterThan(24);

    await ascensionAction.click();
    await expect(page.locator('[data-testid="aperture-cultivation-resolution-trace"]:visible')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
