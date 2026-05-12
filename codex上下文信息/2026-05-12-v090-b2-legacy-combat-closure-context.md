# 2026-05-12 v0.9.0-b2 旧战斗兼容收束上下文

## 当前分支

`codex/v090-b1-world-action-protocol`

## 阶段结论

`v0.9.0-b2` 已完成。旧 `duelState/squadCombatState` 保留兼容和旧测试兜底，新正式战斗入口继续走 battlefield。下一阶段进入 `v0.9.0-b3`：青茅山凡战视觉竖切。

## 落地内容

- `src/engine/combat-router.ts`
  - 新增 `buildCombatEventCandidateFromTrigger()`。
  - 旧关键词 `duel` 触发会转成 `scale: "1v1"` 的 `combat_event_candidates`，不直接进入旧 `duelState`。
  - 旧 narrative combat constraint 会转成正式候选，不再要求 DeepSeek 直写战斗结果。
- `src/engine/response-pipeline.ts`
  - 移除叙事文本命中后直接 `initDuel()` 的正式路径。
  - 不再写入 transient combat settlement prompt；只登记本地战斗候选。
  - 修正 `encStore` / `encStore2` 变量误引用。
- `src/engine/ai-state-update-validator.ts`
  - `combat_result` 会被识别为 AI 直写战斗结算并降级。
- `src/engine/state-update-applier.ts`
  - 即使绕过 validator，`combat_result` 也只进入 `aiRumorDiscoveries` 和 pipeline 日志，不再应用 HP、元石、伤势或掉落。
- `src/engine/activity-availability.ts`
  - active `battlefieldCombatState` / `combatEncounterState` 会锁定行动面板。
- `src/engine/context-builder.ts`
  - 旧 transient combat constraint 只作为兼容提示，要求 AI 使用 `combat_event_candidates`。

## 世界观与 DeepSeek 边界

- DeepSeek 可以写战斗候选、敌情、风险、传闻和叙事压力。
- DeepSeek 不能写正式战斗胜负、伤害、伤势、真元/HP 消耗、掉落、元石、材料、蛊虫、仙材或仙蛊。
- 1v1 `duel` 在 v0.9 新路线中表示 1v1 battlefield，不表示旧 `duelState`。
- b3 做视觉竖切时，UI 仍只能消费 battlefield engine/canon 输出。

## 已同步文档

- `指导大纲/v0.9.0/codex/00-总览/README.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-开发阶段跟踪.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-小版本执行路线图.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-真相源索引.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-决策记录.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-需求决策池.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b2-启动审查与范围冻结.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b2-验收审查.md`
- `指导大纲/v0.9.0/codex/01-专家团工作制/README.md`

## 验证

- `npm test -- src/engine/combat-router.test.ts src/engine/activity-availability.test.ts src/engine/ai-state-update-validator.test.ts src/engine/state-update-applier-resource-gate.test.ts src/engine/combat-route-policy.test.ts src/engine/v080-narrative-combat-orchestration.test.ts src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，7 files / 33 tests。
- `npm test`：通过，87 files / 537 tests。
- `npm run build`：通过，仅保留既有 500KB+ `combat-squad` chunk warning。
- `npx playwright test tests/e2e/v090-product-route-closure.spec.ts tests/e2e/v090-beast-hunt-battlefield.spec.ts`：通过，4 tests。
- `npx tsc --noEmit`：失败，属于历史类型债；主要为缺 React/Node 类型包、旧 store 类型和旧组件类型问题。本轮已确认 touched 文件不再新增 b2 专属类型错误。

## 下一步

- 进入 `v0.9.0-b3`。
- b3 先做启动审查，冻结“青茅山凡战视觉竖切”范围。
- 不全局重皮，不引入外部 GitHub 项目，除非能明确降低 b3 风险。
