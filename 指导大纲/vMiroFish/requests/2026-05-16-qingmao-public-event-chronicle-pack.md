# MiroFish Request: Qingmao Public Event Chronicle Pack

requestId: `mirofish-request-2026-05-16-qingmao-public-event-chronicle-pack`
targetPhase: `v0.13.0-b2 事件编年史与公开行动摘要`
blockingLevel: `preferred`。
requestedBy: RebornG expert council
handoffThread: `019e207b-c55d-7e23-b450-efa7a054a165`

## Purpose

为 RebornG v0.13 的事件编年史和公开行动摘要系统提供 quote-redacted 候选材料。

目标是帮助 RebornG 区分：

- 青茅阶段哪些事件属于公开可见。
- 哪些公开行为容易被山寨、外寨、商队、小组记录。
- 什么样的事件摘要适合进入 DeepSeek prompt-safe context。

## Scope

优先覆盖：

- 族学/开窍/训练/小组任务相关公开事件。
- 三寨竞争、资源、商队、青茅公共秩序相关公开事件。
- 玩家公开行为如何被记录：缺席、绕路、打探、交易、递话、救援、偷窃、撒谎、准备逃离、接触外寨。
- 事件摘要如何压缩成玩家可见的 public event summary。

## Required Fields

每项候选至少包含：

- `id`
- `category`: `publicEventCandidate` / `publicActionSummaryCandidate` / `eventChronicleAnchor` / `eventVisibilityRule`
- `summary`
- `eventScope`: `clan_school` / `village` / `three_clans` / `merchant` / `task_group` / `route` / `other`
- `publicTrigger`
- `whoCanKnow`
- `whoLikelyRecords`
- `promptSafeSummary`
- `visibility` / `playerVisibility`
- `confidence`
- `sourcePointerIds`
- `sourcePointers`
- `review.status`
- `review.classification`
- `reborngGate`

## Forbidden Content

不要输出：

- 原著正文 quote。
- `originalText`。
- `excerpt`。
- `verbatim`。
- 近似长段复述。
- hidden fact body。
- 方源隐藏因果、春秋蝉、重生/回溯信息。
- 内心独白式确定性推断。
- 未公开正史因果。
- 正式奖励、任务、地点、阵营、NPC 生死结论。

## Acceptance Criteria

RebornG intake review 需要能确认：

- 所有项 quote-redacted。
- 每项有 source pointer。
- `promptSafeSummary` 不含 hidden body。
- 事件摘要只用于公开行动和可见后果，不用于改写正史。
- 所有项 `runtimeAuthority=candidate_only` 或等价候选口径。

## Suggested Output Name

`qingmao_public_event_chronicle_pack_export_ready.json`

配套建议：

- `qingmao_public_event_chronicle_pack_export_ready_report.json`
- `2026-05-16-qingmao-public-event-chronicle-pack.md`

## Handoff Message For MiroFish

请产出 RebornG `v0.13.0-b2 事件编年史与公开行动摘要` 所需的 quote-redacted 青茅公开事件编年史候选包。这个包只作为候选材料，不是 RebornG canon，也不是运行时权力来源。重点补充青茅阶段公开事件、玩家公开行为如何被不同主体记录、prompt-safe public summary、source pointers 和 review 状态。不要包含原文 quote、originalText、excerpt、verbatim 或隐藏事实正文；不要输出未公开正史因果、NPC 生死、奖励、任务、地点、阵营变化或正史改写结论。
