# 2026-05-21 v1.8.0 complete context

状态：v1.8.0 本地开发里程碑完成
分支：`codex/v180-b1-identity-replay-projection`
提交：本文件所在提交
推送：阶段完成后推送当前分支

## 完成口径

`v1.8.0` 完成口径为：

`低阶身份路线与同开局差异度 projection-first 地基`

不得写成：

- 正式职业/身份系统。
- 正式商队、散修、护卫、情报、采集路线系统。
- per-save replay seed 或 `runFingerprint`。
- 正式区域事件 ledger。
- 完整南疆/商家城/商队系统。
- 正式经济、交易、奖励、阵营或 NPC 命运系统。
- DeepSeek 全书 RAG / 可见知识摘要。
- 大规模 300+ 轮长线叙事质量已完成。

## runtime

新增：

- `src/engine/v180-identity-replay-projection.ts`
- `src/components/game/IdentityReplayPanel.tsx`
- `src/engine/v180-identity-replay-projection.test.ts`
- `tests/e2e/v180-identity-replay-projection.spec.ts`
- `scripts/run-v180-identity-replay-live-probe.mjs`
- `tests/evals/deepseek-v180-identity-replay/samples.json`

修改：

- `src/components/game/WorldHubPanel.tsx`
- `package.json`

## 权威边界

- `SAVE_FORMAT_VERSION = 24` 保持不变。
- 不新增 `identityRouteState` / `professionState`。
- 不新增 `runFingerprint` / `regionalEventLedger`。
- 不新增 store action。
- 不新增 migration/defaults。
- 不改 DeepSeek runtime prompt/context/API/model/authority。
- 不新增正式身份、正式职业、正式地点、正式商队/阵营、正式奖励、正式交易、NPC 生死或 hidden 可见事实。

## live probe

| 阶段 | 报告 | 结果 |
|---|---|---|
| b1 clean smoke | `artifacts/deepseek-drift-probe/v1.8.0-identity-replay/2026-05-21T16-47-12-106Z/report.json` | 12/12 accepted，P0/P1/P2=0/0/1，cost `$0.00174836` |
| rc final raw | `artifacts/deepseek-drift-probe/v1.8.0-identity-replay/2026-05-21T17-06-06-327Z/report.json` | 59/60 accepted，P0 为本地引擎拒绝语句假阳性 |
| rc clean replay | `artifacts/deepseek-drift-probe/v1.8.0-identity-replay/2026-05-21T17-11-53-596Z/report.json` | 60/60 accepted，P0/P1/P2=0/0/16，cost `$0.00954505` |

P2 集中在正式道具词/英文术语，进入后续 prompt/eval hardening，不阻断 v1.8。

## 文档

新增：

- `v1.8.0-b1-身份路线projection-first第一刀.md`
- `v1.8.0-b1-Player-Advocate-30轮走查记录.md`
- `v1.8.0-b1-长线叙事漂移检查记录.md`
- `v1.8.0-b2-同开局差异度可测化.md`
- `v1.8.0-b3-身份特异失败推进.md`
- `v1.8.0-b4-反刷旧档回滚与入口一致性.md`
- `v1.8.0-process-1-只读分析型子代理提速评估.md`
- `v1.8.0-process-2-live-probe与prompt-eval硬化.md`
- `v1.8.0-rc-Player-Advocate-100轮走查记录.md`
- `v1.8.0-rc-live-probe执行记录.md`
- `v1.8.0-rc-Skill同步审计记录.md`
- `v1.8.0-rc-质量收束记录.md`

已同步：

- `README.md`
- `v1.8.0-小版本执行路线图.md`
- `v1.8.0-测试矩阵.md`
- `v1.8.0-真相源索引.md`
- `v1.8.0-Git提交与推送计划.md`
- `指导大纲/项目仪表盘.md`
- `指导大纲/historical-index.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

## skill sync

已更新：

- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
- `C:\Users\11411\.codex\skills\reverend-insanity-lore\SKILL.md`

记录为 `no_update_needed`：

- `mirofish-reborng-export`
- `reborn-combat-motion`

## 验证

已通过：

- `npm test`：148 files / 801 tests passed。
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npm run check:runtime-assets`：163 files checked，zero-byte=0。
- `npm run check:qingmao-assets`：23 entries checked。
- `npm run check:player-visible-copy`：284 files scanned。
- `npm run test:e2e`：68 tests passed。
- `npm run test:e2e:long`：12 tests passed。
- `npm run check:production-preview`
- `npm run check:stale-entrypoints`：report `artifacts/v1.6.0/stale-entrypoints/2026-05-21T17-35-33-252Z/report.json`
- `npm run check:knowledge-index-boundaries`：report `artifacts/v1.6.0/knowledge-index-boundaries/2026-05-21T17-28-57-896Z/report.json`
- `npm run check:mirofish-intake-promotions`：report `artifacts/v1.6.0/mirofish-intake-promotions/2026-05-21T17-28-57-905Z/report.json`
- `npm run eval:deepseek:v180-identity-replay-dry-run`
- `node --check scripts/run-v180-identity-replay-live-probe.mjs`
- `npm run check:player-advocate-gate -- 指导大纲/v1.8.0/codex/00-总览/v1.8.0-b1-Player-Advocate-30轮走查记录.md 30`
- `npm run check:player-advocate-gate -- 指导大纲/v1.8.0/codex/00-总览/v1.8.0-rc-Player-Advocate-100轮走查记录.md 100`

## 下一步

建议先开 `v1.9` 专家团启动会。不要直接进入身份持久化、`runFingerprint`、区域事件 ledger、正式地点/阵营/奖励/NPC 生死、DeepSeek visible knowledge/RAG、BFF/backend、子代理或 EdgeOne 部署。
