# 2026-05-22 v1.9 b1-to-rc readiness 收束交接稿

## 当前状态

- 当前分支：`codex/v190-b1-to-rc-readiness-closure`
- 基线：`c6a7d57 docs: 完成v1.9-b1前readiness复核`
- 本次性质：v1.9 report-only 里程碑收束；无 runtime、无 save-format bump、无 DeepSeek 权限变更、无 live DeepSeek、无 UI/store/backend/subagents。

## 完成内容

v1.9 已完成本地 report-only 里程碑：

- `v1.9.0-b1-v2-readiness-projection-report第一刀.md`
- `v1.9.0-b2-区域事件envelope与测试矩阵硬化.md`
- `v1.9.0-b3-同开局长期差异与runFingerprint评估.md`
- `v1.9.0-b4-v2长测工厂与T3计划.md`
- `v1.9.0-process-1-P2术语与正式凭证hardening.md`
- `v1.9.0-process-2-只读分析型子代理试点评估.md`
- `v1.9.0-rc-Skill同步审计记录.md`
- `v1.9.0-rc-质量收束记录.md`

同步更新：

- `README.md`
- `v1.9.0-总体开发大纲.md`
- `v1.9.0-小版本执行路线图.md`
- `v1.9.0-需求决策池.md`
- `v1.9.0-测试矩阵.md`
- `v1.9.0-真相源索引.md`
- `v1.9.0-v2.0区域活世界readiness草案.md`
- `v1.9.0-Git提交与推送计划.md`
- `指导大纲/项目仪表盘.md`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`

## 关键结论

v1.9 的结论是：

`v2.0 可以进入启动会/设计门禁讨论，但不能自动进入 runtime。`

v1.9 没有新增：

- runtime / UI tab / store action
- save field / migration / defaults
- `SAVE_FORMAT_VERSION = 25`
- `regionalEventLedger`
- `runFingerprint`
- `regionalLifeState` / `areaLivingState`
- `identityRouteState` / `professionState`
- DeepSeek prompt/context/model/authority
- DeepSeek visible summary / RAG
- runtime canon / knowledge-index 正文
- formal location / faction / reward / NPC life-death
- BFF/backend / subagents / public wording / EdgeOne

## v2.0 前仍需用户决策

- 是否正式开启 v2.0 专家团启动会。
- 是否正式批准第一核心区域为 `南疆早期低阶外缘小区域`。
- 是否 bump `SAVE_FORMAT_VERSION = 25`。
- 是否新增 `regionalEventLedger`。
- 是否新增 `runFingerprint`。
- 是否新增正式区域/身份状态。
- 是否执行 T3 300+ mixed/live/replay 长测。
- 是否允许 DeepSeek visible knowledge/RAG 或 BFF/backend。
- 是否允许只读/分析型子代理试点。
- 是否允许任何正式地点、阵营、奖励、NPC 生死或 canon promotion。

## Skill 同步

- `reborn-expert-council`：updated，已同步 v1.9 complete locally 和 v2.0 前硬停。
- `game-dev-text`：updated，已同步 report-only completion、v24、无 runtime/save/DeepSeek。
- `reverend-insanity-lore`：updated，已同步南疆低阶外缘只是候选，不开放完整南疆/商家城/正式身份/hidden。
- `mirofish-reborng-export`：no_update_needed，b1-rc 未新增 MiroFish export。
- `reborn-combat-motion`：no_update_needed，未触碰 combat/motion/visual runtime。

## 验证

本阶段已记录：

- `git diff --check`
- `rg -n "v1.9.0-b1-v2-readiness|v1.9.0-b2-|v1.9.0-b3-|v1.9.0-b4-|v1.9.0-process-1|v1.9.0-process-2|v1.9.0-rc" 指导大纲/v1.9.0/codex/00-总览 指导大纲/项目仪表盘.md AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.9.0 --topic=southern_border_low_rank_region_life_v2_prelude_slice --stage=complete`

结果：`git diff --check` pass（仅 Windows 换行提示）；`rg` pass；MiroFish checker pass，P0=0、P1=0、P2=0、Info=0，报告路径 `artifacts/v1.9.0/mirofish-dual-repo-pipeline/2026-05-22T06-36-53-526Z/report.json`。

不运行 unit/e2e/build/live，因为没有源码、runtime、UI、prompt、存档或后端改动。

## 下一步

停下给用户决策：是否开启 v2.0 专家团启动会。
