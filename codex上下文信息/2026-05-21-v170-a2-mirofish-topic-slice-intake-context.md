# v1.7.0-a2 MiroFish 区域活世界 topic-slice intake 交接稿

时间：2026-05-21
当前分支：`codex/v170-a2-mirofish-topic-slice-intake`
基线：`296ffb4`（`codex/v170-a1-mirofish-dual-repo-pipeline`）

## 用户最新批准

用户批准 D-171-001 至 D-171-010，并要求进入 `v1.7.0-a2`。

本轮按已批准的 D-171-PROC 执行：第一条 `southern_border_low_rank_outer_edge_life_slice` 样板由当前 Codex 主线程主控，不使用子代理；样板稳定后再给出只读/分析型子代理的风险收益，交用户单独决策。

## 已完成

- 新增 RebornG request：`指导大纲/vMiroFish/requests/v1.7.0/2026-05-21-v170-southern-border-low-rank-outer-edge-life-slice.md`。
- 新增 request blueprint：`指导大纲/vMiroFish/requests/v1.7.0/2026-05-21-v170-southern-border-low-rank-outer-edge-life-slice-blueprint.json`。
- 使用 MiroFish 仓库只读导出脚本生成 RebornG-facing export/report。
- 新增 MiroFish handoff：`指导大纲/vMiroFish/v1.7.0/exports/v170_southern_border_low_rank_outer_edge_life_slice_handoff.md`。
- 新增 RebornG intake review：`指导大纲/vMiroFish/intake-reviews/v1.7.0/2026-05-21-v170-southern-border-low-rank-outer-edge-life-slice-intake-review.md`。
- 新增 a2 阶段记录与规则草案：`指导大纲/v1.7.0/codex/00-总览/v1.7.0-a2-MiroFish-区域活世界topic-slice-intake.md`、`v1.7.0-a2-区域活世界规则草案.md`。
- 同步 v1.7 README、路线图、需求池、测试矩阵、真相源索引、MiroFish 协议、Git 计划、项目仪表盘、AGENTS、PROJECT-STATE。
- 同步 skill：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`mirofish-reborng-export`；`reborn-combat-motion` 本轮无触发更新。

## MiroFish 导出结果

- topicId：`southern_border_low_rank_outer_edge_life_slice`
- totalItems：13
- byReviewStatus：`export_ready = 13`
- sourcePointers：13
- quoteLikeKeys：0
- coverage：
  - `outerEdgeInterrogation = true`
  - `caravanContactWindows = 3`
  - `temporaryLodgingOrShelter = 2`
  - `tradeRefusalAndMarket = 3`
  - `routeSupplyPressure = 2`

## RebornG intake 结果

- intake status：`passed_for_a2_rule_and_test_draft`
- accepted for rule draft：11
- accepted for test sample：3 组
- deferred：1（远处城池方向提示，仅作未来完整商家城/入城边界材料）
- blocked：0

本轮只允许把材料晋升到 `rule_draft` / `test_sample` / `deferred`，不得直接晋升为 runtime canon、知识库条目、UI 事实或 DeepSeek visible context。

## 当前硬边界

本轮没有改 runtime、store、save schema、DeepSeek prompt/context/model/authority、`src/canon`、知识库条目或 EdgeOne 部署。

不得把 a2 结论解读为已批准：

- 完整南疆或完整商家城。
- 正式地点、势力、商队/散修身份、交易、价格、库存、奖励。
- NPC 生死、隐藏事实公开、方源私密因果邻近材料。
- 全书 MiroFish 基础包整体导入。
- DeepSeek 全书 RAG、visible summary 或事实裁决权限。
- 子代理参与写入、intake、runtime、canon 或 Git 操作。

## 已通过检查

```powershell
npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.7.0 --topic=southern_border_low_rank_outer_edge_life_slice --stage=request
npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.7.0 --topic=southern_border_low_rank_outer_edge_life_slice --stage=export
npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.7.0 --topic=southern_border_low_rank_outer_edge_life_slice --stage=intake
npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.7.0 --topic=southern_border_low_rank_outer_edge_life_slice --stage=complete
npm run check:mirofish-base-pack-inventory
npm run check:knowledge-index-boundaries
npm run check:mirofish-intake-promotions
```

`scripts/check-mirofish-dual-repo-pipeline.mjs` 已修正 npm 参数读取，并允许顶层 `canonBoundary.runtimeAuthority = "none"`；item-level runtime authority 仍必须是 `candidate_only`。

## 下一步建议

进入 `v1.7.0-b1` 前先做 projection-first runtime gate：继续保持 `SAVE_FORMAT_VERSION = 24`，默认不新增 `regionalLifeState` / `areaLivingState`、不新增 `runFingerprint` / `regionalEventLedger`，只把 a2 规则草案转为本地只读 pressure/event deck。若 b1 需要扩大为持久字段、DeepSeek 权限、正式地点/势力/奖励/NPC 生死、live probe 档位或子代理提速，必须重新停手让用户决策。
