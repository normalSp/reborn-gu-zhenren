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

test.describe('v0.15.0-b2 refinement and fragment boundary', () => {
  test('records fragment and failure-cost boundaries without recipe unlocks or material use', async ({ page }) => {
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
    await panel.locator('[data-testid="free-goal-cover-tracks-run"]').click();
    await panel.locator('[data-testid="free-goal-mountain-pass-route-run"]').click();
    await panel.locator('[data-testid="free-goal-supply-feeding-prep"]').click();

    const refinementPanel = panel.locator('[data-testid="free-goal-refinement-boundary-panel"]');
    await expect(refinementPanel).toContainText('残方/炼蛊边界');
    await expect(refinementPanel).toContainText('不消耗材料');
    await expect(refinementPanel).toContainText('不解锁蛊方');
    await refinementPanel.locator('[data-testid="free-goal-refinement-boundary"]').click();

    await expect(panel).toContainText('已试读残方与失败代价');
    await expect(panel).toContainText('refinement:recipe_fragment_incomplete_formula_boundary');
    await expect(panel).toContainText('fragment:frag_moonlight_advanced');
    await expect(panel).not.toContainText('残方补全成功');
    await expect(panel).not.toContainText('解锁「');
    await expect(panel).not.toContainText('材料已消耗');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'qingmao_refinement_fragment_boundary_baseline',
    ]));
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_qingmao_refinement_boundary_guyue_shanzhai_attention',
    ]));
    expect((summary.livingWorld as any).npcMemoryIds).toEqual(expect.arrayContaining([
      'npc_memory_qingmao_refinement_boundary_local_watch',
    ]));
    expect((summary.materialBag as any).qingmao_refinement_fragment_boundary_baseline).toBeUndefined();
    expect((summary as any).currentDomain).toBe('南疆');
    expect(consoleErrors).toEqual([]);
  });
});
