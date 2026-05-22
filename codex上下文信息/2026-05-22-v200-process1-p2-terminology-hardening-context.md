# 2026-05-22 v2.0 process-1 P2 terminology hardening context

分支：`codex/v200-process1-p2-terminology-hardening`
状态：completed locally；待提交/推送

## 本轮目标

完成 `v2.0.0-process-1-P2术语与正式凭信词hardening`，把 b3/b4 live smoke 遗留的 `青毛`、`Qingmao`、正式凭信词、正式身份词 P2 风险压到 process1 严门通过。

## 代码变更

- `scripts/run-v200-regional-event-ledger-live-probe.mjs`
  - 允许 `--max-p2=0`。
  - 加强 carry text 清洗，替换地名错字、正式凭信词、正式身份词。
  - 强化 system/user prompt 输出边界。
  - 扩展 P2 evaluator 词表。
  - 新增 retry-on-P2 repair：正式凭信词或术语漂移 P2 会自动重写并重评。
  - 已恢复 retry 进入 `retryAttemptCount` / `recoveredRoundCount`，不再混作内容 P2。
- `package.json`
  - 新增 `eval:deepseek:v200-regional-ledger-live:process1`。
- `src/engine/context-builder.ts`
  - 新增 dynamic context guard：`v2.0 正式凭信词与区域账本叙事护栏`。
- `src/engine/context-builder-cache.test.ts`
  - 锁定 runtime guard 出现在 dynamic context，且 system prompt cache stability 仍通过。

## live evidence

失败到通过链路：

- `artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T10-18-04-144Z/report.json`：20/20 accepted，P0/P1/P2=0/0/1。
- `artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T10-21-29-665Z/report.json`：20/20 accepted，P0/P1/P2=0/0/7。
- `artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T10-29-01-569Z/report.json`：20/20 accepted，P0/P1/P2=0/0/1；剩余为已恢复 JSON retry 旧扣分。
- `artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T10-32-49-308Z/report.json`：20/20 accepted，P0/P1/P2=0/0/0，retryAttemptCount=3，recoveredRoundCount=2，tokens=36038，cost `$0.00334449`。

## 文档更新

新增：

- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-process-1-P2术语与正式凭信词hardening.md`
- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-process-1-Player-Advocate-30轮走查记录.md`
- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-process-1-长线叙事漂移检查记录.md`
- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-process-1-Skill同步审计记录.md`

同步：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- v2.0 README / 总体开发大纲 / 小版本路线图 / 测试矩阵 / 真相源索引 / MiroFish 协议 / Git 计划 / 需求决策池
- external skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`

## 验证已过

- `npm test -- src/engine/context-builder-cache.test.ts`
- `npm run eval:deepseek:v200-regional-ledger-dry-run`
- `npx tsc --noEmit --pretty false`
- `node scripts/run-v200-regional-event-ledger-live-probe.mjs --dry-run --sample-limit=5 --round-limit=4 --accepted-threshold=0.9 --max-p2=0`
- `npm run eval:deepseek:v200-regional-ledger-live:process1`
- `npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-process-1-Player-Advocate-30轮走查记录.md 30`
- `npm test`
- `npm run build`
- `git diff --check`：仅 Windows 行尾提示，无 whitespace error

## 边界

- `SAVE_FORMAT_VERSION` 保持 25。
- 不新增字段。
- 不新增 `runFingerprint`。
- 不开放 formal outcome。
- 不改 DeepSeek 模型/权限。
- 不启用 RAG/BFF/backend/subagents/public wording/EdgeOne。

## 下一步

提交并推送 process-1 后，进入：

`v2.0.0-process-2-长线漂移与知识库复核`
