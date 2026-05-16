# MiroFish Request: Qingmao Faction Reputation / Pressure Pack

requestId: `mirofish-request-2026-05-16-qingmao-faction-reputation-pressure-pack`
targetPhase: `v0.13.0-b1 势力态度 / 压力投影第一刀`
blockingLevel: `preferred`；如果 RebornG 要写正式势力态度 rule draft，则升级为 `blocking`。
requestedBy: RebornG expert council
handoffThread: `019e207b-c55d-7e23-b450-efa7a054a165`

## Purpose

为 RebornG v0.13 的势力态度 / 压力投影系统提供 quote-redacted 候选材料。

目标不是让 MiroFish 产出正式声望系统，而是抽取青茅低阶阶段各势力对玩家公开行为的压力、机会、封锁、招揽、通缉、任务来源候选。

## Scope

优先覆盖：

- 古月山寨：族学、内务、家老、小组、资源分配、任务纪律。
- 白家寨：接触窗口、试探、资源/身份风险、白凝冰相关公开压力边界。
- 熊家寨：三寨竞争、警惕、武力/资源压力。
- 商队/贾家：交易、补给、传闻、外部见证、递话窗口。
- 青茅公共压力：缺席、绕路、公开打探、购买补给、接触外寨、逃离准备、异常战斗表现。

## Required Fields

每项候选至少包含：

- `id`
- `category`: `factionPressure` / `factionStanceCandidate` / `blockadeCandidate` / `recruitmentCandidate` / `wantedPressureCandidate` / `taskSourceCandidate`
- `summary`
- `subjectType`: `faction` / `clan_school` / `internal_affairs` / `merchant` / `task_group` / `other`
- `subjectId`
- `pressureAxis`: 如 `suspicion`、`opportunity`、`resource_control`、`task_authority`、`recruitment_probe`、`blockade_risk`、`wanted_pressure`、`rumor_spread`
- `publicTrigger`
- `candidateEffect`
- `playerVisibleRisk`
- `recommendedDowngrade`: 如 `pressure_only`、`opportunity_only`、`requires_precondition`、`blocked_until_user_decision`
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
- 正式声望数值。
- 正式通缉生效。
- 正式招揽成功。
- 正式阵营身份变化。
- 任务奖励。
- 地点解锁。
- NPC 生死/抓捕/追杀结论。
- 正史锚点改变。

## Acceptance Criteria

RebornG intake review 需要能确认：

- 所有项 quote-redacted。
- 每项有非空 summary。
- 每项有 source pointer。
- 所有项均为 candidate-only。
- candidateEffect 不包含正式声望/通缉/任务/阵营结论。
- 可区分压力、机会、阻断、前置条件和需要用户决策的事项。

## Suggested Output Name

`qingmao_faction_reputation_pressure_pack_export_ready.json`

配套建议：

- `qingmao_faction_reputation_pressure_pack_export_ready_report.json`
- `2026-05-16-qingmao-faction-reputation-pressure-pack.md`

## Handoff Message For MiroFish

请产出 RebornG `v0.13.0-b1 势力态度 / 压力投影第一刀` 所需的 quote-redacted 青茅势力声望/压力候选包。这个包只作为候选材料，不是 RebornG canon，也不是运行时权力来源。重点补充古月、白家、熊家、商队、族学、内务等对玩家公开行为的压力、机会、封锁、招揽、通缉、任务来源候选和 source pointers。不要包含原文 quote、originalText、excerpt、verbatim 或隐藏事实正文；不要输出正式声望数值、通缉生效、招揽成功、阵营变化、任务奖励、地点解锁、NPC 生死或正史改写结论。
