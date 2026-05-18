# MiroFish Request: v015_southern_border_market_caravan_trade_pack

requestId: `mirofish-request-2026-05-18-v015-southern-border-market-caravan-trade-pack`
targetPhase: `v0.15.0-b1/b2 补给准备、商队递话、坊市/商队交易窗口`
blockingLevel: `preferred`
suggestedOutputName: `v015_southern_border_market_caravan_trade_pack_export_ready.json`

## Purpose

为 RebornG `v0.15.0` 提供南疆低阶蛊师可接触的商队、坊市、交易窗口、补给准备、递话/担保/路费/压价/风险候选材料。

本包用于把 v0.14 的“加入商队/进入商家城/逃离青茅山”前置展示，推进为 v0.15 的正式低风险行动样板：补给准备和商队递话。

本包只作为候选材料，不是 canon 真相源，不是运行时权力来源。

## Scope

请优先抽取或归纳与下列内容相关的 quote-redacted 候选项：

- 南疆低阶商队的公开接触方式：递话、跑腿、担保、路引、随行机会、交易窗口。
- 坊市或临时交易点：低阶蛊师能接触的公开交易场景、限制和风险。
- 商队对低阶蛊师的判断：身份、资源、信誉、公开理由、携带物、风险。
- 青茅山出逃/离山者如何准备补给、元石、食物、蛊虫食料、遮掩理由、随行借口。
- 商队/坊市的压价、诈骗、盘问、暴露、被盯上等风险。
- 与白家、熊家、古月、散修、外来商人相关的公开交易/接触压力。
- 可以进入 RebornG 行动样板的“公开小步”：递话、询价、换取补给、找担保、打探路线、交小代价。

## Suggested Item Types

- `caravan_contact_window`
- `market_window`
- `trade_requirement`
- `public_reason_requirement`
- `social_cover_requirement`
- `supply_preparation`
- `risk_factor`
- `price_pressure_hint`
- `caravan_followup_candidate`
- `faction_attention_trigger`
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
- 如果是商队接触：
  - `contactType`：message / trade / escort_probe / public_reason / guarantee / supply。
  - `entryConditionCandidate`。
  - `blockedOutcome`：例如 no_formal_join、no_city_entry、no_reward。
  - `riskCandidate`。
- 如果是交易窗口：
  - `tradeRole`：supply / material / food / medicine / rumor / service。
  - `costTierHint`：relative only，不要正式价格。
  - `antiExploitNote`。
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
- 正式商队加入成功。
- 正式商家城进入成功。
- 正式任务、任务奖励、材料奖励、蛊虫奖励、元石奖励。
- 阵营身份变化。
- NPC 生死、抓捕、追杀成败结论。
- 正式运行时价格。
- 高阶商家城完整系统。
- DeepSeek 或 MiroFish 的 runtime authority。
- 隐藏事实正文出现在 player-visible 字段。

## Acceptance Criteria

- 主包 quote-like keys = 0。
- 每项都有 source pointers。
- 每项都有 review status。
- 每项都有 `reborngGate.runtimeAuthority = candidate_only`。
- hidden facts 全部 `hidden_ref_only`，且 `runtimeVisible=false`、`deepSeekVisible=false`。
- 至少覆盖：
  - 商队递话。
  - 补给准备。
  - 坊市/临时交易窗口。
  - 公开理由/担保。
  - 商队压价或盘问风险。
  - 至少 3 个 faction/group attention trigger。

## Handoff Message For MiroFish

请产出 `v015_southern_border_market_caravan_trade_pack_export_ready.json`，用于 RebornG v0.15 的补给准备、商队递话、坊市/商队交易窗口评估。

它只做 quote-redacted 候选材料，不是 canon，不是运行时权力来源。

请不要输出原文 quote、正式商队加入、商家城进入、正式任务奖励、阵营变化、NPC 生死、追捕结果或隐藏事实正文。

价格只给相对成本/压力，不给 RebornG 运行时正式价格。

