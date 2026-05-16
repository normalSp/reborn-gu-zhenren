# 2026-05-13 v0.9.0-b3-5 C-038 视觉资产阶段验收台账上下文

## 阶段状态

`v0.9.0-b3-5` C-038 已完成，b3-5 视觉资产与关键演出增强阶段收束。

本轮只整理验收台账和 Playwright 附件命名，不改战斗规则、伤害、命中、AI、AP、奖励、掉落或存档协议。

## 关键落地

- 新增 `指导大纲/v0.9.0/codex/00-总览/v0.9.0-b3-5-C038-视觉资产阶段验收台账.md`。
- 更新 `v0.9.0-b3-截图验收台账.md`，登记 C-037 三条 polish 分支。
- `tests/e2e/v090-b3-qingmao-battlefield.spec.ts` 的附件命名更新为：
  - `v090-b3-5-c037-moon-transition`
  - `v090-b3-5-c037-white-jade-transition`
  - `v090-b3-5-c037-forbidden-transition`

## 验证

- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，4 tests。

本阶段继承 C-037 已通过的验收：

- `npm run check:qingmao-assets`：通过，7 entries；active=4，review-only=2，blocked=1。
- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts`：通过，1 file / 7 tests。
- `npm run build`：通过，仅保留既有 500KB+ chunk warning 与 plugin timings warning。
- `npm test`：通过，87 files / 538 tests。
- `npx playwright test tests/e2e/v080-battlefield-ui.spec.ts tests/e2e/v080-group-battlefield-ui.spec.ts tests/e2e/v080-large-group-battlefield-ui.spec.ts`：通过，6 tests。

## 下一步

b3-5 已完成。下一步建议进入 `v0.9.0-rc` 启动审查与发布候选范围冻结。

需要用户拍板：

- rc 是否冻结为长测、测试存档、经济复验、DeepSeek 成本观测复盘、文档冲突清理、版本标识收口和关键 bug 修复。
- rc 是否禁止继续扩玩法或全局视觉重皮。
