import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startBattlefieldGroupDemo: () => Record<string, unknown>;
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

async function openGroupBattlefield(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startBattlefieldGroupDemo());
  await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
  return consoleErrors;
}

test.describe('v0.8.0-b1 group battlefield UI vertical slice', () => {
  test('desktop group battle shows units, morale, objectives, observe, and rally trace', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openGroupBattlefield(page);

    await expect(page.getByTestId('battlefield-board')).toBeVisible();
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(15);
    await expect(page.getByTestId('battlefield-morale')).toBeVisible();
    await expect(page.getByTestId('battlefield-objectives')).toBeVisible();
    await expect(page.getByTestId('battlefield-third-parties')).toBeVisible();
    await expect(page.getByTestId('battlefield-unit-player')).toBeVisible();
    await expect(page.getByTestId('battlefield-unit-ally_guard')).toBeVisible();

    await page.getByTestId('battlefield-tab-observe').click();
    await page.getByTestId('battlefield-action-observe:intel').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();
    await page.getByTestId('battlefield-execute-action').click();
    await expect(page.getByTestId('battlefield-step-ambush').first()).toBeVisible();

    await page.getByTestId('battlefield-unit-ally_guard').click();
    await page.getByTestId('battlefield-tab-formation').click();
    await page.getByTestId('battlefield-action-formation:rally').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();
    await page.getByTestId('battlefield-execute-action').click();
    await expect(page.getByTestId('battlefield-step-morale').first()).toBeVisible();

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const battlefield = summary.battlefieldCombat as Record<string, unknown>;
    expect(battlefield.mode).toBe('group');
    expect(battlefield.cellCount).toBe(15);
    expect(Number(battlefield.unitCount)).toBeGreaterThan(4);
    expect(Number(battlefield.objectiveCount)).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion group battle keeps controls readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openGroupBattlefield(page);

    await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(15);
    await expect(page.getByTestId('battlefield-morale')).toBeVisible();
    await page.getByTestId('battlefield-tab-formation').click();
    await expect(page.getByTestId('battlefield-action-formation:guard')).toBeVisible();
    await expect(page.getByTestId('battlefield-action-formation:rally')).toBeVisible();

    const overlayBox = await page.getByTestId('battlefield-overlay').boundingBox();
    const moraleBox = await page.getByTestId('battlefield-morale').boundingBox();
    expect(overlayBox?.width).toBeGreaterThan(300);
    expect(moraleBox?.height).toBeGreaterThan(40);
    expect(consoleErrors).toEqual([]);
  });
});
