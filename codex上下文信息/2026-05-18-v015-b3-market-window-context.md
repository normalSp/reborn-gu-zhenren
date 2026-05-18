# 2026-05-18 v0.15.0-b3 商队/市场窗口候选第一刀交接

## 当前状态

`v0.15.0-b3` 本地质量门通过，待提交、推送和远端 CI。

本阶段新增 `qingmao_market_window_probe`，把商队接触、公开问价、身份担保、公开理由、价格压力和交易风险整理为本地候选窗口行动。

## 实现范围

- 新增 `src/engine/v015-qingmao-market-window.ts`
- 新增 `src/engine/v015-qingmao-market-window.test.ts`
- 更新 `src/store/slices/livingWorldSlice.ts`
- 更新 `src/store/slices/livingWorldSlice.test.ts`
- 更新 `src/components/game/FreeGoalPanel.tsx`
- 新增 `tests/e2e/v015-market-window.spec.ts`
- 新增 b3 记录和 Player Advocate 20 轮走查记录

## 权限边界

本阶段只写既有 v22 字段：

- `knownFacts`
- `factionPressure`
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
- market / black-market / commission settlement
- route_entered / location unlock / escape success
- faction transfer / standing / warrant
- NPC death/capture
- save-format bump
- DeepSeek authority

## 关键防坑

- b3 的 `market_supply_preparation_before_trade` 是 supply focus，不属于 `buildQingmaoLowRankEconomyPlan({ focus: 'market' })` 输出；测试断言不能把 b1 的补给规则强塞成 b3 market 规则。
- 引擎 JSON 中允许出现 forbidden/boundary 字段，例如 `formal_shop_inventory` 或 “不得自动判定交易成功”；测试要验证没有 `*_opened`、`currency_delta_applied`、`caravan_joined` 或正向成功语义，不要误把禁用边界当泄漏。
- UI 文案必须明确“候选窗口”，不能让玩家以为市场、库存、价格表或商队加入已经开放。

## 验证

已通过：

```powershell
npm test -- --run src/engine/v015-qingmao-market-window.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npx playwright test tests/e2e/v015-market-window.spec.ts --reporter=line
npm run check:player-advocate-gate -- 指导大纲/v0.15.0/codex/00-总览/v0.15.0-b3-Player-Advocate-20轮走查记录.md 20
npm test -- --reporter=dot
npm run build
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:production-preview
```

结果摘要：

- focused unit：2 个 test file，18 个测试通过。
- TypeScript：通过。
- Playwright b3 e2e：1 个测试通过。
- Player Advocate gate：20 轮，95% 下一步理解率，通过。
- full unit：130 个 test file，729 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- runtime asset scan：173 files，zero-byte=0。
- Qingmao asset scan：23 entries，active=4，candidate=12，review-only=6，blocked=1。
- production-preview smoke：通过。

## Git 状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 本阶段提交：待创建
- 推送状态：待推送
- 远端 CI：待推送后确认
- 不要 stage unrelated dirty/untracked files，例如 `doc/art/s0-qingmao-art-roadmap.md`、`src/data/image-maps.ts`、`指导大纲/vMiroFish/README.md`、`指导大纲/vMiroFish/requests/README.md`、`.cursor/`、`bgm/`、`artifacts/`、美术候选图和 `指导大纲/大方向/`。

## 下一步

先提交、推送并确认 GitHub Actions。远端通过后，更新 b3 远端证据。

如果 b3 远端通过，下一阶段可进入 `v0.15.0-b4 灰色交易/委托边界样本`。

b4 必须继续停在保守边界内：黑市、委托代售、灰色交易、稳定套利、诈骗设局、势力关注都只能先做边界/测试/延期样本，不开放正式收益、库存、地点、阵营、任务、奖励、存档字段或 DeepSeek 新权限，除非用户明确批准。
