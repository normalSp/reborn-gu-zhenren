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

test.describe('v1.0 free intent release closure', () => {
  test('accepts normal and extreme free-intent samples without formal outcomes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，靠补给、蛊虫和商队窗口在南疆低阶路线活下去');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();
    await panel.locator('[data-testid="free-goal-confirm"]').click();

    const closurePanel = panel.locator('[data-testid="free-goal-v100-intent-closure-panel"]');
    await expect(closurePanel).toContainText('v1.0 自由意图收束');
    await expect(closurePanel).toContainText('需补裁决');
    await expect(closurePanel.locator('[data-testid="free-goal-v100-intent-closure-run"]')).toBeDisabled();

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
    await panel.locator('[data-testid="free-goal-v100-continuity-run"]').click();
    await panel.locator('[data-testid="free-goal-v100-life-loop-run"]').click();

    await expect(closurePanel).toContainText('可验收');
    await expect(closurePanel.locator('[data-testid="free-goal-v100-intent-samples"]')).toContainText('盗天魔尊传承');
    await expect(closurePanel.locator('[data-testid="free-goal-v100-intent-samples"]')).toContainText('一转拿九转蛊');
    await expect(closurePanel.locator('[data-testid="free-goal-v100-intent-samples"]')).toContainText('跟踪方源');
    await expect(closurePanel.locator('[data-testid="free-goal-v100-intent-samples"]')).toContainText('前往商家城');
    await expect(closurePanel.locator('[data-testid="free-goal-v100-intent-redlines"]')).toContainText('正式结论');
    await closurePanel.locator('[data-testid="free-goal-v100-intent-closure-run"]').click();
    await expect(panel).toContainText('已验收 v1.0 自由意图与极端意图收束');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'v100_low_rank_life_loop_release_acceptance',
      'v100_free_intent_release_closure_acceptance',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_v100_free_intent_public_risk',
    ]));
    expect((summary.livingWorld as any).npcMemoryIds).toEqual(expect.arrayContaining([
      'npc_memory_v100_free_intent_public_boundary',
    ]));
    expect((summary.materialBag as any).rank_nine_gu).toBeUndefined();
    expect((summary.materialBag as any).rank_nine_gu_reward).toBeUndefined();
    expect((summary.materialBag as any).theft_heaven_inheritance).toBeUndefined();
    expect((summary.materialBag as any).inheritance_grant).toBeUndefined();
    expect((summary.materialBag as any).route_entered).toBeUndefined();
    expect((summary.materialBag as any).currentRoute).toBeUndefined();
    expect((summary.materialBag as any).currentRegion).toBeUndefined();
    expect((summary.materialBag as any).location_unlock).toBeUndefined();
    expect((summary.materialBag as any).faction_transfer).toBeUndefined();
    expect((summary.materialBag as any).npc_life_result).toBeUndefined();
    await expect(closurePanel).not.toContainText('九转蛊已获得');
    await expect(closurePanel).not.toContainText('盗天传承已获得');
    await expect(closurePanel).not.toContainText('商家城核心已开放');
    await expect(closurePanel).not.toContainText('NPC 已死亡');
    await expect(closurePanel).not.toContainText('隐藏因果已揭示');
    expect(consoleErrors).toEqual([]);
  });
});
