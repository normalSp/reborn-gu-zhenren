import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    loadSave: (save: unknown) => { success: boolean; error?: string };
    getStateSummary: () => Record<string, unknown>;
    clearRuntime: () => void;
  };
};

interface LongScenario {
  name: string;
  file: string;
  minPartySize?: number;
  expectDuelCombat?: boolean;
  expectSquadCombat?: boolean;
  expectDispatch?: boolean;
  expectTerrain?: boolean;
  expectExtreme?: boolean;
  expectTreasureYellowHeavenPools?: boolean;
}

const saveDir = path.join(process.cwd(), '测试存档', 'v0.7.0');

const scenarios: LongScenario[] = [
  {
    name: '一转商队小队路径',
    file: 'v070b_mortal_caravan_squad.json',
    minPartySize: 1,
  },
  {
    name: '三王山小队战路径',
    file: 'v070b_sanwangshan_squad_combat.json',
    minPartySize: 1,
    expectSquadCombat: true,
  },
  {
    name: '蛊仙期小队战路径',
    file: 'v070b_immortal_squad_combat.json',
    minPartySize: 1,
    expectSquadCombat: true,
  },
  {
    name: '小队外派侦察专项',
    file: 'v070c_dispatch_scout.json',
    minPartySize: 1,
    expectDispatch: true,
  },
  {
    name: '小队外派交易专项',
    file: 'v070c_dispatch_trade.json',
    minPartySize: 1,
    expectDispatch: true,
  },
  {
    name: '小队外派拉拢专项',
    file: 'v070c_dispatch_recruit.json',
    minPartySize: 1,
    expectDispatch: true,
  },
  {
    name: '地形森林战斗专项',
    file: 'v070c_terrain_forest_battle.json',
    minPartySize: 1,
    expectTerrain: true,
  },
  {
    name: '地形阵法战斗专项',
    file: 'v070c_terrain_formation_battle.json',
    minPartySize: 1,
    expectTerrain: true,
  },
  {
    name: '十绝体灾劫专项',
    file: 'v070c_extreme_calamity.json',
    minPartySize: 1,
    expectExtreme: true,
  },
  {
    name: '十绝体空窍压力专项',
    file: 'v070c_aperture_visual_pressure.json',
    minPartySize: 1,
    expectExtreme: true,
  },
  {
    name: '宝黄天全品类专项',
    file: 'v070c_tyh_all_pools.json',
    minPartySize: 1,
    expectTreasureYellowHeavenPools: true,
  },
  {
    name: '小队全量回归专项',
    file: 'v070c_full_regression_squad.json',
    minPartySize: 1,
    expectDispatch: true,
    expectTerrain: true,
  },
  {
    name: '中文存档：古月山寨一转开局',
    file: '01-开局-古月山寨一转.json',
  },
  {
    name: '中文存档：角色曲方源年轮',
    file: '14-角色曲-方源年轮.json',
    minPartySize: 1,
  },
  {
    name: '中文存档：三王山小队战专项',
    file: '09-小队战-三王山遭遇.json',
    minPartySize: 1,
    expectSquadCombat: true,
  },
  {
    name: '中文存档：蛊仙期小队战专项',
    file: '10-小队战-蛊仙期遭遇.json',
    minPartySize: 1,
    expectSquadCombat: true,
  },
  {
    name: '中文存档：全量回归小队外派地形',
    file: '27-全量回归-小队外派地形.json',
    minPartySize: 1,
    expectDispatch: true,
    expectTerrain: true,
  },
];

function readSave(file: string): unknown {
  const fullPath = path.join(saveDir, file);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

async function installConsoleGuards(page: Page): Promise<string[]> {
  const errors: string[] = [];
  const fatalPatterns = [
    /Maximum update depth exceeded/i,
    /\[PIPE\]\s+ZOD_FAIL/i,
    /\[PIPE\]\s+FETCH_FAIL/i,
    /Invalid key in record/i,
    /Cannot read properties/i,
    /Uncaught/i,
    /ReferenceError/i,
    /TypeError/i,
  ];

  page.on('console', msg => {
    const text = msg.text();
    if (fatalPatterns.some(pattern => pattern.test(text))) {
      errors.push(`[${msg.type()}] ${text}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.message}`);
  });

  return errors;
}

function getNumber(summary: Record<string, unknown>, key: string): number {
  return Number(summary[key] ?? 0);
}

function getNestedNumber(summary: Record<string, unknown>, parent: string, key: string): number {
  const value = summary[parent] as Record<string, unknown> | null | undefined;
  return Number(value?.[key] ?? 0);
}

async function mockDeepSeekConnection(page: Page): Promise<void> {
  await page.route('https://api.deepseek.com/v1/chat/completions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-title-connectivity',
        object: 'chat.completion',
        created: 1778222420,
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({ message: '天道已响应', status: 'ok' }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1,
          completion_tokens: 1,
          total_tokens: 2,
          prompt_cache_hit_tokens: 0,
        },
      }),
    });
  });
}

