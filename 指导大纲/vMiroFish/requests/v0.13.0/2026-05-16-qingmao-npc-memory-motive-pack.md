# MiroFish Request: Qingmao NPC Memory / Motive Pack

requestId: `mirofish-request-2026-05-16-qingmao-npc-memory-motive-pack`
targetPhase: `v0.13.0-a2 NPC 记忆投影引擎第一刀`
blockingLevel: `preferred`；如果 RebornG 要写命名 NPC runtime 规则，则升级为 `blocking`。
requestedBy: RebornG expert council
handoffThread: `019e207b-c55d-7e23-b450-efa7a054a165`

## Purpose

为 RebornG v0.13 的 NPC 记忆投影系统提供 quote-redacted 候选材料。

目标不是让 MiroFish 决定运行时结论，而是抽取青茅低阶阶段 NPC、小组、家老、商队人物在公开语境下可能记住什么、为什么会怀疑或试探玩家、哪些利益会驱动反应。

## Scope

优先覆盖：

- 古月山寨族学、内务、家老、低阶蛊师小组。
- 白家寨、熊家寨与青茅三寨公开互动中的人物/小组反应。
- 商队、贾家、客栈、补给和交易窗口相关人物。
- 玩家公开行为：缺席、绕路、打探、购买补给、递话、救援、偷窃、撒谎、拒绝任务、接触外寨、调查方源、准备逃离。

重点是公开可见反应，不要产出隐藏事实正文。

## Required Fields

每项候选至少包含：

- `id`
- `category`: `npcMemoryCandidate` / `npcMotiveCandidate` / `npcSuspicionTrigger` / `npcInterestTrigger`
- `summary`
- `subjectType`: `npc` / `npc_group` / `elder` / `clan_school` / `merchant` / `task_group` / `other`
- `subjectId`
- `subjectDisplayName`
- `memoryTrigger`
- `motiveAxis`: 如 `suspicion`、`benefit`、`authority`、`resource_interest`、`task_discipline`、`relationship_probe`、`risk_avoidance`
- `likelyMemory`
- `likelyReaction`
- `playerVisibleReason`
- `visibility` / `playerVisibility`
- `confidence`
- `sourcePointerIds`
- `sourcePointers`
- `review.status`
- `review.classification`
- `reborngGate`

`reborngGate` 至少包含：

- `hiddenRefOnly`
- `runtimeVisible`
- `deepSeekVisible`
- `runtimeAuthority`
- `requiresHumanCanonReview`

## Forbidden Content

不要输出：

- 原著正文 quote。
- `originalText`。
- `excerpt`。
- `verbatim`。
- 近似长段复述。
- hidden fact body。
- 方源隐藏因果、春秋蝉、重生/回溯信息。
- NPC 生死结论。
- 抓捕/追杀成功结论。
- 阵营身份变化结论。
- 声望数值结论。
- 正式任务、奖励、地点解锁、蛊虫、蛊方、材料发放。
- 正史锚点改变。

## Acceptance Criteria

RebornG intake review 需要能确认：

- 所有项 quote-redacted。
- 每项有非空 summary。
- 每项有 source pointer。
- 所有 hidden 或可能隐藏项都是 `hiddenRefOnly`，且 `runtimeVisible=false`、`deepSeekVisible=false`。
- 所有项 `runtimeAuthority=candidate_only` 或等价候选口径。
- NPC 记忆和动机是候选，不是确定 runtime 事实。
- 可区分公开触发、记忆候选、反应候选和禁止写入。

## Suggested Output Name

`qingmao_npc_memory_motive_pack_export_ready.json`

配套建议：

- `qingmao_npc_memory_motive_pack_export_ready_report.json`
- `2026-05-16-qingmao-npc-memory-motive-pack.md`

## Handoff Message For MiroFish

请产出 RebornG `v0.13.0-a2 NPC 记忆投影引擎第一刀` 所需的 quote-redacted 青茅 NPC 记忆/动机候选包。这个包只作为候选材料，不是 RebornG canon，也不是运行时权力来源。重点补充青茅低阶阶段 NPC、小组、家老、商队人物对玩家公开行为的记忆触发、怀疑/利益/权威/资源等动机轴、likely reaction、source pointers 和 review 状态。不要包含原文 quote、originalText、excerpt、verbatim 或隐藏事实正文；不要输出 NPC 生死、抓捕成功、阵营变化、声望数值、奖励、任务开放或正史改写结论。
