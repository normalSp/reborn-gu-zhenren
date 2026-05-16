# MiroFish Request: Fang Yuan Public Evidence Pack

requestId: `mirofish-request-2026-05-16-fang-yuan-public-evidence-pack`
targetPhase: `v0.12.0-b3 方源公开旁证询问`
blockingLevel: `blocking`
requestedBy: RebornG expert council
handoffThread: `019e207b-c55d-7e23-b450-efa7a054a165`

## Purpose

为 RebornG `v0.12.0-b3` 提供“第三者玩家可以公开观察或询问到的方源旁证”候选材料。

目标不是揭示方源隐藏因果，也不是让 MiroFish 决定方源线结论，而是抽取 quote-redacted 的公开旁证：

- 普通同龄人、族学、任务小组、家老、商队、村寨居民能看到的方源公开行为。
- 玩家能合理询问、旁证、交叉验证的公开事实。
- 哪些询问会被阻断、引发警惕、得到无证据结论，或只形成关系/势力压力。
- 哪些内容必须作为 hidden fact gate，不能被第三者玩家看到。

## Scope

优先覆盖青茅山低阶阶段，尤其是：

- 族学阶段公开表现。
- 公开交易、资源获取、任务行动、缺席或异常行为。
- 与同窗、族人、商队、内务堂、小组成员相关的公开旁证。
- 玩家跟踪、打听、询问、侧面核对方源时，哪些结果只能是公开失败、无证据、被注意到、关系压力或 NPC 记忆。
- 第三者玩家不应知道的隐藏因果边界。

可以包含：

- `publicFactCandidate`
- `publicEvidenceCandidate`
- `npcObservationCandidate`
- `inquiryReactionCandidate`
- `hiddenBoundaryRef`

## Required Fields

每项候选至少包含：

- `id`
- `category`
- `summary`: 本地可审摘要，不能空。
- `publicTrigger`: 玩家可见触发或询问方式。
- `publiclyObservable`: true/false。
- `playerVisibleResult`: 玩家可见结果建议。
- `hiddenBoundary`: 如果触及隐藏事实，说明边界类型，但不要写隐藏事实正文。
- `likelyReactions`: NPC/势力轻量反应候选。
- `sourcePointerIds`
- `sourcePointers`
- `confidence`
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
- 春秋蝉。
- 重生、回溯、未来记忆。
- 方源内心真实因果或私密计划。
- 玩家不可能从第三者视角知道的事实。
- 直接 runtime 权限。
- NPC 生死、抓捕、正史改变、追踪成功等结论。
- 奖励、元石、蛊虫、蛊方、材料发放。

如果原著中有公开行为与隐藏因果相关，请只输出：

- 公开可见表象。
- 第三者可能形成的误读或怀疑。
- hidden boundary ref。
- 禁止揭示的原因类别。

## Acceptance Criteria

RebornG intake review 需要能确认：

- 所有项 quote-redacted。
- 每项有非空 summary。
- 每项有 source pointer。
- 可明确区分 `publiclyObservable=true` 和 hidden boundary。
- hidden 或可能 hidden 项全部 `hiddenRefOnly=true`，且 `runtimeVisible=false`、`deepSeekVisible=false`。
- 所有项 `runtimeAuthority=candidate_only` 或等价候选口径。
- `playerVisibleResult` 不泄露隐藏事实。
- likelyReactions 只包含轻量反应，不包含最终结论。

## Suggested Output Name

`fang_yuan_public_evidence_pack_export_ready.json`

配套建议：

- `fang_yuan_public_evidence_pack_export_ready_report.json`
- `2026-05-16-fang-yuan-public-evidence-pack.md`

## Handoff Message For MiroFish

请产出 RebornG `v0.12.0-b3 方源公开旁证询问` 所需的 quote-redacted 方源公开旁证包。这个包只作为候选材料，不是 RebornG canon，也不是运行时权力来源。重点抽取第三者玩家在青茅低阶阶段能公开看到、询问或旁证到的方源行为，以及哪些询问必须被 hidden boundary 阻断。不要包含原文 quote、originalText、excerpt、verbatim、春秋蝉、重生/回溯、方源私密因果或隐藏事实正文；不要输出 NPC 生死、追踪成功、正史改变、奖励或运行时结论。
