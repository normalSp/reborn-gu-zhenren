# v2.0.0-rc T3 quality closure context

日期：2026-05-22
分支：`codex/v200-rc-t3-quality-closure`
状态：v2.0.0 rc complete locally

## 本轮完成

- 新增 T3 deterministic runner：`scripts/run-v200-regional-ledger-t3-deterministic.mjs`。
- 扩展 live runner：`scripts/run-v200-regional-event-ledger-live-probe.mjs` 支持 `--cycle-count`、rc T3 160 live、strict `maxP2=0`、P2/P1/P0 retry repair、retry 统计和 issueCodes 日志。
- 新增 package scripts：
  - `eval:deepseek:v200-regional-ledger-t3-deterministic`
  - `eval:deepseek:v200-regional-ledger-live:rc-t3`
- 完成 T3 deterministic/replay：160/160 accepted，P0/P1/P2=0/0/0。
- 完成 T3 live clean3：160/160 accepted，P0/P1/P2=0/0/0，cost `$0.03083156`。
- 完成 v2.0 rc 文档、Player Advocate 100 轮、Skill 同步审计和项目入口同步。
- 最终质量门已通过：Player Advocate gate、TypeScript、unit、build、focused v2.0 e2e、runtime/Qingmao/player-visible-copy scans、full e2e、long e2e、production-preview smoke、stale-entrypoints scan。

## 核心证据

- deterministic report：`artifacts/v2.0.0/t3-regional-ledger-deterministic/2026-05-22T11-09-24-167Z/report.json`
- live report：`artifacts/deepseek-drift-probe/v2.0.0-regional-event-ledger/2026-05-22T11-59-18-860Z/report.json`
- live run log：`artifacts/v2.0.0/t3-regional-ledger-live/run-logs/20260522-194039-clean3-stdout.log`
- rc T3 record：`指导大纲/v2.0.0/codex/00-总览/v2.0.0-rc-T3长测与质量收束记录.md`
- rc PA record：`指导大纲/v2.0.0/codex/00-总览/v2.0.0-rc-Player-Advocate-100轮走查记录.md`
- rc skill audit：`指导大纲/v2.0.0/codex/00-总览/v2.0.0-rc-Skill同步审计记录.md`
- stale-entrypoints report：`artifacts/v1.6.0/stale-entrypoints/2026-05-22T12-13-06-304Z/report.json`

## 边界

- 未新增 `runFingerprint`。
- 未新增 `regionalLifeState` / `areaLivingState`。
- 未新增 `identityRouteState` / `professionState`。
- 未新增 DeepSeek visible knowledge/RAG。
- 未新增 BFF/backend。
- 未启用子代理。
- 未开放正式地点/阵营/奖励/NPC 生死/canon promotion。
- 未部署 EdgeOne。

## 后续建议

下一步应先开 v2.1 专家团启动会，复盘 v2.0 T3 证据，再讨论是否进入 Agent Simulation Lab、区域样本扩展、formal credential hardening 继续扩样本或薄 BFF 评估。不要直接在 v2.0 后追加新 runtime。
