import { expect, test, type Locator, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startOriginLifeboundClosureDemo: () => Record<string, unknown>;
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

async function openOriginLifeboundDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startOriginLifeboundClosureDemo());
  await page.getByTestId('side-panel-gu_dao').click();
  await page.locator('[data-testid=gu-dao-tab-gu_inventory]:visible').click();
  await expect(visibleGuInventoryPanel(page)).toBeVisible();
  return consoleErrors;
}

function visibleGuInventoryPanel(page: Page): Locator {
  return page.locator('[data-testid="gu-inventory-panel"]:visible');
}

test.describe('v0.8.0-c1.2 origin and lifebound closure UI', () => {
  test('desktop shows lifebound protocol and exposes origin/lifebound evidence', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openOriginLifeboundDemo(page);
    const panel = visibleGuInventoryPanel(page);

    await expect(panel.getByText('本命蛊', { exact: true }).first()).toBeVisible();
    await expect(panel.getByText('已绑定')).toBeVisible();
    await expect(panel.getByText(/月道本命/)).toBeVisible();
    await expect(panel.getByText(/普通升炼、拆炼、出售和移除被阻止/)).toBeVisible();
    await expect(panel.getByText(/scene-dependent/)).toBeVisible();

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const originLifebound = summary.originLifebound as Record<string, unknown>;
    expect(originLifebound.originProfileId).toBe('origin_southern_shangjia');
    expect(originLifebound.originProfileName).toBe('南疆商家商路线');
    expect(originLifebound.lifeboundProfileId).toBe('lifebound_moon_path');
    expect(originLifebound.lifeboundGuName).toBe('月光蛊');
    expect(String(originLifebound.contextPreview)).toContain('南疆商家商路线');
    expect(String(originLifebound.contextPreview)).toContain('商家城与南疆商路');
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps explanation readable and operable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openOriginLifeboundDemo(page);
    const panel = visibleGuInventoryPanel(page);

    await expect(panel.getByText('本命蛊', { exact: true }).first()).toBeVisible();
    await expect(panel.getByText(/终局权重/)).toBeVisible();
    await expect(panel.getByText('月光蛊').first()).toBeVisible();

    const panelBox = await panel.boundingBox();
    const lifeboundBox = await panel.getByText(/普通升炼、拆炼、出售和移除被阻止/).boundingBox();
    expect(panelBox?.width).toBeGreaterThan(300);
    expect(lifeboundBox?.height).toBeGreaterThan(12);
    expect(consoleErrors).toEqual([]);
  });
});
