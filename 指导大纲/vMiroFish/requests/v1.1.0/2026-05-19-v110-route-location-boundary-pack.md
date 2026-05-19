# MiroFish Request: v110_route_location_boundary_pack

日期：2026-05-19
请求方：RebornG Expert Council
目标版本：v1.1.0
优先级：blocking before b1 runtime absorption

## 目的

请为 RebornG v1.1 提供“青茅离开后路线/地点边界”候选资料包。

RebornG 正在评估是否引入正式 route/location/currentRegion 或等价持久字段。本包用于帮助判断：

- 哪些内容可以作为路线状态。
- 哪些内容可以作为区域外缘状态。
- 哪些内容不能被写成正式地点进入。
- 哪些隐藏事实、关键因果或高阶机缘必须隔离。

## 范围

只需要 quote-redacted 候选材料，不需要原文正文。

重点范围：

- 青茅山离开后的路线状态。
- 山路、逃亡、追踪、补给、身份压力。
- 南疆早期外缘的公开边界。
- 不能把候选路线误写成完整南疆/商家城/阵营进入的边界。

## 输出要求

JSON 或 markdown 均可，但每项建议包含：

- `itemId`
- `category`
- `visibility`: public / hidden_ref_only / if_boundary / human_review
- `summary`
- `sourcePointers`
- `boundaryNotes`
- `riskTags`
- `recommendedRebornGUse`: candidate_pool / fact_card_draft / rule_draft / test_sample / deferred

## 禁止

- 不要包含原文长引用、正文、verbatim、excerpt、originalText。
- 不要把候选材料写成 RebornG runtime truth。
- 不要直接断言玩家已经进入完整南疆、商家城、阵营或获得奖励。
- 不要泄露隐藏事实正文。

## 交付后 RebornG 的处理方式

RebornG 会先写 intake review，再把合格内容改写为 RebornG-owned summaries/rules/tests。MiroFish 输出不会直接进入 canon/runtime/DeepSeek。
