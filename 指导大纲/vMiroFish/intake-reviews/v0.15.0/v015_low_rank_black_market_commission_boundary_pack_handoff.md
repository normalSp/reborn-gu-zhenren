# v015_low_rank_black_market_commission_boundary_pack handoff

- requestId: `mirofish-request-2026-05-18-v015-low-rank-black-market-commission-boundary-pack`
- generatedAt: `2026-05-18T03:32:46.929820+00:00`
- sourceDataset: `uploads/ri_corpus/exports/living_world_review_strict_flash_0600_reviewable`
- deliveryStatus: `conditional_complete_candidate`
- totalItems: 10
- sourcePointers: 9
- forbiddenTextKeyCount: 0
- highRankLeakTermCount: 0
- Gate: all items are `candidate_only`, `runtimeVisible=false`, `deepSeekVisible=false`, `requiresHumanCanonReview=true`.

## Intake Decision

可作为 RebornG 候选材料进入 intake review；不得直接进入 canon、runtime truth、DeepSeek 权限、正式奖励、正式任务或正式地点解锁。

## Coverage

- gray_trade_risk: 9
- commission_candidate: 6
- fraud_or_trap_risk: 2
- faction_attention_trigger: 4
- forbidden_reward_boundary: 4
- anti_farm_rule: 4

## Caveats

- exact source term 黑市 is absent in 0001-0600; delivered as gray-trade and commission boundary candidates

## Categories

- anti_farm_rule: 2
- commission_candidate: 2
- faction_attention_trigger: 1
- forbidden_reward_boundary: 1
- fraud_or_trap_risk: 2
- gray_trade_risk: 1
- rumor_only_trade: 1

## Use Boundary

- 可以：candidate_pool、rule_draft、fact_card_draft、test_sample、deferred。
- 不可以：直接奖励、直接发材料/蛊虫/蛊方/元石、正式任务成功、正式商队加入、正式地点进入、阵营身份变化、NPC 生死结论。

## Human Review Focus

- 将相对成本、稀缺、压价、盘问、委托风险重写成 RebornG-owned 本地规则。
- 保留 sourcePointerIds 作为追踪依据，但不要把 MiroFish 文本当成 canon。
- 对 skipped/caveats 中的精确术语缺口做人工判断：接受相邻证据、延期，或请求后续更大基础包。
