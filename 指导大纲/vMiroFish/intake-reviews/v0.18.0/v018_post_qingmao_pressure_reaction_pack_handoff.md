# v018_post_qingmao_pressure_reaction_pack handoff

- requestId: `mirofish-request-2026-05-19-v018-post-qingmao-pressure-reaction-pack`
- packageId: `v018_post_qingmao_pressure_reaction_pack`
- generatedAt: `2026-05-18T17:40:24.377148+00:00`
- sourceDataset: `uploads/ri_corpus/exports/living_world_review_strict_flash_0600_reviewable`
- deliveryStatus: `complete`
- totalItems: 8
- sourcePointers: 13
- forbiddenTextKeyCount: 0
- forbiddenTextTokenCount: 0
- sensitiveLeakTermCount: 0
- Gate: all items are `candidate_only`, `runtimeVisible=false`, `deepSeekVisible=false`, `requiresHumanCanonReview=true`.

## Intake Decision

可作为 RebornG 候选材料进入 intake review；不得直接进入 canon、runtime truth、DeepSeek 权限、正式奖励、正式任务、正式地点解锁、阵营迁移或 NPC 生死结论。

## Coverage

- caravan_guarantee: 2
- caravan_guarantee_requirement: 1
- faction_residual: 3
- faction_residual_pressure: 1
- hidden_boundary: 1
- human_review_only: 1
- identity_pressure: 5
- identity_suspicion: 1
- npc_public_memory: 1
- npc_public_memory_candidate: 1
- player_visible: 3
- post_qingmao_public_pressure: 2
- public: 4
- pursuit_pressure: 3
- pursuit_reaction: 1
- quarantined: 2
- route_escape: 1
- supply_gap: 2

## Caveats

- Private or hidden-source material is retained only as locator-level quarantine for human review.

## Categories

- caravan_guarantee_requirement: 1
- faction_residual_pressure: 1
- identity_suspicion: 1
- npc_public_memory_candidate: 1
- post_qingmao_public_pressure: 2
- pursuit_reaction: 1
- quarantined: 1

## Use Boundary

- 可以：candidate_pool、rule_draft、fact_card_draft、test_sample、deferred、human_review_only。
- 不可以：直接奖励、直接发材料/蛊虫/蛊方/元石、正式通缉、正式招揽、正式商队加入、正式地点进入、阵营身份变化、NPC 生死结论。

## Human Review Focus

- 将路线阶段、补给压力、身份风险和商队/客栈/商家城外缘语义重写成 RebornG-owned 本地规则。
- 保留 sourcePointerIds 作为追踪依据，但不要把 MiroFish 文本当成 canon。
- 隐藏或私密来源只允许人工审查 locator，不进入玩家可见内容或 DeepSeek context。
