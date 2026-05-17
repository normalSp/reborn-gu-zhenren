# v0.14.0 MiroFish 三包 intake review 汇总

日期：2026-05-17
范围：`qingmao_exit_route_aftermath_pack`、`southern_border_low_rank_route_pack`、`shang_clan_city_public_entry_pack`
结论：三包均合格，可进入 v0.14 设计与候选规则池；其中 `qingmao_exit_route_aftermath_pack` 带 1 条隔离项。

## 总结论

三包均通过基础 intake：

- JSON 可解析。
- `summary.quoteLikeKeys = 0`。
- 未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段；`summary.quoteLikeKeys` 是统计字段。
- 未发现春秋蝉、重生、前世、回溯、蛊仙、仙蛊、仙材、宝黄天、福地等泄漏词。
- `qingmao_exit_route_aftermath_pack` 中发现 1 个方源内心动机/“永生”边界项，已标记为隔离，不进入 v0.14 玩家可见路线规则。
- 所有 item 均为 `export_ready`。
- 所有 item 均为 `runtimeAuthority = candidate_only`。
- 所有 item 均为 `runtimeVisible = false`、`deepSeekVisible = false`。
- 所有 item 均要求 `requiresHumanCanonReview = true`。
- 三包 completionGate 均为 `complete_candidate`。

## 0400 基础包是否足够

结论：足够交付 v0.14.0 三个 request 的 candidate-only 完整版抽取。

依据：0001-0400 strict/reviewable base 覆盖青茅、三寨、商队、百家、铁家、商心慈、商家城、南疆低阶路线、追击/逃离/交易/入口前置等公开层材料；`sourcePointersBad = 0`，章节连续性 400/400。唯一词面薄点是“坊市”没有直接命中，但低阶市场窗口可由商队、客栈、交易、购买、元石等公开材料覆盖，因此不阻塞候选交付。

## 包级结论

| 包 | items | sourcePointers | skipped | completionGate | 结论 |
|---|---:|---:|---:|---|---|
| `qingmao_exit_route_aftermath_pack` | 400 | 638 | 19 | `complete_candidate` | `accepted_for_candidate_pool_with_quarantine` |
| `southern_border_low_rank_route_pack` | 384 | 469 | 18 | `complete_candidate` | `accepted_for_candidate_pool` |
| `shang_clan_city_public_entry_pack` | 350 | 392 | 25 | `complete_candidate` | `accepted_for_candidate_pool` |

## 使用边界

三包可用于：

- `candidate_pool`
- `rule_draft`
- `test_sample`

三包不可用于：

- runtime truth。
- DeepSeek authority。
- 玩家可见隐藏事实正文。
- 正式地点、阵营、奖励、任务、商家城完整系统或 NPC 生死结论。

## Codex 复核补充

2026-05-17 复核以 RebornG 口径重新扫描三包：

- 三个包均可解析。
- 三个包所有 item 均为 `export_ready / candidate_only / runtimeVisible=false / deepSeekVisible=false / requiresHumanCanonReview=true`。
- 包级 `sourcePointers` 统计与 per-item 展开统计不同；本汇总保留 MiroFish 报告口径，RebornG runtime 吸收时只引用重写后的本地 source ref。
- `qingmao_exit_route_aftermath_pack` 隔离项：`v014exit_30146f740a69`。该项只能用于隐藏边界或未来高阶动机测试，不得作为 v0.14 route pressure / UI / DeepSeek 材料。

v0.14 吸收顺序：

1. 先吸收 `qingmao_exit_route_aftermath_pack` 的非隔离公开后果、补给、遮掩和追击候选。
2. 再吸收 `southern_border_low_rank_route_pack` 的低阶路线、商队、补给、社会担保候选。
3. `shang_clan_city_public_entry_pack` 保持 optional/deferred，只做公开入口条件评估，不开放完整商家城。

## 成本

本次 v0.14 request 抽取未调用 live LLM，使用 0001-0400 strict/reviewable base 做确定性编译，新增 DeepSeek 成本为 0 RMB。

## 下一步

RebornG v0.14 可先吸收 `qingmao_exit_route_aftermath_pack` 的非隔离项和 `southern_border_low_rank_route_pack` 到本地候选池；`shang_clan_city_public_entry_pack` 保持 optional / deferred，只用于公开入口条件评估，不开放完整商家城。
