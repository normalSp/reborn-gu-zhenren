# 2026-05-21 v1.8.0-a2 identity topic-slice intake context

## Current branch

- `codex/v180-a2-identity-topic-slice-intake`
- Baseline：`efcfaf1 docs: 建立v1.8-a1身份路线设计门禁`

## User decisions

- 用户批准 D-181-001 至 D-181-010。
- a2 已按 `blocking` 执行 `southern_border_low_rank_identity_routes_outer_edge_slice`。
- 仍不批准 runtime、save-format bump、身份/职业/差异度持久字段、DeepSeek 权限扩张、正式地点/阵营/奖励/NPC 生死、subagent、BFF/public wording 或 EdgeOne 自动部署。

## Completed work

- 新增 RebornG request：
  - `指导大纲/vMiroFish/requests/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes.md`
  - `指导大纲/vMiroFish/requests/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes-blueprint.json`
- 使用 MiroFish backend `.venv` 和 fullbook dataset 导出：
  - `指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_export_ready.json`
  - `指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_report.json`
  - `指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_handoff.md`
- 新增 RebornG intake review：
  - `指导大纲/vMiroFish/intake-reviews/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes-intake-review.md`
- 新增 v1.8-a2 文档：
  - `指导大纲/v1.8.0/codex/00-总览/v1.8.0-a2-MiroFish-低阶身份路线topic-slice-intake.md`
  - `指导大纲/v1.8.0/codex/00-总览/v1.8.0-a2-低阶身份路线规则草案.md`
- 同步 README、路线图、需求池、测试矩阵、MiroFish 协议、Git 计划、真相源索引、仪表盘、PROJECT-STATE、AGENTS。
- 同步外部 skills：
  - `reborn-expert-council` -> `0.1.112`
  - `game-dev-text` -> `2.3.80`
  - `reverend-insanity-lore` -> `0.3.70`
  - `mirofish-reborng-export` -> v1.8-a2 bridge complete 口径

## Export summary

- totalItems：13
- sourcePointers：13
- quoteLikeKeys：0
- blocked：0
- accepted_for_candidate_pool：5 candidate groups
- accepted_for_rule_draft：11 items
- accepted_for_test_sample：4 sample groups
- deferred：1

Coverage：

- `identityCheckWindows=1`
- `caravanTempLaborRoutes=3`
- `rogueShortWorkRoutes=4`
- `guardOrGatheringRoutes=2`
- `messageIntelRoutes=2`
- `formalPropWordRisks=1`
- `formalIdentityBoundaries=1`

## Verification

- `npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.8.0 --topic=southern_border_low_rank_identity_routes_outer_edge_slice --stage=complete`：P0=0，P1=0，P2=0，Info=0。
- `npm run check:stale-entrypoints`：P0=0，P1=0，P2=0，Info=0。
- `git diff --check`：仅 line-ending warning，无 whitespace error。
- stale wording scan：未发现 D-181 未批、a1 当前态、v1.8 request 未授权等旧口径。

## Next recommended step

进入 `v1.8.0-b1-身份路线projection-first第一刀.md`。

b1 边界：

- 保持 `SAVE_FORMAT_VERSION = 24`。
- 不新增 `identityRouteState` / `professionState` / `runFingerprint` / `regionalEventLedger`。
- 只做纯 projection helper。
- 五类身份只作为候选标签/测试样本。
- 同开局差异只来自本地公开压力牌组/表达槽位。
- b1 测试门禁按 D-181：focused unit、old-save、hidden/DeepSeek authority、P2 prop-word、30 轮 Player Advocate、T0、8-12 轮 `deepseek-v4-flash` live smoke。
