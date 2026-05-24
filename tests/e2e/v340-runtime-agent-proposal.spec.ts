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

test.describe('v3.4 transient AgentProposal runtime first cut', () => {
  test('shows L2/L3 transient candidate expressions without save writes or authority drift', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-agent_proposal]:visible').click();
    const panel = page.locator('[data-testid="v340-runtime-agent-proposal-panel"]:visible');

    await expect(panel.locator('[data-testid="v340-agent-proposal-status"]')).toContainText('Runtime AgentProposal');
    await expect(panel.locator('[data-testid="v340-agent-proposal-status"]')).toContainText('候选');
    await expect(panel.locator('[data-testid="v340-agent-proposal-audit"]')).toContainText('transient_proposal_only');
    await expect(panel.locator('[data-testid="v340-agent-proposal-audit"]')).toContainText('no_save_field_no_migration_no_runFingerprint');
    await expect(panel.locator('[data-testid="v340-agent-proposal-audit"]')).toContainText('live DeepSeek：否');
    await expect(panel.locator('[data-testid="v340-agent-proposal-list"]')).toContainText('L2 次要意图');
    await expect(panel.locator('[data-testid="v340-agent-proposal-list"]')).toContainText('L3 场景关键意图');
    await expect(panel.locator('[data-testid="v340-agent-proposal-list"]')).toContainText('候选表达，不是事实');
    await expect(panel.locator('[data-testid="v340-agent-proposal-rejections"]')).toContainText('持久化写入候选');
    await expect(panel.locator('[data-testid="v340-agent-proposal-rejections"]')).toContainText('live DeepSeek 候选');
    await expect(panel.locator('[data-testid="v340-agent-proposal-deterministic"]')).toContainText('30 轮 deterministic');
    await expect(panel.locator('[data-testid="v340-agent-proposal-boundaries"]')).toContainText('不新增 save field');
    await expect(panel.locator('[data-testid="v340-agent-proposal-boundaries"]')).toContainText('不调用 live DeepSeek');
    await expect(panel.locator('[data-testid="v340-agent-proposal-source-refs"]')).toContainText('v3.4.0:D-340-001');

    await panel.locator('[data-testid="v340-agent-proposal-cycle"]').click();
    await expect(panel.locator('[data-testid="v340-agent-proposal-list"]')).toContainText('transient');

    for (const blocked of ['方源', '春秋蝉', '重生', '回溯', '正式加入商队', '奖励已发放', 'NPC已死亡', '通缉成立', '招揽成功']) {
      await expect(panel).not.toContainText(blocked);
    }

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary as any).agentProposalState).toBeUndefined();
    expect((summary as any).runtimeAgentState).toBeUndefined();
    expect((summary as any).runFingerprint).toBeUndefined();
    expect((summary.materialBag as any).agentProposalState).toBeUndefined();
    expect((summary.materialBag as any).runtimeAgentState).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
