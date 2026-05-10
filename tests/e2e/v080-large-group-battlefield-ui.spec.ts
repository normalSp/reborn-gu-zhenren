import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startBattlefieldLargeGroupDemo: () => Record<string, unknown>;
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

async function openLargeGroupBattlefield(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startBattlefieldLargeGroupDemo());
  await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
  return consoleErrors;
}

test.describe('v0.8.0-b1.1 large group battlefield UI', () => {
  test('desktop 7x5 ambush board exposes morale, objectives, observe, and formation play', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openLargeGroupBattlefield(page);

    await expect(page.getByTestId('battlefield-board')).toHaveAttribute('data-grid-size', '7x5');
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(35);
    await expect(page.getByTestId('battlefield-morale')).toBeVisible();
    await expect(page.getByTestId('battlefield-objectives')).toBeVisible();
    await expect(page.getByTestId('battlefield-third-parties')).toBeVisible();
    await expect(page.getByTestId('battlefield-unit-player')).toBeVisible();
    await expect(page.getByTestId('battlefield-unit-ally_scout')).toBeVisible();
    await expect(page.getByTestId('battlefield-unit-merchant')).toBeVisible();

    await page.getByTestId('battlefield-unit-ally_scout').click();
    await page.getByTestId('battlefield-tab-observe').click();
    await page.getByTestId('battlefield-action-observe:intel').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();
    await page.getByTestId('battlefield-execute-action').click();
    await expect(page.getByTestId('battlefield-step-ambush').first()).toBeVisible();

    await page.getByTestId('battlefield-unit-player').click();
    await page.getByTestId('battlefield-tab-formation').click();
    await page.getByTestId('battlefield-action-formation:node').click();
    await page.getByTestId('battlefield-cell-c2_2').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();
    await page.getByTestId('battlefield-execute-action').click();
    await expect(page.getByTestId('battlefield-step-formation').first()).toBeVisible();

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const battlefield = summary.battlefieldCombat as Record<string, unknown>;
    expect(battlefield.mode).toBe('group');
    expect(battlefield.gridPresetId).toBe('ambush_7x5');
    expect(battlefield.gridWidth).toBe(7);
    expect(battlefield.gridHeight).toBe(5);
    expect(battlefield.cellCount).toBe(35);
    expect(Number(battlefield.unitCount)).toBeGreaterThan(7);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion 7x5 board scrolls horizontally while controls remain usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openLargeGroupBattlefield(page);

    await expect(page.getByTestId('battlefield-board')).toHaveAttribute('data-grid-size', '7x5');
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(35);
    await expect(page.getByTestId('battlefield-morale')).toBeVisible();
    await expect(page.getByTestId('battlefield-objectives')).toBeVisible();

    const boardScroll = await page.getByTestId('battlefield-board').evaluate(node => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }));
    expect(boardScroll.scrollWidth).toBeGreaterThan(boardScroll.clientWidth);

    await page.getByTestId('battlefield-tab-observe').click();
    await expect(page.getByTestId('battlefield-action-observe:intel')).toBeVisible();
    await page.getByTestId('battlefield-tab-formation').click();
    await expect(page.getByTestId('battlefield-action-formation:guard')).toBeVisible();
    await expect(page.getByTestId('battlefield-action-formation:rally')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
