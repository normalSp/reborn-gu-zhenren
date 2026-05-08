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

const saveDir = path.join(process.cwd(), '测试存档', 'v0.7.0');

const scenarios = [
  {
    name: '一转商队小队路径',
    file: 'v070b_mortal_caravan_squad.json',
    minPartySize: 1,
  },
  {
    name: '三王山小队战路径',
    file: 'v070b_sanwangshan_squad_combat.json',
    minPartySize: 1,
  },
  {
    name: '蛊仙期小队战路径',
    file: 'v070b_immortal_squad_combat.json',
    minPartySize: 1,
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

test.describe('v0.7.0-c 三路径长测基线', () => {
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
      expect(Number(summary.partySize ?? 0)).toBeGreaterThanOrEqual(scenario.minPartySize);
      expect(
        summary.pipelineError === null || summary.pipelineError === 'API Key 未设置',
        `Unexpected pipeline error: ${String(summary.pipelineError)}`,
      ).toBe(true);
      expect(consoleErrors).toEqual([]);
    });
  }
});
