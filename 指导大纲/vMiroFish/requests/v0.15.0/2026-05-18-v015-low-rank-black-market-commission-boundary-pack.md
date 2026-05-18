# MiroFish Request: v015_low_rank_black_market_commission_boundary_pack

requestId: `mirofish-request-2026-05-18-v015-low-rank-black-market-commission-boundary-pack`
targetPhase: `v0.15.0 后段或 v0.16+ 黑市、委托、灰色交易边界`
blockingLevel: `optional/later`
suggestedOutputName: `v015_low_rank_black_market_commission_boundary_pack_export_ready.json`

## Purpose

为 RebornG 后续评估低阶黑市、灰色交易、委托、欺诈、风险交易、势力注意力提供候选材料。

本包不阻塞 v0.15 a1/a2；它用于 v0.15 后段或 v0.16+，避免经济系统未来一打开黑市/委托就变成刷钱、刷蛊、刷任务奖励。

本包只作为候选材料，不是 canon 真相源，不是运行时权力来源。

## Scope

请优先抽取或归纳与下列内容相关的 quote-redacted 候选项：

- 低阶蛊师可能接触的灰色交易、黑市、私下委托、情报交易、风险交易。
- 黑市/委托的公开风险：诈骗、压价、设局、暴露身份、被势力盯上、被盘问。
- 低阶蛊材、食料、残方、情报在灰色渠道中的边界。
- 什么交易必须被降级为传闻/候选，不可直接成为 RebornG 正式奖励。
- 委托如何产生风险、公开理由、后续压力，而不是直接给任务奖励。
- 青茅山、南疆低阶商队、散修、坊市、家族势力可能形成的灰色交易压力。

## Suggested Item Types

- `black_market_hint`
- `commission_candidate`
- `gray_trade_risk`
- `fraud_or_trap_risk`
- `faction_attention_trigger`
- `rumor_only_trade`
- `forbidden_reward_boundary`
- `anti_farm_rule`
- `hidden_fact_ref`

## Required Fields

每项至少包含：

- `id`：稳定 ASCII id。
- `category`。
- `summary`：RebornG 可读摘要，不含原文。
- `playerVisibility`：`public` / `limited_public` / `hidden_ref_only` / `review_required`。
- `confidence`。
- `sourcePointers`。
- `reviewStatus`。
- `reborngGate`：
  - `runtimeAuthority: "candidate_only"`。
  - `allowedUse`: `candidate_pool`、`rule_draft`、`test_sample`、`deferred` 之一或多个。
- 如果是委托：
  - `commissionType`。
  - `publicEntryConditionCandidate`。
  - `riskCandidate`。
  - `rewardBoundary`: 必须说明 no_direct_reward 或 engine_owned_reward。
- 如果是黑市/灰色交易：
  - `tradeRole`。
  - `visibilityRisk`。
  - `antiExploitNote`。
  - `mustRemainRumorOrCandidate`。
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
- 正式任务解锁。
- 正式任务奖励。
- 正式材料、蛊虫、蛊方、元石发放。
- 正式黑市商店。
- 可刷交易循环。
- 阵营身份变化。
- NPC 生死、抓捕、追杀成败结论。
- 仙材、仙蛊、宝黄天交易、蛊仙级经济作为低阶可用资源。
- DeepSeek 或 MiroFish 的 runtime authority。
- 隐藏事实正文出现在 player-visible 字段。

## Acceptance Criteria

- 主包 quote-like keys = 0。
- 每项都有 source pointers。
- 每项都有 review status。
- 每项都有 `reborngGate.runtimeAuthority = candidate_only`。
- hidden facts 全部 `hidden_ref_only`，且 `runtimeVisible=false`、`deepSeekVisible=false`。
- 至少覆盖：
  - 黑市/灰色交易风险。
  - 委托候选。
  - 欺诈或设局风险。
  - 势力注意力触发。
  - 禁止直接奖励边界。
  - 至少 5 条 anti-farm / no-direct-reward 规则候选。

## Handoff Message For MiroFish

请产出 `v015_low_rank_black_market_commission_boundary_pack_export_ready.json`，用于 RebornG v0.15 后段或 v0.16+ 黑市、委托、灰色交易边界评估。

它只做 quote-redacted 候选材料，不是 canon，不是运行时权力来源，不阻塞 v0.15 a1/a2。

请不要输出原文 quote、正式黑市商店、正式任务奖励、材料/蛊虫/蛊方/元石奖励、阵营变化、NPC 生死或隐藏事实正文。

所有奖励必须写成 candidate/engine-owned/no-direct-reward 边界。

