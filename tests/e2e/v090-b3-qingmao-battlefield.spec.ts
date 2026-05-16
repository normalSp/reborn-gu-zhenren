import { expect, test, type Page, type TestInfo } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startQingmaoMortalBattlefieldDemo: () => Record<string, unknown>;
    triggerQingmaoForbiddenThresholdFailure: () => Record<string, unknown>;
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

async function openQingmaoBattlefield(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startQingmaoMortalBattlefieldDemo());
  await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
  return consoleErrors;
}

async function attachBattlefieldScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, {
    body: await page.getByTestId('battlefield-overlay').screenshot(),
    contentType: 'image/png',
  });
}

async function expectQingmaoBoardHasThreeReadableRows(page: Page): Promise<void> {
  const boardBox = await page.getByTestId('battlefield-board').boundingBox();
  const bottomRightCellBox = await page.getByTestId('battlefield-cell-c4_2').boundingBox();
  const actionDockBox = await page.getByTestId('battlefield-action-dock').boundingBox();
  const readoutBox = await page.getByTestId('battlefield-qingmao-readout-stack').boundingBox();

  expect(boardBox?.height ?? 0).toBeGreaterThanOrEqual(250);
  expect(readoutBox?.height ?? 999).toBeLessThanOrEqual(130);
  expect(bottomRightCellBox?.height ?? 0).toBeGreaterThanOrEqual(70);
  expect((bottomRightCellBox?.y ?? 9999) + (bottomRightCellBox?.height ?? 0)).toBeLessThan((actionDockBox?.y ?? 0) - 8);
}

async function expectQingmaoActionCardsStayInOneReadableRow(page: Page): Promise<void> {
  const metrics = await page.getByTestId('battlefield-action-list').evaluate((list) => {
    const listRect = list.getBoundingClientRect();
    const cards = Array.from(list.querySelectorAll<HTMLElement>('.battlefield-action-card')).map(card => {
      const rect = card.getBoundingClientRect();
      return {
        id: card.dataset.testid || card.getAttribute('data-testid') || '',
        x: rect.x,
        y: rect.y,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    });
    const visibleCards = cards.filter(card => card.right > listRect.left && card.x < listRect.right);
    const readableBlocks = visibleCards.map(card => {
      const node = Array.from(list.querySelectorAll<HTMLElement>('.battlefield-action-card')).find(item => (
        (item.dataset.testid || item.getAttribute('data-testid') || '') === card.id
      ));
      const summary = node?.querySelector<HTMLElement>('.battlefield-action-summary') ?? null;
      const counter = node?.querySelector<HTMLElement>('.battlefield-action-counter') ?? null;
      const cardRect = node?.getBoundingClientRect();
      const summaryRect = summary?.getBoundingClientRect();
      const counterRect = counter?.getBoundingClientRect();
      return {
        id: card.id,
        summaryText: summary?.textContent?.trim() ?? '',
        counterText: counter?.textContent?.trim() ?? '',
        summaryHeight: summaryRect?.height ?? 0,
        counterHeight: counterRect?.height ?? 0,
        summaryBottom: summaryRect?.bottom ?? 0,
        counterBottom: counterRect?.bottom ?? 0,
        cardBottom: cardRect?.bottom ?? 0,
      };
    });
    return {
      clientHeight: list.clientHeight,
      scrollHeight: list.scrollHeight,
      listBottom: listRect.bottom,
      firstVisibleY: visibleCards[0]?.y ?? 0,
      visibleCards,
      readableBlocks,
    };
  });

  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 3);
  expect(metrics.visibleCards.length).toBeGreaterThanOrEqual(2);
  for (const card of metrics.visibleCards) {
    expect(card.height).toBeGreaterThanOrEqual(150);
    expect(card.bottom).toBeLessThanOrEqual(metrics.listBottom + 2);
    expect(Math.abs(card.y - metrics.firstVisibleY)).toBeLessThanOrEqual(2);
  }
  for (const block of metrics.readableBlocks) {
    expect(block.summaryText.length).toBeGreaterThan(8);
    expect(block.counterText).toContain('反制');
    expect(block.summaryHeight).toBeGreaterThanOrEqual(14);
    expect(block.counterHeight).toBeGreaterThanOrEqual(12);
    expect(block.summaryBottom).toBeLessThanOrEqual(block.cardBottom - 18);
    expect(block.counterBottom).toBeLessThanOrEqual(block.cardBottom - 4);
  }
}

