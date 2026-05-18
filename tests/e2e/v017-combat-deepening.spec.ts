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

test.describe('v0.17.0 combat deepening first cut', () => {
  test('registers safe low-rank combat candidate and preserves reward/location boundaries', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    const section = page.locator('[data-testid="v017-combat-preparation-section"]:visible');
    await expect(section).toBeVisible();
    await expect(section).toContainText('MiroFish 只提供候选材料');

    const drill = page.locator('[data-testid="v017-combat-preparation-v017_combat_clan_school_moonblade_drill"]:visible');
    await expect(drill).toContainText('族学月刃练习');
    await expect(drill).toContainText('可登记');
    await expect(drill).toContainText('禁止');
    await expect(drill).toContainText('奖励');
    await drill.locator('[data-testid="v017-combat-register-v017_combat_clan_school_moonblade_drill"]').click();

    await expect(page.locator('[data-testid="action-panel"]:visible')).toContainText('已登记 v0.17 战斗候选');
    const combatPanel = page.locator('[data-testid="narrative-combat-panel"]:visible');
    await expect(combatPanel).toBeVisible();
    const combatCandidate = combatPanel.locator('[data-testid="narrative-combat-candidate"]').first();
    await expect(combatCandidate).toContainText('族学月刃练习');
    await expect(combatCandidate).toContainText('入口校验通过');
    await expect(combatCandidate.locator('[data-testid="narrative-combat-reward-boundary"]')).toContainText('不直接发放蛊虫');

    await combatCandidate.locator('[data-testid="enter-combat-candidate"]').click();
    await expect(page.locator('[data-testid="battlefield-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="battlefield-board"]')).toHaveAttribute('data-grid-size', '5x3');

    const summary = await page.evaluate(() => (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary());
    expect((summary.trainingGround as any).combatCandidateCount).toBeGreaterThan(0);
    expect((summary.battlefieldCombat as any).gridPresetId).toBe('skirmish_5x3');
    expect((summary.battlefieldCombat as any).cellCount).toBe(15);
    expect(consoleErrors).toEqual([]);
  });

  test('shows Gu and squad counter boundaries without adding new bottom navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const consoleErrors = await openQingmaoRegionActionDemo(page);

    await page.getByTestId('side-panel-actions').click();
    await expect(page.locator('[data-testid="v017-combat-boundary-panel"]:visible').first()).toContainText('不发放奖励');
    await expect(page.locator('[data-testid="v017-counter-boundary-v017_counter_moonblade_range_line"]:visible').first()).toContainText('月刃线性反制');
    await expect(page.locator('[data-testid="v017-squad-tactic-v017_squad_clan_school_morale"]:visible').first()).toContainText('族学士气');

    await expect(page.locator('[data-testid^="side-panel-"]')).toHaveCount(6);
    await expect(page.getByTestId('bottom-nav')).not.toContainText('凡战');
    await expect(page.getByTestId('bottom-nav')).not.toContainText('杀招反制');

    await page.getByTestId('side-panel-gu_dao').click();
    await page.locator('[data-testid=gu-dao-tab-kill_moves]:visible').click();
    await expect(page.locator('[data-testid="gu-dao-panel"]:visible')).toContainText('战斗反制与小队边界');
    await expect(page.locator('[data-testid="gu-dao-panel"]:visible')).toContainText('普通攻击化');
    expect(consoleErrors).toEqual([]);
  });
});
