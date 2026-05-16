# 2026-05-15 v0.11.0-a3-2 自由目标面板上下文交接

## 阶段

`v0.11.0-a3-2` 第一刀已完成。

用户批准：

- 使用单独“自由目标”面板。
- 玩家确认后的长期目标可以持久化。
- 只能写入 `livingWorldState.playerGoals`。
- 不写奖励、地点、势力归属、NPC 生死、正史锚点、结局或 DeepSeek 新权限。

## 代码改动

- `src/store/slices/livingWorldSlice.ts`
  - 新增 `previewWorldIntentAction(rawText)`。
  - 新增 `confirmWorldIntentGoalAction(adjudication)`。
  - 预览只裁决不写状态。
  - 确认只接受 `player_input` 且存在 `suggestedPlayerGoal` 的裁决。
  - 写入必须走 `applyLivingWorldPatch({ source: 'living_world_engine' })`。
- `src/components/game/FreeGoalPanel.tsx`
  - 新增自由目标面板。
  - 显示裁决、风险、前置/代价、路由、写入范围和目标账本。
- `src/components/game/GameScreen.tsx`
  - 新增 `side-panel-free_goal`。
- `src/e2e/installE2eHarness.ts`
  - 状态摘要新增 `livingWorld.playerGoalCount/playerGoals/knownFactCount/hiddenFactRefCount`。
- `src/engine/v011-world-intent-engine.ts`
  - 补充 fuzzy 分类词：搞到、弄到、盯着、弄死、靠山、寻找等。

## 测试改动

- `src/store/slices/livingWorldSlice.test.ts`
  - 预览不写状态。
  - 确认逃离青茅山只写 `playerGoals`。
  - 可行动调查类意图不硬写长期目标。
  - DeepSeek/UI patch 直写仍拒绝。
- `src/engine/v011-world-intent-engine.test.ts`
  - a3-2 fuzzy 样本 14 条，全部保持 `statePatchApplied=false`。
- `tests/e2e/v011-free-goal-panel.spec.ts`
  - 桌面确认九转蛊长期目标，只写 `playerGoals`，不写材料/奖励。
  - 移动端跟踪方源只展示可尝试裁决，确认按钮禁用。

## 验证

已通过：

```powershell
npm test -- src/store/slices/livingWorldSlice.test.ts src/engine/v011-world-intent-engine.test.ts
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts
npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts
npm run build
npm test
```

`npm test` 结果：101 个 test file、604 个测试通过。

## 文档与 Skill

已同步：

- `指导大纲/v0.11.0/codex/00-总览/README.md`
- `v0.11.0-小版本执行路线图.md`
- `v0.11.0-真相源索引.md`
- `v0.11.0-需求决策池.md`
- `v0.11.0-a3-裁决样本矩阵.md`
- 新增 `v0.11.0-a3-2-自由目标面板与playerGoals写入.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- `reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore` skill 当前事实。

## 注意事项

- a3-2 仍是“目标管理 + 裁决说明”，不是完整自由行动执行系统。
- 后续自由意图转正式行动、NPC/势力反应、青茅活世界闭环应进入 b1/b2，不得夹带到 a3-2。
- `SAVE_FORMAT_VERSION` 保持 `22`。
- DeepSeek/UI/叙事正文仍不能直接写活世界状态。

## 下一步

建议进入 `v0.11.0-b1` 原著事实抽取试点。

进入 b1 前需先冻结：

- 青茅山事实卡模板。
- 本地原著文本来源指针格式。
- 硬事实/玩家可见事实/隐藏事实/IF 偏离点分类。
- 不复制大段原文，只写摘要、位置指针和设计决策。
