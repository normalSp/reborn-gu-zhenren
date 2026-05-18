# v018_route_entry_state_and_milestones_pack handoff

- requestId: `mirofish-request-2026-05-19-v018-route-entry-state-and-milestones-pack`
- packageId: `v018_route_entry_state_and_milestones_pack`
- generatedAt: `2026-05-18T17:40:22.090971+00:00`
- sourceDataset: `uploads/ri_corpus/exports/living_world_review_strict_flash_0600_reviewable`
- deliveryStatus: `complete`
- totalItems: 8
- sourcePointers: 10
- forbiddenTextKeyCount: 0
- forbiddenTextTokenCount: 0
- sensitiveLeakTermCount: 0
- Gate: all items are `candidate_only`, `runtimeVisible=false`, `deepSeekVisible=false`, `requiresHumanCanonReview=true`.

## Intake Decision

可作为 RebornG 候选材料进入 intake review；不得直接进入 canon、runtime truth、DeepSeek 权限、正式奖励、正式任务、正式地点解锁、阵营迁移或 NPC 生死结论。

## Coverage

- caravan_contact: 1
- engine_owned_reward: 1
- faction_boundary: 1
- identity_boundary: 1
- identity_pressure: 3
- location_boundary: 1
- mountain_road: 1
- player_visible: 3
- public: 5
- public_milestone: 1
- public_region: 1
- pursuit_boundary: 1
- pursuit_pressure: 2
- return_pressure: 1
- route_entry: 4
- route_entry_prerequisite: 1
- route_escape: 2
- route_failure: 1
- route_failure_or_return: 1
- route_milestone: 1
- route_milestone_public: 2
- route_stage: 1
- route_stage_candidate: 1
- supply_boundary: 1
- supply_gap: 2

## Caveats

- Compiled from 0001-0600 low-rank public-route material; later chapters should be requested only if v0.18 needs broader post-Shang-city coverage.

## Categories

- identity_boundary: 1
- pursuit_boundary: 1
- route_entry_prerequisite: 1
- route_failure_or_return: 1
- route_milestone_public: 2
- route_stage_candidate: 1
- supply_boundary: 1

## Use Boundary

- 可以：candidate_pool、rule_draft、fact_card_draft、test_sample、deferred、human_review_only。
- 不可以：直接奖励、直接发材料/蛊虫/蛊方/元石、正式通缉、正式招揽、正式商队加入、正式地点进入、阵营身份变化、NPC 生死结论。

## Human Review Focus

- 将路线阶段、补给压力、身份风险和商队/客栈/商家城外缘语义重写成 RebornG-owned 本地规则。
- 保留 sourcePointerIds 作为追踪依据，但不要把 MiroFish 文本当成 canon。
- 隐藏或私密来源只允许人工审查 locator，不进入玩家可见内容或 DeepSeek context。
