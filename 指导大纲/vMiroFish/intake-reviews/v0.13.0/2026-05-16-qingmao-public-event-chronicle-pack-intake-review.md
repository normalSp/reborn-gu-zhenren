# qingmao_public_event_chronicle_pack intake review

日期：2026-05-16
包名：`qingmao_public_event_chronicle_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/v0.13.0/qingmao_public_event_chronicle_pack_export_ready.json`
目标阶段：`v0.13.0-b2 事件编年史与公开行动摘要`
结论：`accepted_for_candidate_pool`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| items | 1153 |
| sourcePointers | 1139 |
| skipped | 211 |
| review.status | 1153 条均为 `export_ready` |
| summary.quoteLikeKeys | 0 |
| forbidden key | 未发现原文正文类字段；`summary.quoteLikeKeys` 是自检统计字段 |
| reborngGate.runtimeAuthority | 1153 条均为 `candidate_only` |
| reborngGate.runtimeVisible | 1153 条均为 `false` |
| reborngGate.deepSeekVisible | 1153 条均为 `false` |
| reborngGate.requiresHumanCanonReview | 1153 条均为 `true` |

## 覆盖范围

可用方向：

- `eventChronicleAnchor`
- `publicEventCandidate`
- `publicActionSummaryCandidate`
- `eventVisibilityRule`

事件范围：

- clan_school
- village
- merchant
- three_clans
- route
- task_group
- other

## 可吸收方式

允许进入：

- `candidate_pool`
- `rule_draft`
- `test_sample`

适合 v0.13 使用方式：

- b2 public event chronicle read helper 的候选事件类型。
- action summary builder 的 prompt-safe summary 样本。
- whoCanKnow / whoLikelyRecords 的可见性规则样本。
- DeepSeek prompt-safe public summary 的边界测试。

## 禁止方式

不得直接进入：

- 正史锚点权威。
- 玩家已知事实权威。
- DeepSeek 可见隐藏事实。
- 未公开正史因果。
- NPC 内心独白式确定性推断。
- 玩家行动后果的正式结论。

## 风险与处理

风险：

- `promptSafeSummary` 是候选摘要，不等于当前玩家世界可见摘要。
- 包内事件覆盖较广，可能包含当前玩家尚未经历、无法知道或不应公开的原著事件。
- 部分事件适合做 source evidence，但不适合直接出现在 UI 或 DeepSeek prompt。

处理：

- b2 前必须先由 RebornG 本地 `knownFacts/actionConsequences/localActionLedger` 决定哪些摘要可见。
- `whoCanKnow` 与 `whoLikelyRecords` 可作为可见性规则草案，但不能替代本地隐藏事实闸门。
- DeepSeek 只能收到本地过滤后的 public summary。

## 结论

该包合格，可作为 v0.13 事件编年史与公开行动摘要候选材料。

吸收等级：`accepted_for_candidate_pool`，可提升为 `rule_draft` 与 `test_sample`，但不得直接写入运行时权威。
