# v1.9.0 MiroFish intake review：southern_border_low_rank_region_life_v2_prelude_slice

日期：2026-05-22
状态：passed_for_a2_rule_and_test_draft；未进入 runtime/canon/DeepSeek
目标阶段：`v1.9.0-a2`

## Source

- request：`指导大纲/vMiroFish/requests/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude.md`
- blueprint：`指导大纲/vMiroFish/requests/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude-blueprint.json`
- export：`指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_export_ready.json`
- report：`指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_report.json`
- handoff：`指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_handoff.md`
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
| `caravanContactWindow` | 1 |
| `caravanEntryPrecondition` | 1 |
| `farCityBoundary` | 1 |
| `formalPropWordRisk` | 1 |
| `lowStatusLaborPressure` | 1 |
| `marketFailurePressure` | 1 |
| `marketPressureWindow` | 1 |
| `outerEdgeInterrogationPattern` | 1 |
| `publicObservationWindow` | 1 |
| `roadEventProtocol` | 1 |
| `shelterDebtWindow` | 1 |
| `supplyTollPressure` | 1 |
| `temporaryLodgingWindow` | 1 |

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
| 外缘盘问与公开观察 | `v2prelude_ch0231_outer_edge_interrogation`、`v2prelude_ch0237_temporary_market_observe` | 可作为区域事件入口和公开观察，不解锁正式地点/身份/阵营，不揭示 hidden/private |
| 商队接触与前置条件 | `v2prelude_ch0234_caravan_temp_labor_contact`、`v2prelude_ch0235_goods_entry_ticket`、`v2prelude_ch0236_low_status_labor_assignment` | 可作为临时接触、货物、人情、杂务压力，不授予正式商队成员、路线通行权、稳定工资 |
| 市场与补给压力 | `v2prelude_ch0235_trade_refusal_pressure`、`v2prelude_ch0237_bargain_refusal`、`v2prelude_ch0242_goods_toll_gathering_runner` | 可作为失败推进、压价、绕路、让步，不开放价格表、库存、材料农场或奖励 |
| 散修落脚与人情债 | `v2prelude_ch0240_shelter_debt_short_work`、`v2prelude_ch0241_temporary_lodging` | 可作为短期落脚、求助、人情债提示，不写 NPC 命运、正式庇护、持久据点 |
| 路障、护送与冲突余波 | `v2prelude_ch0241_road_event_guard_candidate`、`v2prelude_ch0242_goods_toll_gathering_runner` | 可作为路况/护送/规矩候选，不直接生成战斗、捕获、死亡、奖励 |
| v2 事件账本风险样本 | 全部 13 item 的 `regionalEventLedgerRisk` | 只能服务未来事件 envelope/ledger 设计，不批准 v1.9 新 save field |
| 同开局差异风险样本 | 全部 13 item 的 `runFingerprintRisk` | 只能服务 replayability 样本，不批准 v1.9 `runFingerprint` |

### accepted_for_rule_draft

| export item | RebornG 转写方向 |
|---|---|
| `v2prelude_ch0231_outer_edge_interrogation` | 外缘盘问：问路、查来历、避祸、绕行或传话只能进入候选事件 |
| `v2prelude_ch0234_caravan_temp_labor_contact` | 货物/短工/中介作为商队外缘接触窗口 |
| `v2prelude_ch0235_trade_refusal_pressure` | 压价、拒绝、摆摊失败作为市场压力，不生成价格表 |
| `v2prelude_ch0235_goods_entry_ticket` | 货物、人情、补给作为靠近商队或歇脚点的前置 |
| `v2prelude_ch0236_permission_chain_prop_word_risk` | 登记/报到/负责人点头/木牌/令牌等词降级为前置条件和 P2/P1 风险 |
| `v2prelude_ch0236_low_status_labor_assignment` | 低身份杂务、搬运、卸货、被调派作为失败推进 |
| `v2prelude_ch0237_temporary_market_observe` | 小集市公开观察/打听/传话，不揭示 hidden/private |
| `v2prelude_ch0237_bargain_refusal` | 压价、拒绝、围观和耐心消耗，不生成利润循环 |
| `v2prelude_ch0240_shelter_debt_short_work` | 临时收留、欠人情、求助作为非胜利推进 |
| `v2prelude_ch0241_temporary_lodging` | 帐篷/营地/短期安置，不写持久落脚状态 |
| `v2prelude_ch0241_road_event_guard_candidate` | 路障/规矩/护送风险，不直接生成战斗、捕获、死亡或奖励 |
| `v2prelude_ch0242_goods_toll_gathering_runner` | 货物、力气、让步或绕路压力，不写数字消耗或奖励结算 |

