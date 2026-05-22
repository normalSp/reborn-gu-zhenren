# 2026-05-22 v2.0.0-b4 UI可读性旧档回滚与入口一致性交接

## 当前状态

- 分支：`codex/v200-b4-ui-save-rollback`
- 阶段：`v2.0.0-b4-UI可读性旧档回滚与入口一致性`
- 状态：completed locally，待提交/推送
- 用户最新询问：是否还有需要决策；当前答案是没有新的决策项卡住。

## 已完成内容

- 新增纯本地 helper：`src/engine/v200-ledger-readiness-review.ts`
- 新增测试：`src/engine/v200-ledger-readiness-review.test.ts`
- 在现有 `账本` tab 内新增 `旧档与回滚` audit card：
  - 旧档空账本：`old_save_default`
  - 已有公开事件/follow-up：`ready_for_replay`
  - 手改 authority/region：`blocked_for_review`
- 更新 v2.0 b4 文档、Player Advocate、长线漂移记录、Skill 同步审计。
- 更新当前入口：
  - `AGENTS.md`
  - `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
  - `指导大纲/项目仪表盘.md`
  - `指导大纲/v2.0.0/codex/00-总览/README.md`
- 同步外部 skill current override：
  - `C:/Users/11411/.codex/skills/reborn-expert-council/SKILL.md`
  - `C:/Users/11411/.codex/skills/game-dev-text/SKILL.md`
  - `C:/Users/11411/.codex/skills/reverend-insanity-lore/SKILL.md`

## 边界

b4 没有新增：

- `SAVE_FORMAT_VERSION = 26`
- `runFingerprint`
- `regionalLifeState` / `areaLivingState`
- `identityRouteState` / `professionState`
- store action、migration/defaults、新持久字段
- DeepSeek visible knowledge / RAG / ledger write authority
- BFF/backend、子代理、公测口径、EdgeOne
- 正式地点、阵营、奖励、NPC 生死、正式商队身份、正式通行、正式价格/库存

## Live / Player Advocate

- live DeepSeek：已调用
- 模型：`deepseek-v4-flash`
- 样本：5
- 每样本轮次：4
- 总轮次：20
- 报告：`artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T09-53-08-835Z/report.json`
- 结果：20/20 accepted，P0/P1/P2 = 0/0/3
- tokens / cost：25366 / `$0.00274693`
- Player Advocate：`v2.0.0-b4-Player-Advocate-30轮走查记录.md`，30/30 gate passed

## 验证

已通过：

```bash
npm test -- src/engine/v200-ledger-readiness-review.test.ts src/engine/v200-same-start-replay-diff.test.ts src/engine/v200-regional-event-ledger.test.ts
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v200-regional-event-ledger.spec.ts
npm run eval:deepseek:v200-regional-ledger-dry-run
npm run eval:deepseek:v200-regional-ledger-live:smoke
npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-b4-Player-Advocate-30轮走查记录.md 30
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

补充：`git diff --check` 仅有 Windows 行尾提示，无空白错误。全量 unit 为 152 files / 814 tests；full e2e 69/69；long e2e 13/13。

## 残余风险

- P2：`青毛` 术语错字、`通行证`、`登记`、`正式凭证`、`成员` 等正式凭信/身份词。
- P2 已进入 `V20-P2-PROP-001` / `V20-B3-TERM-001`，下一阶段 process-1 处理。
- rc 仍必须执行 T3 320 total rounds，live 不低于 160。

## 下一步

建议完成本分支显式 stage/commit/push 后，切入：

`codex/v200-process1-p2-terminology-hardening`

阶段名：

`v2.0.0-process-1-P2术语与正式凭信词hardening`

process-1 范围只处理 prompt/eval/文案术语 hardening，不新增存档字段、runtime 系统、DeepSeek 权限、MiroFish export、BFF/backend、子代理、正式地点/阵营/奖励/NPC 生死。

