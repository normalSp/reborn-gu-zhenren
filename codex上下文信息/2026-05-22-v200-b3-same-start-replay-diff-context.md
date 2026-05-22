# 2026-05-22 v2.0-b3 同开局差异与 replay 对照交接

## 当前状态

- 当前分支：`codex/v200-b3-same-start-replay-diff`
- 当前阶段：`v2.0.0-b3-同开局差异与replay对照`
- 状态：completed locally，待提交推送
- 用户决策：D-200-001 至 D-200-008、D-201-001 至 D-201-012 已批准；b3 无新增用户决策需求

## 本阶段做了什么

- 新增 `src/engine/v200-same-start-replay-diff.ts`。
- 新增 `src/engine/v200-same-start-replay-diff.test.ts`。
- 在 `src/components/game/RegionalEventLedgerPanel.tsx` 的既有 `账本` tab 内加入“同开局差异”审计卡。
- 更新 `tests/e2e/v200-regional-event-ledger.spec.ts`，确认 `v200-replay-diff-audit` 可见并显示 `no runFingerprint`。
- 新增 b3 阶段记录、Player Advocate、长线漂移和 Skill 同步审计文档。
- 同步 README、路线图、测试矩阵、真相源、Git 计划、MiroFish 协议、项目仪表盘、PROJECT-STATE、AGENTS。
- 同步外部 skill 当前口径：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`。

## 边界

- `SAVE_FORMAT_VERSION` 保持 25。
- 不新增 `runFingerprint`。
- 不新增 `regionalLifeState` / `areaLivingState`。
- 不新增 `identityRouteState` / `professionState`。
- 不新增 store action、migration/defaults 或新持久字段。
- 不新增 DeepSeek visible knowledge / RAG / ledger write authority。
- 不新增 BFF/backend、子代理、公测口径或 EdgeOne 部署。
- 不开放正式地点、阵营、奖励、NPC 生死、正式商队身份、正式通行、正式价格/库存。

## Live / Player Advocate

- live DeepSeek：已调用。
- 模型：`deepseek-v4-flash`。
- 样本：5 samples from `tests/evals/deepseek-v200-regional-event-ledger/samples.json`。
- 轮次：20。
- 结果：20/20 accepted，P0/P1/P2 = 0/0/7。
- 成本：26235 tokens / `$0.00278996`。
- 报告：`artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T09-28-43-564Z/report.json`。
- Player Advocate：`指导大纲/v2.0.0/codex/00-总览/v2.0.0-b3-Player-Advocate-30轮走查记录.md`，gate passed。

## 残余风险

- P2：live 输出出现 `青毛` 术语错字，进入 process-1 prompt/eval hardening。
- P2：live 输出出现 `通行证`、`正式凭证` 等正式凭信词，继续归入 `V20-P2-PROP-001`。
- P3：无 `runFingerprint` 的同开局差异强度仍需 rc T3 320 轮验证；若不足，再让用户单独决策字段门禁。

## 验证

已通过：

```bash
npm test -- src/engine/v200-same-start-replay-diff.test.ts src/engine/v200-regional-event-ledger.test.ts
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v200-regional-event-ledger.spec.ts
npm run eval:deepseek:v200-regional-ledger-dry-run
npm run eval:deepseek:v200-regional-ledger-live:smoke
npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-b3-Player-Advocate-30轮走查记录.md 30
npm test
npm run build
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:player-visible-copy
npx playwright test --workers=4
npm run test:e2e:long
npm run check:production-preview
git diff --check
```

结果摘要：

- unit：151 files / 811 tests passed。
- focused e2e：1/1 passed。
- full e2e：69/69 passed under 4 workers。
- long e2e：13/13 passed。
- production preview smoke：passed。

## 下一步

1. 提交并推送 b3 分支。
2. 切入 `codex/v200-b4-ui-save-rollback`。
3. 进入 `v2.0.0-b4-UI可读性旧档回滚与入口一致性`。
4. b4 继续不新增字段，重点验证旧档默认、b1/b2/b3 入口一致性、移动端密度、回滚说明和 T3 前 UI 可读性债。
