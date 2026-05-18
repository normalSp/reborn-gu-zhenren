import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    startQingmaoRegionActionDemo: () => Record<string, unknown>;
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

async function openQingmaoRegionActionDemo(page: Page): Promise<string[]> {
  const consoleErrors = await installConsoleGuards(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);
  await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.startQingmaoRegionActionDemo());
  return consoleErrors;
}

test.describe('v0.15.0-b4 gray-trade and commission boundary', () => {
  test('records gray-trade boundaries without opening black-market, commission, inventory, or trade settlement', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-free_goal').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，并找商队问价，再打听黑市和委托代售');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();
    await panel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await panel.locator('[data-testid="free-goal-cover-tracks-run"]').click();
    await panel.locator('[data-testid="free-goal-mountain-pass-route-run"]').click();
    await panel.locator('[data-testid="free-goal-supply-feeding-prep"]').click();
    await panel.locator('[data-testid="free-goal-refinement-boundary"]').click();
    await panel.locator('[data-testid="free-goal-market-window"]').click();

    const grayPanel = panel.locator('[data-testid="free-goal-gray-trade-boundary-panel"]');
    await expect(grayPanel).toContainText('灰色交易/委托边界');
    await expect(grayPanel).toContainText('不开黑市');
    await expect(grayPanel).toContainText('不开委托收益');
    await expect(grayPanel).toContainText('不写库存价格');
    await grayPanel.locator('[data-testid="free-goal-gray-trade-boundary"]').click();

    await expect(panel).toContainText('已记录灰色交易/委托边界');
    await expect(panel).toContainText('gray_trade:deferred_gray_commission_candidate_outer_broker');
    await expect(panel).toContainText('gray_trade:deferred_gray_fraud_fake_goods_risk');
    await expect(panel).not.toContainText('黑市已开放');
    await expect(panel).not.toContainText('委托收益已发放');
    await expect(panel).not.toContainText('交易成功');
    await expect(panel).not.toContainText('库存已开放');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'qingmao_gray_trade_commission_boundary_baseline',
    ]));
    expect((summary.livingWorld as any).npcMemoryIds).toEqual(expect.arrayContaining([
      'npc_memory_qingmao_gray_trade_boundary_rumor_listener',
    ]));
    expect((summary.materialBag as any).qingmao_gray_trade_commission_boundary_baseline).toBeUndefined();
    expect((summary as any).currentDomain).toBe('南疆');
    expect(consoleErrors).toEqual([]);
  });
});
