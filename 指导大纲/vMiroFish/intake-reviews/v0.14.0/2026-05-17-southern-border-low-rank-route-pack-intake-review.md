# southern_border_low_rank_route_pack intake review

日期：2026-05-17
包名：`southern_border_low_rank_route_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/v0.14.0/southern_border_low_rank_route_pack_export_ready.json`
目标阶段：`v0.14.0 青茅后续路线承接 / southern-border low-rank route`
结论：`accepted_for_candidate_pool`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| items | 384 |
| sourcePointers | 469 |
| skipped | 18 |
| review.status | {'export_ready': 384} |
| summary.quoteLikeKeys | 0 |
| forbidden key | 0 |
| high-rank / hidden leak terms | [] |
| bad reborngGate | 0 |
| bad hidden_ref gate | 0 |
| completionGate | complete_candidate |

## 分类覆盖

low_rank_market_hint: 45；public_entry: 136；risk_factor: 49；route_candidate: 7；social_cover_requirement: 28；supply_requirement: 119

## request 覆盖

route_candidate: 384；caravan_window: 231；supply_requirement: 177；social_cover_requirement: 173；low_rank_market_hint: 317；risk_factor: 64；low_rank_identity: 365

## 可吸收方式

允许进入：`candidate_pool / rule_draft / test_sample`。

不可直接进入：runtime truth、DeepSeek authority、玩家可见隐藏事实、正式地点/阵营/奖励/NPC 生死结论。

## 使用边界

- 覆盖南疆低阶路线、商队窗口、补给/元石/交易前置、身份/担保/递话和风险因素。
- 0400 基础包没有直接命中“坊市”词面，但以商队、客栈、交易、购买、元石等低阶市场窗口补足。
- 不得开放蛊仙、仙蛊、仙材、宝黄天或完整高阶世界。

## 结论

该包通过 MiroFish intake 基础检查。可作为 v0.14 候选材料进入 RebornG 本地 review，再由 RebornG 自有规则/测试重写为 rule draft 或 test sample。
