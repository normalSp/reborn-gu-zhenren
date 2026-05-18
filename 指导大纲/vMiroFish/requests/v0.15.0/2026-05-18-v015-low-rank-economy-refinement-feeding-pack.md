# MiroFish Request: v015_low_rank_economy_refinement_feeding_pack

requestId: `mirofish-request-2026-05-18-v015-low-rank-economy-refinement-feeding-pack`
targetPhase: `v0.15.0-a1/a2 低阶蛊师经济、炼蛊、喂养设计门禁与 canon/schema 第一刀`
blockingLevel: `blocking`
suggestedOutputName: `v015_low_rank_economy_refinement_feeding_pack_export_ready.json`

## Purpose

为 RebornG `v0.15.0` 提供低阶蛊师阶段的经济、蛊材、食料、残方、炼蛊失败代价、喂养压力候选材料。

本包用于帮助 RebornG 建立“低阶蛊师怎么活、怎么养蛊、怎么炼蛊、怎么承担失败”的本地规则草案。

本包只作为候选材料，不是 canon 真相源，不是运行时权力来源。

## Scope

请优先抽取或归纳与下列内容相关的 quote-redacted 候选项：

- 一转至三转低阶蛊师可接触的普通蛊材、食料、药物、酒、草木、矿石、兽材等资源类型。
- 蛊虫喂养压力：食料来源、短缺、替代、拖欠喂养的风险。
- 炼蛊相关：残方、蛊方线索、失败代价、材料损耗、成功门槛、风险表达。
- 青茅山及南疆低阶环境下可能出现的资源来源：山林、巡查、族学、坊市、商队、交易、委托、拾荒、交换。
- 低阶资源的稀缺性和成本档位：只需要相对档位，不要输出 RebornG 运行时正式价格。
- 防止刷资源的世界规则：同场景重复采集、异常囤积、交易暴露、族内怀疑、商队压价、资源季节/地域限制。
- 与月光蛊、酒虫、白玉蛊等青茅早期蛊虫有关的公开喂养/维护/获取边界。
- 低阶蛊师为了逃离青茅山或接触商队需要准备的补给、遮掩、元石压力、食物和蛊材压力。

## Suggested Item Types

- `low_rank_material_candidate`
- `feeding_requirement`
- `refinement_fragment`
- `refinement_failure_cost`
- `resource_source`
- `scarcity_rule`
- `anti_farm_rule`
- `market_cost_hint`
- `supply_requirement`
- `hidden_fact_ref`

## Required Fields

每项至少包含：

- `id`：稳定 ASCII id。
- `category`：使用上方建议 item type 或等价分类。
- `summary`：RebornG 可读摘要，不含原文。
- `playerVisibility`：`public` / `limited_public` / `hidden_ref_only` / `review_required`。
- `confidence`。
- `sourcePointers`。
- `reviewStatus`。
- `reborngGate`：
  - `runtimeAuthority: "candidate_only"`。
  - `allowedUse`: `candidate_pool`、`rule_draft`、`test_sample`、`fact_card_draft`、`deferred` 之一或多个。
- 如果是蛊材/食料：
  - `resourceRole`：feeding/refinement/trade/medicine/supply。
  - `rankBand`：low_rank / rank_1 / rank_2 / rank_3 / unknown_low_rank。
  - `scarcityTier`：common / limited / rare / event_gated / unknown。
  - `notGrantableByAI: true`。
- 如果是炼蛊：
  - `recipeStatus`：fragment / rumor / complete_recipe_ref_only / review_required。
  - `failureCostCandidate`。
  - `mustRemainEngineOwned: true`。
- 如果是 hidden fact：
  - `hiddenRefOnly: true`。
  - `runtimeVisible: false`。
  - `deepSeekVisible: false`。
  - `requiresHumanCanonReview: true`。

## Forbidden Content

不得包含：

- 原著正文 quote。
- `originalText`。
- `excerpt`。
- `verbatim`。
- 长段原文复述。
- 正式运行时价格。
- 直接发放材料、蛊虫、蛊方、元石、奖励。
- 仙材、仙蛊、宝黄天交易、蛊仙级经济作为低阶可用资源。
- 完整高阶传承、永生、十转、命运蛊、春秋蝉等不可开放内容。
- DeepSeek 或 MiroFish 的 runtime authority。
- 隐藏事实正文出现在 player-visible 字段。

## Acceptance Criteria

- 主包 quote-like keys = 0。
- 每项都有 source pointers。
- 每项都有 review status。
- 每项都有 `reborngGate.runtimeAuthority = candidate_only`。
- hidden facts 全部 `hidden_ref_only`，且 `runtimeVisible=false`、`deepSeekVisible=false`。
- 至少覆盖：
  - 低阶蛊材。
  - 低阶食料。
  - 炼蛊失败代价。
  - 残方/蛊方线索边界。
  - 补给压力。
  - 商队/坊市/交换的公开资源窗口。
  - 至少 5 条 anti-farm / scarcity / suspicion 规则候选。

## Handoff Message For MiroFish

请产出 `v015_low_rank_economy_refinement_feeding_pack_export_ready.json`，用于 RebornG v0.15 低阶蛊师经济、炼蛊、喂养设计门禁与 canon/schema 第一刀。

它只做 quote-redacted 候选材料，不是 canon，不是运行时权力来源。

请不要输出原文 quote、正式价格、材料/蛊虫/蛊方/元石奖励发放、仙材仙蛊、高阶传承或隐藏事实正文。

隐藏事实只能 hiddenRefOnly，并且 runtimeVisible/deepSeekVisible 都必须为 false。

