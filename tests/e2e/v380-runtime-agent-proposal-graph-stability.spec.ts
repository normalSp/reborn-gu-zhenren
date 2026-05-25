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

test.describe('v3.8 transient AgentProposal graph stability', () => {
  test('shows long-horizon graph stability without persistence or authority expansion', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-world').click();
    await page.locator('[data-testid=world-hub-tab-agent_proposal]:visible').click();
    const panel = page.locator('[data-testid="v380-runtime-agent-proposal-graph-stability-panel"]:visible');

    await expect(panel.locator('[data-testid="v340-agent-proposal-status"]')).toContainText('v3.8 proposal graph stability');
    await expect(panel.locator('[data-testid="v350-agent-proposal-lifecycle-audit"]')).toContainText('v3.8 proposal graph stability');
    await expect(panel.locator('[data-testid="v380-agent-proposal-stability-summary"]')).toContainText('multi-pressure sources');
    await expect(panel.locator('[data-testid="v380-agent-proposal-stability-summary"]')).toContainText('same-start variation 150 轮');
    await expect(panel.locator('[data-testid="v380-agent-proposal-stability-summary"]')).toContainText('memory contamination：否');
    await expect(panel.locator('[data-testid="v380-agent-proposal-pressure-lanes"]')).toContainText('候选');
    await expect(panel.locator('[data-testid="v380-agent-proposal-pressure-lanes"]')).toContainText('不写事实');
    await expect(panel.locator('[data-testid="v340-agent-proposal-deterministic"]')).toContainText('150 轮 v3.8 stability 门');
    await expect(panel.locator('[data-testid="v380-agent-proposal-deterministic-result"]')).toContainText('v3.8 accepted 150/150');
    await expect(panel.locator('[data-testid="v380-agent-proposal-deterministic-result"]')).toContainText('acceptedForGate true');
    await expect(panel.locator('[data-testid="v340-agent-proposal-boundaries"]')).toContainText('候选不是事实');
    await expect(panel.locator('[data-testid="v340-agent-proposal-boundaries"]')).toContainText('禁止 runFingerprint');
    await expect(panel.locator('[data-testid="v340-agent-proposal-boundaries"]')).toContainText('live DeepSeek');

    await panel.locator('[data-testid="v340-agent-proposal-cycle"]').click();
    await expect(panel.locator('[data-testid="v380-agent-proposal-deterministic-result"]')).toContainText('v3.8 accepted 150/150');

    for (const blocked of ['方源', '春秋蝉', '重生', '回溯', '正式加入商队', '奖励已发放', 'NPC已死亡', '通缉成立', '招揽成功', '封锁生效']) {
      await expect(panel).not.toContainText(blocked);
    }

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary as any).agentProposalState).toBeUndefined();
    expect((summary as any).runtimeAgentState).toBeUndefined();
    expect((summary as any).agentLifecycleState).toBeUndefined();
    expect((summary as any).agentMicroExpansionState).toBeUndefined();
    expect((summary as any).agentProposalGraphState).toBeUndefined();
    expect((summary as any).agentProposalGraphStabilityState).toBeUndefined();
    expect((summary as any).smallFactionState).toBeUndefined();
    expect((summary as any).factionStandingState).toBeUndefined();
    expect((summary as any).runFingerprint).toBeUndefined();
    expect((summary.materialBag as any).agentProposalState).toBeUndefined();
    expect((summary.materialBag as any).runtimeAgentState).toBeUndefined();
    expect((summary.materialBag as any).agentMicroExpansionState).toBeUndefined();
    expect((summary.materialBag as any).agentProposalGraphState).toBeUndefined();
    expect((summary.materialBag as any).agentProposalGraphStabilityState).toBeUndefined();
    expect((summary.materialBag as any).smallFactionState).toBeUndefined();
    expect(consoleErrors).toEqual([]);
  });
});
