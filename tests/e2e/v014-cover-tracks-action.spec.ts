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

test.describe('v0.14.0-b1 cover escape tracks action', () => {
  test('promotes one social follow-up into a formal preparation action without route entry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();
    await panel.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();

    const social = panel.locator('[data-testid="free-goal-social-impact"]');
    await expect(social).toContainText('准备公开理由并降低流程痕迹');
    await expect(social).toContainText('可执行前置行动，不是任务');
    await social.locator('[data-testid="free-goal-cover-tracks-run"]').click();

    await expect(panel).toContainText('已遮掩逃离痕迹');
    await expect(social).toContainText('不创建正式任务');
    await expect(social).toContainText('不发奖励');
    await expect(social).toContainText('不改变阵营');
    await expect(social).not.toContainText('春秋蝉');
    await expect(social).not.toContainText('回溯');
    await expect(social).not.toContainText('投靠成功');
    await expect(social).not.toContainText('奖励已发放');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).playerGoalCount).toBe(1);
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'qingmao_escape_route_preparation_baseline',
      'qingmao_escape_tracks_cover_baseline',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_qingmao_cover_tracks_low_visibility_window',
      'faction_pressure_qingmao_cover_tracks_guyue_shanzhai_residual_trace',
    ]));
    expect((summary.livingWorld as any).npcMemoryIds).toEqual(expect.arrayContaining([
      'npc_memory_qingmao_cover_tracks_public_routine',
    ]));
    expect((summary.livingWorld as any).actionConsequenceCount).toBeGreaterThanOrEqual(3);
    expect((summary.materialBag as any).qingmao_escape_tracks_cover_baseline).toBeUndefined();
    expect((summary as any).currentDomain).toBe('南疆');
    expect(consoleErrors).toEqual([]);
  });
});
