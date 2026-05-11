# 2026-05-12 v0.9.0-a1 产品冲突清账与统一路由上下文

## 分支

- 来源分支：`codex/v090-product-audit-roadmap`
- 当前分支：`codex/v090-a1-product-route-closure`

## 实现范围

- 新增 `src/engine/combat-route-policy.ts`：
  - 固定 `duel / battlefield_5x3 / group_5x3 / group_7x5` 产品路由协议。
  - `duel` 表示 1v1 battlefield，不进入旧 `duelState` 默认入口。
  - 伏击、兽群、荒兽狩猎、灾劫、传承守护、第三方介入默认走 `group_7x5`。
- 更新 `src/engine/v080-narrative-combat-orchestration.ts`：
  - AI 只提供 `combat_event_candidates`，实际规模由本地 route policy 决定。
  - 未知 scale 降级到安全默认并写 warning。
- 新增 `src/engine/training-ground-entry-policy.ts`：
  - 道场入口输出可显示、可进入、缺线索、地点不匹配、境界不足、冷却、Debug 兼容等原因。
  - `hunt` 类型在策略层标记为 `group_7x5`，敌库结构化留给 `v0.9.0-a3`。
- 更新 `TrainingGroundPanel`：
  - 空窗章节不再显示空白列表，改为可读原因和建议行动。
  - 标注当前道场仍是旧入口，正式闭环将在 a2 接剧情线索、场景 AP 和行动账本。
- 更新 `GameScreen`：
  - 演武按钮降级到 Debug/演武分组。
  - 底部版本标识改为 `v0.9.0-a1`。
- 更新 `package.json`：
  - `package.json` 与 `package-lock.json` 版本改为 `0.9.0-a1.0`。
- 更新 v0.9 总览文档：
  - 记录 a1 已落地内容和 a2/a3/b2 边界。

## 测试记录

- `npm test -- src/engine/combat-route-policy.test.ts src/engine/training-ground-entry-policy.test.ts src/engine/v080-narrative-combat-orchestration.test.ts src/engine/training-ground-engine.test.ts`
  - 结果：通过，4 个测试文件，18 个测试。
- `npm test`
  - 结果：通过，81 个测试文件，505 个测试。
- `npm run build`
  - 结果：通过。
- `npx playwright test tests/e2e/v090-product-route-closure.spec.ts`
  - 结果：通过，2 个浏览器测试。
- `npm run test:e2e:long`
  - 结果：通过，18 个长链路浏览器测试。

## 剩余风险与下一步

- `v0.9.0-a2`：道场仍需从旧刷新池迁移到剧情线索、地点权限、场景 AP 与行动账本。
- `v0.9.0-a3`：荒兽/荒植/守护者仍需结构化敌库，hunt 才能真正稳定进入 7x5 棋盘战。
- `v0.9.0-b2`：旧 `CombatOverlay` / `SquadCombatOverlay` 仍保留兼容入口，后续需要正式降级、迁移和测试收束。
- 本阶段没有调用真实 DeepSeek；如后续要做 live smoke，需单场景、低频、日志脱敏，且不纳入默认测试。
