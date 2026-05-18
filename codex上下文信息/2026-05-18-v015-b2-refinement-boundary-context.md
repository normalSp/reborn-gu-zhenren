# 2026-05-18 v0.15.0-b2 炼蛊/残方/失败代价第一刀交接

## 当前状态

`v0.15.0-b2` 本地质量门通过，待提交、推送、远端 CI。

本阶段新增 `qingmao_refinement_boundary_probe`，把残方不是完整蛊方、材料验证缺口、炼蛊失败代价和轻微社会注意整理为本地边界试读行动。

## 实现范围

- 新增 `src/engine/v015-qingmao-refinement-boundary.ts`
- 新增 `src/engine/v015-qingmao-refinement-boundary.test.ts`
- 更新 `src/store/slices/livingWorldSlice.ts`
- 更新 `src/store/slices/livingWorldSlice.test.ts`
- 更新 `src/components/game/FreeGoalPanel.tsx`
- 新增 `tests/e2e/v015-refinement-boundary.spec.ts`
- 新增 b2 记录和 Player Advocate 20 轮走查记录

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
- completedRecipes / complete recipe unlock
- refinement success / failure settlement
- market / black-market / commission
- route_entered / location unlock / escape success
- faction transfer / standing / warrant
- NPC death/capture
- save-format bump
- DeepSeek authority

## 关键防坑

- 不要从 `v015-qingmao-refinement-boundary.ts` 导入 `recipe-discovery.ts`。`recipe-discovery.ts` 会导入 store 并产生循环依赖风险。本阶段只读 `fragment-recipes.json` 和 `recipe-registry.ts`。
- 不调用 `attemptCompleteFragment()` 或 `synthesizeRecipe()`，因为它们会消耗材料或解锁配方。
- 玩家可见文案用“炼成结论/成败结论”，避免让否定句里的“炼蛊成功”被测试和玩家误读为正式结果。

## 验证

已通过：

```powershell
npm test -- --run src/engine/v015-qingmao-refinement-boundary.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npx playwright test tests/e2e/v015-refinement-boundary.spec.ts --reporter=line
npm run check:player-advocate-gate -- 指导大纲/v0.15.0/codex/00-总览/v0.15.0-b2-Player-Advocate-20轮走查记录.md 20
npm test -- --reporter=dot
npm run build
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:production-preview
```

结果摘要：

- focused unit：2 个 test file，17 个测试通过。
- TypeScript：通过。
- Playwright b2 e2e：1 个测试通过。
- Player Advocate gate：20 轮，95% 下一步理解率，通过。
- full unit：129 个 test file，726 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- runtime asset scan：173 files，zero-byte=0。
- Qingmao asset scan：23 entries，active=4，candidate=12，review-only=6，blocked=1。
- production-preview smoke：通过。

## Git 状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 本阶段提交：待创建
- 推送状态：待推送
- 远端 CI：待验证
- 不要 stage unrelated dirty/untracked files，例如 `doc/art/s0-qingmao-art-roadmap.md`、`src/data/image-maps.ts`、`指导大纲/vMiroFish/README.md`、`指导大纲/vMiroFish/requests/README.md`、`.cursor/`、`bgm/`、`artifacts/`、美术候选图和 `指导大纲/大方向/`。

## 下一步

完成 b2 commit/push/CI 后，可进入 `v0.15.0-b3 商队/市场窗口候选`。

b3 必须继续停在保守边界内：不开放完整坊市、正式价格表、商队加入、正式交易收益、黑市、委托代售、新存档字段或 DeepSeek 新权限，除非用户明确批准。
