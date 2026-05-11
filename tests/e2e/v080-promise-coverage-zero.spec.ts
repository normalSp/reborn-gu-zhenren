import { expect, test, type Page } from '@playwright/test';

type TalentCategory = 'mortal' | 'immortal';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
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

async function openTalentCoverageDemo(
  page: Page,
  category: TalentCategory,
): Promise<{ consoleErrors: string[]; summary: Record<string, unknown> }> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  const summary = await page.evaluate((kind) => (
    (window as RebornE2eWindow).__REBORN_E2E__!.startTimelineTalentCoverageDemo(kind)
  ), category);
  await expect(page.getByTestId('timeline-config-screen')).toBeVisible();
  const talentCards = page.locator('[data-testid^="timeline-talent-card-"]');
  await expect(talentCards.first()).toBeVisible();
  expect(await talentCards.count()).toBeGreaterThan(0);
  return { consoleErrors, summary };
}

async function expectPlannedCoverageFilterIsEmpty(page: Page): Promise<void> {
  await page.getByTestId('coverage-filter-planned_needs_system').click();
  await expect(page.getByTestId('coverage-row-planned_needs_system')).toHaveCount(0);
  await expect(page.getByTestId('coverage-row-needs_downgrade')).toHaveCount(0);

  await page.getByTestId('coverage-filter-all').click();
  await expect(page.getByTestId('coverage-row-needs_downgrade')).toHaveCount(0);
}

test.describe('v0.8.0-c1.3 promise coverage zero UI', () => {
  test('desktop mortal talent selector has no planned-system display debt', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { consoleErrors, summary } = await openTalentCoverageDemo(page, 'mortal');

    expect((summary.timelineCoverage as Record<string, unknown>).talentCategory).toBe('mortal');
    await expectPlannedCoverageFilterIsEmpty(page);
    await expect(page.getByTestId('coverage-row-runtime_active').first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion immortal talent selector stays clear and readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { consoleErrors, summary } = await openTalentCoverageDemo(page, 'immortal');

    expect((summary.timelineCoverage as Record<string, unknown>).talentCategory).toBe('immortal');
    await expectPlannedCoverageFilterIsEmpty(page);
    const screenBox = await page.getByTestId('timeline-config-screen').boundingBox();
    const firstCardBox = await page.locator('[data-testid^="timeline-talent-card-"]').first().boundingBox();
    expect(screenBox?.width).toBeGreaterThan(300);
    expect(firstCardBox?.height).toBeGreaterThan(24);
    expect(consoleErrors).toEqual([]);
  });
});
