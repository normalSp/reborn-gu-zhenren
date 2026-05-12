# 2026-05-12 v0.9.0-b1-4 灾劫桥接上下文

## 当前分支

`codex/v090-b1-world-action-protocol`

## 阶段结论

`v0.9.0-b1-4` 已把灾劫预兆、待结算场景和本地灾劫后果接入统一行动协议。下一阶段进入 `v0.9.0-b1-5`：野外行动最小样板。

## 落地内容

- `src/engine/v080-calamity-scene-engine.ts`
  - 新增 `buildCalamityWorldActionBridge()`。
  - 灾劫场景可投影为 `WorldActionCandidate`、`WorldActionDeparture`、`WorldActionResolution`、`LocalActionLedgerEntry` 和 `NarrativeReturnContext`。
  - `omen` 阶段使用 `pending_narrative` + `narrative_return`，只允许 DeepSeek 写灾劫预兆、压力、气氛和选择描述。
  - `consequence` 阶段使用本地结算事实，奖励策略固定为 `local_engine_only`。
- `src/store/slices/cultivationSlice.ts`
  - `stageCalamityScene()` 写入 `calamity` 领域的统一行动账本和 `flags.lastWorldActionReturnContext`。
  - `resolveApertureCalamity()` 将面积损失、资源点损伤、道痕变化、蛊虫损坏和下一劫预兆作为本地事实回流。
  - 若灾劫已在预兆入场阶段消耗 AP，后续本地后果结算复用同一行动，不重复扣 AP。
- 测试补充：
  - 灾劫场景引擎测试覆盖 world-action 投影。
  - 修行 slice 测试覆盖灾劫预兆账本、回流上下文、已入场灾劫结算不重复扣 AP。

## 世界观与 DeepSeek 边界

- 灾劫可以由 DeepSeek 承接预兆、压力、气氛和玩家选择描述。
- 灾劫面积损失、资源点损伤、道痕变化、蛊虫损坏、战斗胜负、奖励和下一劫预兆只认本地引擎/战斗引擎。
- DeepSeek 回流文本只能解释 `NarrativeReturnContext` 中的事实摘要，不得追加奖励、反向修正损失或私自判定福地后果。

## 已同步文档

- `指导大纲/v0.9.0/codex/00-总览/README.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-开发阶段跟踪.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-小版本执行路线图.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-真相源索引.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b1-具体实施清单.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-需求决策池.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-决策记录.md`
- `指导大纲/v0.9.0/codex/01-专家团工作制/README.md`

## 验证

- `npm test -- src/engine/v080-calamity-scene-engine.test.ts src/store/slices/cultivationSlice.test.ts`：通过。
- `npm test -- src/engine/v080-scene-session-engine.test.ts src/engine/v090-world-action-protocol.test.ts src/engine/v090-training-ground-clue-engine.test.ts src/engine/v080-inheritance-land-engine.test.ts src/engine/v080-calamity-scene-engine.test.ts src/store/slices/cultivationSlice.test.ts src/store/slices/inheritanceLandSlice.test.ts src/store/slices/trainingGroundSlice.test.ts`：通过，8 files / 42 tests。
- `npm test`：通过，86 files / 530 tests。
- `npm run build`：通过，仅保留既有 500KB+ chunk warning。

## 下一步

- 进入 `v0.9.0-b1-5`：野外行动最小样板。
- 建议先选择一条最小 `field_action` 链，不扩完整地图或资源生态。
- 野外行动也必须遵守：DeepSeek 只写线索、传闻、压力和描述；正式材料、蛊材、仙材、蛊虫、地点解锁、战斗触发和伤势由本地 canon/engine/store 决定。
