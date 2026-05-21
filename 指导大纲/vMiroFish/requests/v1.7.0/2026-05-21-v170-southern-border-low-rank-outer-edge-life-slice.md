# v1.7.0 MiroFish request：Southern Border low-rank outer-edge life slice

requestId：`mirofish-request-2026-05-21-v170-southern-border-low-rank-outer-edge-life-slice`
topicId：`southern_border_low_rank_outer_edge_life_slice`
targetPhase：`v1.7.0-a2`
blockingLevel：`blocking`
mirofishRepo：`D:\workspace\CodeBuddyWorkSpace\2026-05-12-task-1\MiroFish`
expectedExportPath：`指导大纲/vMiroFish/v1.7.0/exports/v170_southern_border_low_rank_outer_edge_life_slice_export_ready.json`
expectedReportPath：`指导大纲/vMiroFish/v1.7.0/exports/v170_southern_border_low_rank_outer_edge_life_slice_report.json`
expectedHandoffPath：`指导大纲/vMiroFish/v1.7.0/exports/v170_southern_border_low_rank_outer_edge_life_slice_handoff.md`
expectedIntakeReviewPath：`指导大纲/vMiroFish/intake-reviews/v1.7.0/2026-05-21-v170-southern-border-low-rank-outer-edge-life-slice-intake-review.md`

## Purpose

为 RebornG v1.7 的第一个区域活世界纵切提供 quote-redacted、candidate-only 的 source-pointer/topic-slice 材料。目标不是引入完整南疆或商家城，而是抽取“低阶外缘生活压力”的可测试模式：

- 村口/外缘盘问。
- 临时商队接触窗口。
- 以劳动、货物或人情换取通行/落脚。
- 小集市询价、压价、拒绝、低阶补给压力。
- 商队内部低身份劳动、帐篷/营地、被收留或被排挤的候选模式。
- 同开局可重玩差异度所需的公开压力牌组候选。

## Scope

允许 source pointer 覆盖：

- 青茅之后、白骨山至商家城外缘之前的公开路线压力。
- 商队/村落/小集市/营地/外缘盘问等低阶公开生活场景。
- 凡人、低阶蛊师、商队杂役、村老、守卫、摊主、管事等低权限角色的公开反应。

禁止扩大到：

- 完整南疆地理。
- 完整商家城或正式城内玩法。
- 正式势力归属、正式通缉结论、正式商队身份、正式奖励、价格表或库存表。
- NPC 生死、捕获、背叛、永久伤势。
- 方源私密因果、隐藏事实正文、后期高阶秘密。

## Required fields

导出包至少包含：

- `requestId`
- `topicId`
- `targetPhase`
- `items[]`
- `summary`
- `sourcePointers[]`
- 每个 item 的 `id`、`category`、`summary`、`visibility`、`confidence`
- 每个 item 的 source item 指针：`packageId`、`field`、`itemId`
- 每个 item 的 `reborngGate`
- `runtimeAuthority=candidate_only`
- `hiddenRefOnly`、`runtimeVisible=false`、`deepSeekVisible=false`
- coverage flags

## Forbidden content

RebornG-facing export 不得包含：

- `quote`
- `originalText`
- `excerpt`
- `verbatim`
- `rawText`
- `sourceText`
- hidden/private body
- runtime/canon/DeepSeek authority

## Allowed uses

该包通过 intake 后最多只能进入：

- `candidate_pool`
- `rule_draft`
- `test_sample`
- `future_sample_pool`
- `deferred`

## Forbidden uses

该包不得直接进入：

- `src/canon`
- runtime store
- DeepSeek visible context
- player-visible hidden facts
- formal location/faction/reward/NPC outcome rules

## Acceptance criteria

- MiroFish export 使用 full-book reviewable base 或等价 strict/reviewable package substrate。
- RebornG-facing JSON 无 forbidden text keys。
- 所有 item 都是 candidate-only。
- source pointer 可追溯，但不暴露原文。
- hidden/private 或命名正式结论仅可作为 deferred/quarantined 边界，不进入本次 accepted material。
- RebornG `check:mirofish-dual-repo-pipeline --stage=complete` 可通过。

## Suggested output name

`v170_southern_border_low_rank_outer_edge_life_slice_export_ready.json`

## Handoff message for MiroFish

请按 `topicId=southern_border_low_rank_outer_edge_life_slice` 产出一个 quote-redacted、candidate-only 的 RebornG-facing topic slice。只使用 source pointer、摘要和 candidate pressure/rule/test material，不复制原文，不授予 runtime/canon/DeepSeek authority。首轮样板由 RebornG 当前 Codex 主线程主控，不启用子代理写文件。
