# 2026-05-18 v0.15.0-b1 补给/喂养缺口行动样板交接

## 当前状态

`v0.15.0-b1` 完成，已提交、推送，远端 CI 通过。

本阶段新增 `qingmao_supply_feeding_preparation_probe`，把离山补给、落脚遮掩、酒虫食料压力整理为本地前置行动。

## 实现范围

- 新增 `src/engine/v015-qingmao-supply-feeding-preparation.ts`
- 新增 `src/engine/v015-qingmao-supply-feeding-preparation.test.ts`
- 更新 `src/store/slices/livingWorldSlice.ts`
- 更新 `src/store/slices/livingWorldSlice.test.ts`
- 更新 `src/components/game/FreeGoalPanel.tsx`
- 新增 `tests/e2e/v015-supply-feeding-preparation.spec.ts`
- 新增 b1 记录和 Player Advocate 20 轮走查记录

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
- market / black-market / commission
- route_entered / location unlock / escape success
- faction transfer / standing / warrant
- NPC death/capture
- save-format bump
- DeepSeek authority

## 验证

已通过：

```powershell
npm test -- --run src/engine/v015-qingmao-supply-feeding-preparation.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npx playwright test tests/e2e/v015-supply-feeding-preparation.spec.ts --reporter=line
npm run check:player-advocate-gate -- 指导大纲/v0.15.0/codex/00-总览/v0.15.0-b1-Player-Advocate-20轮走查记录.md 20
npm test -- --reporter=dot
npm run build
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:production-preview
```

结果摘要：

- focused unit：2 个 test file，16 个测试通过。
- TypeScript：通过。
- Playwright b1 e2e：1 个测试通过。
- Player Advocate gate：20 轮，95% 下一步理解率，通过。
- full unit：128 个 test file，723 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- runtime asset scan：173 files，zero-byte=0。
- Qingmao asset scan：23 entries，active=4，candidate=12，review-only=6，blocked=1。
- production-preview smoke：通过。

## Git 状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 本阶段提交：`8ec823c feat: 接入v0.15补给喂养行动样板`
- 推送状态：已推送到 `origin/codex/v013-npc-faction-reaction`
- 远端 CI：GitHub Actions run `26019950577` 通过
- 不要 stage unrelated dirty/untracked files，例如 `doc/art/s0-qingmao-art-roadmap.md`、`src/data/image-maps.ts`、`指导大纲/vMiroFish/README.md`、`指导大纲/vMiroFish/requests/README.md`、`.cursor/`、`bgm/`、`artifacts/`、美术候选图和 `指导大纲/大方向/`。

## 下一步

可进入 `v0.15.0-b2 炼蛊/残方/失败代价第一刀`。

b2 必须继续停在保守边界内：不消耗库存、不解锁完整蛊方、不判定炼蛊成功、不新增存档字段、不扩张 DeepSeek 权限，除非用户明确批准。
