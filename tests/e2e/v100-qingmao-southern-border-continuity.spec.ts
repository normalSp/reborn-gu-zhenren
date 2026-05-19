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

test.describe('v1.0 Qingmao to Southern Border continuity', () => {
  test('accepts the continuity candidate only after v018 route prerequisites and without route/location authority', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，找商队或散修路线去南疆外面落脚');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();

    const v100Panel = panel.locator('[data-testid="free-goal-v100-continuity-panel"]');
    await expect(v100Panel).toContainText('v1.0 连续体验验收');
    await expect(v100Panel).toContainText('需补前置');
    await expect(v100Panel.locator('[data-testid="free-goal-v100-continuity-run"]')).toBeDisabled();

    await panel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await panel.locator('[data-testid="free-goal-cover-tracks-run"]').click();
    await panel.locator('[data-testid="free-goal-mountain-pass-route-run"]').click();
    await panel.locator('[data-testid="free-goal-supply-feeding-prep"]').click();
    await panel.locator('[data-testid="free-goal-refinement-boundary"]').click();
    await panel.locator('[data-testid="free-goal-market-window"]').click();
    await panel.locator('[data-testid="free-goal-v018-route-threshold"]').click();
    await panel.locator('[data-testid="free-goal-v018-candidate-continuation"]').click();
    await panel.locator('[data-testid="free-goal-v018-pressure-backflow"]').click();

    await expect(v100Panel).toContainText('可验收');
    await expect(v100Panel.locator('[data-testid="free-goal-v100-checks"]')).toContainText('隐藏边界');
    await expect(v100Panel.locator('[data-testid="free-goal-v100-redlines"]')).toContainText('极端意图');
    await v100Panel.locator('[data-testid="free-goal-v100-continuity-run"]').click();
    await expect(panel).toContainText('已验收 v1.0 青茅到南疆早期连续体验候选');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'v100_qingmao_southern_border_continuity_acceptance',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_v100_route_release_candidate_window',
      'faction_pressure_v100_qingmao_residual_watch',
    ]));
    expect((summary.materialBag as any).route_entered).toBeUndefined();
    expect((summary.materialBag as any).currentRoute).toBeUndefined();
    expect((summary.materialBag as any).v100_qingmao_southern_border_continuity_acceptance).toBeUndefined();
    await expect(v100Panel).not.toContainText('route_entered 已写入');
    await expect(v100Panel).toContainText('直接进入商家城核心');
    await expect(v100Panel).not.toContainText('进入商家城核心成功');
    await expect(v100Panel).not.toContainText('商家城核心已开放');
    await expect(v100Panel).not.toContainText('奖励已发放');
    expect(consoleErrors).toEqual([]);
  });
});
