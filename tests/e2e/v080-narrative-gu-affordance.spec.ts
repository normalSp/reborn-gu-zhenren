import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startNarrativeGuAffordanceDemo: () => Record<string, unknown>;
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

async function openNarrativeGuAffordanceDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startNarrativeGuAffordanceDemo());
  await expect(page.getByTestId('choice-gu-affordance-available').first()).toBeVisible();
  return consoleErrors;
}

test.describe('v0.8.0-a3 narrative Gu affordances', () => {
  test('desktop choices show available, missing, and forbidden Gu affordance tags', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openNarrativeGuAffordanceDemo(page);

    await expect(page.getByTestId('choice-gu-affordance-available')).toHaveCount(1);
    await expect(page.getByTestId('choice-gu-affordance-missing')).toHaveCount(1);
    await expect(page.getByTestId('choice-gu-affordance-forbidden')).toHaveCount(1);

    await page.getByTestId('choice-gu-affordance-available').hover();
    await expect(page.getByTestId('choice-gu-affordance-tooltip-c1')).toBeVisible();

    const availableBox = await page.getByTestId('choice-gu-affordance-available').boundingBox();
    const missingBox = await page.getByTestId('choice-gu-affordance-missing').boundingBox();
    const forbiddenBox = await page.getByTestId('choice-gu-affordance-forbidden').boundingBox();
    expect(availableBox?.height).toBeGreaterThan(12);
    expect(missingBox?.height).toBeGreaterThan(12);
    expect(forbiddenBox?.height).toBeGreaterThan(12);

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect(summary.screenState).toBe('game_play');
    expect(summary.pipelinePhase).toBe('RESOLVED');
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps affordance labels readable and actionable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openNarrativeGuAffordanceDemo(page);

    await expect(page.getByTestId('choice-gu-affordance-available')).toBeVisible();
    await expect(page.getByTestId('choice-gu-affordance-missing')).toBeVisible();
    await expect(page.getByTestId('choice-gu-affordance-forbidden')).toBeVisible();

    const availableBox = await page.getByTestId('choice-gu-affordance-available').boundingBox();
    const forbiddenBox = await page.getByTestId('choice-gu-affordance-forbidden').boundingBox();
    expect(availableBox?.width).toBeGreaterThan(40);
    expect(forbiddenBox?.width).toBeGreaterThan(40);

    await page.getByTestId('choice-gu-affordance-forbidden').hover();
    await expect(page.getByTestId('choice-gu-affordance-tooltip-c3')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
