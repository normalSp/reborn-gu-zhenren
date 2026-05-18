# v015_southern_border_market_caravan_trade_pack handoff

- requestId: `mirofish-request-2026-05-18-v015-southern-border-market-caravan-trade-pack`
- generatedAt: `2026-05-18T03:32:45.989849+00:00`
- sourceDataset: `uploads/ri_corpus/exports/living_world_review_strict_flash_0600_reviewable`
- deliveryStatus: `conditional_complete_candidate`
- totalItems: 11
- sourcePointers: 10
- forbiddenTextKeyCount: 0
- highRankLeakTermCount: 0
- Gate: all items are `candidate_only`, `runtimeVisible=false`, `deepSeekVisible=false`, `requiresHumanCanonReview=true`.

## Intake Decision

可作为 RebornG 候选材料进入 intake review；不得直接进入 canon、runtime truth、DeepSeek 权限、正式奖励、正式任务或正式地点解锁。

## Coverage

- caravan_contact: 9
- supply_preparation: 3
- market_window: 5
- public_reason: 3
- guarantee_boundary: 2
- price_pressure_hint: 2
- risk_factor: 2
- faction_attention_trigger: 4

## Caveats

- exact source terms 坊市/路引 are absent in 0001-0600; coverage uses caravan, inn, shop, questioning, and guarantee signals

## Categories

- caravan_contact_window: 1
- faction_attention_trigger: 3
- market_window: 1
- price_pressure_hint: 1
- public_reason_requirement: 1
- risk_factor: 1
- social_cover_requirement: 1
- supply_preparation: 1
- trade_requirement: 1

## Use Boundary

- 可以：candidate_pool、rule_draft、fact_card_draft、test_sample、deferred。
- 不可以：直接奖励、直接发材料/蛊虫/蛊方/元石、正式任务成功、正式商队加入、正式地点进入、阵营身份变化、NPC 生死结论。

## Human Review Focus

- 将相对成本、稀缺、压价、盘问、委托风险重写成 RebornG-owned 本地规则。
- 保留 sourcePointerIds 作为追踪依据，但不要把 MiroFish 文本当成 canon。
- 对 skipped/caveats 中的精确术语缺口做人工判断：接受相邻证据、延期，或请求后续更大基础包。
