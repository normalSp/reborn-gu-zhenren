# v0.13.0 MiroFish 三包 intake review 汇总

日期：2026-05-16
范围：`qingmao_npc_memory_motive_pack`、`qingmao_faction_reputation_pressure_pack`、`qingmao_public_event_chronicle_pack`
结论：三包均合格，可进入 v0.13 设计与候选规则池。

## 总结论

三包均通过基础 intake：

- JSON 可解析。
- `summary.quoteLikeKeys = 0`。
- 未发现原文正文类字段；`summary.quoteLikeKeys` 是自检统计字段。
- 所有 item 均为 `export_ready`。
- 所有 item 均标记 `runtimeAuthority = candidate_only`。
- 所有 item 均标记 `runtimeVisible = false`。
- 所有 item 均标记 `deepSeekVisible = false`。
- 所有 item 均要求 `requiresHumanCanonReview = true`。

三包可用于：

- `candidate_pool`
- `rule_draft`
- `test_sample`

三包不可用于：

- runtime truth。
- DeepSeek authority。
- 玩家可见隐藏事实。
- 正式声望、通缉、招揽、任务、奖励、地点、阵营或 NPC 生死结论。

## 包级结论

| 包 | items | sourcePointers | 结论 | 可服务阶段 |
|---|---:|---:|---|---|
| `qingmao_npc_memory_motive_pack` | 1564 | 1195 | `accepted_for_candidate_pool` | a1/a2 |
| `qingmao_faction_reputation_pressure_pack` | 885 | 1019 | `accepted_for_candidate_pool` | a1/b1 |
| `qingmao_public_event_chronicle_pack` | 1153 | 1139 | `accepted_for_candidate_pool` | a1/b2 |

## 对 v0.13 的影响

正面影响：

- v0.13-a1 可直接建立社会记忆协议、字段表和测试矩阵。
- v0.13-a2/b1/b2 的 runtime 草案已有足够候选样本。
- 不需要立即请求更多 MiroFish 包。

限制：

- 包体很大，不能全量进入 runtime。
- 必须建立 RebornG 自有 subject allowlist、visibility gate、timeline gate 和 player-action gate。
- 当前玩家是否知道、是否经历、是否可见，必须由 RebornG 本地状态判断。

## 是否需要补充 MiroFish 包

当前不阻塞 v0.13-a1。

暂不需要追加新包。后续只有在以下情况再请求补充：

- 准备做命名 NPC runtime 规则时，请求 `qingmao_named_npc_allowlist_pack` 或由 RebornG 本地生成 subject allowlist。
- 准备做正式通缉/招揽/任务网络时，请求更窄的 `faction_escalation_precondition_pack`。
- 准备做 b2 prompt-safe summary 时，如发现 public event 包过宽，再请求 `qingmao_player_visible_event_subset_pack`。

## 下一步

进入 `v0.13.0-a1 社会记忆协议、字段表、测试矩阵`。

a1 必须明确：

- 哪些 MiroFish 字段可作为候选输入。
- 哪些字段需要 RebornG 重写为本地 rule draft。
- 哪些字段只能成为测试样本。
- 哪些内容必须等用户决策。
- DeepSeek 只能消费本地过滤后的公开摘要，不消费 MiroFish 原始包。
