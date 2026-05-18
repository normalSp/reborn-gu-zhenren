# v0.15.0 MiroFish 三包 intake review 汇总

日期：2026-05-18
范围：`v015_low_rank_economy_refinement_feeding_pack`、`v015_southern_border_market_caravan_trade_pack`、`v015_low_rank_black_market_commission_boundary_pack`
结论：三包均为 v0.15.0 request 所需交付包，基础验收通过，可进入 RebornG 候选材料池；其中黑市/委托包只建议作为后段或 v0.16+ 参考，不作为 v0.15 第一刀 runtime 范围。

## 对齐 request

| request | 交付包 | 原优先级 | intake 结论 |
|---|---|---|---|
| 低阶经济/炼蛊/喂养 | `v015_low_rank_economy_refinement_feeding_pack_export_ready.json` | blocking | `accepted_for_v015_a1_a2_candidate_pool` |
| 南疆低阶市场/商队/交易 | `v015_southern_border_market_caravan_trade_pack_export_ready.json` | preferred | `accepted_for_v015_b1_b2_rule_draft` |
| 黑市/委托/灰色交易边界 | `v015_low_rank_black_market_commission_boundary_pack_export_ready.json` | optional/later | `accepted_for_deferred_candidate_pool` |

## 基础检查

三包及 coverage matrix 均通过以下检查：

- JSON 可解析。
- 未发现 `quote`、`originalText`、`excerpt`、`verbatim` 禁入字段。
- 报告口径中 `forbiddenTextKeyCount = 0`。
- 报告口径中 `highRankLeakTermCount = 0`。
- 所有 item 均为 `export_ready`。
- 所有 item 均为 `runtimeAuthority = candidate_only`。
- 所有 item 均为 `runtimeVisible = false`、`deepSeekVisible = false`。
- 所有 item 均为 `requiresHumanCanonReview = true`。
- 顶层 `canonBoundary` 声明 runtime、canon、DeepSeek、reward 均无权威。
- 本次交付来源为 `0001-0600` strict/reviewable base，交付阶段未新增 live LLM 成本。

## 包级结论

| 包 | items | sourcePointers | skipped | completionGate | 结论 |
|---|---:|---:|---:|---|---|
| `low_rank_economy_refinement_feeding` | 13 | 13 | 0 | `conditional_complete_candidate` | 可支撑 v0.15 a1/a2 启动设计与候选规则 |
| `southern_border_market_caravan_trade` | 11 | 10 | 0 | `conditional_complete_candidate` | 可支撑 v0.15 b1/b2 商队/补给/交易窗口候选 |
| `low_rank_black_market_commission_boundary` | 10 | 9 | 0 | `conditional_complete_candidate` | 先入延期候选池，避免过早开放灰色交易 runtime |

## 覆盖与 caveat

低阶经济/炼蛊/喂养包覆盖低阶材料、喂养、炼蛊失败代价、残方、补给、市场窗口、反刷规则。caveat 是 `食料` 精确词面在 0001-0600 中缺失，当前使用喂养、酒虫、青竹酒等相邻信号覆盖。该缺口不阻塞 v0.15 设计门禁，但 runtime 吸收时必须改写为 RebornG-owned 规则，不能输出正式价格或直接发材料。

南疆低阶市场/商队/交易包覆盖商队接触、补给准备、市场窗口、公开理由、担保边界、压价风险、势力关注。caveat 是 `坊市/路引` 精确词面缺失，当前用商队、客栈、店铺、盘问、担保等公开信号覆盖。该包适合做“公开交易窗口/递话/补给准备”，不适合直接开放完整坊市、商家城或正式商队加入。

黑市/委托/灰色交易边界包覆盖委托候选、灰色交易风险、欺诈/陷阱、势力关注、禁发奖励边界、反刷规则。caveat 是 `黑市` 精确词面缺失，当前是灰色交易与委托边界候选。该包价值在测试和边界，不建议作为 v0.15 第一刀正式玩法。

## 允许吸收

三包可被 RebornG 重写进入：

- `candidate_pool`
- `rule_draft`
- `fact_card_draft`
- `test_sample`
- `deferred`

三包不可直接进入：

- runtime truth
- canon authority
- DeepSeek authority
- 玩家可见隐藏事实正文
- 正式奖励、材料、蛊虫、蛊方、元石发放
- 正式任务成功、地点解锁、商队加入、阵营身份变化
- NPC 生死、捕获或正史改写结论

## 建议吸收顺序

1. v0.15 文档启动：使用低阶经济/炼蛊/喂养包作为 a1/a2 设计门禁、字段表、测试矩阵的证据候选。
2. v0.15 b1/b2：使用商队/市场/交易包做补给准备、递话窗口、公开理由、风险提示和 Player Advocate 样本。
3. v0.15 后段或 v0.16+：黑市/委托/灰色交易包先做反刷、诈骗、委托边界测试，不开放正式灰色交易系统。

## 是否需要补包

当前不需要在 v0.15 文档启动前要求 MiroFish 追加补包。若后续用户决定提前开放正式坊市、路引、黑市、委托代售、完整商家城交易或明确商品价格表，需要重新提出更窄 request。

## 建议下一步

建议先提交 v0.15 MiroFish request 与本 intake review，形成回滚点；随后进入 v0.15.0 文档启动，冻结主题为“低阶蛊师经济、补给、炼养用深循环”。正式 runtime 吸收前仍需由 RebornG 本地 canon/schema/engine/test 重写，不直接引用 MiroFish 文本。
