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

test.describe('v3.6 transient AgentProposal micro-expansion', () => {
  test('shows synthetic L2/L3 multi-lanes and 90-round deterministic gate without persistence', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-agent_proposal]:visible').click();
    const panel = page.locator('[data-testid="v360-runtime-agent-micro-expansion-panel"]:visible');

    await expect(panel.locator('[data-testid="v340-agent-proposal-status"]')).toContainText('v3.6 synthetic L2/L3 micro-expansion');
    await expect(panel.locator('[data-testid="v350-agent-proposal-lifecycle-audit"]')).toContainText('runFingerprint：否');
    await expect(panel.locator('[data-testid="v350-agent-proposal-lifecycle-summary"]')).toContainText('候选');
    await expect(panel.locator('[data-testid="v340-agent-proposal-list"]')).toContainText('generic_l2');
    await expect(panel.locator('[data-testid="v340-agent-proposal-list"]')).toContainText('generic_l3');
    await expect(panel.locator('[data-testid="v340-agent-proposal-list"]')).toContainText('候选 lane 只帮助玩家理解可能的意图压力');
    await expect(panel.locator('[data-testid="v350-agent-proposal-lifecycle-details"]')).toContainText('future gate 待决策候选');
    await expect(panel.locator('[data-testid="v340-agent-proposal-deterministic"]')).toContainText('90 轮 v3.6');
    await expect(panel.locator('[data-testid="v360-agent-proposal-deterministic-result"]')).toContainText('v3.6 accepted 90/90');
    await expect(panel.locator('[data-testid="v360-agent-proposal-deterministic-result"]')).toContainText('runFingerprint false');
    await expect(panel.locator('[data-testid="v340-agent-proposal-boundaries"]')).toContainText('不新增 save field');
    await expect(panel.locator('[data-testid="v340-agent-proposal-boundaries"]')).toContainText('不调用 live DeepSeek');
    await expect(panel.locator('[data-testid="v340-agent-proposal-boundaries"]')).toContainText('不触碰真实原著事实');

    await panel.locator('[data-testid="v340-agent-proposal-cycle"]').click();
    await expect(panel.locator('[data-testid="v360-agent-proposal-deterministic-result"]')).toContainText('v3.6 accepted 90/90');

    for (const blocked of ['方源', '春秋蝉', '重生', '回溯', '正式加入商队', '奖励已发放', 'NPC已死亡', '通缉成立', '招揽成功']) {
      await expect(panel).not.toContainText(blocked);
    }

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary as any).agentProposalState).toBeUndefined();
    expect((summary as any).runtimeAgentState).toBeUndefined();
    expect((summary as any).agentLifecycleState).toBeUndefined();
    expect((summary as any).agentMicroExpansionState).toBeUndefined();
    expect((summary as any).runFingerprint).toBeUndefined();
    expect((summary.materialBag as any).agentProposalState).toBeUndefined();
    expect((summary.materialBag as any).runtimeAgentState).toBeUndefined();
    expect((summary.materialBag as any).agentMicroExpansionState).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
