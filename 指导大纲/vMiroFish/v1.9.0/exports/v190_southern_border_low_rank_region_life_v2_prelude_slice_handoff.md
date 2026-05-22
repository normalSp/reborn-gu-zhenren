# MiroFish handoff：v190 southern_border_low_rank_region_life_v2_prelude_slice

日期：2026-05-22
来源仓库：`D:\workspace\CodeBuddyWorkSpace\2026-05-12-task-1\MiroFish`
目标仓库：`D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
topicId：`southern_border_low_rank_region_life_v2_prelude_slice`
状态：export_ready_for_reborng_intake

## Export command

从 MiroFish backend 使用项目 `.venv` 运行：

`.\.venv\Scripts\python.exe scripts\build_living_world_special_export.py --packages uploads\ri_corpus\exports\living_world_review_strict_flash_fullbook_2340_reviewable --reviews uploads\ri_corpus\reviews\living_world_item_reviews_tight_v2_pressure_reviewable_promoted.json --blueprint <v1.9 blueprint> --out <v1.9 export> --report-out <v1.9 report>`

说明：系统 Python 缺少 MiroFish backend 依赖；本次实际使用 `backend\.venv\Scripts\python.exe`。首次尝试未设置依赖环境时失败于 `flask` 缺失，随后使用 `.venv` 成功导出。

## Output files

- export：`指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_export_ready.json`
- report：`指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_report.json`
- RebornG request：`指导大纲/vMiroFish/requests/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude.md`
- blueprint：`指导大纲/vMiroFish/requests/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude-blueprint.json`

## Summary

| 指标 | 值 |
|---|---:|
| totalItems | 13 |
| sourcePointers | 13 |
| quoteLikeKeys | 0 |
| review status | `export_ready` x 13 |

Coverage：

- `outerEdgeAndFarBoundary=2`
- `caravanContactAndPreconditions=4`
- `marketAndSupplyPressure=3`
- `shelterAndRestWindows=2`
- `roadAndConflictProtocols=2`
- `publicObservationNoHidden=2`
- `v2EventLedgerRiskSamples=13`
- `runFingerprintRiskSamples=13`
- `formalPropWordRisks=1`

## RebornG boundary

本 handoff 只表示 MiroFish 已交付 quote-redacted candidate material。它不表示：

- RebornG runtime canon 晋升。
- DeepSeek visible context 晋升。
- knowledge index 正文导入。
- `regionalEventLedger`、`runFingerprint`、`regionalLifeState`、`identityRouteState` 或 `SAVE_FORMAT_VERSION = 25` 批准。
- 正式地点/势力/身份/奖励/NPC 生死批准。
- hidden/private 可见化。
- BFF/backend、子代理或 EdgeOne 部署批准。

下一步由 RebornG 执行 intake review，并把可用材料转写为 `candidate_pool`、`rule_draft`、`test_sample` 或 `deferred/quarantined/rejected`。
