# 2026-05-22 v2.0-b2 regional event continuity context

## 当前状态

- 当前分支：`codex/v200-b2-regional-event-continuity`
- 阶段：`v2.0.0-b2-区域事件持续承接与去重`
- 状态：completed locally，待 commit / push 后进入 b3
- 用户决策：D-200-001 至 D-200-008、D-201-001 至 D-201-012 均已批准；本阶段没有新增用户决策项。

## 本轮实现

- `src/engine/v200-regional-event-ledger.ts`
  - event/follow-up id 从 turn-suffixed 改为稳定 id。
  - 按 `eventKind + publicSummaryKey` 跨回合去重。
  - 合并 source action/fact/source refs、pressure tags 和 forbidden outcomes。
  - b1 `v200b1_*_t<turn>` 旧 id 可在下一次 sync 时升级为稳定 id。
- `src/components/game/RegionalEventLedgerPanel.tsx`
  - 文案更新为 b2 去重承接。
  - 显示 `publicSummaryKey`，帮助理解承接键。
- `src/canon/v200-regional-event-ledger-rules.json`
  - source review 更新到 b2，边界文案保持 WorldCore-only。
- `tests/e2e/v200-regional-event-ledger.spec.ts`
  - 增加重复点击登记时 event/follow-up 数不增长。
- `src/engine/v200-regional-event-ledger.test.ts`
  - 增加跨回合去重和 b1 旧 id 升级单测。

## 文档与制度

新增：

- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-b2-区域事件持续承接与去重.md`
- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-b2-Player-Advocate-30轮走查记录.md`
- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-b2-长线叙事漂移检查记录.md`
- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-b2-Skill同步审计记录.md`

已同步：

- `指导大纲/v2.0.0/codex/00-总览/README.md`
- `v2.0.0-小版本执行路线图.md`
- `v2.0.0-测试矩阵.md`
- `v2.0.0-真相源索引.md`
- `v2.0.0-总体开发大纲.md`
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

Skill sync：

- `reborn-expert-council` updated
- `game-dev-text` updated
- `reverend-insanity-lore` updated
- `reborn-combat-motion` no_update_needed
- `mirofish-reborng-export` no_update_needed

## Live / Player Advocate

- `npm run eval:deepseek:v200-regional-ledger-live:smoke`
- 报告：`artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T08-53-30-958Z/report.json`
- 结果：20/20 accepted，P0/P1/P2 = 0/0/4
- tokens：25383
- cost：`$0.00283629`
- Player Advocate：30/30，理解率 100%，confused=0

残余风险：

- P2 正式凭信词：`登记`、`商队成员`、`正式凭证`
- 处理：继续进入 v2.0 process-1 / rc prompt-eval hardening，不阻断 b2。

## 验证

已通过：

```bash
npm test -- src/engine/v200-regional-event-ledger.test.ts
npm test -- src/engine/v200-regional-event-ledger.test.ts src/store/slices/regionalEventLedgerSlice.test.ts
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v200-regional-event-ledger.spec.ts
npm run eval:deepseek:v200-regional-ledger-dry-run
npm run eval:deepseek:v200-regional-ledger-live:smoke
npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-b2-Player-Advocate-30轮走查记录.md 30
git diff --check
npm test
npm run build
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:player-visible-copy
npx playwright test --workers=4
npx playwright test tests/e2e/pre-v110-bugfixes.spec.ts tests/e2e/v100-qingmao-southern-border-continuity.spec.ts tests/e2e/v100-low-rank-life-loop-release.spec.ts tests/e2e/v100-free-intent-release-closure.spec.ts tests/e2e/v110-route-location-state.spec.ts tests/e2e/v120-low-rank-survival-economy.spec.ts tests/e2e/v130-social-pressure-projection.spec.ts tests/e2e/v140-region-sample-projection.spec.ts tests/e2e/v150-conflict-aftermath-projection.spec.ts tests/e2e/v170-regional-life-projection.spec.ts tests/e2e/v180-identity-replay-projection.spec.ts tests/e2e/v200-regional-event-ledger.spec.ts --workers=4
npm run check:production-preview
```

备注：默认高并发 full e2e 首轮出现 60s timeout；失败用例单独复跑通过，`--workers=4` full/long 均通过，判定为并发资源波动。

## 硬边界

仍禁止：

- `runFingerprint`
- `regionalLifeState` / `areaLivingState`
- `identityRouteState` / `professionState`
- DeepSeek visible knowledge / RAG / ledger write authority
- BFF/backend
- subagents
- public wording / EdgeOne
- 正式地点、阵营、奖励、NPC 生死或 canon promotion

## 下一步

建议进入：

`v2.0.0-b3-同开局差异与replay对照`

b3 继续不默认新增 `runFingerprint`。先用现有 v25 账本、公开 pressure deck、replay evidence 和 live 样本判断同开局差异是否足够；如果证据显示长期差异不足，再停下来让用户单独决策是否需要持久字段。
