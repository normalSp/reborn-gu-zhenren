# MiroFish Intake Review: Qingmao Route / Supply / Pursuit Pack

日期：2026-05-16
审查对象：`v0.12.0-b1 route / supply / pursuit 第一刀`
结论：`accepted_for_candidate_pool`，其中部分可转为 `accepted_for_rule_draft`。不得直接进入 runtime canon。

## 主包路径

- 主包：`指导大纲/vMiroFish/v0.12.0/qingmao_route_supply_pursuit_pack_export_ready.json`
- 报告：`指导大纲/vMiroFish/v0.12.0/qingmao_route_supply_pursuit_pack_export_ready_report.json`
- 说明：`指导大纲/vMiroFish/v0.12.0/2026-05-16-qingmao-route-supply-pursuit-pack.md`
- 请求：`指导大纲/vMiroFish/requests/2026-05-16-qingmao-route-supply-pursuit-pack.md`

## 统计

| 项目 | 数量 |
|---|---:|
| totalItems | 17 |
| publicFact | 1 |
| routeCandidate | 3 |
| supplyRequirement | 4 |
| pursuitTrigger | 3 |
| factionPressure | 5 |
| hiddenFactRef | 1 |
| sourcePointers | 35 |
| skipped | 0 |
| review status | 17 个 `export_ready` |

报告覆盖项：

- caravan route/window：已覆盖。
- mountain/forest route risk：已覆盖。
- supply requirement：已覆盖。
- identity cover / suspicion：已覆盖。
- pursuit / monitoring trigger：已覆盖。
- faction pressure subjects：5 个。

## 自动检查

已做轻量结构检查：

- quote-like keys：0。
- `originalText` / `excerpt` / `verbatim` / `quote` 字段：未发现。
- 重复 item id：未发现。
- 缺 source pointer 项：未发现。
- runtime authority 越权：未发现。
- hidden gate 异常：未发现。

注意：报告中的 `summary.quoteLikeKeys` 是统计字段，不是原文 quote 字段。

## 权限边界

主包声明：

- `licenseBoundary.mirofishCode = AGPL-3.0 remains outside RebornG runtime`
- `licenseBoundary.reborngIntake = quote-redacted JSON candidates only`
- `canonBoundary.runtimeAuthority = none`
- `canonBoundary.canonAuthority = human_review_required`
- `canonBoundary.deepSeekAuthority = none`
- `canonBoundary.hiddenFacts = hidden_ref_only_until_RebornG_gate`

结论：权限边界符合 RebornG 资料门禁。MiroFish 仍不是 canon，不是 runtime，不是 DeepSeek 权限源。

## Hidden Fact 审查

唯一 hidden item：

- `hidden_ref_ch0010_household_trap`

门禁字段：

- `hiddenRefOnly: true`
- `runtimeVisible: false`
- `deepSeekVisible: false`
- `runtimeAuthority: candidate_only`
- `requiresHumanCanonReview: true`

审查结论：

- 可保留为 `hiddenFactRef` 候选。
- 不适合 v0.12-b1 route/supply/pursuit 第一刀直接使用。
- 更适合后续方源公开旁证、家产压力、NPC/faction reaction 或隐藏事实保护测试。

禁止：

- 不得进入玩家可见 UI。
- 不得进入 DeepSeek visible context。
- 不得作为 b1 追击或路线成功条件。

## 可吸收项

### 可转为 b1 rule draft

这些项目可作为 `v0.12.0-b1` 的 route/supply/pursuit 规则草案来源，但必须由 RebornG 本地 canon/rules 转写：

- `public_ch0024_caravan_arrival_trade_window`
  - 用途：商队窗口、酒类补给紧缺、交易时机。
  - 限制：只能表示公开窗口，不表示商队可直接带玩家离开。

- `route_ch0010_night_mountain_road_exit`
  - 用途：山寨外山路、夜间移动风险。
  - 限制：只能做路线候选和风险，不表示离山成功或地图解锁。

- `route_ch0015_bamboo_forest_to_riverbank`
  - 用途：竹林、后山、河滩的山内移动路线。
  - 限制：只能作为山内路线素材，不表示青茅山外路线。

- `route_ch0089_snow_task_valley`
  - 用途：任务驱动山地路线、小组任务、天气/队内压力。
  - 限制：不能作为自由离山路线。

- `pursuit_ch0092_group_waits_at_north_gate`
  - 用途：异常缺席触发小组寻找、盘问或监视。

- `pursuit_ch0092_group_breaks_routine_to_find_fang_yuan`
  - 用途：闭关/缺席/拒绝任务引发住处追踪与上门压力。
  - 限制：转写时不能绑定玩家为方源。

- `pursuit_ch0099_family_task_monitoring`
  - 用途：内务堂流程痕迹、分家任务、公开申请记录。

### 可转为 b1 supply candidate

这些项目可作为补给缺口候选，但不直接写物品奖励：

- `supply_ch0024_food_wine_and_moon_orchid_cost`
- `supply_ch0024_caravan_pressure_on_wine_stock`
- `supply_ch0030_liquor_worm_feeding_stock`
- `supply_ch0018_refinement_primeval_stones`

