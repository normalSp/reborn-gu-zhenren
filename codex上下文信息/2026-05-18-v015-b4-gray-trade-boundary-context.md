# 2026-05-18 v0.15.0-b4 灰色交易/委托边界样本交接

## 当前状态

`v0.15.0-b4` 本地质量门已通过，待提交推送与远端 CI。

本阶段新增 `qingmao_gray_trade_boundary_probe`，把黑市传闻、委托代售、假货、陷阱、势力关注、身份洗白和稳定套利等高风险内容转写成延期边界样本。它让玩家看见“后面可以往这条线探索”，但不开放正式黑市、委托收益、库存价格或交易结算。

## 实现范围

- 新增 `src/engine/v015-qingmao-gray-trade-boundary.ts`
- 新增 `src/engine/v015-qingmao-gray-trade-boundary.test.ts`
- 更新 `src/store/slices/livingWorldSlice.ts`
- 更新 `src/store/slices/livingWorldSlice.test.ts`
- 更新 `src/components/game/FreeGoalPanel.tsx`
- 新增 `tests/e2e/v015-gray-trade-boundary.spec.ts`
- 新增 `v0.15.0-b4-灰色交易委托边界样本.md`
- 新增 `v0.15.0-b4-Player-Advocate-20轮走查记录.md`

## MiroFish 边界

使用已通过 intake 的候选包：

- `v015_low_rank_black_market_commission_boundary_pack_export_ready.json`

吸收方式：

- 只进入 RebornG-owned `candidate/test/deferred boundary`。
- 不进入 runtime canon truth。
- 不给 DeepSeek 新权限。
- 不把 hidden/quote/original text 暴露给 UI 或 prompt。

## 权限边界

本阶段只写既有 v22 字段：

- `knownFacts`
- `npcMemories`
- `playerGoals`
- `actionConsequences`
- `worldClock.lastActionId`
- `localActionLedger`
- `lastWorldActionReturnContext`

本阶段不写：

- `materialBag`
- inventory
- currency
- formal price table
- shop inventory
- item purchase / item sale
- caravan join
- formal market / black-market / commission settlement
- commission profit
- identity wash
- formal faction pressure
- route_entered / location unlock / escape success
- faction transfer / standing / warrant
- NPC death/capture
- save-format bump
- DeepSeek authority

## 关键防坑

- b4 必须依赖 b3 市场窗口上下文；没有 `qingmao_market_window_candidate_baseline` 或 `qingmao_market_window_probe` 时不得写 store。
- 灰色交易包中的 `black_market`、`commission`、`fraud`、`trap`、`faction_attention` 是风险标签，不是开放系统。
- 本阶段刻意不写 `factionPressure`，因为 intake 边界明确阻断 `faction_pressure_write`；势力关注只作为 deferred risk/hint，不作为正式压力状态。
- UI 必须显示“不开黑市 / 不开委托收益 / 不写库存价格 / 不结算买卖”，避免玩家误解为市场系统已开放。

## 验证

已通过：

```powershell
npm test -- --run src/engine/v015-qingmao-gray-trade-boundary.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npx playwright test tests/e2e/v015-gray-trade-boundary.spec.ts --reporter=line
npm run check:player-advocate-gate -- 指导大纲/v0.15.0/codex/00-总览/v0.15.0-b4-Player-Advocate-20轮走查记录.md 20
npm test -- --reporter=dot
npm run build
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:production-preview
```

结果摘要：

- focused unit：2 个 test file，19 个测试通过。
- TypeScript：通过。
- Playwright b4 e2e：1 个测试通过。
- Player Advocate gate：20 轮，95% 下一步理解率，通过。
- full unit：131 个 test file，732 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- runtime asset scan：173 files，audio=45，images=117，json=11，zero-byte=0。
- Qingmao asset scan：23 entries，active=4，candidate=12，review-only=6，blocked=1。
- production-preview smoke：通过。

## Git 状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 本阶段提交：待提交。
- 推送状态：待推送。
- 远端 CI：待推送后确认。
- 不要 stage unrelated dirty/untracked files，例如 `doc/art/s0-qingmao-art-roadmap.md`、`src/data/image-maps.ts`、`指导大纲/vMiroFish/README.md`、`指导大纲/vMiroFish/requests/README.md`、`.cursor/`、`bgm/`、`artifacts/`、美术候选图和 `指导大纲/大方向/`。

## 下一步

先提交并推送 b4，确认 GitHub Actions 通过。通过后进入 `v0.15.0-rc` 质量收束。

rc 仍不得开放正式材料/元石/库存消耗、完整市场/黑市/委托系统、新存档字段、地点/阵营/NPC 生死结果或 DeepSeek 新权限，除非用户重新决策。
