# MiroFish handoff：v180 southern_border_low_rank_identity_routes_outer_edge_slice

日期：2026-05-21
来源仓库：`D:\workspace\CodeBuddyWorkSpace\2026-05-12-task-1\MiroFish`
目标仓库：`D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
topicId：`southern_border_low_rank_identity_routes_outer_edge_slice`
状态：export_ready_for_reborng_intake

## Export command

从 MiroFish backend 使用项目 `.venv` 运行：

`python scripts\build_living_world_special_export.py --packages uploads/ri_corpus/exports/living_world_review_strict_flash_fullbook_2340_reviewable --reviews uploads/ri_corpus/reviews/living_world_item_reviews_tight_v2_pressure_reviewable_promoted.json --blueprint <v1.8 blueprint> --out <v1.8 export> --report-out <v1.8 report>`

说明：系统 Python 缺少 MiroFish backend 依赖；本次实际使用 `backend\.venv\Scripts\python.exe`。第一次未指定 fullbook dataset 时 totalItems=0，已改用 v1.7 样板相同的 `living_world_review_strict_flash_fullbook_2340_reviewable` 后重新导出。

## Output files

- export：`指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_export_ready.json`
- report：`指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_report.json`
- RebornG request：`指导大纲/vMiroFish/requests/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes.md`
- blueprint：`指导大纲/vMiroFish/requests/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes-blueprint.json`

## Summary

| 指标 | 值 |
|---|---:|
| totalItems | 13 |
| sourcePointers | 13 |
| quoteLikeKeys | 0 |
| review status | `export_ready` x 13 |

Coverage：

- `identityCheckWindows=1`
- `caravanTempLaborRoutes=3`
- `rogueShortWorkRoutes=4`
- `guardOrGatheringRoutes=2`
- `messageIntelRoutes=2`
- `formalPropWordRisks=1`
- `formalIdentityBoundaries=1`

## RebornG boundary

本 handoff 只表示 MiroFish 已交付 quote-redacted candidate material。它不表示：

- RebornG runtime canon 晋升。
- DeepSeek visible context 晋升。
- 正式身份/职业/阵营/地点/奖励/NPC 生死批准。
- hidden/private 可见化。
- `SAVE_FORMAT_VERSION` bump 或新增持久字段批准。

下一步由 RebornG 执行 intake review，并把可用材料转写为 `candidate_pool`、`rule_draft`、`test_sample` 或 `deferred/quarantined/rejected`。