吸收限制：

- 只可转成需求、缺口、成本、窗口。
- 不得发元石、酒、月兰花、蛊虫食料或蛊虫。
- 酒虫相关条目只有在玩家已有对应线索/资产时才可显示为强相关，否则只能作为酒类补给压力。

### 可转为 b2 reaction candidate

这些 faction pressure 项更适合 b2 或 b1 的追击压力背景，不建议直接变成 b1 runtime 结论：

- `pressure_ch0060_jiafu_caravan_revenge`
- `pressure_ch0089_jiaosan_group_resource_distribution`
- `pressure_ch0090_jiaosan_group_resource_request`
- `pressure_ch0092_jiaosan_group_task_authority`
- `pressure_ch0096_sick_snake_group_trust_crisis`

吸收限制：

- 顶层 `summary` 为空，但有 `pressureAxis`、`likelyReactions` 和 source pointers，可作为候选压力。
- 正式转写前需要 RebornG 生成本地 summary。
- 不能直接改势力状态、阵营身份、NPC 关系或追击结果。

## 延期项

延期到 b2/b3 或隐藏事实专项：

- `hidden_ref_ch0010_household_trap`
  - 理由：它是隐藏事实引用，且不是 b1 路线/补给/追击第一刀的必要材料。

- `pressure_ch0060_jiafu_caravan_revenge`
  - 理由：可作为商队势力压力，但与原著事件关系较强；b1 若只做路线准备，应先不触发复仇/真凶追查线。

## 阻断项

本包没有发现必须完全阻断的条目。

但以下用法必须阻断：

- 用 routeCandidate 直接判定逃离青茅山成功。
- 用 routeCandidate 解锁新地图。
- 用 supplyRequirement 发放元石、酒、食物、月兰花、蛊材或蛊虫。
- 用 pursuitTrigger 直接结算 NPC 追击成功/失败。
- 用 factionPressure 直接改变阵营身份、声望、NPC 关系或原著关键事件。
- 将任何“方源行为证据”照搬到玩家 UI，让玩家被叙述成方源。
- 将 hiddenFactRef 暴露给 UI 或 DeepSeek。

## 主要风险

1. **方源行为证据转写风险**
   - 多个路线、补给、追踪样本来自方源行为。
   - RebornG 必须转写为“可证明青茅山存在该路线/成本/压力”的公开素材，不能让第三者玩家继承方源身份或私人因果。

2. **b1 范围扩大风险**
   - 本包有商队、角三小组、病蛇小组、贾富商队等压力材料。
   - b1 只做 route/supply/pursuit 准备链，不应升级成完整 faction reaction。

3. **奖励误读风险**
   - 酒、元石、酒虫食料等条目容易被误当成奖励池。
   - 必须只作为需求/成本/缺口，不作为 inventory write。

4. **source pointer 格式差异**
   - MiroFish 使用 source pointer id、chapter/paragraph/offset。
   - RebornG 当前 fact cards 多使用 source locator。
   - b1 可先引用 MiroFish item id/sourcePointerIds；正式转入 fact card 时再做 locator 归一。

5. **压力项 summary 空缺**
   - 5 个 factionPressure 的顶层 `summary` 为空。
   - 正式吸收前必须由 RebornG 本地生成 summary，并保留 `pressureAxis` 与 source pointers。

## 对 v0.12-b1 的建议

可以解除 b1 的资料门禁，进入 conservative runtime first cut。

b1 第一刀建议只吸收：

- 商队窗口 public fact。
- 3 条 routeCandidate 的路线候选和风险。
- 4 条 supplyRequirement 的补给缺口。
- 3 条 pursuitTrigger 的监视/追踪触发。

暂缓：

- 5 条 factionPressure 只作为 b2 reaction bridge 候选池。
- hiddenFactRef 只作为后续隐藏事实门禁样本。

b1 runtime 输出应限制为：

- route candidates。
- supply gaps。
- identity/cover warnings。
- pursuit pressure preview。
- blocked outcomes。

b1 runtime 禁止：

- actual escape。
- new region unlock。
- route success。
- faction identity change。
- reward writes。
- NPC death or capture result。
- DeepSeek authority expansion。
- save-format bump unless用户另行批准新增持久化 route state。

## 当前阶段结论

审查结论：`accepted_for_candidate_pool`。

推荐吸收等级：

- `publicFact`：`accepted_for_fact_card_draft`。
- `routeCandidate`：`accepted_for_rule_draft`。
- `supplyRequirement`：`accepted_for_rule_draft`。
- `pursuitTrigger`：`accepted_for_rule_draft`。
- `factionPressure`：`deferred_to_b2_reaction_bridge`。
- `hiddenFactRef`：`deferred_to_hidden_fact_gate_or_b3_public_evidence`。

是否需要用户决策：

- 不需要新的方向决策。
- 如果 b1 实现中需要新增持久化 route state、正式逃离结果或新地点解锁，必须停下来请求用户决策。
