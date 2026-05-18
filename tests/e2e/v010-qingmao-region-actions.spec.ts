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

test.describe('v0.10.0 Qingmao region action and combat readiness panel', () => {
  test('desktop routes clan-school action through local ledger', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await expect(page.locator('[data-testid="qingmao-scene-variant-section"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="qingmao-scene-variant-clan_school_courtyard"]:visible')).toContainText('族学演武坪');
    await expect(page.locator('[data-testid="qingmao-scene-variant-front_mountain_patrol"]:visible')).toContainText('前山巡查路');
    await expect(page.locator('[data-testid="qingmao-scene-variant-moonlit_resource_grove"]:visible')).toContainText('月草坡与酒坊支线');
    for (const variantId of ['clan_school_courtyard', 'front_mountain_patrol', 'moonlit_resource_grove']) {
      const loaded = await page.locator(`[data-testid="qingmao-scene-variant-asset-${variantId}"]:visible`).evaluate((node) => {
        const img = node as HTMLImageElement;
        return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
      });
      expect(loaded).toBe(true);
    }
    await expect(page.locator('[data-testid="qingmao-region-action-section"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="qingmao-region-action-clan_school_notice-clan_school_training"]:visible')).toContainText('族学/道场磨练');
    await expect(page.locator('[data-testid="qingmao-region-action-mountain_path_patrol-mountain_patrol"]:visible')).toContainText('山道巡查');
    await expect(page.locator('[data-testid="qingmao-resource-loop-section"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="qingmao-resource-loop-moonlight_grass_gathering"]:visible')).toContainText('月下巡采月华草');
    await expect(page.locator('[data-testid="qingmao-resource-loop-white_jade_gap_review"]:visible')).toContainText('缺口展示');
    await expect(page.locator('[data-testid="qingmao-combat-readiness-section"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="qingmao-combat-readiness-qingmao_encounter_clan_school_spar"]:visible')).toContainText('族学切磋');
    await page.locator('[data-testid="qingmao-resource-loop-moonlight_grass_gathering"]:visible').click();
    await expect(page.locator('[data-testid="action-panel"]:visible')).toContainText('月下巡采月华草 完成');
    await expect(page.locator('[data-testid="qingmao-resource-loop-moonlight_grass_gathering"]:visible')).toContainText('本场景已结算');
    const resourceSummary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((resourceSummary.materialBag as any).月华草).toBeGreaterThanOrEqual(1);
    expect(String((resourceSummary.lastWorldActionPromptSummary as any) || '')).toContain('本地青茅资源小循环');
    await page.getByTestId('side-panel-gu_dao').click();
    await page.locator('[data-testid=gu-dao-tab-gu_inventory]:visible').click();
    await expect(page.locator('[data-testid="gu-inventory-panel"]:visible')).toBeVisible();
    await expect(page.locator('[data-testid="qingmao-feeding-bridge-e2e_moonlight_gu"]:visible')).toContainText('月下巡采月华草');
    await page.locator('[data-testid="gu-feed-e2e_moonlight_gu"]:visible').click();
    await expect(page.locator('[data-testid="gu-inventory-panel"]:visible')).toContainText('喂养成功');
    const fedSummary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect(Number((fedSummary.materialBag as any).月华草 || 0)).toBe(0);
    await page.locator('[data-testid=gu-dao-tab-refine]:visible').click();
    await expect(page.locator('[data-testid="desktop-side-panel"]:visible')).toContainText('炼蛊');
    await page.locator('[data-testid="toggle-fragment-panel"]:visible').click();
    const fragmentPreview = page.locator('[data-testid="qingmao-fragment-preview-frag_moonlight_advanced"]:visible');
    await expect(fragmentPreview).toContainText('残缺·月光蛊精炼方');
    await expect(fragmentPreview).toContainText('完整蛊方只能由本地引擎解锁');
    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid="qingmao-combat-register-qingmao_encounter_clan_school_spar"]:visible').click();
    await expect(page.locator('[data-testid="action-panel"]:visible')).toContainText('已登记青茅凡战候选');
    const combatPanel = page.locator('[data-testid="narrative-combat-panel"]:visible');
    await expect(combatPanel).toBeVisible();
    const combatCandidate = combatPanel.locator('[data-testid="narrative-combat-candidate"]').first();
    await expect(combatCandidate).toContainText('族学切磋');
    await expect(combatCandidate).toContainText('入口校验通过');
    await expect(combatCandidate.locator('[data-testid="narrative-combat-reward-boundary"]')).toContainText('本地引擎结算');
    await expect(combatCandidate.locator('[data-testid="narrative-combat-reward-boundary"]')).toContainText('不直接发放蛊虫');
    await combatPanel.getByRole('button', { name: '收起' }).click();

    await page.locator('[data-testid="qingmao-region-action-clan_school_notice-clan_school_training"]:visible').click();
    await expect(page.locator('[data-testid="action-panel"]:visible')).toContainText(/本地引擎结算|磨练/);

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.trainingGround as any).lastStepCount).toBeGreaterThan(0);
    expect((summary.trainingGround as any).sceneBudgetRemaining).toBeLessThan(3);
    expect((summary.trainingGround as any).combatCandidateCount).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile reduced-motion keeps region cards readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await expect(page.locator('[data-testid="mobile-side-sheet"]:visible')).toBeVisible();
    const variant = page.locator('[data-testid="qingmao-scene-variant-clan_school_courtyard"]:visible');
    await expect(variant).toBeVisible();
    const variantBox = await variant.boundingBox();
    expect(variantBox?.width).toBeGreaterThan(300);
    const card = page.locator('[data-testid="qingmao-region-action-clan_school_notice-clan_school_training"]:visible');
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
    await expect(card).toContainText('AP 1');
    const resource = page.locator('[data-testid="qingmao-resource-loop-moonlight_grass_gathering"]:visible');
    await expect(resource).toBeVisible();
    const resourceBox = await resource.boundingBox();
    expect(resourceBox?.width).toBeGreaterThan(300);
    const readiness = page.locator('[data-testid="qingmao-combat-readiness-qingmao_encounter_clan_school_spar"]:visible');
    await expect(readiness).toBeVisible();
    const readinessBox = await readiness.boundingBox();
    expect(readinessBox?.width).toBeGreaterThan(300);

    expect(consoleErrors).toEqual([]);
  });

  test('registered Qingmao combat candidate enters the existing 5x3 battlefield route', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await page.locator('[data-testid="qingmao-combat-register-qingmao_encounter_clan_school_spar"]:visible').click();
    const combatCandidate = page.locator('[data-testid="narrative-combat-candidate"]:visible').first();
    await expect(combatCandidate).toContainText('入口校验通过');
    await expect(combatCandidate.locator('[data-testid="narrative-combat-reward-boundary"]')).toContainText('本地引擎结算');
    await combatCandidate.locator('[data-testid="enter-combat-candidate"]').click();

    await expect(page.locator('[data-testid="battlefield-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="battlefield-board"]')).toHaveAttribute('data-grid-size', '5x3');
    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.battlefieldCombat as any).gridPresetId).toBe('skirmish_5x3');
    expect((summary.battlefieldCombat as any).cellCount).toBe(15);
    expect(consoleErrors).toEqual([]);
  });
});
