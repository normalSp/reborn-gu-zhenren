# MiroFish request：v1.9 southern_border_low_rank_region_life_v2_prelude_slice

日期：2026-05-22
请求方：RebornG Codex
目标版本：v1.9.0-a2
状态：requested_for_export
topicId：`southern_border_low_rank_region_life_v2_prelude_slice`

## 请求背景

用户已批准 D-190-001 至 D-190-012、D-191-001 至 D-191-012，并确认长期研究线已接受为当前长期架构基线。v1.9 的定位是 v2.0 区域活世界预备与门禁收束；a2 是进入 b1 前的 blocking topic-slice。

本 request 用于跑通：

- RebornG request。
- MiroFish quote-redacted export。
- RebornG intake review。
- RebornG 规则草案与测试矩阵引用。

## 需要的材料

请从全书基础包中导出南疆低阶外缘区域生活与 v2 区域活世界预备相关 source-pointer 切片。优先复用已经在 v1.7/v1.8 验证过的南疆外缘生活、身份路线、短工、商队接触、临时落脚、补给压力和路障规矩 source pointers。

覆盖方向：

- 外缘盘问、临时歇脚、山路休整、城外门槛。
- 临时商队接触、货物/劳力/人情作为接近机会。
- 低阶散修落脚、短工、人情债、失败后仍可继续推进。
- 小集市观察、压价、交易失败、补给压力。
- 护送、路障、规矩、冲突余波候选。
- 传话、公开观察、避祸，不触碰 hidden/private。
- `regionalEventLedger` 候选样本：只能作为未来事件账本设计材料，不得变成 v1.9 runtime 字段。
- `runFingerprint` 候选样本：只能作为未来同开局差异度评估材料，不得变成 v1.9 persistent seed。
- 正式凭证词风险：木牌、令牌、登记、成员身份、报到、负责人点头等词只能作为临时凭据/前置条件风险，不得自动授予正式身份、地点、阵营或通行权。

## 输出要求

- 输出 quote-redacted JSON。
- 每个 item 必须带 source pointer。
- 不输出原文、长摘录、quote、excerpt、verbatim、rawText、sourceText。
- 不输出 hidden/private body。
- 不把任何 item 标记为 runtime canon、DeepSeek visible、player-visible hidden fact 或正式规则。
- item 级 promotion 只能是 `candidate_pool`、`rule_draft`、`test_sample`、`deferred`、`quarantined`、`rejected`。
- 导出报告需要统计 coverage、quote-like key、hidden/private、blocked item。

## 禁止方向

- 不批准完整南疆。
- 不批准完整商家城。
- 不批准正式地点/势力/NPC allowlist。
- 不批准正式奖励、工资、价格、库存、交易结算。
- 不批准正式职业、身份、商队成员、散修组织、护卫组织。
- 不批准 NPC 生死、招揽、通缉、封锁、捕获、背叛结论。
- 不批准方源私密因果、hidden/private 可见化。
- 不批准 DeepSeek RAG、可见全书摘要或新 authority。
- 不批准新增 RebornG runtime、save field、canon、prompt context、BFF/backend 或子代理。

## 预期交付路径

- blueprint：`指导大纲/vMiroFish/requests/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude-blueprint.json`
- export：`指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_export_ready.json`
- report：`指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_report.json`
- handoff：`指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_handoff.md`
- RebornG intake review：`指导大纲/vMiroFish/intake-reviews/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude-intake-review.md`
