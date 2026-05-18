# v018_southern_border_low_rank_region_fact_cards_pack handoff

- requestId: `mirofish-request-2026-05-19-v018-southern-border-low-rank-region-fact-cards-pack`
- packageId: `v018_southern_border_low_rank_region_fact_cards_pack`
- generatedAt: `2026-05-18T17:40:23.310213+00:00`
- sourceDataset: `uploads/ri_corpus/exports/living_world_review_strict_flash_0600_reviewable`
- deliveryStatus: `complete`
- totalItems: 8
- sourcePointers: 14
- forbiddenTextKeyCount: 0
- forbiddenTextTokenCount: 0
- sensitiveLeakTermCount: 0
- Gate: all items are `candidate_only`, `runtimeVisible=false`, `deepSeekVisible=false`, `requiresHumanCanonReview=true`.

## Intake Decision

可作为 RebornG 候选材料进入 intake review；不得直接进入 canon、runtime truth、DeepSeek 权限、正式奖励、正式任务、正式地点解锁、阵营迁移或 NPC 生死结论。

## Coverage

- caravan_public_context: 2
- danger_or_pursuit_context: 3
- full_map_boundary: 2
- hidden_boundary: 1
- identity_pressure: 3
- low_rank_landing_point: 2
- low_rank_route: 2
- market_or_inn: 1
- market_or_inn_public_context: 1
- market_window: 1
- mountain_road: 1
- player_visible: 2
- public: 6
- public_region: 5
- public_route_area: 1
- pursuit_pressure: 1
- region_fact_card: 3
- southern_border: 2
- supply_gap: 1

## Caveats

- Exact term 坊市 is sparse in 0001-0600; delivery uses nearby market, inn, caravan, and trade signals.

## Categories

- caravan_public_context: 1
- danger_or_pursuit_context: 1
- low_rank_landing_point: 1
- market_or_inn_public_context: 1
- public_route_area: 1
- region_fact_card: 3

## Use Boundary

- 可以：candidate_pool、rule_draft、fact_card_draft、test_sample、deferred、human_review_only。
- 不可以：直接奖励、直接发材料/蛊虫/蛊方/元石、正式通缉、正式招揽、正式商队加入、正式地点进入、阵营身份变化、NPC 生死结论。

## Human Review Focus

- 将路线阶段、补给压力、身份风险和商队/客栈/商家城外缘语义重写成 RebornG-owned 本地规则。
- 保留 sourcePointerIds 作为追踪依据，但不要把 MiroFish 文本当成 canon。
- 隐藏或私密来源只允许人工审查 locator，不进入玩家可见内容或 DeepSeek context。
