# v0.9.0-a2 道场剧情线索入口重做上下文

日期：2026-05-12
分支：`codex/v090-a2-training-ground-clues`
提交目标：`feat: 重做v0.9道场剧情线索入口`

## 实现范围

- 存档协议从 `20` 提升到 `21`，新增正式持久 `trainingGroundState`。
- 新增 `v090-training-ground-clue-engine`：
  - 负责道场线索登记、入口校验、磨练结算、对决候选生成、试炼叙事意图和 hunt 阻断。
  - `磨练` 复用既有 `training-ground-engine` seeded RNG 结算。
  - `对决` 只生成统一 `combat_event_candidates`，不触发旧 `duelState`。
  - `hunt` 在 a2 阶段只作为 `v0.9.0-a3` 荒兽敌库入口，不结算荒兽掉落。
- 新增 `trainingGroundSlice`：
  - `recordTrainingGroundCandidateAction`
  - `startTrainingGroundDepartureAction`
  - `resolveTrainingGroundAction`
  - `dismissTrainingGroundCandidateAction`
  - `clearExpiredTrainingGroundCandidatesAction`
- `state-update-applier` 接收 `state_update.training_ground_candidates.add`，AI 只能提交线索候选；直接写道场奖励、hunt 掉落、荒兽掉落会被拦截。
- `context-builder` 注入道场线索协议，让下一轮 DeepSeek 看到当前线索、AP、风险和禁止越权规则。
- `TrainingGroundPanel` 改为线索账本：
  - 无线索时说明获取方式。
  - 有线索时展示来源、地点、AP、风险、冷却、阻断原因和正式出发按钮。
  - 旧刷新/旧训练降级到 Debug/兼容入口。
- `ChoicePanel` 支持道场线索相关标签与 tooltip。
- E2E harness 新增 `startTrainingGroundClueDemo()`。
- `测试存档/v0.7.0` 全量升级为 `formatVersion = 21`，并补默认 `trainingGroundState`。

## 边界

- 不调用真实 DeepSeek，默认测试使用本地 mock candidate。
- 不结构化荒兽/荒植/守护者敌库，归属 `v0.9.0-a3`。
- 不重做旧 `CombatOverlay` / `SquadCombatOverlay`，正式入口继续走统一战斗路由。
- 不开放十转、永生蛊、真正永生、玩家获得宿命蛊、普通战斗击杀尊者。

## 后续入口

- `v0.9.0-a3`：结构化荒兽/荒植/守护者敌库，把 `hunt` 道场接入 7x5 群像战。
- `v0.9.0-b1`：统一“线索 -> 出发 -> 本地结算 -> 回流文本”协议到传承、福地、灾劫、野外行动。
- `v0.9.0-b2`：旧 duel/squad 正式入口清理和兼容收束。
