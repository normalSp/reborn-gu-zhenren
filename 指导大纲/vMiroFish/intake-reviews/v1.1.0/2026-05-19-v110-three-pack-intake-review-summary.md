# v1.1.0 MiroFish 三包 Intake Review Summary

日期：2026-05-19
状态：accepted_for_candidate_pool；不得直接进入 runtime/canon/DeepSeek

## 结论

v1.1 三个 MiroFish 包已交付，格式和覆盖度通过 RebornG intake 第一轮审查。

可进入：

- `candidate_pool`
- `fact_card_draft`
- `rule_draft`
- `test_sample`
- `deferred`

不得进入：

- canon 真相源
- runtime 权威
- DeepSeek visible context
- 玩家可见隐藏事实正文
- 正式 route/location/currentRegion 写入
- 正式地点、阵营、奖励、NPC 生死

## 交付文件

| 包 | JSON | report | summary |
|---|---|---|---|
| route/location boundary | `v110_route_location_boundary_pack_export_ready.json` | `v110_route_location_boundary_pack_export_ready_report.json` | `v110_route_location_boundary_pack_summary.md` |
| Southern Border outer edge public fact | `v110_southern_border_outer_edge_public_fact_pack_export_ready.json` | `v110_southern_border_outer_edge_public_fact_pack_export_ready_report.json` | `v110_southern_border_outer_edge_public_fact_pack_summary.md` |
| travel/supply/pursuit/identity pressure | `v110_travel_supply_pursuit_identity_pressure_pack_export_ready.json` | `v110_travel_supply_pursuit_identity_pressure_pack_export_ready_report.json` | `v110_travel_supply_pursuit_identity_pressure_pack_summary.md` |
| coverage matrix | `qingmao_v110_request_packs_coverage_matrix.json` | - | - |

## 技术检查

| 检查项 | 结果 |
|---|---|
| export-ready JSON 可解析 | 通过 |
| 三包 items 数 | 每包 8 项，共 24 项 |
| skipped | 每包 0 |
| forbidden key 检查 | 未发现 `quote/originalText/excerpt/verbatim/rawText/sourceText/正文/原文` 等字段 |
| source pointer | 三包 summary 分别记录 15 / 18 / 18 个 source pointers |
| visibility | 包含 public、if_boundary、human_review、hidden_ref_only |
| completion gate | 三包均为 `complete_candidate` |

## 包级审查

### v110_route_location_boundary_pack

可用范围：

- route state candidate
- outer edge state candidate
- pursuit route boundary
- route gate candidate
- Southern Border outer edge
- blocked location boundary
- faction entry boundary
- hidden ref boundary

处理建议：

- public 项可进入 v1.1 a1/a2 的字段设计和测试样本。
- `human_review` 和 `hidden_ref_only` 项只能作为 deferred/test sample，不能进入 UI 或 DeepSeek。
- 本包足以支持 v1.1 a1/a2 设计门禁；b1 runtime absorption 仍需用户批准字段方案。

### v110_southern_border_outer_edge_public_fact_pack

可用范围：

- route edge public fact
- caravan public fact
- loose cultivator public fact
- resource point boundary
- danger area public fact
- city outer edge public fact
- UI public summary boundary
- hidden causality boundary

处理建议：

- public 项可进入 public fact draft、rule draft、test sample。
- city outer edge 为 `human_review`，只能 deferred/fact_card_draft，不可直接承诺商家城开放。
- hidden causality boundary 为 `hidden_ref_only`，仅可作为测试和隐藏边界。

### v110_travel_supply_pursuit_identity_pressure_pack

可用范围：

- travel supply pressure
- pursuit pressure
- identity pressure
- faction pressure
- route pressure
- mixed pressure
- extreme intent test
- hidden ref pressure

处理建议：

- 可支持 v1.1 b3 的压力回流规则草稿和测试矩阵。
- `faction_pressure`、`extreme_intent_test` 为 `human_review`，不能直接触发正式阵营/追杀/NPC 结果。
- `hidden_ref_pressure` 只做 hidden boundary/test sample，不进入 UI 或 DeepSeek。

## 推广表

| 目标 | 可推广内容 | 禁止内容 |
|---|---|---|
| a1 设计门禁 | 字段候选、边界、测试样本 | runtime 写入 |
| a2 字段表/intake | public fact draft、rule draft、deferred list | hidden body、canon truth |
| b1 路线状态第一刀 | 仅在用户批准字段方案后吸收 rule draft | 未批准的 save bump |
| b2 区域状态 UI | public fact draft、UI boundary | 完整南疆/商家城承诺 |
| b3 压力回流 | supply/pursuit/identity test sample | 正式阵营、奖励、NPC 生死 |

## 仍需用户决策

1. 是否批准进入 v1.1 a1 route/location/save-format 设计门禁。
2. a1 后是否实际提升 `SAVE_FORMAT_VERSION = 23`。
3. route/location 字段采用分字段还是聚合字段。
4. b1 是否允许写入正式 route state。

## 最终判定

三包合格，可用于 v1.1 设计门禁、规则草稿、事实草稿和测试样本。

不得在未完成 a1/a2 和用户字段决策前进入 runtime absorption。
