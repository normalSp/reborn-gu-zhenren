# 2026-05-12 v0.9.0-b1-5 野外行动最小样板上下文

## 当前分支

`codex/v090-b1-world-action-protocol`

## 阶段结论

`v0.9.0-b1-5` 已完成。`v0.9.0-b1` 首批统一出发协议桥接完成，下一阶段进入 `v0.9.0-b2`：旧战斗系统兼容收束和正式入口清理。

## 落地内容

- `src/engine/field-action.ts`
  - 新增 `buildFieldActionWorldActionBridge()`。
  - 野外采集、侦察、陷阱排查和撤离准备可投影为 `WorldActionCandidate`、`WorldActionDeparture`、`WorldActionResolution`、`LocalActionLedgerEntry` 和 `NarrativeReturnContext`。
  - `rewardPolicy` 固定为 `local_engine_only`。
- `src/store/slices/playerSlice.ts`
  - `performFieldAction()` 改为先由本地 `resolveFieldAction()` 结算，再写入 `field_action` 场景账本。
  - 写入 `flags.lastWorldActionReturnContext` 和 `flags.lastFieldActionWorldAction`，供下一轮 DeepSeek 动态上下文承接。
  - 兼容无 `sceneSessionState` 的旧 `spendAp` 路径。
- 测试补充：
  - `src/engine/p2-action-systems.test.ts` 覆盖 field action world-action 投影和奖励边界。
  - `src/store/slices/player-p2-actions.test.ts` 覆盖野外采集写入场景账本、风险和回流上下文。

## 世界观与 DeepSeek 边界

- DeepSeek 可以承接野外环境、线索、压力、选择描述和回流文本。
- 野外行动的正式材料入库、伤势、地点解锁、战斗触发和经济等价只认本地引擎/store。
- 普通采集不得被 AI 升级为仙材、仙蛊、完整蛊方、正式地点、战斗胜利或稳定暴富路径。
- 侦察、陷阱排查和撤离准备只登记本地辅助标记，不等于正式任务或地点解锁。

## 已同步文档

- `指导大纲/v0.9.0/codex/00-总览/README.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-开发阶段跟踪.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-小版本执行路线图.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-真相源索引.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b1-具体实施清单.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b1-验收审查.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-需求决策池.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-决策记录.md`
- `指导大纲/v0.9.0/codex/01-专家团工作制/README.md`

## 验证

- `npm test -- src/engine/p2-action-systems.test.ts src/store/slices/player-p2-actions.test.ts`：通过，2 files / 11 tests。
- `npm test -- src/engine/v080-scene-session-engine.test.ts src/engine/v090-world-action-protocol.test.ts src/engine/p2-action-systems.test.ts src/store/slices/player-p2-actions.test.ts src/engine/v090-training-ground-clue-engine.test.ts src/store/slices/trainingGroundSlice.test.ts src/engine/v080-inheritance-land-engine.test.ts src/store/slices/inheritanceLandSlice.test.ts src/engine/v080-calamity-scene-engine.test.ts src/store/slices/cultivationSlice.test.ts src/api/deepseek.test.ts`：通过，11 files / 55 tests。
- `npm test`：通过，86 files / 532 tests。
- `npm run build`：通过，仅保留既有 500KB+ chunk warning，并出现一次 Rolldown plugin timings 提示。

## 下一步

- 进入 `v0.9.0-b2`。
- 优先清点正式 UI、剧情链和 state_update 是否仍能进入旧 `duelState/squadCombatState`。
- 旧战斗系统只能保留 Debug/兼容与旧存档兜底，新正式内容应继续走 battlefield。
