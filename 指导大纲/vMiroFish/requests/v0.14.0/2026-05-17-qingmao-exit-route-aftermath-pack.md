# MiroFish Request: qingmao_exit_route_aftermath_pack

日期：2026-05-17
请求方：RebornG v0.14.0
优先级：preferred，v0.14-b2 前可能升级为 blocking

## 目标

请产出 quote-redacted JSON 包，供 RebornG 评估青茅离开后的公开后果、追击、遮掩、三寨残余压力和路线承接候选。

## 需要覆盖

- 青茅山离开或试图离开的公开后果。
- 古月/白家/熊家/商队/散修视角下的追击、怀疑、机会、阻拦。
- 可作为低阶前置行动的遮掩、递话、避开视线、补给准备。
- 三寨残余压力的公开层，不写隐藏事实正文。
- 与路线、补给、追击有关的 source pointers。

## 输出限制

- 不要原文正文。
- 不要 quote、originalText、excerpt、verbatim 字段。
- hidden facts 只给 hidden_ref_only。
- 不要把任何条目标为 canon truth 或 runtime authority。

## 建议 item 类型

- `route_aftereffect`
- `pursuit_pressure`
- `cover_action_candidate`
- `message_action_candidate`
- `supply_gap`
- `faction_pressure`
- `hidden_ref`

## RebornG 使用边界

该包只可进入：

- candidate_pool
- rule_draft
- test_sample

不得直接进入：

- runtime truth
- DeepSeek authority
- player-visible hidden fact body
- 正式地点/阵营/奖励/NPC 生死结论
