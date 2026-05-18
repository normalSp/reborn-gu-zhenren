# 2026-05-18 v0.15.0-rc 质量收束交接

## 当前状态

`v0.15.0-rc` 已完成并推送，远端 CI 通过。

v0.15 主线 `低阶蛊师经济、补给、炼养用深循环` 已完成本地收束：补给/喂养、残方/炼蛊边界、商队/市场窗口、灰色交易/委托边界四段都保持在候选、边界、风险账本范围内。

## 权限边界

本阶段不新增运行时代码，不写：

- `materialBag`
- inventory
- currency
- price table
- shop inventory
- item purchase / item sale
- formal market / black-market / commission settlement
- commission profit
- identity wash
- formal faction pressure
- route_entered / location unlock / escape success
- faction transfer / standing / warrant
- NPC death/capture
- save-format bump
- live DeepSeek probe
- DeepSeek authority

## 验证

已通过：

```powershell
npx tsc --noEmit --pretty false
npm test -- --reporter=dot
npm run build
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:player-visible-copy
npm run check:player-advocate-gate -- 指导大纲/v0.15.0/codex/00-总览/v0.15.0-rc-Player-Advocate-60轮走查记录.md 60
npx playwright test tests/e2e/v015-supply-feeding-preparation.spec.ts tests/e2e/v015-refinement-boundary.spec.ts tests/e2e/v015-market-window.spec.ts tests/e2e/v015-gray-trade-boundary.spec.ts --reporter=line
npm run test:e2e:long
npm run check:production-preview
```

结果摘要：

- TypeScript：通过。
- full unit：131 个 test file，732 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- runtime asset scan：173 files，audio=45，images=117，json=11，zero-byte=0。
- Qingmao asset scan：23 entries，active=4，candidate=12，review-only=6，blocked=1。
- player-visible-copy scan：249 files scanned，通过。
- Player Advocate gate：60 轮，96.7% 下一步理解率，2 个困惑轮次，通过。
- v0.15 Playwright e2e：4 个测试通过。
- long e2e：29 个测试通过。
- production-preview smoke：通过。

## Player Advocate 归类

- 轮次 19/35 的正式诈骗、陷阱、反制需求已由 `F-015-b4-003` 承接为 future_sample_pool。
- 轮次 52 的移动端残方边界卡文字密度问题已新增 `F-015-rc-001` 和 `V15-FUT-014`，不阻塞 rc。

## Git 状态

- 当前分支：`codex/v013-npc-faction-reaction`
- rc 收束提交：`1c15ecb docs: 完成v0.15-rc本地收束`。
- 推送状态：已推送到 `origin/codex/v013-npc-faction-reaction`。
- 远端 CI：GitHub Actions run `26028779369` 通过。
- 不要 stage unrelated dirty/untracked files，例如 `doc/art/s0-qingmao-art-roadmap.md`、`src/data/image-maps.ts`、`指导大纲/vMiroFish/README.md`、`指导大纲/vMiroFish/requests/README.md`、`.cursor/`、`bgm/`、`artifacts/`、美术候选图和 `指导大纲/大方向/`。

## 下一步

`v0.15.0` 已完成为本地开发里程碑。下一步停止，等待用户决策下一大版本方向。
