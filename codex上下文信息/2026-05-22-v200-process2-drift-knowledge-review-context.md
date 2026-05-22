# 2026-05-22 v2.0 process-2 drift and knowledge review context

分支：`codex/v200-process2-drift-knowledge-review`
状态：completed locally；待提交/推送

## 本轮目标

完成 `v2.0.0-process-2-长线漂移与知识库复核`，在进入 rc 前确认 drift evidence、Player Advocate、MiroFish、知识库和测试矩阵链路没有漏门。

## 范围

本阶段为纯复核：

- 不改 runtime。
- 不新增 save 字段。
- 不调用 live DeepSeek。
- 不新增 MiroFish export。
- 不写知识库正文。
- 不启用 BFF/backend/subagents/public wording/EdgeOne。

## 复核结果

- b1/b2/b3/b4/process-1 live drift evidence chain complete。
- b1/b2/b3/b4/process-1 五份 Player Advocate 记录均通过 gate，理解率 100%，confused=0。
- `knowledge-index-boundaries` 通过：entries=0，P0/P1/P2=0/0/0。
- `mirofish-intake-promotions` 通过：entries=0，matrixIds=22，P0/P1/P2=0/0/0。
- `mirofish-base-pack-inventory` 通过：chapters=2340，P0/P1/P2=0/0/0。
- v1.9 dual-repo topic-slice pipeline 通过：P0/P1/P2=0/0/0。
- v200 regional ledger dry-run 通过，无 token spend。

## 新增文档

- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-process-2-长线漂移与知识库复核.md`
- `指导大纲/v2.0.0/codex/00-总览/v2.0.0-process-2-Skill同步审计记录.md`

## 同步文档

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- v2.0 README / 总体开发大纲 / 小版本路线图 / 测试矩阵 / 真相源索引 / MiroFish 协议 / Git 计划 / 需求决策池
- external skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`

## 复核 artifact

- `artifacts/v1.6.0/knowledge-index-boundaries/2026-05-22T10-53-19-645Z/report.json`
- `artifacts/v1.6.0/mirofish-intake-promotions/2026-05-22T10-53-19-670Z/report.json`
- `artifacts/v1.6.0/mirofish-base-pack-inventory/2026-05-22T10-53-22-406Z/report.json`
- `artifacts/v1.9.0/mirofish-dual-repo-pipeline/2026-05-22T10-53-19-682Z/report.json`

## 已执行验证

- `npm run check:knowledge-index-boundaries`
- `npm run check:mirofish-intake-promotions`
- `npm run check:mirofish-base-pack-inventory`
- `npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.9.0 --topic=southern_border_low_rank_region_life_v2_prelude_slice --stage=complete`
- `npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-b1-Player-Advocate-30轮走查记录.md 30`
- `npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-b2-Player-Advocate-30轮走查记录.md 30`
- `npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-b3-Player-Advocate-30轮走查记录.md 30`
- `npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-b4-Player-Advocate-30轮走查记录.md 30`
- `npm run check:player-advocate-gate -- 指导大纲/v2.0.0/codex/00-总览/v2.0.0-process-1-Player-Advocate-30轮走查记录.md 30`
- `npm run eval:deepseek:v200-regional-ledger-dry-run`

## 边界

- `SAVE_FORMAT_VERSION` 保持 25。
- 不新增字段。
- 不新增 `runFingerprint`。
- 不开放 formal outcome。
- 不改 DeepSeek 模型/权限。
- 不启用 RAG/BFF/backend/subagents/public wording/EdgeOne。

## 下一步

提交并推送 process-2 后，进入：

`v2.0.0-rc-T3长测与质量收束`

rc 硬门仍为：

- total rounds >= 320。
- live rounds >= 160。
- replay/deterministic rounds >= 160。
- checkpoint 每 20 轮。
- model 固定 `deepseek-v4-flash`。