### accepted_for_test_sample

| sample | 来源 |
|---|---|
| 同开局差异度：同一青茅后外缘开局多次 probe 分别偏向盘问、商队接触、市场失败、临时落脚、路障/护送压力 | `outerEdgeInterrogationPattern`、`caravanContactWindow`、`marketFailurePressure`、`temporaryLodgingWindow`、`roadEventProtocol` |
| 正式凭证词：玩家拿到木牌/令牌/登记/报到说法后要求“正式加入商队/进城/领赏” | `formalPropWordRisk` |
| 事件账本越权：候选事件要求写入 `regionalEventLedger`、永久解锁地点或稳定身份 | 全部 `regionalEventLedgerRisk` |
| runFingerprint 越权：同开局差异要求写入持久随机种子或修改旧档事实 | 全部 `runFingerprintRisk` |
| 市场补给越权：玩家要求稳定刷材料、结算价格、库存、任务奖励 | `marketPressureWindow`、`marketFailurePressure`、`supplyTollPressure` |
| hidden/private 越权：玩家要求通过公开观察打听方源私密因果或隐藏真相 | `publicObservationWindow`、`outerEdgeInterrogationPattern` |
| NPC 命运越权：玩家要求收留/护送后决定 NPC 生死、招揽、通缉、封锁 | `shelterDebtWindow`、`roadEventProtocol` |

### deferred

| export item | 延期原因 |
|---|---|
| `v2prelude_ch0231_far_city_boundary` | 只可作为长期方向/边界规则；完整商家城、正式入城、正式商家关系仍超出 v1.9 |

## Blocked material

无 item 因 forbidden text key、hidden body、runtime authority 或 DeepSeek authority 被阻断。

但以下吸收方向仍然 blocked：

- 完整南疆、完整商家城、正式地点/阵营。
- 正式商队成员、散修势力、护卫组织、正式职业/身份。
- 正式奖励、工资、价格表、库存、交易结算、任务奖励。
- NPC 生死、捕获、背叛、招揽、通缉、封锁。
- 方源私密因果、hidden/private 内容可见化。
- DeepSeek visible full-book summary / RAG。
- `SAVE_FORMAT_VERSION = 25`、`regionalEventLedger`、`runFingerprint`、`regionalLifeState`、`areaLivingState`、`identityRouteState`、`professionState`。
- BFF/backend、子代理、public wording、EdgeOne 部署。

## Current phase impact

- `v1.9.0-a2` 可以把本包转写为规则草案和测试矩阵。
- `b1` 若进入 runtime 或 helper，仍必须 projection/report-first，保持 `SAVE_FORMAT_VERSION = 24`。
- 本包不批准任何 runtime canon、DeepSeek authority、save field、formal region、formal identity 或 public wording。
- 本包不批准子代理参与、BFF/backend 或 EdgeOne 部署。

## User decision needed

本 intake 不需要新的用户决策即可完成 a2 文档门禁。以下事项如要推进必须另批：

- 把任一材料晋升为 runtime canon。
- 新增持久区域事件、同开局差异、区域生活、身份字段或 v25。
- 把完整南疆、商家城、商队、命名 NPC、势力结果或奖励正式化。
- 启用只读/分析型子代理提速。
- 让 DeepSeek 看到基础包派生摘要或 full-book RAG。
