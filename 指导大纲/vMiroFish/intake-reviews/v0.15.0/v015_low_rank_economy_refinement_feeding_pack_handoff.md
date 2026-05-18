# v015_low_rank_economy_refinement_feeding_pack handoff

- requestId: `mirofish-request-2026-05-18-v015-low-rank-economy-refinement-feeding-pack`
- generatedAt: `2026-05-18T03:32:44.865815+00:00`
- sourceDataset: `uploads/ri_corpus/exports/living_world_review_strict_flash_0600_reviewable`
- deliveryStatus: `conditional_complete_candidate`
- totalItems: 13
- sourcePointers: 13
- forbiddenTextKeyCount: 0
- highRankLeakTermCount: 0
- Gate: all items are `candidate_only`, `runtimeVisible=false`, `deepSeekVisible=false`, `requiresHumanCanonReview=true`.

## Intake Decision

可作为 RebornG 候选材料进入 intake review；不得直接进入 canon、runtime truth、DeepSeek 权限、正式奖励、正式任务或正式地点解锁。

## Coverage

- low_rank_material: 4
- low_rank_feeding: 2
- refinement_failure_cost: 5
- refinement_fragment: 3
- supply_requirement: 2
- market_window: 6
- anti_farm_rule: 3

## Caveats

- exact source term 食料 is absent in 0001-0600; feeding coverage is via 喂养/酒虫/青竹酒 signals

## Categories

- anti_farm_rule: 3
- feeding_requirement: 1
- low_rank_material_candidate: 1
- market_cost_hint: 1
- refinement_failure_cost: 2
- refinement_fragment: 2
- scarcity_rule: 1
- supply_requirement: 2

## Use Boundary

- 可以：candidate_pool、rule_draft、fact_card_draft、test_sample、deferred。
- 不可以：直接奖励、直接发材料/蛊虫/蛊方/元石、正式任务成功、正式商队加入、正式地点进入、阵营身份变化、NPC 生死结论。

## Human Review Focus

- 将相对成本、稀缺、压价、盘问、委托风险重写成 RebornG-owned 本地规则。
- 保留 sourcePointerIds 作为追踪依据，但不要把 MiroFish 文本当成 canon。
- 对 skipped/caveats 中的精确术语缺口做人工判断：接受相邻证据、延期，或请求后续更大基础包。
