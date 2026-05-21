# v1.7.0 MiroFish intake review：southern_border_low_rank_outer_edge_life_slice

日期：2026-05-21
状态：passed_for_a2_rule_and_test_draft；未进入 runtime/canon/DeepSeek

## Source

- request：`指导大纲/vMiroFish/requests/v1.7.0/2026-05-21-v170-southern-border-low-rank-outer-edge-life-slice.md`
- blueprint：`指导大纲/vMiroFish/requests/v1.7.0/2026-05-21-v170-southern-border-low-rank-outer-edge-life-slice-blueprint.json`
- export：`指导大纲/vMiroFish/v1.7.0/exports/v170_southern_border_low_rank_outer_edge_life_slice_export_ready.json`
- report：`指导大纲/vMiroFish/v1.7.0/exports/v170_southern_border_low_rank_outer_edge_life_slice_report.json`
- handoff：`指导大纲/vMiroFish/v1.7.0/exports/v170_southern_border_low_rank_outer_edge_life_slice_handoff.md`
- MiroFish source dataset：`uploads/ri_corpus/exports/living_world_review_strict_flash_fullbook_2340_reviewable`

## Export summary

| 指标 | 值 |
|---|---:|
| totalItems | 13 |
| sourcePointers | 13 |
| quoteLikeKeys | 0 |
| export_ready | 13 |

Category 统计：

| category | count |
|---|---:|
| `caravanContactWindow` | 1 |
| `caravanEntryPrecondition` | 1 |
| `caravanPermissionWindow` | 1 |
| `lowRankTradeRefusalPattern` | 2 |
| `lowStatusCaravanLife` | 1 |
| `outerEdgeInterrogationPattern` | 1 |
| `routeDestinationPressure` | 1 |
| `routePressureEvent` | 1 |
| `routeSupplyPressure` | 1 |
| `shelterAndDebtWindow` | 1 |
| `smallMarketWindow` | 1 |
| `temporaryLodgingWindow` | 1 |

Coverage：

- `outerEdgeInterrogation=true`
- `caravanContactWindows=3`
- `temporaryLodgingOrShelter=2`
- `tradeRefusalAndMarket=3`
- `routeSupplyPressure=2`

## Boundary checks

| 检查 | 结论 |
|---|---|
| `quote` / `originalText` / `excerpt` / `verbatim` | pass，未出现 |
| `rawText` / `sourceText` | pass，未出现 |
| hidden facts | pass，本包无 hidden body；未吸收 hidden/private |
| `runtimeAuthority` | pass，item-level 均为 `candidate_only`；顶层 `canonBoundary.runtimeAuthority=none` |
| `runtimeVisible` | pass，均为 false |
| `deepSeekVisible` | pass，均为 false |
| `requiresHumanCanonReview` | pass，均要求人工/版本门禁 |
| source pointer 格式 | pass，13 个 source pointer 均带 `sourcePointerId` |
| duplicate id | pass，未发现重复 item id |

## Intake decision

本包通过 a2 intake，但只允许转写为 RebornG-owned 规则草案、测试样本和候选池。它不进入 `src/canon`、runtime store、DeepSeek prompt/context、知识索引正文或玩家可见 hidden facts。

### accepted_for_rule_draft

| export item | RebornG 转写方向 |
|---|---|
| `outer_edge_ch0231_village_gate_interrogation` | 外缘盘问规则：低调身份、绕路、解释来意只能降低注意，不解锁正式地点 |
| `caravan_ch0234_join_by_goods_and_labor` | 商队接触窗口：货物、短期劳动、中介引荐作为前置条件 |
| `caravan_ch0235_goods_as_entry_ticket` | 补给/货物/人情三选一的进入商队外缘前置 |
| `caravan_ch0236_request_and_report_to_manager` | 商队许可链：引荐、批准、报到、被安排 |
| `caravan_ch0236_low_status_labor_assignment` | 低身份商队生活：搬运、卸货、杂务、被管事调派 |
| `market_ch0237_stall_sale_and_small_market` | 小集市窗口：短期摆摊、打听补给、被观察 |
| `market_ch0237_bargain_refusal` | 压价/拒绝/围观/耐心消耗 |
| `caravan_ch0240_shelter_request_after_conflict` | 临时收留、欠人情、受伤求助的非胜利推进 |
| `caravan_ch0241_shelter_tent_arrangement` | 帐篷/营地/短期安置，不写持久落脚状态 |
| `caravan_ch0241_road_event_protocol` | 路障/野外事件的“按规矩处理”牌组 |
| `caravan_ch0242_goods_toll_event` | 货物、力气、规矩、让步带来的通行压力 |

### accepted_for_test_sample

| sample | 来源 |
|---|---|
| 同开局差异度：一次出现盘问，一次出现交易拒绝，一次出现路障/补给压力，但正式事实稳定 | `outerEdgeInterrogationPattern`、`lowRankTradeRefusalPattern`、`routeSupplyPressure` |
| 商队外缘：货物/劳动/人情可成为接触窗口，但不能生成正式商队身份 | `caravanContactWindow`、`caravanEntryPrecondition`、`caravanPermissionWindow` |
| 失败推进：被压价、被安排杂务、求助收留都应给下一步，而非死路 | `lowRankTradeRefusalPattern`、`lowStatusCaravanLife`、`shelterAndDebtWindow` |

### deferred

| export item | 延期原因 |
|---|---|
| `outer_edge_ch0231_destination_hint_only` | 只可作为长期方向/边界规则；完整商家城、正式入城、正式商家关系仍超出 v1.7 |

## Blocked material

无 item 因 forbidden text key、hidden body、runtime authority 或 DeepSeek authority 被阻断。

但以下吸收方向仍然 blocked：

- 正式地点解锁。
- 完整南疆或完整商家城。
- 正式商队成员身份。
- 正式价格表、库存、交易结算。
- 正式势力关系、通缉、招揽或封锁结论。
- NPC 生死、捕获、背叛、永久伤势。
- 方源私密因果、hidden/private 内容可见化。
- DeepSeek visible full-book summary / RAG。

## Current phase impact

- `v1.7.0-a2` 可以把本包转写为规则草案和测试矩阵。
- `b1` 若进入 runtime，仍必须 projection-first，保持 `SAVE_FORMAT_VERSION = 24`。
- 本包不批准 `regionalLifeState` / `areaLivingState` / `runFingerprint` / `regionalEventLedger`。
- 本包不批准 live probe 强度、public test / BFF、EdgeOne 部署或子代理参与。

## User decision needed

本 intake 不需要新的用户决策即可完成 a2 文档门禁；但以下事项如要推进必须另批：

- 把任一材料晋升为 runtime canon。
- 新增持久区域字段或 v25。
- 把商家城、商队、命名 NPC、势力结果或奖励正式化。
- 启用只读/分析型子代理提速。
- 让 DeepSeek 看到基础包派生摘要。
