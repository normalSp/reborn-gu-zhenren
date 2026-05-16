# qingmao_faction_reputation_pressure_pack intake review

日期：2026-05-16
包名：`qingmao_faction_reputation_pressure_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/v0.13.0/qingmao_faction_reputation_pressure_pack_export_ready.json`
目标阶段：`v0.13.0-b1 势力态度 / 压力投影第一刀`
结论：`accepted_for_candidate_pool`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| items | 885 |
| sourcePointers | 1019 |
| skipped | 218 |
| review.status | 885 条均为 `export_ready` |
| summary.quoteLikeKeys | 0 |
| forbidden key | 未发现原文正文类字段；`summary.quoteLikeKeys` 是自检统计字段 |
| reborngGate.runtimeAuthority | 885 条均为 `candidate_only` |
| reborngGate.runtimeVisible | 885 条均为 `false` |
| reborngGate.deepSeekVisible | 885 条均为 `false` |
| reborngGate.requiresHumanCanonReview | 885 条均为 `true` |

## 覆盖范围

可用方向：

- `factionPressure`
- `taskSourceCandidate`
- `blockadeCandidate`
- `recruitmentCandidate`
- `factionStanceCandidate`

压力轴：

- suspicion
- task_authority
- resource_control
- blockade_risk
- recruitment_probe
- opportunity
- rumor_spread

推荐降级策略覆盖：

- pressure_only
- requires_precondition
- blocked_until_user_decision
- opportunity_only

## 可吸收方式

允许进入：

- `candidate_pool`
- `rule_draft`
- `test_sample`

适合 v0.13 使用方式：

- b1 势力压力投影规则草案。
- 势力机会、封锁、招揽、任务来源候选的测试样本。
- 明确“压力/机会/候选”与“正式声望/正式通缉/正式任务”的边界。

## 禁止方式

不得直接进入：

- 正式声望数值。
- 正式通缉、追杀、抓捕。
- 正式招揽成功。
- 阵营身份变化。
- 正式任务、奖励或地点开放。
- DeepSeek visible context 的 hidden body 或权威结论。

## 风险与处理

风险：

- `taskSourceCandidate` 数量较多，容易被误用为正式任务网络。
- `blockadeCandidate` 和 `recruitmentCandidate` 容易被误读为已生效通缉/封锁/招揽。
- 包含跨阶段、外部接触和后期事件候选，必须根据当前玩家时间线和公开事实过滤。

处理：

- v0.13-b1 只做 stance / pressure projection，不做正式声望条。
- `blocked_until_user_decision` 必须作为硬门禁，不得自动进入 runtime result。
- 若要开放正式通缉、招揽、任务来源或阵营变化，必须另行停下来让用户决策。

## 结论

该包合格，可作为 v0.13 势力态度 / 压力候选材料。

吸收等级：`accepted_for_candidate_pool`，可提升为 `rule_draft` 与 `test_sample`，但不得直接写入运行时权威。
