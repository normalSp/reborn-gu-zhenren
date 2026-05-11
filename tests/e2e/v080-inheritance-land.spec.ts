import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startInheritanceLandDemo: () => Record<string, unknown>;
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

async function openInheritanceDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startInheritanceLandDemo());
  return consoleErrors;
}

test.describe('v0.8.0-c2.5 inheritance and land claim UI', () => {
  test('desktop shows inheritance candidates, blessed land terms, choice tags, and no rank-five ascension copy', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openInheritanceDemo(page);

    await expect(page.getByTestId('choice-panel')).toBeVisible();
    await expect(page.locator('[data-testid^="choice-inheritance-tag-"]').first()).toBeVisible();

    await page.getByTestId('side-panel-inheritance').click();
    await expect(page.locator('[data-testid="inheritance-land-panel"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="inheritance-candidate-card"]:visible')).toHaveCount(4);
    await expect(page.locator('[data-testid="inheritance-land-claim-action"]:visible').first()).toBeVisible();
    await expect(page.locator('[data-testid="inheritance-site-sample-unclaimed_blessed_land_seed"]:visible')).toBeDisabled();

    await page.getByTestId('side-panel-actions').click();
    const actionPanel = page.locator('[data-testid="cultivation-deepening-panel"]:visible');
    await expect(actionPanel).toBeVisible();
    await expect(page.locator('[data-testid="cultivation-ascension-action"]:visible')).toHaveCount(0);
    await expect(actionPanel).not.toContainText('尝试升仙');
    await expect(actionPanel).not.toContainText('升仙三气');
    await expect(actionPanel).not.toContainText('五转阶段');

    await page.getByTestId('side-panel-aperture').click();
    await expect(page.locator('[data-testid="aperture-inheritance-land-summary"]:visible')).toBeVisible();

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const inheritance = summary.inheritanceLand as Record<string, unknown>;
    expect(Number(inheritance.candidateCount)).toBe(4);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps inheritance panel, tooltip tags, and action buttons readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openInheritanceDemo(page);

    await expect(page.getByTestId('choice-panel')).toBeVisible();
    const choiceBox = await page.getByTestId('choice-panel').boundingBox();
    expect(choiceBox?.width).toBeGreaterThan(320);

    await page.getByTestId('side-panel-inheritance').click();
    const panel = page.locator('[data-testid="inheritance-land-panel"]:visible');
    await expect(panel).toBeVisible();
    await expect(page.locator('[data-testid="inheritance-candidate-card"]:visible').first()).toBeVisible();
    const buttonBox = await page.locator('[data-testid="inheritance-resolve-trial-action"]:visible').first().boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(24);

    await page.getByTestId('side-panel-actions').click();
    await expect(page.locator('[data-testid="cultivation-ascension-action"]:visible')).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });
});
