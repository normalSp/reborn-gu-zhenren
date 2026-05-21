# v1.8.0 MiroFish intake review：southern_border_low_rank_identity_routes_outer_edge_slice

日期：2026-05-21
状态：passed_for_a2_rule_and_test_draft；未进入 runtime/canon/DeepSeek
目标阶段：`v1.8.0-a2`

## Source

- request：`指导大纲/vMiroFish/requests/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes.md`
- blueprint：`指导大纲/vMiroFish/requests/v1.8.0/2026-05-21-v180-southern-border-low-rank-identity-routes-blueprint.json`
- export：`指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_export_ready.json`
- report：`指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_report.json`
- handoff：`指导大纲/vMiroFish/v1.8.0/exports/v180_southern_border_low_rank_identity_routes_outer_edge_slice_handoff.md`
- MiroFish source dataset：`uploads/ri_corpus/exports/living_world_review_strict_flash_fullbook_2340_reviewable`
- MiroFish review ledger：`uploads/ri_corpus/reviews/living_world_item_reviews_tight_v2_pressure_reviewable_promoted.json`

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
| `caravanEntryPrecondition` | 1 |
| `caravanTempLaborCandidate` | 1 |
| `formalIdentityBoundary` | 1 |
| `formalPropWordRisk` | 1 |
| `gatheringRunnerPressure` | 1 |
| `guardEscortPressure` | 1 |
| `identityCheckWindow` | 1 |
| `lowStatusLaborCandidate` | 1 |
| `messageIntelRunnerPressure` | 1 |
| `rogueShortWorkPressure` | 2 |
| `shelterDebtShortWork` | 1 |
| `temporaryLodgingIdentityWindow` | 1 |

Coverage：

- `identityCheckWindows=1`
- `caravanTempLaborRoutes=3`
- `rogueShortWorkRoutes=4`
- `guardOrGatheringRoutes=2`
- `messageIntelRoutes=2`
- `formalPropWordRisks=1`
- `formalIdentityBoundaries=1`

## Boundary checks

| 检查 | 结论 |
|---|---|
| `quote` / `originalText` / `excerpt` / `verbatim` | pass，未出现 |
| `rawText` / `sourceText` | pass，未出现 |
| hidden facts | pass，本包无 hidden body；未吸收 hidden/private |
| `runtimeAuthority` | pass，item-level 均为 `candidate_only`；顶层 `canonBoundary.runtimeAuthority=none` |
| `runtimeVisible` | pass，均为 false |
| `deepSeekVisible` | pass，均为 false |
| source pointer 格式 | pass，13 个 source pointer 均带 `sourcePointerId` |
| duplicate id | pass，未发现重复 item id |

## Intake decision

本包通过 a2 intake，但只允许转写为 RebornG-owned `candidate_pool`、`rule_draft`、`test_sample` 和 `deferred`。它不进入 `src/canon`、runtime store、DeepSeek prompt/context、知识索引正文或玩家可见 hidden facts。

### accepted_for_candidate_pool

| candidate | 来源 | 边界 |
|---|---|---|
| 商队学徒 / 临时帮工 | `identity_ch0234_caravan_temp_labor_contact`、`identity_ch0235_goods_entry_ticket`、`identity_ch0236_low_status_labor_assignment` | 候选标签，不是正式商队成员、长期职位或工资 |
| 散修短工 | `identity_ch0235_trade_refusal_short_work`、`identity_ch0237_bargain_refusal`、`identity_ch0240_shelter_debt_short_work`、`identity_ch0241_temporary_lodging` | 候选标签，不是散修势力、稳定据点或利润循环 |
| 低阶护卫 / 护送候选 | `identity_ch0241_road_event_guard_candidate` | 候选标签，不是正式护卫组织、战斗奖励或 NPC 命运 |
| 采集跑腿 | `identity_ch0242_goods_toll_gathering_runner` | 候选标签，不是材料农场、数字消耗或奖励结算 |
| 情报跑腿 / 传话人 | `identity_ch0231_outer_edge_interrogation`、`identity_ch0237_temporary_market_observe` | 候选标签，不是隐藏事实揭示或正式间谍身份 |

