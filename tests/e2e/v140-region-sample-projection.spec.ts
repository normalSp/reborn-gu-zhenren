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

test.describe('v1.4 region sample projection', () => {
  test('shows Southern Border low-rank sample as projection-only without region save fields or formal outcomes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const actionPanel = page.locator('[data-testid="free-goal-panel"]:visible');
    await actionPanel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，沿山路找商队窗口和散修落脚提示，但不要直接进城或加入势力');
    await actionPanel.locator('[data-testid="free-goal-adjudicate"]').click();
    await actionPanel.locator('[data-testid="free-goal-confirm"]').click();
    await actionPanel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await actionPanel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await actionPanel.locator('[data-testid="free-goal-cover-tracks-run"]').click();
    await actionPanel.locator('[data-testid="free-goal-mountain-pass-route-run"]').click();
    await actionPanel.locator('[data-testid="free-goal-supply-feeding-prep"]').click();
    await actionPanel.locator('[data-testid="free-goal-market-window"]').click();

    const v018Panel = actionPanel.locator('[data-testid="free-goal-v018-route-panel"]');
    await v018Panel.locator('[data-testid="free-goal-v018-route-threshold"]').click();
    await v018Panel.locator('[data-testid="free-goal-v018-candidate-continuation"]').click();
    await v018Panel.locator('[data-testid="free-goal-v018-pressure-backflow"]').click();

    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-region_sample]:visible').click();
    const panel = page.locator('[data-testid="v140-region-sample-panel"]:visible');

    await expect(panel.locator('[data-testid="v140-region-status"]')).toContainText('南疆低阶区域样板');
    await expect(panel.locator('[data-testid="v140-region-status"]')).toContainText('南疆低阶区域样板可读');
    await expect(panel.locator('[data-testid="v140-region-audit"]')).toContainText('projection-first');
    await expect(panel.locator('[data-testid="v140-region-audit"]')).toContainText('SAVE_FORMAT_VERSION = 25');
    await expect(panel.locator('[data-testid="v140-region-audit"]')).toContainText('不返回 regionSampleState patch');
    await expect(panel.locator('[data-testid="v140-region-posture-mountain_road_outer_edge"]')).toContainText('山路外缘');
    await expect(panel.locator('[data-testid="v140-region-posture-caravan_contact_window"]')).toContainText('商队接触窗口');
    await expect(panel.locator('[data-testid="v140-region-posture-rogue_settlement_hint"]')).toContainText('散修落脚提示');
    await expect(panel.locator('[data-testid="v140-region-posture-city_outer_threshold"]')).toContainText('商家城外缘门槛');
    await expect(panel.locator('[data-testid="v140-region-boundaries"]')).toContainText('不新增 regionSampleState');
    await expect(panel.locator('[data-testid="v140-region-boundaries"]')).toContainText('不开放完整南疆地图');
    await expect(panel.locator('[data-testid="v140-region-boundaries"]')).toContainText('不写交易');
    await expect(panel.locator('[data-testid="v140-region-boundaries"]')).toContainText('DeepSeek 只能写叙事');
    await expect(panel.locator('[data-testid="v140-region-source-refs"]')).toContainText('v1.4.0-a1:D-141-001');
    await expect(panel.locator('[data-testid="v140-region-source-refs"]')).toContainText('v1.4.0-a2:mirofish-topic-slice-intake');
    await expect(panel).not.toContainText('春秋蝉');
    await expect(panel).not.toContainText('重生');
    await expect(panel).not.toContainText('回溯');
    await expect(panel).not.toContainText('v018_hidden_982eba1c3730');
    await expect(panel).not.toContainText('route_entered 已写入');
    await expect(panel).not.toContainText('进入商家城');
    await expect(panel).not.toContainText('加入商队成功');
    await expect(panel).not.toContainText('奖励已发放');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'v018_qingmao_route_entry_threshold_commitment',
      'v018_qingmao_route_candidate_continuation_view',
      'v018_qingmao_route_pressure_backflow_baseline',
    ]));
    expect((summary as any).regionSampleState).toBeUndefined();
    expect((summary as any).regionalSampleState).toBeUndefined();
    expect((summary.materialBag as any).regionSampleState).toBeUndefined();
    expect((summary.materialBag as any).regionalSampleState).toBeUndefined();
    expect((summary.materialBag as any).route_entered).toBeUndefined();
    expect((summary.materialBag as any).reward).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