test.describe('v0.7.0 发布收束长测', () => {
  test('标题页测试连通成功后才显示三入口，并可载入战斗存档', async ({ page }) => {
    const consoleErrors = await installConsoleGuards(page);
    await mockDeepSeekConnection(page);
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('deepseek_api_key', 'e2e-title-key');
    });

    await page.goto('/?e2e=1');
    await expect(page.getByRole('button', { name: '测试连通' })).toBeVisible();
    await expect(page.getByRole('button', { name: '直接进入' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /继续冒险/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /载入存档/ })).toHaveCount(0);

    await page.getByRole('button', { name: '测试连通' }).click();
    await expect(page.getByText('天道已响应')).toBeVisible();
    await expect(page.getByRole('button', { name: '直接进入' })).toBeVisible();
    await expect(page.getByRole('button', { name: /继续冒险/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /载入存档/ })).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /载入存档/ }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(saveDir, '09-小队战-三王山遭遇.json'));

    await page.waitForFunction(() => {
      const summary = (window as RebornE2eWindow).__REBORN_E2E__?.getStateSummary();
      return summary?.screenState === 'game_play' && summary?.squadCombatPhase;
    });

    const summary = await page.evaluate(() => {
      return (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary();
    });
    expect(summary.screenState).toBe('game_play');
    expect(summary.squadCombatPhase).not.toBeNull();
    expect(consoleErrors).toEqual([]);
  });

  for (const scenario of scenarios) {
    test(`${scenario.name} 可以加载并保持核心状态稳定`, async ({ page }) => {
      const consoleErrors = await installConsoleGuards(page);
      const save = readSave(scenario.file);

      await page.goto('/?e2e=1');
      await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);

      const result = await page.evaluate(payload => {
        return (window as RebornE2eWindow).__REBORN_E2E__!.loadSave(payload);
      }, save);
      expect(result.success, result.error).toBe(true);

      await page.waitForFunction(() => {
        const summary = (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary();
        return summary.screenState === 'game_play';
      });

      await page.waitForTimeout(750);

      const summary = await page.evaluate(() => {
        return (window as RebornE2eWindow).__REBORN_E2E__!.getStateSummary();
      });

      expect(summary.screenState).toBe('game_play');
      expect(String(summary.playerRole)).toBe('original_participant');
      expect(String(summary.playerName)).not.toContain('方源');
      expect(getNumber(summary, 'partySize')).toBeGreaterThanOrEqual(scenario.minPartySize ?? 0);
      expect(
        summary.pipelineError === null || summary.pipelineError === 'API Key 未设置',
        `Unexpected pipeline error: ${String(summary.pipelineError)}`,
      ).toBe(true);

      if (scenario.expectDuelCombat) {
        expect(summary.duelPhase, `${scenario.name} 应保留单人战斗状态`).not.toBeNull();
      }

      if (scenario.expectSquadCombat) {
        expect(summary.squadCombatPhase, `${scenario.name} 应保留小队战斗状态`).not.toBeNull();
      }

      if (scenario.expectDispatch) {
        expect(getNumber(summary, 'squadDispatchTaskCount'), `${scenario.name} 应加载外派任务真相源`).toBeGreaterThan(0);
        expect(
          getNumber(summary, 'squadDispatchEligibleMemberCount'),
          `${scenario.name} 应能观察到可派遣成员`,
        ).toBeGreaterThan(0);
      }

      if (scenario.expectTerrain) {
        expect(summary.terrainPreview, `${scenario.name} 应有地形/阵法预览`).not.toBeNull();
        expect(getNestedNumber(summary, 'terrainPreview', 'damageMultiplier')).toBeGreaterThan(0);
      }

      if (scenario.expectExtreme) {
        expect(summary.extremePhysiquePressure, `${scenario.name} 应有十绝体压力摘要`).not.toBeNull();
        expect(getNestedNumber(summary, 'extremePhysiquePressure', 'aperturePressure')).toBeGreaterThan(0);
      }

      if (scenario.expectTreasureYellowHeavenPools) {
        const poolTotal =
          getNestedNumber(summary, 'auctionPoolCategories', 'immortalGu') +
          getNestedNumber(summary, 'auctionPoolCategories', 'materials') +
          getNestedNumber(summary, 'auctionPoolCategories', 'recipes') +
          getNestedNumber(summary, 'auctionPoolCategories', 'killerMoves');
        expect(poolTotal, `${scenario.name} 应能观察到宝黄天全品类池`).toBeGreaterThan(0);
      }

      expect(consoleErrors).toEqual([]);
    });
  }
});
