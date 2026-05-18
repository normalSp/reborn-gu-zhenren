import { expect, test, type Locator, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startMidgameAnchorDemo: () => Record<string, unknown>;
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

async function openMidgameAnchorDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startMidgameAnchorDemo());
  await page.getByTestId('side-panel-world').click();
  await page.locator('[data-testid=world-hub-tab-story_anchor]:visible').click();
  await expect(visibleStoryAnchorPanel(page)).toBeVisible();
  return consoleErrors;
}

function visibleStoryAnchorPanel(page: Page): Locator {
  return page.locator('[data-testid="story-anchor-panel"]:visible');
}

test.describe('v0.8.0-b3 midgame anchor UI', () => {
  test('desktop shows fate state, four anchors, ledgers, candidates, and blocked pressure', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openMidgameAnchorDemo(page);
    const panel = visibleStoryAnchorPanel(page);

    await expect(panel.getByTestId('story-anchor-fate-state')).toBeVisible();
    await expect(panel.getByTestId('story-anchor-card-yi_tian_mountain')).toBeVisible();
    await expect(panel.getByTestId('story-anchor-card-reverse_flow_river')).toBeVisible();
    await expect(panel.getByTestId('story-anchor-card-dream_shadow_sect')).toBeVisible();
    await expect(panel.getByTestId('story-anchor-card-fate_war')).toBeVisible();
    await expect(panel.getByTestId('story-anchor-karma')).toBeVisible();
    await expect(panel.getByTestId('story-anchor-if-vectors')).toBeVisible();
    await expect(panel.getByTestId('story-anchor-candidate-list')).toContainText('宿命战侧翼救援');
    await expect(panel.getByTestId('story-anchor-pressure-log')).toContainText('fate_war');
    await expect(panel.getByTestId('story-anchor-resolution-steps')).toBeVisible();

    await expect(page.getByTestId('choice-anchor-tag-canon_side')).toBeVisible();
    await expect(page.getByTestId('choice-anchor-tag-if_deviation')).toBeVisible();
    await expect(page.getByTestId('choice-anchor-tag-forbidden_block')).toBeVisible();

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const storyAnchor = summary.storyAnchor as Record<string, unknown>;
    expect(storyAnchor.currentAnchorId).toBe('fate_war');
    expect(storyAnchor.fateState).toBe('fractured');
    expect(Number(storyAnchor.ifVectorCount)).toBeGreaterThanOrEqual(1);
    expect(Number(storyAnchor.pressureCount)).toBeGreaterThanOrEqual(1);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps story anchor panel and choice tags readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openMidgameAnchorDemo(page);
    const panel = visibleStoryAnchorPanel(page);

    await expect(panel).toBeVisible();
    await expect(panel.getByTestId('story-anchor-card-fate_war')).toBeVisible();
    await expect(page.getByTestId('choice-anchor-tag-forbidden_block')).toBeVisible();

    const panelBox = await panel.boundingBox();
    const tagBox = await page.getByTestId('choice-anchor-tag-forbidden_block').boundingBox();
    expect(panelBox?.width).toBeGreaterThan(300);
    expect(tagBox?.height).toBeGreaterThan(12);
    expect(consoleErrors).toEqual([]);
  });
});
