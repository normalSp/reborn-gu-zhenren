# 2026-05-22 v2.0-b1 regional ledger WorldCore context

## 当前状态

- 分支：`codex/v200-b1-regional-ledger-worldcore`
- 阶段：`v2.0.0-b1-regionalEventLedger与WorldCore第一刀`
- 状态：completed locally，待提交/推送
- 用户决策：D-200-001 至 D-200-008、D-201-001 至 D-201-012 已全批准
- 存档版本：`SAVE_FORMAT_VERSION = 25`
- 新增唯一持久字段：`regionalEventLedger`

## 本次实现

- 新增 `src/canon/v200-regional-event-ledger-rules.json`。
- 新增 `src/engine/v200-regional-event-ledger.ts`：
  - `buildV200RegionalEventEnvelopes()`
  - `resolveV200WorldCoreRegionalEventLedgerSync()`
  - `createInitialRegionalEventLedger()`
  - `normalizeRegionalEventLedger()`
- 新增 `src/store/slices/regionalEventLedgerSlice.ts`。
- 更新 `src/store/initialState.ts`：`SAVE_FORMAT_VERSION = 25`，默认 `regionalEventLedger`。
- 更新 `src/store/index.ts`：持久化归一化与 slice 接入。
- 新增 `src/components/game/RegionalEventLedgerPanel.tsx`，并在 `WorldHubPanel` 增加 `账本` tab。
- 更新 E2E harness state summary，暴露 `regionalEventLedger` 摘要。
- 新增 focused unit/e2e：
  - `src/engine/v200-regional-event-ledger.test.ts`
  - `src/store/slices/regionalEventLedgerSlice.test.ts`
  - `tests/e2e/v200-regional-event-ledger.spec.ts`
- 新增 live probe：
  - `scripts/run-v200-regional-event-ledger-live-probe.mjs`
  - `tests/evals/deepseek-v200-regional-event-ledger/samples.json`
  - package scripts `eval:deepseek:v200-regional-ledger-dry-run` / `live:smoke`

## Live Probe

clean pass：

- 报告：`artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T08-21-48-303Z/report.json`
- 模型：`deepseek-v4-flash`
- 样本：5
- 轮次：20
- accepted：20/20
- P0/P1/P2：0/0/1
- tokens：24770
- cost：`$0.0029692`

前置失败也保留为证据：

- `2026-05-22T08-12-58-654Z`：评估器 schema 自触发 `WorldCore` P2，未通过。
- `2026-05-22T08-18-17-951Z`：发现 hidden 翻译真实风险，强化 prompt/eval 后 clean pass。

## 文档同步

- 新增：
  - `指导大纲/v2.0.0/codex/00-总览/v2.0.0-b1-regionalEventLedger与WorldCore第一刀.md`
  - `指导大纲/v2.0.0/codex/00-总览/v2.0.0-b1-Player-Advocate-30轮走查记录.md`
  - `指导大纲/v2.0.0/codex/00-总览/v2.0.0-b1-长线叙事漂移检查记录.md`
- 已更新：
  - v2.0 README / 路线图 / 测试矩阵 / 真相源索引 / Git 计划 / 总体开发大纲 / MiroFish 协议
  - `指导大纲/项目仪表盘.md`
  - `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
  - `AGENTS.md`
- 已同步实际 skill：
  - `reborn-expert-council` -> `0.1.123`
  - `game-dev-text` -> `2.3.91`
  - `reverend-insanity-lore` -> `0.3.81`

## 验证

已通过：

- `npm run eval:deepseek:v200-regional-ledger-dry-run`
- `npm run eval:deepseek:v200-regional-ledger-live:smoke`
- `npm run check:player-advocate-gate -- "指导大纲/v2.0.0/codex/00-总览/v2.0.0-b1-Player-Advocate-30轮走查记录.md" 30`
- `npm test -- src/engine/v120-low-rank-survival-economy-projection.test.ts src/engine/v140-region-sample-projection.test.ts src/engine/v150-conflict-aftermath-projection.test.ts src/engine/v170-regional-life-projection.test.ts src/engine/v180-identity-replay-projection.test.ts src/engine/v200-regional-event-ledger.test.ts src/store/slices/regionalEventLedgerSlice.test.ts src/store/save-normalization.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run test:e2e -- tests/e2e/v200-regional-event-ledger.spec.ts`
- `npm test`：150 files / 806 tests
- `npm run build`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:player-visible-copy`
- `npm run test:e2e`：69 tests
- `npm run test:e2e:long`：13 tests
- `npm run check:production-preview`
- `git diff --check`

## 仍未开放

- `runFingerprint`
- `regionalLifeState` / `areaLivingState`
- `identityRouteState` / `professionState`
- DeepSeek visible knowledge / RAG
- 新 MiroFish export by default
- BFF/backend
- 子代理
- public wording / EdgeOne
- 正式地点、阵营、奖励、NPC 生死、canon promotion

## 下一步

建议进入：

`v2.0.0-b2-区域事件持续承接与去重`

b2 不新增存档字段，不扩 DeepSeek 权限，重点补：

- 跨轮区域事件去重。
- 多来源事件组合态势。
- 账本与 UI 的持续承接可读性。
- 旧档/回滚复核。
- 将 b1 残余 P2 `通行证` 正式凭证词风险纳入 process-1 / rc hardening。
