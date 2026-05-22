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

test.describe('v1.7 regional life projection', () => {
  test('shows regional life pressure deck without persistence, formal outcome, or hidden leakage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    const currentAction = page.locator('[data-testid="action-hub-content-current"]:visible');
    const registerCombat = currentAction.locator('[data-testid="v017-combat-register-v017_combat_clan_school_moonblade_drill"]');
    await registerCombat.scrollIntoViewIfNeeded();
    await registerCombat.click();

    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const actionPanel = page.locator('[data-testid="free-goal-panel"]:visible');
    await actionPanel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，在南疆外缘找商队短工、临时市场和遮蔽窗口，但不要正式进城、加入势力或拿奖励');
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
    await page.locator('[data-testid=world-hub-tab-regional_life]:visible').click();
    const panel = page.locator('[data-testid="v170-regional-life-panel"]:visible');

    await expect(panel.locator('[data-testid="v170-regional-life-status"]')).toContainText('区域活世界');
    await expect(panel.locator('[data-testid="v170-regional-life-status"]')).toContainText('区域活世界投影可读');
    await expect(panel.locator('[data-testid="v170-regional-life-audit"]')).toContainText('projection-first');
    await expect(panel.locator('[data-testid="v170-regional-life-audit"]')).toContainText('SAVE_FORMAT_VERSION = 25');
    await expect(panel.locator('[data-testid="v170-regional-life-audit"]')).toContainText('不返回 regionalLifeState');
    await expect(panel.locator('[data-testid="v170-regional-life-replayability"]')).toContainText('同开局差异度');
    await expect(panel.locator('[data-testid="v170-regional-life-pressure-outer_edge_interrogation"]')).toContainText('外缘盘问');
    await expect(panel.locator('[data-testid="v170-regional-life-pressure-caravan_contact_by_labor"]')).toContainText('商队短工窗口');
    await expect(panel.locator('[data-testid="v170-regional-life-pressure-temporary_market_window"]')).toContainText('临时市场窗口');
    await expect(panel.locator('[data-testid="v170-regional-life-pressure-shelter_debt_window"]')).toContainText('遮蔽与人情债');
    await expect(panel.locator('[data-testid="v170-regional-life-pressure-road_event_protocol"]')).toContainText('路途事件协议');
    await expect(panel.locator('[data-testid="v170-regional-life-boundaries"]')).toContainText('不新增 regionalLifeState');
    await expect(panel.locator('[data-testid="v170-regional-life-boundaries"]')).toContainText('同开局可重玩差异度');
    await expect(panel.locator('[data-testid="v170-regional-life-boundaries"]')).toContainText('MiroFish a2 export');
    await expect(panel.locator('[data-testid="v170-regional-life-source-refs"]')).toContainText('v1.7.0-a1:D-171-002');
    await expect(panel.locator('[data-testid="v170-regional-life-source-refs"]')).toContainText('v1.7.0-a2:southern_border_low_rank_outer_edge_life_slice');
    await expect(panel).not.toContainText('春秋蝉');
    await expect(panel).not.toContainText('重生');
    await expect(panel).not.toContainText('回溯');
    await expect(panel).not.toContainText('正式加入商队');
    await expect(panel).not.toContainText('进入商家城');
    await expect(panel).not.toContainText('奖励已发放');
    await expect(panel).not.toContainText('NPC已死亡');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.routeLocation as any).status).toBeTruthy();
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'v018_qingmao_route_entry_threshold_commitment',
      'v018_qingmao_route_candidate_continuation_view',
      'v018_qingmao_route_pressure_backflow_baseline',
    ]));
    expect((summary as any).regionalLifeState).toBeUndefined();
    expect((summary as any).areaLivingState).toBeUndefined();
    expect((summary as any).regionalEventLedger.status).toBe('not_started');
    expect((summary as any).runFingerprint).toBeUndefined();
    expect((summary.materialBag as any).regionalLifeState).toBeUndefined();
    expect((summary.materialBag as any).areaLivingState).toBeUndefined();
    expect((summary.materialBag as any).reward).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
