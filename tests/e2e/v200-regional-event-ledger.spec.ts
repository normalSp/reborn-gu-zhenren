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

async function createOuterEdgePressure(page: Page) {
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
}

test.describe('v2.0 regional event ledger', () => {
  test('syncs v25 WorldCore regionalEventLedger without formal outcomes or hidden leakage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);
    await createOuterEdgePressure(page);

    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-regional_ledger]:visible').click();
    const panel = page.locator('[data-testid="v200-regional-event-ledger-panel"]:visible');

    await expect(panel.locator('[data-testid="v200-ledger-status"]')).toContainText('WorldCore 区域事件账本');
    await expect(panel.locator('[data-testid="v200-ledger-audit"]')).toContainText('SAVE_FORMAT_VERSION = 25');
    await expect(panel.locator('[data-testid="v200-ledger-audit"]')).toContainText('单一 regionalEventLedger');
    await panel.locator('[data-testid="v200-regional-event-ledger-sync"]').click();
    await expect(panel.locator('[data-testid="v200-ledger-action-result"]')).toContainText('WorldCore 已登记区域事件账本');
    await expect(panel.locator('[data-testid="v200-ledger-event-list"]')).toContainText('盘问');
    await expect(panel.locator('[data-testid="v200-ledger-event-list"]')).toContainText('商队');
    await expect(panel.locator('[data-testid="v200-ledger-followups"]')).toContainText('待处理后续');
    await expect(panel.locator('[data-testid="v200-ledger-boundaries"]')).toContainText('DeepSeek 只能根据本地账本写叙事');
    await expect(panel.locator('[data-testid="v200-ledger-boundaries"]')).toContainText('不新增 runFingerprint');
    await expect(panel.locator('[data-testid="v200-ledger-source-refs"]')).toContainText('v2.0.0-b1:regionalEventLedger');
    await expect(panel).not.toContainText('春秋蝉');
    await expect(panel).not.toContainText('重生');
    await expect(panel).not.toContainText('回溯');
    await expect(panel).not.toContainText('正式加入商队');
    await expect(panel).not.toContainText('奖励已发放');
    await expect(panel).not.toContainText('NPC已死亡');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary as any).regionalEventLedger.status).toBe('events_tracked');
    expect((summary as any).regionalEventLedger.authority).toBe('worldcore_region_engine');
    expect((summary as any).regionalEventLedger.activeRegionKey).toBe('southern_border_outer_edge_low_rank');
    expect((summary as any).regionalEventLedger.eventCount).toBeGreaterThanOrEqual(5);
    expect((summary as any).regionalEventLedger.eventKinds).toEqual(expect.arrayContaining([
      'checkpoint_questioning',
      'caravan_contact',
      'market_pressure',
    ]));
    expect((summary as any).runFingerprint).toBeUndefined();
    expect((summary as any).regionalLifeState).toBeUndefined();
    expect((summary as any).areaLivingState).toBeUndefined();
    expect((summary as any).identityRouteState).toBeUndefined();
    expect((summary as any).professionState).toBeUndefined();
    expect((summary.materialBag as any).reward).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