### accepted_for_rule_draft

| export item | RebornG 转写方向 |
|---|---|
| `identity_ch0231_outer_edge_interrogation` | 外缘盘问：解释身份、传话、避祸、绕路只能降低注意或给下一步 |
| `identity_ch0234_caravan_temp_labor_contact` | 货物/短工/中介作为商队外缘接触窗口 |
| `identity_ch0235_goods_entry_ticket` | 补给、货物、人情作为靠近商队前置 |
| `identity_ch0236_permission_chain_prop_word_risk` | 登记/报到/负责人点头等正式道具词降级为前置条件和 P2 风险 |
| `identity_ch0236_low_status_labor_assignment` | 低身份杂务、搬运、卸货、被调派作为失败推进 |
| `identity_ch0237_temporary_market_observe` | 小集市公开观察/打听/传话，不揭示 hidden/private |
| `identity_ch0237_bargain_refusal` | 压价、拒绝、围观和耐心消耗，不生成价格表 |
| `identity_ch0240_shelter_debt_short_work` | 临时收留、欠人情、求助作为非胜利推进 |
| `identity_ch0241_temporary_lodging` | 帐篷/营地/短期安置，不写持久落脚状态 |
| `identity_ch0241_road_event_guard_candidate` | 路障/规矩/护送风险，不直接生成战斗或奖励 |
| `identity_ch0242_goods_toll_gathering_runner` | 货物、力气、让步或绕路压力，不写数字消耗 |

### accepted_for_test_sample

| sample | 来源 |
|---|---|
| 同开局差异度：三次同一开局分别偏向盘问、短工、护送/采集压力，但正式事实稳定 | `identityCheckWindow`、`rogueShortWorkPressure`、`guardEscortPressure`、`gatheringRunnerPressure` |
| 正式道具词：玩家拿到木牌/令牌/登记/报到说法后要求“正式加入商队” | `formalPropWordRisk` |
| 情报跑腿：玩家要求打听隐秘真相或方源私密因果 | `messageIntelRunnerPressure`、`identityCheckWindow` |
| 商队临时帮工：玩家要求稳定工资/长期职位/正式身份 | `caravanTempLaborCandidate`、`lowStatusLaborCandidate` |

### deferred

| export item | 延期原因 |
|---|---|
| `identity_ch0231_far_city_boundary` | 只可作为长期方向/边界规则；完整商家城、正式入城、正式商家关系仍超出 v1.8 |

## Blocked material

无 item 因 forbidden text key、hidden body、runtime authority 或 DeepSeek authority 被阻断。

但以下吸收方向仍然 blocked：

- 正式身份/职业/组织系统。
- 正式商队成员、散修势力、护卫组织、正式间谍身份。
- 正式工资、价格表、库存、交易结算、任务奖励。
- 完整南疆、完整商家城、正式地点或阵营。
- NPC 生死、捕获、背叛、永久伤势。
- 方源私密因果、hidden/private 内容可见化。
- DeepSeek visible full-book summary / RAG。
- `SAVE_FORMAT_VERSION = 25`、`identityRouteState`、`professionState`、`runFingerprint`、`regionalEventLedger`。

## Current phase impact

- `v1.8.0-a2` 可以把本包转写为规则草案和测试矩阵。
- `b1` 若进入 runtime，仍必须 projection-first，保持 `SAVE_FORMAT_VERSION = 24`。
- 本包不批准任何 runtime canon、DeepSeek authority、save field、formal identity 或 public wording。
- 本包不批准子代理参与、BFF/backend 或 EdgeOne 部署。

## User decision needed

本 intake 不需要新的用户决策即可完成 a2 文档门禁。以下事项如要推进必须另批：

- 把任一材料晋升为 runtime canon。
- 新增持久身份/差异度/区域事件字段或 v25。
- 把商家城、商队、命名 NPC、势力结果或奖励正式化。
- 启用只读/分析型子代理提速。
- 让 DeepSeek 看到基础包派生摘要。
