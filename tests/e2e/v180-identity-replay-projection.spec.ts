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

test.describe('v1.8 identity replay projection', () => {
  test('shows identity route deck without persistence, formal identity, prop-word leakage, or hidden leakage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    const currentAction = page.locator('[data-testid="action-hub-content-current"]:visible');
    const registerCombat = currentAction.locator('[data-testid="v017-combat-register-v017_combat_clan_school_moonblade_drill"]');
    await registerCombat.scrollIntoViewIfNeeded();
    await registerCombat.click();

    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const actionPanel = page.locator('[data-testid="free-goal-panel"]:visible');
    await actionPanel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，在南疆外缘找商队短工、散修短活、护送守夜、采集跑腿、临时市场和打听递话，但不要正式身份、正式职业、地点、奖励或NPC命运');
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
    await page.locator('[data-testid=world-hub-tab-identity_replay]:visible').click();
    const panel = page.locator('[data-testid="v180-identity-replay-panel"]:visible');

    await expect(panel.locator('[data-testid="v180-identity-replay-status"]')).toContainText('身份路线');
    await expect(panel.locator('[data-testid="v180-identity-replay-status"]')).toContainText('身份路线投影可读');
    await expect(panel.locator('[data-testid="v180-identity-replay-audit"]')).toContainText('projection-first');
    await expect(panel.locator('[data-testid="v180-identity-replay-audit"]')).toContainText('SAVE_FORMAT_VERSION = 24');
    await expect(panel.locator('[data-testid="v180-identity-replay-audit"]')).toContainText('不返回 identityRouteState');
    await expect(panel.locator('[data-testid="v180-identity-replay-replayability"]')).toContainText('同开局差异度');
    await expect(panel.locator('[data-testid="v180-identity-route-caravan_temp_hand"]')).toContainText('商队临工');
    await expect(panel.locator('[data-testid="v180-identity-route-rogue_short_work"]')).toContainText('散修短活');
    await expect(panel.locator('[data-testid="v180-identity-route-low_rank_guard_candidate"]')).toContainText('护送候选');
    await expect(panel.locator('[data-testid="v180-identity-route-gathering_runner"]')).toContainText('采集跑腿');
    await expect(panel.locator('[data-testid="v180-identity-route-message_intel_runner"]')).toContainText('消息跑腿');
    await expect(panel.locator('[data-testid="v180-identity-pressure-identity_check_window"]')).toContainText('身份盘问窗口');
    await expect(panel.locator('[data-testid="v180-identity-pressure-permission_chain_prop_word"]')).toContainText('许可词风险');
    await expect(panel.locator('[data-testid="v180-identity-boundaries"]')).toContainText('不新增 identityRouteState');
    await expect(panel.locator('[data-testid="v180-identity-boundaries"]')).toContainText('五类身份路线');
    await expect(panel.locator('[data-testid="v180-identity-boundaries"]')).toContainText('MiroFish a2 export');
    await expect(panel.locator('[data-testid="v180-identity-source-refs"]')).toContainText('v1.8.0-a1:D-181-002');
    await expect(panel.locator('[data-testid="v180-identity-source-refs"]')).toContainText('v1.8.0-a2:southern_border_low_rank_identity_route_life_slice');

    for (const blocked of ['春秋蝉', '重生', '回溯', '木牌', '令牌', '腰牌', '名册', '登记', '报到', '负责人点头', '管事安排', '跟队', '临时帐篷', '商队成员', '护卫身份', '散修落脚点', '情报人', '进入商家城', '奖励已发放', 'NPC已死亡']) {
      await expect(panel).not.toContainText(blocked);
    }

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.routeLocation as any).status).toBeTruthy();
    expect((summary as any).identityRouteState).toBeUndefined();
    expect((summary as any).professionState).toBeUndefined();
    expect((summary as any).regionalEventLedger).toBeUndefined();
    expect((summary as any).runFingerprint).toBeUndefined();
    expect((summary.materialBag as any).identityRouteState).toBeUndefined();
    expect((summary.materialBag as any).professionState).toBeUndefined();
    expect((summary.materialBag as any).reward).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