test.describe('v0.9.0-b3 Qingmao mortal battlefield visual slice', () => {
  test('desktop slice keeps art boundaries visible and executes Moonlight Gu from local engine facts', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoBattlefield(page);

    await expect(page.getByText('v0.9.0-b3 青茅山凡战竖切')).toBeVisible();
    await expect(page.getByTestId('battlefield-board')).toHaveAttribute('data-grid-size', '5x3');
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(15);
    await expect(page.getByTestId('battlefield-qingmao-art-boundary')).toContainText('月光蛊');
    await expect(page.getByTestId('battlefield-qingmao-art-boundary')).toContainText('白玉蛊');
    await expect(page.getByTestId('battlefield-qingmao-art-boundary')).toContainText('酒虫');
    await expect(page.getByTestId('battlefield-qingmao-art-boundary')).toContainText('不暗示仙蛊');
    await expect(page.getByTestId('battlefield-qingmao-asset-bridge')).toContainText('月光蛊');
    await expect(page.getByTestId('battlefield-qingmao-asset-bridge')).toContainText('白玉蛊');
    await expect(page.getByTestId('battlefield-qingmao-asset-bridge')).toContainText('酒虫');
    await expect(page.getByTestId('battlefield-overlay')).toHaveAttribute(
      'data-qingmao-atmosphere-asset',
      'qingmao-mortal-battlefield-generic-atmosphere',
    );
    await expect(page.getByTestId('battlefield-qingmao-entrance')).toContainText('青茅山凡战');
    await expect(page.getByTestId('battlefield-qingmao-entrance')).toHaveAttribute(
      'data-atmosphere-asset',
      'qingmao-mortal-battlefield-generic-atmosphere',
    );
    await expect(page.getByTestId('battlefield-qingmao-entrance')).toHaveAttribute('data-entrance-timeline', 'complete', { timeout: 4000 });
    await expect(page.getByTestId('battlefield-qingmao-atmosphere-image')).toHaveAttribute(
      'data-asset-id',
      'qingmao-mortal-battlefield-generic-atmosphere',
    );
    const atmosphereLoaded = await page.getByTestId('battlefield-qingmao-atmosphere-image').evaluate((node) => {
      const img = node as HTMLImageElement;
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(atmosphereLoaded).toBe(true);
    await expect(page.getByTestId('battlefield-qingmao-storyboard')).toContainText('月刃连斩');
    await expect(page.getByTestId('battlefield-qingmao-storyboard')).toContainText('白玉护体');
    await expect(page.getByTestId('battlefield-qingmao-storyboard-liquor-worm-support')).toHaveAttribute('data-active', 'true');
    await expectQingmaoBoardHasThreeReadableRows(page);
    for (const assetId of ['moonlight-gu', 'white-jade-gu', 'liquor-worm']) {
      const loaded = await page.getByTestId(`battlefield-qingmao-asset-${assetId}`).evaluate((node) => {
        const img = node as HTMLImageElement;
        return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
      });
      expect(loaded).toBe(true);
    }
    await expect(page.getByTestId('battlefield-action-gu:月光蛊')).toBeVisible();
    await expect(page.getByTestId('battlefield-action-meta-gu:月光蛊')).toContainText('消耗');
    await expect(page.getByTestId('battlefield-action-meta-gu:月光蛊')).toContainText('射程');
    await expect(page.getByTestId('battlefield-action-meta-gu:月光蛊')).toContainText('目标');
    await expect(page.getByTestId('battlefield-action-gu:月光蛊')).toContainText('反制：遮蔽');
    await expect(page.getByTestId('battlefield-action-gu:白玉蛊')).toBeAttached();
    await expect(page.getByTestId('battlefield-action-gu:酒虫')).toHaveCount(0);
    await expectQingmaoActionCardsStayInOneReadableRow(page);
    await expect(page.getByTestId('battlefield-gsap-moon-blade')).toBeAttached();
    await expect(page.getByTestId('battlefield-gsap-moon-echo')).toBeAttached();
    await expect(page.getByTestId('battlefield-gsap-jade-shell')).toBeAttached();
    await expect(page.getByTestId('battlefield-gsap-jade-crack')).toBeAttached();
    await expect(page.getByTestId('battlefield-gsap-boundary-thread')).toBeAttached();
    await expect(page.getByTestId('battlefield-gsap-boundary-sigil')).toBeAttached();
    const entranceBox = await page.getByTestId('battlefield-qingmao-entrance').boundingBox();
    const boardBoxBeforeAction = await page.getByTestId('battlefield-board').boundingBox();
    expect(entranceBox?.height).toBeGreaterThan(34);
    expect((entranceBox?.y ?? 0) + (entranceBox?.height ?? 0)).toBeLessThan(boardBoxBeforeAction?.y ?? 9999);

    await page.getByTestId('battlefield-action-gu:月光蛊').click();
    await page.getByTestId('battlefield-cell-c3_1').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();
    await page.getByTestId('battlefield-execute-action').click();

    await expect(page.getByTestId('battlefield-step-gu_use').first()).toBeVisible();
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-effect-from-cell', 'c0_1');
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-effect-target-cell', 'c3_1');
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-qingmao-polish', 'moon-transition', { timeout: 4000 });
    await expect(page.getByTestId('battlefield-step-resource_spend').first()).toBeVisible();
    await attachBattlefieldScreenshot(page, testInfo, 'v090-b3-5-c037-moon-transition');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const battlefield = summary.battlefieldCombat as Record<string, unknown>;
    expect(battlefield.gridWidth).toBe(5);
    expect(battlefield.gridHeight).toBe(3);
    expect(battlefield.activeTerrainId).toBe('moonlit_courtyard');
    expect(Number(battlefield.stepCount)).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
  });

  test('White Jade Gu self-guard keeps the jade-shell storyboard anchored to the player cell', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1366, height: 860 });
    const consoleErrors = await openQingmaoBattlefield(page);

    await page.getByTestId('battlefield-action-gu:白玉蛊').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();
    await page.getByTestId('battlefield-execute-action').click();

    await expect(page.getByTestId('battlefield-step-gu_use').first()).toBeVisible();
    await expect(page.getByTestId('battlefield-qingmao-storyboard-white-jade-shell')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-effect-from-cell', 'c0_1');
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-effect-target-cell', 'c0_1');
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-qingmao-polish', 'white-jade-transition', { timeout: 4000 });
    await expect(page.getByTestId('battlefield-qingmao-storyboard-white-jade-shell')).toContainText('不表现仙体');

    await attachBattlefieldScreenshot(page, testInfo, 'v090-b3-5-c037-white-jade-transition');
    expect(consoleErrors).toEqual([]);
  });

  test('forbidden-threshold failure remains readable without inventing rewards or extra effects', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1366, height: 860 });
    const consoleErrors = await openQingmaoBattlefield(page);

    await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.triggerQingmaoForbiddenThresholdFailure());

    await expect(page.getByTestId('battlefield-step-failure').first()).toBeVisible();
    await expect(page.getByTestId('battlefield-step-failure').first()).toContainText('目标超出射程');
    await expect(page.getByTestId('battlefield-qingmao-storyboard-forbidden-threshold')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('battlefield-qingmao-storyboard-forbidden-threshold')).toContainText('不暗示未开放禁术奖励');
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-effect-from-cell', 'c0_1');
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-effect-target-cell', 'c0_1');
    await expect(page.getByTestId('battlefield-effect-layer')).toHaveAttribute('data-qingmao-polish', 'forbidden-transition', { timeout: 4000 });

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    const battlefield = summary.battlefieldCombat as Record<string, unknown>;
    expect(Number(battlefield.stepCount)).toBeGreaterThan(0);
    await attachBattlefieldScreenshot(page, testInfo, 'v090-b3-5-c037-forbidden-transition');
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion slice remains readable and keeps the support cue visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openQingmaoBattlefield(page);

    await expect(page.getByTestId('battlefield-overlay')).toBeVisible();
    await expect(page.getByTestId('battlefield-qingmao-entrance')).toHaveAttribute('data-reduced-motion', 'true');
    await expect(page.getByTestId('battlefield-qingmao-entrance')).toHaveAttribute('data-entrance-timeline', 'reduced');
    await expect(page.getByTestId('battlefield-qingmao-art-boundary')).toContainText('酒虫');
    await expect(page.getByTestId('battlefield-qingmao-atmosphere-image')).toBeVisible();
    await expect(page.getByTestId('battlefield-qingmao-asset-bridge')).toContainText('酒虫');
    await expect(page.getByTestId('battlefield-qingmao-storyboard')).toContainText('禁忌门槛');
    await expect(page.locator('[data-testid^="battlefield-cell-"]')).toHaveCount(15);
    await page.getByTestId('battlefield-tab-retreat').click();
    await page.getByTestId('battlefield-action-retreat:edge').click();
    await expect(page.getByTestId('battlefield-execute-action')).toBeEnabled();

    const overlayBox = await page.getByTestId('battlefield-overlay').boundingBox();
    const buttonBox = await page.getByTestId('battlefield-execute-action').boundingBox();
    expect(overlayBox?.width).toBeGreaterThan(300);
    expect(buttonBox?.height).toBeGreaterThan(32);
    expect(consoleErrors).toEqual([]);
  });
});
