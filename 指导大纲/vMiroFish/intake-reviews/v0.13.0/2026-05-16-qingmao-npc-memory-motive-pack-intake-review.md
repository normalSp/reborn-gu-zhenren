# qingmao_npc_memory_motive_pack intake review

日期：2026-05-16
包名：`qingmao_npc_memory_motive_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/v0.13.0/qingmao_npc_memory_motive_pack_export_ready.json`
目标阶段：`v0.13.0-a2 NPC 记忆投影引擎第一刀`
结论：`accepted_for_candidate_pool`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| items | 1564 |
| sourcePointers | 1195 |
| skipped | 213 |
| review.status | 1564 条均为 `export_ready` |
| summary.quoteLikeKeys | 0 |
| forbidden key | 未发现原文正文类字段；`summary.quoteLikeKeys` 是自检统计字段 |
| reborngGate.runtimeAuthority | 1564 条均为 `candidate_only` |
| reborngGate.runtimeVisible | 1564 条均为 `false` |
| reborngGate.deepSeekVisible | 1564 条均为 `false` |
| reborngGate.requiresHumanCanonReview | 1564 条均为 `true` |

## 覆盖范围

可用方向：

- `npcInterestTrigger`
- `npcMemoryCandidate`
- `npcMotiveCandidate`
- `npcSuspicionTrigger`

覆盖轴：

- benefit
- task_discipline
- resource_interest
- risk_avoidance
- suspicion
- relationship_probe
- authority

主体类型覆盖较广，包括 elder、npc、npc_group、clan_school、merchant、task_group。

## 可吸收方式

允许进入：

- `candidate_pool`
- `rule_draft`
- `test_sample`

适合 v0.13 使用方式：

- a1 字段表和测试矩阵的参考样本。
- a2 NPC 记忆投影规则草案。
- 不同主体对同一公开行为的记忆差异样本。
- 公开行为触发怀疑、利益、纪律、资源关注的分类样本。

## 禁止方式

不得直接进入：

- runtime truth。
- DeepSeek visible context。
- 玩家可见隐藏事实。
- NPC 生死结论。
- 正式关系数值。
- 正式任务、奖励、地点、阵营变化。

## 风险与处理

风险：

- 包覆盖范围很宽，包含大量从原著公开事件抽取的候选项，不等于当前玩家世界已经发生。
- 部分候选涉及方源、方正、后期事件、外部接触或非玩家可见轨迹，进入 runtime 前必须先经过 RebornG 本地时间线、可见性和玩家行动条件过滤。
- `subjectDisplayName` 可用于人审和规则草案，但不能直接作为稳定 NPC runtime id。

处理：

- v0.13-a1 可直接参考字段和测试样本。
- v0.13-a2 若只做 read-only projection，可用作规则草案来源。
- 若要做命名 NPC runtime 规则，必须先建立 RebornG 自有 subject allowlist 和 public-visibility gate。

## 结论

该包合格，可作为 v0.13 NPC 记忆/动机候选材料。

吸收等级：`accepted_for_candidate_pool`，可提升为 `rule_draft` 与 `test_sample`，但不得直接写入运行时权威。
