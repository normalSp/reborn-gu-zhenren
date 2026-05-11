import { expect, test, type Page } from '@playwright/test';

type TalentCategory = 'mortal' | 'immortal';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startBattlefieldLargeGroupDemo: () => Record<string, unknown>;
    startCultivationDeepeningDemo: () => Record<string, unknown>;
    startEndingFrameworkDemo: () => Record<string, unknown>;
    startMidgameAnchorDemo: () => Record<string, unknown>;
    startNarrativeGuAffordanceDemo: () => Record<string, unknown>;
    startOriginLifeboundClosureDemo: () => Record<string, unknown>;
    startTimelineTalentCoverageDemo: (category?: TalentCategory) => Record<string, unknown>;
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

async function openApp(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
}

async function resetToApp(page: Page): Promise<void> {
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
}

async function expectNoTalentDebt(page: Page, category: TalentCategory): Promise<void> {
  await resetToApp(page);
  await page.evaluate((kind) => (
    (window as RebornE2eWindow).__REBORN_E2E__!.startTimelineTalentCoverageDemo(kind)
  ), category);
  await expect(page.getByTestId('timeline-config-screen')).toBeVisible();
  await page.getByTestId('coverage-filter-planned_needs_system').click();
  await expect(page.getByTestId('coverage-row-planned_needs_system')).toHaveCount(0);
  await expect(page.getByTestId('coverage-row-needs_downgrade')).toHaveCount(0);
}

test.describe('v0.8.0-c2 global reskin and UX closure', () => {
  test('desktop shell, panels, 7x5 battlefield, and talent coverage share the c2 frame', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await installConsoleGuards(page);
    await openApp(page);

    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startCultivationDeepeningDemo());
    await expect(page.getByTestId('game-screen-shell')).toBeVisible();
    await expect(page.getByTestId('game-status-bar')).toBeVisible();
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
    await page.getByTestId('side-panel-actions').click();
    await expect(page.locator('[data-testid="desktop-side-panel"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="action-panel"]:visible')).toBeVisible();

    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startOriginLifeboundClosureDemo());
    await page.getByTestId('side-panel-gu_inventory').click();
    await expect(page.locator('[data-testid="gu-inventory-panel"]:visible')).toBeVisible();

    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startMidgameAnchorDemo());
    await page.getByTestId('side-panel-story_anchor').click();
    await expect(page.locator('[data-testid="story-anchor-panel"]:visible')).toBeVisible();

    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startEndingFrameworkDemo());
    await page.getByTestId('side-panel-ending').click();
    await expect(page.locator('[data-testid="ending-panel"]:visible')).toBeVisible();

    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startBattlefieldLargeGroupDemo());
    await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
    await expect(page.getByTestId('battlefield-board')).toHaveAttribute('data-grid-size', '7x5');
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(35);

    const bottomBox = await page.getByTestId('bottom-nav').boundingBox();
    const statusBox = await page.getByTestId('game-status-bar').boundingBox();
    expect(bottomBox?.height).toBeGreaterThan(40);
    expect(statusBox?.height).toBeGreaterThan(40);

    await expectNoTalentDebt(page, 'mortal');
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps sheets, choices, tooltips, and large board readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await installConsoleGuards(page);
    await openApp(page);

    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startNarrativeGuAffordanceDemo());
    await expect(page.getByTestId('choice-panel')).toBeVisible();
    await expect(page.locator('[data-testid^="choice-gu-affordance-"]').first()).toBeVisible();
    const choiceBox = await page.getByTestId('choice-panel').boundingBox();
    expect(choiceBox?.width).toBeGreaterThan(320);

    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startCultivationDeepeningDemo());
    await page.getByTestId('side-panel-actions').click();
    await expect(page.locator('[data-testid="mobile-side-sheet"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="action-panel"]:visible')).toBeVisible();

    await resetToApp(page);
    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startBattlefieldLargeGroupDemo());
    await expect(page.getByTestId('battlefield-board')).toHaveAttribute('data-grid-size', '7x5');
    const boardScroll = await page.getByTestId('battlefield-board').evaluate(node => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }));
    expect(boardScroll.scrollWidth).toBeGreaterThan(boardScroll.clientWidth);

    await expectNoTalentDebt(page, 'immortal');
    expect(consoleErrors).toEqual([]);
  });
});
