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

test.describe('v1.5 conflict aftermath projection', () => {
  test('shows conflict aftermath as projection-only without conflict save fields or formal outcomes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    const currentAction = page.locator('[data-testid="action-hub-content-current"]:visible');
    const registerCombat = currentAction.locator('[data-testid="v017-combat-register-v017_combat_clan_school_moonblade_drill"]');
    await registerCombat.scrollIntoViewIfNeeded();
    await registerCombat.click();

    await page.locator('[data-testid=action-hub-tab-free_goal]:visible').click();
    const actionPanel = page.locator('[data-testid="free-goal-panel"]:visible');
    await actionPanel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山，沿山路避开伏击和追杀注意，但不要写正式通缉、奖励或 NPC 生死');
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
    await page.locator('[data-testid=world-hub-tab-conflict_aftermath]:visible').click();
    const panel = page.locator('[data-testid="v150-conflict-aftermath-panel"]:visible');

    await expect(panel.locator('[data-testid="v150-conflict-status"]')).toContainText('冲突后果解释层');
    await expect(panel.locator('[data-testid="v150-conflict-status"]')).toContainText('冲突后果投影可读');
    await expect(panel.locator('[data-testid="v150-conflict-audit"]')).toContainText('projection-first');
    await expect(panel.locator('[data-testid="v150-conflict-audit"]')).toContainText('SAVE_FORMAT_VERSION = 24');
    await expect(panel.locator('[data-testid="v150-conflict-audit"]')).toContainText('不返回 conflictConsequenceState');
    await expect(panel.locator('[data-testid="v150-conflict-posture-route_ambush_risk"]')).toContainText('路线伏击风险');
    await expect(panel.locator('[data-testid="v150-conflict-posture-pursuit_attention_window"]')).toContainText('追杀注意窗口');
    await expect(panel.locator('[data-testid="v150-conflict-posture-countermeasure_gap"]')).toContainText('反制缺口');
    await expect(panel.locator('[data-testid="v150-conflict-posture-squad_formation_readiness"]')).toContainText('小队/阵法准备度');
    await expect(panel.locator('[data-testid="v150-conflict-boundaries"]')).toContainText('不新增 conflictConsequenceState');
    await expect(panel.locator('[data-testid="v150-conflict-boundaries"]')).toContainText('不写掉落');
    await expect(panel.locator('[data-testid="v150-conflict-boundaries"]')).toContainText('NPC 生死');
    await expect(panel.locator('[data-testid="v150-conflict-boundaries"]')).toContainText('DeepSeek 只能写叙事');
    await expect(panel.locator('[data-testid="v150-conflict-source-refs"]')).toContainText('v1.5.0-a1:D-151-001');
    await expect(panel.locator('[data-testid="v150-conflict-source-refs"]')).toContainText('v1.5.0-a2:conflict-topic-slice-intake');
    await expect(panel.locator('[data-testid="v150-conflict-source-refs"]')).toContainText('v0.17:combat-deepening-rules');
    await expect(panel).not.toContainText('春秋蝉');
    await expect(panel).not.toContainText('重生');
    await expect(panel).not.toContainText('回溯');
    await expect(panel).not.toContainText('正式通缉已生效');
    await expect(panel).not.toContainText('追杀令已生效');
    await expect(panel).not.toContainText('奖励已发放');
    await expect(panel).not.toContainText('地点已解锁');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.trainingGround as any).combatCandidateCount).toBeGreaterThanOrEqual(1);
    expect((summary as any).conflictConsequenceState).toBeUndefined();
    expect((summary as any).pursuitState).toBeUndefined();
    expect((summary as any).combatAftermathState).toBeUndefined();
    expect((summary.materialBag as any).conflictConsequenceState).toBeUndefined();
    expect((summary.materialBag as any).pursuitState).toBeUndefined();
    expect((summary.materialBag as any).combatAftermathState).toBeUndefined();
    expect((summary.materialBag as any).reward).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
