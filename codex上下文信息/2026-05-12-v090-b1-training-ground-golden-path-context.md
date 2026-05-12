# 2026-05-12 v0.9.0-b1-2 道场黄金样板桥接上下文

日期：2026-05-12
分支：`codex/v090-b1-world-action-protocol`
前置提交：
- `fae5701 chore: 建立 v0.9.0-b1 治理检查点`
- `4b0028d feat: 建立 v0.9.0-b1 统一行动协议骨架`

## 本轮目标

把道场作为 `v0.9.0-b1` 的黄金样板，接入统一行动协议：

`线索 -> 出发 -> 本地结算 -> 行动账本 -> 回流文本`

## 落地内容

- `src/engine/v090-training-ground-clue-engine.ts`
  - 为道场行动生成 `WorldActionCandidate`、`WorldActionDeparture`、`WorldActionResolution`。
  - 为磨练、对决、试炼、狩猎生成统一 `LocalActionLedgerEntry` 投影。
  - 生成 `NarrativeReturnContext`，约束 DeepSeek 只能承接本地事实。
  - 缺 AP 或入口阻断时投影为 blocked，不扣 AP。
- `src/store/slices/trainingGroundSlice.ts`
  - 使用统一行动协议的 ledger projection 写入场景 AP 账本。
  - 写入 `flags.lastWorldActionReturnContext` 和 `flags.lastTrainingGroundWorldAction`。
  - 仍保持对决/狩猎只生成 combat candidate，不进入旧 `duelState`。
- `src/engine/context-builder.ts`
  - 将 `lastWorldActionReturnContext` 注入动态 user context，不污染 system prompt 稳定前缀。
- `src/engine/v090-world-action-protocol.ts`
  - 对风险与阻断原因做去重，避免回流上下文重复污染 DeepSeek prompt。
- Skills
  - 已同步更新 `reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion` 的当前阶段事实：b1-2 已完成，下一步是 b1-3 传承/福地桥接。

## 世界观与数值边界

- DeepSeek 仍只可提交道场线索，不能直接发放奖励、蛊虫、仙蛊、荒兽掉落、宝黄天资源或高阶资源。
- 道场磨练的道痕与货币变化来自本地 engine。
- 道场对决/狩猎只创建本地战斗候选，胜负、奖励和掉落等待战斗引擎。
- 荒兽寄生蛊仍只作为传闻、损毁、逃脱或后续调查，不直接入背包。

## 验证

- `npm test -- src/engine/v090-training-ground-clue-engine.test.ts src/store/slices/trainingGroundSlice.test.ts src/engine/v090-world-action-protocol.test.ts src/engine/v080-scene-session-engine.test.ts`：通过。
- `npm test`：86 files / 527 tests 通过。
- `npm run build`：通过；仍保留既有 Vite 500KB+ chunk warning，未发现本轮新增构建阻断。

## 下一步

- 进入 `b1-3`：传承/福地桥接。
- 重点检查出发、试炼、认主是否重复扣 AP。
- 传承/福地奖励、福地归属和试炼结果必须继续由本地引擎决定，DeepSeek 只能承接线索和回流事实。
