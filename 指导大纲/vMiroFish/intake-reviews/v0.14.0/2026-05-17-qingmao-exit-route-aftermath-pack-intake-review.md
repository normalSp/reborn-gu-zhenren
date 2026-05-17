# qingmao_exit_route_aftermath_pack intake review

日期：2026-05-17
包名：`qingmao_exit_route_aftermath_pack_export_ready.json`
位置：`指导大纲/vMiroFish/intake-reviews/v0.14.0/qingmao_exit_route_aftermath_pack_export_ready.json`
目标阶段：`v0.14.0 青茅后续路线承接 / exit-route aftermath`
结论：`accepted_for_candidate_pool_with_quarantine`

## 结构检查

| 项目 | 结果 |
|---|---|
| JSON 可解析 | 通过 |
| items | 400 |
| sourcePointers | 638 |
| skipped | 19 |
| review.status | {'export_ready': 400} |
| summary.quoteLikeKeys | 0 |
| forbidden key | 0（`summary.quoteLikeKeys` 为统计字段，不是原文正文） |
| high-rank / hidden leak terms | `永生` x4，集中于 1 个 item，已隔离 |
| bad reborngGate | 0 |
| bad hidden_ref gate | 0 |
| completionGate | complete_candidate |

## 分类覆盖

cover_action_candidate: 24；faction_pressure: 116；hidden_ref: 63；message_action_candidate: 9；pursuit_pressure: 87；route_aftereffect: 67；supply_gap: 34

## request 覆盖

route_aftereffect: 372；pursuit_pressure: 172；cover_action_candidate: 25；message_action_candidate: 13；supply_gap: 54；faction_pressure: 182；hidden_ref: 71

## 可吸收方式

允许进入：`candidate_pool / rule_draft / test_sample`。

不可直接进入：runtime truth、DeepSeek authority、玩家可见隐藏事实、正式地点/阵营/奖励/NPC 生死结论。

## 使用边界

- 覆盖青茅离开后的公开后果、追击/封锁压力、遮掩/递话/补给前置和三寨残余压力。
- hidden_ref 只保留索引和来源指针，隐藏正文已扣留。
- 不得直接生成正式通缉、地点、阵营、奖励或 NPC 生死结论。

## Codex 复核补充

2026-05-17 机械复核结论：

- JSON 可解析，400 个 item 均为 `export_ready`。
- `reborngGate.runtimeAuthority` 全部为 `candidate_only`。
- `runtimeVisible = false`、`deepSeekVisible = false`、`requiresHumanCanonReview = true` 全部成立。
- 未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText` 等正文承载字段；`summary.quoteLikeKeys` 只是包级统计字段。
- 发现 1 个必须隔离的边界项：`v014exit_30146f740a69`。

隔离项口径：

| itemId | 问题 | 处理 |
|---|---|---|
| `v014exit_30146f740a69` | 内容涉及方源内心动机与“永生”追求，且 `knownObservers = []`，不适合作为玩家可见追击压力或路线后果材料 | 进入 `deferred/test_boundary_sample`，不得进入 v0.14 route rule draft、UI、DeepSeek 可见上下文或公开追击压力规则 |

因此本包可用范围调整为：

- 399 条可进入 v0.14 candidate/rule/test 初筛。
- 1 条隔离项只用于隐藏边界测试或未来高阶动机样本池。

## 结论

该包通过 MiroFish intake 基础检查，但带 1 条隔离项。可作为 v0.14 候选材料进入 RebornG 本地 review，再由 RebornG 自有规则/测试重写为 rule draft 或 test sample；隔离项必须保持 deferred，不得被吸收入玩家可见路线规则。
