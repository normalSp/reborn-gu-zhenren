# MiroFish Request: Qingmao Faction Pressure Pack

requestId: `mirofish-request-2026-05-16-qingmao-faction-pressure-pack`
targetPhase: `v0.12.0-b2 NPC / faction reaction bridge 第一刀`
blockingLevel: `preferred`，如果 b2 要写正式 reaction rule，则升级为 `blocking`。
requestedBy: RebornG expert council
handoffThread: `019e207b-c55d-7e23-b450-efa7a054a165`

## Purpose

为 RebornG `v0.12.0-b2` 提供青茅山低阶 NPC / faction reaction bridge 的候选材料。

目标不是让 MiroFish 决定运行时结论，而是抽取 quote-redacted 候选压力：

- 哪些公开行为会让势力或 NPC 注意玩家。
- 哪些压力来自族学、小组任务、三寨、商队、家老/内务堂、资源分配、住处/缺席/任务流程。
- 哪些反应适合作为轻量 bridge：警惕、观望、试探、盘问、阻拦、交易窗口、谣言扩散。

## Scope

优先覆盖青茅山低阶阶段，尤其是：

- 古月山寨 / 族学 / 内务堂 / 小组任务。
- 白家寨与熊家寨的公开压力。
- 商队、客栈、青竹酒/补给窗口相关压力。
- 小组成员或低阶队伍的任务权威、资源分配、信任危机。
- 玩家异常缺席、闭关、拒绝任务、绕路、购买补给、公开打探等会触发的可见反应。

可以复核并扩展第一次 b1 包中延期的 factionPressure 条目：

- `pressure_ch0060_jiafu_caravan_revenge`
- `pressure_ch0089_jiaosan_group_resource_distribution`
- `pressure_ch0090_jiaosan_group_resource_request`
- `pressure_ch0092_jiaosan_group_task_authority`
- `pressure_ch0096_sick_snake_group_trust_crisis`

但本次希望补齐 b1 包里缺失的可审 summary / trigger / likely reaction。

## Required Fields

每项候选至少包含：

- `id`
- `category`: `factionPressure` 或 `npcReactionCandidate`
- `summary`: 本地可审摘要，不能空。
- `subjectType`: `faction` / `npc_group` / `merchant` / `clan_school` / `internal_affairs` / `task_group` / `other`
- `subjectId`
- `pressureAxis`: 如 `suspicion`、`opportunity`、`task_authority`、`resource_control`、`record_trace`、`trust_crisis`、`rumor_spread`
- `publicTrigger`: 玩家可见触发条件。
- `likelyReactions`: 轻量反应列表，只能是候选。
- `playerVisibleRisk`: 玩家可见风险说明。
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
- 直接 runtime 权限。
- 阵营身份变化结论。
- 声望数值变化结论。
- NPC 生死。
- 追击成功/失败结论。
- 奖励、元石、蛊虫、蛊方、材料发放。
- 正史锚点改变。

## Acceptance Criteria

RebornG intake review 需要能确认：

- 所有项 quote-redacted。
- 每项有非空 summary。
- 每项有 source pointer。
- 所有 hidden 或可能隐藏项都是 `hiddenRefOnly`，且 `runtimeVisible=false`、`deepSeekVisible=false`。
- 所有项 `runtimeAuthority=candidate_only` 或等价候选口径。
- likelyReactions 不包含正式结局，只是反应候选。
- 可区分公开触发、候选反应和禁止写入。

## Suggested Output Name

`qingmao_faction_pressure_pack_export_ready.json`

配套建议：

- `qingmao_faction_pressure_pack_export_ready_report.json`
- `2026-05-16-qingmao-faction-pressure-pack.md`

## Handoff Message For MiroFish

请产出 RebornG `v0.12.0-b2 NPC / faction reaction bridge` 所需的 quote-redacted 青茅山势力/NPC 压力包。这个包只作为候选材料，不是 RebornG canon，也不是运行时权力来源。重点补充青茅低阶阶段的公开触发、势力/小组/NPC 反应候选、source pointers 和 review 状态。不要包含原文 quote、originalText、excerpt、verbatim 或隐藏事实正文；不要输出阵营变化、声望数值、NPC 生死、奖励或正史改写结论。
