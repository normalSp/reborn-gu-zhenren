# 2026-05-22 v2.0-a1 decision approval context

分支：`codex/v200-a1-region-saveformat-gate`

## 本次目标

用户批准 D-200-001 至 D-200-008、D-201-001 至 D-201-012，并要求进入 v2.0-a1。

## 已完成

- 将 D-200/D-201 全批准写入 v2.0 需求决策池。
- 将 a1 设计门禁状态更新为 approved。
- 更新 v2.0 README、路线图、总体大纲、启动审查、MiroFish 协议、测试矩阵、真相源索引、Git 计划。
- 更新项目仪表盘、PROJECT-STATE、AGENTS。
- 同步外部 skills：reborn-expert-council、game-dev-text、reverend-insanity-lore。

## 当前批准结论

- v2.0 主线：`第一个区域活世界`。
- 第一核心区域：`南疆早期低阶外缘小区域`。
- b1 可 bump `SAVE_FORMAT_VERSION = 25`。
- b1 可新增单一最小 `regionalEventLedger`。
- b1 必须同一刀完成 migration/defaults/tests/rollback。
- runtime 链路采用 `EventEnvelope -> WorldCore -> Ledger -> DeepSeek`。
- T3 320 total rounds 已批准为 v2.0 rc 硬门，live 不低于 160 轮。
- b1 至少 30-50 轮 Player Advocate 与 20 轮 live smoke。

## 仍然禁止

- 不新增 `runFingerprint`。
- 不新增 `regionalLifeState` / `areaLivingState`。
- 不新增 `identityRouteState` / `professionState`。
- 不启用 DeepSeek visible knowledge/RAG。
- 不启用 BFF/backend。
- 不启用子代理。
- 不开放正式地点、阵营、奖励、NPC 生死、canon promotion。
- 不部署 EdgeOne。

## 下一步

建议下一刀进入：

`codex/v200-b1-regional-event-ledger`

对应文档建议：

`v2.0.0-b1-regionalEventLedger与WorldCore第一刀.md`
