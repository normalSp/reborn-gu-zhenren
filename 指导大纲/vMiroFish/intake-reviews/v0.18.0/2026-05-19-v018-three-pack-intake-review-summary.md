# v0.18.0 MiroFish 三包 intake review 汇总

日期：2026-05-19
范围：`v018_route_entry_state_and_milestones_pack`、`v018_southern_border_low_rank_region_fact_cards_pack`、`v018_post_qingmao_pressure_reaction_pack`
结论：三包均合格，可进入 v0.18 设计、候选规则池、事实卡草案和测试样本池；不得直接进入 canon truth、runtime authority 或 DeepSeek authority。

## 总结论

三包通过基础 intake：

- JSON 可解析。
- 交付 report 均为 `deliveryAssessment.status = complete`。
- 每包 8 个 item，总计 24 个 item。
- 每个 item 均为 `reviewStatus = export_ready`。
- 每个 item 均带 source pointer。
- `forbiddenTextKeyCount = 0`。
- `forbiddenTextTokenCount = 0`。
- `sensitiveLeakTermCount = 0`。
- `reborngGate.runtimeAuthority = candidate_only`。
- `reborngGate.runtimeVisible = false`。
- `reborngGate.deepSeekVisible = false`。
- `requiresHumanCanonReview = true`。

三包可用于：

- `candidate_pool`
- `rule_draft`
- `fact_card_draft`
- `test_sample`
- `deferred`
- `human_review_only`

三包不可用于：

- runtime truth。
- DeepSeek authority。
- 玩家可见隐藏事实。
- 正式奖励、材料、蛊虫、蛊方、元石。
- 正式地点进入、完整南疆地图、完整商家城。
- 正式阵营转移、商队加入、通缉、招揽、任务网络。
- NPC 生死、捕获、追杀成功或永久失败结论。

## 包级结论

| 包 | items | sourcePointers | 结论 | 可服务阶段 |
|---|---:|---:|---|---|
| `v018_route_entry_state_and_milestones_pack` | 8 | 10 | `accepted_for_rule_draft_and_test_sample` | b1/b2 |
| `v018_southern_border_low_rank_region_fact_cards_pack` | 8 | 14 | `accepted_for_fact_card_draft_and_test_sample` | b3/b5 |
| `v018_post_qingmao_pressure_reaction_pack` | 8 | 13 | `accepted_for_rule_draft_and_test_sample_with_quarantine` | b4 |

## 逐包评估

### route entry / milestones

可吸收方向：

- 路线里程碑公开提示。
- 路线进入前置。
- 路线阶段候选。
- 补给、追索、身份边界。
- 失败/回退样本。

限制：

- 只能成为 RebornG-owned 本地规则草案或测试样本。
- 不能直接写 `route_entered`。
- 不能直接解锁地点、阵营、奖励或 NPC 结果。
- 若 b2 要写正式 route/location state，仍需用户再次批准 `SAVE_FORMAT_VERSION` 与迁移方案。

### Southern Border low-rank region facts

可吸收方向：

- 南疆低阶公开区域事实卡草案。
- 山路、商队、客栈/市场语义。
- 低阶落脚点和风险提示。
- 玩家可见公开路线区域说明。

限制：

- 不能开放完整南疆地图。
- 不能开放完整商家城。
- 不能把隐藏事实 body 放进 UI 或 DeepSeek。
- report caveat 指出 `坊市` 精确术语在 0001-0600 中较稀疏，因此市场/客栈/商队语义必须经 RebornG 本地重写和边界收缩。

### post-Qingmao pressure / reaction

可吸收方向：

- 青茅离开后的公开压力。
- 追索反应。
- 身份怀疑。
- 商队担保前置。
- 势力残余压力。
- NPC 公开记忆候选。

限制：

- 包内 1 条 `quarantined` item 只能进 `deferred` 或 `human_review_only`。
- quarantined/hiddenRefOnly 项不得进入玩家可见 UI、DeepSeek prompt、runtime facts 或正式反应。
- 只能做压力/风险/前置显示，不得做正式通缉、招揽、追杀成功、NPC 生死或阵营迁移。

## 对 v0.18 的影响

正面影响：

- `v0.18-a2` 资料门禁已清，三包足以支撑 b1-b5 的第一层规则草案。
- b1/b2 可使用 route-entry 包设计正式门槛和 route-state 候选字段。
- b3 可使用 region 包做南疆低阶公开事实卡和路线面板候选。
- b4 可使用 pressure 包做前期账本影响补给、追索、身份压力的候选规则。
- 当前不需要额外 MiroFish 包才能进入 b1。

仍需注意：

- MiroFish 包来自 `0001-0600` strict/reviewable base，足够支撑 v0.18 低阶路线第一层，不代表完整南疆或后期商家城。
- 后续若用户要求完整商家城、三王山、义天山、高阶路线、蛊仙线或更后期剧情，需要新包。
- 所有吸收都必须重写成 RebornG-owned summaries/rules/tests，不复制原文，不把 MiroFish 文字直接变成 runtime 权力。

## 当前后续

- v0.18-a1/a2 可标记为设计与资料门禁第一版完成。
- 下一步可以进入 `v0.18.0-b1 青茅离开路线正式门槛样板`。
- b2 前若要写正式 route/location state，必须停下来让用户决定是否 bump `SAVE_FORMAT_VERSION = 23` 并写迁移/default/旧档/e2e。
