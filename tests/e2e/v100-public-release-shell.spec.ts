import { expect, test, type Page } from '@playwright/test';

async function collectFatalConsole(page: Page): Promise<string[]> {
  const errors: string[] = [];
  const fatalPatterns = [
    /Cannot read properties/i,
    /ReferenceError/i,
    /TypeError/i,
    /Uncaught/i,
  ];
  page.on('console', msg => {
    const text = msg.text();
    if (fatalPatterns.some(pattern => pattern.test(text))) errors.push(`[${msg.type()}] ${text}`);
  });
  page.on('pageerror', error => errors.push(`[pageerror] ${error.message}`));
  return errors;
}

test.describe('v1.0 public release shell', () => {
  test('shows v1.0 branding and binds the approved release hero without gameplay authority', async ({ page }) => {
    const consoleErrors = await collectFatalConsole(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/?e2e=1');

    await expect(page).toHaveTitle('RebornG v1.0《青茅之后，活世界初成》');
    const titleScreen = page.getByTestId('title-screen');
    await expect(titleScreen).toHaveAttribute('data-release-hero', 'v1-title-screen-hero');
    await expect(titleScreen).toContainText('RebornG v1.0《青茅之后，活世界初成》');
    await expect(titleScreen).toContainText('蛊真人世界 · 人生重来模拟器 · v1.0.0');

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBe('/rebrng/release/v1-hero/og-share-image.png');
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');
    expect(twitterImage).toBe('/rebrng/release/v1-hero/og-share-image.png');
    await expect(titleScreen).not.toContainText('完整南疆');
    await expect(titleScreen).not.toContainText('仙蛊');
    await expect(titleScreen).not.toContainText('九转');
    expect(consoleErrors).toEqual([]);
  });
});
