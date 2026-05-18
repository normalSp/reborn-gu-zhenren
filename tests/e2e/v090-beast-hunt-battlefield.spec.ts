import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startBeastHuntDemo: () => Record<string, unknown>;
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

async function openBeastHuntDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startBeastHuntDemo());
  return consoleErrors;
}

async function departAndEnterHuntBattle(page: Page): Promise<void> {
  await page.getByTestId('side-panel-world').click();
  await page.locator('[data-testid=world-hub-tab-training_ground]:visible').click();
  await expect(page.locator('[data-testid="training-ground-panel"]:visible')).toBeVisible();
  await expect(page.locator('[data-testid="training-ground-hunt-preview"]:visible')).toBeVisible();
  await page.locator('[data-testid="training-ground-departure-action"]:visible').first().click();
  await expect(page.getByTestId('narrative-combat-panel')).toBeVisible();
  await expect(page.locator('[data-testid="narrative-combat-candidate"]:visible')).toBeVisible();
  await page.locator('[data-testid="enter-combat-candidate"]:visible').first().click();
  await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
}

test.describe('v0.9.0-a3 beast hunt battlefield', () => {
  test('desktop opens white-heaven hunt clue into a 7x5 beast battlefield with enemy phase', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openBeastHuntDemo(page);

    await expect(page.getByTestId('app-version-label')).toContainText('v0.9.0');
    await departAndEnterHuntBattle(page);

    await expect(page.getByTestId('battlefield-board')).toHaveAttribute('data-grid-size', '7x5');
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(35);
    await expect(page.locator('[data-testid^="battlefield-unit-beast_"]').first()).toBeVisible();
    await expect(page.getByTestId('battlefield-end-player-phase')).toBeVisible();
    await page.getByTestId('battlefield-end-player-phase').click();
    await expect(page.locator('[data-testid="battlefield-step-hit"], [data-testid="battlefield-step-miss"], [data-testid="battlefield-step-terrain_change"]').first()).toBeVisible();

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const battlefield = summary.battlefieldCombat as Record<string, unknown>;
    const trainingGround = summary.trainingGround as Record<string, unknown>;
    expect(battlefield.mode).toBe('group');
    expect(battlefield.gridPresetId).toBe('ambush_7x5');
    expect(battlefield.gridWidth).toBe(7);
    expect(battlefield.gridHeight).toBe(5);
    expect(battlefield.cellCount).toBe(35);
    expect(Number(battlefield.unitCount)).toBeGreaterThan(1);
    expect(Number(trainingGround.combatCandidateCount)).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps hunt clue, 7x5 board, and trace readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openBeastHuntDemo(page);

    await departAndEnterHuntBattle(page);

    await expect(page.getByTestId('battlefield-board')).toHaveAttribute('data-grid-size', '7x5');
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(35);
    const boardScroll = await page.getByTestId('battlefield-board').evaluate(node => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }));
    expect(boardScroll.scrollWidth).toBeGreaterThan(boardScroll.clientWidth);
    await expect(page.getByTestId('battlefield-end-player-phase')).toBeVisible();
    await expect(page.locator('[data-testid^="battlefield-unit-beast_"]').first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
