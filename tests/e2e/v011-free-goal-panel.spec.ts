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

test.describe('v0.11.0-a3-2 free goal panel', () => {
  test('records confirmed free goals without granting items or location unlocks', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-free_goal').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await expect(panel).toBeVisible();
    await panel.locator('[data-testid="free-goal-input"]').fill('我要拿九转蛊');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();

    const ruling = page.locator('[data-testid="free-goal-ruling"]:visible');
    await expect(ruling).toContainText('长期目标');
    await expect(ruling).toContainText('遥远野心');
    await expect(ruling).toContainText('playerGoals');

    await panel.locator('[data-testid="free-goal-confirm"]').click();
    await expect(page.locator('[data-testid="free-goal-ledger"]:visible')).toContainText('item:rank_nine_gu');
    await expect(page.locator('[data-testid="free-goal-ledger"]:visible')).toContainText('延期');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).playerGoalCount).toBe(1);
    expect((summary.livingWorld as any).playerGoals[0]).toEqual(expect.objectContaining({
      intentType: 'obtain_item',
      targetRef: 'item:rank_nine_gu',
      status: 'deferred',
    }));
    expect((summary.materialBag as any).rank_nine_gu).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });

  test('prepares Qingmao escape route from a confirmed goal without leaving the region', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-free_goal').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要逃离青茅山');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();

    const ruling = page.locator('[data-testid="free-goal-ruling"]:visible');
    await expect(ruling).toContainText('需前置');
    await expect(ruling).toContainText('living_world_goal');
    await expect(ruling).toContainText('route:qingmao_exit');

    await panel.locator('[data-testid="free-goal-confirm"]').click();
    const ledger = page.locator('[data-testid="free-goal-ledger"]:visible');
    await expect(ledger).toContainText('region:outside_qingmao');
    await expect(ledger.locator('[data-testid="free-goal-escape-route-prep"]')).toBeVisible();
    await ledger.locator('[data-testid="free-goal-escape-route-prep"]').click();
    await expect(panel).toContainText('已完成逃离青茅山路线准备第一步');
    await expect(panel).toContainText('不开放新地域');
    await expect(panel).not.toContainText('离开成功');
    await panel.locator('[data-testid="free-goal-reaction-bridge-run"]').click();
    await expect(panel).toContainText('已推演青茅局势反应');
    await expect(panel).toContainText('不改变阵营或声望');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).playerGoalCount).toBe(1);
    expect((summary.livingWorld as any).playerGoals[0]).toEqual(expect.objectContaining({
      intentType: 'travel',
      targetRef: 'region:outside_qingmao',
      status: 'deferred',
    }));
    expect((summary.livingWorld as any).knownFactIds).toEqual(['qingmao_escape_route_preparation_baseline']);
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_qingmao_escape_route_guyue_shanzhai_pursuit_risk',
      expect.stringMatching(/^faction_pressure_qingmao_reaction_/),
    ]));
    expect((summary.livingWorld as any).npcMemoryCount).toBeGreaterThanOrEqual(6);
    expect((summary.livingWorld as any).actionConsequenceCount).toBe(2);
    expect((summary as any).currentDomain).toBe('南疆');
    expect((summary.materialBag as any).qingmao_escape_route_preparation_baseline).toBeUndefined();
    expect((summary as any).lastWorldActionPromptSummary).toContain('已匹配');
    expect(consoleErrors).toEqual([]);
  });

  test('shows actionable investigations without enabling goal persistence', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-free_goal').click();
    await expect(page.locator('[data-testid="mobile-side-sheet"]:visible')).toBeVisible();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要跟踪方源');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();

    await expect(page.locator('[data-testid="free-goal-ruling"]:visible')).toContainText('可尝试');
    await expect(page.locator('[data-testid="free-goal-ruling"]:visible')).toContainText('field_action');
    await expect(panel.locator('[data-testid="free-goal-investigate"]')).toBeEnabled();
    await expect(panel.locator('[data-testid="free-goal-confirm"]')).toBeDisabled();
    await panel.locator('[data-testid="free-goal-investigate"]').click();
    await expect(panel).toContainText('受保护线索');
    await expect(panel.locator('[data-testid="free-goal-followups"]')).toContainText('暂缓深追方源');
    await expect(panel.locator('[data-testid="free-goal-followups"]')).toContainText('提示，不是正式行动');
    await expect(panel).not.toContainText('春秋蝉');
    await expect(panel).not.toContainText('回溯');
    await expect(panel).not.toContainText('fang_yuan_private_causality_hidden_anchor');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).playerGoalCount).toBe(0);
    expect((summary.livingWorld as any).knownFactCount).toBe(0);
    expect((summary.livingWorld as any).hiddenFactRefIds).toEqual(['fang_yuan_private_causality_hidden_anchor']);
    expect((summary.livingWorld as any).npcMemoryCount).toBe(1);
    expect((summary.livingWorld as any).actionConsequenceCount).toBe(1);
    expect(consoleErrors).toEqual([]);
  });

  test('runs Fang Yuan public-evidence inquiry without leaking hidden causality', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-free_goal').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要打听方源在客栈和族学的公开记录');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();

    await expect(page.locator('[data-testid="free-goal-ruling"]:visible')).toContainText('可尝试');
    await expect(panel.locator('[data-testid="free-goal-fang-yuan-public-evidence"]')).toBeEnabled();
    await panel.locator('[data-testid="free-goal-fang-yuan-public-evidence"]').click();
    await expect(panel).toContainText('已完成方源公开旁证询问');
    await expect(panel).toContainText('隐藏边界只作本地保护');
    await expect(panel).not.toContainText('春秋蝉');
    await expect(panel).not.toContainText('重生');
    await expect(panel).not.toContainText('回溯');
    await expect(panel).not.toContainText('追踪成功');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactCount).toBeGreaterThanOrEqual(5);
    expect((summary.livingWorld as any).knownFactIds).toEqual(expect.arrayContaining([
      'fang_yuan_public_evidence_inn_lodging_shift',
      'fang_yuan_public_evidence_clan_school_ranking',
    ]));
    expect((summary.livingWorld as any).hiddenFactRefIds).toEqual(expect.arrayContaining([
      'fy_hidden_supply_purpose_boundary',
    ]));
    expect((summary.livingWorld as any).npcMemoryIds).toEqual([
      'npc_memory_fang_yuan_public_evidence_inquiry_caution',
    ]);
    expect((summary.livingWorld as any).factionPressureIds).toEqual([
      'faction_pressure_fang_yuan_public_evidence_guyue_shanzhai_suspicion',
    ]);
    expect((summary.livingWorld as any).actionConsequenceCount).toBe(1);
    expect((summary.materialBag as any).fang_yuan_public_evidence_inn_lodging_shift).toBeUndefined();
    expect((summary as any).lastWorldActionPromptSummary).toContain('公开旁证');
    expect(consoleErrors).toEqual([]);
  });

  test('executes visible-scope investigations into known facts without rewards', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-free_goal').click();
    const panel = page.locator('[data-testid="free-goal-panel"]:visible');
    await panel.locator('[data-testid="free-goal-input"]').fill('我要调查白家');
    await panel.locator('[data-testid="free-goal-adjudicate"]').click();

    const ruling = page.locator('[data-testid="free-goal-ruling"]:visible');
    await expect(ruling).toContainText('可尝试');
    await expect(ruling).toContainText('knownFacts');
    await expect(ruling).toContainText('qingmao_three_clans_layout');
    await panel.locator('[data-testid="free-goal-investigate"]').click();
    await expect(panel).toContainText('已完成可见范围调查');
    await expect(panel.locator('[data-testid="free-goal-followups"]')).toContainText('谨慎核对白家接触窗口');
    await expect(panel.locator('[data-testid="free-goal-followups"]')).toContainText('可执行试探');
    await expect(panel.locator('[data-testid="free-goal-followups"]')).toContainText('禁止 faction_transfer');
    await panel.locator('[data-testid="free-goal-bai-contact"]').click();
    await expect(panel).toContainText('已执行白家接触窗口试探');
    await expect(panel).toContainText('不改变阵营');
    await expect(panel).not.toContainText('投靠成功');
    await expect(panel).not.toContainText('春秋蝉');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.livingWorld as any).knownFactIds).toEqual([
      'qingmao_three_clans_layout',
      'baijia_bai_ning_bing_public_talent',
    ]);
    expect((summary.livingWorld as any).hiddenFactRefCount).toBe(0);
    expect((summary.livingWorld as any).factionPressureCount).toBe(3);
    expect((summary.livingWorld as any).factionPressureIds[0]).toContain('baijia_opportunity');
    expect((summary.livingWorld as any).factionPressureIds).toEqual(expect.arrayContaining([
      'faction_pressure_qingmao_baijia_contact_window_opportunity',
      'faction_pressure_qingmao_baijia_contact_window_guyue_shanzhai_suspicion',
    ]));
    expect((summary.livingWorld as any).actionConsequenceCount).toBe(2);
    expect((summary.materialBag as any).baijia_bai_ning_bing_public_talent).toBeUndefined();
    expect((summary as any).lastWorldActionPromptSummary).toContain('白家接触窗口试探');
    expect(consoleErrors).toEqual([]);
  });
});
