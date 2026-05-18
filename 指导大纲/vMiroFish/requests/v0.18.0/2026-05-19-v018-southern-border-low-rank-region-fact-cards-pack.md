# MiroFish Request: v018_southern_border_low_rank_region_fact_cards_pack

日期：2026-05-19
请求方：RebornG 专家团
用途：v0.18.0 南疆低阶区域事实卡与路线面板
优先级：preferred，建议 b3 前完成 intake

## handoffMessageForMiroFish

请为 RebornG 生成 `v018_southern_border_low_rank_region_fact_cards_pack`。

目标：为 v0.18 南疆低阶区域事实卡提供 quote-redacted 候选材料。范围只限低阶蛊师可公开接触或可被玩家逐步得知的区域语义，例如山路、商队路线、野外、客栈/坊市、商家城外缘、低阶落脚点。它不是 canon truth，不是 runtime authority，不是 DeepSeek authority。

请严格遵守：

1. JSON 为主，另附 report 和简短说明。
2. 不包含原文正文，不包含 quote、originalText、excerpt、verbatim、rawText 等字段。
3. 使用 source pointer，不使用原文引文。
4. 所有 item 标记 `runtimeAuthority: candidate_only`。
5. 所有 hidden fact 只能写 `hidden_ref_only` 和 source pointer，不写隐藏事实正文。
6. 必须标注 `requiresHumanCanonReview: true`。
7. 高阶内容如蛊仙、仙蛊、宝黄天、福地/洞天、尊者、天庭必须隔离或跳过。

建议 item 类型：

- `region_fact_card`
- `public_route_area`
- `low_rank_landing_point`
- `market_or_inn_public_context`
- `caravan_public_context`
- `danger_or_pursuit_context`
- `hidden_ref_only`

建议字段：

```json
{
  "id": "v018_region_fact_id",
  "packageId": "v018_southern_border_low_rank_region_fact_cards_pack",
  "category": "region_fact_card | public_route_area | low_rank_landing_point | market_or_inn_public_context | caravan_public_context | danger_or_pursuit_context | hidden_ref_only",
  "summary": "RebornG-owned short summary, no original prose",
  "visibility": "public | player_visible | hidden_ref_only",
  "sourcePointers": ["chapter_or_sample_pointer"],
  "suggestedUse": ["candidate_pool", "fact_card_draft", "test_sample"],
  "blockedUse": ["runtime_truth", "deepseek_authority", "hidden_fact_body", "full_map_unlock"],
  "riskTags": ["southern_border", "low_rank_route", "public_region", "hidden_boundary"],
  "runtimeAuthority": "candidate_only",
  "runtimeVisible": false,
  "deepSeekVisible": false,
  "requiresHumanCanonReview": true
}
```

重点覆盖：

- 商队路线、山路、野外、客栈/坊市、商家城外缘的公开语义。
- 玩家刚离开青茅后低阶蛊师能接触到的区域信息。
- 公开事实与隐藏事实引用分离。
- 不开放完整南疆地图、完整商家城、高阶世界或正式奖励。

交付到：

`指导大纲/vMiroFish/intake-reviews/v0.18.0/`
