import { expect, test, type Page } from '@playwright/test';

type RebornE2eWindow = Window & {
  __REBORN_E2E__?: {
    loadSave: (save: unknown) => { success: boolean; error?: string };
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

async function mockDeepSeek(page: Page): Promise<{ calls: Array<'connectivity' | 'runtime'> }> {
  const calls: Array<'connectivity' | 'runtime'> = [];
  await page.route('https://api.deepseek.com/v1/chat/completions', async route => {
    const payload = route.request().postDataJSON() as any;
    const system = String(payload?.messages?.find((item: any) => item.role === 'system')?.content || '');
    const isConnectivity = system.includes('测试响应系统');
    calls.push(isConnectivity ? 'connectivity' : 'runtime');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: isConnectivity ? 'e2e-connectivity' : 'e2e-opening',
        object: 'chat.completion',
        created: 1778222420,
        model: payload?.model || 'deepseek-v4-flash',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: isConnectivity
                ? JSON.stringify({ message: '天道已响应', status: 'ok' })
                : JSON.stringify({
                  narrative: {
                    text: '青茅山晨雾未散，族学钟声从石阶尽头传来。你握紧刚领到的资源牌，听见执事催促新人列队，山寨里的目光有审视也有算计。无需重新读档，新的蛊师人生已经真正开始，接下来每一步都要自己承担风险。',
                    choices: [
                      { id: 'c1', text: '查看族学今日安排', risk: 'low', risk_note: '稳妥了解局势' },
                      { id: 'c2', text: '试探山寨外的异动', risk: 'medium', risk_note: '可能引来执事盘问' },
                    ],
                  },
                  state_update: {},
                }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 30,
          total_tokens: 150,
          prompt_cache_hit_tokens: isConnectivity ? 0 : 60,
          prompt_cache_miss_tokens: isConnectivity ? 120 : 60,
        },
      }),
    });
  });
  return { calls };
}

test.describe('pre-v1.1 bug cleanup regressions', () => {
  test('new character creation starts the runtime narrative without requiring save/load', async ({ page }) => {
    const consoleErrors = await installConsoleGuards(page);
    const mock = await mockDeepSeek(page);
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('deepseek_api_key', 'e2e-opening-key');
    });

    await page.goto('/?e2e=1');
    await page.getByRole('button', { name: '测试连通' }).click();
    await expect(page.getByText('天道已响应')).toBeVisible();
    await page.getByRole('button', { name: '直接进入' }).click();
    await page.getByRole('button', { name: /青茅山·开窍之日/ }).click();
    await page.getByRole('button', { name: '确认选择' }).click();
    await expect(page.getByTestId('timeline-config-screen')).toBeVisible();
    await page.getByRole('button', { name: '下一步' }).click();
    await page.getByRole('button', { name: '确认配置' }).click();
    await page.getByRole('button', { name: '下一步' }).click();
    await page.getByRole('button', { name: '确认配置' }).click();
    await page.getByPlaceholder('输入你的蛊师之名...').fill('寒舟');
    await page.getByRole('button', { name: '踏入蛊界' }).click();

    await expect(page.getByTestId('game-screen-shell')).toBeVisible();
    await expect(page.getByText('青茅山晨雾未散，族学钟声从石阶尽头传来。')).toBeVisible();
    await expect(page.getByText('等待天命显现...')).toHaveCount(0);
    await page.waitForFunction(() => {
      const summary = (window as RebornE2eWindow).__REBORN_E2E__?.getStateSummary();
      return summary?.pipelinePhase === 'RESOLVED';
    });

    expect(mock.calls.filter(call => call === 'runtime')).toHaveLength(1);
    expect(consoleErrors).toEqual([]);
  });

  test('rank-five early-stage aperture still shows breakthrough rather than ascension', async ({ page }) => {
    const consoleErrors = await installConsoleGuards(page);
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('gu-zhenren-tutorial-skipped', 'true');
    });
    await page.goto('/?e2e=1');
    await page.waitForFunction(() => !!(window as RebornE2eWindow).__REBORN_E2E__);

    const result = await page.evaluate(() => {
      return (window as RebornE2eWindow).__REBORN_E2E__!.loadSave({
        formatVersion: 22,
        timestamp: 'pre-v110-rank-five-initial',
        meta: { playerName: '五转初阶测试', realm: '五转初阶', turn: 3, gameMode: 'canon' },
        state: {
          turn: 3,
          currentDomain: '南疆',
          currentChapterId: 'qingmaoshan',
          profile: { name: '五转初阶测试', background: '青茅山测试档', realm: { grand: 5, sub: '初阶', label: '五转初阶' } },
          attributes: { 资质: 8, 体魄: 7, 心智: 7, 气运: 5 },
          vitals: { health: { current: 180, max: 180 }, essence: { current: 160, max: 160 }, essenceType: 'primeval' },
          aperture: {
            type: 'mortal',
            rank: 5,
            subRank: '初阶',
            primevalSea: { color: '#c9a84a', colorName: '黄金', fillPercent: 85 },
            apertureWall: { state: '坚实', opacity: 0.9, description: '五转初阶窍壁仍需打磨' },
            capacity: 15,
            carriedGu: 2,
            capacityLocked: false,
          },
          cultivationState: { progress: 160 },
          inventory: [
            { id: 'moon', name: '月光蛊', tier: 1, path: '光道', currentState: 'optimal', hungerCounter: 0 },
          ],
          currentNarrative: {
            narrative: { text: '五转初阶测试档已载入。', choices: [] },
            state_update: {},
          },
        },
      });
    });
    expect(result.success).toBe(true);

    await expect(page.getByTestId('game-screen-shell')).toBeVisible();
    await page.getByTestId('side-panel-role').click();
    const rolePanel = page.locator('[data-testid="desktop-side-panel"]:visible');
    await rolePanel.getByTestId('role-hub-tab-aperture').click();
    await expect(rolePanel.getByTestId('aperture-cultivation-actions')).toBeVisible();
    await expect(rolePanel.getByTestId('aperture-breakthrough-action')).toBeVisible();
    await expect(rolePanel.getByTestId('aperture-ascension-action')).toHaveCount(0);
    await expect(rolePanel.getByTestId('aperture-cultivation-actions')).toContainText('五转巅峰后才能尝试升仙');
    expect(consoleErrors).toEqual([]);
  });
});
